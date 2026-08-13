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

const requestUrls = [];
global.wx = {
  request(options) {
    requestUrls.push(options.url);
    const filename = path.basename(options.url);
    const localFile = path.join(dataDir, filename);
    options.success({ data: JSON.parse(fs.readFileSync(localFile, 'utf8')) });
  },
};
const classDataPath = path.join(root, 'miniprogram', 'utils', 'class-data.js');
delete require.cache[require.resolve(classDataPath)];
const classData = require(classDataPath);
assert.equal(classData.DATA_SOURCE, 'local-s2-crafted-preview');

Promise.all([classData.loadOverview(), classData.loadClassData('deathknight')])
  .then(([localOverview, deathknight]) => {
    assert.equal(requestUrls.length, 2, '本地预览应从本机服务读取两个数据文件。');
    assert.ok(requestUrls.every((url) => url.startsWith('http://127.0.0.1:8787/')), '本地预览不能请求 COS。');
    assert.equal(localOverview.preview.id, 's2-crafted-local-preview');
    assert.equal(deathknight.dataVersion, '12.1-s2');
    console.log('S2 local preview tests passed.');
  })
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => { delete global.wx; });
