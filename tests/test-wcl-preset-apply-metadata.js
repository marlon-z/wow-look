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

const result = applyWclPresetToBuild(build.id, preset, classData, 103, emptySlots(), {
  fileKey: 'mythic-plus-top', contentType: 'mythicPlus',
});
assert.ok(result.build);
assert.strictEqual(result.missing.length, 0);
assert.strictEqual(result.build.slots.wrist.wcl.permanentEnchant, 8001);
assert.deepStrictEqual(result.build.slots.wrist.wcl.gems, [{ id: 240892, name: '测试宝石' }]);
assert.deepStrictEqual(result.build.slots.wrist.selectedCraftingStats.map((stat) => stat.type), ['haste', 'mastery']);
assert.deepStrictEqual(result.build.wclPreset.enchantsGems, [{
  key: 'wrist', slot: '护腕', enchant: '测试附魔', gemText: '测试宝石',
}]);
assert.strictEqual(result.build.wclPreset.fileKey, 'mythic-plus-top');
assert.strictEqual(result.build.wclPreset.contentType, 'mythicPlus');

const snapshotBuild = createBuild('druid', '德鲁伊', 103, '野性', true);
const snapshotPreset = {
  id: 'snapshot-fixture',
  name: '#1 WCL 完整装备',
  source: { encounterName: '测试副本' },
  combatantStats: {
    strength: 0, agility: 2000, intellect: 0, stamina: 30000, armor: 8000,
    crit: 460, haste: 440, mastery: 0, versatility: 0,
  },
  slots: {
    wrist: {
      itemId: wrist.id,
      ilvl: 289,
      snapshotStatus: 'resolved',
      snapshot: {
        name: 'WCL 护腕名称',
        primaryStats: [{ type: 'agility', name: '敏捷', value: 88 }],
        stamina: { name: '耐力', value: 1234 },
        armor: 42,
        secondaryStats: [{ type: 'crit', name: '暴击', value: 49 }],
      },
    },
    head: {
      itemId: 999999,
      ilvl: 289,
      snapshotStatus: 'resolved',
      snapshot: {
        name: 'WCL 未收录头盔',
        primaryStats: [{ type: 'agility', name: '敏捷', value: 124 }],
        stamina: { name: '耐力', value: 2326 },
        armor: 244,
        secondaryStats: [{ type: 'haste', name: '急速', value: 49 }],
      },
    },
  },
};
const snapshotResult = applyWclPresetToBuild(
  snapshotBuild.id, snapshotPreset, classData, 103, emptySlots(), { enabled: true }
);
assert.strictEqual(snapshotResult.build.slots.wrist.name, 'WCL 护腕名称');
assert.deepStrictEqual(snapshotResult.build.slots.wrist.stats.secondary, [{ type: 'crit', name: '暴击', value: 49 }]);
assert.strictEqual(snapshotResult.build.slots.head.name, 'WCL 未收录头盔');
assert.strictEqual(snapshotResult.build.slots.head.iconText, '装');
assert.strictEqual(snapshotResult.build.slots.head.instanceName, 'WCL 排行榜数据');
assert.strictEqual(snapshotResult.build.summary.isWclCombatantSnapshot, true);
assert.strictEqual(snapshotResult.build.summary.secondary.crit.rating, 460);

delete global.wx;
console.log('wcl preset apply metadata tests passed');
