const assert = require('assert');

const storage = {};
global.wx = {
  getStorageSync: (key) => storage[key],
  setStorageSync: (key, value) => { storage[key] = value; },
};

const { createBuild, emptySlots } = require('../miniprogram/utils/builds');
const { flattenItems } = require('../miniprogram/utils/equipment');
const { applyWclPresetToBuild } = require('../miniprogram/utils/wcl-presets');
const classData = require('../miniprogram/packages/class-druid/data/druid');

const build = createBuild('druid', '德鲁伊', 103, '野性', true);
const items = flattenItems(classData.instances).filter((item) => (item.specs || []).indexOf(103) !== -1);
const wrist = items.find((item) => item.slot === 'wrist');
assert.ok(wrist, '测试需要野性德鲁伊的护腕');

const preset = {
  id: 'metadata-fixture',
  name: '#1 测试角色',
  source: { encounterName: '测试副本' },
  talents: { talentTree: [] },
  slots: {
    wrist: {
      itemId: wrist.id,
      ilvl: wrist.ilvl + 1,
      permanentEnchant: 8001,
      enchantName: '测试附魔',
      gems: [{ id: 240892, name: '测试宝石' }],
      craftedStats: [
        { type: 'haste', name: '急速', value: 45, randomAttributeIndex: 1 },
        { type: 'mastery', name: '精通', value: 45, randomAttributeIndex: 2 },
      ],
    },
  },
};

const result = applyWclPresetToBuild(build.id, preset, classData, 103, emptySlots());
assert.ok(result.build);
assert.strictEqual(result.missing.length, 0);
assert.strictEqual(result.build.slots.wrist.wcl.permanentEnchant, 8001);
assert.deepStrictEqual(result.build.slots.wrist.wcl.gems, [{ id: 240892, name: '测试宝石' }]);
assert.deepStrictEqual(result.build.slots.wrist.selectedCraftingStats.map((stat) => stat.type), ['haste', 'mastery']);
assert.deepStrictEqual(result.build.wclPreset.enchantsGems, [{
  key: 'wrist', slot: '护腕', enchant: '测试附魔', gemText: '测试宝石',
}]);

delete global.wx;
console.log('wcl preset apply metadata tests passed');
