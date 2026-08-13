# WCL Season Unavailable Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show a WCL season-unavailable message and suppress WCL preset loading until the season starts.

**Architecture:** Centralize the release state in `utils/wcl-presets.js`; the build page checks that state before issuing its existing index request and renders a dedicated state card in the existing WCL popup.

**Tech Stack:** WeChat mini-program JavaScript/WXML/WXSS and Node.js assertion tests.

---

### Task 1: Add a season availability contract

**Files:**

- Modify: `miniprogram/utils/wcl-presets.js`
- Test: `tests/test-wcl-season-unavailable.js`

- [x] Export `WCL_SEASON_AVAILABLE = false` with the WCL preset utilities.
- [x] Add an assertion that verifies the explicit disabled default.
- [x] Run the test and confirm it passes after the export is added.

### Task 2: Gate the WCL popup request path

**Files:**

- Modify: `miniprogram/pages/build/build.js`
- Test: `tests/test-wcl-season-unavailable.js`

- [x] Import the availability flag into the build page.
- [x] Add `wclSeasonAvailable` to page state.
- [x] In `openWclPresets`, show the popup in unavailable state and return before calling `loadWclPresetIndex` when disabled.
- [x] Assert the page source retains the early return before the loader call.

### Task 3: Render and validate the state card

**Files:**

- Modify: `miniprogram/pages/build/build.wxml`
- Modify: `miniprogram/pages/build/build.wxss`
- Test: `tests/test-wcl-season-unavailable.js`

- [x] Render the exact approved sentence in the existing popup when unavailable.
- [x] Add compact styling consistent with the dark/gold build UI.
- [x] Run the targeted test and existing WCL/build related tests.
- [ ] Commit only the WCL status change, docs, and tests.
