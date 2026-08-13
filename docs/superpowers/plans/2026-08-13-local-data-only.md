# Local Data Only Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Package all required 12.1 S2 runtime data and assets inside the mini-program without changing current user-visible behavior.

**Architecture:** A deterministic Node generator trims only non-runtime capture evidence, writes thirteen per-class data subpackages, and places each class's rendered equipment icons beside its data. `class-data` retains its Promise interface but resolves local modules through `wx.loadSubPackage` and `require.async` instead of `wx.request`.

**Tech Stack:** Node.js generation/assertion scripts; WeChat mini-program JavaScript, JSON, WXML assets, and `wx.loadSubPackage`.

---

### Task 1: Generate audited local data packages

**Files:**

- Create: `scripts/generate-local-s2-data.js`
- Create: `miniprogram/packages/class-*/data/*.js`
- Create: `miniprogram/assets/icons/**`
- Create: `miniprogram/assets/classes/**`
- Test: `tests/test-local-s2-data-packages.js`

- [x] Write a failing test for all classes, preserved fields, icon existence, no audit fields, and per-package byte budget.
- [x] Generate overview and thirteen per-class data packages from finalized S2 source data.
- [x] Copy only referenced local asset files into the owning class package and rewrite asset paths to their local locations.
- [x] Run generator and test.

### Task 2: Replace remote loading without changing callers

**Files:**

- Modify: `miniprogram/app.json`
- Modify: `miniprogram/utils/class-data.js`
- Test: `tests/test-local-s2-class-data.js`

- [x] Register the thirteen subpackages.
- [x] Preserve `loadOverview()` and `loadClassData()` return contracts while loading package modules locally.
- [x] Remove 12.1 data/image COS request paths.
- [x] Run local-loader structural tests and existing page tests.

### Task 3: Verify functional equivalence and commit

**Files:**

- Modify: `docs/superpowers/plans/2026-08-13-local-data-only.md`

- [x] Run generator, all local-data tests, crafting tests, and `git diff --check`.
- [x] Inspect generated package size report and record it in the final handoff.
- [x] Mark completed steps and commit only local-data changes, generated data/assets, tests, docs, and configuration.

### Task 4: Meet WeChat quality-scan resource thresholds

**Files:**

- Modify: `scripts/generate-local-s2-data.js`
- Modify: `scripts/resize-local-s2-assets.ps1`
- Modify: `tests/test-local-s2-data-packages.js`

- [x] Move equipment icon assets from the main package into their owning class package.
- [x] Generate display-size icon thumbnails and scale public visual assets without changing paths or UI behavior.
- [x] Enforce main package < 1.5 MiB and per-package media < 200 KiB through tests.
