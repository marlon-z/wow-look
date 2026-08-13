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
['.home-logo-4b', '.home-logo-4b-badge', '.home-logo-4b-title', '.home-logo-4b-gold', '.home-logo-4b-subtitle'].forEach((selector) => {
  assert.ok(wxss.includes(selector), `首页必须定义 ${selector} 样式。`);
});
assert.match(wxml, /home-logo-4b-(?:copper|silver)/, '首页 Logo 必须保留双色题字的第二个字面。');
assert.match(wxss, /\.home-logo-4b-(?:copper|silver)/, '首页必须定义第二个字面的样式。');
assert.ok(!/home-logo-4b[^}]*url\(/s.test(wxss), '首页原生 Logo 不得依赖图片或外部资源。');
const homeLogoRule = wxss.match(/\.home-logo-4b\s*\{([\s\S]*?)\n\}/);
assert.ok(homeLogoRule, '首页必须定义原生 Logo 容器样式。');
assert.ok(!/\bborder(?:-\w+)?\s*:/.test(homeLogoRule[1]), '首页 Logo 容器不得显示边框。');

console.log('home native logo tests passed');
