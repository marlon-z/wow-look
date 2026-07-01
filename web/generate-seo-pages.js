const fs = require('fs');
const path = require('path');
const vm = require('vm');

const WEB_DIR = __dirname;
const CONFIG_PATH = path.join(WEB_DIR, 'seo.config.json');
const I18N_PATH = path.join(WEB_DIR, 'i18n.js');

function readJSON(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

function writeFile(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, 'utf-8');
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escapeXml(value) {
  return escapeHtml(value).replace(/'/g, '&apos;');
}

function stripSeoBrand(value = '') {
  return String(value).replace(/\s*\|\s*SeasonLoot\s*$/u, '').trim();
}

function loadI18n() {
  const source = fs.readFileSync(I18N_PATH, 'utf-8')
    .replace(/\bexport\s+/g, '')
    + '\nmodule.exports = { SUPPORTED_LOCALES, getLocaleName, resolveLocale, createI18n };';
  const sandbox = { module: { exports: {} }, console };
  vm.runInNewContext(source, sandbox, { filename: I18N_PATH });
  return sandbox.module.exports;
}

const config = readJSON(CONFIG_PATH);
const i18nModule = loadI18n();
const DATA_DIR = path.join(WEB_DIR, config.dataDir);
const DEFAULT_LOCALE = config.defaultLocale;

// SEO 内容数据源(全本地, 生成期 0 COS)
const MASTERY_COEFFICIENTS = (() => {
  try { return require('../miniprogram/utils/mastery-coefficients.js').MASTERY_COEFFICIENTS || {}; } catch { return {}; }
})();
const STAT_TENDENCY = (() => {
  const file = path.join(DATA_DIR, 'wcl-stat-tendency.json');
  return fs.existsSync(file) ? readJSON(file) : { specs: {} };
})();
const localeConfigs = config.locales.filter((item) => i18nModule.SUPPORTED_LOCALES.includes(item.locale));
const aliasConfigs = (config.aliases || []).filter((item) => i18nModule.SUPPORTED_LOCALES.includes(item.locale) && item.slug);
const localeByCode = Object.fromEntries(localeConfigs.map((item) => [item.locale, item]));

function localeConfig(locale) {
  return localeByCode[locale] || localeByCode[DEFAULT_LOCALE];
}

function pathSegmentsFor(classKey = '') {
  return String(classKey || '').split('/').filter(Boolean);
}

function urlPath(locale, classKey = '') {
  const localeInfo = localeConfig(locale);
  const segments = [];
  if (localeInfo.slug) segments.push(localeInfo.slug);
  segments.push(...pathSegmentsFor(classKey));
  return `/${segments.join('/')}${segments.length ? '/' : ''}`;
}

function absoluteUrl(locale, classKey = '') {
  return `${config.baseUrl}${urlPath(locale, classKey)}`;
}

function pageDepth(locale, classKey = '') {
  const localeInfo = localeConfig(locale);
  return (localeInfo.slug ? 1 : 0) + pathSegmentsFor(classKey).length;
}

function relativeBase(locale, classKey = '') {
  const depth = pageDepth(locale, classKey);
  return depth ? Array.from({ length: depth }, () => '..').join('/') : '.';
}

function assetHref(locale, classKey, assetPath) {
  return `${relativeBase(locale, classKey)}${assetPath}`;
}

function hreflangTags(classKey = '') {
  const tags = localeConfigs.map((item) =>
    `<link rel="alternate" hreflang="${item.hreflang}" href="${absoluteUrl(item.locale, classKey)}">`
  );
  tags.push(`<link rel="alternate" hreflang="x-default" href="${absoluteUrl(DEFAULT_LOCALE, classKey)}">`);
  return tags.join('\n    ');
}

function flattenItems(instances) {
  const items = [];
  const seen = new Set();
  for (const inst of instances || []) {
    for (const enc of inst.encounters || []) {
      for (const item of enc.items || []) {
        if (!seen.has(item.id)) {
          seen.add(item.id);
          items.push({ ...item, instanceId: inst.id, instanceName: inst.name, encounterName: enc.name });
        }
      }
    }
  }
  return items;
}

function localizedClassName(locale, classKey, fallback) {
  const i18n = i18nModule.createI18n(locale);
  return i18n.raw(`data.classes.${classKey}`) || fallback || classKey;
}

function localizedSpecName(locale, spec) {
  const i18n = i18nModule.createI18n(locale);
  return i18n.raw(`data.specs.${spec.id}`) || spec.name || '';
}

function localizedInstanceName(locale, instanceId, fallback) {
  const i18n = i18nModule.createI18n(locale);
  if (typeof instanceId === 'string' && instanceId.startsWith('tier:')) {
    return i18n.raw('data.instances.tier') || i18n.t('sourceTypes.tier');
  }
  return i18n.raw(`data.instances.${instanceId}`) || fallback || '';
}

function localizedArmorType(locale, armorType) {
  const i18n = i18nModule.createI18n(locale);
  return i18n.raw(`data.armorTypes.${armorType}`) || armorType || '';
}

function localizedStat(locale, statType) {
  const i18n = i18nModule.createI18n(locale);
  return i18n.t(`stats.${statType}`);
}

const SLOT_MAP = {
  head: 'head',
  neck: 'neck',
  shoulder: 'shoulder',
  cloak: 'cloak',
  back: 'cloak',
  chest: 'chest',
  wrist: 'wrist',
  hand: 'hand',
  hands: 'hand',
  waist: 'waist',
  legs: 'legs',
  feet: 'feet',
  finger: 'finger',
  trinket: 'trinket',
  weapon: 'weapon',
  'one-hand': 'weapon',
  'two-hand': 'weapon',
  'main-hand': 'weapon',
  'off-hand': 'weapon',
  shield: 'weapon',
  ranged: 'weapon',
};

const SLOT_ORDER = ['head', 'neck', 'shoulder', 'cloak', 'chest', 'wrist', 'hand', 'waist', 'legs', 'feet', 'finger', 'trinket', 'weapon'];

function slotKey(slot) {
  if (!slot) return 'unknown';
  const normalized = String(slot).toLowerCase();
  return SLOT_MAP[normalized] || (normalized.includes('weapon') || normalized.includes('hand') ? 'weapon' : 'unknown');
}

function localizedSlot(locale, key) {
  const i18n = i18nModule.createI18n(locale);
  return i18n.t(`slots.${key}`);
}

function readLocaleData(locale, classKey) {
  const localeFile = path.join(WEB_DIR, 'locales', locale, 'data', `${classKey}.json`);
  const defaultFile = path.join(WEB_DIR, 'locales', DEFAULT_LOCALE, 'data', `${classKey}.json`);
  if (fs.existsSync(localeFile)) return readJSON(localeFile);
  if (fs.existsSync(defaultFile)) return readJSON(defaultFile);
  return { items: {} };
}

function localizedItemName(itemId, localeData, fallbackData) {
  return localeData.items?.[String(itemId)]?.name
    || fallbackData.items?.[String(itemId)]?.name
    || `Item #${itemId}`;
}

function secondaryStats(item) {
  return (item.stats?.secondary || []).map((stat) => stat.type).filter(Boolean);
}

function localizedMeta(locale, className = '') {
  const i18n = i18nModule.createI18n(locale);
  if (className) {
    const title = i18n.t('seoClassTitle', { className });
    const description = i18n.t('seoClassDesc', { className });
    return {
      title,
      heading: stripSeoBrand(title),
      description,
      socialTitle: stripSeoBrand(title),
      socialDescription: stripSeoBrand(description),
    };
  }
  const title = i18n.t('seoPageTitle');
  const description = i18n.t('seoMetaDesc');
  return {
    title,
    heading: i18n.t('seoTitle') || stripSeoBrand(title),
    description,
    socialTitle: stripSeoBrand(title),
    socialDescription: stripSeoBrand(description),
  };
}

function htmlShell({ locale, classKey = '', title, description, canonical, ogUrl, jsonLd, bodyAttrs = '', appAttrs = '', noscript }) {
  const asset = (assetPath) => assetHref(locale, classKey, assetPath);
  return `<!doctype html>
<html lang="${escapeHtml(locale)}">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
    <meta name="theme-color" content="#09080d">
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeHtml(description)}">
    <link rel="icon" href="${asset('/assets/public/logo.png')}">
    <link rel="canonical" href="${canonical}">
    ${hreflangTags(classKey)}
    <meta property="og:type" content="website">
    <meta property="og:title" content="${escapeHtml(stripSeoBrand(title))}">
    <meta property="og:description" content="${escapeHtml(stripSeoBrand(description))}">
    <meta property="og:image" content="${config.baseUrl}/assets/public/og-card.png">
    <meta property="og:url" content="${ogUrl}">
    <meta property="og:site_name" content="${escapeHtml(config.siteName)}">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${escapeHtml(stripSeoBrand(title))}">
    <meta name="twitter:description" content="${escapeHtml(stripSeoBrand(description))}">
    <meta name="twitter:image" content="${config.baseUrl}/assets/public/og-card.png">
    ${jsonLd}
    <link rel="stylesheet" href="${asset('/styles.css')}?v=${config.cacheBust}">
  </head>
  <body${bodyAttrs}>
    <div id="app" data-locale="${escapeHtml(locale)}"${appAttrs}></div>
    <noscript>
      ${noscript}
    </noscript>
    <script type="module" src="${asset('/app.js')}?v=${config.cacheBust}"></script>
  </body>
</html>
`;
}

function homeJsonLd(locale, meta) {
  const i18n = i18nModule.createI18n(locale);
  return `<script type="application/ld+json">
${JSON.stringify({
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: config.siteName,
  url: absoluteUrl(locale),
  description: stripSeoBrand(meta.description),
  applicationCategory: 'GameApplication',
  operatingSystem: 'Web Browser',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
  inLanguage: locale,
  featureList: [
    i18n.t('filters.spec'),
    i18n.t('filters.slot'),
    i18n.t('filters.stat'),
    i18n.t('filters.source'),
  ],
}, null, 2)}
</script>`;
}

function homeNoscript(locale, overview) {
  const i18n = i18nModule.createI18n(locale);
  const classes = (overview.classes || [])
    .map((cls) => `<li><a href="${urlPath(locale, cls.key)}">${escapeHtml(localizedClassName(locale, cls.key, cls.name))}</a> (${cls.itemCount || 0})</li>`)
    .join('\n');
  if (locale === 'zh-CN') {
    return `<h1>魔兽世界配装模拟器</h1>
<p>SeasonLoot 是面向当前赛季的魔兽世界配装模拟器和装备查询工具。选择职业和专精后，可以按部位、副属性、地下城、团本、套装和制造业装备筛选，收藏候选装备并分享配装方案。</p>
<h2>核心工具</h2>
<ul>
<li><a href="${urlPath(locale, 'build')}">魔兽世界配装模拟器</a></li>
<li><a href="${urlPath(locale, 'equipment')}">魔兽世界装备查询</a></li>
</ul>
<h2>职业配装入口</h2>
<ul>
${classes}
</ul>
<h2>配装工具能力</h2>
<ul>
<li>装备查询：按职业、专精、部位、副属性和来源筛选装备。</li>
<li>配装模拟：把候选装备加入收藏或本次配装清单，生成可分享链接。</li>
<li>排行榜配装：WCL 预设、天赋代码、附魔和宝石展示会在后续阶段接入网页端。</li>
</ul>
<h2>常见问题</h2>
<p>当前阶段先用中文版网页验收，中文页面通过后再恢复全语言 SEO 页面。</p>`;
  }
  return `<h1>${escapeHtml(i18n.t('seoTitle'))}</h1>
<p>${escapeHtml(i18n.t('seoDesc'))}</p>
<h2>${escapeHtml(i18n.t('filters.spec'))}</h2>
<ul>
${classes}
</ul>`;
}

function buildHomePage(locale, overview) {
  const meta = localizedMeta(locale);
  const canonical = absoluteUrl(locale);
  return htmlShell({
    locale,
    title: meta.title,
    description: meta.description,
    canonical,
    ogUrl: canonical,
    jsonLd: homeJsonLd(locale, meta),
    noscript: homeNoscript(locale, overview),
  });
}

function equipmentSearchNoscript(locale, overview) {
  if (locale === 'zh-CN') {
    const classes = (overview.classes || [])
      .map((cls) => `<li>${escapeHtml(localizedClassName(locale, cls.key, cls.name))} - ${escapeHtml(cls.itemCount || 0)} 件装备</li>`)
      .join('\n');
    return `<h1>魔兽世界装备查询</h1>
<p>按职业、专精、装备部位、副属性、地下城、团本和套装查询当前赛季装备，找到候选装备后可以切换到配装模拟器继续组装方案。</p>
<h2>职业装备入口</h2>
<ul>
${classes}
</ul>
<h2>配装模拟</h2>
<p>装备查询页与魔兽世界配装模拟器互相链接，支持从装备筛选进入完整装备槽配装流程。</p>`;
  }
  return `<h1>WoW Gear Search</h1>
<p>Search current season WoW gear by class, spec, slot, source and secondary stats, then switch to the gear planner.</p>`;
}

function buildEquipmentSearchPage(locale, overview) {
  const title = locale === 'zh-CN'
    ? '魔兽世界装备查询 — 装备掉落、属性与职业筛选 | SeasonLoot'
    : `WoW Gear Search | ${config.siteName}`;
  const description = locale === 'zh-CN'
    ? '查询魔兽世界当前赛季装备来源、职业可用装备、装等、副属性、部位、地下城、团本和套装，并可切换到配装模拟器继续组装方案。| SeasonLoot'
    : 'Search current season WoW gear by class, slot, source and stats, then switch to the gear planner when ready. | SeasonLoot';
  const canonical = absoluteUrl(locale, 'equipment');
  return htmlShell({
    locale,
    classKey: 'equipment',
    title,
    description,
    canonical,
    ogUrl: canonical,
    appAttrs: ' data-page="equipment"',
    jsonLd: homeJsonLd(locale, { description }),
    noscript: equipmentSearchNoscript(locale, overview),
  });
}

function buildSimulatorPathKey(buildClass = null, buildSpec = null) {
  if (!buildClass) return 'build';
  return buildSpec ? `build/${buildClass.key}/${buildSpec.id}` : `build/${buildClass.key}`;
}

function buildSimulatorName(locale, buildClass = null, buildSpec = null) {
  if (locale === 'zh-CN') {
    if (buildClass && buildSpec) return `${buildClass.name}${buildSpec.name}配装模拟器`;
    if (buildClass) return `${buildClass.name}配装模拟器`;
    return '魔兽世界配装模拟器';
  }
  if (buildClass && buildSpec) return `${buildClass.name} ${buildSpec.name} Gear Planner`;
  if (buildClass) return `${buildClass.name} Gear Planner`;
  return 'WoW Gear Planner';
}

// ───────── SEO 内容助手 (全本地数据, 生成期 0 COS) ─────────
const SEO_SLOT_ORDER = ['head', 'neck', 'shoulder', 'cloak', 'chest', 'wrist', 'hand', 'waist', 'legs', 'feet', 'finger', 'trinket', 'weapon'];
const isZh = (locale) => String(locale).startsWith('zh');

function specItems(classData, specId) {
  return flattenItems(classData.instances || []).filter((item) => {
    if (!Array.isArray(item.specs) || !item.specs.length) return true;
    return item.specs.includes(Number(specId));
  });
}

// 每部位可用最高装等装备 -> [{key, slot, name, ilvl, source}]
function bisBySlot(locale, items, localeData, fallbackData) {
  const best = {};
  items.forEach((item) => {
    const key = slotKey(item.slot);
    if (key === 'unknown') return;
    if (!best[key] || (item.ilvl || 0) > (best[key].ilvl || 0)) best[key] = item;
  });
  return SEO_SLOT_ORDER.filter((key) => best[key]).map((key) => ({
    key,
    slot: localizedSlot(locale, key),
    name: localizedItemName(best[key].id, localeData, fallbackData),
    ilvl: best[key].ilvl || 0,
    source: localizedInstanceName(locale, best[key].instanceId, best[key].instanceName),
  }));
}

function statTendencySentence(locale, specId, className, specName) {
  const t = STAT_TENDENCY.specs?.[String(specId)];
  if (!t || !t.order?.length || !t.avg) return '';
  const parts = t.order.map((type) => `${localizedStat(locale, type)} ≈ ${t.avg[type]}`);
  if (isZh(locale)) {
    return `据 WCL 高分日志统计（样本 ${t.sampleCount} 套），前列${className}${specName}每套装备的平均副属性 rating（按原始数值累积）依次为 ${parts.join('、')}。此为对高分日志装备的客观统计，非绝对最优优先级。`;
  }
  return `Based on top WCL logs (${t.sampleCount} builds), average secondary stat rating per ${className} ${specName} build (by raw rating) is ${parts.join(', ')}. An objective tally of top-log gear, not a prescriptive priority.`;
}

function masteryFact(locale, specId) {
  const m = MASTERY_COEFFICIENTS[String(specId)];
  if (!m || !isZh(locale)) return null; // 精通名目前仅有中文
  return { q: `${m.specName}${m.className}的精通是什么？`, a: `${m.masteryName}，主要提升${m.effect}。` };
}

// 事实 FAQ (A 类, 全部可核实) -> [{q,a}]
function specFactsFaq(locale, classData, className, specName, specId, items, overview) {
  const zh = isZh(locale);
  const armor = localizedArmorType(locale, classData.class?.armorType);
  const slotList = SEO_SLOT_ORDER.map((key) => localizedSlot(locale, key)).join(zh ? '、' : ', ');
  const sources = [...new Set(items.map((it) => localizedInstanceName(locale, it.instanceId, it.instanceName)).filter(Boolean))];
  const count = items.length;
  const faq = [];
  faq.push(zh
    ? { q: `${className}${specName}能穿什么护甲？`, a: `${className}使用${armor}。` }
    : { q: `What armor does ${className} ${specName} wear?`, a: `${className} uses ${armor}.` });
  faq.push(zh
    ? { q: `${className}${specName}有哪些装备槽？`, a: `配装涵盖以下部位：${slotList}（含双持/副手规则）。` }
    : { q: `Which gear slots does ${className} ${specName} use?`, a: `Builds cover these slots: ${slotList} (with weapon/off-hand rules).` });
  const mastery = masteryFact(locale, specId);
  if (mastery) faq.push(mastery);
  faq.push(zh
    ? { q: `本赛季${className}${specName}有多少可用装备、来自哪里？`, a: `当前赛季共有 ${count} 件可用装备，来源包括 ${sources.slice(0, 8).join('、')} 等。` }
    : { q: `How much ${className} ${specName} gear is available and where from?`, a: `${count} items this season, from sources such as ${sources.slice(0, 8).join(', ')}.` });
  const tendency = statTendencySentence(locale, specId, className, specName);
  if (tendency) faq.push(zh
    ? { q: `${className}${specName}的副属性怎么堆？`, a: tendency }
    : { q: `Which secondary stats do top ${className} ${specName} builds stack?`, a: tendency });
  faq.push(zh
    ? { q: `怎么用这个配装模拟器？`, a: `选择职业与专精，点击装备槽从当前专精可用装备中选装，实时查看平均装等、暴击/急速/精通/全能百分比与主属性、耐力；可保存方案、分享链接，或一键套用 WCL 排行榜配装。` }
    : { q: `How do I use this gear planner?`, a: `Pick a class and spec, click a slot to choose from spec-usable gear, and watch item level and crit/haste/mastery/versatility update live. Save builds, share links, or apply a WCL leaderboard build in one click.` });
  return faq;
}

function faqNoscriptHtml(faq) {
  return `<dl>${faq.map((item) => `\n<dt>${escapeHtml(item.q)}</dt>\n<dd>${escapeHtml(item.a)}</dd>`).join('')}\n</dl>`;
}

// 专精页(build/<class>/<spec>): 富内容 noscript — 介绍 + 事实FAQ + BiS + 可爬内链
function specSimulatorNoscript(locale, overview, buildClass, buildSpec, ctx) {
  const zh = isZh(locale);
  const pageName = buildSimulatorName(locale, buildClass, buildSpec);
  const className = buildClass.name;
  const specName = buildSpec.name;
  const { classData, localeData, fallbackData } = ctx;
  const items = specItems(classData, buildSpec.id);
  const faq = specFactsFaq(locale, classData, className, specName, buildSpec.id, items, overview);
  const bis = bisBySlot(locale, items, localeData, fallbackData);
  const siblings = (classData.specs || []).filter((spec) => spec.id !== buildSpec.id);

  const intro = zh
    ? `${pageName}：为${className}${specName}专精组装整套装备，实时计算平均装等、暴击/急速/精通/全能百分比与主属性、耐力，并可一键套用 WCL 排行榜配装。`
    : `${pageName}: assemble a full ${className} ${specName} build, compute item level and crit/haste/mastery/versatility live, and apply a WCL leaderboard build in one click.`;
  const faqHeading = zh ? '常见问题' : 'FAQ';
  const bisHeading = zh ? `${className}${specName}各部位可用最高装等装备` : `Highest item level ${className} ${specName} gear by slot`;
  const bisList = bis.map((row) => zh
    ? `<li>${escapeHtml(row.slot)}：${escapeHtml(row.name)}（ilvl ${escapeHtml(row.ilvl)}${row.source ? `，${escapeHtml(row.source)}` : ''}）</li>`
    : `<li>${escapeHtml(row.slot)}: ${escapeHtml(row.name)} (ilvl ${escapeHtml(row.ilvl)}${row.source ? `, ${escapeHtml(row.source)}` : ''})</li>`).join('\n');
  const relHeading = zh ? '相关页面' : 'Related pages';
  const relLinks = [
    ...siblings.map((spec) => {
      const sName = localizedSpecName(locale, spec);
      return `<li><a href="${urlPath(locale, `build/${buildClass.key}/${spec.id}`)}">${escapeHtml(zh ? `${className}${sName}配装` : `${className} ${sName} planner`)}</a></li>`;
    }),
    `<li><a href="${urlPath(locale, buildClass.key)}">${escapeHtml(zh ? `${className}装备查询` : `${className} gear`)}</a></li>`,
    `<li><a href="${urlPath(locale, 'equipment')}">${escapeHtml(zh ? '装备查询' : 'Gear search')}</a></li>`,
  ].join('\n');

  return `<h1>${escapeHtml(pageName)}</h1>
<p>${escapeHtml(intro)}</p>
<h2>${escapeHtml(faqHeading)}</h2>
${faqNoscriptHtml(faq)}
<h2>${escapeHtml(bisHeading)}</h2>
<ul>
${bisList}
</ul>
<h2>${escapeHtml(relHeading)}</h2>
<ul>
${relLinks}
</ul>`;
}

function buildSimulatorNoscript(locale, overview, buildClass = null, buildSpec = null, ctx = null) {
  if (buildClass && buildSpec && ctx?.classData) {
    return specSimulatorNoscript(locale, overview, buildClass, buildSpec, ctx);
  }
  const zh = isZh(locale);
  const pageName = buildSimulatorName(locale, buildClass, buildSpec);
  const classes = (overview.classes || [])
    .map((cls) => `<li><a href="${urlPath(locale, `build/${cls.key}`)}">${escapeHtml(zh ? `${localizedClassName(locale, cls.key, cls.name)}配装` : `${localizedClassName(locale, cls.key, cls.name)} planner`)}</a></li>`)
    .join('\n');
  const context = buildClass
    ? (zh ? `当前页面面向${escapeHtml(buildClass.name)}职业配装，选择专精后进入装备槽。` : `Pick a ${escapeHtml(buildClass.name)} spec to open the slot board.`)
    : (zh ? '选择职业和专精后进入装备槽。' : 'Pick a class and spec to open the slot board.');
  const slotsLine = zh
    ? '填入头、颈、肩、背、胸、腕、手、腰、腿、脚、戒指、饰品、主手和副手装备槽，查看平均装等、副属性百分比、主属性、耐力和护甲专精统计。'
    : 'Fill head, neck, shoulder, back, chest, wrist, hand, waist, legs, feet, ring, trinket, main-hand and off-hand slots to see item level, secondary stat percentages, primary stats, stamina and armor specialization.';
  const classesHeading = zh ? '支持职业' : 'Classes';
  return `<h1>${escapeHtml(pageName)}</h1>
<p>${context}${slotsLine}</p>
<h2>${escapeHtml(classesHeading)}</h2>
<ul>
${classes}
</ul>`;
}

function specSimulatorJsonLd(locale, buildClass, buildSpec, ctx, canonical, pageName, description) {
  const { classData, localeData, fallbackData } = ctx;
  const className = buildClass.name;
  const specName = buildSpec.name;
  const items = specItems(classData, buildSpec.id);
  const faq = specFactsFaq(locale, classData, className, specName, buildSpec.id, items, {});
  const bis = bisBySlot(locale, items, localeData, fallbackData);
  const home = locale === DEFAULT_LOCALE ? config.baseUrl : absoluteUrl(locale);
  const blocks = [];
  blocks.push({
    '@context': 'https://schema.org', '@type': 'SoftwareApplication', name: pageName,
    applicationCategory: 'GameApplication', operatingSystem: 'Web Browser', url: canonical,
    description: stripSeoBrand(description), inLanguage: locale,
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
  });
  blocks.push({
    '@context': 'https://schema.org', '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: config.siteName, item: home },
      { '@type': 'ListItem', position: 2, name: buildSimulatorName(locale, null, null), item: absoluteUrl(locale, 'build') },
      { '@type': 'ListItem', position: 3, name: buildSimulatorName(locale, buildClass, null), item: absoluteUrl(locale, `build/${buildClass.key}`) },
      { '@type': 'ListItem', position: 4, name: pageName, item: canonical },
    ],
  });
  if (bis.length) {
    blocks.push({
      '@context': 'https://schema.org', '@type': 'ItemList',
      name: isZh(locale) ? `${className}${specName}各部位最高装等装备` : `Highest item level ${className} ${specName} gear by slot`,
      url: canonical, numberOfItems: bis.length,
      itemListElement: bis.map((row, i) => ({
        '@type': 'ListItem', position: i + 1, name: row.name,
        description: [`ilvl ${row.ilvl}`, row.slot, row.source].filter(Boolean).join(' - '),
      })),
    });
  }
  if (faq.length) {
    blocks.push({
      '@context': 'https://schema.org', '@type': 'FAQPage',
      mainEntity: faq.map((item) => ({ '@type': 'Question', name: item.q, acceptedAnswer: { '@type': 'Answer', text: item.a } })),
    });
  }
  return blocks.map((block) => `<script type="application/ld+json">\n${JSON.stringify(block, null, 2)}\n</script>`).join('\n');
}

function buildSimulatorPage(locale, overview, buildClass = null, buildSpec = null, ctx = null) {
  const pathKey = buildSimulatorPathKey(buildClass, buildSpec);
  const pageName = buildSimulatorName(locale, buildClass, buildSpec);
  const isSpec = Boolean(buildClass && buildSpec && ctx?.classData);
  const zh = isZh(locale);
  const title = zh
    ? `${pageName} — ${isSpec ? '毕业装BiS与属性统计' : '装备槽与属性统计'} | SeasonLoot`
    : `${pageName}${isSpec ? ' — BiS & Stats' : ''} | ${config.siteName}`;
  let description;
  if (isSpec) {
    description = zh
      ? `${pageName}与毕业装(BiS)参考：按部位组装、实时计算装等与暴击/急速/精通/全能，并可一键套用 WCL 排行榜配装。| SeasonLoot`
      : `${pageName} and BiS reference: build by slot, live item level and secondary stats, and apply WCL leaderboard builds. | SeasonLoot`;
  } else {
    description = zh
      ? `${pageName}支持按装备槽组装方案，查看装等和属性统计，并保存或分享。| SeasonLoot`
      : `Create a ${pageName} build, fill equipment slots, review stats, save and share. | SeasonLoot`;
  }
  const canonical = absoluteUrl(locale, pathKey);
  return htmlShell({
    locale,
    classKey: pathKey,
    title,
    description,
    canonical,
    ogUrl: canonical,
    appAttrs: ' data-page="build"',
    jsonLd: isSpec ? specSimulatorJsonLd(locale, buildClass, buildSpec, ctx, canonical, pageName, description) : homeJsonLd(locale, { description }),
    noscript: buildSimulatorNoscript(locale, overview, buildClass, buildSpec, ctx),
  });
}

function classJsonLd(locale, classKey, className, classData, localeData, fallbackData, canonical) {
  const items = flattenItems(classData.instances);
  items.sort((a, b) => (b.ilvl || 0) - (a.ilvl || 0));
  const topItems = items.slice(0, 40);
  const breadcrumbHome = locale === DEFAULT_LOCALE ? config.baseUrl : absoluteUrl(locale);
  const meta = localizedMeta(locale, className);
  return `<script type="application/ld+json">
${JSON.stringify({
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  name: meta.heading,
  description: stripSeoBrand(meta.description),
  url: canonical,
  numberOfItems: items.length,
  itemListElement: topItems.map((item, index) => {
    const stats = secondaryStats(item).map((stat) => localizedStat(locale, stat));
    return {
      '@type': 'ListItem',
      position: index + 1,
      name: localizedItemName(item.id, localeData, fallbackData),
      description: [
        `ilvl ${item.ilvl || '?'}`,
        localizedSlot(locale, slotKey(item.slot)),
        stats.join(', '),
        localizedInstanceName(locale, item.instanceId, item.instanceName),
      ].filter(Boolean).join(' - '),
    };
  }),
}, null, 2)}
</script>
<script type="application/ld+json">
${JSON.stringify({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: config.siteName, item: breadcrumbHome },
    { '@type': 'ListItem', position: 2, name: className, item: canonical },
  ],
}, null, 2)}
</script>`;
}

function classNoscript(locale, classKey, className, classData, localeData, fallbackData, overview) {
  const i18n = i18nModule.createI18n(locale);
  const meta = localizedMeta(locale, className);
  const items = flattenItems(classData.instances);
  const armorType = localizedArmorType(locale, classData.class?.armorType);
  const specs = (classData.specs || []).map((spec) => localizedSpecName(locale, spec)).filter(Boolean).join(', ');

  const grouped = {};
  for (const item of items) {
    const key = slotKey(item.slot);
    if (key === 'unknown') continue;
    grouped[key] ||= [];
    grouped[key].push(item);
  }

  for (const key of Object.keys(grouped)) {
    grouped[key].sort((a, b) => (b.ilvl || 0) - (a.ilvl || 0));
    grouped[key] = grouped[key].slice(0, 10);
  }

  const sections = SLOT_ORDER.map((key) => {
    const slotItems = grouped[key];
    if (!slotItems?.length) return '';
    const rows = slotItems.map((item) => {
      const stats = secondaryStats(item).map((stat) => localizedStat(locale, stat));
      const statsText = stats.length ? ` (${stats.join(', ')})` : '';
      const source = localizedInstanceName(locale, item.instanceId, item.instanceName);
      return `<li>${escapeHtml(localizedItemName(item.id, localeData, fallbackData))} - ilvl ${escapeHtml(item.ilvl || '?')}${escapeHtml(statsText)} - ${escapeHtml(source)}</li>`;
    }).join('\n');
    return `<h3>${escapeHtml(localizedSlot(locale, key))}</h3>
<ul>
${rows}
</ul>`;
  }).filter(Boolean).join('\n');

  const sourceRows = [
    ...(overview.scope?.dungeons || []),
    ...(overview.scope?.raids || []),
  ].map((source) => `<li>${escapeHtml(localizedInstanceName(locale, source.id, source.name))}</li>`).join('\n');

  if (locale === 'zh-CN') {
    return `<h1>${escapeHtml(className)}配装模拟器</h1>
<p>${escapeHtml(className)}职业装备查询与配装模拟页面。当前装备池共 ${escapeHtml(items.length)} 件，支持按专精、部位、副属性、地下城、团本和套装筛选。</p>
<h2>${escapeHtml(className)}专精</h2>
<p>${escapeHtml(specs)}</p>
<h2>${escapeHtml(className)}装备槽位</h2>
${sections}
<h2>${escapeHtml(className)}装备来源</h2>
<ul>
${sourceRows}
</ul>
<h2>配装模拟</h2>
<p>你可以在网页端收藏候选装备、分享配装链接，并在后续版本使用完整装备槽和 WCL 排行榜配装功能。</p>`;
  }

  return `<h1>${escapeHtml(meta.heading)}</h1>
<p>${escapeHtml(stripSeoBrand(meta.description))}</p>
<p>${escapeHtml(className)}${armorType ? ` - ${escapeHtml(armorType)}` : ''}. ${escapeHtml(specs)}</p>
<h2>${escapeHtml(className)} ${escapeHtml(i18n.t('filters.slot'))}</h2>
${sections}
<h2>${escapeHtml(i18n.t('filters.source'))}</h2>
<ul>
${sourceRows}
</ul>`;
}

function buildClassPage(locale, classKey, classData, overview, fallbackData) {
  const className = localizedClassName(locale, classKey, classData.class?.name);
  const meta = localizedMeta(locale, className);
  const canonical = absoluteUrl(locale, classKey);
  const localeData = readLocaleData(locale, classKey);
  return htmlShell({
    locale,
    classKey,
    title: meta.title,
    description: meta.description,
    canonical,
    ogUrl: canonical,
    appAttrs: ` data-class="${escapeHtml(classKey)}"`,
    jsonLd: classJsonLd(locale, classKey, className, classData, localeData, fallbackData, canonical),
    noscript: classNoscript(locale, classKey, className, classData, localeData, fallbackData, overview),
  });
}

function sitemapEntry(locale, classKey = '', lastmod) {
  const loc = absoluteUrl(locale, classKey);
  const alternates = [
    ...localeConfigs.map((item) => `    <xhtml:link rel="alternate" hreflang="${escapeXml(item.hreflang)}" href="${escapeXml(absoluteUrl(item.locale, classKey))}" />`),
    `    <xhtml:link rel="alternate" hreflang="x-default" href="${escapeXml(absoluteUrl(DEFAULT_LOCALE, classKey))}" />`,
  ].join('\n');
  return `  <url>
    <loc>${escapeXml(loc)}</loc>
    <lastmod>${escapeXml(lastmod)}</lastmod>
${alternates}
  </url>`;
}

function buildSitemap(overview) {
  const lastmod = String(overview.updatedAt || new Date().toISOString()).slice(0, 10);
  const entries = [];
  for (const locale of localeConfigs.map((item) => item.locale)) {
    entries.push(sitemapEntry(locale, '', lastmod));
  }
  for (const toolKey of ['equipment', 'build']) {
    for (const locale of localeConfigs.map((item) => item.locale)) {
      entries.push(sitemapEntry(locale, toolKey, lastmod));
    }
  }
  for (const cls of overview.classes || []) {
    const classDataPath = path.join(DATA_DIR, `${cls.key}.json`);
    const classData = fs.existsSync(classDataPath) ? readJSON(classDataPath) : null;
    for (const locale of localeConfigs.map((item) => item.locale)) {
      entries.push(sitemapEntry(locale, `build/${cls.key}`, lastmod));
      for (const spec of classData?.specs || []) {
        entries.push(sitemapEntry(locale, `build/${cls.key}/${spec.id}`, lastmod));
      }
      entries.push(sitemapEntry(locale, cls.key, lastmod));
    }
  }
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${entries.join('\n')}
</urlset>
`;
}

function writePage(locale, classKey, html) {
  const localeInfo = localeConfig(locale);
  writePageToSlug(localeInfo.slug, classKey, html);
}

function writePageToSlug(slug, classKey, html) {
  const segments = [];
  if (slug) segments.push(slug);
  segments.push(...pathSegmentsFor(classKey));
  const outDir = segments.length ? path.join(WEB_DIR, ...segments) : WEB_DIR;
  writeFile(path.join(outDir, 'index.html'), html);
}

function main() {
  const overview = readJSON(path.join(DATA_DIR, 'overview.json'));
  let pageCount = 0;

  for (const locale of localeConfigs.map((item) => item.locale)) {
    writePage(locale, '', buildHomePage(locale, overview));
    pageCount++;
  }

  for (const alias of aliasConfigs) {
    writePageToSlug(alias.slug, '', buildHomePage(alias.locale, overview));
    pageCount++;
  }

  for (const locale of localeConfigs.map((item) => item.locale)) {
    writePage(locale, 'equipment', buildEquipmentSearchPage(locale, overview));
    pageCount++;
  }

  for (const alias of aliasConfigs) {
    writePageToSlug(alias.slug, 'equipment', buildEquipmentSearchPage(alias.locale, overview));
    pageCount++;
  }

  for (const locale of localeConfigs.map((item) => item.locale)) {
    writePage(locale, 'build', buildSimulatorPage(locale, overview));
    pageCount++;
  }

  for (const alias of aliasConfigs) {
    writePageToSlug(alias.slug, 'build', buildSimulatorPage(alias.locale, overview));
    pageCount++;
  }

  for (const cls of overview.classes || []) {
    const classKey = cls.key;
    const classDataPath = path.join(DATA_DIR, `${classKey}.json`);
    if (!fs.existsSync(classDataPath)) {
      console.warn(`Skipping ${classKey}: data file not found`);
      continue;
    }
    const classData = readJSON(classDataPath);
    const fallbackData = readLocaleData(DEFAULT_LOCALE, classKey);

    for (const locale of localeConfigs.map((item) => item.locale)) {
      const buildClass = {
        key: classKey,
        name: localizedClassName(locale, classKey, classData.class?.name),
      };
      writePage(locale, `build/${classKey}`, buildSimulatorPage(locale, overview, buildClass));
      pageCount++;
      const localeData = readLocaleData(locale, classKey);
      const specCtx = { classData, localeData, fallbackData };
      for (const spec of classData.specs || []) {
        writePage(locale, `build/${classKey}/${spec.id}`, buildSimulatorPage(locale, overview, buildClass, {
          id: spec.id,
          name: localizedSpecName(locale, spec),
        }, specCtx));
        pageCount++;
      }
      writePage(locale, classKey, buildClassPage(locale, classKey, classData, overview, fallbackData));
      pageCount++;
    }

    for (const alias of aliasConfigs) {
      const buildClass = {
        key: classKey,
        name: localizedClassName(alias.locale, classKey, classData.class?.name),
      };
      writePageToSlug(alias.slug, `build/${classKey}`, buildSimulatorPage(alias.locale, overview, buildClass));
      pageCount++;
      const aliasLocaleData = readLocaleData(alias.locale, classKey);
      const aliasSpecCtx = { classData, localeData: aliasLocaleData, fallbackData };
      for (const spec of classData.specs || []) {
        writePageToSlug(alias.slug, `build/${classKey}/${spec.id}`, buildSimulatorPage(alias.locale, overview, buildClass, {
          id: spec.id,
          name: localizedSpecName(alias.locale, spec),
        }, aliasSpecCtx));
        pageCount++;
      }
      writePageToSlug(alias.slug, classKey, buildClassPage(alias.locale, classKey, classData, overview, fallbackData));
      pageCount++;
    }
  }

  writeFile(path.join(WEB_DIR, 'sitemap.xml'), buildSitemap(overview));
  writeFile(path.join(WEB_DIR, 'robots.txt'), `User-agent: *
Allow: /

Sitemap: ${config.baseUrl}/sitemap.xml
`);

  console.log(`Generated ${pageCount} localized SEO pages.`);
  console.log('Generated sitemap.xml and robots.txt.');
}

main();
