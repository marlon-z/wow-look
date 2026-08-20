var {
  CLASS_LIST,
  getClassMeta,
  getClassVisualAssets,
  loadClassData,
} = require('../../utils/class-data');
var {
  WCL_SEASON_AVAILABLE,
  loadWclPresetIndex,
  loadWclPresetFile,
  hasWclCombatantSnapshot,
} = require('../../utils/wcl-presets');

function decodeParam(value) {
  if (typeof value !== 'string') return '';
  try {
    return decodeURIComponent(value);
  } catch (err) {
    return '';
  }
}

function getPresetAt(entries, entryIndex, presetIndex) {
  var entry = entries && entries[Number(entryIndex)];
  return entry && entry.presets ? entry.presets[Number(presetIndex)] : null;
}

function compactClassList() {
  return CLASS_LIST.map(function (classMeta) {
    return {
      id: classMeta.id,
      key: classMeta.key,
      name: classMeta.shortName,
      color: classMeta.color,
      emblem: getClassVisualAssets(classMeta.key).emblem,
    };
  });
}

Page({
  classRequestId: 0,
  indexRequestId: 0,
  fileRequestId: 0,
  initialOptions: null,

  data: {
    phase: 'class',
    classRow1: compactClassList().slice(0, 4),
    classRow2: compactClassList().slice(4, 9),
    classRow3: compactClassList().slice(9, 13),
    selectedClassKey: '',
    selectedClassName: '',
    selectedClassEmblem: '',
    specs: [],
    selectedSpecId: null,
    selectedSpecName: '',
    wclSeasonAvailable: WCL_SEASON_AVAILABLE,
    cloudUpdateText: '',
    rankingLoading: false,
    rankingError: '',
    wclPresetIndex: null,
    wclContentTabs: [],
    selectedWclContentType: '',
    wclPresetLevels: [],
    selectedWclFileKey: '',
    selectedWclLevelName: '',
    selectedWclDungeonId: 'all',
    wclDungeonFilters: [],
    wclPresetAllEntries: [],
    wclPresetEntries: [],
  },

  onLoad: function (options) {
    options = options || {};
    var classKey = decodeParam(options.classKey);
    this.initialOptions = {
      classKey: classKey,
      specId: Number(options.specId) || 0,
      contentType: decodeParam(options.contentType),
      fileKey: decodeParam(options.fileKey),
    };
    if (getClassMeta(classKey)) {
      this.selectClass(classKey, this.initialOptions.specId);
    }
  },

  onClassTap: function (event) {
    var classKey = event.currentTarget.dataset.key;
    this.initialOptions = null;
    this.selectClass(classKey, 0);
  },

  selectClass: function (classKey, preferredSpecId) {
    var classMeta = getClassMeta(classKey);
    if (!classMeta) return;
    var requestId = ++this.classRequestId;
    ++this.indexRequestId;
    ++this.fileRequestId;
    this.setData({
      phase: 'ranking',
      selectedClassKey: classKey,
      selectedClassName: classMeta.name,
      selectedClassEmblem: getClassVisualAssets(classKey).emblem,
      specs: [],
      selectedSpecId: null,
      selectedSpecName: '',
      cloudUpdateText: '',
      rankingLoading: true,
      rankingError: '',
      wclPresetIndex: null,
      wclContentTabs: [],
      selectedWclContentType: '',
      wclPresetLevels: [],
      selectedWclFileKey: '',
      selectedWclLevelName: '',
      selectedWclDungeonId: 'all',
      wclDungeonFilters: [],
      wclPresetAllEntries: [],
      wclPresetEntries: [],
    });
    loadClassData(classKey).then(function (classData) {
      if (requestId !== this.classRequestId || this.data.selectedClassKey !== classKey) return;
      var specs = (classData && classData.specs) || [];
      if (!specs.length) {
        this.setData({ rankingLoading: false, rankingError: '职业数据加载失败' });
        return;
      }
      var selectedSpec = specs.filter(function (spec) {
        return Number(spec.id) === Number(preferredSpecId);
      })[0] || specs[0];
      this.setData({
        specs: specs,
        selectedSpecId: selectedSpec.id,
        selectedSpecName: selectedSpec.name,
      });
      this.loadWclIndexForSpec(selectedSpec.id);
    }.bind(this)).catch(function () {
      if (requestId !== this.classRequestId) return;
      this.setData({ rankingLoading: false, rankingError: '职业数据加载失败' });
    }.bind(this));
  },

  onBackToClasses: function () {
    ++this.classRequestId;
    ++this.indexRequestId;
    ++this.fileRequestId;
    this.initialOptions = null;
    this.setData({
      phase: 'class',
      selectedClassKey: '',
      selectedClassName: '',
      selectedClassEmblem: '',
      specs: [],
      selectedSpecId: null,
      selectedSpecName: '',
      cloudUpdateText: '',
      rankingLoading: false,
      rankingError: '',
      wclPresetIndex: null,
      wclContentTabs: [],
      selectedWclContentType: '',
      wclPresetLevels: [],
      selectedWclFileKey: '',
      selectedWclLevelName: '',
      selectedWclDungeonId: 'all',
      wclDungeonFilters: [],
      wclPresetAllEntries: [],
      wclPresetEntries: [],
    });
  },

  onPageBack: function () {
    if (this.data.phase === 'ranking') {
      this.onBackToClasses();
      return;
    }
    wx.navigateBack({ delta: 1 });
  },

  onWclSpecTap: function (event) {
    var specId = Number(event.currentTarget.dataset.specId);
    if (!specId || specId === Number(this.data.selectedSpecId)) return;
    var selectedSpec = (this.data.specs || []).filter(function (spec) {
      return Number(spec.id) === specId;
    })[0];
    if (!selectedSpec) return;
    this.initialOptions = null;
    this.setData({
      selectedSpecId: selectedSpec.id,
      selectedSpecName: selectedSpec.name,
    });
    this.loadWclIndexForSpec(selectedSpec.id);
  },

  formatWclUpdateTime: function (timestamp, dataSource) {
    var date = new Date(Number(timestamp) || 0);
    if (!date.getTime()) return '';
    var hour = date.getHours();
    var minute = date.getMinutes();
    return (dataSource === 'remote' ? '云端 · ' : '')
      + (date.getMonth() + 1) + '月' + date.getDate() + '日 '
      + (hour < 10 ? '0' + hour : hour) + ':'
      + (minute < 10 ? '0' + minute : minute) + '更新';
  },

  buildWclContentTabs: function (index) {
    var tabs = [];
    if (index && Array.isArray(index.mythicPlus) && index.mythicPlus.length) {
      tabs.push({ type: 'mythicPlus', name: '大秘境' });
    }
    if (index && Array.isArray(index.raid) && index.raid.length) {
      tabs.push({ type: 'raid', name: '团本' });
    }
    return tabs;
  },

  getWclCategories: function (index, contentType) {
    if (!index) return [];
    var categories = contentType === 'raid' ? (index.raid || []) : (index.mythicPlus || []);
    if (contentType === 'raid') return categories;

    return categories.map(function (category) {
      if (!category) return category;
      var isPushTier = category.fileKey === 'top' || /^(最顶级|最高层|当前上限)$/.test(category.name || '');
      return isPushTier ? Object.assign({}, category, { name: '冲层', isPushTier: true }) : category;
    }).sort(function (left, right) {
      var priority = function (category) {
        if (category && category.isPushTier) return 0;
        var level = Number(String((category && category.name) || '').match(/\d+/));
        return level ? 100 - level : 50;
      };
      return priority(left) - priority(right);
    });
  },

  loadWclIndexForSpec: function (specId) {
    if (!WCL_SEASON_AVAILABLE) {
      this.setData({ rankingLoading: false, rankingError: '排行榜配装暂未开放' });
      return;
    }
    var classKey = this.data.selectedClassKey;
    var requestId = ++this.indexRequestId;
    ++this.fileRequestId;
    this.setData({
      rankingLoading: true,
      rankingError: '',
      cloudUpdateText: '',
      wclPresetIndex: null,
      wclContentTabs: [],
      selectedWclContentType: '',
      wclPresetLevels: [],
      selectedWclFileKey: '',
      selectedWclLevelName: '',
      selectedWclDungeonId: 'all',
      wclDungeonFilters: [],
      wclPresetAllEntries: [],
      wclPresetEntries: [],
    });
    loadWclPresetIndex(classKey, specId).then(function (index) {
      if (requestId !== this.indexRequestId
        || classKey !== this.data.selectedClassKey
        || Number(specId) !== Number(this.data.selectedSpecId)) return;
      var contentTabs = this.buildWclContentTabs(index);
      if (!index || !contentTabs.length) {
        this.setData({ rankingLoading: false, rankingError: '当前专精暂无排行榜配装' });
        return;
      }
      var preferred = this.initialOptions || {};
      var preferredType = contentTabs.filter(function (tab) {
        return tab.type === preferred.contentType;
      })[0];
      var contentType = preferredType ? preferredType.type : contentTabs[0].type;
      var categories = this.getWclCategories(index, contentType);
      var preferredLevel = categories.filter(function (category) {
        return category.fileKey === preferred.fileKey;
      })[0];
      var first = preferredLevel || categories[0];
      this.initialOptions = null;
      this.setData({
        wclPresetIndex: index,
        cloudUpdateText: this.formatWclUpdateTime(index.generatedAt, index.dataSource),
        wclContentTabs: contentTabs,
        selectedWclContentType: contentType,
        wclPresetLevels: categories,
        selectedWclFileKey: first.fileKey,
        selectedWclLevelName: first.name,
      });
      this.loadWclPresetFile(first.fileKey, first.name);
    }.bind(this)).catch(function () {
      if (requestId !== this.indexRequestId) return;
      this.setData({ rankingLoading: false, rankingError: '排行榜配装加载失败' });
    }.bind(this));
  },

  onWclContentTap: function (event) {
    var contentType = event.currentTarget.dataset.contentType;
    if (!contentType || contentType === this.data.selectedWclContentType) return;
    var categories = this.getWclCategories(this.data.wclPresetIndex, contentType);
    if (!categories.length) return;
    var first = categories[0];
    ++this.fileRequestId;
    this.setData({
      selectedWclContentType: contentType,
      wclPresetLevels: categories,
      selectedWclFileKey: first.fileKey,
      selectedWclLevelName: first.name,
    });
    this.loadWclPresetFile(first.fileKey, first.name);
  },

  onWclLevelTap: function (event) {
    var fileKey = event.currentTarget.dataset.fileKey;
    var name = event.currentTarget.dataset.name;
    if (!fileKey || fileKey === this.data.selectedWclFileKey) return;
    this.setData({ selectedWclFileKey: fileKey, selectedWclLevelName: name || '' });
    this.loadWclPresetFile(fileKey, name || '');
  },

  normalizeWclPresetEntries: function (entries) {
    return (entries || []).map(function (entry) {
      var nextEntry = Object.assign({}, entry);
      nextEntry.presets = (entry.presets || []).map(function (preset) {
        var nextPreset = Object.assign({}, preset);
        var source = Object.assign({}, preset.source || {});
        var talents = Object.assign({}, preset.talents || {});
        talents.talentTree = Array.isArray(talents.talentTree) ? talents.talentTree : [];
        source.metricLabel = source.metric === 'hps' ? 'HPS' : 'DPS';
        talents.exportStatusText = talents.exportString ? '可复制天赋' : '';
        nextPreset.source = source;
        nextPreset.talents = talents;
        return nextPreset;
      });
      return nextEntry;
    });
  },

  buildWclDungeonFilters: function (entries) {
    if (!entries || entries.length < 2) return [];
    return [{ id: 'all', name: '全部' }].concat(entries.map(function (entry) {
      var encounter = entry.encounter || {};
      return {
        id: String(encounter.id),
        name: encounter.localName || encounter.name || '未知副本',
      };
    }));
  },

  loadWclPresetFile: function (fileKey, levelName) {
    var classKey = this.data.selectedClassKey;
    var specId = this.data.selectedSpecId;
    var contentType = this.data.selectedWclContentType;
    var requestId = ++this.fileRequestId;
    this.setData({
      rankingLoading: true,
      rankingError: '',
      selectedWclDungeonId: 'all',
      wclDungeonFilters: [],
      wclPresetAllEntries: [],
      wclPresetEntries: [],
    });
    loadWclPresetFile(classKey, specId, fileKey).then(function (content) {
      if (requestId !== this.fileRequestId
        || classKey !== this.data.selectedClassKey
        || Number(specId) !== Number(this.data.selectedSpecId)
        || fileKey !== this.data.selectedWclFileKey) return;
      if (!content) {
        this.setData({ rankingLoading: false, rankingError: '排行榜数据加载失败' });
        return;
      }
      var entries = this.normalizeWclPresetEntries(Array.isArray(content.entries) ? content.entries : []).filter(function (entry) {
        return Array.isArray(entry.presets) && entry.presets.length > 0;
      });
      var snapshotEnabled = hasWclCombatantSnapshot(this.data.wclPresetIndex, content);
      entries.forEach(function (entry) {
        (entry.presets || []).forEach(function (preset) {
          preset.wclCombatantSnapshotEnabled = snapshotEnabled;
          preset.wclFileKey = fileKey;
          preset.wclContentType = contentType;
        });
      });
      this.setData({
        rankingLoading: false,
        selectedWclLevelName: levelName || this.data.selectedWclLevelName,
        selectedWclDungeonId: 'all',
        wclDungeonFilters: this.buildWclDungeonFilters(entries),
        wclPresetAllEntries: entries,
        wclPresetEntries: entries,
      });
    }.bind(this)).catch(function () {
      if (requestId !== this.fileRequestId) return;
      this.setData({ rankingLoading: false, rankingError: '排行榜数据加载失败' });
    }.bind(this));
  },

  onWclDungeonTap: function (event) {
    var encounterId = String(event.currentTarget.dataset.encounterId || 'all');
    if (encounterId === this.data.selectedWclDungeonId) return;
    var entries = encounterId === 'all'
      ? this.data.wclPresetAllEntries
      : this.data.wclPresetAllEntries.filter(function (entry) {
        return String(entry.encounter && entry.encounter.id) === encounterId;
      });
    this.setData({ selectedWclDungeonId: encounterId, wclPresetEntries: entries });
  },

  buildPresetQuery: function (preset) {
    if (!preset || !preset.id || !preset.wclFileKey || !preset.wclContentType) return '';
    return 'classKey=' + encodeURIComponent(this.data.selectedClassKey)
      + '&specId=' + encodeURIComponent(this.data.selectedSpecId)
      + '&className=' + encodeURIComponent(this.data.selectedClassName)
      + '&specName=' + encodeURIComponent(this.data.selectedSpecName)
      + '&openWcl=1&wclContent=' + encodeURIComponent(preset.wclContentType)
      + '&wclFileKey=' + encodeURIComponent(preset.wclFileKey)
      + '&wclPresetId=' + encodeURIComponent(preset.id);
  },

  onUsePresetTap: function (event) {
    var preset = getPresetAt(this.data.wclPresetEntries, event.currentTarget.dataset.entryIndex, event.currentTarget.dataset.presetIndex);
    var query = this.buildPresetQuery(preset);
    if (!query) return;
    wx.navigateTo({ url: '/pages/build/build?' + query });
  },

  buildRankingQuery: function () {
    if (!this.data.selectedClassKey) return '';
    var query = 'classKey=' + encodeURIComponent(this.data.selectedClassKey);
    if (this.data.selectedSpecId) query += '&specId=' + encodeURIComponent(this.data.selectedSpecId);
    if (this.data.selectedWclContentType) query += '&contentType=' + encodeURIComponent(this.data.selectedWclContentType);
    if (this.data.selectedWclFileKey) query += '&fileKey=' + encodeURIComponent(this.data.selectedWclFileKey);
    return query;
  },

  onShareAppMessage: function (options) {
    var dataSet = (options && options.target && options.target.dataset) || {};
    var preset = dataSet.shareKind === 'preset'
      ? getPresetAt(this.data.wclPresetEntries, dataSet.entryIndex, dataSet.presetIndex)
      : null;
    if (preset) {
      return {
        title: this.data.selectedClassName + this.data.selectedSpecName + ' ' + preset.name + ' · 一键抄作业',
        path: '/pages/build/build?' + this.buildPresetQuery(preset),
      };
    }
    var title = this.data.selectedClassKey
      ? this.data.selectedClassName + '·' + this.data.selectedSpecName + ' 排行榜配装'
      : '艾泽配装 · 排行榜配装';
    return { title: title, path: '/pages/rankings/rankings' + (this.buildRankingQuery() ? '?' + this.buildRankingQuery() : '') };
  },

  onShareTimeline: function () {
    var title = this.data.selectedClassKey
      ? this.data.selectedClassName + '·' + this.data.selectedSpecName + ' 排行榜配装'
      : '艾泽配装 · 排行榜配装';
    return { title: title, query: this.buildRankingQuery() };
  },

  preventBubble: function () {},
});
