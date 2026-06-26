const assert = require('assert');
const {
  selectedSpecsFromEnv,
  matrixSpecs,
} = require('../scripts/list-wcl-specs');

const allSpecs = selectedSpecsFromEnv({});
assert.ok(allSpecs.length >= 39);

const druidSpecs = selectedSpecsFromEnv({ WCL_CLASS_KEY: 'druid' });
assert.strictEqual(druidSpecs.length, 4);
assert.ok(druidSpecs.some((spec) => spec.specId === 104));

const monk = selectedSpecsFromEnv({ WCL_CLASS_KEY: 'monk', WCL_SPEC_ID: '270' });
assert.strictEqual(monk.length, 1);
assert.strictEqual(monk[0].specName, 'Mistweaver');

const matrix = matrixSpecs(monk);
assert.deepStrictEqual(matrix, [{ classKey: 'monk', specId: 270, name: 'monk-270' }]);

console.log('wcl spec matrix tests passed');
