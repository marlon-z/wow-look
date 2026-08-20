const assert = require('assert');

const storage = {};
let writeCount = 0;
global.wx = {
  getStorageSync(key) { return storage[key]; },
  setStorageSync(key, value) { storage[key] = value; writeCount += 1; },
};

const { parseBuildSharePayload, validateAndBuildSharedSlots, persistSharedBuild } = require('../miniprogram/packages/share/utils/share-restore');
const {
  BUILD_SLOT_KEYS,
} = require('../miniprogram/utils/builds');

function item(id, slot, extras) {
  return Object.assign({
    id,
    name: '测试装备' + id,
    slot,
    specs: [71],
    stats: { primaryStats: [], stamina: null, secondary: [], effects: { equip: [], use: [] }, white: {} },
    source: {},
  }, extras || {});
}

const head = item(1001, 'head');
const wrist = item(1002, 'wrist', {
  sourceType: 'crafted',
  crafting: {
    randomAttributeCount: 2,
    randomAttributeSlots: [{ index: 1, value: 45 }, { index: 2, value: 45 }],
  },
});
const finger = item(1003, 'finger');
const classData = {
  class: { key: 'warrior', name: '战士' },
  specs: [{ id: 71, name: '武器' }],
  instances: [{ encounters: [{ items: [head, wrist, finger] }] }],
};

const parsed = parseBuildSharePayload('v2|warrior|71|head:1001|wrist:1002|finger1:1003|craft:wrist:haste:45:mastery:45');
const resolved = validateAndBuildSharedSlots(parsed, classData);
assert.ok(resolved);
assert.strictEqual(resolved.slots.head.itemId, 1001);
assert.deepStrictEqual(resolved.slots.wrist.selectedCraftingStats.map((stat) => [stat.type, stat.value]), [
  ['haste', 45], ['mastery', 45],
]);
assert.strictEqual(resolved.slots.wrist.stats.secondary.length, 2);
assert.deepStrictEqual(Object.keys(resolved.slots).sort(), BUILD_SLOT_KEYS.slice().sort());

assert.strictEqual(validateAndBuildSharedSlots(
  parseBuildSharePayload('v2|warrior|71|head:1001'),
  Object.assign({}, classData, { specs: [{ id: 72, name: '狂怒' }] })
), null);
assert.strictEqual(validateAndBuildSharedSlots(parseBuildSharePayload('v2|warrior|71|feet:1001'), classData), null);
assert.strictEqual(validateAndBuildSharedSlots(
  parseBuildSharePayload('v2|warrior|71|wrist:1002|craft:wrist:haste:46:mastery:45'),
  classData
), null);

const beforeInvalidWrite = writeCount;
assert.strictEqual(persistSharedBuild(parseBuildSharePayload('v2|warrior|71|feet:1001'), classData), null);
assert.strictEqual(writeCount, beforeInvalidWrite);

const saved = persistSharedBuild(parsed, classData);
assert.ok(saved && saved.draft);
assert.strictEqual(saved.slots.head.itemId, 1001);
assert.strictEqual(writeCount, beforeInvalidWrite + 1);
assert.strictEqual(storage.wowlook_builds_v1.length, 1);

console.log('build share restore tests passed');
