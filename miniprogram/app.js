App({
  onLaunch() {
    const updateManager = wx.getUpdateManager();
    updateManager.onCheckForUpdate((res) => {
      if (res.hasUpdate) {
        updateManager.onUpdateReady(() => {
          wx.showModal({
            title: '更新提示',
            content: '新版本已准备好，是否重启应用？',
            success(modalRes) {
              if (modalRes.confirm) {
                updateManager.applyUpdate();
              }
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
  globalData: {
    title: '艾泽配装',
    cosBase: 'https://wowlook-1308073800.cos.ap-guangzhou.myqcloud.com'
  }
});
