const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DEFAULT_DATA_DIR = path.join(ROOT, 'cos-upload', 'data-12.1-s2-crafted-preview');
const CLASS_KEYS = [
  'warrior', 'paladin', 'hunter', 'rogue', 'priest', 'deathknight', 'shaman',
  'mage', 'warlock', 'monk', 'druid', 'demonhunter', 'evoker',
];
const APPEARANCE_UNLOCK_ITEM_IDS = Object.freeze([258045, 275937, 281227]);
const APPEARANCE_UNLOCK_EFFECT = /将此(?:装备)?外观添加到你的战团收藏中。?/;

function countItems(instances = []) {
  return instances.reduce((total, instance) => total + (instance.encounters || []).reduce(
    (encounterTotal, encounter) => encounterTotal + (encounter.items || []).length,
    0
  ), 0);
}

function getUseEffects(item = {}) {
  const values = [];
  const append = (list) => {
    (list || []).forEach((value) => {
      if (typeof value === 'string') values.push(value);
    });
  };
  append(item.stats?.effects?.use);
  append(item.maxVersion?.effects?.use);
  append(item.maxVersion?.tooltip?.parsed?.useEffects);
  append(item.tooltip?.parsed?.useEffects);
  return values;
}

function isAppearanceUnlockItem(item = {}) {
  return getUseEffects(item).some((effect) => APPEARANCE_UNLOCK_EFFECT.test(effect));
}

function filterAppearanceUnlockItems(source = {}) {
  const excludedItemIds = new Set();
  const instances = (source.instances || []).map((instance) => ({
    ...instance,
    encounters: (instance.encounters || []).map((encounter) => ({
      ...encounter,
      items: (encounter.items || []).filter((item) => {
        if (!isAppearanceUnlockItem(item)) return true;
        excludedItemIds.add(Number(item.id));
        return false;
      }),
    })),
  }));
  const actualItemCount = countItems(instances);
  const data = {
    ...source,
    meta: {
      ...(source.meta || {}),
      itemCount: actualItemCount,
    },
    instances,
  };
  return {
    data,
    excludedItemIds: [...excludedItemIds].sort((left, right) => left - right),
    excludedRecordCount: countItems(source.instances) - actualItemCount,
  };
}

function sanitizeDirectory(dataDir = DEFAULT_DATA_DIR, { write = false } = {}) {
  const reports = [];
  CLASS_KEYS.forEach((classKey) => {
    const filePath = path.join(dataDir, `${classKey}.json`);
    const source = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const result = filterAppearanceUnlockItems(source);
    if (write && result.excludedRecordCount > 0) {
      fs.writeFileSync(filePath, `${JSON.stringify(result.data, null, 2)}\n`, 'utf8');
    }
    reports.push({ classKey, ...result });
  });
  const excludedItemIds = [...new Set(reports.flatMap((report) => report.excludedItemIds))]
    .sort((left, right) => left - right);
  return {
    reports,
    excludedItemIds,
    excludedRecordCount: reports.reduce((total, report) => total + report.excludedRecordCount, 0),
  };
}

if (require.main === module) {
  const write = process.argv.includes('--write');
  const requestedDir = process.argv.find((arg) => arg.startsWith('--dir='));
  const dataDir = requestedDir
    ? path.resolve(process.cwd(), requestedDir.slice('--dir='.length))
    : DEFAULT_DATA_DIR;
  const result = sanitizeDirectory(dataDir, { write });
  console.log(`${write ? '已清理' : '预览'} ${result.excludedRecordCount} 条外观解锁记录；ID：${result.excludedItemIds.join(', ') || '无'}。`);
}

module.exports = {
  APPEARANCE_UNLOCK_EFFECT,
  APPEARANCE_UNLOCK_ITEM_IDS,
  CLASS_KEYS,
  countItems,
  filterAppearanceUnlockItems,
  getUseEffects,
  isAppearanceUnlockItem,
  sanitizeDirectory,
};
