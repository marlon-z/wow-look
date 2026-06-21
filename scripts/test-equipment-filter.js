const fs = require('fs');
const path = require('path');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const requestedDir = process.argv[2] || 'cos-upload/data-4.3.x';
const dataDir = path.resolve(process.cwd(), requestedDir);
const files = fs.readdirSync(dataDir)
  .filter((name) => name.endsWith('.json') && name !== 'overview.json');

try {
  assert(files.length === 13, `职业数据文件不是13个，实际${files.length}。`);
  const invalidOrdinary = [];
  const tierItems = [];

  files.forEach((file) => {
    const data = JSON.parse(fs.readFileSync(path.join(dataDir, file), 'utf8'));
    const classTierItems = [];
    (data.instances || []).forEach((instance) => {
      (instance.encounters || []).forEach((encounter) => {
        (encounter.items || []).forEach((item) => {
          if (item.sourceType === 'tier') {
            classTierItems.push(item);
            tierItems.push(item);
            return;
          }
          if (item.slot === 'unknown' || !['护甲', '武器'].includes(item.itemType)) {
            invalidOrdinary.push({ file, id: item.id, name: item.name, slot: item.slot, itemType: item.itemType });
          }
        });
      });
    });
    assert(classTierItems.length === 9, `${file} 可装备套装配套物品不是9件，实际${classTierItems.length}。`);
  });

  assert(invalidOrdinary.length === 0,
    `仍有${invalidOrdinary.length}条非装备记录：${invalidOrdinary.slice(0, 10).map((item) => `${item.id}:${item.name}`).join(', ')}`);
  assert(tierItems.length === 117, `套装可装备物品总数不是117，实际${tierItems.length}。`);
  assert(tierItems.filter((item) => item.isBonusPiece === true && item.collectionKind === 'bonus').length === 65,
    '核心套装数量不是65。');
  assert(tierItems.filter((item) => item.isBonusPiece === false && item.collectionKind === 'appearance').length === 52,
    '可装备配套件数量不是52。');
  const invalidTier = tierItems.filter((item) => item.ilvl !== 289
    || item.slot === 'unknown');
  assert(invalidTier.length === 0, `仍有${invalidTier.length}件无效套装记录。`);

  console.log('装备过滤检查通过：无非装备掉落，117件可装备套装物品全部保留。');
} catch (error) {
  console.error(`检查失败：${error.message}`);
  process.exitCode = 1;
}
