import { readFileSync } from "node:fs";

/**
 * Build stamp: which environment this is and which code it runs (ADR-009).
 * Everything comes from configuration, never from code:
 * - environment: MEXUS_ENV
 * - git SHA: MEXUS_GIT_SHA, else Railway's RAILWAY_GIT_COMMIT_SHA
 * - build time: MEXUS_BUILD_TIME, else build-info.json written by
 *   scripts/stamp-build.mjs during the Railway build
 */
export type BuildInfo = {
  environment: string;
  gitSha: string;
  buildTime: string;
};

type StampFile = { gitSha?: string; buildTime?: string };

export function readStampFile(path: string): StampFile {
  try {
    return JSON.parse(readFileSync(path, "utf8")) as StampFile;
  } catch {
    return {};
  }
}

export function readBuildInfo(env: NodeJS.ProcessEnv = process.env, stamp: StampFile = {}): BuildInfo {
  return {
    environment: env.MEXUS_ENV || "local",
    gitSha: env.MEXUS_GIT_SHA || env.RAILWAY_GIT_COMMIT_SHA || stamp.gitSha || "unknown",
    buildTime: env.MEXUS_BUILD_TIME || stamp.buildTime || "unknown",
  };
}

/** Build info for a running service; the stamp file sits at the repository root. */
export function currentBuildInfo(): BuildInfo {
  const root = new URL("../../../build-info.json", import.meta.url);
  return readBuildInfo(process.env, readStampFile(root.pathname));
}
