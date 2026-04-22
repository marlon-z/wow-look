# WoWLook Inspect Tooltip Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为 `WoWLookExport` 增加 `/wowlook inspect`，导出当前冒险指南悬停装备的 tooltip 原始文本和最小上下文。

**Architecture:** 保留现有批量导出路径不变，新增一条独立的单件验证路径。命令从当前显示的 `GameTooltip` 读取物品链接和文本行，再结合当前选中的 Encounter Journal 副本/Boss 作为上下文，写入 `WoWLookExportDB.inspect`。

**Tech Stack:** WoW Lua、Encounter Journal API、GameTooltip、SavedVariables

---

## Chunk 1: Tooltip Capture

### Task 1: 定义 inspect 数据结构和帮助函数

**Files:**
- Modify: `addon/WoWLookExport/WoWLookExport.lua`

- [ ] **Step 1: 新增 tooltip 行提取函数**

实现一个遍历 `GameTooltipTextLeft* / GameTooltipTextRight*` 的函数，按显示顺序提取非空文本。

- [ ] **Step 2: 新增当前物品读取函数**

调用 `GameTooltip:GetItem()`，返回 `itemName / itemLink`，并从 `itemLink` 解析 `itemId`。

- [ ] **Step 3: 新增上下文读取函数**

从当前 Encounter Journal 选择状态补 `instanceName / encounterName / difficultyId`。如果当前没有选中 Boss，则允许为空。

- [ ] **Step 4: 新增 inspect 存储函数**

把抓到的结果写入 `WoWLookExportDB.inspect`，同时打印成功摘要。

### Task 2: 新增 `/wowlook inspect`

**Files:**
- Modify: `addon/WoWLookExport/WoWLookExport.lua`

- [ ] **Step 1: 注册命令分支**

在现有 slash 命令里添加 `inspect` 子命令。

- [ ] **Step 2: 实现失败分支**

没有 tooltip、不是物品、无文本行时，聊天框打印清楚错误原因。

- [ ] **Step 3: 实现成功分支**

抓取结果后提示用户执行 `/reload` 以落盘到 `SavedVariables`。

## Chunk 2: Documentation

### Task 3: 更新插件使用说明

**Files:**
- Modify: `addon/WoWLookExport/README.md`

- [ ] **Step 1: 增加 inspect 命令说明**

写明它只抓“当前悬停装备”的 tooltip 验证数据。

- [ ] **Step 2: 增加使用步骤**

说明需要先打开冒险指南并把鼠标悬停到目标装备上，再执行 `/wowlook inspect`。

## Chunk 3: Verification

### Task 4: 本地静态验证

**Files:**
- Modify: `addon/WoWLookExport/WoWLookExport.lua`
- Modify: `addon/WoWLookExport/README.md`

- [ ] **Step 1: 运行语法级检查**

检查 Lua 文件是否存在明显语法错误和未闭合代码块。

- [ ] **Step 2: 人工复核命令路径**

确认新增命令不会影响 `/wowlook export`、`/wowlook status`、`/wowlook reset`。

- [ ] **Step 3: 输出游戏内验证指令**

给出最短测试步骤，让用户在游戏里执行一次 inspect 并回传结果。

