const fs = require('fs');
const path = require('path');
const https = require('https');
const { execFileSync } = require('child_process');

const ROOT_DIR = path.resolve(__dirname, '..');
const DEFAULT_OUTPUT_DIR = path.join(ROOT_DIR, 'cos-upload', 'data');
const DEFAULT_ASSET_DIR = path.join(ROOT_DIR, 'cos-upload', 'assets', 'icons');
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

const TIER_SLOT_KEY_MAP = {
  back: 'cloak',
  hands: 'hand',
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

function buildClassMapByKey(list = []) {
  return list.reduce((map, item) => {
    map[item.key] = item;
    return map;
  }, {});
}

const CLASS_MAP_BY_KEY = buildClassMapByKey(CLASS_CONFIG);

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

async function buildIconAssetMap(payload, assetDir, tierPayload, options = {}) {
  ensureDir(assetDir);
  const iconIds = new Set(Object.values(payload.items || {}).map((item) => item.icon).filter(Boolean));
  (tierPayload && Array.isArray(tierPayload.classes) ? tierPayload.classes : []).forEach((classEntry) => {
    (classEntry.items || []).forEach((item) => {
      if (item.icon) {
        iconIds.add(item.icon);
      }
    });
  });
  const listfilePath = await ensureListfileCache();
  const iconNameMap = resolveIconNames(Array.from(iconIds), listfilePath);
  const assetMap = {};
  let downloaded = 0;

  for (const [iconId, iconName] of Object.entries(iconNameMap)) {
    const fileName = `${iconName}.jpg`;
    const filePath = path.join(assetDir, fileName);
    if (options.skipIconDownload) {
      assetMap[iconId] = {
        iconName,
        iconAsset: fs.existsSync(filePath) ? `/assets/icons/${fileName}` : '',
      };
      if (fs.existsSync(filePath)) {
        downloaded += 1;
      }
      continue;
    }
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

function normalizeTooltipText(value) {
  return String(value || '')
    .replace(/\r\n/g, '\n')
    .replace(/\|c[0-9a-fA-F]{8}/g, '')
    .replace(/\|r/g, '')
    .replace(/(\d+)\|4([^:;]+):[^;]+;/g, '$1$2')
    .replace(/\n+/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .trim();
}

function normalizeEffectList(effects) {
  if (!Array.isArray(effects)) {
    return [];
  }
  const seen = new Set();
  return effects
    .map(normalizeTooltipText)
    .filter((line) => {
      const key = line.replace(/\s+/g, '');
      if (!key || seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
}

function normalizeTooltipRaw(rawLines) {
  if (!Array.isArray(rawLines)) {
    return [];
  }
  return rawLines
    .map((line) => {
      if (typeof line === 'string') {
        return normalizeTooltipText(line);
      }
      const left = line && line.left ? String(line.left).trim() : '';
      const right = line && line.right ? String(line.right).trim() : '';
      return normalizeTooltipText([left, right].filter(Boolean).join(' '));
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
  const equipEffects = normalizeEffectList(Array.isArray(effects.equip) ? effects.equip : (Array.isArray(parsed.equipEffects) ? parsed.equipEffects : []));
  const useEffects = normalizeEffectList(Array.isArray(effects.use) ? effects.use : (Array.isArray(parsed.useEffects) ? parsed.useEffects : []));

  const allowedSpecIds = new Set((classConfig.specs || []).map((spec) => spec.id));
  const normalizedSpecs = sortNumericList(classSpecs).filter((specId) => allowedSpecIds.has(specId));

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
    specs: normalizedSpecs,
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

function normalizeTierBonusesBySpec(bonusesBySpec = {}) {
  const normalized = {};
  Object.entries(bonusesBySpec).forEach(([specId, entry]) => {
    const tooltipParsed = entry && entry.tooltip && entry.tooltip.parsed ? entry.tooltip.parsed : {};
    const setBonuses = Array.isArray(tooltipParsed.setData && tooltipParsed.setData.bonuses)
      ? tooltipParsed.setData.bonuses
      : [];
    const spellResolved = entry && entry.spells && Array.isArray(entry.spells.resolved)
      ? entry.spells.resolved
      : [];
    const twoPiece = setBonuses.find((bonus) => bonus.pieces === 2) || null;
    const fourPiece = setBonuses.find((bonus) => bonus.pieces === 4) || null;
    normalized[String(specId)] = {
      specId: entry.specId || Number(specId),
      specName: entry.specName || '',
      twoPiece: twoPiece ? normalizeTooltipText(twoPiece.text) : normalizeTooltipText((spellResolved[0] && spellResolved[0].description) || ''),
      fourPiece: fourPiece ? normalizeTooltipText(fourPiece.text) : normalizeTooltipText((spellResolved[1] && spellResolved[1].description) || ''),
      spells: spellResolved.map((spell) => ({
        spellId: spell.spellId,
        name: spell.name || '',
        description: normalizeTooltipText(spell.description || ''),
      })),
    };
  });
  return normalized;
}

function normalizeStatRecord(stat) {
  if (!stat) {
    return null;
  }
  const type = stat.type || stat.key || '';
  return {
    key: stat.key || type,
    type,
    name: stat.name || '',
    value: stat.value || 0,
  };
}

function buildTierItem(rawItem, classConfig, classData, iconAssetMap) {
  const tooltip = rawItem.tooltip || {};
  const parsed = tooltip.parsed || {};
  const rawSlot = mapSlot(rawItem);
  const parsedSlotKey = (rawItem.appearance && rawItem.appearance.slotKey) || parsed.slotKey || rawSlot.key || '';
  const mappedSlotKey = TIER_SLOT_KEY_MAP[parsedSlotKey] || TIER_SLOT_KEY_MAP[rawSlot.key] || rawSlot.key || parsedSlotKey || 'unknown';
  const slot = {
    key: mappedSlotKey,
    name: rawSlot.name || parsed.slotText || '未知',
  };
  const armorType = mapArmorType({
    itemSubType: rawItem.itemSubType || parsed.armorType || '',
  }, slot);
  const appearance = rawItem.appearance || {};
  const setName = normalizeTooltipText(
    (parsed.setData && parsed.setData.name) ||
    appearance.transmogSetName ||
    (rawItem.setInfoRaw && rawItem.setInfoRaw.raw) ||
    classData.setName ||
    ''
  );
  const tierPieces = Array.isArray(classData.items)
    ? classData.items.map((item) => item.name).filter(Boolean)
    : [];
  const tooltipRaw = normalizeTooltipRaw(tooltip.rawLines);
  const whiteStats = normalizeWhiteStats(parsed.white);
  const primaryStats = (Array.isArray(parsed.primaryStats) ? parsed.primaryStats : [])
    .map(normalizeStatRecord)
    .filter(Boolean);
  const secondaryStats = (Array.isArray(parsed.secondaryStats) ? parsed.secondaryStats : [])
    .map(normalizeStatRecord)
    .filter(Boolean);
  const stamina = normalizeStatRecord(parsed.stamina);
  const tierBonusesBySpec = normalizeTierBonusesBySpec(rawItem.bonusesBySpec || {});
  const classSpecs = (classData.specs || []).map((spec) => spec.id || spec.specId).filter(Boolean);
  const sourceName = setName || '职业套装';
  const sourceDifficulty = [appearance.transmogSetLabel, appearance.transmogSetDescription]
    .filter(Boolean)
    .join(' · ') || parsed.upgradeTrack || '英雄 2/6';
  const source = {
    instanceId: `tier:${classConfig.key}`,
    instanceName: '套装',
    isRaid: false,
    encounterId: `tier-set:${classConfig.key}`,
    encounterName: sourceName,
    difficulty: 5,
    difficultyName: sourceDifficulty,
    order: 999,
  };

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
    itemSubType: rawItem.itemSubType || '',
    ilvl: rawItem.itemLevel || parsed.itemLevel || 0,
    specs: classSpecs,
    classes: [classConfig.id],
    quality: rawItem.quality || 0,
    upgradeTrack: rawItem.upgradeTrack || parsed.upgradeTrack || '',
    tooltipFlags: parsed.flags || { prismaticSocket: false, uniqueEquipped: false },
    stats: {
      primaryStats,
      stamina,
      secondary: secondaryStats,
      effects: {
        equip: [],
        use: [],
      },
      white: whiteStats,
    },
    source,
    sourceType: 'tier',
    tooltipRaw,
    link: rawItem.seasonLink || rawItem.baseLink || '',
    iconText: rawItem.name ? String(rawItem.name).slice(0, 1) : classConfig.abbr,
    isBonusPiece: rawItem.isBonusPiece !== false,
    collectionKind: rawItem.collectionKind || 'bonus',
    appearance: rawItem.appearance || null,
    tier: {
      setId: appearance.transmogSetId || rawItem.setId || 0,
      setName,
      pieceCount: classData.appearanceItemCount || classData.itemCount || (parsed.setData && parsed.setData.totalCount) || 5,
      pieces: tierPieces.length ? tierPieces : (Array.isArray(parsed.setData && parsed.setData.pieces) ? parsed.setData.pieces : []),
      bonusesBySpec: tierBonusesBySpec,
      sourceLabel: '套装',
    },
  };
}

function buildTierInstance(classConfig, tierPayload, iconAssetMap) {
  if (!tierPayload || !Array.isArray(tierPayload.classes)) {
    return null;
  }
  const classData = tierPayload.classes.find((entry) => entry.classKey === classConfig.key);
  if (!classData || !Array.isArray(classData.items) || !classData.items.length) {
    return null;
  }

  const items = classData.items.map((item) => buildTierItem(item, classConfig, classData, iconAssetMap));
  return {
    id: `tier:${classConfig.key}`,
    name: '套装',
    type: 'tier',
    difficulty: 5,
    order: 999,
    encounters: [{
      id: `tier-set:${classConfig.key}`,
      name: items[0] && items[0].tier && items[0].tier.setName ? items[0].tier.setName : '职业套装',
      order: 0,
      items,
    }],
  };
}

function buildClassPayload(classConfig, payload, iconAssetMap, tierPayload) {
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

  const tierInstance = buildTierInstance(classConfig, tierPayload, iconAssetMap);
  if (tierInstance) {
    instances.push(tierInstance);
  }

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

function readJsonFile(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function replaceTierInstance(instances, tierInstance) {
  const withoutTier = (instances || []).filter((instance) => instance.type !== 'tier' && !String(instance.id).startsWith('tier:'));
  if (tierInstance) {
    withoutTier.push(tierInstance);
  }
  return withoutTier;
}

function buildClassPayloadFromBaseData(classConfig, baseDataDir, iconAssetMap, tierPayload, dataVersion) {
  const basePath = path.join(baseDataDir, `${classConfig.key}.json`);
  const classData = readJsonFile(basePath);
  const tierInstance = buildTierInstance(classConfig, tierPayload, iconAssetMap);
  const instances = replaceTierInstance(classData.instances || [], tierInstance);
  const itemCount = instances.reduce((sum, instance) => {
    return sum + instance.encounters.reduce((encounterSum, encounter) => encounterSum + encounter.items.length, 0);
  }, 0);

  return {
    ...classData,
    dataVersion: dataVersion || classData.dataVersion,
    meta: {
      ...(classData.meta || {}),
      itemCount,
      instanceCount: instances.length,
      tierItemCount: countItemsFromInstances(instances, (item) => item.sourceType === 'tier'),
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

function buildOverviewFromBaseData(baseDataDir, classSummaries, dataVersion) {
  const overviewPath = path.join(baseDataDir, 'overview.json');
  const overview = fs.existsSync(overviewPath) ? readJsonFile(overviewPath) : {};
  return {
    ...overview,
    dataVersion: dataVersion || overview.dataVersion,
    classes: classSummaries,
  };
}

function countItemsFromInstances(instances = [], predicate = null) {
  let total = 0;
  (instances || []).forEach((instance) => {
    (instance.encounters || []).forEach((encounter) => {
      (encounter.items || []).forEach((item) => {
        if (!predicate || predicate(item)) {
          total += 1;
        }
      });
    });
  });
  return total;
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
  const baseDataDir = args['base-data']
    ? path.resolve(process.cwd(), args['base-data'])
    : null;
  if (!inputPath && !baseDataDir) {
    throw new Error('用法: node scripts/parse-export.js --input <WoWLookExport3.lua路径> [--tier-input <WoWLookTierExport.lua路径>] [--output cos-upload/data] 或 node scripts/parse-export.js --base-data cos-upload/data --tier-input <WoWLookTierExport.lua路径> --output cos-upload/data-4.2.x');
  }
  const tierInputPath = args['tier-input'];
  const dataVersion = args['data-version'] || '';
  const skipIconDownload = args['skip-icon-download'] === 'true' || args['skip-icon-download'] === '1';

  const outputDir = args.output
    ? path.resolve(process.cwd(), args.output)
    : DEFAULT_OUTPUT_DIR;
  const assetDir = args.assets
    ? path.resolve(process.cwd(), args.assets)
    : DEFAULT_ASSET_DIR;

  const tierPayload = tierInputPath ? readPayload(path.resolve(process.cwd(), tierInputPath)) : null;
  ensureDir(outputDir);

  if (baseDataDir) {
    if (!tierPayload) {
      throw new Error('--base-data 模式必须提供 --tier-input。');
    }
    const iconAssetMap = await buildIconAssetMap({ items: {} }, assetDir, tierPayload, { skipIconDownload });
    const classSummaries = [];
    CLASS_CONFIG.forEach((classConfig) => {
      const classData = buildClassPayloadFromBaseData(classConfig, baseDataDir, iconAssetMap, tierPayload, dataVersion);
      writeClassFiles(outputDir, classConfig, classData);
      classSummaries.push({
        id: classConfig.id,
        key: classConfig.key,
        name: classConfig.name,
        itemCount: classData.meta.itemCount,
        tierItemCount: countItemsFromInstances(classData.instances, (item) => item.sourceType === 'tier'),
        color: classConfig.color,
        abbr: classConfig.abbr,
        armorTypeName: classConfig.armorTypeName,
      });
      console.log(`${classConfig.name}: ${classData.meta.itemCount} 件装备（套装 ${classData.meta.tierItemCount} 件）`);
    });
    writeOverviewFiles(outputDir, buildOverviewFromBaseData(baseDataDir, classSummaries, dataVersion));
    console.log(`输出目录: ${outputDir}`);
    return;
  }

  const payload = readPayload(path.resolve(process.cwd(), inputPath));
  const iconAssetMap = await buildIconAssetMap(payload, assetDir, tierPayload, { skipIconDownload });

  const classSummaries = [];
  CLASS_CONFIG.forEach((classConfig) => {
    const classData = buildClassPayload(classConfig, payload, iconAssetMap, tierPayload);
    writeClassFiles(outputDir, classConfig, classData);
    classSummaries.push({
      id: classConfig.id,
      key: classConfig.key,
      name: classConfig.name,
      itemCount: classData.meta.itemCount,
      tierItemCount: countItemsFromInstances(classData.instances, (item) => item.sourceType === 'tier'),
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
