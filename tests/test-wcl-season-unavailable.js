const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const presets = require('../miniprogram/utils/wcl-presets');
const page = fs.readFileSync(path.join(root, 'miniprogram', 'packages', 'rankings', 'rankings.js'), 'utf8');
const buildPage = fs.readFileSync(path.join(root, 'miniprogram', 'pages', 'build', 'build.js'), 'utf8');
assert.strictEqual(presets.WCL_SEASON_AVAILABLE, true, '第二赛季已开放 WCL 数据入口。');
assert.match(buildPage, /openWclPresets: function \(\) \{[\s\S]*packages\/rankings\/rankings/);
assert.match(page, /wclSeasonAvailable:\s*WCL_SEASON_AVAILABLE/);
assert.match(page, /loadWclPresetIndex\(classKey, specId\)/);
const fileLoaderStart = page.indexOf('loadWclPresetFile: function (fileKey, levelName) {');
const fileLoaderEnd = page.indexOf('\n  },', fileLoaderStart);
const fileLoader = page.slice(fileLoaderStart, fileLoaderEnd);
assert.match(fileLoader, /if \(!content\)/);
assert.match(fileLoader, /排行榜数据加载失败/);

console.log('WCL season unavailable tests passed.');
