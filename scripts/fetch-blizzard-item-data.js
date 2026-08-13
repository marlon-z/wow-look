const fs = require('fs');
const path = require('path');
const https = require('https');

const ROOT_DIR = path.resolve(__dirname, '..');
const DEFAULT_OUTPUT_DIR = path.join(ROOT_DIR, '.cache', 'blizzard-items');

function parseArgs(argv) {
  const args = {};
  for (let index = 2; index < argv.length; index += 1) {
    const key = argv[index];
    if (!key.startsWith('--')) continue;
    args[key.slice(2)] = argv[index + 1];
    index += 1;
  }
  return args;
}

function parseItemRange(value) {
  const match = String(value || '').match(/^(\d+)-(\d+)$/);
  if (!match) throw new Error('--range 格式必须为起始ID-结束ID，例如 271451-271567。');
  const start = Number(match[1]);
  const end = Number(match[2]);
  if (!Number.isInteger(start) || !Number.isInteger(end) || start <= 0 || end < start || end - start > 1000) {
    throw new Error('--range 不是安全的物品 ID 范围。');
  }
  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
}

function requestJson(url, options = {}) {
  return new Promise((resolve, reject) => {
    const request = https.request(url, options, (response) => {
      let body = '';
      response.setEncoding('utf8');
      response.on('data', (chunk) => { body += chunk; });
      response.on('end', () => {
        if (response.statusCode < 200 || response.statusCode >= 300) {
          reject(new Error(`Blizzard API HTTP ${response.statusCode}: ${body.slice(0, 200)}`));
          return;
        }
        try { resolve(JSON.parse(body)); } catch (error) { reject(error); }
      });
    });
    request.on('error', reject);
    request.setTimeout(30000, () => request.destroy(new Error('Blizzard API request timed out')));
    if (options.body) request.write(options.body);
    request.end();
  });
}

async function getAccessToken(clientId, clientSecret) {
  const body = 'grant_type=client_credentials';
  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const token = await requestJson('https://oauth.battle.net/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': Buffer.byteLength(body),
    },
    body,
  });
  if (!token.access_token) throw new Error('Blizzard OAuth response did not include access_token');
  return token.access_token;
}

function collectItemIds(payload) {
  const ids = new Set();
  for (const classData of payload.classes || []) {
    for (const item of classData.items || []) {
      if (Number.isInteger(item.itemId) && item.itemId > 0) ids.add(item.itemId);
    }
  }
  return [...ids].sort((a, b) => a - b);
}

function compactItem(item) {
  const preview = item.preview_item || {};
  return {
    id: item.id,
    name: item.name || '',
    quality: item.quality || null,
    level: item.level || 0,
    requiredLevel: item.required_level || 0,
    isEquippable: item.is_equippable === true,
    itemClass: item.item_class || null,
    itemSubclass: item.item_subclass || null,
    inventoryType: item.inventory_type || null,
    media: item.media || null,
    preview: {
      name: preview.name || '',
      level: preview.level || null,
      inventoryType: preview.inventory_type || null,
      stats: Array.isArray(preview.stats) ? preview.stats : [],
      set: preview.set || null,
      bonusList: Array.isArray(preview.bonus_list) ? preview.bonus_list : [],
    },
  };
}

async function fetchItems(itemIds, token, region, locale) {
  const items = {};
  for (const itemId of itemIds) {
    const url = `https://${region}.api.blizzard.com/data/wow/item/${itemId}?namespace=static-${region}&locale=${encodeURIComponent(locale)}`;
    const response = await requestJson(url, { headers: { Authorization: `Bearer ${token}` } });
    items[itemId] = compactItem(response);
    console.log(`Blizzard item ${itemId}: ${items[itemId].name}`);
  }
  return items;
}

async function main() {
  const args = parseArgs(process.argv);
  if (!args.input && !args.range) throw new Error('用法: node scripts/fetch-blizzard-item-data.js --input <WoWLookTierExport.lua> 或 --range 271451-271567 [--output 文件]');
  const clientId = process.env.BLIZZARD_CLIENT_ID;
  const clientSecret = process.env.BLIZZARD_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new Error('请仅在当前终端设置 BLIZZARD_CLIENT_ID 与 BLIZZARD_CLIENT_SECRET；不要把密钥写入文件。');
  let payload = {};
  let itemIds = [];
  if (args.range) {
    itemIds = parseItemRange(args.range);
  } else {
    const raw = fs.readFileSync(path.resolve(process.cwd(), args.input), 'utf8');
    const match = raw.match(/(?:\["payload"\]|payload)\s*=\s*"((?:[^"\\]|\\.)*)"/s);
    if (!match) throw new Error('未找到 WoWLookTierExport payload。请先运行 /wowtierexport export-preflight 并退出游戏保存。');
    payload = JSON.parse(JSON.parse(`"${match[1]}"`));
    itemIds = collectItemIds(payload);
  }
  if (!itemIds.length) throw new Error('套装导出中没有物品 ID。');
  const token = await getAccessToken(clientId, clientSecret);
  const region = args.region || 'us';
  const locale = args.locale || 'zh_CN';
  const items = await fetchItems(itemIds, token, region, locale);
  const output = {
    source: 'Blizzard Game Data API',
    region,
    locale,
    fetchedAt: new Date().toISOString(),
    sourcePayload: { mode: payload.mode || '', dataVersion: payload.dataVersion || '', clientBuild: payload.clientBuild || 0, range: args.range || '' },
    itemCount: itemIds.length,
    items,
  };
  const outputPath = path.resolve(process.cwd(), args.output || path.join(DEFAULT_OUTPUT_DIR, 'midnight-s2-tier-items.json'));
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(output, null, 2)}\n`, 'utf8');
  console.log(`Blizzard API data written: ${outputPath}`);
}

if (require.main === module) {
  main().catch((error) => { console.error(error.message); process.exit(1); });
}

module.exports = { collectItemIds, compactItem, parseItemRange };
