/**
 * What the app shows about itself: environment and build stamp (AGENTS.md).
 * - Android: baked in at build time through app.config.ts (`extra.mexus`).
 * - Web: one build serves every environment, so the environment comes from
 *   /config.json, which the web service writes from its Railway variables.
 */
export type BuildStamp = {
  environment: string;
  gitSha: string;
  buildTime: string;
};

const unknown: BuildStamp = { environment: "local", gitSha: "unknown", buildTime: "unknown" };

function text(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

/** Reads the stamp from app config `extra`, tolerating anything missing. */
export function stampFromExtra(extra: unknown): BuildStamp {
  const mexus = (extra as { mexus?: Record<string, unknown> } | undefined)?.mexus ?? {};
  return {
    environment: text(mexus.environment) ?? unknown.environment,
    gitSha: text(mexus.gitSha) ?? unknown.gitSha,
    buildTime: text(mexus.buildTime) ?? unknown.buildTime,
  };
}

/** Overlays the web service's /config.json on the built-in stamp. */
export function withRuntimeConfig(stamp: BuildStamp, config: unknown): BuildStamp {
  const runtime = (config ?? {}) as Record<string, unknown>;
  return {
    environment: text(runtime.environment) ?? stamp.environment,
    gitSha: text(runtime.gitSha) ?? stamp.gitSha,
    buildTime: text(runtime.buildTime) ?? stamp.buildTime,
  };
}

export function shortSha(sha: string): string {
  return /^[0-9a-f]{7,}$/i.test(sha) ? sha.slice(0, 7) : sha;
}
