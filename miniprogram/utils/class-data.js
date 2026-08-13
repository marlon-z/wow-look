const CLASS_LIST = [
  { id: 1, key: 'warrior', name: '战士', shortName: '战士', armorType: 'plate', armorTypeName: '板甲', color: '#C69B6D', abbr: '战', assetCode: 'zs' },
  { id: 2, key: 'paladin', name: '圣骑士', shortName: '圣骑士', armorType: 'plate', armorTypeName: '板甲', color: '#F48CBA', abbr: '骑', assetCode: 'qs' },
  { id: 3, key: 'hunter', name: '猎人', shortName: '猎人', armorType: 'mail', armorTypeName: '锁甲', color: '#AAD372', abbr: '猎', assetCode: 'lr' },
  { id: 4, key: 'rogue', name: '盗贼', shortName: '盗贼', armorType: 'leather', armorTypeName: '皮甲', color: '#FFF468', abbr: '贼', assetCode: 'dz' },
  { id: 5, key: 'priest', name: '牧师', shortName: '牧师', armorType: 'cloth', armorTypeName: '布甲', color: '#FFFFFF', abbr: '牧', assetCode: 'ms' },
  { id: 6, key: 'deathknight', name: '死亡骑士', shortName: '死亡骑士', armorType: 'plate', armorTypeName: '板甲', color: '#C41E3A', abbr: '骑', assetCode: 'dk' },
  { id: 7, key: 'shaman', name: '萨满祭司', shortName: '萨满祭司', armorType: 'mail', armorTypeName: '锁甲', color: '#0070DD', abbr: '萨', assetCode: 'sm' },
  { id: 8, key: 'mage', name: '法师', shortName: '法师', armorType: 'cloth', armorTypeName: '布甲', color: '#3FC7EB', abbr: '法', assetCode: 'fs' },
  { id: 9, key: 'warlock', name: '术士', shortName: '术士', armorType: 'cloth', armorTypeName: '布甲', color: '#8788EE', abbr: '术', assetCode: 'ss' },
  { id: 10, key: 'monk', name: '武僧', shortName: '武僧', armorType: 'leather', armorTypeName: '皮甲', color: '#00FF98', abbr: '僧', assetCode: 'ws' },
  { id: 11, key: 'druid', name: '德鲁伊', shortName: '德鲁伊', armorType: 'leather', armorTypeName: '皮甲', color: '#FF7C0A', abbr: '德', assetCode: 'dly' },
  { id: 12, key: 'demonhunter', name: '恶魔猎手', shortName: '恶魔猎手', armorType: 'leather', armorTypeName: '皮甲', color: '#A330C9', abbr: '猎', assetCode: 'dh' },
  { id: 13, key: 'evoker', name: '唤魔师', shortName: '唤魔师', armorType: 'mail', armorTypeName: '锁甲', color: '#33937F', abbr: '唤', assetCode: 'hms' },
];

const DATA_VERSION = '12.1-s2';
const DATA_DIR = `data-${DATA_VERSION}`;
const LOCAL_ASSET_BASE = '/assets';
const classDataCache = {};
const classLoadTasks = {};

function getClassMeta(classKey) {
  return CLASS_LIST.find((item) => item.key === classKey) || null;
}

function getAssetBase() {
  return '';
}

function getClassVisualAssets(classKey) {
  const classMeta = getClassMeta(classKey);
  const assetCode = (classMeta && classMeta.assetCode) || 'ws';
  return {
    banner: `${LOCAL_ASSET_BASE}/classes/banner/${assetCode}.jpg`,
    emblem: `${LOCAL_ASSET_BASE}/classes/emblem/${assetCode}.png`,
  };
}

function loadOverview() {
  try {
    return Promise.resolve(require('../local-data/overview'));
  } catch (err) {
    console.error('load local overview failed', err);
    return Promise.resolve(null);
  }
}

function loadClassData(classKey) {
  if (!getClassMeta(classKey)) {
    return Promise.resolve(null);
  }
  if (classDataCache[classKey]) {
    return Promise.resolve(classDataCache[classKey]);
  }
  if (classLoadTasks[classKey]) {
    return classLoadTasks[classKey];
  }

  classLoadTasks[classKey] = new Promise((resolve) => {
    if (typeof wx === 'undefined' || typeof wx.loadSubPackage !== 'function') {
      console.error(`local ${classKey} package loader is unavailable`);
      resolve(null);
      return;
    }

    wx.loadSubPackage({
      name: `class-${classKey}`,
      success() {
        // Cross-package modules use the Promise form of require.async. The
        // callback form belongs to require(), so using it here silently left
        // every class data load unresolved in the mini-program runtime.
        require.async(`../packages/class-${classKey}/data/${classKey}`)
          .then((data) => {
            classDataCache[classKey] = data;
            resolve(data);
          })
          .catch((error) => {
            console.error(`load local ${classKey} data failed`, error);
            resolve(null);
          });
      },
      fail(error) {
        console.error(`download local ${classKey} package failed`, error);
        resolve(null);
      },
    });
  }).finally(() => {
    delete classLoadTasks[classKey];
  });

  return classLoadTasks[classKey];
}

module.exports = {
  COS_BASE: '',
  LOCAL_PREVIEW_BASE: '',
  LOCAL_ASSET_BASE,
  getAssetBase,
  DATA_SOURCE: 'local-package',
  DATA_VERSION,
  DATA_DIR,
  CLASS_LIST,
  getClassMeta,
  getClassVisualAssets,
  loadOverview,
  loadClassData,
};
