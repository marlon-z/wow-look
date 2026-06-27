const assert = require('assert');
const {
  parseArgs,
  DEFAULT_OUTPUT_ROOT,
  TEST_OUTPUT_ROOT,
  isPartialGeneration,
  isProductionOutputRoot,
  validateGenerationScope,
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

console.log('wcl build scope tests passed');
