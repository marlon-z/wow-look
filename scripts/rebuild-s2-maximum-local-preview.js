const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const PREVIEW_DIR = path.join(ROOT, 'cos-upload', 'data-12.1-s2-crafted-preview');
const ASSET_DIR = path.join(ROOT, 'cos-upload', 'assets', 'icons');
const DEFAULT_EXPORT = 'E:/World of Warcraft/_retail_/WTF/Account/513648058#1/SavedVariables/WoWLookExport3.lua';
const CLASS_KEYS = [
  'warrior', 'paladin', 'hunter', 'rogue', 'priest', 'deathknight', 'shaman',
  'mage', 'warlock', 'monk', 'druid', 'demonhunter', 'evoker',
];

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
    .filter((item) => item.sourceType !== 'tier' && item.sourceType !== 'crafted');
  if (!ordinary.length || ordinary.some((item) => item.ilvl !== 334)) {
    throw new Error(`最高装等普通装备不完整：共 ${ordinary.length} 条，非 334 条目 ${ordinary.filter((item) => item.ilvl !== 334).length}。`);
  }
  const instances = [...(maximumData.instances || []), ...preservedInstances(existingData)];
  const items = itemList(instances);
  return {
    ...maximumData,
    meta: {
      ...(maximumData.meta || {}),
      itemCount: items.length,
      instanceCount: instances.length,
      tierItemCount: itemList(preservedInstances(existingData)).filter((item) => item.sourceType === 'tier').length,
      craftedItemCount: itemList(preservedInstances(existingData)).filter((item) => item.sourceType === 'crafted').length,
    },
    instances,
  };
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

function main() {
  const inputPath = path.resolve(process.cwd(), process.argv[2] || DEFAULT_EXPORT);
  if (!fs.existsSync(inputPath)) throw new Error(`找不到最终导出：${inputPath}`);
  const temporaryDir = fs.mkdtempSync(path.join(os.tmpdir(), 'wowlook-s2-maximum-'));
  try {
    runParser(inputPath, temporaryDir);
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
    console.log(`已合并 ${ordinaryRecordCount} 条已验证的 334 普通装备；套装与制造业记录保持不变。`);
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

module.exports = { mergeClassData, preservedInstances };
