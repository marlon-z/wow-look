const { getClassMeta } = require('./class-data');

const MAX_SHARED_FAVORITES = 20;

function normalizeShareItem(item) {
  if (!item || !item.classKey || item.itemId === undefined || item.itemId === null) {
    return null;
  }
  return {
    classKey: String(item.classKey),
    className: item.className || ((getClassMeta(item.classKey) || {}).name) || item.classKey,
    itemId: String(item.itemId),
  };
}

function getShareableFavorites(favorites) {
  if (!Array.isArray(favorites)) {
    return [];
  }
  return favorites
    .map(normalizeShareItem)
    .filter(Boolean)
    .slice(0, MAX_SHARED_FAVORITES);
}

function buildFavoriteSharePayload(favorites) {
  const shareable = getShareableFavorites(favorites);
  const groupMap = {};
  const groups = [];

  shareable.forEach((favorite) => {
    if (!groupMap[favorite.classKey]) {
      groupMap[favorite.classKey] = {
        classKey: favorite.classKey,
        itemIds: [],
      };
      groups.push(groupMap[favorite.classKey]);
    }
    if (groupMap[favorite.classKey].itemIds.indexOf(favorite.itemId) === -1) {
      groupMap[favorite.classKey].itemIds.push(favorite.itemId);
    }
  });

  return groups
    .filter((group) => group.itemIds.length)
    .map((group) => `${group.classKey}:${group.itemIds.join(',')}`)
    .join(';');
}

function parseFavoriteSharePayload(payload) {
  if (!payload || typeof payload !== 'string') {
    return [];
  }

  let decoded = payload;
  try {
    decoded = decodeURIComponent(payload);
  } catch (err) {
    decoded = payload;
  }

  return decoded
    .split(';')
    .map((segment) => {
      const parts = segment.split(':');
      const classKey = (parts[0] || '').trim();
      const itemIds = (parts[1] || '')
        .split(',')
        .map((itemId) => itemId.trim())
        .filter(Boolean);

      if (!classKey || !itemIds.length) {
        return null;
      }
      return { classKey, itemIds };
    })
    .filter(Boolean);
}

function getFavoriteClassNames(favorites) {
  const shareable = getShareableFavorites(favorites);
  const names = [];
  const seen = {};

  shareable.forEach((favorite) => {
    if (seen[favorite.classKey]) {
      return;
    }
    seen[favorite.classKey] = true;
    names.push(favorite.className);
  });

  return names;
}

function buildFavoriteShareTitle(favorites) {
  const names = getFavoriteClassNames(favorites);
  if (!names.length) {
    return '我的艾泽配装收藏';
  }
  if (names.length <= 2) {
    return `我的艾泽配装收藏：${names.join('、')}`;
  }
  return `我的艾泽配装收藏：${names.slice(0, 2).join('、')}等 ${names.length} 个职业`;
}

function buildFavoriteShareSummary(groups) {
  if (!Array.isArray(groups) || !groups.length) {
    return '';
  }
  return groups
    .map((group) => `${group.className} ${group.count} 件`)
    .join(' · ');
}

module.exports = {
  MAX_SHARED_FAVORITES,
  getShareableFavorites,
  buildFavoriteSharePayload,
  parseFavoriteSharePayload,
  buildFavoriteShareTitle,
  buildFavoriteShareSummary,
};
