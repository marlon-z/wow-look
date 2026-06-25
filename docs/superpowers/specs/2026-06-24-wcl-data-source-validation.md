# WCL 数据模块 · 数据源验证报告

> 状态：数据源验证已完成（2026-06-24），结论为**全部可行**。本文档作为后续开发依据，记录已验证的接口、字段、计算口径与踩坑点。
> 本阶段只做数据可行性验证，**未改动小程序代码**。验证脚本见 [scripts/](../../../scripts/)。

## 一、背景与目标

计划给小程序新增一个 **WCL 数据模块**，对标竞品按「职业 + 专精」聚合展示的战斗日志统计，包含以下七块内容：

1. 属性排名（智力 > 急速 > 精通 > 暴击 > 全能，含具体评级数值）
2. 推荐天赋（含人气占比、可导出天赋串）
3. 伤害构成（逐技能占比）
4. 装备（各部位）
5. 附魔宝石
6. 消耗品
7. 饰品

硬性要求：**数据自动获取**，不做每次手动采集。

本阶段目标：在写任何代码前，验证「这七块数据 + 国服中文名」能否真实拿到。

## 二、结论速览

| 内容 | 数据来源 | 是否验证通过 |
|---|---|:--:|
| DPS / 钥石层数 / 样本数 | WCL 排行榜 | ✅ |
| 属性排名（副属性评级） | WCL combatantInfo | ✅ |
| 推荐天赋 / 人气 / 导出 | WCL combatantInfo `talentTree` | ✅ |
| 伤害构成 | WCL `table(DamageDone)` | ✅ |
| 装备各部位 | WCL combatantInfo `gear` | ✅ |
| 附魔 + 宝石 | gear 的 `permanentEnchant` / `gems` | ✅ |
| 消耗品（合剂/食物/符文） | combatantInfo `auras`（开怪 buff） | ✅ |
| 饰品及占比 | gear 饰品槽 | ✅ |
| 物品 ID → **简体中文名** | Blizzard Game Data API | ✅ |
| 国服(CN)数据 | WCL 排行榜天然含 CN 区记录 | ✅ |

**核心结论**：小程序自己拿不到这些数据（鉴权密钥不能进小程序、需聚合、有频率限制），必须由**后台定时任务**抓取 + 聚合 + 写 JSON 上传 COS，小程序仍沿用现有「读 COS JSON」模式展示。

## 三、数据源一：Warcraft Logs API

### 3.1 凭证与端点

- 凭证类型：**V2 client（client credentials）**，在 https://www.warcraftlogs.com/api/clients/ 创建。
- 注意：国服站 `cn.warcraftlogs.com` 的设置页**无 Battle.net 绑定入口**，无法自助认领角色 → 无法建 key。必须在**国际主站 www.warcraftlogs.com** 完成「Claimed Characters → 导入战网角色」后才能建 key。
  - 国服战网（CN region）通过国际站 `/profile` 的 Battle.net 区块绑定；角色「自动导入」对国服可能 404，但只要角色认领成功即可建 key。
- OAuth：`POST https://www.warcraftlogs.com/oauth/token`，`grant_type=client_credentials`，Basic 认证（client_id:client_secret）。
- GraphQL：`POST https://www.warcraftlogs.com/api/v2/client`，Bearer token。
- **频率限制：3600 点/小时**（订阅可升到 9000/18000）。这是采集策略的核心约束。
- 数据是**全球统一库**，国服数据通过排行榜记录里的 `server.region === "CN"` 区分；无需切到 cn 站。

### 3.2 赛季 / 副本（zone & encounter）

```graphql
query { worldData { zones { id name expansion { name } encounters { id name } } } }
```

- 当前版本相关 zone（实测）：

| zoneID | 内容 | 备注 |
|---:|---|---|
| 47 | Midnight 大秘境第1赛季 | **对应项目当前版本 12.0 S1**，8 个地下城 |
| 50 | Midnight Sporefall（团本） | encounter 0 = 3159 Rotmire |
| 46 | Midnight VS / DR / MQD（团本） | |

- 注意：`worldData.zones` 数组**不是严格按时间排序**，不能简单取首/尾，需按 `expansion` + 名称定位当前赛季。

### 3.3 排行榜（rankings）—— 便宜，一次 100 条

```graphql
query($encounterId: Int!, $class: String!, $spec: String!, $metric: CharacterRankingMetricType!) {
  worldData { encounter(id: $encounterId) {
    name
    characterRankings(className: $class, specName: $spec, metric: $metric, leaderboard: Any)
  } }
}
```

- `characterRankings` 是 JSON 标量，`rankings[]` **每页默认 100 条**（翻页用 `page`）。
- 单条记录实测字段：

```json
{
  "name": "Macleans", "class": "Mage", "spec": "Fire",
  "amount": 180279.17,          // DPS
  "bracketData": 21,             // 钥石层数（M+）
  "hardModeLevel": 21,
  "affixes": [9, 10, 147],       // 词缀
  "score": 500.40, "medal": "bronze",
  "report": { "code": "jaH1RmbJ7PwCrMNn", "fightID": 9, "startTime": 1781673210117 },
  "server": { "id": 770, "name": "白银之手", "region": "CN" }
}
```

- 顶层含 `count`（样本数）。
- **这一层就给了 DPS / 层数 / 样本 / 区服**，成本 = 1 次请求 / (专精 × 地下城)。

### 3.4 装备 / 天赋 / 属性（CombatantInfo）—— 贵，每条战报一次

> ⚠️ **关键踩坑点**：CombatantInfo 事件记录在**整个战报的开头**（每个玩家首次出现时记一次），**不是按单场战斗记录**。
> 因此按 `fightIDs` 查 `events(dataType: CombatantInfo)` 会返回空，必须用**整段报告时间窗**查询，再用 `sourceID` 对应玩家。

```graphql
query($code: String!) {
  reportData { report(code: $code) {
    masterData { actors(type: "Player") { id name subType } }
    events(dataType: CombatantInfo, startTime: 0, endTime: 999999999, limit: 300) { data }
  } }
}
```

- 用排行榜记录的 `name` → `masterData.actors` 找到 `id` → 在 events 里匹配 `sourceID`。
- 单个 CombatantInfo 实测字段（完整样本见 `scripts/wcl-spike-out/FINAL-combatant-sample.json`）：

| 字段 | 含义 | 对应 UI |
|---|---|---|
| `intellect` / `strength` / `agility` | 主属性评级 | 属性排名（主） |
| `critSpell` / `hasteSpell` / `mastery` / `versatilityDamageDone` | 副属性评级（实测：暴击290/急速1180/精通1204/全能0） | **属性排名** |
| `gear[]` | 装备列表（含 `id` `itemLevel` `permanentEnchant` `gems[]` `setID` `bonusIDs` `icon`） | **装备 / 附魔 / 宝石 / 饰品** |
| `talentTree` | 天赋（loadout，可生成导出串） | **推荐天赋 / 导出** |
| `pvpTalents` | PvP 天赋 | — |
| `auras[]` | 开怪时身上 buff（实测："血骑士药水"/"奥术智慧"/"虔诚光环"） | **消耗品**（合剂/食物等） |
| `specID` / `faction` | 专精 / 阵营 | — |

- **装备槽位**：`gear[]` 按装备槽顺序排列。饰品在槽位 13、14（注意：**不要靠图标文件名判断饰品**——部分非饰品物品复用了带 `trinket` 字样的图标，会误判。须按真实槽位取）。

### 3.5 伤害构成（damage table）

```graphql
query($code: String!, $fight: Int!) {
  reportData { report(code: $code) { table(fightIDs: [$fight], dataType: DamageDone) } }
}
```

- 返回 `data.entries[]`，每人含 `total` 与 `abilities[]`（逐技能伤害，实测：Eruption / Ebon Might / Deep Breath …）。

### 3.6 其它已验证的边界情况

- **归档战报**：老战报（如 2015 年）返回 `This report has been archived. Subscribing users can access ... via the /user API endpoint.`。采集时取**近期**记录即可规避。
- `playerDetails` 的 `combatantInfo` 字段实测**恒为空**，不能用它取装备/天赋；必须走 3.4 的 events 方案。
- `report.rankings` 只给排名/百分位（rank、bracketPercent、score、medal），**不含装备天赋**。

## 四、数据源二：Blizzard Battle.net API（物品 ID → 中文名）

### 4.1 关键结论

- WCL 只返回物品 **ID + 图标文件名**，无名称。用 Blizzard Game Data API 反查。
- **重要发现**：使用**国际开发者门户**（develop.battle.net）注册的 client，配 `namespace=static-us` + `locale=zh_CN`，**直接返回简体中文名**。无需国服 API 网关（国服网关 `*.battlenet.com.cn` 在境外/沙箱不可达，但本方案用不到它）。

### 4.2 端点

- OAuth：`POST https://oauth.battle.net/token`，`grant_type=client_credentials`，Basic 认证。
- 物品：`GET https://us.api.blizzard.com/data/wow/item/{itemId}?namespace=static-us&locale=zh_CN`，Bearer token。返回 JSON 含 `name`（简体中文）。
- 实测：`250144` → en_US `Emberwing Feather` / zh_TW `燼翼之羽` / **zh_CN `烬翼羽毛`**。Midnight 新物品均能查到。
- 同一接口可查附魔、宝石（`permanentEnchant` / `gems[].id` 也是物品/附魔 ID，需对应 item 或 spell/enchant 接口）。

## 五、实测样例：法师/火 饰品选取比例

样本：法师/火 · Algeth'ar Academy(encounter 112526) · Top100（99 有效，1 归档）。
方法：排行榜 Top100 → 逐条开战报读 combatantInfo → 取饰品槽 → 按物品 ID 计数 ÷ 有效样本 → Blizzard API 翻中文名。

| 占比 | 饰品 |
|---:|---|
| 90.9% | 烬翼羽毛 |
| 55.6% | 艾林先知的凝视 |
| 52.5% | 圣光的遗落 |
| 43.4% | 威厄高尔的最终凝视 |
| … | （其余冷门 1~10%） |

> 注：每人戴 2 个饰品，各饰品占比之和约 200%，口径为「Top100 里有 X% 的人在用此饰品」，与竞品一致。同一算法可套用到附魔 / 宝石 / 消耗品 / 天赋 / 各装备部位。

## 六、采集成本与策略（后续实施关键约束）

- **两层成本**：排行榜 1 次请求得 100 条（便宜）；装备/天赋/属性需**逐条开战报**（贵，N 条样本 = N 次请求）。
- 口径定为「**每专精 Top100**」时的粗估：约 38 个专精 × 8 地下城，若按专精跨本合并 Top100，则约 **38 × 100 ≈ 3800 条战报/次**。
- 在 3600 点/小时限制下，需：**分批 + 限速 + 缓存（同一战报复用）+ 每天只跑一次**。同一份 M+ 战报常含同队多名玩家，缓存可显著省请求。
- 物品名（Blizzard API）可**全量缓存**，物品名基本不变，无需每天重查。

## 七、整体架构（沿用现有 COS 模式）

```
[后台定时任务 每天一次]
  WCL API (rankings + combatantInfo + table)
     │  聚合：占比 / 平均评级 / 人气
     │  Blizzard API：物品ID → 中文名（缓存）
     ▼
  生成 JSON (按 职业-专精 / 内容类型)
     │  上传腾讯云 COS
     ▼
[小程序] wx.request 读 COS JSON 渲染（与现有 class-data.js 同套路）
```

- 鉴权密钥（WCL + Blizzard）只存在于后台任务，**绝不进小程序**。
- 小程序只需新增「读 COS WCL JSON」的模块，无需新增合法域名（COS 域名已在白名单）。
- 自动化承载（GitHub Actions 定时 / 腾讯云函数 / 服务器 cron）待定。

## 八、验证脚本清单（位于 scripts/）

| 脚本 | 作用 |
|---|---|
| `wcl-spike.js` | 主验证：列 zone → 拉排行榜 → 拉单战报，参数 `--zone --class --spec` |
| `wcl-probe-combatant.js` | 扫多条战报找 combatantInfo（playerDetails 方案，已证实为空） |
| `wcl-probe-events.js` | 时间窗拉 CombatantInfo 事件（定位「整报告时间窗」踩坑点） |
| `wcl-probe-rankings.js` | 验证 report.rankings 不含装备天赋 |
| `wcl-probe-raid.js` | 在团本日志上验证 combatantInfo |
| `wcl-trinket-demo.js` | 端到端：算法师火 Top100 饰品占比 |
| `wcl-spike-out/` | 所有原始返回与样本 JSON |

运行方式（环境变量传密钥）：

```bash
WCL_CLIENT_ID=xxx WCL_CLIENT_SECRET=yyy node scripts/wcl-spike.js --zone 47 --class Mage --spec Fire
BNET_ID=xxx BNET_SECRET=yyy node ...   # Blizzard 物品名反查
```

## 九、待定事项（进入实施前需确认）

1. 采集口径：每专精 Top100 是否最终确定（或先做热门专精 / Top50 试点）。
2. 内容范围：大秘境 + 团本是否都做，首期是否只做大秘境。
3. 自动化承载平台选择。
4. COS JSON 数据结构设计。
5. 附魔 / 宝石 ID 的名称与图标解析细节。
