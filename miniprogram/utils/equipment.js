const SLOT_ORDER = [
  'head',
  'neck',
  'shoulder',
  'cloak',
  'chest',
  'wrist',
  'hand',
  'waist',
  'legs',
  'feet',
  'finger',
  'trinket',
  'weapon',
];

const SLOT_OPTIONS = [
  { type: 'head', name: '头' },
  { type: 'neck', name: '项链' },
  { type: 'shoulder', name: '肩' },
  { type: 'cloak', name: '披' },
  { type: 'chest', name: '胸' },
  { type: 'wrist', name: '腕' },
  { type: 'hand', name: '手' },
  { type: 'waist', name: '腰' },
  { type: 'legs', name: '腿' },
  { type: 'feet', name: '脚' },
  { type: 'finger', name: '戒' },
  { type: 'trinket', name: '饰' },
  { type: 'weapon', name: '武' },
];

const SLOT_ALIASES = {
  back: 'cloak',
};

function normalizeSlotType(slot) {
  return SLOT_ALIASES[slot] || slot;
}

function normalizeSlotName(slot, slotName) {
  if (normalizeSlotType(slot) === 'neck' || slotName === '项链' || slotName === '颈') {
    return '项链';
  }
  if (normalizeSlotType(slot) === 'wrist' || slotName === '手腕' || slotName === '护腕') {
    return '腕';
  }
  if (slotName === '手部') {
    return '手';
  }
  return slotName;
}

function buildSlotBadgeName(slot, slotName) {
  if (normalizeSlotType(slot) === 'neck' || slotName === '项' || slotName === '项链' || slotName === '颈') {
    return '项链';
  }
  if (normalizeSlotType(slot) === 'wrist' || slotName === '腕' || slotName === '手腕' || slotName === '护腕') {
    return '护腕';
  }
  if (normalizeSlotType(slot) === 'hand' || slotName === '手' || slotName === '手部') {
    return '手部';
  }
  return slotName;
}

function flattenItems(instances = []) {
  const result = [];
  let order = 0;

  instances.forEach((instance, instanceIndex) => {
    (instance.encounters || []).forEach((encounter, encounterIndex) => {
      (encounter.items || []).forEach((item, itemIndex) => {
        const normalizedSlot = normalizeSlotType(item.slot);
        result.push({
          ...item,
          slot: normalizedSlot,
          slotName: normalizeSlotName(normalizedSlot, item.slotName),
          slotBadgeName: buildSlotBadgeName(normalizedSlot, item.slotName),
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
    selectedSlots = [],
    selectedStats = [],
    excludedStats = [],
    selectedSourceType = 'all',
    selectedSourceTypes = [],
    selectedInstanceId = null,
    keyword = '',
  } = filters;
  const normalizedKeyword = keyword.trim();

  return items.filter((item) => {
    if (selectedSpec && (!Array.isArray(item.specs) || !item.specs.includes(selectedSpec))) {
      return false;
    }

    if (selectedSlots.length && selectedSlots.indexOf(item.slot) === -1) {
      return false;
    }

    const activeSourceTypes = selectedSourceTypes.length
      ? selectedSourceTypes
      : (selectedSourceType !== 'all' ? [selectedSourceType] : []);
    if (activeSourceTypes.length && activeSourceTypes.indexOf(item.instanceType) === -1) {
      return false;
    }

    if (selectedInstanceId && item.instanceId !== selectedInstanceId) {
      return false;
    }

    if (selectedStats.length > 0 || excludedStats.length > 0) {
      const secondaryTypes = ((item.stats && item.stats.secondary) || []).map((stat) => stat.type);
      if (selectedStats.length > 0 && !selectedStats.every((type) => secondaryTypes.includes(type))) {
        return false;
      }
      if (excludedStats.length > 0 && excludedStats.some((type) => secondaryTypes.includes(type))) {
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

function normalizeTooltipText(text) {
  return String(text || '')
    .replace(/\r\n/g, '\n')
    .replace(/\|c[0-9a-fA-F]{8}/g, '')
    .replace(/\|r/g, '')
    .replace(/(\d+)\|4([^:;]+):[^;]+;/g, '$1$2')
    .replace(/\n+/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .trim();
}

function stripEffectPrefix(text) {
  return normalizeTooltipText(text).replace(/^(装备|使用)[：:]\s*/, '').trim();
}

function effectKey(text) {
  return stripEffectPrefix(text).replace(/[\s。，“”"'：:；;，,（）()]+/g, '');
}

function uniqueCleanEffects(effects = []) {
  const seen = new Set();
  return effects
    .map(stripEffectPrefix)
    .filter((line) => {
      const key = effectKey(line);
      if (!key || seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
}

function isDuplicateEffectLine(line, effectKeys) {
  const key = effectKey(line);
  if (!key) {
    return false;
  }
  return Array.from(effectKeys).some((effect) => key === effect || key.startsWith(effect) || effect.startsWith(key));
}

function filterTooltipRaw(item) {
  const raw = item.tooltipRaw;
  if (!raw || !raw.length) return [];

  const skip = new Set();
  skip.add(item.name);
  const qualities = ['史诗', '稀有', '精良', '优秀', '普通', '传说'];
  qualities.forEach((q) => skip.add(q));
  if (item.slotName) skip.add(item.slotName);
  if (item.armorTypeName && item.armorType !== 'none') {
    skip.add(item.slotName + ' ' + item.armorTypeName);
  }

  const effectKeys = new Set([
    ...((item.stats && item.stats.effects && item.stats.effects.equip) || []),
    ...((item.stats && item.stats.effects && item.stats.effects.use) || []),
  ].map(effectKey).filter(Boolean));

  const seen = new Set();
  return raw.map(normalizeTooltipText).filter((line) => {
    if (skip.has(line)) return false;
    if (/^物品等级/.test(line)) return false;
    if (/^升级[：:]/.test(line)) return false;
    if (/^装备唯一/.test(line)) return false;
    if (/棱彩插槽/.test(line)) return false;
    if (/你尚未收藏/.test(line)) return false;
    if (/^套装奖励将根据玩家专精变化/.test(line)) return false;
    if (/^\d+点护甲$/.test(line)) return false;
    if (/^每秒伤害/.test(line)) return false;
    if (/^\d+-\d+点伤害/.test(line) || /^速度/.test(line)) return false;
    if (/^\+\d+\s/.test(line)) return false;
    if (isDuplicateEffectLine(line, effectKeys)) return false;
    const key = effectKey(line) || line.replace(/\s+/g, '');
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function buildTierBonusDisplay(item, selectedSpec, pageSpecs = []) {
  if (!item || !item.tier || !item.tier.bonusesBySpec) {
    return null;
  }

  const requestedSpecId = selectedSpec || (Array.isArray(item.specs) && item.specs.length ? item.specs[0] : null);
  const availableSpecIds = Object.keys(item.tier.bonusesBySpec || {});
  if (!requestedSpecId && !availableSpecIds.length) {
    return null;
  }

  const resolvedSpecId = item.tier.bonusesBySpec[String(requestedSpecId)]
    ? String(requestedSpecId)
    : (availableSpecIds[0] || null);
  if (!resolvedSpecId) {
    return null;
  }

  const specBonus = item.tier.bonusesBySpec[resolvedSpecId];
  if (!specBonus) {
    return null;
  }

  const numericSpecId = Number(resolvedSpecId);
  const specMeta = pageSpecs.find((spec) => spec.id === numericSpecId);
  return {
    setName: item.tier.setName || '',
    pieces: Array.isArray(item.tier.pieces) ? item.tier.pieces : [],
    specId: numericSpecId,
    specName: specBonus.specName || (specMeta && specMeta.name) || '',
    twoPiece: specBonus.twoPiece || '',
    fourPiece: specBonus.fourPiece || '',
    isFallback: selectedSpec && numericSpecId !== selectedSpec,
  };
}

function buildItemDetail(item, selectedSpec, specs = []) {
  const secondaryStats = ((item.stats && item.stats.secondary) || []).map((stat) => ({ ...stat }));
  const maxSecondaryValue = secondaryStats.reduce((max, stat) => Math.max(max, stat.value || 0), 0);
  secondaryStats.forEach((stat) => {
    stat.width = maxSecondaryValue > 0 ? `${Math.max(18, Math.round((stat.value / maxSecondaryValue) * 100))}%` : '18%';
  });

  return {
    ...item,
    whiteLines: buildWhiteLines(item),
    secondaryStats,
    filteredRaw: filterTooltipRaw(item),
    primaryStatText: item.stats && item.stats.primaryStats && item.stats.primaryStats.length
      ? item.stats.primaryStats.map((stat) => `${stat.name}${stat.value}`).join(' / ')
      : '无主属性',
    specText: item.specNames && item.specNames.length ? item.specNames.join(' / ') : '当前职业通用',
    equipEffects: uniqueCleanEffects(item.stats && item.stats.effects ? item.stats.effects.equip || [] : []),
    useEffects: uniqueCleanEffects(item.stats && item.stats.effects ? item.stats.effects.use || [] : []),
    tierInfo: buildTierBonusDisplay(item, selectedSpec, specs),
    headerTags: [
      item.source ? item.source.difficultyName : '',
      item.slotName,
      item.itemSubType && item.slot === 'weapon' ? item.itemSubType : (item.armorType !== 'none' ? item.armorTypeName : ''),
      item.sourceType === 'tier' ? '套装' : '',
    ].filter(Boolean),
  };
}

function buildInstanceOptions(instances = []) {
  return (instances || []).map((instance) => ({
    id: instance.id,
    name: instance.name,
    type: instance.type,
    typeName: instance.type === 'raid' ? '团本' : (instance.type === 'tier' ? '套装' : '地下城'),
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
  buildItemDetail,
  buildSlotBadgeName,
  buildInstanceOptions,
  getEmptyMessage,
};
