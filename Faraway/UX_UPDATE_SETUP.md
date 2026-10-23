# Profile, scenarios and learning-flow update

The website changes deploy through Vercel after the GitHub update. New learning preferences and future-plan targets also need the updated Supabase function.

## One required server action

1. Open `supabase/deploy-faraway-recommendations.ts` in this repository and copy the entire raw file.
2. In Supabase: Edge Functions → `faraway-recommendations` → Code → `index.ts`.
3. Replace its contents with that complete bundled file, then **Deploy updates** and confirm.
4. Keep your existing Gemini secrets. No SQL migration is required for this update.
5. Wait for Vercel's latest deployment to be ready and refresh the website.

The server and client must both be updated before testing new preferences. Otherwise older server code cannot validate the new preference hash.

## Behaviour

- Organisation choice immediately asks HR/employer or university/TVET. These workspaces continue to store data in the browser; they are not shared multi-user cloud organisations yet.
- Removed guest-demo entry and sample-profile controls. Existing user records are retained.
- New education starts unselected. Secondary qualifications include SPM, PT3, IGCSE/O-Level and Other; Pre-U replaces the previous Diploma option for new selections. Existing Diploma/SPM records remain readable.
- Nineteen interest areas plus custom interest/career text. Scored recommendations still use the supported career catalogue; unsupported job titles are saved as interests, not assigned fabricated requirements.
- Role duration fields have labels and update total years; users may override total years to avoid double-counting overlapping roles. Responsibilities can be scanned for catalogue skill keywords for review.
- CVs accept PDF/TXT/PNG/JPG/JPEG up to 8 MB, PDFs up to ten pages. PDF.js extracts text; scanned pages and images use English OCR. OCR downloads recognition assets on first use. File contents are processed in the browser; current parsing detects a candidate name, email and skill keywords. Education, role history, responsibilities and all proficiency levels require user review/manual entry. It is not comprehensive semantic CV parsing.
- Summary skill chips are read-only. Confirmed job-page reassessment updates ratings and stays on that career page, without invalidating confirmation or navigating to a plan.
- Skill charts use prominent Historical/Future tabs; scenario controls appear with future estimates. The lower job chart is future-only. Demand values have labels and units.
- Job radars compare personal ratings, current catalogue targets and optional future targets. Scenario skill assumption: digital skills +1 for moderate AI development or +2 for fast, maximum 5. These assumptions also drive future-plan gaps on the server. Baseline match scoring stays unchanged.
- Current versus future market metric panels explicitly mark the current baseline unavailable. No current demand/risk/growth figures have been invented.
- Learning preferences: online/in-person/hybrid/no preference, free/low ≤RM200/moderate ≤RM500/no budget limit per course. Online-only excludes non-online courses. Hybrid requires an explicitly hybrid catalogue entry; no entries are currently marked hybrid.
- HRD Corp is an employer-only extra filter. It requires a verification link in addition to a claimability flag; the current catalogue has no verified entries.
- All gaps, including low non-zero ratings, appear in recommendations with priorities. Generate → review popup → Start plan. Preference changes invalidate the old generated draft while retaining completed course history.
- Learning Progress has its own desktop/mobile navigation link. Badges derive from saved activity completion; they are not accredited qualifications.
- Progress activities link to curated resources. Resource pages are separate from the illustrative course providers, fees and time estimates. Durations render as hours/minutes.

## Validation

Production build, client/server TypeScript checks, and 19 logic/security/persistence tests pass. The browser regression script has been updated for the new flow. Live browser/PDF/OCR testing remains pending: this environment has no Chromium, and the browser download failed. Verify a text PDF and image CV on the deployed site, then generate a plan, revise preferences, start it, tick an activity and confirm progress after sign-out/sign-in.
