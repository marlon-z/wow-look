# Home Share Entry Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a prominent, low-friction homepage share entry that lets users invite teammates to the mini-program.

**Architecture:** Keep the feature inside the existing index page. A local boolean opens a presentation-only overlay; its native WeChat share button delegates delivery to the platform. Homepage share metadata receives a new generic default while the existing favorite-list payload path stays first.

**Tech Stack:** WeChat mini-program JavaScript, WXML, WXSS, Node.js assertion tests.

---

### Task 1: Define the homepage share contract

**Files:**

- Modify: `miniprogram/pages/index/index.js`
- Test: `tests/test-home-share-entry.js`

- [x] Add a failing assertion for the default homepage share title.
- [x] Add `showHomeShare` state and open/close handlers.
- [x] Change only the final fallback in `onShareAppMessage` and `onShareTimeline`; preserve favorite payload branches.
- [x] Run the test.

### Task 2: Add the share call-to-action and overlay

**Files:**

- Modify: `miniprogram/pages/index/index.wxml`
- Modify: `miniprogram/pages/index/index.wxss`
- Test: `tests/test-home-share-entry.js`

- [x] Add the CTA after the feature-card group and before the footer.
- [x] Add the overlay with exact approved copy and a `button open-type="share"` action.
- [x] Style a compact, gold-accented CTA and modal consistent with the existing homepage.
- [x] Run the new and existing favorite-share tests.

### Task 3: Verify and commit

**Files:**

- Modify: `docs/superpowers/plans/2026-08-13-home-share-entry.md`

- [x] Run `git diff --check` and relevant Node tests.
- [x] Mark completed plan items.
- [ ] Commit only the homepage sharing implementation, test, spec, and plan.
