# Local Image Compatibility and Equipment Pagination Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Render local equipment images reliably on devices, make class emblems crisp, and load equipment query results in 30-item scroll pages.

**Architecture:** Convert unique local icons from the retained JPG originals and migrate all persisted snapshot paths to that extension. Keep rich equipment data in `equipment` page instance fields; project only paged grouping data through `setData`, and append projections with `onReachBottom`.

**Tech Stack:** Node.js, Sharp 0.34.5, PowerShell/System.Drawing, WeChat Mini Program WXML/WXSS, Node `assert`.

---

## Chunk 1: Compatible local images and persisted-path migration

### Task 1: Generate JPG icons and higher-resolution emblems

**Files:**
- Modify: `scripts/convert-local-s2-icons.js`
- Modify: `scripts/generate-local-s2-data.js`
- Modify: `scripts/resize-local-s2-assets.ps1`
- Modify: `tests/test-local-s2-icon-generation.js`
- Modify: `tests/test-local-s2-data-packages.js`
- Modify: `miniprogram/assets/icons/*.webp` (delete through generator rebuild)
- Create: `miniprogram/assets/icons/*.jpg` (generated)
- Modify: `miniprogram/assets/classes/emblem/*.png` (generated)

- [ ] **Step 1: Update generation tests to the intended output**

Change icon expectations to 390 `.jpg` files, 56×56 `jpeg` metadata, and exported constants:

```js
assert.strictEqual(converter.ICON_SIZE, 56);
assert.strictEqual(converter.JPEG_QUALITY, 90);
```

Assert all `classes/emblem/*.png` images are at most 128px wide and at least 120px wide. Update data-package path expectations to `/assets/icons/*.jpg`.

- [ ] **Step 2: Run the revised tests to verify they fail**

Run: `node tests/test-local-s2-icon-generation.js; node tests/test-local-s2-data-packages.js`

Expected: FAIL while WebP files and `.webp` paths still exist.

- [ ] **Step 3: Change the asset generators**

In the icon converter, replace WebP constants/output with `JPEG_QUALITY = 90`, target `${name}.jpg`, and `.jpeg({ quality: JPEG_QUALITY, mozjpeg: true })`. In `generate-local-s2-data.js`, write `.jpg` icon paths. Change `resize-local-s2-assets.ps1` emblem max width to 128; retain 220px/quality-82 banner settings.

- [ ] **Step 4: Regenerate from retained originals and rerun resource tests**

Run: `node scripts/generate-local-s2-data.js; node tests/test-local-s2-icon-generation.js; node tests/test-local-s2-data-packages.js`

Expected: PASS; resource report logs media total, while main and subpackage hard limits continue to pass.

### Task 2: Migrate persistent snapshot image paths

**Files:**
- Create: `miniprogram/utils/local-icon-path.js`
- Modify: `miniprogram/utils/favorites.js`
- Modify: `miniprogram/utils/build-draft.js`
- Modify: `miniprogram/utils/builds.js`
- Create: `tests/test-local-icon-path-migration.js`

- [ ] **Step 1: Write failing migration tests**

Test a pure `normalizeLocalIconPath` helper and mocked storage reads for favorites, draft, and saved builds. Verify `/assets/icons/sword.webp` becomes `/assets/icons/sword.jpg`, external URLs remain unchanged, and a read that changes stored snapshots writes migrated content back exactly once.

- [ ] **Step 2: Run to verify it fails**

Run: `node tests/test-local-icon-path-migration.js`

Expected: FAIL because no shared helper or write-back migration exists.

- [ ] **Step 3: Implement shared normalization and safe write-back**

Create `local-icon-path.js` with a pure path normalizer that only changes absolute `/assets/icons/*.webp` paths. Have each storage normalizer return migrated snapshots and an indicator; `getFavorites`, `getBuildDraft`, and `getBuilds` write back only when migration changed persisted values. Preserve each module’s existing shape, ordering, and summary calculations.

- [ ] **Step 4: Verify migration behavior**

Run: `node tests/test-local-icon-path-migration.js`

Expected: PASS for favorites, drafts, saved builds, unchanged URLs, and idempotent reads.

## Chunk 2: Actual 30-item equipment-query pagination

### Task 3: Create stable group projections and page state

**Files:**
- Modify: `miniprogram/utils/equipment.js`
- Modify: `miniprogram/pages/equipment/equipment.js`
- Create: `tests/test-equipment-pagination.js`

- [ ] **Step 1: Write failing group/pagination tests**

Export a focused helper from `utils/equipment.js` that projects full groups to a max item count. Test slot and source groups both have stable `key`, a 30-item first page, a 30-item append, no duplicate group key, each group `totalCount`, and reset/end behavior.

- [ ] **Step 2: Run the test to verify it fails**

Run: `node tests/test-equipment-pagination.js`

Expected: FAIL because groups lack consistent keys and no projection helper exists.

- [ ] **Step 3: Implement group keys and projection helper**

Set `key: item.slot` on slot groups. Export `paginateGroups(groups, maxItems)` that walks groups in order, returns only nonempty visible groups, preserves metadata, uses `totalCount` for each full group, and slices items without duplicating any group.

- [ ] **Step 4: Move master records out of page data**

In `pages/equipment/equipment.js`, add page fields `allItems`, `filteredGroups`, and `filteredItemCount`; remove `allItems` from `data`. Replace all reads/maps of `this.data.allItems` with `this.allItems`. Initialize it in `loadData`; keep `itemMap` complete for all records.

- [ ] **Step 5: Add reset and append methods**

Use `PAGE_SIZE = 30`. Make `applyFilters` create full private groups and then call `resetVisibleItems`. `resetVisibleItems` exposes the first 30 with `loadedResultCount`, `hasMoreItems`, and `isLoadingMore: false`. `loadMoreItems` adds 30 and protects against duplicate concurrent work. Add `onReachBottom` to call it.

- [ ] **Step 6: Run pagination tests**

Run: `node tests/test-equipment-pagination.js`

Expected: PASS for all paging, grouping, and reset assertions.

### Task 4: Render pagination state and remove WebP declarations

**Files:**
- Modify: `miniprogram/pages/equipment/equipment.wxml`
- Modify: `miniprogram/pages/equipment/equipment.wxss`
- Modify: `miniprogram/pages/index/index.wxml`
- Modify: `miniprogram/pages/build/build.wxml`
- Modify: `miniprogram/components/favorite-panel/favorite-panel.wxml`
- Modify: `miniprogram/components/equipment-detail/equipment-detail.wxml`
- Modify: `tests/test-local-icon-lazy-loading.js`

- [ ] **Step 1: Extend the WXML regression test first**

Require all nine `iconAsset` image tags to have `lazy-load="{{true}}"` and no `webp` attribute. Assert equipment page uses `wx:key="key"`, displays `item.items.length / item.totalCount`, includes loading/more/end states, and the query item image exposes `data-item-id="{{equip.id}}"` for error diagnostics.

- [ ] **Step 2: Run to verify it fails**

Run: `node tests/test-local-icon-lazy-loading.js`

Expected: FAIL because tags still declare WebP and equipment page lacks pagination UI.

- [ ] **Step 3: Update WXML and styles**

Remove `webp="{{true}}"` from all nine tags. In equipment WXML, change outer group key to `key`, render `已显示 {{item.items.length}} / 共 {{item.totalCount}} 件`, and add a concise bottom status view controlled by `isLoadingMore`, `hasMoreItems`, and `loadedResultCount`. Add matching centered, muted WXSS styles.

- [ ] **Step 4: Add device image diagnostics**

Add `binderror="onIconImageError"` and `data-item-id="{{equip.id}}"` only to the equipment query item image. Implement a development-friendly handler in `equipment.js` that logs `event.detail` and `event.currentTarget.dataset.itemId`; it must not alter source paths or crash UI.

- [ ] **Step 5: Run all automated checks**

Run:

```bash
node tests/test-local-s2-icon-generation.js
node tests/test-local-icon-path-migration.js
node tests/test-equipment-pagination.js
node tests/test-local-icon-lazy-loading.js
node tests/test-local-s2-data-packages.js
node tests/test-local-s2-class-data.js
node tests/test-miniprogram-update.js
node tests/test-home-share-entry.js
```

Expected: all PASS; resource test logs diagnostic media size and preserves package hard-limit checks.

- [ ] **Step 6: Verify on DevTools and a physical device**

Open a class equipment query. Confirm initial rendering contains 30 cards or fewer, scroll to append further batches, and apply a filter to reset to the first batch. Verify icons are visible; inspect the console for no `onIconImageError` calls. Check class selection, query header and build class icons for visibly sharper 128px emblems.

- [ ] **Step 7: Commit intentionally**

```bash
git add scripts miniprogram tests
git commit -m "fix: restore local image compatibility and paging"
```
