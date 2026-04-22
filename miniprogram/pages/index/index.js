const { CLASS_LIST, loadOverview } = require('../../utils/class-data');

Page({
  data: {
    classes: CLASS_LIST,
    overview: null,
  },

  onLoad() {
    const overview = loadOverview();
    const classCountMap = {};
    if (overview && Array.isArray(overview.classes)) {
      overview.classes.forEach((item) => {
        classCountMap[item.key] = item.itemCount;
      });
    }
    this.setData({
      overview,
      classes: CLASS_LIST.map((item) => ({
        ...item,
        itemCount: classCountMap[item.key] || 0,
      })),
    });
  },

  onClassTap(event) {
    const { key, name } = event.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/equipment/equipment?classKey=${key}&className=${name}`,
    });
  },
});
