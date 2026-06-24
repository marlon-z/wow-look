# Crafted Equipment Exporter Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a reusable WoW addon that discovers current-expansion crafting-order items displayed as “item level+”, dynamically derives the version's global crafted maximum, and exports fixed and random secondary-stat data without false positives.

**Architecture:** Query `C_CraftingOrders.GetCustomerOptions` after `CRAFTINGORDERS_CUSTOMER_OPTIONS_PARSED` to discover candidates using the same fields Blizzard uses to render the plus suffix. Inspect every candidate recipe schematic and test modifying reagents at maximum crafting quality. Derive the global maximum from all successful previews, then promote only links at that value into account-wide SavedVariables.

**Tech Stack:** World of Warcraft Lua 5.1 addon API, `C_CraftingOrders`, `C_TradeSkillUI`, `C_TooltipInfo`, Node.js static regression tests.

---

## Chunk 1: Addon implementation

### Task 1: Add regression test for the addon contract

**Files:**
- Create: `tests/test-craft-export.js`

- [ ] **Step 1: Write a failing source-contract test**

The test must define the required contract: account SavedVariables, customer-option parsing event, the exact dynamic plus predicate, global maximum derivation, random-attribute parsing, and the five slash commands.

- [ ] **Step 2: Run the test and verify failure**

Run: `node tests/test-craft-export.js`

Expected: FAIL because `addon/WoWLookCraftExport` does not exist.

### Task 2: Create addon manifest and shared constants

**Files:**
- Create: `addon/WoWLookCraftExport/WoWLookCraftExport.toc`
- Create: `addon/WoWLookCraftExport/Constants.lua`

- [ ] **Step 1: Add a 12.0.7 manifest**

Declare `Interface: 120007`, `SavedVariables: WoWLookCraftExportDB`, and load files in dependency order.

- [ ] **Step 2: Add export constants**

Define addon version, supported combat equipment locations, Chinese stat labels, slot labels, and exclusion locations for profession equipment. Do not define season-specific item-level constants.

### Task 3: Implement tooltip capture and parsing

**Files:**
- Create: `addon/WoWLookCraftExport/Tooltip.lua`

- [ ] **Step 1: Implement hyperlink tooltip capture**

Prefer `C_TooltipInfo.GetHyperlink`; fall back to a hidden `GameTooltip` so the exporter still works when structured tooltip data is unavailable.

- [ ] **Step 2: Parse combat item fields**

Extract item level, slot, armor/weapon white values, primary stats, stamina, fixed secondary stats, equipment/use effects, sockets, and unique-equipped state.

- [ ] **Step 3: Parse random attribute slots generically**

Recognize lines matching `+<value> 随机属性<index>`, store sorted entries as `{ index, value, label }`, and derive `randomAttributeCount` from the number of actual lines rather than assuming one or two.

### Task 4: Implement dynamic “item level+” candidate discovery

**Files:**
- Create: `addon/WoWLookCraftExport/Scanner.lua`

- [ ] **Step 1: Request customer-option parsing**

Call `C_CraftingOrders.ParseCustomerOptions()` and finish scanning when `CRAFTINGORDERS_CUSTOMER_OPTIONS_PARSED` fires.

- [ ] **Step 2: Query all current-expansion customer options**

Use the complete required search parameter structure with empty categories, level range `0..0`, every quality enabled, and `currentExpansionOnly = true`.

- [ ] **Step 3: Apply Blizzard's visible-plus predicate**

Treat an option as scalable when `iLvlMin` is numeric, `iLvlMax == nil`, and `craftingQualityIDs` is a table. This matches Blizzard's visible-plus branch without hardcoding the current season's minimum.

- [ ] **Step 4: Exclude non-combat output items**

Use `C_Item.GetItemInfoInstant` to retain only weapon/armor output with supported player combat equip locations. Keep unresolved item-cache results pending rather than promoting them.

### Task 5: Implement actual maximum preview capture

**Files:**
- Create: `addon/WoWLookCraftExport/WoWLookCraftExport.lua`

- [ ] **Step 1: Initialize and migrate account-wide storage**

Maintain `items`, `candidates`, `rejected`, `errors`, and recomputed summary counts under a schema version.

- [ ] **Step 2: Read the active customer-order transaction**

Require `ProfessionsCustomerOrdersFrame.Form` to be visible and have a transaction. Read the recipe ID, current optional reagent allocations, highest selected crafting quality, and reagent-aware output hyperlink through `C_TradeSkillUI.GetRecipeOutputItemData`.

- [ ] **Step 3: Enforce fail-closed validation**

Require a previously discovered scalable candidate, a supported combat equip location, a readable tooltip, and an item level equal to the dynamically derived global maximum.

- [ ] **Step 4: Save the normalized formal item**

Store recipe/item/profession metadata, link, fixed stats, random slots, effects, flags, item API metadata, raw tooltip lines, capture character, build, and timestamp.

- [ ] **Step 5: Add commands and concise status output**

Implement `/wowcraft scan`, `/wowcraft capture`, `/wowcraft status`, `/wowcraft reset`, and `/wowcraft help`. Reset must require `/wowcraft reset confirm`.

### Task 5A: Automate maximum-reagent discovery

**Files:**
- Create: `addon/WoWLookCraftExport/AutoCapture.lua`
- Modify: `addon/WoWLookCraftExport/WoWLookCraftExport.lua`

- [ ] **Step 1: Read recipe schematics without opening the order UI**

Call `C_TradeSkillUI.GetRecipeSchematic` for every scalable candidate and enumerate modifying reagent slots.

- [ ] **Step 2: Test real output links**

Call `C_TradeSkillUI.GetRecipeOutputItemData` at the highest crafting quality for the base recipe and each allowed modifying reagent. Record every candidate's best actual item level, derive the global maximum, then accept only matching links.

- [ ] **Step 3: Process candidates in batches**

Use zero-delay timer batches to avoid freezing the game client. Keep unresolved recipes pending and retain manual `/wowcraft capture` as a fallback.

### Task 6: Add game-use documentation

**Files:**
- Create: `addon/WoWLookCraftExport/使用说明.md`

- [ ] **Step 1: Document installation and scan flow**

Explain the one-command background scan and the optional manual fallback for unresolved recipes.

- [ ] **Step 2: Document statuses and SavedVariables path**

Describe accepted, pending, rejected, and error states; include the account SavedVariables output location and examples for one/two random attributes.

## Chunk 2: Verification

### Task 7: Run automated and static validation

**Files:**
- Test: `tests/test-craft-export.js`

- [ ] **Step 1: Run the source-contract test**

Run: `node tests/test-craft-export.js`

Expected: PASS with dynamic candidate gate, maximum derivation, random parser, command, and manifest checks.

- [ ] **Step 2: Parse every Lua file**

Run: `npx --yes luaparse addon/WoWLookCraftExport/Constants.lua addon/WoWLookCraftExport/Tooltip.lua addon/WoWLookCraftExport/Scanner.lua addon/WoWLookCraftExport/WoWLookCraftExport.lua`

Expected: all files parse without syntax errors.

- [ ] **Step 3: Check repository diff scope**

Run: `git status --short` and `git diff --check`

Expected: only the new exporter, its tests/docs, and the implementation plan are new; unrelated pre-existing modifications remain untouched.

### Task 8: Perform in-game acceptance test

**Files:**
- Verify: `WTF/Account/<ACCOUNT>/SavedVariables/WoWLookCraftExport.lua`

- [ ] **Step 1: Verify candidate discovery**

Run `/wowcraft scan` without opening the order UI and confirm current scalable examples such as item IDs `237844` and `244746` appear as candidates regardless of the version's starting item level.

- [ ] **Step 2: Verify one-random-stat capture**

Confirm item `244746` reaches the dynamically derived maximum and exports one random slot.

- [ ] **Step 3: Verify two-random-stat capture**

Confirm item `237844` reaches the dynamically derived maximum and exports two random slots.

- [ ] **Step 4: Verify failure closure**

Confirm fixed-range items and scalable items whose best result is below the derived global maximum cannot enter `items`.
