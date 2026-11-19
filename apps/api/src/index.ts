import { serve } from "@hono/node-server";
import { currentBuildInfo } from "@mexus/build-info";
import { createApp } from "./app.ts";
import { clientFromEnv } from "./db.ts";
import { setupDatabase } from "./setup.ts";

const build = currentBuildInfo();
const port = Number(process.env.PORT) || 3000;

serve({ fetch: createApp(build).fetch, port }, (info) => {
  console.log(`Mexus API (${build.environment}, ${build.gitSha}) listening on :${info.port}`);
});

// Database setup must not keep the API from answering /health: log failures.
const db = clientFromEnv();
if (db) {
  setupDatabase((sql) => db.command({ query: sql }), process.env)
    .then((done) => console.log(`Database setup: ${done.join("; ")}`))
    .catch((error: unknown) => console.error("Database setup failed:", error instanceof Error ? error.message : error));
} else {
  console.warn("No CLICKHOUSE_URL: database setup skipped");
}
