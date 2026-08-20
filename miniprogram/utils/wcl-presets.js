var { getAssetBase } = require('./class-data');
var { flattenItems, buildStatLine } = require('./equipment');
var { updateBuild } = require('./builds');

var STAT_NAME = {
  crit: '暴击',
  haste: '急速',
  mastery: '精通',
  versatility: '全能',
};

var SLOT_LABEL = {
  head: '头部', neck: '颈部', shoulder: '肩部', cloak: '背部', chest: '胸甲',
  wrist: '护腕', hand: '手套', waist: '腰带', legs: '腿部', feet: '脚',
  finger1: '戒指', finger2: '戒指', trinket1: '饰品', trinket2: '饰品',
  weapon: '武器', weapon2: '副手',
};
var SLOT_ORDER = ['head', 'neck', 'shoulder', 'cloak', 'chest', 'wrist', 'hand',
  'waist', 'legs', 'feet', 'finger1', 'finger2', 'trinket1', 'trinket2', 'weapon', 'weapon2'];

// 从预设槽位提取"附魔宝石"展示列表(只含有附魔或宝石的部位); 名字已由后端按映射表写好。
function buildEnchantsGems(presetSlots) {
  var list = [];
  SLOT_ORDER.forEach(function (key) {
    var s = presetSlots && presetSlots[key];
    if (!s) return;
    var enchant = s.enchantName || '';
    var gems = (s.gems || []).map(function (g) { return g.name || ''; }).filter(Boolean);
    if (!enchant && !gems.length) return;
    list.push({
      key: key,
      slot: SLOT_LABEL[key] || key,
      enchant: enchant,
      gemText: gems.join('、'),
    });
  });
  return list;
}

// WCL 预设独立使用 COS：装备库已全部改成本地包，不能复用 class-data 的数据目录或地址。
var WCL_COS_BASE = 'https://wowlook-1308073800.cos.ap-guangzhou.myqcloud.com';
var WCL_DATA_DIR = 'data-12.1';
var WCL_REMOTE_PREFIX = 'wcl-presets/' + WCL_DATA_DIR;
var WCL_SEASON_AVAILABLE = true;

function loadRemoteJson(relativePath) {
  return new Promise(function (resolve) {
    if (typeof wx === 'undefined' || typeof wx.request !== 'function') {
      resolve(null);
      return;
    }
    var separator = relativePath.indexOf('?') === -1 ? '?' : '&';
    wx.request({
      url: WCL_COS_BASE + '/' + relativePath + separator + '_wclts=' + Date.now(),
      success: function (res) {
        if (!res || res.statusCode < 200 || res.statusCode >= 300) {
          resolve(null);
          return;
        }
        if (typeof res.data === 'string') {
          try {
            resolve(JSON.parse(res.data));
          } catch (err) {
            resolve(null);
          }
          return;
        }
        resolve(res.data || null);
      },
      fail: function () {
        resolve(null);
      },
    });
  });
}

function loadWclPresetIndex(classKey, specId) {
  return loadRemoteJson(WCL_REMOTE_PREFIX + '/' + classKey + '/' + specId + '/index.json').then(function (remote) {
    if (remote) remote.dataSource = 'remote';
    return remote;
  });
}

function loadWclPresetFile(classKey, specId, fileKey) {
  return loadRemoteJson(WCL_REMOTE_PREFIX + '/' + classKey + '/' + specId + '/' + fileKey + '.json').then(function (remote) {
    if (remote) remote.dataSource = 'remote';
    return remote;
  });
}

function cloneStats(stats) {
  if (!stats) return null;
  return {
    primaryStats: Array.isArray(stats.primaryStats) ? stats.primaryStats.map(function (stat) { return Object.assign({}, stat); }) : [],
    stamina: stats.stamina && typeof stats.stamina === 'object' ? Object.assign({}, stats.stamina) : stats.stamina,
    secondary: Array.isArray(stats.secondary) ? stats.secondary.map(function (stat) { return Object.assign({}, stat); }) : [],
    effects: stats.effects ? {
      equip: Array.isArray(stats.effects.equip) ? stats.effects.equip.slice() : [],
      use: Array.isArray(stats.effects.use) ? stats.effects.use.slice() : [],
    } : { equip: [], use: [] },
    white: stats.white && typeof stats.white === 'object' ? Object.assign({}, stats.white) : {},
  };
}

function applyWclSlotOverrides(baseItem, wclSlot, slotKey) {
  if (!baseItem) {
    var craftedStats = Array.isArray(wclSlot.craftedStats) ? wclSlot.craftedStats : [];
    return {
      id: wclSlot.itemId,
      name: '未知装备 ' + wclSlot.itemId,
      ilvl: wclSlot.ilvl || 0,
      slot: slotKey,
      slotName: slotKey,
      iconText: '装',
      statLine: craftedStats.map(function (stat) {
        return (stat.name || STAT_NAME[stat.type] || stat.type) + stat.value;
      }).join(' / '),
      stats: craftedStats.length ? {
        primaryStats: [],
        stamina: 0,
        secondary: craftedStats.map(function (stat) {
          return {
            type: stat.type,
            name: stat.name || STAT_NAME[stat.type] || stat.type,
            value: stat.value || 0,
            craftedRandom: true,
            randomAttributeIndex: stat.randomAttributeIndex,
          };
        }),
        effects: { equip: [], use: [] },
        white: {},
      } : null,
      source: {
        difficultyName: 'WCL',
      },
      instanceName: 'WCL',
      wclMissingLocalItem: true,
    };
  }

  var item = Object.assign({}, baseItem);
  if (item.iconAsset && item.iconAsset.charAt(0) === '/') {
    item.iconAsset = getAssetBase() + item.iconAsset;
  }
  item.ilvl = wclSlot.ilvl || item.ilvl || 0;
  item.wcl = {
    bonusIDs: wclSlot.bonusIDs || [],
    gems: wclSlot.gems || [],
    permanentEnchant: wclSlot.permanentEnchant || null,
  };

  if (Array.isArray(wclSlot.craftedStats) && wclSlot.craftedStats.length) {
    var stats = cloneStats(item.stats) || {
      primaryStats: [],
      stamina: 0,
      secondary: [],
      effects: { equip: [], use: [] },
      white: {},
    };
    var fixedSecondary = (stats.secondary || []).filter(function (stat) {
      return !stat.craftedRandom;
    });
    var craftedSecondary = wclSlot.craftedStats.map(function (stat) {
      return {
        type: stat.type,
        name: stat.name || STAT_NAME[stat.type] || stat.type,
        value: stat.value || 0,
        craftedRandom: true,
        randomAttributeIndex: stat.randomAttributeIndex,
      };
    });
    item.stats = Object.assign({}, stats, {
      secondary: fixedSecondary.concat(craftedSecondary),
    });
    item.selectedCraftingStats = craftedSecondary;
  }

  item.statLine = buildStatLine(item);
  return item;
}

function buildItemMap(classData, specId) {
  var map = {};
  flattenItems((classData && classData.instances) || []).forEach(function (item) {
    if (Array.isArray(item.specs) && item.specs.length && item.specs.indexOf(specId) === -1) {
      return;
    }
    map[item.id] = item;
  });
  return map;
}

function applyWclPresetToBuild(buildId, preset, classData, specId, currentSlots) {
  var itemMap = buildItemMap(classData, specId);
  var slots = {};
  Object.keys(currentSlots || {}).forEach(function (slotKey) {
    slots[slotKey] = null;
  });

  var missing = [];
  Object.keys(preset.slots || {}).forEach(function (slotKey) {
    var wclSlot = preset.slots[slotKey];
    if (!wclSlot || !wclSlot.itemId) return;
    var item = applyWclSlotOverrides(itemMap[wclSlot.itemId], wclSlot, slotKey);
    if (item.wclMissingLocalItem) {
      missing.push({ slotKey: slotKey, itemId: wclSlot.itemId });
    }
    slots[slotKey] = item;
  });

  var updated = updateBuild(buildId, {
    slots: slots,
    wclPreset: {
      id: preset.id,
      name: preset.name,
      source: preset.source,
      talents: preset.talents || null,
      enchantsGems: buildEnchantsGems(preset.slots),
      missingItems: missing,
      appliedAt: Date.now(),
    },
  });

  return {
    build: updated,
    missing: missing,
  };
}

module.exports = {
  WCL_COS_BASE: WCL_COS_BASE,
  WCL_DATA_DIR: WCL_DATA_DIR,
  WCL_SEASON_AVAILABLE: WCL_SEASON_AVAILABLE,
  loadWclPresetIndex: loadWclPresetIndex,
  loadWclPresetFile: loadWclPresetFile,
  applyWclPresetToBuild: applyWclPresetToBuild,
};
