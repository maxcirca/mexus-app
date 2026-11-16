# Mexus — Project plan

**One session a day.** Each session ends with something Max can check
himself, usually a pull request to try and merge. If a session doesn't
finish, the next one continues it: the dates shift, the checks don't.

The first stage makes sure the pipeline stands and every service is
subscribed and connected, then sends a Hello World app through it, before
any real features are built. Everything runs on **staging** first;
**production** is added when Morning is ready for daily use (ADR-009).

The same plan is drawn on the Miro board "Mexus"
(https://miro.com/app/board/uXjVHP8r888=/), frame "Project plan".

Status key: ⏳ not started · 🚧 in progress · ✅ done

## Current status

*Updated at the end of every session.* Last update: 2026-11-16, end of Day 1.

- **Day 1 done.** Every service connected and tested: GitHub, Railway
  (project "Mexus", empty), Expo, Cloudflare (R2 enabled, no bucket yet),
  Notion, Miro. DNS for `boit.net` is at all-inkl.com, no connector; Max
  adds records on Day 3. Oura taken out of scope.
- **Planning docs on `main`** via pull request #1, merged by Max.
- **Open for Max before Day 2** (needs the GitHub website, not the mobile app):
  1. Settings → General → Default branch → `main`, confirm the dialog.
  2. Branches page → delete `claude/inspiring-tesla-7ttr2d` (only possible
     once it's no longer the default).
  3. Optional: Settings → General → "Automatically delete head branches".
- **Next: Day 2, repository foundations** (see Stage 1).

## Done before Day 1 ✅

- Architecture decided and documented (`docs/ARCHITECTURE.md`, ADR-001 to 008).
- Architecture drawn on the Miro board.
- Notion "Mexus Items" rebuilt in the Ember workspace: Morning filled,
  Midday/Evening empty with the same columns.
- Workflow: pull request, preview, Max merges (ADR-008); environments
  (ADR-009); one repository (ADR-010); AGENTS.md as single source of truth.

## Stage 1 — Pipeline and connections, then Hello World 🚧

Goal, in two halves. **Days 1–5:** every service subscribed, every connector
working, the pipeline standing, staging live, so that Claude can act on
GitHub, Railway, Expo and Cloudflare from a session and Max can see each
from his own interfaces (`docs/ACCESS.md`). **Days 6–7:** a Hello World app
travels the whole pipeline to the phone and the browser.

| Day | Session | Max checks |
|---|---|---|
| 1 ✅ | **Accounts and connectors.** Max subscribes/creates and connects (list below); Claude tests every connector with a harmless action and records the result in `docs/ACCESS.md` | Every row in the access map is green |
| 2 | **Repository foundations.** AGENTS.md, code project with one folder per service, automatic checks on every pull request, `main` protected, Codespaces setup | First pull request with green checks, merged by Max; a direct push to `main` is refused |
| 3 | **Railway staging.** Staging environment with ClickHouse (persistent volume), empty API and web services, staging URLs, variables; the environment pattern from ADR-009 | Both staging links answer and show "staging" |
| 4 | **Expo.** Expo project, `staging` and `preview` channels, first "Mexus Staging" Android build installed | The app is on the phone and shows "staging" |
| 5 | **Previews and safety.** A preview environment per pull request, nightly backup to R2, TablePlus read-only access | A pull request shows a preview link; a backup file appears in R2; TablePlus opens the database |
| 6 | **Hello World.** Web and Android show the environment, build stamp and database status; a merged text change reaches both | Change appears on phone and web after Merge, without reinstalling |
| 7 | **Hello World saves a value.** One slider end to end | Moved on the phone, visible on the web and in TablePlus |

**Milestone after Day 7:** the whole chain works on staging. Everything
after is building the app.

### Accounts and connections for Day 1

| What | Max does | Status |
|---|---|---|
| GitHub | Make `main` the default branch | to do |
| Railway | Plan that allows always-on services and preview environments (likely Hobby); decide which of the two "Mexus" projects to use (or delete both and start clean) | connected, plan unchecked |
| Expo | Free account at expo.dev; connect the Expo connector in claude.ai | to do |
| Cloudflare | Free account; connect the Cloudflare connector in claude.ai | to do |
| Domain | `boit.net` at all-inkl.com, managed by Max; on Day 3 he adds the records Railway asks for | done (records on Day 3) |
| Notion | Integration token for the automatic sync (can wait until Day 9) | later |

## Stage 2 — Fields and screens ⏳

| Day | Session | Max checks |
|---|---|---|
| 8 | Proposal: which new field features to add to Notion (Morning), and first ideas for Midday and Evening | Says yes or no to each proposal; Notion updated |
| 9 | Automatic Notion sync: a Notion change opens a pull request with the new field list | Edits a label in Notion, sees the pull request appear |
| 10 | Wireframes on Miro: Home and Morning check-in | Comments on the board until happy |

## Stage 3 — Morning check-in in daily use ⏳

| Day | Session | Max checks |
|---|---|---|
| 11 | Form drawn from the schema: date, time, switches, sliders; autosave and "Saved at" | Fills in part of Morning on the phone |
| 12 | Remaining field types: select, multi-select, text, per-med dosage, show/hide rules | Every Morning field works |
| 13 | Defaults and carry-over from the previous day, streak, Home buttons turn green | Next morning the form starts from yesterday's values |
| 14 | Production environment created from staging (URLs, Mexus app, backups); location and map; polish | Uses Mexus in production instead of Appsmith for Morning from here on |

## Stage 4 — Midday and Evening ⏳

| Day | Session | Max checks |
|---|---|---|
| 15 | Midday and Evening fields in Notion, wireframes | Signs off fields and screens |
| 16 | Both sections built (mostly reuse of Morning) | Uses all three check-ins |
| 17 | Polish and any new field types they need | All three in daily use |

## Stage 5 — History and charts ⏳

| Day | Session | Max checks |
|---|---|---|
| 18 | Test which chart library works well on Android and web | Looks at two sample charts, picks |
| 19 | Charts per field over time, calendar of logged days | Uses them |
| 20 | History: browse and edit past days | Uses it |

## Later

- **Oura and other external data (Health Connect): out of scope for now**
  (decided 2026-11-16). The design keeps room for them (ADR-007).

- Reminder notifications (morning, midday, evening).
- Offline entry (changes queued on the phone, sent when online).
- Grafana (separate project) on the same ClickHouse.
- Retire `maxcirca/appsmith-mexus` and the Supabase project.

## Risks

| Risk | Mitigation |
|---|---|
| Self-hosted ClickHouse data loss | Nightly backup from Day 5, a tested restore before production exists; ClickHouse Cloud remains an option |
| A pipeline piece doesn't work as expected | That's what Stage 1 is for: found before any feature depends on it |
| Generic schema-driven form can't express a field's quirk | A custom component per `Widget` value; add the property to Notion rather than special-casing a field |
| Chart library weak on one platform | Day 18 test before committing |
| Notion change breaks the app | The sync opens a pull request with checks; nothing reaches the app without Merge |
