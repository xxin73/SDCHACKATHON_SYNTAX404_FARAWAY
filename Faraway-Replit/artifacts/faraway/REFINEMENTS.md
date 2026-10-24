# Faraway icon and sidebar refinements

## Branding assets

All icons use the existing transparent `public/faraway-logo-trimmed.png`,
the same logo displayed by the app. Each image is proportionally resized
and centered, never stretched. The 1200 × 630 sharing image places it on a
dark background for contrast; the PNG icons retain transparency.

`index.html` contains one set of icon, Open Graph, and Twitter Card references.
The unused placeholder SVG favicon has been removed.

Social metadata uses the existing live URL documented in the uploaded project:
`https://faraway-practice-faraway.vercel.app/`. Deploy the new public assets
along with the updated HTML to that site. If publishing on a different domain,
update `og:url`, `og:image`, and `twitter:image` in `index.html` to that
production domain before building. These must be absolute public URLs:
client-side metadata updates are not sufficient for sharing crawlers.

Search engines and social platforms control their own image caches and final
preview appearance. New metadata does not guarantee an immediate Google
thumbnail update.

## Navigation

All five desktop navigation items use a shared flex container with a 24px gap
and identical 48px square wrappers. The old item-specific viewport-height
margins have been removed. This applies to both personal and organisation
navigation. The existing desktop-only rail and mobile bottom navigation
breakpoint are unchanged; there is no expanded rail state in the original.

## Existing service configuration

The uploaded project's Supabase authentication and functions are unchanged.
Account sign-in still needs the original Supabase configuration; it is not
replaced with a new authentication or database system.
