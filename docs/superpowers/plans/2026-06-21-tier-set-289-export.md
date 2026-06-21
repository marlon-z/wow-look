# Tier Set 289 Export Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Export all 117 current-season tier-set and matching appearance items at a client-validated item level of 289.

**Architecture:** Keep seasonal constants in a dedicated Lua configuration file and let the addon construct Myth 6/6 links from each item's client-reported base level. The game client remains authoritative for item level and stats; a Node validation script checks source structure and the resulting SavedVariables payload before rebuilding data-4.3.x.

**Tech Stack:** World of Warcraft Lua API, Node.js validation scripts, SavedVariables JSON payload.

---

## Chunk 1: Addon implementation

### Task 1: Add failing source checks

**Files:**
- Create: `scripts/test-tier-max-export.js`

- [x] Assert the TOC loads `SeasonConfig.lua` first.
- [x] Assert the profile targets289 with Bonus IDs12806 and1674.
- [x] Assert the addon computes item-level Bonus IDs and validates exported candidates.
- [x] Run `node scripts/test-tier-max-export.js --static` and confirm failure before implementation.

### Task 2: Implement and document the289 exporter

**Files:**
- Create: `addon/WoWLookTierExport/SeasonConfig.lua`
- Modify: `addon/WoWLookTierExport/WoWLookTierExport.lua`
- Modify: `addon/WoWLookTierExport/WoWLookTierExport.toc`
- Modify: `addon/WoWLookTierExport/使用说明.md`

- [x] Add the season maximum profile.
- [x] Replace the fixed Hero 2/6 link with a dynamic Myth 6/6 link.
- [x] Validate item identity, API/tooltip level289 and track text.
- [x] Export success/failure diagnostics and version metadata.
- [x] Update the user instructions and version.
- [x] Run the static test and source checks.

## Chunk 2: In-game export and data rebuild

### Task 3: Install and collect SavedVariables

**Files:**
- Copy: `addon/WoWLookTierExport/*` to the retail AddOns directory.
- Read: `WTF/Account/513648058#1/SavedVariables/WoWLookTierExport.lua`

- [x] Copy the validated addon into the game directory.
- [x] Run `/wowtierexport all` in game and exit or reload UI to flush SavedVariables.
- [x] Run `node scripts/test-tier-max-export.js --input <SavedVariables>`.

### Task 4: Rebuild data-4.3.x

**Files:**
- Update: `WoWLookTierExport.lua`
- Update: `cos-upload/data-4.3.x/*`

- [x] Copy the validated SavedVariables input into the project.
- [x] Regenerate data-4.3.x with the existing converter.
- [x] Verify all117 tier items are289 and ordinary equipment data is unchanged.
