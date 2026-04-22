const CLASS_LIST = [
  { id: 1, key: 'warrior', name: '战士', armorType: 'plate', armorTypeName: '板甲', color: '#C69B6D', abbr: '战' },
  { id: 2, key: 'paladin', name: '圣骑士', armorType: 'plate', armorTypeName: '板甲', color: '#F48CBA', abbr: '骑' },
  { id: 3, key: 'hunter', name: '猎人', armorType: 'mail', armorTypeName: '锁甲', color: '#AAD372', abbr: '猎' },
  { id: 4, key: 'rogue', name: '盗贼', armorType: 'leather', armorTypeName: '皮甲', color: '#FFF468', abbr: '贼' },
  { id: 5, key: 'priest', name: '牧师', armorType: 'cloth', armorTypeName: '布甲', color: '#FFFFFF', abbr: '牧' },
  { id: 6, key: 'deathknight', name: '死亡骑士', armorType: 'plate', armorTypeName: '板甲', color: '#C41E3A', abbr: '骑' },
  { id: 7, key: 'shaman', name: '萨满祭司', armorType: 'mail', armorTypeName: '锁甲', color: '#0070DD', abbr: '萨' },
  { id: 8, key: 'mage', name: '法师', armorType: 'cloth', armorTypeName: '布甲', color: '#3FC7EB', abbr: '法' },
  { id: 9, key: 'warlock', name: '术士', armorType: 'cloth', armorTypeName: '布甲', color: '#8788EE', abbr: '术' },
  { id: 10, key: 'monk', name: '武僧', armorType: 'leather', armorTypeName: '皮甲', color: '#00FF98', abbr: '僧' },
  { id: 11, key: 'druid', name: '德鲁伊', armorType: 'leather', armorTypeName: '皮甲', color: '#FF7C0A', abbr: '德' },
  { id: 12, key: 'demonhunter', name: '恶魔猎手', armorType: 'leather', armorTypeName: '皮甲', color: '#A330C9', abbr: '猎' },
  { id: 13, key: 'evoker', name: '唤魔师', armorType: 'mail', armorTypeName: '锁甲', color: '#33937F', abbr: '唤' },
];

function getClassMeta(classKey) {
  return CLASS_LIST.find((item) => item.key === classKey) || null;
}

function loadOverview() {
  try {
    return require('../data/overview.js');
  } catch (error) {
    console.error('load overview failed', error);
    return null;
  }
}

function loadClassData(classKey) {
  try {
    switch (classKey) {
      case 'warrior':
        return require('../data/warrior.js');
      case 'paladin':
        return require('../data/paladin.js');
      case 'hunter':
        return require('../data/hunter.js');
      case 'rogue':
        return require('../data/rogue.js');
      case 'priest':
        return require('../data/priest.js');
      case 'deathknight':
        return require('../data/deathknight.js');
      case 'shaman':
        return require('../data/shaman.js');
      case 'mage':
        return require('../data/mage.js');
      case 'warlock':
        return require('../data/warlock.js');
      case 'monk':
        return require('../data/monk.js');
      case 'druid':
        return require('../data/druid.js');
      case 'demonhunter':
        return require('../data/demonhunter.js');
      case 'evoker':
        return require('../data/evoker.js');
      default:
        return null;
    }
  } catch (error) {
    console.error(`load class data failed: ${classKey}`, error);
    return null;
  }
}

module.exports = {
  CLASS_LIST,
  getClassMeta,
  loadOverview,
  loadClassData,
};
