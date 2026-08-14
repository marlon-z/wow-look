// Level-90 character baselines used by the build simulator.
// Racial traits, talents, temporary buffs and primary-attribute baselines are excluded.

var DEFAULT_BASE_CRIT_PERCENT = 5;
var LEVEL_90_BASE_PRIMARY = 620;
var LEVEL_90_BASE_STAMINA = 4600;
var MATCHING_ARMOR_MULTIPLIER = 1.05;

var PRIMARY_STAT_NAMES = {
  strength: '力量',
  agility: '敏捷',
  intellect: '智力',
};

var ARMOR_SPECIALIZATION_SLOTS = [
  'head', 'shoulder', 'chest', 'wrist', 'hand', 'waist', 'legs', 'feet',
];

var SPEC_CHARACTER_BASELINES = {
  71:   { primaryType: 'strength',  armorType: 'plate' },
  72:   { primaryType: 'strength',  armorType: 'plate' },
  73:   { primaryType: 'strength',  armorType: 'plate', armorBonusTarget: 'stamina' },
  65:   { primaryType: 'intellect', armorType: 'plate' },
  66:   { primaryType: 'strength',  armorType: 'plate', armorBonusTarget: 'stamina' },
  70:   { primaryType: 'strength',  armorType: 'plate' },
  253:  { primaryType: 'agility',   armorType: 'mail' },
  254:  { primaryType: 'agility',   armorType: 'mail' },
  255:  { primaryType: 'agility',   armorType: 'mail' },
  259:  { primaryType: 'agility',   armorType: 'leather' },
  260:  { primaryType: 'agility',   armorType: 'leather' },
  261:  { primaryType: 'agility',   armorType: 'leather' },
  256:  { primaryType: 'intellect', armorType: 'cloth' },
  257:  { primaryType: 'intellect', armorType: 'cloth' },
  258:  { primaryType: 'intellect', armorType: 'cloth' },
  250:  { primaryType: 'strength',  armorType: 'plate', armorBonusTarget: 'stamina' },
  251:  { primaryType: 'strength',  armorType: 'plate' },
  252:  { primaryType: 'strength',  armorType: 'plate' },
  262:  { primaryType: 'intellect', armorType: 'mail' },
  263:  { primaryType: 'agility',   armorType: 'mail' },
  264:  { primaryType: 'intellect', armorType: 'mail' },
  62:   { primaryType: 'intellect', armorType: 'cloth' },
  63:   { primaryType: 'intellect', armorType: 'cloth' },
  64:   { primaryType: 'intellect', armorType: 'cloth' },
  265:  { primaryType: 'intellect', armorType: 'cloth' },
  266:  { primaryType: 'intellect', armorType: 'cloth' },
  267:  { primaryType: 'intellect', armorType: 'cloth' },
  268:  { primaryType: 'agility',   armorType: 'leather', armorBonusTarget: 'stamina' },
  269:  { primaryType: 'agility',   armorType: 'leather' },
  270:  { primaryType: 'intellect', armorType: 'leather' },
  102:  { primaryType: 'intellect', armorType: 'leather' },
  103:  { primaryType: 'agility',   armorType: 'leather' },
  104:  { primaryType: 'agility',   armorType: 'leather', armorBonusTarget: 'stamina' },
  105:  { primaryType: 'intellect', armorType: 'leather' },
  577:  { primaryType: 'agility',   armorType: 'leather' },
  581:  { primaryType: 'agility',   armorType: 'leather', armorBonusTarget: 'stamina' },
  1480: { primaryType: 'intellect', armorType: 'leather' },
  1467: { primaryType: 'intellect', armorType: 'mail' },
  1468: { primaryType: 'intellect', armorType: 'mail' },
  1473: { primaryType: 'intellect', armorType: 'mail' },
};

var ARMOR_TYPE_ALIASES = {
  cloth: 'cloth',
  leather: 'leather',
  mail: 'mail',
  plate: 'plate',
  '布甲': 'cloth',
  '皮甲': 'leather',
  '锁甲': 'mail',
  '鎖甲': 'mail',
  '板甲': 'plate',
};

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

function getSpecCharacterBaseline(specId) {
  var config = SPEC_CHARACTER_BASELINES[Number(specId)];
  if (!config) return null;
  return {
    primaryType: config.primaryType,
    primaryName: PRIMARY_STAT_NAMES[config.primaryType],
    armorType: config.armorType,
    armorBonusTarget: config.armorBonusTarget || 'primary',
  };
}

function normalizeArmorType(item) {
  if (!item) return '';
  var candidates = [item.armorType, item.itemSubType, item.armorTypeName];
  for (var i = 0; i < candidates.length; i++) {
    var value = candidates[i];
    if (!value) continue;
    var normalized = ARMOR_TYPE_ALIASES[String(value).toLowerCase()] || ARMOR_TYPE_ALIASES[String(value)];
    if (normalized) return normalized;
  }
  return '';
}

module.exports = {
  DEFAULT_BASE_CRIT_PERCENT: DEFAULT_BASE_CRIT_PERCENT,
  LEVEL_90_BASE_PRIMARY: LEVEL_90_BASE_PRIMARY,
  LEVEL_90_BASE_STAMINA: LEVEL_90_BASE_STAMINA,
  MATCHING_ARMOR_MULTIPLIER: MATCHING_ARMOR_MULTIPLIER,
  ARMOR_SPECIALIZATION_SLOTS: ARMOR_SPECIALIZATION_SLOTS,
  CRITICAL_STRIKES_PASSIVE_SPECS: CRITICAL_STRIKES_PASSIVE_SPECS,
  SPEC_CHARACTER_BASELINES: SPEC_CHARACTER_BASELINES,
  getBaseCritPercent: getBaseCritPercent,
  getSpecCharacterBaseline: getSpecCharacterBaseline,
  normalizeArmorType: normalizeArmorType,
};
