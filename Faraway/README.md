# Faraway — Career & Workforce Compass

A working browser-based hackathon prototype for career exploration and reskilling. It keeps the visual style of the supplied Faraway app and implements the personal, HR-manager, and university/TVET workflows from the three supplied slide decks.

## Individual accounts

Email/password accounts and private personal profile/skill storage now use Supabase. Follow [SUPABASE_SETUP.md](SUPABASE_SETUP.md) before using real accounts. The demo, organisation workflow and rules-based engine remain local.

## Try the app

Choose **Explore the demo**, then **Personal** or **Organization**. Organization contains separate **HR & workforce** and **University & TVET** workspaces. Enter your own demonstration records or load eight fictional people.

### Personal journey

1. Explore pathway → choose interests, enter details or upload a TXT CV, review education and rate skills.
2. Skill analysis → compare illustrative AI scenarios and career matches.
3. Select a career → inspect skill gaps, radar and SDG relevance, or reassess a skill.
4. Study plan → set preferences and choose skills. The app shows missing course matches instead of silently bypassing preferences.
5. Save the plan → tick learning tasks. Progress is saved per target and course. A course covering multiple skills is counted once.
6. Reassess skills to update the match. Completing tasks never automatically proves proficiency.

### Organisation journey

1. Name the organisation and add employees/students manually or import a CSV.
2. Set a target career and self-rated skill levels for each person.
3. Inspect the group heatmap. Click a cell to inspect the people and target levels behind the average.
4. Choose skill-based or people-based planning, participants, modules, budget and study-time capacity.
5. Review and assign. Duplicate enrolments are skipped, and over-budget, over-capacity or missing-course plans are blocked.
6. Tick each person's course completion, filter results and export people or a progress report.

## What is real in this version?

- Working navigation, forms, calculations, CSV import validation, scenario switches, plan assignment, local persistence, checklist completion, search/filtering and exports.
- A TXT keyword/contact parser that operates locally. Detected skills start at beginner level for review; it is not an AI assessment.
- A rules-based explanation and weekly-outline engine. It makes no network requests to an AI model.
- An evidence CSV importer that changes the market-fit component of personal rankings. Open **Evidence & sources** for the template, formula and source dates.

## Demonstration boundaries

- **Explore the demo** uses a local demo identity, not secure authentication. Real individual accounts use Supabase email/password authentication. Google OAuth and organisation accounts are not connected. The hosted preview may have a separate owner-access gate supplied by its hosting platform.
- Signed-in individual profiles, skill assessments, plans and progress are stored privately in Supabase. Demo and organisation records stay in browser localStorage and are not shared across devices. Use fictional/anonymised people for demonstrations. Downloads are exports, not cloud backups.
- Job-market charts, future scenarios, salaries, course listings, provider names, ratings, prices and study hours are illustrative. They are not scraped JobStreet/LinkedIn data or verified education offers. No courses are represented as verified HRD Corp claimable.
- A plan assignment does not enrol a person with an external course provider, and the sample courses do not contain a full learning platform.
- There is no automatic trend crawler, scheduled refresh, model retraining or Runpod connection. Evidence updates are manually imported CSV snapshots.
- PDF and DOCX CV processing is not connected; use TXT or manual entry.
- SDG labels show potential relevance, not verified social impact.

## Transparent calculations

Personal match = 100 × (0.65 skill fit + 0.15 interest fit + 0.10 experience fit + 0.10 market fit). See `artifacts/faraway/src/lib/match.ts` for the exact component calculations. The result is a planning heuristic, not an employment probability.

The moderate scenario uses the base requirements. The rapid scenario raises required AI Tools, Python, SQL, Machine Learning, Data Visualisation and Cloud Computing by one level, capped at five. This explicit assumption is consistent across personal and organisation views.

Heatmap cells average `max(target − rating, 0)` only for people whose selected career requires that skill. An unassessed skill counts as zero for the planning estimate. A dash means the skill is not required by anyone in the cell.

Imported market fit = career posting count ÷ largest count in that snapshot. Careers missing from the snapshot keep their illustrative scenario index. Replacing the file recomputes rankings without altering profiles or completion records. Use comparable geography and collection windows; the importer validates format, not source truth.

## Run and edit

The project retains the provided pnpm workspace layout. Node 24 was used for verification.

```sh
pnpm install --frozen-lockfile
pnpm exec tsc --build lib/api-client-react
pnpm dev
```

The frontend lives in `artifacts/faraway/src`. `pnpm build` creates `dist/`. Static hosting must serve `index.html` for browser routes such as `/organization` and `/jobs/data-analyst`.

```sh
pnpm exec tsc --build lib/api-client-react
pnpm --filter @workspace/faraway typecheck
pnpm check:logic
pnpm check:auth
pnpm check:browser
pnpm build
```

A retained API-server scaffold exists from the supplied ZIP, but this version does not start or require it. The frontend's local engine is `artifacts/faraway/src/lib/local-engine.ts`.

## Before a real launch or final hackathon claim

Complete and verify the Supabase setup for individual accounts; organisation authentication and shared data remain future work. Add the required live AI endpoint through a server-side adapter, use a permitted updatable data source, verify course/resource offers and salary evidence, and test the live integrations. Never place API secrets in frontend code or GitHub. Confirm the committee's exact requirements and licence/attribution requirements for all retained source and assets before submission.

## Mobile interface

The same site adapts to phone screens with labelled bottom navigation, people cards, compact skill-gap tiles, larger touch controls and a full-screen assessment panel. On desktop, open `/mobile-preview.html` for an interactive phone-sized view. Both layouts use the same actions and browser data; this is a mobile web interface, not an app-store download.
