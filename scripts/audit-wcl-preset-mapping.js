#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { flattenItems } = require('../miniprogram/utils/equipment');
const { DATA_VERSION } = require('./wcl-preset-config');

const WCL_SLOT_TO_ITEM_SLOT = {
  head: 'head', neck: 'neck', shoulder: 'shoulder', cloak: 'cloak', chest: 'chest',
  wrist: 'wrist', hand: 'hand', waist: 'waist', legs: 'legs', feet: 'feet',
  finger1: 'finger', finger2: 'finger', trinket1: 'trinket', trinket2: 'trinket',
  weapon: 'weapon', weapon2: 'weapon',
};

function parseArgs(argv) {
  const args = {
    source: '',
    classKey: '',
    specId: null,
    output: '',
  };
  for (let index = 2; index < argv.length; index += 1) {
    const key = argv[index];
    const value = argv[index + 1];
    if (key === '--source') { args.source = path.resolve(process.cwd(), value); index += 1; }
    else if (key === '--class-key') { args.classKey = value; index += 1; }
    else if (key === '--spec-id') { args.specId = Number(value); index += 1; }
    else if (key === '--output') { args.output = path.resolve(process.cwd(), value); index += 1; }
  }
  return args;
}

function loadClassData(classKey) {
  if (!classKey || !/^[a-z]+$/.test(classKey)) {
    throw new Error('缺少或无效的 --class-key');
  }
  const modulePath = path.join(__dirname, '..', 'miniprogram', 'packages', `class-${classKey}`, 'data', classKey);
  try {
    return require(modulePath);
  } catch (error) {
    throw new Error(`无法加载本地职业装备库 ${classKey}: ${error.message}`);
  }
}

function buildItemMap(classData, specId, filterBySpec) {
  const map = {};
  flattenItems((classData && classData.instances) || []).forEach((item) => {
    if (filterBySpec && Array.isArray(item.specs) && item.specs.length && item.specs.indexOf(Number(specId)) === -1) {
      return;
    }
    map[String(item.id)] = item;
  });
  return map;
}

function expectedItemSlot(wclSlot) {
  return WCL_SLOT_TO_ITEM_SLOT[wclSlot] || wclSlot;
}

function isSlotCompatible(wclSlot, item) {
  return !!item && item.slot === expectedItemSlot(wclSlot);
}

function jsonFiles(source) {
  return fs.readdirSync(source, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.json')
      && entry.name !== 'index.json' && entry.name !== 'mapping-audit.json')
    .map((entry) => path.join(source, entry.name))
    .sort();
}

function createReport(classKey, specId) {
  return {
    schemaVersion: 1,
    generatedAt: Date.now(),
    dataVersion: DATA_VERSION,
    classKey,
    specId: Number(specId),
    files: [],
    summary: {
      files: 0,
      presets: 0,
      slots: 0,
      mappedItems: 0,
      missingItems: [],
      wrongSpecItems: [],
      slotMismatches: [],
      preservedMetadata: { craftedStats: 0, enchants: 0, gems: 0 },
    },
  };
}

function auditPresetFile(file, allItems, specItems, report) {
  const source = JSON.parse(fs.readFileSync(file, 'utf8'));
  const fileReport = { file: path.basename(file), presets: 0, slots: 0 };
  (source.entries || []).forEach((entry) => {
    (entry.presets || []).forEach((preset) => {
      fileReport.presets += 1;
      report.summary.presets += 1;
      Object.keys(preset.slots || {}).forEach((wclSlot) => {
        const slot = preset.slots[wclSlot];
        if (!slot || !slot.itemId) return;
        fileReport.slots += 1;
        report.summary.slots += 1;
        if (Array.isArray(slot.craftedStats) && slot.craftedStats.length) report.summary.preservedMetadata.craftedStats += 1;
        if (slot.permanentEnchant || slot.enchantName) report.summary.preservedMetadata.enchants += 1;
        if (Array.isArray(slot.gems) && slot.gems.length) report.summary.preservedMetadata.gems += 1;

        const itemId = String(slot.itemId);
        const item = specItems[itemId];
        if (!item) {
          const issue = { file: fileReport.file, presetId: preset.id || '', itemId: Number(slot.itemId), wclSlot };
          if (allItems[itemId]) report.summary.wrongSpecItems.push(issue);
          else report.summary.missingItems.push(issue);
          return;
        }
        if (!isSlotCompatible(wclSlot, item)) {
          report.summary.slotMismatches.push(Object.assign({
            file: fileReport.file,
            presetId: preset.id || '',
            itemId: Number(slot.itemId),
            wclSlot,
            expectedItemSlot: expectedItemSlot(wclSlot),
            actualItemSlot: item.slot,
          }));
          return;
        }
        report.summary.mappedItems += 1;
      });
    });
  });
  report.files.push(fileReport);
  report.summary.files += 1;
}

function auditDirectory(options) {
  const args = options || {};
  if (!args.source || !fs.existsSync(args.source)) throw new Error(`审计目录不存在: ${args.source || ''}`);
  if (!Number(args.specId)) throw new Error('缺少或无效的 --spec-id');
  const classData = args.classData || loadClassData(args.classKey);
  const allItems = buildItemMap(classData, args.specId, false);
  const specItems = buildItemMap(classData, args.specId, true);
  const report = createReport(args.classKey, args.specId);
  jsonFiles(args.source).forEach((file) => auditPresetFile(file, allItems, specItems, report));
  return report;
}

function writeReport(source, report, output) {
  const file = output || path.join(source, 'mapping-audit.json');
  fs.writeFileSync(file, JSON.stringify(report, null, 2), 'utf8');
  return file;
}

function main() {
  const args = parseArgs(process.argv);
  const report = auditDirectory(args);
  const output = writeReport(args.source, report, args.output);
  const summary = report.summary;
  console.log(`WCL 映射审计完成: ${summary.files} 文件、${summary.presets} 套预设、${summary.mappedItems} 个已映射装备`);
  console.log(`缺失装备 ${summary.missingItems.length}，专精不匹配 ${summary.wrongSpecItems.length}，槽位不匹配 ${summary.slotMismatches.length}`);
  console.log(`报告已写入: ${path.relative(process.cwd(), output)}`);
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}

module.exports = {
  WCL_SLOT_TO_ITEM_SLOT,
  parseArgs,
  buildItemMap,
  expectedItemSlot,
  isSlotCompatible,
  auditPresetFile,
  auditDirectory,
  writeReport,
};
