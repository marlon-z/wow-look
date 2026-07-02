import { ASSET_BASE, DATA_BASE, DATA_DIR_NAME, GAME_VERSION, LOCALE_DATA_BASE, REMOTE_COS_BASE, STORAGE_KEYS } from './config.js?v=20260701-gamever';
import { SUPPORTED_LOCALES, createI18n, getLocaleName, resolveLocale } from './i18n.js?v=20260701-p2b';

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

const DEFAULT_BUILD_SPEC_IDS = {
  warrior: 71,
  paladin: 65,
  hunter: 253,
  rogue: 259,
  priest: 256,
  deathknight: 250,
  shaman: 262,
  mage: 62,
  warlock: 265,
  monk: 268,
  druid: 102,
  demonhunter: 577,
  evoker: 1467,
};

const SLOT_ORDER = ['head', 'neck', 'shoulder', 'cloak', 'chest', 'wrist', 'hand', 'waist', 'legs', 'feet', 'finger', 'trinket', 'weapon'];
const SLOT_OPTIONS = SLOT_ORDER.map((type) => ({ type }));
const STAT_OPTIONS = ['crit', 'haste', 'mastery', 'versatility'];
const SOURCE_OPTIONS = ['all', 'dungeon', 'raid', 'tier'];
const VIEW_MODES = ['slot', 'source'];
const FAVORITE_SLOT_ORDER = ['头', '项', '肩', '披', '胸', '腕', '手', '腰', '腿', '脚', '戒指', '饰品', '武器'];
const MAX_SHARED_FAVORITES = 20;
const BUILD_SLOT_KEYS = ['head', 'neck', 'shoulder', 'cloak', 'chest', 'wrist', 'hand', 'waist', 'legs', 'feet', 'finger1', 'finger2', 'trinket1', 'trinket2', 'weapon', 'weapon2'];
const BUILD_SLOT_META = [
  { key: 'head', slot: 'head', label: '头' },
  { key: 'neck', slot: 'neck', label: '项链' },
  { key: 'shoulder', slot: 'shoulder', label: '肩' },
  { key: 'cloak', slot: 'cloak', label: '披风' },
  { key: 'chest', slot: 'chest', label: '胸' },
  { key: 'shirt', slot: 'shirt', label: '衬衣', placeholder: true },
  { key: 'tabard', slot: 'tabard', label: '战袍', placeholder: true },
  { key: 'wrist', slot: 'wrist', label: '护腕' },
  { key: 'hand', slot: 'hand', label: '手' },
  { key: 'waist', slot: 'waist', label: '腰' },
  { key: 'legs', slot: 'legs', label: '腿' },
  { key: 'feet', slot: 'feet', label: '脚' },
  { key: 'finger1', slot: 'finger', label: '戒指 1' },
  { key: 'finger2', slot: 'finger', label: '戒指 2' },
  { key: 'trinket1', slot: 'trinket', label: '饰品 1' },
  { key: 'trinket2', slot: 'trinket', label: '饰品 2' },
  { key: 'weapon', slot: 'weapon', label: '主手' },
  { key: 'weapon2', slot: 'weapon', label: '副手' },
];
const BUILD_SLOT_LAYOUT = [
  ['head', 'neck', 'shoulder', 'cloak', 'chest', 'shirt', 'tabard', 'wrist'],
  ['hand', 'waist', 'legs', 'feet', 'finger1', 'finger2', 'trinket1', 'trinket2'],
];
const BUILD_WEAPON_LAYOUT = ['weapon', 'weapon2'];
const STAT_PER_PERCENT = { crit: 46, critical: 46, haste: 44, mastery: 46, versatility: 54 };
const DR_BRACKETS = [
  { threshold: 0, penalty: 0 },
  { threshold: 30, penalty: 0.10 },
  { threshold: 40, penalty: 0.20 },
  { threshold: 50, penalty: 0.30 },
  { threshold: 60, penalty: 0.40 },
  { threshold: 80, penalty: 0.50 },
  { threshold: 200, penalty: 1.00 },
];
const LEVEL_90_BASE_PRIMARY = 620;
const LEVEL_90_BASE_STAMINA = 4600;
const MATCHING_ARMOR_MULTIPLIER = 1.05;
const ARMOR_SPECIALIZATION_SLOTS = ['head', 'shoulder', 'chest', 'wrist', 'hand', 'waist', 'legs', 'feet'];
const SPEC_CHARACTER_BASELINES = {
  71: ['strength', 'plate'], 72: ['strength', 'plate'], 73: ['strength', 'plate', 'stamina'],
  65: ['intellect', 'plate'], 66: ['strength', 'plate', 'stamina'], 70: ['strength', 'plate'],
  253: ['agility', 'mail'], 254: ['agility', 'mail'], 255: ['agility', 'mail'],
  259: ['agility', 'leather'], 260: ['agility', 'leather'], 261: ['agility', 'leather'],
  256: ['intellect', 'cloth'], 257: ['intellect', 'cloth'], 258: ['intellect', 'cloth'],
  250: ['strength', 'plate', 'stamina'], 251: ['strength', 'plate'], 252: ['strength', 'plate'],
  262: ['intellect', 'mail'], 263: ['agility', 'mail'], 264: ['intellect', 'mail'],
  62: ['intellect', 'cloth'], 63: ['intellect', 'cloth'], 64: ['intellect', 'cloth'],
  265: ['intellect', 'cloth'], 266: ['intellect', 'cloth'], 267: ['intellect', 'cloth'],
  268: ['agility', 'leather', 'stamina'], 269: ['agility', 'leather'], 270: ['intellect', 'leather'],
  102: ['intellect', 'leather'], 103: ['agility', 'leather'], 104: ['agility', 'leather', 'stamina'], 105: ['intellect', 'leather'],
  577: ['agility', 'leather'], 581: ['agility', 'leather', 'stamina'], 1480: ['intellect', 'leather'],
  1467: ['intellect', 'mail'], 1468: ['intellect', 'mail'], 1473: ['intellect', 'mail'],
};
const PRIMARY_STAT_NAMES = { strength: '力量', agility: '敏捷', intellect: '智力' };
const CRITICAL_STRIKES_PASSIVE_SPECS = new Set([577, 581, 103, 104, 253, 254, 255, 268, 269, 259, 260, 261, 263]);
const BASE_MASTERY_POINTS = 8;
const MASTERY_COEFFICIENTS = {
  71: [1.1, '武器伤害'], 72: [1.4, '攻击伤害'], 73: [1.5, '格挡几率'],
  65: [1.5, '治疗量'], 66: [1.0, '伤害减免/攻击强度'], 70: [1.35, '神圣伤害'],
  253: [1.9, '宠物伤害'], 254: [1.4, '远程伤害'], 255: [0.85, '伤害/治疗'],
  259: [1.7, '中毒/流血伤害'], 260: [0.131, '触发几率'], 261: [2.45, '终结技伤害'],
  256: [1.35, '救赎量'], 257: [0.908437, '额外治疗'], 258: [0.5, '暗影伤害'],
  250: [2.0, '护盾量'], 251: [2.0, '冰霜伤害'], 252: [1.8, '暗影伤害'],
  262: [1.875, '过载几率'], 263: [2.0, '元素伤害'], 264: [3.0, '近距治疗量'],
  62: [1.32, '法力上限/伤害'], 63: [0.483, '点燃伤害'], 64: [1.6, '冰霜伤害'],
  265: [2.5, 'DoT伤害'], 266: [1.45, '恶魔伤害'], 267: [2.0, '混沌伤害'],
  268: [0.924, '闪避几率'], 269: [2.32875, '非重复技能伤害'], 270: [13.86, '治疗量'],
  102: [0.75, '奥术/自然伤害'], 103: [2.0, '终结技伤害/流血'], 104: [0.7, '生命值/治疗'], 105: [1.14, '治疗量'],
  577: [2.25, '混沌伤害'], 581: [2.25, '攻击强度/减伤'], 1480: [1.2, '伤害'],
  1467: [1.5, '法术伤害'], 1468: [1.8, '治疗量'], 1473: [0.272, '赋能效果'],
};
const WEAPON_KIND = { TWO_HAND: 'two_hand', ONE_HAND: 'one_hand', MAIN_HAND: 'main_hand', OFF_HAND: 'off_hand', SHIELD: 'shield', HOLDABLE: 'holdable' };
const SPEC_WEAPON_LAYOUTS = {
  71: [['two_hand', null]], 72: [['two_hand', 'two_hand']], 73: [['one_hand', 'shield']],
  65: [['one_hand', 'shield']], 66: [['one_hand', 'shield']], 70: [['two_hand', null]],
  253: [['two_hand', null]], 254: [['two_hand', null]], 255: [['two_hand', null], ['one_hand', 'one_hand']],
  259: [['one_hand', 'one_hand']], 260: [['one_hand', 'one_hand']], 261: [['one_hand', 'one_hand']],
  256: [['two_hand', null], ['one_hand', 'holdable']], 257: [['two_hand', null], ['one_hand', 'holdable']], 258: [['two_hand', null], ['one_hand', 'holdable']],
  250: [['two_hand', null]], 251: [['two_hand', null], ['one_hand', 'one_hand']], 252: [['two_hand', null]],
  262: [['two_hand', null], ['one_hand', 'shield']], 263: [['one_hand', 'one_hand']], 264: [['two_hand', null], ['one_hand', 'shield']],
  62: [['two_hand', null], ['one_hand', 'holdable']], 63: [['two_hand', null], ['one_hand', 'holdable']], 64: [['two_hand', null], ['one_hand', 'holdable']],
  265: [['two_hand', null], ['one_hand', 'holdable']], 266: [['two_hand', null], ['one_hand', 'holdable']], 267: [['two_hand', null], ['one_hand', 'holdable']],
  268: [['two_hand', null], ['one_hand', 'one_hand']], 269: [['two_hand', null], ['one_hand', 'one_hand']], 270: [['two_hand', null], ['one_hand', 'holdable']],
  102: [['two_hand', null], ['one_hand', 'holdable']], 103: [['two_hand', null]], 104: [['two_hand', null]], 105: [['two_hand', null], ['one_hand', 'holdable']],
  577: [['one_hand', 'one_hand']], 581: [['one_hand', 'one_hand']], 1480: [['one_hand', 'one_hand']],
  1467: [['two_hand', null], ['one_hand', 'holdable']], 1468: [['two_hand', null], ['one_hand', 'holdable']], 1473: [['two_hand', null], ['one_hand', 'holdable']],
};
const DEFAULT_SITE_NAME = 'SeasonLoot';
const DEFAULT_LOCALE = 'zh-CN';
const LOCALE_ROUTES = {
  'zh-CN': '',
  'en-US': 'en-us',
  'en-GB': 'en-gb',
  'de-DE': 'de',
  'fr-FR': 'fr',
  'es-ES': 'es',
  'es-MX': 'es-mx',
  'pt-BR': 'pt-br',
  'it-IT': 'it',
  'ru-RU': 'ru',
  'ko-KR': 'ko',
  'zh-TW': 'zh-tw',
};
const ROUTE_LOCALES = {
  ...Object.fromEntries(Object.entries(LOCALE_ROUTES).map(([locale, slug]) => [slug, locale])),
  'zh-cn': 'zh-CN',
};
const SEO_ORIGIN = (() => {
  const canonicalHref = document.querySelector('link[rel="canonical"]')?.href;
  try {
    return canonicalHref ? new URL(canonicalHref).origin : window.location.origin;
  } catch {
    return window.location.origin;
  }
})();
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
  locale: resolveLocale(new URLSearchParams(window.location.search).get('lang') || document.getElementById('app')?.dataset.locale || document.documentElement.lang || localStorage.getItem(STORAGE_KEYS.locale) || navigator.language),
  view: 'home',
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
  buildPhase: 'select',
  buildClassKey: '',
  buildClassData: null,
  buildAllItems: [],
  buildItemMap: {},
  buildClassCache: {},
  buildId: '',
  buildList: [],
  buildSlotPicker: null,
  craftingPicker: null,
  wcl: {
    open: false,
    classKey: '',
    specId: null,
    index: null,
    contentType: 'mythicPlus', // mythicPlus | raid
    fileKey: '',
    file: null,
    dungeonId: 'all',
    loading: false,
    error: '',
  },
  wclNameCache: {},
  statTendency: null,
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

function stripSeoBrand(value = '') {
  return String(value).replace(/\s*\|\s*SeasonLoot\s*$/u, '').trim();
}

function buildPageHref(classKey = '', locale = state.locale, options = {}) {
  const resolvedLocale = resolveLocale(locale || DEFAULT_LOCALE);
  const localeSlug = LOCALE_ROUTES[resolvedLocale] || '';
  const segments = [];
  if (localeSlug) segments.push(localeSlug);
  if (classKey) segments.push(classKey);
  const url = new URL(`/${segments.join('/')}${segments.length ? '/' : ''}`, window.location.origin);
  const currentSearch = new URLSearchParams(window.location.search);
  const nextSearch = new URLSearchParams();

  if (options.preserveRemote !== false && currentSearch.get('remote') === '1') nextSearch.set('remote', '1');

  url.search = nextSearch.toString();
  url.hash = '';
  return `${url.pathname}${url.search ? `?${url.searchParams.toString()}` : ''}`;
}

function buildCanonicalUrl(classKey = '') {
  return `${SEO_ORIGIN}${buildPageHref(classKey, state.locale, { preserveRemote: false })}`;
}

function setMetaContent(selector, content) {
  const element = document.querySelector(selector);
  if (element && content) element.setAttribute('content', content);
}

function setLinkHref(selector, href) {
  const element = document.querySelector(selector);
  if (element && href) element.setAttribute('href', href);
}

function getSeoModel() {
  if (state.view === 'build') {
    const build = currentBuild();
    const classKey = build?.classKey || state.buildClassKey || '';
    const classMeta = getClassMeta(classKey);
    const className = classMeta ? classLabel(classKey, classMeta.name || '') : '';
    const spec = build ? { id: build.specId, name: build.specName } : null;
    const routePath = build
      ? buildSpecRouteHref(build.classKey, build.specId, state.locale)
      : (classKey ? buildClassRouteHref(classKey, state.locale) : buildRouteHref(state.locale));
    const title = state.locale === 'zh-CN'
      ? `${className ? `${className}${spec?.name ? spec.name : ''}` : '魔兽世界'}配装模拟器 — 装备槽与属性统计 | SeasonLoot`
      : `WoW Gear Planner | ${DEFAULT_SITE_NAME}`;
    const description = state.locale === 'zh-CN'
      ? `${className ? `${className}${spec?.name ? ` ${spec.name}` : ''}` : '魔兽世界'}配装模拟页面。按装备槽组装装备，查看装等、副属性百分比、主属性和耐力统计，并保存或分享方案。| SeasonLoot`
      : 'Create a WoW gear build by class and spec, fill equipment slots, review stats, save and share builds. | SeasonLoot';
    return {
      heading: stripSeoBrand(title),
      title,
      description,
      canonicalUrl: `${SEO_ORIGIN}${routePath}`,
      socialUrl: `${SEO_ORIGIN}${routePath}`,
      socialTitle: stripSeoBrand(title),
      socialDescription: stripSeoBrand(description),
    };
  }
  if (state.view === 'equipment') {
    const title = state.locale === 'zh-CN' ? '魔兽世界装备查询 — 装备掉落、属性与职业筛选 | SeasonLoot' : `WoW Gear Search | ${DEFAULT_SITE_NAME}`;
    const description = state.locale === 'zh-CN'
      ? '查询魔兽世界当前赛季装备来源、职业可用装备、装等、副属性、部位、地下城、团本和套装，并可切换到配装模拟器继续组装方案。| SeasonLoot'
      : 'Search current season WoW gear by class, slot, source and stats, then switch to the gear planner when ready. | SeasonLoot';
    return {
      heading: stripSeoBrand(title),
      title,
      description,
      canonicalUrl: `${SEO_ORIGIN}${equipmentRouteHref(state.locale)}`,
      socialUrl: `${SEO_ORIGIN}${equipmentRouteHref(state.locale)}`,
      socialTitle: stripSeoBrand(title),
      socialDescription: stripSeoBrand(description),
    };
  }
  if (state.classKey) {
    const name = classLabel(state.classKey, state.classData?.class?.name || state.classKey);
    const title = t('seoClassTitle', { className: name });
    const description = t('seoClassDesc', { className: name });
    return {
      heading: stripSeoBrand(title) || name,
      title: (title && title !== 'seoClassTitle') ? title : `${name} — ${DEFAULT_SITE_NAME}`,
      description: (description && description !== 'seoClassDesc') ? description : '',
      canonicalUrl: buildCanonicalUrl(state.classKey),
      socialUrl: buildCanonicalUrl(state.classKey),
      socialTitle: stripSeoBrand(title) || `${name} — ${DEFAULT_SITE_NAME}`,
      socialDescription: stripSeoBrand(description) || '',
    };
  }

  const pageTitle = t('seoPageTitle');
  const pageDescription = t('seoMetaDesc');
  return {
    heading: t('seoTitle') || stripSeoBrand(pageTitle) || DEFAULT_SITE_NAME,
    title: (pageTitle && pageTitle !== 'seoPageTitle') ? pageTitle : DEFAULT_SITE_NAME,
    description: (pageDescription && pageDescription !== 'seoMetaDesc') ? pageDescription : '',
    canonicalUrl: buildCanonicalUrl(),
    socialUrl: buildCanonicalUrl(),
    socialTitle: stripSeoBrand(pageTitle) || DEFAULT_SITE_NAME,
    socialDescription: stripSeoBrand(pageDescription) || '',
  };
}

function t(path, vars) {
  return i18n.t(path, vars);
}

// 配装槽位的本地化名称(主手/副手/戒指1/饰品2/衬衣/战袍 等)
function buildSlotLabel(slotKey) {
  switch (slotKey) {
    case 'weapon': return t('buildMainHand');
    case 'weapon2': return t('buildOffHand');
    case 'shirt': return t('buildShirt');
    case 'tabard': return t('buildTabard');
    case 'finger1': return `${t('buildSlotRing')} 1`;
    case 'finger2': return `${t('buildSlotRing')} 2`;
    case 'trinket1': return `${t('buildSlotTrinket')} 1`;
    case 'trinket2': return `${t('buildSlotTrinket')} 2`;
    default: {
      const slot = BUILD_SLOT_META.find((item) => item.key === slotKey)?.slot || slotKey;
      return t(`slots.${slot}`);
    }
  }
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

function instanceNameLabel(name, source = null) {
  if (!name) return '';
  if (!isChineseLocale() && source?.sourceType === 'tier') return t('sourceTypes.tier');
  if (!isChineseLocale() && source?.sourceType === 'crafted') return t('craftSource');
  const instanceId = source?.instanceId || source?.source?.instanceId || null;
  if (!isChineseLocale() && String(instanceId).startsWith('tier')) return t('sourceTypes.tier');
  const instances = [...(state.classData?.instances || []), ...(state.buildClassData?.instances || [])];
  const instance = instances.find((item) => (
    (instanceId && String(item.id) === String(instanceId)) || item.name === name
  ));
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

function emptyBuildSlots() {
  return Object.fromEntries(BUILD_SLOT_KEYS.map((key) => [key, null]));
}

function normalizeBuilds(value) {
  if (!Array.isArray(value)) return [];
  return value.filter((build) => build?.id && build.classKey).map((build) => ({
    ...build,
    slots: { ...emptyBuildSlots(), ...(build.slots || {}) },
    summary: summarizeSlots({ ...emptyBuildSlots(), ...(build.slots || {}) }, build.specId),
  }));
}

function getBuilds() {
  return normalizeBuilds(readJson(STORAGE_KEYS.builds, []));
}

function saveBuilds(builds) {
  const normalized = normalizeBuilds(builds);
  writeJson(STORAGE_KEYS.builds, normalized);
  return normalized;
}

function getBuild(buildId) {
  return getBuilds().find((build) => build.id === buildId) || null;
}

function setBuildListState() {
  state.buildList = getBuilds().filter((build) => !build.draft);
}

function createBuild(classKey, className, specId, specName, draft = true) {
  const now = Date.now();
  const sameSpecCount = getBuilds().filter((build) => build.classKey === classKey && build.specId === specId && !build.draft).length;
  const build = {
    id: `build_${now}`,
    name: `${className} · ${specName}${sameSpecCount ? ` ${sameSpecCount + 1}` : ''}`,
    classKey,
    className,
    specId,
    specName,
    slots: emptyBuildSlots(),
    summary: summarizeSlots(emptyBuildSlots(), specId),
    draft: Boolean(draft),
    createdAt: now,
    updatedAt: now,
  };
  saveBuilds([build, ...getBuilds().filter((item) => !item.draft)]);
  setBuildListState();
  return build;
}

function updateBuild(buildId, updates = {}) {
  const builds = getBuilds();
  const index = builds.findIndex((build) => build.id === buildId);
  if (index === -1) return null;
  const next = {
    ...builds[index],
    ...updates,
    updatedAt: Date.now(),
  };
  if (updates.slots || updates.specId) {
    next.slots = { ...emptyBuildSlots(), ...(next.slots || {}) };
    next.summary = summarizeSlots(next.slots, next.specId);
  }
  builds[index] = next;
  saveBuilds(builds);
  setBuildListState();
  return next;
}

function deleteBuild(buildId) {
  saveBuilds(getBuilds().filter((build) => build.id !== buildId));
  setBuildListState();
}

function buildRouteHref(locale = state.locale) {
  const resolvedLocale = resolveLocale(locale || DEFAULT_LOCALE);
  const localeSlug = LOCALE_ROUTES[resolvedLocale] || '';
  const segments = [];
  if (localeSlug) segments.push(localeSlug);
  segments.push('build');
  const url = new URL(`/${segments.join('/')}/`, window.location.origin);
  if (new URLSearchParams(window.location.search).get('remote') === '1') url.searchParams.set('remote', '1');
  return `${url.pathname}${url.search ? `?${url.searchParams.toString()}` : ''}`;
}

function buildClassRouteHref(classKey, locale = state.locale) {
  const url = new URL(buildRouteHref(locale), window.location.origin);
  if (classKey) {
    const basePath = url.pathname.replace(/\/$/, '');
    url.pathname = `${basePath}/${classKey}/`;
  }
  return `${url.pathname}${url.search ? `?${url.searchParams.toString()}` : ''}`;
}

function buildSpecRouteHref(classKey, specId, locale = state.locale) {
  const url = new URL(buildClassRouteHref(classKey, locale), window.location.origin);
  if (classKey && specId) {
    const basePath = url.pathname.replace(/\/$/, '');
    url.pathname = `${basePath}/${specId}/`;
  }
  return `${url.pathname}${url.search ? `?${url.searchParams.toString()}` : ''}`;
}

function defaultBuildSpecIdForClass(classKey, classData = null) {
  return Number(classData?.specs?.[0]?.id || DEFAULT_BUILD_SPEC_IDS[classKey] || 0) || null;
}

function buildDefaultSpecRouteHref(classKey, locale = state.locale, classData = null) {
  const specId = defaultBuildSpecIdForClass(classKey, classData);
  return specId ? buildSpecRouteHref(classKey, specId, locale) : buildClassRouteHref(classKey, locale);
}

function equipmentRouteHref(locale = state.locale) {
  const resolvedLocale = resolveLocale(locale || DEFAULT_LOCALE);
  const localeSlug = LOCALE_ROUTES[resolvedLocale] || '';
  const segments = [];
  if (localeSlug) segments.push(localeSlug);
  segments.push('equipment');
  const url = new URL(`/${segments.join('/')}/`, window.location.origin);
  if (new URLSearchParams(window.location.search).get('remote') === '1') url.searchParams.set('remote', '1');
  return `${url.pathname}${url.search ? `?${url.searchParams.toString()}` : ''}`;
}

function slotKeyForItem(item) {
  if (!item?.slot) return null;
  if (item.slot === 'finger') return 'finger1';
  if (item.slot === 'trinket') return 'trinket1';
  if (item.slot === 'back') return 'cloak';
  return BUILD_SLOT_KEYS.includes(item.slot) ? item.slot : null;
}

function getAvailableSlotKey(build, item) {
  const baseSlot = slotKeyForItem(item);
  if (!baseSlot) return null;
  if (baseSlot === 'finger1') return !build.slots.finger1 ? 'finger1' : (!build.slots.finger2 ? 'finger2' : 'finger1');
  if (baseSlot === 'trinket1') return !build.slots.trinket1 ? 'trinket1' : (!build.slots.trinket2 ? 'trinket2' : 'trinket1');
  return baseSlot;
}

function buildItemSnapshot(item) {
  if (!item) return null;
  return {
    itemId: item.id || item.itemId,
    id: item.id || item.itemId,
    name: item.name,
    ilvl: item.ilvl || 0,
    slot: item.slot,
    slotName: item.slotName || '',
    slotBadgeName: item.slotBadgeName || item.slotName || '',
    armorType: item.armorType || '',
    armorTypeName: item.armorTypeName || '',
    itemSubType: item.itemSubType || '',
    equipLoc: item.equipLoc || item.maxVersion?.equipLoc || item.dropVersion?.equipLoc || '',
    iconAsset: item.iconAsset || '',
    iconText: item.iconText || iconTextLabel(item),
    statLine: item.statLine || buildStatLine(item),
    specs: item.specs || [],
    tooltipFlags: item.tooltipFlags || null,
    stats: item.stats ? JSON.parse(JSON.stringify(item.stats)) : null,
    source: item.source || null,
    sourceType: item.sourceType || item.instanceType || '',
    instanceName: item.instanceName || '',
    encounterName: item.encounterName || '',
    crafting: item.crafting || null,
    selectedCraftingStats: item.selectedCraftingStats || null,
  };
}

function normalizeArmorTypeForBuild(item) {
  const aliases = { cloth: 'cloth', leather: 'leather', mail: 'mail', plate: 'plate', '布甲': 'cloth', '皮甲': 'leather', '锁甲': 'mail', '鎖甲': 'mail', '板甲': 'plate' };
  return aliases[String(item?.armorType || '').toLowerCase()] || aliases[item?.armorType] || aliases[item?.itemSubType] || aliases[item?.armorTypeName] || '';
}

function getSpecBaseline(specId) {
  const tuple = SPEC_CHARACTER_BASELINES[Number(specId)];
  if (!tuple) return null;
  return {
    primaryType: tuple[0],
    primaryName: PRIMARY_STAT_NAMES[tuple[0]],
    armorType: tuple[1],
    armorBonusTarget: tuple[2] || 'primary',
  };
}

function calcStatPercent(rating, statType) {
  const perPercent = STAT_PER_PERCENT[statType];
  if (!perPercent || !rating) return 0;
  let remaining = rating / perPercent;
  let effectivePercent = 0;
  for (let i = 0; i < DR_BRACKETS.length - 1; i += 1) {
    if (remaining <= 0) break;
    const used = Math.min(remaining, DR_BRACKETS[i + 1].threshold - DR_BRACKETS[i].threshold);
    effectivePercent += used * (1 - DR_BRACKETS[i].penalty);
    remaining -= used;
  }
  return Math.round(effectivePercent * 100) / 100;
}

function formatPercent(value) {
  return (Math.round((Number(value) || 0) * 100) / 100).toFixed(2);
}

function getBaseCritPercent(specId) {
  return 5 + (CRITICAL_STRIKES_PASSIVE_SPECS.has(Number(specId)) ? 5 : 0);
}

function calcMasteryPercent(masteryRating, specId) {
  const config = MASTERY_COEFFICIENTS[Number(specId)];
  if (!config) return { percent: 0, percentText: '0.00', label: '' };
  const gearPoints = calcStatPercent(masteryRating, 'mastery');
  const percent = Math.round((BASE_MASTERY_POINTS + gearPoints) * config[0] * 100) / 100;
  return { percent, percentText: formatPercent(percent), label: `${percent.toFixed(1)}% ${config[1]}`, effect: config[1] };
}

function getWeaponKind(item) {
  const equipLoc = item?.equipLoc || item?.maxVersion?.equipLoc || item?.dropVersion?.equipLoc || '';
  if (equipLoc === 'INVTYPE_2HWEAPON' || equipLoc === 'INVTYPE_RANGED' || equipLoc === 'INVTYPE_RANGEDRIGHT') return WEAPON_KIND.TWO_HAND;
  if (equipLoc === 'INVTYPE_SHIELD') return WEAPON_KIND.SHIELD;
  if (equipLoc === 'INVTYPE_HOLDABLE') return WEAPON_KIND.HOLDABLE;
  if (equipLoc === 'INVTYPE_WEAPONMAINHAND') return WEAPON_KIND.MAIN_HAND;
  if (equipLoc === 'INVTYPE_WEAPONOFFHAND') return WEAPON_KIND.OFF_HAND;
  if (equipLoc === 'INVTYPE_WEAPON') return WEAPON_KIND.ONE_HAND;
  const subtype = item?.itemSubType || '';
  if (/双手|法杖|长柄武器|弓|弩|枪械/.test(subtype)) return WEAPON_KIND.TWO_HAND;
  if (subtype === '盾牌') return WEAPON_KIND.SHIELD;
  if (subtype === '其它') return WEAPON_KIND.HOLDABLE;
  return WEAPON_KIND.ONE_HAND;
}

function weaponKindMatches(actual, expected, slotIndex) {
  if (actual === WEAPON_KIND.MAIN_HAND) return slotIndex === 0 && expected === WEAPON_KIND.ONE_HAND;
  if (actual === WEAPON_KIND.OFF_HAND) return slotIndex === 1 && expected === WEAPON_KIND.ONE_HAND;
  return actual === expected;
}

function canItemUseWeaponSlot(specId, slotKey, item) {
  const layouts = SPEC_WEAPON_LAYOUTS[Number(specId)] || [];
  const index = slotKey === 'weapon2' ? 1 : 0;
  const kind = getWeaponKind(item);
  return layouts.some((layout) => layout[index] !== null && weaponKindMatches(kind, layout[index], index));
}

function isCompleteWeaponLayoutValid(specId, mainHand, offHand) {
  if (!mainHand && !offHand) return true;
  const layouts = SPEC_WEAPON_LAYOUTS[Number(specId)] || [];
  const mainKind = mainHand ? getWeaponKind(mainHand) : null;
  const offKind = offHand ? getWeaponKind(offHand) : null;
  return layouts.some((layout) => {
    if (mainKind && !weaponKindMatches(mainKind, layout[0], 0)) return false;
    if (offKind && (layout[1] === null || !weaponKindMatches(offKind, layout[1], 1))) return false;
    return true;
  });
}

function mainHandOccupiesBoth(specId, item) {
  if (!item || getWeaponKind(item) !== WEAPON_KIND.TWO_HAND) return false;
  const layouts = SPEC_WEAPON_LAYOUTS[Number(specId)] || [];
  return layouts.some((layout) => layout[0] === WEAPON_KIND.TWO_HAND && layout[1] === null)
    && !layouts.some((layout) => layout[0] === WEAPON_KIND.TWO_HAND && layout[1] === WEAPON_KIND.TWO_HAND);
}

function itemSupportsSpec(item, specId) {
  return !item || !Array.isArray(item.specs) || !item.specs.length || item.specs.includes(Number(specId));
}

function applyWeaponSelection(slots, specId, slotKey, item) {
  if (!canItemUseWeaponSlot(specId, slotKey, item) || !itemSupportsSpec(item, specId)) {
    return { ok: false, message: slotKey === 'weapon2' ? '该装备不能放入副手' : '该装备不能放入主手' };
  }
  const next = { ...slots, [slotKey]: item };
  let clearedOffHand = false;
  if (slotKey === 'weapon' && !isCompleteWeaponLayoutValid(specId, next.weapon, next.weapon2)) {
    next.weapon2 = null;
    clearedOffHand = true;
  }
  if (!isCompleteWeaponLayoutValid(specId, next.weapon, next.weapon2)) return { ok: false, message: '这件装备与当前主手组合不兼容' };
  return { ok: true, slots: next, clearedOffHand };
}

function getRandomAttributeSlots(item) {
  return (item?.crafting?.randomAttributeSlots || [])
    .filter((slot) => slot && Number(slot.value) > 0)
    .sort((a, b) => (Number(a.index) || 0) - (Number(b.index) || 0));
}

function getRandomAttributeCount(item) {
  return Math.max(Number(item?.crafting?.randomAttributeCount) || 0, getRandomAttributeSlots(item).length);
}

function requiresCraftingStatSelection(item) {
  return item && item.sourceType === 'crafted' && getRandomAttributeCount(item) > 0 && !(item.selectedCraftingStats?.length);
}

function buildCraftedItemWithSelectedStats(item, selectedTypes) {
  const slots = getRandomAttributeSlots(item);
  const uniqueTypes = [...new Set(selectedTypes || [])];
  if (!item || !slots.length || uniqueTypes.length !== slots.length) return null;
  const stats = item.stats ? JSON.parse(JSON.stringify(item.stats)) : { primaryStats: [], stamina: null, secondary: [] };
  const selectedSecondary = slots.map((slot, index) => ({
    type: uniqueTypes[index],
    name: t(`stats.${uniqueTypes[index]}`),
    value: Number(slot.value) || 0,
    craftedRandom: true,
    randomAttributeIndex: Number(slot.index) || index + 1,
  }));
  const secondary = [...(stats.secondary || []), ...selectedSecondary];
  return {
    ...item,
    stats: { ...stats, secondary },
    selectedCraftingStats: selectedSecondary,
    statLine: secondary.map((stat) => `${statNameLabel(stat)}${stat.value}`).join(' / '),
  };
}

function summarizeSlots(slots, specId) {
  const baseline = getSpecBaseline(specId);
  const primary = {};
  let stamina = baseline ? LEVEL_90_BASE_STAMINA : 0;
  const secondary = { crit: 0, haste: 0, mastery: 0, versatility: 0 };
  let totalIlvl = 0;
  let filledSlots = 0;

  if (baseline) primary[baseline.primaryType] = { type: baseline.primaryType, name: baseline.primaryName, value: LEVEL_90_BASE_PRIMARY };
  BUILD_SLOT_KEYS.forEach((key) => {
    const item = slots[key];
    if (!item) return;
    filledSlots += 1;
    totalIlvl += item.ilvl || 0;
    const stats = item.stats;
    if (!stats) return;
    const staminaVal = typeof stats.stamina === 'object' ? stats.stamina?.value : stats.stamina;
    stamina += staminaVal || 0;
    (stats.primaryStats || []).forEach((stat) => {
      if (baseline && stat.type !== baseline.primaryType) return;
      if (!primary[stat.type]) primary[stat.type] = { type: stat.type, name: statNameLabel(stat), value: 0 };
      primary[stat.type].value += stat.value || 0;
    });
    (stats.secondary || []).forEach((stat) => {
      const type = stat.type === 'critical' ? 'crit' : stat.type;
      if (secondary[type] !== undefined) secondary[type] += stat.value || 0;
    });
  });

  const armorSpecializationActive = Boolean(baseline) && ARMOR_SPECIALIZATION_SLOTS.every((slotKey) => {
    const item = slots[slotKey];
    return item && normalizeArmorTypeForBuild(item) === baseline.armorType;
  });
  if (armorSpecializationActive && baseline) {
    if (baseline.armorBonusTarget === 'stamina') stamina = Math.floor(stamina * MATCHING_ARMOR_MULTIPLIER);
    else primary[baseline.primaryType].value = Math.floor(primary[baseline.primaryType].value * MATCHING_ARMOR_MULTIPLIER);
  }

  const twoHandOccupiesBoth = slots.weapon && mainHandOccupiesBoth(specId, slots.weapon);
  if (twoHandOccupiesBoth) totalIlvl += slots.weapon.ilvl || 0;
  const occupiedSlots = filledSlots + (twoHandOccupiesBoth ? 1 : 0);
  const mastery = calcMasteryPercent(secondary.mastery, specId);
  return {
    avgIlvl: filledSlots ? Math.round(totalIlvl / 16) : 0,
    filledSlots,
    occupiedSlots,
    totalSlots: BUILD_SLOT_KEYS.length,
    primaryStats: Object.values(primary),
    stamina,
    armorSpecializationActive,
    secondaryTotal: secondary.crit + secondary.haste + secondary.mastery + secondary.versatility,
    secondary: {
      crit: { rating: secondary.crit, percent: calcStatPercent(secondary.crit, 'crit') + getBaseCritPercent(specId), percentText: formatPercent(calcStatPercent(secondary.crit, 'crit') + getBaseCritPercent(specId)) },
      haste: { rating: secondary.haste, percent: calcStatPercent(secondary.haste, 'haste'), percentText: formatPercent(calcStatPercent(secondary.haste, 'haste')) },
      mastery: { rating: secondary.mastery, ...mastery },
      versatility: { rating: secondary.versatility, percent: calcStatPercent(secondary.versatility, 'versatility'), percentText: formatPercent(calcStatPercent(secondary.versatility, 'versatility')) },
    },
  };
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
  const appEl = document.getElementById('app');
  const pathSegments = window.location.pathname.split('/').filter(Boolean);
  const firstSegment = pathSegments[0]?.toLowerCase() || '';
  const localized = Boolean(ROUTE_LOCALES[firstSegment]);
  const contentSegment = localized ? pathSegments[1] : pathSegments[0];
  const buildClassSegment = contentSegment === 'build' ? (localized ? pathSegments[2] : pathSegments[1]) : '';
  const buildSpecSegment = contentSegment === 'build' ? (localized ? pathSegments[3] : pathSegments[2]) : '';
  const isToolLanding = contentSegment === 'build' || contentSegment === 'equipment';
  const pathClass = isToolLanding ? '' : contentSegment;
  return {
    view: contentSegment === 'build' ? 'build' : (contentSegment === 'equipment' ? 'equipment' : 'class'),
    classKey: hash.get('class') || query.get('classKey') || buildClassSegment || (appEl && appEl.dataset.class) || pathClass || '',
    buildSpecId: Number(query.get('specId') || hash.get('specId') || buildSpecSegment || 0) || null,
    buildId: query.get('buildId') || hash.get('buildId') || '',
    buildShare: query.get('buildShare') || hash.get('buildShare') || '',
    shareFav: query.get('shareFav') || hash.get('shareFav') || '',
    requestBuild: query.get('requestBuild') === '1' || hash.get('requestBuild') === '1',
    wclAuto: query.get('wcl') === '1' || hash.get('wcl') === '1',
  };
}

function encodeBuildShare(build) {
  if (!build) return '';
  const slots = BUILD_SLOT_KEYS.map((slotKey) => {
    const item = build.slots?.[slotKey];
    if (!item?.itemId) return '';
    const crafted = (item.selectedCraftingStats || []).map((stat) => stat.type).join('-');
    return `${slotKey}.${item.itemId}${crafted ? `~${crafted}` : ''}`;
  }).filter(Boolean).join(',');
  return `${build.classKey}:${build.specId}:${encodeURIComponent(build.name)}:${slots}`;
}

function decodeBuildShare(payload) {
  if (!payload) return null;
  let decoded = payload;
  try { decoded = decodeURIComponent(payload); } catch {}
  const [classKey, specIdText, nameText, slotsText = ''] = decoded.split(':');
  const specId = Number(specIdText);
  if (!classKey || !specId) return null;
  const slots = {};
  slotsText.split(',').forEach((entry) => {
    const [slotKey, itemPart] = entry.split('.');
    if (!slotKey || !itemPart) return;
    const [itemId, craftedText = ''] = itemPart.split('~');
    slots[slotKey] = { itemId, craftedTypes: craftedText ? craftedText.split('-').filter(Boolean) : [] };
  });
  return { classKey, specId, name: nameText ? decodeURIComponent(nameText) : '', slots };
}

async function restoreSharedBuild(payload) {
  const data = decodeBuildShare(payload);
  if (!data) return false;
  const classData = await loadBuildClass(data.classKey);
  const classMeta = getClassMeta(data.classKey);
  const spec = (classData?.specs || []).find((item) => item.id === data.specId);
  const build = createBuild(data.classKey, classLabel(data.classKey, classMeta?.name || ''), data.specId, spec ? specLabel(spec) : String(data.specId), true);
  const slots = emptyBuildSlots();
  Object.entries(data.slots).forEach(([slotKey, slot]) => {
    const sourceItem = state.buildItemMap[slot.itemId];
    if (!sourceItem) return;
    const item = slot.craftedTypes.length ? buildCraftedItemWithSelectedStats(sourceItem, slot.craftedTypes) || sourceItem : sourceItem;
    slots[slotKey] = buildItemSnapshot(item);
  });
  const updated = updateBuild(build.id, { name: data.name || build.name, slots, draft: true });
  state.buildId = updated?.id || build.id;
  state.buildClassKey = data.classKey;
  state.buildPhase = 'build';
  return true;
}

async function openBuildPage(buildId = '', buildShare = '', initialClassKey = '', initialSpecId = null) {
  state.view = 'build';
  state.classKey = '';
  state.classData = null;
  state.allItems = [];
  state.itemMap = {};
  state.overlay = '';
  state.selectedItem = null;
  setBuildListState();
  if (buildShare) {
    const restored = await restoreSharedBuild(buildShare);
    if (restored) {
      render();
      return;
    }
  }
  if (buildId) {
    const build = getBuild(buildId);
    if (build) {
      state.buildId = build.id;
      state.buildClassKey = build.classKey;
      state.buildPhase = 'build';
      await loadBuildClass(build.classKey);
    }
  } else if (initialClassKey && initialSpecId) {
    const classMeta = getClassMeta(initialClassKey);
    const classData = classMeta ? await loadBuildClass(initialClassKey) : null;
    const spec = (classData?.specs || []).find((item) => item.id === Number(initialSpecId));
    if (classMeta && spec) {
      const build = createBuild(initialClassKey, classLabel(initialClassKey, classMeta.name || ''), spec.id, specLabel(spec), true);
      state.buildId = build.id;
      state.buildClassKey = initialClassKey;
      state.buildPhase = 'build';
    } else {
      state.buildPhase = 'select';
      state.buildId = '';
      state.buildClassKey = '';
    }
  } else if (!state.buildId || !getBuild(state.buildId)) {
    state.buildPhase = 'select';
    state.buildId = '';
    const presetClassKey = getClassMeta(initialClassKey) ? initialClassKey : '';
    state.buildClassKey = presetClassKey;
    if (presetClassKey) {
      const classData = await loadBuildClass(presetClassKey);
      const defaultSpecId = defaultBuildSpecIdForClass(presetClassKey, classData);
      if (defaultSpecId) {
        window.location.replace(buildSpecRouteHref(presetClassKey, defaultSpecId));
        return;
      }
    } else {
      state.buildClassData = null;
      state.buildAllItems = [];
      state.buildItemMap = {};
    }
  }
  // 载入的方案已套用排行榜时, 先备好附魔/宝石字典再渲染
  if (currentBuild()?.wclPreset) await ensureWclNamesLoaded();
  await loadStatTendency();
  render();
}

// 副属性倾向数据(本地小文件, 同源 0 COS), 供可见 SEO 板块使用
async function loadStatTendency() {
  if (state.statTendency !== null) return state.statTendency;
  try {
    state.statTendency = await fetchJson(`${DATA_BASE}/wcl-stat-tendency.json?v=${WCL_NAMES_VERSION}`);
  } catch {
    state.statTendency = { specs: {} };
  }
  return state.statTendency;
}

async function loadBuildClass(classKey) {
  const classMeta = getClassMeta(classKey);
  if (!classMeta) return null;
  if (state.buildClassCache[classKey]) {
    state.buildClassData = state.buildClassCache[classKey];
  } else {
    state.buildClassData = await loadClassData(classKey);
    state.buildClassCache[classKey] = state.buildClassData;
  }
  state.buildClassKey = classKey;
  state.classLocale = await loadClassLocale(classKey);
  state.buildAllItems = enrichItems(flattenItems(state.buildClassData.instances || []), classKey, state.buildClassData.specs || []);
  state.buildItemMap = {};
  state.buildAllItems.forEach((item) => { state.buildItemMap[item.id] = item; });
  return state.buildClassData;
}

async function openClass(classKey, options = {}) {
  const classMeta = getClassMeta(classKey) || getClassMeta('monk');
  state.view = 'class';
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
  if (document.getElementById('app')?.dataset.class) {
    history.replaceState(null, '', `${location.pathname}${location.search}`);
    if (rerender) render();
    return;
  }
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
  updateSeoMeta();
  const routeClass = state.classKey;
  app.innerHTML = `
    <img class="global-site-bg" src="${assetUrl('/assets/public/bg.jpg')}" alt="">
    ${state.view === 'build' ? renderBuildView() : (routeClass ? renderEquipmentView() : renderHomeView())}
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

function renderModeSwitch(activeMode = 'equipment', className = '', equipmentClassKey = state.classKey) {
  const activeBuild = activeMode === 'build' ? currentBuild() : null;
  const buildHref = activeBuild
    ? buildSpecRouteHref(activeBuild.classKey, activeBuild.specId)
    : (equipmentClassKey ? buildDefaultSpecRouteHref(equipmentClassKey) : buildRouteHref());
  const equipmentHref = equipmentClassKey ? buildPageHref(equipmentClassKey) : equipmentRouteHref();
  const context = className ? `${className}工具切换` : '魔兽世界工具切换';
  return `
    <nav class="mode-switch" aria-label="${escapeHtml(context)}">
      <a class="${activeMode === 'equipment' ? 'active' : ''}" href="${equipmentHref}" ${activeMode === 'equipment' ? 'aria-current="page"' : ''}>
        <span>${escapeHtml(t('modeEquip'))}</span>
        <small>${escapeHtml(t('modeEquipSub'))}</small>
      </a>
      <a class="${activeMode === 'build' ? 'active' : ''}" href="${buildHref}" ${activeMode === 'build' ? 'aria-current="page"' : ''}>
        <span>${escapeHtml(t('modeBuild'))}</span>
        <small>${escapeHtml(t('modeBuildSub'))}</small>
      </a>
    </nav>
  `;
}

function renderHomeView() {
  const countMap = {};
  (state.overview?.classes || []).forEach((item) => { countMap[item.key] = item.itemCount; });
  const favorites = getFavorites();
  const isEquipmentLanding = state.view !== 'build';
  const classGridMode = 'equipment';
  return `
    <main class="page-shell index-page">
      <div class="top-corner left">
        <button class="pill-button quiet" data-action="announcement"><span class="icon notice"></span>${escapeHtml(t('announcement'))}</button>
      </div>
      <div class="top-corner right">
        ${renderLocaleSelector()}
        <button class="pill-button" data-action="favorites"><span class="icon star"></span>${escapeHtml(t('favorites'))}${favorites.length ? `<b>${favorites.length}</b>` : ''}</button>
      </div>
      ${renderHomeToolHero(favorites.length, isEquipmentLanding)}
      ${renderModeSwitch(isEquipmentLanding ? 'equipment' : 'build')}
      <div class="prompt-wrap"><span>${escapeHtml(isEquipmentLanding && state.locale === 'zh-CN' ? '选择职业查询装备' : t('chooseClass'))}</span></div>
      <section id="class-grid" class="class-grid-wrap">
        ${[CLASS_LIST.slice(0, 4), CLASS_LIST.slice(4, 9), CLASS_LIST.slice(9, 13)].map((row) => `
          <div class="class-row">
            ${row.map((item) => {
              const assets = getClassVisualAssets(item.key);
              const classHref = classGridMode === 'build' ? buildDefaultSpecRouteHref(item.key) : buildPageHref(item.key);
              const classAction = classGridMode === 'build' ? 'buildPage' : 'class';
              return `
                <a class="class-cell" href="${classHref}" data-action="${classAction}" data-class="${item.key}">
                  <img class="class-emblem" src="${assets.emblem}" alt="">
                  <span class="class-label" style="color:${item.color}">${escapeHtml(classLabel(item.key, item.shortName))}</span>
                  <small>${countMap[item.key] || 0}</small>
                </a>
              `;
            }).join('')}
          </div>
        `).join('')}
      </section>
      ${renderHomeToolPanels()}
      ${renderSeoIntro()}
      <footer class="footer-note"><i></i><span>${escapeHtml(t('dataNote'))}</span><i></i></footer>
    </main>
  `;
}

function renderHomeToolHero(favoriteCount, isEquipmentLanding = false) {
  if (state.locale !== 'zh-CN') {
    return `
      <section class="home-header">
        <h1 class="brand-logo">SeasonLoot</h1>
      </section>
    `;
  }
  const classCount = state.overview?.classes?.length || CLASS_LIST.length;
  const itemCount = (state.overview?.classes || []).reduce((sum, item) => sum + (Number(item.itemCount) || 0), 0);
  return `
    <section class="tool-hero" aria-labelledby="tool-hero-title">
      <div class="tool-hero-copy">
        <p class="tool-kicker">SeasonLoot · 中文验收版</p>
        <h1 id="tool-hero-title">${isEquipmentLanding ? '魔兽世界装备查询' : '魔兽世界配装模拟器'}</h1>
        <p class="tool-lead">${isEquipmentLanding ? '按职业、专精、部位、副属性和来源筛选当前赛季装备，找到候选装备后可切换到配装模拟继续组装。' : '先选择配装模拟或装备查询，再按职业进入对应流程；配装页支持装备槽、属性统计、保存方案和分享链接。'}</p>
        <div class="tool-hero-actions">
          ${isEquipmentLanding
            ? `<a class="tool-primary" href="#class-grid">选择职业查装备</a><a class="tool-secondary" href="${buildRouteHref()}" data-action="buildPage">开始配装模拟</a>`
            : `<a class="tool-primary" href="${buildRouteHref()}" data-action="buildPage">开始配装模拟</a><a class="tool-secondary" href="${equipmentRouteHref()}">装备查询</a>`}
          <button class="tool-secondary" data-action="favorites"><span class="icon star"></span>打开收藏夹${favoriteCount ? ` · ${favoriteCount}` : ''}</button>
        </div>
      </div>
      <div class="tool-hero-panel" aria-label="当前数据概览">
        <div>
          <strong>${escapeHtml(classCount)}</strong>
          <span>职业装备池</span>
        </div>
        <div>
          <strong>${escapeHtml(itemCount || '-')}</strong>
          <span>当前赛季装备</span>
        </div>
        <div>
          <strong>${escapeHtml(GAME_VERSION)}</strong>
          <span>对应游戏版本</span>
        </div>
      </div>
    </section>
  `;
}

function renderHomeToolPanels() {
  if (state.locale !== 'zh-CN') return '';
  const panels = [
    ['配装模拟', '从职业和专精开始，填入 16 个装备槽并查看装等、副属性百分比和主属性统计。'],
    ['装备查询', '按副属性、部位、地下城、团本和套装快速缩小装备范围。'],
    ['排行榜配装', 'WCL 预设会作为下一阶段重点迁移，承接天赋代码、附魔和宝石展示。'],
  ];
  return `
    <section class="tool-panels" aria-label="配装工具能力">
      ${panels.map(([title, body]) => `
        <article>
          <h2>${escapeHtml(title)}</h2>
          <p>${escapeHtml(body)}</p>
        </article>
      `).join('')}
    </section>
  `;
}

function renderSeoIntro() {
  const isEquipmentLanding = state.view !== 'build' && state.locale === 'zh-CN';
  const title = isEquipmentLanding ? '魔兽世界装备查询' : t('seoTitle');
  if (!title) return '';
  const desc = isEquipmentLanding
    ? '查询正式服当前赛季装备来源、职业可用装备、装等、副属性、部位、地下城、团本和套装；找到候选装备后，可以切换到配装模拟器继续组装完整方案。'
    : (t('seoDesc') || '');
  const faqTitle = isEquipmentLanding ? '' : (t('seoFaqTitle') || 'FAQ');
  const faqs = isEquipmentLanding ? [] : (i18n.raw('seoFaq') || []);
  return `
    <section class="seo-intro">
      <h2>${escapeHtml(title)}</h2>
      <p>${escapeHtml(desc)}</p>
      ${faqs.length ? `
        <details class="seo-faq">
          <summary>${escapeHtml(faqTitle)}</summary>
          <dl>
            ${faqs.map(([q, a]) => `<dt>${escapeHtml(q)}</dt><dd>${escapeHtml(a)}</dd>`).join('')}
          </dl>
        </details>
      ` : ''}
    </section>
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
  const seoModel = getSeoModel();
  return `
    <main class="page-shell equipment-page">
      <header class="top-bar">
        <a class="back-btn" href="${buildPageHref()}" data-action="home" aria-label="Back to home">‹</a>
        <div class="top-title-wrap">
          <img class="top-emblem" src="${assets.emblem}" alt="">
          <strong style="color:${classMeta.color || '#ffbb12'}">${escapeHtml(className)}</strong>
        </div>
        <div class="top-actions">
          ${renderLocaleSelector()}
          <button class="pill-button compact" data-action="favorites"><span class="icon star"></span>${escapeHtml(t('favorites'))}${favorites.length ? `<b>${favorites.length}</b>` : ''}</button>
        </div>
      </header>

      ${renderModeSwitch('equipment', className, state.classKey)}
      <section class="hero-panel">
        <img class="hero-banner" src="${assets.banner}" alt="">
        <div class="hero-shade"></div>
        <div class="hero-panel-content">
          <h1 class="hero-page-title">${escapeHtml(seoModel.heading)}</h1>
          <div class="hero-summary-row">
            <span class="hero-count">${filteredItems.length}</span>
            <span class="hero-count-unit">${escapeHtml(t('resultUnit'))}</span>
            <button class="hero-share-btn" data-action="${state.buildRequestMode && draft.items.length ? 'shareBuild' : 'shareRequest'}">${escapeHtml(state.buildRequestMode && draft.items.length ? t('buildShare') : t('buildRequest'))}</button>
          </div>
          <p>${escapeHtml(activeText)}</p>
        </div>
      </section>

      ${renderClassSeoWorkbench(className, filteredItems.length)}
      ${state.buildRequestMode ? renderBuildIntroOrStrip(draft, className) : ''}
      ${renderFilterPanel()}
      ${state.isLoading ? `<section class="empty-state">${escapeHtml(t('loading'))}</section>` : ''}
      ${state.loadError ? `<section class="empty-state">${escapeHtml(state.loadError)}</section>` : ''}
      ${!state.isLoading && !state.loadError ? renderGroups(groups) : ''}
      ${!state.isLoading && !state.loadError ? renderClassSeoSection() : ''}
      <div class="page-end-pad"></div>
    </main>
  `;
}

function renderClassSeoWorkbench(className, itemCount) {
  if (state.locale !== 'zh-CN') return '';
  const specCount = state.classData?.specs?.length || 0;
  return `
    <section class="class-workbench" aria-label="${escapeHtml(className)}配装工具入口">
      <div>
        <p class="tool-kicker">${escapeHtml(className)}配装模拟</p>
        <h2>先筛装备，再组配装</h2>
        <p>当前页面已经加载 ${escapeHtml(itemCount)} 件${escapeHtml(className)}可用装备，支持 ${escapeHtml(specCount)} 个专精筛选。可以随时切到完整配装页组装装备槽，或一键套用 WCL 排行榜大佬配装。</p>
      </div>
      <div class="class-workbench-actions">
        <a href="${buildDefaultSpecRouteHref(state.classKey)}" data-action="buildPage">切到配装模拟</a>
        <a class="wcl-entry" href="${buildDefaultSpecRouteHref(state.classKey)}#wcl=1" data-action="buildPage">排行榜配装</a>
        <button data-action="shareRequest">请好友配装</button>
        <button data-action="favorites">查看收藏夹</button>
        <a href="#filters">筛选装备池</a>
      </div>
    </section>
  `;
}

function currentBuild() {
  return state.buildId ? getBuild(state.buildId) : null;
}

function renderBuildView() {
  const build = currentBuild();
  const classMeta = getClassMeta(state.buildClassKey);
  const className = build?.className || classMeta?.name || '';
  return `
    <main class="page-shell build-web-page">
      <header class="top-bar build-web-top">
        <a class="back-btn" href="${buildPageHref()}" data-action="home" aria-label="Back to home">‹</a>
        <div class="top-title-wrap">
          <strong>${escapeHtml(build ? `${classLabel(build.classKey, build.className)} · ${specLabel({ id: build.specId, name: build.specName })}` : t('buildKicker'))}</strong>
        </div>
        <div class="top-actions">
          ${renderLocaleSelector()}
          <button class="pill-button compact" data-action="buildList">${escapeHtml(t('planList'))}${state.buildList.length ? `<b>${state.buildList.length}</b>` : ''}</button>
        </div>
      </header>
      ${build ? '' : renderHomeToolHero(getFavorites().length, false)}
      ${renderModeSwitch('build', className, build?.classKey || state.buildClassKey)}
      ${build ? renderBuildWorkbench(build) : renderBuildSelector()}
      ${state.buildSlotPicker ? renderBuildSlotPicker() : ''}
      ${state.craftingPicker ? renderCraftingPicker() : ''}
      ${state.wcl.open ? renderWclPanel() : ''}
    </main>
  `;
}

function renderBuildSelector() {
  const selectedClass = getClassMeta(state.buildClassKey);
  const specs = selectedClass && state.buildClassData?.specs ? state.buildClassData.specs : [];
  const countMap = {};
  (state.overview?.classes || []).forEach((item) => { countMap[item.key] = item.itemCount; });
  return `
    <div class="prompt-wrap build-prompt"><span>${escapeHtml(t('selectClassToBuild'))}</span></div>
    <section class="class-grid-wrap build-class-grid" aria-label="${escapeHtml(t('selectClassToBuild'))}">
      ${[CLASS_LIST.slice(0, 4), CLASS_LIST.slice(4, 9), CLASS_LIST.slice(9, 13)].map((row) => `
        <div class="class-row">
          ${row.map((item) => {
            const assets = getClassVisualAssets(item.key);
            return `
              <a class="class-cell build-class-cell ${state.buildClassKey === item.key ? 'active' : ''}" href="${buildDefaultSpecRouteHref(item.key)}" data-action="selectBuildClass" data-class="${item.key}">
                <img class="class-emblem" src="${assets.emblem}" alt="">
                <span class="class-label" style="color:${item.color}">${escapeHtml(classLabel(item.key, item.shortName))}</span>
                <small>${countMap[item.key] || 0}</small>
              </a>
            `;
          }).join('')}
        </div>
      `).join('')}
    </section>
    ${selectedClass ? `
      <section class="build-spec-panel">
        <h2>${escapeHtml(t('specPanelTitle', { className: classLabel(selectedClass.key, selectedClass.name) }))}</h2>
        <div class="build-spec-grid">
          ${specs.length ? specs.map((spec) => `
            <a href="${buildSpecRouteHref(selectedClass.key, spec.id)}" data-action="startBuild" data-class="${selectedClass.key}" data-spec-id="${spec.id}" data-spec-name="${escapeHtml(specLabel(spec))}">${escapeHtml(specLabel(spec))}</a>
          `).join('') : `<span>${escapeHtml(t('loading'))}</span>`}
        </div>
      </section>
    ` : ''}
  `;
}

function renderBuildWorkbench(build) {
  const summary = build.summary || summarizeSlots(build.slots, build.specId);
  const assets = getClassVisualAssets(build.classKey);
  return `
    <section class="build-board-hero">
      <img src="${assets.banner}" alt="">
      <div class="hero-shade"></div>
      <div class="build-board-hero-content">
        <p class="tool-kicker">${escapeHtml(t('buildKicker'))}</p>
        <h1>${escapeHtml(build.name)}</h1>
        <div class="build-board-actions">
          <button class="primary" data-action="openWcl">${escapeHtml(t('wclTitle'))}</button>
          <button data-action="saveBuild">${escapeHtml(build.draft ? t('buildSave') : t('buildSaveChanges'))}</button>
          <button data-action="renameBuild">${escapeHtml(t('buildRename'))}</button>
          <button data-action="newBuildPlan">${escapeHtml(t('buildNewPlan'))}</button>
          <button data-action="shareSavedBuild">${escapeHtml(t('buildShare'))}</button>
        </div>
        ${build.wclPreset ? `<p class="build-wcl-line">${escapeHtml(t('wclAppliedPrefix'))}${escapeHtml(build.wclPreset.name || '')}${build.wclPreset.talents?.exportString ? ` · ${escapeHtml(t('wclWithCode'))}` : ''}</p>` : ''}
      </div>
    </section>
    ${renderBuildSpecSwitch(build)}
    <section class="build-layout">
      <div class="build-slots-board">
        ${BUILD_SLOT_LAYOUT.map((column) => `
          <div class="build-slot-column">
            ${column.map((slotKey) => renderBuildSlot(build, slotKey)).join('')}
          </div>
        `).join('')}
        <div class="build-character-stand" aria-hidden="true">
          <img src="${assets.emblem}" alt="">
          <span>${escapeHtml(classLabel(build.classKey, build.className))}</span>
        </div>
        <div class="build-weapon-row">
          ${BUILD_WEAPON_LAYOUT.map((slotKey) => renderBuildSlot(build, slotKey)).join('')}
        </div>
      </div>
      ${renderBuildSummary(summary, build)}
    </section>
    ${renderBuildSeoSection(build)}
  `;
}

// ───────── 可见 SEO 内容板块(用户与爬虫看同一份, 全本地数据 0 COS) ─────────
const SEO_BIS_SLOTS = ['head', 'neck', 'shoulder', 'cloak', 'chest', 'wrist', 'hand', 'waist', 'legs', 'feet', 'finger', 'trinket', 'weapon'];

function seoSpecItems(build) {
  return (state.buildAllItems || []).filter((item) => !Array.isArray(item.specs) || !item.specs.length || item.specs.includes(build.specId));
}

function seoBisBySlot(items) {
  const best = {};
  items.forEach((item) => {
    const key = item.slot;
    if (!SEO_BIS_SLOTS.includes(key)) return;
    if (!best[key] || (item.ilvl || 0) > (best[key].ilvl || 0)) best[key] = item;
  });
  return SEO_BIS_SLOTS.filter((key) => best[key]).map((key) => ({
    slot: t(`slots.${key}`),
    name: itemNameLabel(best[key]),
    ilvl: best[key].ilvl || 0,
    source: instanceNameLabel(best[key].instanceName) || best[key].instanceName || '',
  }));
}

function seoTendencySentence(build) {
  const zh = isChineseLocale();
  const data = state.statTendency?.specs?.[String(build.specId)];
  if (!data || !data.order?.length || !data.avg) return '';
  const parts = data.order.map((type) => `${t(`stats.${type}`)} ≈ ${data.avg[type]}`);
  const className = classLabel(build.classKey, build.className);
  const specName = build.specName;
  return zh
    ? `据 WCL 高分日志统计（样本 ${data.sampleCount} 套），前列${className}${specName}每套装备的平均副属性 rating（按原始数值累积）依次为 ${parts.join('、')}。此为对高分日志装备的客观统计，非绝对最优优先级。`
    : `Based on top WCL logs (${data.sampleCount} builds), average secondary stat rating per ${className} ${specName} build (by raw rating) is ${parts.join(', ')}. An objective tally of top-log gear, not a prescriptive priority.`;
}

function seoFaq(build, items) {
  const zh = isChineseLocale();
  const className = classLabel(build.classKey, build.className);
  const specName = build.specName;
  const armor = t(`data.armorTypes.${getClassMeta(build.classKey)?.armorType || ''}`);
  const slotList = SEO_BIS_SLOTS.map((key) => t(`slots.${key}`)).join(zh ? '、' : ', ');
  const sources = [...new Set(items.map((it) => instanceNameLabel(it.instanceName) || it.instanceName).filter(Boolean))];
  const mastery = MASTERY_COEFFICIENTS[Number(build.specId)];
  const faq = [];
  faq.push(zh ? { q: `${className}${specName}能穿什么护甲？`, a: `${className}使用${armor}。` }
    : { q: `What armor does ${className} ${specName} wear?`, a: `${className} uses ${armor}.` });
  faq.push(zh ? { q: `${className}${specName}有哪些装备槽？`, a: `配装涵盖以下部位：${slotList}（含双持/副手规则）。` }
    : { q: `Which gear slots does ${className} ${specName} use?`, a: `Builds cover: ${slotList} (with weapon/off-hand rules).` });
  if (zh && mastery) faq.push({ q: `${className}${specName}的精通主要提升什么？`, a: `主要提升${mastery[1]}。` });
  faq.push(zh ? { q: `本赛季${className}${specName}有多少可用装备、来自哪里？`, a: `当前赛季共有 ${items.length} 件可用装备，来源包括 ${sources.slice(0, 8).join('、')} 等。` }
    : { q: `How much ${className} ${specName} gear is available and where from?`, a: `${items.length} items this season, from ${sources.slice(0, 8).join(', ')}.` });
  const tendency = seoTendencySentence(build);
  if (tendency) faq.push(zh ? { q: `${className}${specName}的副属性怎么堆？`, a: tendency } : { q: `Which secondary stats do top ${className} ${specName} builds stack?`, a: tendency });
  faq.push(zh ? { q: `怎么用这个配装模拟器？`, a: `选择职业与专精，点击装备槽从当前专精可用装备中选装，实时查看平均装等、暴击/急速/精通/全能百分比与主属性、耐力；可保存方案、分享链接，或一键套用 WCL 排行榜配装。` }
    : { q: `How do I use this gear planner?`, a: `Pick a class and spec, click a slot to choose spec-usable gear, and watch item level and secondary stats update live. Save, share, or apply a WCL leaderboard build.` });
  return faq;
}

function renderBuildSeoSection(build) {
  if (!build || !state.buildClassData) return '';
  const zh = isChineseLocale();
  const items = seoSpecItems(build);
  if (!items.length) return '';
  const className = classLabel(build.classKey, build.className);
  const specName = build.specName;
  const bis = seoBisBySlot(items);
  const faq = seoFaq(build, items);
  const siblings = (state.buildClassData.specs || []).filter((spec) => spec.id !== build.specId);
  return `
    <section class="build-seo" aria-label="${escapeHtml(`${className}${specName}`)} SEO">
      <p class="build-seo-intro">${escapeHtml(zh
        ? `为${className}${specName}专精组装整套装备，实时计算平均装等与暴击/急速/精通/全能，并可一键套用 WCL 排行榜配装。`
        : `Assemble a full ${className} ${specName} build with live item level and secondary stats, and apply WCL leaderboard builds.`)}</p>

      <h2>${escapeHtml(zh ? '常见问题' : 'FAQ')}</h2>
      <div class="build-seo-faq">
        ${faq.map((item, i) => `
          <details ${i === 0 ? 'open' : ''}>
            <summary>${escapeHtml(item.q)}</summary>
            <p>${escapeHtml(item.a)}</p>
          </details>`).join('')}
      </div>

      <h2>${escapeHtml(zh ? `${className}${specName}各部位可用最高装等装备` : `Highest item level ${className} ${specName} gear by slot`)}</h2>
      <ul class="build-seo-bis">
        ${bis.map((row) => `<li><span class="bis-slot">${escapeHtml(row.slot)}</span><span class="bis-name">${escapeHtml(row.name)}</span><span class="bis-meta">ilvl ${escapeHtml(row.ilvl)}${row.source ? ` · ${escapeHtml(row.source)}` : ''}</span></li>`).join('')}
      </ul>

      <h2>${escapeHtml(zh ? '相关页面' : 'Related pages')}</h2>
      <ul class="build-seo-links">
        ${siblings.map((spec) => `<li><a href="${buildSpecRouteHref(build.classKey, spec.id)}" data-action="startBuild" data-class="${build.classKey}" data-spec-id="${spec.id}" data-spec-name="${escapeHtml(specLabel(spec))}">${escapeHtml(zh ? `${className}${specLabel(spec)}配装` : `${className} ${specLabel(spec)} planner`)}</a></li>`).join('')}
        <li><a href="${buildPageHref(build.classKey)}" data-action="class" data-class="${build.classKey}">${escapeHtml(zh ? `${className}装备查询` : `${className} gear`)}</a></li>
        <li><a href="${equipmentRouteHref()}" data-action="buildPage">${escapeHtml(zh ? '装备查询' : 'Gear search')}</a></li>
      </ul>
    </section>
  `;
}

// 职业级可见 SEO 板块(装备查询页, 与 class noscript 内容对等)
function classSeoFaq() {
  const zh = isChineseLocale();
  const className = classLabel(state.classKey, state.classData?.class?.name || '');
  const armor = t(`data.armorTypes.${getClassMeta(state.classKey)?.armorType || ''}`);
  const specNames = (state.classData?.specs || []).map((spec) => specLabel(spec)).filter(Boolean);
  const items = state.allItems || [];
  const sources = [...new Set(items.map((it) => instanceNameLabel(it.instanceName) || it.instanceName).filter(Boolean))];
  const faq = [];
  faq.push(zh ? { q: `${className}能穿什么护甲？`, a: `${className}使用${armor}。` } : { q: `What armor does ${className} wear?`, a: `${className} uses ${armor}.` });
  faq.push(zh ? { q: `${className}有哪些专精？`, a: `共 ${specNames.length} 个专精：${specNames.join('、')}。` } : { q: `Which specs does ${className} have?`, a: `${specNames.length} specs: ${specNames.join(', ')}.` });
  faq.push(zh ? { q: `本赛季${className}有多少可用装备、来自哪里？`, a: `当前赛季共有 ${items.length} 件可用装备，来源包括 ${sources.slice(0, 8).join('、')} 等。` } : { q: `How much ${className} gear is available and where from?`, a: `${items.length} items this season, from ${sources.slice(0, 8).join(', ')}.` });
  faq.push(zh ? { q: `怎么查${className}装备、怎么配装？`, a: `用装备查询按专精、部位、副属性、地下城、团本和套装筛选；找到候选后切到配装模拟器组装整套并查看装等与属性。` } : { q: `How do I find ${className} gear and build?`, a: `Filter by spec, slot, secondary stats and source, then switch to the gear planner.` });
  return faq;
}

function renderClassSeoSection() {
  if (!state.classData || !(state.allItems || []).length) return '';
  const zh = isChineseLocale();
  const className = classLabel(state.classKey, state.classData?.class?.name || '');
  const faq = classSeoFaq();
  const specLinks = (state.classData.specs || []).map((spec) => `<li><a href="${buildSpecRouteHref(state.classKey, spec.id)}" data-action="startBuild" data-class="${state.classKey}" data-spec-id="${spec.id}" data-spec-name="${escapeHtml(specLabel(spec))}">${escapeHtml(zh ? `${className}${specLabel(spec)}配装` : `${className} ${specLabel(spec)} planner`)}</a></li>`).join('');
  return `
    <section class="build-seo class-seo" aria-label="${escapeHtml(className)} SEO">
      <h2>${escapeHtml(zh ? '常见问题' : 'FAQ')}</h2>
      <div class="build-seo-faq">
        ${faq.map((item, i) => `<details ${i === 0 ? 'open' : ''}><summary>${escapeHtml(item.q)}</summary><p>${escapeHtml(item.a)}</p></details>`).join('')}
      </div>
      <h2>${escapeHtml(zh ? '配装模拟' : 'Gear planner')}</h2>
      <ul class="build-seo-links">
        ${specLinks}
        <li><a href="${buildDefaultSpecRouteHref(state.classKey)}" data-action="buildPage">${escapeHtml(zh ? `${className}配装模拟器` : `${className} gear planner`)}</a></li>
      </ul>
    </section>`;
}

function renderBuildSpecSwitch(build) {
  const specs = state.buildClassData?.specs || [];
  if (!specs.length) return '';
  return `
    <nav class="build-spec-switch" aria-label="${escapeHtml(classLabel(build.classKey, build.className))}专精切换">
      ${specs.map((spec) => `
        <a class="${spec.id === build.specId ? 'active' : ''}" href="${buildSpecRouteHref(build.classKey, spec.id)}" data-action="startBuild" data-class="${build.classKey}" data-spec-id="${spec.id}" data-spec-name="${escapeHtml(specLabel(spec))}">
          ${escapeHtml(specLabel(spec))}
        </a>
      `).join('')}
    </nav>
  `;
}

function renderBuildSlot(build, slotKey) {
  const meta = BUILD_SLOT_META.find((item) => item.key === slotKey);
  const item = build.slots?.[slotKey];
  const label = buildSlotLabel(slotKey);
  if (meta?.placeholder) {
    return `
      <article class="build-slot-card placeholder-slot">
        <div class="build-slot-icon"><span>${escapeHtml(label)}</span></div>
        <div class="build-slot-body">
          <strong>${escapeHtml(label)}</strong>
          <p>—</p>
        </div>
      </article>
    `;
  }
  const disabled = slotKey === 'weapon2' && build.slots.weapon && mainHandOccupiesBoth(build.specId, build.slots.weapon);
  return `
    <article class="build-slot-card ${item ? 'filled' : ''} ${disabled ? 'disabled' : ''}" data-action="${disabled ? 'noop' : 'openSlotPicker'}" data-slot="${slotKey}">
      <div class="build-slot-icon">
        ${item?.iconAsset ? `<img src="${escapeHtml(item.iconAsset)}" alt="">` : `<span>${escapeHtml(label)}</span>`}
      </div>
      <div class="build-slot-body">
        <strong>${escapeHtml(itemNameLabel(item) || label)}</strong>
        <p>${escapeHtml(item ? (item.statLine || buildStatLine(item)) : (disabled ? t('twoHandOccupied') : t('slotClickToSelect')))}</p>
        ${item ? `<small>ilvl${escapeHtml(item.ilvl)} · ${escapeHtml(instanceNameLabel(item.instanceName, item) || item.instanceName || label)}</small>` : ''}
      </div>
      ${item ? `<button class="slot-clear" data-action="clearBuildSlot" data-slot="${slotKey}">${escapeHtml(t('slotClear'))}</button>` : ''}
    </article>
  `;
}

function renderBuildSummary(summary, build = currentBuild()) {
  const secondary = summary.secondary;
  return `
    <aside class="build-summary-panel">
      <div class="build-summary-head">
        <h2>${escapeHtml(t('buildSummaryTitle'))}</h2>
        <strong>${escapeHtml(summary.avgIlvl)}</strong>
        <span>${escapeHtml(t('buildAvgIlvl'))}</span>
      </div>
      <div class="build-summary-count">${escapeHtml(t('buildSlotCount', { occupied: summary.occupiedSlots, total: summary.totalSlots }))}</div>
      <div class="build-stat-grid">
        ${[
          ['crit', secondary.crit],
          ['haste', secondary.haste],
          ['mastery', secondary.mastery],
          ['versatility', secondary.versatility],
        ].map(([key, stat]) => `
          <div class="stat-card stat-${key}">
            <span>${escapeHtml(t(`stats.${key}`))}</span>
            <strong>${escapeHtml(stat.rating)}</strong>
            <em>${escapeHtml(stat.percentText)}%</em>
          </div>
        `).join('')}
      </div>
      <div class="build-primary-list">
        ${summary.primaryStats.map((stat) => `<p><span>${escapeHtml(stat.type ? t(`data.statTypes.${stat.type}`) : stat.name)}</span><strong>${escapeHtml(stat.value)}</strong></p>`).join('')}
        <p><span>${escapeHtml(t('buildStamina'))}</span><strong>${escapeHtml(summary.stamina)}</strong></p>
        <p><span>${escapeHtml(t('buildSecondaryTotal'))}</span><strong>${escapeHtml(summary.secondaryTotal)}</strong></p>
      </div>
      <small>${escapeHtml(t('buildSummaryHint', { armor: summary.armorSpecializationActive ? t('buildSummaryHintArmor') : '' }))}</small>
      ${renderWclAppliedInfo(build)}
    </aside>
  `;
}

function buildSlotPickerItems(build, slotKey) {
  const meta = BUILD_SLOT_META.find((item) => item.key === slotKey);
  if (!meta) return [];
  return state.buildAllItems
    .filter((item) => item.slot === meta.slot)
    .filter((item) => itemSupportsSpec(item, build.specId))
    .filter((item) => {
      if (meta.slot !== 'weapon') return true;
      return canItemUseWeaponSlot(build.specId, slotKey, item);
    })
    .sort((a, b) => (b.ilvl || 0) - (a.ilvl || 0) || a._sort.order - b._sort.order);
}

function renderBuildSlotPicker() {
  const build = currentBuild();
  const slotKey = state.buildSlotPicker?.slotKey;
  const meta = BUILD_SLOT_META.find((item) => item.key === slotKey);
  const items = build && slotKey ? buildSlotPickerItems(build, slotKey) : [];
  return `
    <div class="modal-mask" data-action="closeSlotPicker">
      <section class="overlay-panel build-picker-panel" data-stop>
        <header class="overlay-head">
          <div class="overlay-title-line"><h2>${escapeHtml(t('pickSelect', { label: slotKey ? buildSlotLabel(slotKey) : '' }))}</h2><span class="overlay-count-badge">${escapeHtml(t('pickCount', { count: items.length }))}</span></div>
          <button class="panel-x" data-action="closeSlotPicker"></button>
        </header>
        <div class="panel-divider"></div>
        <div class="build-picker-list">
          ${items.length ? items.map((item) => renderBuildPickerItem(item, slotKey)).join('') : `<div class="favorite-empty">${escapeHtml(t('pickNoItems'))}</div>`}
        </div>
      </section>
    </div>
  `;
}

function renderBuildPickerItem(item, slotKey) {
  return `
    <article class="build-picker-item" data-action="equipBuildItem" data-slot="${slotKey}" data-id="${item.id}">
      <div class="favorite-icon-wrap">${item.iconAsset ? `<img src="${escapeHtml(item.iconAsset)}" alt="">` : `<span>${escapeHtml(iconTextLabel(item))}</span>`}</div>
      <div>
        <strong>${escapeHtml(itemNameLabel(item))}</strong>
        <p>${escapeHtml(item.statLine || buildStatLine(item))}</p>
        <small>ilvl${escapeHtml(item.ilvl)} · ${escapeHtml(instanceNameLabel(item.instanceName, item) || item.instanceName || '')}</small>
      </div>
      <span>${escapeHtml(t(`slots.${item.slot}`))}</span>
    </article>
  `;
}

function renderCraftingPicker() {
  const item = state.craftingPicker?.item;
  const slots = getRandomAttributeSlots(item);
  const selected = state.craftingPicker?.selected || [];
  return `
    <div class="modal-mask" data-action="closeCraftingPicker">
      <section class="overlay-panel crafting-picker-panel" data-stop>
        <header class="overlay-head">
          <div class="overlay-title-line"><h2>${escapeHtml(t('craftTitle'))}</h2><span class="overlay-count-badge">${escapeHtml(itemNameLabel(item))}</span></div>
          <button class="panel-x" data-action="closeCraftingPicker"></button>
        </header>
        <div class="crafting-picker-body">
          <p>${escapeHtml(t('craftDesc', { count: slots.length }))}</p>
          <div class="crafting-random-slots">${slots.map((slot) => `<span>${escapeHtml(t('craftRandomSlot', { value: slot.value }))}</span>`).join('')}</div>
          <div class="crafting-stat-options">
            ${STAT_OPTIONS.map((type) => `
              <button class="stat-option stat-${type} ${selected.includes(type) ? 'on' : ''}" data-action="toggleCraftingStat" data-type="${type}">${escapeHtml(t(`stats.${type}`))}</button>
            `).join('')}
          </div>
          <div class="panel-actions">
            <button data-action="closeCraftingPicker">${escapeHtml(t('craftCancel'))}</button>
            <button data-action="confirmCraftingStats" ${selected.length === slots.length ? '' : 'disabled'}>${escapeHtml(t('craftConfirm'))}</button>
          </div>
        </div>
      </section>
    </div>
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
    <section id="filters" class="filter-panel">
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
    state.overlay === 'buildList' ? renderSavedBuildListPanel() : '',
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

function renderSavedBuildListPanel() {
  setBuildListState();
  const body = state.buildList.length ? `
    <div class="favorite-list">
      ${state.buildList.map((build) => `
        <article class="saved-build-item" data-action="loadSavedBuild" data-id="${escapeHtml(build.id)}">
          <div>
            <strong>${escapeHtml(build.name)}</strong>
            <p>${escapeHtml(classLabel(build.classKey, build.className))} · ${escapeHtml(build.specName)} · 装等 ${escapeHtml(build.summary?.avgIlvl || 0)}</p>
          </div>
          <button class="danger" data-action="deleteSavedBuild" data-id="${escapeHtml(build.id)}">删除</button>
        </article>
      `).join('')}
    </div>
  ` : `<div class="favorite-empty">还没有保存的配装方案</div>`;
  return renderOverlayFrame('配装方案列表', body, { subtitle: `${state.buildList.length} 个方案` });
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
      ${(item.secondaryStats || []).map((stat) => `<div class="stat-bar-item stat-${escapeHtml(stat.type === 'critical' ? 'crit' : stat.type)}"><p>+${escapeHtml(stat.value)} ${escapeHtml(statNameLabel(stat))}</p><div><i style="width:${escapeHtml(stat.width)}"></i></div></div>`).join('')}
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

function absoluteSavedBuildUrl(build = currentBuild()) {
  const url = new URL(buildRouteHref(state.locale), window.location.origin);
  const payload = encodeBuildShare(build);
  if (payload) url.searchParams.set('buildShare', payload);
  return url.toString();
}

function setBuildSlotItem(slotKey, rawItem) {
  const build = currentBuild();
  if (!build || !slotKey) return false;
  const item = rawItem ? buildItemSnapshot(rawItem) : null;
  let nextSlots = { ...build.slots };
  if (item && (slotKey === 'weapon' || slotKey === 'weapon2')) {
    const result = applyWeaponSelection(nextSlots, build.specId, slotKey, item);
    if (!result.ok) {
      showToast(result.message);
      return false;
    }
    nextSlots = result.slots;
    if (result.clearedOffHand) showToast('副手已因主手更换而清空');
  } else {
    nextSlots[slotKey] = item;
  }
  const updated = updateBuild(build.id, { slots: nextSlots });
  if (updated) state.buildId = updated.id;
  return Boolean(updated);
}

function equipBuildItem(slotKey, item) {
  if (!item) return;
  if (requiresCraftingStatSelection(item)) {
    state.craftingPicker = { slotKey, item, selected: [] };
    render();
    return;
  }
  if (setBuildSlotItem(slotKey, item)) {
    state.buildSlotPicker = null;
    render();
  }
}

// ─────────────────────── 排行榜配装 (WCL Presets) ───────────────────────
// 排行榜数据每天 cron 更新在 COS、未 commit 本地，因此这条线始终直连 COS。
const WCL_BASE = `${REMOTE_COS_BASE}/wcl-presets/${DATA_DIR_NAME}`;
const WCL_NAMES_VERSION = '20260701-seo';
const WCL_STAT_NAME = { crit: '暴击', haste: '急速', mastery: '精通', versatility: '全能' };

function wclStatName(stat) {
  return statNameLabel({ type: stat?.type, name: stat?.name || WCL_STAT_NAME[stat?.type] || stat?.type || '' });
}

async function loadWclNames(locale = state.locale) {
  const key = resolveLocale(locale);
  if (state.wclNameCache[key] !== undefined) return state.wclNameCache[key];
  try {
    const data = await fetchJson(`${LOCALE_DATA_BASE}/${key}/wcl-names.json?v=${WCL_NAMES_VERSION}`);
    state.wclNameCache[key] = data || null;
  } catch {
    state.wclNameCache[key] = null;
  }
  return state.wclNameCache[key];
}

async function ensureWclNamesLoaded() {
  const locale = resolveLocale(state.locale);
  await loadWclNames(locale);
  if (locale !== 'en-US') await loadWclNames('en-US');
}

function wclNameLookup(kind, id) {
  const key = String(id || '');
  if (!key) return '';
  const current = state.wclNameCache[resolveLocale(state.locale)]?.[kind]?.[key];
  if (current) return current;
  const english = state.wclNameCache['en-US']?.[kind]?.[key];
  if (english) return english;
  return '';
}

function wclEnchantLabel(slot) {
  const id = slot?.permanentEnchant;
  const localized = wclNameLookup('enchants', id);
  if (localized) return localized;
  if (isChineseLocale() && slot?.enchantName) return slot.enchantName;
  return id ? `#${id}` : '';
}

function wclGemLabel(gem) {
  const id = gem?.id;
  const localized = wclNameLookup('gems', id);
  if (localized) return localized;
  if (isChineseLocale() && gem?.name) return gem.name;
  return id ? `#${id}` : '';
}

function joinWclList(values) {
  return values.join(isChineseLocale() ? '、' : ', ');
}

function wclSlotLabel(slotKey) {
  return BUILD_SLOT_META.find((item) => item.key === slotKey)?.label || slotKey;
}

function formatWclUpdatedAt(ts) {
  const date = new Date(Number(ts) || 0);
  if (!date.getTime()) return '';
  const pad = (n) => String(n).padStart(2, '0');
  const stamp = `${date.getMonth() + 1}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
  return `${stamp} ${t('wclUpdatedSuffix')}`;
}

function wclContentList(index = state.wcl.index, contentType = state.wcl.contentType) {
  if (!index) return [];
  return contentType === 'raid' ? (index.raid || []) : (index.mythicPlus || []);
}

// 副本/首领名: 中文系用 localName, 其它语言用暴雪英文 name(数据里自带)
function wclEncounterName(encounter) {
  if (!encounter) return '';
  return state.locale.startsWith('zh')
    ? (encounter.localName || encounter.name || '')
    : (encounter.name || encounter.localName || '');
}

// 层数标签: 大秘境按钥石层数推导(非中文不显示中文"层"); 团本难度暂随数据
function wclLevelLabel(lvl) {
  if (!lvl) return '';
  if (state.locale.startsWith('zh')) return lvl.name;
  if (state.wcl.contentType === 'raid') return lvl.name || '';
  return Number(lvl.level) === 0 ? t('wclTopTier') : `+${lvl.level}`;
}

async function openWcl() {
  const build = currentBuild();
  if (!build) { showToast(t('wclNeedBuild')); return; }
  state.wcl = {
    open: true,
    classKey: build.classKey,
    specId: build.specId,
    index: null,
    contentType: 'mythicPlus',
    fileKey: '',
    file: null,
    dungeonId: 'all',
    loading: true,
    error: '',
  };
  render();
  await loadWclForCurrent();
}

function closeWcl() {
  state.wcl.open = false;
  render();
}

async function loadWclForCurrent() {
  const { classKey, specId } = state.wcl;
  try {
    const index = await fetchJson(`${WCL_BASE}/${classKey}/${specId}/index.json?t=${Date.now()}`);
    if (state.wcl.classKey !== classKey || state.wcl.specId !== specId) return;
    state.wcl.index = index;
    state.wcl.contentType = (index.mythicPlus || []).length ? 'mythicPlus' : 'raid';
    state.wcl.fileKey = wclContentList(index, state.wcl.contentType)[0]?.fileKey || '';
    state.wcl.error = '';
    state.wcl.loading = false;
    render();
    if (state.wcl.fileKey) await loadWclFileInto(state.wcl.fileKey);
  } catch (err) {
    if (state.wcl.classKey !== classKey || state.wcl.specId !== specId) return;
    state.wcl.loading = false;
    state.wcl.index = null;
    state.wcl.file = null;
    state.wcl.error = t('wclNoData');
    render();
  }
}

async function loadWclFileInto(fileKey) {
  state.wcl.fileKey = fileKey;
  state.wcl.loading = true;
  state.wcl.error = '';
  state.wcl.file = null;
  state.wcl.dungeonId = 'all';
  render();
  const { classKey, specId } = state.wcl;
  try {
    const file = await fetchJson(`${WCL_BASE}/${classKey}/${specId}/${fileKey}.json?t=${Date.now()}`);
    if (state.wcl.fileKey !== fileKey || state.wcl.classKey !== classKey || state.wcl.specId !== specId) return;
    state.wcl.file = file;
    state.wcl.loading = false;
    render();
  } catch (err) {
    if (state.wcl.fileKey !== fileKey || state.wcl.classKey !== classKey || state.wcl.specId !== specId) return;
    state.wcl.loading = false;
    state.wcl.file = null;
    state.wcl.error = t('wclFileError');
    render();
  }
}

function selectWclContent(contentType) {
  if (contentType === state.wcl.contentType) return;
  state.wcl.contentType = contentType;
  const first = wclContentList(state.wcl.index, contentType)[0];
  if (first) loadWclFileInto(first.fileKey);
  else { state.wcl.fileKey = ''; state.wcl.file = null; render(); }
}

function wclDungeonFilters() {
  const entries = state.wcl.file?.entries || [];
  const filters = [{ id: 'all', name: t('wclAll'), count: entries.reduce((sum, e) => sum + ((e.presets || []).length), 0) }];
  entries.forEach((entry) => {
    filters.push({
      id: String(entry.encounter?.id),
      name: wclEncounterName(entry.encounter),
      count: (entry.presets || []).length,
    });
  });
  return filters;
}

function wclVisibleEntries() {
  const entries = state.wcl.file?.entries || [];
  if (state.wcl.dungeonId === 'all') return entries;
  return entries.filter((entry) => String(entry.encounter?.id) === state.wcl.dungeonId);
}

// 排行榜预设 → 模拟器 (对齐小程序 applyWclPresetToBuild)
// 只存 id + 中文内嵌兜底, 名称在渲染期按当前语言解析(切语言可重译)。
function wclBuildEnchantsGems(slots) {
  const list = [];
  BUILD_SLOT_KEYS.forEach((key) => {
    const slot = slots[key];
    if (!slot) return;
    const gems = slot.gems || [];
    if (!slot.permanentEnchant && !slot.enchantName && !gems.length) return;
    list.push({
      slotKey: key,
      enchantId: slot.permanentEnchant || null,
      enchantZh: slot.enchantName || '',
      gems: gems.map((gem) => ({ id: gem.id || null, zh: gem.name || '' })),
    });
  });
  return list;
}

function wclApplySlotOverrides(baseItem, wclSlot, slotKey) {
  if (!baseItem) {
    const crafted = Array.isArray(wclSlot.craftedStats) ? wclSlot.craftedStats : [];
    return {
      id: wclSlot.itemId,
      itemId: wclSlot.itemId,
      name: `未知装备 ${wclSlot.itemId}`,
      ilvl: wclSlot.ilvl || 0,
      slot: BUILD_SLOT_META.find((item) => item.key === slotKey)?.slot || slotKey,
      iconAsset: '',
      instanceName: 'WCL',
      statLine: crafted.map((stat) => `${wclStatName(stat)}${stat.value}`).join(' / '),
      stats: crafted.length ? {
        primaryStats: [],
        stamina: 0,
        secondary: crafted.map((stat) => ({ type: stat.type, name: wclStatName(stat), value: stat.value || 0, craftedRandom: true, randomAttributeIndex: stat.randomAttributeIndex })),
      } : null,
      wclMissingLocalItem: true,
    };
  }
  const item = { ...baseItem, stats: baseItem.stats ? JSON.parse(JSON.stringify(baseItem.stats)) : null };
  item.ilvl = wclSlot.ilvl || item.ilvl || 0;
  if (Array.isArray(wclSlot.craftedStats) && wclSlot.craftedStats.length) {
    const stats = item.stats || { primaryStats: [], stamina: 0, secondary: [] };
    const fixed = (stats.secondary || []).filter((stat) => !stat.craftedRandom);
    const crafted = wclSlot.craftedStats.map((stat) => ({ type: stat.type, name: wclStatName(stat), value: stat.value || 0, craftedRandom: true, randomAttributeIndex: stat.randomAttributeIndex }));
    item.stats = { ...stats, secondary: fixed.concat(crafted) };
  }
  item.statLine = buildStatLine(item);
  return item;
}

async function applyWclPreset(entryIndex, presetIndex) {
  const entry = state.wcl.file?.entries?.[entryIndex];
  const preset = entry?.presets?.[presetIndex];
  const build = currentBuild();
  if (!preset || !build) { showToast(t('wclApplied')); return; }
  if (!window.confirm(t('wclApplyConfirm', { name: preset.name }))) return;
  await ensureWclNamesLoaded();

  const slots = emptyBuildSlots();
  const missing = [];
  Object.keys(preset.slots || {}).forEach((slotKey) => {
    if (!BUILD_SLOT_KEYS.includes(slotKey)) return;
    const wclSlot = preset.slots[slotKey];
    if (!wclSlot || !wclSlot.itemId) return;
    const base = state.buildItemMap[wclSlot.itemId];
    const usable = base && itemSupportsSpec(base, build.specId) ? base : null;
    const item = wclApplySlotOverrides(usable, wclSlot, slotKey);
    if (item.wclMissingLocalItem) missing.push(slotKey);
    if (slotKey === 'weapon' || slotKey === 'weapon2') {
      const result = applyWeaponSelection(slots, build.specId, slotKey, item);
      if (!result.ok) {
        missing.push(slotKey);
        return;
      }
      Object.assign(slots, result.slots);
    } else {
      slots[slotKey] = item;
    }
  });

  const updated = updateBuild(build.id, {
    slots,
    wclPreset: {
      name: preset.name,
      source: preset.source || {},
      talents: preset.talents || null,
      enchantsGems: wclBuildEnchantsGems(preset.slots || {}),
      missing,
    },
  });
  if (updated) state.buildId = updated.id;
  state.wcl.open = false;
  render();
  showToast(missing.length ? t('wclAppliedMissing', { count: missing.length }) : t('wclApplied'));
}

function renderWclPanel() {
  const specName = state.wcl.specName || (state.buildClassData?.specs || []).find((s) => s.id === state.wcl.specId)?.name || '';
  const className = currentBuild()?.className || getClassMeta(state.wcl.classKey)?.name || '';
  const index = state.wcl.index;
  const updated = index?.generatedAt ? formatWclUpdatedAt(index.generatedAt) : '';
  const levelList = wclContentList();
  return `
    <div class="modal-mask" data-action="closeWcl">
      <section class="overlay-panel wcl-panel" data-stop>
        <header class="overlay-head">
          <div class="overlay-title-line">
            <h2>${escapeHtml(t('wclTitle'))}</h2>
            <span class="overlay-count-badge">${escapeHtml(classLabel(state.wcl.classKey, className))} · ${escapeHtml(specLabel({ id: state.wcl.specId, name: specName }))}</span>
          </div>
          <button class="panel-x" data-action="closeWcl"></button>
        </header>
        ${updated ? `<p class="wcl-updated">${escapeHtml(updated)}</p>` : ''}
        ${index ? `
          <div class="wcl-tab-row">
            ${(index.mythicPlus || []).length ? `<button class="wcl-tab ${state.wcl.contentType === 'mythicPlus' ? 'on' : ''}" data-action="wclContent" data-content="mythicPlus">${escapeHtml(t('wclMythicPlus'))}</button>` : ''}
            ${(index.raid || []).length ? `<button class="wcl-tab ${state.wcl.contentType === 'raid' ? 'on' : ''}" data-action="wclContent" data-content="raid">${escapeHtml(t('wclRaid'))}</button>` : ''}
          </div>
          <div class="wcl-tab-row wcl-level-row">
            ${levelList.map((lvl) => `<button class="wcl-tab ${lvl.fileKey === state.wcl.fileKey ? 'on' : ''}" data-action="wclLevel" data-file="${escapeHtml(lvl.fileKey)}"><span>${escapeHtml(wclLevelLabel(lvl))}</span> <b>${lvl.presetCount || 0}</b></button>`).join('')}
          </div>
          ${state.wcl.file && wclDungeonFilters().length > 1 ? `
            <div class="wcl-dungeon-row">
              ${wclDungeonFilters().map((f) => `<button class="wcl-dungeon ${f.id === state.wcl.dungeonId ? 'on' : ''}" data-action="wclDungeon" data-id="${escapeHtml(f.id)}">${escapeHtml(f.name)} <b>${f.count}</b></button>`).join('')}
            </div>
          ` : ''}
        ` : ''}
        <div class="wcl-list">${renderWclList()}</div>
      </section>
    </div>
  `;
}

function renderWclList() {
  if (state.wcl.loading) return `<div class="favorite-empty">${escapeHtml(t('wclLoading'))}</div>`;
  if (state.wcl.error) return `<div class="favorite-empty">${escapeHtml(state.wcl.error)}</div>`;
  const entries = wclVisibleEntries();
  if (!entries.length) return `<div class="favorite-empty">${escapeHtml(t('wclEmpty'))}</div>`;
  const allEntries = state.wcl.file?.entries || [];
  return entries.map((entry) => {
    const entryIndex = allEntries.indexOf(entry);
    if (!(entry.presets || []).length) return '';
    return `
      <div class="wcl-group">
        <h3 class="wcl-group-title">${escapeHtml(wclEncounterName(entry.encounter))}</h3>
        ${entry.presets.map((preset, presetIndex) => renderWclPreset(preset, entryIndex, presetIndex)).join('')}
      </div>
    `;
  }).join('');
}

function renderWclPreset(preset, entryIndex, presetIndex) {
  const source = preset.source || {};
  const metric = source.metric === 'hps' ? 'HPS' : 'DPS';
  const meta = [
    `${Math.round(source.amount || 0).toLocaleString()} ${metric}`,
    source.server ? `${source.server.region || ''} ${source.server.name || ''}`.trim() : '',
    source.score ? `${source.score}${t('wclScoreSuffix')}` : '',
    source.bracket ? `+${source.bracket}${t('wclLevelSuffix')}` : (source.difficultyName || ''),
  ].filter(Boolean).join(' · ');
  const code = preset.talents?.exportString || '';
  const codeStatus = code ? `<span class="wcl-code-ready">${escapeHtml(t('wclWithCode'))}</span>` : `<span class="wcl-code-missing">${escapeHtml(t('wclNoCode'))}</span>`;
  return `
    <div class="wcl-preset">
      <div class="wcl-preset-main">
        <strong>${escapeHtml(preset.name || '')}</strong>
        <span class="wcl-preset-meta">${escapeHtml(meta)}</span>
        <span class="wcl-preset-status">${codeStatus}</span>
      </div>
      <button class="wcl-apply-btn" data-action="applyWcl" data-entry="${entryIndex}" data-preset="${presetIndex}">${escapeHtml(t('wclApply'))}</button>
    </div>
  `;
}

// 套用排行榜后, 在配装信息面板里展示来源/天赋码/附魔宝石/缺失
function renderWclAppliedInfo(build) {
  const info = build?.wclPreset;
  if (!info) return '';
  const source = info.source || {};
  const meta = [source.score ? `${source.score}${t('wclScoreSuffix')}` : '', source.bracket ? `+${source.bracket}${t('wclLevelSuffix')}` : (source.difficultyName || '')].filter(Boolean).join(' · ');
  const code = info.talents?.exportString || '';
  const eg = (info.enchantsGems || []).map((row) => {
    const slotName = row.slotKey ? buildSlotLabel(row.slotKey) : (row.slot || '');
    let enchant;
    let gemText;
    if (row.enchantId !== undefined || row.gems !== undefined) {
      // 新格式: 存 id, 渲染期按当前语言解析
      enchant = wclEnchantLabel({ permanentEnchant: row.enchantId, enchantName: row.enchantZh });
      gemText = joinWclList((row.gems || []).map((gem) => wclGemLabel({ id: gem.id, name: gem.zh })).filter(Boolean));
    } else {
      // 旧格式(已保存方案): 用套用时烤好的字符串
      enchant = row.enchant || '';
      gemText = row.gemText || '';
    }
    const parts = [enchant ? `${t('wclEnchant')} · ${enchant}` : '', gemText ? `${t('wclGem')} · ${gemText}` : ''].filter(Boolean).join('　');
    return `<div class="wcl-eg-row"><span class="wcl-eg-slot">${escapeHtml(slotName)}</span><span class="wcl-eg-text">${escapeHtml(parts)}</span></div>`;
  }).join('');
  return `
    <div class="wcl-applied">
      <div class="wcl-applied-head"><strong>${escapeHtml(t('wclTitle'))} · ${escapeHtml(info.name || '')}</strong>${meta ? `<span>${escapeHtml(meta)}</span>` : ''}</div>
      ${code ? `
        <div class="wcl-talent-row">
          <span class="wcl-talent-label">${escapeHtml(t('wclTalentCode'))}</span>
          <code class="wcl-talent-code">${escapeHtml(code)}</code>
          <button class="wcl-talent-copy" data-action="copyTalentCode" data-code="${escapeHtml(code)}">${escapeHtml(t('wclCopy'))}</button>
        </div>
      ` : ''}
      ${eg ? `<div class="wcl-eg-block"><span class="wcl-eg-title">${escapeHtml(t('wclEnchantsGems'))}</span>${eg}</div>` : ''}
      ${(info.missing || []).length ? `<p class="wcl-missing">${escapeHtml(t('wclMissing', { count: info.missing.length }))}</p>` : ''}
    </div>
  `;
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

  if (action === 'class') {
    window.location.href = target.getAttribute('href') || buildPageHref(target.dataset.class);
    return;
  }
  if (action === 'buildPage') {
    window.location.href = target.getAttribute('href') || buildRouteHref();
    return;
  }
  if (action === 'home') {
    window.location.href = target.getAttribute('href') || buildPageHref();
    return;
  }
  if (action === 'noop') return;
  if (action === 'announcement') { state.overlay = 'announcement'; render(); }
  if (action === 'favorites') { state.overlay = 'favorites'; render(); }
  if (action === 'buildList') { setBuildListState(); state.overlay = 'buildList'; render(); }
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
  if (action === 'selectBuildClass') {
    window.location.href = target.getAttribute('href') || buildDefaultSpecRouteHref(target.dataset.class);
    return;
  }
  if (action === 'startBuild') {
    window.location.href = target.getAttribute('href') || buildSpecRouteHref(target.dataset.class, target.dataset.specId);
    return;
  }
  if (action === 'openSlotPicker') {
    const build = currentBuild();
    if (!build) return;
    state.buildSlotPicker = { slotKey: target.dataset.slot };
    render();
  }
  if (action === 'closeSlotPicker') { state.buildSlotPicker = null; render(); }
  if (action === 'clearBuildSlot') {
    setBuildSlotItem(target.dataset.slot, null);
    render();
  }
  if (action === 'equipBuildItem') {
    equipBuildItem(target.dataset.slot, state.buildItemMap[target.dataset.id]);
  }
  if (action === 'closeCraftingPicker') { state.craftingPicker = null; render(); }
  if (action === 'toggleCraftingStat') {
    const type = target.dataset.type;
    const current = state.craftingPicker?.selected || [];
    const required = getRandomAttributeSlots(state.craftingPicker?.item).length;
    state.craftingPicker.selected = current.includes(type) ? current.filter((item) => item !== type) : (current.length < required ? [...current, type] : current);
    render();
  }
  if (action === 'confirmCraftingStats') {
    const picker = state.craftingPicker;
    const crafted = buildCraftedItemWithSelectedStats(picker?.item, picker?.selected || []);
    if (!crafted) return;
    if (setBuildSlotItem(picker.slotKey, crafted)) {
      state.craftingPicker = null;
      state.buildSlotPicker = null;
      render();
    }
  }
  if (action === 'saveBuild') {
    const build = currentBuild();
    if (!build) return;
    const updated = updateBuild(build.id, { draft: false });
    if (updated) {
      state.buildId = updated.id;
      showToast('配装方案已保存');
      render();
    }
  }
  if (action === 'renameBuild') {
    const build = currentBuild();
    if (!build) return;
    const name = window.prompt('输入新的配装名称', build.name);
    if (name && name.trim()) {
      updateBuild(build.id, { name: name.trim(), draft: false });
      render();
    }
  }
  if (action === 'newBuildPlan') {
    state.buildId = '';
    state.buildPhase = 'select';
    state.buildClassKey = '';
    state.buildClassData = null;
    state.buildAllItems = [];
    state.buildItemMap = {};
    render();
  }
  if (action === 'shareSavedBuild') {
    const build = currentBuild();
    if (!build) return;
    if (build.draft) updateBuild(build.id, { draft: false });
    shareUrl(absoluteSavedBuildUrl(getBuild(build.id) || build));
  }
  if (action === 'loadSavedBuild') {
    const build = getBuild(target.dataset.id);
    if (!build) return;
    state.overlay = '';
    state.buildId = build.id;
    state.buildClassKey = build.classKey;
    state.buildPhase = 'build';
    loadBuildClass(build.classKey).then(() => render());
  }
  if (action === 'deleteSavedBuild') {
    deleteBuild(target.dataset.id);
    if (state.buildId === target.dataset.id) state.buildId = '';
    state.overlay = 'buildList';
    render();
  }
  if (action === 'openWcl') openWcl();
  if (action === 'closeWcl') closeWcl();
  if (action === 'wclContent') selectWclContent(target.dataset.content);
  if (action === 'wclLevel') { if (target.dataset.file !== state.wcl.fileKey) loadWclFileInto(target.dataset.file); }
  if (action === 'wclDungeon') { state.wcl.dungeonId = target.dataset.id; render(); }
  if (action === 'applyWcl') applyWclPreset(Number(target.dataset.entry), Number(target.dataset.preset));
  if (action === 'copyTalentCode') copyTextToClipboard(target.dataset.code).then((ok) => showToast(ok ? t('wclCopied') : t('wclCopyFail')));
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
  // 配装页有已套用的排行榜预设时, 切语言要重译附魔/宝石名 -> 先加载新语言字典
  if (state.view === 'build' && currentBuild()?.wclPreset) await ensureWclNamesLoaded();
  updateSeoMeta();
  updateLangUrl();
  render();
}

function updateLangUrl() {
  const build = currentBuild();
  const nextPath = state.view === 'build'
    ? (build ? buildSpecRouteHref(build.classKey, build.specId, state.locale) : (state.buildClassKey ? buildClassRouteHref(state.buildClassKey, state.locale) : buildRouteHref(state.locale)))
    : (state.view === 'equipment' ? equipmentRouteHref(state.locale) : buildPageHref(state.classKey, state.locale));
  history.replaceState(null, '', `${nextPath}${window.location.hash || ''}`);
}

function updateSeoMeta() {
  const seoModel = getSeoModel();
  document.title = seoModel.title;
  setMetaContent('meta[name="description"]', seoModel.description);
  setMetaContent('meta[property="og:title"]', seoModel.socialTitle);
  setMetaContent('meta[property="og:description"]', seoModel.socialDescription);
  setMetaContent('meta[property="og:url"]', seoModel.socialUrl);
  setMetaContent('meta[name="twitter:title"]', seoModel.socialTitle);
  setMetaContent('meta[name="twitter:description"]', seoModel.socialDescription);
  setLinkHref('link[rel="canonical"]', seoModel.canonicalUrl);
  document.documentElement.lang = state.locale;
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
  state.view = route.view;
  loadOverview();
  if (route.view === 'build') {
    await openBuildPage(route.buildId, route.buildShare, route.classKey, route.buildSpecId);
    if (route.wclAuto && currentBuild()) openWcl();
  } else if (route.classKey) await openClass(route.classKey, { requestBuild: route.requestBuild });
  else render();
  if (route.shareFav) restoreSharedFavorites(route.shareFav);
}

boot();
