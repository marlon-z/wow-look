const SLOT_ORDER = [
  'head',
  'shoulder',
  'cloak',
  'chest',
  'wrist',
  'hand',
  'waist',
  'legs',
  'feet',
  'neck',
  'finger',
  'trinket',
  'weapon'
];

const SLOT_OPTIONS = [
  { type: 'head', name: '头' },
  { type: 'shoulder', name: '肩' },
  { type: 'cloak', name: '披' },
  { type: 'chest', name: '胸' },
  { type: 'wrist', name: '腕' },
  { type: 'hand', name: '手' },
  { type: 'waist', name: '腰' },
  { type: 'legs', name: '腿' },
  { type: 'feet', name: '脚' },
  { type: 'neck', name: '链' },
  { type: 'finger', name: '戒' },
  { type: 'trinket', name: '饰' },
  { type: 'weapon', name: '武' }
];

function flattenItems(instances = []) {
  const allItems = [];
  let order = 0;

  instances.forEach((instance, instanceIndex) => {
    (instance.encounters || []).forEach((encounter, encounterIndex) => {
      (encounter.items || []).forEach((item, itemIndex) => {
        allItems.push({
          ...item,
          instanceId: instance.id,
          instanceName: instance.name,
          instanceType: instance.type,
          encounterId: encounter.id,
          encounterName: encounter.name,
          _sort: {
            order,
            instanceIndex,
            encounterIndex,
            itemIndex
          }
        });
        order += 1;
      });
    });
  });

  return allItems;
}

function filterItems(allItems = [], filters = {}) {
  const { selectedSpec = null, selectedSlot = null, selectedStats = [] } = filters;

  return allItems.filter((item) => {
    if (selectedSpec && Array.isArray(item.specs) && !item.specs.includes(selectedSpec)) {
      return false;
    }

    if (selectedSlot && item.slot !== selectedSlot) {
      return false;
    }

    if (selectedStats.length > 0) {
      const itemStats = (item.stats && item.stats.secondary ? item.stats.secondary : []).map((stat) => stat.type);
      return selectedStats.every((type) => itemStats.includes(type));
    }

    return true;
  });
}

function groupItems(items = []) {
  const groups = {};

  items.forEach((item) => {
    if (!groups[item.slot]) {
      groups[item.slot] = {
        slotType: item.slot,
        slotName: item.slotName,
        items: []
      };
    }

    groups[item.slot].items.push(item);
  });

  Object.values(groups).forEach((group) => {
    group.items.sort((left, right) => left._sort.order - right._sort.order);
  });

  return SLOT_ORDER.filter((slot) => groups[slot]).map((slot) => groups[slot]);
}

function buildStatLine(item) {
  const secondary = item && item.stats && Array.isArray(item.stats.secondary) ? item.stats.secondary : [];
  if (!secondary.length) {
    return item && item.effectText ? '特效饰品' : '特殊效果';
  }

  return secondary.map((stat) => `${stat.name}${stat.value}`).join(' / ');
}

function buildSpecNames(item, specs = []) {
  if (!item || !Array.isArray(item.specs) || !item.specs.length) {
    return [];
  }

  const specMap = {};
  specs.forEach((spec) => {
    specMap[spec.id] = spec.name;
  });

  return item.specs.map((specId) => specMap[specId]).filter(Boolean);
}

function buildItemMetaLine(item) {
  if (!item) {
    return '';
  }

  const parts = [item.slotName];
  if (item.armorTypeName && item.armorType !== 'none') {
    parts.push(item.armorTypeName);
  }
  parts.push(`ilvl ${item.ilvl}`);
  return parts.join(' · ');
}

function getEmptyMessage(hasAnyData, hasFilters) {
  if (!hasAnyData) {
    return '该职业数据准备中';
  }

  if (hasFilters) {
    return '没有符合条件的装备';
  }

  return '当前没有可展示的装备';
}

module.exports = {
  SLOT_OPTIONS,
  flattenItems,
  filterItems,
  groupItems,
  buildStatLine,
  buildSpecNames,
  buildItemMetaLine,
  getEmptyMessage
};
