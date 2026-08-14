var SECONDARY_STAT_OPTIONS = [
  { type: 'crit', name: '暴击' },
  { type: 'haste', name: '急速' },
  { type: 'mastery', name: '精通' },
  { type: 'versatility', name: '全能' },
];

function getRandomAttributeSlots(item) {
  var crafting = item && item.crafting;
  if (!crafting || !Array.isArray(crafting.randomAttributeSlots)) {
    return [];
  }
  return crafting.randomAttributeSlots
    .filter(function (slot) {
      return slot && Number(slot.value) > 0;
    })
    .sort(function (left, right) {
      return (Number(left.index) || 0) - (Number(right.index) || 0);
    });
}

function getRandomAttributeCount(item) {
  var crafting = item && item.crafting;
  var configuredCount = crafting ? Number(crafting.randomAttributeCount) || 0 : 0;
  return Math.max(configuredCount, getRandomAttributeSlots(item).length);
}

function requiresCraftingStatSelection(item) {
  return item
    && item.sourceType === 'crafted'
    && getRandomAttributeCount(item) > 0
    && !(item.selectedCraftingStats && item.selectedCraftingStats.length);
}

function buildCraftingRandomStatLine(item) {
  if (!requiresCraftingStatSelection(item)) {
    return '';
  }
  var slots = getRandomAttributeSlots(item);
  if (!slots.length) {
    return '随机属性';
  }
  if (slots.length === 1) {
    return '随机属性 +' + slots[0].value + '，配装时选择';
  }
  var values = slots.map(function (slot) { return '+' + slot.value; }).join(' / ');
  return '随机属性 ' + values + '，配装时选择';
}

function getStatName(type) {
  var option = SECONDARY_STAT_OPTIONS.find(function (item) {
    return item.type === type;
  });
  return option ? option.name : type;
}

function cloneStats(stats) {
  if (!stats) {
    return null;
  }
  return {
    primaryStats: Array.isArray(stats.primaryStats) ? stats.primaryStats.map(function (stat) { return Object.assign({}, stat); }) : [],
    stamina: stats.stamina && typeof stats.stamina === 'object' ? Object.assign({}, stats.stamina) : stats.stamina,
    secondary: Array.isArray(stats.secondary) ? stats.secondary.map(function (stat) { return Object.assign({}, stat); }) : [],
    effects: stats.effects ? {
      equip: Array.isArray(stats.effects.equip) ? stats.effects.equip.slice() : [],
      use: Array.isArray(stats.effects.use) ? stats.effects.use.slice() : [],
    } : { equip: [], use: [] },
    white: stats.white && typeof stats.white === 'object' ? Object.assign({}, stats.white) : {},
  };
}

function buildStatLine(secondary) {
  if (!secondary || !secondary.length) return '';
  return secondary.map(function (stat) {
    return stat.name + stat.value;
  }).join(' / ');
}

function buildCraftedItemWithSelectedStats(item, selectedTypes) {
  var slots = getRandomAttributeSlots(item);
  var uniqueTypes = [];
  (selectedTypes || []).forEach(function (type) {
    if (uniqueTypes.indexOf(type) === -1) {
      uniqueTypes.push(type);
    }
  });
  if (!item || !slots.length || uniqueTypes.length !== slots.length) {
    return null;
  }

  var stats = cloneStats(item.stats) || {
    primaryStats: [],
    stamina: null,
    secondary: [],
    effects: { equip: [], use: [] },
    white: {},
  };
  var fixedSecondary = Array.isArray(stats.secondary) ? stats.secondary.slice() : [];
  var selectedSecondary = slots.map(function (slot, index) {
    var type = uniqueTypes[index];
    return {
      type: type,
      name: getStatName(type),
      value: Number(slot.value) || 0,
      craftedRandom: true,
      randomAttributeIndex: Number(slot.index) || index + 1,
    };
  });
  var secondary = fixedSecondary.concat(selectedSecondary);

  return Object.assign({}, item, {
    stats: Object.assign({}, stats, {
      secondary: secondary,
    }),
    selectedCraftingStats: selectedSecondary,
    statLine: buildStatLine(secondary),
  });
}

module.exports = {
  SECONDARY_STAT_OPTIONS: SECONDARY_STAT_OPTIONS,
  getRandomAttributeSlots: getRandomAttributeSlots,
  getRandomAttributeCount: getRandomAttributeCount,
  requiresCraftingStatSelection: requiresCraftingStatSelection,
  buildCraftingRandomStatLine: buildCraftingRandomStatLine,
  buildCraftedItemWithSelectedStats: buildCraftedItemWithSelectedStats,
};
