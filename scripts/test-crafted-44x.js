const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DATA_DIR = path.join(ROOT, 'cos-upload', 'data-4.4.x');
const CLASS_KEYS = [
  'deathknight',
  'demonhunter',
  'druid',
  'evoker',
  'hunter',
  'mage',
  'monk',
  'paladin',
  'priest',
  'rogue',
  'shaman',
  'warlock',
  'warrior',
];
const SECONDARY_TYPES = new Set(['crit', 'haste', 'mastery', 'versatility']);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function readJson(name) {
  return JSON.parse(fs.readFileSync(path.join(DATA_DIR, name), 'utf8'));
}

function allItems(data) {
  return (data.instances || []).flatMap((instance) => {
    return (instance.encounters || []).flatMap((encounter) => encounter.items || []);
  });
}

try {
  assert(fs.existsSync(DATA_DIR), 'data-4.4.x 不存在。');
  const files = fs.readdirSync(DATA_DIR);
  assert(files.filter((name) => name.endsWith('.json')).length === 14, 'JSON 文件数量不是14。');
  assert(files.filter((name) => name.endsWith('.js')).length === 14, 'JS 文件数量不是14。');

  const overview = readJson('overview.json');
  assert(overview.version === '4.4.x', 'overview version 不是4.4.x。');
  assert(overview.dataVersion === '4.4.x', 'overview dataVersion 不是4.4.x。');
  assert(overview.craftedEquipment && overview.craftedEquipment.uniqueItemCount === 98, 'overview 制造业唯一物品数不是98。');

  const globalCraftedIds = new Set();
  let craftedRows = 0;
  let randomRows = 0;
  let fixedRows = 0;
  let missingCraftedInstance = [];
  let randomPollution = [];

  CLASS_KEYS.forEach((classKey) => {
    const data = readJson(`${classKey}.json`);
    assert(data.version === '4.4.x', `${classKey} version 不是4.4.x。`);
    assert(data.dataVersion === '4.4.x', `${classKey} dataVersion 不是4.4.x。`);

    const craftedInstances = (data.instances || []).filter((instance) => instance.id === 'manufacturing' || instance.type === 'crafted');
    if (craftedInstances.length !== 1) {
      missingCraftedInstance.push(`${classKey}:${craftedInstances.length}`);
    }

    allItems(data).filter((item) => item.sourceType === 'crafted').forEach((item) => {
      craftedRows += 1;
      globalCraftedIds.add(item.id);
      assert(item.source && item.source.instanceName === '制造业', `${classKey}:${item.id} 来源不是制造业。`);
      assert(item.crafting, `${classKey}:${item.id} 缺少 crafting 字段。`);
      assert(item.ilvl === 285 || item.ilvl === 295, `${classKey}:${item.id} 制造业装等异常：${item.ilvl}`);

      const randomCount = Number(item.crafting.randomAttributeCount) || 0;
      const secondary = item.stats && Array.isArray(item.stats.secondary) ? item.stats.secondary : [];
      if (randomCount > 0) {
        randomRows += 1;
        assert(item.crafting.randomAttributeSlots.length === randomCount,
          `${classKey}:${item.id} 随机属性槽数量不一致。`);
        assert(item.crafting.availableSecondaryTypes.length === 4,
          `${classKey}:${item.id} 缺少可选副属性列表。`);

        const selectableSecondaryTotal = secondary
          .filter((stat) => SECONDARY_TYPES.has(stat.type))
          .reduce((sum, stat) => sum + (Number(stat.value) || 0), 0);
        const randomSlotTotal = item.crafting.randomAttributeSlots
          .reduce((sum, slot) => sum + (Number(slot.value) || 0), 0);
        if (selectableSecondaryTotal === randomSlotTotal && randomSlotTotal > 0) {
          randomPollution.push(`${classKey}:${item.id}`);
        }
      } else {
        fixedRows += 1;
      }
    });
  });

  assert(missingCraftedInstance.length === 0, `制造业 instance 数量异常：${missingCraftedInstance.join(', ')}`);
  assert(globalCraftedIds.size === 98, `制造业唯一物品数不是98，实际${globalCraftedIds.size}。`);
  assert(craftedRows > 98, `制造业职业展开行数过少：${craftedRows}。`);
  assert(randomRows > 0, '没有检测到随机属性制造业装备。');
  assert(fixedRows > 0, '没有检测到固定绿字制造业装备。');
  assert(randomPollution.length === 0, `随机属性疑似污染 stats.secondary：${randomPollution.slice(0, 10).join(', ')}`);

  console.log(`4.4.x 制造业数据检查通过：唯一物品 ${globalCraftedIds.size}，职业展开 ${craftedRows}，随机 ${randomRows}，固定 ${fixedRows}。`);
} catch (error) {
  console.error(`检查失败：${error.message}`);
  process.exitCode = 1;
}
