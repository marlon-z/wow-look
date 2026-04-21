# WoWLook Miniprogram Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 完成 WoWLook 微信小程序的基础产品层，实现 13 职业入口、职业数据按需加载、装备筛选与详情展示，并补齐后续真实数据入库所需的文件结构。

**Architecture:** 保持现有 `index` 和 `equipment` 两页结构不变，把数据加载和装备格式化抽到 `miniprogram/utils`。职业数据按 `miniprogram/data/{class}.json` 存放；`monk.json` 作为真实样例，其他职业先补成同结构空文件，页面层统一处理“无数据但可进入”的状态。新增 `scripts/fetch-data.js` 作为后续真实入库脚本骨架，对齐开发文档的数据结构。

**Tech Stack:** 微信小程序原生开发（WXML / WXSS / JS）、本地 JSON 数据文件、Node.js 抓数脚本

---

## Chunk 1: 页面与数据加载

### Task 1: 建立统一职业数据加载层

**Files:**
- Create: `miniprogram/utils/class-data.js`
- Create: `miniprogram/utils/equipment.js`
- Modify: `miniprogram/pages/equipment/equipment.js`

- [ ] 增加职业文件映射，去掉页面里的 `monk.json` 写死 fallback
- [ ] 增加物品扁平化、筛选、排序、详情格式化工具
- [ ] 让 `equipment` 页只负责交互状态和渲染数据

### Task 2: 完成首页职业入口展示

**Files:**
- Modify: `miniprogram/pages/index/index.js`
- Modify: `miniprogram/pages/index/index.wxml`
- Modify: `miniprogram/pages/index/index.wxss`

- [ ] 调整职业元数据，统一名称和视觉表现
- [ ] 完善首页布局、说明文案和进入逻辑

### Task 3: 完成装备页交互与状态展示

**Files:**
- Modify: `miniprogram/pages/equipment/equipment.js`
- Modify: `miniprogram/pages/equipment/equipment.wxml`
- Modify: `miniprogram/pages/equipment/equipment.wxss`

- [ ] 实现专精/属性/部位实时筛选
- [ ] 增加结果统计、空数据状态、无职业数据提示
- [ ] 完成装备详情浮窗和特效/属性展示

## Chunk 2: 数据文件结构

### Task 4: 补齐 13 个职业 JSON 文件

**Files:**
- Create: `miniprogram/data/warrior.json`
- Create: `miniprogram/data/paladin.json`
- Create: `miniprogram/data/hunter.json`
- Create: `miniprogram/data/rogue.json`
- Create: `miniprogram/data/priest.json`
- Create: `miniprogram/data/deathknight.json`
- Create: `miniprogram/data/shaman.json`
- Create: `miniprogram/data/mage.json`
- Create: `miniprogram/data/warlock.json`
- Modify: `miniprogram/data/monk.json`
- Create: `miniprogram/data/druid.json`
- Create: `miniprogram/data/demonhunter.json`
- Create: `miniprogram/data/evoker.json`

- [ ] 统一 13 个职业文件结构
- [ ] 保留 `monk.json` 真实样例数据
- [ ] 其余职业提供合法空数据，保证页面可进入

## Chunk 3: 数据生产脚本

### Task 5: 新建抓数脚本骨架

**Files:**
- Create: `scripts/fetch-data.js`

- [ ] 按文档定义常量、职业映射和数据结构
- [ ] 预留 KeystoneLoot、暴雪 API、Wowhead Tooltip 的接入函数
- [ ] 输出目标对齐 `miniprogram/data/{class}.json`

## Chunk 4: 校验

### Task 6: 做基础校验

**Files:**
- Verify: `miniprogram/data/*.json`
- Verify: `miniprogram/pages/**/*.js`
- Verify: `scripts/fetch-data.js`

- [ ] 校验 JSON 可解析
- [ ] 校验页面脚本无明显语法错误
- [ ] 总结未完成的数据真值链路缺口
