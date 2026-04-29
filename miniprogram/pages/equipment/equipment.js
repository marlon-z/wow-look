const { COS_BASE, getClassMeta, getClassVisualAssets, loadClassData } = require('../../utils/class-data');
const {
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
} = require('../../utils/equipment');

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

Page({
  itemMap: {},

  data: {
    cosBase: COS_BASE,
    classKey: '',
    className: '',
    classMeta: null,
    heroBannerAsset: '',
    classEmblemAsset: '',
    specs: [],
    stats: [
      { type: 'crit', name: '暴击', state: 'none' },
      { type: 'haste', name: '急速', state: 'none' },
      { type: 'mastery', name: '精通', state: 'none' },
      { type: 'versatility', name: '全能', state: 'none' },
    ],
    slots: SLOT_OPTIONS,
    sourceTypes: [
      { type: 'all', name: '全部' },
      { type: 'dungeon', name: '地下城' },
      { type: 'raid', name: '团本' },
      { type: 'tier', name: '套装' },
    ],
    instanceOptions: [],
    keyword: '',
    selectedSpec: null,
    selectedSlots: [],
    selectedSourceType: 'all',
    selectedInstanceId: null,
    viewModes: [
      { type: 'slot', name: '按部位' },
      { type: 'source', name: '按来源' },
    ],
    selectedViewMode: 'slot',
    allItems: [],
    groupedItems: [],
    resultCount: 0,
    hasAnyData: false,
    isLoading: true,
    emptyMessage: '数据加载中',
    selectedItem: null,
    showModal: false,
  },

  onLoad(options) {
    const classKey = options.classKey || 'monk';
    const classMeta = getClassMeta(classKey) || getClassMeta('monk');
    const visualAssets = getClassVisualAssets((classMeta && classMeta.key) || 'monk');
    this.setData({
      classKey,
      className: options.className || (classMeta && classMeta.name) || '武僧',
      classMeta,
      heroBannerAsset: visualAssets.banner,
      classEmblemAsset: visualAssets.emblem,
    });
    this.loadData(classKey);
  },

  loadData(classKey) {
    loadClassData(classKey).then((data) => {
      const allItems = data
        ? flattenItems(data.instances || []).map((item) => ({
          ...item,
          iconAsset: item.iconAsset ? COS_BASE + item.iconAsset : '',
          statLine: buildStatLine(item),
          specNames: buildSpecNames(item, data.specs || []),
          metaLine: buildMetaLine(item),
          sourceBadge: item.source ? item.source.difficultyName : '',
          roleBadge: item.stats && item.stats.effects && item.stats.effects.use && item.stats.effects.use.length ? '使用特效'
            : (item.stats && item.stats.effects && item.stats.effects.equip && item.stats.effects.equip.length ? '装备特效' : ''),
          rightMeta: item.slot === 'weapon' ? item.itemSubType : (item.armorType !== 'none' ? item.armorTypeName : item.slotName),
          iconText: item.iconText || (item.name ? item.name.slice(0, 1) : '装'),
        }))
        : [];
      this.itemMap = {};
      allItems.forEach((item) => {
        this.itemMap[item.id] = item;
      });

      this.setData({
        classMeta: (data && data.class) || this.data.classMeta,
        className: (data && data.class && data.class.name) || this.data.className,
        heroBannerAsset: getClassVisualAssets(classKey).banner,
        classEmblemAsset: getClassVisualAssets(classKey).emblem,
        specs: (data && data.specs) || [],
        instanceOptions: buildInstanceOptions((data && data.instances) || []),
        allItems,
        hasAnyData: allItems.length > 0,
        isLoading: false,
      });

      this.applyFilters();
    });
  },

  onSpecTap(event) {
    const { id } = event.currentTarget.dataset;
    this.setData({
      selectedSpec: this.data.selectedSpec === id ? null : id,
    });
    this.applyFilters();
  },

  onSlotTap(event) {
    const { type } = event.currentTarget.dataset;
    const selectedSlots = this.data.selectedSlots.slice();
    const idx = selectedSlots.indexOf(type);
    if (idx === -1) {
      selectedSlots.push(type);
    } else {
      selectedSlots.splice(idx, 1);
    }
    const slots = this.data.slots.map((item) => ({
      ...item,
      selected: selectedSlots.indexOf(item.type) !== -1,
    }));
    this.setData({ selectedSlots, slots });
    this.applyFilters();
  },

  onStatTap(event) {
    const { type } = event.currentTarget.dataset;
    const includeCount = this.data.stats.filter((item) => item.state === 'include').length;
    let includeLimitReached = false;
    let stats = this.data.stats.map((item) => {
      if (item.type !== type) return item;
      if (item.state === 'none') {
        if (includeCount >= 2) {
          includeLimitReached = true;
          return item;
        }
        return { ...item, state: 'include' };
      }
      if (item.state === 'include') return { ...item, state: 'exclude' };
      return { ...item, state: 'none' };
    });
    if (stats.filter((item) => item.state === 'include').length >= 2) {
      stats = stats.map((item) => (item.state === 'exclude' ? { ...item, state: 'none' } : item));
    }
    if (includeLimitReached) {
      wx.showToast({
        title: '最多选择2个包含属性',
        icon: 'none',
      });
    }
    this.setData({ stats });
    this.applyFilters();
  },

  onSourceTypeTap(event) {
    const { type } = event.currentTarget.dataset;
    const nextType = this.data.selectedSourceType === type ? 'all' : type;
    const currentInstance = this.data.instanceOptions.find((item) => item.id === this.data.selectedInstanceId);
    const shouldResetInstance = currentInstance && nextType !== 'all' && currentInstance.type !== nextType;

    this.setData({
      selectedSourceType: nextType,
      selectedInstanceId: shouldResetInstance ? null : this.data.selectedInstanceId,
    });
    this.applyFilters();
  },

  onInstanceTap(event) {
    const { id } = event.currentTarget.dataset;
    this.setData({
      selectedInstanceId: this.data.selectedInstanceId === id ? null : id,
    });
    this.applyFilters();
  },

  onKeywordInput(event) {
    this.setData({
      keyword: event.detail.value || '',
    });
    this.applyFilters();
  },

  onViewModeTap(event) {
    const { type } = event.currentTarget.dataset;
    this.setData({
      selectedViewMode: type,
    });
    this.applyFilters();
  },

  resetFilters() {
    this.setData({
      keyword: '',
      selectedSpec: null,
      selectedSlots: [],
      slots: this.data.slots.map((item) => ({ ...item, selected: false })),
      selectedSourceType: 'all',
      selectedInstanceId: null,
      selectedViewMode: 'slot',
      stats: this.data.stats.map((item) => ({ ...item, state: 'none' })),
    });
    this.applyFilters();
  },

  applyFilters() {
    const selectedStats = this.data.stats.filter((item) => item.state === 'include').map((item) => item.type);
    const excludedStats = this.data.stats.filter((item) => item.state === 'exclude').map((item) => item.type);
    const filteredItems = filterItems(this.data.allItems, {
      selectedSpec: this.data.selectedSpec,
      selectedSlots: this.data.selectedSlots,
      selectedStats,
      excludedStats,
      selectedSourceType: this.data.selectedSourceType,
      selectedInstanceId: this.data.selectedInstanceId,
      keyword: this.data.keyword,
    });

    const groupedItems = this.data.selectedViewMode === 'source'
      ? groupItemsBySource(filteredItems)
      : groupItems(filteredItems);
    const activeFilterParts = [];
    const selectedSpec = this.data.specs.find((item) => item.id === this.data.selectedSpec);
    const selectedInstance = this.data.instanceOptions.find((item) => item.id === this.data.selectedInstanceId);
    if (selectedSpec) {
      activeFilterParts.push(selectedSpec.name);
    }
    if (this.data.selectedSourceType !== 'all') {
      activeFilterParts.push(
        this.data.selectedSourceType === 'dungeon'
          ? '地下城'
          : (this.data.selectedSourceType === 'raid' ? '团本' : '套装')
      );
    }
    if (selectedInstance) {
      activeFilterParts.push(selectedInstance.name);
    }
    this.data.selectedSlots.forEach((slotType) => {
      const slot = this.data.slots.find((item) => item.type === slotType);
      if (slot) {
        activeFilterParts.push(slot.name);
      }
    });
    selectedStats.forEach((type) => {
      const stat = this.data.stats.find((item) => item.type === type);
      if (stat) activeFilterParts.push(stat.name);
    });
    excludedStats.forEach((type) => {
      const stat = this.data.stats.find((item) => item.type === type);
      if (stat) activeFilterParts.push(`排除${stat.name}`);
    });
    if (this.data.keyword.trim()) {
      activeFilterParts.push(`搜索:${this.data.keyword.trim()}`);
    }

    this.setData({
      groupedItems,
      resultCount: filteredItems.length,
      activeFiltersText: activeFilterParts.length ? activeFilterParts.join(' · ') : '当前显示该职业全部可用装备',
      emptyMessage: getEmptyMessage(
        this.data.hasAnyData,
        Boolean(
          this.data.selectedSpec ||
          this.data.selectedSlots.length ||
          this.data.selectedInstanceId ||
          this.data.selectedSourceType !== 'all' ||
          selectedStats.length ||
          excludedStats.length ||
          this.data.keyword.trim()
        )
      ),
    });
  },

  filterTooltipRaw(item) {
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

    const allStats = [];
    ((item.stats && item.stats.primaryStats) || []).forEach((s) => allStats.push(s));
    if (item.stats && item.stats.stamina) allStats.push(item.stats.stamina);
    ((item.stats && item.stats.secondary) || []).forEach((s) => allStats.push(s));
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
  },

  onItemTap(event) {
    const item = this.itemMap[event.currentTarget.dataset.itemId];
    if (!item) {
      return;
    }
    const whiteLines = buildWhiteLines(item);
    const secondaryStats = ((item.stats && item.stats.secondary) || []).map((stat) => ({ ...stat }));
    const maxSecondaryValue = secondaryStats.reduce((max, stat) => Math.max(max, stat.value || 0), 0);
    secondaryStats.forEach((stat) => {
      stat.width = maxSecondaryValue > 0 ? `${Math.max(18, Math.round((stat.value / maxSecondaryValue) * 100))}%` : '18%';
    });
    const filteredRaw = this.filterTooltipRaw(item);
    const equipEffects = uniqueCleanEffects(item.stats && item.stats.effects ? item.stats.effects.equip || [] : []);
    const useEffects = uniqueCleanEffects(item.stats && item.stats.effects ? item.stats.effects.use || [] : []);
    const tierInfo = buildTierBonusDisplay(item, this.data.selectedSpec, this.data.specs);
    this.setData({
      showModal: true,
      selectedItem: {
        ...item,
        whiteLines,
        secondaryStats,
        filteredRaw,
        primaryStatText: item.stats && item.stats.primaryStats && item.stats.primaryStats.length
          ? item.stats.primaryStats.map((stat) => `${stat.name}${stat.value}`).join(' / ')
          : '无主属性',
        specText: item.specNames && item.specNames.length ? item.specNames.join(' / ') : '当前职业通用',
        equipEffects,
        useEffects,
        tierInfo,
        headerTags: [
          item.source ? item.source.difficultyName : '',
          item.slotName,
          item.itemSubType && item.slot === 'weapon' ? item.itemSubType : (item.armorType !== 'none' ? item.armorTypeName : ''),
          item.sourceType === 'tier' ? '套装' : '',
        ].filter(Boolean),
      },
    });
  },

  closeModal() {
    this.setData({
      showModal: false,
      selectedItem: null,
    });
  },

  onShareAppMessage() {
    return {
      title: `当赛季${this.data.className}装备一键速查，副本掉落全收录`,
      path: `/pages/equipment/equipment?classKey=${this.data.classKey}&className=${this.data.className}`,
    };
  },

  onShareTimeline() {
    return {
      title: `当赛季${this.data.className}装备一键速查，副本掉落全收录`,
      query: `classKey=${this.data.classKey}&className=${this.data.className}`,
    };
  },

  preventClose() {},

  onBackTap() {
    if (getCurrentPages().length > 1) {
      wx.navigateBack();
      return;
    }
    wx.redirectTo({ url: '/pages/index/index' });
  },
});
