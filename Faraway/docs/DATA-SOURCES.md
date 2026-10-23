# Reference and market data integration

## Connected

- **DOSM / data.gov.my**: monthly national labour-force context from the official CSV. Bundled snapshot includes reporting date, retrieval date, source URL and SHA-256. Analysis/Evidence can refresh through `https://api.data.gov.my/data-catalogue?id=lfs_month&limit=12&sort=-date`. Failed refresh retains the labelled snapshot. These portals expose the same publisher dataset and are not counted as independent sources. License: CC BY 4.0. Population reference changes in 2025 make boundary comparisons potentially discontinuous.
- **O*NET 31.0 software skills**: actual source rows, filtered to eight selected US occupations, displayed in career details. Original flags and software categories are preserved. Faraway's occupation analogues are not official crosswalks. References do not overwrite ESCO targets, user skills, or recommendation scores. US in-demand flags are not Malaysian growth measurements. License/attribution shown in UI. Full-source checksum is recorded.
- Refresh bundled files: `python scripts/data/refresh-reference-data.py`. Review version, source schema, mappings and output before committing. No API secret required. This refresh is manual, not a scheduled job.

## JobStreet and Indeed

Analysis displays two separate, explicitly named source panels. No historical count API connection is claimed. Their developer portals document partner integrations, not an established public Malaysian year-by-year counts dataset for this application:

- https://developer.seek.com/
- https://docs.indeed.com/

The Evidence page accepts permitted dated observations. Format: `provider,role,query,geography,observed_at,count,source_url,method`. Exact provider names: JobStreet / Indeed. Source URLs must use the relevant Malaysian platform HTTPS host. Geography must be Malaysia; counts are nonnegative integers, including zero. Future/invalid dates and duplicate observation keys are rejected. Each import replaces this browser's prior set. No cross-user or Supabase persistence is claimed.

A pair needs identical role, query, geography and method and the same calendar day in consecutive years. The latest observation in each series determines the pair. Unmatched observations remain stored but are not graphed as zero. This compares dated active-listing snapshots; it is not an annual posting total. The collector must keep filter and scope definitions consistent and preserve collection evidence. Imported values are unverified by Faraway. The two platforms can contain duplicate listings, so their counts are not summed or averaged. No future measurement exists. Synthetic historical/scenario charts are retained only inside an explicitly labelled collapsed demo section, separate from the source panels. Department view currently labels real imported observations company-wide because no reviewed department-to-occupation mapping exists.

To automate, obtain permitted access and historical data with documented coverage and date/query definitions. Keep credentials on a server; never place private API keys in VITE variables. A matching feed adapter and durable observation storage can then replace browser imports. Merely linking to a job search page does not establish such access.

## Requested references awaiting document-level extraction and reviewed mappings

The source registry labels these as references, not connected datasets. No invented values are extracted or added to scoring.

- eMASCO https://emasco.mohr.gov.my/ ; https://emasco.mohr.gov.my/intro ; https://emasco.mohr.gov.my/directory/skills/specific?page=12&lang=en
- MASCO 2020 https://jtksm.mohr.gov.my/sites/default/files/2022-12/MASCO_2020_BI_Edaran.pdf ; https://emasco.mohr.gov.my/system-api/storage/uploads/masco_2020_en.pdf ; https://www.mohr.gov.my
- MYFutureJobs https://myfuturejobs.gov.my/ ; https://myfuturejobs.gov.my/myfuturejobs-employers ; https://myfuturejobs.gov.my/mycec ; https://www.malaysia.gov.my/en/digital-services/myfuturejobs-industrial-job-and-training-application
- IndSF https://hrdcorp.gov.my/indsf ; https://upskillmalaysia.gov.my/indSF ; https://hrdcorp.gov.my/indsf/digital-technology ; https://hrdcorp.gov.my/wp-content/uploads/2025/11/IndSF-Digital-Technology-Animation-2nd-Edition-NEW.pdf
- Qualifications https://www.mqa.gov.my/new/mqf.cfm ; https://www.uis.unesco.org/en/methods-and-tools/isced ; https://www.unesco.org/sdg4education2030/en/knowledge-hub/international-standard-classification-education-isced
- TVET https://unevoc.unesco.org/home/tvet+country+profiles ; https://unevoc.unesco.org/home/TVET+Country+Profiles/country=MYS ; https://unesdoc.unesco.org/ark:/48223/pf0000373088
- Historical MyCOL https://www.talentcorp.com.my/images/uploads/publication/3/Critical-Occupations-List-MyCOL-20222023-1695267153.pdf (2022/2023, not current)
- Education context https://www.trade.gov/country-commercial-guides/malaysia-education-and-training-services-industry-snapshot ; https://files.eric.ed.gov/fulltext/EJ1067468.pdf ; https://www.iiep.unesco.org/en/articles/higher-education-malaysia-looking-forward-without-leaving-anyone-behind
- https://govinsider.asia/intl-en/article/universiti-malaya-virtual-learning-delima-four-ways-education-is-changing-in-malaysia ; https://www.um.edu.my/docs/um-magazine/4-executive-summary-pppm-2015-2025.pdf
- https://www.iseas.edu.sg/articles-commentaries/iseas-perspective/2026-42-becoming-a-global-education-hub-malaysia-needs-to-focus-on-domestic-needs-and-regional-strengths-by-koh-sin-yee ; https://penanginstitute.org/publications/issues/tvet-in-malaysia-current-situation-challenges-and-recommendations
- https://www.isis.org.my/2026/06/04/connecting-skills-to-jobs ; https://asean.org/wp-content/uploads/2025/02/Regional-mapping-of-labour-market-information-for-skills-and-employment-policies-in-ASEAN-Member-States_e-version-for-website.pdf

The additional O*NET abilities, interests and work-styles API references identify different constructs from software skills. They are not imported in this revision and require their own schemas, scales and mappings. API access is not configured. Interests must remain separate from careers and abilities; no automatic inference of personality or proficiency is made.
