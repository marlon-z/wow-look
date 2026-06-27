const assert = require('assert');
const sample = require('./fixtures/wcl-export-sample-361753-12.json');
const {
  encodeTalentImportString,
  hasBlueprint,
} = require('../scripts/talent-import-encoder');

const encoded = encodeTalentImportString({
  classKey: 'mage',
  specId: sample.specId,
  changeSetId: sample.changeSetId,
  selectedNodes: sample.selectedNodes,
});

assert.strictEqual(encoded, sample.expectedExportString);

const fromTalentTree = encodeTalentImportString({
  classKey: 'mage',
  specId: sample.specId,
  changeSetId: sample.changeSetId,
  talentTree: sample.selectedNodes.map(([id, rank]) => ({
    id,
    rank: rank || 1,
  })),
});

assert.strictEqual(fromTalentTree, sample.expectedExportString);

assert.strictEqual(hasBlueprint('monk', 269, 20), true);

const windwalkerEncoded = encodeTalentImportString({
  classKey: 'monk',
  specId: 269,
  changeSetId: 20,
  talentTree: [
    { id: 124805, rank: 2, nodeID: 101035 },
    { id: 124806, rank: 1, nodeID: 101036 },
    { id: 124807, rank: 1, nodeID: 101037 },
  ],
});

assert.match(windwalkerEncoded, /^C0Q/);

console.log('talent import encoder tests passed');
