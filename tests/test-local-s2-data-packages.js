const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const sourceRoot = path.join(root, 'cos-upload', 'data-12.1-s2-crafted-preview');
const packageRoot = path.join(root, 'miniprogram', 'packages');
const classes = [
  'warrior', 'paladin', 'hunter', 'rogue', 'priest', 'deathknight', 'shaman',
  'mage', 'warlock', 'monk', 'druid', 'demonhunter', 'evoker',
];
const PACKAGE_LIMIT = 2 * 1024 * 1024;
const MAIN_ASSET_LIMIT = 1200 * 1024;

function flattenItems(instances) {
  return (instances || []).flatMap((instance) => (instance.encounters || []).flatMap((encounter) => encounter.items || []));
}

function packageSize(directory) {
  return fs.readdirSync(directory, { recursive: true })
    .map((relativePath) => path.join(directory, relativePath))
    .filter((filePath) => fs.statSync(filePath).isFile())
    .reduce((total, filePath) => total + fs.statSync(filePath).size, 0);
}

classes.forEach((classKey) => {
  const source = JSON.parse(fs.readFileSync(path.join(sourceRoot, `${classKey}.json`), 'utf8'));
  const localPath = path.join(packageRoot, `class-${classKey}`, 'data', `${classKey}.js`);
  assert.ok(fs.existsSync(localPath), `${classKey} 必须生成本地职业数据包。`);
  const local = require(localPath);

  assert.deepStrictEqual(local.class, source.class, `${classKey} 职业信息必须保持一致。`);
  assert.deepStrictEqual(local.specs, source.specs, `${classKey} 专精信息必须保持一致。`);
  assert.deepStrictEqual(local.maximumProfile, source.maximumProfile, `${classKey} 最高装等规则必须保持一致。`);

  const sourceItems = flattenItems(source.instances);
  const localItems = flattenItems(local.instances);
  assert.strictEqual(localItems.length, sourceItems.length, `${classKey} 装备记录数量不得变化。`);
  sourceItems.forEach((sourceItem, index) => {
    const localItem = localItems[index];
    ['id', 'name', 'ilvl', 'slot', 'stats', 'source', 'link', 'crafting'].forEach((field) => {
      assert.deepStrictEqual(localItem[field], sourceItem[field], `${classKey} 装备 ${sourceItem.id} 的 ${field} 必须保持一致。`);
    });
    assert.strictEqual(localItem.tooltipRaw, undefined, '不应将原始提示文本打进小程序。');
    assert.strictEqual(localItem.dropVersion, undefined, '不应将升级前采集快照打进小程序。');
    assert.strictEqual(localItem.captureStatus, undefined, '不应将采集审计状态打进小程序。');
    assert.ok(localItem.iconAsset && localItem.iconAsset.indexOf('/assets/icons/') === 0, '图标应指向主包本地资源。');
    assert.ok(fs.existsSync(path.join(root, 'miniprogram', localItem.iconAsset.replace(/^\//, ''))), '每个装备图标必须在本地存在。');
  });

  const directory = path.join(packageRoot, `class-${classKey}`);
  assert.ok(packageSize(directory) < PACKAGE_LIMIT, `${classKey} 分包不得超过 2 MiB。`);
  const loader = fs.readFileSync(path.join(directory, 'pages', 'loader', 'loader.js'), 'utf8');
  assert.match(loader, new RegExp(`require\\('../../data/${classKey}'\\)`), '分包必须有静态依赖锚点，防止构建时裁掉数据。');
});

const overviewPath = path.join(root, 'miniprogram', 'local-data', 'overview.js');
assert.ok(fs.existsSync(overviewPath), '主包必须包含本地总览。');
const overview = require(overviewPath);
assert.strictEqual(overview.dataVersion, '12.1-s2');
assert.strictEqual(overview.releaseStatus, 'finalized');

const mainAssetRoot = path.join(root, 'miniprogram', 'assets');
const mainAssetSize = packageSize(mainAssetRoot);
assert.ok(mainAssetSize < MAIN_ASSET_LIMIT, '主包本地资源必须保留足够的 2 MiB 代码空间。');
classes.forEach((classKey) => {
  const assetCode = require(path.join(root, 'miniprogram', 'utils', 'class-data.js')).getClassMeta(classKey).assetCode;
  assert.ok(fs.existsSync(path.join(mainAssetRoot, 'classes', 'banner', `${assetCode}.jpg`)), `${classKey} 横幅必须本地存在。`);
  assert.ok(fs.existsSync(path.join(mainAssetRoot, 'classes', 'emblem', `${assetCode}.png`)), `${classKey} 徽记必须本地存在。`);
});

console.log('local S2 data package tests passed');
