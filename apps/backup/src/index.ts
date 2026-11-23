import { createClient } from "@clickhouse/client";
import { currentBuildInfo } from "@mexus/build-info";
import { backupAndVerify, type Database, describeR2, r2FromEnv } from "./backup.ts";

const build = currentBuildInfo();
const database = process.env.CLICKHOUSE_DB || "mexus";

async function main() {
  if (build.environment === "preview") {
    console.log("Preview environment: no backup (previews hold throwaway data).");
    return;
  }
  const r2 = r2FromEnv(process.env);
  console.log(describeR2(r2));
  const client = createClient({
    url: process.env.CLICKHOUSE_URL,
    username: process.env.CLICKHOUSE_USER,
    password: process.env.CLICKHOUSE_PASSWORD,
    request_timeout: 30 * 60 * 1000,
    // Keeps the connection alive through long backups (progress headers).
    clickhouse_settings: { send_progress_in_http_headers: 1, http_headers_progress_interval_ms: "10000" },
  });
  const db: Database = {
    run: async (sql) => {
      await client.command({ query: sql });
    },
    rowCounts: async (name) => {
      const result = await client.query({
        query: "SELECT name, count() AS n FROM system.tables WHERE database = {db:String} GROUP BY name",
        query_params: { db: name },
        format: "JSONEachRow",
      });
      const tables = (await result.json()) as { name: string }[];
      const counts: Record<string, number> = {};
      for (const { name: table } of tables) {
        const rows = await client.query({
          query: `SELECT count() AS n FROM ${name}.\`${table.replaceAll("`", "")}\``,
          format: "JSONEachRow",
        });
        const [row] = (await rows.json()) as { n: string }[];
        counts[table] = Number(row?.n ?? 0);
      }
      return counts;
    },
  };
  try {
    const result = await backupAndVerify(db, r2, database, build.environment);
    const tables = Object.entries(result.tables).map(([t, n]) => `${t}=${n}`);
    console.log(`Backup ${result.path} written and verified by restore (${tables.join(", ") || "no tables yet"}).`);
  } finally {
    await client.close();
  }
}

main().catch((error: unknown) => {
  console.error("Backup FAILED:", error instanceof Error ? error.message : error);
  process.exit(1);
});
