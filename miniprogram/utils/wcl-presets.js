var { COS_BASE, DATA_DIR } = require('./class-data');
var { flattenItems, buildStatLine } = require('./equipment');
var { updateBuild } = require('./builds');

var manifest = null;
try {
  manifest = require('../data/wcl-presets/manifest');
} catch (err) {
  manifest = { entries: {} };
}

var STAT_NAME = {
  crit: '暴击',
  haste: '急速',
  mastery: '精通',
  versatility: '全能',
};

var WCL_REMOTE_ONLY = true;
var WCL_REMOTE_PREFIX = 'wcl-presets/' + DATA_DIR;

function entryKey(classKey, specId) {
  return classKey + ':' + specId;
}

function getLocalEntry(classKey, specId) {
  return manifest && manifest.entries ? manifest.entries[entryKey(classKey, specId)] : null;
}

function loadLocalIndex(classKey, specId) {
  var entry = getLocalEntry(classKey, specId);
  if (!entry || typeof entry.index !== 'function') {
    return null;
  }
  return entry.index();
}

function loadLocalFile(classKey, specId, fileKey) {
  var entry = getLocalEntry(classKey, specId);
  if (!entry || !entry.files || typeof entry.files[fileKey] !== 'function') {
    return null;
  }
  return entry.files[fileKey]();
}

function loadRemoteJson(relativePath) {
  return new Promise(function (resolve) {
    var separator = relativePath.indexOf('?') === -1 ? '?' : '&';
    wx.request({
      url: COS_BASE + '/' + relativePath + separator + '_wclts=' + Date.now(),
      success: function (res) {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          if (typeof res.data === 'string') {
            try {
              resolve(JSON.parse(res.data));
            } catch (err) {
              console.error('parse wcl preset failed', relativePath, err);
              resolve(null);
            }
            return;
          }
          resolve(res.data || null);
          return;
        }
        console.error('load wcl preset failed', relativePath, res.statusCode);
        resolve(null);
      },
      fail: function (err) {
        console.error('load wcl preset failed', relativePath, err);
        resolve(null);
      },
    });
  });
}

function loadWclPresetIndex(classKey, specId) {
  return loadRemoteJson(WCL_REMOTE_PREFIX + '/' + classKey + '/' + specId + '/index.json').then(function (remote) {
    if (remote) {
      remote.dataSource = 'remote';
      return remote;
    }
    if (WCL_REMOTE_ONLY) return null;
    return loadLocalIndex(classKey, specId);
  });
}

function loadWclPresetFile(classKey, specId, fileKey) {
  return loadRemoteJson(WCL_REMOTE_PREFIX + '/' + classKey + '/' + specId + '/' + fileKey + '.json').then(function (remote) {
    if (remote) {
      remote.dataSource = 'remote';
      return remote;
    }
    if (WCL_REMOTE_ONLY) return null;
    return loadLocalFile(classKey, specId, fileKey);
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
    item.iconAsset = COS_BASE + item.iconAsset;
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
  loadWclPresetIndex: loadWclPresetIndex,
  loadWclPresetFile: loadWclPresetFile,
  applyWclPresetToBuild: applyWclPresetToBuild,
};
