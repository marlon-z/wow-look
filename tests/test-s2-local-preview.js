const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const dataDir = path.join(root, 'cos-upload', 'data-12.1-s2-crafted-preview');
const classKeys = [
  'warrior', 'paladin', 'hunter', 'rogue', 'priest', 'deathknight', 'shaman',
  'mage', 'warlock', 'monk', 'druid', 'demonhunter', 'evoker',
];

assert.ok(fs.existsSync(path.join(dataDir, 'overview.json')), '缺少本地 S2 预览 overview。');
assert.ok(fs.existsSync(path.join(dataDir, 'crafting-candidates.json')), '缺少制造候选目录。');

const overview = JSON.parse(fs.readFileSync(path.join(dataDir, 'overview.json'), 'utf8'));
const catalog = JSON.parse(fs.readFileSync(path.join(dataDir, 'crafting-candidates.json'), 'utf8'));
assert.equal(overview.dataVersion, '12.1-s2');
assert.equal(overview.preview.localOnly, true);
assert.equal(overview.preview.uploadApproved, false);
assert.equal(overview.craftedEquipment.catalogStatus, 'tooltip_verified_s2_myth_quality_5');
assert.equal(overview.craftedEquipment.targetItemLevel, 331);
assert.equal(overview.craftedEquipment.verifiedMaximumCount, 98);
assert.equal(overview.craftedEquipment.visibleItemCount, 98);
assert.equal(catalog.candidateCount, 237);
assert.equal(catalog.candidates.length, 237);
assert.equal(catalog.verifiedMaximumCount, 0);
assert.ok(catalog.candidates.every((item) => item.recipeId > 0 && item.itemId > 0));

classKeys.forEach((key) => {
  const data = JSON.parse(fs.readFileSync(path.join(dataDir, `${key}.json`), 'utf8'));
  const items = (data.instances || []).flatMap((instance) => (instance.encounters || []).flatMap((encounter) => encounter.items || []));
  const craftedItems = items.filter((item) => item.sourceType === 'crafted');
  assert.ok(craftedItems.length > 0, `${key} 应显示本职业可用的 S2 制造装备。`);
  craftedItems.forEach((item) => {
    assert.equal(item.ilvl, 331, `${key} 的制造装备必须为 S2 Myth 最高装等。`);
    assert.equal(item.crafting.targetItemLevel, 331);
    assert.ok(Array.isArray(item.crafting.randomAttributeSlots));
    assert.ok(item.iconAsset, '制造业装备应具有本地可访问的图标。');
    assert.ok(item.stats.secondary.every((stat) => !stat.craftedRandom), '随机属性不能写入固定副属性。');
  });
  items.forEach((item) => {
    assert.ok(item.iconAsset, `${key} 的 ${item.name} 缺少图标资产。`);
    assert.ok(
      fs.existsSync(path.join(root, 'cos-upload', item.iconAsset.replace(/^\//, ''))),
      `${key} 的 ${item.name} 图标文件不存在。`,
    );
  });
  assert.equal(items.filter((item) => item.sourceType === 'tier').length, 9, `${key} 应保留 9 件 S2 套装。`);
});

const paladin = JSON.parse(fs.readFileSync(path.join(dataDir, 'paladin.json'), 'utf8'));
const paladinCrafted = paladin.instances.find((instance) => instance.id === 'manufacturing').encounters[0].items;
const paladinShelters = paladinCrafted.filter((item) => item.id === 237829);
assert.deepEqual(paladinShelters.map((item) => item.specs.join(',')).sort(), ['65', '66,70']);
assert.deepEqual(
  paladinShelters.find((item) => item.specs.includes(65)).stats.primaryStats,
  [{ type: 'intellect', name: '智力', value: 183 }],
);
assert.deepEqual(
  paladinShelters.find((item) => item.specs.includes(66)).stats.primaryStats,
  [{ type: 'strength', name: '力量', value: 183 }],
);

assert.ok(
  fs.existsSync(path.join(dataDir, 'crafted-equipment.json')),
  'S2 最高品质制造业档案缺失。',
);
const craftedArchive = JSON.parse(fs.readFileSync(path.join(dataDir, 'crafted-equipment.json'), 'utf8'));
assert.equal(craftedArchive.recordCount, 98);
assert.equal(craftedArchive.targetItemLevel, 331);

const classDataPath = path.join(root, 'miniprogram', 'utils', 'class-data.js');
delete require.cache[require.resolve(classDataPath)];
const classData = require(classDataPath);
assert.equal(classData.DATA_SOURCE, 'local-package');

Promise.resolve(classData.loadOverview())
  .then((localOverview) => {
    const deathknight = require(path.join(root, 'miniprogram', 'packages', 'class-deathknight', 'data', 'deathknight.js'));
    assert.equal(typeof global.wx, 'undefined', '纯本地预览不得依赖网络 API。');
    assert.equal(localOverview.preview.id, 's2-crafted-local-preview');
    assert.equal(deathknight.dataVersion, '12.1-s2');
    console.log('S2 local preview tests passed.');
  })
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
