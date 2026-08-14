# Appearance Unlock Exclusion Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove cosmetic appearance-unlock tokens from the S2 equipment data source and Mini Program runtime packages.

**Architecture:** A small reusable sanitizer recognizes the verified Warband-collection use-effect and the audited IDs. The local S2 packaging script applies it before writing runtime modules, while a CLI command scrubs the reviewable preview JSON source and reports its effects.

**Tech Stack:** Node.js, JSON class datasets, existing Mini Program subpackage generator.

---

## Chunk 1: Reusable exclusion rule

### Task 1: Implement and test the sanitizer

**Files:**
- Create: `scripts/s2-appearance-unlock-filter.js`
- Create: `scripts/test-s2-appearance-unlock-filter.js`

- [ ] **Step 1: Write a failing test**

Create fixtures for an ordinary equipment record and records 258045, 275937, and 281227 with the Warband-collection use effect. Assert that only the cosmetic records are removed and their IDs are reported.

- [ ] **Step 2: Run the test to verify it fails**

Run: `node scripts/test-s2-appearance-unlock-filter.js`

Expected: FAIL because the filter module does not exist.

- [ ] **Step 3: Implement the minimal filter**

Export `APPEARANCE_UNLOCK_ITEM_IDS`, `isAppearanceUnlockItem`, and `filterAppearanceUnlockItems`. Match the parsed use-effect wording and require a known ID as an audit guard. Preserve all other item fields and remove empty encounters only when necessary.

- [ ] **Step 4: Run the test to verify it passes**

Run: `node scripts/test-s2-appearance-unlock-filter.js`

Expected: PASS and report three excluded IDs.

- [ ] **Step 5: Commit**

```powershell
git add scripts/s2-appearance-unlock-filter.js scripts/test-s2-appearance-unlock-filter.js
git commit -m "feat: filter S2 appearance unlock items"
```

## Chunk 2: Source and runtime integration

### Task 2: Sanitize the preview source and local subpackages

**Files:**
- Modify: `scripts/generate-local-s2-data.js`
- Modify: `cos-upload/data-12.1-s2-crafted-preview/{13 class files}.json`
- Modify: `miniprogram/packages/class-*/data/{13 class files}.js`

- [ ] **Step 1: Apply the filter during runtime package generation**

Import the sanitizer into `generate-local-s2-data.js`; filter each class dataset before calculating its metadata, collecting icons, and writing its package module.

- [ ] **Step 2: Add a source-scrub CLI path**

Use the same module to rewrite the thirteen preview class JSON files and update each `meta.itemCount` to the actual remaining record count.

- [ ] **Step 3: Regenerate local packages**

Run: `node scripts/generate-local-s2-data.js`

Expected: every class package is regenerated from the sanitized preview data.

- [ ] **Step 4: Verify both source and runtime output**

Run a Node scan over all thirteen preview JSON files and generated class JS modules. Assert IDs 258045, 275937, and 281227 have zero occurrences; assert the source total changes from 2307 to 2269 records.

- [ ] **Step 5: Commit**

```powershell
git add scripts/generate-local-s2-data.js cos-upload/data-12.1-s2-crafted-preview miniprogram/packages
git commit -m "fix: exclude cosmetic unlock tokens from S2 equipment"
```
