const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const page = fs.readFileSync(path.join(root, 'miniprogram', 'pages', 'index', 'index.js'), 'utf8');
const template = fs.readFileSync(path.join(root, 'miniprogram', 'pages', 'index', 'index.wxml'), 'utf8');

assert.match(page, /showHomeShare:\s*false/, '首页应保存分享弹层状态。');
assert.match(page, /openHomeShare\(\)/, '首页应提供打开分享弹层的方法。');
assert.match(page, /closeHomeShare\(\)/, '首页应提供关闭分享弹层的方法。');
assert.match(page, /魔兽当前赛季：一键查毕业装备、模拟配装/, '首页默认分享标题应使用传播文案。');
assert.match(template, /分享给队友/, '首页应显示醒目的分享入口。');
assert.match(template, /一键查毕业装备、模拟配装/, '首页分享入口应强调核心功能。');
assert.match(template, /open-type="share"/, '弹层必须调用微信原生分享能力。');
assert.match(template, /data-share-kind="home"/, '弹层分享必须强制使用普通首页链接。');

console.log('home share entry tests passed');
