App({
  _ensureUpdateManager() {
    if (
      this._updateManagerInitialized
      || typeof wx === 'undefined'
      || typeof wx.getUpdateManager !== 'function'
    ) {
      return;
    }

    const updateManager = wx.getUpdateManager();
    this._updateManagerInitialized = true;
    this._updateManager = updateManager;

    updateManager.onCheckForUpdate(() => {});
    updateManager.onUpdateReady(() => {
      updateManager.applyUpdate();
    });
    updateManager.onUpdateFailed(() => {});
  },

  onLaunch() {
    this._ensureUpdateManager();
  },

  onShow() {
    this._ensureUpdateManager();
  },

  globalData: {
    title: '艾泽配装'
  }
});
