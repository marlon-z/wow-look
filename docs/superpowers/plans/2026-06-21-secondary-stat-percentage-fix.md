# Secondary Stat Percentage Fix Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the level-90 build simulator's secondary-stat percentages match the game's no-racial, no-talent, no-buff baseline model.

**Architecture:** Keep equipment rating aggregation unchanged. Add a focused specialization baseline table for fixed critical-strike passives, apply the live 12.0.7 combat-rating curve to rating-derived percentages, and keep the universal eight base mastery points outside diminishing returns. Primary attributes remain equipment-only because level-90 naked values vary by class and race.

**Tech Stack:** WeChat Mini Program JavaScript/WXML, Node.js assertion tests.

**Version validation:** See `docs/superpowers/specs/2026-06-21-secondary-stat-version-validation.md` for the required checks before publishing future game-version or equipment-data updates.

---

## Chunk 1: Calculation model

### Task 1: Add specialization critical-strike baselines

**Files:**
- Create: `miniprogram/utils/stat-baselines.js`
- Test: `tests/test-stat-calc.js`

- [x] Add a failing test proving Brewmaster and Windwalker start at 10% crit while Mistweaver starts at 5%.
- [x] Add a specialization map containing the current 5% Critical Strikes passive specs.
- [x] Export `getBaseCritPercent(specId)` with a 5% fallback.
- [x] Run `node tests/test-stat-calc.js` and verify the baseline tests pass.

### Task 2: Correct combat-rating diminishing returns

**Files:**
- Modify: `miniprogram/utils/stat-calc.js`
- Test: `tests/test-stat-calc.js`

- [x] Add tests for raw-to-effective curve points `30→30`, `40→39`, `50→47`, `60→54`, `80→66`, and `200→126`.
- [x] Replace the incorrect effective-value thresholds with raw input thresholds `0, 30, 40, 50, 60, 80, 200`.
- [x] Apply the curve to the rating-derived mastery points before adding the universal eight base points.
- [x] Use the specialization baseline rather than a universal 5% crit result.
- [x] Run `node tests/test-stat-calc.js` and verify all calculations pass.

## Chunk 2: User-facing scope

### Task 3: Clarify excluded character context

**Files:**
- Modify: `miniprogram/pages/build/build.wxml`
- Modify: `docs/配装模拟器开发方案.md`

- [x] Change the build note to state that primary attributes are equipment-only and percentages exclude racial, talent, and temporary buff effects.
- [x] Correct the design document's baseline and DR tables.
- [x] Document that level-90 Strength, Agility, and Intellect do not have one universal baseline and therefore are not added.

### Task 4: Regression verification

**Files:**
- Test: `tests/test-stat-calc.js`
- Test: `tests/test-weapon-rules.js`

- [x] Run `node tests/test-stat-calc.js`.
- [x] Run `node tests/test-weapon-rules.js`.
- [x] Review `git diff` and confirm unrelated existing work remains untouched.
