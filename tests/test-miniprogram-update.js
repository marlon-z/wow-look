const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const appJson = JSON.parse(fs.readFileSync(path.join(root, 'miniprogram', 'app.json'), 'utf8'));
assert.strictEqual(
  appJson.lazyCodeLoading,
  'requiredComponents',
  'app.json 必须启用组件按需注入'
);

let appDefinition = null;
let getManagerCalls = 0;
let applyUpdateCalls = 0;
let forbiddenCalls = 0;
const listenerCounts = { check: 0, ready: 0, failed: 0 };
const listeners = {};

const updateManager = {
  onCheckForUpdate(listener) {
    listenerCounts.check += 1;
    listeners.check = listener;
  },
  onUpdateReady(listener) {
    listenerCounts.ready += 1;
    listeners.ready = listener;
  },
  onUpdateFailed(listener) {
    listenerCounts.failed += 1;
    listeners.failed = listener;
  },
  applyUpdate() {
    applyUpdateCalls += 1;
  },
};

global.App = function App(definition) {
  appDefinition = definition;
};

global.wx = {
  getUpdateManager() {
    getManagerCalls += 1;
    return updateManager;
  },
  showModal() {
    forbiddenCalls += 1;
  },
  restartMiniProgram() {
    forbiddenCalls += 1;
  },
  clearStorage() {
    forbiddenCalls += 1;
  },
  clearStorageSync() {
    forbiddenCalls += 1;
  },
};

const appPath = path.join(root, 'miniprogram', 'app.js');
delete require.cache[require.resolve(appPath)];
require(appPath);

assert.ok(appDefinition, 'app.js 应注册 App');
assert.strictEqual(typeof appDefinition.onLaunch, 'function');
assert.strictEqual(typeof appDefinition.onShow, 'function');

// onShow must independently enter update setup; repeated lifecycle calls must not rebind.
appDefinition.onShow.call(appDefinition);
assert.strictEqual(getManagerCalls, 1, 'onShow 应进入更新管理逻辑');
appDefinition.onLaunch.call(appDefinition);
appDefinition.onShow.call(appDefinition);

assert.strictEqual(getManagerCalls, 1, '全局更新管理器只应初始化一次');
assert.deepStrictEqual(listenerCounts, { check: 1, ready: 1, failed: 1 }, '更新监听只应绑定一次');

assert.doesNotThrow(() => listeners.check({ hasUpdate: true }), '检查结果不应触发界面或中断');
assert.doesNotThrow(() => listeners.ready(), '更新就绪应静默应用');
assert.strictEqual(applyUpdateCalls, 1, '更新就绪后应直接调用 applyUpdate');
assert.doesNotThrow(() => listeners.failed(), '更新失败应保持静默');
assert.strictEqual(forbiddenCalls, 0, '更新流程不得弹窗、无条件重启或清理缓存');

delete global.App;
delete global.wx;

console.log('miniprogram update tests passed');
