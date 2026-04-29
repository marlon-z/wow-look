const FAVORITES_STORAGE_KEY = 'wowlook_favorites_v1';

function getFavoriteKey(classKey, itemId) {
  return `${classKey}:${itemId}`;
}

function normalizeFavorites(value) {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter((item) => item && item.key && item.itemId && item.classKey);
}

function getFavorites() {
  try {
    return normalizeFavorites(wx.getStorageSync(FAVORITES_STORAGE_KEY));
  } catch (err) {
    console.error('get favorites failed', err);
    return [];
  }
}

function saveFavorites(favorites) {
  const normalized = normalizeFavorites(favorites);
  try {
    wx.setStorageSync(FAVORITES_STORAGE_KEY, normalized);
  } catch (err) {
    console.error('save favorites failed', err);
  }
  return normalized;
}

function clearFavorites() {
  return saveFavorites([]);
}

function removeFavorite(key) {
  return saveFavorites(getFavorites().filter((item) => item.key !== key));
}

function isFavorite(classKey, itemId, favorites = getFavorites()) {
  const key = getFavoriteKey(classKey, itemId);
  return favorites.some((item) => item.key === key);
}

function buildFavoriteSnapshot(classKey, className, item) {
  const secondary = ((item.stats && item.stats.secondary) || [])
    .map((stat) => `${stat.name}${stat.value}`)
    .join(' / ');

  return {
    key: getFavoriteKey(classKey, item.id),
    itemId: item.id,
    classKey,
    className,
    name: item.name,
    slotName: item.slotName,
    ilvl: item.ilvl,
    iconAsset: item.iconAsset || '',
    iconText: item.iconText || (item.name ? item.name.slice(0, 1) : '装'),
    sourceType: item.sourceType || item.instanceType || '',
    sourceName: item.instanceName || '',
    encounterName: item.encounterName || '',
    difficultyName: item.source ? item.source.difficultyName : '',
    statLine: item.statLine || secondary || '无常规副属性',
    addedAt: Date.now(),
  };
}

function toggleFavorite(snapshot) {
  const favorites = getFavorites();
  const exists = favorites.some((item) => item.key === snapshot.key);
  if (exists) {
    return {
      isFavorite: false,
      favorites: saveFavorites(favorites.filter((item) => item.key !== snapshot.key)),
    };
  }

  return {
    isFavorite: true,
    favorites: saveFavorites([
      snapshot,
      ...favorites.filter((item) => item.key !== snapshot.key),
    ]),
  };
}

module.exports = {
  FAVORITES_STORAGE_KEY,
  getFavoriteKey,
  getFavorites,
  saveFavorites,
  clearFavorites,
  removeFavorite,
  isFavorite,
  buildFavoriteSnapshot,
  toggleFavorite,
};
