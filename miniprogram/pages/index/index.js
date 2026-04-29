const { COS_BASE, CLASS_LIST, getClassVisualAssets, loadOverview } = require('../../utils/class-data');
const { getFavorites, removeFavorite, clearFavorites } = require('../../utils/favorites');

function enrichList(list, countMap) {
  return list.map((item) => ({
    ...item,
    emblem: getClassVisualAssets(item.key).emblem,
    itemCount: countMap[item.key] || 0,
  }));
}

Page({
  data: {
    cosBase: COS_BASE,
    row1: [],
    row2: [],
    row3: [],
    favoriteCount: 0,
    favoriteList: [],
    showFavorites: false,
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
      favoriteCount: favoriteList.length,
    });
  },

  openFavorites() {
    this.refreshFavorites();
    this.setData({ showFavorites: true });
  },

  closeFavorites() {
    this.setData({ showFavorites: false });
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
