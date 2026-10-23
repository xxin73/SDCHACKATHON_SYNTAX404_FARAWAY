# Personal and organisation workflow revision

## Behaviour

- Fresh personal journeys keep career targets, learning selections and progress empty until the user enters data. Dashboard suggestions do not initialise a saved plan. Account hydration also clears legacy plan defaults only for an otherwise untouched profile.
- Two or more job durations must add up to the entered total. Single-role duration and total remain synchronised. Inputs accept up to 99 years; numeric state avoids leading-zero strings. Next-step navigation scrolls to the top.
- Personal analysis contains a horizontal paired skill chart with previous/current and current/future modes, two vertical source charts and an averaged-current/future chart with local moderate/rapid controls. Skill history compares O*NET 30.3 and 31.0 importance values, not annual vacancy demand. Current/future skill targets are Faraway planning assumptions. Job charts require comparable dated observations; missing data is not zero. Future posting bars require a validated AI scenario assumption and matching source averages. AI growth assumptions are explicitly hypothetical, bounded to -100..200 percent and not verified forecasts.
- Interest browsing and matching includes Chemical Engineers. The frontend catalogue contains 952 career entries (910 O*NET source occupations plus existing curated pathways) and 1,302 learning entries, including 1,175 source-linked Microsoft Learn modules. O*NET 31.0 US occupation information is not Malaysian licensing or hiring evidence. Curated interest links and practice targets are not official crosswalks.
- Microsoft metadata uses the public catalogue response from https://learn.microsoft.com/api/catalog/?type=modules&locale=en-us, retrieved 2026-10-24. Native module durations are used. Authored practice outlines have explicitly estimated hours. No copied external course content is hosted. Paid resource directories have variable prices that must be checked at the provider; no invented paid prices are inserted.
- C++ has matching learning content under all budget preferences, free LearnCpp/documentation references and optional structured-course comparison links. Cost preferences curate resources without removing the selected skill. Optional purchases are excluded from confirmed module costs until priced.
- HR/University data remains under the existing browser workspace key. Teams/cohorts are optional. CSV templates accept 0–5 and distinguish zero from blank/unassessed. Student CSVs use Study year and Academic programme terminology. Custom typed skills are validated and can be rated immediately.
- Organisation analysis has job-readiness and skill-gap summary cards, a role competency/SDG/person-detail view, and a team/cohort heatmap plus skill-detail table. Unassessed/non-applicable gaps are N/A and excluded from averages. The old People behind the numbers panel and global scenario switch were removed. Scenario controls are local to the relevant analysis or planning view.
- Separate skill-based and people-based planners provide participant selection, gap review, preferences, resource/module selection and recalculated review/outcomes. Budget is per participant. Confirmation writes assignments to the existing workspace and avoids duplicate course/person enrolments. Skill and person progress tabs update the same assignment records and per-activity completion, without changing skill ratings.

## Database and AI activation

Website deployment does not deploy Supabase. After the GitHub/Vercel update:

1. Run `Faraway/supabase/005_expanded_catalogue.sql` in Supabase SQL Editor. It creates a new immutable catalogue version from the current catalogue plus the imported records. Existing ESCO rows, personal profiles, AI runs and learning progress are preserved. It does not seed sample users. The script is transactional, rerunnable and keeps one current catalogue.
2. Deploy `Faraway/supabase/deploy-faraway-recommendations.ts` as the `index.ts` of the existing `faraway-recommendations` Edge Function. The bundle is about 32 KB: occupation/course data now stays in the database instead of being embedded in the function. Existing secrets remain valid.
3. Reload the website. Catalogue version and calculation checks prevent old AI output being presented as newly generated results.

Source snapshots: `artifacts/faraway/src/data/expanded-catalogue.json` and `skill-history.json`. The database script includes the matching rows. Source metadata and native skill concepts are preserved. Provider prices, optional certificates and cloud-lab costs require checking before purchase or use.

No permitted live JobStreet/Indeed historical feed has been configured. A URL alone does not provide dated counts. Existing dated CSV observations can feed the source charts and the AI scenario request; the application labels them as user-imported and unverified. Missing observations remain blank, rather than being synthesised by AI.

## Verification

38 deterministic and mocked-provider handler tests; TypeScript and production build; PostgreSQL-compatible migration execution and idempotency with existing-reference preservation; browser tests covering fresh dashboard, experience sum validation, scroll reset, Chemical Engineer search, chart modes, C++ budget resources, optional teams, zero CSV ratings, custom skill entry, both analysis detail routes, both planning routes, persisted completion and university terminology. Live Gemini and Supabase deployment are not verified without project access. The cleaned supplied image is a visual reference only; all interfaces are live code.
