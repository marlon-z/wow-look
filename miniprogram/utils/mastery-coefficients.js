// 精通系数映射表 — 至暗之夜 12.0.7 / 90 级
//
// 数据来源：Wowhead DBC spell data (SP mod)，Build 12.0.7.68256
// 交叉验证：WoWLookStatExport 插件 GetMasteryEffect() 实采武僧三专精完全一致
// 基础精通点数：8（所有专精通用），基础精通效果 = 8 × coefficient
//
// 精通百分比公式：(baseMasteryPoints + DR(masteryRating / 46)) × coefficient
// 其中 baseMasteryPoints = 8，46 为每精通点所需等级分

var BASE_MASTERY_POINTS = 8;

var MASTERY_COEFFICIENTS = {
  71:   { specName: '武器',     className: '战士',     masteryName: '精通：武艺精通',   coefficient: 1.1,      effect: '武器伤害' },
  72:   { specName: '狂怒',     className: '战士',     masteryName: '精通：无双',       coefficient: 1.4,      effect: '攻击伤害' },
  73:   { specName: '防护',     className: '战士',     masteryName: '精通：临阵磨枪',   coefficient: 1.5,      effect: '格挡几率' },
  65:   { specName: '神圣',     className: '圣骑士',   masteryName: '精通：光明使者',   coefficient: 1.5,      effect: '治疗量' },
  66:   { specName: '防护',     className: '圣骑士',   masteryName: '精通：神圣斗士',   coefficient: 1.0,      effect: '伤害减免/攻击强度' },
  70:   { specName: '惩戒',     className: '圣骑士',   masteryName: '精通：圣光之手',   coefficient: 1.35,     effect: '神圣伤害' },
  253:  { specName: '野兽控制', className: '猎人',     masteryName: '精通：百兽之王',   coefficient: 1.9,      effect: '宠物伤害' },
  254:  { specName: '射击',     className: '猎人',     masteryName: '精通：狙击训练',   coefficient: 1.4,      effect: '远程伤害' },
  255:  { specName: '生存',     className: '猎人',     masteryName: '精通：灵蛇之魂',   coefficient: 0.85,     effect: '伤害/治疗' },
  259:  { specName: '奇袭',     className: '盗贼',     masteryName: '精通：暗杀效能',   coefficient: 1.7,      effect: '中毒/流血伤害' },
  260:  { specName: '狂徒',     className: '盗贼',     masteryName: '精通：主谋',       coefficient: 0.131,    effect: '触发几率' },
  261:  { specName: '敏锐',     className: '盗贼',     masteryName: '精通：刽子手',     coefficient: 2.45,     effect: '终结技伤害' },
  256:  { specName: '戒律',     className: '牧师',     masteryName: '精通：恩泽',       coefficient: 1.35,     effect: '救赎量' },
  257:  { specName: '神圣',     className: '牧师',     masteryName: '精通：回音之光',   coefficient: 0.908437, effect: '额外治疗' },
  258:  { specName: '暗影',     className: '牧师',     masteryName: '精通：暗影编织',   coefficient: 0.5,      effect: '暗影伤害' },
  250:  { specName: '鲜血',     className: '死亡骑士', masteryName: '精通：鲜血之盾',   coefficient: 2.0,      effect: '护盾量' },
  251:  { specName: '冰霜',     className: '死亡骑士', masteryName: '精通：冰冻之心',   coefficient: 2.0,      effect: '冰霜伤害' },
  252:  { specName: '邪恶',     className: '死亡骑士', masteryName: '精通：恐惧镰刀',   coefficient: 1.8,      effect: '暗影伤害' },
  262:  { specName: '元素',     className: '萨满祭司', masteryName: '精通：元素过载',   coefficient: 1.875,    effect: '过载几率' },
  263:  { specName: '增强',     className: '萨满祭司', masteryName: '精通：元素之力',   coefficient: 2.0,      effect: '元素伤害' },
  264:  { specName: '恢复',     className: '萨满祭司', masteryName: '精通：深度治愈',   coefficient: 3.0,      effect: '近距治疗量' },
  62:   { specName: '奥术',     className: '法师',     masteryName: '精通：奥术精通',   coefficient: 1.32,     effect: '法力上限/伤害' },
  63:   { specName: '火焰',     className: '法师',     masteryName: '精通：点燃',       coefficient: 0.483,    effect: '点燃伤害' },
  64:   { specName: '冰霜',     className: '法师',     masteryName: '精通：冰冻与碎裂', coefficient: 1.6,      effect: '冰霜伤害' },
  265:  { specName: '痛苦',     className: '术士',     masteryName: '精通：折磨效能',   coefficient: 2.5,      effect: 'DoT伤害' },
  266:  { specName: '恶魔学识', className: '术士',     masteryName: '精通：召唤大师',   coefficient: 1.45,     effect: '恶魔伤害' },
  267:  { specName: '毁灭',     className: '术士',     masteryName: '精通：混乱之火',   coefficient: 2.0,      effect: '混沌伤害' },
  268:  { specName: '酒仙',     className: '武僧',     masteryName: '精通：醉拳大师',   coefficient: 0.924,    effect: '闪避几率' },
  269:  { specName: '踏风',     className: '武僧',     masteryName: '精通：连击打击',   coefficient: 2.32875,  effect: '非重复技能伤害' },
  270:  { specName: '织雾',     className: '武僧',     masteryName: '精通：氤氲之雾',   coefficient: 13.86,    effect: '治疗量' },
  102:  { specName: '平衡',     className: '德鲁伊',   masteryName: '精通：星光之辉',   coefficient: 0.75,     effect: '奥术/自然伤害' },
  103:  { specName: '野性',     className: '德鲁伊',   masteryName: '精通：锋利之爪',   coefficient: 2.0,      effect: '终结技伤害/流血' },
  104:  { specName: '守护',     className: '德鲁伊',   masteryName: '精通：自然之盾',   coefficient: 0.7,      effect: '生命值/治疗' },
  105:  { specName: '恢复',     className: '德鲁伊',   masteryName: '精通：和谐',       coefficient: 1.14,     effect: '治疗量' },
  577:  { specName: '浩劫',     className: '恶魔猎手', masteryName: '精通：混沌之刃',   coefficient: 2.25,     effect: '混沌伤害' },
  581:  { specName: '复仇',     className: '恶魔猎手', masteryName: '精通：炽热战印',   coefficient: 2.25,     effect: '攻击强度/减伤' },
  1480: { specName: '噬灭',     className: '恶魔猎手', masteryName: '精通：内在怪物',   coefficient: 1.2,      effect: '伤害' },
  1467: { specName: '湮灭',     className: '唤魔师',   masteryName: '精通：异时凝滞',   coefficient: 1.5,      effect: '法术伤害' },
  1468: { specName: '恩护',     className: '唤魔师',   masteryName: '精通：命运之力',   coefficient: 1.8,      effect: '治疗量' },
  1473: { specName: '增辉',     className: '唤魔师',   masteryName: '精通：赋能之焰',   coefficient: 0.272,    effect: '赋能效果' },
};

function getMasteryCoefficient(specId) {
  return MASTERY_COEFFICIENTS[specId] || null;
}

module.exports = {
  BASE_MASTERY_POINTS: BASE_MASTERY_POINTS,
  MASTERY_COEFFICIENTS: MASTERY_COEFFICIENTS,
  getMasteryCoefficient: getMasteryCoefficient,
};
