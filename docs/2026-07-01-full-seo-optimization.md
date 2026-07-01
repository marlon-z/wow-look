# 全站 SEO 优化计划（配装/专精落地页 + 结构化数据 + 多语言）

> 目标：把「配装模拟器 / 毕业装(BiS) / 装备查询」这些高价值长尾页做成有料、唯一、可被爬取和富媒体收录的页面，并让德/法等非中文用户也能搜到本站。
> 硬约束：**生成 SEO 页和用户访问全程 0 COS 流量**；排行榜副属性倾向**只在手动刷新时**读一次 COS；**绝不编造属性优先级**，全部用可核实的本地数据。

---

## 0. 现状（已很扎实，本次是补短板）
- 12 语言静态页：首页 / `equipment` / `build` / `<class>` / `build/<class>` / `build/<class>/<specId>`；canonical + hreflang(x-default) + sitemap(828 条) + robots 都在。
- 短板：**build/专精页 noscript 仅 ~720 字**（class 页 6343 字），各专精/各语言近重复；结构化数据只有 `WebApplication`；无 BiS/FAQ/面包屑；10 语言 UI 仍英文兜底。

## 1. 数据源（全部本地，生成期 0 COS）
| 用途 | 本地来源 |
|---|---|
| 护甲类型 / 专精 / 可用装备(stats/ilvl/slot/specs) / 来源副本 | `web/data-4.4.x/{class}.json` |
| 精通名 / 效果 | `miniprogram/utils/mastery-coefficients.js`（移植成静态表） |
| 排行榜副属性倾向(B类) | `cos-upload/wcl-presets/data-4.4.x`（**手动同步一次**）→ 聚合成 `web/data-4.4.x/wcl-stat-tendency.json`（提交入库） |
| 部位/属性/职业/专精/副本 本地化名 | `web/i18n.js`（`DATA_BY_LOCALE`） |
| 装备官方名（各语言） | `web/locales/{locale}/data/{class}.json` |

## 2. B 类「副属性倾向」数据管线（准 + 只拉一次）
- `scripts/sync-wcl-presets.js`（新）：一次性从 COS 下载全部预设到本地 `cos-upload/wcl-presets/data-4.4.x`（**唯一碰 COS 的一步，手动触发**）。
- `scripts/build-wcl-stat-tendency.js`（新）：**只读本地**预设 + `web/data-4.4.x` 装备库，逐专精：取「最高层/顶级」预设集合 → 逐预设逐槽求副属性 rating（`itemId`→本地装备 `stats.secondary`，`craftedStats` 覆盖）→ 四维(暴击/急速/精通/全能)累加归一化排序 → 记录样本数与生成时间 → 写 `web/data-4.4.x/wcl-stat-tendency.json`（几 KB，提交）。
- **口径（老实定义）**：统计「前列高分日志装备中占比最高的副属性」，不等同于“最优优先级”；文案写「据 WCL 高分日志统计，前列XX最常堆X」。
- **刷新**：版本更新后手动重跑 `sync` + `build-tendency`；生成器永远只读产物 JSON，不连 COS。

## 3. P0 —— 配装/专精页做成有料落地页
每个 `build/<class>/<spec>` 页，在 `<noscript>` 输出可爬内容 + 对应 JSON-LD：
- `h1` + 一段专精介绍（模板 + 本地化名词）。
- **事实 FAQ（A 类，100% 可核实）**：能穿什么甲、可用武器类型、16 装备槽、精通名与效果、本赛季该专精可用装备件数与来源副本、如何用模拟器/排行榜配装。
- **BiS 按部位表**：该专精每个部位**可用最高装等**装备（名/装等/来源），来自本地数据。
- **副属性倾向（B 类）**：读 `wcl-stat-tendency.json`，客观陈述 + 样本量。
- **可爬内链**：同职业其它专精、父职业页、装备查询页。

## 4. P1 —— 结构化数据 & 站内链接
- `BreadcrumbList`：首页→职业→配装→专精，全深层页。
- `FAQPage`：class 页 + build/专精页（抢富媒体结果）。
- `WebSite` + `SearchAction`：首页（品牌搜索框）。
- `ItemList`(BiS)：build/专精页。
- `SoftwareApplication`：build 页（工具类）。
- **可爬 `<a>` 内链网**：首页→工具(配装/装备查询)→职业→该职业各专精配装→装备查询；新增「全专精」枢纽区块（现有互链多为客户端渲染且仅中文，爬不到）。

## 5. P2 —— 多语言可发现性（德/法等）
- 补齐 `web/i18n.js` `BUILD_I18N` 其余 10 语言（德/法/西/es-MX/葡/意/俄/韩/繁中/en-GB）。
- FAQ/BiS **文案模板化**：名词用 i18n 已本地化的部位/属性/职业/专精/副本名 + `locales/*/data` 装备名；固定话术新增 `SEO_FAQ` i18n 段，各语言补全。
- 生成器 12 语言都产出本地化的 P0 内容（页面框架已在）。
- 复核 hreflang 往返标签、`x-default`（当前 zh-CN，待议是否改 en）。

## 6. 里程碑（按此顺序施工）
1. **B 管线**：`sync-wcl-presets.js` + 手动同步一次 + `build-wcl-stat-tendency.js` + 产物 `wcl-stat-tendency.json`（提交）。
2. **P0 生成器**：build/专精页 noscript + JSON-LD（BiS + 事实FAQ + 倾向），先中/英跑通。
3. **P1**：全站 Breadcrumb/FAQPage/WebSite-SearchAction/ItemList/SoftwareApplication + 可爬内链。
4. **P2**：补齐 10 语言 UI + `SEO_FAQ` 各语言文案，12 语言重生成。
5. **重新生成 + 校验**。

## 7. 验收
- build/专精页 noscript 字数远大于 720，且每专精唯一（非近重复）。
- Google Rich Results Test：FAQPage / BreadcrumbList / ItemList 通过。
- **生成与访问全程 0 COS**（仅手动 `sync` 那一次读 COS）。
- 德/法页面 UI + FAQ 本地化、无中文泄漏。
- 属性倾向文案客观、带样本量、可复算。

## 8. 不做（本轮）
- P3（性能/CWV、每职业 OG 图、缓存头等）暂缓。
- 不引入任何定时/每次生成/每次访问的 COS 拉取。
