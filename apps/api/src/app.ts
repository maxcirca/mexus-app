import { Hono } from "hono";
import type { BuildInfo } from "./build-info.ts";

export function createApp(build: BuildInfo) {
  const app = new Hono();

  app.get("/health", (c) => c.json({ status: "ok", ...build }));

  return app;
}
