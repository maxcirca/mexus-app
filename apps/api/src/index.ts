import { serve } from "@hono/node-server";
import { currentBuildInfo } from "@mexus/build-info";
import { createApp } from "./app.ts";

const build = currentBuildInfo();
const port = Number(process.env.PORT) || 3000;

serve({ fetch: createApp(build).fetch, port }, (info) => {
  console.log(`Mexus API (${build.environment}, ${build.gitSha}) listening on :${info.port}`);
});
