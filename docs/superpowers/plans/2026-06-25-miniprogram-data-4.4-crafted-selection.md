# Miniprogram 4.4 Crafted Selection Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Point the mini program at `data-4.4.x` and support crafted random-stat selection during build slot equipment.

**Architecture:** Keep crafted random stat handling in a small utility. Use existing equipment list and build-slot save flow; insert one modal before `setSlotItem` / `setWeaponSlotItem` when a crafted item has random attribute slots.

**Tech Stack:** WeChat mini program JavaScript/WXML/WXSS, existing Node tests.

---

## Chunk 1: Data switch and crafted stat selection

### Task 1: Add crafted stat utility

**Files:**
- Create: `miniprogram/utils/crafting.js`
- Create: `tests/test-crafting-selection.js`

- [x] **Step 1: Implement random-stat detection and stat-line helpers**
- [x] **Step 2: Implement selected-stat materialization**
- [x] **Step 3: Test one-slot and two-slot selection**

### Task 2: Update data loading and equipment display

**Files:**
- Modify: `miniprogram/utils/class-data.js`
- Modify: `miniprogram/utils/equipment.js`
- Modify: `miniprogram/components/equipment-detail/equipment-detail.wxml`

- [x] **Step 1: Switch `DATA_VERSION` to `4.4.x`**
- [x] **Step 2: Display crafted random stat line**
- [x] **Step 3: Show crafted random stat detail block**

### Task 3: Add build-slot selection modal

**Files:**
- Modify: `miniprogram/pages/equipment/equipment.js`
- Modify: `miniprogram/pages/equipment/equipment.wxml`
- Modify: `miniprogram/pages/equipment/equipment.wxss`

- [x] **Step 1: Add “制造” source filter**
- [x] **Step 2: Open stat picker for crafted random items**
- [x] **Step 3: Confirm selected stats and continue existing equip flow**

### Task 4: Verify

- [x] **Step 1: Run unit tests**
- [x] **Step 2: Run `git diff --check`**
- [x] **Step 3: Review changed files**
