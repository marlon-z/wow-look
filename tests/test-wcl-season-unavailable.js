const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const presets = require('../miniprogram/utils/wcl-presets');
const page = fs.readFileSync(path.join(root, 'miniprogram', 'pages', 'build', 'build.js'), 'utf8');
const template = fs.readFileSync(path.join(root, 'miniprogram', 'pages', 'build', 'build.wxml'), 'utf8');
const openWclStart = page.indexOf('openWclPresets: function () {');
const openWclEnd = page.indexOf('\n  },', openWclStart);
const openWclPresets = page.slice(openWclStart, openWclEnd);

assert.strictEqual(presets.WCL_SEASON_AVAILABLE, true, '第二赛季已开放 WCL 数据入口。');
assert.ok(openWclStart >= 0 && openWclEnd > openWclStart, '应能找到排行榜配装打开逻辑。');
assert.ok(
  openWclPresets.indexOf('this.loadWclIndexForSpec') >= 0,
  '开放后必须请求当前专精的排行榜索引。'
);
assert.match(page, /wclSeasonAvailable:\s*WCL_SEASON_AVAILABLE/);
const fileLoaderStart = page.indexOf('loadWclPresetFile: function (fileKey, levelName) {');
const fileLoaderEnd = page.indexOf('\n  },', fileLoaderStart);
const fileLoader = page.slice(fileLoaderStart, fileLoaderEnd);
assert.match(fileLoader, /if \(!content\)/);
assert.match(fileLoader, /预设文件加载失败/);

console.log('WCL season unavailable tests passed.');
