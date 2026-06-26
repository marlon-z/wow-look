var { getMasteryCoefficient, BASE_MASTERY_POINTS } = require('./mastery-coefficients');
var { mainHandOccupiesBoth } = require('./weapon-rules');
var {
  DEFAULT_BASE_CRIT_PERCENT,
  LEVEL_90_BASE_PRIMARY,
  LEVEL_90_BASE_STAMINA,
  MATCHING_ARMOR_MULTIPLIER,
  ARMOR_SPECIALIZATION_SLOTS,
  getBaseCritPercent,
  getSpecCharacterBaseline,
  normalizeArmorType,
} = require('./stat-baselines');

var STAT_PER_PERCENT = {
  critical: 46,
  crit: 46,
  haste: 44,
  versatility: 54,
  mastery: 46,
};

var STAT_DISPLAY_NAME = {
  critical: '暴击',
  crit: '暴击',
  haste: '急速',
  versatility: '全能',
  mastery: '精通',
};

var DR_BRACKETS = [
  { threshold: 0,   penalty: 0 },
  { threshold: 30,  penalty: 0.10 },
  { threshold: 40,  penalty: 0.20 },
  { threshold: 50,  penalty: 0.30 },
  { threshold: 60,  penalty: 0.40 },
  { threshold: 80,  penalty: 0.50 },
  { threshold: 200, penalty: 1.00 },
];

function calcStatPercent(rating, statType) {
  var perPercent = STAT_PER_PERCENT[statType];
  if (!perPercent || !rating) return 0;

  var rawPercent = rating / perPercent;
  var effectivePercent = 0;
  var remaining = rawPercent;

  for (var i = 0; i < DR_BRACKETS.length - 1; i++) {
    var bracketStart = DR_BRACKETS[i].threshold;
    var bracketEnd = DR_BRACKETS[i + 1].threshold;
    var penalty = DR_BRACKETS[i].penalty;

    if (remaining <= 0) break;

    var bracketSize = bracketEnd - bracketStart;
    var used = Math.min(remaining, bracketSize);
    effectivePercent += used * (1 - penalty);
    remaining -= used;
  }

  return Math.round(effectivePercent * 100) / 100;
}

function formatPercent(value) {
  return (Math.round((Number(value) || 0) * 100) / 100).toFixed(2);
}

function calcMasteryPercent(masteryRating, specId) {
  var spec = getMasteryCoefficient(specId);
  if (!spec) {
    return { percent: 0, label: '未知专精', effect: '' };
  }

  var gearMasteryPoints = calcStatPercent(masteryRating, 'mastery');
  var totalMasteryPoints = BASE_MASTERY_POINTS + gearMasteryPoints;
  var percent = totalMasteryPoints * spec.coefficient;
  percent = Math.round(percent * 100) / 100;

  var baseMasteryPercent = BASE_MASTERY_POINTS * spec.coefficient;
  baseMasteryPercent = Math.round(baseMasteryPercent * 100) / 100;

  return {
    percent: percent,
    baseMasteryPercent: baseMasteryPercent,
    label: percent.toFixed(1) + '% ' + spec.effect,
    effect: spec.effect,
    masteryName: spec.masteryName,
  };
}

var BUILD_SLOT_KEYS = [
  'head', 'neck', 'shoulder', 'cloak', 'chest', 'wrist',
  'hand', 'waist', 'legs', 'feet',
  'finger1', 'finger2', 'trinket1', 'trinket2',
  'weapon', 'weapon2',
];

function summarizeSlots(slots, specId) {
  var characterBaseline = getSpecCharacterBaseline(specId);
  var primary = {};
  var stamina = characterBaseline ? LEVEL_90_BASE_STAMINA : 0;
  var secondary = { crit: 0, haste: 0, mastery: 0, versatility: 0 };
  var totalIlvl = 0;
  var filledSlots = 0;

  if (characterBaseline) {
    primary[characterBaseline.primaryType] = {
      type: characterBaseline.primaryType,
      name: characterBaseline.primaryName,
      value: LEVEL_90_BASE_PRIMARY,
    };
  }

  BUILD_SLOT_KEYS.forEach(function (key) {
    var item = slots[key];
    if (!item) return;

    filledSlots++;
    totalIlvl += item.ilvl || 0;

    var stats = item.stats;
    if (!stats) return;

    if (stats.stamina) {
      var staminaVal = typeof stats.stamina === 'object' ? stats.stamina.value : stats.stamina;
      stamina += staminaVal || 0;
    }

    (stats.primaryStats || []).forEach(function (stat) {
      if (characterBaseline && stat.type !== characterBaseline.primaryType) return;
      if (!primary[stat.type]) {
        primary[stat.type] = { type: stat.type, name: stat.name, value: 0 };
      }
      primary[stat.type].value += stat.value || 0;
    });

    (stats.secondary || []).forEach(function (stat) {
      var normalizedType = stat.type === 'critical' ? 'crit' : stat.type;
      if (secondary[normalizedType] !== undefined) {
        secondary[normalizedType] += stat.value || 0;
      }
    });
  });

  var critRating = secondary.crit || 0;
  var hasteRating = secondary.haste || 0;
  var masteryRating = secondary.mastery || 0;
  var versatilityRating = secondary.versatility || 0;

  var masteryResult = calcMasteryPercent(masteryRating, specId);
  var critPercent = calcStatPercent(critRating, 'crit') + getBaseCritPercent(specId);
  var hastePercent = calcStatPercent(hasteRating, 'haste');
  var versatilityPercent = calcStatPercent(versatilityRating, 'versatility');

  var armorSpecializationActive = !!characterBaseline && ARMOR_SPECIALIZATION_SLOTS.every(function (slotKey) {
    var armorItem = slots[slotKey];
    return !!armorItem && normalizeArmorType(armorItem) === characterBaseline.armorType;
  });

  if (armorSpecializationActive) {
    if (characterBaseline.armorBonusTarget === 'stamina') {
      stamina = Math.floor(stamina * MATCHING_ARMOR_MULTIPLIER);
    } else {
      primary[characterBaseline.primaryType].value = Math.floor(
        primary[characterBaseline.primaryType].value * MATCHING_ARMOR_MULTIPLIER
      );
    }
  }

  var primaryArray = [];
  var primaryKeys = Object.keys(primary);
  for (var p = 0; p < primaryKeys.length; p++) {
    primaryArray.push(primary[primaryKeys[p]]);
  }

  var hasMainHand = !!slots.weapon;
  var isTwoHand = hasMainHand && mainHandOccupiesBoth(specId, slots.weapon);
  if (isTwoHand) {
    totalIlvl += slots.weapon.ilvl || 0;
  }
  var occupiedSlots = filledSlots + (isTwoHand ? 1 : 0);
  var ilvlDivisor = 16;
  var totalSlots = BUILD_SLOT_KEYS.length;

  var secondaryTotal = critRating + hasteRating + masteryRating + versatilityRating;

  return {
    avgIlvl: filledSlots > 0 ? Math.round(totalIlvl / ilvlDivisor) : 0,
    filledSlots: filledSlots,
    occupiedSlots: occupiedSlots,
    totalSlots: totalSlots,
    primaryStats: primaryArray,
    stamina: stamina,
    armorSpecializationActive: armorSpecializationActive,
    secondaryTotal: secondaryTotal,
    secondary: {
      crit: {
        rating: critRating,
        percent: critPercent,
        percentText: formatPercent(critPercent),
      },
      haste: {
        rating: hasteRating,
        percent: hastePercent,
        percentText: formatPercent(hastePercent),
      },
      mastery: {
        rating: masteryRating,
        percent: masteryResult.percent,
        percentText: formatPercent(masteryResult.percent),
        baseMasteryPercent: masteryResult.baseMasteryPercent,
        effect: masteryResult.effect,
        masteryName: masteryResult.masteryName,
        label: masteryResult.label,
      },
      versatility: {
        rating: versatilityRating,
        percent: versatilityPercent,
        percentText: formatPercent(versatilityPercent),
      },
    },
  };
}

module.exports = {
  BASE_CRIT_PERCENT: DEFAULT_BASE_CRIT_PERCENT,
  BASE_MASTERY_POINTS: BASE_MASTERY_POINTS,
  STAT_PER_PERCENT: STAT_PER_PERCENT,
  STAT_DISPLAY_NAME: STAT_DISPLAY_NAME,
  BUILD_SLOT_KEYS: BUILD_SLOT_KEYS,
  calcStatPercent: calcStatPercent,
  calcMasteryPercent: calcMasteryPercent,
  formatPercent: formatPercent,
  getBaseCritPercent: getBaseCritPercent,
  summarizeSlots: summarizeSlots,
};
