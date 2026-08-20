# WCL 排行榜完整装备快照与总属性实施计划

**目标：** 仅为“排行榜配装”从 WCL / 精确 Wowhead tooltip 生成完整装备快照，并从同一 CombatantInfo 记录取得角色总属性；实时配装继续逐件使用本地库计算。

**架构：** 生成器为每件 WCL 装备解析名称、三主属性、耐力、护甲和四绿字，写入 schema 4 文件；同一预设携带 WCL CombatantInfo 原始总属性。客户端只有在 index 与内容文件都声明 `wclCombatantSnapshot: true` 时，才用装备快照展示卡片、用总属性计算排行榜总览。用户改动任一装备后退出这个模式并还原既有 `summarizeSlots`。

**技术：** Node.js 20、WCL GraphQL、Wowhead tooltip JSON、COS、微信小程序、Node assert 测试。

## 任务 1：严格解析每件 WCL 装备快照

**文件：**
- 修改：`scripts/wcl-authority-snapshot.js`
- 修改：`tests/test-wcl-authority-snapshot.js`

- [ ] 写入普通、制造业、套装、无绿字饰品、未知本地装备的 tooltip fixture，覆盖名称、主属性、耐力、护甲、四绿字与重复属性合并。
- [ ] 先运行 `node tests/test-wcl-authority-snapshot.js`，确认新增完整快照断言因解析器未实现而失败。
- [ ] 将制造业专用解析替换为通用 `parseItemSnapshotFromTooltip`：只读取规定 markup 边界，四绿字限定 `ebstats/egstats`，第三属性忽略；支持的非正/非数值属性必须报错。
- [ ] 新增 `resolveGearStats`，对每个 WCL 槽位以 `itemId + bonusIDs + locale` 查询并要求 `snapshotStatus: 'resolved'`；制造业兼容 `craftedStats` 等于快照绿字并保留顺序随机属性索引。
- [ ] 将 `gearToSlots` 改为所有已出现槽位必经解析，解析失败让候选失败，不能输出不完整快照。
- [ ] 重跑 `node tests/test-wcl-authority-snapshot.js`。

## 任务 2：绑定 CombatantInfo 总属性并生成 schema 4

**文件：**
- 修改：`scripts/wcl-authority-snapshot.js`
- 修改：`scripts/build-wcl-presets.js`
- 修改：`scripts/audit-wcl-preset-mapping.js`
- 修改：`tests/test-wcl-authority-snapshot.js`
- 新增：`tests/test-wcl-combatant-stats.js`
- 修改：`tests/test-wcl-preset-config.js`
- 修改：`tests/test-wcl-build-scope.js`
- 新增：`tests/test-wcl-staged-generation.js`

- [ ] 为同报告、同 fight、同 actor 的 CombatantInfo fixture 编写失败测试，覆盖三种暴击/急速字段选择、字段来源和不存在时拒绝候选。
- [ ] 先运行两项 focused test，确认总属性 extractor / schema 标记尚不存在。
- [ ] 收紧 `findCombatant`，禁止跨角色或跨 fight 回退；实现总属性字段归一化与 `fieldSources` 的九字段完整契约。
- [ ] 在 `buildPreset` 写入 `combatantStats`，在输出压缩时保留完整 slot snapshot、schema 4 与双端 `wclCombatantSnapshot: true` 标记。
- [ ] 去除生产目录的局部生成旁路。重构为 staging 目录：全量在完整生成后调用审计模块对 staging 目录生成 `mapping-audit.json`，两者成功后才替换；测试前缀局部生成先复制/合并，再审计、原子替换。生成或审计任一失败均保留旧目录。
- [ ] 在 `test-wcl-staged-generation.js` 使用临时测试目录，明确断言生成失败、审计失败不改变旧 content/index/audit；完整成功后这三者作为同一组替换。
- [ ] 运行 `node tests/test-wcl-authority-snapshot.js; node tests/test-wcl-combatant-stats.js; node tests/test-wcl-preset-config.js; node tests/test-wcl-build-scope.js; node tests/test-wcl-staged-generation.js`。

## 任务 3：排行榜展示使用 WCL 快照，总览使用 WCL 总值

**文件：**
- 修改：`miniprogram/utils/wcl-presets.js`
- 修改：`miniprogram/utils/stat-calc.js`
- 修改：`miniprogram/utils/builds.js`
- 修改：`miniprogram/pages/build/build.js`
- 修改：`tests/test-wcl-preset-apply-metadata.js`
- 新增：`tests/test-wcl-summary-mode.js`
- 新增：`tests/test-wcl-build-state.js`
- 修改：`tests/test-wcl-cos-reader.js`

- [ ] 为本地命中、本地缺失、制造业、套装写入套用测试；断言卡片使用 WCL 名称/装等/全部属性，而缺失装备仍用“装”图标与“WCL 排行榜数据”出处。
- [ ] 写 `summarizeWclCombatant` 单测，断言它只读取 WCL 总属性、不读取 slots，且复用现行百分比和精通格式规则。
- [ ] 在 `stat-calc.js` 添加纯总属性汇总函数，不改变 `summarizeSlots`。
- [ ] 在 `wcl-presets.js` 以 WCL snapshot 覆盖数值字段；本地命中保留图标/出处/套装元数据，缺失项建立未知图标的完整对象。保存总属性模式 metadata。
- [ ] 在 `builds.js` 集中选择总览算法：有效排行榜 mode 使用 `summarizeWclCombatant`，否则使用现有 `summarizeSlots`；存储重载也走同一入口。`setSlotItem`、`setWeaponSlotItem`、`clearSlot` 和 `clearAllSlots` 统一清除排行榜 mode，避免翻页/重载后保留陈旧 WCL 总属性。
- [ ] 在页面加载链路同时校验 index 与内容 marker 后才开启新模式；旧文件继续旧行为。
- [ ] 找到所有手动选装、替换、清空入口，统一清除排行榜总属性模式；下次渲染立即使用原 `summarizeSlots`。
- [ ] 在 `test-wcl-build-state.js` 验证套用后保存/重载仍使用 WCL 总值，每种手动改槽入口均即时回退逐件汇总。
- [ ] 运行 `node tests/test-wcl-preset-apply-metadata.js; node tests/test-wcl-summary-mode.js; node tests/test-wcl-build-state.js; node tests/test-wcl-cos-reader.js; node tests/test-crafting-selection.js`。

## 任务 4：审计、文档与回归验证

**文件：**
- 修改：`scripts/audit-wcl-preset-mapping.js`
- 修改：`tests/test-audit-wcl-preset-mapping.js`
- 修改：`docs/wcl-preset-automation.md`

- [ ] 为 slot snapshot 与 combatant totals 覆盖率添加审计 fixture，另计本地映射的套装子集；本地映射缺失仍是非阻塞记录。
- [ ] 在审计输出新增 snapshot 已解析/缺失/无绿字、总属性已解析和 tier 子集计数；缺失快照/总属性由生成器在上传前阻断。
- [ ] 更新自动化文档，说明 schema 4、双标记、两种计算路径、失败不覆盖 COS 和旧前缀保留。
- [ ] 运行全部测试：`Get-ChildItem tests -Filter 'test-*.js' | Sort-Object Name | ForEach-Object { node $_.FullName; if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE } }`，再运行 `git diff --check`，并验证现有数据 schema 2 在客户端仍走旧路径。
- [ ] 在用户再次授权发布后，提交推送并只触发一次默认三专精轮转，核对一个制造业、一个缺失本地装备和总览值。
