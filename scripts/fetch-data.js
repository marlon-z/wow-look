const fs = require('fs');
const path = require('path');
const https = require('https');

const CLIENT_ID = process.env.BLIZZ_CLIENT_ID || 'ef493b018f2a4948b86780dfb9fc2549';
const CLIENT_SECRET = process.env.BLIZZ_CLIENT_SECRET || '77REvGoG6zhJrjSCNUX06WSdQzGlm6UE';

const OUTPUT_DIR = path.join(__dirname, '..', 'miniprogram', 'data');
const TARGET_ILVL = 246;
const RAID_DIFFICULTY_ID = 14;

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

const DUNGEON_CONFIG = [
  { challengeModeId: 161, journalInstanceId: 476 },
  { challengeModeId: 239, journalInstanceId: 945 },
  { challengeModeId: 402, journalInstanceId: 1201 },
  { challengeModeId: 556, journalInstanceId: 278 },
  { challengeModeId: 557, journalInstanceId: 1299 },
  { challengeModeId: 558, journalInstanceId: 1300 },
  { challengeModeId: 559, journalInstanceId: 1316 },
  { challengeModeId: 560, journalInstanceId: 1315 }
];

const SLOT_MAP = {
  HEAD: { key: 'head', name: '头部' },
  SHOULDER: { key: 'shoulder', name: '肩部' },
  CLOAK: { key: 'cloak', name: '披风' },
  CHEST: { key: 'chest', name: '胸部' },
  ROBE: { key: 'chest', name: '胸部' },
  WRIST: { key: 'wrist', name: '护腕' },
  HAND: { key: 'hand', name: '手部' },
  WAIST: { key: 'waist', name: '腰部' },
  LEGS: { key: 'legs', name: '腿部' },
  FEET: { key: 'feet', name: '脚部' },
  NECK: { key: 'neck', name: '项链' },
  FINGER: { key: 'finger', name: '戒指' },
  TRINKET: { key: 'trinket', name: '饰品' },
  WEAPON: { key: 'weapon', name: '武器' },
  TWOHWEAPON: { key: 'weapon', name: '武器' },
  SHIELD: { key: 'weapon', name: '武器' },
  HOLDABLE: { key: 'weapon', name: '武器' },
  RANGED: { key: 'weapon', name: '武器' },
  RANGEDRIGHT: { key: 'weapon', name: '武器' },
  WEAPONMAINHAND: { key: 'weapon', name: '武器' },
  WEAPONOFFHAND: { key: 'weapon', name: '武器' }
};

const ARMOR_TYPE_MAP = {
  1: { key: 'cloth', name: '布甲' },
  2: { key: 'leather', name: '皮甲' },
  3: { key: 'mail', name: '锁甲' },
  4: { key: 'plate', name: '板甲' }
};

const PRIMARY_STAT_MAP = {
  智力: { type: 'intellect', name: '智力' },
  敏捷: { type: 'agility', name: '敏捷' },
  力量: { type: 'strength', name: '力量' }
};

const SECONDARY_STAT_MAP = {
  rtg32: { type: 'crit', name: '暴击' },
  rtg36: { type: 'haste', name: '急速' },
  rtg49: { type: 'mastery', name: '精通' },
  rtg40: { type: 'versatility', name: '全能' }
};

const DUNGEON_BOSS_ALIASES = {
  krick: 'ickandkrick',
  ick: 'ickandkrick',
  kalis: 'derelictduo',
  millificent: 'millificentsmolderbellow',
  gnomercy: 'millificentsmolderbellow',
  'speaker shadowcrown': 'speakerhalerocshadowcrown'
};

const MODERN_DUNGEON_JOURNAL_IDS = new Set([1299, 1300, 1315, 1316]);

function ensureOutputDir() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function httpsGet(url, headers = {}, redirectCount = 0, attempt = 0) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers }, (res) => {
      if ([301, 302, 303, 307, 308].includes(res.statusCode) && res.headers.location) {
        if (redirectCount >= 5) {
          reject(new Error(`Too many redirects: ${url}`));
          return;
        }

        const nextUrl = new URL(res.headers.location, url).toString();
        resolve(httpsGet(nextUrl, headers, redirectCount + 1, attempt));
        return;
      }

      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => resolve(data));
    });
    req.on('error', async (error) => {
      if (attempt >= 2) {
        reject(error);
        return;
      }

      await sleep(500 * (attempt + 1));
      resolve(httpsGet(url, headers, redirectCount, attempt + 1));
    });
    req.setTimeout(20000, () => {
      req.destroy();
      reject(new Error(`Request timeout: ${url}`));
    });
  });
}

function httpsPost(url, body) {
  return new Promise((resolve, reject) => {
    const target = new URL(url);
    const request = https.request({
      hostname: target.hostname,
      path: target.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(body)
      }
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => resolve(data));
    });
    request.on('error', reject);
    request.setTimeout(20000, () => {
      request.destroy();
      reject(new Error(`Request timeout: ${url}`));
    });
    request.write(body);
    request.end();
  });
}

function decodeHtml(text = '') {
  return text
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ');
}

function normalizeText(text = '') {
  return text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '');
}

function parseNumberList(raw) {
  return raw
    .split(',')
    .map((value) => parseInt(value.trim(), 10))
    .filter((value) => Number.isFinite(value));
}

function parseDungeonsLua(content) {
  const entries = [];
  const regex = /challengeModeId = (\d+).*?instanceId = (\d+), lootTable = \{([^}]*)\}/g;
  let match;

  while ((match = regex.exec(content))) {
    entries.push({
      challengeModeId: parseInt(match[1], 10),
      instanceId: parseInt(match[2], 10),
      lootTable: parseNumberList(match[3])
    });
  }

  return entries;
}

function parseItemsLua(content) {
  const items = {};
  const lines = content.split(/\r?\n/);

  for (const line of lines) {
    const header = line.match(/^\s*\[(\d+)\]\s*=\s*\{(.*)\},?\s*$/);
    if (!header) {
      continue;
    }

    const itemId = parseInt(header[1], 10);
    const body = header[2];
    const bodyMatch = body.match(/classes = \{([\s\S]*?)\},\s*(?:stats = \{([^}]*)\},\s*)?icon = (\d+),\s*slotId = (\d+)/);
    if (!bodyMatch) {
      continue;
    }

    const classes = {};
    const classSection = bodyMatch[1];
    const classRegex = /\[(\d+)\]\s*=\s*\{([^}]*)\}/g;
    let classMatch;

    while ((classMatch = classRegex.exec(classSection))) {
      classes[parseInt(classMatch[1], 10)] = parseNumberList(classMatch[2]);
    }

    items[itemId] = {
      classes,
      stats: bodyMatch[2] ? parseNumberList(bodyMatch[2]) : [],
      iconId: parseInt(bodyMatch[3], 10),
      slotId: parseInt(bodyMatch[4], 10)
    };
  }

  return items;
}

function parseRaidsLua(content) {
  const raids = [];
  const lines = content.split(/\r?\n/);
  let currentRaid = null;
  let currentBoss = null;

  for (const line of lines) {
    const raidMatch = line.match(/journalInstanceId = (\d+),/);
    if (raidMatch) {
      currentRaid = {
        journalInstanceId: parseInt(raidMatch[1], 10),
        bossList: []
      };
      raids.push(currentRaid);
      currentBoss = null;
      continue;
    }

    const bossMatch = line.match(/bossId = (\d+),/);
    if (bossMatch && currentRaid) {
      currentBoss = {
        bossId: parseInt(bossMatch[1], 10),
        lootTable: {}
      };
      currentRaid.bossList.push(currentBoss);
      continue;
    }

    const difficultyMatch = line.match(/\[(\d+)\] = \{([^}]*)\}/);
    if (difficultyMatch && currentBoss) {
      currentBoss.lootTable[parseInt(difficultyMatch[1], 10)] = parseNumberList(difficultyMatch[2]);
    }
  }

  return raids;
}

async function getToken() {
  const body = `grant_type=client_credentials&client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}`;
  const raw = await httpsPost('https://oauth.battle.net/token', body);
  return JSON.parse(raw).access_token;
}

async function blizzGet(pathname, token, locale = 'zh_CN') {
  const separator = pathname.includes('?') ? '&' : '?';
  const url = `https://us.api.blizzard.com${pathname}${separator}locale=${locale}`;
  const raw = await httpsGet(url, { Authorization: `Bearer ${token}` });
  return JSON.parse(raw);
}

async function fetchWowheadTooltip(itemId) {
  const raw = await httpsGet(`https://nether.wowhead.com/tooltip/item/${itemId}?dataEnv=1&locale=4&ilvl=${TARGET_ILVL}`);
  return JSON.parse(raw);
}

async function fetchWowheadItemSource(itemId) {
  return httpsGet(`https://www.wowhead.com/item=${itemId}?xml`);
}

async function fetchWowheadItemPage(itemId) {
  return httpsGet(`https://www.wowhead.com/item=${itemId}`);
}

function parsePrimaryStats(tooltip) {
  const matches = [...tooltip.matchAll(/\+([\d,]+)\s*(智力|敏捷|力量)/g)];
  const unique = new Map();

  matches.forEach((match) => {
    const value = parseInt(match[1].replace(/,/g, ''), 10);
    const stat = PRIMARY_STAT_MAP[match[2]];
    if (!stat) {
      return;
    }
    unique.set(stat.type, {
      type: stat.type,
      name: stat.name,
      value
    });
  });

  return [...unique.values()];
}

function parseSecondaryStats(tooltip) {
  const stats = [];

  Object.entries(SECONDARY_STAT_MAP).forEach(([ratingKey, statInfo]) => {
    const match = tooltip.match(new RegExp(`<!--${ratingKey}-->([\\d,]+)${statInfo.name}`));
    if (match) {
      stats.push({
        type: statInfo.type,
        name: statInfo.name,
        value: parseInt(match[1].replace(/,/g, ''), 10)
      });
    }
  });

  if (stats.length === 2) {
    if (stats[0].value > stats[1].value) {
      stats[0].isMajor = true;
      stats[1].isMajor = false;
    } else if (stats[0].value < stats[1].value) {
      stats[0].isMajor = false;
      stats[1].isMajor = true;
    } else {
      stats[0].isMajor = true;
      stats[1].isMajor = true;
    }
  }

  return stats;
}

function parseTooltipText(rawTooltip) {
  return decodeHtml(
    rawTooltip
      .replace(/<!--.*?-->/g, '')
      .replace(/<br\s*\/?>/g, '\n')
      .replace(/<\/tr>|<\/td>|<\/table>|<\/div>/g, '\n')
      .replace(/<[^>]+>/g, '')
  )
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

function parseTooltipDetails(rawTooltip, tooltipTextLines) {
  const staminaMatch = rawTooltip.match(/\+([\d,]+)\s*耐力/);
  const primaryOptions = parsePrimaryStats(rawTooltip);
  const secondary = parseSecondaryStats(rawTooltip);
  const bindType = tooltipTextLines.find((line) => line.includes('绑定')) || null;
  const uniqueText = tooltipTextLines.find((line) => line.includes('唯一')) || null;
  const effectType = tooltipTextLines.find((line) => line.startsWith('使用：')) ? '使用' : (tooltipTextLines.find((line) => line.startsWith('装备：')) ? '装备' : null);
  const effectLine = tooltipTextLines.find((line) => line.startsWith('使用：') || line.startsWith('装备：')) || null;
  const cooldownLine = tooltipTextLines.find((line) => line.startsWith('冷却：')) || null;
  const sellPriceMatch = rawTooltip.match(/Sell Price:\s*(?:<span class="moneygold">(\d+)<\/span>)?\s*(?:<span class="moneysilver">(\d+)<\/span>)?\s*(?:<span class="moneycopper">(\d+)<\/span>)?/i);

  let vendorPrice = null;
  if (sellPriceMatch) {
    const gold = sellPriceMatch[1] ? `${sellPriceMatch[1]}金` : '';
    const silver = sellPriceMatch[2] ? `${sellPriceMatch[2]}银` : '';
    const copper = sellPriceMatch[3] ? `${sellPriceMatch[3]}铜` : '';
    vendorPrice = `${gold} ${silver} ${copper}`.trim() || null;
  }

  return {
    primary: primaryOptions.length === 1 ? primaryOptions[0] : null,
    primaryOptions,
    stamina: staminaMatch ? { value: parseInt(staminaMatch[1].replace(/,/g, ''), 10) } : null,
    secondary,
    bindType,
    uniqueText,
    effectType,
    effectText: effectLine ? effectLine.replace(/^(使用：|装备：)\s*/, '') : null,
    effectCooldown: cooldownLine ? cooldownLine.replace(/^冷却：\s*/, '') : null,
    vendorPrice
  };
}

function parseWowheadBossSource(html) {
  const droppedByMatch = html.match(/(?:Dropped by|Contained in|Reward from):\s*([^<]+)/i);
  if (droppedByMatch) {
    return decodeHtml(droppedByMatch[1].trim());
  }

  if (/"n":"Challenger's Cache"/i.test(html)) {
    return "Challenger's Cache";
  }

  const metaMatch = html.match(/<meta[^>]+name="description"[^>]+content="[^"]*?It is looted from ([^".]+)\./i);
  return metaMatch ? decodeHtml(metaMatch[1].trim()) : null;
}

function mapSlot(itemData) {
  return SLOT_MAP[itemData.inventory_type && itemData.inventory_type.type] || null;
}

function mapArmorType(itemData, slotInfo) {
  if (!slotInfo) {
    return { key: 'none', name: '无甲种' };
  }

  if (['neck', 'finger', 'cloak', 'trinket', 'weapon'].includes(slotInfo.key)) {
    return { key: 'none', name: '无甲种' };
  }

  return ARMOR_TYPE_MAP[itemData.item_subclass && itemData.item_subclass.id] || { key: 'none', name: '无甲种' };
}

function findClassConfig(classKey) {
  return CLASS_CONFIG.find((entry) => entry.key === classKey) || null;
}

function getDungeonJournalMap() {
  const map = {};
  DUNGEON_CONFIG.forEach((entry) => {
    map[entry.challengeModeId] = entry.journalInstanceId;
  });
  return map;
}

function matchEncounter(sourceBossName, encounters) {
  const normalizedSource = DUNGEON_BOSS_ALIASES[normalizeText(sourceBossName)] || normalizeText(sourceBossName);

  return encounters.find((encounter) => {
    const normalizedEncounter = normalizeText(encounter.nameEn);
    return normalizedEncounter === normalizedSource
      || normalizedEncounter.includes(normalizedSource)
      || normalizedSource.includes(normalizedEncounter);
  }) || null;
}

function isChallengeCacheSource(sourceBossName) {
  return normalizeText(sourceBossName) === 'challengerscache';
}

async function resolveEncounterFromJournalFallback(itemId, journal, token, encounterItemCache) {
  if (!MODERN_DUNGEON_JOURNAL_IDS.has(journal.id)) {
    return null;
  }

  for (const encounter of journal.encounters) {
    if (!encounterItemCache.has(encounter.id)) {
      const encounterData = await blizzGet(`/data/wow/journal-encounter/${encounter.id}?namespace=static-us`, token, 'en_US');
      encounterItemCache.set(encounter.id, new Set((encounterData.items || []).map((entry) => entry.item && entry.item.id).filter(Boolean)));
      await sleep(100);
    }

    if (encounterItemCache.get(encounter.id).has(itemId)) {
      return encounter;
    }
  }

  return null;
}

async function buildJournalData(token, dungeonJournalMap, raidJournalIds) {
  const journalIds = [...new Set([...Object.values(dungeonJournalMap), ...raidJournalIds])];
  const journalMap = {};

  for (const journalId of journalIds) {
    const zh = await blizzGet(`/data/wow/journal-instance/${journalId}?namespace=static-us`, token, 'zh_CN');
    await sleep(100);
    const en = await blizzGet(`/data/wow/journal-instance/${journalId}?namespace=static-us`, token, 'en_US');
    await sleep(100);

    const encounters = (zh.encounters || []).map((encounter, index) => ({
      id: encounter.id,
      nameZh: encounter.name,
      nameEn: (en.encounters && en.encounters[index] ? en.encounters[index].name : encounter.name)
    }));

    journalMap[journalId] = {
      id: journalId,
      nameZh: zh.name,
      nameEn: en.name,
      encounters
    };
  }

  return journalMap;
}

function buildDungeonItems(classConfig, dungeons, itemDb) {
  return dungeons.map((dungeon) => ({
    challengeModeId: dungeon.challengeModeId,
    lootTable: dungeon.lootTable.filter((itemId) => itemDb[itemId] && itemDb[itemId].classes[classConfig.id])
  })).filter((dungeon) => dungeon.lootTable.length > 0);
}

function buildRaidItems(classConfig, raids, itemDb) {
  return raids.map((raid) => ({
    journalInstanceId: raid.journalInstanceId,
    bossList: raid.bossList.map((boss) => ({
      bossId: boss.bossId,
      lootTable: (boss.lootTable[RAID_DIFFICULTY_ID] || []).filter((itemId) => itemDb[itemId] && itemDb[itemId].classes[classConfig.id])
    })).filter((boss) => boss.lootTable.length > 0)
  })).filter((raid) => raid.bossList.length > 0);
}

async function collectDungeonBossSources(dungeonItems, dungeonJournalMap, journalMap, token) {
  const sourceMap = new Map();
  const encounterItemCache = new Map();

  for (const dungeon of dungeonItems) {
    const journalInstanceId = dungeonJournalMap[dungeon.challengeModeId];
    const journal = journalMap[journalInstanceId];

    for (const itemId of dungeon.lootTable) {
      const rawSource = await fetchWowheadItemSource(itemId);
      let sourceBossEn = parseWowheadBossSource(rawSource);
      if (!sourceBossEn) {
        const itemPage = await fetchWowheadItemPage(itemId);
        sourceBossEn = parseWowheadBossSource(itemPage);
      }
      const fallbackEncounter = await resolveEncounterFromJournalFallback(itemId, journal, token, encounterItemCache);

      if (sourceBossEn && isChallengeCacheSource(sourceBossEn)) {
        sourceMap.set(itemId, {
          journalInstanceId,
          instanceName: journal.nameZh,
          encounterId: -journalInstanceId,
          encounterName: '挑战者的宝箱',
          sourceDifficulty: '史诗钥石'
        });
        await sleep(200);
        continue;
      }

      const encounter = (sourceBossEn ? matchEncounter(sourceBossEn, journal.encounters) : null)
        || fallbackEncounter;
      if (!encounter) {
        if (!sourceBossEn) {
          throw new Error(`Unable to resolve dungeon boss source for item ${itemId} in instance ${journal.nameEn}.`);
        }
        throw new Error(`Unable to map dungeon boss "${sourceBossEn}" to journal encounters for instance ${journal.nameEn}.`);
      }

      sourceMap.set(itemId, {
        journalInstanceId,
        instanceName: journal.nameZh,
        encounterId: encounter.id,
        encounterName: encounter.nameZh,
        sourceDifficulty: '史诗钥石'
      });

      await sleep(200);
    }
  }

  return sourceMap;
}

function buildRaidSourceMap(raidItems, journalMap) {
  const sourceMap = new Map();

  raidItems.forEach((raid) => {
    const journal = journalMap[raid.journalInstanceId];
    raid.bossList.forEach((boss) => {
      const encounter = journal.encounters.find((entry) => entry.id === boss.bossId);
      if (!encounter) {
        return;
      }

      boss.lootTable.forEach((itemId) => {
        sourceMap.set(itemId, {
          journalInstanceId: raid.journalInstanceId,
          instanceName: journal.nameZh,
          encounterId: encounter.id,
          encounterName: encounter.nameZh,
          sourceDifficulty: '普通'
        });
      });
    });
  });

  return sourceMap;
}

function mergeSourceMaps(dungeonSourceMap, raidSourceMap) {
  const sourceMap = new Map(dungeonSourceMap);
  raidSourceMap.forEach((value, key) => {
    sourceMap.set(key, value);
  });
  return sourceMap;
}

async function buildItemPayload(itemId, itemDbEntry, classConfig, sourceInfo, token) {
  const itemData = await blizzGet(`/data/wow/item/${itemId}?namespace=static-us`, token, 'zh_CN');
  await sleep(100);
  const tooltipData = await fetchWowheadTooltip(itemId);
  await sleep(200);

  const rawTooltip = tooltipData.tooltip || '';
  const tooltipLines = parseTooltipText(rawTooltip);
  const tooltipDetails = parseTooltipDetails(rawTooltip, tooltipLines);
  const slotInfo = mapSlot(itemData);
  const armorType = mapArmorType(itemData, slotInfo);

  return {
    id: itemId,
    name: itemData.name,
    icon: tooltipData.icon || '',
    slot: slotInfo ? slotInfo.key : 'unknown',
    slotName: slotInfo ? slotInfo.name : (itemData.inventory_type && itemData.inventory_type.name) || '未知',
    armorType: armorType.key,
    armorTypeName: armorType.name,
    ilvl: TARGET_ILVL,
    specs: itemDbEntry.classes[classConfig.id],
    sourceDifficulty: sourceInfo.sourceDifficulty,
    bindType: tooltipDetails.bindType,
    uniqueText: tooltipDetails.uniqueText,
    effectType: tooltipDetails.effectType,
    effectText: tooltipDetails.effectText,
    effectCooldown: tooltipDetails.effectCooldown,
    vendorPrice: tooltipDetails.vendorPrice,
    stats: {
      primary: tooltipDetails.primary,
      primaryOptions: tooltipDetails.primaryOptions,
      stamina: tooltipDetails.stamina,
      secondary: tooltipDetails.secondary
    }
  };
}

function buildClassPayload(classConfig, journalMap, sourceMap, itemPayloads) {
  const specs = classConfig.specs;
  const instanceOrder = [];
  const encounterOrder = new Map();

  [...sourceMap.values()].forEach((source) => {
    if (!instanceOrder.includes(source.journalInstanceId)) {
      instanceOrder.push(source.journalInstanceId);
    }
    const key = `${source.journalInstanceId}:${source.encounterId}`;
    if (!encounterOrder.has(key)) {
      encounterOrder.set(key, encounterOrder.size);
    }
  });

  const itemsByInstance = new Map();
  itemPayloads.forEach((item) => {
    const source = sourceMap.get(item.id);
    if (!source) {
      return;
    }

    if (!itemsByInstance.has(source.journalInstanceId)) {
      itemsByInstance.set(source.journalInstanceId, new Map());
    }
    const encounters = itemsByInstance.get(source.journalInstanceId);
    if (!encounters.has(source.encounterId)) {
      encounters.set(source.encounterId, []);
    }
    encounters.get(source.encounterId).push(item);
  });

  const instances = instanceOrder.map((journalInstanceId) => {
    const journal = journalMap[journalInstanceId];
    const encounterMap = itemsByInstance.get(journalInstanceId) || new Map();
    const encounters = [...encounterMap.entries()]
      .sort((left, right) => encounterOrder.get(`${journalInstanceId}:${left[0]}`) - encounterOrder.get(`${journalInstanceId}:${right[0]}`))
      .map(([encounterId, items]) => ({
        id: encounterId,
        name: (journal.encounters.find((entry) => entry.id === encounterId) || {}).nameZh || sourceMap.get(items[0].id).encounterName,
        items
      }));

    return {
      id: journalInstanceId,
      name: journal.nameZh,
      type: journal.bossList ? 'raid' : (journalInstanceId === 1307 || journalInstanceId === 1308 || journalInstanceId === 1314 ? 'raid' : 'dungeon'),
      encounters
    };
  });

  return {
    version: '12.0.1-S1',
    updatedAt: new Date().toISOString().split('T')[0],
    ilvl: TARGET_ILVL,
    class: {
      id: classConfig.id,
      name: classConfig.name,
      key: classConfig.key,
      armorType: classConfig.armorType,
      armorTypeName: classConfig.armorTypeName
    },
    specs,
    instances
  };
}

function writeOutputs(payload) {
  ensureOutputDir();
  const jsonPath = path.join(OUTPUT_DIR, `${payload.class.key}.json`);
  const jsPath = path.join(OUTPUT_DIR, `${payload.class.key}.js`);
  const json = `${JSON.stringify(payload, null, 2)}\n`;
  fs.writeFileSync(jsonPath, json, 'utf8');
  fs.writeFileSync(jsPath, `module.exports = ${json.trimEnd()};\n`, 'utf8');
}

async function fetchText(url) {
  return httpsGet(url);
}

async function buildClassOutputs(classKey) {
  const classConfig = findClassConfig(classKey);
  if (!classConfig) {
    throw new Error(`Unknown class key: ${classKey}`);
  }

  console.log(`Building current-season data for ${classConfig.name} (${classConfig.key})...`);
  const [dungeonsLua, itemsLua, raidsLua] = await Promise.all([
    fetchText('https://raw.githubusercontent.com/Wolkenschutz/KeystoneLoot/main/data/dungeons.lua'),
    fetchText('https://raw.githubusercontent.com/Wolkenschutz/KeystoneLoot/main/data/items.lua'),
    fetchText('https://raw.githubusercontent.com/Wolkenschutz/KeystoneLoot/main/data/raids.lua')
  ]);

  const dungeons = parseDungeonsLua(dungeonsLua);
  const itemDb = parseItemsLua(itemsLua);
  const raids = parseRaidsLua(raidsLua);
  const dungeonJournalMap = getDungeonJournalMap();
  const raidJournalIds = raids.map((raid) => raid.journalInstanceId);
  const token = await getToken();
  const journalMap = await buildJournalData(token, dungeonJournalMap, raidJournalIds);
  const dungeonItems = buildDungeonItems(classConfig, dungeons, itemDb);
  const raidItems = buildRaidItems(classConfig, raids, itemDb);
  const dungeonSourceMap = await collectDungeonBossSources(dungeonItems, dungeonJournalMap, journalMap, token);
  const raidSourceMap = buildRaidSourceMap(raidItems, journalMap);
  const sourceMap = mergeSourceMaps(dungeonSourceMap, raidSourceMap);
  const itemIds = [...sourceMap.keys()];
  const itemPayloads = [];

  for (const itemId of itemIds) {
    console.log(`  Fetching item ${itemId}...`);
    itemPayloads.push(await buildItemPayload(itemId, itemDb[itemId], classConfig, sourceMap.get(itemId), token));
  }

  const payload = buildClassPayload(classConfig, journalMap, sourceMap, itemPayloads);
  writeOutputs(payload);
  console.log(`Wrote ${payload.class.name} data with ${itemPayloads.length} items.`);
}

async function main() {
  const classIndex = process.argv.indexOf('--class');
  const classKey = classIndex >= 0 ? process.argv[classIndex + 1] : 'monk';
  if (!classKey) {
    throw new Error('Missing class key after --class');
  }

  await buildClassOutputs(classKey);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
