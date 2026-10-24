# Complete language support

## Languages and presentation
English, Simplified Chinese (`zh-Hans`) and Malaysian Bahasa Melayu (`ms`).
Language dictionaries cover interface copy, catalogue occupations, skills, course
metadata, qualification notes, source explanations and SDG target descriptions.
The locale dictionaries load before a selected language is committed, keeping the
page consistent. Language switching preserves form state and data identifiers.
Chinese display text uses Noto Serif SC, with Noto Sans SC for body text and local
font fallbacks. Malay uses the existing design with more comfortable heading spacing.
Reduced-motion settings disable the language transition.

Names, code identifiers, programming languages, brands, original source URLs and
user-entered text retain their identity. A translated label is never written back
as a career ID, skill key or form selection value. Metadata source references remain
traceable to their original publisher.

## AI deployment (required once)
Vercel deploys interface changes from GitHub. Supabase Edge Functions are deployed
separately. The AI request language and cache metadata need this updated function.

The easiest deployment is a single bundled file:
1. Open `Faraway/supabase/deploy-faraway-recommendations.ts` on GitHub and copy its complete contents using the file copy button.
2. Open Supabase → your project → Edge Functions → faraway-recommendations → Code.
3. Replace the function's `index.ts` with the copied code and select Deploy updates.

Or, from a checkout of the latest repository, in `Faraway`:

```sh
npx supabase functions deploy faraway-recommendations --project-ref txsgreryqmxrrpefbfua
```

Keep existing RunPod/Supabase secrets. No SQL migration is required. Do not disable RLS.

The server accepts only `en`, `zh` and `ms`, instructs the configured model to write
in that language, and includes language in its cache key and response metadata.
Old English explanations are not presented as Chinese/Malay content. Generating
localized AI prose is an explicit user action; changing the language never calls
the GPU. Existing course/activity completion records remain intact.

## Translation preparation and attribution
Catalogue draft translations were prepared offline on CPU using Meta NLLB-200
(distilled 600M, int8 CTranslate2 conversion). No browser translation service or
RunPod worker is used to render dictionary translations. Human-written interface
copy overrides machine-generated entries. Source catalogue licenses remain applicable.
Model references: https://huggingface.co/facebook/nllb-200-distilled-600M and
https://huggingface.co/JustFrederik/nllb-200-distilled-600M-ct2-int8 .
The model is not shipped to visitors. Dictionary bundles are ordinary static assets.

## Verification
Check all three languages across login, profile intake, analysis, career details,
study planning, learning progress and HR/university workspaces. Verify that the
score and numeric data stay the same when only language changes, and that both
AI request types and SDG generation record the selected language after deployment.
