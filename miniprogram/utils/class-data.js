const CLASS_LIST = [
  { id: 1, key: 'warrior', name: '战士', armorType: 'plate', armorTypeName: '板甲', color: '#C69B6D', icon: '⚔' },
  { id: 2, key: 'paladin', name: '圣骑士', armorType: 'plate', armorTypeName: '板甲', color: '#F48CBA', icon: '🛡' },
  { id: 3, key: 'hunter', name: '猎人', armorType: 'mail', armorTypeName: '锁甲', color: '#AAD372', icon: '🏹' },
  { id: 4, key: 'rogue', name: '盗贼', armorType: 'leather', armorTypeName: '皮甲', color: '#FFF468', icon: '🗡' },
  { id: 5, key: 'priest', name: '牧师', armorType: 'cloth', armorTypeName: '布甲', color: '#FFFFFF', icon: '✝' },
  { id: 6, key: 'deathknight', name: '死亡骑士', armorType: 'plate', armorTypeName: '板甲', color: '#C41E3A', icon: '💀' },
  { id: 7, key: 'shaman', name: '萨满祭司', armorType: 'mail', armorTypeName: '锁甲', color: '#0070DD', icon: '⚡' },
  { id: 8, key: 'mage', name: '法师', armorType: 'cloth', armorTypeName: '布甲', color: '#3FC7EB', icon: '❄' },
  { id: 9, key: 'warlock', name: '术士', armorType: 'cloth', armorTypeName: '布甲', color: '#8788EE', icon: '🔥' },
  { id: 10, key: 'monk', name: '武僧', armorType: 'leather', armorTypeName: '皮甲', color: '#00FF98', icon: '☯' },
  { id: 11, key: 'druid', name: '德鲁伊', armorType: 'leather', armorTypeName: '皮甲', color: '#FF7C0A', icon: '🌙' },
  { id: 12, key: 'demonhunter', name: '恶魔猎手', armorType: 'leather', armorTypeName: '皮甲', color: '#A330C9', icon: '👿' },
  { id: 13, key: 'evoker', name: '唤魔师', armorType: 'mail', armorTypeName: '锁甲', color: '#33937F', icon: '🐉' }
];

const DATA_MAP = {
  warrior: require('../data/warrior.js'),
  paladin: require('../data/paladin.js'),
  hunter: require('../data/hunter.js'),
  rogue: require('../data/rogue.js'),
  priest: require('../data/priest.js'),
  deathknight: require('../data/deathknight.js'),
  shaman: require('../data/shaman.js'),
  mage: require('../data/mage.js'),
  warlock: require('../data/warlock.js'),
  monk: require('../data/monk.js'),
  druid: require('../data/druid.js'),
  demonhunter: require('../data/demonhunter.js'),
  evoker: require('../data/evoker.js')
};

function getClassMeta(classKey) {
  return CLASS_LIST.find((item) => item.key === classKey) || null;
}

function loadClassData(classKey) {
  return DATA_MAP[classKey] || null;
}

module.exports = {
  CLASS_LIST,
  getClassMeta,
  loadClassData
};
