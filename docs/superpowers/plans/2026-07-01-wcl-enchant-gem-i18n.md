# WCL Enchant Gem I18n Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Localize WCL leaderboard enchant and gem names for every supported web locale without leaking Chinese names into non-Chinese pages.

**Architecture:** Generate a separate WCL name dictionary from WCL preset IDs and Blizzard Game Data API names, then load that dictionary in the browser when applying WCL presets. Keep WCL preset files language-neutral by using IDs at render time and treat embedded Chinese names only as Chinese fallback.

**Tech Stack:** Node.js scripts, Blizzard Game Data API, static JSON files, vanilla web app JavaScript.

---

### Task 1: Generate WCL Name Dictionaries

**Files:**
- Create: `scripts/fetch-wcl-name-localization.js`
- Modify: none

- [ ] Scan `cos-upload/wcl-presets/data-4.4.x` for unique `permanentEnchant` and `gems[].id`.
- [ ] Fetch gem names from Blizzard `item/{id}` for each locale.
- [ ] Resolve enchant names from local fallback maps first, then Blizzard item API when possible.
- [ ] Write `web/locales/{locale}/wcl-names.json`.

### Task 2: Browser Resolver

**Files:**
- Modify: `web/app.js`
- Modify: `web/index.html`

- [ ] Add a per-locale WCL name dictionary cache.
- [ ] Load the current locale dictionary before applying WCL presets.
- [ ] Resolve `permanentEnchant` and `gems[].id` through the dictionary.
- [ ] Fall back to English, then ID labels, and use embedded Chinese only on Chinese locales.
- [ ] Bump app cache query strings.

### Task 3: Tests and Verification

**Files:**
- Create: `tests/test-fetch-wcl-name-localization.js`

- [ ] Unit test WCL ID collection from nested preset files.
- [ ] Unit test locale output merging and fallback behavior.
- [ ] Run syntax checks for changed scripts and web modules.
- [ ] Generate dictionaries with Blizzard credentials for all locales.
- [ ] Browser-check a German WCL build and confirm enchant/gem rows contain no Chinese.
