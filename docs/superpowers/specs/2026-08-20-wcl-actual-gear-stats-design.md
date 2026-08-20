# WCL 排行榜完整装备快照与总属性设计

## 目标

只为“排行榜配装”建立 WCL 数据模式：装备卡展示排行榜角色实穿装备的完整属性快照；配装信息总览使用同一条 WCL CombatantInfo 记录的角色总属性，而不是把装备卡逐件相加。实时配装保持现有本地装备库逐件计算，不能读取或依赖 WCL 快照。

## 两条互不耦合的数据路径

```text
实时配装：本地装备库 -> summarizeSlots(逐件累加) -> 现有配装信息

排行榜配装：WCL CombatantInfo
  -> 每件 gear 的 itemId + bonusIDs -> 精确物品说明 -> WCL itemSnapshot
  -> character totals -> summarizeWclCombatant(总值换算百分比)
```

排行榜装备快照与 WCL 总属性必须来自同一个 `combatantinfo` 事件。总属性原样保留该事件中的食物、团队光环和其他已生效状态；这是排行榜记录的完整角色状态，不被当作实时配装的静态装备计算。

## COS 文件契约

新数据使用 `schemaVersion: 4`，index 和每个内容文件均带 `wclCombatantSnapshot: true`。两者都为 `true` 时，小程序才启用排行榜 WCL 总属性模式；旧数据继续使用制造业兼容及本地逐件汇总，确保轮转期间可用。

每个已出现 WCL 槽位写入：

```json
{
  "itemId": 249952,
  "ilvl": 289,
  "bonusIDs": [12806, 6652],
  "snapshotStatus": "resolved",
  "snapshot": {
    "name": "终夜者的獠牙头盔",
    "primaryStats": [{ "type": "strength", "name": "力量", "value": 124 }],
    "stamina": { "name": "耐力", "value": 2326 },
    "armor": 244,
    "secondaryStats": [
      { "type": "haste", "name": "急速", "value": 49 },
      { "type": "mastery", "name": "精通", "value": 115 }
    ]
  }
}
```

每个预设另写 `combatantStats`：`strength`、`agility`、`intellect`、`stamina`、`armor`、`crit`、`haste`、`mastery`、`versatility`，及由 WCL 原字段映射出的字段来源。这里的“主属性”严格指力量、敏捷、智力三项；耐力单列，不存在第四项主属性。无法可靠提供的总值必须让预设生成失败，不能以单件合计补写。

```json
{
  "combatantStats": {
    "strength": 512,
    "agility": 621,
    "intellect": 2792,
    "stamina": 22252,
    "armor": 871,
    "crit": 290,
    "haste": 1180,
    "mastery": 1204,
    "versatility": 0,
    "fieldSources": {
      "strength": "strength",
      "agility": "agility",
      "intellect": "intellect",
      "stamina": "stamina",
      "armor": "armor",
      "crit": "critMelee",
      "haste": "hasteMelee",
      "mastery": "mastery",
      "versatility": "versatilityDamageDone"
    }
  }
}
```

所有值均是 WCL CombatantInfo 的非负数值，不是百分比。`fieldSources` 必须精确包含九个数值键且每项为非空 WCL 字段名。`crit`、`haste` 依角色职业选择字段：法系/治疗优先 `critSpell`/`hasteSpell`，猎人优先 `critRanged`/`hasteRanged`，其余优先 `critMelee`/`hasteMelee`；首选字段缺失时按 melee、ranged、spell 的固定顺序找第一个存在字段，并在 `fieldSources` 记录实际选择。`mastery` 取 `mastery`，`versatility` 取 `versatilityDamageDone`。这两个字段及三主属性、耐力和护甲都必须存在且为有限非负数，不能改由装备合计补写。精通继续由现有计算器叠加基础精通点和专精系数，避免复制一套新公式。

`findCombatant` 必须只接受排行榜记录的 report code、fight ID 和匹配 actor 的同一条 CombatantInfo 事件；找不到时当前候选失败，生成器可以尝试下一名排行榜角色，但不能跨 fight 或跨角色取 gear/总属性。

## 生成与失败语义

所有出现的 WCL 装备槽都用精确 `itemId + bonusIDs + locale` 查询说明并解析名称、主属性、耐力、护甲和四绿字。`snapshotStatus` 的唯一可上传值是 `resolved`。名称仅取 Wowhead JSON 的非空 `name`；护甲仅取 `<!--amr-->` 后的整数；主属性/耐力只取 `<!--stat…-->` 标记中的正整数（3=敏捷、4=力量、5=智力、7=耐力；动态 74 按当前专精的主属性类型落入三者之一）；绿字只取 `<!--ebstats-->` 到 `<!--egstats-->` 内的正整数 rating 标记（32=暴击、36=急速、49=精通、40=全能）。相同属性合并，千分位逗号可用；无主属性、无耐力、无护甲或无绿字按下述空值表示。非数值、非正的已支持标记使解析失败；未支持的 rating（如吸血、闪避）明确忽略，不进入四绿字。宝石、附魔、效果和套装文本一律排除。

`snapshot.name` 必须是非空字符串，`primaryStats` 是去重合并后的力量/敏捷/智力数组，`stamina` 在物品说明没有耐力时为 `null`，`armor` 在无护甲物品时为 `0`，`secondaryStats` 在无绿字时为 `[]`。例如无护甲且无主属性的饰品为 `{"name":"示例饰品","primaryStats":[],"stamina":null,"armor":0,"secondaryStats":[]}`。戒指、饰品、披风和武器缺少其中一类属性是合法快照，不能误判失败。武器伤害/速度、装备与使用效果、插槽、附魔和宝石不属于本次 WCL snapshot；本地命中时继续显示本地已有信息，未知装备不伪造这些字段。

制造业保留 `craftedStats` 兼容字段，其数组等于 `snapshot.secondaryStats`，按顺序附加 `randomAttributeIndex`；无绿字时为 `[]`。排行榜装备卡不会显示为等待用户选择的随机属性。

全量生产生成在临时目录写完整内容、index 和审计后才原子替换专精目录。局部/测试生成只能写测试前缀，并复制、合并和原子替换该测试目录，不能影响生产目录或未请求文件。

审计为每个文件记录 `snapshotResolved`、`snapshotMissing`、`snapshotNoSecondary`、`combatantStatsResolved`，并保留已有的本地映射缺失、槽位不匹配、制造业/附魔/宝石计数。已映射的 `sourceType: tier` 项目另记为 tier 子集。snapshot 或 combatantStats 缺失由生成器在审计前阻止；映射缺失仍只记录，不阻止上传。

## 小程序展示与计算

排行榜套用时：

- 本地命中装备：使用 WCL snapshot 的名称、装等、全部属性和 `statLine`；本地图标、出处、套装说明、职业限制仍保留。
- 本地未命中装备：使用 WCL snapshot 的名称、装等和全部属性，显示既有未知装备图标，出处显示“WCL 排行榜数据”。
- 排行榜配装信息调用新增 `summarizeWclCombatant`：读取 `combatantStats` 原始总值，并复用现有百分比、精通与显示格式规则；不访问 slots。
- 用户手动选择、替换或清空任一装备时，清除 `wclPreset.combatantStats`/快照模式，立即恢复现有 `summarizeSlots` 逐件计算。

实时配装的装备选择、收藏、详情、保存和 `summarizeSlots` 行为不变。

## 验收

1. 单元测试验证普通、制造业、套装、未知装备的完整 snapshot，以及无效基础属性的严格失败。
2. 测试 WCL 总属性映射与百分比换算；断言它不读取 slot 属性。
3. 测试排行榜套用显示 WCL 名称/属性，未知装备显示未知图标和“WCL 排行榜数据”。
4. 测试实时配装不带 `wclPreset` 时仍调用 `summarizeSlots`；手动改任一排行榜装备后也回到该路径。
5. 线上抽样一条新 schema 4 COS 文件，核对一个未知装备与一个制造业装备卡、以及 WCL 总览值；保持每次三个专精的轮转和旧前缀不删除。
