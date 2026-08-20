const assert = require('assert');

const {
  BUILD_SLOT_KEYS,
  buildSharePayload,
} = require('../miniprogram/utils/build-share');
const { parseBuildSharePayload } = require('../miniprogram/packages/share/utils/share-restore');

const build = {
  classKey: 'warrior',
  specId: 71,
  slots: {},
};

BUILD_SLOT_KEYS.forEach((slotKey, index) => {
  build.slots[slotKey] = { itemId: 271000 + index };
});
build.slots.wrist.selectedCraftingStats = [
  { type: 'haste', value: 45 },
  { type: 'mastery', value: 45 },
];

const payload = buildSharePayload(build);
assert.ok(payload.startsWith('v2|warrior|71|'));
assert.ok(encodeURIComponent(payload).length <= 900);

const parsed = parseBuildSharePayload(payload);
assert.deepStrictEqual(parsed, {
  version: 2,
  classKey: 'warrior',
  specId: 71,
  slots: BUILD_SLOT_KEYS.reduce((result, slotKey, index) => {
    result[slotKey] = 271000 + index;
    return result;
  }, {}),
  craftingOverrides: {
    wrist: [
      { type: 'haste', value: 45 },
      { type: 'mastery', value: 45 },
    ],
  },
});

assert.strictEqual(buildSharePayload({ classKey: 'not-a-class', specId: 71, slots: {} }), null);
assert.strictEqual(buildSharePayload({ classKey: 'warrior', specId: 0, slots: {} }), null);
assert.strictEqual(buildSharePayload({ classKey: 'warrior', specId: 71, slots: { madeUp: { itemId: 1 } } }), null);
assert.strictEqual(buildSharePayload({ classKey: 'warrior', specId: 71, slots: { head: { itemId: 0 } } }), null);

assert.strictEqual(parseBuildSharePayload('v1|warrior|71|head:1'), null);
assert.strictEqual(parseBuildSharePayload('v2|not-a-class|71|head:1'), null);
assert.strictEqual(parseBuildSharePayload('v2|warrior|0|head:1'), null);
assert.strictEqual(parseBuildSharePayload('v2|warrior|71|madeUp:1'), null);
assert.strictEqual(parseBuildSharePayload('v2|warrior|71|head:0'), null);
assert.strictEqual(parseBuildSharePayload('v2|warrior|71|head:1|head:2'), null);
assert.strictEqual(parseBuildSharePayload('v2|warrior|71|head:1|craft:wrist:haste:45'), null);
assert.strictEqual(parseBuildSharePayload('v2|warrior|71|wrist:1|craft:wrist:haste:45:haste:45'), null);
assert.strictEqual(parseBuildSharePayload('v2|warrior|71|wrist:1|craft:wrist:leech:45'), null);
assert.strictEqual(parseBuildSharePayload('v2|warrior|71|wrist:1|craft:wrist:haste:0'), null);
assert.strictEqual(parseBuildSharePayload('v2|warrior|71|wrist:1|craft:wrist:haste:100001'), null);
assert.strictEqual(parseBuildSharePayload('v2|warrior|71|wrist:1|craft:wrist:haste:45:mastery:45:crit:45'), null);

const encodedTooLong = 'v2|warrior|71|' + '中'.repeat(300);
assert.ok(encodedTooLong.length < 900);
assert.ok(encodeURIComponent(encodedTooLong).length > 900);
assert.strictEqual(parseBuildSharePayload(encodedTooLong), null);

console.log('build share payload tests passed');
