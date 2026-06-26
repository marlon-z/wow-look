# WCL All Spec Presets Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Generate and upload WCL preset data for every supported class/spec while keeping the mini program loading only the active spec's COS files.

**Architecture:** Replace the Fire Mage-only scripts with shared WCL preset configuration and a generic generator that accepts `classKey/specId`. Keep the existing COS path contract: `wcl-presets/data-4.4.x/{classKey}/{specId}/`. The mini program already requests that path, so UI changes should stay minimal.

**Tech Stack:** Node.js scripts, Warcraft Logs GraphQL API, Tencent COS upload workflow, existing mini program `wx.request` loader.

---

## Chunk 1: Generic Configuration

### Task 1: Add WCL preset config

**Files:**
- Create: `scripts/wcl-preset-config.js`
- Modify: `scripts/wcl-authority-snapshot.js`
- Test: `tests/test-wcl-preset-config.js`

- [ ] Add class/spec metadata for all supported specs, including WCL English class/spec names, local names, role, and metric rule.
- [ ] Export shared M+ dungeon and raid definitions from the config.
- [ ] Replace the Fire Mage-only `DEFAULT_SPEC` export in `wcl-authority-snapshot.js` with the shared spec map.
- [ ] Add tests for metric selection: healer uses `hps`; tank and DPS use `dps`.

## Chunk 2: Generic Generator

### Task 2: Create generic WCL generator

**Files:**
- Create: `scripts/build-wcl-presets.js`
- Modify: `scripts/update-wcl-presets.js`
- Keep: existing Fire Mage scripts until generic script is verified

- [ ] Move compact slot/preset/index writing logic into the generic script.
- [ ] Accept `--class-key`, `--spec-id`, `--sample`, `--top-mplus`, `--top-raid`, `--content`, `--no-miniprogram`.
- [ ] Generate files under `cos-upload/wcl-presets/data-4.4.x/{classKey}/{specId}/`.
- [ ] Write local mini program fallback modules only for the generated spec when not using `--no-miniprogram`.
- [ ] Do not fail a whole spec when one dungeon/boss has no usable combatants; record diagnostics.

## Chunk 3: Talent Codes

### Task 3: Make talent code generation tolerant

**Files:**
- Modify: `scripts/talent-import-encoder.js`
- Modify: `scripts/build-wcl-presets.js`
- Test: `tests/test-talent-import-encoder.js`

- [ ] Add `hasBlueprint(classKey, specId, changeSetId)`.
- [ ] Keep Fire Mage export string generation unchanged.
- [ ] For specs without a blueprint, preserve `talentTree` and set `exportString` to empty with `exportStringMissingReason: "missing-blueprint"`.
- [ ] Record missing blueprint counts in diagnostics so full generation is auditable.

## Chunk 4: Sample Verification

### Task 4: Generate requested samples

**Files:**
- Generated: `cos-upload/wcl-presets/data-4.4.x/druid/104/*.json`
- Generated: `cos-upload/wcl-presets/data-4.4.x/monk/270/*.json`

- [ ] Generate Guardian Druid sample with tank metric `dps`.
- [ ] Generate Mistweaver Monk sample with healer metric `hps`.
- [ ] Verify each generated index has M+ and raid entries.
- [ ] Verify preset slots include gear and crafted stat resolution where WCL/Wowhead provides it.

## Chunk 5: Automation

### Task 5: Update the scheduled entrypoint

**Files:**
- Modify: `scripts/update-wcl-presets.js`
- Modify: `.github/workflows/update-wcl-presets.yml`
- Modify: `docs/wcl-preset-automation.md`

- [ ] Default automation runs all specs.
- [ ] Manual workflow inputs allow targeted `classKey` and `specId` reruns.
- [ ] Upload path remains `wcl-presets/`.
- [ ] Document expected output paths and how to rerun a single spec.

## Chunk 6: Validation

### Task 6: Run tests and syntax checks

**Files:**
- Test: `tests/test-wcl-preset-config.js`
- Test: `tests/test-talent-import-encoder.js`
- Check: `scripts/build-wcl-presets.js`
- Check: `scripts/update-wcl-presets.js`

- [ ] Run Node syntax checks.
- [ ] Run targeted tests.
- [ ] Generate sample data for `druid/104` and `monk/270`.
- [ ] Confirm current Fire Mage remote loading remains compatible.
