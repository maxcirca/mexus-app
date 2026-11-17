import { describe, expect, it } from "vitest";
import { readBuildInfo, readStampFile } from "./index.ts";

describe("readBuildInfo", () => {
  it("falls back to 'local' and 'unknown' when nothing is configured", () => {
    expect(readBuildInfo({})).toEqual({ environment: "local", gitSha: "unknown", buildTime: "unknown" });
  });

  it("uses Railway's commit SHA unless MEXUS_GIT_SHA overrides it", () => {
    expect(readBuildInfo({ RAILWAY_GIT_COMMIT_SHA: "r1" }).gitSha).toBe("r1");
    expect(readBuildInfo({ RAILWAY_GIT_COMMIT_SHA: "r1", MEXUS_GIT_SHA: "m1" }).gitSha).toBe("m1");
  });

  it("takes the build time from the stamp file written at build", () => {
    expect(readBuildInfo({}, { buildTime: "2026-11-17T12:00:00Z" }).buildTime).toBe("2026-11-17T12:00:00Z");
  });

  it("treats a missing stamp file as empty", () => {
    expect(readStampFile("/nonexistent/build-info.json")).toEqual({});
  });
});
