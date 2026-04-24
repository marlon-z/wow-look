# 艾泽配装 (WoWLook)

魔兽世界装备查询微信小程序。玩家选择职业和专精，即可查看当前赛季地下城与团本的装备掉落来源、属性和副属性分布。

当前版本覆盖：**至暗之夜（Midnight）12.0 赛季1**

## 项目结构

```
wow-look/
├── addon/WoWLookExport3/   # WoW 游戏内数据采集插件（Lua）
├── addon/WoWLookTierExport/ # WoW 职业套装采集插件（Lua）
├── scripts/parse-export.js  # 数据转换脚本（Node.js）
├── cos-upload/              # 腾讯云 COS 资源文件（图片 + 数据 JSON）
├── miniprogram/             # 微信小程序源码
├── docs/                    # 开发文档与阶段总结
├── WoWLookExport3.lua       # 普通装备导出样本
└── WoWLookTierExport.lua    # 职业套装导出样本
```

## 数据流水线

整个项目分为三个阶段：**游戏内采集 → 本地转换 → 小程序展示**。

### 第一阶段：游戏内数据采集

当前项目的数据采集拆成两条链路：

#### 1. 普通装备链路

使用自研插件 `WoWLookExport3`，以游戏内「冒险者手册」作为主要数据源。

**采集链路：**

1. 插件识别当前赛季的地下城（8个）与团本（3个）
2. 逐个副本、逐个首领读取掉落清单，建立掉落索引
3. 对每件装备补全当前赛季的实际展示版本
4. 从展示版本的说明框中读取最终属性并结构化解析
5. 数据写入 `WTF/Account/<账号>/SavedVariables/WoWLookExport3.lua`

**采集范围：**

- 地下城：`冒险者手册 → 地下城 → 本赛季`，固定筛选 `全职业 / 所有栏位 / 史诗`
- 团本：`冒险者手册 → 团队副本 → 本赛季`，固定筛选 `全职业 / 所有栏位 / 英雄`

**运行方式：**

```text
/wowlook3
```

#### 2. 职业套装链路

使用自研插件 `WoWLookTierExport`，专门导出当前赛季职业套装。

这条链路不再依赖玩家实际拥有套装，而是使用**赛季展示 link**读取客户端可渲染的套装 tooltip。

**采集范围：**

- 13 个职业
- 65 件套装
- 39 个专精的 `2 件 / 4 件` 套装效果

**当前导出口径：**

- 难度：英雄
- 轨道：英雄 `2/6`

**导出内容：**

- 套装名
- 5 件成员
- 每件的部位、护甲类型、主副属性、装等
- 按专精展开的套装效果

**运行方式：**

```text
/wowtierexport all
```

导出文件：

- `WTF/Account/<账号>/SavedVariables/WoWLookTierExport.lua`

### 第二阶段：数据转换

本地 Node.js 脚本将插件导出的 Lua SavedVariables 转换为小程序使用的 JSON 数据文件。

```bash
node scripts/parse-export.js --input <SavedVariables/WoWLookExport3.lua 路径>
```

脚本完成以下工作：

- 解析 Lua 表结构为 JavaScript 对象
- 按 13 个职业拆分数据，生成独立 JSON 文件（如 `warrior.json`）
- 生成总览文件 `overview.json`
- 下载装备图标并保存到 `assets/icons/`
- 为每件装备计算职业/专精归属、副属性分类

**输出文件：**

- `data/<职业>.json` — 按职业拆分的装备数据（13个文件）
- `data/overview.json` — 各职业装备数量汇总
- `assets/icons/` — 装备图标文件

职业套装数据当前已经有独立导出源 `WoWLookTierExport.lua`，后续会并入同一套前端数据结构。

### 第三阶段：小程序展示

微信小程序从腾讯云 COS 加载数据和图片资源，提供装备查询界面。

**筛选维度：**

| 维度 | 说明 |
|------|------|
| 职业（必选） | 13 个职业，决定甲种和可用装备范围 |
| 专精（可选） | 进一步过滤武器和饰品 |
| 副属性（可选） | 暴击、急速、精通、全能，最多选 2 项 |
| 部位（可选） | 头、肩、胸、腕、手、腰、腿、脚等，支持多选 |
| 来源（可选） | 地下城 / 团本 |
| 副本（可选） | 具体副本筛选 |

## 更新数据流程

当新赛季或新版本发布时：

1. 在 WoW 游戏内运行 `/wowlook3` 采集普通装备数据
2. 在 WoW 游戏内运行 `/wowtierexport all` 采集职业套装数据
3. 复制 `WoWLookExport3.lua` 和 `WoWLookTierExport.lua` 到本地
4. 运行本地转换脚本生成新数据
5. 将 `cos-upload/` 中的 `assets/` 和 `data/` 上传到腾讯云 COS
6. 小程序自动加载最新数据

## 技术栈

- **数据采集**：WoW Addon API (Lua)
- **数据转换**：Node.js
- **小程序**：微信小程序原生框架 (WXML/WXSS/JS)
- **资源托管**：腾讯云 COS

## 相关文档

- [插件开发说明](addon/WoWLookExport3/插件开发说明.md)
- [套装导出说明](addon/WoWLookTierExport/使用说明.md)
- [小程序开发文档](docs/开发文档.md)
- [阶段总结](docs/阶段总结-2026-04-23.md)
