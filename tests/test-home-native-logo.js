const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const wxml = fs.readFileSync(path.join(root, 'miniprogram', 'pages', 'index', 'index.wxml'), 'utf8');
const wxss = fs.readFileSync(path.join(root, 'miniprogram', 'pages', 'index', 'index.wxss'), 'utf8');

assert.ok(!wxml.includes('class="logo-img"'), '首页不应继续渲染旧 PNG Logo。');
['home-logo-4b', 'AZEROTH COMPASS', '艾泽', '配装', '全职业 · 模拟配装 · 来源速查'].forEach((text) => {
  assert.ok(wxml.includes(text), `首页原生 Logo 必须包含 ${text}。`);
});
['.home-logo-4b', '.home-logo-4b-badge', '.home-logo-4b-title', '.home-logo-4b-copper', '.home-logo-4b-subtitle'].forEach((selector) => {
  assert.ok(wxss.includes(selector), `首页必须定义 ${selector} 样式。`);
});
assert.ok(!/home-logo-4b[^}]*url\(/s.test(wxss), '首页原生 Logo 不得依赖图片或外部资源。');

console.log('home native logo tests passed');
