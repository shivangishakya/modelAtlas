# Model Atlas

Model Atlas is an interactive, evidence-led guide for choosing and comparing AI
models. Describe a use case, select the capabilities that matter, and the app
uses an LLM to rank suitable catalog models with its reasoning, limitations and
links to supporting sources.

[![CI/CD](https://github.com/shivangishakya/modelAtlas/actions/workflows/ci.yml/badge.svg)](https://github.com/shivangishakya/modelAtlas/actions/workflows/ci.yml)

## Links

- [Live application](https://model-atlas-mu.vercel.app)
- [GitHub repository](https://github.com/shivangishakya/modelAtlas)
- [CI/CD workflow](https://github.com/shivangishakya/modelAtlas/actions/workflows/ci.yml)

## Features

- LLM-backed semantic recommendations across medical, software, construction,
  research, finance, legal, creative, and other domains
- Schema-validated rankings restricted to models and evidence in the catalog
- Adjustable priorities for privacy, vision, long context, cost, and
  multilingual use
- Side-by-side model comparison with capability, access, context, limitation,
  and evidence fields
- Curated model catalog with provider, API, and open-weight links
- Safety notes for higher-risk domains
- Responsive single-page interface

## Project structure

```text
app/
├── api/advisor/route.ts          # Validated, rate-limited advisor endpoint
├── layout.tsx                    # Root metadata and application shell
├── page.tsx                      # Route entry point
├── globals.css                   # Global design system and responsive styles
└── model-atlas/
    ├── ModelAtlas.tsx            # Interactive client UI and state
    ├── advisor.ts                 # Server-only LLM prompt and output validation
    ├── catalog.ts                # Model catalog and cited evidence
    ├── domains.ts                # Domain, preset, and caution content
    ├── recommendation.ts         # Editorial domain-map scoring
    └── types.ts                  # Shared domain types
tests/
└── rendered-html.test.mjs        # Production-render smoke test
```

The application keeps editorial data, server-side semantic analysis, shared
types, and interactive presentation separate. User text and the Gemini API key
are never placed in the client bundle.

## Local development

### Prerequisites

- Node.js `>=22.13.0`
- npm

```bash
npm ci
cp .env.example .env.local
npm run dev
```

Add a free Google AI Studio key to `GOOGLE_GENERATIVE_AI_API_KEY` in
`.env.local`, then open the local URL printed by Next.js. Never commit the real
key.

## Quality checks

```bash
npm run format:check
npm run lint
npm test
```

`npm test` creates a production build, starts it locally, and verifies the
rendered application.

## Recommendation methodology

The advisor uses a server-side LLM rather than substring or keyword matching:

1. Gemini 3.6 Flash analyzes the complete task, inputs, output, constraints and
   ambiguity with high reasoning depth.
2. The prompt supplies only the reviewed Model Atlas catalog and requires three
   distinct catalog model IDs.
3. A Zod schema validates the domain, confidence, scores, reasons and tradeoffs;
   server checks reject duplicates and out-of-range or oversized output.
4. The UI joins the selected IDs back to deterministic catalog records and
   first-party evidence links.

Semantic analysis improves intent matching but cannot guarantee a correct
recommendation. Scores are comparative product guidance, not benchmark,
clinical, legal, financial, or regulatory validation. Review evidence links and
run task-specific evaluations before consequential use.

The use-case description is sent to the configured AI model for analysis. Do
not submit personal, privileged, regulated, or confidential information.

## Updating the catalog

Add or revise models in `app/model-atlas/catalog.ts`, using the `Model` contract
from `app/model-atlas/types.ts`. Each factual capability claim should include a
first-party source when available. Update domain metadata in
`app/model-atlas/domains.ts`, semantic selection policy in
`app/model-atlas/advisor.ts`, and domain-map ranking rules in
`app/model-atlas/recommendation.ts`.

## Deployment

The project is deployed at
[model-atlas-mu.vercel.app](https://model-atlas-mu.vercel.app) as a public
Next.js application.

- Pull requests and pushes run formatting, lint, build, and production-render
  checks through GitHub Actions.
- After the validation job succeeds on `main`, GitHub Actions builds a pinned
  Vercel artifact and deploys it to production using encrypted repository
  secrets.
- No application authentication or deployment password is required to visit the
  production URL.
- The advisor calls Gemini only from the server, using the
  `GOOGLE_GENERATIVE_AI_API_KEY` Vercel environment variable; the key is never
  exposed to visitors.
- Gemini's free tier has usage limits and may use submitted content to improve
  Google products. The UI warns visitors not to submit sensitive information.

Vercel configuration lives in `vercel.json`, and the CI definition lives in
`.github/workflows/ci.yml`.
