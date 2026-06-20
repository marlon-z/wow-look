var { COS_BASE, CLASS_LIST, getClassMeta, getClassVisualAssets, loadClassData } = require('../../utils/class-data');
var {
  getBuilds, getSavedBuilds, createBuild, confirmSaveBuild,
  cleanupDrafts, getBuild, updateBuild,
  clearSlot, deleteBuild, renameBuild,
  clearAllSlots, emptySlots,
} = require('../../utils/builds');
var { getLayouts, mainHandOccupiesBoth, sanitizeWeaponSlots } = require('../../utils/weapon-rules');

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

    showBuildList: false,
    buildList: [],

    pageStyle: '',
  },

  onLoad: function (options) {
    cleanupDrafts();
    if (options.buildId) {
      var build = getBuild(options.buildId);
      if (build) {
        this.enterBuildPhase(build);
        return;
      }
    }
    if (options.classKey && options.specId) {
      this.quickStart(options.classKey, options.className || '', Number(options.specId), options.specName || '');
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

    var updates = { specId: specId, specName: specName };
    var sanitized = sanitizeWeaponSlots(this.data.slots, specId);
    updates.slots = sanitized.slots;

    var updated = updateBuild(this.data.currentBuildId, updates);
    if (!updated) return;

    this.setData({
      selectedSpecId: specId,
      selectedSpecName: specName,
      slots: updated.slots,
      summary: updated.summary,
      bottomSlots: getWeaponSlotsForSpec(specId, updated.slots),
    });
    if (sanitized.changed) {
      wx.showToast({ title: '已移除新专精不能使用的武器', icon: 'none' });
    } else if (mainHandOccupiesBoth(specId, updated.slots.weapon) && getLayouts(specId).length > 1) {
      wx.showToast({ title: '当前双手武器仍可使用', icon: 'none' });
    }
  },

  onShareAppMessage: function () {
    return {
      title: '艾泽配装 · 配装模拟器',
      path: '/pages/build/build',
    };
  },

  preventClose: function () {},
});
