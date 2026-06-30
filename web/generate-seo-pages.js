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

function buildSimulatorNoscript(locale, overview, buildClass = null, buildSpec = null) {
  const pageName = buildSimulatorName(locale, buildClass, buildSpec);
  if (locale === 'zh-CN') {
    const classes = (overview.classes || [])
      .map((cls) => `<li><a href="${urlPath(locale, `build/${cls.key}`)}">${escapeHtml(localizedClassName(locale, cls.key, cls.name))}配装</a></li>`)
      .join('\n');
    const context = buildClass && buildSpec
      ? `当前页面面向${escapeHtml(buildClass.name)}${escapeHtml(buildSpec.name)}专精配装。`
      : (buildClass ? `当前页面面向${escapeHtml(buildClass.name)}职业配装，选择专精后进入装备槽。` : '选择职业和专精后进入装备槽。');
    return `<h1>${escapeHtml(pageName)}</h1>
<p>${context}填入头、项链、肩、披风、胸、衬衣、战袍、护腕、手、腰、腿、脚、戒指、饰品、主手和副手装备槽，查看平均装等、副属性百分比、主属性、耐力和护甲专精统计。</p>
<h2>支持职业</h2>
<ul>
${classes}
</ul>
<h2>当前阶段</h2>
<p>当前页面已支持手动配装、保存方案、分享链接、制造业随机属性选择和 WCL 排行榜配装。排行榜配装可按大秘境、团本、层数和首领选择预设，并一键套用到模拟器。</p>`;
  }
  return `<h1>${escapeHtml(pageName)}</h1>
<p>Select a class and spec, fill equipment slots, review item level and stat totals, then save and share the build.</p>`;
}

function buildSimulatorPage(locale, overview, buildClass = null, buildSpec = null) {
  const pathKey = buildSimulatorPathKey(buildClass, buildSpec);
  const pageName = buildSimulatorName(locale, buildClass, buildSpec);
  const title = locale === 'zh-CN'
    ? `${pageName} — 装备槽与属性统计 | SeasonLoot`
    : `${pageName} | ${config.siteName}`;
  const description = locale === 'zh-CN'
    ? `${pageName}支持按头、项链、肩、胸、衬衣、战袍、饰品、戒指、主手和副手等装备槽组装方案，查看装等和属性统计，并保存或分享。| SeasonLoot`
    : `Create a ${pageName} build, fill equipment slots, review stats, save and share builds. | SeasonLoot`;
  const canonical = absoluteUrl(locale, pathKey);
  return htmlShell({
    locale,
    classKey: pathKey,
    title,
    description,
    canonical,
    ogUrl: canonical,
    appAttrs: ' data-page="build"',
    jsonLd: homeJsonLd(locale, { description }),
    noscript: buildSimulatorNoscript(locale, overview, buildClass, buildSpec),
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
      for (const spec of classData.specs || []) {
        writePage(locale, `build/${classKey}/${spec.id}`, buildSimulatorPage(locale, overview, buildClass, {
          id: spec.id,
          name: localizedSpecName(locale, spec),
        }));
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
      for (const spec of classData.specs || []) {
        writePageToSlug(alias.slug, `build/${classKey}/${spec.id}`, buildSimulatorPage(alias.locale, overview, buildClass, {
          id: spec.id,
          name: localizedSpecName(alias.locale, spec),
        }));
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
