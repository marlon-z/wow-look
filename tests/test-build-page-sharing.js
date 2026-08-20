const assert = require('assert');

const storage = {};
global.wx = {
  getStorageSync(key) { return storage[key]; },
  setStorageSync(key, value) { storage[key] = value; },
};
let page;
global.Page = (definition) => { page = definition; };
require('../miniprogram/pages/build/build');

const { createBuild, updateBuild, emptySlots } = require('../miniprogram/utils/builds');
const build = createBuild('warrior', '战士', 71, '武器', true);
updateBuild(build.id, { slots: Object.assign(emptySlots(), { head: { itemId: 271456 } }) });

function context(overrides) {
  const value = Object.assign({
    data: {
      selectedClassKey: 'warrior', selectedClassName: '战士', selectedSpecId: 71,
      selectedSpecName: '武器', currentBuildId: build.id, currentWclPresetInfo: null,
    },
  }, overrides || {});
  value.buildShareBase = page.buildShareBase;
  value.buildCurrentWclShareQuery = page.buildCurrentWclShareQuery;
  value.buildCurrentBuildShareQuery = page.buildCurrentBuildShareQuery;
  value.buildWclPresetShareQuery = page.buildWclPresetShareQuery;
  return value;
}

const realtime = context();
const message = page.onShareAppMessage.call(realtime, { target: { dataset: { shareType: 'build' } } });
assert.ok(message.path.startsWith('/pages/build/build?classKey=warrior&specId=71'));
assert.match(message.path, /shareBuild=v2%7Cwarrior%7C71%7Chead%3A271456/);
const timeline = page.onShareTimeline.call(realtime);
assert.match(timeline.query, /shareBuild=v2%7Cwarrior%7C71%7Chead%3A271456/);

const wcl = context({
  data: Object.assign({}, realtime.data, {
    currentWclPresetInfo: { id: 'wcl-1', fileKey: 'mythic-plus-top', contentType: 'mythicPlus' },
  }),
});
const wclMessage = page.onShareAppMessage.call(wcl, { target: { dataset: { shareType: 'build' } } });
assert.match(wclMessage.path, /wclFileKey=mythic-plus-top/);
assert.match(wclMessage.path, /wclPresetId=wcl-1/);
assert.ok(!wclMessage.path.includes('shareBuild='));
const wclTimeline = page.onShareTimeline.call(wcl);
assert.match(wclTimeline.query, /wclContent=mythicPlus/);

const source = require('fs').readFileSync(require('path').join(__dirname, '..', 'miniprogram', 'pages', 'build', 'build.js'), 'utf8');
assert.ok(source.indexOf('if (options.shareBuild)') < source.indexOf('this.quickStart('), '分享恢复必须优先于空白草稿');
assert.match(source, /loadShareRestore/);
assert.match(source, /restoreWclPreset/);

delete global.Page;
delete global.wx;
console.log('build page sharing tests passed');
