# Non-equipment Drop Filter Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove all non-equippable journal drops while retaining every real equippable tier item in data-4.3.x.

**Architecture:** Add one authoritative predicate to ordinary journal items using numeric item class and recognized equipment location. Keep the independent tier pipeline unchanged because both core and matching pieces are real equippable items, then audit every generated class file.

**Tech Stack:** Node.js, WoW SavedVariables JSON payload, generated JSON/JS data files.

---

## Chunk 1: Filter and regression test

### Task 1: Add a failing generated-data audit

**Files:**
- Create: `scripts/test-equipment-filter.js`

- [x] Check all13 class JSON files for unknown slots and non-weapon/non-armor records.
- [x] Check that117 tier items remain:65 core pieces and52 equippable matching pieces.
- [x] Run the audit and confirm it detects the existing invalid data before implementation.

### Task 2: Implement the converter filter

**Files:**
- Modify: `scripts/parse-export.js`

- [x] Add `isEquippableItem` using item class IDs2/4 and recognized `equipLoc`.
- [x] Apply it before ordinary items are built.
- [x] Preserve the existing item-level and class/spec filters.

### Task 3: Rebuild and verify data

**Files:**
- Update: `cos-upload/data-4.3.x/*.json`
- Update: `cos-upload/data-4.3.x/*.js`

- [x] Rebuild data-4.3.x from the validated ordinary and tier exports.
- [x] Run the new audit and all existing converter/export tests.
- [x] Confirm all130 invalid occurrences are gone and all117 tier records remain.
