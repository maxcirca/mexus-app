import { describe, expect, it } from "vitest";
import { createApp } from "./app.ts";

describe("GET /health", () => {
  it("answers with the build stamp", async () => {
    const app = createApp({ environment: "staging", gitSha: "abc123", buildTime: "2026-11-17T10:00:00Z" });
    const res = await app.request("/health");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      status: "ok",
      service: "api",
      environment: "staging",
      gitSha: "abc123",
      buildTime: "2026-11-17T10:00:00Z",
    });
  });
});
