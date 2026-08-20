const assert = require('assert');

const storage = {};
global.wx = {
  getStorageSync: (key) => storage[key],
  setStorageSync: (key, value) => { storage[key] = value; },
};

const builds = require('../miniprogram/utils/builds');
const wclPreset = {
  wclCombatantSnapshot: true,
  combatantStats: {
    strength: 1000, agility: 0, intellect: 0, stamina: 25000, armor: 7000,
    crit: 460, haste: 0, mastery: 0, versatility: 0,
  },
  slotSummary: { avgIlvl: 289, filledSlots: 16, occupiedSlots: 16, totalSlots: 16 },
};
const item = {
  id: 1, name: '手动装备', ilvl: 300, slot: 'head', slotName: '头部',
  stats: { primaryStats: [{ type: 'strength', name: '力量', value: 10 }], stamina: 20, secondary: [] },
};

function freshWclBuild() {
  const build = builds.createBuild('warrior', '战士', 71, '武器', true);
  return builds.updateBuild(build.id, { slots: builds.emptySlots(), wclPreset });
}

let build = freshWclBuild();
assert.strictEqual(build.summary.isWclCombatantSnapshot, true);
assert.strictEqual(build.summary.secondary.crit.rating, 460);
assert.strictEqual(builds.getBuild(build.id).summary.isWclCombatantSnapshot, true, '存储重载仍应使用 WCL 总属性');

build = freshWclBuild();
build = builds.setSlotItem(build.id, 'head', item);
assert.strictEqual(build.wclPreset, null);
assert.ok(!build.summary.isWclCombatantSnapshot);

build = freshWclBuild();
build = builds.clearSlot(build.id, 'head');
assert.strictEqual(build.wclPreset, null);

build = freshWclBuild();
build = builds.clearAllSlots(build.id);
assert.strictEqual(build.wclPreset, null);

delete global.wx;
console.log('wcl build state tests passed');
