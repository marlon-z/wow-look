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

assert.strictEqual(presets.WCL_SEASON_AVAILABLE, false, '赛季开始前必须明确关闭 WCL 数据入口。');
assert.ok(openWclStart >= 0 && openWclEnd > openWclStart, '应能找到排行榜配装打开逻辑。');
assert.ok(
  openWclPresets.indexOf('if (!WCL_SEASON_AVAILABLE)') < openWclPresets.indexOf('this.loadWclIndexForSpec'),
  '未开放时必须在请求索引前结束。'
);
assert.match(page, /wclSeasonAvailable:\s*WCL_SEASON_AVAILABLE/);
assert.match(template, /该功能暂未开放，待赛季开始后将接入。/);
assert.match(template, /wx:if="\{\{!wclSeasonAvailable\}\}"/);

console.log('WCL season unavailable tests passed.');
