# Individual AI recommendations — practice deployment

This implementation is on the `ai-individual-flow` Git branch. Do not merge it
into production until the SQL migration and Edge Function are deployed. The
existing Vercel `main` deployment remains available during setup.

## What changes

The existing personal screens retain their layout. Users confirm the Summary
step in Explore pathway, see deterministic ranked careers and skill gaps, ask
Gemini to explain a career, choose catalogue courses/preferences, generate an
ordered learning plan, and activate the saved revision. Profile edits invalidate
confirmation and stale generated results are not presented as current.

Scores, gaps, course eligibility, deduplication, prices, hours, duration and
completion are ordinary code. AI writes explanations and orders already-selected
course IDs. Unknown/duplicate/missing course IDs and disallowed claims are
rejected; there is no silent demo fallback. Cached output retains its original
generation date. Rankings use baseline requirements; existing future scenario
charts are labelled illustrative and are excluded from AI prompts. The existing
10% market-fit component is explicitly labelled an illustrative fixture.

The catalogue is seeded from existing source fixtures into Supabase. This is a
practice catalogue, not a list of verified provider offers or verified market
evidence. It has no observation date; generated results say so. Market-source
verification, new forecasts, CV scanning and organisation AI are out of scope.

## 1. Run the additive migration

In your Supabase project, open **SQL Editor → New query**. Paste the entire
contents of `supabase/002_ai_recommendations.sql`, then click **Run**.

Run this after the existing `001_personal_auth.sql`. The new migration creates
the catalogue, saved recommendation/plan revisions, request budgets, active-plan
pointer and activity-completion table. It includes the catalogue seed at the
end. Existing personal profiles, skill assessments and progress are not deleted.
It is tested for repeat execution.

Private results and completion use RLS. Clients can read their own generated
results but cannot insert or edit generated results or request-budget records.
Only the server can write those. Activation checks plan ownership and that the
profile/preferences still match. Activity completion is independent of plan
revision. Legacy completion is copied for matching activities on activation;
the original legacy history is retained. A changed course-content version does
not automatically inherit completion for different learning content.

## 2. Deploy the Edge Function

Secrets already requested in **Edge Functions → Secrets**:

* `GEMINI_API_KEY`: personal Gemini API key (never in Git, chat or Vercel `VITE_` variables).
* `GEMINI_MODEL`: `gemini-2.5-flash`, subject to your project's actual model access.

The deployed function also uses Supabase's built-in `SUPABASE_URL`,
`SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY`. Do not put the service-role
key in the frontend. The server verifies every supplied Bearer token through
Supabase Auth `/user`; it does not trust an unverified decoded user ID.

For the Dashboard editor, open **Edge Functions → Functions → Deploy a new
function → Via Editor** (or **Open Editor**). Name the function exactly
`faraway-recommendations`. Replace the example code with the full contents of
`supabase/deploy-faraway-recommendations.ts`, then deploy. That generated file
is self-contained and needs no extra editor imports.

Our handler performs authentication itself to support modern Supabase JWT
signing keys. Disable the function's legacy **Verify JWT** gateway setting
if the Dashboard exposes it; this corresponds to `verify_jwt = false` in
`supabase/config.toml`. Authentication remains enforced by the function.
Anonymous callers receive HTTP 401. This does not make the AI API public.

For a developer with an authenticated Supabase CLI, the equivalent is:

```sh
supabase functions deploy faraway-recommendations \
  --project-ref txsgreryqmxrrpefbfua --no-verify-jwt
```

Do not test by pasting a service-role token into a public browser tool. A real
signed-in Faraway session is used for end-to-end testing.

## 3. Activate the website changes

After the migration and function deployment, merge `ai-individual-flow` into
`main` to trigger the existing Vercel production deployment. Its two existing
`VITE_SUPABASE_...` settings stay the same. No Gemini key belongs in Vercel.

The function's default permitted browser origin is
`https://faraway-practice-faraway.vercel.app` (plus localhost port 4173 for local
development). To test a Vercel branch preview, add an Edge Function secret
`ALLOWED_ORIGINS` containing the exact production and preview origins separated
by commas. This is a CORS restriction, not a replacement for authentication.

## Limits, errors and practice data

The selected model's screenshot showed 5 requests/minute and 20/day. The
database applies a smaller shared project budget of 4/minute and 18/UTC day,
plus 2/minute and 8/day per user, with one active generation per user. These
are durable atomic counters, not per-process memory. Failed attempts count.
Usage outside Faraway shares the provider's quota and can still cause HTTP 429.
There is no automatic paid-provider/model fallback or automatic retry loop.

Input is restricted to a small action/hash request. The server reloads saved,
confirmed profile data and checks that the input hashes match. It sends Gemini
only self-reported skills, computed gaps, necessary role titles and approved
course IDs/skills. It omits names, emails, locations, CVs, employment history
and free-text summaries. Free-tier provider data-use terms still apply: use
fictional practice profiles until those terms are accepted for real learners.

Provider calls time out after 35 seconds and output is capped. Quota, setup,
authentication, changed-input and provider failures have explicit messages.
Old saved plans stay active if generation fails. Saving and activating are
separate: a newly generated revision does not automatically replace the active
plan. To request genuinely new AI output, change confirmed inputs/preferences
or update the catalogue/model/prompt version; identical requests use the cache.

## Versioning and revision

Every result stores catalogue version/publication date, evidence observation
date/status, input hashes, model, prompt/calculation versions and generation
timestamp. The full private input snapshot and fixed plan activities are stored
with the result. Revisions retain previous recommendation records.

The initial catalogue is `practice-2026-10-23-v1`; its observation date is null.
Course-content versions hash the course ID, skills, hours, description and
activity definition. Metadata-only price/rating changes do not erase learning.
An updatable, verified market-source stage must add a new immutable catalogue
version, source provenance/observation dates and an explicit revision review.
This implementation does not claim that any imported evidence is verified.

## Validation

From `Faraway/`:

```sh
pnpm exec tsc --build lib/api-client-react
pnpm typecheck
pnpm typecheck:ai
pnpm check:logic
pnpm check:auth
pnpm check:browser
pnpm build:edge
pnpm build
```

`check:auth` runs the actual SQL migrations in isolated PostgreSQL/PGlite with
Supabase auth roles, tests ownership/anonymous denial, privileged counters,
cache/revision behaviour, stale inputs, output grounding and the server handler.
`check:browser` exercises the whole UI with the real Supabase SDK, shared
deterministic rules and simulated remote provider/database responses. It tests
failed AI requests, saving, completion, revision, reloading and signing in again.
It does not call Gemini or create cloud accounts. `build:edge` regenerates the
single-file Dashboard deployment artifact from the typed source.

For a future explicit fixture refresh, run
`TSX_TSCONFIG_PATH=artifacts/faraway/tsconfig.json node --import ./scripts/node_modules/tsx/dist/loader.mjs scripts/seed-recommendation-catalogue.ts`.
Publish a new version identifier rather than modifying a deployed catalogue.

Live function deployment, Gemini access and a real signed-in save/revision
round trip remain separate checks. Locally passing tests do not prove those
cloud steps have succeeded.
