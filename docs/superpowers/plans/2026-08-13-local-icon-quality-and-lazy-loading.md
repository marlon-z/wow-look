# Local Icon Quality and Lazy Loading Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore crisp local mini-program artwork and lazily render all equipment icons outside the initial viewport.

**Architecture:** Keep the unique, main-package WebP icon mapping and all local data interfaces unchanged. Rebuild assets from `cos-upload/assets` at 56px/quality 82, remove the advisory 200 KiB media assertion, and use the native `image.lazy-load` property in every icon template.

**Tech Stack:** Node.js, Sharp 0.34.5, PowerShell/System.Drawing, WeChat Mini Program WXML, Node `assert` tests.

---

## Chunk 1: High-quality local media generation

### Task 1: Make image-generation settings testable

**Files:**
- Create: `tests/test-local-s2-icon-generation.js`
- Modify: `scripts/convert-local-s2-icons.js:1-59`

- [ ] **Step 1: Write the failing generator-configuration test**

Create `tests/test-local-s2-icon-generation.js`. Require the converter module and assert:

```js
assert.strictEqual(converter.ICON_SIZE, 56);
assert.strictEqual(converter.WEBP_QUALITY, 82);
assert.strictEqual(converter.WEBP_EFFORT, 6);
```

The test must also use Sharp metadata to assert all files in `miniprogram/assets/icons` are 56×56 WebP and that the directory contains exactly 390 files.

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm ci; node tests/test-local-s2-icon-generation.js`

Expected: FAIL because the converter exports no constants and existing generated files are 24×24.

- [ ] **Step 3: Export and use one set of generation constants**

In `scripts/convert-local-s2-icons.js`, define and use:

```js
const ICON_SIZE = 56;
const WEBP_QUALITY = 82;
const WEBP_EFFORT = 6;
```

Replace literal resize/encoder values with those constants. Guard the CLI entry point with `if (require.main === module)` so the test can import the constants without starting conversion; export the constants at the end.

- [ ] **Step 4: Run the test to verify its configuration assertions pass**

Run: `node tests/test-local-s2-icon-generation.js`

Expected: the constant assertions pass; metadata assertions still fail until assets are regenerated.

### Task 2: Restore source-quality assets and preserve hard size checks

**Files:**
- Modify: `scripts/resize-local-s2-assets.ps1:67-77`
- Modify: `tests/test-local-s2-data-packages.js:14,27-31,79`
- Modify: `miniprogram/assets/icons/*.webp` (regenerated)
- Modify: `miniprogram/assets/classes/banner/*.jpg` (regenerated)
- Modify: `miniprogram/assets/classes/emblem/*.png` (regenerated only if tool output changes)
- Modify: `miniprogram/assets/public/logo.png` (regenerated only if tool output changes)

- [ ] **Step 1: Update the failing local-package test expectation**

Replace the 200 KiB failure assertion with a diagnostic report:

```js
const totalMediaBytes = mediaSize(path.join(root, 'miniprogram'));
console.log(`local mini-program media: ${totalMediaBytes} bytes (${(totalMediaBytes / 1024).toFixed(1)} KiB)`);
```

Keep `MAIN_PACKAGE_LIMIT`, `PACKAGE_LIMIT`, all data-path assertions, and image-count assertions unchanged.

- [ ] **Step 2: Raise banner JPEG quality without changing its dimensions**

Change the `Save-ScaledJpeg` call for class banners to use quality `82`, retaining the 220px maximum width and current target paths.

- [ ] **Step 3: Regenerate local data and assets from retained originals**

Run: `node scripts/generate-local-s2-data.js`

Expected: conversion reports 390 standalone WebP icons; all icon files are recreated from `cos-upload/assets/icons`; class visual output is refreshed from `cos-upload/assets/zhiye` and `cos-upload/assets/public`.

- [ ] **Step 4: Run asset and package validations**

Run: `node tests/test-local-s2-icon-generation.js; node tests/test-local-s2-data-packages.js`

Expected: PASS. The second command prints the media total but does not fail merely because it exceeds 200 KiB; main-package and subpackage hard limits still pass.

- [ ] **Step 5: Commit the resource-quality change**

```bash
git add scripts/convert-local-s2-icons.js scripts/resize-local-s2-assets.ps1 tests/test-local-s2-icon-generation.js tests/test-local-s2-data-packages.js miniprogram/assets
git commit -m "fix: restore local mini-program image quality"
```

## Chunk 2: Native equipment-icon lazy loading

### Task 3: Cover every icon template with a focused regression test

**Files:**
- Create: `tests/test-local-icon-lazy-loading.js`
- Modify: `miniprogram/pages/index/index.wxml:140`
- Modify: `miniprogram/pages/equipment/equipment.wxml:229,356,420`
- Modify: `miniprogram/pages/build/build.wxml:95,125,157`
- Modify: `miniprogram/components/favorite-panel/favorite-panel.wxml:52`
- Modify: `miniprogram/components/equipment-detail/equipment-detail.wxml:7`

- [ ] **Step 1: Write the failing WXML coverage test**

Create a Node assertion test that reads the five templates above, finds every `<image>` tag containing `iconAsset`, and asserts there are exactly nine. For each tag, assert the tag includes both `webp="{{true}}"` and `lazy-load="{{true}}"`.

- [ ] **Step 2: Run the test to verify it fails**

Run: `node tests/test-local-icon-lazy-loading.js`

Expected: FAIL because none of the nine tags has `lazy-load="{{true}}"`.

- [ ] **Step 3: Add the native lazy-load property to all nine tags**

Add `lazy-load="{{true}}"` to the existing `<image>` element in each of the exact locations above. Do not change `src`, `mode`, `webp`, `wx:if`, CSS classes, or the fallback text elements.

- [ ] **Step 4: Run WXML and regression validations**

Run: `node tests/test-local-icon-lazy-loading.js; node tests/test-local-s2-icon-generation.js; node tests/test-local-s2-data-packages.js`

Expected: PASS. Confirm the media total is logged and that the WXML test reports nine lazy-loaded local equipment images.

- [ ] **Step 5: Perform WeChat developer-tool and device smoke checks**

In the WeChat developer tool, then on one physical device, open the home favorites, equipment list, equipment detail, and build pages. Verify crisp artwork appears in the initial viewport; scroll each long list and verify deferred icons appear without blank persistent states or UI errors.

- [ ] **Step 6: Commit the lazy-rendering change**

```bash
git add miniprogram/pages/index/index.wxml miniprogram/pages/equipment/equipment.wxml miniprogram/pages/build/build.wxml miniprogram/components/favorite-panel/favorite-panel.wxml miniprogram/components/equipment-detail/equipment-detail.wxml tests/test-local-icon-lazy-loading.js
git commit -m "perf: lazy load local equipment icons"
```
