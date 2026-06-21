var { getMasteryCoefficient } = require('./mastery-coefficients');
var { mainHandOccupiesBoth } = require('./weapon-rules');

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
  { threshold: 39,  penalty: 0.20 },
  { threshold: 47,  penalty: 0.30 },
  { threshold: 54,  penalty: 0.40 },
  { threshold: 61,  penalty: 0.50 },
  { threshold: 106, penalty: 1.00 },
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
    var penalty = DR_BRACKETS[i + 1].penalty;

    if (remaining <= 0) break;

    var bracketSize = bracketEnd - bracketStart;
    var used = Math.min(remaining, bracketSize);
    effectivePercent += used * (1 - penalty);
    remaining -= used;
  }

  return Math.round(effectivePercent * 100) / 100;
}

function calcMasteryPercent(masteryRating, specId) {
  var spec = getMasteryCoefficient(specId);
  if (!spec) {
    return { percent: 0, label: '未知专精', effect: '' };
  }

  var masteryPoints = masteryRating / 46;
  var percent = masteryPoints * spec.coefficient;
  percent = Math.round(percent * 100) / 100;

  return {
    percent: percent,
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
  var primary = {};
  var stamina = 0;
  var secondary = { crit: 0, haste: 0, mastery: 0, versatility: 0 };
  var totalIlvl = 0;
  var filledSlots = 0;

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
    secondaryTotal: secondaryTotal,
    secondary: {
      crit: {
        rating: critRating,
        percent: calcStatPercent(critRating, 'crit'),
      },
      haste: {
        rating: hasteRating,
        percent: calcStatPercent(hasteRating, 'haste'),
      },
      mastery: {
        rating: masteryRating,
        percent: masteryResult.percent,
        effect: masteryResult.effect,
        masteryName: masteryResult.masteryName,
        label: masteryResult.label,
      },
      versatility: {
        rating: versatilityRating,
        percent: calcStatPercent(versatilityRating, 'versatility'),
      },
    },
  };
}

module.exports = {
  STAT_PER_PERCENT: STAT_PER_PERCENT,
  STAT_DISPLAY_NAME: STAT_DISPLAY_NAME,
  BUILD_SLOT_KEYS: BUILD_SLOT_KEYS,
  calcStatPercent: calcStatPercent,
  calcMasteryPercent: calcMasteryPercent,
  summarizeSlots: summarizeSlots,
};
