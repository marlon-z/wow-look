const overview = require('./overview');
const craftingCandidates = require('./crafting-candidates');
const classes = {
  warrior: require('./warrior'),
  paladin: require('./paladin'),
  hunter: require('./hunter'),
  rogue: require('./rogue'),
  priest: require('./priest'),
  deathknight: require('./deathknight'),
  shaman: require('./shaman'),
  mage: require('./mage'),
  warlock: require('./warlock'),
  monk: require('./monk'),
  druid: require('./druid'),
  demonhunter: require('./demonhunter'),
  evoker: require('./evoker'),
};
module.exports = {
  source: 'local-s2-crafted-preview',
  overview,
  craftingCandidates,
  getOverview() { return overview; },
  getClassData(classKey) { return classes[classKey] || null; },
};
