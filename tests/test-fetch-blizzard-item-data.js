const assert = require('assert');
const { collectItemIds, compactItem } = require('../scripts/fetch-blizzard-item-data');

assert.deepEqual(collectItemIds({ classes: [
  { items: [{ itemId: 271456 }, { itemId: 271456 }, { itemId: 0 }] },
  { items: [{ itemId: 271454 }, { itemId: '271457' }] },
] }), [271454, 271456]);

const item = compactItem({
  id: 271456,
  name: '翡翠督军的淬火战角',
  level: 300,
  required_level: 90,
  is_equippable: true,
  inventory_type: { name: '头部', type: 'HEAD' },
  preview_item: { name: '翡翠督军的淬火战角', stats: [{ type: { name: '力量' }, value: 1 }], bonus_list: [1] },
});
assert.equal(item.id, 271456);
assert.equal(item.preview.stats.length, 1);
assert.deepEqual(item.preview.bonusList, [1]);
assert.equal(item.inventoryType.type, 'HEAD');

console.log('Blizzard item data utility tests passed.');
