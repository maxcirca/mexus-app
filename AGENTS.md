# Mexus — Personal Metrics Tracker

**This file is the single source of truth for any AI agent or developer
working in this repository.** Tool-specific files (e.g. `CLAUDE.md`) only
point here; don't put instructions anywhere else.

Single-user app: a check-in three times a day (Morning "Check-in", Midday
"Stand-up", Evening "Check-out") plus simple charts. Oura and other
external data sources are out of scope for now.
Successor to the Appsmith app in `maxcirca/appsmith-mexus` (no data migrated).

**Read first:**
- `docs/ARCHITECTURE.md`: decisions as ADRs.
- `docs/PLAN.md`: one session a day, current status.
- `docs/ACCESS.md`: every service, how agents reach it, how Max reaches it.

Keep all three current: when a decision changes, edit its ADR; when work
lands, tick it in the plan; when access changes, update ACCESS.

Diagrams, plan and wireframes live on the Miro board "Mexus":
https://miro.com/app/board/uXjVHP8r888=/ — keep it in step with the docs.

## Stack in one line

Expo (Android + web) → Hono API → ClickHouse, all on Railway; fields
generated from Notion "Mexus Items" into `packages/schema/schema.json`.
TypeScript everywhere, pnpm monorepo, one repository for all services.

## Environments

Preview (one per pull request), staging (`main`), production (`production`
branch, added later). Nothing environment-specific in code: URLs, credentials
and the environment name come from configuration (`MEXUS_ENV` etc.).
Details: ADR-009.

## Start of every session

Before anything else, without being asked, give Max a short update in plain
language:
1. **Where we are:** the last completed day and anything left open, from
   the "Current status" section of `docs/PLAN.md`, checked against reality
   (merged and open pull requests on GitHub, the default branch, what is
   running on Railway).
2. **Today's plan:** the next day's session from `docs/PLAN.md`, what Max
   will be able to check at the end, and anything he has to do first.
3. **Blockers:** anything that stops today's work (an account, a setting).

Keep it short. At the end of every session, update "Current status" in
`docs/PLAN.md` so the next session starts from the truth.

## Workflow

- Never push to `main` or `production`. Work on a branch, open a pull
  request, Max merges after trying the preview.
- Use a fresh branch per day (e.g. `day-2-foundations`), never a long-lived
  one; it is deleted after merging.
- Max is not reading code: describe changes by what he will see, and give
  him something concrete to check in each pull request.
- Bump nothing by hand for the build stamp; it's injected at build time.

## Rules that came from real bugs in the Appsmith app

- **Notion is the source of truth for fields.** Never add a field in code
  only. Change Notion → run the schema sync → commit the diff.
- **Verify writes against ClickHouse, not the UI.** After any change to the
  write path, query the table. A month of silently failed saves in the old
  app survived many "looks wired correctly" reviews.
- **Never store derived values** (streak, "logged today"). Compute them at
  read time. A stored, frozen streak went permanently wrong in the old app.
- **Auto-captured fields (GPS) don't count as "logged".** Opening a page must
  not mark a section done.
- **Build stamp.** The app and `/health` expose environment, git SHA and
  build time; check it before concluding a change is or isn't deployed.
- **Escape free text properly.** Use the ClickHouse client's parameter binding;
  never splice values into SQL strings.
- **Secrets never go in the repo or the chat.** Railway variables, GitHub
  secrets, EAS variables; entered by Max through settings or secure forms.

## Conventions

- Section codes `mor`/`mid`/`eve` in code and data; Notion keys stay
  unprefixed (`alarm_time`), the section is its own column.
- Day boundary = device-local date, sent by the client as `entry_date`.
- The Supabase/Appsmith stack is retired; don't add to it.
