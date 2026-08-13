const assert = require('assert');
const { parseTooltip, TARGET_ITEM_LEVEL } = require('../scripts/build-s2-crafted-equipment');

const parsed = parseTooltip(239652, {
  quality: 4,
  icon: 'inv_helm_cloth_questbloodelf_b_01',
  tooltip: '<span>Item Level <!--ilvl-->331</span><br><span><!--amr-->84 Armor</span><br><span><!--stat5-->+183 Intellect</span><br><span><!--stat7-->+3,777 Stamina</span><br><span class="q2">+<!--rtg24-->99 Random Stat 1</span><br><span class="q2">+<!--rtg25-->99 Random Stat 2</span>',
});

assert.equal(parsed.itemLevel, TARGET_ITEM_LEVEL);
assert.deepEqual(parsed.primaryStats, [{ type: 'intellect', name: '智力', value: 183 }]);
assert.deepEqual(parsed.primaryStatOptionTypes, ['intellect']);
assert.deepEqual(parsed.stamina, { type: 'stamina', name: '耐力', value: 3777 });
assert.deepEqual(parsed.randomAttributeSlots, [
  { index: 1, value: 99, label: '随机属性1' },
  { index: 2, value: 99, label: '随机属性2' },
]);
assert.equal(parsed.white.armor, 84);

const flexiblePrimary = parseTooltip(1, { tooltip: 'Item Level <!--ilvl-->331<br><!--stat5-->+183 [Strength or Intellect]' });
assert.deepEqual(flexiblePrimary.primaryStatOptionTypes, ['strength', 'intellect']);

assert.throws(() => parseTooltip(239652, { tooltip: 'Item Level <!--ilvl-->246' }), /未得到 331 装等/);
console.log('S2 crafted tooltip parsing tests passed.');
