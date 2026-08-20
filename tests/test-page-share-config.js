const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const pageKeys = ['index', 'browse', 'equipment', 'build'];

pageKeys.forEach((pageKey) => {
  const configPath = path.join(root, 'miniprogram', 'pages', pageKey, `${pageKey}.json`);
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  assert.strictEqual(config.enableShareAppMessage, true, `${pageKey} 页应开启好友分享。`);
  assert.strictEqual(config.enableShareTimeline, true, `${pageKey} 页应开启朋友圈分享。`);
});

const browsePage = fs.readFileSync(
  path.join(root, 'miniprogram', 'pages', 'browse', 'browse.js'),
  'utf8',
);
assert.match(browsePage, /onShareAppMessage\(\)/, '查装备页应提供好友分享处理函数。');
assert.match(browsePage, /path:\s*'\/pages\/browse\/browse'/, '查装备页应分享回自身入口。');
assert.match(browsePage, /onShareTimeline\(\)/, '查装备页应提供朋友圈分享处理函数。');

console.log('page share configuration tests passed');
