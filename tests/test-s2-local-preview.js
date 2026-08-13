const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const dataDir = path.join(root, 'cos-upload', 'data-12.1-s2-crafted-preview');
const localDataDir = path.join(root, 'miniprogram', 'local-data', 's2-crafted-preview');
const classKeys = [
  'warrior', 'paladin', 'hunter', 'rogue', 'priest', 'deathknight', 'shaman',
  'mage', 'warlock', 'monk', 'druid', 'demonhunter', 'evoker',
];

assert.ok(fs.existsSync(path.join(dataDir, 'overview.json')), '缺少本地 S2 预览 overview。');
assert.ok(fs.existsSync(path.join(dataDir, 'crafting-candidates.json')), '缺少制造候选目录。');
assert.ok(fs.existsSync(path.join(localDataDir, 'index.js')), '缺少小程序本地数据模块。');

const overview = JSON.parse(fs.readFileSync(path.join(dataDir, 'overview.json'), 'utf8'));
const catalog = JSON.parse(fs.readFileSync(path.join(dataDir, 'crafting-candidates.json'), 'utf8'));
assert.equal(overview.dataVersion, '12.1-s2');
assert.equal(overview.preview.localOnly, true);
assert.equal(overview.preview.uploadApproved, false);
assert.equal(overview.craftedEquipment.catalogStatus, 'candidate_catalog_only');
assert.equal(catalog.candidateCount, 237);
assert.equal(catalog.candidates.length, 237);
assert.equal(catalog.verifiedMaximumCount, 0);
assert.ok(catalog.candidates.every((item) => item.recipeId > 0 && item.itemId > 0));

classKeys.forEach((key) => {
  const data = JSON.parse(fs.readFileSync(path.join(dataDir, `${key}.json`), 'utf8'));
  const items = (data.instances || []).flatMap((instance) => (instance.encounters || []).flatMap((encounter) => encounter.items || []));
  assert.equal(items.filter((item) => item.sourceType === 'crafted').length, 0, `${key} 不应显示未验证制造装备。`);
  assert.equal(items.filter((item) => item.sourceType === 'tier').length, 9, `${key} 应保留 9 件 S2 套装。`);
});

let requestCount = 0;
global.wx = { request() { requestCount += 1; } };
const classDataPath = path.join(root, 'miniprogram', 'utils', 'class-data.js');
delete require.cache[require.resolve(classDataPath)];
const classData = require(classDataPath);
assert.equal(classData.DATA_SOURCE, 'local-s2-crafted-preview');

Promise.all([classData.loadOverview(), classData.loadClassData('deathknight')])
  .then(([localOverview, deathknight]) => {
    assert.equal(requestCount, 0, '本地预览不能请求 COS。');
    assert.equal(localOverview.preview.id, 's2-crafted-local-preview');
    assert.equal(deathknight.dataVersion, '12.1-s2');
    console.log('S2 local preview tests passed.');
  })
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => { delete global.wx; });
