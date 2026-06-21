const assert = require('assert');
const {
  BUILD_SLOT_KEYS,
  calcStatPercent,
  calcMasteryPercent,
  summarizeSlots,
} = require('../miniprogram/utils/stat-calc');

function emptySlots() {
  const slots = {};
  BUILD_SLOT_KEYS.forEach((key) => { slots[key] = null; });
  return slots;
}

function assertClose(actual, expected, message) {
  assert.ok(Math.abs(actual - expected) < 0.001, `${message}: expected ${expected}, got ${actual}`);
}

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
assert.deepStrictEqual(summarizeSlots(slots, 269).primaryStats, [], '主属性不应加入统一裸装基础值');

// Base mastery points are not diminished; only rating-derived points are.
const windwalkerAt40RawPoints = calcMasteryPercent(40 * 46, 269);
assertClose(windwalkerAt40RawPoints.percent, 109.45, '踏风精通应对装备精通应用递减');

console.log('stat calculation tests passed');
