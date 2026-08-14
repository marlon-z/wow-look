const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');
const { filterAppearanceUnlockItems, isAppearanceUnlockItem } = require('./s2-appearance-unlock-filter');

const ROOT = path.resolve(__dirname, '..');
const PREVIEW_DIR = path.join(ROOT, 'cos-upload', 'data-12.1-s2-crafted-preview');
const ASSET_DIR = path.join(ROOT, 'cos-upload', 'assets', 'icons');
const DEFAULT_EXPORT = 'E:/World of Warcraft/_retail_/WTF/Account/513648058#1/SavedVariables/WoWLookExport3.lua';
const CLASS_KEYS = [
  'warrior', 'paladin', 'hunter', 'rogue', 'priest', 'deathknight', 'shaman',
  'mage', 'warlock', 'monk', 'druid', 'demonhunter', 'evoker',
];
const TARGET_RAID_IDS = new Set([1317, 1320]);

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

function itemList(instances) {
  return (instances || []).flatMap((instance) => (
    (instance.encounters || []).flatMap((encounter) => encounter.items || [])
  ));
}

function preservedInstances(data) {
  return (data.instances || []).filter((instance) => (
    instance.type === 'tier' || instance.type === 'crafted' || instance.id === 'manufacturing'
  ));
}

function mergeClassData(maximumData, existingData) {
  const ordinary = itemList(maximumData.instances)
    .filter((item) => item.sourceType !== 'tier' && item.sourceType !== 'crafted')
    .filter((item) => !isAppearanceUnlockItem(item));
  if (!ordinary.length || ordinary.some((item) => item.ilvl !== 334)) {
    throw new Error(`最高装等普通装备不完整：共 ${ordinary.length} 条，非 334 条目 ${ordinary.filter((item) => item.ilvl !== 334).length}。`);
  }
  const instances = [...(maximumData.instances || []), ...preservedInstances(existingData)];
  const items = itemList(instances);
  return filterAppearanceUnlockItems({
    ...maximumData,
    meta: {
      ...(maximumData.meta || {}),
      itemCount: items.length,
      instanceCount: instances.length,
      tierItemCount: itemList(preservedInstances(existingData)).filter((item) => item.sourceType === 'tier').length,
      craftedItemCount: itemList(preservedInstances(existingData)).filter((item) => item.sourceType === 'crafted').length,
    },
    instances,
  }).data;
}

function buildScopedPayload(inputPath, outputPath) {
  const source = fs.readFileSync(inputPath, 'utf8');
  const match = source.match(/(?:\["payload"\]|payload)\s*=\s*"((?:[^"\\]|\\.)*)"/s);
  if (!match) throw new Error('最终导出缺少 payload。');
  const payload = JSON.parse(JSON.parse(`"${match[1]}"`));
  const instances = (payload.instances || []).filter((instance) => !instance.isRaid || TARGET_RAID_IDS.has(Number(instance.id)));
  const itemIds = new Set(instances.flatMap((instance) => (
    (instance.encounters || []).flatMap((encounter) => encounter.itemIds || [])
  )).map(String));
  const items = Object.fromEntries(Object.entries(payload.items || {}).filter(([itemId]) => itemIds.has(String(itemId))));
  const excluded = Object.values(items).filter((item) => item.maxVersion?.status !== 'ok');
  if (excluded.some((item) => Number(item.itemClassId) !== 9)) {
    throw new Error(`范围内存在非配方的最高装等失败物品：${excluded.map((item) => item.itemId).join(', ')}`);
  }
  const finalItems = Object.fromEntries(Object.entries(items).filter(([, item]) => item.maxVersion?.status === 'ok'));
  const finalInstances = instances.map((instance) => ({
    ...instance,
    encounters: (instance.encounters || []).map((encounter) => ({
      ...encounter,
      itemIds: (encounter.itemIds || []).filter((itemId) => Object.prototype.hasOwnProperty.call(finalItems, String(itemId))),
    })),
  }));
  const scoped = {
    ...payload,
    releaseStatus: 'finalized',
    equipmentVariant: 'maximum_version',
    instances: finalInstances,
    items: finalItems,
    scope: {
      ...(payload.scope || {}),
      raids: (payload.scope?.raids || []).filter((raid) => TARGET_RAID_IDS.has(Number(raid.id))),
      skippedRaids: [
        ...(payload.scope?.skippedRaids || []),
        ...(payload.scope?.raids || []).filter((raid) => !TARGET_RAID_IDS.has(Number(raid.id))).map((raid) => ({
          id: raid.id,
          name: raid.name,
          reason: '不在两个目标 S2 团本范围',
        })),
      ],
    },
    diagnostics: {
      ...(payload.diagnostics || {}),
      maxVersionSuccessCount: Object.keys(finalItems).length,
      maxVersionFailureCount: 0,
      maxVersionStatuses: { ok: Object.keys(finalItems).length },
      maxVersionFailures: [],
      excludedRecipeCount: excluded.length,
    },
  };
  const db = `WoWLookExport3DB = {\n  payload = ${JSON.stringify(JSON.stringify(scoped))}\n}\n`;
  fs.writeFileSync(outputPath, db, 'utf8');
  return { itemCount: Object.keys(finalItems).length, excludedRecipeCount: excluded.length };
}

function runParser(inputPath, outputDir) {
  execFileSync(process.execPath, [
    path.join(ROOT, 'scripts', 'parse-export.js'),
    '--input', inputPath,
    '--output', outputDir,
    '--assets', ASSET_DIR,
    '--data-version', '12.1-s2',
  ], { cwd: ROOT, stdio: 'inherit' });
}

function fillIcons() {
  execFileSync(process.execPath, [path.join(ROOT, 'scripts', 'fill-s2-preview-icons.js')], {
    cwd: ROOT,
    stdio: 'inherit',
  });
}

function main() {
  const inputPath = path.resolve(process.cwd(), process.argv[2] || DEFAULT_EXPORT);
  if (!fs.existsSync(inputPath)) throw new Error(`找不到最终导出：${inputPath}`);
  const temporaryDir = fs.mkdtempSync(path.join(os.tmpdir(), 'wowlook-s2-maximum-'));
  try {
    const scopedInput = path.join(temporaryDir, 'WoWLookExport3-scoped.lua');
    const scopedInfo = buildScopedPayload(inputPath, scopedInput);
    runParser(scopedInput, temporaryDir);
    const maximumOverview = readJson(path.join(temporaryDir, 'overview.json'));
    if (maximumOverview.releaseStatus !== 'finalized'
        || maximumOverview.equipmentVariant !== 'maximum_version'
        || maximumOverview.maximumProfile?.dungeonTargetItemLevel !== 334
        || maximumOverview.maximumProfile?.raidTargetItemLevel !== 334) {
      throw new Error('导出不是已验证的 S2 334 最高装等 payload。');
    }

    let ordinaryRecordCount = 0;
    CLASS_KEYS.forEach((classKey) => {
      const maximumData = readJson(path.join(temporaryDir, `${classKey}.json`));
      const existingData = readJson(path.join(PREVIEW_DIR, `${classKey}.json`));
      const merged = mergeClassData(maximumData, existingData);
      ordinaryRecordCount += itemList(maximumData.instances).length;
      writeJson(path.join(PREVIEW_DIR, `${classKey}.json`), merged);
    });

    const existingOverview = readJson(path.join(PREVIEW_DIR, 'overview.json'));
    writeJson(path.join(PREVIEW_DIR, 'overview.json'), {
      ...maximumOverview,
      preview: existingOverview.preview,
      craftedEquipment: existingOverview.craftedEquipment,
      normalEquipment: {
        targetItemLevel: 334,
        recordCount: ordinaryRecordCount,
        verification: 'WoW client generated-link and tooltip validation',
      },
    });
    fillIcons();
    console.log(`已合并 ${ordinaryRecordCount} 条已验证的 334 普通装备；已排除 ${scopedInfo.excludedRecipeCount} 件配方；套装与制造业记录保持不变。`);
  } finally {
    fs.rmSync(temporaryDir, { recursive: true, force: true });
  }
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

module.exports = { buildScopedPayload, mergeClassData, preservedInstances };
