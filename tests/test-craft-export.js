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
const tooltip = read('Tooltip.lua');
const scanner = read('Scanner.lua');
const autoCapture = read('AutoCapture.lua');
const core = read('WoWLookCraftExport.lua');

assert.match(toc, /## Interface:\s*120007/);
assert.match(toc, /## SavedVariables:\s*WoWLookCraftExportDB/);
assert.ok(toc.indexOf('Constants.lua') < toc.indexOf('Tooltip.lua'));
assert.ok(toc.indexOf('Tooltip.lua') < toc.indexOf('Scanner.lua'));
assert.ok(toc.indexOf('Scanner.lua') < toc.indexOf('AutoCapture.lua'));
assert.ok(toc.indexOf('AutoCapture.lua') < toc.indexOf('WoWLookCraftExport.lua'));

assert.doesNotMatch(constants, /CANDIDATE_ITEM_LEVEL\s*=/);
assert.doesNotMatch(constants, /TARGET_ITEM_LEVEL\s*=/);

assert.match(scanner + core, /CRAFTINGORDERS_CUSTOMER_OPTIONS_PARSED/);
assert.match(scanner, /C_CraftingOrders\.ParseCustomerOptions/);
assert.match(scanner, /type\(option\.iLvlMin\)\s*~=\s*"number"/);
assert.match(scanner, /option\.iLvlMax\s*~=\s*nil/);
assert.match(scanner, /type\(option\.craftingQualityIDs\)\s*~=\s*"table"/);

assert.match(tooltip, /随机属性/);
assert.match(tooltip, /randomAttributeSlots/);
assert.match(tooltip, /randomAttributeCount/);
assert.ok(fs.existsSync(path.join(root, 'tests', 'test-craft-tooltip.lua')));

assert.match(autoCapture, /GetRecipeSchematic/);
assert.match(autoCapture, /GetRecipeOutputItemData/);
assert.match(autoCapture, /CraftingReagentType\.Modifying/);
assert.match(autoCapture, /FindAutomaticBestPreview/);
assert.match(autoCapture, /DeriveMaximumItemLevel/);
assert.match(autoCapture, /automatic_maximum_preview_not_found/);

assert.match(core, /maximumItemLevel/);
assert.match(core, /below_derived_maximum/);
assert.match(core, /CreateOptionalCraftingReagentInfoTbl/);
assert.match(core, /GetRecipeOutputItemData/);
assert.match(core, /StartAutomaticCapture/);
assert.match(core, /无需打开制造订单界面/);
assert.match(core, /SLASH_WOWLOOKCRAFTEXPORT1/);

for (const command of ['scan', 'capture', 'status', 'reset', 'help']) {
  assert.match(core, new RegExp(`command == "${command}"`));
}

console.log('craft exporter source contract passed');
