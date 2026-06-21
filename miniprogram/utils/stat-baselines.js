// Level-90 character baselines used by the build simulator.
// Racial traits, talents, temporary buffs and primary-attribute baselines are excluded.

var DEFAULT_BASE_CRIT_PERCENT = 5;

// Specs with the passive "Critical Strikes" (+5 percentage points).
var CRITICAL_STRIKES_PASSIVE_SPECS = {
  577: true, 581: true,                    // Demon Hunter: Havoc, Vengeance
  103: true, 104: true,                    // Druid: Feral, Guardian
  253: true, 254: true, 255: true,          // Hunter
  268: true, 269: true,                    // Monk: Brewmaster, Windwalker
  259: true, 260: true, 261: true,          // Rogue
  263: true,                               // Shaman: Enhancement
};

function getBaseCritPercent(specId) {
  return DEFAULT_BASE_CRIT_PERCENT + (CRITICAL_STRIKES_PASSIVE_SPECS[Number(specId)] ? 5 : 0);
}

module.exports = {
  DEFAULT_BASE_CRIT_PERCENT: DEFAULT_BASE_CRIT_PERCENT,
  CRITICAL_STRIKES_PASSIVE_SPECS: CRITICAL_STRIKES_PASSIVE_SPECS,
  getBaseCritPercent: getBaseCritPercent,
};
