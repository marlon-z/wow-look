# 职业套装 289 导出设计

## 目标

将 `WoWLookTierExport` 导出的 13 个职业、117 件套装及配套外观装备统一生成为当前赛季真实可解析的神话 6/6、物品等级 289 版本，并保留各专精的 2 件/4 件套装效果。

## 当前问题

插件的 `BuildSeasonLink` 固定使用难度 5、Bonus ID 3524 和 Context 3606。客户端将该链接解析为英雄 2/6、物品等级 263。`scripts/parse-export.js` 只转换已导出的 tooltip 数据，因此不能把263安全地放大为289。

## 设计

- 新增 `addon/WoWLookTierExport/SeasonConfig.lua`，维护目标装等289、神话6/6轨道 Bonus ID 12806、史诗品质 Bonus ID 1674和客户端构建约束。
- 套装插件先通过 `C_Item.GetDetailedItemLevelInfo(itemId)` 读取物品基础装等，再按游戏 Bonus ID 规则计算达到289所需的等级差 Bonus ID。
- 新链接包含等级差 Bonus、12806和1674；核心套装与4件配套外观散件使用同一最高档规则。
- 读取 tooltip 后同时核对：物品 ID、tooltip 装等、API装等、目标289和神话6/6轨道。任何一项失败都记录失败状态，不能伪装成成功数据。
- 核心5件仍按专精读取套装效果，确保289链接不会破坏2件/4件效果。
- 导出摘要增加目标装等、成功数、失败数和失败明细，便于游戏外脚本阻止不完整数据发布。

## 数据发布门禁

重新导出后必须满足：13个职业、117件装备、全部289、失败数0；65件核心套装仍能解析对应专精效果。满足门禁后，才使用新 `WoWLookTierExport.lua` 重建 `cos-upload/data-4.3.x`。

