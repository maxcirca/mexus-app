import { fileURLToPath } from "node:url";
import { serve } from "@hono/node-server";
import { currentBuildInfo } from "@mexus/build-info";
import { createApp } from "./app.ts";

const build = currentBuildInfo();
const port = Number(process.env.PORT) || 8080;
const staticDir = fileURLToPath(new URL("../../app/dist", import.meta.url));

const app = createApp({ build, apiUrl: process.env.MEXUS_API_URL || "", staticDir });

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`Mexus web (${build.environment}, ${build.gitSha}) listening on :${info.port}`);
});
