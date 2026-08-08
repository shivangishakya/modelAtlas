import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders the Model Atlas application", async () => {
  const response = await render();
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
  assert.doesNotMatch(packageJson, /site-creator-vinext-starter/);
});
