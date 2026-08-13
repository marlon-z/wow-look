const assert = require('assert');
const { materializePreflightDropVersions } = require('../scripts/parse-export');

const payload = {
  mode: 'preflight',
  items: {
    123: {
      itemId: 123,
      name: '旧展示名称',
      displayLink: 'display-link',
      classes: [1],
      specsByClass: { 1: [71] },
      sources: [{ instanceId: 1, encounterId: 2 }],
      dropVersion: {
        status: 'ok',
        name: '客户端掉落名称',
        itemLevel: 292,
        link: 'drop-link',
        equipLoc: 'INVTYPE_HEAD',
      },
    },
  },
};

const normalized = materializePreflightDropVersions(payload);
const item = normalized.items[123];
assert.equal(normalized.releaseStatus, 'preflight_drop_versions');
assert.equal(normalized.equipmentVariant, 'drop_version');
assert.equal(item.name, '客户端掉落名称');
assert.equal(item.itemLevel, 292);
assert.equal(item.link, 'drop-link');
assert.equal(item.displayLink, 'display-link');
assert.equal(item.captureStatus, 'preflight_drop_version');
assert.equal(item.maxVersion, null);
assert.deepEqual(item.classes, [1]);

assert.throws(
  () => materializePreflightDropVersions({ mode: 'preflight', items: { 1: { dropVersion: { status: 'missing' } } } }),
  /缺少可用掉落版本/,
);
assert.throws(() => materializePreflightDropVersions({ mode: 'finalized', items: {} }), /仅可用于/);

console.log('S2 preflight normalization tests passed.');
