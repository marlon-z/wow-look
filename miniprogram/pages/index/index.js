const {
  COS_BASE,
  CLASS_LIST,
  getClassMeta,
  getClassVisualAssets,
  loadOverview,
  loadClassData,
} = require('../../utils/class-data');
const {
  flattenItems,
  buildStatLine,
  buildSpecNames,
  buildMetaLine,
  buildItemDetail,
} = require('../../utils/equipment');
const {
  getFavorites,
  saveFavorites,
  buildFavoriteGroups,
  removeFavorite,
  clearFavorites,
  isFavorite,
  buildFavoriteSnapshot,
  toggleFavorite,
} = require('../../utils/favorites');
const {
  MAX_SHARED_FAVORITES,
  buildFavoriteSharePayload,
  parseFavoriteSharePayload,
  buildFavoriteShareTitle,
  buildFavoriteShareSummary,
} = require('../../utils/favorite-share');
const {
  getAnnouncement,
  isAnnouncementUnread,
  markAnnouncementRead,
} = require('../../utils/announcements');

const POSTER_CANVAS_ID = 'favoritePosterCanvas';
const POSTER_WIDTH = 750;
const POSTER_MIN_HEIGHT = 1334;
const POSTER_BG = '/assets/poster/favorite-poster-bg.jpg';
const POSTER_LOGO = '/assets/public/logo-poster.png';

function drawRoundRect(ctx, x, y, width, height, radius, fillStyle, strokeStyle) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.arc(x + width - r, y + r, r, -Math.PI / 2, 0);
  ctx.lineTo(x + width, y + height - r);
  ctx.arc(x + width - r, y + height - r, r, 0, Math.PI / 2);
  ctx.lineTo(x + r, y + height);
  ctx.arc(x + r, y + height - r, r, Math.PI / 2, Math.PI);
  ctx.lineTo(x, y + r);
  ctx.arc(x + r, y + r, r, Math.PI, Math.PI * 1.5);
  ctx.closePath();
  if (fillStyle) {
    ctx.setFillStyle(fillStyle);
    ctx.fill();
  }
  if (strokeStyle) {
    ctx.setStrokeStyle(strokeStyle);
    ctx.stroke();
  }
}

function setPosterTextStyle(ctx, size, color, weight = 'normal', align = 'left') {
  ctx.setFillStyle(color);
  ctx.setFontSize(size);
  ctx.setTextAlign(align);
  ctx.setTextBaseline('alphabetic');
  ctx.font = `${weight} ${size}px sans-serif`;
}

function measurePosterText(ctx, text) {
  if (!text) {
    return 0;
  }
  if (ctx.measureText) {
    return ctx.measureText(String(text)).width;
  }
  return String(text).length * 24;
}

function drawEllipsisText(ctx, text, x, y, maxWidth) {
  const value = String(text || '');
  if (measurePosterText(ctx, value) <= maxWidth) {
    ctx.fillText(value, x, y);
    return;
  }

  let output = value;
  while (output.length > 0 && measurePosterText(ctx, `${output}…`) > maxWidth) {
    output = output.slice(0, -1);
  }
  ctx.fillText(`${output}…`, x, y);
}

function calculatePosterHeight(groups) {
  const itemCount = groups.reduce((total, group) => total + group.items.length, 0);
  const groupCount = groups.length;
  return Math.max(POSTER_MIN_HEIGHT, 360 + groupCount * 58 + itemCount * 78 + 170);
}

function enrichList(list, countMap) {
  return list.map((item) => ({
    ...item,
    emblem: getClassVisualAssets(item.key).emblem,
    itemCount: countMap[item.key] || 0,
  }));
}

Page({
  classItemCache: {},

  data: {
    cosBase: COS_BASE,
    row1: [],
    row2: [],
    row3: [],
    favoriteCount: 0,
    favoriteList: [],
    favoriteGroups: [],
    pendingRemoveFavoriteKey: '',
    showFavorites: false,
    sharedFavoriteList: [],
    sharedFavoriteGroups: [],
    sharedFavoriteCount: 0,
    sharedFavoriteSummary: '',
    sharedFavoriteError: '',
    isSharedFavoriteLoading: false,
    showSharedFavorites: false,
    announcement: getAnnouncement(),
    showAnnouncement: false,
    hasUnreadAnnouncement: false,
    selectedItem: null,
    showModal: false,
    isPosterGenerating: false,
    posterCanvasHeight: POSTER_MIN_HEIGHT,
    pageStyle: '',
  },

  onLoad(options = {}) {
    const countMap = {};
    this.setData({
      row1: enrichList(CLASS_LIST.slice(0, 4), countMap),
      row2: enrichList(CLASS_LIST.slice(4, 9), countMap),
      row3: enrichList(CLASS_LIST.slice(9, 13), countMap),
      hasUnreadAnnouncement: isAnnouncementUnread(),
    });

    loadOverview().then((overview) => {
      if (overview && Array.isArray(overview.classes)) {
        overview.classes.forEach((item) => {
          countMap[item.key] = item.itemCount;
        });
        this.setData({
          row1: enrichList(CLASS_LIST.slice(0, 4), countMap),
          row2: enrichList(CLASS_LIST.slice(4, 9), countMap),
          row3: enrichList(CLASS_LIST.slice(9, 13), countMap),
        });
      }
    });

    if (options.shareFav) {
      this.openSharedFavorites(options.shareFav);
    }
  },

  onShow() {
    this.refreshFavorites();
  },

  refreshFavorites() {
    const favoriteList = getFavorites();
    this.setData({
      favoriteList,
      favoriteGroups: buildFavoriteGroups(favoriteList),
      favoriteCount: favoriteList.length,
    });
  },

  openFavorites() {
    this.refreshFavorites();
    this.setData({
      showFavorites: true,
      pageStyle: 'overflow:hidden;height:100vh;',
    });
  },

  openAnnouncement() {
    markAnnouncementRead();
    this.setData({
      showAnnouncement: true,
      hasUnreadAnnouncement: false,
      pageStyle: 'overflow:hidden;height:100vh;',
    });
  },

  closeAnnouncement() {
    this.setData({
      showAnnouncement: false,
      pageStyle: this.data.showFavorites || this.data.showModal || this.data.showSharedFavorites ? 'overflow:hidden;height:100vh;' : '',
    });
  },

  loadClassItems(classKey) {
    if (this.classItemCache[classKey]) {
      return Promise.resolve(this.classItemCache[classKey]);
    }

    return loadClassData(classKey).then((data) => {
      if (!data) {
        return null;
      }

      const favorites = getFavorites();
      const classMeta = (data && data.class) || getClassMeta(classKey) || {};
      const items = flattenItems(data.instances || []).map((item) => ({
        ...item,
        iconAsset: item.iconAsset ? COS_BASE + item.iconAsset : '',
        statLine: buildStatLine(item),
        specNames: buildSpecNames(item, data.specs || []),
        metaLine: buildMetaLine(item),
        sourceBadge: item.source ? item.source.difficultyName : '',
        roleBadge: item.stats && item.stats.effects && item.stats.effects.use && item.stats.effects.use.length ? '使用特效'
          : (item.stats && item.stats.effects && item.stats.effects.equip && item.stats.effects.equip.length ? '装备特效' : ''),
        rightMeta: item.slot === 'weapon' ? item.itemSubType : (item.armorType !== 'none' ? item.armorTypeName : item.slotName),
        iconText: item.iconText || (item.name ? item.name.slice(0, 1) : '装'),
        isFavorite: isFavorite(classKey, item.id, favorites),
      }));
      const itemMap = {};
      items.forEach((item) => {
        itemMap[item.id] = item;
      });

      const result = {
        classKey,
        className: classMeta.name || '',
        specs: data.specs || [],
        items,
        itemMap,
      };
      this.classItemCache[classKey] = result;
      return result;
    });
  },

  refreshCachedFavoriteState(classKey, itemId, isItemFavorite) {
    const cache = this.classItemCache[classKey];
    if (!cache || !cache.itemMap[itemId]) {
      return;
    }
    const item = {
      ...cache.itemMap[itemId],
      isFavorite: isItemFavorite,
    };
    cache.itemMap[itemId] = item;
    cache.items = cache.items.map((equip) => (equip.id === item.id ? item : equip));
  },

  closeFavorites() {
    this.setData({
      showFavorites: false,
      pendingRemoveFavoriteKey: '',
      pageStyle: this.data.showModal || this.data.showSharedFavorites ? 'overflow:hidden;height:100vh;' : '',
    });
  },

  openSharedFavorites(payload) {
    const parsedGroups = parseFavoriteSharePayload(payload);
    if (!parsedGroups.length) {
      wx.showToast({
        title: '分享内容无效',
        icon: 'none',
      });
      return;
    }

    this.setData({
      showSharedFavorites: true,
      isSharedFavoriteLoading: true,
      sharedFavoriteError: '',
      sharedFavoriteList: [],
      sharedFavoriteGroups: [],
      sharedFavoriteCount: 0,
      sharedFavoriteSummary: '',
      pageStyle: 'overflow:hidden;height:100vh;',
    });

    let remaining = MAX_SHARED_FAVORITES;
    const restoreTasks = parsedGroups.map((group) => {
      if (remaining <= 0) {
        return Promise.resolve([]);
      }
      const itemIds = group.itemIds.slice(0, remaining);
      remaining -= itemIds.length;

      return this.loadClassItems(group.classKey).then((cache) => {
        if (!cache) {
          return [];
        }
        return itemIds
          .map((itemId) => cache.itemMap[itemId])
          .filter(Boolean)
          .map((item) => buildFavoriteSnapshot(cache.classKey, cache.className, item));
      });
    });

    Promise.all(restoreTasks).then((results) => {
      const sharedFavoriteList = [].concat(...results);
      if (!sharedFavoriteList.length) {
        this.setData({
          isSharedFavoriteLoading: false,
          sharedFavoriteError: '分享内容已失效',
        });
        return;
      }

      const sharedFavoriteGroups = buildFavoriteGroups(sharedFavoriteList);
      this.setData({
        sharedFavoriteList,
        sharedFavoriteGroups,
        sharedFavoriteCount: sharedFavoriteList.length,
        sharedFavoriteSummary: buildFavoriteShareSummary(sharedFavoriteGroups),
        isSharedFavoriteLoading: false,
        sharedFavoriteError: '',
      });
    }).catch((err) => {
      console.error('restore shared favorites failed', err);
      this.setData({
        isSharedFavoriteLoading: false,
        sharedFavoriteError: '分享内容加载失败',
      });
    });
  },

  closeSharedFavorites() {
    this.setData({
      showSharedFavorites: false,
      pageStyle: this.data.showFavorites || this.data.showModal ? 'overflow:hidden;height:100vh;' : '',
    });
  },

  importSharedFavorites() {
    const sharedFavorites = this.data.sharedFavoriteList;
    if (!sharedFavorites.length) {
      return;
    }

    const currentFavorites = getFavorites();
    const existingMap = {};
    currentFavorites.forEach((favorite) => {
      existingMap[favorite.key] = true;
    });

    const now = Date.now();
    const newFavorites = [];
    sharedFavorites.forEach((favorite) => {
      if (existingMap[favorite.key]) {
        return;
      }
      existingMap[favorite.key] = true;
      newFavorites.push({
        ...favorite,
        addedAt: now - newFavorites.length,
      });
    });
    const skippedCount = sharedFavorites.length - newFavorites.length;

    if (!newFavorites.length) {
      wx.showToast({
        title: '收藏已存在',
        icon: 'none',
      });
      return;
    }

    saveFavorites([
      ...newFavorites,
      ...currentFavorites,
    ]);
    this.refreshFavorites();
    wx.showToast({
      title: `已保存${newFavorites.length}件`,
      icon: 'none',
    });

    if (skippedCount) {
      setTimeout(() => {
        wx.showToast({
          title: `跳过${skippedCount}件已存在`,
          icon: 'none',
        });
      }, 1200);
    }
  },

  clearPendingRemoveFavorite() {
    if (this.data.pendingRemoveFavoriteKey) {
      this.setData({ pendingRemoveFavoriteKey: '' });
    }
  },

  removeFavoriteItem(event) {
    const { key } = event.currentTarget.dataset;
    if (this.data.pendingRemoveFavoriteKey !== key) {
      this.setData({ pendingRemoveFavoriteKey: key });
      return;
    }

    removeFavorite(key);
    this.setData({ pendingRemoveFavoriteKey: '' });
    this.refreshFavorites();
    wx.showToast({
      title: '已移除收藏',
      icon: 'none',
    });
  },

  clearFavoriteItems() {
    if (!this.data.favoriteList.length) {
      return;
    }
    wx.showModal({
      title: '清空收藏',
      content: '确定移除全部收藏装备？',
      confirmText: '清空',
      confirmColor: '#e05050',
      success: (res) => {
        if (!res.confirm) {
          return;
        }
        clearFavorites();
        this.setData({ pendingRemoveFavoriteKey: '' });
        this.refreshFavorites();
      },
    });
  },

  createFavoritePoster() {
    const favoriteList = this.data.favoriteList.length ? this.data.favoriteList : getFavorites();
    const favoriteGroups = buildFavoriteGroups(favoriteList);
    if (!favoriteGroups.length) {
      wx.showToast({
        title: '还没有收藏装备',
        icon: 'none',
      });
      return;
    }

    if (this.data.isPosterGenerating) {
      return;
    }

    const posterCanvasHeight = calculatePosterHeight(favoriteGroups);
    this.setData({
      isPosterGenerating: true,
      posterCanvasHeight,
    }, () => {
      setTimeout(() => {
        this.drawFavoritePoster(favoriteGroups, posterCanvasHeight);
      }, 300);
    });
  },

  drawFavoritePoster(favoriteGroups, posterHeight) {
    const ctx = wx.createCanvasContext(POSTER_CANVAS_ID, this);
    const summary = buildFavoriteShareSummary(favoriteGroups);
    let y = 306;

    ctx.clearRect(0, 0, POSTER_WIDTH, posterHeight);
    ctx.drawImage(POSTER_BG, 0, 0, POSTER_WIDTH, posterHeight);

    drawRoundRect(ctx, 44, 240, 662, posterHeight - 360, 28, 'rgba(13, 10, 18, 0.76)', 'rgba(212, 168, 75, 0.32)');
    drawRoundRect(ctx, 64, 258, 622, posterHeight - 396, 18, 'rgba(10, 8, 13, 0.38)', 'rgba(255, 255, 255, 0.05)');

    ctx.drawImage(POSTER_LOGO, 214, 54, 322, 158);
    setPosterTextStyle(ctx, 34, '#f3e6c3', 'bold', 'center');
    ctx.fillText('收藏装备清单', POSTER_WIDTH / 2, 236);
    setPosterTextStyle(ctx, 22, '#a69882', 'normal', 'left');
    drawEllipsisText(ctx, summary, 95, 270, 560);

    favoriteGroups.forEach((group) => {
      setPosterTextStyle(ctx, 26, '#ffbb12', 'bold');
      ctx.fillText(`◇ ${group.className}`, 84, y);
      setPosterTextStyle(ctx, 20, '#a79e8f', 'bold', 'right');
      ctx.fillText(`${group.count} 件`, 666, y);
      y += 22;

      group.items.forEach((favorite) => {
        drawRoundRect(ctx, 72, y, 606, 64, 14, 'rgba(32, 27, 38, 0.9)', 'rgba(255, 255, 255, 0.08)');
        drawRoundRect(ctx, 90, y + 18, 64, 28, 6, 'rgba(255, 187, 18, 0.08)', 'rgba(255, 187, 18, 0.38)');

        setPosterTextStyle(ctx, 19, '#ffbb12', 'bold', 'center');
        drawEllipsisText(ctx, favorite.slotBadgeName || favorite.slotName || '装备', 122, y + 39, 56);

        setPosterTextStyle(ctx, 24, '#b55cff', 'bold', 'left');
        drawEllipsisText(ctx, favorite.name, 174, y + 28, 340);

        setPosterTextStyle(ctx, 20, '#cfc1a6', 'bold', 'right');
        ctx.fillText(`ilvl${favorite.ilvl || '-'}`, 652, y + 28);

        setPosterTextStyle(ctx, 20, '#38f038', 'bold', 'left');
        drawEllipsisText(ctx, favorite.statLine || '无常规副属性', 174, y + 54, 260);

        setPosterTextStyle(ctx, 18, '#8d8579', 'normal', 'right');
        drawEllipsisText(ctx, favorite.sourceName || favorite.encounterName || '装备来源', 652, y + 54, 160);

        y += 78;
      });

      y += 22;
    });

    setPosterTextStyle(ctx, 22, '#8f846f', 'normal', 'center');
    ctx.fillText('艾泽配装 · 装备收藏清单', POSTER_WIDTH / 2, posterHeight - 86);
    setPosterTextStyle(ctx, 18, '#5f574a', 'normal', 'center');
    ctx.fillText('保存图片后可分享给好友或朋友圈', POSTER_WIDTH / 2, posterHeight - 54);

    ctx.draw(false, () => {
      setTimeout(() => {
        wx.canvasToTempFilePath({
          canvasId: POSTER_CANVAS_ID,
          x: 0,
          y: 0,
          width: POSTER_WIDTH,
          height: posterHeight,
          destWidth: POSTER_WIDTH,
          destHeight: posterHeight,
          fileType: 'png',
          success: (res) => {
            this.savePosterToAlbum(res.tempFilePath);
          },
          fail: (err) => {
            console.error('create poster image failed', err);
            this.setData({ isPosterGenerating: false });
            wx.showToast({
              title: '生成图片失败',
              icon: 'none',
            });
          },
        }, this);
      }, 500);
    });
  },

  savePosterToAlbum(filePath) {
    wx.saveImageToPhotosAlbum({
      filePath,
      success: () => {
        this.setData({ isPosterGenerating: false });
        wx.showToast({
          title: '已保存到相册',
          icon: 'none',
        });
      },
      fail: (err) => {
        console.error('save poster failed', err);
        this.setData({ isPosterGenerating: false });
        const errMsg = err && err.errMsg ? err.errMsg : '';
        if (errMsg.indexOf('auth') !== -1 || errMsg.indexOf('authorize') !== -1) {
          wx.showModal({
            title: '需要相册权限',
            content: '请允许保存到相册后再试。',
            confirmText: '去设置',
            success(res) {
              if (res.confirm) {
                wx.openSetting();
              }
            },
          });
          return;
        }
        wx.showToast({
          title: '保存图片失败',
          icon: 'none',
        });
      },
    });
  },

  onFavoriteItemTap(event) {
    const { itemId, classKey, className } = event.currentTarget.dataset;
    if (!itemId || !classKey) {
      return;
    }

    wx.showLoading({ title: '加载中' });
    this.loadClassItems(classKey).then((cache) => {
      wx.hideLoading();
      const item = cache && cache.itemMap[itemId];
      if (!item) {
        wx.showToast({
          title: '未找到装备详情',
          icon: 'none',
        });
        return;
      }

      this.setData({
        showModal: true,
        pageStyle: 'overflow:hidden;height:100vh;',
        selectedItem: buildItemDetail({
          ...item,
          isFavorite: isFavorite(classKey, item.id),
          classKey,
          className: className || cache.className,
        }, null, cache.specs),
      });
    }).catch(() => {
      wx.hideLoading();
      wx.showToast({
        title: '加载装备详情失败',
        icon: 'none',
      });
    });
  },

  onDetailFavoriteTap(event) {
    const itemId = event.detail && event.detail.itemId;
    const item = this.data.selectedItem;
    if (!item || item.id !== itemId) {
      return;
    }

    const classKey = item.classKey;
    const className = item.className || '';
    const result = toggleFavorite(buildFavoriteSnapshot(classKey, className, item));
    this.refreshCachedFavoriteState(classKey, item.id, result.isFavorite);
    this.setData({
      selectedItem: {
        ...item,
        isFavorite: result.isFavorite,
      },
    });
    this.refreshFavorites();
  },

  closeModal() {
    this.setData({
      showModal: false,
      selectedItem: null,
      pageStyle: this.data.showFavorites || this.data.showSharedFavorites ? 'overflow:hidden;height:100vh;' : '',
    });
  },

  getActiveShareFavorites() {
    if (this.data.showSharedFavorites && this.data.sharedFavoriteList.length) {
      return this.data.sharedFavoriteList;
    }
    if (this.data.showFavorites && this.data.favoriteList.length) {
      return this.data.favoriteList;
    }
    return [];
  },

  onShareAppMessage(options = {}) {
    if (options.from === 'button') {
      const favoriteList = this.data.favoriteList.length ? this.data.favoriteList : getFavorites();
      const payload = buildFavoriteSharePayload(favoriteList);
      if (payload) {
        return {
          title: buildFavoriteShareTitle(favoriteList),
          path: `/pages/index/index?shareFav=${encodeURIComponent(payload)}`,
        };
      }
    }

    const activeShareFavorites = this.getActiveShareFavorites();
    if (activeShareFavorites.length) {
      const payload = buildFavoriteSharePayload(activeShareFavorites);
      if (payload) {
        return {
          title: buildFavoriteShareTitle(activeShareFavorites),
          path: `/pages/index/index?shareFav=${encodeURIComponent(payload)}`,
        };
      }
    }

    return {
      title: '艾泽配装 · 当赛季装备一键速查',
      path: '/pages/index/index',
    };
  },

  onShareTimeline() {
    const activeShareFavorites = this.getActiveShareFavorites();
    if (activeShareFavorites.length) {
      const payload = buildFavoriteSharePayload(activeShareFavorites);
      if (payload) {
        return {
          title: buildFavoriteShareTitle(activeShareFavorites),
          query: `shareFav=${encodeURIComponent(payload)}`,
        };
      }
    }

    return {
      title: '艾泽配装 · 当赛季装备一键速查',
    };
  },

  onClassTap(event) {
    const { key, name } = event.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/equipment/equipment?classKey=${key}&className=${name}`,
    });
  },

  preventClose() {},
});
