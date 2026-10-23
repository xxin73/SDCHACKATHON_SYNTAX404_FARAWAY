# ESCO reference import

## One action in Supabase
Open SQL Editor, start a new query, paste the entire contents of supabase/003_esco_reference.sql, and Run. Expected: Success. No rows returned. No API key or extra account is needed. This adds a read-only reference table and imports all five mapped occupations in one transaction. Existing profiles, skills, recommendation catalogues and plans are preserved. Rerunning the file updates the same records without duplicates.

## Check it
After Vercel deploys this commit, sign in and open Data Analyst, Software Engineer, Cloud Engineer, Financial Analyst, or Business Analyst. A new “Skills from the source” panel shows ESCO essential and optional relationships and links to the original concepts. In Supabase Table Editor, career_skill_references should contain five rows. If the import has not run or a query fails, the panel explicitly reports unavailable data; it does not invent source records.

## Scope and provenance
European Commission, ESCO classification v1.2.1, English CSV, supplied in the team's DATA SET.zip. Each record stores the inner archive SHA-256, version, original occupation/skill URIs, source URL, mapping note and database import timestamp. Occupation mappings are selected by the team, not official equivalences: Data Analyst → data analyst; Software Engineer → software developer; Cloud Engineer → cloud engineer; Financial Analyst → financial analyst; Business Analyst → ICT business analyst. The panel includes both knowledge and skill/competence relationships as provided by ESCO.

ESCO essential/optional labels are NOT numeric proficiency levels. This first integration deliberately does not overwrite the illustrative 0–5 targets, ranking scores, Gemini catalogue, courses or completed learning. Those remain labelled illustrative. Reference records alone do not establish Malaysian demand, salaries, trend changes or SDG links. This is a local imported snapshot, not an automatic refresh.

## Reproduce
Python 3 standard library only:

    python scripts/import-esco.py /path/to/DATA_SET.zip /tmp/esco_seed.sql

The script also accepts the inner English ESCO archive. It expects the v1.2.1 schema and emits seed statements to run after the table exists. Do not run it on another version without changing and checking the version metadata.

Source: https://esco.ec.europa.eu/en/use-esco/download

## Next implementation
Review a mapping between ESCO skill identifiers and the app's broader skill labels, and define a defensible scoring approach before replacing numeric fixtures. Then version the recommendation catalogue and Gemini inputs consistently. A separate dated demand source is still needed for market-driven re-planning.

## Validation performed
Five exact occupation-label matches; 304 joined skill relationships; source skill identifiers present; no duplicate occupation mappings or skill-relation pairs; no invented proficiency levels; deterministic seed reproduction; TSX syntax check. Live Supabase import, full application build and deployed browser checks have not been performed in this chat.
