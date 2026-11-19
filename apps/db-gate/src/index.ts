import { serve } from "@hono/node-server";
import { currentBuildInfo } from "@mexus/build-info";
import { createGate } from "./gate.ts";

const build = currentBuildInfo();
const port = Number(process.env.PORT) || 8080;
const upstream = process.env.CLICKHOUSE_URL;
if (!upstream) throw new Error("CLICKHOUSE_URL is not set");

serve({ fetch: createGate({ build, upstream }).fetch, port }, (info) => {
  console.log(`Mexus db-gate (${build.environment}, ${build.gitSha}) listening on :${info.port}`);
});
