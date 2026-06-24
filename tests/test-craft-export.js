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
const core = read('WoWLookCraftExport.lua');

assert.match(toc, /## Interface:\s*120007/);
assert.match(toc, /## SavedVariables:\s*WoWLookCraftExportDB/);
assert.ok(toc.indexOf('Constants.lua') < toc.indexOf('Tooltip.lua'));
assert.ok(toc.indexOf('Tooltip.lua') < toc.indexOf('Scanner.lua'));
assert.ok(toc.indexOf('Scanner.lua') < toc.indexOf('WoWLookCraftExport.lua'));

assert.match(constants, /CANDIDATE_ITEM_LEVEL\s*=\s*246/);
assert.match(constants, /TARGET_ITEM_LEVEL\s*=\s*285/);

assert.match(scanner + core, /CRAFTINGORDERS_CUSTOMER_OPTIONS_PARSED/);
assert.match(scanner, /C_CraftingOrders\.ParseCustomerOptions/);
assert.match(scanner, /option\.iLvlMin\s*~=\s*CraftExport\.CANDIDATE_ITEM_LEVEL/);
assert.match(scanner, /option\.iLvlMax\s*~=\s*nil/);
assert.match(scanner, /type\(option\.craftingQualityIDs\)\s*~=\s*"table"/);

assert.match(tooltip, /随机属性/);
assert.match(tooltip, /randomAttributeSlots/);
assert.match(tooltip, /randomAttributeCount/);
assert.ok(fs.existsSync(path.join(root, 'tests', 'test-craft-tooltip.lua')));

assert.match(core, /parsed\.itemLevel\s*~=\s*CraftExport\.TARGET_ITEM_LEVEL/);
assert.match(core, /CreateOptionalCraftingReagentInfoTbl/);
assert.match(core, /GetRecipeOutputItemData/);
assert.match(core, /SLASH_WOWLOOKCRAFTEXPORT1/);

for (const command of ['scan', 'capture', 'status', 'reset', 'help']) {
  assert.match(core, new RegExp(`command == "${command}"`));
}

console.log('craft exporter source contract passed');
