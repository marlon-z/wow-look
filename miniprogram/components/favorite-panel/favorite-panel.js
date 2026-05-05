const POSTER_CANVAS_ID = 'favoritePosterCanvas';
const POSTER_WIDTH = 750;
const POSTER_HEIGHT = 1000;
const POSTER_ITEMS_PER_PAGE = 8;
const POSTER_PAGE_UNITS = 9;
const POSTER_ITEM_CARD_HEIGHT = 70;
const POSTER_ITEM_CARD_GAP = 8;

function drawRoundRect(ctx, x, y, width, height, radius, fillStyle, strokeStyle, lineWidth = 1) {
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
    ctx.setLineWidth(lineWidth);
    ctx.setStrokeStyle(strokeStyle);
    ctx.stroke();
  }
}

function clipRoundRect(ctx, x, y, width, height, radius) {
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
  ctx.clip();
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
  while (output.length > 0 && measurePosterText(ctx, `${output}...`) > maxWidth) {
    output = output.slice(0, -1);
  }
  ctx.fillText(`${output}...`, x, y);
}

function drawStrokedText(ctx, text, x, y, strokeColor = 'rgba(0, 0, 0, 0.86)', strokeWidth = 5) {
  ctx.setLineWidth(strokeWidth);
  ctx.setStrokeStyle(strokeColor);
  if (ctx.strokeText) {
    ctx.strokeText(text, x, y);
  }
  ctx.fillText(text, x, y);
}

function drawPosterGroupTitle(ctx, title, x, y) {
  const centerX = x + 8;
  const centerY = y - 8;
  const size = 7;

  ctx.beginPath();
  ctx.moveTo(centerX, centerY - size);
  ctx.lineTo(centerX + size, centerY);
  ctx.lineTo(centerX, centerY + size);
  ctx.lineTo(centerX - size, centerY);
  ctx.closePath();
  ctx.setStrokeStyle('#ffbb12');
  ctx.setLineWidth(2);
  ctx.stroke();
  ctx.fillText(title, x + 24, y);
}

function createPosterGlow(ctx, x, y, radius, stops) {
  const gradient = ctx.createRadialGradient
    ? ctx.createRadialGradient(x, y, 20, x, y, radius)
    : ctx.createCircularGradient(x, y, radius);
  stops.forEach((stop) => {
    gradient.addColorStop(stop[0], stop[1]);
  });
  return gradient;
}

function drawPosterBackground(ctx) {
  const bg = ctx.createLinearGradient(0, 0, 0, POSTER_HEIGHT);
  bg.addColorStop(0, '#17101d');
  bg.addColorStop(0.45, '#09070d');
  bg.addColorStop(1, '#130d18');
  ctx.setFillStyle(bg);
  ctx.fillRect(0, 0, POSTER_WIDTH, POSTER_HEIGHT);

  ctx.setFillStyle(createPosterGlow(ctx, POSTER_WIDTH / 2, 90, 380, [
    [0, 'rgba(108, 53, 142, 0.42)'],
    [0.48, 'rgba(68, 31, 94, 0.18)'],
    [1, 'rgba(0, 0, 0, 0)'],
  ]));
  ctx.fillRect(0, 0, POSTER_WIDTH, 360);

  ctx.setFillStyle(createPosterGlow(ctx, POSTER_WIDTH / 2, POSTER_HEIGHT - 60, 360, [
    [0, 'rgba(87, 42, 112, 0.36)'],
    [0.45, 'rgba(53, 27, 74, 0.16)'],
    [1, 'rgba(0, 0, 0, 0)'],
  ]));
  ctx.fillRect(0, POSTER_HEIGHT - 320, POSTER_WIDTH, 320);

  drawRoundRect(ctx, 34, 24, 682, 934, 30, 'rgba(4, 3, 7, 0.28)', 'rgba(212, 168, 75, 0.34)');
  drawRoundRect(ctx, 48, 38, 654, 906, 24, null, 'rgba(255, 255, 255, 0.06)');
}

function collectPosterIconUrls(posterPage) {
  const iconMap = {};
  (posterPage.groups || []).forEach((group) => {
    (group.items || []).forEach((favorite) => {
      if (favorite.iconAsset) {
        iconMap[favorite.iconAsset] = true;
      }
    });
  });
  return Object.keys(iconMap);
}

function loadPosterImage(url) {
  return new Promise((resolve) => {
    if (!url) {
      resolve('');
      return;
    }
    wx.getImageInfo({
      src: url,
      success(res) {
        resolve(res.path || url);
      },
      fail() {
        resolve('');
      },
    });
  });
}

function loadPosterIconMap(posterPage) {
  const urls = collectPosterIconUrls(posterPage);
  if (!urls.length) {
    return Promise.resolve({});
  }
  return Promise.all(urls.map((url) => loadPosterImage(url).then((path) => ({ url, path })))).then((results) => {
    const iconMap = {};
    results.forEach((item) => {
      if (item.path) {
        iconMap[item.url] = item.path;
      }
    });
    return iconMap;
  });
}

function drawPosterFavoriteItem(ctx, favorite, y, iconMap) {
  const cardX = 72;
  const cardY = y;
  const cardWidth = 606;
  const iconX = cardX + 16;
  const iconY = cardY + 10;
  const iconSize = 50;
  const bodyX = iconX + iconSize + 18;
  const rightX = cardX + cardWidth - 18;

  drawRoundRect(ctx, cardX, cardY, cardWidth, POSTER_ITEM_CARD_HEIGHT, 12, 'rgba(31, 27, 37, 0.9)', 'rgba(255, 255, 255, 0.055)');

  const iconPath = favorite.iconAsset ? iconMap[favorite.iconAsset] : '';
  if (iconPath) {
    ctx.save();
    clipRoundRect(ctx, iconX, iconY, iconSize, iconSize, 8);
    ctx.drawImage(iconPath, iconX, iconY, iconSize, iconSize);
    ctx.restore();
  } else {
    drawRoundRect(ctx, iconX, iconY, iconSize, iconSize, 8, 'rgba(28, 24, 34, 0.96)', null);
    setPosterTextStyle(ctx, 24, '#b55cff', 'bold', 'center');
    ctx.fillText(favorite.iconText || (favorite.name ? favorite.name.slice(0, 1) : '装'), iconX + iconSize / 2, iconY + 35);
  }
  drawRoundRect(ctx, iconX, iconY, iconSize, iconSize, 8, null, 'rgba(255, 255, 255, 0.14)');

  drawRoundRect(ctx, rightX - 56, cardY + 12, 56, 24, 5, 'rgba(255, 187, 18, 0.06)', 'rgba(255, 187, 18, 0.28)');
  setPosterTextStyle(ctx, 17, '#f0b931', 'normal', 'center');
  drawEllipsisText(ctx, favorite.slotBadgeName || favorite.slotName || '装备', rightX - 28, cardY + 30, 48);

  setPosterTextStyle(ctx, 21, '#b55cff', 'bold', 'left');
  drawEllipsisText(ctx, favorite.name, bodyX, cardY + 25, 330);
  setPosterTextStyle(ctx, 17, '#38f038', 'bold', 'left');
  drawEllipsisText(ctx, favorite.statLine || '无常规副属性', bodyX, cardY + 47, 348);
  setPosterTextStyle(ctx, 16, '#8d8579', 'normal', 'left');
  drawEllipsisText(ctx, `${favorite.className || ''} · ilvl${favorite.ilvl || '-'}`, bodyX, cardY + 64, 190);
  setPosterTextStyle(ctx, 16, '#8d8579', 'normal', 'right');
  drawEllipsisText(ctx, `${favorite.sourceName || favorite.encounterName || '装备来源'} ›`, rightX, cardY + 64, 178);
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
      if (page.itemCount > 0 && (page.itemCount >= POSTER_ITEMS_PER_PAGE || nextUnits > POSTER_PAGE_UNITS)) {
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

Component({
  options: {
    styleIsolation: 'apply-shared',
  },

  properties: {
    visible: {
      type: Boolean,
      value: false,
    },
    favoriteCount: {
      type: Number,
      value: 0,
    },
    favoriteGroups: {
      type: Array,
      value: [],
    },
    favoriteSortMode: {
      type: String,
      value: 'slot',
    },
    pendingRemoveFavoriteKey: {
      type: String,
      value: '',
    },
  },

  data: {
    isPosterGenerating: false,
    posterCanvasHeight: POSTER_HEIGHT,
  },

  methods: {
    handleClose() {
      this.triggerEvent('close');
    },

    handlePanelTap() {
      this.triggerEvent('clearpending');
    },

    handleClearPending() {
      this.triggerEvent('clearpending');
    },

    handleToggleSort() {
      this.triggerEvent('togglesort');
    },

    handleClearFavorites() {
      this.triggerEvent('clear');
    },

    handleRemoveFavorite(event) {
      const { key } = event.currentTarget.dataset;
      this.triggerEvent('remove', { key });
    },

    handleItemTap(event) {
      const { itemId, classKey, className } = event.currentTarget.dataset;
      this.triggerEvent('itemtap', {
        itemId,
        classKey,
        className,
      });
    },

    createFavoritePoster() {
      const favoriteGroups = this.properties.favoriteGroups || [];
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
      return loadPosterIconMap(posterPage).then((iconMap) => {
        const ctx = wx.createCanvasContext(POSTER_CANVAS_ID, this);
        const summary = `${posterMeta.totalItems} 件装备收藏 · ${posterMeta.totalClasses} 个职业 · 第 ${posterMeta.pageIndex}/${posterMeta.totalPages} 张`;
        let y = 216;

        ctx.clearRect(0, 0, POSTER_WIDTH, POSTER_HEIGHT);
        drawPosterBackground(ctx);
        drawRoundRect(ctx, 54, 156, 642, 722, 24, 'rgba(8, 6, 12, 0.72)', 'rgba(212, 168, 75, 0.22)');
        drawRoundRect(ctx, 66, 170, 618, 694, 18, 'rgba(16, 13, 21, 0.58)', 'rgba(255, 255, 255, 0.04)');

        setPosterTextStyle(ctx, 48, '#f3e6c3', 'bold', 'center');
        ctx.setShadow(0, 8, 18, 'rgba(0, 0, 0, 0.88)');
        drawStrokedText(ctx, '收藏夹·艾泽配装', POSTER_WIDTH / 2, 92, 'rgba(0, 0, 0, 0.92)', 7);
        setPosterTextStyle(ctx, 22, '#a69882', 'normal', 'center');
        drawStrokedText(ctx, summary, POSTER_WIDTH / 2, 128, 'rgba(0, 0, 0, 0.82)', 4);
        ctx.setShadow(0, 0, 0, 'transparent');

        posterPage.groups.forEach((group) => {
          setPosterTextStyle(ctx, 26, '#ffbb12', 'bold');
          drawPosterGroupTitle(ctx, group.className, 84, y);
          setPosterTextStyle(ctx, 20, '#a79e8f', 'bold', 'right');
          ctx.fillText(`${group.count} 件`, 666, y);
          y += 18;

          group.items.forEach((favorite) => {
            drawPosterFavoriteItem(ctx, favorite, y, iconMap);
            y += POSTER_ITEM_CARD_HEIGHT + POSTER_ITEM_CARD_GAP;
          });

          y += 26;
        });

        setPosterTextStyle(ctx, 22, '#b8aa8f', 'normal', 'center');
        ctx.setStrokeStyle('rgba(212, 168, 75, 0.24)');
        ctx.setLineWidth(1);
        ctx.beginPath();
        ctx.moveTo(80, POSTER_HEIGHT - 70);
        ctx.lineTo(178, POSTER_HEIGHT - 70);
        ctx.moveTo(572, POSTER_HEIGHT - 70);
        ctx.lineTo(670, POSTER_HEIGHT - 70);
        ctx.stroke();
        ctx.setShadow(0, 4, 10, 'rgba(0, 0, 0, 0.86)');
        drawStrokedText(ctx, '微信小程序搜索「艾泽配装」', POSTER_WIDTH / 2, POSTER_HEIGHT - 68, 'rgba(0, 0, 0, 0.86)', 4);
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
                destWidth: POSTER_WIDTH * 2,
                destHeight: POSTER_HEIGHT * 2,
                fileType: 'png',
                success: (res) => resolve(res.tempFilePath),
                fail: (err) => {
                  console.error('create poster image failed', err);
                  reject(err);
                },
              }, this);
            }, 500);
          });
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
  },
});
