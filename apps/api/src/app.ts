import type { BuildInfo } from "@mexus/build-info";
import { Hono } from "hono";

export function createApp(build: BuildInfo) {
  const app = new Hono();

  app.get("/health", (c) => c.json({ status: "ok", service: "api", ...build }));

  return app;
}
