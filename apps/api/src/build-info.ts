/**
 * Build stamp: which environment this is and which code it runs.
 * Everything comes from configuration, never from code (ADR-009).
 * Railway sets RAILWAY_GIT_COMMIT_SHA itself; MEXUS_* can override it.
 */
export type BuildInfo = {
  environment: string;
  gitSha: string;
  buildTime: string;
};

export function readBuildInfo(env: NodeJS.ProcessEnv = process.env): BuildInfo {
  return {
    environment: env.MEXUS_ENV || "local",
    gitSha: env.MEXUS_GIT_SHA || env.RAILWAY_GIT_COMMIT_SHA || "unknown",
    buildTime: env.MEXUS_BUILD_TIME || "unknown",
  };
}
