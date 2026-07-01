#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { LOCALE_PRESETS, getLocaleConfig } = require('./fetch-blizzard-localization');
const { DATA_VERSION, listSpecs } = require('./wcl-preset-config');
const NAME_MAP = require('./wcl-name-map.json');

const DEFAULT_COS_BASE = process.env.WCL_COS_BASE || 'https://wowlook-1308073800.cos.ap-guangzhou.myqcloud.com';
const DEFAULT_LOCAL_ROOT = path.join(process.cwd(), 'cos-upload', 'wcl-presets', `data-${DATA_VERSION}`);
const DEFAULT_OUT_ROOT = path.join(process.cwd(), 'web', 'locales');
const DEFAULT_WAGO_VERSION = process.env.WAGO_DB2_VERSION || '12.0.7.67808';
const WAGO_LOCALES = {
  'en-US': 'enUS',
  'en-GB': 'enGB',
  'de-DE': 'deDE',
  'fr-FR': 'frFR',
  'es-ES': 'esES',
  'es-MX': 'esMX',
  'pt-BR': 'ptBR',
  'it-IT': 'itIT',
  'ru-RU': 'ruRU',
  'ko-KR': 'koKR',
  'zh-TW': 'zhTW',
  'zh-CN': 'zhCN',
};
const STAT_WORDS = {
  'en-US': { agility: 'Agility', intellect: 'Intellect', strength: 'Strength', stamina: 'Stamina', armor: 'Armor', mana: 'Mana' },
  'en-GB': { agility: 'Agility', intellect: 'Intellect', strength: 'Strength', stamina: 'Stamina', armor: 'Armor', mana: 'Mana' },
  'de-DE': { agility: 'Beweglichkeit', intellect: 'Intelligenz', strength: 'Stärke', stamina: 'Ausdauer', armor: 'Rüstung', mana: 'Mana' },
  'fr-FR': { agility: 'Agilité', intellect: 'Intelligence', strength: 'Force', stamina: 'Endurance', armor: 'Armure', mana: 'mana' },
  'es-ES': { agility: 'Agilidad', intellect: 'Intelecto', strength: 'Fuerza', stamina: 'Aguante', armor: 'Armadura', mana: 'maná' },
  'es-MX': { agility: 'Agilidad', intellect: 'Intelecto', strength: 'Fuerza', stamina: 'Aguante', armor: 'Armadura', mana: 'maná' },
  'pt-BR': { agility: 'Agilidade', intellect: 'Intelecto', strength: 'Força', stamina: 'Vigor', armor: 'Armadura', mana: 'mana' },
  'it-IT': { agility: 'Agilità', intellect: 'Intelletto', strength: 'Forza', stamina: 'Tempra', armor: 'Armatura', mana: 'mana' },
  'ru-RU': { agility: 'Ловкость', intellect: 'Интеллект', strength: 'Сила', stamina: 'Выносливость', armor: 'Броня', mana: 'маны' },
  'ko-KR': { agility: '민첩성', intellect: '지능', strength: '힘', stamina: '체력', armor: '방어도', mana: '마나' },
  'zh-TW': { agility: '敏捷', intellect: '智力', strength: '力量', stamina: '耐力', armor: '護甲', mana: '法力' },
  'zh-CN': { agility: '敏捷', intellect: '智力', strength: '力量', stamina: '耐力', armor: '护甲', mana: '法力' },
};
const NUMERIC_ENCHANTS = {
  2841: (s) => `+3 ${s.stamina}`,
  7935: (s) => `+41 ${s.intellect} & +115 ${s.stamina}`,
  7937: (s) => `+41 ${s.intellect} & +4% ${s.mana}`,
  8159: (s) => `+41 ${s.agility}/${s.strength} & +115 ${s.stamina}`,
  8163: (s) => `+41 ${s.agility}/${s.strength} & +27 ${s.armor}`,
};
const TEMPLATE_VALUES_BY_ENCHANT = {
  7935: { 1: '41', 2: '115' },
  8159: { 1: '115', 2: '41' },
  8163: { 1: '27', 2: '41' },
};

function parseArgs(argv = process.argv.slice(2)) {
  const args = {};
  argv.forEach((arg) => {
    if (!arg.startsWith('--')) return;
    const [key, ...rest] = arg.slice(2).split('=');
    args[key] = rest.length ? rest.join('=') : true;
  });
  return args;
}

function isEnabled(value) {
  return value === true || value === 'true' || value === '1' || value === 'yes';
}

function printHelp() {
  console.log(`Usage:
  node scripts/fetch-wcl-name-localization.js --allLocales --source=local
  node scripts/fetch-wcl-name-localization.js --allLocales --source=cos
  node scripts/fetch-wcl-name-localization.js --outLocale=de-DE --skipExisting

Options:
  --source=<official|local|cos>  Use Wago full DB2 tables, local WCL files, or current COS files. Default: official
  --inputRoot=<path>    Local WCL data root. Default: cos-upload/wcl-presets/data-${DATA_VERSION}
  --cosBase=<url>       COS origin. Default: WCL_COS_BASE or project COS
  --wagoVersion=<ver>   Wago DB2 build. Default: WAGO_DB2_VERSION or ${DEFAULT_WAGO_VERSION}
  --outLocale=<web>     One web locale, for example de-DE
  --allLocales          Generate every supported locale
  --outRoot=<path>      Locale output root. Default: web/locales
  --skipExisting        Reuse names already present in web/locales/{locale}/wcl-names.json
  --listIds             Print scanned IDs and exit without Blizzard credentials
  --help                Print this help
`);
}

function addSlotIds(slot, bucket) {
  if (!slot || typeof slot !== 'object') return;
  if (slot.permanentEnchant) bucket.enchants.add(String(slot.permanentEnchant));
  (slot.gems || []).forEach((gem) => {
    if (gem?.id) bucket.gems.add(String(gem.id));
  });
}

function collectWclIdsFromObject(data, bucket = { enchants: new Set(), gems: new Set() }) {
  (data.entries || []).forEach((entry) => {
    (entry.presets || []).forEach((preset) => {
      Object.values(preset.slots || {}).forEach((slot) => addSlotIds(slot, bucket));
    });
  });
  return bucket;
}

function collectWclIdsFromLocal(rootDir) {
  const bucket = { enchants: new Set(), gems: new Set() };
  function walk(dir) {
    if (!fs.existsSync(dir)) return;
    fs.readdirSync(dir, { withFileTypes: true }).forEach((entry) => {
      const filePath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(filePath);
        return;
      }
      if (!entry.name.endsWith('.json') || entry.name === 'index.json') return;
      collectWclIdsFromObject(JSON.parse(fs.readFileSync(filePath, 'utf8')), bucket);
    });
  }
  walk(rootDir);
  return bucket;
}

async function requestJson(url, options = {}) {
  const response = await fetch(url, options);
  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`${response.status} ${response.statusText}: ${body.slice(0, 180)}`);
  }
  return response.json();
}

async function requestText(url, options = {}) {
  const response = await fetch(url, options);
  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`${response.status} ${response.statusText}: ${body.slice(0, 180)}`);
  }
  return response.text();
}

function parseCsvLine(line) {
  const columns = [];
  let current = '';
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      if (quoted && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        quoted = !quoted;
      }
    } else if (char === ',' && !quoted) {
      columns.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  columns.push(current);
  return columns;
}

function parseCsvObjects(csvText) {
  const lines = String(csvText || '').split(/\r?\n/).filter(Boolean);
  if (!lines.length) return [];
  const headers = parseCsvLine(lines[0]);
  return lines.slice(1).map((line) => {
    const cols = parseCsvLine(line);
    return Object.fromEntries(headers.map((header, index) => [header, cols[index] || '']));
  });
}

async function fetchWagoCsv(table, { locale = '', version = DEFAULT_WAGO_VERSION } = {}) {
  const params = new URLSearchParams();
  if (locale) params.set('locale', locale);
  if (version) params.set('version', version);
  const suffix = params.toString() ? `?${params.toString()}` : '';
  return requestText(`https://wago.tools/db2/${table}/csv${suffix}`);
}

function stripWagoMarkup(name) {
  return String(name || '')
    .replace(/\|A:[^|]*\|a/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// 去掉部位前缀: "Enchant Helm - X" / "附魔头盔 - X" / "Helm – X" / "Bottes – X" -> "X"
// 只截首个「空格+连字符/短横+空格」分隔; 数字附魔("+3 Stamina")无此分隔, 原样返回。
function stripEnchantSlotPrefix(name) {
  const text = String(name || '').trim();
  const match = text.match(/^\S.*?\s[-–—]\s(.+)$/);
  return match ? match[1].trim() : text;
}

function resolveEnchantDb2Name(id, rawName, locale) {
  const cleaned = stripWagoMarkup(rawName);
  if (!cleaned) return '';
  // 1) 先用模板值替换 $k1/$k2 (保留 wago 原文措辞, 如德语 "und")
  const values = TEMPLATE_VALUES_BY_ENCHANT[Number(id)];
  let out = values
    ? cleaned.replace(/\$k(\d+)/g, (match, index) => values[Number(index)] || match)
    : cleaned;
  // 2) 若仍含未解析占位符($k1 / $457616s1 等)且是已知数字附魔 -> 回退整理好的公式
  if (/\$/.test(out)) {
    const numericNames = numericEnchantLocaleNames(id);
    if (numericNames) out = numericNames[locale] || numericNames['en-US'] || out;
  }
  // 3) 去掉部位前缀(与槽位标签重复)
  return stripEnchantSlotPrefix(out.trim());
}

async function collectWclIdsFromCos(cosBase = DEFAULT_COS_BASE) {
  const bucket = { enchants: new Set(), gems: new Set() };
  const base = cosBase.replace(/\/$/, '');
  for (const spec of listSpecs()) {
    const specBase = `${base}/wcl-presets/data-${DATA_VERSION}/${spec.classKey}/${spec.specId}`;
    let index;
    try {
      index = await requestJson(`${specBase}/index.json?t=${Date.now()}`);
    } catch (err) {
      console.warn(`Skip ${spec.classKey}/${spec.specId}: ${err.message}`);
      continue;
    }
    const files = [
      ...(index.mythicPlus || []),
      ...(index.raid || []),
    ].map((item) => item.fileKey).filter(Boolean);
    for (const fileKey of files) {
      try {
        const file = await requestJson(`${specBase}/${fileKey}.json?t=${Date.now()}`);
        collectWclIdsFromObject(file, bucket);
      } catch (err) {
        console.warn(`Skip ${spec.classKey}/${spec.specId}/${fileKey}: ${err.message}`);
      }
    }
  }
  return bucket;
}

async function getToken(clientId, clientSecret) {
  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const body = new URLSearchParams({ grant_type: 'client_credentials' });
  const data = await requestJson('https://oauth.battle.net/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  });
  return data.access_token;
}

function apiLocaleNamesToWeb(namesByApiLocale = {}) {
  return Object.fromEntries(
    Object.entries(LOCALE_PRESETS).map(([webLocale, preset]) => [webLocale, namesByApiLocale[preset.locale] || '']),
  );
}

function numericEnchantLocaleNames(id) {
  const formatter = NUMERIC_ENCHANTS[Number(id)];
  if (!formatter) return null;
  return Object.fromEntries(
    Object.entries(STAT_WORDS).map(([locale, words]) => [locale, formatter(words)]),
  );
}

function scoreEnchantSearchResult(data, zhName) {
  const name = data?.name?.zh_CN || '';
  let score = 0;
  if (!name.includes(zhName)) return -1;
  if (name === zhName) score += 200;
  if (name.endsWith(`- ${zhName}`) || name.endsWith(`－${zhName}`)) score += 120;
  if (name.startsWith('附魔')) score += 80;
  if (name.startsWith('公式')) score -= 80;
  if (data?.item_subclass?.name?.zh_CN === '附魔') score += 20;
  return score;
}

async function searchEnchantNames(token, zhName) {
  let best = null;
  let bestScore = -1;
  for (let page = 1; page <= 5; page += 1) {
    const url = `https://us.api.blizzard.com/data/wow/search/item?namespace=static-us&locale=zh_CN`
      + `&name.zh_CN=${encodeURIComponent(zhName)}&_pageSize=100&_page=${page}`;
    const data = await requestJson(url, { headers: { Authorization: `Bearer ${token}` } });
    for (const result of data.results || []) {
      const score = scoreEnchantSearchResult(result.data, zhName);
      if (score > bestScore) {
        bestScore = score;
        best = result.data;
      }
    }
    if (bestScore >= 180 || page >= Number(data.pageCount || 1)) break;
  }
  return best?.name ? apiLocaleNamesToWeb(best.name) : null;
}

async function buildEnchantLocaleNames(token, enchantIds) {
  const namesById = {};
  const errors = {};
  for (const id of enchantIds) {
    const zhName = NAME_MAP.enchants[id] || '';
    if (!zhName) {
      errors[id] = 'missing zh-CN source name';
      continue;
    }
    const numericNames = numericEnchantLocaleNames(id);
    if (numericNames) {
      namesById[id] = numericNames;
      console.log(`enchant ${id}: ${zhName} -> ${numericNames['en-US']}`);
      continue;
    }
    try {
      const names = await searchEnchantNames(token, zhName);
      if (!names) {
        errors[id] = `no Blizzard item search match for ${zhName}`;
        continue;
      }
      if (!names['zh-CN']) names['zh-CN'] = zhName;
      namesById[id] = names;
      console.log(`enchant ${id}: ${zhName} -> ${names['en-US'] || names['zh-CN']}`);
    } catch (err) {
      errors[id] = String(err.message || err);
      console.warn(`enchant ${id}: failed`);
    }
  }
  return { namesById, errors };
}

async function buildOfficialEnchantNames(locales, version = DEFAULT_WAGO_VERSION) {
  const byLocale = {};
  const errorsByLocale = {};
  for (const locale of locales) {
    const wagoLocale = WAGO_LOCALES[locale];
    if (!wagoLocale) {
      byLocale[locale] = {};
      errorsByLocale[locale] = { locale: `unsupported Wago locale ${locale}` };
      continue;
    }
    console.log(`\n[${locale}] loading SpellItemEnchantment ${version}`);
    const rows = parseCsvObjects(await fetchWagoCsv('SpellItemEnchantment', { locale: wagoLocale, version }));
    const names = {};
    const errors = {};
    rows.forEach((row) => {
      const id = String(row.ID || '');
      if (!id) return;
      const name = resolveEnchantDb2Name(id, row.Name_lang, locale);
      if (name) names[id] = name;
      else errors[id] = 'missing Name_lang';
    });
    byLocale[locale] = names;
    errorsByLocale[locale] = errors;
    console.log(`[${locale}] ${Object.keys(names).length} enchant name(s)`);
  }
  return { byLocale, errorsByLocale };
}

function collectGemIdsFromItemRows(itemRows) {
  const gemIds = new Set();
  itemRows.forEach((row) => {
    if (String(row.ClassID) === '3' && row.ID) gemIds.add(String(row.ID));
  });
  return gemIds;
}

async function buildOfficialGemNames(locales, version = DEFAULT_WAGO_VERSION) {
  console.log(`\nLoading Item ${version} for gem IDs`);
  const itemRows = parseCsvObjects(await fetchWagoCsv('Item', { version }));
  const gemIds = collectGemIdsFromItemRows(itemRows);
  const byLocale = {};
  const errorsByLocale = {};
  console.log(`Found ${gemIds.size} gem item ID(s) from Item.ClassID=3`);
  for (const locale of locales) {
    const wagoLocale = WAGO_LOCALES[locale];
    if (!wagoLocale) {
      byLocale[locale] = {};
      errorsByLocale[locale] = { locale: `unsupported Wago locale ${locale}` };
      continue;
    }
    console.log(`\n[${locale}] loading ItemSparse ${version}`);
    const rows = parseCsvObjects(await fetchWagoCsv('ItemSparse', { locale: wagoLocale, version }));
    const names = {};
    rows.forEach((row) => {
      const id = String(row.ID || '');
      if (gemIds.has(id)) {
        const name = stripWagoMarkup(row.Display_lang);
        if (name) names[id] = name;
      }
    });
    const errors = {};
    gemIds.forEach((id) => {
      if (!names[id]) errors[id] = 'missing Display_lang';
    });
    byLocale[locale] = names;
    errorsByLocale[locale] = errors;
    console.log(`[${locale}] ${Object.keys(names).length} gem name(s), ${Object.keys(errors).length} missing`);
  }
  return { byLocale, errorsByLocale, gemIds };
}

async function fetchItemName(token, config, itemId) {
  const host = `${config.region}.api.blizzard.com`;
  const url = `https://${host}/data/wow/item/${itemId}?namespace=${config.namespace}&locale=${config.apiLocale}`;
  const item = await requestJson(url, { headers: { Authorization: `Bearer ${token}` } });
  return item.preview_item?.name || item.name || '';
}

function readExistingOutput(filePath) {
  if (!fs.existsSync(filePath)) return {};
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return {};
  }
}

async function writeLocaleOutput({ token, locale, outRoot, gemIds, enchantLocaleNames, enchantErrors, skipExisting }) {
  const config = getLocaleConfig({ outLocale: locale });
  const outDir = path.join(outRoot, locale);
  const outFile = path.join(outDir, 'wcl-names.json');
  const existing = readExistingOutput(outFile);
  const output = {
    locale,
    apiLocale: config.apiLocale,
    source: 'blizzard-game-data-api',
    generatedAt: new Date().toISOString(),
    dataVersion: DATA_VERSION,
    enchants: { ...(existing.enchants || {}) },
    gems: { ...(existing.gems || {}) },
    errors: {
      enchants: { ...(existing.errors?.enchants || {}) },
      gems: { ...(existing.errors?.gems || {}) },
    },
  };

  Object.entries(enchantLocaleNames).forEach(([id, names]) => {
    const value = names[locale] || '';
    if (value) {
      output.enchants[id] = value;
      delete output.errors.enchants[id];
    } else if (enchantErrors[id]) {
      output.errors.enchants[id] = enchantErrors[id];
    }
  });
  Object.entries(enchantErrors).forEach(([id, message]) => {
    if (!output.enchants[id]) output.errors.enchants[id] = message;
  });

  console.log(`\n[${locale}] ${gemIds.length} gem(s)`);
  for (const id of gemIds) {
    if (skipExisting && output.gems[id]) {
      console.log(`gem ${id}: skipped existing`);
      continue;
    }
    try {
      output.gems[id] = await fetchItemName(token, config, id);
      delete output.errors.gems[id];
      console.log(`gem ${id}: ${output.gems[id]}`);
    } catch (err) {
      output.errors.gems[id] = String(err.message || err);
      console.warn(`gem ${id}: failed`);
    }
  }

  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(outFile, `${JSON.stringify(output, null, 2)}\n`);
  console.log(`Wrote ${outFile}`);
  return output;
}

async function writeOfficialLocaleOutput({
  locale,
  outRoot,
  version,
  enchantNames,
  gemNames,
  enchantErrors = {},
  gemErrors = {},
}) {
  const config = getLocaleConfig({ outLocale: locale });
  const outDir = path.join(outRoot, locale);
  const outFile = path.join(outDir, 'wcl-names.json');
  const output = {
    locale,
    apiLocale: config.apiLocale,
    source: 'wago-tools-db2',
    wagoVersion: version,
    generatedAt: new Date().toISOString(),
    dataVersion: DATA_VERSION,
    enchants: enchantNames || {},
    gems: gemNames || {},
    errors: {
      enchants: enchantErrors || {},
      gems: gemErrors || {},
    },
  };

  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(outFile, `${JSON.stringify(output, null, 2)}\n`);
  console.log(`Wrote ${outFile}`);
  return output;
}

async function collectIds(args) {
  if (String(args.source || 'official') === 'official') {
    return { enchants: new Set(), gems: new Set(), official: true };
  }
  if (String(args.source || 'official') === 'cos') {
    return collectWclIdsFromCos(String(args.cosBase || DEFAULT_COS_BASE));
  }
  return collectWclIdsFromLocal(path.resolve(String(args.inputRoot || DEFAULT_LOCAL_ROOT)));
}

async function main(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  if (isEnabled(args.help)) {
    printHelp();
    return;
  }

  const locales = isEnabled(args.allLocales)
    ? Object.keys(LOCALE_PRESETS)
    : [String(args.outLocale || 'zh-CN')];
  const outRoot = path.resolve(String(args.outRoot || DEFAULT_OUT_ROOT));
  const source = String(args.source || 'official');
  const wagoVersion = String(args.wagoVersion || DEFAULT_WAGO_VERSION);

  if (source === 'official') {
    const { byLocale: enchantByLocale, errorsByLocale: enchantErrorsByLocale } = await buildOfficialEnchantNames(locales, wagoVersion);
    const { byLocale: gemByLocale, errorsByLocale: gemErrorsByLocale } = await buildOfficialGemNames(locales, wagoVersion);
    for (const locale of locales) {
      await writeOfficialLocaleOutput({
        locale,
        outRoot,
        version: wagoVersion,
        enchantNames: enchantByLocale[locale],
        gemNames: gemByLocale[locale],
        enchantErrors: enchantErrorsByLocale[locale],
        gemErrors: gemErrorsByLocale[locale],
      });
    }
    return;
  }

  const ids = await collectIds(args);
  const enchantIds = [...ids.enchants].sort((a, b) => Number(a) - Number(b));
  const gemIds = [...ids.gems].sort((a, b) => Number(a) - Number(b));
  console.log(`Found ${enchantIds.length} enchant(s), ${gemIds.length} gem(s).`);
  if (isEnabled(args.listIds)) {
    console.log(`enchants=${enchantIds.join(',')}`);
    console.log(`gems=${gemIds.join(',')}`);
    return;
  }

  const clientId = process.env.BLIZZARD_CLIENT_ID;
  const clientSecret = process.env.BLIZZARD_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    console.error('Missing BLIZZARD_CLIENT_ID or BLIZZARD_CLIENT_SECRET environment variables.');
    process.exitCode = 1;
    return;
  }

  const token = await getToken(clientId, clientSecret);
  const { namesById: enchantLocaleNames, errors: enchantErrors } = await buildEnchantLocaleNames(token, enchantIds);
  const skipExisting = isEnabled(args.skipExisting);
  for (const locale of locales) {
    await writeLocaleOutput({
      token,
      locale,
      outRoot,
      gemIds,
      enchantLocaleNames,
      enchantErrors,
      skipExisting,
    });
  }
}

if (require.main === module) {
  main().catch((err) => {
    console.error(err.message || err);
    process.exit(1);
  });
}

module.exports = {
  apiLocaleNamesToWeb,
  collectGemIdsFromItemRows,
  collectWclIdsFromObject,
  collectWclIdsFromLocal,
  numericEnchantLocaleNames,
  parseArgs,
  parseCsvLine,
  parseCsvObjects,
  resolveEnchantDb2Name,
  scoreEnchantSearchResult,
  stripWagoMarkup,
  WAGO_LOCALES,
};
