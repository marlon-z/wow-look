# Chinese SEO Tool Pages Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the web app use Chinese as the temporary primary experience and expose tool-first SEO pages for "魔兽世界配装模拟器" and related class gear searches.

**Architecture:** Keep the static web architecture. Reuse the existing generated page system, but switch the default locale to `zh-CN`, update the runtime dataset to `4.4.x`, and add Chinese SEO/product sections that render as real HTML in both the runtime app and generated `noscript` content.

**Tech Stack:** Static HTML/CSS/ES modules, Node.js SEO generator, local JSON data copied from `cos-upload/data-4.4.x`.

---

## Chunk 1: Chinese Default And Data Version

### Task 1: Point Web Runtime At Current Data

**Files:**
- Modify: `web/config.js`
- Modify: `web/seo.config.json`
- Copy data: `cos-upload/data-4.4.x` to `web/data-4.4.x`

- [ ] **Step 1: Update runtime data version**

Change `DATA_VERSION` in `web/config.js` from `4.3.x` to `4.4.x`.

- [ ] **Step 2: Update SEO config**

Set `currentVersion` to `4.4.x`, `dataDir` to `data-4.4.x`, `defaultLocale` to `zh-CN`, and refresh `cacheBust`.

- [ ] **Step 3: Copy the data directory**

Run:

```powershell
Copy-Item -Recurse -Force cos-upload\data-4.4.x web\data-4.4.x
```

- [ ] **Step 4: Verify data exists**

Run:

```powershell
Get-ChildItem web\data-4.4.x\*.json | Measure-Object
```

Expected: includes `overview.json` and 13 class JSON files.

## Chunk 2: Tool-First Chinese SEO Interface

### Task 2: Add Chinese Tool Landing Content

**Files:**
- Modify: `web/app.js`
- Modify: `web/i18n.js`
- Modify: `web/styles.css`

- [ ] **Step 1: Change the default runtime locale**

Set the runtime fallback locale in `web/app.js` to `zh-CN`, while preserving explicit locale routing for other languages.

- [ ] **Step 2: Add a SEO tool section**

Render a home-page section focused on:

- 魔兽世界配装模拟器
- 职业配装入口
- 排行榜配装
- 装备查询
- 收藏和分享

This section must be visible HTML, not only meta tags.

- [ ] **Step 3: Add class-page conversion blocks**

Add class-page calls to action for:

- 开始配装模拟
- 查看排行榜配装
- 按职业装备池筛选

- [ ] **Step 4: Make desktop and mobile layouts distinct**

Use CSS grids at desktop widths and single-column/touch-friendly layout on mobile. Verify no horizontal scrolling at 360px.

## Chunk 3: Generated SEO Pages

### Task 3: Update SEO Generator Output

**Files:**
- Modify: `web/generate-seo-pages.js`
- Generated: `web/index.html`
- Generated: `web/zh-cn/index.html`
- Generated: `web/{class}/index.html`
- Generated: `web/zh-cn/{class}/index.html`
- Generated: `web/sitemap.xml`
- Generated: `web/robots.txt`

- [ ] **Step 1: Update generated page language and metadata**

Ensure default `/` pages are `zh-CN` and use Chinese title/description text.

- [ ] **Step 2: Expand `noscript` content**

Generated pages should include real Chinese tool content and links so crawlers can understand the page without running JavaScript.

- [ ] **Step 3: Run generator**

Run:

```powershell
cd web
node generate-seo-pages.js
```

- [ ] **Step 4: Verify output**

Run:

```powershell
Select-String -Path web\index.html -Pattern "魔兽世界配装模拟器","zh-CN","data-4.4.x"
Select-String -Path web\sitemap.xml -Pattern "https://seasonloot.com/","zh-cn"
```

## Chunk 4: Verification

### Task 4: Browser And Test Checks

**Files:**
- Test existing scripts where relevant.
- Use local static server for visual inspection.

- [ ] **Step 1: Run existing focused tests**

Run:

```powershell
node tests/test-equipment-filter.js web/data-4.4.x
node tests/test-crafting-selection.js
node tests/test-stat-calc.js
```

- [ ] **Step 2: Start local server**

Run:

```powershell
cd web
python -m http.server 8787
```

- [ ] **Step 3: Verify responsive pages**

Check at least:

- `http://localhost:8787/`
- `http://localhost:8787/warrior/`
- `http://localhost:8787/zh-cn/`
- `http://localhost:8787/zh-cn/warrior/`

Viewport widths:

- 360px
- 390px
- 768px
- 1366px

- [ ] **Step 4: Final git review**

Run:

```powershell
git status --short
git diff --stat
```

## Chunk 5: Complete Pre-WCL Build Simulator

### Task 5: Add Full Static Web Build Page

**Files:**
- Modify: `web/app.js`
- Modify: `web/config.js`
- Modify: `web/styles.css`
- Modify: `web/generate-seo-pages.js`
- Generated: `web/build/index.html`

- [ ] Add `/build/` route detection and static page generation.
- [ ] Add saved build storage independent from temporary build draft.
- [ ] Port pre-WCL build rules: slot mapping, weapon compatibility, crafted random-stat selection, secondary-stat summary.
- [ ] Add build page UI for class/spec selection, slot board, item picker, stat summary, save/rename/delete/share.
- [ ] Verify desktop and mobile layouts before handing over for acceptance.
