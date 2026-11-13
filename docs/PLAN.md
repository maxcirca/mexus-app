# Mexus — Project plan

Phased so that something usable exists as early as possible: **Morning
check-in in daily use by the end of Phase 2**, then Midday/Evening, then
history, then Oura. Each phase has exit criteria; a phase is done when they
are met and verified against the real database, not when the code is written.

Status key: ⏳ not started · 🚧 in progress · ✅ done

---

## Phase 0 — Foundations ⏳

Goal: repo, tooling and the spec are in place; screens agreed.

- [ ] pnpm monorepo: `apps/app` (Expo), `apps/api` (Hono), `apps/ingest`,
      `packages/schema`, `scripts/`. TypeScript strict, ESLint, Prettier, Vitest.
- [ ] CI (GitHub Actions): typecheck, lint, test on every push.
- [ ] Notion access confirmed from a session; Midday/Evening databases exist
      with the same columns as Morning (`Key`, `Type`, `Widget`, `Order`,
      `Width`, `Min`/`Max`/`Step`, `Marks`, `Options`, `Default`).
- [ ] Add the Notion columns the new design needs: default kind
      (`previous`/`static`/`now`), `Visible when`, `Auto` (captured, not
      user-entered).
- [ ] `scripts/sync-schema`: Notion → `packages/schema/schema.json`, validated
      by zod; committed.
- [ ] **Wireframes on a shared Miro board**: Home, Morning, Midday, Evening,
      History/charts, Settings. Low-fidelity; Max edits directly, Claude
      redraws from the schema. Agreed before Phase 2's UI work.

Exit: `pnpm test` green in CI; `schema.json` generated from Notion for all
three sections; wireframes signed off.

## Phase 1 — Data spine ⏳

Goal: a deployed API that can store and read back observations.

- [ ] Railway project: `clickhouse` (volume, private), `api` (public).
- [ ] ClickHouse migrations (plain numbered `.sql` files + a tiny runner):
      `observations`, `daily_values` view.
- [ ] API endpoints from ARCHITECTURE ADR-005, bearer-token auth, schema
      validation on write.
- [ ] Derived logic in the API with unit tests: latest-value-per-field,
      previous-day carry-over defaults, streak, logged-today status.
- [ ] Integration tests against a real ClickHouse (Docker in CI).
- [ ] Nightly backup to S3-compatible storage + one **tested restore**.
- [ ] `/health` returns build SHA + time.

Exit: from a script, POST observations, GET the day back, the values and
streak are right; the rows are visible with a direct ClickHouse query; a
restore from backup was done once.

## Phase 2 — Morning at parity, in daily use ⏳

Goal: replace the Appsmith Morning check-in.

- [ ] Expo app shell: Expo Router, Home with three section buttons (green +
      `✓` when logged today), settings (API token entry, build stamp).
- [ ] Generic field renderer driven by `schema.json`: date, time, switch,
      slider (min/max/step/marks), select, multi-select, text (multi-line),
      read-only (streak), half/full width, `visibleWhen`.
- [ ] Autosave: each field change posts one observation (debounced for text);
      visible "Saved at HH:mm:ss" from the API's response.
- [ ] Entry date switching loads that day's stored values; defaults follow
      stored → previous day → static.
- [ ] GPS captured on first open of a day (`auto` field), shown on a map.
- [ ] Meds: multi-select with per-med dosage inputs (shape decided in
      wireframes; dosage carry-over per med).
- [ ] Web build deployed; Android APK via EAS Build installed on Max's phone.

Exit: Max uses it for Morning for a week instead of Appsmith; every field
verified to land in ClickHouse by direct query.

## Phase 3 — Midday & Evening ⏳

- [ ] Fields defined in Notion, synced, wireframes updated.
- [ ] Any widget types they need that Morning didn't.
- [ ] Home status covers all three sections.

Exit: all three check-ins in daily use.

## Phase 4 — History & in-app charts ⏳

- [ ] Spike: chart library that works on Android **and** web; pick one.
- [ ] Per-field time series (line / bar), calendar heat-map of logged days,
      streak history.
- [ ] Day view: browse and edit past days (already possible via entry date).

## Phase 5 — Oura ingestion ⏳

- [ ] `apps/ingest` on a Railway cron: Oura API v2 → `oura_*` tables
      (`ReplacingMergeTree`), backfill from first available date.
- [ ] Oura sleep/readiness alongside check-in data in charts.

## Later / nice to have

- Reminder notifications (morning / midday / evening).
- Offline entry: queue observations locally, flush when online (the
  append-only design makes this straightforward: no conflicts, just replay).
- Health Connect ingestion.
- Grafana (separate project) on the same ClickHouse.
- Retire `maxcirca/appsmith-mexus` and the Supabase project.

## Risks

| Risk | Mitigation |
|---|---|
| Self-hosted ClickHouse data loss | Nightly backup + tested restore in Phase 1; Cloud migration path kept open |
| Generic schema-driven form can't express a field's quirk | Escape hatch: a custom component per `Widget` value; add the property to Notion rather than special-casing a key |
| Chart library weak on one platform | Phase 4 spike before committing; worst case a web-only chart view |
| Notion schema change breaks the app | Sync output is committed and validated; nothing reaches the app without a reviewed diff |
