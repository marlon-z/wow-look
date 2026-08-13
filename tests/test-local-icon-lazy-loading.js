const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const templates = [
  { file: 'miniprogram/pages/index/index.wxml', expectedIconCount: 1 },
  { file: 'miniprogram/pages/equipment/equipment.wxml', expectedIconCount: 3 },
  { file: 'miniprogram/pages/build/build.wxml', expectedIconCount: 3 },
  { file: 'miniprogram/components/favorite-panel/favorite-panel.wxml', expectedIconCount: 1 },
  { file: 'miniprogram/components/equipment-detail/equipment-detail.wxml', expectedIconCount: 1 },
];

const iconImages = templates.flatMap(({ file, expectedIconCount }) => {
  const source = fs.readFileSync(path.join(root, file), 'utf8');
  const matches = source.match(/<image\b[^>]*\biconAsset\b[^>]*>/g) || [];
  assert.strictEqual(matches.length, expectedIconCount, `${file} 必须包含 ${expectedIconCount} 个使用 iconAsset 的图片标签。`);
  return matches.map((tag) => ({ file, tag }));
});

assert.strictEqual(iconImages.length, 9, '必须恰好有 9 个使用 iconAsset 的装备图片标签。');
iconImages.forEach(({ file, tag }) => {
  assert.match(tag, /\bwebp="\{\{true\}\}"/, `${file} 的装备图片必须启用 WebP。`);
  assert.match(tag, /\blazy-load="\{\{true\}\}"/, `${file} 的装备图片必须启用原生懒加载。`);
});

console.log(`local equipment icon lazy-loading tests passed (${iconImages.length} images)`);
