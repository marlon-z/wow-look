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

const variants = [
  ['方案二A · 鎏金硬朗', 'logo-preview-metal-hard'],
  ['方案二B · 浮雕高光', 'logo-preview-metal-glow'],
  ['方案二C · 铭刻深影', 'logo-preview-metal-etched'],
];

variants.forEach(([name, rootClass]) => {
  assert.ok(wxml.includes(name), `预览页必须展示“${name}”。`);
  assert.ok(wxml.includes(rootClass), `预览页必须包含 ${rootClass} 变体根节点。`);
});
['艾泽配装', '当前赛季毕业装速查'].forEach((text) => {
  assert.ok(wxml.includes(text), `预览页必须展示“${text}”。`);
});

const cardClasses = [...wxml.matchAll(/<view\s+class="([^"]*\blogo-preview-card\b[^"]*)"/g)]
  .map((match) => match[1].trim().split(/\s+/));
assert.strictEqual(cardClasses.length, 3, '预览页必须恰好包含三张方案二文字质感变体卡。');
const variantRoots = variants.map(([, rootClass]) => rootClass);
const cardVariantRoots = cardClasses.map((classes) => classes.filter((className) => variantRoots.includes(className)));
cardVariantRoots.forEach((roots) => {
  assert.strictEqual(roots.length, 1, '每张方案卡必须只包含一个固定变体根节点。');
});
variantRoots.forEach((rootClass) => {
  assert.strictEqual(
    cardVariantRoots.filter((roots) => roots.includes(rootClass)).length,
    1,
    `${rootClass} 必须恰好出现在一张方案卡上。`,
  );
});
['双刃徽记', '王冠铭牌', '圣殿印章', '徽章侧标', '双线字标', '分栏刻印', 'logo-preview-blade', 'logo-preview-rune-'].forEach((legacy) => {
  assert.ok(!wxml.includes(legacy), `预览页不得保留旧方案元素：${legacy}`);
  assert.ok(!wxss.includes(legacy), `WXSS 不得保留旧方案选择器：${legacy}`);
});
assert.strictEqual((wxml.match(/logo-preview-title-face/g) || []).length, 3, '每个变体必须有一层浅金高光字面。');
assert.strictEqual((wxml.match(/logo-preview-title-mid/g) || []).length, 3, '每个变体必须有一层深金过渡字面。');
assert.strictEqual((wxml.match(/logo-preview-title-depth/g) || []).length, 3, '每个变体必须有一层深褐立体字面。');

const allowedTags = new Set(['page-meta', 'view', 'text', 'button']);
const tags = [...wxml.matchAll(/<\/?([a-z-]+)(?:\s[^>]*)?\/?\s*>/g)].map((match) => match[1]);
tags.forEach((tag) => assert.ok(allowedTags.has(tag), `WXML 不得使用 ${tag} 标签。`));
['<image', 'src=', 'canvas', '<svg', 'http://', 'https://'].forEach((forbidden) => {
  assert.ok(!wxml.toLowerCase().includes(forbidden), `WXML 不得包含 ${forbidden}。`);
});
['@font-face', 'url(', 'filter:'].forEach((forbidden) => {
  assert.ok(!wxss.toLowerCase().includes(forbidden), `WXSS 不得包含 ${forbidden}。`);
});
assert.ok(!/\bvar\s*\(/i.test(wxss), 'WXSS 不得通过 var() 引用外部颜色变量。');

const allowedHexColors = new Set([
  '#09080d', '#171015', '#20160d', '#2d180b', '#3b2614', '#5d421b', '#7a4d18',
  '#9a6a24', '#b18331', '#be913b', '#c59b46', '#c79a3c', '#d4a744', '#d8ac52',
  '#d9a944', '#e4bd63', '#e7bd58', '#ebc662', '#f2d795', '#f5cc6a', '#f7e8bd',
  '#fff0c9', '#000000',
]);
const allowedRgbTriplets = new Set([...allowedHexColors].map((hex) => {
  const value = Number.parseInt(hex.slice(1), 16);
  return `${(value >> 16) & 0xff},${(value >> 8) & 0xff},${value & 0xff}`;
}));
const sixDigitHexColors = [...wxss.matchAll(/#[0-9a-fA-F]{6}\b/g)].map((match) => match[0].toLowerCase());
sixDigitHexColors.forEach((hex) => {
  assert.ok(allowedHexColors.has(hex), `WXSS 色值 ${hex} 不在允许的暖色调色板中。`);
});
assert.ok(!/#[0-9a-fA-F]{3,5}\b|#[0-9a-fA-F]{7,}\b/.test(wxss), 'WXSS 不得使用非六位十六进制色值。');
const rgbaOpenings = [...wxss.matchAll(/\brgba\s*\(/gi)];
const rgbaCalls = [...wxss.matchAll(/\brgba\s*\([^)]*\)/gi)];
assert.strictEqual(rgbaCalls.length, rgbaOpenings.length, '每个 rgba( 都必须有完整的右括号。');
const rgbaSyntax = /^rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*((?:\d+(?:\.\d+)?|\.\d+))\s*\)$/i;
rgbaCalls.forEach((match) => {
  const parsed = match[0].match(rgbaSyntax);
  assert.ok(parsed, `rgba 必须使用 rgba(r,g,b,a) 数字逗号语法：${match[0]}`);
  const rgb = `${parsed[1]},${parsed[2]},${parsed[3]}`;
  const alpha = Number(parsed[4]);
  assert.ok(allowedRgbTriplets.has(rgb), `WXSS rgba 色值 ${match[0]} 不在允许的暖色调色板中。`);
  assert.ok(Number.isFinite(alpha) && alpha >= 0 && alpha <= 1, `rgba 透明度必须在 [0, 1]：${match[0]}`);
});
assert.ok(!/\brgb\(/i.test(wxss), 'WXSS 不得使用 rgb()。');
assert.ok(!/\bhsla?\(/i.test(wxss), 'WXSS 不得使用 HSL 色值。');
assert.ok(
  !/\b(?:hwb|lab|lch|oklab|oklch|color|color-mix)\(/i.test(wxss),
  'WXSS 不得使用未批准的颜色函数。',
);
const disallowedNamedColors = new Set([
  'aliceblue', 'antiquewhite', 'aqua', 'aquamarine', 'azure', 'beige', 'bisque',
  'black', 'blanchedalmond', 'blue', 'blueviolet', 'brown', 'burlywood', 'cadetblue',
  'chartreuse', 'chocolate', 'coral', 'cornflowerblue', 'cornsilk', 'crimson', 'cyan',
  'darkblue', 'darkcyan', 'darkgoldenrod', 'darkgray', 'darkgreen', 'darkgrey', 'darkkhaki',
  'darkmagenta', 'darkolivegreen', 'darkorange', 'darkorchid', 'darkred', 'darksalmon',
  'darkseagreen', 'darkslateblue', 'darkslategray', 'darkslategrey', 'darkturquoise',
  'darkviolet', 'deeppink', 'deepskyblue', 'dimgray', 'dimgrey', 'dodgerblue', 'firebrick',
  'floralwhite', 'forestgreen', 'fuchsia', 'gainsboro', 'ghostwhite', 'gold', 'goldenrod',
  'gray', 'green', 'greenyellow', 'grey', 'honeydew', 'hotpink', 'indianred', 'indigo',
  'ivory', 'khaki', 'lavender', 'lavenderblush', 'lawngreen', 'lemonchiffon', 'lightblue',
  'lightcoral', 'lightcyan', 'lightgoldenrodyellow', 'lightgray', 'lightgreen', 'lightgrey',
  'lightpink', 'lightsalmon', 'lightseagreen', 'lightskyblue', 'lightslategray',
  'lightslategrey', 'lightsteelblue', 'lightyellow', 'lime', 'limegreen', 'linen', 'magenta',
  'maroon', 'mediumaquamarine', 'mediumblue', 'mediumorchid', 'mediumpurple', 'mediumseagreen',
  'mediumslateblue', 'mediumspringgreen', 'mediumturquoise', 'mediumvioletred', 'midnightblue',
  'mintcream', 'mistyrose', 'moccasin', 'navajowhite', 'navy', 'oldlace', 'olive', 'olivedrab',
  'orange', 'orangered', 'orchid', 'palegoldenrod', 'palegreen', 'paleturquoise',
  'palevioletred', 'papayawhip', 'peachpuff', 'peru', 'pink', 'plum', 'powderblue', 'purple',
  'rebeccapurple', 'red', 'rosybrown', 'royalblue', 'saddlebrown', 'salmon', 'sandybrown',
  'seagreen', 'seashell', 'sienna', 'silver', 'skyblue', 'slateblue', 'slategray', 'slategrey',
  'snow', 'springgreen', 'steelblue', 'tan', 'teal', 'thistle', 'tomato', 'turquoise', 'violet',
  'wheat', 'white', 'whitesmoke', 'yellow', 'yellowgreen', 'currentcolor', 'accentcolor',
  'accentcolortext', 'activetext', 'buttonborder', 'buttonface', 'buttontext', 'canvas',
  'canvastext', 'field', 'fieldtext', 'graytext', 'highlight', 'highlighttext', 'linktext',
  'mark', 'marktext', 'selecteditem', 'selecteditemtext', 'visitedtext',
]);
const namedColorPattern = new RegExp(`\\b(?:${[...disallowedNamedColors].join('|')})\\b`, 'i');
const colorFunctionProperties = /^(?:color|background(?:-(?:color|image))?|border(?:-[a-z-]+)?|outline(?:-color)?|box-shadow|text-shadow|fill|stroke)$/;
const wxssDeclarations = [...wxss.matchAll(/(?:^|[;{])\s*([a-z-]+)\s*:\s*([^;{}]+?)\s*(?=;|\})/gm)];
const wxssDeclarationValues = wxssDeclarations.map((match) => match[2]).join('\n');
assert.ok(!namedColorPattern.test(wxssDeclarationValues), 'WXSS 不得使用 CSS 命名颜色；仅 transparent 可用。');
wxssDeclarations.forEach((match) => {
  const property = match[1].toLowerCase();
  if (!colorFunctionProperties.test(property)) return;

  const functionCalls = [...match[2].matchAll(/\b([a-z-]+)\s*\(/gi)];
  functionCalls.forEach((functionMatch) => {
    const functionName = functionMatch[1].toLowerCase();
    assert.ok(
      ['linear-gradient', 'rgba'].includes(functionName),
      `${property} 声明只允许 linear-gradient() 或已严格验证的 rgba()：${functionMatch[0]}`,
    );
  });
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
