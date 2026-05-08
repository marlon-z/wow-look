import { ASSET_BASE, DATA_BASE, LOCALE_DATA_BASE, STORAGE_KEYS } from './config.js';
import { SUPPORTED_LOCALES, createI18n, getLocaleName, resolveLocale } from './i18n.js?v=20260507-share-ui';

const CLASS_LIST = [
  { id: 1, key: 'warrior', name: '战士', shortName: '战士', armorType: 'plate', armorTypeName: '板甲', color: '#C69B6D', abbr: '战', assetCode: 'zs' },
  { id: 2, key: 'paladin', name: '圣骑士', shortName: '圣骑士', armorType: 'plate', armorTypeName: '板甲', color: '#F48CBA', abbr: '骑', assetCode: 'qs' },
  { id: 3, key: 'hunter', name: '猎人', shortName: '猎人', armorType: 'mail', armorTypeName: '锁甲', color: '#AAD372', abbr: '猎', assetCode: 'lr' },
  { id: 4, key: 'rogue', name: '盗贼', shortName: '盗贼', armorType: 'leather', armorTypeName: '皮甲', color: '#FFF468', abbr: '贼', assetCode: 'dz' },
  { id: 5, key: 'priest', name: '牧师', shortName: '牧师', armorType: 'cloth', armorTypeName: '布甲', color: '#FFFFFF', abbr: '牧', assetCode: 'ms' },
  { id: 6, key: 'deathknight', name: '死亡骑士', shortName: '死亡骑士', armorType: 'plate', armorTypeName: '板甲', color: '#C41E3A', abbr: '骑', assetCode: 'dk' },
  { id: 7, key: 'shaman', name: '萨满祭司', shortName: '萨满祭司', armorType: 'mail', armorTypeName: '锁甲', color: '#0070DD', abbr: '萨', assetCode: 'sm' },
  { id: 8, key: 'mage', name: '法师', shortName: '法师', armorType: 'cloth', armorTypeName: '布甲', color: '#3FC7EB', abbr: '法', assetCode: 'fs' },
  { id: 9, key: 'warlock', name: '术士', shortName: '术士', armorType: 'cloth', armorTypeName: '布甲', color: '#8788EE', abbr: '术', assetCode: 'ss' },
  { id: 10, key: 'monk', name: '武僧', shortName: '武僧', armorType: 'leather', armorTypeName: '皮甲', color: '#00FF98', abbr: '僧', assetCode: 'ws' },
  { id: 11, key: 'druid', name: '德鲁伊', shortName: '德鲁伊', armorType: 'leather', armorTypeName: '皮甲', color: '#FF7C0A', abbr: '德', assetCode: 'dly' },
  { id: 12, key: 'demonhunter', name: '恶魔猎手', shortName: '恶魔猎手', armorType: 'leather', armorTypeName: '皮甲', color: '#A330C9', abbr: '猎', assetCode: 'dh' },
  { id: 13, key: 'evoker', name: '唤魔师', shortName: '唤魔师', armorType: 'mail', armorTypeName: '锁甲', color: '#33937F', abbr: '唤', assetCode: 'hms' },
];

const SLOT_ORDER = ['head', 'neck', 'shoulder', 'cloak', 'chest', 'wrist', 'hand', 'waist', 'legs', 'feet', 'finger', 'trinket', 'weapon'];
const SLOT_OPTIONS = SLOT_ORDER.map((type) => ({ type }));
const STAT_OPTIONS = ['crit', 'haste', 'mastery', 'versatility'];
const SOURCE_OPTIONS = ['all', 'dungeon', 'raid', 'tier'];
const VIEW_MODES = ['slot', 'source'];
const FAVORITE_SLOT_ORDER = ['头', '项', '肩', '披', '胸', '腕', '手', '腰', '腿', '脚', '戒指', '饰品', '武器'];
const MAX_SHARED_FAVORITES = 20;
const NAME_PHRASES = [
  ['莱登选民的骇人面容', 'Ra-den Chosen\'s Dread Visage'],
  ['断法暗影面具', 'Spellbreaker Shadow Mask'],
  ['吞噬之夜面容', 'Visage of Devouring Night'],
  ['黑暗企图面具', 'Mask of Dark Intent'],
  ['虚空之鞭兜帽', 'Voidlash Cowl'],
  ['扭曲虚空项链', 'Twisting Nether Pendant'],
  ['尖刺伊米亚颈饰', 'Spiked Ymirjar Choker'],
  ['祖拉尔的暗影尖塔', 'Zuraal\'s Shadow Spire'],
  ['吞噬', 'Devouring'],
  ['虚空', 'Void'],
  ['暗影', 'Shadow'],
  ['黑暗', 'Dark'],
  ['暮光', 'Twilight'],
  ['星界', 'Astral'],
  ['宇宙', 'Cosmic'],
  ['奥术', 'Arcane'],
  ['烈焰', 'Flame'],
  ['火焰', 'Fire'],
  ['寒冰', 'Frost'],
  ['冰霜', 'Frost'],
  ['风暴', 'Storm'],
  ['雷霆', 'Thunder'],
  ['圣光', 'Light'],
  ['黎明', 'Dawn'],
  ['午夜', 'Midnight'],
  ['梦境', 'Dream'],
  ['恶臭', 'Fetid'],
  ['邪', 'Fel'],
  ['莱登', 'Ra-den'],
  ['选民', 'Chosen'],
  ['骇人', 'Dread'],
  ['断法', 'Spellbreaker'],
  ['扭曲', 'Twisted'],
  ['悲恸', 'Grieving'],
  ['盘绕', 'Coiled'],
  ['恶意', 'Malice'],
  ['面具', 'Mask'],
  ['面容', 'Visage'],
  ['兜帽', 'Cowl'],
  ['头盔', 'Helm'],
  ['冠', 'Crown'],
  ['项链', 'Necklace'],
  ['颈饰', 'Choker'],
  ['吊坠', 'Pendant'],
  ['披风', 'Cloak'],
  ['斗篷', 'Cape'],
  ['护肩', 'Shoulders'],
  ['肩甲', 'Spaulders'],
  ['外套', 'Coat'],
  ['胸甲', 'Chestguard'],
  ['长袍', 'Robe'],
  ['护腕', 'Bracers'],
  ['手套', 'Gloves'],
  ['护手', 'Handguards'],
  ['腰带', 'Belt'],
  ['束带', 'Girdle'],
  ['护腿', 'Legguards'],
  ['长裤', 'Leggings'],
  ['便鞋', 'Slippers'],
  ['战靴', 'Warboots'],
  ['戒指', 'Ring'],
  ['指环', 'Band'],
  ['徽记', 'Signet'],
  ['饰品', 'Trinket'],
  ['印记', 'Insignia'],
  ['徽章', 'Badge'],
  ['法杖', 'Staff'],
  ['长杖', 'Staff'],
  ['匕首', 'Dagger'],
  ['短剑', 'Blade'],
  ['战刃', 'Warglaive'],
  ['巨斧', 'Greataxe'],
  ['战斧', 'Axe'],
  ['巨剑', 'Greatsword'],
  ['长剑', 'Sword'],
  ['权杖', 'Scepter'],
  ['盾牌', 'Shield'],
  ['之', ' of '],
  ['的', '\'s '],
];

const state = {
  locale: resolveLocale(localStorage.getItem(STORAGE_KEYS.locale) || navigator.language),
  overview: null,
  classKey: '',
  classData: null,
  allItems: [],
  itemMap: {},
  classCache: {},
  classLocale: null,
  classLocaleCache: {},
  isLoading: false,
  loadError: '',
  selectedItem: null,
  overlay: '',
  toast: '',
  manualShareUrl: '',
  favoriteSortMode: 'slot',
  pendingRemoveFavoriteKey: '',
  sharedFavoriteList: [],
  sharedFavoriteGroups: [],
  sharedFavoriteError: '',
  isSharedFavoriteLoading: false,
  buildRequestMode: false,
  showBuildRequestIntro: false,
  favoritePickerList: [],
  filters: {
    keyword: '',
    selectedSpec: null,
    selectedSlots: [],
    stats: STAT_OPTIONS.map((type) => ({ type, state: 'none' })),
    selectedSourceTypes: [],
    selectedInstanceId: null,
    selectedViewMode: 'slot',
  },
};

let i18n = createI18n(state.locale);
const app = document.querySelector('#app');

function t(path, vars) {
  return i18n.t(path, vars);
}

function dataLabel(category, key, fallback = '') {
  if (key === undefined || key === null || key === '') return fallback || '';
  const value = i18n.raw(`data.${category}.${key}`);
  return value !== undefined ? value : (fallback || String(key));
}

function isChineseLocale() {
  return state.locale === 'zh-CN' || state.locale === 'zh-TW';
}

function dataLocaleKeys(locale = state.locale) {
  const resolved = resolveLocale(locale);
  if (resolved === 'zh-CN') return [];
  if (resolved === 'en-GB') return ['en-GB', 'en-US'];
  return [resolved];
}

function hasCjk(value) {
  return /[\u3400-\u9fff]/.test(String(value || ''));
}

function nonChineseFallback(value, fallback = '') {
  const text = String(value || '').trim();
  if (!text) return '';
  return !isChineseLocale() && hasCjk(text) ? fallback : text;
}

function translateFantasyName(name) {
  if (!name || isChineseLocale()) return name || '';
  let output = String(name);
  NAME_PHRASES.forEach(([cn, en]) => {
    output = output.split(cn).join(en);
  });
  output = output
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\s+/g, ' ')
    .replace(/\s+([,.;:])/g, '$1')
    .trim();
  return hasCjk(output) ? name : output;
}

function itemNameLabel(item) {
  if (!item) return '';
  const itemId = item.id || item.itemId;
  const localizedItem = localizedItemData(item);
  if (!isChineseLocale() && localizedItem?.name) return localizedItem.name;
  const rawName = item.name || '';
  const localized = dataLabel('itemNames', itemId, translateFantasyName(rawName));
  if (!isChineseLocale() && hasCjk(localized)) {
    const slot = item.slot ? t(`slots.${item.slot}`) : '';
    return `${slot ? `${slot} ` : ''}Item #${itemId}`;
  }
  return localized;
}

function localizedItemData(item) {
  const itemId = item?.id || item?.itemId;
  if (!itemId || isChineseLocale()) return null;
  return state.classLocale?.items?.[itemId] || null;
}

function localizedItemSetData(item) {
  const localizedItem = localizedItemData(item);
  const setId = localizedItem?.setId;
  if (!setId) return null;
  return state.classLocale?.itemSets?.[setId] || null;
}

function iconTextLabel(item) {
  const rawIconText = item?.iconText || (item?.name ? item.name.slice(0, 1) : '');
  if (isChineseLocale() || !hasCjk(rawIconText)) return rawIconText || '?';
  const name = itemNameLabel(item);
  return name ? name.slice(0, 1).toUpperCase() : '?';
}

function classLabel(classKey, fallback = '') {
  return dataLabel('classes', classKey, fallback);
}

function specLabel(spec) {
  if (!spec) return '';
  return dataLabel('specs', spec.id, spec.name);
}

function instanceLabel(instance) {
  if (!instance) return '';
  if (instance.type === 'tier') return t('sourceTypes.tier');
  return dataLabel('instances', instance.id, instance.name);
}

function instanceNameLabel(name) {
  if (!name) return '';
  const instance = (state.classData?.instances || []).find((item) => item.name === name);
  return instance ? instanceLabel(instance) : nonChineseFallback(name);
}

function encounterNameLabel(name) {
  return nonChineseFallback(name);
}

function armorTypeLabel(item) {
  const byType = dataLabel('armorTypes', item?.armorType, '');
  if (byType) return byType;
  return nonChineseFallback(valueNameLabel(item?.armorTypeName || item?.armorType || ''));
}

function valueNameLabel(value) {
  return dataLabel('valueNames', value, value);
}

function rawLineLabel(value) {
  const localized = valueNameLabel(value);
  return nonChineseFallback(localized);
}

function effectTextLabel(value) {
  const localized = valueNameLabel(value);
  return nonChineseFallback(localized);
}

function tierTextLabel(value) {
  const localized = valueNameLabel(value);
  return nonChineseFallback(localized);
}

function upgradeTrackLabel(value) {
  if (!value) return '';
  return String(value).replace(/^[^\s]+/, (prefix) => valueNameLabel(prefix));
}

function sourceDifficultyLabel(value) {
  if (!value) return '';
  return /\d+\/\d+/.test(String(value)) ? upgradeTrackLabel(value) : valueNameLabel(value);
}

function qualityLabel(item) {
  if (item?.quality === 4) return valueNameLabel('史诗');
  return sourceDifficultyLabel(item?.source?.difficultyName || '');
}

function statNameLabel(stat) {
  const inferredType = stat?.type || ({ 耐力: 'stamina', 护甲: 'armor', 敏捷: 'agility', 智力: 'intellect', 力量: 'strength' }[stat?.name]);
  return dataLabel('statTypes', inferredType, stat?.name || '');
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function assetUrl(path) {
  if (!path) return '';
  if (/^https?:\/\//.test(path)) return path;
  if (path.startsWith('/')) return `${ASSET_BASE}${path}`;
  return `${ASSET_BASE}/${path}`;
}

function getClassMeta(classKey) {
  return CLASS_LIST.find((item) => item.key === classKey) || null;
}

function getClassVisualAssets(classKey) {
  const classMeta = getClassMeta(classKey);
  const assetCode = (classMeta && classMeta.assetCode) || 'ws';
  return {
    banner: assetUrl(`/assets/zhiye/banner/${assetCode}.png`),
    emblem: assetUrl(`/assets/zhiye/emblem/${assetCode}.png`),
  };
}

async function fetchJson(url) {
  const response = await fetch(url, { cache: 'no-cache' });
  if (!response.ok) throw new Error(`${response.status} ${url}`);
  return response.json();
}

async function loadOverview() {
  try {
    state.overview = await fetchJson(`${DATA_BASE}/overview.json`);
  } catch (err) {
    console.error('load overview failed', err);
    state.overview = null;
  }
  render();
}

async function loadClassData(classKey) {
  if (state.classCache[classKey]) return state.classCache[classKey];
  const data = await fetchJson(`${DATA_BASE}/${classKey}.json`);
  state.classCache[classKey] = data;
  return data;
}

async function loadClassLocale(classKey, locale = state.locale) {
  const localeKeys = dataLocaleKeys(locale);
  for (const localeKey of localeKeys) {
    const cacheKey = `${localeKey}:${classKey}`;
    if (state.classLocaleCache[cacheKey] !== undefined) {
      if (state.classLocaleCache[cacheKey]) return state.classLocaleCache[cacheKey];
      continue;
    }
    try {
      const data = await fetchJson(`${LOCALE_DATA_BASE}/${localeKey}/data/${classKey}.json`);
      state.classLocaleCache[cacheKey] = data;
      return data;
    } catch {
      state.classLocaleCache[cacheKey] = null;
    }
  }
  return null;
}

function normalizeSlotType(slot) {
  return slot === 'back' ? 'cloak' : slot;
}

function normalizeSlotName(slot, slotName) {
  const normalizedSlot = normalizeSlotType(slot);
  if (normalizedSlot === 'neck' || slotName === '项链' || slotName === '颈') return '项链';
  if (normalizedSlot === 'wrist' || slotName === '手腕' || slotName === '护腕') return '腕';
  if (slotName === '手部') return '手';
  return slotName;
}

function buildSlotBadgeName(slot, slotName) {
  const normalizedSlot = normalizeSlotType(slot);
  if (normalizedSlot === 'neck' || slotName === '项' || slotName === '项链' || slotName === '颈') return '项链';
  if (normalizedSlot === 'wrist' || slotName === '腕' || slotName === '手腕' || slotName === '护腕') return '护腕';
  if (normalizedSlot === 'hand' || slotName === '手' || slotName === '手部') return '手部';
  return slotName;
}

function flattenItems(instances = []) {
  const result = [];
  let order = 0;
  instances.forEach((instance, instanceIndex) => {
    (instance.encounters || []).forEach((encounter, encounterIndex) => {
      (encounter.items || []).forEach((item, itemIndex) => {
        const normalizedSlot = normalizeSlotType(item.slot);
        result.push({
          ...item,
          slot: normalizedSlot,
          slotName: normalizeSlotName(normalizedSlot, item.slotName),
          slotBadgeName: buildSlotBadgeName(normalizedSlot, item.slotName),
          iconAsset: item.iconAsset ? assetUrl(item.iconAsset) : '',
          instanceId: instance.id,
          instanceName: instance.name,
          instanceType: instance.type,
          encounterId: encounter.id,
          encounterName: encounter.name,
          encounterOrder: encounter.order || 0,
          _sort: { order, instanceIndex, encounterIndex, itemIndex },
        });
        order += 1;
      });
    });
  });
  return result;
}

function buildStatLine(item) {
  const secondary = item?.stats?.secondary || [];
  if (secondary.length) return secondary.map((stat) => `${statNameLabel(stat)}${stat.value}`).join(' / ');
  if ((item?.stats?.effects?.use || []).length) return t('useEffect');
  if ((item?.stats?.effects?.equip || []).length) return t('equipEffect');
  return t('noSecondary');
}

function buildSpecNames(item, specs = []) {
  const specMap = {};
  specs.forEach((spec) => { specMap[spec.id] = specLabel(spec); });
  return (item.specs || []).map((specId) => specMap[specId]).filter(Boolean);
}

function buildMetaLine(item) {
  const parts = [t(`slots.${item.slot}`)];
  const armorLabel = armorTypeLabel(item);
  if (armorLabel && item.armorType !== 'none') parts.push(armorLabel);
  if (item.itemSubType && item.slot === 'weapon') parts.push(valueNameLabel(item.itemSubType));
  parts.push(`${t('itemLevel')} ${item.ilvl}`);
  return parts.join(' · ');
}

function enrichItems(items, classKey, specs) {
  const favorites = getFavorites();
  const draft = getBuildDraft();
  return items.map((item) => ({
    ...item,
    statLine: buildStatLine(item),
    specNames: buildSpecNames(item, specs),
    metaLine: buildMetaLine(item),
    sourceBadge: item.source ? item.source.difficultyName : '',
    roleBadge: (item.stats?.effects?.use || []).length ? t('useEffect') : ((item.stats?.effects?.equip || []).length ? t('equipEffect') : ''),
    rightMeta: item.slot === 'weapon' ? valueNameLabel(item.itemSubType) : (item.armorType !== 'none' ? armorTypeLabel(item) : t(`slots.${item.slot}`)),
    iconText: iconTextLabel(item),
    isFavorite: isFavorite(classKey, item.id, favorites),
    isBuildSelected: isBuildDraftItem(classKey, item.id, draft),
  }));
}

function filterItems(items) {
  const { selectedSpec, selectedSlots, selectedSourceTypes, selectedInstanceId, keyword } = state.filters;
  const selectedStats = state.filters.stats.filter((item) => item.state === 'include').map((item) => item.type);
  const excludedStats = state.filters.stats.filter((item) => item.state === 'exclude').map((item) => item.type);
  const normalizedKeyword = keyword.trim();

  return items.filter((item) => {
    if (selectedSpec && (!Array.isArray(item.specs) || !item.specs.includes(selectedSpec))) return false;
    if (selectedSlots.length && !selectedSlots.includes(item.slot)) return false;
    if (selectedSourceTypes.length && !selectedSourceTypes.includes(item.instanceType)) return false;
    if (selectedInstanceId && String(item.instanceId) !== String(selectedInstanceId)) return false;

    if (selectedStats.length || excludedStats.length) {
      const secondaryTypes = (item.stats?.secondary || []).map((stat) => stat.type);
      if (selectedStats.length && !selectedStats.every((type) => secondaryTypes.includes(type))) return false;
      if (excludedStats.length && excludedStats.some((type) => secondaryTypes.includes(type))) return false;
    }

    if (normalizedKeyword) {
      const haystack = [
        item.name,
        itemNameLabel(item),
        item.instanceName,
        instanceNameLabel(item.instanceName),
        item.encounterName,
        item.slotName,
        t(`slots.${item.slot}`),
        item.itemSubType,
        valueNameLabel(item.itemSubType),
      ].join(' ');
      if (!haystack.includes(normalizedKeyword)) return false;
    }
    return true;
  });
}

function groupItems(items = []) {
  const groups = {};
  items.forEach((item) => {
    if (!groups[item.slot]) groups[item.slot] = { slotType: item.slot, slotName: item.slotName, items: [] };
    groups[item.slot].items.push(item);
  });
  Object.keys(groups).forEach((slot) => groups[slot].items.sort((a, b) => a._sort.order - b._sort.order));
  return SLOT_ORDER.filter((slot) => groups[slot]).map((slot) => groups[slot]);
}

function groupItemsBySource(items = []) {
  const groups = {};
  items.forEach((item) => {
    const key = `${item.instanceId}:${item.encounterId}`;
    if (!groups[key]) {
      groups[key] = {
        groupType: 'source',
        key,
        title: item.instanceName,
        subtitle: item.encounterName,
        instanceId: item.instanceId,
        instanceType: item.instanceType,
        difficultyName: item.source ? item.source.difficultyName : '',
        items: [],
        _sort: item._sort,
      };
    }
    groups[key].items.push(item);
  });
  return Object.values(groups)
    .sort((a, b) => a._sort.order - b._sort.order)
    .map((group) => ({ ...group, items: group.items.sort((a, b) => a._sort.order - b._sort.order) }));
}

function buildInstanceOptions(instances = []) {
  return instances.map((instance) => ({ id: instance.id, name: instanceLabel(instance), rawName: instance.name, type: instance.type }));
}

function normalizeTooltipText(text) {
  return String(text || '')
    .replace(/\r\n/g, '\n')
    .replace(/\|c[0-9a-fA-F]{8}/g, '')
    .replace(/\|r/g, '')
    .replace(/(\d+)\|4([^:;]+):[^;]+;/g, '$1$2')
    .replace(/\n+/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .trim();
}

function stripEffectPrefix(text) {
  return normalizeTooltipText(text).replace(/^(装备|使用)[：:]\s*/, '').trim();
}

function effectKey(text) {
  return stripEffectPrefix(text).replace(/[\s。，“”"'：:；;，,（）()]+/g, '');
}

function uniqueCleanEffects(effects = []) {
  const seen = new Set();
  return effects.map(stripEffectPrefix).filter((line) => {
    const key = effectKey(line);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function isDuplicateEffectLine(line, effectKeys) {
  const key = effectKey(line);
  if (!key) return false;
  return Array.from(effectKeys).some((effect) => key === effect || key.startsWith(effect) || effect.startsWith(key));
}

function filterTooltipRaw(item) {
  const raw = item.tooltipRaw;
  if (!raw || !raw.length) return [];
  const skip = new Set([item.name, item.slotName]);
  ['史诗', '稀有', '精良', '优秀', '普通', '传说'].forEach((q) => skip.add(q));
  if (item.armorTypeName && item.armorType !== 'none') skip.add(`${item.slotName} ${item.armorTypeName}`);
  const effectKeys = new Set([...(item.stats?.effects?.equip || []), ...(item.stats?.effects?.use || [])].map(effectKey).filter(Boolean));
  const seen = new Set();
  return raw.map(normalizeTooltipText).filter((line) => {
    if (skip.has(line)) return false;
    if (/^物品等级/.test(line) || /^升级[：:]/.test(line) || /^装备唯一/.test(line)) return false;
    if (/棱彩插槽/.test(line) || /你尚未收藏/.test(line) || /^套装奖励将根据玩家专精变化/.test(line)) return false;
    if (/^\d+点护甲$/.test(line) || /^每秒伤害/.test(line) || /^\d+-\d+点伤害/.test(line) || /^速度/.test(line)) return false;
    if (/^\+\d+\s/.test(line)) return false;
    if (isDuplicateEffectLine(line, effectKeys)) return false;
    const key = effectKey(line) || line.replace(/\s+/g, '');
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function buildWhiteLines(item) {
  const white = item?.stats?.white || {};
  const lines = [];
  if (white.armor) lines.push(`${white.armor} ${dataLabel('statTypes', 'armor', '点护甲')}`);
  if (white.damageMin && white.damageMax) lines.push(`${white.damageMin}-${white.damageMax} Damage${white.speed ? ` · Speed ${white.speed}` : ''}`);
  if (white.dps) lines.push(`${white.dps} DPS`);
  return lines;
}

function buildTierBonusDisplay(item, selectedSpec, pageSpecs = []) {
  if (!item?.tier?.bonusesBySpec) return null;
  const requestedSpecId = selectedSpec || (Array.isArray(item.specs) && item.specs.length ? item.specs[0] : null);
  const availableSpecIds = Object.keys(item.tier.bonusesBySpec || {});
  const resolvedSpecId = item.tier.bonusesBySpec[String(requestedSpecId)] ? String(requestedSpecId) : (availableSpecIds[0] || null);
  if (!resolvedSpecId) return null;
  const specBonus = item.tier.bonusesBySpec[resolvedSpecId];
  const numericSpecId = Number(resolvedSpecId);
  const specMeta = pageSpecs.find((spec) => spec.id === numericSpecId);
  return {
    setName: item.tier.setName || '',
    pieces: Array.isArray(item.tier.pieces) ? item.tier.pieces : [],
    specId: numericSpecId,
    specName: specMeta ? specLabel(specMeta) : nonChineseFallback(specBonus.specName || ''),
    twoPiece: specBonus.twoPiece || '',
    fourPiece: specBonus.fourPiece || '',
    isFallback: selectedSpec && numericSpecId !== selectedSpec,
  };
}

function buildItemDetail(item, selectedSpec, specs = []) {
  const secondaryStats = (item.stats?.secondary || []).map((stat) => ({ ...stat }));
  const maxSecondaryValue = secondaryStats.reduce((max, stat) => Math.max(max, stat.value || 0), 0);
  secondaryStats.forEach((stat) => {
    stat.width = maxSecondaryValue > 0 ? `${Math.max(18, Math.round((stat.value / maxSecondaryValue) * 100))}%` : '18%';
  });
  return {
    ...item,
    whiteLines: buildWhiteLines(item),
    secondaryStats,
    filteredRaw: filterTooltipRaw(item),
    primaryStatText: item.stats?.primaryStats?.length ? item.stats.primaryStats.map((stat) => `${statNameLabel(stat)}${stat.value}`).join(' / ') : t('primaryNone'),
    specText: item.specNames?.length ? item.specNames.join(' / ') : t('classUniversal'),
    equipEffects: uniqueCleanEffects(item.stats?.effects?.equip || []),
    useEffects: uniqueCleanEffects(item.stats?.effects?.use || []),
    tierInfo: buildTierBonusDisplay(item, selectedSpec, specs),
    headerTags: [
      qualityLabel(item),
      t(`slots.${item.slot}`),
      item.itemSubType && item.slot === 'weapon' ? valueNameLabel(item.itemSubType) : (item.armorType !== 'none' ? armorTypeLabel(item) : ''),
      item.sourceType === 'tier' || item.instanceType === 'tier' ? t('sourceTypes.tier') : '',
    ].filter(Boolean),
  };
}

function getFavorites() {
  const value = readJson(STORAGE_KEYS.favorites, []);
  return Array.isArray(value) ? value.filter((item) => item?.key && item.itemId && item.classKey) : [];
}

function saveFavorites(favorites) {
  const normalized = Array.isArray(favorites) ? favorites.filter((item) => item?.key && item.itemId && item.classKey) : [];
  writeJson(STORAGE_KEYS.favorites, normalized);
  return normalized;
}

function getFavoriteKey(classKey, itemId) {
  return `${classKey}:${itemId}`;
}

function isFavorite(classKey, itemId, favorites = getFavorites()) {
  const key = getFavoriteKey(classKey, itemId);
  return favorites.some((item) => item.key === key);
}

function normalizeFavoriteSlotName(slotName) {
  const map = { 头部: '头', 项链: '项', 颈: '项', 肩部: '肩', 背部: '披', 披风: '披', 胸部: '胸', 手腕: '腕', 护腕: '腕', 手部: '手', 腰部: '腰', 腿部: '腿', 脚部: '脚', 足部: '脚' };
  return map[slotName] || slotName;
}

function buildFavoriteSlotBadgeName(slotName) {
  if (slotName === '项' || slotName === '项链' || slotName === '颈') return '项链';
  if (slotName === '腕' || slotName === '手腕' || slotName === '护腕') return '护腕';
  if (slotName === '手' || slotName === '手部') return '手部';
  return slotName;
}

function getSlotOrder(slotName) {
  const index = FAVORITE_SLOT_ORDER.indexOf(normalizeFavoriteSlotName(slotName));
  return index === -1 ? FAVORITE_SLOT_ORDER.length : index;
}

function buildFavoriteGroups(favorites = [], sortMode = 'slot') {
  const groups = [];
  const groupMap = {};
  favorites.forEach((favorite, index) => {
    const classKey = favorite.classKey || 'unknown';
    if (!groupMap[classKey]) {
      const group = { classKey, className: favorite.className || '未知职业', count: 0, items: [], firstAddedAt: favorite.addedAt || 0, firstIndex: index };
      groupMap[classKey] = group;
      groups.push(group);
    }
    const group = groupMap[classKey];
    group.count += 1;
    group.firstAddedAt = Math.max(group.firstAddedAt, favorite.addedAt || 0);
    group.items.push({
      ...favorite,
      slotName: normalizeFavoriteSlotName(favorite.slotName),
      slotBadgeName: buildFavoriteSlotBadgeName(favorite.slotBadgeName || favorite.slotName),
      _slotOrder: getSlotOrder(favorite.slotName),
      _addedAt: favorite.addedAt || 0,
    });
  });
  return groups.sort((a, b) => b.firstAddedAt - a.firstAddedAt || a.firstIndex - b.firstIndex).map((group) => ({
    ...group,
    items: group.items
      .sort((a, b) => sortMode === 'time' ? b._addedAt - a._addedAt || a._slotOrder - b._slotOrder : a._slotOrder - b._slotOrder || b._addedAt - a._addedAt)
      .map(({ _slotOrder, _addedAt, ...favorite }) => favorite),
  }));
}

function buildFavoriteSnapshot(classKey, className, item) {
  const secondary = (item.stats?.secondary || []).map((stat) => `${statNameLabel(stat)}${stat.value}`).join(' / ');
  return {
    key: getFavoriteKey(classKey, item.id),
    itemId: item.id,
    classKey,
    className,
    name: item.name,
    slotType: item.slot || '',
    slotName: normalizeFavoriteSlotName(item.slotName),
    slotBadgeName: buildFavoriteSlotBadgeName(item.slotBadgeName || item.slotName),
    ilvl: item.ilvl,
    iconAsset: item.iconAsset || '',
    iconText: iconTextLabel(item),
    sourceType: item.sourceType || item.instanceType || '',
    sourceName: instanceNameLabel(item.instanceName) || item.instanceName || '',
    encounterName: item.encounterName || '',
    difficultyName: item.source ? sourceDifficultyLabel(item.source.difficultyName) : '',
    statLine: item.statLine || secondary || t('noSecondary'),
    addedAt: Date.now(),
  };
}

function toggleFavorite(snapshot) {
  const favorites = getFavorites();
  const exists = favorites.some((item) => item.key === snapshot.key);
  saveFavorites(exists ? favorites.filter((item) => item.key !== snapshot.key) : [snapshot, ...favorites.filter((item) => item.key !== snapshot.key)]);
  return !exists;
}

function getBuildDraft() {
  const draft = readJson(STORAGE_KEYS.buildDraft, { classKey: '', className: '', items: [], updatedAt: 0 });
  return {
    classKey: draft.classKey || '',
    className: draft.className || '',
    items: Array.isArray(draft.items) ? draft.items.filter((item) => item?.key && item.itemId && item.classKey) : [],
    updatedAt: draft.updatedAt || 0,
  };
}

function saveBuildDraft(draft) {
  const normalized = { classKey: draft.classKey || '', className: draft.className || '', items: Array.isArray(draft.items) ? draft.items : [], updatedAt: Date.now() };
  writeJson(STORAGE_KEYS.buildDraft, normalized);
  return normalized;
}

function startBuildDraft(classKey, className, keepExisting = true) {
  const current = getBuildDraft();
  if (keepExisting && current.classKey === classKey) return current;
  return saveBuildDraft({ classKey, className, items: [] });
}

function isBuildDraftItem(classKey, itemId, draft = getBuildDraft()) {
  return draft.classKey === classKey && draft.items.some((item) => String(item.itemId) === String(itemId));
}

function toggleBuildDraftItem(classKey, className, snapshot) {
  const current = startBuildDraft(classKey, className);
  const exists = current.items.some((item) => item.key === snapshot.key);
  const items = exists ? current.items.filter((item) => item.key !== snapshot.key) : [{ ...snapshot, addedAt: Date.now() }, ...current.items.filter((item) => item.key !== snapshot.key)];
  saveBuildDraft({ classKey, className, items });
  return !exists;
}

function addBuildDraftItems(classKey, className, snapshots) {
  const current = startBuildDraft(classKey, className);
  const existingMap = {};
  current.items.forEach((item) => { existingMap[item.key] = true; });
  const now = Date.now();
  const additions = [];
  snapshots.forEach((snapshot) => {
    if (!snapshot || existingMap[snapshot.key]) return;
    existingMap[snapshot.key] = true;
    additions.push({ ...snapshot, addedAt: now - additions.length });
  });
  saveBuildDraft({ classKey, className, items: [...additions, ...current.items] });
  return additions.length;
}

function removeBuildDraftItem(key) {
  const current = getBuildDraft();
  saveBuildDraft({ ...current, items: current.items.filter((item) => item.key !== key) });
}

function buildFavoriteSharePayload(favorites) {
  const shareable = (Array.isArray(favorites) ? favorites : [])
    .filter((item) => item?.classKey && item.itemId !== undefined && item.itemId !== null)
    .slice(0, MAX_SHARED_FAVORITES);
  const groupMap = {};
  const groups = [];
  shareable.forEach((favorite) => {
    if (!groupMap[favorite.classKey]) {
      groupMap[favorite.classKey] = { classKey: favorite.classKey, itemIds: [] };
      groups.push(groupMap[favorite.classKey]);
    }
    const itemId = String(favorite.itemId);
    if (!groupMap[favorite.classKey].itemIds.includes(itemId)) groupMap[favorite.classKey].itemIds.push(itemId);
  });
  return groups.filter((group) => group.itemIds.length).map((group) => `${group.classKey}:${group.itemIds.join(',')}`).join(';');
}

function parseFavoriteSharePayload(payload) {
  if (!payload || typeof payload !== 'string') return [];
  let decoded = payload;
  try { decoded = decodeURIComponent(payload); } catch {}
  return decoded.split(';').map((segment) => {
    const [classKey, ids] = segment.split(':');
    const itemIds = String(ids || '').split(',').map((id) => id.trim()).filter(Boolean);
    return classKey && itemIds.length ? { classKey: classKey.trim(), itemIds } : null;
  }).filter(Boolean);
}

function getFilteredView() {
  const filteredItems = filterItems(state.allItems);
  return {
    filteredItems,
    groups: state.filters.selectedViewMode === 'source' ? groupItemsBySource(filteredItems) : groupItems(filteredItems),
  };
}

function getActiveFiltersText() {
  const parts = [];
  const spec = state.classData?.specs?.find((item) => item.id === state.filters.selectedSpec);
  if (spec) parts.push(specLabel(spec));
  if (state.filters.selectedSourceTypes.length) parts.push(state.filters.selectedSourceTypes.map((type) => t(`sourceTypes.${type}`)).join('/'));
  const instance = buildInstanceOptions(state.classData?.instances || []).find((item) => String(item.id) === String(state.filters.selectedInstanceId));
  if (instance) parts.push(instanceLabel(instance));
  state.filters.selectedSlots.forEach((slot) => parts.push(t(`slots.${slot}`)));
  state.filters.stats.filter((item) => item.state === 'include').forEach((stat) => parts.push(t(`stats.${stat.type}`)));
  state.filters.stats.filter((item) => item.state === 'exclude').forEach((stat) => parts.push(`-${t(`stats.${stat.type}`)}`));
  if (state.filters.keyword.trim()) parts.push(`${state.filters.keyword.trim()}`);
  return parts.length ? parts.join(' · ') : t('currentFiltersAll');
}

function parseRoute() {
  const query = new URLSearchParams(window.location.search);
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));
  return {
    classKey: hash.get('class') || query.get('classKey') || '',
    shareFav: query.get('shareFav') || hash.get('shareFav') || '',
    requestBuild: query.get('requestBuild') === '1' || hash.get('requestBuild') === '1',
  };
}

async function openClass(classKey, options = {}) {
  const classMeta = getClassMeta(classKey) || getClassMeta('monk');
  state.classKey = classMeta.key;
  state.classData = null;
  state.classLocale = null;
  state.allItems = [];
  state.itemMap = {};
  state.selectedItem = null;
  state.isLoading = true;
  state.loadError = '';
  state.buildRequestMode = Boolean(options.requestBuild);
  state.showBuildRequestIntro = Boolean(options.requestBuild);
  state.filters = {
    keyword: '',
    selectedSpec: null,
    selectedSlots: [],
    stats: STAT_OPTIONS.map((type) => ({ type, state: 'none' })),
    selectedSourceTypes: [],
    selectedInstanceId: null,
    selectedViewMode: 'slot',
  };
  if (state.buildRequestMode) startBuildDraft(classMeta.key, classMeta.name, false);
  setHash({ class: classMeta.key, requestBuild: state.buildRequestMode ? '1' : '' }, false);
  render();
  try {
    const data = await loadClassData(classMeta.key);
    const classLocale = await loadClassLocale(classMeta.key);
    state.classData = data;
    state.classLocale = classLocale;
    const allItems = flattenItems(data.instances || []);
    state.allItems = enrichItems(allItems, classMeta.key, data.specs || []);
    state.itemMap = {};
    state.allItems.forEach((item) => { state.itemMap[item.id] = item; });
  } catch (err) {
    console.error('load class failed', err);
    state.loadError = t('noData');
  } finally {
    state.isLoading = false;
    render();
  }
}

function setHash(values, rerender = true) {
  const params = new URLSearchParams();
  Object.entries(values).forEach(([key, value]) => {
    if (value) params.set(key, value);
  });
  history.replaceState(null, '', `${location.pathname}${location.search}#${params.toString()}`);
  if (rerender) render();
}

function resetFilters() {
  state.filters.keyword = '';
  state.filters.selectedSpec = null;
  state.filters.selectedSlots = [];
  state.filters.stats = STAT_OPTIONS.map((type) => ({ type, state: 'none' }));
  state.filters.selectedSourceTypes = [];
  state.filters.selectedInstanceId = null;
  state.filters.selectedViewMode = 'slot';
}

function refreshItemFlags() {
  state.allItems = enrichItems(flattenItems(state.classData?.instances || []), state.classKey, state.classData?.specs || []);
  state.itemMap = {};
  state.allItems.forEach((item) => { state.itemMap[item.id] = item; });
}

function showToast(message) {
  state.toast = message;
  render();
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => {
    state.toast = '';
    render();
  }, 1600);
}

function render() {
  if (!app) return;
  const routeClass = state.classKey;
  app.innerHTML = `
    <img class="global-site-bg" src="${assetUrl('/assets/public/bg.jpg')}" alt="">
    ${routeClass ? renderEquipmentView() : renderHomeView()}
    ${renderOverlays()}
    ${state.toast ? `<div class="toast">${escapeHtml(state.toast)}</div>` : ''}
  `;
}

function renderLocaleSelector() {
  return `
    <label class="locale-select">
      <span>${escapeHtml(t('language'))}</span>
      <select data-action="locale">
        ${SUPPORTED_LOCALES.map((locale) => `<option value="${locale}" ${locale === state.locale ? 'selected' : ''}>${escapeHtml(getLocaleName(locale))}</option>`).join('')}
      </select>
    </label>
  `;
}

function renderHomeView() {
  const countMap = {};
  (state.overview?.classes || []).forEach((item) => { countMap[item.key] = item.itemCount; });
  const favorites = getFavorites();
  return `
    <main class="page-shell index-page">
      <div class="top-corner left">
        <button class="pill-button quiet" data-action="announcement"><span class="icon notice"></span>${escapeHtml(t('announcement'))}</button>
      </div>
      <div class="top-corner right">
        ${renderLocaleSelector()}
        <button class="pill-button" data-action="favorites"><span class="icon star"></span>${escapeHtml(t('favorites'))}${favorites.length ? `<b>${favorites.length}</b>` : ''}</button>
      </div>
      <section class="home-header">
        <h1 class="brand-logo">SeasonLoot</h1>
      </section>
      <div class="prompt-wrap"><span>${escapeHtml(t('chooseClass'))}</span></div>
      <section class="class-grid-wrap">
        ${[CLASS_LIST.slice(0, 4), CLASS_LIST.slice(4, 9), CLASS_LIST.slice(9, 13)].map((row) => `
          <div class="class-row">
            ${row.map((item) => {
              const assets = getClassVisualAssets(item.key);
              return `
                <button class="class-cell" data-action="class" data-class="${item.key}">
                  <img class="class-emblem" src="${assets.emblem}" alt="">
                  <span class="class-label" style="color:${item.color}">${escapeHtml(classLabel(item.key, item.shortName))}</span>
                  <small>${countMap[item.key] || 0}</small>
                </button>
              `;
            }).join('')}
          </div>
        `).join('')}
      </section>
      <footer class="footer-note"><i></i><span>${escapeHtml(t('dataNote'))}</span><i></i></footer>
    </main>
  `;
}

function renderEquipmentView() {
  const classMeta = getClassMeta(state.classKey) || {};
  const className = classLabel(state.classKey, state.classData?.class?.name || classMeta.name || '');
  const assets = getClassVisualAssets(state.classKey);
  const favorites = getFavorites();
  const draft = getBuildDraft();
  const { filteredItems, groups } = getFilteredView();
  const activeText = getActiveFiltersText();
  return `
    <main class="page-shell equipment-page">
      <header class="top-bar">
        <button class="back-btn" data-action="home">‹</button>
        <div class="top-title-wrap">
          <img class="top-emblem" src="${assets.emblem}" alt="">
          <strong style="color:${classMeta.color || '#ffbb12'}">${escapeHtml(className)}</strong>
        </div>
        <div class="top-actions">
          ${renderLocaleSelector()}
          <button class="pill-button compact" data-action="favorites"><span class="icon star"></span>${escapeHtml(t('favorites'))}${favorites.length ? `<b>${favorites.length}</b>` : ''}</button>
        </div>
      </header>

      <section class="hero-panel">
        <img class="hero-banner" src="${assets.banner}" alt="">
        <div class="hero-shade"></div>
        <div class="hero-panel-content">
          <div class="hero-summary-row">
            <span class="hero-count">${filteredItems.length}</span>
            <span class="hero-count-unit">${escapeHtml(t('resultUnit'))}</span>
            <button class="hero-share-btn" data-action="${state.buildRequestMode && draft.items.length ? 'shareBuild' : 'shareRequest'}">${escapeHtml(state.buildRequestMode && draft.items.length ? t('buildShare') : t('buildRequest'))}</button>
          </div>
          <p>${escapeHtml(activeText)}</p>
        </div>
      </section>

      ${state.buildRequestMode ? renderBuildIntroOrStrip(draft, className) : ''}
      ${renderFilterPanel()}
      ${state.isLoading ? `<section class="empty-state">${escapeHtml(t('loading'))}</section>` : ''}
      ${state.loadError ? `<section class="empty-state">${escapeHtml(state.loadError)}</section>` : ''}
      ${!state.isLoading && !state.loadError ? renderGroups(groups) : ''}
      <div class="page-end-pad"></div>
    </main>
  `;
}

function renderBuildIntroOrStrip(draft, className) {
  if (state.showBuildRequestIntro) {
    return `
      <section class="build-request-card">
        <button class="panel-x" data-action="dismissBuildIntro"></button>
        <div class="build-request-copy">
          <h3>${escapeHtml(t('buildRequestIntroTitle', { className }))}</h3>
          <p>${escapeHtml(t('buildRequestIntroDesc'))}</p>
        </div>
        <div class="build-request-actions">
          <button data-action="newBuild">${escapeHtml(t('newBuild'))}</button>
          <button data-action="favoritePicker">${escapeHtml(t('fromFavorites'))}</button>
          <button data-action="buildDraft">${escapeHtml(t('viewBuild'))}</button>
        </div>
      </section>
    `;
  }
  return `
    <section class="build-draft-strip">
      <strong>${escapeHtml(t('buildDraftCount', { count: draft.items.length }))}</strong>
      <span><button data-action="favoritePicker">${escapeHtml(t('fromFavorites'))}</button><button data-action="buildDraft">${escapeHtml(t('viewBuild'))}</button></span>
    </section>
  `;
}

function visibleInstanceOptions() {
  const options = buildInstanceOptions(state.classData?.instances || []);
  if (!state.filters.selectedSourceTypes.length) return options;
  return options.filter((item) => state.filters.selectedSourceTypes.includes(item.type));
}

function renderFilterPanel() {
  const specs = state.classData?.specs || [];
  return `
    <section class="filter-panel">
      <label class="search-box">
        <span class="search-icon"></span>
        <input data-action="keyword" value="${escapeHtml(state.filters.keyword)}" placeholder="${escapeHtml(t('searchPlaceholder'))}">
      </label>
      ${renderChipRow('filters.spec', specs.map((spec) => ({ id: spec.id, label: specLabel(spec), on: state.filters.selectedSpec === spec.id, action: 'spec' })))}
      ${renderChipRow('filters.stat', state.filters.stats.map((stat) => ({ id: stat.type, label: t(`stats.${stat.type}`), on: stat.state === 'include', excluded: stat.state === 'exclude', action: 'stat' })))}
      ${renderChipRow('filters.view', VIEW_MODES.map((type) => ({ id: type, label: t(`views.${type}`), on: state.filters.selectedViewMode === type, action: 'viewMode' })))}
      ${renderChipRow('filters.source', SOURCE_OPTIONS.map((type) => ({ id: type, label: t(`sourceTypes.${type}`), on: type === 'all' ? !state.filters.selectedSourceTypes.length : state.filters.selectedSourceTypes.includes(type), action: 'sourceType' })))}
      ${renderChipRow('filters.slot', SLOT_OPTIONS.map((slot) => ({ id: slot.type, label: t(`slots.${slot.type}`), on: state.filters.selectedSlots.includes(slot.type), action: 'slot' })), true)}
      ${renderChipRow('filters.instance', visibleInstanceOptions().map((instance) => ({ id: instance.id, label: instanceLabel(instance), on: String(state.filters.selectedInstanceId) === String(instance.id), action: 'instance' })), true)}
      <div class="filter-actions">
        <span>${escapeHtml(getActiveFiltersText())}</span>
        <button data-action="reset">${escapeHtml(t('reset'))}</button>
      </div>
    </section>
  `;
}

function renderChipRow(labelKey, chips, scroll = false) {
  return `
    <div class="filter-row">
      <div class="filter-head"><span class="filter-symbol"></span><strong>${escapeHtml(t(labelKey))}</strong></div>
      <div class="${scroll ? 'chip-scroll-wrap' : 'chip-grid'}">
        ${chips.map((chip) => `<button class="chip ${chip.on ? 'on' : ''} ${chip.excluded ? 'excluded' : ''}" data-action="${chip.action}" data-id="${escapeHtml(chip.id)}">${escapeHtml(chip.label)}</button>`).join('')}
      </div>
    </div>
  `;
}

function renderGroups(groups) {
  if (!state.allItems.length) return `<section class="empty-state">${escapeHtml(t('noData'))}</section>`;
  if (!groups.length) return `<section class="empty-state">${escapeHtml(t('noResults'))}</section>`;
  return `<section class="results-grid">${groups.map((group) => renderGroup(group)).join('')}</section>`;
}

function renderGroup(group) {
  const title = state.filters.selectedViewMode === 'source'
    ? (group.instanceType === 'tier' ? t('sourceTypes.tier') : dataLabel('instances', group.instanceId, group.title))
    : t(`slots.${group.slotType}`);
  const subtitle = state.filters.selectedViewMode === 'source'
    ? [encounterNameLabel(group.subtitle), sourceDifficultyLabel(group.difficultyName)].filter(Boolean).join(' · ')
    : '';
  return `
    <section class="group-section">
      <header class="group-head">
        <div>
          <h2>${escapeHtml(title)}</h2>
          ${subtitle ? `<small>${escapeHtml(subtitle)}</small>` : ''}
        </div>
        <span>${escapeHtml(t('selectedCount', { count: group.items.length }))}</span>
      </header>
      <div class="item-list">${group.items.map(renderItemCard).join('')}</div>
    </section>
  `;
}

function renderItemCard(item) {
  const active = state.buildRequestMode ? item.isBuildSelected : item.isFavorite;
  const favoriteText = state.buildRequestMode ? (active ? t('addedToBuild') : t('addToBuild')) : (active ? t('favoriteOn') : t('favoriteOff'));
  return `
    <article class="item-card" data-action="item" data-id="${item.id}">
      <div class="item-icon-wrap">
        ${item.iconAsset ? `<img class="item-icon-img" src="${item.iconAsset}" alt="">` : `<span class="item-icon-letter">${escapeHtml(item.iconText)}</span>`}
        <i></i>
      </div>
      <div class="item-body">
        <div class="item-row top">
          <h3>${escapeHtml(itemNameLabel(item))}</h3>
          <div class="item-row-actions">
            <button class="favorite-star ${active ? 'on' : ''}" data-action="favoriteItem" data-id="${item.id}"><span class="icon star"></span>${escapeHtml(favoriteText)}</button>
            <span class="item-quality-badge">${escapeHtml(t(`slots.${item.slot}`))}</span>
          </div>
        </div>
        <p class="item-stat-line">${escapeHtml(item.statLine)}</p>
        <div class="item-row meta">
          <span>${escapeHtml(item.rightMeta || item.slotName)} · ilvl${escapeHtml(item.ilvl)}</span>
          <span>${escapeHtml(instanceNameLabel(item.instanceName))} ›</span>
        </div>
      </div>
    </article>
  `;
}

function renderOverlays() {
  return [
    state.overlay === 'announcement' ? renderAnnouncement() : '',
    state.overlay === 'favorites' ? renderFavoritesPanel() : '',
    state.overlay === 'shared' ? renderSharedFavoritesPanel() : '',
    state.overlay === 'manualShare' ? renderManualSharePanel() : '',
    state.overlay === 'detail' && state.selectedItem ? renderDetailModal(state.selectedItem) : '',
    state.overlay === 'buildDraft' ? renderBuildDraftPanel() : '',
    state.overlay === 'favoritePicker' ? renderFavoritePickerPanel() : '',
  ].join('');
}

function renderOverlayFrame(title, body, options = {}) {
  const subtitle = options.subtitle ? `<span class="overlay-count-badge">${escapeHtml(options.subtitle)}</span>` : '';
  return `
    <div class="modal-mask" data-action="closeOverlay">
      <section class="overlay-panel ${options.className || ''}" data-stop>
        <header class="overlay-head">
          <div class="overlay-title-line"><h2>${escapeHtml(title)}</h2>${subtitle}</div>
          <button class="panel-x" data-action="closeOverlay"></button>
        </header>
        <div class="panel-divider"></div>
        ${body}
      </section>
    </div>
  `;
}

function renderAnnouncement() {
  const body = `
    <div class="announcement-body">
      <p>WoWLook web beta. The Cloudflare version uses the same data files and assets as the mini program.</p>
      <ul>
        <li>Static single-page app.</li>
        <li>Responsive phone, tablet, and desktop layout.</li>
        <li>UI i18n layer, with equipment data kept unchanged.</li>
      </ul>
    </div>
  `;
  return renderOverlayFrame(t('announcement'), body);
}

function renderFavoritesPanel() {
  const favorites = getFavorites();
  const groups = buildFavoriteGroups(favorites, state.favoriteSortMode);
  const action = favorites.length ? `
    <div class="panel-actions">
      <button data-action="toggleFavoriteSort">${escapeHtml(state.favoriteSortMode === 'slot' ? t('sortByTime') : t('sortBySlot'))}</button>
      <button data-action="shareFavorites">${escapeHtml(t('share'))}</button>
      <button class="danger" data-action="clearFavorites">${escapeHtml(t('clear'))}</button>
    </div>
  ` : '';
  const body = `
    ${action}
    ${groups.length ? `<div class="favorite-list">${groups.map((group) => renderFavoriteGroup(group, true)).join('')}</div>` : `<div class="favorite-empty">${escapeHtml(t('favoritesEmpty'))}</div>`}
  `;
  return renderOverlayFrame(t('favorites'), body, { subtitle: t('selectedCount', { count: favorites.length }) });
}

function renderSharedFavoritesPanel() {
  let content = `<div class="favorite-empty">${escapeHtml(t('sharedLoading'))}</div>`;
  if (state.sharedFavoriteError) content = `<div class="favorite-empty">${escapeHtml(state.sharedFavoriteError)}</div>`;
  if (!state.isSharedFavoriteLoading && state.sharedFavoriteGroups.length) {
    content = `
      <div class="favorite-list">${state.sharedFavoriteGroups.map((group) => renderFavoriteGroup(group, false)).join('')}</div>
      <div class="shared-action-bar"><button data-action="importShared">${escapeHtml(t('importFavorites'))}</button></div>
    `;
  }
  return renderOverlayFrame(t('sharedFavorites'), content);
}

function renderManualSharePanel() {
  const body = `
    <div class="manual-share-body">
      <p>${escapeHtml(t('manualShareDesc'))}</p>
      <textarea readonly data-action="manualShareText">${escapeHtml(state.manualShareUrl)}</textarea>
      <div class="panel-actions">
        <button data-action="copyManualShare">${escapeHtml(t('copyLink'))}</button>
      </div>
    </div>
  `;
  return renderOverlayFrame(t('manualShareTitle'), body);
}

function renderFavoriteGroup(group, removable) {
  return `
    <section class="favorite-group">
      <header><strong>${escapeHtml(classLabel(group.classKey, group.className))}</strong><span>${escapeHtml(t('selectedCount', { count: group.count }))}</span></header>
      ${group.items.map((favorite) => renderFavoriteItem(favorite, removable)).join('')}
    </section>
  `;
}

function renderFavoriteItem(favorite, removable) {
  const slotLabel = favorite.slotType ? t(`slots.${favorite.slotType}`) : (favorite.slotBadgeName || favorite.slotName);
  const sourceLabel = instanceNameLabel(favorite.sourceName) || favorite.sourceName || favorite.encounterName || '';
  return `
    <article class="favorite-item favorite-entry" data-action="favoriteTap" data-item-id="${escapeHtml(favorite.itemId)}" data-class="${escapeHtml(favorite.classKey)}">
      <div class="favorite-icon-wrap">
        ${favorite.iconAsset ? `<img src="${escapeHtml(favorite.iconAsset)}" alt="">` : `<span>${escapeHtml(favorite.iconText || '装')}</span>`}
      </div>
      <div class="favorite-item-body">
        <div class="favorite-row"><strong>${escapeHtml(itemNameLabel(favorite))}</strong></div>
        <p>${escapeHtml(favorite.statLine || t('noSecondary'))}</p>
        <div class="favorite-row meta">
          <span class="favorite-meta-left">${escapeHtml(classLabel(favorite.classKey, favorite.className))} · ilvl${escapeHtml(favorite.ilvl)}</span>
        </div>
      </div>
      <div class="favorite-item-actions">
        <div class="favorite-item-controls"><span class="favorite-slot-badge">${escapeHtml(slotLabel)}</span>${removable ? `<button class="remove-dot" data-action="removeFavorite" data-key="${escapeHtml(favorite.key)}"></button>` : ''}</div>
        ${sourceLabel ? `<span class="favorite-source-chip"><span>${escapeHtml(sourceLabel)}</span><i></i></span>` : ''}
      </div>
    </article>
  `;
}

function renderDetailModal(item) {
  const body = `
    <div class="tt-header">
      <div class="tt-icon-wrap">${item.iconAsset ? `<img src="${item.iconAsset}" alt="">` : `<span>${escapeHtml(item.iconText)}</span>`}<i></i></div>
      <div class="tt-title-area">
        <h2>${escapeHtml(itemNameLabel(item))}</h2>
        <div>${item.headerTags.map((tag) => `<span>${escapeHtml(tag)}</span>`).join('')}</div>
      </div>
    </div>
    <div class="tt-body">
      <div class="tt-ilvl-row">
        <strong>${escapeHtml(t('itemLevel'))} ${escapeHtml(item.ilvl)}</strong>
        <button class="favorite-star ${item.isFavorite ? 'on' : ''}" data-action="detailFavorite" data-id="${item.id}"><span class="icon star"></span>${escapeHtml(item.isFavorite ? (state.buildRequestMode ? t('addedToBuild') : t('favoriteOn')) : (state.buildRequestMode ? t('addToBuild') : t('favoriteOff')))}</button>
      </div>
      ${item.upgradeTrack ? `<p>${escapeHtml(t('upgrade'))}: ${escapeHtml(upgradeTrackLabel(item.upgradeTrack))}</p>` : ''}
      <p>${escapeHtml(t(`slots.${item.slot}`))}${item.itemSubType ? ` · ${escapeHtml(valueNameLabel(item.itemSubType))}` : ''}</p>
      ${item.tooltipFlags?.uniqueEquipped ? `<p>${escapeHtml(t('uniqueEquipped'))}</p>` : ''}
      ${item.tooltipFlags?.prismaticSocket ? `<p class="socket-line">${escapeHtml(t('prismaticSocket'))}</p>` : ''}
      <hr>
      ${(item.whiteLines || []).map((line) => `<p class="white-line">${escapeHtml(line)}</p>`).join('')}
      ${(item.stats?.primaryStats || []).map((stat) => `<p class="white-line">+${escapeHtml(stat.value)} ${escapeHtml(statNameLabel(stat))}</p>`).join('')}
      ${item.stats?.stamina ? `<p class="white-line">+${escapeHtml(item.stats.stamina.value)} ${escapeHtml(statNameLabel(item.stats.stamina))}</p>` : ''}
      ${(item.secondaryStats || []).map((stat) => `<div class="stat-bar-item"><p>+${escapeHtml(stat.value)} ${escapeHtml(statNameLabel(stat))}</p><div><i style="width:${escapeHtml(stat.width)}"></i></div></div>`).join('')}
      ${renderTierInfo(item)}
      ${renderEffects(item)}
      <hr>
      <p>${escapeHtml(t('lootSpec'))}: ${escapeHtml(item.specText)}</p>
      <p>${escapeHtml(instanceNameLabel(item.instanceName) || '')}${encounterNameLabel(item.encounterName) ? ` · ${escapeHtml(encounterNameLabel(item.encounterName))}` : ''}</p>
      <small>${escapeHtml(sourceDifficultyLabel(item.source?.difficultyName || ''))} · ID ${escapeHtml(item.id)}</small>
    </div>
  `;
  return renderOverlayFrame('', body, { className: 'detail-panel' });
}

function renderTierInfo(item) {
  if (!item.tierInfo) return '';
  const localizedSet = localizedItemSetData(item);
  const setName = localizedSet?.name || nonChineseFallback(translateFantasyName(item.tierInfo.setName), t('sourceTypes.tier'));
  const setEffects = Array.isArray(localizedSet?.effects) ? localizedSet.effects : [];
  const localizedTwoPiece = setEffects.find((effect) => Number(effect.requiredCount) === 2)?.displayString || '';
  const localizedFourPiece = setEffects.find((effect) => Number(effect.requiredCount) === 4)?.displayString || '';
  const twoPiece = localizedTwoPiece || tierTextLabel(item.tierInfo.twoPiece);
  const fourPiece = localizedFourPiece || tierTextLabel(item.tierInfo.fourPiece);
  const hiddenBonus = !isChineseLocale() && !localizedSet && [item.tierInfo.twoPiece, item.tierInfo.fourPiece].some(hasCjk);
  return `
    <section class="tt-extra-block">
      <strong>${escapeHtml(setName)} (${item.tierInfo.pieces.length})</strong>
      ${item.tierInfo.specName ? `<p>${escapeHtml(item.tierInfo.specName)}</p>` : ''}
      ${twoPiece ? `<p class="green-text">(2) ${escapeHtml(twoPiece)}</p>` : ''}
      ${fourPiece ? `<p class="green-text">(4) ${escapeHtml(fourPiece)}</p>` : ''}
      ${hiddenBonus ? `<p class="dim-text">${escapeHtml(t('setBonusUnavailable'))}</p>` : ''}
    </section>
  `;
}

function renderEffects(item) {
  const localizedItem = localizedItemData(item);
  const localizedSpellLines = !isChineseLocale() && Array.isArray(localizedItem?.spells)
    ? localizedItem.spells.map((spell) => spell.description).filter(Boolean)
    : [];
  const localizedDescription = !isChineseLocale() ? localizedItem?.description || '' : '';
  const equipLines = (item.equipEffects || [])
    .map(effectTextLabel)
    .filter(Boolean)
    .map((line) => `${t('equipEffect')}: ${line}`);
  const useLines = (item.useEffects || [])
    .map(effectTextLabel)
    .filter(Boolean)
    .map((line) => `${t('useEffect')}: ${line}`);
  const rawLines = (item.filteredRaw || []).map(rawLineLabel).filter(Boolean);
  const lines = [
    ...localizedSpellLines,
    localizedDescription,
    ...equipLines,
    ...useLines,
    ...rawLines,
  ].filter(Boolean);
  const hiddenText = !isChineseLocale() && [
    ...(item.equipEffects || []),
    ...(item.useEffects || []),
    ...(item.filteredRaw || []),
  ].some(hasCjk) && !localizedSpellLines.length && !localizedDescription;
  if (!lines.length && !hiddenText) return '';
  return `<section class="tt-extra-block">${lines.map((line) => `<p class="green-text">${escapeHtml(line)}</p>`).join('')}${hiddenText ? `<p class="dim-text">${escapeHtml(t('localizedTextUnavailable'))}</p>` : ''}</section>`;
}

function renderBuildDraftPanel() {
  const draft = getBuildDraft();
  const groups = buildFavoriteGroups(draft.items);
  const body = groups.length
    ? `<div class="panel-actions"><button data-action="shareBuild">${escapeHtml(t('buildShare'))}</button><button class="danger" data-action="clearBuildDraft">${escapeHtml(t('clear'))}</button></div><div class="favorite-list">${groups.map((group) => renderBuildGroup(group)).join('')}</div>`
    : `<div class="favorite-empty">${escapeHtml(t('buildEmpty'))}</div>`;
  return renderOverlayFrame(t('buildDraft'), body, { subtitle: t('selectedCount', { count: draft.items.length }) });
}

function renderBuildGroup(group) {
  return `
    <section class="favorite-group">
      <header><strong>${escapeHtml(classLabel(group.classKey, group.className))}</strong><span>${escapeHtml(t('selectedCount', { count: group.count }))}</span></header>
      ${group.items.map((favorite) => {
        const slotLabel = favorite.slotType ? t(`slots.${favorite.slotType}`) : (favorite.slotBadgeName || favorite.slotName);
        return `
        <article class="favorite-item build-item" data-action="favoriteTap" data-item-id="${escapeHtml(favorite.itemId)}" data-class="${escapeHtml(favorite.classKey)}">
          <div class="favorite-icon-wrap">${favorite.iconAsset ? `<img src="${escapeHtml(favorite.iconAsset)}" alt="">` : `<span>${escapeHtml(favorite.iconText || '装')}</span>`}</div>
          <div class="favorite-item-body"><div class="favorite-row"><strong>${escapeHtml(itemNameLabel(favorite))}</strong></div><p>${escapeHtml(favorite.statLine || t('noSecondary'))}</p></div>
          <div class="favorite-item-actions"><span class="favorite-slot-badge">${escapeHtml(slotLabel)}</span><button class="remove-dot" data-action="removeBuildItem" data-key="${escapeHtml(favorite.key)}"></button></div>
        </article>
      `;
      }).join('')}
    </section>
  `;
}

function renderFavoritePickerPanel() {
  const body = state.favoritePickerList.length
    ? `<div class="panel-actions"><button data-action="addAllFavoritePicker">${escapeHtml(t('all'))}</button></div><div class="favorite-list">${state.favoritePickerList.map((favorite) => renderPickerItem(favorite)).join('')}</div>`
    : `<div class="favorite-empty">${escapeHtml(t('favoritesEmpty'))}</div>`;
  return renderOverlayFrame(t('fromFavorites'), body, { subtitle: t('selectedCount', { count: state.favoritePickerList.length }) });
}

function renderPickerItem(favorite) {
  return `
    <article class="favorite-item" data-action="addFavoritePicker" data-key="${escapeHtml(favorite.key)}">
      <div class="favorite-icon-wrap">${favorite.iconAsset ? `<img src="${escapeHtml(favorite.iconAsset)}" alt="">` : `<span>${escapeHtml(favorite.iconText || '装')}</span>`}</div>
      <div class="favorite-item-body"><div class="favorite-row"><strong>${escapeHtml(itemNameLabel(favorite))}</strong><span>${escapeHtml(favorite.isPicked ? t('addedToBuild') : t('addToBuild'))}</span></div><p>${escapeHtml(favorite.statLine || t('noSecondary'))}</p></div>
    </article>
  `;
}

function openDetail(itemId) {
  const item = state.itemMap[itemId];
  if (!item) return;
  state.selectedItem = buildItemDetail({
    ...item,
    isFavorite: state.buildRequestMode ? isBuildDraftItem(state.classKey, item.id) : isFavorite(state.classKey, item.id),
  }, state.filters.selectedSpec, state.classData?.specs || []);
  state.overlay = 'detail';
  render();
}

async function openFavoriteDetail(classKey, itemId) {
  try {
    const cache = classKey === state.classKey && state.itemMap[itemId]
      ? { classKey, className: state.classData?.class?.name || '', specs: state.classData?.specs || [], itemMap: state.itemMap }
      : await loadFavoriteClassItems(classKey);
    const item = cache?.itemMap?.[itemId];
    if (!item) {
      showToast(t('sharedExpired'));
      return;
    }
    state.selectedItem = buildItemDetail({ ...item, isFavorite: isFavorite(classKey, item.id), classKey, className: cache.className }, null, cache.specs);
    state.overlay = 'detail';
    render();
  } catch {
    showToast(t('sharedExpired'));
  }
}

async function loadFavoriteClassItems(classKey) {
  const data = await loadClassData(classKey);
  const classMeta = data.class || getClassMeta(classKey) || {};
  const items = enrichItems(flattenItems(data.instances || []), classKey, data.specs || []);
  const itemMap = {};
  items.forEach((item) => { itemMap[item.id] = item; });
  return { classKey, className: classMeta.name || '', specs: data.specs || [], itemMap };
}

function toggleCurrentFavorite(itemId) {
  const item = state.itemMap[itemId] || state.selectedItem;
  if (!item) return;
  const className = state.classData?.class?.name || getClassMeta(state.classKey)?.name || '';
  if (state.buildRequestMode) {
    const selected = toggleBuildDraftItem(state.classKey, className, buildFavoriteSnapshot(state.classKey, className, item));
    showToast(selected ? t('addedToBuild') : t('remove'));
  } else {
    const selected = toggleFavorite(buildFavoriteSnapshot(state.classKey, className, item));
    showToast(selected ? t('favoriteOn') : t('remove'));
  }
  refreshItemFlags();
  if (state.selectedItem?.id === item.id) {
    state.selectedItem = buildItemDetail({ ...state.itemMap[item.id], isFavorite: state.buildRequestMode ? isBuildDraftItem(state.classKey, item.id) : isFavorite(state.classKey, item.id) }, state.filters.selectedSpec, state.classData?.specs || []);
  }
  render();
}

function buildFavoritePickerList() {
  const draft = getBuildDraft();
  return getFavorites()
    .filter((favorite) => favorite.classKey === state.classKey)
    .map((favorite) => ({ ...favorite, isPicked: isBuildDraftItem(state.classKey, favorite.itemId, draft) }));
}

async function restoreSharedFavorites(payload) {
  const parsedGroups = parseFavoriteSharePayload(payload);
  state.overlay = 'shared';
  state.isSharedFavoriteLoading = true;
  state.sharedFavoriteError = '';
  state.sharedFavoriteList = [];
  state.sharedFavoriteGroups = [];
  render();
  if (!parsedGroups.length) {
    state.isSharedFavoriteLoading = false;
    state.sharedFavoriteError = t('sharedInvalid');
    render();
    return;
  }
  try {
    let remaining = MAX_SHARED_FAVORITES;
    const results = await Promise.all(parsedGroups.map(async (group) => {
      if (remaining <= 0) return [];
      const itemIds = group.itemIds.slice(0, remaining);
      remaining -= itemIds.length;
      const cache = await loadFavoriteClassItems(group.classKey);
      return itemIds.map((itemId) => cache.itemMap[itemId]).filter(Boolean).map((item) => buildFavoriteSnapshot(cache.classKey, cache.className, item));
    }));
    state.sharedFavoriteList = results.flat();
    state.sharedFavoriteGroups = buildFavoriteGroups(state.sharedFavoriteList);
    if (!state.sharedFavoriteList.length) state.sharedFavoriteError = t('sharedExpired');
  } catch (err) {
    console.error('restore shared failed', err);
    state.sharedFavoriteError = t('sharedExpired');
  } finally {
    state.isSharedFavoriteLoading = false;
    render();
  }
}

function importSharedFavorites() {
  const current = getFavorites();
  const existing = {};
  current.forEach((favorite) => { existing[favorite.key] = true; });
  const now = Date.now();
  const additions = [];
  state.sharedFavoriteList.forEach((favorite) => {
    if (existing[favorite.key]) return;
    existing[favorite.key] = true;
    additions.push({ ...favorite, addedAt: now - additions.length });
  });
  saveFavorites([...additions, ...current]);
  showToast(additions.length ? t('imported', { count: additions.length }) : t('alreadyExists'));
  refreshItemFlags();
}

async function copyTextToClipboard(text) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {}
  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    textarea.style.top = '0';
    document.body.appendChild(textarea);
    textarea.select();
    const copied = document.execCommand('copy');
    document.body.removeChild(textarea);
    return copied;
  } catch {
    return false;
  }
}

function shouldUseNativeShare() {
  if (!navigator.share) return false;
  return window.matchMedia('(pointer: coarse)').matches || /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

async function shareUrl(url) {
  const shareData = { title: t('appName'), url };
  try {
    if (shouldUseNativeShare() && (!navigator.canShare || navigator.canShare(shareData))) {
      await navigator.share(shareData);
      showToast(t('shareLinkCopied'));
      return;
    }
  } catch (err) {
    if (err?.name === 'AbortError') return;
  }

  if (await copyTextToClipboard(url)) {
    showToast(t('shareLinkCopied'));
    return;
  }

  state.manualShareUrl = url;
  state.overlay = 'manualShare';
  render();
  showToast(t('shareUnavailable'));
}

function absoluteUrlWithShare(payload) {
  const url = new URL(location.href);
  const remote = url.searchParams.get('remote');
  url.search = '';
  if (remote) url.searchParams.set('remote', remote);
  url.searchParams.set('shareFav', payload);
  url.hash = '';
  return url.toString();
}

function absoluteBuildRequestUrl() {
  const url = new URL(location.href);
  const remote = url.searchParams.get('remote');
  url.search = '';
  if (remote) url.searchParams.set('remote', remote);
  url.searchParams.set('classKey', state.classKey);
  url.searchParams.set('requestBuild', '1');
  url.hash = `class=${state.classKey}&requestBuild=1`;
  return url.toString();
}

function handleClick(event) {
  const stopNode = event.target.closest('[data-stop]');
  if (stopNode && !event.target.closest('button, [data-action], input, select')) return;
  const target = event.target.closest('[data-action]');
  if (!target) return;
  const action = target.dataset.action;
  if (target.closest('.item-card') && action !== 'favoriteItem') {
    openDetail(target.closest('.item-card').dataset.id);
    return;
  }
  event.preventDefault();
  event.stopPropagation();

  if (action === 'class') openClass(target.dataset.class);
  if (action === 'home') {
    state.classKey = '';
    state.classData = null;
    state.overlay = '';
    const url = new URL(location.href);
    const remote = url.searchParams.get('remote');
    url.search = remote ? `?remote=${remote}` : '';
    url.hash = '';
    history.replaceState(null, '', url.toString());
    render();
  }
  if (action === 'announcement') { state.overlay = 'announcement'; render(); }
  if (action === 'favorites') { state.overlay = 'favorites'; render(); }
  if (action === 'closeOverlay') { state.overlay = ''; state.selectedItem = null; state.manualShareUrl = ''; render(); }
  if (action === 'item') openDetail(target.dataset.id);
  if (action === 'favoriteItem' || action === 'detailFavorite') toggleCurrentFavorite(target.dataset.id);
  if (action === 'spec') { state.filters.selectedSpec = state.filters.selectedSpec === Number(target.dataset.id) ? null : Number(target.dataset.id); render(); }
  if (action === 'slot') {
    const slot = target.dataset.id;
    state.filters.selectedSlots = state.filters.selectedSlots.includes(slot) ? state.filters.selectedSlots.filter((item) => item !== slot) : [...state.filters.selectedSlots, slot];
    render();
  }
  if (action === 'stat') {
    const type = target.dataset.id;
    const includeCount = state.filters.stats.filter((item) => item.state === 'include').length;
    state.filters.stats = state.filters.stats.map((item) => {
      if (item.type !== type) return item;
      if (item.state === 'none') return includeCount >= 2 ? item : { ...item, state: 'include' };
      if (item.state === 'include') return { ...item, state: 'exclude' };
      return { ...item, state: 'none' };
    });
    if (state.filters.stats.filter((item) => item.state === 'include').length >= 2) {
      state.filters.stats = state.filters.stats.map((item) => item.state === 'exclude' ? { ...item, state: 'none' } : item);
    }
    render();
  }
  if (action === 'sourceType') {
    const type = target.dataset.id;
    if (type === 'all') state.filters.selectedSourceTypes = [];
    else {
      const current = state.filters.selectedSourceTypes;
      state.filters.selectedSourceTypes = current.includes(type) ? current.filter((item) => item !== type) : [...current, type];
      if (state.filters.selectedSourceTypes.length >= 3) state.filters.selectedSourceTypes = [];
    }
    const currentInstance = visibleInstanceOptions().find((item) => String(item.id) === String(state.filters.selectedInstanceId));
    if (!currentInstance) state.filters.selectedInstanceId = null;
    render();
  }
  if (action === 'instance') { state.filters.selectedInstanceId = String(state.filters.selectedInstanceId) === String(target.dataset.id) ? null : target.dataset.id; render(); }
  if (action === 'viewMode') { state.filters.selectedViewMode = target.dataset.id; render(); }
  if (action === 'reset') { resetFilters(); render(); }
  if (action === 'toggleFavoriteSort') { state.favoriteSortMode = state.favoriteSortMode === 'slot' ? 'time' : 'slot'; render(); }
  if (action === 'clearFavorites') { saveFavorites([]); refreshItemFlags(); render(); }
  if (action === 'removeFavorite') { saveFavorites(getFavorites().filter((item) => item.key !== target.dataset.key)); refreshItemFlags(); render(); }
  if (action === 'favoriteTap') openFavoriteDetail(target.dataset.class, target.dataset.itemId);
  if (action === 'shareFavorites') {
    const payload = buildFavoriteSharePayload(getFavorites());
    if (payload) shareUrl(absoluteUrlWithShare(payload));
    else showToast(t('nothingToShare'));
  }
  if (action === 'importShared') importSharedFavorites();
  if (action === 'shareRequest') {
    shareUrl(absoluteBuildRequestUrl());
  }
  if (action === 'shareBuild') {
    const payload = buildFavoriteSharePayload(getBuildDraft().items);
    if (payload) shareUrl(absoluteUrlWithShare(payload));
    else showToast(t('buildShareEmpty'));
  }
  if (action === 'copyManualShare') copyTextToClipboard(state.manualShareUrl).then((copied) => showToast(copied ? t('shareLinkCopied') : t('shareUnavailable')));
  if (action === 'dismissBuildIntro') { state.showBuildRequestIntro = false; render(); }
  if (action === 'newBuild') { startBuildDraft(state.classKey, state.classData?.class?.name || '', false); state.showBuildRequestIntro = false; refreshItemFlags(); render(); }
  if (action === 'buildDraft') { state.overlay = 'buildDraft'; render(); }
  if (action === 'favoritePicker') { state.favoritePickerList = buildFavoritePickerList(); state.overlay = 'favoritePicker'; render(); }
  if (action === 'clearBuildDraft') { saveBuildDraft({ classKey: state.classKey, className: state.classData?.class?.name || '', items: [] }); refreshItemFlags(); render(); }
  if (action === 'removeBuildItem') { removeBuildDraftItem(target.dataset.key); refreshItemFlags(); render(); }
  if (action === 'addFavoritePicker') {
    const favorite = state.favoritePickerList.find((item) => item.key === target.dataset.key);
    if (favorite) addBuildDraftItems(state.classKey, state.classData?.class?.name || '', [favorite]);
    state.favoritePickerList = buildFavoritePickerList();
    refreshItemFlags();
    render();
  }
  if (action === 'addAllFavoritePicker') {
    const count = addBuildDraftItems(state.classKey, state.classData?.class?.name || '', state.favoritePickerList);
    showToast(t('allFavoritesAdded', { count }));
    state.favoritePickerList = buildFavoritePickerList();
    refreshItemFlags();
    render();
  }
}

function handleInput(event) {
  const action = event.target.dataset.action;
  if (action === 'keyword') {
    state.filters.keyword = event.target.value || '';
    render();
  }
}

async function applyLocale(locale) {
  state.locale = resolveLocale(locale);
  localStorage.setItem(STORAGE_KEYS.locale, state.locale);
  i18n = createI18n(state.locale);
  if (state.classData) {
    state.classLocale = await loadClassLocale(state.classKey);
    refreshItemFlags();
    if (state.selectedItem?.id && state.itemMap[state.selectedItem.id]) {
      state.selectedItem = buildItemDetail(state.itemMap[state.selectedItem.id], state.filters.selectedSpec, state.classData?.specs || []);
    }
  }
  render();
}

function handleChange(event) {
  const action = event.target.dataset.action;
  if (action === 'locale') {
    applyLocale(event.target.value);
  }
}

async function boot() {
  app.addEventListener('click', handleClick);
  app.addEventListener('input', handleInput);
  app.addEventListener('change', handleChange);
  const route = parseRoute();
  loadOverview();
  if (route.classKey) await openClass(route.classKey, { requestBuild: route.requestBuild });
  else render();
  if (route.shareFav) restoreSharedFavorites(route.shareFav);
}

boot();
