const assert = require('assert');
const rules = require('../miniprogram/utils/weapon-rules');
const { summarizeSlots, BUILD_SLOT_KEYS } = require('../miniprogram/utils/stat-calc');

function item(id, equipLoc, specs, ilvl) {
  return {
    id,
    itemId: id,
    slot: 'weapon',
    equipLoc,
    specs: specs || [],
    ilvl: ilvl || 100,
    stats: { primaryStats: [], secondary: [] },
  };
}

function emptySlots() {
  const slots = {};
  BUILD_SLOT_KEYS.forEach((key) => { slots[key] = null; });
  return slots;
}

const twoHand = item(1, 'INVTYPE_2HWEAPON');
const oneHand = item(2, 'INVTYPE_WEAPON');
const shield = item(3, 'INVTYPE_SHIELD');
const holdable = item(4, 'INVTYPE_HOLDABLE');
const mainOnly = item(5, 'INVTYPE_WEAPONMAINHAND');
const offOnly = item(6, 'INVTYPE_WEAPONOFFHAND');

assert.strictEqual(rules.getWeaponKind({ dropVersion: { equipLoc: 'INVTYPE_2HWEAPON' } }), 'two_hand');
assert.strictEqual(rules.canItemUseSlot(71, 'weapon', twoHand), true, '武器战可用双手主手');
assert.strictEqual(rules.canItemUseSlot(71, 'weapon2', twoHand), false, '武器战没有副手槽');
assert.strictEqual(rules.canItemUseSlot(73, 'weapon2', shield), true, '防战副手可用盾牌');
assert.strictEqual(rules.canItemUseSlot(73, 'weapon2', oneHand), false, '防战副手不可用普通武器');
assert.strictEqual(rules.canItemUseSlot(62, 'weapon', twoHand), true, '法师可用双手法杖');
assert.strictEqual(rules.canItemUseSlot(62, 'weapon2', holdable), true, '法师可用法系副手');
assert.strictEqual(rules.canItemUseSlot(62, 'weapon2', shield), false, '法师不可用盾牌');
assert.strictEqual(rules.canItemUseSlot(251, 'weapon', twoHand), true, '冰DK可用双手');
assert.strictEqual(rules.canItemUseSlot(251, 'weapon2', oneHand), true, '冰DK可双持单手');
assert.strictEqual(rules.canItemUseSlot(251, 'weapon2', mainOnly), false, '仅限主手武器不能放副手');
assert.strictEqual(rules.canItemUseSlot(251, 'weapon', offOnly), false, '仅限副手武器不能放主手');
assert.strictEqual(rules.canItemUseSlot(251, 'weapon2', offOnly), true, '仅限副手武器可以放副手');
assert.strictEqual(rules.canItemUseSlot(72, 'weapon2', twoHand), true, '狂怒战可在副手装备双手武器');

let slots = emptySlots();
slots.weapon2 = holdable;
let selected = rules.applyWeaponSelection(slots, 62, 'weapon', twoHand);
assert.strictEqual(selected.ok, true);
assert.strictEqual(selected.slots.weapon2, null, '选择法杖时清除法系副手');
assert.strictEqual(selected.clearedOffHand, true);

slots = emptySlots();
slots.weapon = twoHand;
selected = rules.applyWeaponSelection(slots, 62, 'weapon2', holdable);
assert.strictEqual(selected.ok, false, '法杖存在时不能再装备副手');

slots = emptySlots();
slots.head = { ilvl: 100, stats: { primaryStats: [], secondary: [] } };
slots.weapon = item(10, 'INVTYPE_2HWEAPON', [71], 200);
let summary = summarizeSlots(slots, 71);
assert.strictEqual(summary.avgIlvl, 31, '双手武器装等应计算两次并固定除以16');
assert.strictEqual(summary.filledSlots, 2);
assert.strictEqual(summary.occupiedSlots, 3);

slots.weapon = item(11, 'INVTYPE_2HWEAPON', [72], 200);
slots.weapon2 = item(12, 'INVTYPE_2HWEAPON', [72], 180);
summary = summarizeSlots(slots, 72);
assert.strictEqual(summary.avgIlvl, 30, '双持应固定除以16，不能除以17');
assert.strictEqual(summary.occupiedSlots, 3);

console.log('weapon rules tests passed');
