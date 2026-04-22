local ADDON_NAME = ...

WoWLookExportDB = WoWLookExportDB or {
    version = "1.2.0",
    payload = "",
    summary = nil,
    inspect = nil,
}

local DUNGEON_DIFFICULTY = (DifficultyUtil and DifficultyUtil.ID and DifficultyUtil.ID.DungeonChallenge) or 23
local RAID_DIFFICULTY = (DifficultyUtil and DifficultyUtil.ID and DifficultyUtil.ID.PrimaryRaidNormal) or 14
local NO_SLOT_FILTER = (Enum and Enum.ItemSlotFilterType and Enum.ItemSlotFilterType.NoFilter) or 0

local ALL_CLASS_SPECS = {
    { classId = 1, specs = {71, 72, 73} },
    { classId = 2, specs = {65, 66, 70} },
    { classId = 3, specs = {253, 254, 255} },
    { classId = 4, specs = {259, 260, 261} },
    { classId = 5, specs = {256, 257, 258} },
    { classId = 6, specs = {250, 251, 252} },
    { classId = 7, specs = {262, 263, 264} },
    { classId = 8, specs = {62, 63, 64} },
    { classId = 9, specs = {265, 266, 267} },
    { classId = 10, specs = {268, 269, 270} },
    { classId = 11, specs = {102, 103, 104, 105} },
    { classId = 12, specs = {577, 581, 1480} },
    { classId = 13, specs = {1467, 1468, 1473} },
}

local function Print(message)
    print(string.format("|cff00ff00[WoWLookExport]|r %s", message))
end

local function SortNumericArray(values)
    table.sort(values, function(left, right)
        return left < right
    end)
end

local function NormalizeName(value)
    if not value then
        return ""
    end

    local normalized = tostring(value):lower()
    normalized = normalized:gsub("[%s%p%c]+", "")
    return normalized
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
        C_EncounterJournal.SetSlotFilter(NO_SLOT_FILTER)
    end
end

local function ExtractItemIdFromLink(itemLink)
    if not itemLink then
        return nil
    end

    local itemId = string.match(itemLink, "item:(%d+)")
    return itemId and tonumber(itemId) or nil
end

local function GetActiveItemTooltip()
    local candidateNames = {
        "EncounterJournalTooltip",
        "GameTooltip",
        "EmbeddedItemTooltip",
        "ItemRefTooltip",
        "ShoppingTooltip1",
        "ShoppingTooltip2",
    }

    for _, tooltipName in ipairs(candidateNames) do
        local tooltip = _G[tooltipName]
        if tooltip and tooltip.IsShown and tooltip:IsShown() and tooltip.GetItem then
            local itemName, itemLink = tooltip:GetItem()
            if itemLink then
                return tooltip, itemName, itemLink
            end
        end
    end

    return nil
end

local function CollectTooltipLines(tooltip)
    local lines = {}
    if not tooltip or not tooltip.GetName then
        return lines
    end

    local tooltipName = tooltip:GetName()
    if not tooltipName or tooltipName == "" then
        return lines
    end

    local lineCount = tooltip.NumLines and tooltip:NumLines() or 0
    for lineIndex = 1, lineCount do
        local leftRegion = _G[string.format("%sTextLeft%d", tooltipName, lineIndex)]
        local rightRegion = _G[string.format("%sTextRight%d", tooltipName, lineIndex)]
        local leftText = leftRegion and leftRegion.GetText and leftRegion:GetText() or nil
        local rightText = rightRegion and rightRegion.GetText and rightRegion:GetText() or nil

        if leftText or rightText then
            local lineText
            if leftText and rightText and rightText ~= "" then
                lineText = string.format("%s    %s", leftText, rightText)
            else
                lineText = leftText or rightText
            end

            if lineText and strtrim(lineText) ~= "" then
                lines[#lines + 1] = lineText
            end
        end
    end

    return lines
end

local function GetEncounterJournalContext()
    local context = {
        difficultyId = type(EJ_GetDifficulty) == "function" and EJ_GetDifficulty() or nil,
    }

    if type(EJ_GetInstanceInfo) == "function" then
        local instanceName = EJ_GetInstanceInfo()
        if instanceName then
            context.instanceName = instanceName
        end
    end

    local encounterJournal = _G.EncounterJournal
    if encounterJournal then
        if encounterJournal.instanceID then
            context.instanceId = encounterJournal.instanceID
        end

        local encounterPanel = encounterJournal.encounter
        if encounterPanel then
            if encounterPanel.encounterID then
                context.encounterId = encounterPanel.encounterID
            end

            if type(encounterPanel.info) == "table" then
                context.encounterId = encounterPanel.info.encounterID or encounterPanel.info.id or context.encounterId
                context.encounterName = encounterPanel.info.name or context.encounterName
                context.instanceId = encounterPanel.info.instanceID or context.instanceId
            end
        end
    end

    return context
end

local function InspectCurrentTooltip()
    local tooltip, itemName, itemLink = GetActiveItemTooltip()
    if not tooltip then
        Print("未检测到当前可读取的物品 tooltip。请先在冒险指南里把鼠标悬停到目标装备上。")
        return
    end

    local itemId = ExtractItemIdFromLink(itemLink)
    if not itemId then
        Print("当前 tooltip 不是可解析的物品链接。")
        return
    end

    local tooltipLines = CollectTooltipLines(tooltip)
    if #tooltipLines == 0 then
        Print("当前 tooltip 没有可读取的文本行。请保持鼠标悬停在装备上后重试。")
        return
    end

    local owner = tooltip.GetOwner and tooltip:GetOwner() or nil
    local context = GetEncounterJournalContext()

    WoWLookExportDB.inspect = {
        capturedAt = date("%Y-%m-%d %H:%M:%S"),
        source = "EncounterJournal",
        itemId = itemId,
        itemLink = itemLink,
        itemName = itemName,
        tooltipName = tooltip.GetName and tooltip:GetName() or nil,
        ownerName = owner and owner.GetName and owner:GetName() or nil,
        instanceId = context.instanceId,
        instanceName = context.instanceName,
        encounterId = context.encounterId,
        encounterName = context.encounterName,
        difficultyId = context.difficultyId,
        tooltipLines = tooltipLines,
    }

    Print(string.format("inspect 已捕获: %s (%s)", itemName or ("item:" .. itemId), tostring(itemId)))
    Print(string.format("tooltip 行数: %d。请输入 /reload 将结果写入 SavedVariables。", #tooltipLines))
end

local function EnsureEncounterJournalLoaded()
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

local function jsonEscape(text)
    return tostring(text)
        :gsub("\\", "\\\\")
        :gsub("\"", "\\\"")
        :gsub("\n", "\\n")
        :gsub("\r", "\\r")
        :gsub("\t", "\\t")
end

local function isSequentialArray(value)
    local length = #value
    if length == 0 then
        for _ in pairs(value) do
            return false
        end
        return true
    end

    local count = 0
    for _ in pairs(value) do
        count = count + 1
    end
    return count == length
end

local function jsonEncode(value)
    local valueType = type(value)
    if value == nil then
        return "null"
    elseif valueType == "boolean" then
        return value and "true" or "false"
    elseif valueType == "number" then
        if value ~= value or value == math.huge or value == -math.huge then
            return "null"
        end
        return tostring(value)
    elseif valueType == "string" then
        return "\"" .. jsonEscape(value) .. "\""
    elseif valueType == "table" then
        local parts = {}
        if isSequentialArray(value) then
            for index = 1, #value do
                parts[index] = jsonEncode(value[index])
            end
            return "[" .. table.concat(parts, ",") .. "]"
        end

        for key, itemValue in pairs(value) do
            parts[#parts + 1] = "\"" .. jsonEscape(key) .. "\":" .. jsonEncode(itemValue)
        end
        table.sort(parts)
        return "{" .. table.concat(parts, ",") .. "}"
    end

    return "null"
end

local function ScanInstances(instanceIds, difficulty, isRaid)
    local instances = {}

    for _, instanceId in ipairs(instanceIds) do
        EJ_SelectInstance(instanceId)
        EJ_SetDifficulty(difficulty)
        ResetLootFilters()

        local instanceName = EJ_GetInstanceInfo()
        local instanceData = {
            id = instanceId,
            name = instanceName or ("Instance " .. instanceId),
            isRaid = isRaid,
            difficulty = difficulty,
            encounters = {},
        }

        local encounterIndex = 1
        while true do
            local encounterName, _, encounterId = EJ_GetEncounterInfoByIndex(encounterIndex, instanceId)
            if not encounterName then
                break
            end

            EJ_SelectEncounter(encounterId)
            local encounterData = {
                id = encounterId,
                name = encounterName,
                itemIds = {},
            }

            local seen = {}
            for _, classInfo in ipairs(ALL_CLASS_SPECS) do
                for _, specId in ipairs(classInfo.specs) do
                    EJ_SetLootFilter(classInfo.classId, specId)

                    for lootIndex = 1, EJ_GetNumLoot() do
                        local itemInfo = C_EncounterJournal.GetLootInfoByIndex(lootIndex)
                        if itemInfo and itemInfo.itemID and not seen[itemInfo.itemID] then
                            seen[itemInfo.itemID] = true
                            encounterData.itemIds[#encounterData.itemIds + 1] = itemInfo.itemID
                        end
                    end
                end
            end

            SortNumericArray(encounterData.itemIds)
            instanceData.encounters[#instanceData.encounters + 1] = encounterData
            encounterIndex = encounterIndex + 1
        end

        instances[#instances + 1] = instanceData
    end

    ResetLootFilters()
    return instances
end

local function ScanClassRestrictions(instances)
    local restrictions = {}

    for _, instance in ipairs(instances) do
        EJ_SelectInstance(instance.id)
        EJ_SetDifficulty(instance.difficulty)
        ResetLootFilters()

        for _, encounter in ipairs(instance.encounters) do
            EJ_SelectEncounter(encounter.id)

            for _, classInfo in ipairs(ALL_CLASS_SPECS) do
                for _, specId in ipairs(classInfo.specs) do
                    EJ_SetLootFilter(classInfo.classId, specId)

                    for lootIndex = 1, EJ_GetNumLoot() do
                        local itemInfo = C_EncounterJournal.GetLootInfoByIndex(lootIndex)
                        if itemInfo and itemInfo.itemID then
                            if not restrictions[itemInfo.itemID] then
                                restrictions[itemInfo.itemID] = {}
                            end
                            if not restrictions[itemInfo.itemID][classInfo.classId] then
                                restrictions[itemInfo.itemID][classInfo.classId] = {}
                            end

                            local specs = restrictions[itemInfo.itemID][classInfo.classId]
                            local found = false
                            for _, existingSpecId in ipairs(specs) do
                                if existingSpecId == specId then
                                    found = true
                                    break
                                end
                            end

                            if not found then
                                specs[#specs + 1] = specId
                            end
                        end
                    end
                end
            end
        end
    end

    for _, classMap in pairs(restrictions) do
        for _, specs in pairs(classMap) do
            SortNumericArray(specs)
        end
    end

    ResetLootFilters()
    return restrictions
end

local function CollectAllItemIds(instances)
    local itemIds = {}
    local seen = {}

    for _, instance in ipairs(instances) do
        for _, encounter in ipairs(instance.encounters) do
            for _, itemId in ipairs(encounter.itemIds) do
                if not seen[itemId] then
                    seen[itemId] = true
                    itemIds[#itemIds + 1] = itemId
                end
            end
        end
    end

    SortNumericArray(itemIds)
    return itemIds
end

local function BuildJournalDungeonIndex()
    local byName = {}
    local maxTier = type(EJ_GetNumTiers) == "function" and EJ_GetNumTiers() or 0

    for tierIndex = 1, maxTier do
        EJ_SelectTier(tierIndex)
        local instanceIndex = 1
        while true do
            local instanceId = EJ_GetInstanceByIndex(instanceIndex, false)
            if not instanceId then
                break
            end

            EJ_SelectInstance(instanceId)
            local instanceName = EJ_GetInstanceInfo()
            local key = NormalizeName(instanceName)
            if key ~= "" and not byName[key] then
                byName[key] = {
                    id = instanceId,
                    name = instanceName,
                    tierId = tierIndex,
                }
            end

            instanceIndex = instanceIndex + 1
        end
    end

    return byName
end

local function DetectCurrentSeasonDungeonIds()
    if not (C_ChallengeMode and C_ChallengeMode.GetMapTable and C_ChallengeMode.GetMapUIInfo) then
        error("客户端未提供 ChallengeMode API。")
    end

    local challengeMapIds = C_ChallengeMode.GetMapTable() or {}
    local challengeMapNames = {}
    local unresolved = {}
    local detectedIds = {}
    local seen = {}
    local journalIndex = BuildJournalDungeonIndex()

    for _, challengeMapId in ipairs(challengeMapIds) do
        local mapName = C_ChallengeMode.GetMapUIInfo(challengeMapId)
        if mapName then
            challengeMapNames[#challengeMapNames + 1] = mapName
            local match = journalIndex[NormalizeName(mapName)]
            if match then
                if not seen[match.id] then
                    seen[match.id] = true
                    detectedIds[#detectedIds + 1] = match.id
                end
            else
                unresolved[#unresolved + 1] = {
                    challengeMapId = challengeMapId,
                    name = mapName,
                }
            end
        end
    end

    SortNumericArray(detectedIds)
    return detectedIds, {
        ids = detectedIds,
        challengeMapIds = challengeMapIds,
        challengeMapNames = challengeMapNames,
        unresolved = unresolved,
    }
end

local function DetectCurrentExpansionRaidIds()
    if not (C_SeasonInfo and C_SeasonInfo.GetCurrentDisplaySeasonExpansion) then
        error("客户端未提供 SeasonInfo API。")
    end

    local expansionId = C_SeasonInfo.GetCurrentDisplaySeasonExpansion()
    if not expansionId then
        error("无法识别当前赛季所属资料片。")
    end

    local tierId
    if type(GetEJTierDataTableID) == "function" then
        tierId = GetEJTierDataTableID(expansionId)
    else
        tierId = expansionId + 1
    end

    EJ_SelectTier(tierId)
    local raidIds = {}
    local instanceIndex = 1
    while true do
        local raidId = EJ_GetInstanceByIndex(instanceIndex, true)
        if not raidId then
            break
        end
        raidIds[#raidIds + 1] = raidId
        instanceIndex = instanceIndex + 1
    end

    SortNumericArray(raidIds)
    return raidIds, {
        ids = raidIds,
        expansionId = expansionId,
        tierId = tierId,
    }
end

local function BuildItemDetails(itemIds, restrictions)
    local items = {}

    for _, itemId in ipairs(itemIds) do
        local itemName, itemLink, itemQuality, itemLevel, _, itemType, itemSubType, _, equipLoc, icon, _, classId, subclassId, bindType =
            GetItemInfo(itemId)

        local rawStats = nil
        if itemLink then
            if type(GetItemStats) == "function" then
                rawStats = GetItemStats(itemLink)
            elseif C_Item and type(C_Item.GetItemStats) == "function" then
                rawStats = C_Item.GetItemStats(itemLink)
            end
        end
        local stats = {}
        if rawStats then
            for statKey, statValue in pairs(rawStats) do
                stats[statKey] = statValue
            end
        end

        items[itemId] = {
            name = itemName or ("item:" .. itemId),
            quality = itemQuality or 0,
            ilvl = itemLevel or 0,
            equipLoc = equipLoc or "",
            itemType = itemType or "",
            itemSubType = itemSubType or "",
            itemClassId = classId or 0,
            itemSubclassId = subclassId or 0,
            icon = icon or 0,
            bindType = bindType or 0,
            stats = stats,
            classes = restrictions[itemId] or {},
        }
    end

    return items
end

local function BuildExportPayload()
    local dungeonIds, dungeonMeta = DetectCurrentSeasonDungeonIds()
    local raidIds, raidMeta = DetectCurrentExpansionRaidIds()

    if #dungeonIds == 0 then
        error("无法自动识别当前赛季大秘境副本。")
    end

    if #raidIds == 0 then
        error("无法自动识别当前资料片团本。")
    end

    Print(string.format("自动识别到 %d 个大秘境副本，%d 个团本。", #dungeonIds, #raidIds))
    if #dungeonMeta.unresolved > 0 then
        for _, unresolvedEntry in ipairs(dungeonMeta.unresolved) do
            Print(string.format("未匹配到 Journal 副本: %s (mapID=%s)", unresolvedEntry.name, tostring(unresolvedEntry.challengeMapId)))
        end
    end

    local dungeonInstances = ScanInstances(dungeonIds, DUNGEON_DIFFICULTY, false)
    local raidInstances = ScanInstances(raidIds, RAID_DIFFICULTY, true)

    local allInstances = {}
    for _, instance in ipairs(dungeonInstances) do
        allInstances[#allInstances + 1] = instance
    end
    for _, instance in ipairs(raidInstances) do
        allInstances[#allInstances + 1] = instance
    end

    Print("第 2/4 步: 扫描职业/专精可用性...")
    local restrictions = ScanClassRestrictions(allInstances)

    local allItemIds = CollectAllItemIds(allInstances)
    Print(string.format("共发现 %d 件物品，开始预加载...", #allItemIds))
    for _, itemId in ipairs(allItemIds) do
        if C_Item and C_Item.RequestLoadItemDataByID then
            C_Item.RequestLoadItemDataByID(itemId)
        end
    end

    return allInstances, allItemIds, restrictions, dungeonMeta, raidMeta
end

local function FinalizeExport(instances, itemIds, restrictions, dungeonMeta, raidMeta)
    local items = BuildItemDetails(itemIds, restrictions)
    local itemCount = 0
    for _ in pairs(items) do
        itemCount = itemCount + 1
    end

    local payload = {
        exportTime = date("%Y-%m-%d %H:%M:%S"),
        build = select(1, GetBuildInfo()),
        buildNumber = select(4, GetBuildInfo()),
        locale = GetLocale(),
        addonVersion = WoWLookExportDB.version or "1.1.0",
        scope = {
            detectionMode = "auto",
            dungeonIds = dungeonMeta.ids,
            raidIds = raidMeta.ids,
            challengeMapIds = dungeonMeta.challengeMapIds,
            challengeMapNames = dungeonMeta.challengeMapNames,
            unresolvedChallengeMaps = dungeonMeta.unresolved or {},
            expansionId = raidMeta.expansionId,
            expansionTierId = raidMeta.tierId,
            dungeonDifficulty = DUNGEON_DIFFICULTY,
            raidDifficulty = RAID_DIFFICULTY,
        },
        instances = instances,
        items = items,
    }

    WoWLookExportDB.payload = jsonEncode(payload)
    WoWLookExportDB.summary = {
        exportedAt = payload.exportTime,
        locale = payload.locale,
        build = payload.build,
        buildNumber = payload.buildNumber,
        instanceCount = #instances,
        itemCount = itemCount,
    }
    WoWLookExportDB.lastError = nil

    Print("================")
    Print(string.format("导出完成。副本: %d，物品: %d", #instances, itemCount))
    Print("请输入 /reload 将导出结果写入 SavedVariables")
    Print("================")
end

local function DoExport()
    if not EnsureEncounterJournalLoaded() then
        Print("无法加载冒险指南 API，请确认当前客户端支持 Encounter Journal。")
        return
    end

    Print("第 1/4 步: 自动识别当前赛季副本范围...")
    local ok, instances, itemIds, restrictions, dungeonMeta, raidMeta = pcall(BuildExportPayload)
    if not ok then
        WoWLookExportDB.lastError = instances
        Print(string.format("自动识别失败: %s", tostring(instances)))
        return
    end

    Print("第 3/4 步: 等待物品数据加载...")
    local retries = 0
    local ticker
    ticker = C_Timer.NewTicker(0.5, function()
        local uncached = 0
        for _, itemId in ipairs(itemIds) do
            if not GetItemInfo(itemId) then
                uncached = uncached + 1
                if C_Item and C_Item.RequestLoadItemDataByID then
                    C_Item.RequestLoadItemDataByID(itemId)
                end
            end
        end
        retries = retries + 1

        if uncached == 0 or retries >= 30 then
            ticker:Cancel()

            if uncached > 0 then
                Print(string.format("警告: 仍有 %d 件物品未加载完成，将使用占位字段导出。", uncached))
            end

            Print("第 4/4 步: 组装导出数据...")
            local finalizeOk, finalizeError = pcall(FinalizeExport, instances, itemIds, restrictions, dungeonMeta, raidMeta)
            if not finalizeOk then
                WoWLookExportDB.lastError = finalizeError
                Print(string.format("导出失败: %s", tostring(finalizeError)))
                Print("可输入 /wowlook status 查看最近错误。")
            end
        elseif retries == 1 or retries % 4 == 0 then
            Print(string.format("加载中... %d/%d，剩余 %d", #itemIds - uncached, #itemIds, uncached))
        end
    end)
end

local function PrintStatus()
    if WoWLookExportDB.lastError then
        Print(string.format("最近一次导出失败: %s", tostring(WoWLookExportDB.lastError)))
    end

    if not WoWLookExportDB.summary then
        Print("当前没有导出记录。输入 /wowlook export 开始导出。")
        return
    end

    local summary = WoWLookExportDB.summary
    Print(string.format(
        "最近导出: %s | 语言: %s | 构建: %s (%s) | 副本: %d | 物品: %d",
        summary.exportedAt or "未知",
        summary.locale or "未知",
        summary.build or "未知",
        tostring(summary.buildNumber or "未知"),
        summary.instanceCount or 0,
        summary.itemCount or 0
    ))

    if WoWLookExportDB.inspect then
        local inspect = WoWLookExportDB.inspect
        Print(string.format(
            "最近 inspect: %s | itemId: %s | 副本: %s | Boss: %s | 行数: %d",
            inspect.capturedAt or "未知",
            tostring(inspect.itemId or "未知"),
            inspect.instanceName or "未知",
            inspect.encounterName or "未知",
            inspect.tooltipLines and #inspect.tooltipLines or 0
        ))
    end
end

local function ResetExport()
    WoWLookExportDB.payload = ""
    WoWLookExportDB.summary = nil
    WoWLookExportDB.lastError = nil
    WoWLookExportDB.inspect = nil
    Print("已清空导出缓存。输入 /reload 后 SavedVariables 文件会同步清空。")
end

SLASH_WOWLOOKEXPORT1 = "/wowlook"
SlashCmdList.WOWLOOKEXPORT = function(message)
    local command = strlower(strtrim(message or ""))

    if command == "" or command == "export" then
        DoExport()
    elseif command == "inspect" then
        InspectCurrentTooltip()
    elseif command == "status" then
        PrintStatus()
    elseif command == "reset" then
        ResetExport()
    else
        Print("用法:")
        Print("/wowlook export  开始导出")
        Print("/wowlook inspect 当前悬停装备 tooltip 抓取")
        Print("/wowlook status  查看最近一次导出概要")
        Print("/wowlook reset   清空导出缓存")
    end
end

Print("已加载。输入 /wowlook export 开始导出，或 /wowlook inspect 抓取当前装备 tooltip。")
