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

function getClassMeta(classKey) {
  return CLASS_LIST.find((item) => item.key === classKey) || null;
}

const COS_BASE = 'https://wowlook-1308073800.cos.ap-guangzhou.myqcloud.com';

function getClassVisualAssets(classKey) {
  const classMeta = getClassMeta(classKey);
  const assetCode = (classMeta && classMeta.assetCode) || 'ws';

  return {
    banner: `${COS_BASE}/assets/zhiye/banner/${assetCode}.png`,
    emblem: `${COS_BASE}/assets/zhiye/emblem/${assetCode}.png`,
  };
}

function loadOverview() {
  return new Promise((resolve) => {
    wx.request({
      url: `${COS_BASE}/data/overview.json`,
      success(res) { resolve(res.data); },
      fail(err) {
        console.error('load overview failed', err);
        resolve(null);
      },
    });
  });
}

function loadClassData(classKey) {
  const validKeys = ['warrior', 'paladin', 'hunter', 'rogue', 'priest', 'deathknight', 'shaman', 'mage', 'warlock', 'monk', 'druid', 'demonhunter', 'evoker'];
  if (validKeys.indexOf(classKey) === -1) {
    return Promise.resolve(null);
  }
  return new Promise((resolve) => {
    wx.request({
      url: `${COS_BASE}/data/${classKey}.json`,
      success(res) { resolve(res.data); },
      fail(err) {
        console.error(`load class data failed: ${classKey}`, err);
        resolve(null);
      },
    });
  });
}

module.exports = {
  COS_BASE,
  CLASS_LIST,
  getClassMeta,
  getClassVisualAssets,
  loadOverview,
  loadClassData,
};
