const assert = require('assert');
const {
  LEGACY_PREFIX,
  assertLegacyPrefix,
  listAllKeys,
  run,
} = require('../scripts/delete-cos-prefix');

async function main() {
  assert.doesNotThrow(() => assertLegacyPrefix(LEGACY_PREFIX));
  assert.throws(() => assertLegacyPrefix('wcl-presets/'), /只允许清理/);
  assert.throws(() => assertLegacyPrefix('wcl-presets-test/data-4.4.x/'), /只允许清理/);

  const calls = [];
  const cos = {
    getBucket(options, callback) {
      calls.push(options);
      if (!options.Marker) {
        callback(null, { Contents: [{ Key: LEGACY_PREFIX + 'mage/63/index.json' }], IsTruncated: true, NextMarker: 'next' });
      } else {
        callback(null, { Contents: [{ Key: LEGACY_PREFIX + 'mage/63/mythic-plus-top.json' }], IsTruncated: false });
      }
    },
    deleteMultipleObject(options, callback) { callback(null, options); },
  };
  const args = { prefix: LEGACY_PREFIX, bucket: 'bucket', region: 'region', dryRun: true, confirmDelete: false };
  const keys = await listAllKeys(cos, args);
  assert.deepStrictEqual(keys, [LEGACY_PREFIX + 'mage/63/index.json', LEGACY_PREFIX + 'mage/63/mythic-plus-top.json']);
  assert.strictEqual(calls.length, 2);
  const dryRun = await run(args, cos);
  assert.strictEqual(dryRun.deleted, false);
  assert.strictEqual(dryRun.keys.length, 2);

  const unsafeCos = {
    getBucket(options, callback) { callback(null, { Contents: [{ Key: 'wcl-presets-test/escape.json' }], IsTruncated: false }); },
  };
  await assert.rejects(() => listAllKeys(unsafeCos, args), /前缀外对象/);

  console.log('COS legacy-prefix deletion tests passed');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
