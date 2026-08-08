import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { readFile } from "node:fs/promises";
import { after, before, test } from "node:test";

const host = "127.0.0.1";
const port = 3_200 + (process.pid % 500);
const baseUrl = `http://${host}:${port}`;
let server;
let serverOutput = "";

async function waitForServer() {
  const deadline = Date.now() + 20_000;

  while (Date.now() < deadline) {
    try {
      const response = await fetch(baseUrl);
      if (response.ok) {
        return;
      }
    } catch {
      // The server is still starting.
    }

    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  throw new Error(`Next.js did not start in time.\n${serverOutput}`);
}

before(async () => {
  server = spawn(
    process.execPath,
    [
      "node_modules/next/dist/bin/next",
      "start",
      "--hostname",
      host,
      "--port",
      String(port),
    ],
    {
      cwd: new URL("../", import.meta.url),
      env: { ...process.env, NODE_ENV: "production" },
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
  server.stdout.on("data", (chunk) => {
    serverOutput += chunk.toString();
  });
  server.stderr.on("data", (chunk) => {
    serverOutput += chunk.toString();
  });

  await waitForServer();
});

after(() => {
  server?.kill("SIGTERM");
});

test("serves the production Model Atlas application", async () => {
  const response = await fetch(baseUrl);
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /Model Atlas/);
  assert.match(html, /id="advisor"/);
  assert.match(html, /id="catalog"/);
  assert.match(html, /id="compare"/);
  assert.match(html, /researched models/);
  assert.match(html, /Evidence-led AI field guide/);
  assert.doesNotMatch(html, /codex-preview|Building your site/);
});

test("keeps data, ranking logic, types, and presentation separated", async () => {
  const [
    page,
    component,
    catalog,
    domains,
    recommendation,
    types,
    packageJson,
  ] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(
      new URL("../app/model-atlas/ModelAtlas.tsx", import.meta.url),
      "utf8",
    ),
    readFile(new URL("../app/model-atlas/catalog.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/model-atlas/domains.ts", import.meta.url), "utf8"),
    readFile(
      new URL("../app/model-atlas/recommendation.ts", import.meta.url),
      "utf8",
    ),
    readFile(new URL("../app/model-atlas/types.ts", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
  ]);

  assert.match(page, /import ModelAtlas from "\.\/model-atlas\/ModelAtlas"/);
  assert.match(page, /return <ModelAtlas \/>/);
  assert.match(component, /^"use client";/);
  assert.match(component, /from "\.\/catalog"/);
  assert.match(component, /from "\.\/domains"/);
  assert.match(component, /from "\.\/recommendation"/);
  assert.doesNotMatch(component, /const models\s*=/);
  assert.match(catalog, /export const models: readonly Model\[\]/);
  assert.match(domains, /export const domains: readonly Domain\[\]/);
  assert.match(recommendation, /export function inferDomain/);
  assert.match(recommendation, /export function getRecommendations/);
  assert.doesNotMatch(recommendation, /"use client"/);
  assert.match(types, /export interface Model/);
  assert.match(types, /export interface Recommendation/);
  assert.match(packageJson, /"name": "model-atlas"/);
  assert.match(packageJson, /"next": "16\.3\.0"/);
  assert.doesNotMatch(packageJson, /vinext|wrangler/);
});
