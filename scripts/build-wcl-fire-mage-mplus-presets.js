#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const {
  DEFAULT_SPEC,
  DEFAULT_TOOLTIP_CACHE_FILE,
  DEFAULT_LEADERBOARD,
  getWclToken,
  fetchRankings,
  fetchReportCombatants,
  fetchTalentImportCode,
  findCombatant,
  loadCraftingMap,
  readJsonFile,
  buildPreset,
} = require('./wcl-authority-snapshot');

const DATA_VERSION = '4.4.x';
const CLASS_KEY = 'mage';
const SPEC_ID = 63;
const TOP = 3;
const METRIC = 'dps';

const DUNGEONS = [
  { id: 112526, name: "Algeth'ar Academy", localName: '艾杰斯亚学院' },
  { id: 12811, name: "Magisters' Terrace", localName: '魔导师平台' },
  { id: 12874, name: 'Maisara Caverns', localName: '迈萨拉洞窟' },
  { id: 12915, name: 'Nexus-Point Xenas', localName: '节点希纳斯' },
  { id: 10658, name: 'Pit of Saron', localName: '萨隆矿坑' },
  { id: 361753, name: 'Seat of the Triumvirate', localName: '执政团之座' },
  { id: 61209, name: 'Skyreach', localName: '通天峰' },
  { id: 12805, name: 'Windrunner Spire', localName: '风行者之塔' },
];

const LEVELS = [
  { level: 10, bracket: 9, fileKey: 'mythic-plus-10', name: '10层' },
  { level: 16, bracket: 15, fileKey: 'mythic-plus-16', name: '16层' },
  { level: 20, bracket: 19, fileKey: 'mythic-plus-20', name: '20层' },
];

function parseArgs(argv) {
  const args = {
    top: TOP,
    onlyEncounterId: null,
    levels: LEVELS.map((item) => item.level),
    writeMiniProgram: true,
  };
  for (let i = 2; i < argv.length; i += 1) {
    const key = argv[i];
    const val = argv[i + 1];
    if (key === '--top') { args.top = Number(val); i += 1; }
    else if (key === '--encounter-id') { args.onlyEncounterId = Number(val); i += 1; }
    else if (key === '--levels') { args.levels = String(val).split(',').map(Number).filter(Boolean); i += 1; }
    else if (key === '--no-miniprogram') { args.writeMiniProgram = false; }
  }
  return args;
}

function compactSlot(slot) {
  if (!slot) return null;
  const result = {
    itemId: slot.itemId,
    ilvl: slot.ilvl || 0,
  };
  if (slot.bonusIDs && slot.bonusIDs.length) result.bonusIDs = slot.bonusIDs;
  if (slot.permanentEnchant) result.permanentEnchant = slot.permanentEnchant;
  if (slot.gems && slot.gems.length) {
    result.gems = slot.gems.map((gem) => ({
      id: gem.id,
      itemLevel: gem.itemLevel || 0,
      icon: gem.icon || '',
    }));
  }
  if (slot.crafted) result.crafted = true;
  if (slot.craftedStats && slot.craftedStats.length) {
    result.craftedStats = slot.craftedStats.map((stat) => ({
      type: stat.type,
      name: stat.name,
      value: stat.value,
      randomAttributeIndex: stat.randomAttributeIndex,
    }));
  }
  if (slot.craftedStatsUnknown) result.craftedStatsUnknown = true;
  return result;
}

function compactPreset(preset) {
  const slots = {};
  Object.keys(preset.slots || {}).forEach((slotKey) => {
    slots[slotKey] = compactSlot(preset.slots[slotKey]);
  });

  const talentTree = preset.talents && Array.isArray(preset.talents.talentTree)
    ? preset.talents.talentTree.map((talent) => ({
      id: talent.id,
      rank: talent.rank,
      nodeID: talent.nodeID,
    }))
    : [];
  const exportString = preset.talents && preset.talents.exportString
    ? preset.talents.exportString
    : '';

  return {
    id: preset.id,
    name: preset.name,
    source: {
      encounterId: preset.source.encounterId,
      encounterName: preset.source.encounterName,
      metric: preset.source.metric,
      rank: preset.source.rank,
      player: preset.source.player,
      amount: Math.round(preset.source.amount || 0),
      server: preset.source.server || null,
      reportCode: preset.source.reportCode || '',
      fightId: preset.source.fightId || null,
      actorID: preset.source.actorID || null,
      bracket: preset.source.bracket || null,
    },
    talents: {
      specId: preset.talents ? preset.talents.specId : null,
      talentTree,
      pvpTalents: preset.talents && Array.isArray(preset.talents.pvpTalents)
        ? preset.talents.pvpTalents
        : [],
      exportString,
    },
    slots,
  };
}

function writeJson(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(data), 'utf8');
}

function writeJsModule(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `module.exports = ${JSON.stringify(data)};\n`, 'utf8');
}

async function collectDungeonPresets(token, craftingMap, tooltipOptions, dungeon, level, top) {
  const specDefaults = DEFAULT_SPEC[CLASS_KEY][SPEC_ID];
  const { encounter, rankings } = await fetchRankings(
    token,
    dungeon.id,
    specDefaults.className,
    specDefaults.specName,
    METRIC,
    {
      leaderboard: DEFAULT_LEADERBOARD,
      bracket: level.bracket,
    }
  );

  const presets = [];
  const failures = [];
  for (let i = 0; i < rankings.length && presets.length < top; i += 1) {
    const ranking = rankings[i];
    if (!ranking.report || !ranking.report.code) continue;
    try {
      const report = await fetchReportCombatants(token, ranking.report.code);
      const combatant = findCombatant(report, ranking);
      if (!combatant || !combatant.gear || !Array.isArray(combatant.talentTree)) {
        failures.push({ rank: i + 1, player: ranking.name, reason: 'missing-gear-or-talents' });
        continue;
      }
      if (Number(combatant.specID) !== SPEC_ID) {
        failures.push({ rank: i + 1, player: ranking.name, reason: `wrong-spec-${combatant.specID}` });
        continue;
      }
      const talentImportCode = await fetchTalentImportCode(
        token,
        ranking.report.code,
        ranking.report.fightID,
        combatant.sourceID
      );
      const preset = await buildPreset(encounter, ranking, combatant, i, craftingMap, tooltipOptions, {
        talentImportCode,
      });
      presets.push(compactPreset(preset));
    } catch (err) {
      failures.push({ rank: i + 1, player: ranking.name, reason: err.message });
    }
  }

  return {
    encounter: {
      id: encounter.id,
      name: encounter.name || dungeon.name,
      localName: dungeon.localName || encounter.name || dungeon.name,
    },
    presets,
    diagnostics: {
      rankingsReturned: rankings.length,
      failures,
    },
  };
}

function buildIndex(generatedAt, files) {
  const specDefaults = DEFAULT_SPEC[CLASS_KEY][SPEC_ID];
  return {
    schemaVersion: 2,
    generatedAt,
    dataVersion: DATA_VERSION,
    classKey: CLASS_KEY,
    className: specDefaults.className,
    specId: SPEC_ID,
    specName: specDefaults.specName,
    specLocalName: specDefaults.localName,
    mythicPlus: files.map((file) => ({
      level: file.level,
      name: file.name,
      fileKey: file.fileKey,
      file: `${file.fileKey}.json`,
      dungeonCount: file.dungeonCount,
      presetCount: file.presetCount,
    })),
    raid: [],
  };
}

function writeMiniProgramManifest(root, fileKeys) {
  const lines = [
    'module.exports = {',
    `  dataVersion: '${DATA_VERSION}',`,
    '  entries: {',
    "    'mage:63': {",
    "      index: function () { return require('./data-4.4.x/mage/63/index.js'); },",
    '      files: {',
  ];
  fileKeys.forEach((fileKey) => {
    lines.push(`        '${fileKey}': function () { return require('./data-4.4.x/mage/63/${fileKey}.js'); },`);
  });
  lines.push(
    '      },',
    '    },',
    '  },',
    '};',
    ''
  );
  fs.mkdirSync(root, { recursive: true });
  fs.writeFileSync(path.join(root, 'manifest.js'), lines.join('\n'), 'utf8');
}

async function main() {
  const args = parseArgs(process.argv);
  const generatedAt = Date.now();
  const selectedDungeons = args.onlyEncounterId
    ? DUNGEONS.filter((dungeon) => dungeon.id === args.onlyEncounterId)
    : DUNGEONS;
  const selectedLevels = LEVELS.filter((level) => args.levels.indexOf(level.level) !== -1);
  if (!selectedDungeons.length) throw new Error('没有匹配的地下城 encounter');
  if (!selectedLevels.length) throw new Error('没有匹配的层数');

  const token = await getWclToken();
  const craftingMap = loadCraftingMap();
  const tooltipCacheFile = path.resolve(process.cwd(), DEFAULT_TOOLTIP_CACHE_FILE);
  const tooltipCache = readJsonFile(tooltipCacheFile, {});
  const tooltipOptions = { locale: 4, cache: tooltipCache, cacheFile: tooltipCacheFile };

  const cosRoot = path.join(process.cwd(), 'cos-upload', 'wcl-presets', `data-${DATA_VERSION}`, CLASS_KEY, String(SPEC_ID));
  const miniRoot = path.join(process.cwd(), 'miniprogram', 'data', 'wcl-presets');
  const miniSpecRoot = path.join(miniRoot, `data-${DATA_VERSION}`, CLASS_KEY, String(SPEC_ID));
  const files = [];

  for (const level of selectedLevels) {
    console.log(`生成火法大秘境 ${level.name}...`);
    const entries = [];
    for (const dungeon of selectedDungeons) {
      console.log(`  ${dungeon.name}`);
      entries.push(await collectDungeonPresets(token, craftingMap, tooltipOptions, dungeon, level, args.top));
    }
    const output = {
      schemaVersion: 2,
      generatedAt,
      dataVersion: DATA_VERSION,
      classKey: CLASS_KEY,
      specId: SPEC_ID,
      contentType: 'mythic-plus',
      level: level.level,
      bracket: level.bracket,
      requestedTop: args.top,
      entries,
    };
    const presetCount = entries.reduce((total, entry) => total + entry.presets.length, 0);
    files.push({
      ...level,
      dungeonCount: entries.length,
      presetCount,
    });
    writeJson(path.join(cosRoot, `${level.fileKey}.json`), output);
    if (args.writeMiniProgram) {
      writeJsModule(path.join(miniSpecRoot, `${level.fileKey}.js`), output);
    }
    console.log(`  完成 ${level.name}: ${presetCount} 套`);
  }

  const index = buildIndex(generatedAt, files);
  writeJson(path.join(cosRoot, 'index.json'), index);
  if (args.writeMiniProgram) {
    writeJsModule(path.join(miniSpecRoot, 'index.js'), index);
    writeMiniProgramManifest(miniRoot, files.map((file) => file.fileKey));
  }

  console.log(`已写入 COS 数据目录: ${path.relative(process.cwd(), cosRoot)}`);
  if (args.writeMiniProgram) {
    console.log(`已写入小程序本地数据: ${path.relative(process.cwd(), miniSpecRoot)}`);
  }
}

if (require.main === module) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
