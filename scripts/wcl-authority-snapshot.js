#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const WCL_BASE = 'https://www.warcraftlogs.com';
const SLOT_BY_GEAR_INDEX = {
  0: 'head',
  1: 'neck',
  2: 'shoulder',
  4: 'chest',
  5: 'waist',
  6: 'legs',
  7: 'feet',
  8: 'wrist',
  9: 'hand',
  10: 'finger1',
  11: 'finger2',
  12: 'trinket1',
  13: 'trinket2',
  14: 'cloak',
  15: 'weapon',
  16: 'weapon2',
};

const DEFAULT_SPEC = {
  mage: {
    62: { className: 'Mage', specName: 'Arcane', localName: '奥术' },
    63: { className: 'Mage', specName: 'Fire', localName: '火焰' },
    64: { className: 'Mage', specName: 'Frost', localName: '冰霜' },
  },
};

const STAT_DISPLAY = {
  crit: '暴击',
  haste: '急速',
  mastery: '精通',
  versatility: '全能',
};

const STAT_TYPE_BY_RATING_ID = {
  32: 'crit',
  36: 'haste',
  40: 'versatility',
  49: 'mastery',
};

const WOWHEAD_TOOLTIP_BASE = 'https://nether.wowhead.com/tooltip/item';
const DEFAULT_TOOLTIP_CACHE_FILE = path.join(process.cwd(), '.cache', 'wcl-authority-wowhead-tooltips.json');
const DEFAULT_LEADERBOARD = 'LogsOnly';

function parseArgs(argv) {
  const args = {
    classKey: 'mage',
    specId: 63,
    encounterId: 361753,
    top: 3,
    metric: 'dps',
    leaderboard: DEFAULT_LEADERBOARD,
    bracket: null,
    out: '',
    tooltipCache: DEFAULT_TOOLTIP_CACHE_FILE,
  };
  for (let i = 2; i < argv.length; i += 1) {
    const key = argv[i];
    const val = argv[i + 1];
    if (key === '--class-key') { args.classKey = val; i += 1; }
    else if (key === '--spec-id') { args.specId = Number(val); i += 1; }
    else if (key === '--wcl-class') { args.wclClass = val; i += 1; }
    else if (key === '--wcl-spec') { args.wclSpec = val; i += 1; }
    else if (key === '--encounter-id') { args.encounterId = Number(val); i += 1; }
    else if (key === '--top') { args.top = Number(val); i += 1; }
    else if (key === '--metric') { args.metric = val; i += 1; }
    else if (key === '--leaderboard') { args.leaderboard = val; i += 1; }
    else if (key === '--bracket') { args.bracket = Number(val); i += 1; }
    else if (key === '--out') { args.out = val; i += 1; }
    else if (key === '--tooltip-cache') { args.tooltipCache = val; i += 1; }
  }
  return args;
}

function assertEnv(name) {
  if (!process.env[name]) throw new Error(`缺少环境变量 ${name}`);
  return process.env[name];
}

async function getWclToken() {
  const basic = Buffer.from(`${assertEnv('WCL_CLIENT_ID')}:${assertEnv('WCL_CLIENT_SECRET')}`).toString('base64');
  const res = await fetch(`${WCL_BASE}/oauth/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basic}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });
  if (!res.ok) throw new Error(`WCL OAuth 失败 ${res.status}: ${await res.text()}`);
  return (await res.json()).access_token;
}

async function wclGql(token, query, variables) {
  const res = await fetch(`${WCL_BASE}/api/v2/client`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (json.errors) throw new Error(`WCL GraphQL 错误: ${JSON.stringify(json.errors)}`);
  return json.data;
}

async function fetchRankings(token, encounterId, className, specName, metric, options = {}) {
  const bracketArgument = Number(options.bracket) ? ', bracket: $bracket' : '';
  const difficultyArgument = Number(options.difficulty) ? ', difficulty: $difficulty' : '';
  const leaderboard = ['Any', 'LogsOnly'].indexOf(options.leaderboard) !== -1
    ? options.leaderboard
    : DEFAULT_LEADERBOARD;
  const data = await wclGql(token, `
    query($encounterId: Int!, $class: String!, $spec: String!, $metric: CharacterRankingMetricType!${Number(options.bracket) ? ', $bracket: Int!' : ''}${Number(options.difficulty) ? ', $difficulty: Int!' : ''}) {
      worldData {
        encounter(id: $encounterId) {
          id
          name
          characterRankings(className: $class, specName: $spec, metric: $metric, leaderboard: ${leaderboard}${bracketArgument}${difficultyArgument})
        }
      }
    }`, {
    encounterId,
    class: className,
    spec: specName,
    metric,
    ...(Number(options.bracket) ? { bracket: Number(options.bracket) } : {}),
    ...(Number(options.difficulty) ? { difficulty: Number(options.difficulty) } : {}),
  });
  const encounter = data.worldData.encounter;
  const rankings = (encounter.characterRankings && encounter.characterRankings.rankings) || [];
  return { encounter, rankings };
}

async function fetchReportCombatants(token, code) {
  const data = await wclGql(token, `
    query($code: String!) {
      reportData {
        report(code: $code) {
          masterData { actors(type: "Player") { id name subType } }
          events(dataType: CombatantInfo, startTime: 0, endTime: 999999999, limit: 300) { data }
        }
      }
    }`, { code });
  return data.reportData.report;
}

function findCombatant(report, ranking) {
  if (!report) return null;
  const actors = report.masterData.actors || [];
  const events = (report.events && report.events.data) || [];
  const actor = actors.find((item) => item.name === ranking.name && (!ranking.class || item.subType === ranking.class))
    || actors.find((item) => item.name === ranking.name);
  const fightId = ranking.report && Number(ranking.report.fightID);
  const sameFight = function (item) {
    return !fightId || Number(item.fight) === fightId;
  };
  if (actor) {
    const byActor = events.find((item) => item.sourceID === actor.id && item.gear && sameFight(item))
      || events.find((item) => item.sourceID === actor.id && item.gear);
    if (byActor && byActor.gear) return byActor;
  }
  return events.find((item) => item.gear && item.gear.length >= 16 && sameFight(item) && (!ranking.specID || item.specID === ranking.specID))
    || events.find((item) => item.gear && item.gear.length >= 16)
    || null;
}

function loadCraftingMap() {
  const file = path.join(__dirname, 'wcl-authority-crafting-map.json');
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function readJsonFile(file, fallback) {
  try {
    if (!file || !fs.existsSync(file)) return fallback;
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (err) {
    return fallback;
  }
}

function writeJsonFile(file, data) {
  if (!file) return;
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
}

function normalizeBonusIDs(bonusIDs) {
  return (bonusIDs || []).map(Number).filter(Boolean).join(',');
}

function hasCraftingBonusSignature(bonusIDs) {
  const set = new Set((bonusIDs || []).map(Number).filter(Boolean));
  return set.has(12214) && set.has(12497) && set.has(12066);
}

function isCraftedCandidate(gearItem, craftingMap) {
  if (!gearItem || !gearItem.id) return false;
  if (craftingMap.craftedItems && craftingMap.craftedItems[String(gearItem.id)]) return true;
  return hasCraftingBonusSignature(gearItem.bonusIDs);
}

function tooltipCacheKey(gearItem, locale) {
  return [
    gearItem.id,
    normalizeBonusIDs(gearItem.bonusIDs),
    locale || 4,
  ].join('|');
}

function buildWowheadTooltipUrl(gearItem, locale) {
  const bonusIDs = normalizeBonusIDs(gearItem.bonusIDs).replace(/,/g, ':');
  const query = new URLSearchParams({
    dataEnv: '1',
    locale: String(locale || 4),
  });
  if (bonusIDs) query.set('bonus', bonusIDs);
  return `${WOWHEAD_TOOLTIP_BASE}/${gearItem.id}?${query.toString()}`;
}

async function fetchWowheadTooltip(gearItem, options) {
  const opts = options || {};
  const locale = opts.locale || 4;
  const cache = opts.cache || {};
  const cacheKey = tooltipCacheKey(gearItem, locale);
  if (cache[cacheKey]) return cache[cacheKey];
  if (opts.tooltipResolver) {
    const resolved = await opts.tooltipResolver(gearItem, { locale, cacheKey });
    cache[cacheKey] = resolved;
    return resolved;
  }

  const url = buildWowheadTooltipUrl(gearItem, locale);
  const res = await fetch(url, {
    headers: {
      'user-agent': 'Mozilla/5.0',
      accept: 'application/json,text/plain,*/*',
    },
  });
  if (!res.ok) {
    throw new Error(`Wowhead tooltip 失败 ${res.status}: ${await res.text()}`);
  }
  const json = await res.json();
  cache[cacheKey] = {
    url,
    name: json.name || '',
    icon: json.icon || '',
    quality: json.quality || null,
    tooltip: json.tooltip || '',
  };
  if (opts.cacheFile) writeJsonFile(opts.cacheFile, cache);
  return cache[cacheKey];
}

function htmlDecode(text) {
  return String(text || '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#039;/g, "'")
    .replace(/&quot;/g, '"');
}

function parseCraftedStatsFromTooltip(tooltip) {
  const stats = [];
  const regex = /<!--rtg(\d+)-->\s*([0-9,]+)\s*([^<]+)/g;
  let match = regex.exec(tooltip || '');
  while (match) {
    const ratingId = Number(match[1]);
    const type = STAT_TYPE_BY_RATING_ID[ratingId];
    if (type) {
      stats.push({
        type,
        name: STAT_DISPLAY[type] || htmlDecode(match[3]).trim(),
        value: Number(String(match[2]).replace(/,/g, '')) || 0,
        ratingId,
      });
    }
    match = regex.exec(tooltip || '');
  }
  return stats;
}

async function resolveCrafting(slotEntry, gearItem, craftingMap, tooltipOptions) {
  if (!isCraftedCandidate(gearItem, craftingMap)) return slotEntry;
  const craftedItem = (craftingMap.craftedItems && craftingMap.craftedItems[String(gearItem.id)]) || {};
  const key = `${gearItem.id}|${normalizeBonusIDs(gearItem.bonusIDs)}`;
  try {
    const tooltip = await fetchWowheadTooltip(gearItem, tooltipOptions);
    const stats = parseCraftedStatsFromTooltip(tooltip.tooltip);
    if (!stats.length) {
      return {
        ...slotEntry,
        crafted: true,
        craftedName: tooltip.name || craftedItem.name || '',
        craftedStatsUnknown: true,
        missingCraftingTooltip: key,
        craftedStatsSource: tooltip.url,
      };
    }
    return {
      ...slotEntry,
      crafted: true,
      craftedName: tooltip.name || craftedItem.name || '',
      craftedStats: stats.map((stat, index) => ({
        ...stat,
        randomAttributeIndex: index + 1,
      })),
      craftedStatsSource: tooltip.url,
    };
  } catch (err) {
    return {
      ...slotEntry,
      crafted: true,
      craftedName: craftedItem.name || '',
      craftedStatsUnknown: true,
      missingCraftingTooltip: key,
      craftedStatsError: err.message,
    };
  }
}

async function gearToSlots(gear, craftingMap, tooltipOptions) {
  const slots = {};
  for (const index of Object.keys(SLOT_BY_GEAR_INDEX)) {
    const gearItem = gear[Number(index)];
    if (!gearItem || !gearItem.id) continue;
    const slotKey = SLOT_BY_GEAR_INDEX[index];
    const entry = {
      itemId: gearItem.id,
      ilvl: gearItem.itemLevel || 0,
      bonusIDs: gearItem.bonusIDs || [],
    };
    if (gearItem.permanentEnchant) entry.permanentEnchant = gearItem.permanentEnchant;
    if (Array.isArray(gearItem.gems) && gearItem.gems.length) entry.gems = gearItem.gems;
    slots[slotKey] = await resolveCrafting(entry, gearItem, craftingMap, tooltipOptions);
  }
  return slots;
}

async function buildPreset(encounter, ranking, combatant, rankIndex, craftingMap, tooltipOptions) {
  const talentTree = Array.isArray(combatant.talentTree) ? combatant.talentTree : [];
  const pvpTalents = Array.isArray(combatant.pvpTalents) ? combatant.pvpTalents : [];
  return {
    id: `wcl-${encounter.id}-rank-${rankIndex + 1}`,
    name: `#${rankIndex + 1} ${ranking.name}`,
    source: {
      provider: 'Warcraft Logs',
      encounterId: encounter.id,
      encounterName: encounter.name,
      metric: 'dps',
      rank: rankIndex + 1,
      player: ranking.name,
      amount: ranking.amount || 0,
      server: ranking.server || null,
      reportCode: ranking.report && ranking.report.code,
      fightId: ranking.report && ranking.report.fightID,
      bracket: ranking.bracketData || null,
    },
    talents: {
      specId: combatant.specID || null,
      talentTree,
      pvpTalents,
      exportString: '',
    },
    slots: await gearToSlots(combatant.gear || [], craftingMap, tooltipOptions),
  };
}

function defaultOutputFile(args, encounter) {
  const safeName = String(encounter.name || args.encounterId).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return path.join(
    process.cwd(),
    'cos-upload',
    'wcl-authority-presets',
    'data-4.4.x',
    args.classKey,
    String(args.specId),
    `${safeName}-top${args.top}.json`
  );
}

function writeJson(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
}

async function main() {
  const args = parseArgs(process.argv);
  const specDefaults = DEFAULT_SPEC[args.classKey] && DEFAULT_SPEC[args.classKey][args.specId];
  const className = args.wclClass || (specDefaults && specDefaults.className);
  const specName = args.wclSpec || (specDefaults && specDefaults.specName);
  if (!className || !specName) throw new Error('无法推断 WCL class/spec，请传 --wcl-class 和 --wcl-spec');

  const token = await getWclToken();
  const craftingMap = loadCraftingMap();
  const tooltipCacheFile = path.resolve(process.cwd(), args.tooltipCache);
  const tooltipCache = readJsonFile(tooltipCacheFile, {});
  const tooltipOptions = { locale: 4, cache: tooltipCache, cacheFile: tooltipCacheFile };
  const { encounter, rankings } = await fetchRankings(token, args.encounterId, className, specName, args.metric, {
    leaderboard: args.leaderboard,
    bracket: args.bracket,
  });
  const presets = [];
  const failures = [];
  const missingCraftingTooltips = [];

  for (let i = 0; i < rankings.length && presets.length < args.top; i += 1) {
    const ranking = rankings[i];
    if (!ranking.report || !ranking.report.code) continue;
    try {
      const report = await fetchReportCombatants(token, ranking.report.code);
      const combatant = findCombatant(report, ranking);
      if (!combatant || !combatant.gear) {
        failures.push({ rank: i + 1, player: ranking.name, reason: 'no-combatant-gear' });
        continue;
      }
      const preset = await buildPreset(encounter, ranking, combatant, presets.length, craftingMap, tooltipOptions);
      Object.keys(preset.slots || {}).forEach((slotKey) => {
        const slot = preset.slots[slotKey];
        if (slot && slot.missingCraftingTooltip) {
          missingCraftingTooltips.push({
            preset: preset.id,
            player: ranking.name,
            slot: slotKey,
            itemId: slot.itemId,
            craftedName: slot.craftedName,
            key: slot.missingCraftingTooltip,
            error: slot.craftedStatsError || '',
          });
        }
      });
      presets.push(preset);
    } catch (err) {
      failures.push({ rank: i + 1, player: ranking.name, reason: err.message });
    }
  }

  const output = {
    schemaVersion: 1,
    generatedAt: Date.now(),
    classKey: args.classKey,
    className,
    specId: args.specId,
    specName,
    specLocalName: specDefaults ? specDefaults.localName : '',
    encounter: {
      id: encounter.id,
      name: encounter.name,
    },
    rankingFilter: {
      metric: args.metric,
      leaderboard: args.leaderboard,
      bracket: args.bracket || null,
    },
    requestedTop: args.top,
    presets,
    diagnostics: {
      rankingsReturned: rankings.length,
      failures,
      missingCraftingTooltips,
    },
  };

  const outFile = args.out ? path.resolve(process.cwd(), args.out) : defaultOutputFile(args, encounter);
  writeJson(outFile, output);
  console.log(`已生成: ${path.relative(process.cwd(), outFile)}`);
  console.log(`预设: ${presets.length}, 缺失制造业 tooltip: ${missingCraftingTooltips.length}`);
}

if (require.main === module) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = {
  DEFAULT_SPEC,
  DEFAULT_TOOLTIP_CACHE_FILE,
  DEFAULT_LEADERBOARD,
  parseArgs,
  getWclToken,
  wclGql,
  fetchRankings,
  fetchReportCombatants,
  findCombatant,
  loadCraftingMap,
  readJsonFile,
  writeJsonFile,
  buildWowheadTooltipUrl,
  normalizeBonusIDs,
  hasCraftingBonusSignature,
  parseCraftedStatsFromTooltip,
  resolveCrafting,
  gearToSlots,
  buildPreset,
};
