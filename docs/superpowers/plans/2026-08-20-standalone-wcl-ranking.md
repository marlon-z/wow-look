# Standalone WCL Ranking Page Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the build-page WCL popup with an independent full-screen “排行榜配装” route that keeps cloud WCL data, compact filters, in-page specialization switching, and editable-build handoff.

**Architecture:** Add a dedicated rankings page whose state is either class selection or a selected class with in-page spec pills. The page reads the existing WCL COS index/files directly, compacts the three filter layers into horizontal controls, and navigates to the existing exact WCL restore URL when a preset is selected. The build page becomes only a handoff target and no longer renders a WCL overlay.

**Tech Stack:** WeChat Mini Program native pages (WXML/WXSS/JavaScript), existing `utils/wcl-presets.js`, COS-hosted WCL JSON, Node assertion tests.

---

## Chunk 1: Route and ranking-page data behavior

### Task 1: Establish route and page behavior tests

**Files:**
- Create: `tests/test-rankings-page.js`
- Modify: `miniprogram/app.json`
- Modify: `miniprogram/pages/index/index.js`
- Modify: `tests/test-wcl-season-unavailable.js`

- [ ] **Step 1: Write failing route assertions**

Assert that `pages/rankings/rankings` is registered, the homepage opens it, and an existing build-page leaderboard entry opens the same route.

- [ ] **Step 2: Run the focused test**

Run: `node tests/test-rankings-page.js`  
Expected: FAIL because the route and page do not exist.

- [ ] **Step 3: Register the independent route**

Add `pages/rankings/rankings` to `app.json`. Change the homepage leaderboard handler to call:

```js
wx.navigateTo({ url: '/pages/rankings/rankings' });
```

Change the simulator’s leaderboard action to navigate with its current `classKey` when available.

- [ ] **Step 4: Run route tests**

Run: `node tests/test-rankings-page.js`  
Expected: PASS for registered route and entry URLs.

### Task 2: Implement independent ranking state and COS loading

**Files:**
- Create: `miniprogram/pages/rankings/rankings.js`
- Create: `miniprogram/pages/rankings/rankings.json`
- Test: `tests/test-rankings-page.js`

- [ ] **Step 1: Write failing state tests**

Mock `Page` and assert these transitions, including a deliberately delayed stale request:

```js
// no classKey: class selection
// select warrior: first specialization selected and index requested
// select spec 72: index reloads for warrior/72
// page back: class selection is restored before navigateBack
// weapon's delayed index response cannot overwrite a later fury selection
// an old file response cannot overwrite a newly selected level/file
```

- [ ] **Step 2: Run the focused test**

Run: `node tests/test-rankings-page.js`  
Expected: FAIL because rankings page logic is missing.

- [ ] **Step 3: Implement page state**

Use `CLASS_LIST`, `getClassMeta`, `getClassVisualAssets`, `loadClassData`, `loadWclPresetIndex`, and `loadWclPresetFile`. Keep a `phase` (`class` or `ranking`), selected class/spec, WCL index, selected content/file/dungeon, and entries. `onLoad({ classKey, specId })` must open a valid class and valid requested spec (otherwise its first spec); invalid class parameters, empty indexes, and request failures must render an actionable full-screen empty state that returns to class selection. Increment an index/file request token on every selection and ignore a response unless its token and current class/spec/content/file state still match.

- [ ] **Step 4: Add the precise WCL handoff**

For a selected preset, navigate to:

```js
'/pages/build/build?classKey=' + classKey
  + '&specId=' + specId
  + '&openWcl=1&wclContent=' + contentType
  + '&wclFileKey=' + fileKey
  + '&wclPresetId=' + encodeURIComponent(preset.id)
```

This must match the existing exact WCL restore contract rather than recreating slots locally.

- [ ] **Step 5: Run behavior tests**

Run: `node tests/test-rankings-page.js`  
Expected: PASS.

### Task 3: Replace popup controls with compact ranking UI

**Files:**
- Create: `miniprogram/pages/rankings/rankings.wxml`
- Create: `miniprogram/pages/rankings/rankings.wxss`
- Modify: `miniprogram/pages/rankings/rankings.js`
- Test: `tests/test-rankings-page.js`

- [ ] **Step 1: Write failing markup/style assertions**

Assert that the page has class selection, visible in-page spec pills, content tabs, compact level tabs, a horizontal dungeon/Boss scroll area, and no count rendering (`presetCount`, `item.count`, `item.presets.length`, or “套” in filters and group headers).

- [ ] **Step 2: Implement full-screen markup**

Render class choice when `phase === 'class'`. In ranking phase render an explicit in-page top back action (ranking state returns to class selection; class state alone calls `wx.navigateBack`), class name, spec pills, cloud update text, then exactly the following filter hierarchy: content type → category/level → dungeon/Boss. Omit a filter row if it has no choices.

- [ ] **Step 3: Implement compact visual treatment**

Use single-line pills and horizontal scrolling for long dungeon/Boss lists. Do not use a mask, close icon, popup panel, or vertical/card-based filter controls. Keep the first preset list visible immediately below filters.

- [ ] **Step 4: Run page test**

Run: `node tests/test-rankings-page.js`  
Expected: PASS.

## Chunk 2: Retire popup UI and verify sharing/handoff

### Task 4: Remove simulator popup ownership and preserve legacy entry safety

**Files:**
- Modify: `miniprogram/pages/build/build.js`
- Modify: `miniprogram/pages/build/build.wxml`
- Modify: `miniprogram/pages/build/build.wxss`
- Modify: `tests/test-wcl-season-unavailable.js`
- Modify: `tests/test-build-page-sharing.js`

- [ ] **Step 1: Write failing tests**

Assert the simulator has no `showWclPresets` popup markup and its “排行榜配装” action navigates to the independent page. Keep exact WCL shared-link restoration (`wclFileKey` + `wclPresetId`) intact.

- [ ] **Step 2: Remove the overlay path**

Delete popup-only state, WCL list/filter handlers, overlay WXML, and overlay WXSS from the simulator. Explicitly preserve `currentWclPresetInfo`, applied-build metadata, WCL total-stat summary behavior, talents, enchant/gem display, and exact-WCL sharing/restoration.

- [ ] **Step 3: Redirect old generic URLs**

If an old `openWcl=1` URL has no exact WCL preset parameters, redirect it to `/pages/rankings/rankings`, preserving a supplied class. Exact WCL links must continue restoring an editable build directly.

- [ ] **Step 4: Run focused regressions**

Run:

```bash
node tests/test-rankings-page.js
node tests/test-build-page-sharing.js
node tests/test-wcl-season-unavailable.js
node tests/test-wcl-preset-apply-metadata.js
```

Expected: PASS.

### Task 5: Enable share and complete regression verification

**Files:**
- Modify: `miniprogram/pages/rankings/rankings.js`
- Modify: `miniprogram/pages/rankings/rankings.json`
- Test: `tests/test-page-share-config.js`

- [ ] **Step 1: Add independent-page sharing**

Set the navigation title to “排行榜配装” and enable friend and timeline sharing. Default share opens the class picker; when a class/spec is selected, share the exact rankings route with `classKey` and `specId` (and not a simulator popup URL). Each preset card retains its share entry; `onShareAppMessage(options)` with `shareType: 'wcl-preset'` emits the exact editable WCL URL containing `classKey`, `specId`, `wclContent`, `wclFileKey`, and `wclPresetId`. Verify `onBack` first changes ranking phase back to class selection; only the class selection phase calls `wx.navigateBack`.

- [ ] **Step 2: Run the complete test suite**

Run:

```bash
$tests = Get-ChildItem tests -Filter 'test-*.js' | Sort-Object Name
foreach ($test in $tests) { node $test.FullName; if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE } }
```

Expected: all tests pass, including local-package size checks.

- [ ] **Step 3: Commit and push only intended files**

Run explicit `git add` for ranking route, simulator removal, and tests; commit with `feat: add standalone ranking page`; push `main` only after verification.
