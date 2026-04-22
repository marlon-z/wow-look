local ADDON_NAME = ...

WoWLookExport2DB = WoWLookExport2DB or {
    version = "2.2.0",
    payload = "",
    summary = nil,
}

-- 地下城用 23 (Mythic)，手册会显示勇士 1/6 (ilvl 246) 的装备
-- 团本用 16 (Mythic/史诗)，显示最高难度装等
local DUNGEON_DIFFICULTY = 23
local RAID_DIFFICULTY = 16

local EQUIPPABLE_ITEM_CLASSES = { [2] = true, [4] = true }

-- 每个专精对应的主属性: str / agi / int
local SPEC_PRIMARY = {
    -- 战士: 力量
    [71] = "str", [72] = "str", [73] = "str",
    -- 圣骑士: 神圣=智力, 防护=力量, 惩戒=力量
    [65] = "int", [66] = "str", [70] = "str",
    -- 猎人: 敏捷
    [253] = "agi", [254] = "agi", [255] = "agi",
    -- 盗贼: 敏捷
    [259] = "agi", [260] = "agi", [261] = "agi",
    -- 牧师: 智力
    [256] = "int", [257] = "int", [258] = "int",
    -- 死亡骑士: 力量
    [250] = "str", [251] = "str", [252] = "str",
    -- 萨满: 元素=智力, 增强=敏捷, 恢复=智力
    [262] = "int", [263] = "agi", [264] = "int",
    -- 法师: 智力
    [62] = "int", [63] = "int", [64] = "int",
    -- 术士: 智力
    [265] = "int", [266] = "int", [267] = "int",
    -- 武僧: 酒仙=敏捷, 踏风=敏捷, 织雾=智力
    [268] = "agi", [269] = "agi", [270] = "int",
    -- 德鲁伊: 平衡=智力, 野性=敏捷, 守护=敏捷, 恢复=智力
    [102] = "int", [103] = "agi", [104] = "agi", [105] = "int",
    -- 恶魔猎手: 敏捷
    [577] = "agi", [581] = "agi", [1480] = "agi",
    -- 唤魔师: 智力
    [1467] = "int", [1468] = "int", [1473] = "int",
}

local ALL_CLASS_SPECS = {
    { classId = 1,  specs = {71, 72, 73} },
    { classId = 2,  specs = {65, 66, 70} },
    { classId = 3,  specs = {253, 254, 255} },
    { classId = 4,  specs = {259, 260, 261} },
    { classId = 5,  specs = {256, 257, 258} },
    { classId = 6,  specs = {250, 251, 252} },
    { classId = 7,  specs = {262, 263, 264} },
    { classId = 8,  specs = {62, 63, 64} },
    { classId = 9,  specs = {265, 266, 267} },
    { classId = 10, specs = {268, 269, 270} },
    { classId = 11, specs = {102, 103, 104, 105} },
    { classId = 12, specs = {577, 581, 1480} },
    { classId = 13, specs = {1467, 1468, 1473} },
}

------------------------------------------------------------------------
-- 工具函数
------------------------------------------------------------------------

local function Print(msg)
    print(string.format("|cff00ff00[WoWLookExport2]|r %s", msg))
end

local function PrintWarn(msg)
    print(string.format("|cffff6600[WoWLookExport2]|r %s", msg))
end

local function SortNumbers(t)
    table.sort(t, function(a, b) return a < b end)
end

local function NormalizeName(s)
    if not s then return "" end
    return tostring(s):lower():gsub("[%s%p%c]+", "")
end

------------------------------------------------------------------------
-- EJ 前置加载
------------------------------------------------------------------------

local function EnsureEJLoaded()
    if EncounterJournal_LoadUI then
        pcall(EncounterJournal_LoadUI)
    end
    if C_AddOns and C_AddOns.IsAddOnLoaded and not C_AddOns.IsAddOnLoaded("Blizzard_EncounterJournal") then
        pcall(C_AddOns.LoadAddOn, "Blizzard_EncounterJournal")
    elseif IsAddOnLoaded and not IsAddOnLoaded("Blizzard_EncounterJournal") and UIParentLoadAddOn then
        pcall(UIParentLoadAddOn, "Blizzard_EncounterJournal")
    end
    return type(EJ_SelectInstance) == "function"
       and type(EJ_SetDifficulty) == "function"
       and type(EJ_GetNumLoot) == "function"
       and C_EncounterJournal
       and type(C_EncounterJournal.GetLootInfoByIndex) == "function"
end

local function ResetLootFilters()
    if EJ_ResetLootFilter then
        EJ_ResetLootFilter()
    elseif EJ_SetLootFilter then
        EJ_SetLootFilter(0, 0)
    end
    if C_EncounterJournal and C_EncounterJournal.ResetSlotFilter then
        C_EncounterJournal.ResetSlotFilter()
    elseif C_EncounterJournal and C_EncounterJournal.SetSlotFilter then
        C_EncounterJournal.SetSlotFilter(0)
    end
end

------------------------------------------------------------------------
-- JSON 序列化器
------------------------------------------------------------------------

local function jsonEscape(s)
    return tostring(s)
        :gsub("\\", "\\\\")
        :gsub("\"", "\\\"")
        :gsub("\n", "\\n")
        :gsub("\r", "\\r")
        :gsub("\t", "\\t")
end

local function isSeqArray(t)
    local n = #t
    if n == 0 then
        for _ in pairs(t) do return false end
        return true
    end
    local count = 0
    for _ in pairs(t) do count = count + 1 end
    return count == n
end

local function jsonEncode(val)
    if val == nil then return "null" end
    local vt = type(val)
    if vt == "boolean" then return val and "true" or "false" end
    if vt == "number" then
        if val ~= val or val == math.huge or val == -math.huge then return "null" end
        return tostring(val)
    end
    if vt == "string" then return "\"" .. jsonEscape(val) .. "\"" end
    if vt == "table" then
        local parts = {}
        if isSeqArray(val) then
            for i = 1, #val do parts[i] = jsonEncode(val[i]) end
            return "[" .. table.concat(parts, ",") .. "]"
        end
        for k, v in pairs(val) do
            parts[#parts + 1] = "\"" .. jsonEscape(k) .. "\":" .. jsonEncode(v)
        end
        table.sort(parts)
        return "{" .. table.concat(parts, ",") .. "}"
    end
    return "null"
end

------------------------------------------------------------------------
-- 自动识别当前赛季副本
------------------------------------------------------------------------

local function BuildJournalIndex()
    local byName = {}
    local maxTier = type(EJ_GetNumTiers) == "function" and EJ_GetNumTiers() or 0
    for tierIndex = 1, maxTier do
        EJ_SelectTier(tierIndex)
        local instIdx = 1
        while true do
            local instId = EJ_GetInstanceByIndex(instIdx, false)
            if not instId then break end
            EJ_SelectInstance(instId)
            local instName = EJ_GetInstanceInfo()
            local key = NormalizeName(instName)
            if key ~= "" then
                byName[key] = { id = instId, name = instName, tierId = tierIndex }
            end
            instIdx = instIdx + 1
        end
    end
    return byName
end

local function DetectDungeonIds()
    if not (C_ChallengeMode and C_ChallengeMode.GetMapTable and C_ChallengeMode.GetMapUIInfo) then
        error("客户端未提供 ChallengeMode API。")
    end
    local mapIds = C_ChallengeMode.GetMapTable() or {}
    local mapNames, unresolved, detected, seen = {}, {}, {}, {}
    local index = BuildJournalIndex()
    for _, mapId in ipairs(mapIds) do
        local name = C_ChallengeMode.GetMapUIInfo(mapId)
        if name then
            mapNames[#mapNames + 1] = name
            local match = index[NormalizeName(name)]
            if match and not seen[match.id] then
                seen[match.id] = true
                detected[#detected + 1] = match.id
            elseif not match then
                unresolved[#unresolved + 1] = { mapId = mapId, name = name }
            end
        end
    end
    SortNumbers(detected)
    return detected, { ids = detected, mapIds = mapIds, mapNames = mapNames, unresolved = unresolved }
end

local function DetectRaidIds()
    if not (C_SeasonInfo and C_SeasonInfo.GetCurrentDisplaySeasonExpansion) then
        error("客户端未提供 SeasonInfo API。")
    end
    local expId = C_SeasonInfo.GetCurrentDisplaySeasonExpansion()
    if not expId then error("无法识别当前赛季所属资料片。") end
    local tierId = type(GetEJTierDataTableID) == "function" and GetEJTierDataTableID(expId) or (expId + 1)
    EJ_SelectTier(tierId)
    local ids = {}
    local idx = 1
    while true do
        local raidId = EJ_GetInstanceByIndex(idx, true)
        if not raidId then break end
        ids[#ids + 1] = raidId
        idx = idx + 1
    end
    SortNumbers(ids)
    return ids, { ids = ids, expansionId = expId, tierId = tierId }
end

------------------------------------------------------------------------
-- 手册扫描（同时保存 journal link）
------------------------------------------------------------------------

local function ScanInstances(instanceIds, difficulty, isRaid)
    local results = {}
    local journalLinks = {}

    for _, instId in ipairs(instanceIds) do
        EJ_SelectInstance(instId)
        EJ_SetDifficulty(difficulty)
        ResetLootFilters()

        local instName = EJ_GetInstanceInfo()
        local instData = {
            id = instId,
            name = instName or ("Instance " .. instId),
            isRaid = isRaid,
            difficulty = difficulty,
            encounters = {},
        }

        local encIdx = 1
        while true do
            local encName, _, encId = EJ_GetEncounterInfoByIndex(encIdx, instId)
            if not encName then break end

            EJ_SelectEncounter(encId)
            local encData = { id = encId, name = encName, itemIds = {} }
            local seen = {}

            for _, cls in ipairs(ALL_CLASS_SPECS) do
                for _, specId in ipairs(cls.specs) do
                    EJ_SetLootFilter(cls.classId, specId)
                    local prim = SPEC_PRIMARY[specId] or "int"
                    for li = 1, EJ_GetNumLoot() do
                        local info = C_EncounterJournal.GetLootInfoByIndex(li)
                        if info and info.itemID then
                            if not seen[info.itemID] then
                                seen[info.itemID] = true
                                encData.itemIds[#encData.itemIds + 1] = info.itemID
                            end
                            -- 按主属性类型分别保存 link
                            if info.link then
                                if not journalLinks[info.itemID] then
                                    journalLinks[info.itemID] = {}
                                end
                                if not journalLinks[info.itemID][prim] then
                                    journalLinks[info.itemID][prim] = info.link
                                end
                            end
                        end
                    end
                end
            end

            SortNumbers(encData.itemIds)
            instData.encounters[#instData.encounters + 1] = encData
            encIdx = encIdx + 1
        end

        results[#results + 1] = instData
    end

    ResetLootFilters()
    return results, journalLinks
end

------------------------------------------------------------------------
-- 职业/专精可用性扫描
------------------------------------------------------------------------

local function ScanClassRestrictions(instances)
    local restrictions = {}
    for _, inst in ipairs(instances) do
        EJ_SelectInstance(inst.id)
        EJ_SetDifficulty(inst.difficulty)
        ResetLootFilters()
        for _, enc in ipairs(inst.encounters) do
            EJ_SelectEncounter(enc.id)
            for _, cls in ipairs(ALL_CLASS_SPECS) do
                for _, specId in ipairs(cls.specs) do
                    EJ_SetLootFilter(cls.classId, specId)
                    for li = 1, EJ_GetNumLoot() do
                        local info = C_EncounterJournal.GetLootInfoByIndex(li)
                        if info and info.itemID then
                            if not restrictions[info.itemID] then
                                restrictions[info.itemID] = {}
                            end
                            if not restrictions[info.itemID][cls.classId] then
                                restrictions[info.itemID][cls.classId] = {}
                            end
                            local specs = restrictions[info.itemID][cls.classId]
                            local dup = false
                            for _, s in ipairs(specs) do
                                if s == specId then dup = true break end
                            end
                            if not dup then specs[#specs + 1] = specId end
                        end
                    end
                end
            end
        end
    end
    for _, classMap in pairs(restrictions) do
        for _, specs in pairs(classMap) do SortNumbers(specs) end
    end
    ResetLootFilters()
    return restrictions
end

------------------------------------------------------------------------
-- 收集唯一物品 ID
------------------------------------------------------------------------

local function CollectItemIds(instances)
    local ids, seen = {}, {}
    for _, inst in ipairs(instances) do
        for _, enc in ipairs(inst.encounters) do
            for _, itemId in ipairs(enc.itemIds) do
                if not seen[itemId] then
                    seen[itemId] = true
                    ids[#ids + 1] = itemId
                end
            end
        end
    end
    SortNumbers(ids)
    return ids
end

------------------------------------------------------------------------
-- 构建物品详情（用 journal link 获取正确装等的属性）
------------------------------------------------------------------------

local PRIMARY_STAT_KEYS = {
    str = "ITEM_MOD_STRENGTH_SHORT",
    agi = "ITEM_MOD_AGILITY_SHORT",
    int = "ITEM_MOD_INTELLECT_SHORT",
}

local function GetItemStatsCompat(link)
    if type(GetItemStats) == "function" then
        return GetItemStats(link)
    elseif C_Item and type(C_Item.GetItemStats) == "function" then
        return C_Item.GetItemStats(link)
    end
    return nil
end

local function BuildItemDetails(itemIds, restrictions, journalLinks)
    local items = {}
    local skipped = 0
    local statsFromJournal = 0
    local statsFromBase = 0

    for _, itemId in ipairs(itemIds) do
        local name, baseLink, quality, baseIlvl, _, itemType, itemSubType,
              _, equipLoc, icon, _, classId, subclassId, bindType = GetItemInfo(itemId)

        if classId and not EQUIPPABLE_ITEM_CLASSES[classId] then
            skipped = skipped + 1
        else
            local jLinks = journalLinks[itemId] -- { str=link, agi=link, int=link }
            local anyLink = nil
            local finalIlvl = baseIlvl or 0

            -- 取任意一个 journal link 读装等和副属性
            if jLinks then
                anyLink = jLinks.str or jLinks.agi or jLinks.int
            end
            local statsLink = anyLink or baseLink

            if anyLink then
                local _, _, _, jIlvl = GetItemInfo(anyLink)
                if jIlvl and jIlvl > 0 then
                    finalIlvl = jIlvl
                end
                statsFromJournal = statsFromJournal + 1
            else
                statsFromBase = statsFromBase + 1
            end

            -- 用任意 link 读副属性（暴击、急速等，这些不随主属性变）
            local rawStats = nil
            if statsLink then
                rawStats = GetItemStatsCompat(statsLink)
            end

            local stats = {}
            if rawStats then
                for k, v in pairs(rawStats) do stats[k] = v end
            end

            -- 去掉 stats 里已有的主属性，改用 primaryStats 精确记录
            stats["ITEM_MOD_STRENGTH_SHORT"] = nil
            stats["ITEM_MOD_AGILITY_SHORT"] = nil
            stats["ITEM_MOD_INTELLECT_SHORT"] = nil

            -- 分别用 str/agi/int 的 link 检测该物品支持哪些主属性
            local primaryStats = {}
            if jLinks then
                for prim, primKey in pairs(PRIMARY_STAT_KEYS) do
                    local pLink = jLinks[prim]
                    if pLink then
                        local pStats = GetItemStatsCompat(pLink)
                        if pStats and pStats[primKey] and pStats[primKey] > 0 then
                            primaryStats[prim] = pStats[primKey]
                        end
                    end
                end
            else
                -- 没有 journal link，从 base stats 回退
                if rawStats then
                    for prim, primKey in pairs(PRIMARY_STAT_KEYS) do
                        if rawStats[primKey] and rawStats[primKey] > 0 then
                            primaryStats[prim] = rawStats[primKey]
                        end
                    end
                end
            end

            items[itemId] = {
                name = name or ("item:" .. itemId),
                quality = quality or 0,
                ilvl = finalIlvl,
                equipLoc = equipLoc or "",
                itemType = itemType or "",
                itemSubType = itemSubType or "",
                itemClassId = classId or 0,
                itemSubclassId = subclassId or 0,
                icon = icon or 0,
                bindType = bindType or 0,
                stats = stats,
                primaryStats = primaryStats,
                classes = restrictions[itemId] or {},
            }
        end
    end

    return items, skipped, statsFromJournal, statsFromBase
end

------------------------------------------------------------------------
-- 清理
------------------------------------------------------------------------

local function CleanupInstances(instances, validItems)
    local cleaned = {}
    for _, inst in ipairs(instances) do
        local cleanEncs = {}
        for _, enc in ipairs(inst.encounters) do
            local cleanIds = {}
            for _, itemId in ipairs(enc.itemIds) do
                if validItems[itemId] then
                    cleanIds[#cleanIds + 1] = itemId
                end
            end
            if #cleanIds > 0 then
                cleanEncs[#cleanEncs + 1] = { id = enc.id, name = enc.name, itemIds = cleanIds }
            end
        end
        if #cleanEncs > 0 then
            cleaned[#cleaned + 1] = {
                id = inst.id, name = inst.name, isRaid = inst.isRaid,
                difficulty = inst.difficulty, encounters = cleanEncs,
            }
        end
    end
    return cleaned
end

------------------------------------------------------------------------
-- Tooltip 抓取
------------------------------------------------------------------------

local function ScanTooltipLines(items, journalLinks)
    local useNew = C_TooltipInfo and type(C_TooltipInfo.GetHyperlink) == "function"
    local hiddenTip
    if not useNew then
        hiddenTip = CreateFrame("GameTooltip", "WoWLookExport2Tip", nil, "GameTooltipTemplate")
        hiddenTip:SetOwner(WorldFrame, "ANCHOR_NONE")
    end

    local count = 0
    for itemId, item in pairs(items) do
        local jLinks = journalLinks[itemId]
        local link = nil
        if jLinks then
            link = jLinks.str or jLinks.agi or jLinks.int
        end
        if not link then
            link = select(2, GetItemInfo(itemId))
        end
        if not link then
            item.tooltip = {}
        elseif useNew then
            local tipData = C_TooltipInfo.GetHyperlink(link)
            local lines = {}
            if tipData and tipData.lines then
                for i, line in ipairs(tipData.lines) do
                    if line.leftText and line.leftText ~= "" then
                        lines[#lines + 1] = line.leftText
                    end
                end
            end
            item.tooltip = lines
        else
            hiddenTip:ClearLines()
            hiddenTip:SetHyperlink(link)
            local lines = {}
            for i = 1, hiddenTip:NumLines() do
                local textObj = _G["WoWLookExport2TipTextLeft" .. i]
                if textObj then
                    local text = textObj:GetText()
                    if text and text ~= "" then
                        lines[#lines + 1] = text
                    end
                end
            end
            item.tooltip = lines
        end
        count = count + 1
    end
    return count
end

------------------------------------------------------------------------
-- 主导出流程
------------------------------------------------------------------------

local function BuildPayload()
    local dungeonIds, dungeonMeta = DetectDungeonIds()
    local raidIds, raidMeta = DetectRaidIds()
    if #dungeonIds == 0 then error("无法自动识别当前赛季大秘境副本。") end
    if #raidIds == 0 then error("无法自动识别当前资料片团本。") end

    Print(string.format("识别到 %d 个大秘境 + %d 个团本", #dungeonIds, #raidIds))
    if #dungeonMeta.unresolved > 0 then
        for _, u in ipairs(dungeonMeta.unresolved) do
            PrintWarn(string.format("未匹配 Journal 副本: %s (mapID=%s)", u.name, tostring(u.mapId)))
        end
    end

    Print("第 1/5 步: 扫描副本/Boss/物品...")
    local dungeonInst, dungeonLinks = ScanInstances(dungeonIds, DUNGEON_DIFFICULTY, false)
    local raidInst, raidLinks = ScanInstances(raidIds, RAID_DIFFICULTY, true)

    -- 合并 journal links
    local allLinks = {}
    for id, link in pairs(dungeonLinks) do allLinks[id] = link end
    for id, link in pairs(raidLinks) do allLinks[id] = link end

    local allInst = {}
    for _, v in ipairs(dungeonInst) do allInst[#allInst + 1] = v end
    for _, v in ipairs(raidInst) do allInst[#allInst + 1] = v end

    Print("第 2/5 步: 扫描职业/专精可用性...")
    local restrictions = ScanClassRestrictions(allInst)

    local allItemIds = CollectItemIds(allInst)
    Print(string.format("共发现 %d 件物品，开始预加载...", #allItemIds))
    for _, id in ipairs(allItemIds) do
        if C_Item and C_Item.RequestLoadItemDataByID then
            C_Item.RequestLoadItemDataByID(id)
        end
    end

    return allInst, allItemIds, restrictions, allLinks, dungeonMeta, raidMeta
end

local function FinalizeExport(instances, itemIds, restrictions, journalLinks, dungeonMeta, raidMeta)
    Print("第 4/5 步: 组装数据...")
    local items, skipped, fromJournal, fromBase = BuildItemDetails(itemIds, restrictions, journalLinks)

    if skipped > 0 then
        Print(string.format("过滤 %d 件非装备物品", skipped))
    end
    Print(string.format("属性来源: %d 件用手册 link (正确装等), %d 件用基础 link", fromJournal, fromBase))

    Print("第 5/5 步: 抓取 Tooltip 文本...")
    local tipCount = ScanTooltipLines(items, journalLinks)
    Print(string.format("已抓取 %d 件物品的 Tooltip", tipCount))

    local cleanInst = CleanupInstances(instances, items)

    local equipCount = 0
    for _ in pairs(items) do equipCount = equipCount + 1 end

    -- 抽样报告，方便验证
    local sampleCount = 0
    for itemId, item in pairs(items) do
        if sampleCount < 3 then
            local primList = {}
            for p, _ in pairs(item.primaryStats or {}) do primList[#primList + 1] = p end
            table.sort(primList)
            local tipLines = item.tooltip and #item.tooltip or 0
            Print(string.format("  样本: %s  ilvl=%d  主属性=[%s]  tooltip=%d行",
                item.name, item.ilvl, table.concat(primList, ","), tipLines))
            sampleCount = sampleCount + 1
        end
    end

    local payload = {
        exportTime = date("%Y-%m-%d %H:%M:%S"),
        build = select(1, GetBuildInfo()),
        buildNumber = select(4, GetBuildInfo()),
        locale = GetLocale(),
        addonVersion = WoWLookExport2DB.version,
        scope = {
            dungeonIds = dungeonMeta.ids,
            raidIds = raidMeta.ids,
            mapNames = dungeonMeta.mapNames,
            unresolved = dungeonMeta.unresolved or {},
            dungeonDifficulty = DUNGEON_DIFFICULTY,
            raidDifficulty = RAID_DIFFICULTY,
        },
        instances = cleanInst,
        items = items,
    }

    WoWLookExport2DB.payload = jsonEncode(payload)
    WoWLookExport2DB.summary = {
        exportedAt = payload.exportTime,
        locale = payload.locale,
        build = payload.build,
        instanceCount = #cleanInst,
        equipmentCount = equipCount,
        filteredCount = skipped,
        journalLinkCount = fromJournal,
        baseLinkCount = fromBase,
    }
    WoWLookExport2DB.lastError = nil

    Print("================================")
    Print(string.format("导出完成！副本: %d, 装备: %d, 过滤: %d", #cleanInst, equipCount, skipped))
    for _, inst in ipairs(cleanInst) do
        local ic = 0
        for _, enc in ipairs(inst.encounters) do ic = ic + #enc.itemIds end
        Print(string.format("  %s (diff=%d): %d Boss, %d 件", inst.name, inst.difficulty, #inst.encounters, ic))
    end
    Print("请输入 /reload 保存到本地")
    Print("================================")
end

local function DoExport()
    if not EnsureEJLoaded() then
        PrintWarn("无法加载冒险指南 API。")
        return
    end

    Print("开始导出 (v2.2)...")
    local ok, instances, itemIds, restrictions, journalLinks, dMeta, rMeta = pcall(BuildPayload)
    if not ok then
        WoWLookExport2DB.lastError = instances
        PrintWarn("识别失败: " .. tostring(instances))
        return
    end

    Print("第 3/5 步: 等待物品数据加载...")
    local retries = 0
    local ticker
    ticker = C_Timer.NewTicker(0.5, function()
        local uncached = 0
        for _, id in ipairs(itemIds) do
            if not GetItemInfo(id) then
                uncached = uncached + 1
                if C_Item and C_Item.RequestLoadItemDataByID then
                    C_Item.RequestLoadItemDataByID(id)
                end
            end
        end
        retries = retries + 1

        if uncached == 0 or retries >= 30 then
            ticker:Cancel()
            if uncached > 0 then
                PrintWarn(string.format("仍有 %d 件物品未加载", uncached))
            end
            local fOk, fErr = pcall(FinalizeExport, instances, itemIds, restrictions, journalLinks, dMeta, rMeta)
            if not fOk then
                WoWLookExport2DB.lastError = fErr
                PrintWarn("导出失败: " .. tostring(fErr))
            end
        elseif retries == 1 or retries % 4 == 0 then
            Print(string.format("加载中... %d/%d", #itemIds - uncached, #itemIds))
        end
    end)
end

------------------------------------------------------------------------
-- 命令
------------------------------------------------------------------------

SLASH_WOWLOOKEXPORT21 = "/wowlook2"
SlashCmdList.WOWLOOKEXPORT2 = function(msg)
    local cmd = strlower(strtrim(msg or ""))
    if cmd == "" or cmd == "export" then
        DoExport()
    elseif cmd == "status" then
        if WoWLookExport2DB.lastError then
            PrintWarn("最近错误: " .. tostring(WoWLookExport2DB.lastError))
        end
        local s = WoWLookExport2DB.summary
        if s then
            Print(string.format("导出: %s | 副本: %d | 装备: %d | 手册link: %d | 基础link: %d",
                s.exportedAt or "?", s.instanceCount or 0, s.equipmentCount or 0,
                s.journalLinkCount or 0, s.baseLinkCount or 0))
        else
            Print("暂无导出记录。")
        end
    elseif cmd == "reset" then
        WoWLookExport2DB.payload = ""
        WoWLookExport2DB.summary = nil
        WoWLookExport2DB.lastError = nil
        Print("已清空。/reload 后生效。")
    else
        Print("/wowlook2 export  开始导出")
        Print("/wowlook2 status  查看状态")
        Print("/wowlook2 reset   清空缓存")
    end
end

Print("v2.2 已加载。输入 /wowlook2 开始导出。")
