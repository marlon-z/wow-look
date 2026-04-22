# WoWLook Inspect Tooltip Design

**Date:** 2026-04-22

## Goal

为 `WoWLookExport` 增加一个最小验证命令 `/wowlook inspect`，用于抓取玩家当前在冒险指南中悬停的单件装备 tooltip 展示层数据，验证插件是否能拿到游戏内实际显示的 `物品等级 / 升级轨道 / 主属性 / 副属性 / 特效说明`，而不是基础 `GetItemInfo()` 模板数据。

## Problem

当前批量导出路径在 `BuildItemDetails()` 中调用 `GetItemInfo(itemId)` 与 `GetItemStats(itemLink)`。这只能得到物品基础模板层数据，无法反映冒险指南当前难度下的满级史诗装备展示数据，因此会出现：

- `ilvl` 过低，例如 `44`
- 主属性和副属性值明显偏小
- 丢失 `升级：勇士 1/6` 这类展示层信息
- 无法证明插件导出与游戏内冒险指南 tooltip 一致

## Scope

本次只做单件装备验证链路，不扩展为全量导出：

- 新增聊天命令：`/wowlook inspect`
- 只处理“当前冒险指南中鼠标悬停的那一件装备”
- 导出原始 tooltip 文本行
- 附带最少量上下文字段，便于后续接入和定位

不在本次范围内：

- 全量装备 tooltip 批量导出
- 对 tooltip 文本做完整结构化解析
- 替换现有 `/wowlook export` 主流程

## Data Shape

`/wowlook inspect` 成功后，插件写入 `WoWLookExportDB.inspect`：

```lua
WoWLookExportDB.inspect = {
  capturedAt = "2026-04-22 17:00:00",
  source = "EncounterJournal",
  itemId = 251201,
  itemLink = "|cffa335ee|Hitem:251201::::::::80:::::::::|h[核心多用仪]|h|r",
  itemName = "核心多用仪",
  instanceName = "节点希纳斯",
  encounterName = "核心工程长卡斯雷瑟",
  difficultyId = 23,
  tooltipLines = {
    "核心多用仪",
    "史诗",
    "物品等级246",
    "升级：勇士 1/6",
    "拾取后绑定",
    ...
  }
}
```

## Capture Strategy

推荐直接抓取“当前可见 tooltip 的文本行”，而不是再次从 `GetItemInfo()` 组装。原因：

- tooltip 行文本就是用户在游戏中实际看到的内容
- 能原样包含装等、升级轨道、说明文字
- 本次目标是验证展示层可抓取，不是立刻做最终数据模型

实现方式：

1. 尝试读取当前鼠标下的 `GameTooltip`
2. 如果 tooltip 当前显示的是装备物品，则提取：
   - `GetItem()` 返回的 `itemName / itemLink`
   - 所有左/右文字行文本
3. 尝试从 tooltip 所属 owner 或已选中的 Encounter Journal 列表项补副本 / Boss 上下文
4. 存入 `WoWLookExportDB.inspect`

## Error Handling

`/wowlook inspect` 需要明确打印失败原因：

- 当前没有可读取的 tooltip
- 当前 tooltip 不是物品
- 当前不在冒险指南掉落列表场景
- 读取到 itemLink 但 tooltip 文本为空

## Success Criteria

以下条件同时满足即视为验证成功：

- 在冒险指南中悬停一件装备后执行 `/wowlook inspect`
- `SavedVariables` 中写入一条 `inspect` 记录
- `tooltipLines` 中能看到游戏里实际显示的关键文本，例如：
  - `物品等级246`
  - `升级：勇士 1/6`
  - 主属性 / 耐力 / 副属性
  - `使用：...` 或 `装备：...`
- 不再只依赖 `GetItemInfo()` 返回的基础模板层数据

## Files

- Modify: `addon/WoWLookExport/WoWLookExport.lua`
- Modify: `addon/WoWLookExport/README.md`

