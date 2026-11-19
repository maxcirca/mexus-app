import type { BuildInfo } from "@mexus/build-info";
import { Hono } from "hono";

export const READONLY_USER = "mexus_readonly";

/** Every user name a ClickHouse HTTP request can carry; all must be the read-only user. */
export function requestedUsers(request: Request): string[] {
  const users: string[] = [];
  const auth = request.headers.get("authorization");
  if (auth?.toLowerCase().startsWith("basic ")) {
    const decoded = Buffer.from(auth.slice(6).trim(), "base64").toString("utf8");
    users.push(decoded.split(":")[0] ?? "");
  }
  const header = request.headers.get("x-clickhouse-user");
  if (header !== null) users.push(header);
  const param = new URL(request.url).searchParams.get("user");
  if (param !== null) users.push(param);
  return users;
}

export function isReadonlyRequest(request: Request): boolean {
  const users = requestedUsers(request);
  return users.length > 0 && users.every((user) => user === READONLY_USER);
}

/** Blocks an address after too many failed logins in a window. */
export class FailureLimiter {
  private failures = new Map<string, number[]>();
  constructor(
    private readonly limit = 10,
    private readonly windowMs = 15 * 60 * 1000,
    private readonly now = () => Date.now(),
  ) {}

  private recent(address: string): number[] {
    const since = this.now() - this.windowMs;
    const kept = (this.failures.get(address) ?? []).filter((time) => time > since);
    this.failures.set(address, kept);
    return kept;
  }

  blocked(address: string): boolean {
    return this.recent(address).length >= this.limit;
  }

  fail(address: string): void {
    this.recent(address).push(this.now());
  }
}

export type GateConfig = {
  build: BuildInfo;
  upstream: string;
  fetchUpstream?: typeof fetch;
  limiter?: FailureLimiter;
};

function clientAddress(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

export function createGate({ build, upstream, fetchUpstream = fetch, limiter = new FailureLimiter() }: GateConfig) {
  const app = new Hono();

  app.get("/health", (c) => c.json({ status: "ok", service: "db-gate", ...build }));

  app.all("*", async (c) => {
    const request = c.req.raw;
    const address = clientAddress(request);
    if (limiter.blocked(address)) return c.text("Too many failed logins; try again later.\n", 429);
    if (!isReadonlyRequest(request)) {
      limiter.fail(address);
      return c.text(`Only the read-only user ${READONLY_USER} may connect here.\n`, 403);
    }

    const incoming = new URL(request.url);
    const target = new URL(incoming.pathname + incoming.search, upstream);
    const headers = new Headers(request.headers);
    headers.delete("host");
    const hasBody = request.method !== "GET" && request.method !== "HEAD";
    const response = await fetchUpstream(target, {
      method: request.method,
      headers,
      body: hasBody ? request.body : undefined,
      // Node needs this to stream a request body.
      ...(hasBody ? { duplex: "half" } : {}),
    } as RequestInit);
    if (response.status === 401 || response.status === 403 || response.status === 516) limiter.fail(address);
    return new Response(response.body, { status: response.status, headers: response.headers });
  });

  return app;
}
