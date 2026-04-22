# WoW Addon Export Pipeline Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a WoW addon that exports Encounter Journal loot data to SavedVariables and a local Node script that converts that export into project JSON files.

**Architecture:** The addon runs inside the WoW client, scans the fixed set of seasonal dungeons and raids from the Encounter Journal, resolves per-encounter item lists and class/spec availability, then writes a serialized payload into SavedVariables. A local Node script reads that payload, enriches it with Wowhead tooltip data for ilvl 246 display stats, filters out non-equippable entries, and writes class-split files for the miniprogram.

**Tech Stack:** WoW Lua addon API, Encounter Journal API, SavedVariables, Node.js

---

## Chunk 1: Addon Export Path

### Task 1: Stabilize the WoW addon command and journal bootstrap

**Files:**
- Modify: `addon/WoWLookExport/WoWLookExport.lua`
- Modify: `addon/WoWLookExport/WoWLookExport.toc`

- [ ] Replace fragile slash-command parsing with WoW-safe string handling.
- [ ] Ensure Blizzard Encounter Journal UI/API is loaded before export starts.
- [ ] Replace hard-coded difficulty numbers with Blizzard difficulty constants where available.
- [ ] Keep the fixed 8 dungeon + 3 raid scope in one clear config block.

### Task 2: Make exported payload robust and explicit

**Files:**
- Modify: `addon/WoWLookExport/WoWLookExport.lua`

- [ ] Export top-level metadata including export time, client build, locale, scope, and counts.
- [ ] Preserve encounter -> item mapping and item -> class/spec restrictions.
- [ ] Keep SavedVariables output as a serialized JSON string for easy offline parsing.
- [ ] Improve in-game status messages so the user knows when to `/reload`.

## Chunk 2: Offline Conversion Path

### Task 3: Harden SavedVariables parsing and output filtering

**Files:**
- Modify: `scripts/parse-export.js`

- [ ] Parse the addon SavedVariables payload safely.
- [ ] Filter out non-equippable rows such as mounts, decor, and `NON_EQUIP`.
- [ ] Preserve class/spec restrictions from the export and keep instance/encounter structure.
- [ ] Continue using Wowhead tooltip as the source for ilvl 246 display stats.

### Task 4: Keep output aligned with the miniprogram

**Files:**
- Modify: `scripts/parse-export.js`
- Write: `miniprogram/data/*.json`
- Write: `miniprogram/data/*.js`

- [ ] Generate class-split payloads using the current miniprogram format.
- [ ] Keep slot / armorType normalization compatible with existing page code.
- [ ] Preserve effect text for trinkets and special items.

## Chunk 3: Usage and Validation

### Task 5: Document install and usage flow

**Files:**
- Create: `addon/WoWLookExport/README.md`
- Modify: `docs/开发文档.md`

- [ ] Document where to copy the addon folder in the WoW client.
- [ ] Document the in-game export command and the need to `/reload`.
- [ ] Document the SavedVariables file path and the local conversion command.
- [ ] Mark this addon path as the preferred data collection workflow, with API collection retained as fallback.

### Task 6: Validate syntax and command flow

**Files:**
- Validate: `addon/WoWLookExport/WoWLookExport.lua`
- Validate: `scripts/parse-export.js`

- [ ] Run Lua syntax validation outside the game where feasible.
- [ ] Run Node syntax validation for the conversion script.
- [ ] Review the generated usage instructions for correctness.
