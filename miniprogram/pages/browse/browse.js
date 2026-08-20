const {
  CLASS_LIST,
  getClassVisualAssets,
} = require('../../utils/class-data');

function enrichList(list) {
  return list.map((item) => ({
    ...item,
    emblem: getClassVisualAssets(item.key).emblem,
  }));
}

Page({
  data: {
    row1: [],
    row2: [],
    row3: [],
    pageStyle: '',
  },

  onLoad() {
    this.setData({
      row1: enrichList(CLASS_LIST.slice(0, 4)),
      row2: enrichList(CLASS_LIST.slice(4, 9)),
      row3: enrichList(CLASS_LIST.slice(9, 13)),
    });
  },

  onClassTap(event) {
    const { key, name } = event.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/equipment/equipment?classKey=${key}&className=${name}`,
    });
  },

  onShareAppMessage() {
    return {
      title: '艾泽配装 · 查装备',
      path: '/pages/browse/browse',
    };
  },

  onShareTimeline() {
    return {
      title: '艾泽配装 · 查装备',
    };
  },
});
