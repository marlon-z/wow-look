const { getClassMeta, getClassVisualAssets, loadClassData } = require('../../utils/class-data');
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

Page({
  itemMap: {},

  data: {
    classKey: '',
    className: '',
    classMeta: null,
    heroBannerAsset: '',
    classEmblemAsset: '',
    specs: [],
    stats: [
      { type: 'crit', name: '暴击', selected: false },
      { type: 'haste', name: '急速', selected: false },
      { type: 'mastery', name: '精通', selected: false },
      { type: 'versatility', name: '全能', selected: false },
    ],
    slots: SLOT_OPTIONS,
    sourceTypes: [
      { type: 'all', name: '全部' },
      { type: 'dungeon', name: '地下城' },
      { type: 'raid', name: '团本' },
    ],
    instanceOptions: [],
    keyword: '',
    selectedSpec: null,
    selectedSlot: null,
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
    const data = loadClassData(classKey);
    const allItems = data
      ? flattenItems(data.instances || []).map((item) => ({
        ...item,
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
    this.setData({
      selectedSlot: this.data.selectedSlot === type ? null : type,
    });
    this.applyFilters();
  },

  onStatTap(event) {
    const { type } = event.currentTarget.dataset;
    const selectedCount = this.data.stats.filter((item) => item.selected).length;
    const stats = this.data.stats.map((item) => {
      if (item.type !== type) {
        return item;
      }
      if (!item.selected && selectedCount >= 2) {
        return item;
      }
      return { ...item, selected: !item.selected };
    });
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
      selectedSlot: null,
      selectedSourceType: 'all',
      selectedInstanceId: null,
      selectedViewMode: 'slot',
      stats: this.data.stats.map((item) => ({ ...item, selected: false })),
    });
    this.applyFilters();
  },

  applyFilters() {
    const selectedStats = this.data.stats.filter((item) => item.selected).map((item) => item.type);
    const filteredItems = filterItems(this.data.allItems, {
      selectedSpec: this.data.selectedSpec,
      selectedSlot: this.data.selectedSlot,
      selectedStats,
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
      activeFilterParts.push(this.data.selectedSourceType === 'dungeon' ? '地下城' : '团本');
    }
    if (selectedInstance) {
      activeFilterParts.push(selectedInstance.name);
    }
    if (this.data.selectedSlot) {
      const slot = this.data.slots.find((item) => item.type === this.data.selectedSlot);
      if (slot) {
        activeFilterParts.push(slot.name);
      }
    }
    selectedStats.forEach((type) => {
      const stat = this.data.stats.find((item) => item.type === type);
      if (stat) {
        activeFilterParts.push(stat.name);
      }
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
          this.data.selectedSlot ||
          this.data.selectedInstanceId ||
          this.data.selectedSourceType !== 'all' ||
          selectedStats.length ||
          this.data.keyword.trim()
        )
      ),
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
    this.setData({
      showModal: true,
      selectedItem: {
        ...item,
        whiteLines,
        secondaryStats,
        primaryStatText: item.stats && item.stats.primaryStats && item.stats.primaryStats.length
          ? item.stats.primaryStats.map((stat) => `${stat.name}${stat.value}`).join(' / ')
          : '无主属性',
        specText: item.specNames && item.specNames.length ? item.specNames.join(' / ') : '当前职业通用',
        equipEffects: item.stats && item.stats.effects ? item.stats.effects.equip || [] : [],
        useEffects: item.stats && item.stats.effects ? item.stats.effects.use || [] : [],
        headerTags: [
          item.source ? item.source.difficultyName : '',
          item.slotName,
          item.itemSubType && item.slot === 'weapon' ? item.itemSubType : (item.armorType !== 'none' ? item.armorTypeName : ''),
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

  preventClose() {},

  onBackTap() {
    if (getCurrentPages().length > 1) {
      wx.navigateBack();
      return;
    }
    wx.redirectTo({ url: '/pages/index/index' });
  },
});
