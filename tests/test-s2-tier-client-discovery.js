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
assert(parser.includes('equip: equipEffects'), 'tier conversion must retain equip effects');
assert(parser.includes('use: useEffects'), 'tier conversion must retain use effects');

console.log('S2 tier client-discovery static tests passed.');
