# Epic Gold Logo Variants Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the preview page’s three rejected variants with six warm-only, epic gold native text Logo variants while keeping the homepage unchanged.

**Architecture:** The existing `packages/logo-preview` subpackage remains the isolated comparison surface. Its WXML carries exactly six named cards grouped by composition, WXSS uses only the approved warm palette and native primitives, and the existing static test becomes the deterministic guard against cold colors and legacy rune markup.

**Tech Stack:** WeChat Mini Program WXML/WXSS/JavaScript, Node.js assertion tests.

---

## Chunk 1: Six warm epic-gold previews

### Task 1: Make six-variant and warm-palette tests fail first

**Files:**
- Modify: `tests/test-native-logo-preview.js`

- [ ] **Step 1: Add six-variant assertions**

Replace three-variant content checks with exact presence of `王冠铭牌`、`双刃徽记`、`圣殿印章`、`徽章侧标`、`双线字标`、`分栏刻印`, and exact root class tokens `logo-preview-crown`、`logo-preview-blades`、`logo-preview-temple`、`logo-preview-badge`、`logo-preview-dual-line`、`logo-preview-column`. Parse WXML card root class attributes: assert exactly six contain `logo-preview-card`, every fixed root token occurs exactly once, and no other variant root token shares those six root attributes. Assert no `符文印记` or `logo-preview-rune-` remains.

- [ ] **Step 2: Add strict color-syntax and palette assertions**

Define the spec’s allowed 6-digit hex palette, `transparent`, and a helper that converts each palette hex to an allowed RGB triplet. Parse every `#......` and `rgba(r,g,b,a)` in preview WXSS; reject any color outside the palette or an `rgba` whose RGB is not palette-derived. Reject shorthand hex, `rgb(`, `hsl(`, `hsla(`, all CSS named color tokens (including `black`, `white`, `red`, `blue`, and `purple`), and every other color function. `transparent` is the sole permitted uncolored keyword.

- [ ] **Step 3: Run test to verify failure**

Run: `node tests/test-native-logo-preview.js`

Expected: FAIL because current preview has only three cards, retains rune selectors, and contains the existing purple palette values.

### Task 2: Implement three forged and three compact variants

**Files:**
- Modify: `miniprogram/packages/logo-preview/pages/logo-preview/logo-preview.wxml`
- Modify: `miniprogram/packages/logo-preview/pages/logo-preview/logo-preview.wxss`

- [ ] **Step 1: Replace WXML with exactly six cards**

Keep the intro and return button. Replace all current cards with six `logo-preview-card` roots using the exact class tokens from Task 1. Each card includes its named label, `艾泽配装`, and `当前赛季毕业装速查`; remove every rune card/element. First three are centered emblem compositions: crown lines + amber diamond, converging blade lines + golden diamond, and temple/medallion frame. Last three are compact: side shield badge, centered small medallion with dual rules, and narrow framed insignia column.

- [ ] **Step 2: Replace WXSS with approved warm-only styles**

Remove all `logo-preview-rune-*` and colors not in the spec palette. Implement all six classes using only native layout, borders, six-digit approved hex values, palette-derived `rgba`, `transparent`, shadows, linear gradients, and rotated `view` shapes. Do not use image/SVG/Canvas/fonts/URLs/filter or unapproved color syntax. Keep title size ≤64rpx and `width: 100%`/box sizing for 320px and 375px layouts.

- [ ] **Step 3: Run static test to verify pass**

Run: `node tests/test-native-logo-preview.js`

Expected: PASS, confirming exact six variants, legacy removal, native-only markup, and finite warm palette.

### Task 3: Run package regressions and commit

**Files:**
- Verify: `tests/test-local-s2-class-data.js`
- Verify: `tests/test-local-s2-data-packages.js`
- Verify: `tests/test-miniprogram-update.js`

- [ ] **Step 1: Run all relevant regressions**

Run `node tests/test-native-logo-preview.js`, `node tests/test-local-s2-class-data.js`, `node tests/test-local-s2-data-packages.js`, `node tests/test-miniprogram-update.js`, then `git diff --check`.

Expected: all pass; preview subpackage stays below 2 MiB, main package stays below 1.5 MiB, and no diff whitespace errors.

- [ ] **Step 2: Commit implementation**

Stage WXML, WXSS, and the static test; commit `feat: expand epic gold logo previews`.
