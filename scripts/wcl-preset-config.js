const DATA_VERSION = '12.1';
const DEFAULT_LEADERBOARD = 'LogsOnly';
const MYTHIC_RAID_DIFFICULTY = 5;

const ROLE_METRIC = {
  tank: 'dps',
  healer: 'hps',
  dps: 'dps',
};

const SPEC_CONFIG = {
  warrior: {
    className: 'Warrior',
    localName: '战士',
    specs: {
      71: { specName: 'Arms', localName: '武器', role: 'dps' },
      72: { specName: 'Fury', localName: '狂怒', role: 'dps' },
      73: { specName: 'Protection', localName: '防护', role: 'tank' },
    },
  },
  paladin: {
    className: 'Paladin',
    localName: '圣骑士',
    specs: {
      65: { specName: 'Holy', localName: '神圣', role: 'healer' },
      66: { specName: 'Protection', localName: '防护', role: 'tank' },
      70: { specName: 'Retribution', localName: '惩戒', role: 'dps' },
    },
  },
  hunter: {
    className: 'Hunter',
    localName: '猎人',
    specs: {
      253: { specName: 'BeastMastery', localName: '野兽控制', role: 'dps' },
      254: { specName: 'Marksmanship', localName: '射击', role: 'dps' },
      255: { specName: 'Survival', localName: '生存', role: 'dps' },
    },
  },
  rogue: {
    className: 'Rogue',
    localName: '盗贼',
    specs: {
      259: { specName: 'Assassination', localName: '奇袭', role: 'dps' },
      260: { specName: 'Outlaw', localName: '狂徒', role: 'dps' },
      261: { specName: 'Subtlety', localName: '敏锐', role: 'dps' },
    },
  },
  priest: {
    className: 'Priest',
    localName: '牧师',
    specs: {
      256: { specName: 'Discipline', localName: '戒律', role: 'healer' },
      257: { specName: 'Holy', localName: '神圣', role: 'healer' },
      258: { specName: 'Shadow', localName: '暗影', role: 'dps' },
    },
  },
  deathknight: {
    className: 'DeathKnight',
    localName: '死亡骑士',
    specs: {
      250: { specName: 'Blood', localName: '鲜血', role: 'tank' },
      251: { specName: 'Frost', localName: '冰霜', role: 'dps' },
      252: { specName: 'Unholy', localName: '邪恶', role: 'dps' },
    },
  },
  shaman: {
    className: 'Shaman',
    localName: '萨满祭司',
    specs: {
      262: { specName: 'Elemental', localName: '元素', role: 'dps' },
      263: { specName: 'Enhancement', localName: '增强', role: 'dps' },
      264: { specName: 'Restoration', localName: '恢复', role: 'healer' },
    },
  },
  mage: {
    className: 'Mage',
    localName: '法师',
    specs: {
      62: { specName: 'Arcane', localName: '奥术', role: 'dps' },
      63: { specName: 'Fire', localName: '火焰', role: 'dps', talentChangeSetId: 13 },
      64: { specName: 'Frost', localName: '冰霜', role: 'dps' },
    },
  },
  warlock: {
    className: 'Warlock',
    localName: '术士',
    specs: {
      265: { specName: 'Affliction', localName: '痛苦', role: 'dps' },
      266: { specName: 'Demonology', localName: '恶魔学识', role: 'dps' },
      267: { specName: 'Destruction', localName: '毁灭', role: 'dps' },
    },
  },
  monk: {
    className: 'Monk',
    localName: '武僧',
    specs: {
      268: { specName: 'Brewmaster', localName: '酒仙', role: 'tank' },
      269: { specName: 'Windwalker', localName: '踏风', role: 'dps' },
      270: { specName: 'Mistweaver', localName: '织雾', role: 'healer' },
    },
  },
  druid: {
    className: 'Druid',
    localName: '德鲁伊',
    specs: {
      102: { specName: 'Balance', localName: '平衡', role: 'dps' },
      103: { specName: 'Feral', localName: '野性', role: 'dps' },
      104: { specName: 'Guardian', localName: '守护', role: 'tank' },
      105: { specName: 'Restoration', localName: '恢复', role: 'healer' },
    },
  },
  demonhunter: {
    className: 'DemonHunter',
    localName: '恶魔猎手',
    specs: {
      577: { specName: 'Havoc', localName: '浩劫', role: 'dps' },
      581: { specName: 'Vengeance', localName: '复仇', role: 'tank' },
      1480: { specName: 'Devourer', localName: '噬灭', role: 'dps' },
    },
  },
  evoker: {
    className: 'Evoker',
    localName: '唤魔师',
    specs: {
      1467: { specName: 'Devastation', localName: '湮灭', role: 'dps' },
      1468: { specName: 'Preservation', localName: '恩护', role: 'healer' },
      1473: { specName: 'Augmentation', localName: '增辉', role: 'dps' },
    },
  },
};

const MYTHIC_PLUS_DUNGEONS = [
  { id: 12993, name: 'Altar of Fangs', localName: '毒牙祭坛' },
  { id: 12813, name: 'Murder Row', localName: '密谋小径' },
  { id: 12825, name: 'Den of Nalorakk', localName: '纳洛拉克的洞穴' },
  { id: 12859, name: 'The Blinding Vale', localName: '夺目谷' },
  { id: 12923, name: 'Voidscar Arena', localName: '虚空之痕竞技场' },
  { id: 61762, name: "Kings' Rest", localName: '诸王之眠' },
  { id: 112521, name: 'Ruby Life Pools', localName: '红玉新生法池' },
  { id: 61877, name: 'Temple of Sethraliss', localName: '塞塔里斯神庙' },
];

// 大秘境三档：最顶级(不限层数，按 score 取) / +10 / +16；均按 score 排序、按玩家去重。
const MYTHIC_PLUS_LEVELS = [
  { level: 0, fileKey: 'mythic-plus-top', name: '最顶级' },
  { level: 10, bracket: 9, fileKey: 'mythic-plus-10', name: '10层' },
  { level: 16, bracket: 15, fileKey: 'mythic-plus-16', name: '16层' },
];

const RAIDS = [
  {
    zoneId: 53,
    name: 'The Venomous Abyss',
    localName: '烈毒之渊',
    difficultyName: '史诗',
    fileKey: 'raid-mythic-venomous-abyss',
    bosses: [
      { id: 3470, name: "Nek'zali the Soulcoiler", localName: '盘魂者内克扎莉' },
      { id: 3445, name: 'Entombed Sentinels', localName: '陵寝哨兵' },
      { id: 3455, name: 'Vashnik the Malignant', localName: '万毒邪祟者瓦什尼克' },
      { id: 3497, name: 'The Lost Explorers', localName: '迷失的探险者' },
      { id: 3420, name: 'Sszorak', localName: '斯索拉克' },
      { id: 3421, name: 'The Twin Fangs', localName: '双子毒牙' },
      { id: 3429, name: 'The Coiled Altar', localName: '盘卷祭坛' },
      { id: 3492, name: "Ula'tek", localName: '乌拉特克' },
      { id: 3379, name: 'Nymrissa Wavecaller', localName: '尼姆瑞莎·唤波者' },
    ],
  },
];

function getSpecConfig(classKey, specId) {
  const classConfig = SPEC_CONFIG[classKey];
  if (!classConfig) return null;
  const spec = classConfig.specs[String(specId)];
  if (!spec) return null;
  return {
    classKey,
    className: classConfig.className,
    classLocalName: classConfig.localName,
    specId: Number(specId),
    specName: spec.specName,
    specLocalName: spec.localName,
    role: spec.role,
    metric: spec.metric || ROLE_METRIC[spec.role] || 'dps',
    talentChangeSetId: spec.talentChangeSetId || 13,
  };
}

function listSpecs() {
  const specs = [];
  Object.keys(SPEC_CONFIG).forEach((classKey) => {
    Object.keys(SPEC_CONFIG[classKey].specs).forEach((specId) => {
      specs.push(getSpecConfig(classKey, specId));
    });
  });
  return specs;
}

function buildDefaultSpecMap() {
  const map = {};
  listSpecs().forEach((spec) => {
    if (!map[spec.classKey]) map[spec.classKey] = {};
    map[spec.classKey][spec.specId] = {
      className: spec.className,
      specName: spec.specName,
      localName: spec.specLocalName,
      role: spec.role,
      metric: spec.metric,
      talentChangeSetId: spec.talentChangeSetId,
    };
  });
  return map;
}

module.exports = {
  DATA_VERSION,
  DEFAULT_LEADERBOARD,
  MYTHIC_RAID_DIFFICULTY,
  ROLE_METRIC,
  SPEC_CONFIG,
  MYTHIC_PLUS_DUNGEONS,
  MYTHIC_PLUS_LEVELS,
  RAIDS,
  getSpecConfig,
  listSpecs,
  buildDefaultSpecMap,
};
