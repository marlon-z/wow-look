# 小程序按需注入与静默更新设计

## 目标

仅调整微信小程序，满足以下要求：

- `app.json` 始终启用 `lazyCodeLoading: "requiredComponents"`。
- 冷启动和热启动均进入版本更新管理逻辑。
- 更新管理器监听在单次小程序进程内只绑定一次。
- 新版本下载完成后不弹窗，直接应用并重启。
- 更新失败保持静默，不清理用户本地缓存。

## 当前状态

`miniprogram/app.json` 已配置组件按需注入，无需修改。`miniprogram/app.js` 当前只在 `onLaunch` 创建更新管理器，更新完成和失败都会弹窗，并在后台超过30分钟后无条件调用 `restartMiniProgram`。

## 方案

在 App 实例中增加私有初始化方法：

1. `onLaunch` 和 `onShow` 均调用该方法。
2. 方法通过实例标志防止重复初始化和重复绑定监听。
3. 使用 `wx.getUpdateManager()` 获取全局唯一更新管理器。
4. `onCheckForUpdate` 仅监听结果，不展示界面。
5. `onUpdateReady` 直接调用 `applyUpdate()`。
6. `onUpdateFailed` 静默等待下一次微信自动检查。
7. 删除基于后台停留时间的无条件重启逻辑。

微信在小程序每次启动（包括热启动）时自动检查更新，不需要开发者主动发起检查；`onShow` 调用初始化方法用于保证生命周期入口和监听已就绪。

## 缓存安全

实现不得调用：

- `wx.clearStorage()`
- `wx.clearStorageSync()`
- 任何删除本地稿件或用户设置的项目方法

`applyUpdate()` 只应用已下载的新代码包，不主动清理小程序 Storage。

## 测试

新增 Node.js 测试，模拟 App 和微信更新管理器：

- 校验 `lazyCodeLoading` 配置。
- 校验 `onLaunch`、`onShow` 都进入初始化方法。
- 校验三个监听器只绑定一次。
- 校验更新就绪时直接调用 `applyUpdate()`。
- 校验不调用弹窗、无条件重启和缓存清理接口。
