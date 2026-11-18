import { describe, expect, it } from "vitest";
import { createApp } from "./app.ts";

const build = { environment: "staging", gitSha: "abc1234def", buildTime: "2026-11-17T10:00:00Z" };
const app = createApp({ build, apiUrl: "https://api.example.test", staticDir: "/nonexistent" });

describe("web service", () => {
  it("answers /health with the build stamp", async () => {
    const res = await app.request("/health");
    expect(await res.json()).toEqual({ status: "ok", service: "web", ...build });
  });

  it("hands the app its environment and API URL at runtime", async () => {
    const res = await app.request("/config.json");
    expect(await res.json()).toEqual({ ...build, apiUrl: "https://api.example.test" });
  });

  it("shows a placeholder naming the environment until the app is built", async () => {
    const page = await (await app.request("/")).text();
    expect(page).toContain(">staging<");
    expect(page).toContain("abc1234");
  });

  it("escapes configured values in the page", async () => {
    const odd = createApp({ build: { ...build, environment: "<b>x</b>" }, apiUrl: "", staticDir: "/nonexistent" });
    const page = await (await odd.request("/")).text();
    expect(page).not.toContain("<b>x</b>");
  });
});
