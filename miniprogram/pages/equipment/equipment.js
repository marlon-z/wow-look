const { getClassMeta, loadClassData } = require('../../utils/class-data');
const {
  SLOT_OPTIONS,
  flattenItems,
  filterItems,
  groupItems,
  buildStatLine,
  buildSpecNames,
  buildItemMetaLine,
  getEmptyMessage
} = require('../../utils/equipment');

Page({
  data: {
    className: '',
    classKey: '',
    classMeta: null,
    specs: [],
    stats: [
      { type: 'crit', name: '暴击', selected: false },
      { type: 'haste', name: '急速', selected: false },
      { type: 'mastery', name: '精通', selected: false },
      { type: 'versatility', name: '全能', selected: false }
    ],
    slots: SLOT_OPTIONS,
    selectedSpec: null,
    selectedSlot: null,
    allItems: [],
    filteredItems: [],
    groupedItems: [],
    resultCount: 0,
    isLoading: true,
    hasAnyData: false,
    emptyMessage: '数据加载中',
    showModal: false,
    selectedItem: null
  },

  onLoad(options) {
    const classKey = options.classKey || 'monk';
    const classMeta = getClassMeta(classKey) || getClassMeta('monk');

    this.setData({
      classKey,
      className: options.className || (classMeta && classMeta.name) || '武僧',
      classMeta
    });

    this.loadData(classKey);
  },

  loadData(classKey) {
    const data = loadClassData(classKey);
    const classMeta = getClassMeta(classKey) || this.data.classMeta;
    const instances = data && Array.isArray(data.instances) ? data.instances : [];
    const specs = data && Array.isArray(data.specs) ? data.specs : [];
    const allItems = flattenItems(instances).map((item) => ({
      ...item,
      statLine: buildStatLine(item),
      specNames: buildSpecNames(item, specs),
      metaLine: buildItemMetaLine(item)
    }));

    this.setData({
      className: (data && data.class && data.class.name) || (classMeta && classMeta.name) || this.data.className,
      classMeta,
      specs,
      allItems,
      hasAnyData: allItems.length > 0,
      isLoading: false
    });

    this.applyFilters();
  },

  onSpecTap(e) {
    const id = e.currentTarget.dataset.id;
    this.setData({
      selectedSpec: this.data.selectedSpec === id ? null : id
    });
    this.applyFilters();
  },

  onStatTap(e) {
    const type = e.currentTarget.dataset.type;
    const selectedCount = this.data.stats.filter((item) => item.selected).length;

    const stats = this.data.stats.map((item) => {
      if (item.type !== type) {
        return item;
      }

      if (!item.selected && selectedCount >= 2) {
        return item;
      }

      return {
        ...item,
        selected: !item.selected
      };
    });

    this.setData({ stats });
    this.applyFilters();
  },

  onSlotTap(e) {
    const type = e.currentTarget.dataset.type;
    this.setData({
      selectedSlot: this.data.selectedSlot === type ? null : type
    });
    this.applyFilters();
  },

  applyFilters() {
    const selectedStats = this.data.stats.filter((item) => item.selected).map((item) => item.type);
    const filteredItems = filterItems(this.data.allItems, {
      selectedSpec: this.data.selectedSpec,
      selectedSlot: this.data.selectedSlot,
      selectedStats
    });
    const groupedItems = groupItems(filteredItems);
    const hasFilters = Boolean(this.data.selectedSpec || this.data.selectedSlot || selectedStats.length);

    this.setData({
      filteredItems,
      groupedItems,
      resultCount: filteredItems.length,
      emptyMessage: getEmptyMessage(this.data.hasAnyData, hasFilters)
    });
  },

  resetFilters() {
    this.setData({
      selectedSpec: null,
      selectedSlot: null,
      stats: this.data.stats.map((item) => ({
        ...item,
        selected: false
      }))
    });
    this.applyFilters();
  },

  onBackTap() {
    if (getCurrentPages().length > 1) {
      wx.navigateBack();
      return;
    }

    wx.redirectTo({
      url: '/pages/index/index'
    });
  },

  onItemTap(e) {
    const item = e.currentTarget.dataset.item;
    const primaryOptions = item.stats && Array.isArray(item.stats.primaryOptions)
      ? item.stats.primaryOptions
      : (item.stats && item.stats.primary ? [item.stats.primary] : []);

    this.setData({
      selectedItem: {
        ...item,
        specNamesText: item.specNames && item.specNames.length ? item.specNames.join(' / ') : '当前职业通用',
        effectLabel: item.effectType || (item.slot === 'trinket' ? '使用' : '装备'),
        primaryOptions,
        itemLevelText: `物品等级${item.ilvl}`,
        itemIdText: `ID: ${item.id}`
      },
      showModal: true
    });
  },

  closeModal() {
    this.setData({
      showModal: false,
      selectedItem: null
    });
  },

  preventClose() {}
});
