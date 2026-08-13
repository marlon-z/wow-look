const fs = require('fs');
const path = require('path');
const { LuaParser } = require('./build-44x-crafted');

const ROOT = path.resolve(__dirname, '..');
const SOURCE_DIR = path.join(ROOT, 'cos-upload', 'data-12.1-s2-tier-preflight');
const OUTPUT_DIR = path.join(ROOT, 'cos-upload', 'data-12.1-s2-crafted-preview');
const CRAFT_INPUT = 'E:/World of Warcraft/_retail_/WTF/Account/513648058#1/SavedVariables/WoWLookCraftExport.lua';
const CLASS_KEYS = [
  'warrior', 'paladin', 'hunter', 'rogue', 'priest', 'deathknight', 'shaman',
  'mage', 'warlock', 'monk', 'druid', 'demonhunter', 'evoker',
];

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function parseCraftCandidates(inputPath) {
  const source = fs.readFileSync(inputPath, 'utf8');
  const db = new LuaParser(source).parseRoot();
  const candidates = Object.values(db.candidates || {})
    .map((candidate) => ({
      recipeId: Number(candidate.recipeId) || 0,
      itemId: Number(candidate.itemId) || 0,
      itemName: candidate.itemName || '',
      professionId: Number(candidate.professionId) || 0,
      professionName: candidate.professionName || '',
      equipLoc: candidate.equipLoc || '',
      itemType: candidate.itemType || '',
      itemSubType: candidate.itemSubType || '',
      iLvlMin: Number(candidate.iLvlMin) || 0,
      craftingQualityIds: Array.isArray(candidate.craftingQualityIds) ? candidate.craftingQualityIds : [],
      qualityIlvlBonuses: Array.isArray(candidate.qualityIlvlBonuses) ? candidate.qualityIlvlBonuses : [],
      clientBuild: Number(candidate.clientBuild) || 0,
      status: candidate.status || 'pending_maximum_preview',
      statusReason: candidate.statusReason || '',
    }))
    .filter((candidate) => candidate.recipeId > 0 && candidate.itemId > 0)
    .sort((left, right) => left.recipeId - right.recipeId);

  return {
    dataVersion: db.dataVersion || '12.1-s2',
    seasonName: db.seasonName || 'Midnight Season 2',
    clientBuild: Number(db.clientBuild) || 0,
    sourceAddonVersion: db.addonVersion || '',
    capturedAt: db.lastScan && db.lastScan.completedAt ? db.lastScan.completedAt : '',
    catalogStatus: 'candidate_catalog_only',
    candidateCount: candidates.length,
    verifiedMaximumCount: Object.keys(db.items || {}).length,
    candidates,
  };
}

function buildOverview(baseOverview, catalog) {
  return {
    ...baseOverview,
    preview: {
      id: 's2-crafted-local-preview',
      source: 'workspace_cos_upload',
      localOnly: true,
      uploadApproved: false,
    },
    craftedEquipment: {
      catalogStatus: catalog.catalogStatus,
      sourceAddonVersion: catalog.sourceAddonVersion,
      clientBuild: catalog.clientBuild,
      capturedAt: catalog.capturedAt,
      candidateCount: catalog.candidateCount,
      verifiedMaximumCount: catalog.verifiedMaximumCount,
      visibleItemCount: 0,
      note: '制造候选已保存；S2 最高装等与随机属性数值尚未验证，因此未展示为可配装装备。',
    },
  };
}

function main() {
  const craftInput = path.resolve(process.cwd(), process.argv[2] || CRAFT_INPUT);
  if (!fs.existsSync(SOURCE_DIR)) throw new Error(`S2 源数据目录不存在：${SOURCE_DIR}`);
  if (!fs.existsSync(craftInput)) throw new Error(`制造候选导出不存在：${craftInput}`);

  const catalog = parseCraftCandidates(craftInput);
  const overview = buildOverview(readJson(path.join(SOURCE_DIR, 'overview.json')), catalog);
  writeJson(path.join(OUTPUT_DIR, 'overview.json'), overview);
  writeJson(path.join(OUTPUT_DIR, 'crafting-candidates.json'), catalog);

  CLASS_KEYS.forEach((classKey) => {
    const classData = readJson(path.join(SOURCE_DIR, `${classKey}.json`));
    writeJson(path.join(OUTPUT_DIR, `${classKey}.json`), classData);
  });
  fs.writeFileSync(path.join(OUTPUT_DIR, 'README.md'), [
    '# Midnight S2 本地制造业预览数据',
    '',
    '此目录仅供本地小程序验收，不能直接视为已批准发布数据。启动 `node scripts/serve-local-cos-preview.js` 后，小程序会从本机读取本目录。',
    '副本与套装数据来自 `data-12.1-s2-tier-preflight`；制造业候选在 `crafting-candidates.json`。',
    '制造候选尚未核验最高装等和最终说明框属性，因此没有写入职业装备清单。',
    '',
  ].join('\n'), 'utf8');
  console.log(`本地 S2 预览已生成：${OUTPUT_DIR}`);
  console.log(`制造候选：${catalog.candidateCount}；已验证最高装等：${catalog.verifiedMaximumCount}`);
}

if (require.main === module) {
  main();
}

module.exports = { buildOverview, parseCraftCandidates };
