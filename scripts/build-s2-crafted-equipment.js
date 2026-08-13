const fs = require('fs');
const path = require('path');
const https = require('https');
const {
  CLASS_CONFIG,
  buildCraftedItem,
  buildCraftedInstance,
  removeExistingCraftedInstances,
  countItems,
} = require('./build-44x-crafted');

const ROOT = path.resolve(__dirname, '..');
const DATA_DIR = path.join(ROOT, 'cos-upload', 'data-12.1-s2-crafted-preview');
const ICON_DIR = path.join(ROOT, 'cos-upload', 'assets', 'icons');
const TARGET_ITEM_LEVEL = 331;
const TARGET_RULE = 's2_myth_mistcrest_quality_5';
const TOOLTIP_CACHE = path.join(ROOT, '.cache', 's2-crafted-tooltip-cache.json');

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function getJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'WoWLook-S2-Data-Builder/1.0' } }, (response) => {
      if (response.statusCode !== 200) {
        response.resume();
        reject(new Error(`请求物品说明框失败：${response.statusCode} ${url}`));
        return;
      }
      const chunks = [];
      response.on('data', (chunk) => chunks.push(chunk));
      response.on('end', () => {
        try {
          resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')));
        } catch (error) {
          reject(new Error(`物品说明框 JSON 无法解析：${url} (${error.message})`));
        }
      });
    }).on('error', reject);
  });
}

function downloadFile(url, filePath) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'WoWLook-S2-Data-Builder/1.0' } }, (response) => {
      if (response.statusCode !== 200) {
        response.resume();
        reject(new Error(`下载图标失败：${response.statusCode} ${url}`));
        return;
      }
      const file = fs.createWriteStream(filePath);
      response.pipe(file);
      file.on('finish', () => file.close(resolve));
      file.on('error', reject);
    }).on('error', reject);
  });
}

function decodeHtml(value) {
  return String(value || '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function htmlText(value) {
  return decodeHtml(String(value || '').replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ').trim();
}

function numberFromText(value) {
  const match = String(value || '').replace(/,/g, '').match(/\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : 0;
}

function statType(label) {
  const normalized = String(label || '').toLowerCase();
  if (/strength|力量/.test(normalized)) return 'strength';
  if (/agility|敏捷/.test(normalized)) return 'agility';
  if (/intellect|智力/.test(normalized)) return 'intellect';
  if (/stamina|耐力/.test(normalized)) return 'stamina';
  if (/critical strike|crit|暴击|爆击/.test(normalized)) return 'crit';
  if (/haste|急速/.test(normalized)) return 'haste';
  if (/mastery|精通/.test(normalized)) return 'mastery';
  if (/versatility|全能/.test(normalized)) return 'versatility';
  return '';
}

function statTypes(label) {
  const normalized = String(label || '').toLowerCase();
  return [
    ['strength', /strength|力量/],
    ['agility', /agility|敏捷/],
    ['intellect', /intellect|智力/],
  ].filter(([, pattern]) => pattern.test(normalized)).map(([type]) => type);
}

function statName(type) {
  return {
    strength: '力量', agility: '敏捷', intellect: '智力', stamina: '耐力',
    crit: '暴击', haste: '急速', mastery: '精通', versatility: '全能',
  }[type] || '';
}

function extractTooltipLines(tooltip) {
  return String(tooltip || '')
    .replace(/<br\s*\/?\s*>/gi, '\n')
    .replace(/<\/tr>/gi, '\n')
    .replace(/<\/table>/gi, '\n')
    .split('\n')
    .map(htmlText)
    .filter(Boolean);
}

function parseTooltip(itemId, payload) {
  const tooltip = payload && payload.tooltip;
  const itemLevelMatch = String(tooltip || '').match(/<!--ilvl-->(\d+)/);
  const itemLevel = itemLevelMatch ? Number(itemLevelMatch[1]) : 0;
  if (itemLevel !== TARGET_ITEM_LEVEL) {
    throw new Error(`物品 ${itemId} 未得到 ${TARGET_ITEM_LEVEL} 装等说明框，实际为 ${itemLevel || '未知'}`);
  }

  const primaryStats = [];
  const primaryStatOptionTypes = [];
  const secondaryStats = [];
  let stamina = null;
  const statPattern = /<!--stat\d+-->([^<]+)/g;
  let statMatch;
  while ((statMatch = statPattern.exec(String(tooltip || ''))) !== null) {
    const text = htmlText(statMatch[1]);
    const value = numberFromText(text);
    const type = statType(text);
    if (!value || !type) continue;
    const entry = { type, name: statName(type), value };
    if (type === 'stamina') stamina = entry;
    else if (['strength', 'agility', 'intellect'].includes(type)) {
      const types = statTypes(text);
      types.forEach((optionType) => {
        if (!primaryStatOptionTypes.includes(optionType)) primaryStatOptionTypes.push(optionType);
      });
      primaryStats.push(entry);
    }
    else secondaryStats.push(entry);
  }

  const randomAttributeSlots = [];
  const randomPattern = /<!--rtg\d+-->(\d[\d,]*)\s*(?:Random Stat|随机属性)/g;
  let randomMatch;
  while ((randomMatch = randomPattern.exec(String(tooltip || ''))) !== null) {
    randomAttributeSlots.push({
      index: randomAttributeSlots.length + 1,
      value: Number(randomMatch[1].replace(/,/g, '')),
      label: `随机属性${randomAttributeSlots.length + 1}`,
    });
  }

  const armorMatch = String(tooltip || '').match(/<!--amr-->([\d,]+)/);
  const white = {};
  if (armorMatch) white.armor = Number(armorMatch[1].replace(/,/g, ''));
  const lines = extractTooltipLines(tooltip);
  const effects = { equip: [], use: [] };
  lines.forEach((line) => {
    if (/^(Equip|装备)[:：]/i.test(line)) effects.equip.push(line.replace(/^(Equip|装备)[:：]\s*/i, ''));
    if (/^(Use|使用)[:：]/i.test(line)) effects.use.push(line.replace(/^(Use|使用)[:：]\s*/i, ''));
  });

  return {
    itemLevel,
    quality: Number(payload.quality) || 4,
    iconName: payload.icon || '',
    primaryStats,
    primaryStatOptionTypes,
    stamina,
    fixedSecondaryStats: secondaryStats,
    randomAttributeCount: randomAttributeSlots.length,
    randomAttributeSlots,
    effects,
    white,
    flags: {
      uniqueEquipped: lines.some((line) => /Unique-Equipped|装备唯一/i.test(line)),
      prismaticSocket: lines.some((line) => /Prismatic Socket|棱彩插槽/i.test(line)),
    },
    tooltipRaw: [],
    link: `https://www.wowhead.com/item=${itemId}?ilvl=${TARGET_ITEM_LEVEL}`,
  };
}

async function ensureIcons(records) {
  fs.mkdirSync(ICON_DIR, { recursive: true });
  const names = Array.from(new Set(records.map((record) => record.iconName).filter(Boolean)));
  for (const iconName of names) {
    const filePath = path.join(ICON_DIR, `${iconName}.jpg`);
    if (!fs.existsSync(filePath)) {
      await downloadFile(`https://wow.zamimg.com/images/wow/icons/large/${iconName}.jpg`, filePath);
    }
  }
  return new Map(names.map((iconName) => [iconName, `/assets/icons/${iconName}.jpg`]));
}

async function fetchRecords(candidates) {
  const cache = fs.existsSync(TOOLTIP_CACHE) ? readJson(TOOLTIP_CACHE) : {};
  const records = [];
  for (const [index, candidate] of candidates.entries()) {
    const cacheKey = `${candidate.itemId}:${TARGET_ITEM_LEVEL}:zhCN`;
    let payload = cache[cacheKey];
    if (!payload) {
      payload = await getJson(`https://nether.wowhead.com/tooltip/item/${candidate.itemId}?dataEnv=1&locale=4&ilvl=${TARGET_ITEM_LEVEL}`);
      cache[cacheKey] = payload;
    }
    const parsed = parseTooltip(candidate.itemId, payload);
    records.push({
      recipeId: candidate.recipeId,
      itemId: candidate.itemId,
      name: candidate.itemName,
      icon: candidate.icon || 0,
      iconName: parsed.iconName,
      professionId: candidate.professionId,
      professionName: candidate.professionName,
      skillLineAbilityId: candidate.skillLineAbilityId || 0,
      expansionId: candidate.expansionId || 0,
      itemType: candidate.itemType,
      itemSubType: candidate.itemSubType,
      equipLoc: candidate.equipLoc,
      quality: parsed.quality,
      itemLevel: parsed.itemLevel,
      primaryStats: parsed.primaryStats,
      primaryStatOptionTypes: parsed.primaryStatOptionTypes,
      stamina: parsed.stamina,
      fixedSecondaryStats: parsed.fixedSecondaryStats,
      randomAttributeCount: parsed.randomAttributeCount,
      randomAttributeSlots: parsed.randomAttributeSlots,
      effects: parsed.effects,
      white: parsed.white,
      flags: parsed.flags,
      tooltipRaw: parsed.tooltipRaw,
      link: parsed.link,
      source: {
        type: 'crafted',
        candidateItemLevel: candidate.iLvlMin,
        targetItemLevel: TARGET_ITEM_LEVEL,
        targetRule: TARGET_RULE,
        tooltipSource: 'wowhead_item_tooltip_ilvl',
        tooltipSourceItemLevel: TARGET_ITEM_LEVEL,
      },
      captureStatus: 'tooltip_verified',
    });
    console.log(`说明框 ${index + 1}/${candidates.length}: ${candidate.itemId} ${candidate.itemName}`);
  }
  fs.mkdirSync(path.dirname(TOOLTIP_CACHE), { recursive: true });
  writeJson(TOOLTIP_CACHE, cache);
  return records;
}

const PRIMARY_STAT_BY_SPEC = {
  71: 'strength', 72: 'strength', 73: 'strength',
  65: 'intellect', 66: 'strength', 70: 'strength',
  253: 'agility', 254: 'agility', 255: 'agility',
  259: 'agility', 260: 'agility', 261: 'agility',
  256: 'intellect', 257: 'intellect', 258: 'intellect',
  250: 'strength', 251: 'strength', 252: 'strength',
  262: 'intellect', 263: 'agility', 264: 'intellect',
  62: 'intellect', 63: 'intellect', 64: 'intellect',
  265: 'intellect', 266: 'intellect', 267: 'intellect',
  268: 'agility', 269: 'agility', 270: 'intellect',
  102: 'intellect', 103: 'agility', 104: 'agility', 105: 'intellect',
  577: 'agility', 581: 'agility', 1480: 'agility',
  1467: 'intellect', 1468: 'intellect', 1473: 'intellect',
};

function buildCraftedItemsForClass(record, classConfig, iconLookup) {
  const baseItem = buildCraftedItem(record, classConfig, iconLookup);
  if (!baseItem) return [];
  const options = record.primaryStatOptionTypes || [];
  if (options.length < 2 || !baseItem.stats.primaryStats.length) return [baseItem];
  const value = baseItem.stats.primaryStats[0].value;
  const groups = {};
  baseItem.specs.forEach((specId) => {
    const type = PRIMARY_STAT_BY_SPEC[specId];
    const chosen = options.includes(type) ? type : baseItem.stats.primaryStats[0].type;
    groups[chosen] = groups[chosen] || [];
    groups[chosen].push(specId);
  });
  return Object.entries(groups).map(([type, specs]) => ({
    ...baseItem,
    specs,
    stats: {
      ...baseItem.stats,
      primaryStats: [{ type, name: statName(type), value }],
    },
  }));
}

function buildData(records, iconAssets) {
  const iconLookup = new Map(records.map((record) => [Number(record.icon), {
    iconName: record.iconName,
    iconAsset: iconAssets.get(record.iconName) || '',
  }]));
  const classCounts = [];
  CLASS_CONFIG.forEach((classConfig) => {
    const filePath = path.join(DATA_DIR, `${classConfig.key}.json`);
    const baseData = readJson(filePath);
    const craftedItems = records
      .flatMap((record) => buildCraftedItemsForClass(record, classConfig, iconLookup));
    const instances = removeExistingCraftedInstances(baseData.instances);
    instances.push(buildCraftedInstance(craftedItems));
    const output = {
      ...baseData,
      meta: {
        ...(baseData.meta || {}),
        itemCount: countItems(instances),
        instanceCount: instances.length,
        tierItemCount: countItems(instances, (item) => item.sourceType === 'tier'),
        craftedItemCount: craftedItems.length,
      },
      instances,
    };
    writeJson(filePath, output);
    classCounts.push({ key: classConfig.key, count: craftedItems.length });
  });

  const overviewPath = path.join(DATA_DIR, 'overview.json');
  const overview = readJson(overviewPath);
  overview.craftedEquipment = {
    catalogStatus: 'tooltip_verified_s2_myth_quality_5',
    targetItemLevel: TARGET_ITEM_LEVEL,
    targetRule: TARGET_RULE,
    candidateCount: records.length,
    verifiedMaximumCount: records.length,
    visibleItemCount: records.length,
    source: 'Wowhead item tooltip API with ilvl=331',
    verificationNote: '仅包含本客户端导出的 246 起始装等 S2 制造候选；随机属性槽保留为玩家可选配置。',
    classes: classCounts,
  };
  writeJson(overviewPath, overview);
  writeJson(path.join(DATA_DIR, 'crafted-equipment.json'), {
    dataVersion: '12.1-s2',
    targetItemLevel: TARGET_ITEM_LEVEL,
    targetRule: TARGET_RULE,
    recordCount: records.length,
    records,
  });
}

async function main() {
  const catalog = readJson(path.join(DATA_DIR, 'crafting-candidates.json'));
  const candidates = (catalog.candidates || [])
    .filter((candidate) => Number(candidate.iLvlMin) === 246)
    .sort((left, right) => Number(left.recipeId) - Number(right.recipeId));
  if (candidates.length !== 98) {
    throw new Error(`S2 制造候选数量异常：预期 98，实际 ${candidates.length}`);
  }
  const records = await fetchRecords(candidates);
  if (new Set(records.map((record) => record.itemId)).size !== 98) {
    throw new Error('S2 制造物品 ID 不唯一。');
  }
  const iconAssets = await ensureIcons(records);
  buildData(records, iconAssets);
  console.log(`已写入 ${records.length} 件 S2 制造装备（最高装等 ${TARGET_ITEM_LEVEL}）。`);
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}

module.exports = { parseTooltip, TARGET_ITEM_LEVEL, TARGET_RULE };
