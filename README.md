# Model Atlas

Model Atlas is an interactive, evidence-led guide for choosing and comparing AI
models. Describe a use case, select the capabilities that matter, and the app
ranks suitable models with its reasoning and links to supporting sources.

## Features

- Natural-language model recommendations across medical, software,
  construction, research, finance, legal, creative, and other domains
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
├── layout.tsx                    # Root metadata and application shell
├── page.tsx                      # Route entry point
├── globals.css                   # Global design system and responsive styles
└── model-atlas/
    ├── ModelAtlas.tsx            # Interactive client UI and state
    ├── catalog.ts                # Model catalog and cited evidence
    ├── domains.ts                # Domain, preset, and caution content
    ├── recommendation.ts         # Pure inference and ranking functions
    └── types.ts                  # Shared domain types
tests/
└── rendered-html.test.mjs        # Production-render smoke test
```

The application keeps editorial data, recommendation logic, shared types, and
interactive presentation separate. This makes catalog updates reviewable and
keeps ranking behavior independently testable.

## Local development

### Prerequisites

- Node.js `>=22.13.0`
- npm

```bash
npm ci
npm run dev
```

Then open the local URL printed by Next.js.

## Quality checks

```bash
npm run format:check
npm run lint
npm test
```

`npm test` creates a production build, starts it locally, and verifies the
rendered application.

## Recommendation methodology

Recommendations combine four signals:

1. A curated domain-fit score
2. Keywords found in the use-case description
3. User-selected priorities
4. Model characteristics such as access method, modality, and context window

Scores are comparative product guidance, not clinical, legal, financial, or
regulatory validation. Evidence links should be reviewed before a model is used
in a consequential workflow.

## Updating the catalog

Add or revise models in `app/model-atlas/catalog.ts`, using the `Model` contract
from `app/model-atlas/types.ts`. Each factual capability claim should include a
first-party source when available. Update domain metadata in
`app/model-atlas/domains.ts` and ranking rules in
`app/model-atlas/recommendation.ts`.

## Deployment

The project is deployed on Vercel as a public Next.js application.

- Pull requests and pushes run formatting, lint, build, and production-render
  checks through GitHub Actions.
- Vercel creates preview deployments for branches and automatically promotes
  successful `main` deployments to production through its Git integration.
- No application authentication or deployment password is required to visit the
  production URL.

Vercel configuration lives in `vercel.json`, and the CI definition lives in
`.github/workflows/ci.yml`.
