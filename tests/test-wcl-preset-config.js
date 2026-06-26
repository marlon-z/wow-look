const assert = require('assert');
const {
  getSpecConfig,
  listSpecs,
  buildDefaultSpecMap,
} = require('../scripts/wcl-preset-config');

const guardian = getSpecConfig('druid', 104);
assert.strictEqual(guardian.className, 'Druid');
assert.strictEqual(guardian.specName, 'Guardian');
assert.strictEqual(guardian.role, 'tank');
assert.strictEqual(guardian.metric, 'dps');

const mistweaver = getSpecConfig('monk', 270);
assert.strictEqual(mistweaver.className, 'Monk');
assert.strictEqual(mistweaver.specName, 'Mistweaver');
assert.strictEqual(mistweaver.role, 'healer');
assert.strictEqual(mistweaver.metric, 'hps');

const fire = getSpecConfig('mage', 63);
assert.strictEqual(fire.metric, 'dps');
assert.strictEqual(fire.talentChangeSetId, 13);

const specs = listSpecs();
assert.ok(specs.length >= 39);
assert.ok(specs.every((spec) => spec.classKey && spec.specId && spec.className && spec.specName));

const defaultSpec = buildDefaultSpecMap();
assert.strictEqual(defaultSpec.monk[270].metric, 'hps');
assert.strictEqual(defaultSpec.druid[104].metric, 'dps');

console.log('wcl preset config tests passed');
