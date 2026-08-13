const assert = require('assert');
const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, '..', 'addon', 'WoWLookTierExport', 'SeasonConfig.lua');
const addonPath = path.join(__dirname, '..', 'addon', 'WoWLookTierExport', 'WoWLookTierExport.lua');
const parserPath = path.join(__dirname, '..', 'scripts', 'parse-export.js');
const config = fs.readFileSync(configPath, 'utf8');
const addon = fs.readFileSync(addonPath, 'utf8');
const parser = fs.readFileSync(parserPath, 'utf8');

const expectedClasses = ['warrior', 'paladin', 'hunter', 'rogue', 'priest', 'deathknight', 'shaman', 'mage', 'warlock', 'monk', 'druid', 'demonhunter', 'evoker'];
for (const classKey of expectedClasses) {
  const match = config.match(new RegExp(`${classKey}\\s*=\\s*\\{([^}]*)\\}`));
  assert(match, `missing S2 anchor list for ${classKey}`);
  const ids = match[1].match(/\d+/g).map(Number);
  assert.strictEqual(ids.length, 5, `${classKey} must have five core anchors`);
  assert.strictEqual(new Set(ids).size, 5, `${classKey} anchors must be unique`);
  ids.forEach((id) => assert(id >= 271000 && id < 272000, `${classKey} anchor is not S2`));
}

const manifests = [...config.matchAll(/\n\s*(\w+)\s*=\s*\{\s*(271\d+(?:\s*,\s*271\d+){8})\s*\}/g)]
  .filter((match) => expectedClasses.includes(match[1]));
assert.strictEqual(manifests.length, 13, 'S2 manifest must contain 13 class rows');
const manifestIds = manifests.flatMap((match) => match[2].match(/\d+/g).map(Number));
assert.strictEqual(manifestIds.length, 117, 'S2 manifest must contain 117 real items');
assert.strictEqual(new Set(manifestIds).size, 117, 'S2 manifest item IDs must be unique');
assert.deepEqual([...manifestIds].sort((a, b) => a - b), Array.from({ length: 117 }, (_, index) => 271451 + index));

for (const symbol of ['GetItemInfo', 'GetSetsContainingSourceID', 'GetAllSourceIDs', 'GetSourceItemID']) {
  assert(addon.includes(symbol), `missing client-discovery API: ${symbol}`);
}
for (const slot of ['head', 'shoulder', 'chest', 'wrist', 'hands', 'waist', 'legs', 'feet', 'back']) {
  assert(addon.includes(`"${slot}"`), `missing fixed nine-piece slot: ${slot}`);
}
assert(addon.includes('item_count_not_nine'), 'must reject an incomplete discovery');
assert(addon.includes('ambiguous_transmog_set_'), 'must reject ambiguous set candidates');
assert(addon.includes('item_data_pending'), 'must retry asynchronous item loads');
assert(addon.includes('/wowtierexport discover'), 'help must expose discovery command');
assert(addon.includes('export-preflight'), 'addon must export complete raw client records');
assert(addon.includes('ApplySeasonTierManifest()'), 'addon must use the verified API manifest before exporting');
assert(addon.includes('满级采集启动失败'), 'final export startup errors must be visible in chat');
assert(addon.includes('local itemIds = (WoWLookTierSeasonConfig.tierItems or {})[classKey]'), 'final export must preload the API manifest, not stale discoveries');
assert(parser.includes('equip: equipEffects'), 'tier conversion must retain equip effects');
assert(parser.includes('use: useEffects'), 'tier conversion must retain use effects');

console.log('S2 tier client-discovery static tests passed.');
