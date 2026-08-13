var { COS_BASE, CLASS_LIST, getClassMeta, getClassVisualAssets, loadClassData } = require('../../utils/class-data');
var {
  getBuilds, getSavedBuilds, createBuild, confirmSaveBuild,
  cleanupDrafts, getBuild, updateBuild,
  clearSlot, deleteBuild, renameBuild,
  clearAllSlots, emptySlots,
} = require('../../utils/builds');
var { getLayouts, mainHandOccupiesBoth, sanitizeWeaponSlots } = require('../../utils/weapon-rules');
var {
  WCL_SEASON_AVAILABLE,
  loadWclPresetIndex,
  loadWclPresetFile,
  applyWclPresetToBuild,
} = require('../../utils/wcl-presets');

var SLOT_CONFIG = {
  left: [
    { key: 'head',     name: '头部' },
    { key: 'neck',     name: '项链' },
    { key: 'shoulder', name: '肩部' },
    { key: 'cloak',    name: '披风' },
    { key: 'chest',    name: '胸部' },
    { key: 'shirt',    name: '衬衫', placeholder: true },
    { key: 'tabard',   name: '战袍', placeholder: true },
    { key: 'wrist',    name: '腕部' },
  ],
  right: [
    { key: 'hand',     name: '手部' },
    { key: 'waist',    name: '腰部' },
    { key: 'legs',     name: '腿部' },
    { key: 'feet',     name: '脚部' },
    { key: 'finger1',  name: '戒指1' },
    { key: 'finger2',  name: '戒指2' },
    { key: 'trinket1', name: '饰品1' },
    { key: 'trinket2', name: '饰品2' },
  ],
  bottom: [
    { key: 'weapon',   name: '主手武器' },
    { key: 'weapon2',  name: '副手' },
  ],
};

var SLOT_TO_FILTER = {
  head: 'head', neck: 'neck', shoulder: 'shoulder', cloak: 'cloak',
  chest: 'chest', wrist: 'wrist', hand: 'hand', waist: 'waist',
  legs: 'legs', feet: 'feet',
  finger1: 'finger', finger2: 'finger',
  trinket1: 'trinket', trinket2: 'trinket',
  weapon: 'weapon', weapon2: 'weapon',
};

function getWeaponSlotsForSpec(specId, slots) {
  var layouts = getLayouts(specId);
  var onlySingleTwoHand = layouts.length > 0 && layouts.every(function (layout) { return layout[1] === null; });
  if (onlySingleTwoHand) {
    return [{ key: 'weapon', name: '双手武器' }];
  }
  var occupiedByTwoHand = !!(slots && mainHandOccupiesBoth(specId, slots.weapon));
  return [
    { key: 'weapon', name: occupiedByTwoHand ? '双手武器' : '主手武器' },
    {
      key: 'weapon2',
      name: occupiedByTwoHand ? '双手武器占用' : '副手',
      disabled: occupiedByTwoHand,
    },
  ];
}

Page({
  data: {
    cosBase: COS_BASE,
    phase: 'select',
    classRow1: CLASS_LIST.slice(0, 4).map(function (cls) {
      return { id: cls.id, key: cls.key, shortName: cls.shortName, color: cls.color, emblem: getClassVisualAssets(cls.key).emblem };
    }),
    classRow2: CLASS_LIST.slice(4, 9).map(function (cls) {
      return { id: cls.id, key: cls.key, shortName: cls.shortName, color: cls.color, emblem: getClassVisualAssets(cls.key).emblem };
    }),
    classRow3: CLASS_LIST.slice(9, 13).map(function (cls) {
      return { id: cls.id, key: cls.key, shortName: cls.shortName, color: cls.color, emblem: getClassVisualAssets(cls.key).emblem };
    }),
    selectedClassKey: '',
    selectedClassName: '',
    specs: [],
    selectedSpecId: null,
    selectedSpecName: '',
    heroBannerAsset: '',
    classEmblemAsset: '',

    currentBuildId: '',
    currentBuildName: '',
    isDraft: false,
    slots: emptySlots(),
    leftSlots: SLOT_CONFIG.left,
    rightSlots: SLOT_CONFIG.right,
    bottomSlots: SLOT_CONFIG.bottom,
    summary: null,
    currentWclPresetInfo: null,

    showBuildList: false,
    buildList: [],
    showWclPresets: false,
    wclSeasonAvailable: WCL_SEASON_AVAILABLE,
    wclSpecId: null,
    wclPresetIndex: null,
    wclPresetUpdatedText: '',
    wclContentTabs: [],
    selectedWclContentType: '',
    wclPresetLevels: [],
    selectedWclFileKey: '',
    selectedWclLevelName: '',
    selectedWclDungeonId: 'all',
    wclDungeonFilters: [],
    wclPresetAllEntries: [],
    wclPresetEntries: [],
    wclPresetLoading: false,

    pageStyle: '',
  },

  onLoad: function (options) {
    cleanupDrafts();
    // 从首页"大神排行榜"入口进来(无职业): 选职业进入配装后自动打开排行榜配装面板
    this.pendingWcl = options.openWcl === '1';
    if (options.buildId) {
      var build = getBuild(options.buildId);
      if (build) {
        this.enterBuildPhase(build);
        return;
      }
    }
    if (options.classKey && options.specId) {
      this.quickStart(
        options.classKey,
        options.className ? decodeURIComponent(options.className) : '',
        Number(options.specId),
        options.specName ? decodeURIComponent(options.specName) : ''
      );
      // 来自"分享排行榜配装"的链接: 落地后自动打开排行榜配装
      if (options.openWcl === '1' && typeof this.openWclPresets === 'function') {
        this.openWclPresets();
      }
    }
  },

  quickStart: function (classKey, className, specId, specName) {
    var classMeta = getClassMeta(classKey);
    if (!classMeta) return;
    var build = createBuild(classKey, className || classMeta.name, specId, specName, true);
    this.enterBuildPhase(build);
  },

  onClassTap: function (e) {
    var classKey = e.currentTarget.dataset.key;
    var classMeta = getClassMeta(classKey);
    if (!classMeta) return;

    wx.showLoading({ title: '加载中' });
    loadClassData(classKey).then(function (data) {
      wx.hideLoading();
      if (!data || !data.specs || !data.specs.length) {
        wx.showToast({ title: '加载职业数据失败', icon: 'none' });
        return;
      }
      var firstSpec = data.specs[0];
      var build = createBuild(classKey, classMeta.name, firstSpec.id, firstSpec.name, true);
      this.setData({ specs: data.specs });
      this.enterBuildPhase(build);
      if (this.pendingWcl && typeof this.openWclPresets === 'function') {
        this.pendingWcl = false;
        this.openWclPresets();
      }
    }.bind(this)).catch(function () {
      wx.hideLoading();
      wx.showToast({ title: '加载失败', icon: 'none' });
    });
  },

  enterBuildPhase: function (build) {
    var visualAssets = getClassVisualAssets(build.classKey);
    this.setData({
      phase: 'build',
      isDraft: !!build.draft,
      selectedClassKey: build.classKey,
      selectedClassName: build.className,
      selectedSpecId: build.specId,
      selectedSpecName: build.specName,
      heroBannerAsset: visualAssets.banner,
      classEmblemAsset: visualAssets.emblem,
      currentBuildId: build.id,
      currentBuildName: build.name,
      slots: build.slots,
      summary: build.summary,
      currentWclPresetInfo: build.wclPreset || null,
      bottomSlots: getWeaponSlotsForSpec(build.specId, build.slots),
    });

    this.loadSpecsData(build.classKey);
  },

  loadSpecsData: function (classKey) {
    loadClassData(classKey).then(function (data) {
      if (!data) return;
      this.setData({ specs: data.specs || [] });
    }.bind(this));
  },

  onShow: function () {
    if (this.data.phase === 'build' && this.data.currentBuildId) {
      var build = getBuild(this.data.currentBuildId);
      if (build) {
        this.setData({
          slots: build.slots,
          summary: build.summary,
          currentWclPresetInfo: build.wclPreset || null,
          bottomSlots: getWeaponSlotsForSpec(build.specId, build.slots),
        });
      }
    }
  },

  onSlotTap: function (e) {
    var slotKey = e.currentTarget.dataset.slotKey;
    var slotName = e.currentTarget.dataset.slotName;
    if (e.currentTarget.dataset.disabled) {
      wx.showToast({ title: '先把主手更换为单手武器', icon: 'none' });
      return;
    }
    var currentItem = this.data.slots[slotKey];

    if (currentItem) {
      this.showSlotActions(slotKey, slotName, currentItem);
      return;
    }

    this.navigateToEquipmentPicker(slotKey, slotName);
  },

  showSlotActions: function (slotKey, slotName, currentItem) {
    var self = this;
    wx.showActionSheet({
      itemList: ['更换装备', '查看详情', '清除装备'],
      success: function (res) {
        if (res.tapIndex === 0) {
          self.navigateToEquipmentPicker(slotKey, slotName);
        } else if (res.tapIndex === 1) {
          wx.navigateTo({
            url: '/pages/equipment/equipment?classKey=' + self.data.selectedClassKey
              + '&className=' + encodeURIComponent(self.data.selectedClassName)
              + '&openItemId=' + currentItem.itemId,
          });
        } else if (res.tapIndex === 2) {
          self.doClearSlot(slotKey);
        }
      },
    });
  },

  navigateToEquipmentPicker: function (slotKey, slotName) {
    var filterSlot = SLOT_TO_FILTER[slotKey];
    var params = [
      'classKey=' + this.data.selectedClassKey,
      'className=' + encodeURIComponent(this.data.selectedClassName),
      'buildSlotPick=1',
      'buildId=' + this.data.currentBuildId,
      'slotKey=' + slotKey,
      'slotName=' + encodeURIComponent(slotName),
      'lockSlot=' + (filterSlot || ''),
      'specId=' + (this.data.selectedSpecId || ''),
    ];
    wx.navigateTo({
      url: '/pages/equipment/equipment?' + params.join('&'),
    });
  },

  doClearSlot: function (slotKey) {
    var updated = clearSlot(this.data.currentBuildId, slotKey);
    if (!updated) return;
    this.setData({
      slots: updated.slots,
      summary: updated.summary,
    });
  },

  clearAllSlotsTap: function () {
    var self = this;
    wx.showModal({
      title: '清空装备',
      content: '确定清空所有已选装备？',
      confirmText: '清空',
      confirmColor: '#e05050',
      success: function (res) {
        if (!res.confirm) return;
        var updated = clearAllSlots(self.data.currentBuildId);
        if (!updated) return;
        self.setData({
          slots: updated.slots,
          summary: updated.summary,
        });
      },
    });
  },

  openBuildList: function () {
    var builds = getSavedBuilds();
    this.setData({
      buildList: builds,
      showBuildList: true,
      pageStyle: 'overflow:hidden;height:100vh;',
    });
  },

  openWclPresets: function () {
    this.setData({
      showWclPresets: true,
      pageStyle: 'overflow:hidden;height:100vh;',
      wclPresetLoading: WCL_SEASON_AVAILABLE,
      wclSpecId: this.data.selectedSpecId,
    });
    if (!WCL_SEASON_AVAILABLE) {
      return;
    }
    this.loadWclIndexForSpec(this.data.selectedSpecId);
  },

  // 面板内切专精(与配装专精联动): 换该专精的排行榜; 套用时会直接切到该专精
  onWclSpecTap: function (e) {
    if (!WCL_SEASON_AVAILABLE) return;
    var specId = Number(e.currentTarget.dataset.specId);
    if (specId === this.data.wclSpecId) return;
    this.setData({ wclSpecId: specId, wclPresetLoading: true });
    this.loadWclIndexForSpec(specId);
  },

  loadWclIndexForSpec: function (specId) {
    var self = this;
    loadWclPresetIndex(this.data.selectedClassKey, specId).then(function (index) {
      if (self.data.wclSpecId !== specId) return; // 加载期间又切了专精
      var contentTabs = self.buildWclContentTabs(index);
      if (!index || !contentTabs.length) {
        self.setData({
          wclPresetLoading: false,
          wclPresetIndex: index || null,
          wclPresetUpdatedText: '',
          wclContentTabs: [],
          selectedWclContentType: '',
          wclPresetLevels: [],
          wclDungeonFilters: [],
          wclPresetAllEntries: [],
          wclPresetEntries: [],
        });
        wx.showToast({ title: '当前专精暂无排行榜配装', icon: 'none' });
        return;
      }
      var firstContentType = contentTabs[0].type;
      var categories = self.getWclCategories(index, firstContentType);
      var first = categories[0];
      self.setData({
        wclPresetIndex: index,
        wclPresetUpdatedText: self.formatWclUpdateTime(index.generatedAt, index.dataSource),
        wclContentTabs: contentTabs,
        selectedWclContentType: firstContentType,
        wclPresetLevels: categories,
        selectedWclFileKey: first.fileKey,
        selectedWclLevelName: first.name,
      });
      self.loadWclPresetFile(first.fileKey, first.name);
    }).catch(function () {
      if (self.data.wclSpecId !== specId) return;
      self.setData({ wclPresetLoading: false });
      wx.showToast({ title: '排行榜配装加载失败', icon: 'none' });
    });
  },

  formatWclUpdateTime: function (timestamp, dataSource) {
    var date = new Date(Number(timestamp) || 0);
    if (!date.getTime()) return '';
    var month = date.getMonth() + 1;
    var day = date.getDate();
    var hour = date.getHours();
    var minute = date.getMinutes();
    var sourceText = dataSource === 'remote' ? '云端 · ' : '';
    return sourceText + month + '月' + day + '日 '
      + (hour < 10 ? '0' + hour : hour) + ':'
      + (minute < 10 ? '0' + minute : minute) + '更新';
  },

  buildWclContentTabs: function (index) {
    var tabs = [];
    var mythicPlus = index && Array.isArray(index.mythicPlus) ? index.mythicPlus : [];
    var raid = index && Array.isArray(index.raid) ? index.raid : [];
    if (mythicPlus.length) {
      tabs.push({
        type: 'mythicPlus',
        name: '大秘境',
        count: mythicPlus.reduce(function (total, item) { return total + (item.presetCount || 0); }, 0),
      });
    }
    if (raid.length) {
      tabs.push({
        type: 'raid',
        name: '团本',
        count: raid.reduce(function (total, item) { return total + (item.presetCount || 0); }, 0),
      });
    }
    return tabs;
  },

  getWclCategories: function (index, contentType) {
    if (!index) return [];
    if (contentType === 'raid') return index.raid || [];
    return index.mythicPlus || [];
  },

  onWclContentTap: function (e) {
    var contentType = e.currentTarget.dataset.contentType;
    if (!contentType || contentType === this.data.selectedWclContentType) return;
    var categories = this.getWclCategories(this.data.wclPresetIndex, contentType);
    if (!categories.length) return;
    var first = categories[0];
    this.setData({
      selectedWclContentType: contentType,
      wclPresetLevels: categories,
      selectedWclFileKey: first.fileKey,
      selectedWclLevelName: first.name,
    });
    this.loadWclPresetFile(first.fileKey, first.name);
  },

  closeWclPresets: function () {
    this.setData({
      showWclPresets: false,
      pageStyle: this.data.showBuildList ? 'overflow:hidden;height:100vh;' : '',
    });
  },

  onWclLevelTap: function (e) {
    var fileKey = e.currentTarget.dataset.fileKey;
    var name = e.currentTarget.dataset.name;
    if (!fileKey || fileKey === this.data.selectedWclFileKey) return;
    this.setData({
      selectedWclFileKey: fileKey,
      selectedWclLevelName: name,
    });
    this.loadWclPresetFile(fileKey, name);
  },

  loadWclPresetFile: function (fileKey, levelName) {
    var self = this;
    this.setData({
      wclPresetLoading: true,
      selectedWclDungeonId: 'all',
      wclDungeonFilters: [],
      wclPresetAllEntries: [],
      wclPresetEntries: [],
    });
    loadWclPresetFile(this.data.selectedClassKey, this.data.wclSpecId, fileKey).then(function (content) {
      var entries = self.normalizeWclPresetEntries(content && Array.isArray(content.entries) ? content.entries : []);
      var dungeonFilters = self.buildWclDungeonFilters(entries);
      self.setData({
        selectedWclLevelName: levelName || self.data.selectedWclLevelName,
        selectedWclDungeonId: 'all',
        wclDungeonFilters: dungeonFilters,
        wclPresetAllEntries: entries,
        wclPresetEntries: entries,
        wclPresetLoading: false,
      });
    }).catch(function () {
      self.setData({ wclPresetLoading: false });
      wx.showToast({ title: '预设文件加载失败', icon: 'none' });
    });
  },

  normalizeWclPresetEntries: function (entries) {
    return entries.map(function (entry) {
      var nextEntry = Object.assign({}, entry);
      nextEntry.presets = (entry.presets || []).map(function (preset) {
        var nextPreset = Object.assign({}, preset);
        var source = Object.assign({}, preset.source || {});
        var talents = Object.assign({}, preset.talents || {});
        talents.talentTree = Array.isArray(talents.talentTree) ? talents.talentTree : [];
        var pointCount = talents.talentTree.length;
        source.metricLabel = source.metric === 'hps' ? 'HPS' : 'DPS';
        talents.pointCount = pointCount;
        talents.exportStatusText = talents.exportString ? '可复制' : (pointCount ? '无导入码' : '无天赋');
        if (talents.exportStringMissingReason === 'missing-blueprint') {
          talents.exportMissingText = '缺少专精编码模板';
        } else if (talents.exportStringMissingReason === 'encode-failed') {
          talents.exportMissingText = '天赋编码失败';
        } else {
          talents.exportMissingText = '';
        }
        nextPreset.source = source;
        nextPreset.talents = talents;
        return nextPreset;
      });
      return nextEntry;
    });
  },

  buildWclDungeonFilters: function (entries) {
    var filters = [{
      id: 'all',
      name: '全部',
      count: entries.reduce(function (total, entry) {
        return total + ((entry.presets && entry.presets.length) || 0);
      }, 0),
    }];
    entries.forEach(function (entry) {
      var encounter = entry.encounter || {};
      filters.push({
        id: String(encounter.id),
        name: encounter.localName || encounter.name || '未知副本',
        count: (entry.presets && entry.presets.length) || 0,
      });
    });
    return filters;
  },

  onWclDungeonTap: function (e) {
    var encounterId = String(e.currentTarget.dataset.encounterId || 'all');
    if (encounterId === this.data.selectedWclDungeonId) return;
    var entries = encounterId === 'all'
      ? this.data.wclPresetAllEntries
      : this.data.wclPresetAllEntries.filter(function (entry) {
        return String(entry.encounter && entry.encounter.id) === encounterId;
      });
    this.setData({
      selectedWclDungeonId: encounterId,
      wclPresetEntries: entries,
    });
  },

  onWclPresetTap: function (e) {
    var entryIndex = Number(e.currentTarget.dataset.entryIndex);
    var presetIndex = Number(e.currentTarget.dataset.presetIndex);
    var entry = this.data.wclPresetEntries[entryIndex];
    var preset = entry && entry.presets ? entry.presets[presetIndex] : null;
    if (!preset) return;

    var self = this;
    wx.showModal({
      title: '套用排行榜配装',
      content: '会用该预设覆盖当前装备槽位，是否继续？',
      confirmText: '套用',
      confirmColor: '#d4a84b',
      success: function (res) {
        if (!res.confirm) return;
        self.applyWclPreset(preset);
      },
    });
  },

  applyWclPreset: function (preset) {
    var self = this;
    // 面板选的专精(可能与当前配装专精不同): 套用时直接切到该专精
    var targetSpecId = this.data.wclSpecId || this.data.selectedSpecId;
    var targetSpec = (this.data.specs || []).filter(function (s) { return s.id === targetSpecId; })[0];
    var targetSpecName = targetSpec ? targetSpec.name : this.data.selectedSpecName;
    wx.showLoading({ title: '套用中' });
    loadClassData(this.data.selectedClassKey).then(function (classData) {
      if (targetSpecId !== self.data.selectedSpecId) {
        updateBuild(self.data.currentBuildId, { specId: targetSpecId, specName: targetSpecName, wclPreset: null });
      }
      var result = applyWclPresetToBuild(
        self.data.currentBuildId,
        preset,
        classData,
        targetSpecId,
        self.data.slots
      );
      wx.hideLoading();
      if (!result || !result.build) {
        wx.showToast({ title: '套用失败', icon: 'none' });
        return;
      }
      self.setData({
        selectedSpecId: targetSpecId,
        selectedSpecName: targetSpecName,
        slots: result.build.slots,
        summary: result.build.summary,
        currentWclPresetInfo: result.build.wclPreset || null,
        bottomSlots: getWeaponSlotsForSpec(targetSpecId, result.build.slots),
        showWclPresets: false,
        pageStyle: '',
      });
      wx.showToast({
        title: result.missing.length ? '已套用，部分装备仅有ID' : '已套用排行榜配装',
        icon: 'none',
      });
    }).catch(function () {
      wx.hideLoading();
      wx.showToast({ title: '职业装备库加载失败', icon: 'none' });
    });
  },

  copyWclTalentCode: function () {
    var code = this.data.currentWclPresetInfo
      && this.data.currentWclPresetInfo.talents
      && this.data.currentWclPresetInfo.talents.exportString;
    if (!code) {
      wx.showToast({ title: '暂无天赋代码', icon: 'none' });
      return;
    }
    wx.setClipboardData({
      data: code,
      success: function () {
        wx.showToast({ title: '天赋代码已复制', icon: 'success' });
      },
    });
  },

  closeBuildList: function () {
    this.setData({
      showBuildList: false,
      pageStyle: '',
    });
  },

  onBuildListItemTap: function (e) {
    var buildId = e.currentTarget.dataset.buildId;
    var build = getBuild(buildId);
    if (!build) return;

    if (this.data.isDraft && this.data.currentBuildId) {
      deleteBuild(this.data.currentBuildId);
    }
    this.setData({ showBuildList: false, pageStyle: '' });
    this.enterBuildPhase(build);
  },

  onDeleteBuild: function (e) {
    var buildId = e.currentTarget.dataset.buildId;
    var self = this;

    wx.showModal({
      title: '删除方案',
      content: '确定删除该配装方案？',
      confirmText: '删除',
      confirmColor: '#e05050',
      success: function (res) {
        if (!res.confirm) return;
        deleteBuild(buildId);
        var builds = getSavedBuilds();
        self.setData({ buildList: builds });

        if (buildId === self.data.currentBuildId) {
          if (builds.length) {
            self.enterBuildPhase(builds[0]);
          } else {
            self.setData({
              phase: 'select',
              showBuildList: false,
              pageStyle: '',
            });
          }
        }
      },
    });
  },

  onRenameBuild: function () {
    var self = this;
    wx.showModal({
      title: '重命名方案',
      editable: true,
      placeholderText: this.data.currentBuildName,
      success: function (res) {
        if (!res.confirm || !res.content || !res.content.trim()) return;
        var updated = renameBuild(self.data.currentBuildId, res.content.trim());
        if (updated) {
          self.setData({ currentBuildName: updated.name });
        }
      },
    });
  },

  onSaveBuild: function () {
    var self = this;
    var defaultName = this.data.selectedClassName + ' · ' + this.data.selectedSpecName;
    wx.showModal({
      title: '保存配装方案',
      editable: true,
      placeholderText: defaultName,
      confirmText: '保存',
      success: function (res) {
        if (!res.confirm) return;
        var name = (res.content && res.content.trim()) || defaultName;
        var saved = confirmSaveBuild(self.data.currentBuildId, name);
        if (saved) {
          self.setData({
            isDraft: false,
            currentBuildName: saved.name,
          });
          wx.showToast({ title: '方案已保存', icon: 'success' });
        }
      },
    });
  },

  onNewBuild: function () {
    if (this.data.isDraft && this.data.currentBuildId) {
      deleteBuild(this.data.currentBuildId);
    }
    this.setData({
      phase: 'select',
      isDraft: false,
      showBuildList: false,
      pageStyle: '',
    });
  },

  onBackToSelect: function () {
    if (this.data.isDraft && this.data.currentBuildId) {
      deleteBuild(this.data.currentBuildId);
    }
    this.setData({ phase: 'select', isDraft: false });
  },

  onUnload: function () {
    if (this.data.isDraft && this.data.currentBuildId) {
      deleteBuild(this.data.currentBuildId);
    }
  },

  switchSpec: function (e) {
    var specId = e.currentTarget.dataset.id;
    var specName = e.currentTarget.dataset.name;
    if (specId === this.data.selectedSpecId) return;

    var updates = { specId: specId, specName: specName, wclPreset: null };
    var sanitized = sanitizeWeaponSlots(this.data.slots, specId);
    updates.slots = sanitized.slots;

    var updated = updateBuild(this.data.currentBuildId, updates);
    if (!updated) return;

    this.setData({
      selectedSpecId: specId,
      selectedSpecName: specName,
      slots: updated.slots,
      summary: updated.summary,
      currentWclPresetInfo: updated.wclPreset || null,
      bottomSlots: getWeaponSlotsForSpec(specId, updated.slots),
    });
    if (sanitized.changed) {
      wx.showToast({ title: '已移除新专精不能使用的武器', icon: 'none' });
    } else if (mainHandOccupiesBoth(specId, updated.slots.weapon) && getLayouts(specId).length > 1) {
      wx.showToast({ title: '当前双手武器仍可使用', icon: 'none' });
    }
  },

  buildShareBase: function () {
    return 'classKey=' + (this.data.selectedClassKey || '')
      + '&specId=' + (this.data.selectedSpecId || '')
      + '&className=' + encodeURIComponent(this.data.selectedClassName || '')
      + '&specName=' + encodeURIComponent(this.data.selectedSpecName || '');
  },

  onShareAppMessage: function (options) {
    var ds = (options && options.target && options.target.dataset) || {};
    var classKey = this.data.selectedClassKey;
    var className = this.data.selectedClassName || '';
    var specName = this.data.selectedSpecName || '';

    // 方案2: 分享某套排行榜配装(一键抄作业)
    if (ds.shareType === 'wcl-preset') {
      var entry = (this.data.wclPresetEntries || [])[ds.entryIndex];
      var preset = entry && entry.presets ? entry.presets[ds.presetIndex] : null;
      var scoreText = preset && preset.source && preset.source.score ? ('·评分' + preset.source.score) : '';
      var title = preset
        ? (className + specName + ' ' + preset.name + scoreText + ' · 一键抄作业')
        : (className + specName + ' 排行榜配装 · 一键抄作业');
      return {
        title: title,
        path: '/pages/build/build?' + this.buildShareBase() + '&openWcl=1&wclContent=' + (this.data.selectedWclContentType || ''),
      };
    }

    // 方案1: 分享当前配装(落到该职业专精)
    if (ds.shareType === 'build' && classKey) {
      return {
        title: '看看这套' + className + specName + '配装｜艾泽配装',
        path: '/pages/build/build?' + this.buildShareBase(),
      };
    }

    // 默认(右上…菜单转发)
    if (classKey) {
      return { title: className + specName + ' 配装 · 艾泽配装', path: '/pages/build/build?' + this.buildShareBase() };
    }
    return { title: '艾泽配装 · 配装模拟器', path: '/pages/build/build' };
  },

  onShareTimeline: function () {
    if (!this.data.selectedClassKey) {
      return { title: '艾泽配装 · 配装模拟器' };
    }
    return {
      title: (this.data.selectedClassName || '') + (this.data.selectedSpecName || '') + ' 配装 · 艾泽配装',
      query: this.buildShareBase(),
    };
  },

  preventClose: function () {},
});
