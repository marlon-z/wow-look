const STALE_THRESHOLD = 30 * 60 * 1000;

App({
  onLaunch() {
    this._hideTimestamp = 0;

    const updateManager = wx.getUpdateManager();
    updateManager.onCheckForUpdate((res) => {
      if (res.hasUpdate) {
        updateManager.onUpdateReady(() => {
          wx.showModal({
            title: '更新提示',
            content: '新版本已准备好，请重启应用',
            showCancel: false,
            success() {
              updateManager.applyUpdate();
            }
          });
        });
        updateManager.onUpdateFailed(() => {
          wx.showModal({
            title: '更新提示',
            content: '新版本下载失败，请删除小程序后重新搜索打开',
            showCancel: false
          });
        });
      }
    });
  },

  onHide() {
    this._hideTimestamp = Date.now();
  },

  onShow() {
    if (this._hideTimestamp && Date.now() - this._hideTimestamp > STALE_THRESHOLD) {
      wx.restartMiniProgram({ path: '' });
    }
  },

  globalData: {
    title: '艾泽配装',
    cosBase: 'https://wowlook-1308073800.cos.ap-guangzhou.myqcloud.com'
  }
});
