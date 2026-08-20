# Share Subpackage Loader Repair Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the WeChat mini-program buildable by completing the declared `share` subpackage loader page.

**Architecture:** The share loader remains a non-visual static dependency anchor. Add only the missing page companion files required by the mini-program page convention; keep `app.json` and runtime code unchanged.

**Tech Stack:** WeChat Mini Program configuration (`app.json`), WXML, WXSS, JavaScript.

---

## Chunk 1: Restore the loader page bundle

### Task 1: Add the missing page files

**Files:**

- Create: `miniprogram/packages/share/pages/loader/loader.wxml`
- Create: `miniprogram/packages/share/pages/loader/loader.json`
- Create: `miniprogram/packages/share/pages/loader/loader.wxss`
- Reference: `miniprogram/packages/class-warrior/pages/loader/loader.wxml`
- Reference: `miniprogram/packages/class-warrior/pages/loader/loader.json`
- Reference: `miniprogram/packages/class-warrior/pages/loader/loader.wxss`

- [ ] **Step 1: Confirm the page is declared but incomplete**

Run: `Get-Content -Raw miniprogram/app.json; Get-ChildItem miniprogram/packages/share/pages/loader`

Expected: `pages/loader/loader` is declared for the `share` package and only `loader.js` exists.

- [ ] **Step 2: Add the page markup**

Create `loader.wxml` with exactly `<view></view>` followed by a newline.

- [ ] **Step 3: Add the page configuration and stylesheet**

Create `loader.json` with exactly `{}` followed by a newline. Create an empty `loader.wxss` file.

- [ ] **Step 4: Validate every configured subpackage page**

Run:

`$app = Get-Content -Raw miniprogram/app.json | ConvertFrom-Json; $missing = foreach ($pkg in $app.subPackages) { foreach ($page in $pkg.pages) { foreach ($ext in '.js', '.json', '.wxml', '.wxss') { $path = Join-Path miniprogram ($pkg.root + '/' + $page + $ext); if (-not (Test-Path -LiteralPath $path -PathType Leaf)) { $path } } } }; if ($missing) { $missing | ForEach-Object { Write-Error "Missing subpackage page file: $_" }; exit 1 } else { Write-Output 'All subpackage page files exist.' }`

Expected: the script reports no missing files.

- [ ] **Step 5: Rebuild in WeChat Developer Tools**

Run: click Compile in WeChat Developer Tools or press `Ctrl+B`.

Expected: the prior `app.json` missing `packages/share/pages/loader/loader.wxml` startup error is gone.

- [ ] **Step 6: Commit**

Commit only the three loader companion files with message `fix: complete share subpackage loader page`.
