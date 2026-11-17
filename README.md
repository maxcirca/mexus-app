# Mexus

Personal metrics tracker: three daily check-ins (Morning, Midday, Evening),
simple charts. Android + web, backed by ClickHouse.

- [Architecture](docs/ARCHITECTURE.md)
- [Project plan](docs/PLAN.md)
- [Access map](docs/ACCESS.md)

Start with `AGENTS.md`.

## Layout

| Folder | What |
|---|---|
| `apps/api` | Hono API (Railway service `api`) |
| `apps/app` | Expo app for Android and web (from Day 4) |
| `packages/schema` | Shared definitions; fields generated from Notion (from Day 9) |
| `.github/workflows` | Automatic checks on every pull request |
| `.devcontainer` | Codespaces / VS Code setup |

## Running it

Node 22 and pnpm (via `corepack enable`). Codespaces sets this up itself.

```bash
pnpm install
pnpm check            # lint + type check + tests, same as the pull request checks
pnpm --filter @mexus/api dev   # API on http://localhost:3000/health
```
