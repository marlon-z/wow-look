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

assert.match(toc, /## Interface:\s*120100/);
assert.match(toc, /## SavedVariables:\s*WoWLookCraftExportDB/);
assert.ok(toc.indexOf('Constants.lua') < toc.indexOf('Tooltip.lua'));
assert.ok(toc.indexOf('Constants.lua') < toc.indexOf('SeasonConfig.lua'));
assert.ok(toc.indexOf('SeasonConfig.lua') < toc.indexOf('Tooltip.lua'));
assert.ok(toc.indexOf('Tooltip.lua') < toc.indexOf('Scanner.lua'));
assert.ok(toc.indexOf('Scanner.lua') < toc.indexOf('AutoCapture.lua'));
assert.ok(toc.indexOf('AutoCapture.lua') < toc.indexOf('WoWLookCraftExport.lua'));

assert.doesNotMatch(constants, /CANDIDATE_ITEM_LEVEL\s*=/);
assert.doesNotMatch(constants, /TARGET_ITEM_LEVEL\s*=/);
assert.match(seasonConfig, /releaseStatus\s*=\s*"preflight_required"/);
assert.match(seasonConfig, /testedBuild\s*=\s*69273/);
assert.match(seasonConfig, /minimumBuild\s*=\s*69273/);
assert.match(seasonConfig, /normalProfile\s*=\s*nil/);
assert.match(seasonConfig, /specialProfile\s*=\s*nil/);
assert.doesNotMatch(seasonConfig, /targetItemLevel\s*=/);

assert.match(scanner + core, /CRAFTINGORDERS_CUSTOMER_OPTIONS_PARSED/);
assert.match(scanner, /Scanner\.CompleteScan\(\)/);
assert.match(scanner, /扫描结果仍未就绪/);
assert.match(scanner, /C_CraftingOrders\.ParseCustomerOptions/);
assert.match(scanner, /Blizzard_ProfessionsCustomerOrders/);
assert.match(scanner, /EnsureCustomerOrdersModule/);
assert.match(scanner, /RetryScanRequest/);
assert.match(scanner, /GetDiagnostics/);
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

assert.match(core, /clientBuild/);
assert.match(core, /C_Timer\.After/);
assert.match(core, /CreateOptionalCraftingReagentInfoTbl/);
assert.match(core, /GetRecipeOutputItemData/);
assert.match(core, /StartAutomaticCapture/);
assert.match(core, /SLASH_WOWLOOKCRAFTEXPORT1/);
assert.match(core, /command == "preflight"/);
assert.match(core, /final_export_blocked_until_manifest_finalized/);
assert.match(core, /tonumber\(buildNumber\) < tonumber\(config\.minimumBuild\)/);
assert.match(core, /buildNumber\) ~= tonumber\(config\.testedBuild\)/);
assert.match(core, /将继续采集并记录实际 Build/);
assert.match(scanner, /正在自动读取制造订单目录/);
assert.match(core, /预检扫描已完成/);
assert.match(core, /FinishPreflightScan\("immediate"\)/);
assert.match(core, /订单目录未即时回传/);
assert.doesNotMatch(core, /BeginPreflightPolling/);
assert.match(core, /SLASH_WOWLOOKCRAFTEXPORT2\s*=\s*"\/wc"/);

for (const command of ['scan', 'capture', 'status', 'reset', 'help']) {
  assert.match(core, new RegExp(`command == "${command}"`));
}

console.log('craft exporter source contract passed');
