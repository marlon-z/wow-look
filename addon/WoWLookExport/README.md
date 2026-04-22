# WoWLookExport

用于在《魔兽世界》客户端内导出冒险指南掉落数据，写入本地 `SavedVariables`，再由仓库内脚本转换成小程序使用的 JSON。

当前版本采用“激进版自动识别”：

- 自动识别当前赛季大秘境地图池
- 自动映射到冒险指南 Journal 副本
- 自动识别当前资料片下的全部团本
- 不再需要手工维护固定的 8 本 / 团本 ID 列表

同时提供一个单件验证命令：

- `/wowlook inspect`
- 用于抓取你当前在冒险指南里悬停装备的 tooltip 原始文本
- 只做验证，不参与批量导出主流程

## 安装

把整个目录复制到 WoW 插件目录：

```text
World of Warcraft\_retail_\Interface\AddOns\WoWLookExport
```

目录内至少应包含：

```text
WoWLookExport.toc
WoWLookExport.lua
```

## 游戏内使用

1. 登录角色并确保插件已启用。
2. 聊天框输入：

```text
/wowlook export
```

3. 等待插件输出自动识别结果和“导出完成”。
4. 输入：

```text
/reload
```

5. 导出文件会写到：

```text
World of Warcraft\_retail_\WTF\Account\<ACCOUNT>\SavedVariables\WoWLookExport.lua
```

## 可用命令

```text
/wowlook export
/wowlook inspect
/wowlook status
/wowlook reset
```

说明：

- `/wowlook export`：自动识别当前赛季副本池并导出
- `/wowlook inspect`：抓取当前悬停装备的 tooltip 文本和最小上下文
- `/wowlook status`：查看最近一次导出概要；如果自动识别失败，也会显示失败原因
- `/wowlook reset`：清空导出缓存

### inspect 使用步骤

1. 打开冒险指南。
2. 进入目标地下城或团本的掉落列表。
3. 把鼠标悬停在目标装备上，保持 tooltip 可见。
4. 输入：

```text
/wowlook inspect
```

5. 聊天框提示成功后输入：

```text
/reload
```

6. 结果会写入：

```text
World of Warcraft\_retail_\WTF\Account\<ACCOUNT>\SavedVariables\WoWLookExport.lua
```

查看字段：

```lua
WoWLookExportDB.inspect
```

## 仓库内转换命令

把导出的 `SavedVariables` 转成小程序职业数据：

```bash
node scripts/parse-export.js --input "C:\\Path\\To\\WoWLookExport.lua"
```

只生成单职业示例：

```bash
node scripts/parse-export.js --input "C:\\Path\\To\\WoWLookExport.lua" --class monk
```

输出到临时目录做抽样验证：

```bash
node scripts/parse-export.js --input "C:\\Path\\To\\WoWLookExport.lua" --class monk --output-dir "D:\\temp\\wowlook-test"
```

输出目录：

```text
miniprogram/data/*.json
miniprogram/data/*.js
```

## 当前导出范围

- 大秘境：8 个当前赛季副本
- 团本：当前资料片下 Journal 可枚举到的全部团本
- 语言：以你的游戏客户端语言为准；中文客户端会直接导出中文副本名、Boss 名、物品名

## 注意事项

- 插件只能写 `SavedVariables`，不能直接写任意 `json` 文件。
- 第一次导出或大版本更新后，物品缓存可能需要几秒钟加载。
- 如果插件提示导出完成但你没执行 `/reload`，本地文件不会更新。
- 激进版自动识别依赖客户端当前 API；如果某个赛季地图名和 Journal 名称对不上，插件会在聊天框打印“未匹配到 Journal 副本”。
- `/wowlook inspect` 读取的是当前显示中的 tooltip；如果鼠标离开装备导致 tooltip 消失，就抓不到数据。
