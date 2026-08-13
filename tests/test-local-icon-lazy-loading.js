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
  assert.doesNotMatch(tag, /\bwebp=/, `${file} 的本地图标不得声明 WebP 解码属性。`);
  assert.match(tag, /\blazy-load="\{\{true\}\}"/, `${file} 的装备图片必须启用原生懒加载。`);
});

const equipmentTemplate = fs.readFileSync(path.join(root, 'miniprogram/pages/equipment/equipment.wxml'), 'utf8');
assert.match(equipmentTemplate, /wx:for="\{\{groupedItems\}\}" wx:key="key"/, '装备分组必须使用稳定 key。');
assert.match(equipmentTemplate, /已显示 \{\{item\.items\.length\}\} \/ 共 \{\{item\.totalCount\}\} 件/, '装备分组必须显示已加载与总数量。');
assert.match(equipmentTemplate, /正在加载更多装备/, '装备页必须显示加载更多状态。');
assert.match(equipmentTemplate, /继续向下滑动，加载更多装备/, '装备页必须提示继续滑动加载。');
assert.match(equipmentTemplate, /已加载全部 \{\{loadedResultCount\}\} 件装备/, '装备页必须显示全部加载完成状态。');
const queryImage = equipmentTemplate.match(/<image\b[^>]*class="item-icon-img"[^>]*>/)?.[0] || '';
assert.match(queryImage, /binderror="onIconImageError"/, '装备查询图标必须记录真机加载错误。');
assert.match(queryImage, /data-item-id="\{\{equip\.id\}\}"/, '装备查询图标错误日志必须携带装备 ID。');

console.log(`local equipment icon lazy-loading tests passed (${iconImages.length} images)`);
