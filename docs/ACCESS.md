# Mexus — Access map

Every service the project uses: what it's for, how an agent (Claude Code in
the Claude app) reaches it, and how Max reaches it. Same content as the
"Access map" frame on the Miro board.

Status checked: 2026-11-16.

| Service | Used for | Claude reaches it with | Max uses | Status |
|---|---|---|---|---|
| **GitHub** `maxcirca/mexus-app` | Code, pull requests, checks, branch protection, secrets | git in the session (clone, push); GitHub connector (pull requests, checks, comments) | github.com, GitHub mobile app (review, Merge), Codespaces (manual edits) | ✅ connected |
| **Railway** project "Mexus" | Environments, services (ClickHouse, API, web), variables, domains, logs | Railway connector (projects, services, variables, domains, deploys, logs) | railway.com dashboard (status, logs, cost) | ✅ connected; project "Mexus" (`18c1396b-0759-4826-ba1a-df59114d2450`, workspace "Deep Space") chosen, empty; staging environment created on Day 3 |
| **ClickHouse** (on Railway) | All data | Through Railway (read-only user via TCP proxy) with the ClickHouse client in the session; the app only via the API | TablePlus, read-only login | ⏳ created on Day 3 |
| **Expo** (EAS) | Android builds and over-the-air updates, per environment channel | Expo connector (builds, updates, status); Expo plugin (official skills: how to write and configure Expo apps) | expo.dev dashboard; Mexus Staging app on the phone | ✅ connector answers (tested 2026-11-16); project created on Day 4; plugin not yet confirmed in sessions |
| **Cloudflare** | R2 bucket for nightly backups (S3-compatible storage) | Cloudflare connector "Developer Platform" (R2) | dash.cloudflare.com | ✅ connector answers, R2 enabled (no buckets yet); the connector is marked deprecated by Cloudflare, fine for R2 |
| **Domain** `boit.net` | Staging and production URLs (`*.mexus.boit.net`), pointed at Railway | No connector: DNS is at all-inkl.com; Claude reads the records Railway needs and Max adds them | all-inkl.com KAS (DNS settings) | ✅ Max manages it at all-inkl.com |
| **Notion** "Mexus Items" (Ember workspace) | Field definitions | Notion connector (read/edit); the automatic sync job uses its own Notion integration token (GitHub secret) | Notion app | ✅ connector connected; ⏳ integration token for the sync (Day 9) |
| **Miro** board "Mexus" | Architecture, plan, wireframes | Miro connector | Miro app | ✅ connected |
| **Mexus app** itself | The product | Its API and web URLs, for checks | Web: staging URL; Android: Mexus Staging app (production later) | ⏳ Hello World on Day 6 |
| **Claude app** | Where sessions happen | n/a | Claude app (web, desktop, phone) | ✅ |

## Secrets

Never in the repository and never pasted into the chat. They live in:
- Railway environment variables (database passwords, API token),
- GitHub repository/environment secrets (Notion token, Expo token for CI),
- EAS environment variables (API URL per channel).

Max enters them in those settings pages, or through a secure form a session
opens; agents never see the values.
