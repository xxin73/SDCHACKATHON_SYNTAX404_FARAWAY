# Technical skills and workspace consistency update

The 952-career / 1,302-learning-entry catalogue already imported in Supabase remains in place. **Do not rerun the catalogue SQL.**

## Activate the AI changes

After the website deploys, replace the complete `index.ts` in the existing Supabase `faraway-recommendations` Edge Function with `Faraway/supabase/deploy-faraway-recommendations.ts`, then Deploy updates. Keep existing Gemini secrets. The bundle is about 37 KB and contains code, not the occupation dataset.

The website changes work without another SQL migration. Updated server code is required for hard-skill-consistent AI scoring, saved paid-resource quotes and on-demand SDG stories. Old AI match results are invalidated by a new calculation version; existing completion records remain.

## Behaviour

- Default career requirements and suggestions emphasise technical/domain skills. Generic communication, listening and other transferable skills are removed from default requirements where technical requirements exist. Existing explicitly entered ratings remain available to the user. Removing an assessment skill records an exclusion; manually adding it again restores it. Removal does not rewrite an occupation’s evidence requirements.
- Assessment suggestions use selected careers instead of the union of an entire interest area. C++ is a required practice area only in the Software Developers source profile; generic programming is never treated as proof of C++ ability. The Other career field accepts Enter or Save interest, selects an exact supported career (singular/plural matching), and clearly labels unsupported interests as saved profile notes.
- Shared exact skill aliases and case/whitespace normalisation reconcile CSV/manual ratings with readiness, gap tables and radar averages. Generic programming is not an alias for a particular language. Explicit zero is assessed; missing ratings are unassessed. Editors canonicalise duplicate spellings so lowering a rating works. Explicit role benchmark selections are preserved.
- Personal, HR and university plans offer online resources only. Free practice remains available regardless of paid resource availability. Users can choose paid learning for the same skill, follow provider links and save the selected HTTPS course URL and provider quote in RM. Shared resource URLs are counted once per person. Quotes are user-entered, not independently verified prices; free trials do not imply free certificates. Backend validation enforces budgets and saves resource quotes into the immutable generated plan. Practice-outline hours do not represent the purchased course duration; Faraway does not enrol users with providers.
- HR/university analysis includes the same local skill and occupation comparison charts as personal analysis, scoped to department/programme. Overview charts follow company industry or academic programmes, retaining explicitly assigned career benchmarks. No unrelated software fallback is used. Institution type is University or TVET.
- Organisation career details reuse the personal SDG hover/tap pattern. On-demand Gemini stories describe a concrete project and potential beneficiary for each role/skill. Catalogue inputs, output labels, lengths and SDG mappings are validated. The existing authenticated reservation/quota and run lease protect this endpoint; no personal-profile completion is required for an HR user. Stories are ideas, not measured outcomes, endorsements, qualifications or job promises. Cached role stories do not contain employee personal data.

## Trend methodology and coverage

The default charts use O*NET occupational references, **not JobStreet or Indeed vacancy measurements**:

1. Skill history compares importance in O*NET releases 30.3 and 31.0. These are release snapshots, not a universal annual time series.
2. Occupation reference index = mean importance of the selected technical source concepts × 20, on a 0–100 scale. Curated careers use documented-in-code occupational analogues. Current values cover 952 entries; previous values cover 933. Newly available/missing historical observations remain N/A.
3. Future sensitivity index = current index × [1 + 0.25 × (scenario proficiency-target sum / current proficiency-target sum − 1)], capped at 100. Selected technical skills receive +1 moderate / +2 rapid target levels capped at 5. These are transparent planning assumptions, not measured skill demand or predicted hiring. A plateau at the cap is possible.
4. The separate JobStreet/Indeed view preserves imported comparable dated snapshots and missing-data markers. Future posting bars require matching source baselines and a bounded AI assumption. Neither another model nor this formula can create observed historical vacancy counts. A permitted dated vacancy dataset/API is still required for actual Malaysian hiring charts.

O*NET scale reference: https://www.onetonline.org/help/online/scales
Paid certificate / preview distinction: https://www.coursera.support/s/article/learner-000002293?language=en_US
C++ paid learning example: https://www.coursera.org/specializations/coding-for-everyone

## Validation

49 deterministic and mocked-provider tests cover mappings, prices, budgets, history, industry context, existing workflows and the authenticated SDG endpoint. TypeScript, production build and browser checks cover personal skills, Other career, resource pricing, HR live rating propagation, SDG interaction, academic terminology and responsive analysis. Live Gemini requests require the separate Supabase function deployment and project secrets.
