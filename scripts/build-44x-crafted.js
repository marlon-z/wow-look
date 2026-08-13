const fs = require('fs');
const path = require('path');
const https = require('https');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const DEFAULT_BASE_DIR = path.join(ROOT, 'cos-upload', 'data-4.3.x');
const DEFAULT_OUTPUT_DIR = path.join(ROOT, 'cos-upload', 'data-4.4.x');
const DEFAULT_ASSET_DIR = path.join(ROOT, 'cos-upload', 'assets', 'icons');
const DEFAULT_CRAFT_INPUT = 'E:/World of Warcraft/_retail_/WTF/Account/513648058#1/SavedVariables/WoWLookCraftExport.lua';
const DATA_VERSION = '4.4.x';
const CACHE_DIR = path.join(ROOT, '.cache');
const LISTFILE_CACHE_PATH = path.join(CACHE_DIR, 'community-listfile.csv');
const LISTFILE_URL = 'https://github.com/wowdev/wow-listfile/releases/latest/download/community-listfile.csv';

const SECONDARY_TYPES = ['crit', 'haste', 'mastery', 'versatility'];

const CLASS_CONFIG = [
  { id: 1, key: 'warrior', name: '战士', armorType: 'plate', color: '#C69B6D', abbr: '战', specs: [{ id: 71 }, { id: 72 }, { id: 73 }] },
  { id: 2, key: 'paladin', name: '圣骑士', armorType: 'plate', color: '#F48CBA', abbr: '骑', specs: [{ id: 65 }, { id: 66 }, { id: 70 }] },
  { id: 3, key: 'hunter', name: '猎人', armorType: 'mail', color: '#AAD372', abbr: '猎', specs: [{ id: 253 }, { id: 254 }, { id: 255 }] },
  { id: 4, key: 'rogue', name: '盗贼', armorType: 'leather', color: '#FFF468', abbr: '贼', specs: [{ id: 259 }, { id: 260 }, { id: 261 }] },
  { id: 5, key: 'priest', name: '牧师', armorType: 'cloth', color: '#FFFFFF', abbr: '牧', specs: [{ id: 256 }, { id: 257 }, { id: 258 }] },
  { id: 6, key: 'deathknight', name: '死亡骑士', armorType: 'plate', color: '#C41E3A', abbr: '骑', specs: [{ id: 250 }, { id: 251 }, { id: 252 }] },
  { id: 7, key: 'shaman', name: '萨满祭司', armorType: 'mail', color: '#0070DD', abbr: '萨', specs: [{ id: 262 }, { id: 263 }, { id: 264 }] },
  { id: 8, key: 'mage', name: '法师', armorType: 'cloth', color: '#3FC7EB', abbr: '法', specs: [{ id: 62 }, { id: 63 }, { id: 64 }] },
  { id: 9, key: 'warlock', name: '术士', armorType: 'cloth', color: '#8788EE', abbr: '术', specs: [{ id: 265 }, { id: 266 }, { id: 267 }] },
  { id: 10, key: 'monk', name: '武僧', armorType: 'leather', color: '#00FF98', abbr: '僧', specs: [{ id: 268 }, { id: 269 }, { id: 270 }] },
  { id: 11, key: 'druid', name: '德鲁伊', armorType: 'leather', color: '#FF7C0A', abbr: '德', specs: [{ id: 102 }, { id: 103 }, { id: 104 }, { id: 105 }] },
  { id: 12, key: 'demonhunter', name: '恶魔猎手', armorType: 'leather', color: '#A330C9', abbr: '猎', specs: [{ id: 577 }, { id: 581 }, { id: 1480 }] },
  { id: 13, key: 'evoker', name: '唤魔师', armorType: 'mail', color: '#33937F', abbr: '唤', specs: [{ id: 1467 }, { id: 1468 }, { id: 1473 }] },
];

const CLASS_BY_KEY = Object.fromEntries(CLASS_CONFIG.map((item) => [item.key, item]));

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

const TWO_HAND = 'two_hand';
const ONE_HAND = 'one_hand';
const MAIN_HAND = 'main_hand';
const OFF_HAND = 'off_hand';
const SHIELD = 'shield';
const HOLDABLE = 'holdable';

const SPEC_WEAPON_LAYOUTS = {
  71: [[TWO_HAND, null]],
  72: [[TWO_HAND, TWO_HAND]],
  73: [[ONE_HAND, SHIELD]],
  65: [[ONE_HAND, SHIELD]],
  66: [[ONE_HAND, SHIELD]],
  70: [[TWO_HAND, null]],
  253: [[TWO_HAND, null]],
  254: [[TWO_HAND, null]],
  255: [[TWO_HAND, null], [ONE_HAND, ONE_HAND]],
  259: [[ONE_HAND, ONE_HAND]],
  260: [[ONE_HAND, ONE_HAND]],
  261: [[ONE_HAND, ONE_HAND]],
  256: [[TWO_HAND, null], [ONE_HAND, HOLDABLE]],
  257: [[TWO_HAND, null], [ONE_HAND, HOLDABLE]],
  258: [[TWO_HAND, null], [ONE_HAND, HOLDABLE]],
  250: [[TWO_HAND, null]],
  251: [[TWO_HAND, null], [ONE_HAND, ONE_HAND]],
  252: [[TWO_HAND, null]],
  262: [[TWO_HAND, null], [ONE_HAND, SHIELD]],
  263: [[ONE_HAND, ONE_HAND]],
  264: [[TWO_HAND, null], [ONE_HAND, SHIELD]],
  62: [[TWO_HAND, null], [ONE_HAND, HOLDABLE]],
  63: [[TWO_HAND, null], [ONE_HAND, HOLDABLE]],
  64: [[TWO_HAND, null], [ONE_HAND, HOLDABLE]],
  265: [[TWO_HAND, null], [ONE_HAND, HOLDABLE]],
  266: [[TWO_HAND, null], [ONE_HAND, HOLDABLE]],
  267: [[TWO_HAND, null], [ONE_HAND, HOLDABLE]],
  268: [[TWO_HAND, null], [ONE_HAND, ONE_HAND]],
  269: [[TWO_HAND, null], [ONE_HAND, ONE_HAND]],
  270: [[TWO_HAND, null], [ONE_HAND, HOLDABLE]],
  102: [[TWO_HAND, null], [ONE_HAND, HOLDABLE]],
  103: [[TWO_HAND, null]],
  104: [[TWO_HAND, null]],
  105: [[TWO_HAND, null], [ONE_HAND, HOLDABLE]],
  577: [[ONE_HAND, ONE_HAND]],
  581: [[ONE_HAND, ONE_HAND]],
  1480: [[ONE_HAND, ONE_HAND]],
  1467: [[TWO_HAND, null], [ONE_HAND, HOLDABLE]],
  1468: [[TWO_HAND, null], [ONE_HAND, HOLDABLE]],
  1473: [[TWO_HAND, null], [ONE_HAND, HOLDABLE]],
};

class LuaParser {
  constructor(source) {
    this.source = source;
    this.index = 0;
  }

  parseRoot() {
    const equalsIndex = this.source.indexOf('=');
    if (equalsIndex === -1) {
      throw new Error('SavedVariables 缺少顶层赋值。');
    }
    this.index = equalsIndex + 1;
    return this.parseValue();
  }

  parseValue() {
    this.skipWhitespace();
    const char = this.peek();
    if (char === '{') return this.parseTable();
    if (char === '"') return this.parseString();
    if (char === '-' || /[0-9]/.test(char)) return this.parseNumber();
    const word = this.parseIdentifier();
    if (word === 'true') return true;
    if (word === 'false') return false;
    if (word === 'nil') return null;
    throw new Error(`无法解析 Lua 值：${word || char} at ${this.index}`);
  }

  parseTable() {
    this.expect('{');
    const entries = [];
    let arrayIndex = 1;
    while (true) {
      this.skipWhitespace();
      if (this.peek() === '}') {
        this.index += 1;
        break;
      }

      let key = null;
      let value;
      if (this.peek() === '[') {
        this.index += 1;
        key = this.parseValue();
        this.skipWhitespace();
        this.expect(']');
        this.skipWhitespace();
        this.expect('=');
        value = this.parseValue();
      } else {
        const start = this.index;
        const maybeKey = this.parseIdentifier();
        if (maybeKey) {
          this.skipWhitespace();
          if (this.peek() === '=') {
            this.index += 1;
            key = maybeKey;
            value = this.parseValue();
          } else {
            this.index = start;
            key = arrayIndex;
            value = this.parseValue();
            arrayIndex += 1;
          }
        } else {
          key = arrayIndex;
          value = this.parseValue();
          arrayIndex += 1;
        }
      }

      entries.push([key, value]);
      this.skipWhitespace();
      if (this.peek() === ',' || this.peek() === ';') {
        this.index += 1;
      }
    }

    return this.tableFromEntries(entries);
  }

  tableFromEntries(entries) {
    const numericKeys = entries
      .map(([key]) => key)
      .filter((key) => Number.isInteger(Number(key)) && Number(key) > 0)
      .map(Number)
      .sort((left, right) => left - right);
    const allNumeric = entries.length > 0 && numericKeys.length === entries.length;
    const contiguous = allNumeric && numericKeys.every((key, index) => key === index + 1);
    if (contiguous) {
      const result = [];
      entries.forEach(([key, value]) => {
        result[Number(key) - 1] = value;
      });
      return result;
    }

    const result = {};
    entries.forEach(([key, value]) => {
      result[String(key)] = value;
    });
    return result;
  }

  parseString() {
    this.expect('"');
    let result = '';
    while (this.index < this.source.length) {
      const char = this.source[this.index];
      this.index += 1;
      if (char === '"') return result;
      if (char !== '\\') {
        result += char;
        continue;
      }
      const escaped = this.source[this.index];
      this.index += 1;
      if (escaped === 'n') result += '\n';
      else if (escaped === 'r') result += '\r';
      else if (escaped === 't') result += '\t';
      else if (escaped === '\\' || escaped === '"') result += escaped;
      else if (/[0-9]/.test(escaped)) {
        let digits = escaped;
        while (digits.length < 3 && /[0-9]/.test(this.source[this.index] || '')) {
          digits += this.source[this.index];
          this.index += 1;
        }
        result += String.fromCharCode(Number(digits));
      } else {
        result += escaped;
      }
    }
    throw new Error('Lua 字符串未闭合。');
  }

  parseNumber() {
    const start = this.index;
    if (this.peek() === '-') this.index += 1;
    while (/[0-9]/.test(this.peek())) this.index += 1;
    if (this.peek() === '.') {
      this.index += 1;
      while (/[0-9]/.test(this.peek())) this.index += 1;
    }
    return Number(this.source.slice(start, this.index));
  }

  parseIdentifier() {
    const start = this.index;
    if (!/[A-Za-z_]/.test(this.peek())) return '';
    this.index += 1;
    while (/[A-Za-z0-9_]/.test(this.peek())) this.index += 1;
    return this.source.slice(start, this.index);
  }

  skipWhitespace() {
    while (this.index < this.source.length) {
      if (/\s/.test(this.source[this.index])) {
        this.index += 1;
        continue;
      }
      if (this.source[this.index] === '-' && this.source[this.index + 1] === '-') {
        while (this.index < this.source.length && this.source[this.index] !== '\n') {
          this.index += 1;
        }
        continue;
      }
      break;
    }
  }

  peek() {
    return this.source[this.index] || '';
  }

  expect(char) {
    this.skipWhitespace();
    if (this.source[this.index] !== char) {
      throw new Error(`期望 ${char}，实际 ${this.source[this.index] || 'EOF'} at ${this.index}`);
    }
    this.index += 1;
  }
}

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

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function httpsGetBuffer(url) {
  return new Promise((resolve, reject) => {
    https.get(url, {
      headers: { 'User-Agent': 'Codex' },
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
  const normalized = String(filePath || '').trim().toLowerCase();
  if (!normalized.includes('interface/icons/') || !normalized.endsWith('.blp')) {
    return '';
  }
  return path.basename(normalized, '.blp').replace(/\s+/g, '');
}

function resolveIconNames(iconIds, listfilePath) {
  const targetIds = new Set(iconIds.map((id) => String(id)));
  const iconMap = {};
  const content = fs.readFileSync(listfilePath, 'utf8');
  for (const line of content.split(/\r?\n/)) {
    if (!line) continue;
    const separatorIndex = line.indexOf(';');
    if (separatorIndex === -1) continue;
    const fileId = line.slice(0, separatorIndex);
    if (!targetIds.has(fileId)) continue;
    const iconName = buildIconNameFromPath(line.slice(separatorIndex + 1));
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

function sortNumericList(list) {
  return Array.from(new Set((list || []).map(Number).filter(Number.isFinite)))
    .sort((left, right) => left - right);
}

function normalizeStat(stat) {
  if (!stat) return null;
  const type = stat.type || stat.key || '';
  return {
    name: stat.name || '',
    type,
    value: Number(stat.value) || 0,
  };
}

function normalizeStats(stats) {
  return (Array.isArray(stats) ? stats : [])
    .map(normalizeStat)
    .filter((stat) => stat && stat.type && stat.value);
}

function normalizeEffects(effects) {
  const source = effects || {};
  return {
    equip: Array.isArray(source.equip) ? source.equip.filter(Boolean) : [],
    use: Array.isArray(source.use) ? source.use.filter(Boolean) : [],
  };
}

function normalizeTooltipRaw(rawLines) {
  if (!Array.isArray(rawLines)) return [];
  return rawLines.map((line) => {
    if (typeof line === 'string') return line.trim();
    const left = line && line.left ? String(line.left).trim() : '';
    const right = line && line.right ? String(line.right).trim() : '';
    return [left, right].filter(Boolean).join(' ');
  }).filter(Boolean);
}

function getSlot(item) {
  return SLOT_MAP[item.equipLoc] || { key: 'unknown', name: item.slotText || '未知' };
}

function getArmorType(item, slot) {
  if (slot.key === 'neck' || slot.key === 'finger' || slot.key === 'cloak' || slot.key === 'trinket') {
    return { key: 'none', name: '无甲种' };
  }
  return ARMOR_TYPE_MAP[item.itemSubType] || { key: 'none', name: item.itemSubType || '无甲种' };
}

function getWeaponKind(item) {
  const equipLoc = item.equipLoc || '';
  if (equipLoc === 'INVTYPE_2HWEAPON' || equipLoc === 'INVTYPE_RANGED' || equipLoc === 'INVTYPE_RANGEDRIGHT') return TWO_HAND;
  if (equipLoc === 'INVTYPE_SHIELD') return SHIELD;
  if (equipLoc === 'INVTYPE_HOLDABLE') return HOLDABLE;
  if (equipLoc === 'INVTYPE_WEAPONMAINHAND') return MAIN_HAND;
  if (equipLoc === 'INVTYPE_WEAPONOFFHAND') return OFF_HAND;
  if (equipLoc === 'INVTYPE_WEAPON') return ONE_HAND;

  const subtype = item.itemSubType || '';
  if (/双手|法杖|长柄武器|弓|弩|枪械/.test(subtype)) return TWO_HAND;
  if (subtype === '盾牌') return SHIELD;
  if (subtype === '其它') return HOLDABLE;
  return ONE_HAND;
}

function kindMatches(actual, expected, slotIndex) {
  if (actual === MAIN_HAND) return slotIndex === 0 && expected === ONE_HAND;
  if (actual === OFF_HAND) return slotIndex === 1 && expected === ONE_HAND;
  return actual === expected;
}

function specCanUseWeapon(specId, item) {
  const kind = getWeaponKind(item);
  return (SPEC_WEAPON_LAYOUTS[Number(specId)] || []).some((layout) => {
    return layout.some((expected, index) => expected !== null && kindMatches(kind, expected, index));
  });
}

function allSpecIds(classConfig) {
  return classConfig.specs.map((spec) => spec.id);
}

function specsForClass(item, classConfig) {
  const slot = getSlot(item);
  const armorType = getArmorType(item, slot);

  if (slot.key === 'weapon') {
    return classConfig.specs
      .map((spec) => spec.id)
      .filter((specId) => specCanUseWeapon(specId, item));
  }

  if (armorType.key === 'none') {
    return allSpecIds(classConfig);
  }

  return armorType.key === classConfig.armorType ? allSpecIds(classConfig) : [];
}

function buildCraftingMeta(rawItem) {
  const randomAttributeCount = Number(rawItem.randomAttributeCount) || 0;
  const randomAttributeSlots = (Array.isArray(rawItem.randomAttributeSlots) ? rawItem.randomAttributeSlots : [])
    .map((slot) => ({
      index: Number(slot.index) || 0,
      value: Number(slot.value) || 0,
      label: slot.label || `随机属性${slot.index || ''}`.trim(),
    }))
    .filter((slot) => slot.index > 0 && slot.value > 0)
    .sort((left, right) => left.index - right.index);

  return {
    professionId: Number(rawItem.professionId) || 0,
    professionName: rawItem.professionName || '',
    recipeId: Number(rawItem.recipeId) || 0,
    skillLineAbilityId: Number(rawItem.skillLineAbilityId) || 0,
    targetRule: rawItem.source && rawItem.source.targetRule ? rawItem.source.targetRule : '',
    targetItemLevel: rawItem.source && rawItem.source.targetItemLevel ? Number(rawItem.source.targetItemLevel) : Number(rawItem.itemLevel) || 0,
    candidateItemLevel: rawItem.source && rawItem.source.candidateItemLevel ? Number(rawItem.source.candidateItemLevel) : 0,
    randomAttributeCount,
    randomAttributeSlots,
    availableSecondaryTypes: randomAttributeCount > 0 ? SECONDARY_TYPES.slice() : [],
  };
}

function buildCraftedItem(rawItem, classConfig, iconLookup) {
  const slot = getSlot(rawItem);
  const armorType = getArmorType(rawItem, slot);
  const specs = specsForClass(rawItem, classConfig);
  if (!specs.length) return null;

  const crafting = buildCraftingMeta(rawItem);
  const effects = normalizeEffects(rawItem.effects);
  const iconInfo = iconLookup.get(Number(rawItem.icon)) || {};
  const fixedSecondaryStats = Array.isArray(rawItem.fixedSecondaryStats)
    ? rawItem.fixedSecondaryStats
    : rawItem.secondaryStats;

  return {
    id: Number(rawItem.itemId),
    name: rawItem.name || '',
    icon: Number(rawItem.icon) || 0,
    iconName: iconInfo.iconName || '',
    iconAsset: iconInfo.iconAsset || '',
    slot: slot.key,
    slotName: slot.name,
    armorType: armorType.key,
    armorTypeName: armorType.name,
    itemType: rawItem.itemType || '',
    itemSubType: slot.key === 'weapon' ? (rawItem.itemSubType || rawItem.itemType || '') : (rawItem.itemSubType || ''),
    equipLoc: rawItem.equipLoc || '',
    ilvl: Number(rawItem.itemLevel) || 0,
    specs: sortNumericList(specs),
    classes: [classConfig.id],
    quality: Number(rawItem.quality) || 0,
    upgradeTrack: rawItem.upgradeTrack || '',
    tooltipFlags: rawItem.flags || { prismaticSocket: false, uniqueEquipped: false },
    stats: {
      primaryStats: normalizeStats(rawItem.primaryStats),
      stamina: normalizeStat(rawItem.stamina),
      secondary: normalizeStats(fixedSecondaryStats),
      effects,
      white: rawItem.white && typeof rawItem.white === 'object' && !Array.isArray(rawItem.white) ? rawItem.white : {},
    },
    source: {
      instanceId: 'manufacturing',
      instanceName: '制造业',
      isRaid: false,
      encounterId: 'crafted-equipment',
      encounterName: rawItem.professionName || '制造业装备',
      difficulty: 0,
      difficultyName: rawItem.professionName || '制造业',
      order: 1000,
    },
    sourceType: 'crafted',
    crafting,
    tooltipRaw: normalizeTooltipRaw(rawItem.tooltipRaw),
    link: rawItem.link || rawItem.displayLink || '',
    captureStatus: rawItem.captureStatus || 'ok',
    iconText: rawItem.name ? String(rawItem.name).slice(0, 1) : classConfig.abbr,
  };
}

function readCraftExport(inputPath) {
  const raw = fs.readFileSync(inputPath, 'utf8');
  return new LuaParser(raw).parseRoot();
}

function validateCraftDb(db) {
  const run = db.automaticRun || {};
  const items = db.items || {};
  const uniqueItemIds = new Set(Object.values(items).map((item) => Number(item.itemId)).filter(Boolean));
  const errors = [];

  if (Number(run.accepted) !== 98) errors.push(`accepted=${run.accepted}`);
  if (Number(run.pending) !== 0) errors.push(`pending=${run.pending}`);
  if (Number(run.failed) !== 0) errors.push(`failed=${run.failed}`);
  if (Number(run.fallbackAccepted) !== 0) errors.push(`fallbackAccepted=${run.fallbackAccepted}`);
  if (uniqueItemIds.size !== 98) errors.push(`uniqueItemIds=${uniqueItemIds.size}`);

  const levelCounts = Object.values(items).reduce((counts, item) => {
    const level = Number(item.itemLevel) || 0;
    counts[level] = (counts[level] || 0) + 1;
    return counts;
  }, {});
  if (levelCounts[285] !== 70 || levelCounts[295] !== 28) {
    errors.push(`levelCounts=${JSON.stringify(levelCounts)}`);
  }

  if (errors.length) {
    throw new Error(`制造业导出未通过校验：${errors.join(', ')}`);
  }
}

async function buildIconLookup(baseDir, craftItems, assetDir) {
  ensureDir(assetDir);
  const lookup = new Map();
  CLASS_CONFIG.forEach((classConfig) => {
    const filePath = path.join(baseDir, `${classConfig.key}.json`);
    if (!fs.existsSync(filePath)) return;
    const data = readJson(filePath);
    (data.instances || []).forEach((instance) => {
      (instance.encounters || []).forEach((encounter) => {
        (encounter.items || []).forEach((item) => {
          if (item.icon && item.iconAsset) {
            lookup.set(Number(item.icon), {
              iconName: item.iconName || '',
              iconAsset: item.iconAsset || '',
            });
          }
        });
      });
    });
  });

  const missingIconIds = Array.from(new Set(craftItems.map((item) => Number(item.icon)).filter(Boolean)))
    .filter((iconId) => !lookup.has(iconId) || !lookup.get(iconId).iconAsset);
  if (!missingIconIds.length) {
    return lookup;
  }

  const listfilePath = await ensureListfileCache();
  const iconNameMap = resolveIconNames(missingIconIds, listfilePath);
  let resolved = 0;
  for (const [iconId, iconName] of Object.entries(iconNameMap)) {
    try {
      const fileName = await downloadIconAsset(iconName, assetDir);
      lookup.set(Number(iconId), {
        iconName,
        iconAsset: `/assets/icons/${fileName}`,
      });
      resolved += 1;
    } catch (error) {
      console.warn(`制造业图标下载失败 ${iconId} ${iconName}: ${error.message}`);
    }
  }
  console.log(`制造业图标已解析 ${Object.keys(iconNameMap).length} 个，已生成 ${resolved} 个本地资源`);
  return lookup;
}

function buildCraftedInstance(items) {
  const sortedItems = items.slice().sort((left, right) => {
    if (left.slot !== right.slot) return String(left.slot).localeCompare(String(right.slot));
    if (left.ilvl !== right.ilvl) return right.ilvl - left.ilvl;
    return String(left.name).localeCompare(String(right.name), 'zh-Hans-CN');
  });

  return {
    id: 'manufacturing',
    name: '制造业',
    type: 'crafted',
    difficulty: 0,
    order: 1000,
    encounters: [{
      id: 'crafted-equipment',
      name: '制造业装备',
      order: 0,
      items: sortedItems,
    }],
  };
}

function removeExistingCraftedInstances(instances) {
  return (instances || []).filter((instance) => {
    return instance.id !== 'manufacturing'
      && instance.type !== 'crafted'
      && instance.sourceType !== 'crafted';
  });
}

function writeDataPair(outputDir, name, data) {
  const json = `${JSON.stringify(data, null, 2)}\n`;
  fs.writeFileSync(path.join(outputDir, `${name}.json`), json, 'utf8');
  fs.writeFileSync(path.join(outputDir, `${name}.js`), `module.exports = ${json}`, 'utf8');
}

function countItems(instances, predicate = null) {
  let total = 0;
  (instances || []).forEach((instance) => {
    (instance.encounters || []).forEach((encounter) => {
      (encounter.items || []).forEach((item) => {
        if (!predicate || predicate(item)) total += 1;
      });
    });
  });
  return total;
}

async function generate({ baseDir, outputDir, craftInput, assetDir }) {
  const craftDb = readCraftExport(craftInput);
  validateCraftDb(craftDb);

  fs.mkdirSync(outputDir, { recursive: true });
  const craftItems = Object.values(craftDb.items || {});
  const iconLookup = await buildIconLookup(baseDir, craftItems, assetDir);
  const classSummaries = [];
  const globalCraftedIds = new Set();

  CLASS_CONFIG.forEach((classConfig) => {
    const baseData = readJson(path.join(baseDir, `${classConfig.key}.json`));
    const craftedItems = craftItems
      .map((item) => buildCraftedItem(item, classConfig, iconLookup))
      .filter(Boolean);
    craftedItems.forEach((item) => globalCraftedIds.add(item.id));

    const instances = removeExistingCraftedInstances(baseData.instances);
    if (craftedItems.length) {
      instances.push(buildCraftedInstance(craftedItems));
    }

    const itemCount = countItems(instances);
    const tierItemCount = countItems(instances, (item) => item.sourceType === 'tier');
    const craftedItemCount = countItems(instances, (item) => item.sourceType === 'crafted');
    const output = {
      ...baseData,
      version: DATA_VERSION,
      dataVersion: DATA_VERSION,
      meta: {
        ...(baseData.meta || {}),
        itemCount,
        instanceCount: instances.length,
        tierItemCount,
        craftedItemCount,
      },
      instances,
    };

    writeDataPair(outputDir, classConfig.key, output);
    classSummaries.push({
      id: classConfig.id,
      key: classConfig.key,
      name: classConfig.name,
      itemCount,
      tierItemCount,
      craftedItemCount,
      color: classConfig.color,
      abbr: classConfig.abbr,
      armorTypeName: baseData.class && baseData.class.armorTypeName ? baseData.class.armorTypeName : '',
    });
    console.log(`${classConfig.name}: 制造业 ${craftedItemCount} 件，总计 ${itemCount} 件`);
  });

  const baseOverview = readJson(path.join(baseDir, 'overview.json'));
  const overview = {
    ...baseOverview,
    version: DATA_VERSION,
    dataVersion: DATA_VERSION,
    classes: classSummaries,
    craftedEquipment: {
      sourceAddonVersion: craftDb.addonVersion || '',
      exportedAt: craftDb.lastScan && craftDb.lastScan.completedAt ? craftDb.lastScan.completedAt : '',
      uniqueItemCount: globalCraftedIds.size,
      accepted: Number(craftDb.automaticRun && craftDb.automaticRun.accepted) || 0,
      normalItemLevel: Number(craftDb.automaticRun && craftDb.automaticRun.normalTargetItemLevel) || 0,
      specialItemLevel: Number(craftDb.automaticRun && craftDb.automaticRun.specialTargetItemLevel) || 0,
      normalAccepted: Number(craftDb.automaticRun && craftDb.automaticRun.normalAccepted) || 0,
      specialAccepted: Number(craftDb.automaticRun && craftDb.automaticRun.specialAccepted) || 0,
    },
  };
  writeDataPair(outputDir, 'overview', overview);

  console.log(`输出目录: ${outputDir}`);
  console.log(`制造业唯一物品: ${globalCraftedIds.size}`);
}

async function main() {
  const args = parseArgs(process.argv);
  await generate({
    baseDir: path.resolve(process.cwd(), args.base || DEFAULT_BASE_DIR),
    outputDir: path.resolve(process.cwd(), args.output || DEFAULT_OUTPUT_DIR),
    assetDir: path.resolve(process.cwd(), args.assets || DEFAULT_ASSET_DIR),
    craftInput: path.resolve(process.cwd(), args.craft || DEFAULT_CRAFT_INPUT),
  });
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

module.exports = {
  LuaParser,
  CLASS_CONFIG,
  buildCraftedItem,
  buildCraftedInstance,
  removeExistingCraftedInstances,
  countItems,
};
