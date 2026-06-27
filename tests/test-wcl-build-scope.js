const assert = require('assert');
const {
  parseArgs,
  DEFAULT_OUTPUT_ROOT,
  TEST_OUTPUT_ROOT,
  isPartialGeneration,
  isProductionOutputRoot,
  validateGenerationScope,
  summarizeEntryQuality,
  validateProductionSpecQuality,
} = require('../scripts/build-wcl-presets');

const full = parseArgs(['node', 'scripts/build-wcl-presets.js']);
assert.strictEqual(isPartialGeneration(full), false);
assert.strictEqual(isProductionOutputRoot(full.outputRoot), true);
assert.doesNotThrow(() => validateGenerationScope(full));

const partial = parseArgs([
  'node',
  'scripts/build-wcl-presets.js',
  '--class-key',
  'monk',
  '--spec-id',
  '270',
  '--content',
  'mythic-plus',
  '--levels',
  '10',
  '--encounter-id',
  '361753',
]);
assert.strictEqual(partial.outputRoot, DEFAULT_OUTPUT_ROOT);
assert.strictEqual(isPartialGeneration(partial), true);
assert.throws(() => validateGenerationScope(partial), /局部\/取样生成不能写入正式/);

const testPartial = parseArgs([
  'node',
  'scripts/build-wcl-presets.js',
  '--content',
  'mythic-plus',
  '--levels',
  '10',
  '--output-root',
  TEST_OUTPUT_ROOT,
]);
assert.strictEqual(isPartialGeneration(testPartial), true);
assert.strictEqual(isProductionOutputRoot(testPartial.outputRoot), false);
assert.doesNotThrow(() => validateGenerationScope(testPartial));

const failedEntries = [
  {
    presets: [],
    diagnostics: { failures: [{ rank: 0, player: '', reason: 'WCL GraphQL HTTP 429: rate limited' }] },
  },
  {
    presets: [],
    diagnostics: { failures: [{ rank: 0, player: '', reason: 'WCL GraphQL 缺少 data: {}' }] },
  },
];
assert.deepStrictEqual(
  summarizeEntryQuality(failedEntries),
  { entryCount: 2, presetCount: 0, queryFailureCount: 2 }
);

const fireMage = {
  classLocalName: '法师',
  specLocalName: '火焰',
};
assert.throws(
  () => validateProductionSpecQuality(full, fireMage, [
    { entryCount: 2, presetCount: 0, queryFailureCount: 2 },
  ]),
  /已阻止上传空数据到正式 COS/
);
assert.doesNotThrow(() => validateProductionSpecQuality(testPartial, fireMage, [
  { entryCount: 2, presetCount: 0, queryFailureCount: 2 },
]));
assert.doesNotThrow(() => validateProductionSpecQuality(full, fireMage, [
  { entryCount: 2, presetCount: 1, queryFailureCount: 1 },
]));

console.log('wcl build scope tests passed');
