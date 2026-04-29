const FAVORITES_STORAGE_KEY = 'wowlook_favorites_v1';
const FAVORITE_SLOT_ORDER = [
  '头',
  '肩',
  '披',
  '胸',
  '腕',
  '手',
  '腰',
  '腿',
  '脚',
  '项链',
  '颈',
  '戒指',
  '饰品',
  '武器',
];

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

function getSlotOrder(slotName) {
  const normalizedSlotName = normalizeFavoriteSlotName(slotName);
  const index = FAVORITE_SLOT_ORDER.indexOf(normalizedSlotName);
  return index === -1 ? FAVORITE_SLOT_ORDER.length : index;
}

function normalizeFavoriteSlotName(slotName) {
  if (slotName === '手腕' || slotName === '护腕') {
    return '腕';
  }
  if (slotName === '手部') {
    return '手';
  }
  return slotName;
}

function buildFavoriteSlotBadgeName(slotName) {
  if (slotName === '腕' || slotName === '手腕' || slotName === '护腕') {
    return '护腕';
  }
  if (slotName === '手' || slotName === '手部') {
    return '手部';
  }
  return slotName;
}

function buildFavoriteGroups(favorites = []) {
  const groups = [];
  const groupMap = {};

  favorites.forEach((favorite, index) => {
    const classKey = favorite.classKey || 'unknown';
    if (!groupMap[classKey]) {
      const group = {
        classKey,
        className: favorite.className || '未知职业',
        count: 0,
        items: [],
        firstAddedAt: favorite.addedAt || 0,
        firstIndex: index,
      };
      groupMap[classKey] = group;
      groups.push(group);
    }

    const group = groupMap[classKey];
    group.count += 1;
    group.firstAddedAt = Math.max(group.firstAddedAt, favorite.addedAt || 0);
    group.items.push({
      ...favorite,
      slotName: normalizeFavoriteSlotName(favorite.slotName),
      slotBadgeName: favorite.slotBadgeName || buildFavoriteSlotBadgeName(favorite.slotName),
      _slotOrder: getSlotOrder(favorite.slotName),
      _addedAt: favorite.addedAt || 0,
    });
  });

  return groups
    .sort((left, right) => {
      if (right.firstAddedAt !== left.firstAddedAt) {
        return right.firstAddedAt - left.firstAddedAt;
      }
      return left.firstIndex - right.firstIndex;
    })
    .map((group) => ({
      ...group,
      items: group.items
        .sort((left, right) => {
          if (left._slotOrder !== right._slotOrder) {
            return left._slotOrder - right._slotOrder;
          }
          return right._addedAt - left._addedAt;
        })
        .map(({ _slotOrder, _addedAt, ...favorite }) => favorite),
    }));
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
    slotName: normalizeFavoriteSlotName(item.slotName),
    slotBadgeName: item.slotBadgeName || buildFavoriteSlotBadgeName(item.slotName),
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
  buildFavoriteGroups,
  buildFavoriteSnapshot,
  toggleFavorite,
};
