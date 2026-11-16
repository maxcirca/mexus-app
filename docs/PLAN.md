# Mexus — Project plan

**One session a day.** Each session ends with something Max can check
himself, usually a pull request to try and merge. If a session doesn't
finish, the next one continues it: the dates shift, the checks don't.

The first stage is a **proof of concept**: the full pipeline and
infrastructure with an almost empty app, to prove that a change made in a
session reliably ends up on the phone and in the browser before any real
features are built on top.

The same plan is drawn on the Miro board "Mexus"
(https://miro.com/app/board/uXjVHP8r888=/), frame "Project plan".

Status key: ⏳ not started · 🚧 in progress · ✅ done

## Done before Day 1 ✅

- Architecture decided and documented (`docs/ARCHITECTURE.md`, ADR-001 to 008).
- Architecture drawn on the Miro board.
- Notion "Mexus Items" rebuilt in the Ember workspace: Morning filled,
  Midday/Evening empty with the same columns.
- `main` branch created as production; workflow: pull request, preview, Max
  merges (ADR-008).

## Accounts Max sets up first

| When | What |
|---|---|
| Before Day 1 | GitHub: make `main` the default branch |
| Before Day 2 | Railway: plan that allows an always-on database and preview environments (likely Hobby) |
| Before Day 4 | Expo: free account at expo.dev, Expo connector connected in claude.ai |
| Before Day 6 | Cloudflare: free account (R2 storage for backups) |
| Before Day 9 | Notion: internal integration with access to Mexus Items |
| Before Day 3 (optional) | DNS access for `newseas.eu` to use `mexus.newseas.eu` |

---

## Stage 1 — Proof of concept: pipeline and infrastructure ⏳

Goal: an almost empty Mexus app that shows its build stamp and saves one
value, running on Android and the web, delivered entirely through the
pipeline. When this works, every later feature is "just" app work.

| Day | Session | Max checks |
|---|---|---|
| 1 | Code project set up (app, API, shared packages), automatic checks on every pull request, Codespaces setup | The first pull request shows green checks; Max presses Merge |
| 2 | Railway production: ClickHouse and the API deployed automatically from `main`; `/health` shows build stamp and database status | Opens the API link in a browser and sees "database ok" and today's build stamp |
| 3 | Web app deployed to Railway: one screen with the Mexus name, build stamp and API status | Opens the web app on the desktop |
| 4 | Android: first build via Expo, installed on the phone; merges publish updates automatically | Installs the app; after a small merged change, the phone shows it without reinstalling |
| 5 | Previews: each pull request gets its own Railway copy, a web link, and the Mexus Preview app | Sees a change in the preview before merging, and production unchanged until he merges |
| 6 | One real value end to end: a Momentum slider that saves to ClickHouse and reloads; nightly backup to R2 | Moves the slider on the phone, sees it on the web, and sees the row in the database |
| 7 | Hardening: `main` protected (only merges via pull request), tested restore from backup, TablePlus read-only access, runbook in `docs/` | Opens the data in TablePlus; tries to push to `main` directly and is refused |

**Milestone: proof of concept done.** A change goes from a session to the
phone and the browser through checks, preview and Merge, and data is safely
stored and backed up.

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
| 14 | Location captured on first open, shown on a map; polish from a week of feedback | Uses Mexus instead of Appsmith for Morning from here on |

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

## Stage 6 — Oura ⏳

| Day | Session | Max checks |
|---|---|---|
| 21 | Oura access and scheduled import into ClickHouse, past data backfilled | Sees last month's sleep data in TablePlus |
| 22 | Oura data next to check-in data in the charts | Uses it |

## Later

- Reminder notifications (morning, midday, evening).
- Offline entry (changes queued on the phone, sent when online).
- Health Connect import.
- Grafana (separate project) on the same ClickHouse.
- Retire `maxcirca/appsmith-mexus` and the Supabase project.

## Risks

| Risk | Mitigation |
|---|---|
| Self-hosted ClickHouse data loss | Nightly backup from Day 6, tested restore on Day 7; ClickHouse Cloud remains an option |
| A pipeline piece doesn't work as expected | That's what Stage 1 is for: found before any feature depends on it |
| Generic schema-driven form can't express a field's quirk | A custom component per `Widget` value; add the property to Notion rather than special-casing a field |
| Chart library weak on one platform | Day 18 test before committing |
| Notion change breaks the app | The sync opens a pull request with checks; nothing reaches the app without Merge |
