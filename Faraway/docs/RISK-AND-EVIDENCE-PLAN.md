# Faraway — hardest risk, evidence and fallback

## Presentation statement

“Our hardest risk is trustworthy, refreshable occupation-level trend data. An occupation skills database is not a vacancy time series. We show source, publication date, observation period and geography separately, keep measured observations separate from hypothetical AI scenarios, and show N/A when history or a mapping is absent. If an upstream service fails, we retain the last dated validated snapshot and do not let AI manufacture replacement counts.”

This is a proposed operating plan with implemented guardrails, not a claim that every recommended feed is already integrated.

## Owners and acceptance criteria

Assign named teammates to these roles before submission; do not claim unnamed owners are already assigned.

| Risk / owner role | Prevention and test | Trigger and fallback |
| --- | --- | --- |
| Hardest: reliable trend evidence / data lead | Store source URL, publication and observation dates, geography, units, release version and retrieval time. Validate numeric fields and occupation codes; compare like periods. | Fetch/schema/mapping failure: keep last validated snapshot and its original date. Missing history stays N/A. No invented counts. |
| Cross-country or occupation mismatch / matching lead | SOC/O*NET/MASCO/ISCO mappings need review, explicit coverage and analogue labels. Do not allocate broad-group counts to individual jobs. | No reviewed mapping: show source group only or omit the role-level number. Never average US and Malaysian employment. |
| AI invents roles, courses, SDG targets or facts / AI lead | Catalogue IDs, module coverage and bounded output validation; SDG target allowlist. Test invented IDs, malformed responses and provider errors. | Reject output and show a retry/error or retain the previous saved plan. Deterministic matching still works. |
| Identity discrimination / QA lead | Counterfactual audit changes synthetic age, gender, names, school and family-background labels with skills, interests and experience fixed. Require identical ranks/scores. No real demographic collection in this feature. | Any difference blocks release and triggers input/proxy review. Passing this check is not proof of demographic/outcome fairness. |
| Proxy bias / product lead | Review experience weighting, self-rating uncertainty, language, catalogue coverage, qualification assumptions and access to free learning. Human review of AI wording and representative occupations. | Label missing assessments and limitations. Offer editable assessments, free resources and user correction. Broader outcome audits require consented, suitably protected evaluation data. |
| Paid prices or links become inaccurate / learning lead | Paid fees are provider quotes entered by users, with HTTPS links and budget checks; course hours and extra purchases are distinguished. | Unknown fee stays unknown, never labelled free. Keep a free learning route when available. |
| Provider outage or quota / AI lead | Authenticated request reservations, quota limits, cached runs and validation of provider output. | Show quota/error clearly. Keep catalogue comparisons and existing learning progress usable. |

## Source recommendation and update plan (checked 24 October 2026)

- **Malaysia demand:** DOSM Job Market Insights Q2 2026, released **18 August 2026**. Official quarterly online job-offering evidence with limited coverage, not every vacancy. Review new releases quarterly; a report is not automatically a downloadable full occupation time series. https://www.dosm.gov.my/portal-main/release-content/big-data-analytics-job-market-insights-q22026
- **International employment history:** BLS OEWS May 2025 estimates, released **15 May 2026**, with archived annual tables. These are employment estimates, not job-ad counts; review classification and methodological comparability between releases. Keep OEWS history separate from the Employment Projections baseline when coverage differs. https://www.bls.gov/oes/tables.htm
- **Detailed international occupation outlook:** BLS 2025–2035 Employment Projections, released **27 August 2026**. Downloadable US occupation employment/projections. Future baseline is a ten-year projection, not a current-year observation. O*NET-to-SOC aggregation and crosswalk review are required; do not duplicate SOC totals across O*NET suboccupations. Review annually. https://www.bls.gov/emp/data/occupational-data.htm
- **AI exposure:** ILO Working Paper 140, **20 May 2025**, task-based GenAI exposure. This provides evidence for scenario context, not probability of job loss. Review subsequent research editions; do not fabricate an annual refresh schedule for a research paper. https://www.ilo.org/publications/generative-ai-and-jobs-refined-global-index-occupational-exposure
- **Skill structure:** O*NET 31.0, **August 2026**, already used for source-linked skills. Importance is not vacancy volume, proficiency or Malaysian demand. Review each database release. https://www.onetcenter.org/database.html
- **Alternative Malaysian/international employment history:** ILOSTAT bulk/SDMX, with observation year and source version recorded per downloaded series. Frequency and occupational granularity vary; latest year must be checked in each series rather than guessed. https://ilostat.ilo.org/data/bulk/

Proposed ingestion: fetch/download → retain raw snapshot/checksum → validate schema and dates → review code mappings and coverage → compare previous release → publish immutable version → display original dates. Quarterly sources older than two expected release cycles, annual sources older than eighteen months, or metadata missing a period are flagged for review. These are team monitoring rules, not official publisher SLAs. This release adds references and checks; it does not install an automatic refresh job or import new BLS/DOSM/ILO series.

## Fairness evidence and limits

The Evidence page includes an executable synthetic identity-invariance check over every catalogue stream. It tests the actual deterministic scoring input pipeline, with all catalogue ranks compared. Changing education/name/background fields while job-relevant experience and skill ratings stay fixed must not change outputs.

Relevant experience can correlate with age and access to opportunity, so excluding an age field alone does not establish fairness. A future consented evaluation should examine recommendation quality, coverage, score distributions and top-k opportunities across groups, alongside human review. Do not use protected attributes to rank people or disclose them to the model. Do not present this as a certified hiring fairness tool.

Framework reference: NIST AI RMF 1.0, 26 January 2023, https://www.nist.gov/itl/ai-risk-management-framework

## SDG target detail

Official targets are allowlisted from the UN 2030 Agenda (adopted 25 September 2015; checked 24 October 2026). The app’s skill/career links are interpretations, not UN endorsements or verified achievements.

Relevant examples: technical upskilling → **4.4**; innovation/productivity → **8.2**; decent work/equal pay → **8.5**; legal access → **16.3**. **4.2** concerns early childhood/pre-primary education, so it is only suggested in that context. **8.1** concerns macroeconomic growth; completing a course cannot prove that outcome. Targets (e.g. 4.4) are distinct from statistical indicators (e.g. 4.4.1).

UN target reference: https://sdgs.un.org/2030agenda

## UI changes in this release

The radar always has six axes. Unused or unassessed axes show N/A and do not become zero-rated skills. More than six real skills use pages. Job details include assessed profile skills alongside the role benchmark, with additional profile skills labelled as outside the benchmark. An Add/edit profile skills link returns to assessment. HR/University overview has no trend panels; analysis begins with department-filtered trends.

No catalogue SQL is required. Deploy the updated Edge Function bundle to activate target-aware AI stories; deterministic target details and UI fixes work in the website deployment.

## Validation evidence

56 automated tests cover existing workflows, identity-invariance scoring, N/A radar axes, preserving extra profile skills, target selection and rejection of invented SDG target codes. Browser checks cover personal/organisation radar views, SDG target details, chart placement, the visible fairness check and mobile job details. Live Gemini wording requires the separate Edge Function deployment and is not claimed as a completed demographic fairness audit.
