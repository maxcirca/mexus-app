import { serve } from "@hono/node-server";
import { createApp } from "./app.ts";
import { readBuildInfo } from "./build-info.ts";

const build = readBuildInfo();
const port = Number(process.env.PORT) || 3000;

serve({ fetch: createApp(build).fetch, port }, (info) => {
  console.log(`Mexus API (${build.environment}, ${build.gitSha}) listening on :${info.port}`);
});
