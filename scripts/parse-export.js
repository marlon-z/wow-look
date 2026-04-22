const fs = require('fs');
const path = require('path');
const https = require('https');
const { execFileSync } = require('child_process');

const ROOT_DIR = path.resolve(__dirname, '..');
const DEFAULT_OUTPUT_DIR = path.join(ROOT_DIR, 'miniprogram', 'data');
const DEFAULT_ASSET_DIR = path.join(ROOT_DIR, 'miniprogram', 'assets', 'icons');
const CACHE_DIR = path.join(ROOT_DIR, '.cache');
const LISTFILE_CACHE_PATH = path.join(CACHE_DIR, 'community-listfile.csv');
const LISTFILE_URL = 'https://github.com/wowdev/wow-listfile/releases/latest/download/community-listfile.csv';

const CLASS_CONFIG = [
  { id: 1, key: 'warrior', name: '战士', armorType: 'plate', armorTypeName: '板甲', color: '#C69B6D', abbr: '战', specs: [{ id: 71, name: '武器' }, { id: 72, name: '狂怒' }, { id: 73, name: '防护' }] },
  { id: 2, key: 'paladin', name: '圣骑士', armorType: 'plate', armorTypeName: '板甲', color: '#F48CBA', abbr: '骑', specs: [{ id: 65, name: '神圣' }, { id: 66, name: '防护' }, { id: 70, name: '惩戒' }] },
  { id: 3, key: 'hunter', name: '猎人', armorType: 'mail', armorTypeName: '锁甲', color: '#AAD372', abbr: '猎', specs: [{ id: 253, name: '野兽控制' }, { id: 254, name: '射击' }, { id: 255, name: '生存' }] },
  { id: 4, key: 'rogue', name: '盗贼', armorType: 'leather', armorTypeName: '皮甲', color: '#FFF468', abbr: '贼', specs: [{ id: 259, name: '奇袭' }, { id: 260, name: '狂徒' }, { id: 261, name: '敏锐' }] },
  { id: 5, key: 'priest', name: '牧师', armorType: 'cloth', armorTypeName: '布甲', color: '#FFFFFF', abbr: '牧', specs: [{ id: 256, name: '戒律' }, { id: 257, name: '神圣' }, { id: 258, name: '暗影' }] },
  { id: 6, key: 'deathknight', name: '死亡骑士', armorType: 'plate', armorTypeName: '板甲', color: '#C41E3A', abbr: '骑', specs: [{ id: 250, name: '鲜血' }, { id: 251, name: '冰霜' }, { id: 252, name: '邪恶' }] },
  { id: 7, key: 'shaman', name: '萨满祭司', armorType: 'mail', armorTypeName: '锁甲', color: '#0070DD', abbr: '萨', specs: [{ id: 262, name: '元素' }, { id: 263, name: '增强' }, { id: 264, name: '恢复' }] },
  { id: 8, key: 'mage', name: '法师', armorType: 'cloth', armorTypeName: '布甲', color: '#3FC7EB', abbr: '法', specs: [{ id: 62, name: '奥术' }, { id: 63, name: '火焰' }, { id: 64, name: '冰霜' }] },
  { id: 9, key: 'warlock', name: '术士', armorType: 'cloth', armorTypeName: '布甲', color: '#8788EE', abbr: '术', specs: [{ id: 265, name: '痛苦' }, { id: 266, name: '恶魔学识' }, { id: 267, name: '毁灭' }] },
  { id: 10, key: 'monk', name: '武僧', armorType: 'leather', armorTypeName: '皮甲', color: '#00FF98', abbr: '僧', specs: [{ id: 268, name: '酒仙' }, { id: 269, name: '踏风' }, { id: 270, name: '织雾' }] },
  { id: 11, key: 'druid', name: '德鲁伊', armorType: 'leather', armorTypeName: '皮甲', color: '#FF7C0A', abbr: '德', specs: [{ id: 102, name: '平衡' }, { id: 103, name: '野性' }, { id: 104, name: '守护' }, { id: 105, name: '恢复' }] },
  { id: 12, key: 'demonhunter', name: '恶魔猎手', armorType: 'leather', armorTypeName: '皮甲', color: '#A330C9', abbr: '猎', specs: [{ id: 577, name: '浩劫' }, { id: 581, name: '复仇' }, { id: 1480, name: '噬灭' }] },
  { id: 13, key: 'evoker', name: '唤魔师', armorType: 'mail', armorTypeName: '锁甲', color: '#33937F', abbr: '唤', specs: [{ id: 1467, name: '湮灭' }, { id: 1468, name: '恩护' }, { id: 1473, name: '增辉' }] },
];

const SLOT_MAP = {
  INVTYPE_HEAD: { key: 'head', name: '头部' },
  INVTYPE_SHOULDER: { key: 'shoulder', name: '肩部' },
  INVTYPE_CLOAK: { key: 'cloak', name: '披风' },
  INVTYPE_CHEST: { key: 'chest', name: '胸部' },
  INVTYPE_ROBE: { key: 'chest', name: '胸部' },
  INVTYPE_WRIST: { key: 'wrist', name: '腕部' },
  INVTYPE_HAND: { key: 'hand', name: '手部' },
  INVTYPE_WAIST: { key: 'waist', name: '腰部' },
  INVTYPE_LEGS: { key: 'legs', name: '腿部' },
  INVTYPE_FEET: { key: 'feet', name: '脚部' },
  INVTYPE_NECK: { key: 'neck', name: '项链' },
  INVTYPE_FINGER: { key: 'finger', name: '戒指' },
  INVTYPE_TRINKET: { key: 'trinket', name: '饰品' },
  INVTYPE_WEAPON: { key: 'weapon', name: '武器' },
  INVTYPE_2HWEAPON: { key: 'weapon', name: '武器' },
  INVTYPE_WEAPONMAINHAND: { key: 'weapon', name: '武器' },
  INVTYPE_WEAPONOFFHAND: { key: 'weapon', name: '武器' },
  INVTYPE_SHIELD: { key: 'weapon', name: '武器' },
  INVTYPE_HOLDABLE: { key: 'weapon', name: '武器' },
  INVTYPE_RANGED: { key: 'weapon', name: '武器' },
  INVTYPE_RANGEDRIGHT: { key: 'weapon', name: '武器' },
  INVTYPE_THROWN: { key: 'weapon', name: '武器' },
};

const ARMOR_TYPE_MAP = {
  布甲: { key: 'cloth', name: '布甲' },
  皮甲: { key: 'leather', name: '皮甲' },
  锁甲: { key: 'mail', name: '锁甲' },
  板甲: { key: 'plate', name: '板甲' },
};

function readPayload(inputPath) {
  const raw = fs.readFileSync(inputPath, 'utf8');
  const match = raw.match(/(?:\["payload"\]|payload)\s*=\s*"((?:[^"\\]|\\.)*)"/s);
  if (!match) {
    throw new Error('未在导出文件中找到 payload 字段。');
  }
  return JSON.parse(decodeLuaString(match[1]));
}

function decodeLuaString(value) {
  let result = '';
  for (let index = 0; index < value.length; index += 1) {
    const char = value[index];
    if (char !== '\\') {
      result += char;
      continue;
    }

    const next = value[index + 1];
    if (next === '"' || next === '\\') {
      result += next;
      index += 1;
      continue;
    }
    if (next === 'n' || next === 'r' || next === 't') {
      result += `\\${next}`;
      index += 1;
      continue;
    }

    result += char;
  }
  return result;
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function httpsGetBuffer(url) {
  return new Promise((resolve, reject) => {
    https.get(url, {
      headers: {
        'User-Agent': 'Codex',
      },
    }, (response) => {
      if ([301, 302, 303, 307, 308].includes(response.statusCode) && response.headers.location) {
        resolve(httpsGetBuffer(response.headers.location));
        return;
      }
      if (response.statusCode !== 200) {
        reject(new Error(`请求失败: ${url} (${response.statusCode})`));
        return;
      }
      const chunks = [];
      response.on('data', (chunk) => chunks.push(chunk));
      response.on('end', () => resolve(Buffer.concat(chunks)));
    }).on('error', reject);
  });
}

async function ensureListfileCache() {
  ensureDir(CACHE_DIR);
  if (fs.existsSync(LISTFILE_CACHE_PATH)) {
    return LISTFILE_CACHE_PATH;
  }
  console.log('下载图标映射表...');
  try {
    const buffer = await httpsGetBuffer(LISTFILE_URL);
    fs.writeFileSync(LISTFILE_CACHE_PATH, buffer);
  } catch (error) {
    if (process.platform !== 'win32') {
      throw error;
    }
    const escapedTarget = LISTFILE_CACHE_PATH.replace(/'/g, "''");
    const escapedUrl = LISTFILE_URL.replace(/'/g, "''");
    execFileSync('powershell', [
      '-NoProfile',
      '-Command',
      `Invoke-WebRequest -Uri '${escapedUrl}' -Headers @{ 'User-Agent' = 'Codex' } -OutFile '${escapedTarget}'`,
    ], { stdio: 'inherit' });
  }
  return LISTFILE_CACHE_PATH;
}

function buildIconNameFromPath(filePath) {
  if (!filePath) {
    return '';
  }
  const normalized = filePath.trim().toLowerCase();
  if (!normalized.includes('interface/icons/') || !normalized.endsWith('.blp')) {
    return '';
  }
  return path.basename(normalized, '.blp').replace(/\s+/g, '');
}

function resolveIconNames(iconIds, listfilePath) {
  const targetIds = new Set(iconIds.map((id) => String(id)));
  const iconMap = {};
  const content = fs.readFileSync(listfilePath, 'utf8');
  const lines = content.split(/\r?\n/);
  for (const line of lines) {
    if (!line) {
      continue;
    }
    const separatorIndex = line.indexOf(';');
    if (separatorIndex === -1) {
      continue;
    }
    const fileId = line.slice(0, separatorIndex);
    if (!targetIds.has(fileId)) {
      continue;
    }
    const filePath = line.slice(separatorIndex + 1);
    const iconName = buildIconNameFromPath(filePath);
    if (iconName) {
      iconMap[fileId] = iconName;
    }
    if (Object.keys(iconMap).length === targetIds.size) {
      break;
    }
  }
  return iconMap;
}

async function downloadIconAsset(iconName, assetDir, attempt = 0) {
  const fileName = `${iconName}.jpg`;
  const filePath = path.join(assetDir, fileName);
  if (fs.existsSync(filePath)) {
    return fileName;
  }
  try {
    const buffer = await httpsGetBuffer(`https://wow.zamimg.com/images/wow/icons/large/${iconName}.jpg`);
    fs.writeFileSync(filePath, buffer);
    return fileName;
  } catch (error) {
    if (attempt >= 2) {
      throw error;
    }
    return downloadIconAsset(iconName, assetDir, attempt + 1);
  }
}

async function buildIconAssetMap(payload, assetDir) {
  ensureDir(assetDir);
  const iconIds = Array.from(new Set(Object.values(payload.items || {}).map((item) => item.icon).filter(Boolean)));
  const listfilePath = await ensureListfileCache();
  const iconNameMap = resolveIconNames(iconIds, listfilePath);
  const assetMap = {};
  let downloaded = 0;

  for (const [iconId, iconName] of Object.entries(iconNameMap)) {
    try {
      const fileName = await downloadIconAsset(iconName, assetDir);
      assetMap[iconId] = {
        iconName,
        iconAsset: `/assets/icons/${fileName}`,
      };
      downloaded += 1;
    } catch (error) {
      console.warn(`图标下载失败 ${iconId} ${iconName}: ${error.message}`);
    }
  }

  console.log(`图标已解析 ${Object.keys(iconNameMap).length} 个，已生成 ${downloaded} 个本地资源`);
  return assetMap;
}

function sortNumericList(value) {
  return Array.from(new Set((value || []).map(Number))).sort((left, right) => left - right);
}

function normalizeTooltipRaw(rawLines) {
  if (!Array.isArray(rawLines)) {
    return [];
  }
  return rawLines
    .map((line) => {
      if (typeof line === 'string') {
        return line.trim();
      }
      const left = line && line.left ? String(line.left).trim() : '';
      const right = line && line.right ? String(line.right).trim() : '';
      return [left, right].filter(Boolean).join(' ');
    })
    .filter((line) => line && !/^\|c/i.test(line));
}

function normalizeWhiteStats(white) {
  if (!white || Array.isArray(white)) {
    return {};
  }
  return white;
}

function getDifficultyName(source) {
  if (!source) {
    return '';
  }
  if (source.isRaid) {
    return source.difficulty === 15 ? '英雄' : String(source.difficulty || '');
  }
  return source.difficulty === 23 ? '史诗' : String(source.difficulty || '');
}

function mapSlot(item) {
  return SLOT_MAP[item.equipLoc] || { key: 'unknown', name: item.slotText || '未知' };
}

function mapArmorType(item, slot) {
  if (slot.key === 'neck' || slot.key === 'finger' || slot.key === 'cloak' || slot.key === 'trinket') {
    return { key: 'none', name: slot.name === '披风' ? '无甲种' : '无甲种' };
  }
  return ARMOR_TYPE_MAP[item.itemSubType] || { key: 'none', name: item.itemSubType || '无甲种' };
}

function buildClassItem(rawItem, classConfig, classSpecs, source, iconAssetMap) {
  const slot = mapSlot(rawItem);
  const armorType = mapArmorType(rawItem, slot);
  const tooltip = rawItem.tooltip || {};
  const parsed = tooltip.parsed || {};
  const itemTypeName = rawItem.itemSubType && slot.key === 'weapon' ? rawItem.itemSubType : rawItem.itemType;
  const tooltipRaw = normalizeTooltipRaw(tooltip.rawLines);
  const whiteStats = normalizeWhiteStats(parsed.white);
  const effects = rawItem.effects || parsed.effects || {};
  const equipEffects = Array.isArray(effects.equip) ? effects.equip : (Array.isArray(parsed.equipEffects) ? parsed.equipEffects : []);
  const useEffects = Array.isArray(effects.use) ? effects.use : (Array.isArray(parsed.useEffects) ? parsed.useEffects : []);

  return {
    id: rawItem.itemId,
    name: rawItem.name,
    icon: rawItem.icon || 0,
    iconName: iconAssetMap[rawItem.icon] ? iconAssetMap[rawItem.icon].iconName : '',
    iconAsset: iconAssetMap[rawItem.icon] ? iconAssetMap[rawItem.icon].iconAsset : '',
    slot: slot.key,
    slotName: slot.name,
    armorType: armorType.key,
    armorTypeName: armorType.name,
    itemType: rawItem.itemType || '',
    itemSubType: itemTypeName || '',
    ilvl: rawItem.itemLevel || parsed.itemLevel || 0,
    specs: sortNumericList(classSpecs),
    classes: sortNumericList(rawItem.classes),
    quality: rawItem.quality || 0,
    upgradeTrack: rawItem.upgradeTrack || parsed.upgradeTrack || '',
    tooltipFlags: rawItem.tooltipFlags || parsed.flags || { prismaticSocket: false, uniqueEquipped: false },
    stats: {
      primaryStats: Array.isArray(rawItem.primaryStats) ? rawItem.primaryStats : [],
      stamina: rawItem.stamina || parsed.stamina || null,
      secondary: Array.isArray(rawItem.secondaryStats) ? rawItem.secondaryStats : [],
      effects: {
        equip: equipEffects,
        use: useEffects,
      },
      white: whiteStats,
    },
    source: {
      instanceId: source.instanceId,
      instanceName: source.instanceName,
      isRaid: source.isRaid,
      encounterId: source.encounterId,
      encounterName: source.encounterName,
      difficulty: source.difficulty,
      difficultyName: getDifficultyName(source),
      order: source.lootOrder || 0,
    },
    tooltipRaw,
    link: rawItem.displayLink || rawItem.link || '',
    iconText: rawItem.name ? String(rawItem.name).slice(0, 1) : classConfig.abbr,
  };
}

function buildClassPayload(classConfig, payload, iconAssetMap) {
  const itemMap = payload.items || {};
  const instances = (payload.instances || []).map((instance) => {
    const encounters = (instance.encounters || []).map((encounter) => {
      const items = (encounter.itemIds || []).map((itemId) => {
        const rawItem = itemMap[String(itemId)];
        if (!rawItem) {
          return null;
        }
        const specsByClass = rawItem.specsByClass || {};
        const classSpecs = specsByClass[String(classConfig.id)];
        if (!classSpecs || !classSpecs.length) {
          return null;
        }
        const source = Array.isArray(rawItem.sources)
          ? rawItem.sources.find((entry) => entry.instanceId === instance.id && entry.encounterId === encounter.id)
          : null;
        if (!source) {
          return null;
        }
        return buildClassItem(rawItem, classConfig, classSpecs, source, iconAssetMap);
      }).filter(Boolean);

      return {
        id: encounter.id,
        name: encounter.name,
        order: encounter.order || 0,
        items,
      };
    }).filter((encounter) => encounter.items.length > 0);

    return {
      id: instance.id,
      name: instance.name,
      type: instance.isRaid ? 'raid' : 'dungeon',
      difficulty: instance.difficulty,
      order: (payload.scope && instance.isRaid ? (payload.scope.raids || []) : (payload.scope && payload.scope.dungeons) || [])
        .find((entry) => entry.id === instance.id)?.order || 0,
      encounters,
    };
  }).filter((instance) => instance.encounters.length > 0);

  const itemCount = instances.reduce((sum, instance) => {
    return sum + instance.encounters.reduce((encounterSum, encounter) => encounterSum + encounter.items.length, 0);
  }, 0);

  return {
    version: payload.build,
    addonVersion: payload.addonVersion,
    updatedAt: payload.exportTime,
    class: {
      id: classConfig.id,
      key: classConfig.key,
      name: classConfig.name,
      armorType: classConfig.armorType,
      armorTypeName: classConfig.armorTypeName,
      color: classConfig.color,
      abbr: classConfig.abbr,
    },
    specs: classConfig.specs,
    meta: {
      itemCount,
      instanceCount: instances.length,
    },
    instances,
  };
}

function writeClassFiles(outputDir, classConfig, data) {
  const jsonPath = path.join(outputDir, `${classConfig.key}.json`);
  const jsPath = path.join(outputDir, `${classConfig.key}.js`);
  const json = JSON.stringify(data, null, 2);
  fs.writeFileSync(jsonPath, `${json}\n`, 'utf8');
  fs.writeFileSync(jsPath, `module.exports = ${json};\n`, 'utf8');
}

function buildOverviewPayload(payload, classSummaries) {
  const scope = payload.scope || {};
  return {
    version: payload.build,
    addonVersion: payload.addonVersion,
    updatedAt: payload.exportTime,
    scope: {
      dungeonCount: Array.isArray(scope.dungeons) ? scope.dungeons.length : 0,
      raidCount: Array.isArray(scope.raids) ? scope.raids.length : 0,
      dungeons: Array.isArray(scope.dungeons) ? scope.dungeons : [],
      raids: Array.isArray(scope.raids) ? scope.raids : [],
      skippedRaids: Array.isArray(scope.skippedRaids) ? scope.skippedRaids : [],
    },
    classes: classSummaries,
  };
}

function writeOverviewFiles(outputDir, data) {
  const jsonPath = path.join(outputDir, 'overview.json');
  const jsPath = path.join(outputDir, 'overview.js');
  const json = JSON.stringify(data, null, 2);
  fs.writeFileSync(jsonPath, `${json}\n`, 'utf8');
  fs.writeFileSync(jsPath, `module.exports = ${json};\n`, 'utf8');
}

function parseArgs(argv) {
  const args = {};
  for (let index = 2; index < argv.length; index += 1) {
    const key = argv[index];
    const value = argv[index + 1];
    if (!key.startsWith('--')) {
      continue;
    }
    args[key.slice(2)] = value;
    index += 1;
  }
  return args;
}

async function main() {
  const args = parseArgs(process.argv);
  const inputPath = args.input;
  if (!inputPath) {
    throw new Error('用法: node scripts/parse-export.js --input <WoWLookExport3.lua路径> [--output miniprogram/data]');
  }

  const outputDir = args.output
    ? path.resolve(process.cwd(), args.output)
    : DEFAULT_OUTPUT_DIR;
  const assetDir = args.assets
    ? path.resolve(process.cwd(), args.assets)
    : DEFAULT_ASSET_DIR;

  const payload = readPayload(path.resolve(process.cwd(), inputPath));
  ensureDir(outputDir);
  const iconAssetMap = await buildIconAssetMap(payload, assetDir);

  const classSummaries = [];
  CLASS_CONFIG.forEach((classConfig) => {
    const classData = buildClassPayload(classConfig, payload, iconAssetMap);
    writeClassFiles(outputDir, classConfig, classData);
    classSummaries.push({
      id: classConfig.id,
      key: classConfig.key,
      name: classConfig.name,
      itemCount: classData.meta.itemCount,
      color: classConfig.color,
      abbr: classConfig.abbr,
      armorTypeName: classConfig.armorTypeName,
    });
    console.log(`${classConfig.name}: ${classData.meta.itemCount} 件装备`);
  });

  writeOverviewFiles(outputDir, buildOverviewPayload(payload, classSummaries));
  console.log(`输出目录: ${outputDir}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
