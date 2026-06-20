# WoWLook Maximum Obtainable Item Level Export Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend WoWLookExport3 so every scanned dungeon and raid item retains its journal version and, when legal, exports a separately validated maximum-obtainable upgrade version.

**Architecture:** Keep Encounter Journal discovery and source indexing unchanged. Add a versioned season profile, a deterministic item-link builder, source-aware maximum-rule selection, and validation before maximum-version tooltip data replaces the existing top-level display fields. Preserve the original journal version for audit and make all failures explicit.

**Tech Stack:** World of Warcraft Lua addon APIs, Lua SavedVariables JSON payload, Node.js conversion and validation scripts.

---

## Chunk 1: Add the season profile and pure validation helpers

### Task 1: Create the season profile

**Files:**
- Create: `addon/WoWLookExport3/SeasonConfig.lua`
- Modify: `addon/WoWLookExport3/WoWLookExport3.toc`

- [ ] Add a profile containing build metadata, dungeon Great Vault maximum, raid Mythic maximum, common/slot bonuses, fixed-source overrides, item overrides, and non-upgradeable items.
- [ ] Load the profile before `WoWLookExport3.lua`.
- [ ] Keep all season-dependent values outside the main exporter.

### Task 2: Add maximum-version helper functions

**Files:**
- Modify: `addon/WoWLookExport3/WoWLookExport3.lua`

- [ ] Add profile validation with explicit error codes.
- [ ] Add item-level delta-to-Bonus-ID mapping for the relevant range.
- [ ] Add source-aware candidate selection for dungeon, raid, fixed-source, item override, and non-upgradeable cases.
- [ ] Add deterministic item-link construction without inheriting conflicting journal track bonuses.
- [ ] Add specialization selection from the item's validated `specsByClass` data.

## Chunk 2: Resolve, validate, and export both item versions

### Task 3: Capture reusable item versions

**Files:**
- Modify: `addon/WoWLookExport3/WoWLookExport3.lua`

- [ ] Extract the current tooltip parsing block into a reusable item-version capture helper.
- [ ] Capture the journal link as `dropVersion` before maximum-link processing.
- [ ] Validate a generated link with `C_Item.GetDetailedItemLevelInfo`, parsed tooltip item level, item identity, and equip location.
- [ ] Preserve the original display link on every failure.

### Task 4: Integrate maximum-version resolution

**Files:**
- Modify: `addon/WoWLookExport3/WoWLookExport3.lua`

- [ ] Run maximum-link resolution after class/spec availability is known.
- [ ] On success, populate `maxVersion` and use it for existing top-level item fields.
- [ ] On failure, populate `maxVersion.status` and do not mark the item as a valid maximum-level export.
- [ ] Add maximum-version counts and failure details to the SavedVariables summary.
- [ ] Keep per-item failures non-fatal while treating invalid season configuration as an export-blocking error.

## Chunk 3: Conversion compatibility and automated checks

### Task 5: Update the Node converter

**Files:**
- Modify: `scripts/parse-export.js`

- [ ] Validate the payload maximum-version metadata before publishing.
- [ ] Preserve `dropVersion` and `maxVersion` in class JSON files.
- [ ] Reject successful-looking records whose top-level item level differs from validated `maxVersion.itemLevel`.
- [ ] Print aggregate maximum-version status counts.

### Task 6: Add static regression checks

**Files:**
- Create: `scripts/test-max-item-level-export.js`
- Modify: `package.json` if a root package manifest is present and appropriate.

- [ ] Verify the TOC loads `SeasonConfig.lua` first.
- [ ] Verify the profile contains required numeric fields and no placeholder Bonus IDs.
- [ ] Verify a supplied SavedVariables export contains both item versions and consistent successful maximum versions.
- [ ] Verify invalid/mismatched records cause a non-zero exit code.

Run: `node scripts/test-max-item-level-export.js --static`

Expected: all static checks pass.

## Chunk 4: Documentation and end-to-end verification

### Task 7: Write the tester guide

**Files:**
- Create: `docs/最高装等导出测试使用说明.md`

- [ ] Document addon installation and `/wowlook` export steps.
- [ ] Document how to inspect summary/failure states.
- [ ] Document representative dungeon, raid, ring/neck, weapon, trinket, and special-source checks.
- [ ] Document Node validation and conversion commands.
- [ ] Document pass/fail criteria and how to report mismatches.

### Task 8: Run repository checks

**Files:**
- Verify only; no unrelated edits.

- [ ] Run `node --check scripts/parse-export.js`.
- [ ] Run `node --check scripts/test-max-item-level-export.js`.
- [ ] Run static maximum-export tests.
- [ ] Run existing available project checks relevant to converter output.
- [ ] Run `git diff --check` and review the complete diff.
- [ ] Record checks that require an actual WoW client as manual verification in the tester guide.

## Chunk 5: Weapon and trinket 298 cap

### Task 9: Apply the current-season special slot cap

**Files:**
- Modify: `addon/WoWLookExport3/SeasonConfig.lua`
- Modify: `addon/WoWLookExport3/WoWLookExport3.lua`
- Modify: `scripts/test-max-item-level-export.js`
- Modify: `scripts/parse-export.js`
- Modify: `docs/最高装等导出测试使用说明.md`
- Modify: `docs/superpowers/specs/2026-06-20-max-item-level-export-design.md`

- [ ] Configure item level 298 for every current-season weapon-slot and trinket-slot item.
- [ ] Apply the slot cap after normal source/track selection and before link construction.
- [ ] Keep non-upgradeable item exclusions authoritative.
- [ ] Export the configured weapon/trinket target levels in `maximumProfile`.
- [ ] Validate that special-slot links resolve to exactly 298 in the game client.
- [ ] Update static checks and manual representative-item tests.

## Chunk 6: Slash command startup failure

### Task 10: Correct build parsing and isolate command errors

**Files:**
- Modify: `scripts/test-max-item-level-export.js`
- Modify: `addon/WoWLookExport3/WoWLookExport3.lua`
- Modify: `addon/WoWLookExport3/WoWLookExport3.toc`
- Modify: `docs/最高装等导出测试使用说明.md`

- [x] Add static assertions that reject `tonumber(select(4, GetBuildInfo()))` and require a protected slash-command entry point.
- [x] Run `node scripts/test-max-item-level-export.js --static` and verify the new assertion fails.
- [x] Read the second `GetBuildInfo()` result into a local variable before calling `tonumber`.
- [x] Execute command dispatch through `xpcall`; persist and print unexpected errors without rethrowing into `ChatFrameEditBox`.
- [x] Upgrade the addon source and TOC versions to `3.3.2`.
- [x] Run Lua parsing, Node static checks, and `git diff --check`.
- [x] Synchronize the verified addon files to the retail AddOns directory and compare hashes.

## Chunk 7: Voidforged weapon and trinket links

### Task 11: Replace the generic 298 cap with the real Voidforged template

**Files:**
- Modify: `addon/WoWLookExport3/SeasonConfig.lua`
- Modify: `addon/WoWLookExport3/WoWLookExport3.lua`
- Modify: `scripts/test-max-item-level-export.js`
- Modify: `tests/fixtures/max-export-valid.lua`
- Create: `tests/fixtures/max-export-invalid-voidforged.lua`
- Modify: `docs/最高装等导出测试使用说明.md`

- [x] Add failing static checks for Voidforged context `35`, common bonuses `13440`/`6652`, marker `13654`, trinket bonus `12699`, and weapon bonus `12701`.
- [x] Replace `specialSlotCap` with a validated `voidforged` configuration block.
- [x] Classify eligible slots as trinket or weapon after normal source selection, while preserving non-upgradeable and fixed-source rules.
- [x] Build Voidforged links from the fixed context and slot-specific template instead of the normal item-level delta and Myth 6/6 track bonuses.
- [x] Export the Voidforged profile and use the source constant `ADDON_VERSION` in payload metadata.
- [x] Validate that successful 298 weapon/trinket links carry the expected marker and slot bonus.
- [x] Upgrade source, TOC, load message, fixtures, and documentation to `3.3.3`.
- [x] Run Lua parsing, Node positive/negative checks, and `git diff --check`.
- [x] Synchronize the verified addon files to the retail AddOns directory and compare hashes.
