import { existsSync } from "node:fs";
import { serveStatic } from "@hono/node-server/serve-static";
import type { BuildInfo } from "@mexus/build-info";
import { Hono } from "hono";
import { html } from "hono/html";

/**
 * The web service. It serves the Expo web export (apps/app/dist, from Day 4)
 * and the runtime configuration the app reads at start-up, so the same
 * build works in every environment (ADR-009). Until the app exists it shows
 * a placeholder page with the build stamp.
 */
export type WebConfig = {
  build: BuildInfo;
  apiUrl: string;
  staticDir: string;
};

export function createApp({ build, apiUrl, staticDir }: WebConfig) {
  const app = new Hono();

  app.get("/health", (c) => c.json({ status: "ok", service: "web", ...build }));

  // The web app is exported in the same build, so this stamp is its stamp too.
  app.get("/config.json", (c) => c.json({ ...build, apiUrl }));

  if (existsSync(staticDir)) {
    app.use("/*", serveStatic({ root: staticDir }));
    app.get("/*", serveStatic({ path: `${staticDir}/index.html` }));
  } else {
    app.get("/", (c) => c.html(placeholder(build)));
  }

  return app;
}

function placeholder(build: BuildInfo) {
  return html`<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Mexus (${build.environment})</title>
    <style>
      body { font-family: system-ui, sans-serif; margin: 0; min-height: 100vh; display: grid; place-items: center; background: #f6f5f2; color: #222; }
      main { text-align: center; padding: 16px; }
      .env { display: inline-block; padding: 6px 16px; border-radius: 999px; background: #e8a33d; color: #fff; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; }
      dl { display: grid; grid-template-columns: auto auto; gap: 4px 12px; justify-content: center; font-size: 14px; color: #666; }
      dt { text-align: right; } dd { margin: 0; text-align: left; font-family: ui-monospace, monospace; }
      @media (prefers-color-scheme: dark) { body { background: #1b1b1a; color: #eee; } dl { color: #aaa; } }
    </style>
  </head>
  <body>
    <main>
      <h1>Mexus</h1>
      <p class="env">${build.environment}</p>
      <dl>
        <dt>Version</dt><dd>${build.gitSha.slice(0, 7)}</dd>
        <dt>Built</dt><dd>${build.buildTime}</dd>
      </dl>
    </main>
  </body>
</html>`;
}
