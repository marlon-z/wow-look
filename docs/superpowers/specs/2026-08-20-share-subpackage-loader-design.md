# Share Subpackage Loader Repair

## Goal

Restore WeChat Developer Tools startup by making the `share` subpackage's declared loader page complete.

## Context

`miniprogram/app.json` declares `packages/share/pages/loader/loader` as the page entry for the `share` subpackage. The repository contains its `loader.js`, which loads the share restoration module, but is missing its companion WXML, JSON, and WXSS files. WeChat validates every declared page at build time and rejects the project when the WXML file is absent.

## Design

Add a minimal, intentionally blank loader page alongside the existing `loader.js`:

- `loader.wxml` contains an empty view, matching the static loader pages in the class subpackages.
- `loader.json` is an empty page configuration object.
- `loader.wxss` is empty because the page does not render UI.

No routes, loading code, or `app.json` entries change. This preserves the async dependency anchor and restores the page bundle required by the platform.

## Verification

Parse `app.json`, enumerate each declared `subPackages[].pages` entry, and verify the corresponding `.js`, `.json`, `.wxml`, and `.wxss` files exist. Then rebuild in WeChat Developer Tools.
