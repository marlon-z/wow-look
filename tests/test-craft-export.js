const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const addonDir = path.join(root, 'addon', 'WoWLookCraftExport');

function read(relativePath) {
  const fullPath = path.join(addonDir, relativePath);
  assert.ok(fs.existsSync(fullPath), `missing ${path.relative(root, fullPath)}`);
  return fs.readFileSync(fullPath, 'utf8');
}

const toc = read('WoWLookCraftExport.toc');
const constants = read('Constants.lua');
const seasonConfig = read('SeasonConfig.lua');
const tooltip = read('Tooltip.lua');
const scanner = read('Scanner.lua');
const autoCapture = read('AutoCapture.lua');
const core = read('WoWLookCraftExport.lua');

assert.match(toc, /## Interface:\s*120007/);
assert.match(toc, /## SavedVariables:\s*WoWLookCraftExportDB/);
assert.ok(toc.indexOf('Constants.lua') < toc.indexOf('Tooltip.lua'));
assert.ok(toc.indexOf('Constants.lua') < toc.indexOf('SeasonConfig.lua'));
assert.ok(toc.indexOf('SeasonConfig.lua') < toc.indexOf('Tooltip.lua'));
assert.ok(toc.indexOf('Tooltip.lua') < toc.indexOf('Scanner.lua'));
assert.ok(toc.indexOf('Scanner.lua') < toc.indexOf('AutoCapture.lua'));
assert.ok(toc.indexOf('AutoCapture.lua') < toc.indexOf('WoWLookCraftExport.lua'));

assert.doesNotMatch(constants, /CANDIDATE_ITEM_LEVEL\s*=/);
assert.doesNotMatch(constants, /TARGET_ITEM_LEVEL\s*=/);
assert.match(seasonConfig, /normalProfile\s*=\s*\{/);
assert.match(seasonConfig, /specialProfile\s*=\s*\{/);
assert.match(seasonConfig, /targetItemLevel\s*=\s*285/);
assert.match(seasonConfig, /targetItemLevel\s*=\s*295/);
for (const bonusId of [12214, 13667, 12497, 12066, 13622]) {
  assert.match(seasonConfig, new RegExp(`\\b${bonusId}\\b`));
}
for (const bonusId of [13655, 13640]) {
  assert.match(seasonConfig, new RegExp(`\\b${bonusId}\\b`));
}
for (const equipLoc of ['INVTYPE_TRINKET', 'INVTYPE_WEAPON', 'INVTYPE_2HWEAPON', 'INVTYPE_SHIELD', 'INVTYPE_HOLDABLE']) {
  assert.match(seasonConfig, new RegExp(equipLoc));
}
assert.doesNotMatch(seasonConfig, /\b8791\b/);
assert.doesNotMatch(seasonConfig, /\b8795\b/);
assert.doesNotMatch(seasonConfig, /\b8960\b/);

assert.match(scanner + core, /CRAFTINGORDERS_CUSTOMER_OPTIONS_PARSED/);
assert.match(scanner, /C_CraftingOrders\.ParseCustomerOptions/);
assert.match(scanner, /type\(option\.iLvlMin\)\s*~=\s*"number"/);
assert.match(scanner, /option\.iLvlMax\s*~=\s*nil/);
assert.match(scanner, /type\(option\.craftingQualityIDs\)\s*~=\s*"table"/);

assert.match(tooltip, /随机属性/);
assert.match(tooltip, /randomAttributeSlots/);
assert.match(tooltip, /randomAttributeCount/);
assert.ok(fs.existsSync(path.join(root, 'tests', 'test-craft-tooltip.lua')));

assert.match(autoCapture, /GetRecipeOutputItemData/);
assert.match(autoCapture, /ReplaceBonusIdsInItemLink/);
assert.match(autoCapture, /FindConfiguredMaximumPreview/);
assert.match(autoCapture, /GetConfiguredCraftProfile/);
assert.match(autoCapture, /PreloadConfiguredLink/);
assert.match(autoCapture, /configured_link_not_target_item_level/);

assert.match(core, /maximumItemLevel/);
assert.match(core, /configured_crafted_bonus_ids/);
assert.match(core, /configured_maximum_unverified/);
assert.match(core, /currentCandidateItemLevel/);
assert.match(core, /specialFallbackReason/);
assert.match(core, /specialAccepted/);
assert.match(core, /fallbackAccepted/);
assert.match(core, /PrewarmSpecialLinks/);
assert.match(core, /preloadedSpecialLinks/);
assert.match(core, /C_Timer\.After/);
assert.match(core, /CreateOptionalCraftingReagentInfoTbl/);
assert.match(core, /GetRecipeOutputItemData/);
assert.match(core, /StartAutomaticCapture/);
assert.match(core, /无需打开制造订单界面/);
assert.match(core, /SLASH_WOWLOOKCRAFTEXPORT1/);

for (const command of ['scan', 'capture', 'status', 'reset', 'help']) {
  assert.match(core, new RegExp(`command == "${command}"`));
}

console.log('craft exporter source contract passed');
