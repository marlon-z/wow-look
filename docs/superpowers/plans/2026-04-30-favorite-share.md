# Favorite Share Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add shareable, importable favorite equipment sets without adding a database or COS writes.

**Architecture:** A focused share utility encodes local favorite snapshots into compact URL parameters and parses shared parameters on open. The index page restores shared items from COS-backed class data, displays them in a read-only modal, and merges them into local storage only when the viewer chooses to save.

**Tech Stack:** WeChat mini program JavaScript/WXML/WXSS, local `wxStorage`, existing COS JSON loaders.

---

## Chunk 1: Share Utilities

### Task 1: Add Favorite Share Utility

**Files:**
- Create: `miniprogram/utils/favorite-share.js`

- [ ] **Step 1: Implement URL payload helpers**

Create helpers to cap shared favorites at 20, group by class key, encode `classKey:itemId,itemId` segments, parse them back, and generate class-aware titles.

- [ ] **Step 2: Verify by loading module with Node**

Run: `node -e "const s=require('./miniprogram/utils/favorite-share'); console.log(s.parseFavoriteSharePayload(s.buildFavoriteSharePayload([{classKey:'deathknight',itemId:151329,className:'死亡骑士'}])))"`

Expected: parsed output includes one `deathknight` group and item id `151329`.

## Chunk 2: Index Page Behavior

### Task 2: Restore and Import Shared Favorites

**Files:**
- Modify: `miniprogram/pages/index/index.js`
- Modify: `miniprogram/utils/favorites.js`

- [ ] **Step 1: Export `saveFavorites`**

Expose the existing storage helper so imported shared favorites can merge into local favorites.

- [ ] **Step 2: Add shared favorites state and loader**

Parse `options.shareFav` during `onLoad`, load class data from COS, rebuild favorite snapshots, and open the shared panel.

- [ ] **Step 3: Add import behavior**

Merge restored shared snapshots into local favorites, skip duplicates, refresh counts, and show saved/skipped feedback.

- [ ] **Step 4: Add share title/path behavior**

When sharing from the favorites panel button, return a title based on the selected class names and a path containing the encoded payload.

## Chunk 3: Index Page UI

### Task 3: Add Share Panel UI

**Files:**
- Modify: `miniprogram/pages/index/index.wxml`
- Modify: `miniprogram/app.wxss`

- [ ] **Step 1: Add share button to favorites header**

Use a mini program `button open-type="share"` styled like the existing header actions.

- [ ] **Step 2: Add read-only shared favorites modal**

Reuse the existing grouped favorite list structure without remove controls, and add an import action footer.

- [ ] **Step 3: Add compact styles**

Extend the global favorite modal styles for the share action, shared summary, loading/error state, and import footer.

## Chunk 4: Validation

### Task 4: Static and Manual Checks

**Files:**
- Verify changed JS/WXML/WXSS files.

- [ ] **Step 1: Run syntax checks**

Run: `node --check miniprogram/utils/favorite-share.js`
Run: `node --check miniprogram/pages/index/index.js`

- [ ] **Step 2: Inspect diff**

Run: `git diff -- miniprogram/utils/favorite-share.js miniprogram/utils/favorites.js miniprogram/pages/index/index.js miniprogram/pages/index/index.wxml miniprogram/app.wxss`

- [ ] **Step 3: Manual mini program checks**

Open the mini program devtools and verify share from a multi-class favorites list, shared link restoration, detail modal, and import behavior.
