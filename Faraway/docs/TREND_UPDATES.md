# Evidence updates and judging demonstration

## What updates automatically
- A public read-only `/api/trends` gateway checks BLS table 1.2, the OpenDOSM monthly labour CSV, O*NET release metadata and arXiv cs.AI. It runs without RunPod, API keys or personal data.
- Opening Analysis, Evidence, Study Plan or saved Learning Progress starts a check; the manual button uses the same service. Shared responses cache for one hour. Refresh does not fabricate new observations.
- A daily GitHub Actions workflow, plus manual workflow dispatch, refreshes the dated public snapshot for outages/static previews. Scheduled Actions can be delayed/disabled by repository settings; last-check times remain visible. The snapshot job needs the workflow's declared contents-write permission.
- Each source is independently validated. A partial outage preserves its previous validated values. Broken/empty tables do not become zero vacancies.

## Ranking and uncertainty
Personal fit stays 70% current skill fit + 20% interest + 10% experience.
Career ordering within related interests uses a separate opportunity score:
60% scenario skill readiness + 20% interest + 10% experience + 10% BLS outlook.
Market index = clamp(50 + 2 × BLS baseline employment percentage change, 0, 100).
These weights and normalization are transparent product assumptions, not validated prediction coefficients.
Moderate/rapid AI changes scenario skill targets, not official employment projections.
Missing mapped market data is N/A; the other 90% is renormalized. O*NET-SOC codes
are mapped to their base SOC for the US outlook and displayed as occupation analogues.
DOSM national totals and broad job-offering groups do not establish individual-role demand.

## Plans
The app detects a target occupation's changed employment baseline/projection against
its last plan review in this signed-in browser. It offers a gap review and deliberate
regeneration, preserving course/activity completion keys. It does not silently replace
a saved plan, charge the GPU, or invent new required skills from employment growth.
The review marker is scoped by account and run ID in local storage; a new browser
asks for a review instead of claiming synchronized evidence history.

## Remaining limits (do not overclaim)
- The DOSM job-offering quarterly bar chart remains a reviewed snapshot.
- O*NET metadata refresh detects a new release; skill charts remain the imported
  30.3/31.0 data until a reviewed skill import. Importance is not proficiency.
- arXiv publications update as dated AI research context; preprints are not peer-reviewed
  proof. Their text does not automatically become numerical hiring predictions or skill requirements.
- This is automatic evidence refresh, evidence-sensitive opportunity ranking and assisted
  plan review. It is not fully autonomous AI-driven curriculum rewriting.

## Demo
1. Open Analysis. Point to last check, source links, periods and coverage.
2. Expand a career's opportunity explanation and trace BLS base/future figures into the score.
3. Switch moderate/rapid AI. Scenario readiness and opportunity score can change;
   measured BLS values stay unchanged. Some roles are insensitive to the scenario.
4. Open Study Plan, choose the matching scenario, review changed gaps and generate only
   when ready. The GPU is used for generation, not evidence checks.
5. In GitHub Actions, inspect `Refresh public trend evidence` and its dated snapshot commits.
6. Show update tests: identical skills plus different source growth changes score;
   absent evidence is renormalized; malformed tables are rejected.

## Hardest risk and fallback
Reliable current, geographically appropriate occupation signals are the hardest risk.
Use primary sources with explicit dates, country and units; limit BLS to an explained
US analogue; use dated cached evidence during outages and mark missing coverage N/A.
Newspapers and AI outputs cannot supply missing measured vacancy statistics.
