# Midnight S2 Tier Client Discovery Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Discover each Midnight S2 class set's nine real item IDs from the live Wardrobe client API, then export complete client-derived equipment records for all nine pieces.

**Architecture:** The five KeystoneLoot Catalyst IDs are only anchors for locating a live transmog set. For each anchor the addon obtains a source ID with `C_TransmogCollection.GetItemInfo`, intersects `C_TransmogSets.GetSetsContainingSourceID` results, and only accepts a unique candidate containing all five sources. It enumerates candidate source IDs, resolves each with `C_TransmogCollection.GetSourceItemID`, then captures every item from the client. Core five pieces retain per-specialization 2/4-piece collection; the four companion pieces are full normal equipment records without set bonuses.

**Tech Stack:** WoW Retail Lua; `C_TransmogSets`; `C_TransmogCollection`; SavedVariables JSON payload; Node.js verification tests.

---

## Chunk 1: Client discovery model

### Task 1: Make the S2 five-piece anchors data-driven

**Files:**
- Modify: `addon/WoWLookTierExport/SeasonConfig.lua`
- Modify: `addon/WoWLookTierExport/WoWLookTierExport.lua`

- [ ] Add the 65 S2 Catalyst IDs to season configuration by class and core slot.
- [ ] Replace the S1 hard-coded `TIER_SETS` item IDs with S2 configuration anchors while preserving the existing 13-class and specialization registry.
- [ ] Add a versioned discovery result record keyed by class, containing transmog set ID, source ID, appearance ID where available, resolved item ID, unresolved IDs, client build, anchor fingerprint, and status.

### Task 2: Resolve a Wardrobe set to real item IDs

**Files:**
- Modify: `addon/WoWLookTierExport/WoWLookTierExport.lua`
- Test: `tests/test-s2-tier-client-discovery.js`

- [ ] Write fixture tests for accepting exactly five core IDs plus four companion IDs, rejecting duplicates and unresolved appearance records.
- [ ] Implement API-adapter helpers for `item ID -> source ID -> candidate set ID -> set source ID -> item ID`; never treat an appearance/visual ID as an item ID.
- [ ] Require exactly nine unique item IDs in head, shoulder, chest, wrist, hands, waist, legs, feet, and back. Verify each of the five anchors occurs once in its expected slot, all source IDs are unique, and fail on an ambiguous candidate/variant.
- [ ] Test whether the current class can see off-class source records. If a class cannot be resolved, retain a visible per-class failure rather than emitting a partial set.

## Chunk 2: Export and verification

### Task 3: Export all nine as complete equipment records

**Files:**
- Modify: `addon/WoWLookTierExport/WoWLookTierExport.lua`
- Modify: `scripts/parse-export.js`
- Test: `tests/test-s2-tier-client-discovery.js`

- [ ] Queue all discovered IDs with `C_Item.RequestLoadItemDataByID`; retry after `GET_ITEM_INFO_RECEIVED`/short timer and record timeout failures.
- [ ] Add a raw-link/actual-tooltip capture path for discovered all-nine IDs. It must not call the maximum-link builder, which remains a later finalized-only operation.
- [ ] Mark five anchors `collectionKind: "bonus"` and the remaining four `collectionKind: "companion"`; both use full item records.
- [ ] Preserve full item links, stats, tooltip flags, sockets, equip/use effects, tooltip text, and source-ID evidence for every record; attach bonuses only to the five core pieces.

### Task 4: Make discovery executable and safe

**Files:**
- Modify: `addon/WoWLookTierExport/WoWLookTierExport.lua`
- Modify: `addon/WoWLookTierExport/SeasonConfig.lua`
- Modify: `docs/midnight-item-upgrade-link-rules.md`

- [ ] Add `/wowtierexport discover`, `/wowtierexport status`, and `/wowtierexport export-preflight` commands and progress/failure output.
- [ ] `export-preflight` emits the complete raw 9-piece records for every discovered class but labels them non-publishable. Keep final export blocked until every class discovery has nine resolved IDs and highest-level rules are independently verified.
- [ ] Document that transmog APIs are an ID-discovery mechanism only, never a substitute for client item tooltip data.

### Task 5: Verify and install

**Files:**
- Modify: `tests/test-s2-tier-client-discovery.js`
- Modify: `E:/World of Warcraft/_retail_/Interface/AddOns/WoWLookTierExport/*` (installation copy)

- [ ] Run Node fixture tests and addon static checks.
- [ ] Install the addon copy to the retail AddOns directory.
- [ ] Verify SavedVariables can retain versioned discovery output without publishing any incomplete data; status reports 13×9 completeness, pending/timeout loads, unresolved source IDs, and build.
- [ ] Commit implementation separately from the generated user capture data.
