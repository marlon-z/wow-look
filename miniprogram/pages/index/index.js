const { CLASS_LIST, getClassVisualAssets, loadOverview } = require('../../utils/class-data');

function enrichList(list, countMap) {
  return list.map((item) => ({
    ...item,
    emblem: getClassVisualAssets(item.key).emblem,
    itemCount: countMap[item.key] || 0,
  }));
}

Page({
  data: {
    row1: [],
    row2: [],
    row3: [],
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

  onClassTap(event) {
    const { key, name } = event.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/equipment/equipment?classKey=${key}&className=${name}`,
    });
  },
});
