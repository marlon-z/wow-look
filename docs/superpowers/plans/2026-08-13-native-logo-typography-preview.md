# Native Logo Typography Preview Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a native Mini Program subpackage preview page that lets the user compare three text-based Logo styles without altering the homepage.

**Architecture:** Register isolated `packages/logo-preview` so its WXML/WXSS/JS does not consume the nearly full main-package budget. The page owns three variants and only offers safe return-to-home; Node tests verify native-only implementation and package limits.

**Tech Stack:** WeChat Mini Program WXML/WXSS/JavaScript, Node.js assertion tests.

---

## Chunk 1: Native preview page and guardrails

### Task 1: Establish failing preview/package guards

**Files:**
- Create: `tests/test-native-logo-preview.js`
- Modify: `tests/test-local-s2-class-data.js`
- Modify: `tests/test-local-s2-data-packages.js`

- [ ] **Step 1: Write all failing registration, native-boundary, and package guards**

Create `tests/test-native-logo-preview.js`. Read `miniprogram/app.json` and the planned page files. Assert exact registration `root: 'packages/logo-preview'`, `name: 'logo-preview'`, `pages: ['pages/logo-preview/logo-preview']`; assert WXML contains `锻造铭牌`、`简洁工具`、`符文印记`、`艾泽配装` and `当前赛季毕业装速查`; permit WXML only `page-meta`、`view`、`text`、`button`, and deny `<image`、`src=`、`canvas`、`<svg`、`http://`、`https://`. Assert WXSS excludes `@font-face`、`url(`、`filter:`. Assert JS contains `getCurrentPages`、`wx.navigateBack`、`wx.reLaunch`, and excludes `wx.getStorage`、`wx.getStorageSync`、`wx.setStorage`、`wx.setStorageSync`、`wx.removeStorage`、`wx.removeStorageSync`、`wx.request`、`wx.downloadFile`、`wx.uploadFile`、`wx.loadFontFace`.

In `tests/test-local-s2-class-data.js`, replace the fixed `subPackages.length === 13` assertion with checks that each 13 required `packages/class-*` registrations and loader pages remains, then add an exact preview-subpackage registration assertion. In `tests/test-local-s2-data-packages.js`, add recursive byte calculation/report for `miniprogram/packages/logo-preview` using the existing helper and assert under `2 * 1024 * 1024`.

- [ ] **Step 2: Run tests to verify failure**

Run `node tests/test-native-logo-preview.js`, `node tests/test-local-s2-class-data.js`, and `node tests/test-local-s2-data-packages.js`.

Expected: all three FAIL because the preview package/page does not yet exist.

### Task 2: Implement isolated native preview page

**Files:**
- Modify: `miniprogram/app.json`
- Create: `miniprogram/packages/logo-preview/pages/logo-preview/logo-preview.{json,wxml,wxss,js}`

- [ ] **Step 1: Register isolated subpackage**

Add `{ "root": "packages/logo-preview", "name": "logo-preview", "pages": ["pages/logo-preview/logo-preview"] }` after 13 existing class subpackages. Do not add a main-page registration or homepage entry.

- [ ] **Step 2: Create native WXML/config/navigation**

Set title `Logo 样式预览`. WXML uses only `page-meta`、`view`、`text`、`button`: introduction, three named cards, and `bindtap="backToHome"`. No image, source, Canvas, SVG, URL, data URI, media, storage, or selection persistence. JS must use `getCurrentPages`; call `wx.navigateBack()` when depth is over one, otherwise `wx.reLaunch({ url: '/pages/index/index' })`.

- [ ] **Step 3: Add native WXSS variants**

Namespace `logo-preview-*`; use flex, `width: 100%`, border, linear gradient, `text-shadow`, `box-shadow`, and rotated views only. No `@font-face`、`url(`、`filter` or asset reference. Use headings at or below `64rpx`, no fixed page-wide widths. Implement centered medal/lines for 锻造铭牌, compact left mark/divider for 简洁工具, symmetric double-line frame for 符文印记.

- [ ] **Step 4: Run focused guards**

Run `node tests/test-native-logo-preview.js`, `node tests/test-local-s2-class-data.js`, and `node tests/test-local-s2-data-packages.js`.

Expected: all PASS; main package remains below 1.5 MiB and preview is reported below 2 MiB.

- [ ] **Step 5: Run focused regressions**

Run `node tests/test-native-logo-preview.js`, `node tests/test-local-s2-class-data.js`, `node tests/test-local-s2-data-packages.js`, `node tests/test-miniprogram-update.js`, then `git diff --check`.

Expected: all PASS; main remains below 1.5 MiB; preview is reported below 2 MiB; diff check has no output.

- [ ] **Step 6: Commit implementation**

Stage the listed subpackage, app registration, and tests; commit `feat: add native logo style preview`.
