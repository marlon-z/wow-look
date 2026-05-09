# Multilingual SEO Static Generation Design

## Goal

Make SeasonLoot indexable for real multilingual World of Warcraft searches by generating localized static pages from the current data version, instead of relying on `?lang=` and client-side rendering.

## Architecture

The site keeps the existing English root URLs (`/` and `/warrior/`) as the default canonical paths, then adds locale-prefixed static URLs for non-default languages such as `/de/warrior/`, `/ko/warrior/`, and `/zh-cn/warrior/`. A versioned `seo.config.json` drives the data directory, base URL, supported locales, locale slugs, hreflang values, and cache bust string.

`generate-seo-pages.js` reads the current data folder, the localized Blizzard item overlays, and the existing UI translations from `i18n.js`. It generates localized home pages, class pages, canonical/hreflang tags, JSON-LD, `sitemap.xml`, and `robots.txt`.

## URL Strategy

Default English:

- `/`
- `/{classKey}/`

Localized:

- `/{localeSlug}/`
- `/{localeSlug}/{classKey}/`

The default English URL is used as `x-default`. Every generated page self-canonicalizes, and all equivalent language versions list each other with `hreflang`.

## Runtime Support

The browser app must load assets and data correctly from both one-level and two-level paths. Locale switching should update the visible URL to the matching localized static path, not to a `?lang=` parameter.

## Version Updates

When the game data changes, update `seo.config.json` to point at the new data directory and season labels, then run the generator. Generated SEO pages are rebuilt from data, not hand-maintained.
