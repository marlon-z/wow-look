const assert = require('assert');

const {
  extractCombatantStats,
  findCombatant,
} = require('../scripts/wcl-authority-snapshot');

const combatant = {
  strength: 512,
  agility: 621,
  intellect: 2792,
  stamina: 22252,
  armor: 871,
  critMelee: 290,
  critRanged: 291,
  critSpell: 292,
  hasteMelee: 1180,
  hasteRanged: 1181,
  hasteSpell: 1182,
  mastery: 1204,
  versatilityDamageDone: 0,
};

assert.deepStrictEqual(extractCombatantStats(combatant, { classKey: 'warrior', role: 'dps' }), {
  strength: 512,
  agility: 621,
  intellect: 2792,
  stamina: 22252,
  armor: 871,
  crit: 290,
  haste: 1180,
  mastery: 1204,
  versatility: 0,
  fieldSources: {
    crit: 'critMelee',
    haste: 'hasteMelee',
    strength: 'strength',
    agility: 'agility',
    intellect: 'intellect',
    stamina: 'stamina',
    armor: 'armor',
    mastery: 'mastery',
    versatility: 'versatilityDamageDone',
  },
});
assert.strictEqual(extractCombatantStats(combatant, { classKey: 'hunter', role: 'dps' }).fieldSources.crit, 'critRanged');
assert.strictEqual(extractCombatantStats(combatant, { classKey: 'priest', role: 'healer' }).fieldSources.haste, 'hasteSpell');
assert.strictEqual(extractCombatantStats(Object.assign({}, combatant, { critMelee: undefined }), { classKey: 'warrior' }).fieldSources.crit, 'critRanged');
assert.throws(
  () => extractCombatantStats(Object.assign({}, combatant, { mastery: -1 }), { classKey: 'warrior' }),
  /缺少或无效 WCL 总属性字段: mastery/
);

const report = {
  masterData: { actors: [{ id: 9, name: '正确角色', subType: 'Warrior' }] },
  events: { data: [
    { sourceID: 9, fight: 123, specID: 71, gear: [{ id: 1 }] },
    { sourceID: 9, fight: 124, specID: 71, gear: [{ id: 2 }] },
    { sourceID: 10, fight: 123, specID: 71, gear: [{ id: 3 }] },
  ] },
};
const ranking = { name: '正确角色', class: 'Warrior', specID: 71, report: { fightID: 123 } };
assert.strictEqual(findCombatant(report, ranking).gear[0].id, 1);
assert.strictEqual(findCombatant(report, Object.assign({}, ranking, { report: { fightID: 999 } })), null);
assert.strictEqual(findCombatant(report, Object.assign({}, ranking, { name: '不存在' })), null);

console.log('wcl combatant stats tests passed');
