const fs = require('fs');
const path = require('path');
const https = require('https');

const DEFAULT_OUTPUT_DIR = path.join(__dirname, '..', 'miniprogram', 'data');
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
  { id: 13, key: 'evoker', name: '唤魔师', armorType: 'mail', armorTypeName: '锁甲', specs: [{ id: 1467, name: '湮灭' }, { id: 1468, name: '恩护' }, { id: 1473, name: '增辉' }] },
];

const EQUIPLOC_MAP = {
  INVTYPE_HEAD: { key: 'head', name: '头部' },
  INVTYPE_SHOULDER: { key: 'shoulder', name: '肩部' },
  INVTYPE_CHEST: { key: 'chest', name: '胸部' },
  INVTYPE_ROBE: { key: 'chest', name: '胸部' },
  INVTYPE_WAIST: { key: 'waist', name: '腰部' },
  INVTYPE_LEGS: { key: 'legs', name: '腿部' },
  INVTYPE_FEET: { key: 'feet', name: '脚部' },
  INVTYPE_WRIST: { key: 'wrist', name: '护腕' },
  INVTYPE_HAND: { key: 'hand', name: '手部' },
  INVTYPE_FINGER: { key: 'finger', name: '戒指' },
  INVTYPE_TRINKET: { key: 'trinket', name: '饰品' },
  INVTYPE_CLOAK: { key: 'cloak', name: '披风' },
  INVTYPE_NECK: { key: 'neck', name: '项链' },
  INVTYPE_WEAPON: { key: 'weapon', name: '武器' },
  INVTYPE_2HWEAPON: { key: 'weapon', name: '武器' },
  INVTYPE_WEAPONMAINHAND: { key: 'weapon', name: '武器' },
  INVTYPE_WEAPONOFFHAND: { key: 'weapon', name: '武器' },
  INVTYPE_SHIELD: { key: 'weapon', name: '武器' },
  INVTYPE_HOLDABLE: { key: 'weapon', name: '武器' },
  INVTYPE_RANGED: { key: 'weapon', name: '武器' },
  INVTYPE_RANGEDRIGHT: { key: 'weapon', name: '武器' },
};

const ARMOR_SUBCLASS_MAP = {
  1: { key: 'cloth', name: '布甲' },
  2: { key: 'leather', name: '皮甲' },
  3: { key: 'mail', name: '锁甲' },
  4: { key: 'plate', name: '板甲' },
};

const SECONDARY_STAT_MAP = {
  rtg32: { type: 'crit', name: '暴击' },
  rtg36: { type: 'haste', name: '急速' },
  rtg49: { type: 'mastery', name: '精通' },
  rtg40: { type: 'versatility', name: '全能' },
};

const PRIMARY_STAT_MAP = {
  智力: { type: 'intellect', name: '智力' },
  敏捷: { type: 'agility', name: '敏捷' },
  力量: { type: 'strength', name: '力量' },
};

// ---------------------------------------------------------------------------
// 工具函数
// ---------------------------------------------------------------------------

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function httpsGet(url, redirectCount = 0, attempt = 0) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, (res) => {
      if ([301, 302, 303, 307, 308].includes(res.statusCode) && res.headers.location) {
        if (redirectCount >= 5) return reject(new Error(`Too many redirects: ${url}`));
        return resolve(httpsGet(new URL(res.headers.location, url).toString(), redirectCount + 1, attempt));
      }
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => resolve(data));
    });
    req.on('error', async (error) => {
      if (attempt >= 2) return reject(error);
      await sleep(500 * (attempt + 1));
      resolve(httpsGet(url, redirectCount, attempt + 1));
    });
    req.setTimeout(20000, () => { req.destroy(); reject(new Error(`Timeout: ${url}`)); });
  });
}

// ---------------------------------------------------------------------------
// 读取 SavedVariables
// ---------------------------------------------------------------------------

function readExportData(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');

  const payloadMatch = raw.match(/(?:\["payload"\]|payload)\s*=\s*"((?:[^"\\]|\\.)*)"/s);
  if (payloadMatch) {
    return JSON.parse(decodeLuaString(payloadMatch[1]));
  }

  const legacyMatch = raw.match(/WoWLookExportJSON\s*=\s*"((?:[^"\\]|\\.)*)"/s);
  if (legacyMatch) {
    return JSON.parse(decodeLuaString(legacyMatch[1]));
  }

  throw new Error('无法在文件中找到导出 payload，请确认文件路径正确且已在游戏内 /reload');
}

function decodeLuaString(value) {
  return value
    .replace(/\\\\/g, '\\')
    .replace(/\\"/g, '"')
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\r')
    .replace(/\\t/g, '\t');
}

// ---------------------------------------------------------------------------
// Wowhead Tooltip 获取（icon + 246装等属性）
// ---------------------------------------------------------------------------

async function fetchTooltip(itemId) {
  const raw = await httpsGet(
    `https://nether.wowhead.com/tooltip/item/${itemId}?dataEnv=1&locale=4&ilvl=${TARGET_ILVL}`
  );
  return JSON.parse(raw);
}

function parseTooltipStats(tooltip) {
  const html = tooltip.tooltip || '';

  // 主属性
  const primaryMatches = [
    ...html.matchAll(/\+([\d,]+)\s*(?:\[(智力|敏捷|力量)\s+or\s+(智力|敏捷|力量)\]|(智力|敏捷|力量))/g),
  ];
  const primaryOptions = [];
  const seen = new Set();
  primaryMatches.forEach((m) => {
    const names = [m[2], m[3], m[4]].filter(Boolean);
    names.forEach((name) => {
      const stat = PRIMARY_STAT_MAP[name];
      if (stat && !seen.has(stat.type)) {
        seen.add(stat.type);
        primaryOptions.push({ type: stat.type, name: stat.name, value: parseInt(m[1].replace(/,/g, ''), 10) });
      }
    });
  });

  // 耐力
  const staminaMatch = html.match(/\+([\d,]+)\s*耐力/);
  const stamina = staminaMatch ? { value: parseInt(staminaMatch[1].replace(/,/g, ''), 10) } : null;

  // 副属性（用稳定的 <!--rtgXX--> 标记）
  const secondary = [];
  Object.entries(SECONDARY_STAT_MAP).forEach(([marker, info]) => {
    const re = new RegExp(`<!--${marker}-->(\\d[\\d,]*)`);
    const m = html.match(re);
    if (m) {
      secondary.push({ type: info.type, name: info.name, value: parseInt(m[1].replace(/,/g, ''), 10) });
    }
  });

  if (secondary.length === 2) {
    if (secondary[0].value > secondary[1].value) {
      secondary[0].isMajor = true;
      secondary[1].isMajor = false;
    } else if (secondary[0].value < secondary[1].value) {
      secondary[0].isMajor = false;
      secondary[1].isMajor = true;
    } else {
      secondary[0].isMajor = true;
      secondary[1].isMajor = true;
    }
  }

  // 特效描述
  const lines = html
    .replace(/<!--.*?-->/g, '')
    .replace(/<br\s*\/?>/g, '\n')
    .replace(/<\/tr>|<\/td>|<\/table>|<\/div>/g, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .split('\n').map((l) => l.trim()).filter(Boolean);

  const bindType = lines.find((l) => l.includes('绑定')) || null;
  const effectMatch = html.match(/(使用：|装备：)\s*([\s\S]*?)(?:<\/a>|\(.*?冷却\)|需要等级|售价:|Sell Price:)/);
  const effectType = effectMatch ? effectMatch[1].replace('：', '') : null;
  const effectText = effectMatch
    ? effectMatch[2]
      .replace(/<br\s*\/?>/g, '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      .replace(/&#39;/g, "'")
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&nbsp;/g, ' ')
      .trim()
    : null;
  const cooldownMatch = html.match(/\(([^()]*?冷却)\)/);
  const effectCooldown = cooldownMatch ? cooldownMatch[1].trim() : null;

  return {
    primary: primaryOptions.length === 1 ? primaryOptions[0] : null,
    primaryOptions,
    stamina,
    secondary,
    bindType,
    effectType,
    effectText,
    effectCooldown,
  };
}

// ---------------------------------------------------------------------------
// 构建每个职业的输出数据
// ---------------------------------------------------------------------------

function mapSlot(equipLoc) {
  return EQUIPLOC_MAP[equipLoc] || null;
}

function mapArmorType(item, slotInfo) {
  if (!slotInfo) return { key: 'none', name: '无甲种' };
  if (['neck', 'finger', 'cloak', 'trinket', 'weapon'].includes(slotInfo.key)) {
    return { key: 'none', name: '无甲种' };
  }
  return ARMOR_SUBCLASS_MAP[item.itemSubclassId] || { key: 'none', name: '无甲种' };
}

function isEquippableItem(item) {
  return Boolean(item && item.equipLoc && EQUIPLOC_MAP[item.equipLoc]);
}

function buildClassOutput(classConfig, exportData, tooltipCache) {
  const classId = classConfig.id;

  // 收集该职业可用的物品及其来源
  const itemSourceMap = new Map();

  exportData.instances.forEach((inst) => {
    inst.encounters.forEach((enc) => {
      enc.itemIds.forEach((itemId) => {
        const itemIdStr = String(itemId);
        const item = exportData.items[itemIdStr];
        if (!item) return;
        if (!isEquippableItem(item)) return;

        const classSpecs = item.classes[String(classId)];
        if (!classSpecs || classSpecs.length === 0) return;

        if (!itemSourceMap.has(itemId)) {
          itemSourceMap.set(itemId, {
            instanceId: inst.id,
            instanceName: inst.name,
            isRaid: inst.isRaid,
            encounterId: enc.id,
            encounterName: enc.name,
            specs: classSpecs.map(Number),
          });
        }
      });
    });
  });

  // 按副本/Boss 组织
  const instanceOrder = [];
  const instanceMap = new Map();

  exportData.instances.forEach((inst) => {
    const encounters = [];
    inst.encounters.forEach((enc) => {
      const items = [];
      enc.itemIds.forEach((itemId) => {
        if (!itemSourceMap.has(itemId)) return;
        const source = itemSourceMap.get(itemId);
        if (source.encounterId !== enc.id || source.instanceId !== inst.id) return;

        const itemIdStr = String(itemId);
        const rawItem = exportData.items[itemIdStr];
        const tooltip = tooltipCache[itemId];
        const slotInfo = mapSlot(rawItem.equipLoc);
        const armorType = mapArmorType(rawItem, slotInfo);
        const stats = tooltip ? parseTooltipStats(tooltip) : { primary: null, primaryOptions: [], stamina: null, secondary: [], bindType: null, effectType: null, effectText: null };

        items.push({
          id: itemId,
          name: rawItem.name,
          icon: tooltip ? tooltip.icon || '' : '',
          slot: slotInfo ? slotInfo.key : 'unknown',
          slotName: slotInfo ? slotInfo.name : '未知',
          armorType: armorType.key,
          armorTypeName: armorType.name,
          ilvl: TARGET_ILVL,
          specs: source.specs,
          sourceDifficulty: inst.isRaid ? '普通' : '史诗钥石',
          bindType: stats.bindType,
          effectType: stats.effectType,
          effectText: stats.effectText,
          effectCooldown: stats.effectCooldown,
          stats: {
            primary: stats.primary,
            primaryOptions: stats.primaryOptions,
            stamina: stats.stamina,
            secondary: stats.secondary,
          },
        });
      });

      if (items.length > 0) {
        encounters.push({ id: enc.id, name: enc.name, items });
      }
    });

    if (encounters.length > 0) {
      instanceOrder.push(inst.id);
      instanceMap.set(inst.id, {
        id: inst.id,
        name: inst.name,
        type: inst.isRaid ? 'raid' : 'dungeon',
        encounters,
      });
    }
  });

  const instances = instanceOrder.map((id) => instanceMap.get(id));

  return {
    version: '12.0.1-S1',
    updatedAt: new Date().toISOString().split('T')[0],
    ilvl: TARGET_ILVL,
    class: {
      id: classConfig.id,
      name: classConfig.name,
      key: classConfig.key,
      armorType: classConfig.armorType,
      armorTypeName: classConfig.armorTypeName,
    },
    specs: classConfig.specs,
    instances,
  };
}

// ---------------------------------------------------------------------------
// 主流程
// ---------------------------------------------------------------------------

async function main() {
  const inputIdx = process.argv.indexOf('--input');
  const inputPath = inputIdx >= 0 ? process.argv[inputIdx + 1] : null;
  if (!inputPath) {
    console.error('用法: node parse-export.js --input <WoWLookExport.lua路径> [--class monk]');
    console.error('示例: node parse-export.js --input "C:\\WoW\\WTF\\Account\\MYACCOUNT\\SavedVariables\\WoWLookExport.lua"');
    process.exit(1);
  }

  const classIdx = process.argv.indexOf('--class');
  const classFilter = classIdx >= 0 ? process.argv[classIdx + 1] : null;
  const outputIdx = process.argv.indexOf('--output-dir');
  const outputDir = outputIdx >= 0 ? process.argv[outputIdx + 1] : DEFAULT_OUTPUT_DIR;

  console.log(`读取导出文件: ${inputPath}`);
  const exportData = readExportData(inputPath);
  console.log(`导出时间: ${exportData.exportTime}, 版本: ${exportData.build}`);
  console.log(`副本数: ${exportData.instances.length}, 物品数: ${Object.keys(exportData.items).length}`);

  // 收集所有唯一物品ID
  const allItemIds = Object.keys(exportData.items).map(Number);
  console.log(`\n开始获取 ${allItemIds.length} 件物品的 Wowhead Tooltip 数据 (ilvl ${TARGET_ILVL})...`);

  const tooltipCache = {};
  let fetched = 0;
  for (const itemId of allItemIds) {
    try {
      tooltipCache[itemId] = await fetchTooltip(itemId);
      fetched++;
      if (fetched % 20 === 0) {
        console.log(`  已获取 ${fetched}/${allItemIds.length}...`);
      }
    } catch (err) {
      console.warn(`  警告: 物品 ${itemId} tooltip 获取失败: ${err.message}`);
    }
    await sleep(200);
  }
  console.log(`Tooltip 获取完成: ${fetched}/${allItemIds.length}`);

  // 生成职业文件
  const targetClasses = classFilter
    ? CLASS_CONFIG.filter((c) => c.key === classFilter)
    : CLASS_CONFIG;

  if (targetClasses.length === 0) {
    console.error(`未知职业: ${classFilter}`);
    process.exit(1);
  }

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  for (const classConfig of targetClasses) {
    const payload = buildClassOutput(classConfig, exportData, tooltipCache);
    const itemCount = payload.instances.reduce(
      (sum, inst) => sum + inst.encounters.reduce((s, enc) => s + enc.items.length, 0), 0
    );

    const jsonPath = path.join(outputDir, `${classConfig.key}.json`);
    const jsPath = path.join(outputDir, `${classConfig.key}.js`);
    const json = JSON.stringify(payload, null, 2) + '\n';
    fs.writeFileSync(jsonPath, json, 'utf8');
    fs.writeFileSync(jsPath, `module.exports = ${json.trimEnd()};\n`, 'utf8');

    console.log(`${classConfig.name} (${classConfig.key}): ${itemCount} 件装备 → ${jsonPath}`);
  }

  console.log('\n全部完成！');
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
