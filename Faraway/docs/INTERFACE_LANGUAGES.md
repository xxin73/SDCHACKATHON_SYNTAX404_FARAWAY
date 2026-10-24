# Interface languages

English (`en`), Simplified Chinese (`zh`, document `zh-Hans`) and Bahasa Melayu (`ms`).
A fixed language control is available before and after sign-in, on mobile and desktop.
The preference is local to the browser and survives reload/sign-out. It is independent
of profiles, learning plans and assessments. Other tabs receive language preference changes.

Translation uses a bundled dictionary, no translation service/model requests. Only
presentation labels are translated; values, career/skill IDs, URLs, source figures and
matching rules retain their canonical values. Components subscribe to language changes
without remounting the app, so draft form state is retained.

Coverage: main navigation, authentication, profile/pathway form labels, scenario controls,
match-score controls, learning plan/progress controls and HR/university controls.
Long-form explanatory passages without dictionary entries fall back to English. Technical
skill names, catalogue occupation titles, source/research titles, existing AI explanations
and user-entered text retain their original language. The selector tooltip discloses this.
This is interface localisation, not translated model generation or a claim of complete
translation of the catalogue. Add reviewed entries to translations.json to expand coverage.
