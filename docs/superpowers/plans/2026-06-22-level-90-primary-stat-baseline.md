# Level 90 Primary Stat Baseline Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add level-90 primary-stat and stamina baselines and apply the specialization-specific 5% matching-armor bonus without racial modifiers.

**Architecture:** Extend the existing stat-baseline module with specialization metadata and keep all calculations inside `summarizeSlots`. Persist armor type in new item snapshots while retaining a legacy subtype fallback, then expose whether the armor specialization is active in the summary.

**Tech Stack:** WeChat Mini Program JavaScript/WXML, Node.js assertion tests.

---

### Task 1: Add failing baseline and armor tests

**Files:**
- Modify: `tests/test-stat-calc.js`

- [x] Test 620 effective primary and 4600 stamina with empty slots.
- [x] Test irrelevant primary stats are excluded.
- [x] Test all eight matching armor slots activate the 5% bonus.
- [x] Test incomplete or mismatched armor does not activate the bonus.
- [x] Test DPS/healer bonuses affect primary and tank bonuses affect stamina.
- [x] Test legacy Chinese `itemSubType` armor recognition.
- [x] Run the test and confirm failure before implementation.

### Task 2: Add specialization baseline metadata

**Files:**
- Modify: `miniprogram/utils/stat-baselines.js`
- Test: `tests/test-stat-calc.js`

- [x] Add level-90 base primary and stamina constants.
- [x] Map all 40 specializations to effective primary stat and armor type.
- [x] Mark tank specializations whose armor bonus affects stamina.
- [x] Export lookup and armor-normalization helpers.

### Task 3: Calculate total character attributes

**Files:**
- Modify: `miniprogram/utils/stat-calc.js`
- Modify: `miniprogram/utils/builds.js`
- Test: `tests/test-stat-calc.js`

- [x] Preserve `armorType` in item snapshots.
- [x] Sum only the selected specialization's effective primary stat.
- [x] Add 620 effective primary and 4600 stamina baselines.
- [x] Detect eight matching armor slots.
- [x] Apply and floor the 5% bonus to the correct attribute.
- [x] Return `armorSpecializationActive` in the summary.
- [x] Run tests and confirm pass.

### Task 4: Update the mini program note and run regressions

**Files:**
- Modify: `miniprogram/pages/build/build.wxml`
- Test: `tests/test-stat-calc.js`
- Test: `tests/test-miniprogram-update.js`
- Test: `tests/test-weapon-rules.js`

- [x] State that totals include level-90 baselines and matching-armor specialization.
- [x] State that racial, talent, enchant, gem, and temporary effects remain excluded.
- [x] Run all relevant tests.
- [x] Run `git diff --check`.
