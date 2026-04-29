# WoWLook Data 4.2.x Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Generate isolated 4.2.x data with complete 9-piece tier sets and point the 4.2 mini program at that data path without touching the live `/data/` directory.

**Architecture:** Keep the current export pipeline intact and use `scripts/parse-export.js --output cos-upload/data-4.2.x` for versioned data. Update mini program data loading through a single data-directory constant.

**Tech Stack:** Node.js conversion script, WeChat mini program JavaScript, COS-hosted JSON.

---

### Task 1: Tier Conversion

**Files:**
- Modify: `scripts/parse-export.js`

- [ ] Map tier `back` slots to frontend `cloak`.
- [ ] Prefer `rawItem.appearance.transmogSetName` for appearance-only tier pieces.
- [ ] Preserve bonus metadata for 5-piece effects while allowing the extra 4 pieces to display as normal tier items.

### Task 2: Generate Versioned Data

**Files:**
- Create: `cos-upload/data-4.2.x/*.json`
- Create: `cos-upload/data-4.2.x/*.js`

- [ ] Run `scripts/parse-export.js` using the existing base export and `WoWLookTierExport copy 2.lua`.
- [ ] Confirm `cos-upload/data/` remains unchanged.
- [ ] Confirm each class has 9 tier items.

### Task 3: Mini Program Data Path

**Files:**
- Modify: `miniprogram/utils/class-data.js`

- [ ] Add a versioned `DATA_DIR = 'data-4.2.x'`.
- [ ] Use `DATA_DIR` for overview and class JSON requests.

### Task 4: Verification

- [ ] Validate generated JSON parses.
- [ ] Verify monk tier contains 9 items and cloak slot uses `cloak`.
- [ ] Verify old live data directory still has the previous 5-piece tier data.
