# Multilingual SEO Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Generate versioned, localized, crawlable static SEO pages for SeasonLoot.

**Architecture:** Add a versioned SEO config, rewrite the SEO page generator to produce default and locale-prefixed pages, and update runtime path handling so generated pages work when refreshed. Generate sitemap, robots, and OG card asset.

**Tech Stack:** Static HTML, browser ES modules, Node.js generation script, Cloudflare Pages.

---

## Chunk 1: Generator and Routing

### Task 1: Versioned SEO Config

**Files:**
- Create: `seo.config.json`

- [ ] Add base URL, data version, data directory, cache bust, default locale, and locale slug/hreflang mapping.

### Task 2: Multilingual Generator

**Files:**
- Modify: `generate-seo-pages.js`

- [ ] Load config and i18n translations.
- [ ] Generate localized home and class pages.
- [ ] Generate canonical/hreflang tags with self-canonical localized URLs.
- [ ] Generate `sitemap.xml` and `robots.txt`.

### Task 3: Runtime Path Support

**Files:**
- Modify: `config.js`
- Modify: `app.js`

- [ ] Make local asset/data base paths depth-aware.
- [ ] Build locale-prefixed links instead of `?lang=` URLs.
- [ ] Read initial locale from generated page metadata.

### Task 4: Generated Assets and Verification

**Files:**
- Generate: localized `index.html` pages
- Generate: `sitemap.xml`
- Generate: `robots.txt`
- Generate: `assets/public/og-card.png`

- [ ] Run `node generate-seo-pages.js`.
- [ ] Validate representative generated pages.
- [ ] Start local preview and inspect key URLs.
