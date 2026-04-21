const { CLASS_LIST } = require('../../utils/class-data');

Page({
  data: {
    classes: CLASS_LIST
  },

  onClassTap(e) {
    const classKey = e.currentTarget.dataset.key;
    const className = e.currentTarget.dataset.name;
    wx.navigateTo({
      url: `/pages/equipment/equipment?classKey=${classKey}&className=${className}`
    });
  }
});
