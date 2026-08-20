const assert = require('assert');

function loadPresets(request) {
  global.wx = { request };
  delete require.cache[require.resolve('../miniprogram/utils/wcl-presets')];
  return require('../miniprogram/utils/wcl-presets');
}

async function main() {
  let requestedUrl = '';
  let presets = loadPresets((options) => {
    requestedUrl = options.url;
    options.success({ statusCode: 200, data: '{"schemaVersion":2}' });
  });
  const index = await presets.loadWclPresetIndex('mage', 63);
  const parsed = new URL(requestedUrl);
  assert.strictEqual(parsed.origin, presets.WCL_COS_BASE);
  assert.strictEqual(parsed.pathname, '/wcl-presets/data-12.1/mage/63/index.json');
  assert.ok(parsed.searchParams.get('_wclts'));
  assert.strictEqual(index.dataSource, 'remote');
  assert.strictEqual(presets.hasWclCombatantSnapshot(
    { wclCombatantSnapshot: true }, { wclCombatantSnapshot: true }
  ), true);
  assert.strictEqual(presets.hasWclCombatantSnapshot(
    { wclCombatantSnapshot: true }, { wclCombatantSnapshot: false }
  ), false);

  presets = loadPresets((options) => options.success({ statusCode: 200, data: '{bad json' }));
  assert.strictEqual(await presets.loadWclPresetFile('mage', 63, 'mythic-plus-top'), null);

  presets = loadPresets((options) => options.success({ statusCode: 404, data: {} }));
  assert.strictEqual(await presets.loadWclPresetIndex('mage', 63), null);

  presets = loadPresets((options) => options.fail(new Error('network')));
  assert.strictEqual(await presets.loadWclPresetIndex('mage', 63), null);

  delete global.wx;
  console.log('wcl COS reader tests passed');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
