#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const LOCALE_PRESETS = {
  'en-US': { locale: 'en_US', region: 'us', label: 'English US' },
  'en-GB': { locale: 'en_GB', region: 'eu', label: 'English UK' },
  'de-DE': { locale: 'de_DE', region: 'eu', label: 'Deutsch' },
  'fr-FR': { locale: 'fr_FR', region: 'eu', label: 'Francais' },
  'es-ES': { locale: 'es_ES', region: 'eu', label: 'Espanol EU' },
  'es-MX': { locale: 'es_MX', region: 'us', label: 'Espanol LATAM' },
  'pt-BR': { locale: 'pt_BR', region: 'us', label: 'Portugues BR' },
  'it-IT': { locale: 'it_IT', region: 'eu', label: 'Italiano' },
  'ru-RU': { locale: 'ru_RU', region: 'eu', label: 'Russian' },
  'ko-KR': { locale: 'ko_KR', region: 'kr', label: 'Korean' },
  'zh-TW': { locale: 'zh_TW', region: 'tw', label: 'Traditional Chinese' },
  'zh-CN': { locale: 'zh_CN', region: 'us', label: 'Simplified Chinese' },
};

const API_LOCALE_TO_WEB = Object.fromEntries(
  Object.entries(LOCALE_PRESETS).map(([webLocale, preset]) => [preset.locale, webLocale]),
);

function parseArgs(argv) {
  const args = { _: [] };
  argv.forEach((arg) => {
    if (!arg.startsWith('--')) {
      args._.push(arg);
      return;
    }
    const [key, ...rest] = arg.slice(2).split('=');
    args[key] = rest.length ? rest.join('=') : true;
  });
  return args;
}

function isEnabled(value) {
  return value === true || value === 'true' || value === '1' || value === 'yes';
}

function normalizeWebLocale(value) {
  return String(value || '').replace('_', '-');
}

function printHelp() {
  console.log(`Usage:
  node scripts/fetch-blizzard-localization.js --class=warlock --outLocale=fr-FR
  node scripts/fetch-blizzard-localization.js --allClasses --outLocale=fr-FR
  node scripts/fetch-blizzard-localization.js --allClasses --allLocales --skipExisting

Options:
  --class=<key>       Class file basename. Default: warlock
  --allClasses        Generate every class JSON in web/data-4.2.x except overview.json
  --outLocale=<web>   Web locale directory, for example fr-FR
  --locale=<api>      Blizzard API locale, for example fr_FR
  --region=<region>   Blizzard API region, for example us, eu, kr, tw
  --allLocales        Generate all supported WoW API locales listed by --listLocales
  --dataDir=<path>    Source data directory. Default: web/data-4.2.x
  --outDir=<path>     Output data directory for one locale. Default: web/locales/{outLocale}/data
  --limit=<n>         Limit items per class for testing
  --ids=<csv>         Only fetch specific item IDs
  --skipExisting      Skip item records already present in the output file
  --listLocales       Print supported locale presets without using API credentials
  --help              Print this help
`);
}

function printLocales() {
  Object.entries(LOCALE_PRESETS).forEach(([webLocale, preset]) => {
    console.log(`${webLocale.padEnd(5)} api=${preset.locale.padEnd(5)} region=${preset.region.padEnd(2)} ${preset.label}`);
  });
}

function getLocaleConfig(args, outLocaleOverride = '') {
  const requestedOutLocale = normalizeWebLocale(outLocaleOverride || args.outLocale || API_LOCALE_TO_WEB[String(args.locale || '')]);
  const preset = LOCALE_PRESETS[requestedOutLocale] || null;
  const apiLocale = String(args.locale || preset?.locale || 'en_US');
  const outLocale = requestedOutLocale || API_LOCALE_TO_WEB[apiLocale] || normalizeWebLocale(apiLocale);
  const region = String(args.region || preset?.region || 'us');
  return {
    outLocale,
    apiLocale,
    region,
    namespace: `static-${region}`,
  };
}

function getClassKeys(args, dataDir) {
  if (!isEnabled(args.allClasses)) {
    return [String(args.class || args._[0] || 'warlock')];
  }
  return fs.readdirSync(dataDir)
    .filter((file) => file.endsWith('.json') && file !== 'overview.json')
    .map((file) => path.basename(file, '.json'))
    .sort();
}

function getOutputDir(args, outLocale) {
  if (args.outDir) return path.resolve(String(args.outDir));
  return path.resolve('web', 'locales', outLocale, 'data');
}

function readClassData(dataDir, classKey) {
  const file = path.join(dataDir, `${classKey}.json`);
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function collectItems(data, requestedIds, limit) {
  const items = [];
  for (const instance of data.instances || []) {
    for (const encounter of instance.encounters || []) {
      for (const item of encounter.items || []) {
        items.push({
          id: item.id,
          sourceName: item.name,
          instanceId: instance.id,
          encounterId: encounter.id,
        });
      }
    }
  }
  const seen = new Set();
  let unique = items.filter((item) => {
    if (!item.id || seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
  if (requestedIds.length) {
    const idSet = new Set(requestedIds);
    unique = unique.filter((item) => idSet.has(Number(item.id)));
  }
  return limit > 0 ? unique.slice(0, limit) : unique;
}

async function requestJson(url, options = {}) {
  const response = await fetch(url, options);
  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`${response.status} ${response.statusText}: ${body.slice(0, 160)}`);
  }
  return response.json();
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

async function fetchGameData(token, config, apiPath) {
  const host = `${config.region}.api.blizzard.com`;
  const url = `https://${host}/data/wow/${apiPath}?namespace=${config.namespace}&locale=${config.apiLocale}`;
  return requestJson(url, { headers: { Authorization: `Bearer ${token}` } });
}

function normalizeSpell(spell) {
  return {
    id: spell?.spell?.id || null,
    name: spell?.spell?.name || '',
    description: spell?.description || '',
  };
}

function normalizeItem(apiItem, sourceItem) {
  const preview = apiItem.preview_item || {};
  const itemSet = preview.set?.item_set || null;
  return {
    id: apiItem.id,
    name: preview.name || apiItem.name || '',
    sourceName: sourceItem.sourceName,
    quality: preview.quality?.name || apiItem.quality?.name || '',
    inventoryType: preview.inventory_type?.name || apiItem.inventory_type?.name || '',
    itemClass: preview.item_class?.name || apiItem.item_class?.name || '',
    itemSubclass: preview.item_subclass?.name || apiItem.item_subclass?.name || '',
    binding: preview.binding?.name || '',
    description: preview.description || apiItem.description || '',
    spells: Array.isArray(preview.spells)
      ? preview.spells.map(normalizeSpell).filter((spell) => spell.name || spell.description)
      : [],
    setId: itemSet?.id || null,
    setName: itemSet?.name || '',
  };
}

async function fetchItemSet(token, config, setId, fallbackName = '') {
  const apiSet = await fetchGameData(token, config, `item-set/${setId}`);
  return {
    id: apiSet.id,
    name: apiSet.name || fallbackName || '',
    effects: Array.isArray(apiSet.effects)
      ? apiSet.effects.map((effect) => ({
        requiredCount: effect.required_count,
        displayString: effect.display_string || '',
      }))
      : [],
  };
}

function readExistingOverlay(jsonPath) {
  if (!fs.existsSync(jsonPath)) return {};
  try {
    return JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  } catch {
    return {};
  }
}

async function generateClassLocale({ token, config, classKey, dataDir, outDir, requestedIds, limit, skipExisting }) {
  const sourceData = readClassData(dataDir, classKey);
  const sourceItems = collectItems(sourceData, requestedIds, limit);
  const jsonPath = path.join(outDir, `${classKey}.json`);
  const existing = readExistingOverlay(jsonPath);
  const overlay = {
    locale: config.outLocale,
    apiLocale: config.apiLocale,
    source: 'blizzard-game-data-api',
    region: config.region,
    namespace: config.namespace,
    generatedAt: new Date().toISOString(),
    classKey,
    items: { ...(existing.items || {}) },
    itemSets: { ...(existing.itemSets || {}) },
    errors: { ...(existing.errors || {}) },
  };

  console.log(`\n[${config.outLocale}] ${classKey}: ${sourceItems.length} item(s)`);

  for (const sourceItem of sourceItems) {
    try {
      const existingItem = overlay.items[sourceItem.id];
      if (skipExisting && existingItem) {
        if (existingItem.setId && !overlay.itemSets[existingItem.setId]) {
          overlay.itemSets[existingItem.setId] = await fetchItemSet(token, config, existingItem.setId, existingItem.setName);
        }
        console.log(`${sourceItem.id}: skipped existing`);
        continue;
      }

      const apiItem = await fetchGameData(token, config, `item/${sourceItem.id}`);
      const localized = normalizeItem(apiItem, sourceItem);
      overlay.items[sourceItem.id] = localized;
      delete overlay.errors[sourceItem.id];

      if (localized.setId && !overlay.itemSets[localized.setId]) {
        overlay.itemSets[localized.setId] = await fetchItemSet(token, config, localized.setId, localized.setName);
      }
      console.log(`${sourceItem.id}: ${sourceItem.sourceName} -> ${localized.name}`);
    } catch (err) {
      overlay.errors[sourceItem.id] = String(err.message || err);
      console.warn(`${sourceItem.id}: failed`);
    }
  }

  fs.mkdirSync(outDir, { recursive: true });
  const jsPath = path.join(outDir, `${classKey}.js`);
  fs.writeFileSync(jsonPath, `${JSON.stringify(overlay, null, 2)}\n`);
  fs.writeFileSync(jsPath, `module.exports = ${JSON.stringify(overlay, null, 2)};\n`);
  console.log(`Wrote ${jsonPath}`);
}

async function main(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);

  if (isEnabled(args.help)) {
    printHelp();
    return;
  }
  if (isEnabled(args.listLocales)) {
    printLocales();
    return;
  }

  const clientId = process.env.BLIZZARD_CLIENT_ID;
  const clientSecret = process.env.BLIZZARD_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    console.error('Missing BLIZZARD_CLIENT_ID or BLIZZARD_CLIENT_SECRET environment variables.');
    process.exitCode = 1;
    return;
  }
  if (isEnabled(args.allLocales) && args.outDir) {
    console.error('--outDir cannot be used with --allLocales because each locale needs its own output directory.');
    process.exitCode = 1;
    return;
  }

  const dataDir = path.resolve(args.dataDir || 'web/data-4.2.x');
  const requestedIds = String(args.ids || '')
    .split(',')
    .map((id) => Number(id.trim()))
    .filter(Boolean);
  const limit = Number(args.limit || 0);
  const skipExisting = isEnabled(args.skipExisting);
  const outLocales = isEnabled(args.allLocales) ? Object.keys(LOCALE_PRESETS) : [getLocaleConfig(args).outLocale];
  const classKeys = getClassKeys(args, dataDir);
  const token = await getToken(clientId, clientSecret);

  for (const outLocale of outLocales) {
    const config = getLocaleConfig(args, outLocale);
    const outDir = getOutputDir(args, config.outLocale);
    for (const classKey of classKeys) {
      await generateClassLocale({ token, config, classKey, dataDir, outDir, requestedIds, limit, skipExisting });
    }
  }
}

if (require.main === module) {
  main().catch((err) => {
    console.error(err.message || err);
    process.exit(1);
  });
}

module.exports = {
  LOCALE_PRESETS,
  getLocaleConfig,
  main,
  parseArgs,
};
