#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const {
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
const {
  DATA_VERSION,
  MYTHIC_RAID_DIFFICULTY,
  MYTHIC_PLUS_DUNGEONS,
  MYTHIC_PLUS_LEVELS,
  RAIDS,
  getSpecConfig,
  listSpecs,
} = require('./wcl-preset-config');
const {
  encodeTalentImportString,
  hasBlueprint,
} = require('./talent-import-encoder');

const DEFAULT_TOP_MPLUS = 3;
const DEFAULT_TOP_RAID = 5;
const DEFAULT_OUTPUT_ROOT = path.join(process.cwd(), 'cos-upload', 'wcl-presets');
const TEST_OUTPUT_ROOT = path.join(process.cwd(), 'cos-upload', 'wcl-presets-test');

function parseArgs(argv) {
  const args = {
    classKey: '',
    specId: null,
    specs: '',
    content: 'all',
    levels: MYTHIC_PLUS_LEVELS.map((item) => item.level),
    raidFileKey: '',
    encounterId: null,
    topMplus: DEFAULT_TOP_MPLUS,
    topRaid: DEFAULT_TOP_RAID,
    writeMiniProgram: false,
    sample: false,
    outputRoot: DEFAULT_OUTPUT_ROOT,
    allowPartialProduction: false,
  };
  for (let i = 2; i < argv.length; i += 1) {
    const key = argv[i];
    const val = argv[i + 1];
    if (key === '--class-key') { args.classKey = val; i += 1; }
    else if (key === '--spec-id') { args.specId = Number(val); i += 1; }
    else if (key === '--specs') { args.specs = val; i += 1; }
    else if (key === '--content') { args.content = val; i += 1; }
    else if (key === '--levels') { args.levels = String(val).split(',').map(Number).filter(Boolean); i += 1; }
    else if (key === '--raid-file-key') { args.raidFileKey = val; i += 1; }
    else if (key === '--encounter-id') { args.encounterId = Number(val); i += 1; }
    else if (key === '--top-mplus') { args.topMplus = Number(val); i += 1; }
    else if (key === '--top-raid') { args.topRaid = Number(val); i += 1; }
    else if (key === '--write-miniprogram') { args.writeMiniProgram = true; }
    else if (key === '--sample') { args.sample = true; }
    else if (key === '--output-root') { args.outputRoot = path.resolve(process.cwd(), val); i += 1; }
    else if (key === '--allow-partial-production') { args.allowPartialProduction = true; }
  }
  return args;
}

function sameNumberSet(left, right) {
  const a = left.slice().map(Number).sort((x, y) => x - y);
  const b = right.slice().map(Number).sort((x, y) => x - y);
  if (a.length !== b.length) return false;
  return a.every((value, index) => value === b[index]);
}

function isPartialGeneration(args) {
  const allLevels = MYTHIC_PLUS_LEVELS.map((item) => item.level);
  if (args.sample) return true;
  if (args.content !== 'all') return true;
  if (args.encounterId) return true;
  if (args.raidFileKey) return true;
  if (!sameNumberSet(args.levels, allLevels)) return true;
  if (Number(args.topMplus) !== DEFAULT_TOP_MPLUS) return true;
  if (Number(args.topRaid) !== DEFAULT_TOP_RAID) return true;
  return false;
}

function isProductionOutputRoot(outputRoot) {
  return path.resolve(outputRoot) === DEFAULT_OUTPUT_ROOT;
}

function validateGenerationScope(args) {
  if (isPartialGeneration(args) && isProductionOutputRoot(args.outputRoot) && !args.allowPartialProduction) {
    throw new Error('局部/取样生成不能写入正式 wcl-presets 目录；请使用 --output-root cos-upload/wcl-presets-test，或明确传 --allow-partial-production。');
  }
}

function selectedSpecs(args) {
  if (args.sample) {
    return [
      getSpecConfig('druid', 104),
      getSpecConfig('monk', 270),
    ].filter(Boolean);
  }
  if (args.specs) {
    return args.specs.split(',').map((item) => {
      const parts = item.split(':');
      return getSpecConfig(parts[0], Number(parts[1]));
    }).filter(Boolean);
  }
  if (args.classKey && args.specId) {
    const spec = getSpecConfig(args.classKey, args.specId);
    if (!spec) throw new Error(`未知专精: ${args.classKey}/${args.specId}`);
    return [spec];
  }
  if (args.classKey) {
    return listSpecs().filter((spec) => spec.classKey === args.classKey);
  }
  return listSpecs();
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

function buildTalentPayload(spec, preset, diagnostics) {
  const talentTree = preset.talents && Array.isArray(preset.talents.talentTree)
    ? preset.talents.talentTree.map((talent) => ({
      id: talent.id,
      rank: talent.rank,
      nodeID: talent.nodeID,
    }))
    : [];
  const changeSetId = spec.talentChangeSetId || 13;
  let exportString = '';
  let exportStringMissingReason = '';
  if (talentTree.length && hasBlueprint(spec.classKey, spec.specId, changeSetId)) {
    try {
      exportString = encodeTalentImportString({
        classKey: spec.classKey,
        specId: spec.specId,
        changeSetId,
        talentTree,
      });
    } catch (err) {
      exportStringMissingReason = 'encode-failed';
      diagnostics.talentEncodeFailures += 1;
      diagnostics.failures.push({
        rank: preset.source.rank,
        player: preset.source.player,
        reason: `talent-encode-failed:${err.message}`,
      });
    }
  } else if (talentTree.length) {
    exportStringMissingReason = 'missing-blueprint';
    diagnostics.missingTalentBlueprints += 1;
  }

  return {
    specId: preset.talents ? preset.talents.specId : null,
    changeSetId,
    talentTree,
    pvpTalents: preset.talents && Array.isArray(preset.talents.pvpTalents)
      ? preset.talents.pvpTalents
      : [],
    exportString,
    ...(exportStringMissingReason ? { exportStringMissingReason } : {}),
  };
}

function compactPreset(spec, preset, diagnostics, context) {
  const slots = {};
  Object.keys(preset.slots || {}).forEach((slotKey) => {
    slots[slotKey] = compactSlot(preset.slots[slotKey]);
  });

  return {
    id: preset.id,
    name: preset.name,
    source: {
      encounterId: preset.source.encounterId,
      encounterName: preset.source.encounterName,
      ...(context && context.encounterLocalName ? { encounterLocalName: context.encounterLocalName } : {}),
      metric: spec.metric,
      rank: preset.source.rank,
      player: preset.source.player,
      amount: Math.round(preset.source.amount || 0),
      server: preset.source.server || null,
      reportCode: preset.source.reportCode || '',
      fightId: preset.source.fightId || null,
      bracket: context && context.bracket ? context.bracket : null,
      ...(context && context.difficulty ? {
        difficulty: context.difficulty,
        difficultyName: context.difficultyName,
      } : {}),
    },
    talents: buildTalentPayload(spec, preset, diagnostics),
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

function listLocalSpecDirs(root) {
  const dataRoot = path.join(root, `data-${DATA_VERSION}`);
  if (!fs.existsSync(dataRoot)) return [];
  const specs = [];
  fs.readdirSync(dataRoot, { withFileTypes: true }).forEach((classDir) => {
    if (!classDir.isDirectory()) return;
    const classPath = path.join(dataRoot, classDir.name);
    fs.readdirSync(classPath, { withFileTypes: true }).forEach((specDir) => {
      if (specDir.isDirectory()) {
        specs.push({ classKey: classDir.name, specId: specDir.name });
      }
    });
  });
  return specs;
}

function writeMiniProgramManifest(root) {
  const lines = [
    'module.exports = {',
    `  dataVersion: '${DATA_VERSION}',`,
    '  entries: {',
  ];
  listLocalSpecDirs(root).forEach((spec) => {
    const specRoot = path.join(root, `data-${DATA_VERSION}`, spec.classKey, spec.specId);
    const indexFile = path.join(specRoot, 'index.js');
    if (!fs.existsSync(indexFile)) return;
    const index = readDataFile(indexFile, null);
    if (!index) return;
    const fileKeys = []
      .concat((index.mythicPlus || []).map((file) => file.fileKey))
      .concat((index.raid || []).map((file) => file.fileKey));
    lines.push(`    '${spec.classKey}:${spec.specId}': {`);
    lines.push(`      index: function () { return require('./data-${DATA_VERSION}/${spec.classKey}/${spec.specId}/index.js'); },`);
    lines.push('      files: {');
    fileKeys.forEach((fileKey) => {
      lines.push(`        '${fileKey}': function () { return require('./data-${DATA_VERSION}/${spec.classKey}/${spec.specId}/${fileKey}.js'); },`);
    });
    lines.push('      },');
    lines.push('    },');
  });
  lines.push('  },', '};', '');
  fs.mkdirSync(root, { recursive: true });
  fs.writeFileSync(path.join(root, 'manifest.js'), lines.join('\n'), 'utf8');
}

async function fetchCombatantPreset(token, spec, encounter, ranking, rankIndex, craftingMap, tooltipOptions) {
  const report = await fetchReportCombatants(token, ranking.report.code);
  const combatant = findCombatant(report, ranking);
  if (!combatant || !combatant.gear || !Array.isArray(combatant.talentTree)) {
    throw new Error('missing-gear-or-talents');
  }
  if (Number(combatant.specID) !== Number(spec.specId)) {
    throw new Error(`wrong-spec-${combatant.specID}`);
  }
  return buildPreset(encounter, ranking, combatant, rankIndex, craftingMap, tooltipOptions);
}

async function collectPresetsForEncounter(token, spec, target, rankingOptions, top, craftingMap, tooltipOptions, context) {
  const failures = [];
  try {
    const { encounter, rankings } = await fetchRankings(
      token,
      target.id,
      spec.className,
      spec.specName,
      spec.metric,
      rankingOptions
    );

    const diagnostics = {
      rankingsReturned: rankings.length,
      failures,
      missingTalentBlueprints: 0,
      talentEncodeFailures: 0,
    };
    const presets = [];
    for (let i = 0; i < rankings.length && presets.length < top; i += 1) {
      const ranking = rankings[i];
      if (!ranking.report || !ranking.report.code) continue;
      try {
        const preset = await fetchCombatantPreset(token, spec, encounter, ranking, i, craftingMap, tooltipOptions);
        presets.push(compactPreset(spec, preset, diagnostics, context));
      } catch (err) {
        failures.push({ rank: i + 1, player: ranking.name, reason: err.message });
      }
    }

    return {
      encounter: {
        id: encounter.id,
        name: encounter.name || target.name,
        localName: target.localName || encounter.name || target.name,
      },
      presets,
      diagnostics,
    };
  } catch (err) {
    return {
      encounter: {
        id: target.id,
        name: target.name,
        localName: target.localName || target.name,
      },
      presets: [],
      diagnostics: {
        rankingsReturned: 0,
        failures: [{ rank: 0, player: '', reason: err.message }],
        missingTalentBlueprints: 0,
        talentEncodeFailures: 0,
      },
    };
  }
}

async function buildMythicPlusFiles(token, spec, args, generatedAt, craftingMap, tooltipOptions, outRoot, miniSpecRoot) {
  if (args.content !== 'all' && args.content !== 'mythic-plus') return [];
  const levels = MYTHIC_PLUS_LEVELS.filter((level) => args.levels.indexOf(level.level) !== -1);
  const dungeons = args.encounterId
    ? MYTHIC_PLUS_DUNGEONS.filter((dungeon) => dungeon.id === args.encounterId)
    : MYTHIC_PLUS_DUNGEONS;
  const files = [];

  for (const level of levels) {
    console.log(`生成 ${spec.classLocalName}${spec.specLocalName} 大秘境 ${level.name} (${spec.metric})...`);
    const entries = [];
    for (const dungeon of dungeons) {
      console.log(`  ${dungeon.localName}`);
      entries.push(await collectPresetsForEncounter(
        token,
        spec,
        dungeon,
        { leaderboard: DEFAULT_LEADERBOARD, bracket: level.bracket },
        args.topMplus,
        craftingMap,
        tooltipOptions,
        { bracket: level.level }
      ));
    }
    const output = {
      schemaVersion: 2,
      generatedAt,
      dataVersion: DATA_VERSION,
      classKey: spec.classKey,
      specId: spec.specId,
      contentType: 'mythic-plus',
      level: level.level,
      bracket: level.bracket,
      requestedTop: args.topMplus,
      rankingMetric: spec.metric,
      entries,
    };
    const presetCount = entries.reduce((total, entry) => total + entry.presets.length, 0);
    files.push({ ...level, dungeonCount: entries.length, presetCount });
    writeJson(path.join(outRoot, `${level.fileKey}.json`), output);
    if (args.writeMiniProgram) writeJsModule(path.join(miniSpecRoot, `${level.fileKey}.js`), output);
    console.log(`  完成 ${level.name}: ${presetCount} 套`);
  }
  return files;
}

async function buildRaidFiles(token, spec, args, generatedAt, craftingMap, tooltipOptions, outRoot, miniSpecRoot) {
  if (args.content !== 'all' && args.content !== 'raid') return [];
  const raids = args.raidFileKey ? RAIDS.filter((raid) => raid.fileKey === args.raidFileKey) : RAIDS;
  const files = [];

  for (const raid of raids) {
    const bosses = args.encounterId
      ? raid.bosses.filter((boss) => boss.id === args.encounterId)
      : raid.bosses;
    if (!bosses.length) continue;
    console.log(`生成 ${spec.classLocalName}${spec.specLocalName} 团本 ${raid.localName} (${spec.metric})...`);
    const entries = [];
    for (const boss of bosses) {
      console.log(`  ${boss.localName}`);
      entries.push(await collectPresetsForEncounter(
        token,
        spec,
        boss,
        { leaderboard: DEFAULT_LEADERBOARD, difficulty: MYTHIC_RAID_DIFFICULTY },
        args.topRaid,
        craftingMap,
        tooltipOptions,
        {
          encounterLocalName: boss.localName,
          difficulty: MYTHIC_RAID_DIFFICULTY,
          difficultyName: raid.difficultyName,
        }
      ));
    }
    const output = {
      schemaVersion: 2,
      generatedAt,
      dataVersion: DATA_VERSION,
      classKey: spec.classKey,
      specId: spec.specId,
      contentType: 'raid',
      zoneId: raid.zoneId,
      raidName: raid.name,
      raidLocalName: raid.localName,
      difficulty: MYTHIC_RAID_DIFFICULTY,
      difficultyName: raid.difficultyName,
      requestedTop: args.topRaid,
      rankingMetric: spec.metric,
      entries,
    };
    const presetCount = entries.reduce((total, entry) => total + entry.presets.length, 0);
    files.push({
      zoneId: raid.zoneId,
      name: raid.localName,
      difficulty: MYTHIC_RAID_DIFFICULTY,
      difficultyName: raid.difficultyName,
      fileKey: raid.fileKey,
      file: `${raid.fileKey}.json`,
      bossCount: entries.length,
      presetCount,
    });
    writeJson(path.join(outRoot, `${raid.fileKey}.json`), output);
    if (args.writeMiniProgram) writeJsModule(path.join(miniSpecRoot, `${raid.fileKey}.js`), output);
    console.log(`  完成 ${raid.localName}: ${presetCount} 套`);
  }
  return files;
}

function buildIndex(spec, generatedAt, mythicPlusFiles, raidFiles) {
  return {
    schemaVersion: 2,
    generatedAt,
    dataVersion: DATA_VERSION,
    classKey: spec.classKey,
    className: spec.className,
    classLocalName: spec.classLocalName,
    specId: spec.specId,
    specName: spec.specName,
    specLocalName: spec.specLocalName,
    role: spec.role,
    rankingMetric: spec.metric,
    mythicPlus: mythicPlusFiles.map((file) => ({
      level: file.level,
      name: file.name,
      fileKey: file.fileKey,
      file: `${file.fileKey}.json`,
      dungeonCount: file.dungeonCount,
      presetCount: file.presetCount,
    })),
    raid: raidFiles,
  };
}

async function buildSpec(token, spec, args, shared) {
  const generatedAt = Date.now();
  const outRoot = path.join(args.outputRoot, `data-${DATA_VERSION}`, spec.classKey, String(spec.specId));
  const miniRoot = path.join(process.cwd(), 'miniprogram', 'data', 'wcl-presets');
  const miniSpecRoot = path.join(miniRoot, `data-${DATA_VERSION}`, spec.classKey, String(spec.specId));

  const mythicPlusFiles = await buildMythicPlusFiles(token, spec, args, generatedAt, shared.craftingMap, shared.tooltipOptions, outRoot, miniSpecRoot);
  const raidFiles = await buildRaidFiles(token, spec, args, generatedAt, shared.craftingMap, shared.tooltipOptions, outRoot, miniSpecRoot);
  const index = buildIndex(spec, generatedAt, mythicPlusFiles, raidFiles);
  writeJson(path.join(outRoot, 'index.json'), index);
  if (args.writeMiniProgram) {
    writeJsModule(path.join(miniSpecRoot, 'index.js'), index);
    writeMiniProgramManifest(miniRoot);
  }
  console.log(`已写入: ${path.relative(process.cwd(), outRoot)}`);
  return index;
}

async function main() {
  const args = parseArgs(process.argv);
  validateGenerationScope(args);
  const specs = selectedSpecs(args);
  if (!specs.length) throw new Error('没有匹配的专精');

  const token = await getWclToken();
  const craftingMap = loadCraftingMap();
  const tooltipCacheFile = path.resolve(process.cwd(), DEFAULT_TOOLTIP_CACHE_FILE);
  const tooltipCache = readJsonFile(tooltipCacheFile, {});
  const tooltipOptions = { locale: 4, cache: tooltipCache, cacheFile: tooltipCacheFile };
  const shared = { craftingMap, tooltipOptions };

  for (const spec of specs) {
    await buildSpec(token, spec, args, shared);
  }

  console.log(`\nWCL 预设生成完成: ${specs.length} 个专精`);
}

if (require.main === module) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = {
  parseArgs,
  selectedSpecs,
  DEFAULT_OUTPUT_ROOT,
  TEST_OUTPUT_ROOT,
  isPartialGeneration,
  isProductionOutputRoot,
  validateGenerationScope,
  compactSlot,
  buildTalentPayload,
  compactPreset,
  buildIndex,
};
