const DATA_VERSION = '4.4.x';
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
      253: { specName: 'Beast Mastery', localName: '野兽控制', role: 'dps' },
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
    className: 'Death Knight',
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
    className: 'Demon Hunter',
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
  { id: 112526, name: "Algeth'ar Academy", localName: '艾杰斯亚学院' },
  { id: 12811, name: "Magisters' Terrace", localName: '魔导师平台' },
  { id: 12874, name: 'Maisara Caverns', localName: '迈萨拉洞窟' },
  { id: 12915, name: 'Nexus-Point Xenas', localName: '节点希纳斯' },
  { id: 10658, name: 'Pit of Saron', localName: '萨隆矿坑' },
  { id: 361753, name: 'Seat of the Triumvirate', localName: '执政团之座' },
  { id: 61209, name: 'Skyreach', localName: '通天峰' },
  { id: 12805, name: 'Windrunner Spire', localName: '风行者之塔' },
];

// 大秘境三档：最顶级(不限层数，按 score 取) / +10 / +16；均按 score 排序、按玩家去重。
const MYTHIC_PLUS_LEVELS = [
  { level: 0, fileKey: 'mythic-plus-top', name: '最顶级' },
  { level: 10, bracket: 9, fileKey: 'mythic-plus-10', name: '10层' },
  { level: 16, bracket: 15, fileKey: 'mythic-plus-16', name: '16层' },
];

const RAIDS = [
  {
    zoneId: 46,
    name: 'VS / DR / MQD',
    localName: '史诗团本',
    difficultyName: '史诗',
    fileKey: 'raid-mythic-vs-dr-mqd',
    bosses: [
      { id: 3176, name: 'Imperator Averzian', localName: '元首阿福扎恩' },
      { id: 3177, name: 'Vorasius', localName: '弗拉希乌斯' },
      { id: 3179, name: 'Fallen-King Salhadaar', localName: '陨落之王萨哈达尔' },
      { id: 3178, name: 'Vaelgor & Ezzorak', localName: '威厄高尔和艾佐拉克' },
      { id: 3180, name: 'Lightblinded Vanguard', localName: '光盲先锋军' },
      { id: 3181, name: 'Crown of the Cosmos', localName: '宇宙之冕' },
      { id: 3306, name: 'Chimaerus, the Undreamt God', localName: '奇美鲁斯，未梦之神' },
      { id: 3182, name: "Belo'ren, Child of Al'ar", localName: '贝洛朗，奥的子嗣' },
      { id: 3183, name: 'Midnight Falls', localName: '至暗之夜降临' },
    ],
  },
  {
    zoneId: 50,
    name: 'Sporefall',
    localName: '孢陨幽境',
    difficultyName: '史诗',
    fileKey: 'raid-mythic-sporefall',
    bosses: [
      { id: 3159, name: 'Rotmire', localName: '腐沼' },
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
