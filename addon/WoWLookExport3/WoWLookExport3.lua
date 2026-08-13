local ADDON_NAME = ...
local ADDON_VERSION = "4.0.0-s2-preflight"

WoWLookExport3DB = WoWLookExport3DB or {
    version = ADDON_VERSION,
    payload = "",
    summary = nil,
    lastError = nil,
}
WoWLookExport3DB.version = ADDON_VERSION

local DUNGEON_DIFFICULTY = 23
local HEROIC_RAID_DIFFICULTY = 15

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

local STAT_LABELS = {
    ["力量"] = "strength",
    ["敏捷"] = "agility",
    ["智力"] = "intellect",
    ["耐力"] = "stamina",
    ["爆击"] = "crit",
    ["暴击"] = "crit",
    ["急速"] = "haste",
    ["精通"] = "mastery",
    ["全能"] = "versatility",
}

local STAT_NAMES = {
    strength = "力量",
    agility = "敏捷",
    intellect = "智力",
    stamina = "耐力",
    crit = "暴击",
    haste = "急速",
    mastery = "精通",
    versatility = "全能",
}

local PRIMARY_STAT_KEYS = {
    strength = true,
    agility = true,
    intellect = true,
}

local SECONDARY_STAT_KEYS = {
    crit = true,
    haste = true,
    mastery = true,
    versatility = true,
}

local STAT_SORT_ORDER = {
    strength = 1,
    agility = 2,
    intellect = 3,
    stamina = 4,
    crit = 5,
    haste = 6,
    mastery = 7,
    versatility = 8,
}

local SLOT_TEXTS = {
    ["头部"] = true,
    ["肩部"] = true,
    ["胸部"] = true,
    ["腕部"] = true,
    ["手部"] = true,
    ["腰部"] = true,
    ["腿部"] = true,
    ["脚部"] = true,
    ["背部"] = true,
    ["颈部"] = true,
    ["手指"] = true,
    ["饰品"] = true,
    ["副手物品"] = true,
    ["双手"] = true,
    ["单手"] = true,
    ["主手"] = true,
    ["远程"] = true,
}

local function Print(msg)
    print(string.format("|cff00ff00[WoWLookExport3]|r %s", msg))
end

local function PrintWarn(msg)
    print(string.format("|cffff6600[WoWLookExport3]|r %s", msg))
end

local function GetClientBuildInfo()
    local buildVersion, rawBuildNumber = GetBuildInfo()
    return buildVersion, tonumber(rawBuildNumber) or 0
end

local function NormalizeName(s)
    if not s then
        return ""
    end
    return tostring(s):lower():gsub("[%s%p%c]+", "")
end

local function SortNumbers(t)
    table.sort(t, function(a, b) return a < b end)
end

local CollectItemIds

local function AppendUniqueNumber(t, value)
    for _, existing in ipairs(t) do
        if existing == value then
            return
        end
    end
    t[#t + 1] = value
end

local function IsBlank(text)
    return text == nil or text == ""
end

local function EnsureEJLoaded()
    if EncounterJournal_LoadUI then
        pcall(EncounterJournal_LoadUI)
    end
    if C_AddOns and C_AddOns.IsAddOnLoaded and not C_AddOns.IsAddOnLoaded("Blizzard_EncounterJournal") then
        pcall(C_AddOns.LoadAddOn, "Blizzard_EncounterJournal")
    elseif IsAddOnLoaded and not IsAddOnLoaded("Blizzard_EncounterJournal") and UIParentLoadAddOn then
        pcall(UIParentLoadAddOn, "Blizzard_EncounterJournal")
    end

    return type(EJ_SelectTier) == "function"
        and type(EJ_GetNumTiers) == "function"
        and type(EJ_GetInstanceByIndex) == "function"
        and type(EJ_SelectInstance) == "function"
        and type(EJ_SetDifficulty) == "function"
        and type(EJ_GetEncounterInfoByIndex) == "function"
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

local function SafeSetDifficulty(difficultyId)
    EJ_SetDifficulty(difficultyId)
    if type(EJ_GetDifficulty) == "function" then
        return EJ_GetDifficulty() == difficultyId
    end
    return true
end

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
        for _ in pairs(t) do
            return false
        end
        return true
    end
    local count = 0
    for _ in pairs(t) do
        count = count + 1
    end
    return count == n
end

local function jsonEncode(val)
    if val == nil then
        return "null"
    end
    local vt = type(val)
    if vt == "boolean" then
        return val and "true" or "false"
    end
    if vt == "number" then
        if val ~= val or val == math.huge or val == -math.huge then
            return "null"
        end
        return tostring(val)
    end
    if vt == "string" then
        return "\"" .. jsonEscape(val) .. "\""
    end
    if vt == "table" then
        local parts = {}
        if isSeqArray(val) then
            for i = 1, #val do
                parts[i] = jsonEncode(val[i])
            end
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

local function BuildJournalIndex()
    local byName = {}
    local maxTier = EJ_GetNumTiers() or 0
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
            if key ~= "" then
                byName[key] = {
                    id = instanceId,
                    name = instanceName,
                    tierIndex = tierIndex,
                }
            end
            instanceIndex = instanceIndex + 1
        end
    end
    return byName
end

local function DetectConfiguredPreflightDungeons(config, journalIndex)
    local detected = {}
    local unresolved = {}
    local seen = {}
    for order, expectedName in ipairs(config.preflightDungeonNames or {}) do
        local match = journalIndex[NormalizeName(expectedName)]
        if match and not seen[match.id] then
            seen[match.id] = true
            detected[#detected + 1] = {
                id = match.id,
                name = match.name,
                mapId = nil,
                order = order,
                isRaid = false,
                difficulty = DUNGEON_DIFFICULTY,
                discoverySource = "configured_preflight_journal",
            }
        else
            unresolved[#unresolved + 1] = {
                name = expectedName,
                reason = "adventure_guide_instance_not_found",
            }
        end
    end
    return detected, unresolved
end

local function DetectSeasonDungeons(config)
    if not (C_ChallengeMode and C_ChallengeMode.GetMapTable and C_ChallengeMode.GetMapUIInfo) then
        error("客户端未提供 ChallengeMode API。")
    end

    local detected = {}
    local unresolved = {}
    local seen = {}
    local journalIndex = BuildJournalIndex()
    local mapIds = C_ChallengeMode.GetMapTable() or {}

    for order, mapId in ipairs(mapIds) do
        local mapName = C_ChallengeMode.GetMapUIInfo(mapId)
        local match = mapName and journalIndex[NormalizeName(mapName)] or nil
        if match and not seen[match.id] then
            seen[match.id] = true
            detected[#detected + 1] = {
                id = match.id,
                name = match.name,
                mapId = mapId,
                order = order,
                isRaid = false,
                difficulty = DUNGEON_DIFFICULTY,
            }
        else
            unresolved[#unresolved + 1] = {
                mapId = mapId,
                name = mapName or ("map:" .. tostring(mapId)),
            }
        end
    end

    if #detected > 0 then
        return detected, unresolved, "challenge_mode"
    end

    local fallbackDetected, fallbackUnresolved = DetectConfiguredPreflightDungeons(config or {}, journalIndex)
    if #fallbackDetected > 0 then
        return fallbackDetected, fallbackUnresolved, "configured_preflight_journal"
    end
    return detected, unresolved, "challenge_mode_empty"
end

local function CountLootForInstance(instanceId, difficultyId)
    EJ_SelectInstance(instanceId)
    if not SafeSetDifficulty(difficultyId) then
        return 0
    end
    ResetLootFilters()

    local totalLoot = 0
    local encounterIndex = 1
    while true do
        local _, _, encounterId = EJ_GetEncounterInfoByIndex(encounterIndex, instanceId)
        if not encounterId then
            break
        end
        EJ_SelectEncounter(encounterId)
        totalLoot = totalLoot + (EJ_GetNumLoot() or 0)
        encounterIndex = encounterIndex + 1
    end

    return totalLoot
end

local function IsConfiguredPreflightRaid(config, raidId)
    if config.releaseStatus == "finalized" then
        return true
    end
    for _, expectedId in ipairs(config.preflightRaidInstanceIds or {}) do
        if raidId == expectedId then
            return true
        end
    end
    return false
end

local function DetectSeasonRaids(config)
    if not (C_SeasonInfo and C_SeasonInfo.GetCurrentDisplaySeasonExpansion) then
        error("客户端未提供 SeasonInfo API。")
    end

    local expansionId = C_SeasonInfo.GetCurrentDisplaySeasonExpansion()
    if not expansionId then
        error("无法识别当前赛季所属资料片。")
    end

    local tierId = type(GetEJTierDataTableID) == "function" and GetEJTierDataTableID(expansionId) or (expansionId + 1)
    EJ_SelectTier(tierId)

    local detected = {}
    local skipped = {}
    local instanceIndex = 1
    while true do
        local raidId = EJ_GetInstanceByIndex(instanceIndex, true)
        if not raidId then
            break
        end

        EJ_SelectInstance(raidId)
        local raidName = EJ_GetInstanceInfo() or ("Raid " .. tostring(raidId))
        local hasHeroicDifficulty = SafeSetDifficulty(HEROIC_RAID_DIFFICULTY)
        local lootCount = hasHeroicDifficulty and CountLootForInstance(raidId, HEROIC_RAID_DIFFICULTY) or 0

        if hasHeroicDifficulty and lootCount > 0 and IsConfiguredPreflightRaid(config or {}, raidId) then
            detected[#detected + 1] = {
                id = raidId,
                name = raidName,
                order = instanceIndex,
                isRaid = true,
                difficulty = HEROIC_RAID_DIFFICULTY,
            }
        else
            skipped[#skipped + 1] = {
                id = raidId,
                name = raidName,
                reason = not IsConfiguredPreflightRaid(config or {}, raidId) and "不在两个目标 S2 团本范围"
                    or (hasHeroicDifficulty and "英雄难度无有效战利品" or "不支持英雄难度"),
            }
        end

        instanceIndex = instanceIndex + 1
    end

    return detected, skipped, {
        expansionId = expansionId,
        tierId = tierId,
    }
end

local function ExtractItemIdFromLink(link)
    if not link then
        return nil
    end
    local itemId = link:match("item:(%d+)")
    return itemId and tonumber(itemId) or nil
end

local function AddUniqueSource(item, source)
    for _, existing in ipairs(item.sources) do
        if existing.instanceId == source.instanceId and existing.encounterId == source.encounterId then
            return
        end
    end
    item.sources[#item.sources + 1] = source
end

local function RecordClassSpecAvailability(item, classId, specId)
    if not item then
        return
    end
    item.classes = item.classes or {}
    item.specsByClass = item.specsByClass or {}

    local classKey = tostring(classId)
    if not item.specsByClass[classKey] then
        item.specsByClass[classKey] = {}
    end

    AppendUniqueNumber(item.classes, classId)
    AppendUniqueNumber(item.specsByClass[classKey], specId)
end

local function FinalizeClassSpecAvailability(item)
    item.classes = item.classes or {}
    item.specsByClass = item.specsByClass or {}

    SortNumbers(item.classes)
    for _, specs in pairs(item.specsByClass) do
        SortNumbers(specs)
    end
end

local function ApplyLootInfoToItem(item, info, linkSource)
    if not item or not info then
        return
    end
    if info.name and item.name == ("item:" .. tostring(item.itemId)) then
        item.name = info.name
    end
    if info.icon and (not item.icon or item.icon == 0) then
        item.icon = info.icon
    end
    if (info.slot or info.invType) and item.displaySlot == "" then
        item.displaySlot = info.slot or info.invType
    end
    if info.link then
        item.displayLink = info.link
        item.linkSource = linkSource
    end
end

local function BuildEncounterCacheKey(source, classId, specId)
    return table.concat({
        tostring(source.instanceId or 0),
        tostring(source.difficulty or 0),
        tostring(source.encounterId or 0),
        tostring(classId or 0),
        tostring(specId or 0),
    }, ":")
end

local function ScanEncounterLootMap(source, classId, specId, cache)
    local cacheKey = BuildEncounterCacheKey(source, classId, specId)
    if cache[cacheKey] then
        return cache[cacheKey]
    end

    local lootMap = {}
    EJ_SelectInstance(source.instanceId)
    if not SafeSetDifficulty(source.difficulty) then
        cache[cacheKey] = lootMap
        return lootMap
    end

    EJ_SelectEncounter(source.encounterId)
    ResetLootFilters()
    if classId and specId and EJ_SetLootFilter then
        EJ_SetLootFilter(classId, specId)
    end

    for lootIndex = 1, (EJ_GetNumLoot() or 0) do
        local info = C_EncounterJournal.GetLootInfoByIndex(lootIndex)
        local itemId = info and (info.itemID or ExtractItemIdFromLink(info.link)) or nil
        if itemId then
            lootMap[itemId] = info
        end
    end

    cache[cacheKey] = lootMap
    return lootMap
end

local function ResolveItemDisplayLink(item, cache)
    if item.displayLink or not item.sources then
        return item.displayLink ~= nil
    end

    for _, source in ipairs(item.sources) do
        local baseMap = ScanEncounterLootMap(source, nil, nil, cache)
        local baseInfo = baseMap[item.itemId]
        if baseInfo then
            ApplyLootInfoToItem(item, baseInfo, "journal_list")
        end
        if item.displayLink then
            return true
        end

        for _, classData in ipairs(ALL_CLASS_SPECS) do
            for _, specId in ipairs(classData.specs) do
                local specMap = ScanEncounterLootMap(source, classData.classId, specId, cache)
                local specInfo = specMap[item.itemId]
                if specInfo then
                    ApplyLootInfoToItem(item, specInfo, string.format("loot_filter:%d:%d", classData.classId, specId))
                end
                if item.displayLink then
                    return true
                end
            end
        end
    end

    return false
end

local function ResolveItemClassSpecs(item, cache)
    item.classes = item.classes or {}
    item.specsByClass = item.specsByClass or {}

    if not item.sources then
        return false
    end

    for _, source in ipairs(item.sources) do
        for _, classData in ipairs(ALL_CLASS_SPECS) do
            for _, specId in ipairs(classData.specs) do
                local specMap = ScanEncounterLootMap(source, classData.classId, specId, cache)
                if specMap[item.itemId] then
                    RecordClassSpecAvailability(item, classData.classId, specId)
                end
            end
        end
    end

    FinalizeClassSpecAvailability(item)
    return #item.classes > 0
end

local function ResolveMissingDisplayLinks(itemsById)
    local cache = {}
    local resolved = 0
    local missing = {}

    for _, itemId in ipairs(CollectItemIds(itemsById)) do
        local item = itemsById[itemId]
        if not item.displayLink then
            if ResolveItemDisplayLink(item, cache) then
                resolved = resolved + 1
            else
                item.captureStatus = "missing_display_link"
                item.linkSource = item.linkSource or ""
                missing[#missing + 1] = {
                    itemId = item.itemId,
                    name = item.name,
                    instanceName = item.sources and item.sources[1] and item.sources[1].instanceName or "",
                    encounterName = item.sources and item.sources[1] and item.sources[1].encounterName or "",
                }
            end
        else
            item.captureStatus = item.captureStatus or "resolved"
            item.linkSource = item.linkSource or "journal_list"
        end
    end

    ResetLootFilters()
    return {
        resolved = resolved,
        missing = missing,
        cache = cache,
    }
end

local function ResolveClassSpecAvailability(itemsById, cache)
    local classified = 0
    local missing = {}
    cache = cache or {}

    for _, itemId in ipairs(CollectItemIds(itemsById)) do
        local item = itemsById[itemId]
        if ResolveItemClassSpecs(item, cache) then
            classified = classified + 1
        else
            missing[#missing + 1] = {
                itemId = item.itemId,
                name = item.name,
                instanceName = item.sources and item.sources[1] and item.sources[1].instanceName or "",
                encounterName = item.sources and item.sources[1] and item.sources[1].encounterName or "",
            }
        end
    end

    ResetLootFilters()
    return {
        classified = classified,
        missing = missing,
    }
end

local function ScanInstanceLoot(instanceMeta, itemsById)
    EJ_SelectInstance(instanceMeta.id)
    if not SafeSetDifficulty(instanceMeta.difficulty) then
        return {
            id = instanceMeta.id,
            name = instanceMeta.name,
            isRaid = instanceMeta.isRaid,
            difficulty = instanceMeta.difficulty,
            encounters = {},
        }, 0
    end

    ResetLootFilters()

    local instanceData = {
        id = instanceMeta.id,
        name = instanceMeta.name,
        isRaid = instanceMeta.isRaid,
        difficulty = instanceMeta.difficulty,
        encounters = {},
    }

    local discovered = 0
    local encounterIndex = 1
    while true do
        local encounterName, _, encounterId = EJ_GetEncounterInfoByIndex(encounterIndex, instanceMeta.id)
        if not encounterId then
            break
        end

        EJ_SelectEncounter(encounterId)
        ResetLootFilters()

        local encounterData = {
            id = encounterId,
            name = encounterName or ("Encounter " .. tostring(encounterId)),
            order = encounterIndex,
            itemIds = {},
        }

        local seenThisEncounter = {}
        for lootIndex = 1, (EJ_GetNumLoot() or 0) do
            local info = C_EncounterJournal.GetLootInfoByIndex(lootIndex)
            local itemId = info and (info.itemID or ExtractItemIdFromLink(info.link)) or nil
            if itemId and not seenThisEncounter[itemId] then
                seenThisEncounter[itemId] = true
                encounterData.itemIds[#encounterData.itemIds + 1] = itemId
                discovered = discovered + 1

                local item = itemsById[itemId]
                if not item then
                    item = {
                        itemId = itemId,
                        name = info and info.name or ("item:" .. tostring(itemId)),
                        icon = info and info.icon or 0,
                        displayLink = info and info.link or nil,
                        displaySlot = info and (info.slot or info.invType) or "",
                        sources = {},
                    }
                    itemsById[itemId] = item
                end

                if info and info.link and not item.displayLink then
                    item.displayLink = info.link
                end
                if info and info.name and item.name == ("item:" .. tostring(itemId)) then
                    item.name = info.name
                end
                if info and info.icon and item.icon == 0 then
                    item.icon = info.icon
                end
                if info and (info.slot or info.invType) and item.displaySlot == "" then
                    item.displaySlot = info.slot or info.invType
                end

                AddUniqueSource(item, {
                    instanceId = instanceMeta.id,
                    instanceName = instanceMeta.name,
                    isRaid = instanceMeta.isRaid,
                    difficulty = instanceMeta.difficulty,
                    encounterId = encounterId,
                    encounterName = encounterData.name,
                    encounterOrder = encounterIndex,
                    lootOrder = lootIndex,
                })
            end
        end

        if #encounterData.itemIds > 0 then
            instanceData.encounters[#instanceData.encounters + 1] = encounterData
        end

        encounterIndex = encounterIndex + 1
    end

    return instanceData, discovered
end

CollectItemIds = function(itemsById)
    local ids = {}
    for itemId in pairs(itemsById) do
        ids[#ids + 1] = itemId
    end
    SortNumbers(ids)
    return ids
end

local function BuildTooltipLinesFromNewAPI(link)
    local tipData = C_TooltipInfo.GetHyperlink(link)
    local lines = {}
    if not tipData or not tipData.lines then
        return lines
    end

    for _, line in ipairs(tipData.lines) do
        local leftText = line.leftText or ""
        local rightText = line.rightText or ""
        if leftText ~= "" or rightText ~= "" then
            lines[#lines + 1] = {
                left = leftText,
                right = rightText,
            }
        end
    end

    return lines
end

local hiddenTip

local function EnsureHiddenTooltip()
    if hiddenTip then
        return hiddenTip
    end
    hiddenTip = CreateFrame("GameTooltip", "WoWLookExport3HiddenTip", nil, "GameTooltipTemplate")
    hiddenTip:SetOwner(WorldFrame, "ANCHOR_NONE")
    return hiddenTip
end

local function BuildTooltipLinesFromFallback(link)
    local tip = EnsureHiddenTooltip()
    tip:ClearLines()
    tip:SetHyperlink(link)

    local lines = {}
    for index = 1, tip:NumLines() do
        local leftObj = _G["WoWLookExport3HiddenTipTextLeft" .. index]
        local rightObj = _G["WoWLookExport3HiddenTipTextRight" .. index]
        local leftText = leftObj and leftObj:GetText() or ""
        local rightText = rightObj and rightObj:GetText() or ""
        if leftText ~= "" or rightText ~= "" then
            lines[#lines + 1] = {
                left = leftText or "",
                right = rightText or "",
            }
        end
    end

    return lines
end

local function CaptureTooltipLines(link)
    if not link then
        return {}
    end
    if C_TooltipInfo and type(C_TooltipInfo.GetHyperlink) == "function" then
        return BuildTooltipLinesFromNewAPI(link)
    end
    return BuildTooltipLinesFromFallback(link)
end

local function IsStatLine(text)
    if not text then
        return false
    end
    return text:match("^%+%d+%s*.+$") ~= nil
end

local function IsEffectTerminator(text)
    if not text or text == "" then
        return false
    end
    return text:match("^卖价")
        or text:match("^ID:")
        or text:match("^物品等级")
        or text:match("^升级：")
        or text:match("^拾取后")
        or text:match("^装备唯一")
        or SLOT_TEXTS[text]
        or text:match("^%d+点护甲$")
        or text:match("^%d+%s*%-%s*%d+点伤害$")
        or text:match("^（每秒伤害[%d%.]+）$")
        or IsStatLine(text)
end

local function ParseTooltip(lines)
    local parsed = {
        itemLevel = nil,
        upgradeTrack = "",
        slotText = "",
        white = {},
        stats = {},
        effects = {},
        equipEffects = {},
        useEffects = {},
        primaryStats = {},
        secondaryStats = {},
        stamina = nil,
        flags = {
            uniqueEquipped = false,
            prismaticSocket = false,
        },
    }

    local currentEffect = nil

    for _, line in ipairs(lines) do
        local left = line.left or ""
        local right = line.right or ""

        local ilvl = left:match("^物品等级%s*(%d+)$")
        if ilvl then
            parsed.itemLevel = tonumber(ilvl)
        end

        local upgradeTrack = left:match("^升级：(.+)$")
        if upgradeTrack then
            parsed.upgradeTrack = upgradeTrack
        end

        if left:match("^装备唯一") then
            parsed.flags.uniqueEquipped = true
        end

        if left == "棱彩插槽" then
            parsed.flags.prismaticSocket = true
        end

        if SLOT_TEXTS[left] and parsed.slotText == "" then
            parsed.slotText = left
        end

        local armor = left:match("^(%d+)点护甲$")
        if armor then
            parsed.white.armor = tonumber(armor)
        end

        local minDamage, maxDamage = left:match("^(%d+)%s*%-%s*(%d+)点伤害$")
        if minDamage and maxDamage then
            parsed.white.damageMin = tonumber(minDamage)
            parsed.white.damageMax = tonumber(maxDamage)
        end

        local dps = left:match("^（每秒伤害([%d%.]+)）$")
        if dps then
            parsed.white.dps = tonumber(dps)
        end

        local speed = right:match("^速度%s*([%d%.]+)$")
        if speed then
            parsed.white.speed = tonumber(speed)
        end

        local value, label = left:match("^%+(%d+)%s*(.+)$")
        if value and label then
            local key = STAT_LABELS[label]
            if key then
                parsed.stats[key] = tonumber(value)
            end
        end

        if left:match("^装备：") or left:match("^使用：") then
            local effectType = left:match("^(装备)") and "equip" or "use"
            currentEffect = {
                type = effectType,
                lines = { left },
            }
            parsed.effects[#parsed.effects + 1] = currentEffect
        elseif currentEffect and not IsEffectTerminator(left) and not left:match("^你尚未收藏过此外观") then
            currentEffect.lines[#currentEffect.lines + 1] = left
        elseif currentEffect and IsEffectTerminator(left) then
            currentEffect = nil
        end
    end

    for _, effect in ipairs(parsed.effects) do
        effect.text = table.concat(effect.lines, "")
        if effect.type == "equip" then
            parsed.equipEffects[#parsed.equipEffects + 1] = effect.text
        elseif effect.type == "use" then
            parsed.useEffects[#parsed.useEffects + 1] = effect.text
        end
    end

    for statKey, value in pairs(parsed.stats) do
        local entry = {
            type = statKey,
            name = STAT_NAMES[statKey] or statKey,
            value = value,
        }
        if PRIMARY_STAT_KEYS[statKey] then
            parsed.primaryStats[#parsed.primaryStats + 1] = entry
        elseif SECONDARY_STAT_KEYS[statKey] then
            parsed.secondaryStats[#parsed.secondaryStats + 1] = entry
        elseif statKey == "stamina" then
            parsed.stamina = entry
        end
    end

    table.sort(parsed.primaryStats, function(a, b)
        return (STAT_SORT_ORDER[a.type] or 999) < (STAT_SORT_ORDER[b.type] or 999)
    end)
    table.sort(parsed.secondaryStats, function(a, b)
        return (STAT_SORT_ORDER[a.type] or 999) < (STAT_SORT_ORDER[b.type] or 999)
    end)

    return parsed
end

local function ValidateSeasonConfig()
    local config = WoWLookSeasonConfig
    if type(config) ~= "table" then
        return nil, "season_config_invalid: missing WoWLookSeasonConfig"
    end
    if type(config.profileVersion) ~= "number"
        or type(config.minimumBuild) ~= "number"
        or type(config.releaseStatus) ~= "string"
        or type(config.dataVersion) ~= "string" then
        return nil, "season_config_invalid: required fields are missing"
    end
    local _, buildNumber = GetClientBuildInfo()
    if buildNumber < config.minimumBuild then
        return nil, string.format(
            "season_build_mismatch: client build %d is older than profile minimum %d",
            buildNumber,
            config.minimumBuild
        )
    end
    if config.releaseStatus ~= "finalized" then
        return config
    end
    if type(config.dungeon.targetItemLevel) ~= "number"
        or type(config.dungeon.trackBonusId) ~= "number"
        or config.dungeon.trackBonusId <= 0 then
        return nil, "season_config_invalid: dungeon maximum rule is invalid"
    end
    local voidforged = config.voidforged
    if type(voidforged) ~= "table"
        or type(voidforged.targetItemLevel) ~= "number"
        or voidforged.targetItemLevel <= 0
        or type(voidforged.itemContext) ~= "number"
        or type(voidforged.markerBonusId) ~= "number"
        or type(voidforged.commonBonusIds) ~= "table"
        or type(voidforged.trinketBonusId) ~= "number"
        or type(voidforged.weaponBonusId) ~= "number"
        or type(voidforged.slotBonusIds) ~= "table" then
        return nil, "season_config_invalid: voidforged weapon/trinket rule is invalid"
    end
    local mythicRaid = config.raid.tracks[config.raid.maxDifficulty]
    if type(mythicRaid) ~= "table"
        or type(mythicRaid.targetItemLevel) ~= "number"
        or type(mythicRaid.trackBonusId) ~= "number"
        or mythicRaid.trackBonusId <= 0 then
        return nil, "season_config_invalid: raid maximum rule is invalid"
    end

    if config.testedBuild and buildNumber ~= config.testedBuild then
        PrintWarn(string.format(
            "赛季配置测试版本为 %d，当前客户端为 %d；将继续导出，但必须检查最高装等验证结果。",
            config.testedBuild,
            buildNumber
        ))
    end
    return config
end

local function GetItemLevelBonusId(levelDifference)
    if levelDifference == 0 then
        return nil
    end
    if levelDifference >= -100 and levelDifference <= 200 then
        return 1472 + levelDifference
    end
    if levelDifference >= 201 and levelDifference <= 400 then
        return 2929 + levelDifference
    end
    return nil
end

local function GetDetailedItemLevels(itemInfo)
    if not C_Item or type(C_Item.GetDetailedItemLevelInfo) ~= "function" then
        return nil, nil
    end
    local ok, actualItemLevel, _, baseItemLevel = pcall(C_Item.GetDetailedItemLevelInfo, itemInfo)
    if not ok then
        return nil, nil
    end
    return actualItemLevel, baseItemLevel
end

local function CaptureItemVersion(link)
    local version = {
        status = "tooltip_unavailable",
        link = link or "",
        itemLevel = 0,
        upgradeTrack = "",
        tooltip = { rawLines = {}, parsed = {} },
        primaryStats = {},
        secondaryStats = {},
        effects = { equip = {}, use = {} },
        tooltipFlags = { uniqueEquipped = false, prismaticSocket = false },
    }
    if not link or link == "" then
        return version
    end

    local name, normalizedLink, quality, _, _, itemType, itemSubType, _, equipLoc, icon, _, classId, subclassId =
        GetItemInfo(link)
    local resolvedLink = normalizedLink or link
    local tooltipLines = CaptureTooltipLines(resolvedLink)
    local parsedTooltip = ParseTooltip(tooltipLines)
    local actualItemLevel = GetDetailedItemLevels(resolvedLink)

    version.link = resolvedLink
    version.name = name or ""
    version.quality = quality or 0
    version.icon = icon or 0
    version.equipLoc = equipLoc or ""
    version.itemType = itemType or ""
    version.itemSubType = itemSubType or ""
    version.itemClassId = classId or 0
    version.itemSubclassId = subclassId or 0
    version.tooltip = { rawLines = tooltipLines, parsed = parsedTooltip }
    version.itemLevel = parsedTooltip.itemLevel or actualItemLevel or 0
    version.apiItemLevel = actualItemLevel or 0
    version.upgradeTrack = parsedTooltip.upgradeTrack or ""
    version.slotText = parsedTooltip.slotText or ""
    version.primaryStats = parsedTooltip.primaryStats or {}
    version.secondaryStats = parsedTooltip.secondaryStats or {}
    version.stamina = parsedTooltip.stamina
    version.effects = {
        equip = parsedTooltip.equipEffects or {},
        use = parsedTooltip.useEffects or {},
    }
    version.tooltipFlags = parsedTooltip.flags or version.tooltipFlags
    if name and version.itemLevel > 0 and #tooltipLines > 0 then
        version.status = "ok"
    end
    return version
end

local function ApplyItemVersion(item, version)
    item.name = version.name ~= "" and version.name or item.name
    item.quality = version.quality or 0
    item.icon = version.icon ~= 0 and version.icon or item.icon or 0
    item.link = version.link or ""
    item.equipLoc = version.equipLoc or ""
    item.itemType = version.itemType or ""
    item.itemSubType = version.itemSubType or ""
    item.itemClassId = version.itemClassId or 0
    item.itemSubclassId = version.itemSubclassId or 0
    item.tooltip = version.tooltip
    item.itemLevel = version.itemLevel or 0
    item.upgradeTrack = version.upgradeTrack or ""
    item.slotText = version.slotText or ""
    item.primaryStats = version.primaryStats or {}
    item.secondaryStats = version.secondaryStats or {}
    item.stamina = version.stamina
    item.effects = version.effects or { equip = {}, use = {} }
    item.tooltipFlags = version.tooltipFlags or { uniqueEquipped = false, prismaticSocket = false }
end

local function CopyCapturedVersion(version)
    local copy = {}
    for key, value in pairs(version or {}) do
        copy[key] = value
    end
    return copy
end

local function SelectItemSpecialization(item)
    for _, classData in ipairs(ALL_CLASS_SPECS) do
        local specs = item.specsByClass
            and (item.specsByClass[tostring(classData.classId)] or item.specsByClass[classData.classId])
        if type(specs) == "table" and #specs > 0 then
            return specs[1]
        end
    end
    return nil
end

local function IsUpgradeableItem(itemId)
    local _, _, _, _, _, itemClassId = C_Item.GetItemInfoInstant(itemId)
    local armorClass = Enum and Enum.ItemClass and Enum.ItemClass.Armor or 4
    local weaponClass = Enum and Enum.ItemClass and Enum.ItemClass.Weapon or 2
    return itemClassId == armorClass or itemClassId == weaponClass
end

local function CopySourceWithDifficulty(source, difficulty)
    return {
        instanceId = source.instanceId,
        instanceName = source.instanceName,
        isRaid = source.isRaid,
        difficulty = difficulty,
        encounterId = source.encounterId,
        encounterName = source.encounterName,
        encounterOrder = source.encounterOrder,
        lootOrder = source.lootOrder,
    }
end

local function FindHighestRaidRule(item, config, encounterCache)
    local difficulties = { 16, 15, 14, 17 }
    for _, difficulty in ipairs(difficulties) do
        local rule = config.raid.tracks[difficulty]
        if rule then
            for _, source in ipairs(item.sources or {}) do
                if source.isRaid then
                    local candidateSource = CopySourceWithDifficulty(source, difficulty)
                    local lootMap = ScanEncounterLootMap(candidateSource, nil, nil, encounterCache)
                    if lootMap[item.itemId] then
                        local selected = {
                            ruleSource = rule.ruleSource,
                            track = rule.track,
                            rank = rule.rank,
                            targetItemLevel = rule.targetItemLevel,
                            trackBonusId = rule.trackBonusId,
                            difficulty = difficulty,
                        }
                        return selected
                    end
                end
            end
        end
    end
    return nil
end

local function ApplyVoidforgedRule(item, rule, config)
    if not rule or rule.useDropVersion then
        return rule
    end
    local voidforged = config.voidforged
    local equipLoc = item.dropVersion and item.dropVersion.equipLoc or nil
    if not equipLoc or equipLoc == "" then
        local _, _, _, instantEquipLoc = C_Item.GetItemInfoInstant(item.itemId)
        equipLoc = instantEquipLoc
    end
    local slotBonusId = voidforged and voidforged.slotBonusIds and voidforged.slotBonusIds[equipLoc]
    if not slotBonusId then
        return rule
    end

    local overridden = {}
    for key, value in pairs(rule) do
        overridden[key] = value
    end
    overridden.ruleSource = voidforged.ruleSource
    overridden.track = voidforged.track
    overridden.rank = 0
    overridden.targetItemLevel = voidforged.targetItemLevel
    overridden.itemContext = voidforged.itemContext
    overridden.voidforgedBonusIds = {}
    for _, bonusId in ipairs(voidforged.commonBonusIds) do
        overridden.voidforgedBonusIds[#overridden.voidforgedBonusIds + 1] = bonusId
    end
    overridden.voidforgedBonusIds[#overridden.voidforgedBonusIds + 1] = slotBonusId
    overridden.voidforgedBonusIds[#overridden.voidforgedBonusIds + 1] = voidforged.markerBonusId
    overridden.requiredBonusIds = overridden.voidforgedBonusIds
    overridden.fixedBonusId = nil
    overridden.trackBonusId = nil
    overridden.specialSlot = equipLoc
    overridden.voidforged = true
    return overridden
end

local function SelectMaxUpgradeRule(item, config, encounterCache)
    if config.nonUpgradeableItems and config.nonUpgradeableItems[item.itemId] then
        return { ruleSource = "non_upgradeable", useDropVersion = true }
    end
    if not IsUpgradeableItem(item.itemId) then
        return { ruleSource = "non_upgradeable", useDropVersion = true }
    end

    for _, source in ipairs(item.sources or {}) do
        local fixedRule = config.fixedSourceRules and config.fixedSourceRules[source.instanceId]
        if fixedRule then
            local candidateSource = CopySourceWithDifficulty(source, fixedRule.difficulty)
            local lootMap = ScanEncounterLootMap(candidateSource, nil, nil, encounterCache)
            if lootMap[item.itemId] then
                return {
                    ruleSource = fixedRule.ruleSource,
                    track = fixedRule.track,
                    rank = fixedRule.rank,
                    difficulty = fixedRule.difficulty,
                    fixedBonusId = fixedRule.fixedBonusId,
                }
            end
        end
    end

    for _, source in ipairs(item.sources or {}) do
        if not source.isRaid then
            return ApplyVoidforgedRule(item, {
                ruleSource = config.dungeon.ruleSource,
                track = config.dungeon.track,
                rank = config.dungeon.rank,
                targetItemLevel = config.dungeon.targetItemLevel,
                trackBonusId = config.dungeon.trackBonusId,
            }, config)
        end
    end
    return ApplyVoidforgedRule(item, FindHighestRaidRule(item, config, encounterCache), config)
end

local function BuildMaxLevelItemLink(item, rule, config)
    if rule.useDropVersion then
        return item.displayLink, nil
    end
    local specId = SelectItemSpecialization(item)
    if not specId then
        return nil, "invalid_specialization"
    end

    local bonusIds = {}
    if rule.voidforgedBonusIds then
        for _, bonusId in ipairs(rule.voidforgedBonusIds) do
            bonusIds[#bonusIds + 1] = bonusId
        end
    elseif rule.fixedBonusId then
        bonusIds[#bonusIds + 1] = rule.fixedBonusId
    else
        local _, baseItemLevel = GetDetailedItemLevels(item.itemId)
        if not baseItemLevel or baseItemLevel <= 0 then
            return nil, "base_item_level_unavailable"
        end
        local levelDifference = rule.targetItemLevel - baseItemLevel
        local levelBonusId = GetItemLevelBonusId(levelDifference)
        if levelDifference ~= 0 and not levelBonusId then
            return nil, "bonus_mapping_missing"
        end
        if levelBonusId then
            bonusIds[#bonusIds + 1] = levelBonusId
        end
        bonusIds[#bonusIds + 1] = rule.trackBonusId
    end

    if not rule.voidforged then
        local specialItem = config.specialItems and config.specialItems[item.itemId]
        for _, bonusId in ipairs(specialItem and specialItem.bonusIds or {}) do
            bonusIds[#bonusIds + 1] = bonusId
        end
        if config.commonBonusIds and config.commonBonusIds.quality then
            bonusIds[#bonusIds + 1] = config.commonBonusIds.quality
        end

        local _, _, _, itemEquipLoc = C_Item.GetItemInfoInstant(item.itemId)
        local slotBonusId = config.slotBonusIds and config.slotBonusIds[itemEquipLoc]
        if slotBonusId then
            bonusIds[#bonusIds + 1] = slotBonusId
        end
    end

    local extras = "::::"
    return string.format(
        "item:%d:%s:::%d:%d::%s:%d:%s",
        item.itemId,
        extras,
        UnitLevel("player"),
        specId,
        rule.itemContext and tostring(rule.itemContext) or "",
        #bonusIds,
        table.concat(bonusIds, ":")
    )
end

local function LinkContainsBonusId(link, bonusId)
    return type(link) == "string"
        and string.find(link, ":" .. tostring(bonusId) .. ":", 1, true) ~= nil
end

local function ValidateMaxVersion(item, version, rule)
    if version.status ~= "ok" then
        return "tooltip_unavailable"
    end
    if ExtractItemIdFromLink(version.link) ~= item.itemId then
        return "item_identity_mismatch"
    end
    if version.apiItemLevel > 0 and version.itemLevel ~= version.apiItemLevel then
        return "tooltip_api_item_level_mismatch"
    end
    if rule.targetItemLevel and version.itemLevel ~= rule.targetItemLevel then
        return "target_item_level_mismatch"
    end
    for _, bonusId in ipairs(rule.requiredBonusIds or {}) do
        if not LinkContainsBonusId(version.link, bonusId) then
            return "required_bonus_missing"
        end
    end
    if not rule.targetItemLevel and item.dropVersion
        and version.itemLevel < (item.dropVersion.itemLevel or 0) then
        return "fixed_version_below_drop_level"
    end
    if item.dropVersion and item.dropVersion.equipLoc ~= ""
        and version.equipLoc ~= ""
        and item.dropVersion.equipLoc ~= version.equipLoc then
        return "equip_location_mismatch"
    end
    return "ok"
end

local function FillItemDetails(itemsById, encounterCache, config)
    local captured = 0
    local missing = 0
    local maxStats = { success = 0, failed = 0, statuses = {}, failures = {} }
    for _, itemId in ipairs(CollectItemIds(itemsById)) do
        local item = itemsById[itemId]
        if not item.displayLink then
            item.link = ""
            item.tooltip = {
                rawLines = {},
                parsed = {
                    itemLevel = 0,
                    upgradeTrack = "",
                    slotText = "",
                    white = {},
                    stats = {},
                    effects = {},
                    equipEffects = {},
                    useEffects = {},
                    primaryStats = {},
                    secondaryStats = {},
                    stamina = nil,
                    flags = {
                        uniqueEquipped = false,
                        prismaticSocket = false,
                    },
                },
            }
            item.itemLevel = 0
            item.upgradeTrack = ""
            item.primaryStats = {}
            item.secondaryStats = {}
            item.stamina = nil
            item.effects = {
                equip = {},
                use = {},
            }
            item.tooltipFlags = {
                uniqueEquipped = false,
                prismaticSocket = false,
            }
            item.captureStatus = item.captureStatus or "missing_display_link"
            item.dropVersion = { status = "missing_display_link" }
            item.maxVersion = { status = "missing_display_link" }
            maxStats.statuses.missing_display_link = (maxStats.statuses.missing_display_link or 0) + 1
            maxStats.failed = maxStats.failed + 1
            maxStats.failures[#maxStats.failures + 1] = {
                itemId = item.itemId,
                name = item.name,
                status = "missing_display_link",
                expectedItemLevel = 0,
                actualItemLevel = 0,
                instanceName = item.sources and item.sources[1] and item.sources[1].instanceName or "",
            }
            missing = missing + 1
        else
            item.dropVersion = CaptureItemVersion(item.displayLink)
            if item.dropVersion.status == "ok" then
                local rule = SelectMaxUpgradeRule(item, config, encounterCache)
                if not rule then
                    item.maxVersion = { status = "no_upgrade_rule" }
                elseif rule.useDropVersion then
                    item.maxVersion = CopyCapturedVersion(item.dropVersion)
                    item.maxVersion.status = "ok"
                    item.maxVersion.ruleSource = rule.ruleSource
                    item.maxVersion.track = "fixed"
                    item.maxVersion.rank = 0
                else
                    local maxLink, buildError = BuildMaxLevelItemLink(item, rule, config)
                    if not maxLink then
                        item.maxVersion = { status = buildError or "max_link_build_failed" }
                    else
                        local maxVersion = CaptureItemVersion(maxLink)
                        maxVersion.status = ValidateMaxVersion(item, maxVersion, rule)
                        maxVersion.ruleSource = rule.ruleSource
                        maxVersion.track = rule.track
                        maxVersion.rank = rule.rank
                        maxVersion.difficulty = rule.difficulty
                        maxVersion.specialSlot = rule.specialSlot
                        maxVersion.voidforged = rule.voidforged or false
                        maxVersion.itemContext = rule.itemContext
                        maxVersion.expectedItemLevel = rule.targetItemLevel or 0
                        item.maxVersion = maxVersion
                    end
                end

                local status = item.maxVersion.status
                maxStats.statuses[status] = (maxStats.statuses[status] or 0) + 1
                if status == "ok" then
                    ApplyItemVersion(item, item.maxVersion)
                    item.captureStatus = "ok"
                    captured = captured + 1
                    maxStats.success = maxStats.success + 1
                else
                    ApplyItemVersion(item, item.dropVersion)
                    item.captureStatus = "max_version_failed"
                    maxStats.failed = maxStats.failed + 1
                    maxStats.failures[#maxStats.failures + 1] = {
                        itemId = item.itemId,
                        name = item.name,
                        status = status,
                        expectedItemLevel = item.maxVersion.expectedItemLevel or 0,
                        actualItemLevel = item.maxVersion.itemLevel or 0,
                        instanceName = item.sources and item.sources[1] and item.sources[1].instanceName or "",
                    }
                end
            else
                ApplyItemVersion(item, item.dropVersion)
                item.maxVersion = { status = "drop_version_unavailable" }
                item.captureStatus = "max_version_failed"
                maxStats.statuses.drop_version_unavailable = (maxStats.statuses.drop_version_unavailable or 0) + 1
                maxStats.failed = maxStats.failed + 1
                missing = missing + 1
            end
        end
    end
    ResetLootFilters()
    return captured, missing, maxStats
end

local function BuildExportData(config)
    local dungeons, unresolvedDungeons, dungeonDiscoverySource = DetectSeasonDungeons(config)
    if #dungeons == 0 then
        error("未识别到当前赛季地下城。")
    end

    local raids, skippedRaids, raidMeta = DetectSeasonRaids(config)
    if #raids == 0 then
        error("未识别到支持英雄难度的当前赛季团本。")
    end

    local itemsById = {}
    local instances = {}

    Print(string.format("识别到地下城 %d 个，团本 %d 个", #dungeons, #raids))
    for _, unresolved in ipairs(unresolvedDungeons) do
        PrintWarn(string.format("未匹配地下城: %s (mapID=%s)", unresolved.name, tostring(unresolved.mapId)))
    end
    for _, skipped in ipairs(skippedRaids) do
        PrintWarn(string.format("已跳过团本: %s (%s)", skipped.name, skipped.reason))
    end

    for _, instanceMeta in ipairs(dungeons) do
        Print(string.format("扫描地下城: %s", instanceMeta.name))
        local instanceData = ScanInstanceLoot(instanceMeta, itemsById)
        instances[#instances + 1] = instanceData
    end

    for _, instanceMeta in ipairs(raids) do
        Print(string.format("扫描团本: %s", instanceMeta.name))
        local instanceData = ScanInstanceLoot(instanceMeta, itemsById)
        instances[#instances + 1] = instanceData
    end

    local itemIds = CollectItemIds(itemsById)
    for _, itemId in ipairs(itemIds) do
        if C_Item and C_Item.RequestLoadItemDataByID then
            C_Item.RequestLoadItemDataByID(itemId)
        end
    end

    return {
        instances = instances,
        itemsById = itemsById,
        itemIds = itemIds,
        dungeonMeta = {
            instances = dungeons,
            unresolved = unresolvedDungeons,
            discoverySource = dungeonDiscoverySource,
        },
        raidMeta = {
            instances = raids,
            skipped = skippedRaids,
            expansionId = raidMeta.expansionId,
            tierId = raidMeta.tierId,
        },
    }
end

local function FinalizeExport(scan, config)
    Print("补抓展示层 link ...")
    local resolveStats = ResolveMissingDisplayLinks(scan.itemsById)
    Print(string.format("补抓完成：补到 %d 件，仍缺失 %d 件", resolveStats.resolved, #resolveStats.missing))

    Print("补抓职业 / 专精归属 ...")
    local classSpecStats = ResolveClassSpecAvailability(scan.itemsById, resolveStats.cache)
    Print(string.format("归属完成：已分类 %d 件，仍缺失 %d 件", classSpecStats.classified, #classSpecStats.missing))

    Print("构造并验证最高可获得装等 ...")
    local captured, missingTooltipSource, maxStats = FillItemDetails(scan.itemsById, resolveStats.cache, config)
    Print(string.format("最高档完成：成功 %d 件，失败 %d 件", maxStats.success, maxStats.failed))

    local itemCount = 0
    for _ in pairs(scan.itemsById) do
        itemCount = itemCount + 1
    end

    local buildVersion, buildNumber = GetClientBuildInfo()
    local payload = {
        exportTime = date("%Y-%m-%d %H:%M:%S"),
        build = buildVersion,
        buildNumber = buildNumber,
        locale = GetLocale(),
        addonVersion = ADDON_VERSION,
        maximumProfile = {
            profileVersion = config.profileVersion,
            seasonId = config.seasonId,
            seasonName = config.seasonName,
            testedBuild = config.testedBuild,
            dungeonTargetItemLevel = config.dungeon.targetItemLevel,
            raidTargetItemLevel = config.raid.tracks[config.raid.maxDifficulty].targetItemLevel,
            weaponTargetItemLevel = config.voidforged.targetItemLevel,
            trinketTargetItemLevel = config.voidforged.targetItemLevel,
            voidforgedItemContext = config.voidforged.itemContext,
            voidforgedMarkerBonusId = config.voidforged.markerBonusId,
            voidforgedTrinketBonusId = config.voidforged.trinketBonusId,
            voidforgedWeaponBonusId = config.voidforged.weaponBonusId,
        },
        scope = {
            dungeonDifficulty = DUNGEON_DIFFICULTY,
            raidDifficulty = HEROIC_RAID_DIFFICULTY,
            dungeons = scan.dungeonMeta.instances,
            unresolvedDungeons = scan.dungeonMeta.unresolved,
            raids = scan.raidMeta.instances,
            skippedRaids = scan.raidMeta.skipped,
            raidExpansionId = scan.raidMeta.expansionId,
            raidTierId = scan.raidMeta.tierId,
        },
        diagnostics = {
            resolvedDisplayLinkCount = resolveStats.resolved,
            missingDisplayLinkCount = #resolveStats.missing,
            missingDisplayLinks = resolveStats.missing,
            classifiedClassSpecCount = classSpecStats.classified,
            missingClassSpecCount = #classSpecStats.missing,
            missingClassSpecs = classSpecStats.missing,
            missingTooltipSourceCount = missingTooltipSource,
            maxVersionSuccessCount = maxStats.success,
            maxVersionFailureCount = maxStats.failed,
            maxVersionStatuses = maxStats.statuses,
            maxVersionFailures = maxStats.failures,
        },
        instances = scan.instances,
        items = scan.itemsById,
    }

    WoWLookExport3DB.payload = jsonEncode(payload)
    WoWLookExport3DB.summary = {
        exportedAt = payload.exportTime,
        build = payload.build,
        locale = payload.locale,
        dungeonCount = #scan.dungeonMeta.instances,
        raidCount = #scan.raidMeta.instances,
        instanceCount = #scan.instances,
        itemCount = itemCount,
        tooltipCount = captured,
        resolvedDisplayLinkCount = resolveStats.resolved,
        missingDisplayLinkCount = #resolveStats.missing,
        classifiedClassSpecCount = classSpecStats.classified,
        missingClassSpecCount = #classSpecStats.missing,
        missingTooltipSourceCount = missingTooltipSource,
        maxVersionSuccessCount = maxStats.success,
        maxVersionFailureCount = maxStats.failed,
        maxVersionStatuses = maxStats.statuses,
    }
    WoWLookExport3DB.lastError = nil

    Print("================================")
    Print(string.format(
        "导出完成：地下城 %d，团本 %d，装备 %d，最高档成功 %d，最高档失败 %d，缺失 link %d，缺失职业专精 %d",
        #scan.dungeonMeta.instances,
        #scan.raidMeta.instances,
        itemCount,
        maxStats.success,
        maxStats.failed,
        #resolveStats.missing,
        #classSpecStats.missing
    ))
    Print("请输入 /reload 保存到本地")
    Print("================================")
end

local function FinalizePreflight(scan, config)
    Print("S2 预检：补抓冒险者手册展示链接和说明框证据 ...")
    local resolveStats = ResolveMissingDisplayLinks(scan.itemsById)
    local classSpecStats = ResolveClassSpecAvailability(scan.itemsById, resolveStats.cache)
    local buildVersion, buildNumber = GetClientBuildInfo()

    for _, item in pairs(scan.itemsById) do
        if item.displayLink then
            item.dropVersion = CaptureItemVersion(item.displayLink)
            item.preflightEvidence = {
                rawLink = item.dropVersion.link or item.displayLink,
                tooltipItemLevel = item.dropVersion.itemLevel or 0,
                upgradeTrack = item.dropVersion.upgradeTrack or "",
                tooltipRaw = (item.dropVersion.tooltip or {}).rawLines or {},
            }
        else
            item.preflightEvidence = {
                rawLink = "",
                tooltipItemLevel = 0,
                upgradeTrack = "",
                tooltipRaw = {},
            }
        end
        item.maxVersion = nil
    end

    local payload = {
        mode = "preflight",
        dataVersion = config.dataVersion,
        seasonName = config.seasonName,
        exportTime = date("%Y-%m-%d %H:%M:%S"),
        build = buildVersion,
        clientBuild = buildNumber,
        locale = GetLocale(),
        addonVersion = ADDON_VERSION,
        scope = {
            dungeonDifficulty = DUNGEON_DIFFICULTY,
            raidDifficulty = HEROIC_RAID_DIFFICULTY,
            dungeons = scan.dungeonMeta.instances,
            unresolvedDungeons = scan.dungeonMeta.unresolved,
            raids = scan.raidMeta.instances,
            skippedRaids = scan.raidMeta.skipped,
            raidExpansionId = scan.raidMeta.expansionId,
            raidTierId = scan.raidMeta.tierId,
        },
        diagnostics = {
            resolvedDisplayLinkCount = resolveStats.resolved,
            missingDisplayLinkCount = #resolveStats.missing,
            missingDisplayLinks = resolveStats.missing,
            classifiedClassSpecCount = classSpecStats.classified,
            missingClassSpecCount = #classSpecStats.missing,
            missingClassSpecs = classSpecStats.missing,
        },
        instances = scan.instances,
        items = scan.itemsById,
    }
    WoWLookExport3DB.payload = jsonEncode(payload)
    WoWLookExport3DB.summary = {
        mode = payload.mode,
        exportedAt = payload.exportTime,
        clientBuild = payload.clientBuild,
        dungeonCount = #scan.dungeonMeta.instances,
        raidCount = #scan.raidMeta.instances,
        itemCount = #scan.itemIds,
        missingDisplayLinkCount = #resolveStats.missing,
        missingClassSpecCount = #classSpecStats.missing,
    }
    WoWLookExport3DB.lastError = nil
    Print("S2 预检完成。请 /reload 保存；此文件只能用于确认 S2 规则，不能发布。")
end

local function DoExport(mode)
    WoWLookExport3DB.version = ADDON_VERSION
    if not EnsureEJLoaded() then
        PrintWarn("无法加载冒险者手册 API。")
        return
    end

    local config, configError = ValidateSeasonConfig()
    if not config then
        WoWLookExport3DB.lastError = configError
        PrintWarn("赛季配置错误: " .. tostring(configError))
        return
    end

    if mode ~= "preflight" and config.releaseStatus ~= "finalized" then
        WoWLookExport3DB.lastError = "final_export_blocked_until_manifest_finalized"
        PrintWarn("S2 最终规则尚未由客户端预检确认。请先运行 /wowlook preflight。")
        return
    end

    Print(mode == "preflight" and "开始 S2 预检采集 ..." or "开始 S2 最终导出 ...")
    local ok, scan = pcall(BuildExportData, config)
    if not ok then
        WoWLookExport3DB.lastError = scan
        PrintWarn("扫描失败: " .. tostring(scan))
        return
    end

    local retries = 0
    local ticker
    ticker = C_Timer.NewTicker(0.5, function()
        local uncached = 0
        for _, itemId in ipairs(scan.itemIds) do
            if not GetItemInfo(itemId) then
                uncached = uncached + 1
                if C_Item and C_Item.RequestLoadItemDataByID then
                    C_Item.RequestLoadItemDataByID(itemId)
                end
            end
        end

        retries = retries + 1
        if uncached == 0 or retries >= 40 then
            ticker:Cancel()
            if uncached > 0 then
                PrintWarn(string.format("仍有 %d 件物品未完成缓存，将继续导出。", uncached))
            end

            local finalize = mode == "preflight" and FinalizePreflight or FinalizeExport
            local finalizeOk, finalizeErr = pcall(finalize, scan, config)
            if not finalizeOk then
                WoWLookExport3DB.lastError = finalizeErr
                PrintWarn("导出失败: " .. tostring(finalizeErr))
            end
        elseif retries == 1 or retries % 4 == 0 then
            Print(string.format("等待物品缓存... %d/%d", #scan.itemIds - uncached, #scan.itemIds))
        end
    end)
end

SLASH_WOWLOOKMAXEXPORT1 = "/wowlook"
SLASH_WOWLOOKMAXEXPORT2 = "/wle"
local function HandleSlashCommand(msg)
    local cmd = strlower(strtrim(msg or ""))
    if cmd == "preflight" then
        DoExport("preflight")
    elseif cmd == "" or cmd == "export" then
        DoExport("final")
    elseif cmd == "status" then
        if WoWLookExport3DB.lastError then
            PrintWarn("最近错误: " .. tostring(WoWLookExport3DB.lastError))
        end
        local summary = WoWLookExport3DB.summary
        if summary then
            Print(string.format(
                "导出时间: %s | 地下城: %d | 团本: %d | 装备: %d | 最高档成功: %d | 失败: %d",
                summary.exportedAt or "?",
                summary.dungeonCount or 0,
                summary.raidCount or 0,
                summary.itemCount or 0,
                summary.maxVersionSuccessCount or 0,
                summary.maxVersionFailureCount or 0
            ))
        else
            Print("暂无导出记录。")
        end
    elseif cmd == "reset" then
        WoWLookExport3DB.payload = ""
        WoWLookExport3DB.summary = nil
        WoWLookExport3DB.lastError = nil
        Print("已清空导出缓存。/reload 后写盘。")
    else
        Print("/wowlook preflight  采集 S2 客户端事实和说明框证据")
        Print("/wowlook export     S2 规则确认前会拒绝最终导出")
        Print("/wowlook status  查看状态")
        Print("/wowlook reset   清空缓存")
    end
end

local function FormatSlashCommandError(err)
    local message = tostring(err)
    if type(debugstack) == "function" then
        message = message .. "\n" .. debugstack(2, 8, 8)
    end
    return message
end

SlashCmdList.WOWLOOKMAXEXPORT = function(msg)
    local ok, err = xpcall(function()
        HandleSlashCommand(msg)
    end, FormatSlashCommandError)
    if not ok then
        WoWLookExport3DB.lastError = err
        PrintWarn("指令执行失败: " .. tostring(err))
    end
end

Print("v" .. ADDON_VERSION .. " 已加载。请先输入 /wowlook preflight。")
