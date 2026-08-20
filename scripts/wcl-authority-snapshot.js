#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { buildDefaultSpecMap, DATA_VERSION } = require('./wcl-preset-config');
const { getSpecCharacterBaseline } = require('../miniprogram/utils/stat-baselines');

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

const DEFAULT_SPEC = buildDefaultSpecMap();

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

const PRIMARY_STAT_BY_MARKER_ID = {
  3: 'agility',
  4: 'strength',
  5: 'intellect',
};

const PRIMARY_STAT_DISPLAY = {
  strength: '力量',
  agility: '敏捷',
  intellect: '智力',
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

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const WCL_MAX_RETRIES = Number(process.env.WCL_MAX_RETRIES) || 6;

// 撞限流(429)或服务端错误(5xx)时退避重试，等额度恢复再继续，而不是直接失败。
async function wclGql(token, query, variables, options = {}) {
  const maxRetries = options.maxRetries != null ? options.maxRetries : WCL_MAX_RETRIES;
  for (let attempt = 0; ; attempt += 1) {
    const res = await fetch(`${WCL_BASE}/api/v2/client`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query, variables }),
    });
    const body = await res.text();

    // HTTP 层限流/服务端错误：退避重试
    if ((res.status === 429 || res.status >= 500) && attempt < maxRetries) {
      const retryAfter = Number(res.headers?.get?.('retry-after'));
      const waitMs = retryAfter > 0
        ? Math.min(retryAfter * 1000, 120000)
        : Math.min(2000 * (2 ** attempt), 120000);
      console.warn(`WCL ${res.status}，限流/服务端错误，第 ${attempt + 1}/${maxRetries} 次退避，等待 ${Math.round(waitMs / 1000)}s...`);
      await sleep(waitMs);
      continue;
    }

    let json;
    try {
      json = body ? JSON.parse(body) : {};
    } catch (err) {
      throw new Error(`WCL GraphQL 返回非 JSON ${res.status}: ${body.slice(0, 300)}`);
    }
    if (!res.ok) {
      throw new Error(`WCL GraphQL HTTP ${res.status}: ${body.slice(0, 500)}`);
    }
    if (json.errors) {
      const message = JSON.stringify(json.errors);
      // 有时限流以 200 + errors 形式返回，识别后同样退避重试
      if (/rate limit|too many|exceeded|throttl/i.test(message) && attempt < maxRetries) {
        const waitMs = Math.min(2000 * (2 ** attempt), 120000);
        console.warn(`WCL 限流(GraphQL errors)，第 ${attempt + 1}/${maxRetries} 次退避，等待 ${Math.round(waitMs / 1000)}s...`);
        await sleep(waitMs);
        continue;
      }
      throw new Error(`WCL GraphQL 错误: ${message}`);
    }
    if (json.error || json.message) {
      throw new Error(`WCL GraphQL 异常响应: ${JSON.stringify(json).slice(0, 500)}`);
    }
    if (!json.data) {
      throw new Error(`WCL GraphQL 缺少 data: ${JSON.stringify(json).slice(0, 500)}`);
    }
    return json.data;
  }
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

async function fetchTalentImportCode(token, code, fightId, actorID) {
  if (!code || !Number(actorID)) return '';
  const data = await wclGql(token, `
    query($code: String!, $fightIDs: [Int], $actorID: Int!) {
      reportData {
        report(code: $code) {
          fights(fightIDs: $fightIDs) {
            id
            talentImportCode(actorID: $actorID)
          }
        }
      }
    }`, {
    code,
    fightIDs: Number(fightId) ? [Number(fightId)] : null,
    actorID: Number(actorID),
  });
  const fights = (data.reportData.report && data.reportData.report.fights) || [];
  const codeString = fights[0] && fights[0].talentImportCode;
  return typeof codeString === 'string' ? codeString : '';
}

function findCombatant(report, ranking) {
  if (!report) return null;
  const actors = report.masterData.actors || [];
  const events = (report.events && report.events.data) || [];
  const actor = actors.find((item) => item.name === ranking.name && (!ranking.class || item.subType === ranking.class))
    || actors.find((item) => item.name === ranking.name);
  const fightId = ranking.report && Number(ranking.report.fightID);
  if (!actor || !fightId) return null;
  return events.find((item) => item.sourceID === actor.id
    && Number(item.fight) === fightId
    && item.gear
    && (!ranking.specID || Number(item.specID) === Number(ranking.specID))) || null;
}

function readCombatantNumber(combatant, field) {
  const value = combatant && combatant[field];
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
    throw new Error(`缺少或无效 WCL 总属性字段: ${field}`);
  }
  return value;
}

function combatantRatingPreference(options = {}) {
  if (options.role === 'healer') return ['Spell', 'Melee', 'Ranged'];
  if (options.classKey === 'hunter') return ['Ranged', 'Melee', 'Spell'];
  return ['Melee', 'Ranged', 'Spell'];
}

function readCombatantRating(combatant, prefix, preference) {
  const fields = preference.map((suffix) => prefix + suffix);
  for (let index = 0; index < fields.length; index += 1) {
    const field = fields[index];
    if (typeof (combatant || {})[field] !== 'undefined' && (combatant || {})[field] !== null) {
      return { value: readCombatantNumber(combatant, field), field };
    }
  }
  throw new Error(`缺少 WCL 总属性字段: ${fields.join('/')}`);
}

function extractCombatantStats(combatant, options = {}) {
  const preference = combatantRatingPreference(options);
  const crit = readCombatantRating(combatant, 'crit', preference);
  const haste = readCombatantRating(combatant, 'haste', preference);
  const fixedFields = {
    strength: 'strength',
    agility: 'agility',
    intellect: 'intellect',
    stamina: 'stamina',
    armor: 'armor',
    mastery: 'mastery',
    versatility: 'versatilityDamageDone',
  };
  const stats = {
    crit: crit.value,
    haste: haste.value,
    fieldSources: {
      crit: crit.field,
      haste: haste.field,
    },
  };
  Object.keys(fixedFields).forEach((key) => {
    const field = fixedFields[key];
    stats[key] = readCombatantNumber(combatant, field);
    stats.fieldSources[key] = field;
  });
  return stats;
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

function parsePositiveMarkerValue(rawValue, label) {
  const value = Number(String(rawValue || '').replace(/,/g, ''));
  if (!Number.isFinite(value) || value <= 0 || Math.floor(value) !== value) {
    throw new Error(`无效${label}数值: ${rawValue || '(空)'}`);
  }
  return value;
}

function aggregateStats(stats) {
  const byType = {};
  const ordered = [];
  stats.forEach((stat) => {
    if (!byType[stat.type]) {
      byType[stat.type] = Object.assign({}, stat);
      ordered.push(byType[stat.type]);
    } else {
      byType[stat.type].value += stat.value;
    }
  });
  return ordered;
}

function parseActualSecondaryStats(tooltip) {
  const source = String(tooltip || '');
  const section = source.match(/<!--ebstats-->([\s\S]*?)<!--egstats-->/);
  if (!section) return [];
  const body = section[1];
  const stats = [];
  const marker = /<!--rtg(\d+)-->/g;
  let match = marker.exec(body);
  while (match) {
    const ratingId = Number(match[1]);
    const nextMarker = marker.lastIndex;
    const following = body.slice(nextMarker, body.indexOf('<!--rtg', nextMarker) === -1 ? body.length : body.indexOf('<!--rtg', nextMarker));
    const type = STAT_TYPE_BY_RATING_ID[ratingId];
    if (type) {
      const valueMatch = following.match(/^[\s+<\/a-zA-Z="'#;:.-]*([0-9][0-9,]*)/);
      if (!valueMatch) throw new Error(`无效绿字数值: rtg${ratingId}`);
      stats.push({
        type,
        name: STAT_DISPLAY[type],
        value: parsePositiveMarkerValue(valueMatch[1], '绿字'),
      });
    }
    match = marker.exec(body);
  }
  return aggregateStats(stats);
}

function parseItemSnapshotFromTooltip(tooltipData, options = {}) {
  const tooltip = tooltipData && String(tooltipData.tooltip || '');
  const name = tooltipData && typeof tooltipData.name === 'string' ? tooltipData.name.trim() : '';
  if (!name) throw new Error('无法确定装备名称');
  if (!tooltip.trim()) throw new Error('无法确定绿字解析状态：物品说明为空');

  const primary = [];
  let stamina = null;
  const statMarker = /<!--stat(\d+)-->([\s\S]*?)(?=<!--stat\d+-->|<!--ebstats-->|<!--|$)/g;
  let statMatch = statMarker.exec(tooltip);
  while (statMatch) {
    const markerId = Number(statMatch[1]);
    const supportedType = PRIMARY_STAT_BY_MARKER_ID[markerId]
      || ((markerId === 71 || markerId === 74) && options.primaryType);
    if (supportedType || markerId === 7) {
      const valueMatch = statMatch[2].match(/\+?\s*([0-9][0-9,]*)/);
      const value = parsePositiveMarkerValue(valueMatch && valueMatch[1], markerId === 7 ? '耐力' : '主属性');
      if (markerId === 7) {
        stamina = stamina ? { name: '耐力', value: stamina.value + value } : { name: '耐力', value };
      } else {
        primary.push({ type: supportedType, name: PRIMARY_STAT_DISPLAY[supportedType], value });
      }
    }
    statMatch = statMarker.exec(tooltip);
  }

  const armorMatch = tooltip.match(/<!--amr-->([^<]*)/);
  const armor = armorMatch
    ? parsePositiveMarkerValue((armorMatch[1].match(/([0-9][0-9,]*)/) || [])[1], '护甲')
    : 0;
  return {
    name,
    primaryStats: aggregateStats(primary),
    stamina,
    armor,
    secondaryStats: parseActualSecondaryStats(tooltip),
  };
}

function parseCraftedStatsFromTooltip(tooltip) {
  return parseActualSecondaryStats(tooltip).map((stat) => Object.assign({}, stat, {
    ratingId: Object.keys(STAT_TYPE_BY_RATING_ID).map(Number).find((id) => STAT_TYPE_BY_RATING_ID[id] === stat.type),
  }));
}

async function resolveGearStats(slotEntry, gearItem, craftingMap, tooltipOptions) {
  const crafted = isCraftedCandidate(gearItem, craftingMap);
  const craftedItem = (craftingMap.craftedItems && craftingMap.craftedItems[String(gearItem.id)]) || {};
  const tooltip = await fetchWowheadTooltip(gearItem, tooltipOptions);
  const snapshot = parseItemSnapshotFromTooltip(tooltip, tooltipOptions);
  const result = {
    ...slotEntry,
    snapshotStatus: 'resolved',
    snapshot,
    snapshotSource: tooltip.url,
  };
  if (crafted) {
    result.crafted = true;
    result.craftedName = tooltip.name || craftedItem.name || '';
    result.craftedStats = snapshot.secondaryStats.map((stat, index) => ({
      ...stat,
      randomAttributeIndex: index + 1,
    }));
    result.craftedStatsSource = tooltip.url;
  }
  return result;
}

async function resolveCrafting(slotEntry, gearItem, craftingMap, tooltipOptions) {
  return resolveGearStats(slotEntry, gearItem, craftingMap, tooltipOptions);
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
    slots[slotKey] = await resolveGearStats(entry, gearItem, craftingMap, tooltipOptions);
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
      score: ranking.score != null ? ranking.score : null,
    },
    talents: {
      specId: combatant.specID || null,
      talentTree,
      pvpTalents,
      exportString: '',
    },
    combatantStats: extractCombatantStats(combatant, tooltipOptions),
    slots: await gearToSlots(combatant.gear || [], craftingMap, Object.assign({}, tooltipOptions, {
      primaryType: (getSpecCharacterBaseline(combatant.specID) || {}).primaryType || '',
    })),
  };
}

function defaultOutputFile(args, encounter) {
  const safeName = String(encounter.name || args.encounterId).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return path.join(
    process.cwd(),
    'cos-upload',
    'wcl-authority-presets',
    `data-${DATA_VERSION}`,
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
  fetchTalentImportCode,
  findCombatant,
  extractCombatantStats,
  combatantRatingPreference,
  loadCraftingMap,
  readJsonFile,
  writeJsonFile,
  buildWowheadTooltipUrl,
  normalizeBonusIDs,
  hasCraftingBonusSignature,
  parseCraftedStatsFromTooltip,
  parseActualSecondaryStats,
  parseItemSnapshotFromTooltip,
  resolveGearStats,
  resolveCrafting,
  gearToSlots,
  buildPreset,
};
