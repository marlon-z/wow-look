# 午夜 S2 普通装备预检数据

此目录由 `scripts/parse-export.js` 基于客户端 Build 69283 的 `WoWLookExport3` 预检导出生成。

- 数据版本：`12.1-s2`
- 范围：8 个本赛季地下城、潮缚石窟（1317）、烈毒之渊（1320）
- 不含：至暗之夜（1312）及其他非目标团本、任何职业套装
- 装备版本：客户端实际掉落版本（`equipmentVariant: "drop_version"`），而非最终最高装等版本

每个职业 JSON 与 JS 文件都带有 `releaseStatus: "preflight_drop_versions"`。在完成客户端最高装等链接和属性验证前，禁止将本目录切换为小程序的正式运行数据。

后续最高装等处理须遵循 [`docs/midnight-item-upgrade-link-rules.md`](../../docs/midnight-item-upgrade-link-rules.md)；套装将由独立采集流程另行补入，不能从 KeystoneLoot 的五件催化清单直接拼装。
