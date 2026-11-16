Mexus — Personal Metrics Tracker
Single-user app: a check-in three times a day (Morning "Check-in", Midday "Stand-up", Evening "Check-out") plus, later, Oura data and simple charts. Successor to the Appsmith app in maxcirca/appsmith-mexus (no data migrated).

Read first: docs/ARCHITECTURE.md (decisions as ADRs) and docs/PLAN.md (phases, exit criteria, current status). Keep both current: when a decision changes, edit its ADR; when work lands, tick it in the plan.

Stack in one line
Expo (Android + web) → Hono API on Railway → ClickHouse on Railway; fields generated from Notion "Mexus Items" into packages/schema/schema.json. TypeScript everywhere, pnpm monorepo.

Rules that came from real bugs in the Appsmith app
Notion is the source of truth for fields. Never add a field in code only. Change Notion → run the schema sync → commit the diff.
Verify writes against ClickHouse, not the UI. After any change to the write path, query the table. A month of silently failed saves in the old app survived many "looks wired correctly" reviews.
Never store derived values (streak, "logged today"). Compute them at read time. A stored, frozen streak went permanently wrong in the old app.
Auto-captured fields (GPS) don't count as "logged". Opening a page must not mark a section done.
Build stamp. The app and /health expose git SHA + build time; check it before concluding a change is or isn't deployed.
Escape free text properly. Use the ClickHouse client's parameter binding; never splice values into SQL strings.
Conventions
Section codes mor/mid/eve in code and data; Notion keys stay unprefixed (alarm_time), the section is its own column.
Day boundary = device-local date, sent by the client as entry_date.
The Supabase/Appsmith stack is retired; don't add to it.
