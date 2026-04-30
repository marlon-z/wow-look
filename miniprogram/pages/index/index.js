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
const POSTER_HEIGHT = 1000;
const POSTER_BG = '/assets/poster/favorite-poster-bg.jpg';
const POSTER_ITEMS_PER_PAGE = 10;
const POSTER_PAGE_UNITS = 12;

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

function drawStrokedText(ctx, text, x, y, strokeColor = 'rgba(0, 0, 0, 0.86)', strokeWidth = 5) {
  if (ctx.setLineWidth) {
    ctx.setLineWidth(strokeWidth);
  } else {
    ctx.lineWidth = strokeWidth;
  }
  if (ctx.setStrokeStyle) {
    ctx.setStrokeStyle(strokeColor);
  } else {
    ctx.strokeStyle = strokeColor;
  }
  if (ctx.strokeText) {
    ctx.strokeText(text, x, y);
  }
  ctx.fillText(text, x, y);
}

function drawPosterBrand(ctx) {
  setPosterTextStyle(ctx, 48, '#f3e6c3', 'bold', 'center');
  ctx.setShadow(0, 8, 18, 'rgba(0, 0, 0, 0.88)');
  drawStrokedText(ctx, '我的艾泽拉斯装备库', POSTER_WIDTH / 2, 92, 'rgba(0, 0, 0, 0.92)', 7);
  ctx.setShadow(0, 0, 0, 'transparent');
}

function getFavoriteGroupsTotal(groups) {
  return groups.reduce((total, group) => total + group.items.length, 0);
}

function addGroupItemToPosterPage(page, sourceGroup, favorite) {
  let pageGroup = page.groups[page.groups.length - 1];
  if (!pageGroup || pageGroup.classKey !== sourceGroup.classKey) {
    pageGroup = {
      classKey: sourceGroup.classKey,
      className: sourceGroup.className,
      count: 0,
      items: [],
    };
    page.groups.push(pageGroup);
    page.units += 1;
  }

  pageGroup.items.push(favorite);
  pageGroup.count += 1;
  page.itemCount += 1;
  page.units += 1;
}

function buildFavoritePosterPages(groups) {
  const pages = [];
  let page = {
    groups: [],
    itemCount: 0,
    units: 0,
  };

  groups.forEach((group) => {
    group.items.forEach((favorite) => {
      const needsGroupTitle = !page.groups.length || page.groups[page.groups.length - 1].classKey !== group.classKey;
      const nextUnits = page.units + 1 + (needsGroupTitle ? 1 : 0);
      if (
        page.itemCount > 0
        && (page.itemCount >= POSTER_ITEMS_PER_PAGE || nextUnits > POSTER_PAGE_UNITS)
      ) {
        pages.push(page);
        page = {
          groups: [],
          itemCount: 0,
          units: 0,
        };
      }

      addGroupItemToPosterPage(page, group, favorite);
    });
  });

  if (page.itemCount > 0) {
    pages.push(page);
  }

  return pages;
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
    posterCanvasHeight: POSTER_HEIGHT,
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

    const posterPages = buildFavoritePosterPages(favoriteGroups);
    this.setData({
      isPosterGenerating: true,
      posterCanvasHeight: POSTER_HEIGHT,
    }, () => {
      setTimeout(() => {
        this.createFavoritePosterImages(posterPages, favoriteGroups);
      }, 300);
    });
  },

  createFavoritePosterImages(posterPages, favoriteGroups) {
    const totalPages = posterPages.length;
    const totalItems = getFavoriteGroupsTotal(favoriteGroups);
    const totalClasses = favoriteGroups.length;
    const saveTasks = posterPages.reduce((task, posterPage, index) => task.then(() => (
      this.drawFavoritePosterPage(posterPage, {
        pageIndex: index + 1,
        totalPages,
        totalItems,
        totalClasses,
      }).then((filePath) => this.savePosterFileToAlbum(filePath))
    )), Promise.resolve());

    saveTasks.then(() => {
      this.setData({ isPosterGenerating: false });
      wx.showToast({
        title: totalPages > 1 ? `已保存${totalPages}张图片` : '已保存到相册',
        icon: 'none',
      });
    }).catch((err) => {
      console.error('save poster pages failed', err);
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
        title: totalPages > 1 ? '部分图片保存失败' : '保存图片失败',
        icon: 'none',
      });
    });
  },

  drawFavoritePosterPage(posterPage, posterMeta) {
    const ctx = wx.createCanvasContext(POSTER_CANVAS_ID, this);
    const summary = `${posterMeta.totalItems} 件装备收藏 · ${posterMeta.totalClasses} 个职业 · 第 ${posterMeta.pageIndex}/${posterMeta.totalPages} 张`;
    let y = 216;

    ctx.clearRect(0, 0, POSTER_WIDTH, POSTER_HEIGHT);
    ctx.drawImage(POSTER_BG, 0, 0, POSTER_WIDTH, POSTER_HEIGHT);

    drawRoundRect(ctx, 44, 156, 662, 722, 28, 'rgba(13, 10, 18, 0.76)', 'rgba(212, 168, 75, 0.32)');
    drawRoundRect(ctx, 64, 176, 622, 682, 18, 'rgba(10, 8, 13, 0.38)', 'rgba(255, 255, 255, 0.05)');

    drawPosterBrand(ctx);
    setPosterTextStyle(ctx, 22, '#a69882', 'normal', 'center');
    ctx.setShadow(0, 4, 10, 'rgba(0, 0, 0, 0.82)');
    drawStrokedText(ctx, summary, POSTER_WIDTH / 2, 128, 'rgba(0, 0, 0, 0.82)', 4);
    ctx.setShadow(0, 0, 0, 'transparent');

    posterPage.groups.forEach((group) => {
      setPosterTextStyle(ctx, 26, '#ffbb12', 'bold');
      ctx.fillText(`◇ ${group.className}`, 84, y);
      setPosterTextStyle(ctx, 20, '#a79e8f', 'bold', 'right');
      ctx.fillText(`${group.count} 件`, 666, y);
      y += 18;

      group.items.forEach((favorite) => {
        drawRoundRect(ctx, 72, y, 606, 52, 12, 'rgba(32, 27, 38, 0.9)', 'rgba(255, 255, 255, 0.08)');
        drawRoundRect(ctx, 90, y + 12, 58, 28, 6, 'rgba(255, 187, 18, 0.08)', 'rgba(255, 187, 18, 0.38)');

        setPosterTextStyle(ctx, 19, '#ffbb12', 'bold', 'center');
        drawEllipsisText(ctx, favorite.slotBadgeName || favorite.slotName || '装备', 119, y + 33, 50);

        setPosterTextStyle(ctx, 22, '#b55cff', 'bold', 'left');
        drawEllipsisText(ctx, favorite.name, 168, y + 24, 344);

        setPosterTextStyle(ctx, 19, '#cfc1a6', 'bold', 'right');
        ctx.fillText(`ilvl${favorite.ilvl || '-'}`, 652, y + 24);

        setPosterTextStyle(ctx, 18, '#38f038', 'bold', 'left');
        drawEllipsisText(ctx, favorite.statLine || '无常规副属性', 168, y + 45, 270);

        setPosterTextStyle(ctx, 17, '#8d8579', 'normal', 'right');
        drawEllipsisText(ctx, favorite.sourceName || favorite.encounterName || '装备来源', 652, y + 45, 160);

        y += 62;
      });

      y += 18;
    });

    drawRoundRect(ctx, 214, POSTER_HEIGHT - 116, 322, 78, 18, 'rgba(0, 0, 0, 0.34)', 'rgba(212, 168, 75, 0.16)');
    setPosterTextStyle(ctx, 22, '#b8aa8f', 'normal', 'center');
    ctx.setShadow(0, 4, 10, 'rgba(0, 0, 0, 0.86)');
    drawStrokedText(ctx, '微信搜索「艾泽配装」', POSTER_WIDTH / 2, POSTER_HEIGHT - 82, 'rgba(0, 0, 0, 0.86)', 4);
    setPosterTextStyle(ctx, 18, '#857966', 'normal', 'center');
    drawStrokedText(ctx, '收藏装备 · 分享配装思路', POSTER_WIDTH / 2, POSTER_HEIGHT - 52, 'rgba(0, 0, 0, 0.8)', 3);
    ctx.setShadow(0, 0, 0, 'transparent');

    return new Promise((resolve, reject) => {
      ctx.draw(false, () => {
        setTimeout(() => {
          wx.canvasToTempFilePath({
            canvasId: POSTER_CANVAS_ID,
            x: 0,
            y: 0,
            width: POSTER_WIDTH,
            height: POSTER_HEIGHT,
            destWidth: POSTER_WIDTH,
            destHeight: POSTER_HEIGHT,
            fileType: 'png',
            success: (res) => {
              resolve(res.tempFilePath);
            },
            fail: (err) => {
              console.error('create poster image failed', err);
              reject(err);
            },
          }, this);
        }, 500);
      });
    });
  },

  savePosterFileToAlbum(filePath) {
    return new Promise((resolve, reject) => {
      wx.saveImageToPhotosAlbum({
        filePath,
        success: resolve,
        fail: (err) => {
          console.error('save poster failed', err);
          reject(err);
        },
      });
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
