const assert = require('assert');
const { mergeClassData } = require('../scripts/rebuild-s2-maximum-local-preview');

const maximum = {
  meta: {},
  instances: [{ type: 'dungeon', encounters: [{ items: [{ id: 1, ilvl: 334, sourceType: 'drop' }] }] }],
};
const existing = {
  instances: [
    { type: 'tier', encounters: [{ items: [{ id: 2, ilvl: 334, sourceType: 'tier' }] }] },
    { id: 'manufacturing', type: 'crafted', encounters: [{ items: [{ id: 3, ilvl: 331, sourceType: 'crafted' }] }] },
  ],
};
const merged = mergeClassData(maximum, existing);
assert.equal(merged.meta.itemCount, 3);
assert.equal(merged.meta.tierItemCount, 1);
assert.equal(merged.meta.craftedItemCount, 1);
assert.throws(() => mergeClassData({ instances: [{ encounters: [{ items: [{ id: 4, ilvl: 311 }] }] }] }, existing), /非 334/);
console.log('S2 maximum preview merge tests passed.');
