const assert = require('assert');
const sample = require('./fixtures/wcl-export-sample-361753-12.json');
const {
  encodeTalentImportString,
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

console.log('talent import encoder tests passed');
