import { describe, expect, it } from "vitest";
import { shortSha, stampFromExtra, withRuntimeConfig } from "./build-stamp";

describe("build stamp", () => {
  it("reads the stamp baked into the app config", () => {
    const extra = { mexus: { environment: "staging", gitSha: "abc1234def", buildTime: "2026-11-18T08:00:00Z" } };
    expect(stampFromExtra(extra)).toEqual({
      environment: "staging",
      gitSha: "abc1234def",
      buildTime: "2026-11-18T08:00:00Z",
    });
  });

  it("falls back to local and unknown when nothing is configured", () => {
    expect(stampFromExtra(undefined)).toEqual({ environment: "local", gitSha: "unknown", buildTime: "unknown" });
    expect(stampFromExtra({ mexus: { environment: "" } }).environment).toBe("local");
  });

  it("lets the web service's config.json name the environment", () => {
    const built = stampFromExtra({ mexus: { environment: "local", gitSha: "abc1234" } });
    expect(withRuntimeConfig(built, { environment: "staging", apiUrl: "https://api" })).toMatchObject({
      environment: "staging",
      gitSha: "abc1234",
    });
    expect(withRuntimeConfig(built, null).environment).toBe("local");
  });

  it("shortens git SHAs but leaves words alone", () => {
    expect(shortSha("0153a2f9c8e7d6b5")).toBe("0153a2f");
    expect(shortSha("unknown")).toBe("unknown");
  });
});
