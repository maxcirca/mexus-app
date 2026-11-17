// Writes build-info.json at the repository root during a deploy build,
// so the running service can report when it was built (build stamp).
import { writeFileSync } from "node:fs";

const stamp = {
  gitSha: process.env.RAILWAY_GIT_COMMIT_SHA || process.env.GITHUB_SHA || "unknown",
  buildTime: new Date().toISOString(),
};
writeFileSync(new URL("../build-info.json", import.meta.url), `${JSON.stringify(stamp)}\n`);
console.log("build stamp", stamp);
