# S2 Local Crafted Preview Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an isolated local S2 preview dataset and let the mini-program load it without COS.

**Architecture:** Generate a local module from the S2 preview data directory and switch `class-data` between it and the existing COS client. Reuse the existing crafted-item schema and enforce candidate/finalized boundaries in the generator.

**Tech Stack:** Node.js generators/tests, WeChat mini-program CommonJS modules, JSON data files.

---

### Task 1: Create S2 preview data and generator

**Files:**
- Create: `scripts/build-s2-local-preview.js`
- Create: `cos-upload/data-12.1-s2-crafted-preview/*`
- Test: `tests/test-s2-local-preview.js`

- [ ] Build the preview directory from the existing S2 tier preflight source.
- [ ] Preserve release metadata and add crafted verification counters.
- [ ] Generate a CommonJS local-data module from each JSON payload.
- [ ] Verify class/overview payload consistency and crafted random-stat isolation.

### Task 2: Select the local source in the mini-program

**Files:**
- Create: `miniprogram/local-data/s2-preview.js`
- Modify: `miniprogram/utils/class-data.js`
- Test: `tests/test-s2-local-preview.js`

- [ ] Add an explicit local preview mode.
- [ ] Load local overview/class data without `wx.request` in that mode.
- [ ] Keep the existing COS request behavior unchanged when the mode is disabled.

### Task 3: Verify and hand off

**Files:**
- Test: `tests/test-s2-local-preview.js`

- [ ] Run source, data, and existing crafted selection tests.
- [ ] Do not run COS upload tooling.
- [ ] Commit only preview data, loader, generator, and tests.
