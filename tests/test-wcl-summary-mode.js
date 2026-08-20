const assert = require('assert');
const { summarizeWclCombatant, calcStatPercent, getBaseCritPercent } = require('../miniprogram/utils/stat-calc');

const raw = {
  strength: 1200,
  agility: 0,
  intellect: 0,
  stamina: 33000,
  armor: 9000,
  crit: 460,
  haste: 440,
  mastery: 460,
  versatility: 540,
};
const summary = summarizeWclCombatant(raw, 71, { avgIlvl: 289, filledSlots: 16, occupiedSlots: 16 });
assert.strictEqual(summary.isWclCombatantSnapshot, true);
assert.strictEqual(summary.avgIlvl, 289);
assert.strictEqual(summary.primaryStats[0].value, 1200);
assert.strictEqual(summary.stamina, 33000);
assert.strictEqual(summary.armor, 9000);
assert.strictEqual(summary.secondary.crit.rating, 460);
assert.strictEqual(summary.secondary.crit.percent, calcStatPercent(460, 'crit') + getBaseCritPercent(71));
assert.strictEqual(summary.secondary.haste.percent, calcStatPercent(440, 'haste'));
assert.strictEqual(summary.secondaryTotal, 1900);

console.log('wcl summary mode tests passed');
