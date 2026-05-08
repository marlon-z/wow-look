const fs = require('fs');
const path = require('path');

const WEB_DIR = __dirname;
const DATA_DIR = path.join(WEB_DIR, 'data-4.2.x');
const LOCALE_DIR = path.join(WEB_DIR, 'locales', 'en-US', 'data');
const BASE_URL = 'https://seasonloot.com';
const CACHE_BUST = '20260508-seo';

const EN_CLASSES = {
  warrior: 'Warrior', paladin: 'Paladin', hunter: 'Hunter', rogue: 'Rogue',
  priest: 'Priest', deathknight: 'Death Knight', shaman: 'Shaman', mage: 'Mage',
  warlock: 'Warlock', monk: 'Monk', druid: 'Druid', demonhunter: 'Demon Hunter',
  evoker: 'Evoker',
};

const EN_SPECS = {
  71: 'Arms', 72: 'Fury', 73: 'Protection',
  65: 'Holy', 66: 'Protection', 70: 'Retribution',
  253: 'Beast Mastery', 254: 'Marksmanship', 255: 'Survival',
  259: 'Assassination', 260: 'Outlaw', 261: 'Subtlety',
  256: 'Discipline', 257: 'Holy', 258: 'Shadow',
  250: 'Blood', 251: 'Frost', 252: 'Unholy',
  262: 'Elemental', 263: 'Enhancement', 264: 'Restoration',
  62: 'Arcane', 63: 'Fire', 64: 'Frost',
  265: 'Affliction', 266: 'Demonology', 267: 'Destruction',
  268: 'Brewmaster', 269: 'Windwalker', 270: 'Mistweaver',
  102: 'Balance', 103: 'Feral', 104: 'Guardian', 105: 'Restoration',
  577: 'Havoc', 581: 'Vengeance',
  1467: 'Devastation', 1468: 'Preservation', 1473: 'Augmentation', 1474: 'Devourer',
};

const EN_INSTANCES = {
  945: 'Seat of the Triumvirate', 476: 'Skyreach', 1315: 'Mythsara Caverns',
  1299: "Windrunner's Tower", 278: 'Pit of Saron', 1300: "Magisters' Terrace",
  1316: 'Node Shinas', 1201: "Algeth'ar Academy",
  1314: 'Dream Rift', 1307: 'Void Spire', 1308: "March on Quel'Danas",
  0: 'Class Sets',
};

const SLOT_NAMES = {
  head: 'Head', neck: 'Neck', shoulder: 'Shoulder', cloak: 'Cloak', back: 'Cloak',
  chest: 'Chest', wrist: 'Wrist', hand: 'Hands', hands: 'Hands', waist: 'Waist',
  legs: 'Legs', feet: 'Feet', finger: 'Ring', trinket: 'Trinket',
  weapon: 'Weapon', 'one-hand': 'Weapon', 'two-hand': 'Weapon', 'main-hand': 'Weapon',
  'off-hand': 'Off-Hand', shield: 'Shield', ranged: 'Ranged',
};

const STAT_NAMES = { crit: 'Crit', haste: 'Haste', mastery: 'Mastery', versatility: 'Vers' };

const ARMOR_TYPES = { plate: 'Plate', mail: 'Mail', leather: 'Leather', cloth: 'Cloth' };

const HREFLANG_MAP = [
  { hreflang: 'en', locale: 'en-US' },
  { hreflang: 'zh', locale: 'zh-CN' },
  { hreflang: 'de', locale: 'de-DE' },
  { hreflang: 'fr', locale: 'fr-FR' },
  { hreflang: 'es', locale: 'es-ES' },
  { hreflang: 'pt', locale: 'pt-BR' },
  { hreflang: 'it', locale: 'it-IT' },
  { hreflang: 'ru', locale: 'ru-RU' },
  { hreflang: 'ko', locale: 'ko-KR' },
];

function readJSON(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

function escapeHtml(str) {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function flattenItems(instances) {
  const items = [];
  const seen = new Set();
  for (const inst of instances) {
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

function getSecondaryStats(item) {
  const secondary = item.stats?.secondary || [];
  return secondary.map(s => STAT_NAMES[s.type] || s.type).filter(Boolean);
}

function getEnglishName(itemId, localeData) {
  const entry = localeData.items?.[String(itemId)];
  return entry?.name || null;
}

function getInstanceName(instanceId) {
  if (typeof instanceId === 'string' && instanceId.startsWith('tier:')) return 'Class Sets';
  return EN_INSTANCES[instanceId] || null;
}

function getSlotGroup(slot) {
  if (!slot) return null;
  const s = slot.toLowerCase();
  if (SLOT_NAMES[s]) return SLOT_NAMES[s];
  if (s.includes('weapon') || s.includes('hand')) return 'Weapon';
  return null;
}

function buildNoscript(className, classData, localeData, overview) {
  const items = flattenItems(classData.instances || []);
  const armorType = ARMOR_TYPES[classData.class?.armorType] || '';
  const specs = (classData.specs || []).map(s => EN_SPECS[s.id] || s.name).join(', ');

  const grouped = {};
  for (const item of items) {
    const slotGroup = getSlotGroup(item.slot);
    if (!slotGroup) continue;
    if (!grouped[slotGroup]) grouped[slotGroup] = [];
    grouped[slotGroup].push(item);
  }

  for (const slot of Object.keys(grouped)) {
    grouped[slot].sort((a, b) => (b.ilvl || 0) - (a.ilvl || 0));
    grouped[slot] = grouped[slot].slice(0, 8);
  }

  const slotOrder = ['Head', 'Neck', 'Shoulder', 'Cloak', 'Chest', 'Wrist', 'Hands', 'Waist', 'Legs', 'Feet', 'Ring', 'Trinket', 'Weapon', 'Off-Hand', 'Shield'];
  let html = '';
  html += `<h1>WoW ${escapeHtml(className)} Loot Table &mdash; Midnight Season 1</h1>\n`;
  html += `<p>${escapeHtml(className)} (${escapeHtml(armorType)} armor) has ${items.length}+ gear drops across 8 dungeons and 3 raids in WoW Midnight Season 1. Specializations: ${escapeHtml(specs)}.</p>\n`;

  html += `<h2>${escapeHtml(className)} Gear by Slot</h2>\n`;
  for (const slot of slotOrder) {
    const slotItems = grouped[slot];
    if (!slotItems || slotItems.length === 0) continue;
    html += `<h3>${escapeHtml(slot)}</h3>\n<ul>\n`;
    for (const item of slotItems) {
      const name = getEnglishName(item.id, localeData) || `Item #${item.id}`;
      const stats = getSecondaryStats(item);
      const statsStr = stats.length ? ` (${stats.join(', ')})` : '';
      const source = getInstanceName(item.instanceId) || item.instanceName || '';
      html += `<li>${escapeHtml(name)} - ilvl ${item.ilvl || '?'}${escapeHtml(statsStr)} - ${escapeHtml(source)}</li>\n`;
    }
    html += `</ul>\n`;
  }

  html += `<h2>Dungeon &amp; Raid Sources</h2>\n<ul>\n`;
  const dungeons = overview.scope?.dungeons || [];
  const raids = overview.scope?.raids || [];
  for (const d of dungeons) {
    html += `<li>${escapeHtml(EN_INSTANCES[d.id] || d.name)}</li>\n`;
  }
  for (const r of raids) {
    html += `<li>${escapeHtml(EN_INSTANCES[r.id] || r.name)}</li>\n`;
  }
  html += `</ul>\n`;

  return html;
}

function buildJsonLd(className, classKey, classData, localeData) {
  const items = flattenItems(classData.instances || []);
  items.sort((a, b) => (b.ilvl || 0) - (a.ilvl || 0));
  const top20 = items.slice(0, 20);

  const itemList = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `${className} Loot Table — WoW Midnight Season 1`,
    description: `Complete list of ${className} gear drops from dungeons and raids in World of Warcraft Midnight Season 1.`,
    url: `${BASE_URL}/${classKey}/`,
    numberOfItems: items.length,
    itemListElement: top20.map((item, i) => {
      const name = getEnglishName(item.id, localeData) || `Item #${item.id}`;
      const stats = getSecondaryStats(item);
      const slotName = getSlotGroup(item.slot) || item.slot || '';
      return {
        '@type': 'ListItem',
        position: i + 1,
        name,
        description: `ilvl ${item.ilvl || '?'} ${slotName} - ${stats.join(', ')}`,
      };
    }),
  };

  const armorType = ARMOR_TYPES[classData.class?.armorType] || '';
  const instanceCount = (classData.instances || []).length;

  const faq = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: `What gear can a ${className} get in Midnight Season 1?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `${className}s can equip ${armorType} armor and access ${items.length}+ gear drops across ${instanceCount} instances in Midnight Season 1, including dungeon and raid loot.`,
        },
      },
      {
        '@type': 'Question',
        name: `How do I find ${className} loot by stat?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `Use the filter bar to select crit, haste, mastery, or versatility. SeasonLoot shows which secondary stats each ${className} item has so you can target your preferred gear.`,
        },
      },
    ],
  };

  return `<script type="application/ld+json">\n${JSON.stringify(itemList, null, 2)}\n</script>\n<script type="application/ld+json">\n${JSON.stringify(faq, null, 2)}\n</script>`;
}

function buildClassPage(classKey, className, classData, localeData, overview) {
  const itemCount = (overview.classes.find(c => c.key === classKey) || {}).itemCount || 0;
  const lowerClass = className.toLowerCase();

  const hreflangs = HREFLANG_MAP.map(h =>
    `<link rel="alternate" hreflang="${h.hreflang}" href="${BASE_URL}/${classKey}/?lang=${h.locale}">`
  ).join('\n    ');

  const jsonLd = buildJsonLd(className, classKey, classData, localeData);
  const noscript = buildNoscript(className, classData, localeData, overview);

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
    <meta name="theme-color" content="#09080d">
    <title>WoW ${escapeHtml(className)} Loot Table &mdash; Midnight Season 1 | SeasonLoot</title>
    <meta name="description" content="Browse ${itemCount}+ ${escapeHtml(className)} gear drops in WoW Midnight Season 1. Filter by slot, stats &amp; source across 8 dungeons and 3 raids. | SeasonLoot">
    <meta name="keywords" content="wow ${lowerClass} loot table, wow ${lowerClass} gear, wow ${lowerClass} bis, ${lowerClass} midnight drops, ${lowerClass} dungeon loot">
    <link rel="icon" href="../assets/public/logo.png">
    <link rel="canonical" href="${BASE_URL}/${classKey}/">
    ${hreflangs}
    <link rel="alternate" hreflang="x-default" href="${BASE_URL}/${classKey}/">
    <meta property="og:type" content="website">
    <meta property="og:title" content="WoW ${escapeHtml(className)} Loot Table &mdash; Midnight Season 1 | SeasonLoot">
    <meta property="og:description" content="Browse ${itemCount}+ ${escapeHtml(className)} gear drops. Filter by slot, stats &amp; source.">
    <meta property="og:image" content="${BASE_URL}/assets/public/og-card.png">
    <meta property="og:url" content="${BASE_URL}/${classKey}/">
    <meta property="og:site_name" content="SeasonLoot">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="WoW ${escapeHtml(className)} Loot Table &mdash; Midnight Season 1 | SeasonLoot">
    <meta name="twitter:description" content="Browse ${itemCount}+ ${escapeHtml(className)} gear drops. Filter by slot, stats &amp; source.">
    <meta name="twitter:image" content="${BASE_URL}/assets/public/og-card.png">
    ${jsonLd}
    <link rel="stylesheet" href="../styles.css?v=${CACHE_BUST}">
  </head>
  <body>
    <div id="app" data-class="${classKey}"></div>
    <noscript>
      ${noscript}
    </noscript>
    <script type="module" src="../app.js?v=${CACHE_BUST}"></script>
  </body>
</html>
`;
}

function main() {
  const overview = readJSON(path.join(DATA_DIR, 'overview.json'));
  let count = 0;

  for (const cls of overview.classes) {
    const classKey = cls.key;
    const className = EN_CLASSES[classKey] || cls.name;

    const classDataPath = path.join(DATA_DIR, `${classKey}.json`);
    if (!fs.existsSync(classDataPath)) {
      console.warn(`Skipping ${classKey}: data file not found`);
      continue;
    }
    const classData = readJSON(classDataPath);

    const localeDataPath = path.join(LOCALE_DIR, `${classKey}.json`);
    const localeData = fs.existsSync(localeDataPath) ? readJSON(localeDataPath) : { items: {} };

    const outDir = path.join(WEB_DIR, classKey);
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

    const html = buildClassPage(classKey, className, classData, localeData, overview);
    fs.writeFileSync(path.join(outDir, 'index.html'), html, 'utf-8');
    count++;
    console.log(`Generated: ${classKey}/index.html`);
  }

  console.log(`\nDone! Generated ${count} class pages.`);
}

main();
