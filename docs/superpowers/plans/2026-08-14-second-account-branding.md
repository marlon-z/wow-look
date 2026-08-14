# Second Account Branding Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rename every user-facing instance of “艾泽配装” to “艾泽拉斯装备搭配” in the second Mini Program copy.

**Architecture:** Apply an exact text replacement only under `miniprogram-second-account`, leaving application logic, data, and the original project untouched. A post-change search verifies that the old brand has no remaining user-facing references.

**Tech Stack:** Node.js file traversal, JavaScript, JSON, WXML.

---

## Chunk 1: Brand text replacement

### Task 1: Update second-account labels

**Files:**
- Modify: `miniprogram-second-account/app.js`
- Modify: `miniprogram-second-account/app.json`
- Modify: `miniprogram-second-account/pages/index/index.{js,json,wxml}`
- Modify: `miniprogram-second-account/pages/build/build.{js,json}`
- Modify: `miniprogram-second-account/pages/equipment/equipment.json`
- Modify: `miniprogram-second-account/components/favorite-panel/favorite-panel.js`
- Modify: `miniprogram-second-account/utils/favorite-share.js`

- [ ] **Step 1: Replace the visible brand text**

Replace exact `艾泽配装` strings with `艾泽拉斯装备搭配` only in the copied Mini Program directory.

- [ ] **Step 2: Verify the replacement**

Run: `Get-ChildItem miniprogram-second-account -Recurse -File -Include *.js,*.json,*.wxml,*.wxss | Select-String -Pattern '艾泽配装'`

Expected: no result.

- [ ] **Step 3: Verify the new brand is present**

Run: `Get-ChildItem miniprogram-second-account -Recurse -File -Include *.js,*.json,*.wxml,*.wxss | Select-String -Pattern '艾泽拉斯装备搭配'`

Expected: results cover application, navigation, share, and favorite-poster text.
