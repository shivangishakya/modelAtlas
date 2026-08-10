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
      env: {
        ...process.env,
        NODE_ENV: "production",
        GOOGLE_GENERATIVE_AI_API_KEY: "",
      },
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
  assert.match(html, /maxLength="20000"/);
  assert.match(html, />Copy</);
  assert.match(html, />Cut</);
  assert.match(html, />Paste</);
  assert.match(html, /20,000<!-- --> chars/);
  assert.doesNotMatch(html, /codex-preview|Building your site/);
});

test("validates advisor input before making an AI request", async () => {
  const response = await fetch(`${baseUrl}/api/advisor`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ description: "too short", priorities: [] }),
  });

  assert.equal(response.status, 400);
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.deepEqual(await response.json(), {
    error:
      "Describe the work in 20–20,000 characters and use only the listed priorities.",
  });
});

test("accepts long advisor descriptions", async () => {
  const response = await fetch(`${baseUrl}/api/advisor`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      description: "Detailed project requirement. ".repeat(200),
      priorities: ["long"],
    }),
  });

  assert.equal(response.status, 503);
  assert.deepEqual(await response.json(), {
    error:
      "The AI advisor is not configured for this deployment. The site owner must add the Gemini API key.",
  });
});

test("reports a missing Gemini key without attempting generation", async () => {
  const response = await fetch(`${baseUrl}/api/advisor`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      description:
        "Compare architectural drawings with a specification and draft RFIs.",
      priorities: ["vision", "long"],
    }),
  });

  assert.equal(response.status, 503);
  assert.deepEqual(await response.json(), {
    error:
      "The AI advisor is not configured for this deployment. The site owner must add the Gemini API key.",
  });
});

test("keeps data, AI analysis, types, and presentation separated", async () => {
  const [
    page,
    component,
    catalog,
    domains,
    advisor,
    advisorRoute,
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
    readFile(new URL("../app/model-atlas/advisor.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/advisor/route.ts", import.meta.url), "utf8"),
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
  assert.match(component, /fetch\("\/api\/advisor"/);
  assert.doesNotMatch(component, /getRecommendations|matchedKeywords/);
  assert.doesNotMatch(component, /const models\s*=/);
  assert.match(catalog, /export const models: readonly Model\[\]/);
  assert.match(domains, /export const domains: readonly Domain\[\]/);
  assert.match(domains, /export const domainLeaders/);
  assert.match(domains, /export const domainSignals/);
  assert.match(advisor, /import "server-only"/);
  assert.match(advisor, /from "@ai-sdk\/google"/);
  assert.match(advisor, /gemini-3\.6-flash/);
  assert.match(advisor, /model: google\(ADVISOR_MODEL_ID\)/);
  assert.match(advisor, /Output\.object/);
  assert.match(advisor, /assertValidOutput/);
  assert.match(advisor, /normalizeAdvisorOutput/);
  assert.match(advisor, /truncateAtWord/);
  assert.match(advisor, /MAX_ADVISOR_GENERATION_ATTEMPTS = 2/);
  assert.match(advisor, /NoObjectGeneratedError\.isInstance/);
  assert.match(advisorRoute, /advisorRequestSchema\.safeParse/);
  assert.match(advisorRoute, /Cache-Control": "no-store"/);
  assert.doesNotMatch(recommendation, /inferDomain|getRecommendations/);
  assert.doesNotMatch(recommendation, /"use client"/);
  assert.match(recommendation, /from "\.\/domains"/);
  assert.match(types, /export interface Model/);
  assert.match(types, /export interface AdvisorResponse/);
  assert.match(types, /export interface Recommendation/);
  assert.match(packageJson, /"name": "model-atlas"/);
  assert.match(packageJson, /"@ai-sdk\/google":/);
  assert.match(packageJson, /"ai":/);
  assert.match(packageJson, /"zod":/);
  assert.match(packageJson, /"next": "16\.3\.0"/);
  assert.doesNotMatch(packageJson, /vinext|wrangler/);
});

test("keeps the weekly cloud updater isolated and deterministic", async () => {
  const [workflow, updater, catalogValidator, domainValidator, packageJson] =
    await Promise.all([
      readFile(
        new URL(
          "../.github/workflows/weekly-model-update.yml",
          import.meta.url,
        ),
        "utf8",
      ),
      readFile(
        new URL("../scripts/update-model-catalog.mjs", import.meta.url),
        "utf8",
      ),
      readFile(
        new URL("../scripts/validate-model-catalog.mjs", import.meta.url),
        "utf8",
      ),
      readFile(
        new URL("../scripts/validate-domain-map.mjs", import.meta.url),
        "utf8",
      ),
      readFile(new URL("../package.json", import.meta.url), "utf8"),
    ]);

  assert.match(workflow, /schedule:/);
  assert.match(workflow, /workflow_dispatch:/);
  assert.match(workflow, /secrets\.GEMINI_API_KEY/);
  assert.match(workflow, /node scripts\/update-model-catalog\.mjs/);
  assert.match(workflow, /permissions:\n\s+contents: read/);
  assert.match(workflow, /permissions:\n\s+contents: write/);
  assert.match(workflow, /Enforce the agent file boundary/);
  assert.match(
    workflow,
    /git add app\/model-atlas\/catalog\.ts app\/model-atlas\/domains\.ts/,
  );
  assert.doesNotMatch(workflow, /git add -A|git add \./);
  assert.doesNotMatch(workflow, /google_web_search|web_fetch/);
  assert.match(updater, /gemini-3\.6-flash/);
  assert.match(updater, /generativelanguage\.googleapis\.com/);
  assert.match(updater, /responseFormat/);
  assert.match(updater, /officialSources/);
  assert.match(updater, /sourceLookbackDays = 14/);
  assert.match(updater, /writeFile\(catalogUrl/);
  assert.match(updater, /writeFile\(domainsUrl/);
  assert.match(updater, /domainMapChanged/);
  assert.match(catalogValidator, /must remain literal data/);
  assert.match(
    catalogValidator,
    /Only identifier and string-literal property names/,
  );
  assert.match(domainValidator, /must remain literal data/);
  assert.match(domainValidator, /references unknown model ID/);
  assert.match(domainValidator, /exactly one entry for every domain/);
  assert.match(packageJson, /"catalog:validate":/);
  assert.match(packageJson, /"domain:validate":/);
  assert.match(packageJson, /"atlas:validate":/);
});
