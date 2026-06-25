const assert = require('assert');
const {
  BUILD_SLOT_KEYS,
  calcStatPercent,
  calcMasteryPercent,
  summarizeSlots,
} = require('../miniprogram/utils/stat-calc');
const { SPEC_CHARACTER_BASELINES } = require('../miniprogram/utils/stat-baselines');
const { MASTERY_COEFFICIENTS } = require('../miniprogram/utils/mastery-coefficients');
const builds = require('../miniprogram/utils/builds');

function emptySlots() {
  const slots = {};
  BUILD_SLOT_KEYS.forEach((key) => { slots[key] = null; });
  return slots;
}

function assertClose(actual, expected, message) {
  assert.ok(Math.abs(actual - expected) < 0.001, `${message}: expected ${expected}, got ${actual}`);
}

const ARMOR_SLOTS = ['head', 'shoulder', 'chest', 'wrist', 'hand', 'waist', 'legs', 'feet'];

function armorItem(armorType, primaryType, primaryValue, staminaValue, itemSubType) {
  const primaryNames = { strength: '力量', agility: '敏捷', intellect: '智力' };
  return {
    ilvl: 100,
    armorType,
    itemSubType: itemSubType || '',
    stats: {
      primaryStats: primaryType ? [{ type: primaryType, name: primaryNames[primaryType], value: primaryValue || 0 }] : [],
      stamina: staminaValue || 0,
      secondary: [],
    },
  };
}

function fillArmor(slots, armorType, specPrimary, legacySubtype) {
  ARMOR_SLOTS.forEach((slot) => {
    slots[slot] = armorItem(armorType, specPrimary, 100, 100, legacySubtype);
  });
}

assert.strictEqual(Object.keys(SPEC_CHARACTER_BASELINES).length, 40, '必须覆盖当前全部40个专精');
assert.deepStrictEqual(
  Object.keys(SPEC_CHARACTER_BASELINES).sort(),
  Object.keys(MASTERY_COEFFICIENTS).sort(),
  '主属性基础配置必须与当前专精列表完全一致'
);

// Live 12.0.7 curve: raw rating-derived percentage -> effective percentage.
[
  [30, 30],
  [40, 39],
  [50, 47],
  [60, 54],
  [80, 66],
  [200, 126],
  [250, 126],
].forEach(([raw, effective]) => {
  assertClose(calcStatPercent(raw * 46, 'crit'), effective, `crit DR ${raw}`);
});

const slots = emptySlots();
assert.strictEqual(summarizeSlots(slots, 268).secondary.crit.percent, 10, '酒仙基础暴击应为10%');
assert.strictEqual(summarizeSlots(slots, 269).secondary.crit.percent, 10, '踏风基础暴击应为10%');
assert.strictEqual(summarizeSlots(slots, 270).secondary.crit.percent, 5, '织雾基础暴击应为5%');
assert.strictEqual(summarizeSlots(slots, 103).secondary.crit.percent, 10, '野德基础暴击应为10%');
assert.strictEqual(summarizeSlots(slots, 102).secondary.crit.percent, 5, '平衡德基础暴击应为5%');
assert.strictEqual(summarizeSlots(slots, 269).secondary.haste.percent, 0, '基础急速应为0%');
assert.strictEqual(summarizeSlots(slots, 269).secondary.versatility.percent, 0, '基础全能应为0%');
assertClose(summarizeSlots(slots, 269).secondary.mastery.percent, 18.63, '踏风应包含8点基础精通');
assert.deepStrictEqual(
  summarizeSlots(slots, 269).primaryStats,
  [{ type: 'agility', name: '敏捷', value: 620 }],
  '踏风空配装应包含90级基础敏捷'
);
assert.strictEqual(summarizeSlots(slots, 269).stamina, 4600, '空配装应包含90级基础耐力');
assert.strictEqual(summarizeSlots(slots, 269).armorSpecializationActive, false, '空配装不能触发护甲专精');

const mixedPrimarySlots = emptySlots();
mixedPrimarySlots.head = {
  ilvl: 100,
  armorType: 'leather',
  stats: {
    primaryStats: [
      { type: 'agility', name: '敏捷', value: 50 },
      { type: 'intellect', name: '智力', value: 100 },
    ],
    stamina: 25,
    secondary: [],
  },
};
assert.deepStrictEqual(
  summarizeSlots(mixedPrimarySlots, 269).primaryStats,
  [{ type: 'agility', name: '敏捷', value: 670 }],
  '只应累计当前专精有效主属性'
);

const fullWindwalkerSlots = emptySlots();
fillArmor(fullWindwalkerSlots, 'leather', 'agility');
let attributeSummary = summarizeSlots(fullWindwalkerSlots, 269);
assert.strictEqual(attributeSummary.armorSpecializationActive, true, '八件皮甲应触发踏风护甲专精');
assert.strictEqual(attributeSummary.primaryStats[0].value, 1491, '踏风护甲专精应提高总敏捷并向下取整');
assert.strictEqual(attributeSummary.stamina, 5400, '非坦克护甲专精不应提高耐力');

const incompleteSlots = emptySlots();
ARMOR_SLOTS.slice(0, 7).forEach((slot) => {
  incompleteSlots[slot] = armorItem('leather', 'agility', 100, 100);
});
attributeSummary = summarizeSlots(incompleteSlots, 269);
assert.strictEqual(attributeSummary.armorSpecializationActive, false, '护甲未穿齐不能触发护甲专精');
assert.strictEqual(attributeSummary.primaryStats[0].value, 1320, '未穿齐时主属性不能乘1.05');

const mismatchedSlots = emptySlots();
fillArmor(mismatchedSlots, 'leather', 'agility');
mismatchedSlots.feet.armorType = 'cloth';
attributeSummary = summarizeSlots(mismatchedSlots, 269);
assert.strictEqual(attributeSummary.armorSpecializationActive, false, '任一护甲类型错误不能触发护甲专精');
assert.strictEqual(attributeSummary.primaryStats[0].value, 1420, '护甲类型错误时主属性不能乘1.05');

const fullBrewmasterSlots = emptySlots();
fillArmor(fullBrewmasterSlots, 'leather', 'agility');
attributeSummary = summarizeSlots(fullBrewmasterSlots, 268);
assert.strictEqual(attributeSummary.armorSpecializationActive, true, '八件皮甲应触发酒仙护甲专精');
assert.strictEqual(attributeSummary.primaryStats[0].value, 1420, '坦克护甲专精不应提高主属性');
assert.strictEqual(attributeSummary.stamina, 5670, '酒仙护甲专精应提高总耐力并向下取整');

const legacySlots = emptySlots();
fillArmor(legacySlots, '', 'intellect', '皮甲');
attributeSummary = summarizeSlots(legacySlots, 270);
assert.strictEqual(attributeSummary.armorSpecializationActive, true, '旧快照中文护甲类型应能触发护甲专精');
assert.strictEqual(attributeSummary.primaryStats[0].value, 1491, '织雾护甲专精应提高总智力');

const snapshot = builds.buildItemSnapshot({
  id: 1,
  name: '测试皮甲',
  slot: 'head',
  armorType: 'leather',
  stats: { primaryStats: [], stamina: 0, secondary: [] },
});
assert.strictEqual(snapshot.armorType, 'leather', '新配装快照必须保存护甲类型');

global.wx = {
  getStorageSync() {
    return [{
      id: 'legacy-build',
      classKey: 'monk',
      specId: 269,
      slots: emptySlots(),
      summary: { stamina: 0, primaryStats: [] },
    }];
  },
};
const migratedBuild = builds.getBuilds()[0];
assert.strictEqual(migratedBuild.summary.stamina, 4600, '读取旧配装时应重新计算基础耐力');
assert.strictEqual(migratedBuild.summary.primaryStats[0].value, 620, '读取旧配装时应重新计算基础主属性');
delete global.wx;

// Base mastery points are not diminished; only rating-derived points are.
const windwalkerAt40RawPoints = calcMasteryPercent(40 * 46, 269);
assertClose(windwalkerAt40RawPoints.percent, 109.45, '踏风精通应对装备精通应用递减');

console.log('stat calculation tests passed');
