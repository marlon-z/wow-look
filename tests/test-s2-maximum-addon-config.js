const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const config = fs.readFileSync(path.join(root, 'addon', 'WoWLookExport3', 'SeasonConfig.lua'), 'utf8');
const addon = fs.readFileSync(path.join(root, 'addon', 'WoWLookExport3', 'WoWLookExport3.lua'), 'utf8');
const toc = fs.readFileSync(path.join(root, 'addon', 'WoWLookExport3', 'WoWLookExport3.toc'), 'utf8');

assert.match(config, /releaseStatus\s*=\s*"finalized"/);
assert.match(config, /targetItemLevel\s*=\s*334/);
assert.match(config, /trackBonusId\s*=\s*12854/);
assert.match(config, /voidforged\s*=\s*\{\s*enabled\s*=\s*false/s);
assert.match(addon, /local ADDON_VERSION = "4\.1\.0-s2-maximum"/);
assert.match(addon, /equipLoc ~= "INVTYPE_NON_EQUIP"/);
assert.match(toc, /## Version: 4\.1\.0-s2-maximum/);
console.log('S2 maximum addon config tests passed.');
