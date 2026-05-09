# 多语言 SEO 后续更新说明

这份说明用于后续游戏版本、赛季数据或多语言数据更新时，重新生成 SeasonLoot 的静态 SEO 页面。

## 什么时候需要执行

出现以下任一情况，都需要重新生成 SEO 页面：

- `data-4.2.x/` 这类赛季数据目录更新。
- 新增了下一个版本的数据目录，例如 `data-4.3.x/`。
- `locales/*/data/` 里的多语言物品数据更新。
- 新增、删除或调整支持的语言。
- 修改了站点域名、canonical、hreflang、cache bust 或语言 URL。
- 调整了 SEO 文案模板、标题、描述或结构化数据。

## 版本更新流程

1. 准备新版本数据。

   把新赛季数据复制到 `web/` 下，例如：

   ```text
   web/data-4.3.x/
   ```

2. 准备多语言数据。

   确认各语言目录存在并包含对应职业数据：

   ```text
   web/locales/en-US/data/
   web/locales/de-DE/data/
   web/locales/ko-KR/data/
   web/locales/zh-CN/data/
   ```

   如果某个语言缺少物品翻译，生成脚本会回退到默认英文数据；但为了 SEO 效果，重点语言建议补齐。

3. 更新 `seo.config.json`。

   常见需要改的字段：

   ```json
   {
     "currentVersion": "4.3.x",
     "dataDir": "data-4.3.x",
     "cacheBust": "20260601-season-update"
   }
   ```

   如果语言 URL 要调整，也在这里改：

   ```json
   { "locale": "de-DE", "slug": "de", "hreflang": "de-DE" }
   ```

4. 检查 `config.js`。

   如果运行时也要读取新版本数据，需要同步修改：

   ```js
   export const DATA_VERSION = '4.3.x';
   ```

5. 重新生成静态 SEO 页面。

   在 `web/` 目录执行：

   ```powershell
   node generate-seo-pages.js
   ```

   脚本会重新生成：

   - 默认英文首页和职业页：`/`、`/warrior/`
   - 多语言首页和职业页：`/de/`、`/de/warrior/`、`/ko/warrior/` 等
   - `sitemap.xml`
   - `robots.txt`

## 部署前检查

建议至少检查这些页面：

```text
/
/warrior/
/de/
/de/warrior/
/ko/
/ko/warrior/
/zh-cn/
/zh-cn/warrior/
```

本地预览：

```powershell
python -m http.server 8787
```

如果 `8787` 被占用，换一个端口：

```powershell
python -m http.server 8788
```

重点确认：

- 页面能正常打开。
- 职业页能加载装备数据。
- 德语页显示德语职业名、装备名、副本名。
- 韩语页显示韩语职业名、装备名、副本名。
- 页面 `<html lang="">` 正确。
- canonical 指向当前语言 URL。
- hreflang 包含其它语言版本。
- `sitemap.xml` 包含所有语言 URL。
- 浏览器 console 没有资源加载错误。

## 常见问题

### 语言页显示中文

通常是 `locales/{locale}/data/{class}.json` 缺少翻译，或 `i18n.js` 里该语言的职业、副本、部位翻译不完整。

优先检查：

```text
locales/de-DE/data/warrior.json
locales/ko-KR/data/warrior.json
i18n.js
```

### 页面能打开，但装备数据加载失败

检查 `config.js` 的路径逻辑和 `DATA_VERSION` 是否与实际数据目录一致。

例如：

```js
export const DATA_VERSION = '4.3.x';
```

对应目录必须存在：

```text
data-4.3.x/
```

### hreflang 或 canonical 不对

优先检查 `seo.config.json`：

- `baseUrl`
- `defaultLocale`
- `locales[].slug`
- `locales[].hreflang`

然后重新执行：

```powershell
node generate-seo-pages.js
```

## 推荐维护策略

- 当前赛季继续使用短 URL，例如 `/de/warrior/`。
- 如果未来要保留历史赛季，再增加归档 URL，例如 `/de/4-3-x/warrior/`。
- 不要手动编辑生成出来的 `index.html` 页面；改生成脚本、配置或数据后重新生成。
- 每次上线后，在 Google Search Console 提交新的 `sitemap.xml`。
