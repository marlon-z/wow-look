const assert = require('assert');
const {
  requiresCraftingStatSelection,
  buildCraftingRandomStatLine,
  buildCraftedItemWithSelectedStats,
} = require('../miniprogram/utils/crafting');

const twoSlotItem = {
  id: 1,
  sourceType: 'crafted',
  stats: {
    primaryStats: [],
    stamina: null,
    secondary: [],
    effects: { equip: [], use: [] },
    white: {},
  },
  crafting: {
    randomAttributeCount: 2,
    randomAttributeSlots: [
      { index: 2, value: 81, label: '随机属性2' },
      { index: 1, value: 81, label: '随机属性1' },
    ],
  },
};

assert.strictEqual(requiresCraftingStatSelection(twoSlotItem), true);
assert.strictEqual(buildCraftingRandomStatLine(twoSlotItem), '随机属性 +81 / +81，配装时选择');

const selected = buildCraftedItemWithSelectedStats(twoSlotItem, ['haste', 'mastery']);
assert.deepStrictEqual(selected.stats.secondary.map((stat) => [stat.type, stat.name, stat.value]), [
  ['haste', '急速', 81],
  ['mastery', '精通', 81],
]);
assert.strictEqual(selected.statLine, '急速81 / 精通81');

const fixedAndRandom = buildCraftedItemWithSelectedStats({
  id: 2,
  sourceType: 'crafted',
  stats: {
    secondary: [{ type: 'crit', name: '暴击', value: 52 }],
  },
  crafting: {
    randomAttributeCount: 1,
    randomAttributeSlots: [{ index: 1, value: 130 }],
  },
}, ['versatility']);
assert.deepStrictEqual(fixedAndRandom.stats.secondary.map((stat) => [stat.type, stat.value]), [
  ['crit', 52],
  ['versatility', 130],
]);
assert.strictEqual(fixedAndRandom.statLine, '暴击52 / 全能130');

assert.strictEqual(buildCraftedItemWithSelectedStats(twoSlotItem, ['haste']), null);

console.log('crafting selection tests passed');
