# Miniprogram Silent Update Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enable required-component lazy loading and silently apply downloaded mini program updates on cold or hot startup without clearing user data.

**Architecture:** Keep the existing `app.json` lazy-loading setting and centralize update-manager listener registration in one idempotent App method. Both lifecycle entry points call the method, while WeChat performs the actual automatic update check for each cold and hot startup.

**Tech Stack:** WeChat Mini Program JavaScript/JSON, Node.js assertion tests.

---

### Task 1: Add lifecycle regression tests

**Files:**
- Create: `tests/test-miniprogram-update.js`
- Read: `miniprogram/app.json`
- Read: `miniprogram/app.js`

- [x] Write a test for `lazyCodeLoading: "requiredComponents"`.
- [x] Mock `App`, `wx.getUpdateManager`, all update listeners, and forbidden UI/cache APIs.
- [x] Verify `onLaunch` and `onShow` bind each listener exactly once.
- [x] Verify `onUpdateReady` directly invokes `applyUpdate()`.
- [x] Run the test and confirm it fails against the modal-based implementation.

### Task 2: Implement silent update handling

**Files:**
- Modify: `miniprogram/app.js`
- Test: `tests/test-miniprogram-update.js`

- [x] Add an idempotent update-manager initializer.
- [x] Call it from both `onLaunch` and `onShow`.
- [x] Apply ready updates without modal UI.
- [x] Keep update failure silent.
- [x] Remove stale-time tracking and unconditional mini program restart.
- [x] Run the new test and confirm it passes.

### Task 3: Run regression checks

**Files:**
- Test: `tests/test-miniprogram-update.js`
- Test: `tests/test-stat-calc.js`
- Test: `tests/test-weapon-rules.js`

- [x] Run all three Node.js tests.
- [x] Run `git diff --check`.
- [x] Confirm only mini program behavior, its tests, and implementation documentation changed.
