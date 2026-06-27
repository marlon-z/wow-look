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
  findCombatant,
  loadCraftingMap,
  readJsonFile,
  buildPreset,
} = require('./wcl-authority-snapshot');
const { encodeTalentImportString } = require('./talent-import-encoder');

const DATA_VERSION = '4.4.x';
const CLASS_KEY = 'monk';
const SPEC_ID = 269;
const TALENT_CHANGE_SET_ID = 20;
const METRIC = 'dps';
const TOP = 5;
const MYTHIC_DIFFICULTY = 5;

const RAIDS = [
  {
    zoneId: 46,
    name: 'VS / DR / MQD',
    localName: '史诗团本',
    difficultyName: '史诗',
    fileKey: 'raid-mythic-vs-dr-mqd',
    bosses: [
      { id: 3176, name: 'Imperator Averzian', localName: '元首阿福扎恩' },
      { id: 3177, name: 'Vorasius', localName: '弗拉希乌斯' },
      { id: 3179, name: 'Fallen-King Salhadaar', localName: '陨落之王萨哈达尔' },
      { id: 3178, name: 'Vaelgor & Ezzorak', localName: '威厄高尔和艾佐拉克' },
      { id: 3180, name: 'Lightblinded Vanguard', localName: '光盲先锋军' },
      { id: 3181, name: 'Crown of the Cosmos', localName: '宇宙之冕' },
      { id: 3306, name: 'Chimaerus, the Undreamt God', localName: '奇美鲁斯，未梦之神' },
      { id: 3182, name: "Belo'ren, Child of Al'ar", localName: '贝洛朗，奥的子嗣' },
      { id: 3183, name: 'Midnight Falls', localName: '至暗之夜降临' },
    ],
  },
  {
    zoneId: 50,
    name: 'Sporefall',
    localName: '孢陨幽境',
    difficultyName: '史诗',
    fileKey: 'raid-mythic-sporefall',
    bosses: [
      { id: 3159, name: 'Rotmire', localName: '腐沼' },
    ],
  },
];

function encodeTalentExport(talentTree) {
  if (!talentTree.length) {
    throw new Error('missing-talent-tree');
  }
  return encodeTalentImportString({
    classKey: CLASS_KEY,
    specId: SPEC_ID,
    changeSetId: TALENT_CHANGE_SET_ID,
    talentTree,
  });
}

function parseArgs(argv) {
  const args = {
    top: TOP,
    onlyEncounterId: null,
    raidFileKey: null,
    writeMiniProgram: true,
  };
  for (let i = 2; i < argv.length; i += 1) {
    const key = argv[i];
    const val = argv[i + 1];
    if (key === '--top') { args.top = Number(val); i += 1; }
    else if (key === '--encounter-id') { args.onlyEncounterId = Number(val); i += 1; }
    else if (key === '--raid-file-key') { args.raidFileKey = val; i += 1; }
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

function compactPreset(preset, boss, raid) {
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
  const exportString = encodeTalentExport(talentTree);

  return {
    id: preset.id,
    name: preset.name,
    source: {
      encounterId: preset.source.encounterId,
      encounterName: preset.source.encounterName,
      encounterLocalName: boss.localName,
      metric: preset.source.metric,
      rank: preset.source.rank,
      player: preset.source.player,
      amount: Math.round(preset.source.amount || 0),
      server: preset.source.server || null,
      reportCode: preset.source.reportCode || '',
      fightId: preset.source.fightId || null,
      bracket: null,
      difficulty: MYTHIC_DIFFICULTY,
      difficultyName: raid.difficultyName,
    },
    talents: {
      specId: preset.talents ? preset.talents.specId : null,
      changeSetId: TALENT_CHANGE_SET_ID,
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

function readDataFile(file, fallback) {
  if (!fs.existsSync(file)) return fallback;
  const raw = fs.readFileSync(file, 'utf8');
  if (file.endsWith('.js')) {
    return Function('module', `${raw}; return module.exports;`)({ exports: {} });
  }
  return JSON.parse(raw);
}

async function collectBossPresets(token, craftingMap, tooltipOptions, raid, boss, top) {
  const specDefaults = DEFAULT_SPEC[CLASS_KEY][SPEC_ID];
  const { encounter, rankings } = await fetchRankings(
    token,
    boss.id,
    specDefaults.className,
    specDefaults.specName,
    METRIC,
    {
      leaderboard: DEFAULT_LEADERBOARD,
      difficulty: MYTHIC_DIFFICULTY,
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
      const preset = await buildPreset(encounter, ranking, combatant, i, craftingMap, tooltipOptions);
      presets.push(compactPreset(preset, boss, raid));
    } catch (err) {
      failures.push({ rank: i + 1, player: ranking.name, reason: err.message });
    }
  }

  return {
    encounter: {
      id: encounter.id,
      name: encounter.name || boss.name,
      localName: boss.localName || encounter.name || boss.name,
    },
    presets,
    diagnostics: {
      rankingsReturned: rankings.length,
      failures,
    },
  };
}

function updateIndex(index, generatedAt, raid, raidOutput) {
  const specDefaults = DEFAULT_SPEC[CLASS_KEY][SPEC_ID];
  const base = index || {
    schemaVersion: 2,
    generatedAt,
    dataVersion: DATA_VERSION,
    classKey: CLASS_KEY,
    className: specDefaults.className,
    specId: SPEC_ID,
    specName: specDefaults.specName,
    specLocalName: specDefaults.localName,
    mythicPlus: [],
    raid: [],
  };
  base.generatedAt = generatedAt;
  base.raid = (base.raid || []).filter((item) => item.fileKey !== raid.fileKey);
  base.raid.push({
    zoneId: raid.zoneId,
    name: raid.localName,
    difficulty: MYTHIC_DIFFICULTY,
    difficultyName: raid.difficultyName,
    fileKey: raid.fileKey,
    file: `${raid.fileKey}.json`,
    bossCount: raidOutput.entries.length,
    presetCount: raidOutput.entries.reduce((total, entry) => total + entry.presets.length, 0),
  });
  return base;
}

function mergeManifestFiles(root, classKey, specId, fileKeys) {
  const manifestFile = path.join(root, 'manifest.js');
  const existing = readDataFile(manifestFile, { entries: {} });
  const entries = {};
  Object.keys((existing && existing.entries) || {}).forEach((key) => {
    const entry = existing.entries[key] || {};
    entries[key] = { files: Object.keys(entry.files || {}) };
  });
  entries[`${classKey}:${specId}`] = { files: fileKeys };
  return entries;
}

function writeMiniProgramManifest(root, index) {
  const fileKeys = []
    .concat((index.mythicPlus || []).map((file) => file.fileKey))
    .concat((index.raid || []).map((file) => file.fileKey));
  const entries = mergeManifestFiles(root, CLASS_KEY, SPEC_ID, fileKeys);
  const lines = [
    'module.exports = {',
    `  dataVersion: '${DATA_VERSION}',`,
    '  entries: {',
  ];
  Object.keys(entries).sort().forEach((entryKey) => {
    const parts = entryKey.split(':');
    const classKey = parts[0];
    const specId = parts[1];
    lines.push(`    '${entryKey}': {`);
    lines.push(`      index: function () { return require('./data-4.4.x/${classKey}/${specId}/index.js'); },`);
    lines.push('      files: {');
    entries[entryKey].files.forEach((fileKey) => {
      lines.push(`        '${fileKey}': function () { return require('./data-4.4.x/${classKey}/${specId}/${fileKey}.js'); },`);
    });
    lines.push('      },');
    lines.push('    },');
  });
  lines.push(
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
  const raids = args.raidFileKey
    ? RAIDS.filter((raid) => raid.fileKey === args.raidFileKey)
    : RAIDS;
  if (!raids.length) throw new Error('没有匹配的团本');

  const token = await getWclToken();
  const craftingMap = loadCraftingMap();
  const tooltipCacheFile = path.resolve(process.cwd(), DEFAULT_TOOLTIP_CACHE_FILE);
  const tooltipCache = readJsonFile(tooltipCacheFile, {});
  const tooltipOptions = { locale: 4, cache: tooltipCache, cacheFile: tooltipCacheFile };

  const cosRoot = path.join(process.cwd(), 'cos-upload', 'wcl-presets', `data-${DATA_VERSION}`, CLASS_KEY, String(SPEC_ID));
  const miniRoot = path.join(process.cwd(), 'miniprogram', 'data', 'wcl-presets');
  const miniSpecRoot = path.join(miniRoot, `data-${DATA_VERSION}`, CLASS_KEY, String(SPEC_ID));

  let latestMiniIndex = null;
  for (const raid of raids) {
    const bosses = args.onlyEncounterId
      ? raid.bosses.filter((boss) => boss.id === args.onlyEncounterId)
      : raid.bosses;
    if (!bosses.length) continue;

    const entries = [];
    for (const boss of bosses) {
      console.log(`生成踏风史诗团本 ${raid.localName} · ${boss.localName}...`);
      entries.push(await collectBossPresets(token, craftingMap, tooltipOptions, raid, boss, args.top));
    }

    const output = {
      schemaVersion: 2,
      generatedAt,
      dataVersion: DATA_VERSION,
      classKey: CLASS_KEY,
      specId: SPEC_ID,
      contentType: 'raid',
      zoneId: raid.zoneId,
      raidName: raid.name,
      raidLocalName: raid.localName,
      difficulty: MYTHIC_DIFFICULTY,
      difficultyName: raid.difficultyName,
      requestedTop: args.top,
      entries,
    };

    writeJson(path.join(cosRoot, `${raid.fileKey}.json`), output);
    const cosIndexFile = path.join(cosRoot, 'index.json');
    const cosIndex = updateIndex(readDataFile(cosIndexFile, null), generatedAt, raid, output);
    writeJson(cosIndexFile, cosIndex);

    if (args.writeMiniProgram) {
      writeJsModule(path.join(miniSpecRoot, `${raid.fileKey}.js`), output);
      const miniIndexFile = path.join(miniSpecRoot, 'index.js');
      latestMiniIndex = updateIndex(readDataFile(miniIndexFile, cosIndex), generatedAt, raid, output);
      writeJsModule(miniIndexFile, latestMiniIndex);
    }

    const presetCount = entries.reduce((total, entry) => total + entry.presets.length, 0);
    console.log(`已写入团本数据: ${raid.fileKey}, Boss ${entries.length}, 预设 ${presetCount}`);
  }

  if (args.writeMiniProgram && latestMiniIndex) {
    writeMiniProgramManifest(miniRoot, latestMiniIndex);
  }
}

if (require.main === module) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
