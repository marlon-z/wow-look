const fs = require('fs');
const path = require('path');

const OLD_DIR = path.join(__dirname, '..', 'cos-upload', 'data');
const NEW_DIR = path.join(__dirname, '..', 'cos-upload', 'data-4.2.x');
const TIER_LUA = path.join(__dirname, '..', 'WoWLookTierExport copy 2.lua');

const CLASS_KEYS = ['warrior','paladin','hunter','rogue','priest','deathknight','shaman','mage','warlock','monk','druid','demonhunter','evoker'];

const SLOT_MAP = {
  back: '背部',
  wrist: '手腕',
  waist: '腰部',
  feet: '脚',
};

const ARMOR_TYPE_MAP = {
  warrior: 'plate', paladin: 'plate', deathknight: 'plate',
  hunter: 'mail', shaman: 'mail', evoker: 'mail',
  rogue: 'leather', monk: 'leather', druid: 'leather', demonhunter: 'leather',
  priest: 'cloth', mage: 'cloth', warlock: 'cloth',
};

const CLASS_ICON_KEY = {
  warrior: 'warrior', paladin: 'paladin', hunter: 'hunter', rogue: 'rogue',
  priest: 'priest', deathknight: 'deathknight', shaman: 'shaman', mage: 'mage',
  warlock: 'warlock', monk: 'monk', druid: 'druid', demonhunter: 'demonhunter',
  evoker: 'evoker',
};

const SLOT_ICON_KEY = {
  back: 'cape', wrist: 'bracer', waist: 'belt', feet: 'boot',
};

function parseTierExport() {
  let lua = fs.readFileSync(TIER_LUA, 'utf8');
  if (lua.charCodeAt(0) === 0xFEFF) lua = lua.slice(1);
  const ps = lua.indexOf('"payload"');
  const eq = lua.indexOf('=', ps);
  const qs = lua.indexOf('"', eq + 1) + 1;
  let i = qs;
  while (i < lua.length) {
    if (lua[i] === '\\' && i + 1 < lua.length) { i += 2; continue; }
    if (lua[i] === '"') break;
    i++;
  }
  let raw = lua.substring(qs, i);
  raw = raw.replace(/\\"/g, '"').replace(/\\\\/g, '\\');
  return JSON.parse(raw);
}

function guessIconName(classKey, slotKey) {
  const armor = ARMOR_TYPE_MAP[classKey];
  const slotPart = SLOT_ICON_KEY[slotKey] || slotKey;
  return `inv_${slotPart}_${armor}_raid${classKey}midnight_d_01`;
}

function buildExtraItem(tierItem, classKey, oldBonusItem, setName, allPieceNames) {
  const app = tierItem.appearance || {};
  const slotKey = app.slotKey;
  const slotName = SLOT_MAP[slotKey] || slotKey;
  const armorType = ARMOR_TYPE_MAP[classKey];
  const armorTypeName = { plate: '板甲', mail: '锁甲', leather: '皮甲', cloth: '布甲' }[armorType];

  const tooltip = tierItem.tooltip && tierItem.tooltip.parsed ? tierItem.tooltip.parsed : {};
  const primaryStats = (tooltip.primaryStats || []).map(s => ({
    key: s.key, type: s.key, name: s.name, value: s.value
  }));
  const secondaryStats = (tooltip.secondaryStats || []).map(s => ({
    key: s.key, type: s.key, name: s.name, value: s.value
  }));
  const stamina = tooltip.stamina ? {
    key: 'stamina', type: 'stamina', name: tooltip.stamina.name, value: tooltip.stamina.value
  } : null;
  const armor_val = tooltip.white && tooltip.white.armor ? tooltip.white.armor : 0;

  const rawLines = [];
  if (tierItem.tooltip && tierItem.tooltip.rawLines) {
    tierItem.tooltip.rawLines.forEach(l => {
      const line = (l.left || '').trim();
      if (line && line !== ' ') {
        const full = l.right ? `${l.left} ${l.right}`.trim() : line;
        rawLines.push(full);
      }
    });
  }

  const iconName = guessIconName(classKey, slotKey);

  return {
    id: tierItem.itemId,
    name: tierItem.name,
    icon: tierItem.icon || 0,
    iconName: iconName,
    iconAsset: `/assets/icons/${iconName}.jpg`,
    slot: slotKey,
    slotName: slotName,
    armorType: armorType,
    armorTypeName: armorTypeName,
    itemType: tierItem.itemType || '护甲',
    itemSubType: tierItem.itemSubType || armorTypeName,
    ilvl: tierItem.itemLevel || 263,
    specs: oldBonusItem.specs || [],
    classes: oldBonusItem.classes || [],
    quality: tierItem.quality || 4,
    upgradeTrack: tooltip.upgradeTrack || '英雄 2/6',
    tooltipFlags: tooltip.flags || { prismaticSocket: false, uniqueEquipped: false },
    stats: {
      primaryStats,
      stamina,
      secondary: secondaryStats,
      effects: { equip: '', use: '' },
      white: { armor: armor_val },
    },
    source: {
      instanceId: `tier:${classKey}`,
      instanceName: '套装',
      isRaid: false,
      encounterId: `tier-set:${classKey}`,
      encounterName: setName,
      difficulty: 5,
      difficultyName: '英雄 2/6',
      order: 999,
    },
    sourceType: 'tier',
    tooltipRaw: rawLines,
    link: tierItem.seasonLink || '',
    iconText: tierItem.name ? tierItem.name.charAt(0) : '?',
    tier: {
      setId: tierItem.setId || oldBonusItem.tier.setId || 0,
      setName,
      pieceCount: 9,
      pieces: allPieceNames,
      bonusesBySpec: oldBonusItem.tier.bonusesBySpec || {},
      sourceLabel: '套装',
      isBonusPiece: false,
      appearanceOnly: true,
    },
  };
}

function main() {
  console.log('Parsing tier export...');
  const tierData = parseTierExport();
  console.log(`Found ${tierData.classes.length} classes in tier export`);

  const tierByClass = {};
  tierData.classes.forEach(cls => {
    tierByClass[cls.classKey] = cls;
  });

  if (!fs.existsSync(NEW_DIR)) {
    fs.mkdirSync(NEW_DIR, { recursive: true });
  }

  CLASS_KEYS.forEach(classKey => {
    const oldFile = path.join(OLD_DIR, `${classKey}.json`);
    if (!fs.existsSync(oldFile)) {
      console.log(`  SKIP ${classKey}: no old data`);
      return;
    }

    const oldData = JSON.parse(fs.readFileSync(oldFile, 'utf8'));
    const tierCls = tierByClass[classKey];

    if (!tierCls) {
      console.log(`  ${classKey}: no tier export, copying as-is`);
      fs.writeFileSync(path.join(NEW_DIR, `${classKey}.json`), JSON.stringify(oldData, null, 2), 'utf8');
      return;
    }

    const tierInstanceIdx = oldData.instances.findIndex(inst => inst.type === 'tier');
    if (tierInstanceIdx === -1) {
      console.log(`  ${classKey}: no tier instance in old data, skipping`);
      fs.writeFileSync(path.join(NEW_DIR, `${classKey}.json`), JSON.stringify(oldData, null, 2), 'utf8');
      return;
    }

    const tierInst = oldData.instances[tierInstanceIdx];
    const oldItems = tierInst.encounters[0].items;
    const oldBonusRef = oldItems[0];

    const allPieceNames = tierCls.items.map(i => i.name);
    const setName = tierCls.items[0].appearance.transmogSetName;

    const extraTierItems = tierCls.items.filter(i => i.appearance && !i.appearance.isBonusPiece);
    const newExtraItems = extraTierItems.map(ti => buildExtraItem(ti, classKey, oldBonusRef, setName, allPieceNames));

    // Update old bonus items: expand pieces list and pieceCount
    oldItems.forEach(item => {
      if (item.tier) {
        item.tier.pieces = allPieceNames;
        item.tier.pieceCount = 9;
        item.tier.isBonusPiece = true;
      }
    });

    // Append new extra items
    tierInst.encounters[0].items = [...oldItems, ...newExtraItems];
    console.log(`  ${classKey}: kept ${oldItems.length} bonus + added ${newExtraItems.length} appearance = ${tierInst.encounters[0].items.length} total (set: ${setName})`);

    oldData.version = '4.2.x';
    fs.writeFileSync(path.join(NEW_DIR, `${classKey}.json`), JSON.stringify(oldData, null, 2), 'utf8');
  });

  // Copy and update overview
  const oldOverview = JSON.parse(fs.readFileSync(path.join(OLD_DIR, 'overview.json'), 'utf8'));
  if (oldOverview.classes) {
    oldOverview.classes.forEach(cls => {
      const tierCls = tierByClass[cls.key];
      if (tierCls) {
        const extraCount = tierCls.items.filter(i => i.appearance && !i.appearance.isBonusPiece).length;
        cls.itemCount = (cls.itemCount || 0) + extraCount;
      }
    });
  }
  oldOverview.version = '4.2.x';
  fs.writeFileSync(path.join(NEW_DIR, 'overview.json'), JSON.stringify(oldOverview, null, 2), 'utf8');

  console.log('\nDone!');
  console.log(`Files written to: ${NEW_DIR}`);
}

main();
