#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const args = Object.fromEntries(process.argv.slice(2).map((arg) => {
  const [key, ...rest] = arg.replace(/^--/, '').split('=');
  return [key, rest.length ? rest.join('=') : true];
}));

const classKey = String(args.class || args._ || 'warlock');
const region = String(args.region || 'us');
const locale = 'en_US';
const dataDir = path.resolve(args.dataDir || 'web/data-4.2.x');
const outDir = path.resolve(args.outDir || 'web/locales/en-US/data');
const limit = Number(args.limit || 0);
const requestedIds = String(args.ids || '')
  .split(',')
  .map((id) => Number(id.trim()))
  .filter(Boolean);
const clientId = process.env.BLIZZARD_CLIENT_ID;
const clientSecret = process.env.BLIZZARD_CLIENT_SECRET;

if (!clientId || !clientSecret) {
  console.error('Missing BLIZZARD_CLIENT_ID or BLIZZARD_CLIENT_SECRET environment variables.');
  process.exit(1);
}

function readClassData() {
  const file = path.join(dataDir, `${classKey}.json`);
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function collectItems(data) {
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

async function getToken() {
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

async function fetchGameData(token, apiPath) {
  const url = `https://${region}.api.blizzard.com/data/wow/${apiPath}?namespace=static-${region}&locale=${locale}`;
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
    spells: Array.isArray(preview.spells) ? preview.spells.map(normalizeSpell).filter((spell) => spell.name || spell.description) : [],
    setId: itemSet?.id || null,
    setName: itemSet?.name || '',
  };
}

async function main() {
  const sourceData = readClassData();
  const sourceItems = collectItems(sourceData);
  const token = await getToken();
  const jsonPath = path.join(outDir, `${classKey}.json`);
  let existing = {};
  if (fs.existsSync(jsonPath)) {
    try {
      existing = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    } catch {
      existing = {};
    }
  }
  const overlay = {
    locale: 'en-US',
    source: 'blizzard-game-data-api',
    region,
    namespace: `static-${region}`,
    generatedAt: new Date().toISOString(),
    classKey,
    items: { ...(existing.items || {}) },
    itemSets: { ...(existing.itemSets || {}) },
    errors: { ...(existing.errors || {}) },
  };

  for (const sourceItem of sourceItems) {
    try {
      const apiItem = await fetchGameData(token, `item/${sourceItem.id}`);
      const localized = normalizeItem(apiItem, sourceItem);
      overlay.items[sourceItem.id] = localized;
      if (localized.setId && !overlay.itemSets[localized.setId]) {
        const apiSet = await fetchGameData(token, `item-set/${localized.setId}`);
        overlay.itemSets[localized.setId] = {
          id: apiSet.id,
          name: apiSet.name || localized.setName || '',
          effects: Array.isArray(apiSet.effects)
            ? apiSet.effects.map((effect) => ({
              requiredCount: effect.required_count,
              displayString: effect.display_string || '',
            }))
            : [],
        };
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

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
