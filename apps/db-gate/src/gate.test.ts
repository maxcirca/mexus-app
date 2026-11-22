import { describe, expect, it } from "vitest";
import { createGate, FailureLimiter, READONLY_USER, requestedUsers } from "./gate.ts";

const build = { environment: "staging", gitSha: "abc1234", buildTime: "2026-11-18T10:00:00Z" };
const basic = (user: string, password = "pw") => `Basic ${Buffer.from(`${user}:${password}`).toString("base64")}`;

function gateWith(status = 200) {
  const calls: { url: string; method: string; body: string | null }[] = [];
  const fetchUpstream = (async (url: URL, init?: RequestInit) => {
    const body = init?.body ? await new Response(init.body).text() : null;
    calls.push({ url: String(url), method: init?.method ?? "GET", body });
    return new Response("1\n", { status });
  }) as typeof fetch;
  const app = createGate({ build, upstream: "http://clickhouse.internal:8123", fetchUpstream });
  return { app, calls };
}

describe("db-gate", () => {
  it("passes read-only queries through to ClickHouse, body and all", async () => {
    const { app, calls } = gateWith();
    const res = await app.request("/?database=mexus", {
      method: "POST",
      headers: { authorization: basic(READONLY_USER) },
      body: "SELECT 1",
    });
    expect(res.status).toBe(200);
    expect(await res.text()).toBe("1\n");
    expect(calls).toEqual([
      { url: "http://clickhouse.internal:8123/?database=mexus", method: "POST", body: "SELECT 1" },
    ]);
  });

  it("refuses every other login before it reaches ClickHouse", async () => {
    const { app, calls } = gateWith();
    const logins: Record<string, string>[] = [
      { authorization: basic("mexus") },
      { "x-clickhouse-user": "default" },
      { authorization: basic(READONLY_USER), "x-clickhouse-user": "mexus" },
      {},
    ];
    for (const headers of logins) {
      expect((await app.request("/", { method: "POST", headers, body: "SELECT 1" })).status).toBe(403);
    }
    expect((await app.request(`/?user=mexus&query=SELECT+1`)).status).toBe(403);
    expect(calls).toHaveLength(0);
  });

  it("reads the user from all three places ClickHouse accepts it", () => {
    const request = new Request(`http://gate/?user=${READONLY_USER}`, {
      headers: { authorization: basic(READONLY_USER), "x-clickhouse-user": READONLY_USER },
    });
    expect(requestedUsers(request)).toEqual([READONLY_USER, READONLY_USER, READONLY_USER]);
  });

  it("blocks an address after repeated wrong passwords", async () => {
    let now = 0;
    const limiter = new FailureLimiter(3, 1000, () => now);
    const fetchUpstream = (async () => new Response("Authentication failed", { status: 516 })) as typeof fetch;
    const app = createGate({ build, upstream: "http://ch:8123", fetchUpstream, limiter });
    const attempt = () =>
      app.request("/", { headers: { authorization: basic(READONLY_USER, "wrong"), "x-forwarded-for": "1.2.3.4" } });
    for (let i = 0; i < 3; i++) expect((await attempt()).status).toBe(516);
    expect((await attempt()).status).toBe(429);
    now = 2000;
    expect((await attempt()).status).toBe(516);
  });

  it("answers its own health check", async () => {
    const { app } = gateWith();
    expect(await (await app.request("/health")).json()).toMatchObject({ status: "ok", service: "db-gate" });
  });
});
