# WoWLook Static Web Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a pure static Cloudflare Pages web app for WoWLook using the existing `cos-upload` data and assets.

**Architecture:** The app lives in `web/` as static HTML/CSS/JS with no build step. It reads the same `data-4.2.x/*.json` and `assets/**` layout used by the mini program, derives view data in the browser, and uses `localStorage` for favorites and build drafts. A small i18n module translates UI text without changing equipment data.

**Tech Stack:** Plain HTML, CSS, JavaScript modules, browser `fetch`, `localStorage`, Cloudflare Pages static hosting.

---

## Chunk 1: Static App Shell

### Task 1: Create Web Folder and Entry Files

**Files:**
- Create: `web/index.html`
- Create: `web/styles.css`
- Create: `web/config.js`
- Create: `web/i18n.js`
- Create: `web/app.js`
- Create: `web/README.md`

- [ ] **Step 1: Add a semantic HTML shell**

Create a root `#app` mount, metadata, mobile viewport, and static script references.

- [ ] **Step 2: Add deployment configuration**

Define `DATA_VERSION`, `DATA_BASE`, `ASSET_BASE`, and the Tencent COS fallback constant in `web/config.js`.

- [ ] **Step 3: Add initial app bootstrap**

Create `web/app.js` with app state, render loop, route parsing, and data loading helpers.

## Chunk 2: Data and Domain Logic

### Task 2: Port Mini Program Utilities

**Files:**
- Modify: `web/app.js`

- [ ] **Step 1: Port class metadata**

Copy class list and visual asset mapping from `miniprogram/utils/class-data.js`.

- [ ] **Step 2: Port equipment transforms**

Port slot normalization, flattening, filtering, grouping, stat line, detail building, and instance options from `miniprogram/utils/equipment.js`.

- [ ] **Step 3: Port favorites/share/build draft logic**

Implement browser equivalents for favorites, favorite groups, share payloads, and temporary build drafts using `localStorage`.

## Chunk 3: UI Rendering

### Task 3: Build Views and Components

**Files:**
- Modify: `web/app.js`
- Modify: `web/styles.css`

- [ ] **Step 1: Render home view**

Render logo, background, class grid, announcement button, favorites button, and class counts.

- [ ] **Step 2: Render equipment view**

Render top bar, hero banner, filter panel, item groups, item cards, build request strip, and responsive actions.

- [ ] **Step 3: Render overlays**

Render item detail modal, favorites panel, shared favorites panel, build draft panel, favorite picker, and announcement modal.

- [ ] **Step 4: Bind event delegation**

Use `data-action` attributes and one click/input/change handler per event type.

## Chunk 4: I18n

### Task 4: Add Locale Layer

**Files:**
- Modify: `web/i18n.js`
- Modify: `web/app.js`
- Modify: `web/styles.css`

- [ ] **Step 1: Define locale dictionaries**

Add dictionaries for `zh-CN`, `zh-TW`, `en-US`, `en-GB`, `de-DE`, `fr-FR`, `es-ES`, `es-MX`, `pt-BR`, `ko-KR`, `it-IT`, and `ru-RU`.

- [ ] **Step 2: Add locale selector and persistence**

Detect browser language, store user selection in `localStorage`, and rerender when locale changes.

- [ ] **Step 3: Use translation helpers**

Replace all UI strings and enum labels with `t()` lookups.

## Chunk 5: Data Sync and Deployment Docs

### Task 5: Reuse `cos-upload`

**Files:**
- Create directory copy targets: `web/data-4.2.x/`
- Create directory copy targets: `web/assets/`
- Modify: `web/README.md`

- [ ] **Step 1: Copy current data snapshot**

Copy `cos-upload/data-4.2.x` to `web/data-4.2.x`.

- [ ] **Step 2: Copy current assets snapshot**

Copy `cos-upload/assets` to `web/assets`.

- [ ] **Step 3: Document update workflow**

Document that future season updates copy the same `cos-upload/data-4.2.x` and `cos-upload/assets` folders into `web/` before Cloudflare upload.

## Chunk 6: Verification

### Task 6: Static and Browser Checks

**Files:**
- Verify: `web/app.js`
- Verify: `web/index.html`
- Verify: `web/styles.css`

- [ ] **Step 1: Run JS syntax checks**

Run: `node --check web/app.js`
Expected: no syntax errors.

- [ ] **Step 2: Start a local static server**

Run: `python -m http.server 8787` from `web/`.
Expected: page loads at `http://localhost:8787`.

- [ ] **Step 3: Verify responsive layouts with Playwright**

Check phone, tablet, and desktop viewports. Verify home, equipment navigation, filters, detail modal, favorites, and locale switching.

- [ ] **Step 4: Inspect git diff**

Run: `git diff -- web docs/superpowers/specs/2026-05-06-wowlook-static-web-design.md docs/superpowers/plans/2026-05-06-wowlook-static-web.md`
Expected: only intended web app and docs changes appear.
