const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const appJson = JSON.parse(fs.readFileSync(path.join(root, 'miniprogram', 'app.json'), 'utf8'));
const previewPackage = (appJson.subPackages || []).find((subpackage) => subpackage.root === 'packages/logo-preview');

assert.deepStrictEqual(previewPackage, {
  root: 'packages/logo-preview',
  name: 'logo-preview',
  pages: ['pages/logo-preview/logo-preview'],
}, '必须精确注册独立 Logo 预览分包。');

const pageRoot = path.join(root, 'miniprogram', 'packages', 'logo-preview', 'pages', 'logo-preview');
const wxml = fs.readFileSync(path.join(pageRoot, 'logo-preview.wxml'), 'utf8');
const wxss = fs.readFileSync(path.join(pageRoot, 'logo-preview.wxss'), 'utf8');
const js = fs.readFileSync(path.join(pageRoot, 'logo-preview.js'), 'utf8');

['锻造铭牌', '简洁工具', '符文印记', '艾泽配装', '当前赛季毕业装速查'].forEach((text) => {
  assert.ok(wxml.includes(text), `预览页必须展示“${text}”。`);
});

const allowedTags = new Set(['page-meta', 'view', 'text', 'button']);
const tags = [...wxml.matchAll(/<\/?([a-z-]+)(?:\s[^>]*)?\/?\s*>/g)].map((match) => match[1]);
tags.forEach((tag) => assert.ok(allowedTags.has(tag), `WXML 不得使用 ${tag} 标签。`));
['<image', 'src=', 'canvas', '<svg', 'http://', 'https://'].forEach((forbidden) => {
  assert.ok(!wxml.toLowerCase().includes(forbidden), `WXML 不得包含 ${forbidden}。`);
});
['@font-face', 'url(', 'filter:'].forEach((forbidden) => {
  assert.ok(!wxss.toLowerCase().includes(forbidden), `WXSS 不得包含 ${forbidden}。`);
});
['getCurrentPages', 'wx.navigateBack', 'wx.reLaunch'].forEach((required) => {
  assert.ok(js.includes(required), `导航逻辑必须包含 ${required}。`);
});
[
  'wx.getStorage', 'wx.getStorageSync', 'wx.setStorage', 'wx.setStorageSync',
  'wx.removeStorage', 'wx.removeStorageSync', 'wx.request', 'wx.downloadFile',
  'wx.uploadFile', 'wx.loadFontFace',
].forEach((forbidden) => {
  assert.ok(!js.includes(forbidden), `预览页不得调用 ${forbidden}。`);
});

console.log('native logo preview tests passed');
