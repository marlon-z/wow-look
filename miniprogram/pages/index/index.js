const {
  COS_BASE,
  CLASS_LIST,
  getClassMeta,
  getClassVisualAssets,
  loadOverview,
  loadClassData,
} = require('../../utils/class-data');
const {
  flattenItems,
  buildStatLine,
  buildSpecNames,
  buildMetaLine,
  buildItemDetail,
} = require('../../utils/equipment');
const {
  getFavorites,
  buildFavoriteGroups,
  removeFavorite,
  clearFavorites,
  isFavorite,
  buildFavoriteSnapshot,
  toggleFavorite,
} = require('../../utils/favorites');

function enrichList(list, countMap) {
  return list.map((item) => ({
    ...item,
    emblem: getClassVisualAssets(item.key).emblem,
    itemCount: countMap[item.key] || 0,
  }));
}

Page({
  classItemCache: {},

  data: {
    cosBase: COS_BASE,
    row1: [],
    row2: [],
    row3: [],
    favoriteCount: 0,
    favoriteList: [],
    favoriteGroups: [],
    showFavorites: false,
    selectedItem: null,
    showModal: false,
    pageStyle: '',
  },

  onLoad() {
    const countMap = {};
    this.setData({
      row1: enrichList(CLASS_LIST.slice(0, 4), countMap),
      row2: enrichList(CLASS_LIST.slice(4, 9), countMap),
      row3: enrichList(CLASS_LIST.slice(9, 13), countMap),
    });

    loadOverview().then((overview) => {
      if (overview && Array.isArray(overview.classes)) {
        overview.classes.forEach((item) => {
          countMap[item.key] = item.itemCount;
        });
        this.setData({
          row1: enrichList(CLASS_LIST.slice(0, 4), countMap),
          row2: enrichList(CLASS_LIST.slice(4, 9), countMap),
          row3: enrichList(CLASS_LIST.slice(9, 13), countMap),
        });
      }
    });
  },

  onShow() {
    this.refreshFavorites();
  },

  refreshFavorites() {
    const favoriteList = getFavorites();
    this.setData({
      favoriteList,
      favoriteGroups: buildFavoriteGroups(favoriteList),
      favoriteCount: favoriteList.length,
    });
  },

  openFavorites() {
    this.refreshFavorites();
    this.setData({
      showFavorites: true,
      pageStyle: 'overflow:hidden;height:100vh;',
    });
  },

  loadClassItems(classKey) {
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
        items,
        itemMap,
      };
      this.classItemCache[classKey] = result;
      return result;
    });
  },

  refreshCachedFavoriteState(classKey, itemId, isItemFavorite) {
    const cache = this.classItemCache[classKey];
    if (!cache || !cache.itemMap[itemId]) {
      return;
    }
    const item = {
      ...cache.itemMap[itemId],
      isFavorite: isItemFavorite,
    };
    cache.itemMap[itemId] = item;
    cache.items = cache.items.map((equip) => (equip.id === item.id ? item : equip));
  },

  closeFavorites() {
    this.setData({
      showFavorites: false,
      pageStyle: this.data.showModal ? 'overflow:hidden;height:100vh;' : '',
    });
  },

  removeFavoriteItem(event) {
    const { key } = event.currentTarget.dataset;
    removeFavorite(key);
    this.refreshFavorites();
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
        this.refreshFavorites();
      },
    });
  },

  onFavoriteItemTap(event) {
    const { itemId, classKey, className } = event.currentTarget.dataset;
    if (!itemId || !classKey) {
      return;
    }

    wx.showLoading({ title: '加载中' });
    this.loadClassItems(classKey).then((cache) => {
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
        showFavorites: false,
        showModal: true,
        pageStyle: 'overflow:hidden;height:100vh;',
        selectedItem: buildItemDetail({
          ...item,
          isFavorite: isFavorite(classKey, item.id),
          classKey,
          className: className || cache.className,
        }, null, cache.specs),
      });
    }).catch(() => {
      wx.hideLoading();
      wx.showToast({
        title: '加载装备详情失败',
        icon: 'none',
      });
    });
  },

  onDetailFavoriteTap(event) {
    const itemId = event.detail && event.detail.itemId;
    const item = this.data.selectedItem;
    if (!item || item.id !== itemId) {
      return;
    }

    const classKey = item.classKey;
    const className = item.className || '';
    const result = toggleFavorite(buildFavoriteSnapshot(classKey, className, item));
    this.refreshCachedFavoriteState(classKey, item.id, result.isFavorite);
    this.setData({
      selectedItem: {
        ...item,
        isFavorite: result.isFavorite,
      },
    });
    this.refreshFavorites();
  },

  closeModal() {
    this.setData({
      showModal: false,
      selectedItem: null,
      pageStyle: this.data.showFavorites ? 'overflow:hidden;height:100vh;' : '',
    });
  },

  onShareAppMessage() {
    return {
      title: '艾泽配装 · 当赛季装备一键速查',
      path: '/pages/index/index',
    };
  },

  onShareTimeline() {
    return {
      title: '艾泽配装 · 当赛季装备一键速查',
    };
  },

  onClassTap(event) {
    const { key, name } = event.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/equipment/equipment?classKey=${key}&className=${name}`,
    });
  },

  preventClose() {},
});
