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
  'weapon',
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
  { type: 'weapon', name: '武' },
];

function flattenItems(instances = []) {
  const result = [];
  let order = 0;

  instances.forEach((instance, instanceIndex) => {
    (instance.encounters || []).forEach((encounter, encounterIndex) => {
      (encounter.items || []).forEach((item, itemIndex) => {
        result.push({
          ...item,
          instanceId: instance.id,
          instanceName: instance.name,
          instanceType: instance.type,
          encounterId: encounter.id,
          encounterName: encounter.name,
          encounterOrder: encounter.order || 0,
          _sort: {
            order,
            instanceIndex,
            encounterIndex,
            itemIndex,
          },
        });
        order += 1;
      });
    });
  });

  return result;
}

function filterItems(items = [], filters = {}) {
  const {
    selectedSpec = null,
    selectedSlot = null,
    selectedStats = [],
    selectedSourceType = 'all',
    selectedInstanceId = null,
    keyword = '',
  } = filters;
  const normalizedKeyword = keyword.trim();

  return items.filter((item) => {
    if (selectedSpec && (!Array.isArray(item.specs) || !item.specs.includes(selectedSpec))) {
      return false;
    }

    if (selectedSlot && item.slot !== selectedSlot) {
      return false;
    }

    if (selectedSourceType !== 'all' && item.instanceType !== selectedSourceType) {
      return false;
    }

    if (selectedInstanceId && item.instanceId !== selectedInstanceId) {
      return false;
    }

    if (selectedStats.length > 0) {
      const secondaryTypes = ((item.stats && item.stats.secondary) || []).map((stat) => stat.type);
      if (!selectedStats.every((type) => secondaryTypes.includes(type))) {
        return false;
      }
    }

    if (normalizedKeyword) {
      const haystack = [
        item.name,
        item.instanceName,
        item.encounterName,
        item.slotName,
        item.itemSubType,
      ].join(' ');
      if (!haystack.includes(normalizedKeyword)) {
        return false;
      }
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
        items: [],
      };
    }
    groups[item.slot].items.push(item);
  });

  Object.keys(groups).forEach((slot) => {
    groups[slot].items.sort((left, right) => left._sort.order - right._sort.order);
  });

  return SLOT_ORDER.filter((slot) => groups[slot]).map((slot) => groups[slot]);
}

function groupItemsBySource(items = []) {
  const groups = {};

  items.forEach((item) => {
    const key = `${item.instanceId}:${item.encounterId}`;
    if (!groups[key]) {
      groups[key] = {
        groupType: 'source',
        key,
        title: item.instanceName,
        subtitle: item.encounterName,
        instanceId: item.instanceId,
        encounterId: item.encounterId,
        instanceType: item.instanceType,
        difficultyName: item.source ? item.source.difficultyName : '',
        items: [],
        _sort: item._sort,
      };
    }
    groups[key].items.push(item);
  });

  return Object.values(groups)
    .sort((left, right) => left._sort.order - right._sort.order)
    .map((group) => ({
      ...group,
      items: group.items.sort((left, right) => left._sort.order - right._sort.order),
    }));
}

function buildStatLine(item) {
  const secondary = item && item.stats && Array.isArray(item.stats.secondary) ? item.stats.secondary : [];
  if (secondary.length > 0) {
    return secondary.map((stat) => `${stat.name}${stat.value}`).join(' / ');
  }

  const useEffects = item && item.stats && item.stats.effects ? item.stats.effects.use || [] : [];
  const equipEffects = item && item.stats && item.stats.effects ? item.stats.effects.equip || [] : [];
  if (useEffects.length > 0) {
    return '使用特效';
  }
  if (equipEffects.length > 0) {
    return '装备特效';
  }
  return '无常规副属性';
}

function buildSpecNames(item, specs = []) {
  const specMap = {};
  specs.forEach((spec) => {
    specMap[spec.id] = spec.name;
  });
  return (item.specs || []).map((specId) => specMap[specId]).filter(Boolean);
}

function buildMetaLine(item) {
  const parts = [item.slotName];
  if (item.armorTypeName && item.armorType !== 'none') {
    parts.push(item.armorTypeName);
  }
  if (item.itemSubType && item.slot === 'weapon') {
    parts.push(item.itemSubType);
  }
  parts.push(`物品等级${item.ilvl}`);
  return parts.join(' · ');
}

function buildWhiteLines(item) {
  const white = item && item.stats ? item.stats.white || {} : {};
  const lines = [];
  if (white.armor) {
    lines.push(`${white.armor}点护甲`);
  }
  if (white.damageMin && white.damageMax) {
    const speed = white.speed ? ` 速度${white.speed}` : '';
    lines.push(`${white.damageMin}-${white.damageMax}点伤害${speed}`);
  }
  if (white.dps) {
    lines.push(`每秒伤害${white.dps}`);
  }
  return lines;
}

function buildInstanceOptions(instances = []) {
  return (instances || []).map((instance) => ({
    id: instance.id,
    name: instance.name,
    type: instance.type,
    typeName: instance.type === 'raid' ? '团本' : '地下城',
  }));
}

function getEmptyMessage(hasAnyData, hasFilters) {
  if (!hasAnyData) {
    return '当前职业没有可展示的数据文件';
  }
  if (hasFilters) {
    return '没有符合当前条件的装备';
  }
  return '当前没有可展示的装备';
}

module.exports = {
  SLOT_OPTIONS,
  flattenItems,
  filterItems,
  groupItems,
  groupItemsBySource,
  buildStatLine,
  buildSpecNames,
  buildMetaLine,
  buildWhiteLines,
  buildInstanceOptions,
  getEmptyMessage,
};
