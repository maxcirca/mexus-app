# Mexus — Architecture

Status: **proposed** (planning session, 2026-11-13). Decisions below are
recorded as lightweight ADRs: context → decision → consequences. Change a
decision by editing its ADR and noting why, not by silently drifting.

## What Mexus is

A single-user personal metrics tracker. Its core is a daily check-in done
**three times a day**, each a separate section with its own fields:

| Section | Name | Prefix |
|---|---|---|
| Morning | Check-in | `mor` |
| Midday | Stand-up | `mid` |
| Evening | Check-out | `eve` |

Later it also surfaces non-daily data (Oura ring first, Health Connect
possibly) and shows simple in-app charts. Heavier dashboards will be a
separate Grafana project reading the same database.

It replaces the Appsmith + Supabase app (`maxcirca/appsmith-mexus`). Old data
is **not** migrated.

## System overview

```
  Notion "Mexus Items"            (source of truth for fields)
          │  scripts/sync-schema  (run by hand / CI, output committed)
          ▼
  packages/schema/schema.json ──────────────┐
          │ bundled at build time            │ validated against
          ▼                                  ▼
  apps/app  (Expo: Android + web) ──HTTPS──► apps/api (Hono, Railway)
                                                 │
  apps/ingest (Oura cron, Railway) ──────────────┤
                                                 ▼
                                        ClickHouse (Railway)
                                                 ▲
                                        Grafana (separate project, later)
```

## ADR-001 — ClickHouse is the only database

**Context.** The data is time series by nature (daily check-ins, Oura sleep/HR
data) and Max wants Grafana on top of it later; Grafana's ClickHouse support is
much better suited to this than Postgres. Volume is tiny (a few hundred
observations/day at most, plus Oura).

**Decision.** ClickHouse holds everything. No Postgres alongside it.

**Consequences.** ClickHouse is poor at updating rows in place, and the old
app's model was exactly that: one row per day, rewritten on every autosave.
So the write model changes (ADR-002). Single-row lookups are still fast at
this volume.

## ADR-002 — Append-only observations, current state derived at read time

**Context.** Autosave writes one field at a time, many times a day. Fields
change often (Notion is edited regularly). In the old app every field addition
meant an `ALTER TABLE`, a new upsert column, query-file sync and widget
wiring, and that hand-syncing caused most of the bugs.

**Decision.** One narrow, append-only table. Each change to a field is one
inserted row; nothing is ever updated or deleted by the app.

```sql
CREATE TABLE observations
(
    entry_date   Date,                       -- device-local day the entry belongs to
    section      LowCardinality(String),     -- 'mor' | 'mid' | 'eve'
    field        LowCardinality(String),     -- Notion key, unprefixed, e.g. 'alarm_time'
    value        String,                     -- JSON-encoded value; 'null' = cleared
    value_num    Nullable(Float64),          -- numeric projection for charts / Grafana
    recorded_at  DateTime64(3, 'UTC'),       -- when the change happened (client clock)
    received_at  DateTime64(3, 'UTC') DEFAULT now64(3),
    tz_offset    Int16,                      -- device UTC offset in minutes at record time
    source       LowCardinality(String)      -- 'app-android' | 'app-web' | 'import' …
)
ENGINE = MergeTree
ORDER BY (section, field, entry_date, recorded_at);
```

Current state of a day = latest value per field:

```sql
SELECT field, argMax(value, recorded_at) AS value
FROM observations
WHERE section = 'mor' AND entry_date = {date:Date}
GROUP BY field;
```

A `daily_values` view (and later per-section "wide" views, one column per
field) give Grafana and charts a convenient shape.

**Consequences.**
- Adding/renaming a Notion field needs **no DDL**: the schema file changes,
  rows start appearing under the new key.
- Full edit history for free ("what did I say my momentum was at 9:00?").
- The `mor_`/`mid_`/`eve_` column-prefix scheme from the old app becomes the
  `section` column; Notion keys are stored unprefixed. Wide views may still
  name columns `mor_alarm` etc. for join-friendliness.
- Values are JSON strings; typing is enforced by the schema in the API, not by
  ClickHouse column types. `value_num` exists so numeric fields chart without
  parsing JSON.
- **Derived values are computed at read time, never stored.** Streak in
  particular: the old app froze a stored streak and got a permanently wrong
  value when another writer created the row first. Here, streak = a
  consecutive-days count over "days with at least one user-entered
  observation", computed in a query.
- "Logged today" (the green Home buttons) = "at least one user-entered
  observation exists for that section today". Auto-captured fields (GPS) are
  flagged `auto` in the schema and excluded, which keeps the old rule.

## ADR-003 — Notion defines the fields; the app is generated from a schema file

**Context.** Notion is the single source of truth for which fields exist and
how they render (`Key`, `Type`, `Widget`, `Order`, `Width`, `Min`/`Max`/`Step`,
`Marks`, `Options`, default). Confluence databases were considered; Notion
stays because the databases and tooling already exist.

**Decision.** `scripts/sync-schema` reads the three Notion databases
(Morning/Midday/Evening) and writes `packages/schema/schema.json`, which is
**committed**. A zod schema in `packages/schema` validates it. The app renders
each section's form from it (one generic field component per `Widget` type);
the API validates incoming observations against it.

**Consequences.**
- Adding a field in Notion = run the sync, review the diff, commit, ship.
  No hand-written widget per field.
- The committed file is the reviewable record of what the app was built
  against; Notion changes never reach the running app silently.
- Field behaviour that the old app hard-coded becomes schema properties, e.g.
  `default: { kind: "previous" | "static" | "now", value }` for carry-over,
  `visibleWhen` for conditional fields (Dream shown when Dreamt is on),
  `auto: true` for captured fields.
- Reference data such as the meds list becomes a Notion field `Options` list
  (or a small Notion database) rather than a database table.

## ADR-004 — Expo (React Native) for Android and web, TypeScript throughout

**Context.** Android plus a desktop browser. Must-haves: GPS on page open.
Nice-to-have later: notifications three times a day, offline entry. Device
health data (Health Connect) will be ingested server-side anyway.

**Decision.** One Expo app (React Native + react-native-web, Expo Router,
TanStack Query for server state). TypeScript in the app, API, ingestion and
scripts, in one pnpm monorepo.

**Consequences.**
- One codebase covers both targets; native APIs (location now, notifications
  later) are available through Expo modules without leaving the stack.
- Android distribution: EAS Build producing an APK installed directly (no Play
  Store needed for a single user); JS-only changes ship over EAS Update.
- Web: static export (`expo export --platform web`) hosted as a static site.
- Charts must work on both native and web; the library choice is deferred to
  the charts phase (spike first).

## ADR-005 — A thin API between the app and ClickHouse

**Context.** ClickHouse has no row-level security or browser-safe client API;
credentials must never ship in the app.

**Decision.** `apps/api`: a small Hono service on Node using
`@clickhouse/client`. Endpoints (first cut):

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/health` | Liveness + build info |
| `GET` | `/days/:section/:date` | Current values for a section/day + derived (streak, defaults from previous day) |
| `POST` | `/observations` | Append one or more observations (validated against schema) |
| `GET` | `/status/:date` | Which sections are logged on a date (Home buttons) |
| `GET` | `/series?section&field&from&to` | Time series for in-app charts |

Auth: one long random bearer token (env var on the API, stored in the app's
SecureStore / browser storage after a one-time entry). Single user, so no
accounts. Revisit (passkeys) only if that changes.

**Consequences.** The API owns validation and derived-value logic, so it is
unit-testable without a UI, which the Appsmith app never was.

## ADR-006 — Hosting: everything on Railway, ClickHouse self-hosted

**Context.** ClickHouse Cloud has no free tier: a 30-day/$300 trial, then
roughly $66/month minimum on the Basic plan. Usage is minuscule. Railway is
already where ingestion was going to run.

**Decision.** Railway project with three services: `clickhouse` (official
image + persistent volume, private network only), `api` (public HTTPS),
`ingest` (cron). The web build is a static site (Railway or Cloudflare Pages).

**Consequences.**
- Cheap, and one place to look.
- **Backups are our job**: a nightly `BACKUP … TO S3(…)` to an S3-compatible
  bucket (e.g. Cloudflare R2), plus a tested restore.
- Grafana (later) reaches ClickHouse either over Railway's private network
  (Grafana on Railway) or via a read-only user exposed through TCP proxy.
- Switching to ClickHouse Cloud later is a data copy and a connection string;
  nothing in the design depends on self-hosting.

## ADR-007 — Oura (and later other sources) ingested into their own tables

**Decision.** `apps/ingest` polls the Oura API on a schedule and writes
`oura_*` tables using `ReplacingMergeTree(ingested_at)` keyed by Oura's own
record id/day, so re-fetching overlapping windows is idempotent. Read with
`FINAL` (cheap at this size). Starts fresh; the Supabase `oura_*` tables are
not migrated.

## ADR-008 — Changes reach production through an approved pull request

**Context.** Code is written in Claude Code sessions in the Claude app and
pushed to GitHub. Max reviews by using the app, not by reading code. A
change must not reach the app in daily use before he has seen it.

**Decision.** `main` is production. Every change (Claude's, a Notion schema
sync, or a manual edit) goes on a branch and becomes a pull request. Each
pull request gets automatic checks and a preview (a test copy of the API and
database, a web link, and the "Mexus Preview" Android app). Max tries the
preview and presses Merge on GitHub; merging deploys to production
automatically (Railway, web, Android update).

**Consequences.**
- One tap per change for Max; production only ever runs reviewed code.
- No direct pushes to `main`; branch protection enforces it once CI exists.
- Manual editing, when needed, uses GitHub Codespaces (VS Code in the
  browser, preconfigured by a dev container) or VS Code / Cursor locally,
  and follows the same pull-request route.
- Hosting: Railway runs ClickHouse, the API, the ingest job and the web app;
  Expo (EAS) builds and updates the Android app; backups go to a separate
  S3-compatible bucket.

## Cross-cutting conventions

- **Build stamp.** The app shows the git SHA + build time (injected at build)
  on Home/settings; `/health` returns the API's. "Is my change deployed?" is
  answered by reading it, not guessing. Carried over from the Appsmith app.
- **Day boundary = device-local date**, decided on the client and sent as
  `entry_date`; `tz_offset` is stored so travel doesn't corrupt history.
- **Verify writes against the database.** Every change to the write path is
  tested by querying ClickHouse, not by trusting the UI.
- **Section naming.** Code uses `mor`/`mid`/`eve`; UI uses
  Check-in/Stand-up/Check-out.

## Open questions

1. ~~**Notion access.**~~ Resolved 2026-11-14: "Mexus Items" was rebuilt in
   the **Ember** workspace (the one the Notion connector reaches) from the
   Appsmith app's field definitions. Page `418e5f748fe981a4ada7d834558d02bf`;
   data sources Morning `collection://418e5f74-8fe9-81f1-a3e3-000b9997d942`,
   Midday `collection://418e5f74-8fe9-810d-b968-000b148ea1e6`, Evening
   `collection://418e5f74-8fe9-817b-ace8-000b642ba444`. The original page in
   the other workspace is no longer the source of truth.
2. **Midday/Evening fields.** Do the Notion databases for those exist yet, or
   are they still to be designed (in the wireframing step)?
3. **Domain.** Where the web app and API live (e.g. subdomains of
   `newseas.eu`).
4. **Chart library** for native + web (decided by a spike in Phase 4).
