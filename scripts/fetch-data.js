const fs = require('fs');
const path = require('path');
const https = require('https');

const OUTPUT_DIR = path.join(__dirname, '..', 'miniprogram', 'data');
const TARGET_ILVL = 246;

const CLASS_CONFIG = [
  { id: 1, key: 'warrior', name: '战士', armorType: 'plate', armorTypeName: '板甲', specs: [{ id: 71, name: '武器' }, { id: 72, name: '狂怒' }, { id: 73, name: '防护' }] },
  { id: 2, key: 'paladin', name: '圣骑士', armorType: 'plate', armorTypeName: '板甲', specs: [{ id: 65, name: '神圣' }, { id: 66, name: '防护' }, { id: 70, name: '惩戒' }] },
  { id: 3, key: 'hunter', name: '猎人', armorType: 'mail', armorTypeName: '锁甲', specs: [{ id: 253, name: '野兽控制' }, { id: 254, name: '射击' }, { id: 255, name: '生存' }] },
  { id: 4, key: 'rogue', name: '盗贼', armorType: 'leather', armorTypeName: '皮甲', specs: [{ id: 259, name: '奇袭' }, { id: 260, name: '狂徒' }, { id: 261, name: '敏锐' }] },
  { id: 5, key: 'priest', name: '牧师', armorType: 'cloth', armorTypeName: '布甲', specs: [{ id: 256, name: '戒律' }, { id: 257, name: '神圣' }, { id: 258, name: '暗影' }] },
  { id: 6, key: 'deathknight', name: '死亡骑士', armorType: 'plate', armorTypeName: '板甲', specs: [{ id: 250, name: '鲜血' }, { id: 251, name: '冰霜' }, { id: 252, name: '邪恶' }] },
  { id: 7, key: 'shaman', name: '萨满祭司', armorType: 'mail', armorTypeName: '锁甲', specs: [{ id: 262, name: '元素' }, { id: 263, name: '增强' }, { id: 264, name: '恢复' }] },
  { id: 8, key: 'mage', name: '法师', armorType: 'cloth', armorTypeName: '布甲', specs: [{ id: 62, name: '奥术' }, { id: 63, name: '火焰' }, { id: 64, name: '冰霜' }] },
  { id: 9, key: 'warlock', name: '术士', armorType: 'cloth', armorTypeName: '布甲', specs: [{ id: 265, name: '痛苦' }, { id: 266, name: '恶魔学识' }, { id: 267, name: '毁灭' }] },
  { id: 10, key: 'monk', name: '武僧', armorType: 'leather', armorTypeName: '皮甲', specs: [{ id: 268, name: '酒仙' }, { id: 269, name: '踏风' }, { id: 270, name: '织雾' }] },
  { id: 11, key: 'druid', name: '德鲁伊', armorType: 'leather', armorTypeName: '皮甲', specs: [{ id: 102, name: '平衡' }, { id: 103, name: '野性' }, { id: 104, name: '守护' }, { id: 105, name: '恢复' }] },
  { id: 12, key: 'demonhunter', name: '恶魔猎手', armorType: 'leather', armorTypeName: '皮甲', specs: [{ id: 577, name: '浩劫' }, { id: 581, name: '复仇' }, { id: 1480, name: '噬灭' }] },
  { id: 13, key: 'evoker', name: '唤魔师', armorType: 'mail', armorTypeName: '锁甲', specs: [{ id: 1467, name: '湮灭' }, { id: 1468, name: '恩护' }, { id: 1473, name: '增辉' }] }
];

function ensureOutputDir() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
}

function buildEmptyClassPayload(config) {
  return {
    version: '12.0.1-S1',
    updatedAt: new Date().toISOString().split('T')[0],
    ilvl: TARGET_ILVL,
    class: {
      id: config.id,
      name: config.name,
      key: config.key,
      armorType: config.armorType,
      armorTypeName: config.armorTypeName
    },
    specs: config.specs,
    instances: []
  };
}

function writeClassPayload(payload) {
  const outputPath = path.join(OUTPUT_DIR, `${payload.class.key}.json`);
  fs.writeFileSync(outputPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
}

function initializePlaceholders() {
  ensureOutputDir();
  CLASS_CONFIG.forEach((config) => {
    writeClassPayload(buildEmptyClassPayload(config));
  });
  console.log(`Initialized ${CLASS_CONFIG.length} class data files in ${OUTPUT_DIR}`);
}

function httpsGet(url, headers = {}) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers }, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => resolve(data));
    });
    req.on('error', reject);
    req.setTimeout(15000, () => {
      req.destroy();
      reject(new Error(`Request timeout: ${url}`));
    });
  });
}

async function fetchKeystoneLootData() {
  // TODO: 接入 KeystoneLoot data/dungeons.lua 与 data/items.lua
  // 目标：
  // 1. 解析 8 个 M+ 副本的当前赛季物品白名单
  // 2. 解析每件物品的 classes 字段，获得职业 / 专精可用性
  throw new Error('KeystoneLoot parsing is not implemented yet.');
}

async function fetchBlizzardItem(itemId) {
  // TODO: 使用 Battle.net OAuth + item API 补全物品中文名、部位、甲种
  throw new Error(`Blizzard item metadata is not implemented yet for item ${itemId}.`);
}

async function fetchWowheadTooltip(itemId) {
  const url = `https://nether.wowhead.com/tooltip/item/${itemId}?dataEnv=1&locale=4&ilvl=${TARGET_ILVL}`;
  const raw = await httpsGet(url);
  try {
    return JSON.parse(raw);
  } catch (error) {
    throw new Error(`Wowhead tooltip parse failed for item ${itemId}: ${error.message}`);
  }
}

function buildClassOutputs() {
  // TODO: 把 KeystoneLoot 物品白名单、Boss 映射、Blizzard 元数据、Tooltip 数值合并，
  // 再按职业写入到 miniprogram/data/{class}.json。
  throw new Error('Class data build pipeline is not implemented yet.');
}

async function main() {
  if (process.argv.includes('--init-placeholders')) {
    initializePlaceholders();
    return;
  }

  console.log('fetch-data.js scaffold is ready.');
  console.log('Next step: implement KeystoneLoot parser and Blizzard metadata merge.');
  buildClassOutputs();
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
