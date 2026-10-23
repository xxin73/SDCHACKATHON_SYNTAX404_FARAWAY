# Connect ESCO to the personal pathway

## 1. Activate the catalogue
After the previous ESCO import succeeded, open `supabase/004_esco_hexagon.sql` on GitHub. Copy the entire raw file to a new Supabase SQL Editor query and Run. If asked, choose **Run without RLS**: this migration updates the already protected recommendation catalogue and does not need the dashboard to append security commands. Existing RLS remains enabled. Expected: Success. No rows returned.

This creates catalogue version `esco-1.2.1-six-areas-v1` and makes it current atomically. It preserves the old catalogue, user profiles, skill assessments, saved recommendation runs, active plans and course completions. A second run is safe when this version remains current. It stops instead of reactivating an old version over a future catalogue. Every source relationship and available course coverage is checked before activation.

## 2. Refresh the website
After Vercel deploys the GitHub update, reload and sign in. Open Data Analyst. Its six areas are SQL, Statistics, Data Visualisation, Excel, Communication and Problem Solving. All have an explicit Faraway practice target of 3/5. Assess missing skills using the reassessment controls. The same catalogue now drives the personal assessment vocabulary, radar, ranking, gap calculation, course selection and the requirements received by the existing AI function.

The long reference list is replaced by a small source note beside the radar. Expand “Why these skills?” for the underlying source concepts and their essential/optional labels. The individual concept hyperlinks that did not resolve have been removed; the source note links to the verified ESCO download page.

## 3. Deploy the updated AI explanation prompt
The existing deployed function already reads the current catalogue, so it uses the changed numeric requirements after step 1. To also send ESCO concept labels and mapping notes to Gemini, redeploy `faraway-recommendations` from this commit:

    cd Faraway
    supabase functions deploy faraway-recommendations --project-ref txsgreryqmxrrpefbfua

Alternatively, in the Supabase dashboard open Edge Functions → faraway-recommendations → the code editor. Replace its bundled entrypoint with the complete contents of `supabase/deploy-faraway-recommendations.ts` and deploy the update. Keep the existing function JWT configuration and server secrets. Do not paste API keys into code. Use the same deployment method/configuration that worked for the original function.

After redeploying, generate a new career explanation. Its metadata should show prompt version `grounded-personal-esco-v2` and catalogue version `esco-1.2.1-six-areas-v1`. Historical saved plans remain historical; create and activate a revised plan when ready. Versioned course completions remain stored.

## Interpretation
ESCO supplies occupation–skill relationships, not an official most-important-six ranking or 0–5 proficiency levels. These five role mappings and six skill areas per role are Faraway's curated practice interpretation. Every area retains original source skill URIs and essential/optional labels. Broader tool choices such as Excel, Git & DevOps and Prototyping are explicitly documented as practical mappings rather than official equivalences. Optional skills must not be represented as mandatory requirements. This selection is a sample pathway, not a complete occupational specification. Target 3 means independent routine tasks; it is an app assumption for practice, not an employer-validated threshold.

Other careers, salaries, demand scenarios and courses remain illustrative. This snapshot does not measure rising demand and does not automatically refresh from ESCO. Gemini explains supplied skill evidence; it does not invent authoritative targets or claim to have fetched live trends.

## Checks
Production build, frontend and Edge Function TypeScript checks, existing calculation checks and all 12 tests passed locally. PostgreSQL-compatible migration tests exercised both imports, repeatability, source joins, five careers with six axes each, course coverage, score/gap agreement between UI and server, effect of a changed skill on score, and reference-table access restrictions. Existing tests cover profile ownership, AI handling and plan completion persistence. Nonfatal Vite sourcemap/chunk-size warnings remain. Live Supabase execution, updated Edge deployment and the user's hosted browser flow still need verification.
