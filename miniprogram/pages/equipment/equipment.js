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
  buildItemDetail,
  buildInstanceOptions,
  getEmptyMessage,
} = require('../../utils/equipment');
const {
  getFavorites,
  isFavorite,
  buildFavoriteGroups,
  buildFavoriteSnapshot,
  toggleFavorite,
  removeFavorite,
  clearFavorites,
} = require('../../utils/favorites');
const {
  getBuildDraft,
  startBuildDraft,
  clearBuildDraft,
  isBuildDraftItem,
  toggleBuildDraftItem,
  addBuildDraftItems,
  removeBuildDraftItem,
} = require('../../utils/build-draft');
const {
  buildFavoriteSharePayload,
  buildFavoriteShareTitle,
} = require('../../utils/favorite-share');

Page({
  itemMap: {},
  classItemCache: {},

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
      { type: 'all', name: '全部', selected: true },
      { type: 'dungeon', name: '地下城' },
      { type: 'raid', name: '团本' },
      { type: 'tier', name: '套装' },
    ],
    instanceOptions: [],
    visibleInstanceOptions: [],
    keyword: '',
    selectedSpec: null,
    selectedSlots: [],
    selectedSourceType: 'all',
    selectedSourceTypes: [],
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
    favoriteCount: 0,
    favoriteList: [],
    favoriteGroups: [],
    favoriteSortMode: 'slot',
    pendingRemoveFavoriteKey: '',
    showFavorites: false,
    buildRequestMode: false,
    showBuildRequestIntro: false,
    buildDraftList: [],
    buildDraftGroups: [],
    buildDraftCount: 0,
    showBuildDraft: false,
    favoritePickerList: [],
    showFavoritePicker: false,
    pageStyle: '',
  },

  onLoad(options) {
    if (options.shareFav) {
      wx.redirectTo({ url: `/pages/index/index?shareFav=${encodeURIComponent(options.shareFav)}` });
      return;
    }

    const classKey = options.classKey || 'monk';
    const classMeta = getClassMeta(classKey) || getClassMeta('monk');
    const visualAssets = getClassVisualAssets((classMeta && classMeta.key) || 'monk');
    this.setData({
      classKey,
      className: options.className || (classMeta && classMeta.name) || '武僧',
      classMeta,
      heroBannerAsset: visualAssets.banner,
      classEmblemAsset: visualAssets.emblem,
      openItemId: options.openItemId || null,
      buildRequestMode: options.requestBuild === '1',
      showBuildRequestIntro: options.requestBuild === '1',
    });
    if (options.requestBuild === '1') {
      startBuildDraft(classKey, options.className || (classMeta && classMeta.name) || '武僧');
      this.refreshBuildDraft();
    }
    this.loadData(classKey);
  },

  onShow() {
    if (this.data.allItems.length) {
      this.refreshFavoriteFlags();
    }
    this.refreshFavorites();
    if (this.data.buildRequestMode) {
      this.refreshBuildDraft();
    }
  },

  loadData(classKey) {
    loadClassData(classKey).then((data) => {
      const favorites = getFavorites();
      const buildDraft = getBuildDraft();
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
          isFavorite: isFavorite(classKey, item.id, favorites),
          isBuildSelected: isBuildDraftItem(classKey, item.id, buildDraft),
        }))
        : [];
      this.itemMap = {};
      allItems.forEach((item) => {
        this.itemMap[item.id] = item;
      });

      const instanceOptions = buildInstanceOptions((data && data.instances) || []);

      this.setData({
        classMeta: (data && data.class) || this.data.classMeta,
        className: (data && data.class && data.class.name) || this.data.className,
        heroBannerAsset: getClassVisualAssets(classKey).banner,
        classEmblemAsset: getClassVisualAssets(classKey).emblem,
        specs: (data && data.specs) || [],
        instanceOptions,
        visibleInstanceOptions: instanceOptions,
        allItems,
        hasAnyData: allItems.length > 0,
        isLoading: false,
      });

      this.applyFilters();
      this.refreshFavorites();

      if (this.data.openItemId && this.itemMap[this.data.openItemId]) {
        this.onItemTap({ currentTarget: { dataset: { itemId: this.data.openItemId } } });
        this.setData({ openItemId: null });
      }
    });
  },

  refreshFavoriteFlags() {
    const favorites = getFavorites();
    const buildDraft = getBuildDraft();
    const allItems = this.data.allItems.map((item) => ({
      ...item,
      isFavorite: isFavorite(this.data.classKey, item.id, favorites),
      isBuildSelected: isBuildDraftItem(this.data.classKey, item.id, buildDraft),
    }));
    this.itemMap = {};
    allItems.forEach((item) => {
      this.itemMap[item.id] = item;
    });
    this.setData({
      allItems,
      selectedItem: this.data.selectedItem
        ? {
          ...this.data.selectedItem,
          isFavorite: this.data.buildRequestMode
            ? isBuildDraftItem(this.data.classKey, this.data.selectedItem.id, buildDraft)
            : isFavorite(this.data.classKey, this.data.selectedItem.id, favorites),
          favoriteOnText: this.data.buildRequestMode ? '已加入' : '已收藏',
          favoriteOffText: this.data.buildRequestMode ? '加入本次' : '收藏',
        }
        : null,
    }, () => this.applyFilters());
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
    let selectedSourceTypes = this.data.selectedSourceTypes.slice();
    if (type === 'all') {
      selectedSourceTypes = [];
    } else {
      const index = selectedSourceTypes.indexOf(type);
      if (index === -1) {
        selectedSourceTypes.push(type);
      } else {
        selectedSourceTypes.splice(index, 1);
      }
      if (selectedSourceTypes.length >= 3) {
        selectedSourceTypes = [];
      }
    }

    const sourceTypes = this.data.sourceTypes.map((item) => ({
      ...item,
      selected: item.type === 'all'
        ? selectedSourceTypes.length === 0
        : selectedSourceTypes.indexOf(item.type) !== -1,
    }));
    const currentInstance = this.data.instanceOptions.find((item) => item.id === this.data.selectedInstanceId);
    const shouldResetInstance = currentInstance
      && selectedSourceTypes.length > 0
      && selectedSourceTypes.indexOf(currentInstance.type) === -1;

    this.setData({
      selectedSourceType: selectedSourceTypes.length === 1 ? selectedSourceTypes[0] : 'all',
      selectedSourceTypes,
      sourceTypes,
      visibleInstanceOptions: this.getVisibleInstanceOptions(selectedSourceTypes),
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
      selectedSourceTypes: [],
      sourceTypes: this.data.sourceTypes.map((item) => ({ ...item, selected: item.type === 'all' })),
      visibleInstanceOptions: this.data.instanceOptions,
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
      selectedSourceTypes: this.data.selectedSourceTypes,
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
    if (this.data.selectedSourceTypes.length) {
      const selectedSourceNames = this.data.sourceTypes
        .filter((item) => item.type !== 'all' && this.data.selectedSourceTypes.indexOf(item.type) !== -1)
        .map((item) => item.name);
      if (selectedSourceNames.length) {
        activeFilterParts.push(selectedSourceNames.join('/'));
      }
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
          this.data.selectedSourceTypes.length ||
          selectedStats.length ||
          excludedStats.length ||
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
    this.setData({
      showModal: true,
      pageStyle: 'overflow:hidden;height:100vh;',
      selectedItem: buildItemDetail({
        ...item,
        isFavorite: this.data.buildRequestMode
          ? isBuildDraftItem(this.data.classKey, item.id)
          : isFavorite(this.data.classKey, item.id),
        favoriteOnText: this.data.buildRequestMode ? '已加入' : '已收藏',
        favoriteOffText: this.data.buildRequestMode ? '加入本次' : '收藏',
        classKey: this.data.classKey,
        className: this.data.className,
      }, this.data.selectedSpec, this.data.specs),
    });
  },

  getVisibleInstanceOptions(selectedSourceTypes) {
    if (!selectedSourceTypes.length) {
      return this.data.instanceOptions;
    }
    return this.data.instanceOptions.filter((item) => selectedSourceTypes.indexOf(item.type) !== -1);
  },

  loadFavoriteClassItems(classKey) {
    if (classKey === this.data.classKey) {
      return Promise.resolve({
        classKey,
        className: this.data.className,
        specs: this.data.specs,
        itemMap: this.itemMap,
      });
    }
    if (this.classItemCache[classKey]) {
      return Promise.resolve(this.classItemCache[classKey]);
    }

    return loadClassData(classKey).then((data) => {
      if (!data) {
        return null;
      }

      const favorites = getFavorites();
      const classMeta = (data && data.class) || getClassMeta(classKey) || {};
      const items = flattenItems(data.instances || []).map((item) => ({
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
        isFavorite: isFavorite(classKey, item.id, favorites),
      }));
      const itemMap = {};
      items.forEach((item) => {
        itemMap[item.id] = item;
      });

      const result = {
        classKey,
        className: classMeta.name || '',
        specs: data.specs || [],
        itemMap,
      };
      this.classItemCache[classKey] = result;
      return result;
    });
  },

  refreshBuildDraft() {
    const draft = getBuildDraft();
    const buildDraftList = draft.classKey === this.data.classKey ? draft.items : [];
    const buildDraftGroups = buildFavoriteGroups(buildDraftList);

    this.setData({
      buildDraftList,
      buildDraftGroups,
      buildDraftCount: buildDraftList.length,
    });

    if (this.data.allItems.length) {
      const allItems = this.data.allItems.map((item) => ({
        ...item,
        isBuildSelected: draft.classKey === this.data.classKey && isBuildDraftItem(this.data.classKey, item.id, draft),
      }));
      this.itemMap = {};
      allItems.forEach((item) => {
        this.itemMap[item.id] = item;
      });
      this.setData({
        allItems,
        selectedItem: this.data.selectedItem
          ? {
            ...this.data.selectedItem,
            isFavorite: draft.classKey === this.data.classKey && isBuildDraftItem(this.data.classKey, this.data.selectedItem.id, draft),
            favoriteOnText: '已加入',
            favoriteOffText: '加入本次',
          }
          : null,
      }, () => this.applyFilters());
    }

    if (this.data.showFavoritePicker) {
      this.refreshFavoritePickerList();
    }
  },

  toggleBuildDraftSelection(itemId) {
    const item = this.itemMap[itemId];
    const detail = this.data.selectedItem && this.data.selectedItem.id === itemId ? this.data.selectedItem : null;
    const sourceItem = item || detail;
    if (!sourceItem) {
      return;
    }

    const snapshot = buildFavoriteSnapshot(this.data.classKey, this.data.className, sourceItem);
    const result = toggleBuildDraftItem(this.data.classKey, this.data.className, snapshot);
    this.refreshBuildDraft();
    wx.showToast({
      title: result.isSelected ? '已加入本次配装' : '已移出本次配装',
      icon: 'none',
    });
  },

  refreshCachedFavoriteState(classKey, itemId, isItemFavorite) {
    if (classKey === this.data.classKey && this.itemMap[itemId]) {
      this.itemMap[itemId] = {
        ...this.itemMap[itemId],
        isFavorite: isItemFavorite,
      };
      return;
    }

    const cache = this.classItemCache[classKey];
    if (!cache || !cache.itemMap[itemId]) {
      return;
    }
    cache.itemMap[itemId] = {
      ...cache.itemMap[itemId],
      isFavorite: isItemFavorite,
    };
  },

  toggleFavoriteItem(itemId) {
    if (this.data.buildRequestMode) {
      this.toggleBuildDraftSelection(itemId);
      return;
    }

    const item = this.itemMap[itemId];
    if (!item && this.data.selectedItem && this.data.selectedItem.id === itemId) {
      const detail = this.data.selectedItem;
      const result = toggleFavorite(buildFavoriteSnapshot(detail.classKey, detail.className, detail));
      this.refreshCachedFavoriteState(detail.classKey, detail.id, result.isFavorite);
      this.setData({
        selectedItem: {
          ...detail,
          isFavorite: result.isFavorite,
        },
      });
      this.refreshFavorites();
      return;
    }

    if (!item) {
      return;
    }

    const result = toggleFavorite(buildFavoriteSnapshot(this.data.classKey, this.data.className, item));
    const allItems = this.data.allItems.map((equip) => (
      equip.id === item.id ? { ...equip, isFavorite: result.isFavorite } : equip
    ));
    this.itemMap = {};
    allItems.forEach((equip) => {
      this.itemMap[equip.id] = equip;
    });
    this.refreshCachedFavoriteState(this.data.classKey, item.id, result.isFavorite);

    this.setData({
      allItems,
      selectedItem: this.data.selectedItem && this.data.selectedItem.id === item.id
        ? { ...this.data.selectedItem, isFavorite: result.isFavorite }
        : this.data.selectedItem,
    }, () => {
      this.applyFilters();
      this.refreshFavorites();
    });
  },

  onFavoriteTap(event) {
    this.toggleFavoriteItem(event.currentTarget.dataset.itemId);
  },

  onDetailFavoriteTap(event) {
    this.toggleFavoriteItem(event.detail && event.detail.itemId);
  },

  closeModal() {
    this.setData({
      showModal: false,
      selectedItem: null,
      pageStyle: this.data.showFavorites || this.data.showBuildDraft || this.data.showFavoritePicker ? 'overflow:hidden;height:100vh;' : '',
    });
  },

  refreshFavorites(sortMode = this.data.favoriteSortMode) {
    const favoriteList = getFavorites();
    this.setData({
      favoriteList,
      favoriteGroups: buildFavoriteGroups(favoriteList, sortMode),
      favoriteCount: favoriteList.length,
    });
  },

  toggleFavoriteSort() {
    const favoriteSortMode = this.data.favoriteSortMode === 'slot' ? 'time' : 'slot';
    this.setData({
      favoriteSortMode,
      pendingRemoveFavoriteKey: '',
      favoriteGroups: buildFavoriteGroups(this.data.favoriteList, favoriteSortMode),
    });
  },

  openFavorites() {
    const favoriteSortMode = 'slot';
    const favoriteList = getFavorites();
    this.setData({
      favoriteSortMode,
      favoriteList,
      favoriteGroups: buildFavoriteGroups(favoriteList, favoriteSortMode),
      favoriteCount: favoriteList.length,
      showFavorites: true,
      pageStyle: 'overflow:hidden;height:100vh;',
    });
  },

  closeFavorites() {
    this.setData({
      showFavorites: false,
      pendingRemoveFavoriteKey: '',
      pageStyle: this.data.showModal || this.data.showBuildDraft || this.data.showFavoritePicker ? 'overflow:hidden;height:100vh;' : '',
    });
  },

  clearPendingRemoveFavorite() {
    if (this.data.pendingRemoveFavoriteKey) {
      this.setData({ pendingRemoveFavoriteKey: '' });
    }
  },

  removeFavoriteItem(event) {
    const { key } = (event.detail || event.currentTarget.dataset);
    if (this.data.pendingRemoveFavoriteKey !== key) {
      this.setData({ pendingRemoveFavoriteKey: key });
      return;
    }

    removeFavorite(key);
    this.setData({ pendingRemoveFavoriteKey: '' });
    this.refreshFavorites();
    this.refreshFavoriteFlags();
    wx.showToast({
      title: '已移除收藏',
      icon: 'none',
    });
  },

  clearFavoriteItems() {
    if (!this.data.favoriteList.length) {
      return;
    }
    wx.showModal({
      title: '清空收藏',
      content: '确定移除全部收藏装备？',
      confirmText: '清空',
      confirmColor: '#e05050',
      success: (res) => {
        if (!res.confirm) {
          return;
        }
        clearFavorites();
        this.setData({ pendingRemoveFavoriteKey: '' });
        this.refreshFavorites();
        this.refreshFavoriteFlags();
      },
    });
  },

  startNewBuildDraft() {
    const resetDraft = () => {
      clearBuildDraft();
      startBuildDraft(this.data.classKey, this.data.className, false);
      this.setData({ showBuildRequestIntro: false });
      this.refreshBuildDraft();
      wx.showToast({
        title: '已新建本次配装',
        icon: 'none',
      });
    };

    if (!this.data.buildDraftCount) {
      resetDraft();
      return;
    }

    wx.showModal({
      title: '新建本次配装',
      content: '会清空当前本次配装清单，普通收藏夹不受影响。',
      confirmText: '新建',
      confirmColor: '#d4a84b',
      success: (res) => {
        if (res.confirm) {
          resetDraft();
        }
      },
    });
  },

  dismissBuildRequestIntro() {
    this.setData({ showBuildRequestIntro: false });
  },

  openBuildDraft() {
    this.refreshBuildDraft();
    this.setData({
      showBuildDraft: true,
      showBuildRequestIntro: false,
      pageStyle: 'overflow:hidden;height:100vh;',
    });
  },

  closeBuildDraft() {
    this.setData({
      showBuildDraft: false,
      pageStyle: this.data.showModal || this.data.showFavorites || this.data.showFavoritePicker ? 'overflow:hidden;height:100vh;' : '',
    });
  },

  removeBuildDraftFavorite(event) {
    const { key } = event.currentTarget.dataset;
    if (!key) {
      return;
    }
    removeBuildDraftItem(key);
    this.refreshBuildDraft();
  },

  clearBuildDraftItems() {
    if (!this.data.buildDraftCount) {
      return;
    }
    wx.showModal({
      title: '清空本次配装',
      content: '只清空本次临时配装，不会影响你的收藏夹。',
      confirmText: '清空',
      confirmColor: '#e05050',
      success: (res) => {
        if (!res.confirm) {
          return;
        }
        clearBuildDraft();
        startBuildDraft(this.data.classKey, this.data.className, false);
        this.refreshBuildDraft();
      },
    });
  },

  buildFavoritePickerList() {
    const draft = getBuildDraft();
    return getFavorites()
      .filter((favorite) => favorite.classKey === this.data.classKey)
      .map((favorite) => ({
        ...favorite,
        isPicked: isBuildDraftItem(this.data.classKey, favorite.itemId, draft),
      }));
  },

  refreshFavoritePickerList() {
    const favoritePickerList = this.buildFavoritePickerList();
    this.setData({ favoritePickerList });
  },

  openFavoritePicker() {
    const favoritePickerList = this.buildFavoritePickerList();
    if (!favoritePickerList.length) {
      wx.showToast({
        title: '该职业暂无收藏',
        icon: 'none',
      });
      return;
    }
    this.setData({
      favoritePickerList,
      showFavoritePicker: true,
      showBuildRequestIntro: false,
      pageStyle: 'overflow:hidden;height:100vh;',
    });
  },

  closeFavoritePicker() {
    this.setData({
      showFavoritePicker: false,
      pageStyle: this.data.showModal || this.data.showFavorites || this.data.showBuildDraft ? 'overflow:hidden;height:100vh;' : '',
    });
  },

  addFavoritePickerItem(event) {
    const { key } = event.currentTarget.dataset;
    const favorite = this.data.favoritePickerList.find((item) => item.key === key);
    if (!favorite) {
      return;
    }
    const result = addBuildDraftItems(this.data.classKey, this.data.className, [favorite]);
    this.refreshBuildDraft();
    wx.showToast({
      title: result.addedCount ? '已加入本次配装' : '已在本次配装中',
      icon: 'none',
    });
  },

  addAllFavoritePickerItems() {
    if (!this.data.favoritePickerList.length) {
      return;
    }
    const result = addBuildDraftItems(this.data.classKey, this.data.className, this.data.favoritePickerList);
    this.refreshBuildDraft();
    wx.showToast({
      title: result.addedCount ? `已加入${result.addedCount}件` : '已全部加入',
      icon: 'none',
    });
  },

  onFavoriteItemTap(event) {
    const { itemId, classKey, className } = (event.detail || event.currentTarget.dataset);
    if (!itemId || !classKey) {
      return;
    }

    wx.showLoading({ title: '加载中' });
    this.loadFavoriteClassItems(classKey).then((cache) => {
      wx.hideLoading();
      const item = cache && cache.itemMap[itemId];
      if (!item) {
        wx.showToast({
          title: '未找到装备详情',
          icon: 'none',
        });
        return;
      }

      this.setData({
        showModal: true,
        pageStyle: 'overflow:hidden;height:100vh;',
        selectedItem: buildItemDetail({
          ...item,
          isFavorite: this.data.buildRequestMode && classKey === this.data.classKey
            ? isBuildDraftItem(classKey, item.id)
            : isFavorite(classKey, item.id),
          favoriteOnText: this.data.buildRequestMode && classKey === this.data.classKey ? '已加入' : '已收藏',
          favoriteOffText: this.data.buildRequestMode && classKey === this.data.classKey ? '加入本次' : '收藏',
          classKey,
          className: className || cache.className,
        }, classKey === this.data.classKey ? this.data.selectedSpec : null, cache.specs),
      });
    }).catch(() => {
      wx.hideLoading();
      wx.showToast({
        title: '加载装备详情失败',
        icon: 'none',
      });
    });
  },

  buildRequestSharePath() {
    return `/pages/equipment/equipment?classKey=${this.data.classKey}&className=${this.data.className}&requestBuild=1`;
  },

  buildRequestShareTitle() {
    return `大佬，大佬，能帮我配一套${this.data.className}的装备吗？球球了 🥺🙏`;
  },

  buildDraftSharePath() {
    const payload = buildFavoriteSharePayload(this.data.buildDraftList);
    return payload ? `/pages/index/index?shareFav=${encodeURIComponent(payload)}` : '';
  },

  onShareAppMessage(options = {}) {
    if (options.from === 'button') {
      const favoriteList = this.data.favoriteList.length ? this.data.favoriteList : getFavorites();
      const payload = buildFavoriteSharePayload(favoriteList);
      if (payload) {
        return {
          title: buildFavoriteShareTitle(favoriteList),
          path: `/pages/index/index?shareFav=${encodeURIComponent(payload)}`,
        };
      }
    }

    if (this.data.buildRequestMode && this.data.buildDraftCount) {
      const path = this.buildDraftSharePath();
      if (path) {
        return {
          title: `我帮你配了一套${this.data.className}装备`,
          path,
        };
      }
    }

    return {
      title: this.buildRequestShareTitle(),
      path: this.buildRequestSharePath(),
    };
  },

  onShareTimeline() {
    if (this.data.showFavorites && this.data.favoriteList.length) {
      const payload = buildFavoriteSharePayload(this.data.favoriteList);
      if (payload) {
        return {
          title: buildFavoriteShareTitle(this.data.favoriteList),
          query: `shareFav=${encodeURIComponent(payload)}`,
        };
      }
    }

    if (this.data.buildRequestMode && this.data.buildDraftCount) {
      const payload = buildFavoriteSharePayload(this.data.buildDraftList);
      if (payload) {
        return {
          title: `我帮你配了一套${this.data.className}装备`,
          query: `shareFav=${encodeURIComponent(payload)}`,
        };
      }
    }

    return {
      title: this.buildRequestShareTitle(),
      query: `classKey=${this.data.classKey}&className=${this.data.className}&requestBuild=1`,
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
