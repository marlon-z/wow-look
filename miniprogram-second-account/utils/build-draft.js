const BUILD_DRAFT_STORAGE_KEY = 'wowlook_build_draft_v1';
const { normalizeLocalIconPath } = require('./local-icon-path');

function normalizeDraftWithMigration(value) {
  if (!value || typeof value !== 'object') {
    return {
      draft: { classKey: '', className: '', items: [], updatedAt: 0 },
      migrated: false,
    };
  }

  let migrated = false;
  const items = Array.isArray(value.items)
    ? value.items
      .filter((item) => item && item.key && item.itemId && item.classKey)
      .map((item) => {
        const iconAsset = normalizeLocalIconPath(item.iconAsset);
        if (iconAsset === item.iconAsset) {
          return item;
        }
        migrated = true;
        return { ...item, iconAsset };
      })
    : [];
  return {
    draft: {
    classKey: value.classKey || '',
    className: value.className || '',
    items,
    updatedAt: value.updatedAt || 0,
    },
    migrated,
  };
}

function normalizeDraft(value) {
  return normalizeDraftWithMigration(value).draft;
}

function getBuildDraft() {
  try {
    const normalized = normalizeDraftWithMigration(wx.getStorageSync(BUILD_DRAFT_STORAGE_KEY));
    if (normalized.migrated) {
      wx.setStorageSync(BUILD_DRAFT_STORAGE_KEY, normalized.draft);
    }
    return normalized.draft;
  } catch (err) {
    console.error('get build draft failed', err);
    return normalizeDraft(null);
  }
}

function saveBuildDraft(draft) {
  const normalized = normalizeDraft({
    ...draft,
    updatedAt: Date.now(),
  });
  try {
    wx.setStorageSync(BUILD_DRAFT_STORAGE_KEY, normalized);
  } catch (err) {
    console.error('save build draft failed', err);
  }
  return normalized;
}

function startBuildDraft(classKey, className, keepExisting = true) {
  const current = getBuildDraft();
  if (keepExisting && current.classKey === classKey) {
    return current;
  }
  return saveBuildDraft({
    classKey,
    className,
    items: [],
  });
}

function clearBuildDraft() {
  return saveBuildDraft({
    classKey: '',
    className: '',
    items: [],
  });
}

function isBuildDraftItem(classKey, itemId, draft = getBuildDraft()) {
  return draft.classKey === classKey && draft.items.some((item) => String(item.itemId) === String(itemId));
}

function toggleBuildDraftItem(classKey, className, snapshot) {
  const current = startBuildDraft(classKey, className);
  const exists = current.items.some((item) => item.key === snapshot.key);
  const items = exists
    ? current.items.filter((item) => item.key !== snapshot.key)
    : [
      {
        ...snapshot,
        addedAt: Date.now(),
      },
      ...current.items.filter((item) => item.key !== snapshot.key),
    ];

  const draft = saveBuildDraft({
    classKey,
    className,
    items,
  });

  return {
    isSelected: !exists,
    draft,
  };
}

function addBuildDraftItems(classKey, className, snapshots) {
  const current = startBuildDraft(classKey, className);
  const existingMap = {};
  current.items.forEach((item) => {
    existingMap[item.key] = true;
  });

  const now = Date.now();
  const additions = [];
  (Array.isArray(snapshots) ? snapshots : []).forEach((snapshot) => {
    if (!snapshot || existingMap[snapshot.key]) {
      return;
    }
    existingMap[snapshot.key] = true;
    additions.push({
      ...snapshot,
      addedAt: now - additions.length,
    });
  });

  const draft = saveBuildDraft({
    classKey,
    className,
    items: [
      ...additions,
      ...current.items,
    ],
  });

  return {
    addedCount: additions.length,
    skippedCount: (Array.isArray(snapshots) ? snapshots.length : 0) - additions.length,
    draft,
  };
}

function removeBuildDraftItem(key) {
  const current = getBuildDraft();
  return saveBuildDraft({
    ...current,
    items: current.items.filter((item) => item.key !== key),
  });
}

module.exports = {
  BUILD_DRAFT_STORAGE_KEY,
  getBuildDraft,
  saveBuildDraft,
  startBuildDraft,
  clearBuildDraft,
  isBuildDraftItem,
  toggleBuildDraftItem,
  addBuildDraftItems,
  removeBuildDraftItem,
};
