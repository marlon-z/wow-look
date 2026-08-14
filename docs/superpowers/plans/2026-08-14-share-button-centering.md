# Share Button Centering Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Center the share-panel CTA label without changing its visual design or sharing behavior.

**Architecture:** The existing `button` remains unchanged in markup. Its WXSS rule uses flexbox to center the native button content and resets inherited line-height and padding that can create a visual offset.

**Tech Stack:** WeChat Mini Program WXML/WXSS.

---

## Chunk 1: CTA alignment

### Task 1: Center the button label

**Files:**
- Modify: `miniprogram/pages/index/index.wxss`

- [ ] **Step 1: Add explicit centering**

Add `display: flex`, `align-items: center`, `justify-content: center`, `padding: 0`, and `line-height: normal` to `.home-share-panel-button`.

- [ ] **Step 2: Validate the source rule**

Run: `Select-String -Path miniprogram/pages/index/index.wxss -Pattern 'home-share-panel-button' -Context 0,18`

Expected: the CTA retains its 88rpx height and includes explicit horizontal and vertical centering.

- [ ] **Step 3: Commit**

```powershell
git add miniprogram/pages/index/index.wxss docs/superpowers/plans/2026-08-14-share-button-centering.md
git commit -m "fix: center share panel button label"
```
