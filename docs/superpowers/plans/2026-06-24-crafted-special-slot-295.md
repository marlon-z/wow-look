# Crafted Special Slot 295 Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Export crafted weapons, trinkets, shields, and held-in-offhand items at verified item level 295 while keeping all other crafted gear at verified item level 285.

**Architecture:** Store normal and special crafted link profiles in `SeasonConfig.lua`. `AutoCapture.lua` selects a profile by equip location, rebuilds the highest-quality base link while retaining modifiers, verifies the resulting tooltip, and exposes a normal-profile fallback. The core scan processes candidates asynchronously so an uncached special link can be preloaded and retried without blocking or dropping the item.

**Tech Stack:** World of Warcraft Retail Lua API, SavedVariables, Node.js source-contract tests, Fengari Lua behavior tests, luaparse syntax validation.

---

## Chunk 1: Link Profiles and Tests

### Task 1: Define normal and special profiles

**Files:**
- Modify: `addon/WoWLookCraftExport/SeasonConfig.lua`
- Modify: `tests/test-craft-export.js`

- [ ] **Step 1: Write the failing source-contract assertions**

Require a normal profile at 285 with Bonus IDs `12214,13667,12497,12066,13622`, a special profile at 295 with Bonus IDs `12214,13655,12497,12066,13640,13622`, and the verified weapon/trinket/shield/held-in-offhand equip locations.

- [ ] **Step 2: Run the source-contract test and confirm failure**

Run: `node tests/test-craft-export.js`

Expected: FAIL because `specialTargetItemLevel`, `specialCraftedBonusIds`, or special equip locations are absent.

- [ ] **Step 3: Add the season configuration**

Add focused fields for normal target/bonuses, special target/bonuses, special equip locations, retry delay, and retry count. Do not add item ID allowlists.

- [ ] **Step 4: Run the source-contract test**

Run: `node tests/test-craft-export.js`

Expected: PASS.

### Task 2: Select and rebuild the correct profile

**Files:**
- Modify: `addon/WoWLookCraftExport/AutoCapture.lua`
- Modify: `tests/test-craft-tooltip.lua`

- [ ] **Step 1: Add failing Lua behavior tests**

Test that a regular armor candidate rebuilds to the existing 285 link, while weapon, trinket, shield, and held-in-offhand candidates rebuild to the six-Bonus-ID 295 link. Test that modifiers `40:<recipe>` and `38:8` remain unchanged and optional real-item Bonus IDs are absent.

- [ ] **Step 2: Run the Lua test and confirm failure**

Run: `npx --yes --package=fengari-node-cli fengari tests/test-craft-tooltip.lua`

Expected: FAIL because profile selection is not implemented.

- [ ] **Step 3: Implement profile selection**

Add a helper that returns the target level, Bonus IDs, and rule name from `candidate.equipLoc`. Update configured preview generation to use that profile and return diagnostics including target, selected profile, base level, and adjusted level.

- [ ] **Step 4: Run both focused tests**

Run:

```powershell
node tests/test-craft-export.js
npx --yes --package=fengari-node-cli fengari tests/test-craft-tooltip.lua
```

Expected: both PASS.

## Chunk 2: Retry, Fallback, and Delivery

### Task 3: Add asynchronous preload retry and 285 fallback

**Files:**
- Modify: `addon/WoWLookCraftExport/AutoCapture.lua`
- Modify: `addon/WoWLookCraftExport/WoWLookCraftExport.lua`
- Modify: `tests/test-craft-export.js`

- [ ] **Step 1: Add failing source-contract checks**

Require a finite retry path that preloads the rebuilt hyperlink through tooltip APIs and a fallback path that regenerates the normal 285 profile when a special 295 link cannot be verified.

- [ ] **Step 2: Run the source-contract test and confirm failure**

Run: `node tests/test-craft-export.js`

Expected: FAIL because retry/fallback hooks are absent.

- [ ] **Step 3: Implement finite retry**

When special-link verification returns no item level, request tooltip data and reschedule the same candidate using `C_Timer.After`. Bound attempts using season configuration.

- [ ] **Step 4: Implement fallback**

After exhausted special attempts, generate and verify the normal 285 profile. Record `specialFallbackReason` in preview metadata. Only mark the candidate unverified if normal verification also fails.

- [ ] **Step 5: Update run/profile metadata**

Record normal and special targets, Bonus ID sets, special accepted count, fallback count, pending count, and failure count in SavedVariables and status output.

- [ ] **Step 6: Run focused tests**

Run the Node and Fengari commands from Task 2.

Expected: PASS.

### Task 4: Document, validate, commit, and install

**Files:**
- Modify: `addon/WoWLookCraftExport/Constants.lua`
- Modify: `addon/WoWLookCraftExport/WoWLookCraftExport.toc`
- Modify: `addon/WoWLookCraftExport/使用说明.md`

- [ ] **Step 1: Bump the addon patch/minor version and update usage documentation**

Document the 285/295 split, verified special equip locations, preload retry, and safe fallback behavior.

- [ ] **Step 2: Run all repository tests**

Run every `tests/test-*.js`, the Fengari behavior test, luaparse on all addon Lua files, and `git diff --check`.

Expected: all PASS with no whitespace errors.

- [ ] **Step 3: Commit only scoped files**

Do not stage unrelated modified mini-program files.

- [ ] **Step 4: Install and compare hashes**

Copy direct files from `addon/WoWLookCraftExport` to `E:\World of Warcraft\_retail_\Interface\AddOns\WoWLookCraftExport`, then compare SHA-256 for every installed file.

- [ ] **Step 5: Verify game export**

Run `/reload`, `/wowcraft reset confirm`, `/wowcraft scan`, wait for completion, and `/reload`. Expected final data: 98 accepted, 28 at item level 295, 70 at item level 285, zero pending/failures, and unchanged random-attribute counts.
