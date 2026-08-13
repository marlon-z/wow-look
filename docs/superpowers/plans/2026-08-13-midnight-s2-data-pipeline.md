# Midnight S2 Data Pipeline Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and release a validated 12.1 S2 PvE data pipeline whose mini-program client reads only `data-12.1-s2`.

**Architecture:** A versioned S2 rules manifest is the gate between non-publishable in-game preflight snapshots and final exports. Each addon shares the same mode/build contract; Node conversion and COS deployment refuse preflight or incomplete data. The mini-program and WCL pipeline use one new data-version constant, while stat calculations stay disabled until their S2 coefficients are independently verified.

**Tech Stack:** WoW Lua addons, Node.js CommonJS scripts, JSON, Tencent COS, WeChat Mini Program, GitHub Actions.

---

## File Structure

- Create: `season-rules/midnight-s2-12.1.json` — versioned S2 scope and rule manifest.
- Create: `scripts/validate-s2-manifest.js` — SavedVariables and manifest validation API.
- Create: `tests/test-s2-manifest.js` — manifest, build, scope and preflight rejection tests.
- Create: `tests/fixtures/s2-preflight-export.lua` — valid ordinary-equipment preflight fixture.
- Create: `tests/fixtures/s2-final-export.lua` — valid ordinary-equipment final fixture.
- Modify: `addon/WoWLookExport3/WoWLookExport3.toc`, `SeasonConfig.lua`, `WoWLookExport3.lua` — 12.1 and preflight/final modes.
- Modify: `scripts/parse-export.js`, `scripts/test-data-version-output.js`, `scripts/test-max-item-level-export.js` — final-mode converter gate.

## Chunk 1: S2 Manifest and Ordinary Equipment Preflight

### Task 1: Define and test the S2 evidence contract

**Files:**
- Create: `tests/test-s2-manifest.js`
- Create: `tests/fixtures/s2-preflight-export.lua`
- Create: `tests/fixtures/s2-final-export.lua`

- [ ] **Step 1: Write minimum fixtures**

Make decoded Lua payloads with `mode`, `clientBuild`, `scope.dungeons`, `scope.raids`, and an item map. Preflight uses `mode: "preflight"`, build `69273`, raw hyperlink, `tooltipItemLevel`, and `upgradeTrack`; final uses `mode: "final"`, `maximumProfile`, `dropVersion`, and `maxVersion`. The final fixture must contain exactly 8 dungeon IDs, one raid ID, 8 encounter IDs, one ordinary Myth 6/6 item, and one explicitly marked Myth 9 special-source item.

- [ ] **Step 2: Write failing contract tests**

Require `../scripts/validate-s2-manifest`. Assert an incomplete `{ schemaVersion: 1 }` manifest throws `/requiredScope/`; a `preflight_required` manifest throws `/finalized/`; a preflight payload passed to `validateFinalPayload` throws `/preflight/`; build `1` throws `/clientBuild/`; missing `clientBuild` throws `/clientBuild/`; an empty or seven-item dungeon scope throws `/scope/`; a changed encounter ID throws `/scope/`; each omitted item-evidence field throws `/item evidence/`; a Myth 9 item whose source is not in `raidMyth9` throws `/Myth 9/`; and a matching final fixture plus complete manifest returns `{ ok: true }`.

- [ ] **Step 3: Prove the test fails**

Run: `node tests/test-s2-manifest.js`

Expected: failure because `scripts/validate-s2-manifest.js` does not exist.

- [ ] **Step 4: Commit the failing test**

Run: `git add tests/test-s2-manifest.js tests/fixtures/s2-*.lua; git commit -m "test: define S2 export manifest contract"`

### Task 2: Add the S2 manifest validator

**Files:**
- Create: `season-rules/midnight-s2-12.1.json`
- Create: `scripts/validate-s2-manifest.js`
- Test: `tests/test-s2-manifest.js`

- [ ] **Step 1: Create the manifest shape**

Use `schemaVersion: 1`, `dataVersion: "12.1-s2"`, `clientBuild: 69273`, `seasonLabel: "Midnight Season 2"`, `releaseStatus: "preflight_required"`, and `statSimulation.status: "disabled_pending_client_validation"`. Include `requiredScope` with `dungeonInstanceIds`, `raidInstanceId`, `raidEncounterIds`, `dungeonCount: 8`, `raidCount: 1`, and `raidEncounterCount: 8`; include `maximumRules.dungeon`, `.raidDefault`, `.raidMyth9`, `.voidforge`, `tierSets`, and crafted normal/special profiles.

- [ ] **Step 2: Implement the validation API**

Export `loadManifest`, `validateManifest`, `validatePreflightPayload`, and `validateFinalPayload`. `preflight_required` permits intentionally incomplete rules; `finalized` requires exactly 8 unique dungeon IDs, one raid ID, exactly 8 unique encounter IDs, and every rule object. Final validation requires `mode === "final"`, exact `clientBuild` equality, exact set equality for dungeon/raid/encounter IDs, and final rules. For every item it requires a source version, rebuild target, matched rule name, final hyperlink, and final tooltip item level; Myth 9 items must match a manifest special-source rule. Its Error text includes `preflight`, `clientBuild`, `scope`, `item evidence`, or the missing property.

- [ ] **Step 3: Prove the test passes**

Run: `node tests/test-s2-manifest.js`

Expected: `S2 manifest validation passed`.

- [ ] **Step 4: Commit the validator**

Run: `git add season-rules scripts/validate-s2-manifest.js tests/test-s2-manifest.js; git commit -m "feat: add S2 release manifest validation"`

### Task 3: Add ordinary-equipment preflight mode

**Files:**
- Modify: `addon/WoWLookExport3/WoWLookExport3.toc`
- Modify: `addon/WoWLookExport3/SeasonConfig.lua`
- Modify: `addon/WoWLookExport3/WoWLookExport3.lua`
- Modify: `scripts/test-max-item-level-export.js`

- [ ] **Step 1: Write failing static assertions**

Replace S1-specific assertions with: TOC interface equals `120100`; config contains `testedBuild = 69273`; source registers `/wowlook preflight`; preflight writes `mode = "preflight"`, `clientBuild`, raw links, tooltip item level, upgrade track, instance IDs, and encounter IDs; preflight never calls `FillItemDetails`.

- [ ] **Step 2: Prove the static check fails**

Run: `node scripts/test-max-item-level-export.js --static`

Expected: failure for missing 12.1 interface or preflight command.

- [ ] **Step 3: Implement the command boundary**

Set the TOC to `120100`, increment addon version, and add `mode = "preflight"` plus `clientBuild = 69273` to S2 config. Split `DoExport` so `/wowlook preflight` performs discovery/display-link resolution and writes only evidence fields. Keep `/wowlook export` as final mode, but fail before scanning unless `config.releaseStatus == "finalized"`. Finalize each ordinary item with `sourceVersion`, `rebuildTarget`, `matchedRule`, `finalLink`, and `finalTooltipItemLevel`; use the manifest-selected Myth 9 source rule for qualifying items. Add assertions for all five fields, and add preflight to help and status output.

- [ ] **Step 4: Verify the surface**

Run: `node scripts/test-max-item-level-export.js --static`

Expected: pass without old 289/298 rules.

Run: `lua -e "assert(loadfile('addon/WoWLookExport3/WoWLookExport3.lua'))"`

Expected: successful syntax load when `lua` exists; otherwise record the required WoW-client load check.

- [ ] **Step 5: Commit preflight support**

Run: `git add addon/WoWLookExport3 scripts/test-max-item-level-export.js; git commit -m "feat: add S2 ordinary equipment preflight export"`

### Task 4: Gate conversion on finalized S2 evidence

**Files:**
- Modify: `scripts/parse-export.js`
- Modify: `scripts/test-data-version-output.js`
- Test: `tests/test-s2-manifest.js`

- [ ] **Step 1: Add failing parser tests**

Run `parse-export.js --input tests/fixtures/s2-preflight-export.lua --season-manifest season-rules/midnight-s2-12.1.json` and assert non-zero plus `preflight`; run it with the final fixture and incomplete manifest and assert non-zero plus `finalized` or the missing rule key.

- [ ] **Step 2: Prove the parser tests fail**

Run: `node scripts/test-data-version-output.js`

Expected: failure because `--season-manifest` is unsupported.

- [ ] **Step 3: Implement manifest-aware parsing**

Add `--season-manifest <file>`. Before icon download or output creation, call `validateFinalPayload` for ordinary input. When the manifest argument is present, reject `--tier-input` and future craft input with an explicit `S2 addon validator unavailable` failure until their Chunk 2 validators exist; never process an unvalidated second export. Derive `version`, `dataVersion`, and `clientBuild` only from the manifest, writing `clientBuild` to every class JSON and overview.

- [ ] **Step 4: Run focused regression checks**

Run: `node tests/test-s2-manifest.js; node scripts/test-data-version-output.js; node scripts/test-equipment-filter.js`

Expected: all pass and preflight creates no data directory.

- [ ] **Step 5: Commit converter gating**

Run: `git add scripts/parse-export.js scripts/test-data-version-output.js tests/test-s2-manifest.js; git commit -m "feat: require finalized S2 exports for conversion"`

## Chunk 2: Tier and Crafted Evidence

### Task 5: Define tier and craft preflight/final validators

**Files:**
- Modify: `scripts/validate-s2-manifest.js`
- Modify: `tests/test-s2-manifest.js`
- Create: `tests/fixtures/s2-tier-preflight.lua`
- Create: `tests/fixtures/s2-tier-final.lua`
- Create: `tests/fixtures/s2-craft-preflight.lua`
- Create: `tests/fixtures/s2-craft-final.lua`
- Modify: `tests/fixtures/s2-final-export.lua`

- [ ] **Step 1: Add failing fixtures and tests**

Make tier fixtures contain `mode`, `clientBuild`, all 13 class keys, per-class core/appearance `itemId` arrays, item raw links, and both 2-piece/4-piece tooltip text for every spec. Make craft fixtures contain `mode`, `clientBuild`, candidate recipe/item IDs, normal/special profile previews, and diagnostics. Extend ordinary fixtures with a Voidforge-eligible weapon or trinket carrying its allowed slot and required Bonus IDs. Test that a S1 class set, an 8-item class set, missing class, missing 2/4-piece text, missing recipe preview, mismatched build, an invalid Voidforge slot/Bonus ID, and any preflight payload are rejected by their final validators.

- [ ] **Step 2: Run and confirm expected failure**

Run: `node tests/test-s2-manifest.js`

Expected: failure because `validateTierFinalPayload` and `validateCraftFinalPayload` do not exist.

- [ ] **Step 3: Implement the addon-specific validator boundary**

Export `validateTierPreflightPayload`, `validateTierFinalPayload`, `validateCraftPreflightPayload`, and `validateCraftFinalPayload`. Tier final validation requires exactly the manifest class keys and exactly five `bonusItemIds` plus four `appearanceItemIds` per class, final tooltip/link evidence, and non-empty 2-piece/4-piece text for every configured spec, all matching manifest IDs. Ordinary final validation verifies every Voidforge-eligible item uses only manifest slots and includes every required Bonus ID. Craft final validation requires all accepted entries to match finalized normal/special manifest profiles and rejects unverified candidates. Each validator requires `clientBuild === 69273` and `mode === "final"`.

- [ ] **Step 4: Run all manifest contract tests**

Run: `node tests/test-s2-manifest.js`

Expected: `S2 manifest validation passed`.

- [ ] **Step 5: Commit the extended contract**

Run: `git add scripts/validate-s2-manifest.js tests/test-s2-manifest.js tests/fixtures/s2-final-export.lua tests/fixtures/s2-tier-*.lua tests/fixtures/s2-craft-*.lua; git commit -m "test: validate S2 tier and crafted exports"`

### Task 6: Upgrade tier export to S2 preflight and final modes

**Files:**
- Modify: `addon/WoWLookTierExport/WoWLookTierExport.toc`
- Modify: `addon/WoWLookTierExport/SeasonConfig.lua`
- Modify: `addon/WoWLookTierExport/WoWLookTierExport.lua`
- Modify: `addon/WoWLookTierExport/使用说明.md`
- Modify: `scripts/test-tier-max-export.js`

- [ ] **Step 1: Write failing S2 tier static checks**

Assert interface `120100`, Build `69273`, `/wowtierexport preflight`, explicit `mode` and `clientBuild` in payload, and no final link rebuild in preflight. Replace `289`/`117` snapshot expectations with a manifest-driven requirement: final output has 13 classes and each has 5 core plus 4 appearance IDs. Assert final output carries raw/source link, rebuilt final link, tooltip ilvl, and set-bonus validation data.

- [ ] **Step 2: Verify static tests fail**

Run: `node scripts/test-tier-max-export.js --static`

Expected: failure for missing interface or S2 mode.

- [ ] **Step 3: Add preflight command and candidate-only tier discovery**

Set the TOC to `120100`. Add `preflight` to `/wowtierexport` parsing. In preflight, serialize the configured 13×9 candidate IDs, direct client item links, tooltip item levels, set names and bonuses but do not construct maximum links or mark the payload publishable. The command must fail with a list of invalid class keys/counts rather than silently export a partial set.

- [ ] **Step 4: Make final mode manifest-gated**

Add `releaseStatus` and S2 build fields to config. Final export must require a completed, client-verified 13×9 tier configuration; emit `mode: "final"`, `clientBuild`, core/appearance ID counts, source evidence, rebuilt-link evidence, and per-spec non-empty 2/4-piece text. Update all user-facing commands and `使用说明.md` to distinguish preflight from final export.

- [ ] **Step 5: Run addon and parser checks**

Run: `node scripts/test-tier-max-export.js --static; node tests/test-s2-manifest.js`

Expected: pass. Perform `lua -e "assert(loadfile('addon/WoWLookTierExport/WoWLookTierExport.lua'))"` when Lua is installed.

- [ ] **Step 6: Commit tier preflight support**

Run: `git add addon/WoWLookTierExport scripts/test-tier-max-export.js; git commit -m "feat: prepare S2 tier export validation"`

### Task 7: Upgrade crafted-equipment export and generic builder

**Files:**
- Modify: `addon/WoWLookCraftExport/WoWLookCraftExport.toc`
- Modify: `addon/WoWLookCraftExport/SeasonConfig.lua`
- Modify: `addon/WoWLookCraftExport/WoWLookCraftExport.lua`
- Modify: `addon/WoWLookCraftExport/使用说明.md`
- Create: `scripts/build-s2-crafted.js`
- Create: `tests/test-s2-crafted-data.js`
- Modify: `tests/test-craft-export.js`

- [ ] **Step 1: Write failing S2 craft checks**

Replace hard-coded `285`, `295`, and S1 Bonus assertions with `120100`, `69273`, `/wowcraft preflight`, and manifest-profile assertions. Add a builder test that rejects a preflight SavedVariables file, rejects a final craft file with a profile mismatch, rejects ordinary/tier/craft exports with differing `clientBuild`, and produces each class JSON plus overview in a temporary `data-12.1-s2` directory only after all three final exports and the manifest are validated. Assert every generated class JSON contains its matching nine tier entries and 2/4-piece data, while overview reports 13 tier summaries.

- [ ] **Step 2: Confirm the tests fail**

Run: `node tests/test-craft-export.js; node tests/test-s2-crafted-data.js`

Expected: failure because S2 commands and builder do not exist.

- [ ] **Step 3: Implement craft preflight/final mode**

Set the TOC to `120100`. Make `/wowcraft preflight` perform the current scan and persist only candidate and actual preview evidence. Make `/wowcraft scan` final-only: it must reject `preflight_required` rules and persist `mode: "final"`, `clientBuild`, profile rule name, source preview, rebuilt link, tooltip item level, and verification result for every accepted item.

- [ ] **Step 4: Implement the manifest-driven S2 builder**

Copy only the reusable data merging logic from `build-44x-crafted.js` into `build-s2-crafted.js`; accept `--base`, `--ordinary-input`, `--tier-input`, `--craft`, `--output`, and `--season-manifest`. Before creating the output directory, validate the ordinary, tier, and craft final SavedVariables with their addon-specific validators and require one identical `clientBuild`. Then verify the `--base` JSON was produced from the same manifest/build, replace each class's tier instance with the matching validated 5 core plus 4 appearance items and their per-spec 2/4-piece data, write manifest `dataVersion` and `clientBuild` to every final class JSON and overview, retain icon lookup and random-stat construction, and derive every item count and allowed item level from the manifest rather than literal S1 counts.

- [ ] **Step 5: Run focused checks**

Run: `node tests/test-craft-export.js; node tests/test-s2-crafted-data.js; node tests/test-s2-manifest.js`

Expected: all pass and no 4.4.x path appears in S2 builder output.

- [ ] **Step 6: Commit craft work**

Run: `git add addon/WoWLookCraftExport scripts/build-s2-crafted.js tests/test-craft-export.js tests/test-s2-crafted-data.js; git commit -m "feat: prepare S2 crafted equipment pipeline"`

## Chunk 3: S2 Client, WCL, and Release Gate

### Task 8: Move WCL generation to explicit S2 metadata

**Files:**
- Modify: `scripts/wcl-preset-config.js`
- Modify: `scripts/build-wcl-presets.js`
- Modify: `scripts/update-wcl-presets.js`
- Modify: `.github/workflows/update-wcl-presets.yml`
- Modify: `tests/test-wcl-preset-config.js`
- Modify: `tests/test-wcl-build-scope.js`

- [ ] **Step 1: Write failing S2 WCL configuration tests**

Assert `DATA_VERSION === "12.1-s2"`; all generated indexes contain `dataVersion`, `clientBuild`, `seasonLabel`, `generatedAt`, and `contentType`; and production generation fails while the manifest WCL zone mapping is pending. Add a fixture mapping that represents all 8 S2 dungeon names and the Venomous Abyss raid. Assert partial runs only target `wcl-presets-test/data-12.1-s2/` and production uploads target exactly `wcl-presets/data-12.1-s2/{classKey}/{specId}`.

- [ ] **Step 2: Run and confirm failure**

Run: `node tests/test-wcl-preset-config.js; node tests/test-wcl-build-scope.js`

Expected: failure because current configuration is `4.4.x` and contains S1 zones.

- [ ] **Step 3: Implement manifest-backed WCL settings**

Load S2 version, Build and WCL zone mapping from the finalized manifest. Refuse production generation until mapping is finalized; keep sample outputs under the test prefix. Put `dataVersion: "12.1-s2"`, `clientBuild: 69273`, `seasonLabel: "Midnight Season 2"`, a numeric `generatedAt`, and a declared `contentType` in every index. Update workflow upload source and prefix to use the config version variable rather than literal `data-4.4.x`.

- [ ] **Step 4: Run WCL regression tests**

Run: `node tests/test-wcl-preset-config.js; node tests/test-wcl-build-scope.js; node tests/test-list-wcl-specs.js`

Expected: all pass and no production WCL path contains `4.4.x`.

- [ ] **Step 5: Commit WCL versioning**

Run: `git add scripts/wcl-preset-config.js scripts/build-wcl-presets.js scripts/update-wcl-presets.js .github/workflows/update-wcl-presets.yml tests/test-wcl-preset-config.js tests/test-wcl-build-scope.js; git commit -m "feat: target WCL presets at Midnight S2"`

### Task 9: Switch the mini-program to verified S2-only data

**Files:**
- Modify: `miniprogram/utils/class-data.js`
- Modify: `miniprogram/utils/wcl-presets.js`
- Modify: `miniprogram/utils/stat-baselines.js`
- Modify: `miniprogram/utils/stat-calc.js`
- Modify: `miniprogram/pages/build/build.wxml`
- Modify: `miniprogram/pages/build/build.wxss`
- Modify: `tests/test-miniprogram-update.js`
- Modify: `tests/test-stat-calc.js`

- [ ] **Step 1: Write failing mini-program tests**

Mock `wx.request` and assert overview/class requests only target `/data-12.1-s2/`; reject JSON whose `dataVersion` or `clientBuild` differs. Mock a WCL index with missing/mismatched S2 metadata, `generatedAt`, or `contentType` and assert it returns `null` plus the explicit UI state “WCL S2 预设暂未生成”. Assert `summarizeSlots` retains item count and average item level but returns `statSimulationDisabled: true`, with no percentage conversion, when S2 stat rules are pending.

- [ ] **Step 2: Verify tests fail**

Run: `node tests/test-miniprogram-update.js; node tests/test-stat-calc.js`

Expected: failure because requests still use `data-4.4.x` and simulation remains enabled.

- [ ] **Step 3: Implement S2-only remote validation**

Set `DATA_VERSION = "12.1-s2"` in `class-data.js`. Accept overview/class responses only when `dataVersion` and `clientBuild` are exact; otherwise log an expected/actual version error and resolve `null`. Require `dataVersion`, `clientBuild`, `generatedAt`, and `contentType` on WCL index/file responses. When S2 WCL data is missing or invalid, show “WCL S2 预设暂未生成” rather than the generic no-results message. Do not add a S1 fallback, local fallback, or version chooser.

- [ ] **Step 4: Implement transparent stat-simulation degradation**

Export `STAT_SIMULATION_STATUS = "disabled_pending_client_validation"` from `stat-baselines.js`. In `summarizeSlots`, still calculate selected slots, average item level, raw primary/stamina totals, and raw secondary ratings, but do not apply Level-90 baselines, armor bonus, DR conversion, or mastery coefficients while disabled. Return `statSimulationDisabled: true` and a fixed Chinese explanation. In `build.wxml`, show the average item level and raw ratings, replace percent/primary-baseline blocks with that explanation, and add a subdued warning style in `build.wxss`.

- [ ] **Step 5: Run mini-program regressions**

Run: `node tests/test-miniprogram-update.js; node tests/test-stat-calc.js; node tests/test-crafting-selection.js; node tests/test-weapon-rules.js`

Expected: all pass; no rendered data path contains `4.4.x`.

- [ ] **Step 6: Commit S2 client cutover**

Run: `git add miniprogram/utils miniprogram/pages/build tests/test-miniprogram-update.js tests/test-stat-calc.js; git commit -m "feat: read verified Midnight S2 data only"`

### Task 10: Add local/COS release verification and operator runbook

**Files:**
- Create: `scripts/verify-s2-release.js`
- Create: `scripts/promote-s2-release.js`
- Create: `tests/test-verify-s2-release.js`
- Modify: `scripts/upload-cos-prefix.js`
- Modify: `README.md`
- Modify: `docs/wcl-preset-automation.md`

- [ ] **Step 1: Write failing staging and remote verification tests**

Create temporary `data-12.1-s2` and WCL trees. Assert verifier fails before upload for missing any of 13 class JSON files, non-S2 overview, unresolved icon path, preflight marker, mismatched build, or absent S2 WCL index. The valid fixture must prove overview and every class JSON carries `clientBuild: 69273`, matching the producer assertions in Tasks 4 and 7. Mock HTTP responses and assert formal-prefix verification fails on a 404, wrong `dataVersion`, or wrong `clientBuild`; assert a staging prefix cannot be passed as a formal release prefix. Test promotion refuses to run unless an injected staging verifier succeeds, writes only `data-12.1-s2/**` and `wcl-presets/data-12.1-s2/**`, and invokes the formal verifier after both writes.

- [ ] **Step 2: Prove the verifier test fails**

Run: `node tests/test-verify-s2-release.js`

Expected: failure because `scripts/verify-s2-release.js` does not exist.

- [ ] **Step 3: Implement verification before release mutation**

Implement `verify-s2-release.js --data <dir> --wcl <dir> [--remote-base <url> --remote-prefix <prefix> --formal]`. Validate the finalized manifest, 13 class files, overview, all referenced local icons, exact S2 metadata (including `clientBuild` on every generated class JSON and overview), and each expected WCL index before printing success. With remote arguments, fetch the requested COS prefix and enforce version/build checks; reject a staging prefix when `--formal` is supplied. Extend `upload-cos-prefix.js` with `--verify-command` only as a pre-upload subprocess hook: any verifier error stops before the first `putObject` call. Implement `promote-s2-release.js --staging-data <dir> --staging-wcl <dir> --remote-base <url>` as the only formal mutation: it first runs the staging verifier, uploads exactly those two verified local trees to the formal prefixes `data-12.1-s2` and `wcl-presets/data-12.1-s2` (and no other prefix), then runs `verify-s2-release.js` with the formal remote prefixes and `--formal` before reporting success. It does not change mini-program source or delete any old prefix.

- [ ] **Step 4: Document exact operator order without credentials**

Update README and WCL automation documentation with: install three plugins; run three preflight commands after S2 opens; return all SavedVariables; finalize manifest; run the three final commands; run converter and S2 builder; run local verifier; upload staging; verify staging; promote to formal `data-12.1-s2` and `wcl-presets/data-12.1-s2`; verify the formal paths; publish the mini-program update; then the user may manually delete S1 data. Document that COS credentials remain environment variables or GitHub secrets and must not be copied into the repo.

- [ ] **Step 5: Run the complete suite**

Run: `node tests/test-s2-manifest.js; node scripts/test-max-item-level-export.js --static; node scripts/test-tier-max-export.js --static; node tests/test-craft-export.js; node tests/test-s2-crafted-data.js; node tests/test-wcl-preset-config.js; node tests/test-wcl-build-scope.js; node tests/test-miniprogram-update.js; node tests/test-stat-calc.js; node tests/test-verify-s2-release.js`

Expected: all pass. Run `git diff --check` and confirm only intended files are staged.

- [ ] **Step 6: Commit release tooling and documentation**

Run: `git add scripts/verify-s2-release.js scripts/promote-s2-release.js scripts/upload-cos-prefix.js tests/test-verify-s2-release.js README.md docs/wcl-preset-automation.md; git commit -m "feat: verify Midnight S2 release readiness"`
