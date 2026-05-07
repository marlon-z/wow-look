# WoWLook Web 多语言维护说明

本文档是网页端 i18n 的最终维护说明。项目现在使用“固定术语字典 + 暴雪官方数据覆盖”的方案，不使用 OpenAI 翻译运行时，也不在浏览器端调用翻译 API。

## 当前架构

网页端多语言分三层：

1. 主数据层：`web/data-4.2.x/{class}.json`
   - 这是项目的结构化装备数据源。
   - 装等、装备 ID、图标、部位、属性数值、来源结构、职业可用性都以这一层为准。
   - 版本更新时先更新这一层。

2. 官方文本覆盖层：`web/locales/{locale}/data/{class}.json`
   - 由 `scripts/fetch-blizzard-localization.js` 从暴雪 API 生成。
   - 覆盖装备名、装备描述、`Use` / `Equip` 效果、套装名、套装 2/4 件效果。
   - 这一层只拿官方文本，不重算属性数值。

3. UI 和固定游戏术语层：`web/i18n.js`
   - 维护按钮、筛选项、提示文案、部位、副属性、护甲类型、职业、专精、副本名等固定文本。
   - 这些内容是稳定词表，不需要每次版本更新都重新拉 API。
   - 非英文 locale 已经显式声明自己的词表，不再继承英文 `Favorite`、`Chest`、`Haste`、`Plate` 这类文本。

页面最终显示优先级：

```text
官方文本覆盖层 > UI 和固定游戏术语层 > 主数据结构化字段 > 中文兜底
```

数值始终来自主数据层。例如：

```json
{ "type": "versatility", "name": "全能", "value": 45 }
```

英语页面显示 `Versatility45`，俄语页面显示 `Универсальность45`，其中 `45` 来自主数据，属性名称来自 `web/i18n.js`。

## 已支持语言

网页端当前支持以下 WoW 官方 locale：

```text
zh-CN  简体中文
zh-TW  繁體中文
en-US  English US
en-GB  English UK
de-DE  Deutsch
fr-FR  Français
es-ES  Español EU
es-MX  Español LATAM
pt-BR  Português BR
ko-KR  한국어
it-IT  Italiano
ru-RU  Русский
```

这些语言必须同时满足两件事：

- `web/i18n.js` 里有对应 UI 和固定术语字典。
- `web/locales/{locale}/data/` 里有对应职业数据覆盖文件。

## UI 和固定术语维护

固定术语全部维护在：

```text
web/i18n.js
```

该文件按固定 key 建表：

```text
CLASS_KEYS       职业 key
SPEC_KEYS        专精 ID
INSTANCE_KEYS    副本 / 套装来源 ID
ARMOR_KEYS       护甲类型
STAT_TYPE_KEYS   主属性 / 副属性
VALUE_KEYS       主数据里可能出现的中文分类值
SOURCE_TYPE_KEYS 来源筛选
FILTER_KEYS      筛选标题
VIEW_KEYS        视图模式
STAT_KEYS        副属性短标签
SLOT_KEYS        装备部位
```

每个 locale 的固定术语在 `DATA_BY_LOCALE` 中维护。每个 locale 的 UI 文案在 `UI_BY_LOCALE` 中维护。

新增 UI 文案时必须同步做三件事：

1. 在页面代码里使用 `i18n.t('newKey')`。
2. 在 `UI_BY_LOCALE` 的所有语言里添加 `newKey`。
3. 提升 `web/index.html` 里的 `app.js?v=...` 版本号，并同步提升 `web/app.js` 里 `i18n.js?v=...` 的版本号，避免浏览器继续使用旧模块缓存。
4. 运行验证命令，确认没有语法错误和漏翻。

新增固定术语 key 时必须同步做三件事：

1. 把 key 加到对应的 `*_KEYS` 常量。
2. 在 `DATA_BY_LOCALE` 或 `UI_BY_LOCALE` 的所有语言数组里按同一顺序补值。
3. 提升 `web/index.html` 里的 `app.js?v=...` 版本号，并同步提升 `web/app.js` 里 `i18n.js?v=...` 的版本号。
4. 运行验证命令。`mapKeys()` 会在数量不一致时直接抛错，避免静默漏翻。

验证命令：

```powershell
node --check web\i18n.js
node --input-type=module -e "import('./web/i18n.js').then(({SUPPORTED_LOCALES, createI18n, getLocaleName}) => { for (const locale of SUPPORTED_LOCALES) { const i18n=createI18n(locale); console.log(locale, getLocaleName(locale), '|', i18n.t('favoriteOff'), '|', i18n.t('slots.chest'), '|', i18n.t('stats.haste'), '|', i18n.t('data.armorTypes.plate'), '|', i18n.t('data.instances.945')); } })"
```

## 官方数据覆盖生成

通用脚本位置：

```text
scripts/fetch-blizzard-localization.js
```

这个脚本使用暴雪 API 生成装备官方文本覆盖文件，输出到：

```text
web/locales/{locale}/data/{class}.json
web/locales/{locale}/data/{class}.js
```

密钥只能通过环境变量传入，不要写进项目文件：

```powershell
$env:BLIZZARD_CLIENT_ID='your-client-id'
$env:BLIZZARD_CLIENT_SECRET='your-client-secret'
```

查看脚本内置语言：

```powershell
node scripts\fetch-blizzard-localization.js --listLocales
```

生成单职业法语：

```powershell
node scripts\fetch-blizzard-localization.js --class=warlock --outLocale=fr-FR
```

生成单职业指定装备：

```powershell
node scripts\fetch-blizzard-localization.js --class=warlock --outLocale=fr-FR --ids=151310,241044,250223
```

生成全职业单语言：

```powershell
node scripts\fetch-blizzard-localization.js --allClasses --outLocale=fr-FR
```

生成全职业全部 WoW 官方语言：

```powershell
node scripts\fetch-blizzard-localization.js --allClasses --allLocales
```

续跑已有数据，避免重复请求已生成装备：

```powershell
node scripts\fetch-blizzard-localization.js --allClasses --allLocales --skipExisting
```

英文旧脚本仍保留为兼容入口：

```powershell
node scripts\fetch-blizzard-en-localization.js --class=warlock
```

它等价于通用脚本的英文参数，新维护工作直接使用 `fetch-blizzard-localization.js`。

## 脚本参数

常用参数：

```text
--class         指定职业数据文件，例如 warlock
--allClasses    生成 web/data-4.2.x 下所有职业，不包含 overview.json
--outLocale     网页目录 locale，例如 fr-FR
--locale        暴雪 API locale，例如 fr_FR；通常省略，由 outLocale 推断
--region        暴雪 API region，例如 us、eu、kr、tw；通常省略，由 outLocale 推断
--allLocales    生成脚本内置的全部 WoW 官方语言
--dataDir       主数据目录，默认 web/data-4.2.x
--outDir        单语言输出目录，默认 web/locales/{outLocale}/data
--limit         每个职业只拉前 N 件，用于测试
--ids           只拉指定装备 ID，逗号分隔
--skipExisting  跳过输出文件里已经存在的装备记录
```

脚本内置的 locale、暴雪 API locale、默认 region：

```text
en-US  en_US  us
en-GB  en_GB  eu
de-DE  de_DE  eu
fr-FR  fr_FR  eu
es-ES  es_ES  eu
es-MX  es_MX  us
pt-BR  pt_BR  us
it-IT  it_IT  eu
ru-RU  ru_RU  eu
ko-KR  ko_KR  kr
zh-TW  zh_TW  tw
zh-CN  zh_CN  us
```

网页端切到 `fr-FR` 时会加载：

```text
web/locales/fr-FR/data/{class}.json
```

`en-GB` 会优先加载 `web/locales/en-GB/data/`。如果目录不存在或文件不存在，页面会回退到 `web/locales/en-US/data/`。

## 版本更新流程

每次赛季或数据版本更新时，按以下顺序执行：

1. 更新主数据目录 `web/data-4.2.x/`。
2. 确认 `web/data-4.2.x/{class}.json` 的职业文件完整。
3. 运行官方文本覆盖脚本：

```powershell
node scripts\fetch-blizzard-localization.js --allClasses --allLocales --skipExisting
```

4. 检查每个语言目录下是否生成了所有职业文件：

```text
web/locales/{locale}/data/{class}.json
```

5. 运行 `web/i18n.js` 检查：

```powershell
node --check web\i18n.js
```

6. 本地启动网页：

```powershell
cd web
python -m http.server 8787
```

7. 打开 `http://localhost:8787`，切换至少以下语言抽查：

```text
en-US
fr-FR
ru-RU
ko-KR
zh-TW
```

8. 抽查内容：
   - 装备名是否为当前语言。
   - `Use` / `Equip` 效果是否为当前语言。
   - 套装名和 2/4 件效果是否为当前语言。
   - 部位、护甲类型、副属性、副本名、收藏按钮是否为当前语言。
   - 搜索是否能按当前语言装备名命中。

9. 部署 `web/` 到 Cloudflare Pages。

## 网页端分享和请好友配装

网页端当前使用纯前端链接方案，不依赖 Cloudflare Worker、KV 或 D1。

已实现两个流程：

1. 收藏分享
   - 用户在收藏夹里点击“分享”。
   - 页面把最多 `MAX_SHARED_FAVORITES` 件装备编码到 `shareFav` 参数。
   - 对方打开链接后显示“好友分享的装备收藏”面板。
   - 对方可以点击“保存到我的收藏夹”导入本地收藏。

2. 请好友配装
   - 用户进入某个职业页面，点击“请好友配装”。
   - 页面生成带 `classKey` 和 `requestBuild=1` 的链接。
   - 对方打开链接后进入临时配装模式。
   - 对方选择装备后点击“分享本次配装”。
   - 页面把临时配装清单编码到 `shareFav` 参数。
   - 原用户打开返回链接后可以导入到自己的收藏夹。

分享链接格式：

```text
https://example.com/?shareFav=paladin%3A151333,151336
https://example.com/?classKey=paladin&requestBuild=1#class=paladin&requestBuild=1
```

分享实现位置：

```text
web/app.js
```

关键函数：

```text
buildFavoriteSharePayload()   把收藏或临时配装转换成 URL 参数
parseFavoriteSharePayload()   解析分享 URL
absoluteUrlWithShare()        生成收藏/配装结果分享链接
absoluteBuildRequestUrl()     生成请好友配装链接
shareUrl()                    优先系统分享，其次复制链接，最后显示手动复制面板
copyTextToClipboard()         复制链接，含 textarea 兜底
```

浏览器分享策略：

```text
navigator.share 可用：调用系统分享面板
navigator.share 不可用：复制链接到剪贴板
剪贴板被拦截：显示“分享链接”面板，让用户手动复制
```

当前纯前端方案适合第一版上线。它的限制是链接会随装备数量变长，所以 `MAX_SHARED_FAVORITES` 继续限制为 20。后续如果要支持更长清单、过期时间、访问统计或短链接，再增加 Cloudflare Worker + KV：

```text
短 ID -> 分享 JSON
```

新增分享相关 UI 文案时，必须在 `web/i18n.js` 的所有 locale 里同步添加，并提升 `web/index.html` 的 `app.js?v=...` 和 `styles.css?v=...` 版本参数。

## 请求量说明

生成官方文本覆盖会消耗暴雪 API 请求，不消耗 OpenAI tokens。

当前 13 个职业约 2134 件唯一装备。单语言全职业大约需要 2134 次 `item` 请求，另加少量 `item-set` 请求。全语言全职业大约是单语言请求量乘以语言数量。

使用 `--skipExisting` 可以跳过已经写入输出文件的装备，适合中断后续跑。

## 维护边界

- 暴雪 API 只用于官方文本覆盖，不用于重建装备数值模型。
- 不要用 API 的 `preview_item.stats` 覆盖主数据里的属性数值。
- 不要把 `Client Secret` 写进 Git、静态网页文件或文档示例。
- UI 固定术语不通过脚本生成；它们维护在 `web/i18n.js`。
- 新增语言时，必须同时补 `web/i18n.js` 和 `scripts/fetch-blizzard-localization.js` 的语言预设。
- 新增装备数据字段时，先确认字段属于“主数据结构”“官方文本覆盖”还是“固定术语字典”，再决定改哪个文件。
