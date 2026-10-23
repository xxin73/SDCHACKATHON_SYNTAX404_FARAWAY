# Faraway

AI-driven career & education compass for Malaysian graduates, at-risk workers and organisations: skill profile (AI CV scan), skill/job trends under moderate vs fast AI adoption, match scores with UN SDG links, and personalised study plans with progress.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `AI_INTEGRATIONS_OPENAI_BASE_URL`, `AI_INTEGRATIONS_OPENAI_API_KEY` (auto-provisioned by Replit AI Integrations). No database is used.

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/faraway` — the web app (React + Vite + Tailwind + Framer Motion). Pages in `src/pages`, shared visuals (spectrum icons, radar, charts, shell) in `src/components`.
- `artifacts/faraway/src/data/careers.ts`, `courses.ts` — all career, skill-trend, job-trend and SDG content.
- `artifacts/faraway/src/lib/store.ts` (localStorage state), `match.ts` (match score + course selection).
- `artifacts/api-server/src/routes/ai.ts` — AI endpoints (`/api/ai/parse-cv`, `/career-insight`, `/study-plan`); `src/lib/cv-text.ts` extracts PDF/DOCX text.
- `lib/api-spec/openapi.yaml` — API contract; `attached_assets/faraway-layout-spec.md` — screen layout from the user's PPTX.

## Architecture decisions

- All user data lives in the browser (localStorage); auth is demo-only, like the original app. Only the AI features hit the server.
- AI uses Replit AI Integrations (OpenAI, model gpt-5.4-mini, JSON output); server coerces model output before Zod validation.
- Match Score = 100 × (0.65 Skill + 0.15 Interest + 0.10 Experience + 0.10 Market).

## Product

Login/signup/mode choice, Workspace dashboard, Explore Pathway (CV scan + skills radar), Skill Analysis (flip charts, two job-trend sources, job cards), Job detail with SDG panels and AI insight, Study plan (AI), Learning progress with badges, Organization view.

## User preferences

- Strictly follow the PPTX layout/section flow; the SDG section must be fully retained.
- Brand slogan (exact): "Where Possibilities Take You."
- Visual style: subtle glass-like 3D surfaces with iridescent rims, rainbow micro-mosaic texture (background light field + glass cards), futuristic headings (Rajdhani); pure white, faint drifting pastel aurora, flowing rainbow-stroke icons, mouse-reactive glass depth, particle/spectrum-scan AI animations.

## Gotchas

- After adding a lib package reference, run `pnpm run typecheck:libs` before typechecking an artifact (TS6305 otherwise).
- `unpdf` and `mammoth` are marked external in `artifacts/api-server/build.mjs`.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
