# Second Account Logo Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show the complete “艾泽拉斯装备搭配” brand in the second copy's one-line homepage logo.

**Architecture:** Update the existing split-text WXML nodes and reduce only the home-logo title metrics. Gold and silver style classes, header layout, and the original Mini Program remain unchanged.

**Tech Stack:** WeChat Mini Program WXML/WXSS.

---

## Chunk 1: Homepage logo

### Task 1: Replace and fit the title

**Files:**
- Modify: `miniprogram-second-account/pages/index/index.wxml`
- Modify: `miniprogram-second-account/pages/index/index.wxss`

- [ ] **Step 1: Replace title segments**

Set the gold segment to `艾泽拉斯` and the silver segment to `装备搭配`.

- [ ] **Step 2: Fit the one-line logo**

Reduce `.home-logo-4b-title` font size from `92rpx` to `56rpx`, gap from `22rpx` to `10rpx`, and letter spacing from `6rpx` to `2rpx`; reduce the divider size to `40rpx`.

- [ ] **Step 3: Verify**

Run a source search for the two new title segments and inspect the title WXSS rule to confirm the reduced metrics.
