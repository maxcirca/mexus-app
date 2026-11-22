import { type ClickHouseClient, createClient } from "@clickhouse/client";

/** The API's connection to ClickHouse, from Railway variables (ADR-006). */
export function clientFromEnv(env: NodeJS.ProcessEnv = process.env): ClickHouseClient | undefined {
  if (!env.CLICKHOUSE_URL) return undefined;
  return createClient({
    url: env.CLICKHOUSE_URL,
    username: env.CLICKHOUSE_USER,
    password: env.CLICKHOUSE_PASSWORD,
    database: env.CLICKHOUSE_DB,
  });
}
