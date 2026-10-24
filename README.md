# Faraway
### Where Possibilities Take You

A career and education compass for exploring skills, comparing possible AI futures, and turning career goals into practical learning plans.

**[Open Faraway](https://faraway-practice-faraway.vercel.app)**

Faraway brings individual learners, HR teams, and universities/TVET institutions into one platform. It combines explainable skill matching, dated public labour-market evidence, and AI-assisted explanations and learning plans.

## Hackathon submission

### Team information

| Field | Details |
| --- | --- |
| **Team Name** | Syntax 404 |
| **Team Domain** | **Domain 1: The Aiversecurity Future-ready Workforce Domain** |
| **SDG Track (1–17)** | SDG 8 – Decent Work and Economic Growth  |
| **Team Leader** | Low Xin Hui |
| **University** | Xiamen University Malaysia (XMUM) |
| **Number of Members** | 4 |

### Submission links

| Resource | Link |
| --- | --- |
| **GitHub Repository** | [xxin73/faraway-practice](https://github.com/xxin73/faraway-practice) |
| **Live Demo** | [Open Faraway](https://faraway-practice-faraway.vercel.app) |
| **RunPod Endpoint** | **TO COMPLETE — verified endpoint URL, without an API key** |
| **Slide Deck** | **TO COMPLETE — viewable pitching slide deck URL** |
| **Pitching / Demo Video** | **TO COMPLETE — viewable pitching video URL** |


## Overview

### Problem

Learners and organisations face changing skill requirements, fragmented labour-market information, and uncertainty about AI's impact on careers. A career list alone does not explain which skills to develop or how to turn a gap into a realistic learning plan.

### Solution

Faraway connects assessed skills to related career options, makes AI scenario assumptions visible, cites public evidence, and supports actionable learning plans and progress tracking. HR departments and university programmes use their own names, assessment skills, and participants' ratings to contextualise career suggestions and trend charts.

## Who it is for

| Workspace | Main journey |
| --- | --- |
| Personal | Build a profile, assess skills, explore career matches, compare AI scenarios, generate a study plan, and track learning progress. |
| HR & workforce | Set up an organisation and departments, import employee assessments, identify skill gaps, and assign and track learning. |
| University & TVET | Set up programmes and cohorts, assess students, compare career benchmarks, and monitor learning progress. |

## Key features

- **One career match score:** personal skills, interests, experience, and available market evidence contribute to the displayed score.
- **Moderate and rapid AI scenarios:** compare how assumed future skill requirements affect matching. These are exploratory scenarios, not official forecasts.
- **Skills and career analysis:** compare assessed proficiency against target requirements, with charts and gap explanations.
- **AI-assisted learning plans:** generate structured plans around skill gaps, time, budget, and online learning resources, with progress tracking.
- **SDG connections:** explain how careers and skills can contribute to Sustainable Development Goals and specific targets.
- **Department CSV import:** download a template and import people with whole-number skill ratings from 0–5. Blank ratings mean unassessed.
- **English, Simplified Chinese, and Bahasa Melayu:** language selection across the interface and catalogue; new AI explanations require the current multilingual backend deployment.
- **Responsive interface:** supports desktop and mobile layouts.

## How it works

The React frontend handles profiles, assessments, charts, and user interaction. Supabase provides authentication, personal data persistence, and the recommendation Edge Function. The Edge Function validates requests, prepares context, and calls the configured AI provider.

The intended GPU deployment is **Qwen/Qwen3-4B-Instruct-2507 through RunPod Serverless vLLM**. Provider credentials stay on the server. Gemini support remains in the source as an optional provider.

Career matching uses application rules; an AI model does not invent the match score or missing vacancy statistics. AI output is intended to explain evidence and organise learning, with validation against the application's available data.

## Data sources and update boundaries

| Source | Use | Interpretation |
| --- | --- | --- |
| [O*NET Resource Center](https://www.onetcenter.org/database.html) | Occupational knowledge, skills, and career context | US occupational evidence; release dates differ from individual survey dates. |
| [Department of Statistics Malaysia](https://open.dosm.gov.my/) | Malaysian labour-market context | Some charts use broad occupational groups rather than individual job titles. |
| [US Bureau of Labor Statistics](https://www.bls.gov/emp/) | Occupational employment projections and growth context | US projections; not Malaysian vacancies or official moderate/rapid AI forecasts. |
| [arXiv](https://arxiv.org/list/cs.AI/recent) | Dated AI research context | Research and preprints are not measured job-posting demand. |
| Learning-resource providers | Online learning options and resource links | Fees, availability, and access conditions can change. |

Consult each chart's source, reference period, and release information. A retrieval date does not mean the underlying statistics were measured that day.

### Keeping evidence updatable

The repository includes a scheduled workflow, [Refresh public trend evidence](.github/workflows/refresh-trend-evidence.yml), configured to run daily at **01:17 UTC (09:17 Malaysia time)**. It fetches and validates supported public evidence, prepares translated evidence titles on CPU, and commits a dated shared snapshot when content changes. Repository Actions permissions, successful execution, and a subsequent deployment are required for published changes.

This is a scheduled update mechanism, not a real-time vacancy feed. Reviewed occupational skill imports and some DOSM chart datasets still require maintained, reviewed updates. Source failures should retain identifiable dated evidence rather than fabricate new figures.

There is intentionally no page-opening evidence check or “Check for data updates” button. Saved AI plans are not silently rewritten: review or explicit regeneration is needed when relevant evidence changes.

## Matching and responsible AI

The personal interface combines scenario-adjusted skill readiness (60%), interests (20%), experience (10%), and available market evidence (10%). When market evidence is unavailable, its contribution is excluded and the remaining weights are normalised. See the matching implementation for exact behaviour in each workspace; backend recommendation ranking and organisational readiness are separate implementation paths.

The scenario toggle changes assumed skill requirements. Some careers or fully prepared profiles may retain the same score. Faraway must not manufacture changes simply to make the chart move.

Age, gender, and protected background characteristics should not determine career suitability. This is a design principle, not a claim of completed independent fairness certification. Formal counterfactual and subgroup evaluation remains further work. Recommendations support human decisions and do not guarantee employment, course quality, or outcomes.

## Hardest risk and fallback

**Hardest risk: keeping market evidence reliable, current, and correctly matched to a career.**

- Show the source, dates, country, and level of occupational detail.
- Distinguish observed statistics, official projections, and application AI scenarios.
- Use dated snapshots when supported live retrieval fails; show unavailable evidence honestly.
- Keep unverified or unmatched data out of numerical claims.
- Validate AI responses and restrict resource/job references to available catalogue context.
- Preserve saved progress when users explicitly regenerate a plan.

A secondary risk is serverless cold-start latency and limited GPU credit. Use cached eligible results, bounded generation, and explicit user-triggered requests; avoid automatic retries that can duplicate GPU work.

## Technology

React · TypeScript · Vite · Tailwind CSS · Wouter · Framer Motion · Recharts · Supabase Auth/PostgreSQL/Edge Functions · RunPod Serverless/vLLM · GitHub Actions · Vercel

## Repository layout

```text
Faraway/
  artifacts/faraway/          Frontend application
    src/                     Pages, components, matching, and translations
    public/                  Static assets and shared evidence snapshot
  supabase/                  SQL migrations and Edge Functions
  scripts/                   Validation and evidence-update scripts
  api/                       Hosting API handlers
.github/workflows/           Scheduled evidence workflow
```

## Run locally

### 1. Install dependencies

Use Node.js and pnpm. This repository uses pnpm workspaces and catalogue dependencies; do not substitute npm install.

```sh
git clone https://github.com/xxin73/faraway-practice.git
cd faraway-practice/Faraway
pnpm install --frozen-lockfile
pnpm exec tsc --build lib/api-client-react
```

### 2. Configure the frontend

Create `Faraway/artifacts/faraway/.env.local`:

```dotenv
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
```

Use the exact `VITE_` prefix. Never expose a service-role key, database password, or RunPod API key in frontend variables. Local environment files should remain outside Git.

```sh
pnpm dev
```

The default local port is 4173. Restart after changing environment variables.

### 3. Configure Supabase

Apply the required SQL migrations from `Faraway/supabase/` in their documented order. Preserve Row Level Security and account ownership checks. Start with [SUPABASE_SETUP.md](Faraway/SUPABASE_SETUP.md) for personal authentication; that guide describes the initial setup and predates later AI additions.

Enable email authentication and configure the actual local/hosted redirect URLs. Email confirmation may be required before first login.

### 4. Configure AI on the server

Set these **Supabase Edge Function secrets**, using your own deployment:

```dotenv
AI_PROVIDER=runpod
RUNPOD_API_KEY=your-server-api-key
RUNPOD_ENDPOINT_ID=your-endpoint-id
RUNPOD_MODEL=Qwen/Qwen3-4B-Instruct-2507
```

Deploy from the `Faraway/` directory:

```sh
npx supabase login
npx supabase functions deploy faraway-recommendations --project-ref YOUR_PROJECT_REF
```

Alternatively, the generated `Faraway/supabase/deploy-faraway-recommendations.ts` bundle can be deployed through the Supabase function editor. Deploying the frontend does not deploy this function.

For a low-traffic demo, the budget configuration used is active workers 0, maximum workers 1, one GPU per worker, and a short idle timeout. Cold starts can be slow. GPU startup, processing, and billable idle time can consume credit; review RunPod's actual worker and billing state.

## Vercel and Replit configuration

**Vercel:** use the existing frontend project with `Faraway` as its root, build using `pnpm build`, and publish `dist`. Add the two frontend variables to the relevant deployment environments, then rebuild. Preserve API handlers and SPA route fallback configuration.

**Replit:** add the same two `VITE_` variables in Secrets before starting the frontend. Stop and restart after changes. A published app also needs rebuilding/republishing.

GitHub synchronises source code, not another platform's secrets. Importing this repository into a friend's account does not copy Vercel settings or Supabase server secrets.

### Missing Supabase configuration error

If the login page says to add `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`:

1. Verify both names and values in the environment running that copy.
2. Restart the Vite process, or rebuild the published frontend.
3. Confirm you opened the deployment that received those settings.
4. Check the frontend startup/build process receives the variables.

The error occurs before credential validation; changing the login password will not fix missing build configuration.

## Validation

From `Faraway/`, available project checks include:

```sh
pnpm typecheck
pnpm check:logic
pnpm check:auth
pnpm check:browser
pnpm typecheck:ai
pnpm build
```

Some checks require additional script dependencies or Chromium; consult their scripts and setup documentation. Mocked checks do not prove the deployed database policies, email delivery, or GPU endpoint work. Perform a real sign-up/sign-in and one controlled AI request before a demo.

## Suggested demo

1. Create a personal account and assess several skills.
2. Open Analysis and inspect a career's score, evidence, skill gaps, and SDG targets.
3. Switch between moderate and rapid AI development.
4. Generate a study plan and mark a learning activity complete.
5. Open HR or University & TVET, configure a department/programme, and import its CSV.
6. Compare assessed skills against benchmarks and track assigned learning.

Use synthetic people in demonstrations. For CSVs, keep each rating under a named skill column, save the edited file as CSV UTF-8, and import the saved file. Blank unused columns are ignored; unnamed columns containing data are rejected.

## Current limitations

- Organisation workspaces use account-scoped browser storage; do not assume cross-device synchronisation.
- Public evidence is periodic and geographically mixed, not universal real-time job-posting coverage.
- Reviewed catalogue and chart updates are not all fully automated.
- Multilingual AI prose depends on the deployed Edge Function; old saved prose may remain in its original language.
- Paid-resource amounts are indicative snapshots/quotes, not guaranteed checkout prices.
- An AI provider failure must be reported; it should not be disguised as a successful generated plan.
- Formal fairness auditing and broader device/accessibility validation remain further work.

## Acknowledgements

Faraway uses public occupational and labour-market sources and AI-assisted development/content workflows. Source datasets and linked resources retain their respective terms. No affiliation or endorsement by O*NET, DOSM, BLS, arXiv, or course providers is implied.
