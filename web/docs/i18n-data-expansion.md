# WoWLook Web 多语言数据扩展说明

本文档说明网页端后续如何扩展多语言。当前设计原则是：中文主数据继续复用小程序/COS 的同一份数据，网页端按语言加载额外的官方本地化覆盖文件。

## 当前分层

网页端现在有两层多语言：

1. UI 翻译层：维护在 `web/i18n.js`
   - 按钮、筛选标题、职业、专精、副本、部位、副属性等界面文本。
   - 属性数值不翻译也不重算，只翻译属性名称。

2. 数据覆盖层：维护在 `web/locales/{locale}/data/{class}.json`
   - 装备名。
   - 装备描述。
   - `Equip` / `Use` 效果。
   - 套装名和套装 2/4 件效果。

主数据仍然来自：

```text
web/data-4.2.x/{class}.json
```

英文覆盖示例：

```text
web/locales/en-US/data/warlock.json
web/locales/en-US/data/monk.json
```

## 显示规则

网页端最终显示时按这个优先级：

```text
官方语言覆盖数据 > UI 字典翻译 > 中文主数据结构化字段 > 英文占位
```

数值类字段保留主数据：

```text
装等、属性数值、升级轨道数字、装备 ID、图标、来源结构
```

例如中文主数据里是：

```json
{ "type": "versatility", "name": "全能", "value": 45 }
```

英文界面显示：

```text
+45 Versatility
```

这里 `45` 来自主数据，`Versatility` 来自网页翻译层。

## 暴雪 API 可用语种

实测可返回有效物品本地化文本的 locale：

```text
en_US  英语-美国
en_GB  英语-英国
de_DE  德语
fr_FR  法语
es_ES  西班牙语-欧洲
es_MX  西班牙语-拉美
pt_BR  葡萄牙语-巴西
it_IT  意大利语
ru_RU  俄语
ko_KR  韩语
zh_TW  繁体中文
zh_CN  简体中文
```

不建议使用 `pt_PT`、`ja_JP`、`pl_PL` 等作为数据覆盖语言。它们请求可能返回 `200`，但物品名等文本为 `null`。

## 推荐目录

后续扩展时按网页 locale 命名目录：

```text
web/locales/en-US/data/
web/locales/ko-KR/data/
web/locales/de-DE/data/
web/locales/fr-FR/data/
web/locales/es-ES/data/
web/locales/es-MX/data/
web/locales/pt-BR/data/
web/locales/it-IT/data/
web/locales/ru-RU/data/
web/locales/zh-TW/data/
web/locales/zh-CN/data/
```

`en_US` 和 `en_GB` 目前可以先共用 `en-US`。如果以后需要区分英美文本，再增加 `en-GB` 覆盖目录。

## 生成覆盖数据

脚本位置：

```text
scripts/fetch-blizzard-en-localization.js
```

当前脚本已经支持英文生成，后续可扩展为通用 locale 脚本。密钥必须通过环境变量传入，不要写进项目文件。

英文样例：

```powershell
$env:BLIZZARD_CLIENT_ID='your-client-id'
$env:BLIZZARD_CLIENT_SECRET='your-client-secret'
node scripts\fetch-blizzard-en-localization.js --class=warlock --limit=20
```

只拉指定装备：

```powershell
node scripts\fetch-blizzard-en-localization.js --class=warlock --ids=151310,241044,250223
```

生成结果：

```text
web/locales/en-US/data/warlock.json
web/locales/en-US/data/warlock.js
```

## 后续扩展脚本建议

把脚本参数扩展成：

```powershell
node scripts\fetch-blizzard-localization.js --class=warlock --region=kr --locale=ko_KR --outLocale=ko-KR
```

参数含义：

```text
--region     暴雪 API region，例如 us、eu、kr、tw
--locale     暴雪 API locale，例如 ko_KR
--outLocale  网页目录 locale，例如 ko-KR
```

韩语示例：

```powershell
$env:BLIZZARD_CLIENT_ID='your-client-id'
$env:BLIZZARD_CLIENT_SECRET='your-client-secret'
node scripts\fetch-blizzard-localization.js --class=warlock --region=kr --locale=ko_KR --outLocale=ko-KR
```

输出：

```text
web/locales/ko-KR/data/warlock.json
```

## 每次赛季数据更新后的流程

1. 重新生成或更新 `cos-upload/data-4.2.x`。
2. 把同一份主数据复制到 `web/data-4.2.x`。
3. 对每个需要支持的语言和职业运行本地化脚本。
4. 检查 `web/locales/{locale}/data/{class}.json` 是否生成成功。
5. 本地预览，切换语言，抽查几件装备：
   - 普通装备名。
   - 饰品 `Equip` / `Use` 效果。
   - 套装 2/4 件效果。
   - 搜索是否能按本地化名称命中。
6. 部署 `web/` 到 Cloudflare Pages。

## 注意事项

- 不要用暴雪 API 的属性数值覆盖主数据数值。API 的 `preview_item.stats` 可能是基础预览值，不一定等于当前项目里的装等/升级轨道数值。
- 暴雪 API 适合拿官方文本，不适合重建装备数值模型。
- 如果某件装备 API 没有返回描述或 spell 文本，网页端会继续使用主数据结构并避免在非中文语言下直接泄漏中文长文本。
- `Client Secret` 不应提交到 Git，也不应写进 Cloudflare 静态文件。
