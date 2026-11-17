import { describe, expect, it } from "vitest";
import { createApp } from "./app.ts";
import { readBuildInfo } from "./build-info.ts";

describe("GET /health", () => {
  it("answers with the build stamp", async () => {
    const app = createApp({ environment: "staging", gitSha: "abc123", buildTime: "2026-11-17T10:00:00Z" });
    const res = await app.request("/health");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      status: "ok",
      environment: "staging",
      gitSha: "abc123",
      buildTime: "2026-11-17T10:00:00Z",
    });
  });
});

describe("readBuildInfo", () => {
  it("falls back to 'local' and 'unknown' when nothing is configured", () => {
    expect(readBuildInfo({})).toEqual({ environment: "local", gitSha: "unknown", buildTime: "unknown" });
  });

  it("uses Railway's commit SHA unless MEXUS_GIT_SHA overrides it", () => {
    expect(readBuildInfo({ RAILWAY_GIT_COMMIT_SHA: "r1" }).gitSha).toBe("r1");
    expect(readBuildInfo({ RAILWAY_GIT_COMMIT_SHA: "r1", MEXUS_GIT_SHA: "m1" }).gitSha).toBe("m1");
  });
});
