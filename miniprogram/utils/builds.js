var { summarizeSlots, BUILD_SLOT_KEYS } = require('./stat-calc');
var { applyWeaponSelection } = require('./weapon-rules');
var { getAssetBase } = require('./class-data');
var { normalizeLocalIconPath } = require('./local-icon-path');

var BUILDS_STORAGE_KEY = 'wowlook_builds_v1';

function emptySlots() {
  var slots = {};
  BUILD_SLOT_KEYS.forEach(function (key) {
    slots[key] = null;
  });
  return slots;
}

function normalizeBuildsWithMigration(value) {
  if (!Array.isArray(value)) return { builds: [], migrated: false };
  var migrated = false;
  var builds = value
    .filter(function (build) {
      return build && build.id && build.classKey;
    })
    .map(function (build) {
      var normalizedBuild = Object.assign({}, build);
      if (build.slots) {
        normalizedBuild.slots = {};
        Object.keys(build.slots).forEach(function (slotKey) {
          var item = build.slots[slotKey];
          if (item && item.iconAsset && item.iconAsset.charAt(0) === '/') {
            var iconAsset = normalizeLocalIconPath(item.iconAsset);
            if (iconAsset !== item.iconAsset) {
              migrated = true;
            }
            normalizedBuild.slots[slotKey] = Object.assign({}, item, {
              iconAsset: getAssetBase() + iconAsset,
            });
          } else {
            normalizedBuild.slots[slotKey] = item;
          }
        });
      }
      if (normalizedBuild.slots && normalizedBuild.specId) {
        normalizedBuild.summary = summarizeSlots(normalizedBuild.slots, normalizedBuild.specId);
      }
      return normalizedBuild;
    });
  return { builds: builds, migrated: migrated };
}

function normalizeBuilds(value) {
  return normalizeBuildsWithMigration(value).builds;
}

function getBuilds() {
  try {
    var normalized = normalizeBuildsWithMigration(wx.getStorageSync(BUILDS_STORAGE_KEY));
    if (normalized.migrated) {
      wx.setStorageSync(BUILDS_STORAGE_KEY, normalized.builds);
    }
    return normalized.builds;
  } catch (err) {
    console.error('get builds failed', err);
    return [];
  }
}

function saveBuilds(builds) {
  var normalized = normalizeBuilds(builds);
  try {
    wx.setStorageSync(BUILDS_STORAGE_KEY, normalized);
  } catch (err) {
    console.error('save builds failed', err);
  }
  return normalized;
}

function slotKeyForItem(item) {
  if (!item || !item.slot) return null;
  var slot = item.slot;
  if (slot === 'finger') return 'finger1';
  if (slot === 'trinket') return 'trinket1';
  if (slot === 'back') return 'cloak';
  if (BUILD_SLOT_KEYS.indexOf(slot) !== -1) return slot;
  return null;
}

function buildStatLine(secondary) {
  if (!secondary || !secondary.length) return '';
  return secondary.map(function (s) { return s.name + s.value; }).join(' / ');
}

function buildItemSnapshot(item) {
  if (!item) return null;
  var secondary = (item.stats && item.stats.secondary) || [];
  return {
    itemId: item.id,
    name: item.name,
    ilvl: item.ilvl || 0,
    slot: item.slot,
    slotName: item.slotName || '',
    armorType: item.armorType || '',
    itemSubType: item.itemSubType || '',
    equipLoc: item.equipLoc || (item.maxVersion && item.maxVersion.equipLoc) || (item.dropVersion && item.dropVersion.equipLoc) || '',
    iconAsset: item.iconAsset || '',
    iconText: item.iconText || (item.name ? item.name.slice(0, 1) : '装'),
    statLine: item.statLine || buildStatLine(secondary),
    specs: item.specs || [],
    tooltipFlags: item.tooltipFlags || null,
    stats: item.stats ? {
      primaryStats: item.stats.primaryStats || [],
      stamina: item.stats.stamina || 0,
      secondary: secondary,
    } : null,
    source: item.source || null,
    instanceName: item.instanceName || '',
    encounterName: item.encounterName || '',
  };
}

function createBuild(classKey, className, specId, specName, isDraft) {
  var now = Date.now();
  var builds = getBuilds();
  var sameSpecCount = builds.filter(function (b) {
    return b.classKey === classKey && b.specId === specId && !b.draft;
  }).length;
  var name = className + ' · ' + specName + (sameSpecCount > 0 ? ' ' + (sameSpecCount + 1) : '');

  var build = {
    id: 'build_' + now,
    name: name,
    classKey: classKey,
    className: className,
    specId: specId,
    specName: specName,
    slots: emptySlots(),
    summary: summarizeSlots(emptySlots(), specId),
    draft: !!isDraft,
    createdAt: now,
    updatedAt: now,
  };

  builds.unshift(build);
  saveBuilds(builds);
  return build;
}

function getSavedBuilds() {
  return getBuilds().filter(function (b) { return !b.draft; });
}

function confirmSaveBuild(buildId, newName) {
  var builds = getBuilds();
  for (var i = 0; i < builds.length; i++) {
    if (builds[i].id === buildId) {
      builds[i].draft = false;
      if (newName) {
        builds[i].name = newName;
      }
      builds[i].updatedAt = Date.now();
      saveBuilds(builds);
      return builds[i];
    }
  }
  return null;
}

function cleanupDrafts() {
  var builds = getBuilds().filter(function (b) { return !b.draft; });
  saveBuilds(builds);
}

function getBuild(buildId) {
  return getBuilds().find(function (b) { return b.id === buildId; }) || null;
}

function updateBuild(buildId, updates) {
  var builds = getBuilds();
  var index = -1;
  for (var i = 0; i < builds.length; i++) {
    if (builds[i].id === buildId) {
      index = i;
      break;
    }
  }
  if (index === -1) return null;

  var build = builds[index];
  var updated = {};
  var keys = Object.keys(build);
  for (var k = 0; k < keys.length; k++) {
    updated[keys[k]] = build[keys[k]];
  }
  if (updates) {
    var ukeys = Object.keys(updates);
    for (var u = 0; u < ukeys.length; u++) {
      updated[ukeys[u]] = updates[ukeys[u]];
    }
  }
  updated.updatedAt = Date.now();
  if (updated.slots) {
    updated.summary = summarizeSlots(updated.slots, updated.specId);
  }

  builds[index] = updated;
  saveBuilds(builds);
  return updated;
}

function setSlotItem(buildId, slotKey, item) {
  var build = getBuild(buildId);
  if (!build) return null;

  var slots = {};
  var slotKeys = Object.keys(build.slots);
  for (var i = 0; i < slotKeys.length; i++) {
    slots[slotKeys[i]] = build.slots[slotKeys[i]];
  }
  slots[slotKey] = item ? buildItemSnapshot(item) : null;
  return updateBuild(buildId, { slots: slots });
}

function setWeaponSlotItem(buildId, slotKey, item) {
  var build = getBuild(buildId);
  if (!build) return { ok: false, message: '方案不存在' };
  var snapshot = buildItemSnapshot(item);
  var result = applyWeaponSelection(build.slots, build.specId, slotKey, snapshot);
  if (!result.ok) return result;
  var updated = updateBuild(buildId, { slots: result.slots });
  return { ok: !!updated, build: updated, clearedOffHand: result.clearedOffHand };
}

function clearSlot(buildId, slotKey) {
  return setSlotItem(buildId, slotKey, null);
}

function deleteBuild(buildId) {
  var builds = getBuilds().filter(function (b) { return b.id !== buildId; });
  return saveBuilds(builds);
}

function renameBuild(buildId, newName) {
  return updateBuild(buildId, { name: newName });
}

function clearAllSlots(buildId) {
  return updateBuild(buildId, { slots: emptySlots() });
}

function getAvailableSlotKey(build, item) {
  var baseSlot = slotKeyForItem(item);
  if (!baseSlot) return null;

  if (baseSlot === 'finger1') {
    if (!build.slots.finger1) return 'finger1';
    if (!build.slots.finger2) return 'finger2';
    return 'finger1';
  }
  if (baseSlot === 'trinket1') {
    if (!build.slots.trinket1) return 'trinket1';
    if (!build.slots.trinket2) return 'trinket2';
    return 'trinket1';
  }
  return baseSlot;
}

function isDuplicateEquip(build, slotKey, item) {
  if (!item) return false;
  var flags = item.tooltipFlags || {};
  if (!flags.uniqueEquipped) return false;
  return Object.keys(build.slots).some(function (key) {
    return key !== slotKey && build.slots[key] && build.slots[key].itemId === item.id;
  });
}

module.exports = {
  BUILDS_STORAGE_KEY: BUILDS_STORAGE_KEY,
  BUILD_SLOT_KEYS: BUILD_SLOT_KEYS,
  getBuilds: getBuilds,
  getSavedBuilds: getSavedBuilds,
  saveBuilds: saveBuilds,
  createBuild: createBuild,
  confirmSaveBuild: confirmSaveBuild,
  cleanupDrafts: cleanupDrafts,
  getBuild: getBuild,
  updateBuild: updateBuild,
  setSlotItem: setSlotItem,
  setWeaponSlotItem: setWeaponSlotItem,
  clearSlot: clearSlot,
  deleteBuild: deleteBuild,
  renameBuild: renameBuild,
  clearAllSlots: clearAllSlots,
  emptySlots: emptySlots,
  buildItemSnapshot: buildItemSnapshot,
  slotKeyForItem: slotKeyForItem,
  getAvailableSlotKey: getAvailableSlotKey,
  isDuplicateEquip: isDuplicateEquip,
};
