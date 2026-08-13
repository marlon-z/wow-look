local ADDON_NAME = ...
local ADDON_VERSION = "1.1.0-s2-client-discovery"

WoWLookTierExportDB = WoWLookTierExportDB or {
    version = ADDON_VERSION,
    summary = nil,
    classes = {},
    payload = "",
    lastError = nil,
}

WoWLookTierExportDB.version = ADDON_VERSION
WoWLookTierExportDB.classes = WoWLookTierExportDB.classes or {}
WoWLookTierExportDB.preflightItems = WoWLookTierExportDB.preflightItems or {}
WoWLookTierExportDB.discoveries = WoWLookTierExportDB.discoveries or {}

local REQUIRED_TIER_SLOTS = {
    INVTYPE_HEAD = "head",
    INVTYPE_SHOULDER = "shoulder",
    INVTYPE_CHEST = "chest",
    INVTYPE_WRIST = "wrist",
    INVTYPE_HAND = "hands",
    INVTYPE_WAIST = "waist",
    INVTYPE_LEGS = "legs",
    INVTYPE_FEET = "feet",
    INVTYPE_CLOAK = "back",
}

local REQUIRED_SLOT_ORDER = { "head", "shoulder", "chest", "wrist", "hands", "waist", "legs", "feet", "back" }

local TIER_SETS = {
    deathknight = {
        classId = 6,
        className = "Death Knight",
        classNameZh = "死亡骑士",
        setName = "Relentless Rider's Lament",
        bonusItemIds = { 249970, 249968, 249973, 249971, 249969 },
        appearanceItemIds = { 249965, 249966, 249967, 249972 },
        specs = {
            { specId = 250, specName = "鲜血" },
            { specId = 251, specName = "冰霜" },
            { specId = 252, specName = "邪恶" },
        },
    },
    demonhunter = {
        classId = 12,
        className = "Demon Hunter",
        classNameZh = "恶魔猎手",
        setName = "Devouring Reaver's Sheathe",
        bonusItemIds = { 250033, 250031, 250036, 250034, 250032 },
        appearanceItemIds = { 250028, 250029, 250030, 250035 },
        specs = {
            { specId = 577, specName = "浩劫" },
            { specId = 581, specName = "复仇" },
            { specId = 1480, specName = "噬灭" },
        },
    },
    druid = {
        classId = 11,
        className = "Druid",
        classNameZh = "德鲁伊",
        setName = "Sprouts of the Luminous Bloom",
        bonusItemIds = { 250024, 250022, 250027, 250025, 250023 },
        appearanceItemIds = { 250019, 250020, 250021, 250026 },
        specs = {
            { specId = 102, specName = "平衡" },
            { specId = 103, specName = "野性" },
            { specId = 104, specName = "守护" },
            { specId = 105, specName = "恢复" },
        },
    },
    evoker = {
        classId = 13,
        className = "Evoker",
        classNameZh = "唤魔师",
        setName = "Livery of the Black Talon",
        bonusItemIds = { 249997, 249995, 250000, 249998, 249996 },
        appearanceItemIds = { 249992, 249993, 249994, 249999 },
        specs = {
            { specId = 1467, specName = "湮灭" },
            { specId = 1468, specName = "恩护" },
            { specId = 1473, specName = "增辉" },
        },
    },
    hunter = {
        classId = 3,
        className = "Hunter",
        classNameZh = "猎人",
        setName = "Primal Sentry's Camouflage",
        bonusItemIds = { 249988, 249986, 249991, 249989, 249987 },
        appearanceItemIds = { 249983, 249984, 249985, 249990 },
        specs = {
            { specId = 253, specName = "野兽控制" },
            { specId = 254, specName = "射击" },
            { specId = 255, specName = "生存" },
        },
    },
    mage = {
        classId = 8,
        className = "Mage",
        classNameZh = "法师",
        setName = "Voidbreaker's Accordance",
        bonusItemIds = { 250060, 250058, 250063, 250061, 250059 },
        appearanceItemIds = { 250055, 250056, 250057, 250062 },
        specs = {
            { specId = 62, specName = "奥术" },
            { specId = 63, specName = "火焰" },
            { specId = 64, specName = "冰霜" },
        },
    },
    monk = {
        classId = 10,
        className = "Monk",
        classNameZh = "武僧",
        setName = "Way of Ra-den's Chosen",
        bonusItemIds = { 250015, 250013, 250018, 250016, 250014 },
        appearanceItemIds = { 250010, 250011, 250012, 250017 },
        specs = {
            { specId = 268, specName = "酒仙" },
            { specId = 269, specName = "踏风" },
            { specId = 270, specName = "织雾" },
        },
    },
    paladin = {
        classId = 2,
        className = "Paladin",
        classNameZh = "圣骑士",
        setName = "Luminant Verdict's Vestments",
        bonusItemIds = { 249961, 249959, 249964, 249962, 249960 },
        appearanceItemIds = { 249956, 249957, 249958, 249963 },
        specs = {
            { specId = 65, specName = "神圣" },
            { specId = 66, specName = "防护" },
            { specId = 70, specName = "惩戒" },
        },
    },
    priest = {
        classId = 5,
        className = "Priest",
        classNameZh = "牧师",
        setName = "Blind Oath's Burden",
        bonusItemIds = { 250051, 250049, 250054, 250052, 250050 },
        appearanceItemIds = { 250046, 250047, 250048, 250053 },
        specs = {
            { specId = 256, specName = "戒律" },
            { specId = 257, specName = "神圣" },
            { specId = 258, specName = "暗影" },
        },
    },
    rogue = {
        classId = 4,
        className = "Rogue",
        classNameZh = "潜行者",
        setName = "Motley of the Grim Jest",
        bonusItemIds = { 250006, 250004, 250009, 250007, 250005 },
        appearanceItemIds = { 250001, 250002, 250003, 250008 },
        specs = {
            { specId = 259, specName = "奇袭" },
            { specId = 260, specName = "狂徒" },
            { specId = 261, specName = "敏锐" },
        },
    },
    shaman = {
        classId = 7,
        className = "Shaman",
        classNameZh = "萨满祭司",
        setName = "Mantle of the Primal Core",
        bonusItemIds = { 249979, 249977, 249982, 249980, 249978 },
        appearanceItemIds = { 249974, 249975, 249976, 249981 },
        specs = {
            { specId = 262, specName = "元素" },
            { specId = 263, specName = "增强" },
            { specId = 264, specName = "恢复" },
        },
    },
    warlock = {
        classId = 9,
        className = "Warlock",
        classNameZh = "术士",
        setName = "Reign of the Abyssal Immolator",
        bonusItemIds = { 250042, 250040, 250045, 250043, 250041 },
        appearanceItemIds = { 250037, 250038, 250039, 250044 },
        specs = {
            { specId = 265, specName = "痛苦" },
            { specId = 266, specName = "恶魔学识" },
            { specId = 267, specName = "毁灭" },
        },
    },
    warrior = {
        classId = 1,
        className = "Warrior",
        classNameZh = "战士",
        setName = "Rage of the Night Ender",
        bonusItemIds = { 249952, 249950, 249955, 249953, 249951 },
        appearanceItemIds = { 249947, 249948, 249949, 249954 },
        specs = {
            { specId = 71, specName = "武器" },
            { specId = 72, specName = "狂怒" },
            { specId = 73, specName = "防护" },
        },
    },
}

local CLASS_ORDER = {
    "warrior", "paladin", "hunter", "rogue", "priest",
    "deathknight", "shaman", "mage", "warlock", "monk",
    "druid", "demonhunter", "evoker",
}

local function ApplySeasonTierManifest()
    local config = WoWLookTierSeasonConfig or {}
    for _, classKey in ipairs(CLASS_ORDER) do
        local setInfo = TIER_SETS[classKey]
        local itemIds = (config.tierItems or {})[classKey]
        local anchorIds = (config.tierAnchors or {})[classKey]
        if setInfo and type(itemIds) == "table" and #itemIds == 9 and type(anchorIds) == "table" and #anchorIds == 5 then
            setInfo.bonusItemIds = anchorIds
            setInfo.appearanceItemIds = {}
            for _, itemId in ipairs(itemIds) do
                local isAnchor = false
                for _, anchorId in ipairs(anchorIds) do
                    if anchorId == itemId then
                        isAnchor = true
                        break
                    end
                end
                if not isAnchor then
                    setInfo.appearanceItemIds[#setInfo.appearanceItemIds + 1] = itemId
                end
            end
        end
    end
end

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

local SLOT_TEXTS = {
    ["头部"] = "head",
    ["肩部"] = "shoulder",
    ["胸部"] = "chest",
    ["腕部"] = "wrist",
    ["手部"] = "hands",
    ["腰部"] = "waist",
    ["腿部"] = "legs",
    ["脚部"] = "feet",
    ["背部"] = "back",
}

local function Print(msg)
    print(string.format("|cff00ff88[WoWLookTierExport]|r %s", msg))
end

local function PrintWarn(msg)
    print(string.format("|cffff6600[WoWLookTierExport]|r %s", msg))
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
    local valueType = type(val)
    if val == nil then
        return "null"
    end
    if valueType == "boolean" then
        return val and "true" or "false"
    end
    if valueType == "number" then
        if val ~= val or val == math.huge or val == -math.huge then
            return "null"
        end
        return tostring(val)
    end
    if valueType == "string" then
        return "\"" .. jsonEscape(val) .. "\""
    end
    if valueType == "table" then
        local parts = {}
        if isSeqArray(val) then
            for index = 1, #val do
                parts[index] = jsonEncode(val[index])
            end
            return "[" .. table.concat(parts, ",") .. "]"
        end
        for key, value in pairs(val) do
            parts[#parts + 1] = "\"" .. jsonEscape(key) .. "\":" .. jsonEncode(value)
        end
        table.sort(parts)
        return "{" .. table.concat(parts, ",") .. "}"
    end
    return "null"
end

local function ValidateSeasonConfig()
    local config = WoWLookTierSeasonConfig
    if type(config) ~= "table"
        or type(config.profileVersion) ~= "number"
        or type(config.minimumBuild) ~= "number"
        or type(config.releaseStatus) ~= "string"
        or type(config.dataVersion) ~= "string" then
        return nil, "season_config_invalid"
    end

    local _, rawBuildNumber = GetBuildInfo()
    local buildNumber = tonumber(rawBuildNumber) or 0
    if buildNumber < config.minimumBuild then
        return nil, "season_build_too_old"
    end
    if config.releaseStatus ~= "finalized" then
        return config
    end
    if type(config.targetItemLevel) ~= "number"
        or type(config.trackBonusId) ~= "number"
        or type(config.qualityBonusId) ~= "number" then
        return nil, "season_final_rules_invalid"
    end
    if config.testedBuild and buildNumber ~= config.testedBuild then
        PrintWarn(string.format(
            "赛季配置测试版本为 %d，当前客户端为 %d；将继续导出，但必须检查289验证结果。",
            config.testedBuild,
            buildNumber
        ))
    end
    return config
end

local function BuildPreflightPayload()
    local config, configError = ValidateSeasonConfig()
    if not config then
        error(configError)
    end
    local buildVersion, rawBuildNumber = GetBuildInfo()
    local classes = {}
    for _, classKey in ipairs(CLASS_ORDER) do
        local setInfo = TIER_SETS[classKey]
        classes[#classes + 1] = {
            classKey = classKey,
            classId = setInfo.classId,
            className = setInfo.className,
            classNameZh = setInfo.classNameZh,
            specs = setInfo.specs,
            evidenceStatus = "needs_live_s2_item_links",
        }
    end
    return {
        mode = "preflight",
        dataVersion = config.dataVersion,
        seasonName = config.seasonName,
        clientBuild = tonumber(rawBuildNumber) or 0,
        build = buildVersion or "",
        addonVersion = ADDON_VERSION,
        locale = GetLocale(),
        exportedAt = date("%Y-%m-%d %H:%M:%S"),
        classes = classes,
        items = WoWLookTierExportDB.preflightItems or {},
        summary = {
            mode = "preflight",
            classCount = #classes,
            capturedItemCount = #WoWLookTierExportDB.preflightItems,
            note = "职业/专精结构已列出；S2 物品链接、说明框和2/4件效果必须用 capture 从客户端确认。",
        },
    }
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
    if not (C_Item and type(C_Item.GetDetailedItemLevelInfo) == "function") then
        return nil, nil
    end
    local ok, actualItemLevel, _, baseItemLevel = pcall(C_Item.GetDetailedItemLevelInfo, itemInfo)
    if not ok then
        return nil, nil
    end
    return actualItemLevel, baseItemLevel
end

local function BuildMaximumTierLink(itemId, config)
    local _, baseItemLevel = GetDetailedItemLevels(itemId)
    if not baseItemLevel or baseItemLevel <= 0 then
        return nil, "base_item_level_unavailable"
    end

    local levelDifference = config.targetItemLevel - baseItemLevel
    local levelBonusId = GetItemLevelBonusId(levelDifference)
    if levelDifference ~= 0 and not levelBonusId then
        return nil, "bonus_mapping_missing"
    end

    local bonusIds = {}
    if levelBonusId then
        bonusIds[#bonusIds + 1] = levelBonusId
    end
    bonusIds[#bonusIds + 1] = config.trackBonusId
    bonusIds[#bonusIds + 1] = config.qualityBonusId

    return string.format(
        "item:%d:%s:::%d:%d:::%d:%s",
        itemId,
        "::::",
        UnitLevel("player") or 90,
        0,
        #bonusIds,
        table.concat(bonusIds, ":")
    )
end

local function ExtractItemIdFromLink(link)
    if type(link) ~= "string" then
        return nil
    end
    return tonumber(link:match("item:(%d+)"))
end

local function LinkContainsBonusId(link, bonusId)
    if type(link) ~= "string" or not bonusId then
        return false
    end
    return string.find(link .. ":", ":" .. tostring(bonusId) .. ":", 1, true) ~= nil
end

local function ValidateMaximumTierItem(itemId, link, parsedTooltip, detailedItemLevel, config)
    if not link or not parsedTooltip or (parsedTooltip.itemLevel or 0) <= 0 then
        return "tooltip_unavailable"
    end
    if ExtractItemIdFromLink(link) ~= itemId then
        return "item_identity_mismatch"
    end
    if detailedItemLevel.effective > 0 and detailedItemLevel.effective ~= parsedTooltip.itemLevel then
        return "tooltip_api_item_level_mismatch"
    end
    if parsedTooltip.itemLevel ~= config.targetItemLevel then
        return "target_item_level_mismatch"
    end
    if config.expectedUpgradeTrack ~= ""
        and parsedTooltip.upgradeTrack ~= config.expectedUpgradeTrack then
        return "upgrade_track_mismatch"
    end
    if not LinkContainsBonusId(link, config.trackBonusId)
        or not LinkContainsBonusId(link, config.qualityBonusId) then
        return "required_bonus_missing"
    end
    return "ok"
end

local function BuildTipLines(tipData)
    if not tipData or not tipData.lines then
        return {}
    end

    local lines = {}
    for _, line in ipairs(tipData.lines) do
        local left = line.leftText or ""
        local right = line.rightText or ""
        if left ~= "" or right ~= "" then
            lines[#lines + 1] = { left = left, right = right }
        end
    end
    return lines
end

local function GetTooltipLines(link, classId, specId)
    if not (C_TooltipInfo and type(C_TooltipInfo.GetHyperlink) == "function") then
        return {}
    end

    local ok, tipData
    if classId and specId then
        ok, tipData = pcall(C_TooltipInfo.GetHyperlink, link, classId, specId)
    else
        ok, tipData = pcall(C_TooltipInfo.GetHyperlink, link)
    end

    if not ok then
        return {}
    end

    return BuildTipLines(tipData)
end

local function NormalizeStats(stats)
    local normalized = {}
    for statKey, value in pairs(stats or {}) do
        normalized[statKey] = value
    end
    return normalized
end

local function BuildStatList(stats, predicate)
    local list = {}
    for statKey, value in pairs(stats or {}) do
        if predicate(statKey) and value > 0 then
            list[#list + 1] = {
                key = statKey,
                name = STAT_NAMES[statKey] or statKey,
                value = value,
            }
        end
    end
    table.sort(list, function(a, b)
        if a.value == b.value then
            return a.key < b.key
        end
        return a.value > b.value
    end)
    return list
end

local function ParseTooltipLines(lines)
    local parsed = {
        itemLevel = 0,
        upgradeTrack = "",
        bindText = "",
        slotText = "",
        slotKey = "",
        armorType = "",
        white = {},
        stats = {},
        primaryStats = {},
        secondaryStats = {},
        stamina = nil,
        effects = {},
        useEffects = {},
        equipEffects = {},
        setData = {
            name = "",
            equippedCount = 0,
            totalCount = 0,
            pieces = {},
            bonuses = {},
        },
        flags = {
            uniqueEquipped = false,
            prismaticSocket = false,
        },
    }

    local inSetBlock = false
    for _, line in ipairs(lines) do
        local text = line.left or ""
        local right = line.right or ""

        local itemLevel = text:match("物品等级%s*(%d+)")
        if itemLevel then
            parsed.itemLevel = tonumber(itemLevel)
        end

        local upgradeTrack = text:match("^升级：(.+)$")
        if upgradeTrack then
            parsed.upgradeTrack = upgradeTrack
        end

        if text == "拾取后绑定" or text == "装备后绑定" then
            parsed.bindText = text
        end

        if SLOT_TEXTS[text] then
            parsed.slotText = text
            parsed.slotKey = SLOT_TEXTS[text]
        elseif SLOT_TEXTS[right] then
            parsed.slotText = text
            parsed.slotKey = SLOT_TEXTS[text] or ""
            parsed.armorType = right
        end

        if text == "布甲" or text == "皮甲" or text == "锁甲" or text == "板甲" then
            parsed.armorType = text
        end

        local armorValue = text:match("^(%d+)点护甲$")
        if armorValue then
            parsed.white.armor = tonumber(armorValue)
        end

        local statValue, statName = text:match("^%+(%d+)%s*(.+)$")
        if statValue and statName then
            local statKey = STAT_LABELS[statName]
            if statKey then
                parsed.stats[statKey] = tonumber(statValue)
            end
        end

        if text:match("^唯一装备") then
            parsed.flags.uniqueEquipped = true
        end
        if text:match("棱彩插槽") then
            parsed.flags.prismaticSocket = true
        end

        if text:match("^使用：") then
            parsed.useEffects[#parsed.useEffects + 1] = text:gsub("^使用：", "", 1)
        elseif text:match("^装备：") then
            parsed.equipEffects[#parsed.equipEffects + 1] = text:gsub("^装备：", "", 1)
        end

        local setName, equippedCount, totalCount = text:match("^(.+)（(%d+)\/(%d+)）$")
        if setName then
            parsed.setData.name = setName
            parsed.setData.equippedCount = tonumber(equippedCount) or 0
            parsed.setData.totalCount = tonumber(totalCount) or 0
            inSetBlock = true
        elseif inSetBlock and text:match("^  ") then
            parsed.setData.pieces[#parsed.setData.pieces + 1] = text:gsub("^%s+", "", 1)
        else
            local piecesNeeded, bonusText = text:match("^%((%d+)%)%s*套装：(.+)$")
            if piecesNeeded and bonusText then
                parsed.setData.bonuses[#parsed.setData.bonuses + 1] = {
                    pieces = tonumber(piecesNeeded),
                    text = bonusText,
                }
            elseif inSetBlock and text ~= "" and text ~= " " then
                inSetBlock = false
            end
        end
    end

    parsed.primaryStats = BuildStatList(parsed.stats, function(statKey)
        return PRIMARY_STAT_KEYS[statKey] == true
    end)
    parsed.secondaryStats = BuildStatList(parsed.stats, function(statKey)
        return SECONDARY_STAT_KEYS[statKey] == true
    end)

    if parsed.stats.stamina then
        parsed.stamina = {
            key = "stamina",
            name = STAT_NAMES.stamina,
            value = parsed.stats.stamina,
        }
    end

    return parsed
end

local function ResolveSpecBonusSpells(itemId, specId)
    local result = {
        raw = {},
        resolved = {},
    }

    if not (C_Item and type(C_Item.GetSetBonusesForSpecializationByItemID) == "function") then
        return result
    end

    local ok, spellIds = pcall(C_Item.GetSetBonusesForSpecializationByItemID, specId, itemId)
    if not ok or type(spellIds) ~= "table" then
        return result
    end

    for _, spellId in ipairs(spellIds) do
        result.raw[#result.raw + 1] = spellId
        local spellName = ""
        local spellIcon = 0
        if C_Spell and type(C_Spell.GetSpellInfo) == "function" then
            local info = C_Spell.GetSpellInfo(spellId)
            if type(info) == "table" then
                spellName = info.name or ""
                spellIcon = info.iconID or 0
            end
        end
        local description = ""
        if C_Spell and type(C_Spell.GetSpellDescription) == "function" then
            description = C_Spell.GetSpellDescription(spellId) or ""
        end
        result.resolved[#result.resolved + 1] = {
            spellId = spellId,
            name = spellName,
            icon = spellIcon,
            description = description,
        }
    end

    return result
end

local function GetSetInfoSafe(setId)
    if not (setId and setId > 0 and C_Item and type(C_Item.GetItemSetInfo) == "function") then
        return {}
    end

    local ok, info = pcall(C_Item.GetItemSetInfo, setId)
    if not ok then
        return {}
    end

    if type(info) == "table" then
        return info
    end

    return { raw = info }
end

local function BuildSpecBonusRecords(itemId, seasonLink, classId, specs)
    local results = {}
    local matchCount = 0

    for _, spec in ipairs(specs) do
        local tooltipLines = GetTooltipLines(seasonLink, classId, spec.specId)
        local parsedTooltip = ParseTooltipLines(tooltipLines)
        local spellData = ResolveSpecBonusSpells(itemId, spec.specId)

        if #spellData.raw > 0 or #parsedTooltip.setData.bonuses > 0 then
            results[tostring(spec.specId)] = {
                specId = spec.specId,
                specName = spec.specName,
                tooltip = {
                    rawLines = tooltipLines,
                    parsed = parsedTooltip,
                },
                spells = spellData,
            }
            matchCount = matchCount + 1
        end
    end

    return results, matchCount
end

local function HasText(value)
    return type(value) == "string" and value:match("%S") ~= nil
end

local function TableContains(values, expected)
    for _, value in ipairs(values or {}) do
        if value == expected then
            return true
        end
    end
    return false
end

local function SortedNumericKeys(values)
    local result = {}
    for key in pairs(values or {}) do
        if type(key) == "number" then
            result[#result + 1] = key
        end
    end
    table.sort(result)
    return result
end

local function GetTransmogSourceIdForItem(itemId)
    if not (C_TransmogCollection and type(C_TransmogCollection.GetItemInfo) == "function") then
        return nil, "transmog_item_api_unavailable"
    end
    local ok, _, sourceId = pcall(C_TransmogCollection.GetItemInfo, itemId)
    if not ok or not sourceId or sourceId <= 0 then
        return nil, "transmog_source_unavailable"
    end
    return sourceId
end

local function GetItemIdForTransmogSource(sourceId)
    if not (C_TransmogCollection and type(C_TransmogCollection.GetSourceItemID) == "function") then
        return nil, "transmog_source_item_api_unavailable"
    end
    local ok, itemId = pcall(C_TransmogCollection.GetSourceItemID, sourceId)
    if not ok or not itemId or itemId <= 0 then
        return nil, "transmog_source_item_unavailable"
    end
    return itemId
end

local function GetSharedSetIdsForAnchors(anchorIds)
    if not (C_TransmogSets and type(C_TransmogSets.GetSetsContainingSourceID) == "function") then
        return nil, nil, "transmog_sets_api_unavailable"
    end

    local anchorSources = {}
    local candidates = nil
    for _, itemId in ipairs(anchorIds or {}) do
        local sourceId, sourceError = GetTransmogSourceIdForItem(itemId)
        if not sourceId then
            return nil, nil, string.format("anchor_%d_%s", itemId, sourceError)
        end
        anchorSources[#anchorSources + 1] = sourceId
        local ok, setIds = pcall(C_TransmogSets.GetSetsContainingSourceID, sourceId)
        if not ok or type(setIds) ~= "table" then
            return nil, nil, string.format("anchor_%d_set_missing", itemId)
        end
        local current = {}
        for key, value in pairs(setIds) do
            local setId = type(value) == "number" and value or (type(key) == "number" and key or nil)
            if setId and setId > 0 then
                current[setId] = true
            end
        end
        if not next(current) then
            return nil, nil, string.format("anchor_%d_set_missing", itemId)
        end
        if not candidates then
            candidates = current
        else
            for setId in pairs(candidates) do
                if not current[setId] then
                    candidates[setId] = nil
                end
            end
        end
    end

    local resolvedCandidates = SortedNumericKeys(candidates)
    if #resolvedCandidates == 0 then
        return nil, anchorSources, "no_shared_transmog_set"
    end
    if #resolvedCandidates > 1 then
        return nil, anchorSources, "ambiguous_transmog_set_" .. table.concat(resolvedCandidates, "_")
    end
    return resolvedCandidates[1], anchorSources
end

local function DiscoverTierSet(classKey)
    local config = WoWLookTierSeasonConfig or {}
    local anchors = (config.tierAnchors or {})[classKey]
    if type(anchors) ~= "table" or #anchors ~= 5 then
        return { classKey = classKey, status = "anchor_config_invalid", items = {} }
    end

    local setId, anchorSources, setError = GetSharedSetIdsForAnchors(anchors)
    if not setId then
        return { classKey = classKey, status = setError, anchorItemIds = anchors, anchorSourceIds = anchorSources or {}, items = {} }
    end
    if not (C_TransmogSets and type(C_TransmogSets.GetAllSourceIDs) == "function") then
        return { classKey = classKey, status = "transmog_set_sources_api_unavailable", anchorItemIds = anchors, anchorSourceIds = anchorSources, transmogSetId = setId, items = {} }
    end

    local ok, sourceIds = pcall(C_TransmogSets.GetAllSourceIDs, setId)
    if not ok or type(sourceIds) ~= "table" then
        return { classKey = classKey, status = "transmog_set_sources_unavailable", anchorItemIds = anchors, anchorSourceIds = anchorSources, transmogSetId = setId, items = {} }
    end

    local records, unresolved, pendingItemIds, bySlot, seenItems, seenSources = {}, {}, {}, {}, {}, {}
    for key, value in pairs(sourceIds) do
        local sourceId = type(value) == "number" and value or (type(key) == "number" and key or nil)
        if sourceId and sourceId > 0 then
        local itemId, itemError = GetItemIdForTransmogSource(sourceId)
        if not itemId then
            unresolved[#unresolved + 1] = { sourceId = sourceId, reason = itemError }
        elseif not seenItems[itemId] and not seenSources[sourceId] then
            local _, _, _, _, _, _, _, _, equipLoc = GetItemInfo(itemId)
            if not equipLoc and C_Item and type(C_Item.RequestLoadItemDataByID) == "function" then
                C_Item.RequestLoadItemDataByID(itemId)
                pendingItemIds[#pendingItemIds + 1] = itemId
            end
            local slotKey = REQUIRED_TIER_SLOTS[equipLoc]
            if slotKey then
                local record = { itemId = itemId, sourceId = sourceId, slotKey = slotKey }
                if bySlot[slotKey] then
                    unresolved[#unresolved + 1] = { sourceId = sourceId, itemId = itemId, reason = "duplicate_slot_" .. slotKey }
                else
                    records[#records + 1] = record
                    bySlot[slotKey] = record
                    seenItems[itemId] = true
                    seenSources[sourceId] = true
                end
            end
        end
        end
    end

    local missingSlots, missingAnchors = {}, {}
    for _, slotKey in ipairs(REQUIRED_SLOT_ORDER) do
        if not bySlot[slotKey] then
            missingSlots[#missingSlots + 1] = slotKey
        end
    end
    for _, anchorId in ipairs(anchors) do
        if not seenItems[anchorId] then
            missingAnchors[#missingAnchors + 1] = anchorId
        end
    end
    table.sort(records, function(a, b) return a.slotKey < b.slotKey end)

    local status = "ok"
    if #pendingItemIds > 0 then
        status = "item_data_pending"
    elseif #unresolved > 0 then
        status = "source_resolution_incomplete"
    elseif #missingSlots > 0 then
        status = "required_slots_missing"
    elseif #missingAnchors > 0 then
        status = "anchors_not_in_discovered_set"
    elseif #records ~= 9 then
        status = "item_count_not_nine"
    end
    local _, buildNumber = GetBuildInfo()
    return {
        classKey = classKey,
        status = status,
        clientBuild = tonumber(buildNumber) or 0,
        transmogSetId = setId,
        anchorItemIds = anchors,
        anchorSourceIds = anchorSources,
        items = records,
        unresolved = unresolved,
        pendingItemIds = pendingItemIds,
        missingSlots = missingSlots,
        missingAnchors = missingAnchors,
    }
end

local function CountMissingBonusTexts(payload)
    local missingCount = 0

    for _, classData in ipairs(payload.classes or {}) do
        for _, item in ipairs(classData.items or {}) do
            for _, specEntry in pairs(item.bonusesBySpec or {}) do
                local tooltipBonuses = (((specEntry or {}).tooltip or {}).parsed or {}).setData
                tooltipBonuses = tooltipBonuses and tooltipBonuses.bonuses or {}

                local hasTooltipBonusText = false
                for _, bonus in ipairs(tooltipBonuses) do
                    if HasText(bonus.text) then
                        hasTooltipBonusText = true
                        break
                    end
                end

                local resolvedSpells = (((specEntry or {}).spells or {}).resolved or {})
                local hasSpellDescription = false
                for _, spell in ipairs(resolvedSpells) do
                    if HasText(spell.description) then
                        hasSpellDescription = true
                        break
                    end
                end

                local rawSpells = (((specEntry or {}).spells or {}).raw or {})
                if #rawSpells > 0 and not hasTooltipBonusText and not hasSpellDescription then
                    missingCount = missingCount + 1
                end
            end
        end
    end

    return missingCount
end

local function CountMissingItemData(payload)
    local missingCount = 0

    for _, classData in ipairs(payload.classes or {}) do
        for _, item in ipairs(classData.items or {}) do
            if not HasText(item.name) or not item.icon or item.icon == 0
                or item.maximumStatus ~= "ok" then
                missingCount = missingCount + 1
                if C_Item and type(C_Item.RequestLoadItemDataByID) == "function" and item.itemId then
                    C_Item.RequestLoadItemDataByID(item.itemId)
                end
            end
        end
    end

    return missingCount
end

local function ProbeItem(itemId, classKey, setInfo, options)
    options = options or {}
    local maximumConfig = options.maximumConfig or WoWLookTierSeasonConfig
    local seasonLink, buildStatus = BuildMaximumTierLink(itemId, maximumConfig)
    local name, baseLink, quality, _, minLevel, itemType, itemSubType,
        stackCount, equipLoc, icon, sellPrice, itemClassId, itemSubclassId, bindType, expacId, setId =
        GetItemInfo(itemId)
    if not name and C_Item and type(C_Item.RequestLoadItemDataByID) == "function" then
        C_Item.RequestLoadItemDataByID(itemId)
    end

    local tooltipLines = GetTooltipLines(seasonLink)
    local parsedTooltip = ParseTooltipLines(tooltipLines)
    local detailedItemLevel = {}
    if seasonLink and C_Item and type(C_Item.GetDetailedItemLevelInfo) == "function" then
        local effective, preview, sparse = C_Item.GetDetailedItemLevelInfo(seasonLink)
        detailedItemLevel = {
            effective = effective or 0,
            preview = preview or false,
            sparse = sparse or 0,
        }
    end
    local maximumStatus = buildStatus
        or ValidateMaximumTierItem(itemId, seasonLink, parsedTooltip, detailedItemLevel, maximumConfig)

    local specBonuses = {}
    local bonusSpecCount = 0
    if options.includeSpecBonuses ~= false then
        specBonuses, bonusSpecCount = BuildSpecBonusRecords(itemId, seasonLink, setInfo.classId, setInfo.specs)
    end
    local setInfoRaw = GetSetInfoSafe(setId)

    return {
        itemId = itemId,
        classKey = classKey,
        seasonLink = seasonLink,
        baseLink = baseLink or "",
        name = name or "",
        quality = quality or 0,
        minLevel = minLevel or 0,
        itemType = itemType or "",
        itemSubType = itemSubType or "",
        stackCount = stackCount or 0,
        equipLoc = equipLoc or "",
        icon = icon or 0,
        sellPrice = sellPrice or 0,
        itemClassId = itemClassId or 0,
        itemSubclassId = itemSubclassId or 0,
        bindType = bindType or 0,
        expacId = expacId or 0,
        setId = setId or 0,
        setInfoRaw = setInfoRaw,
        collectionKind = options.collectionKind or "bonus",
        isBonusPiece = options.isBonusPiece ~= false,
        appearance = options.appearance,
        maximumStatus = maximumStatus,
        expectedItemLevel = maximumConfig.targetItemLevel,
        itemLevel = parsedTooltip.itemLevel or 0,
        detailedItemLevel = detailedItemLevel,
        tooltip = {
            rawLines = tooltipLines,
            parsed = parsedTooltip,
        },
        bonusSpecCount = bonusSpecCount,
        bonusesBySpec = specBonuses,
    }
end

local function BuildClassExport(classKey, maximumConfig)
    local setInfo = TIER_SETS[classKey]
    if not setInfo then
        return nil
    end

    local items = {}
    local bonusSpecMatches = 0
    local bonusItemIds = setInfo.bonusItemIds or {}
    local appearanceItemIds = setInfo.appearanceItemIds or {}

    for _, itemId in ipairs(bonusItemIds) do
        local itemRecord = ProbeItem(itemId, classKey, setInfo, {
            collectionKind = "bonus",
            isBonusPiece = true,
            maximumConfig = maximumConfig,
        })
        items[#items + 1] = itemRecord
        bonusSpecMatches = bonusSpecMatches + (itemRecord.bonusSpecCount or 0)
    end

    local localizedSetName = ""
    for _, itemRecord in ipairs(items) do
        localizedSetName = (((itemRecord.tooltip or {}).parsed or {}).setData or {}).name or ""
        if HasText(localizedSetName) then
            break
        end
    end

    for _, itemId in ipairs(appearanceItemIds) do
        local itemRecord = ProbeItem(itemId, classKey, setInfo, {
            includeSpecBonuses = false,
            collectionKind = "companion",
            isBonusPiece = false,
            maximumConfig = maximumConfig,
        })
        items[#items + 1] = itemRecord
    end

    local maximumSuccessCount = 0
    local maximumFailures = {}
    for _, item in ipairs(items) do
        if item.maximumStatus == "ok" then
            maximumSuccessCount = maximumSuccessCount + 1
        else
            maximumFailures[#maximumFailures + 1] = {
                itemId = item.itemId,
                status = item.maximumStatus or "unknown",
                actualItemLevel = item.itemLevel or 0,
                expectedItemLevel = maximumConfig.targetItemLevel,
            }
        end
    end

    return {
        classKey = classKey,
        classId = setInfo.classId,
        className = setInfo.className,
        classNameZh = setInfo.classNameZh,
        setName = setInfo.setName,
        specs = setInfo.specs,
        itemCount = #items,
        bonusItemCount = #bonusItemIds,
        appearanceItemCount = #items,
        extraAppearanceItemCount = #appearanceItemIds,
        bonusSpecMatches = bonusSpecMatches,
        maximumSuccessCount = maximumSuccessCount,
        maximumFailureCount = #maximumFailures,
        maximumFailures = maximumFailures,
        transmogSet = {
            setID = 0,
            name = localizedSetName or "",
            description = "",
            label = "",
            localizedItemSetName = localizedSetName or "",
            warnings = {},
        },
        items = items,
    }
end

local function BuildExportPayload(classKeys)
    local maximumConfig, configError = ValidateSeasonConfig()
    if not maximumConfig then
        error(configError)
    end
    local buildVersion, rawBuildNumber = GetBuildInfo()
    local classes = {}
    local summary = {
        exportedAt = date("%Y-%m-%d %H:%M:%S"),
        classCount = 0,
        itemCount = 0,
        bonusItemCount = 0,
        appearanceItemCount = 0,
        extraAppearanceItemCount = 0,
        bonusSpecMatches = 0,
        maximumSuccessCount = 0,
        maximumFailureCount = 0,
        maximumFailures = {},
        targetItemLevel = maximumConfig.targetItemLevel,
        build = buildVersion or "",
        buildNumber = tonumber(rawBuildNumber) or 0,
        mode = (#classKeys == #CLASS_ORDER) and "all" or "partial",
    }

    for _, classKey in ipairs(classKeys) do
        local classData = BuildClassExport(classKey, maximumConfig)
        if classData then
            classes[#classes + 1] = classData
            WoWLookTierExportDB.classes[classKey] = classData
            summary.classCount = summary.classCount + 1
            summary.itemCount = summary.itemCount + classData.itemCount
            summary.bonusItemCount = summary.bonusItemCount + (classData.bonusItemCount or 0)
            summary.appearanceItemCount = summary.appearanceItemCount + (classData.appearanceItemCount or 0)
            summary.extraAppearanceItemCount = summary.extraAppearanceItemCount + (classData.extraAppearanceItemCount or 0)
            summary.bonusSpecMatches = summary.bonusSpecMatches + classData.bonusSpecMatches
            summary.maximumSuccessCount = summary.maximumSuccessCount + (classData.maximumSuccessCount or 0)
            summary.maximumFailureCount = summary.maximumFailureCount + (classData.maximumFailureCount or 0)
            for _, failure in ipairs(classData.maximumFailures or {}) do
                summary.maximumFailures[#summary.maximumFailures + 1] = failure
            end
        end
    end

    local payload = {
        addonVersion = ADDON_VERSION,
        locale = GetLocale(),
        player = {
            name = UnitName("player") or "",
            realm = GetRealmName() or "",
            level = UnitLevel("player") or 0,
            classId = select(3, UnitClass("player")) or 0,
            classFile = select(2, UnitClass("player")) or "",
            specId = GetSpecializationInfo(GetSpecialization() or 0) or 0,
        },
        summary = summary,
        maximumProfile = {
            profileVersion = maximumConfig.profileVersion,
            seasonId = maximumConfig.seasonId,
            seasonName = maximumConfig.seasonName,
            testedBuild = maximumConfig.testedBuild,
            targetItemLevel = maximumConfig.targetItemLevel,
            track = maximumConfig.track,
            rank = maximumConfig.rank,
            trackBonusId = maximumConfig.trackBonusId,
            qualityBonusId = maximumConfig.qualityBonusId,
        },
        classes = classes,
    }

    return payload, summary
end

local function RequestLoadForClassKeys(classKeys)
    if not (C_Item and type(C_Item.RequestLoadItemDataByID) == "function") then
        return
    end

    for _, classKey in ipairs(classKeys) do
        local setInfo = TIER_SETS[classKey]
        if setInfo then
            local discovery = WoWLookTierExportDB.discoveries[classKey]
            for _, item in ipairs(discovery and discovery.items or {}) do
                local itemId = item.itemId
                if itemId then
                    C_Item.RequestLoadItemDataByID(itemId)
                end
            end
            for _, itemId in ipairs(setInfo.bonusItemIds or {}) do
                C_Item.RequestLoadItemDataByID(itemId)
            end
        end
    end
end

local function NormalizeClassKeys(arg)
    if arg == "" or arg == "all" then
        return CLASS_ORDER
    end

    local result = {}
    for classKey in string.gmatch(arg, "[^,%s]+") do
        if TIER_SETS[classKey] then
            result[#result + 1] = classKey
        else
            return nil, classKey
        end
    end

    if #result == 0 then
        return nil, arg
    end

    return result
end

local function ResetExportDB()
    WoWLookTierExportDB = {
        version = ADDON_VERSION,
        summary = nil,
        classes = {},
        preflightItems = {},
        discoveries = {},
        payload = "",
        lastError = nil,
    }
end

local function ProbeItemRaw(itemId, classKey, setInfo, discoveryItem)
    local name, baseLink, quality, _, minLevel, itemType, itemSubType,
        stackCount, equipLoc, icon, sellPrice, itemClassId, itemSubclassId, bindType, expacId, setId =
        GetItemInfo(itemId)
    if not name and C_Item and type(C_Item.RequestLoadItemDataByID) == "function" then
        C_Item.RequestLoadItemDataByID(itemId)
    end
    local link = baseLink or string.format("item:%d", itemId)
    local tooltipLines = GetTooltipLines(link)
    local parsedTooltip = ParseTooltipLines(tooltipLines)
    local isBonusPiece = TableContains((WoWLookTierSeasonConfig.tierAnchors or {})[classKey], itemId)
    local specBonuses, bonusSpecCount = {}, 0
    if isBonusPiece then
        specBonuses, bonusSpecCount = BuildSpecBonusRecords(itemId, link, setInfo.classId, setInfo.specs)
    end
    return {
        itemId = itemId,
        classKey = classKey,
        seasonLink = link,
        baseLink = baseLink or "",
        name = name or "",
        quality = quality or 0,
        minLevel = minLevel or 0,
        itemType = itemType or "",
        itemSubType = itemSubType or "",
        stackCount = stackCount or 0,
        equipLoc = equipLoc or "",
        icon = icon or 0,
        sellPrice = sellPrice or 0,
        itemClassId = itemClassId or 0,
        itemSubclassId = itemSubclassId or 0,
        bindType = bindType or 0,
        expacId = expacId or 0,
        setId = setId or 0,
        setInfoRaw = GetSetInfoSafe(setId),
        collectionKind = isBonusPiece and "bonus" or "companion",
        isBonusPiece = isBonusPiece,
        appearance = {
            transmogSetId = discoveryItem.transmogSetId,
            sourceId = discoveryItem.sourceId,
            slotKey = discoveryItem.slotKey,
        },
        captureStatus = (HasText(name) and #tooltipLines > 0) and "ok" or "item_data_pending",
        itemLevel = parsedTooltip.itemLevel or 0,
        tooltip = { rawLines = tooltipLines, parsed = parsedTooltip },
        bonusSpecCount = bonusSpecCount,
        bonusesBySpec = specBonuses,
    }
end

local function BuildClassPreflightExport(classKey)
    local setInfo = TIER_SETS[classKey]
    local discovery = WoWLookTierExportDB.discoveries[classKey]
    if not setInfo or not discovery or discovery.status ~= "ok" then
        return nil, discovery and discovery.status or "discovery_missing"
    end
    local items, pending, bonusSpecMatches = {}, 0, 0
    for _, discoveryItem in ipairs(discovery.items or {}) do
        discoveryItem.transmogSetId = discovery.transmogSetId
        local item = ProbeItemRaw(discoveryItem.itemId, classKey, setInfo, discoveryItem)
        items[#items + 1] = item
        bonusSpecMatches = bonusSpecMatches + (item.bonusSpecCount or 0)
        if item.captureStatus ~= "ok" then
            pending = pending + 1
        end
    end
    if #items ~= 9 then
        return nil, "discovered_item_count_not_nine"
    end
    return {
        classKey = classKey,
        classId = setInfo.classId,
        className = setInfo.className,
        classNameZh = setInfo.classNameZh,
        setName = "",
        specs = setInfo.specs,
        itemCount = #items,
        bonusItemCount = 5,
        appearanceItemCount = #items,
        extraAppearanceItemCount = 4,
        bonusSpecMatches = bonusSpecMatches,
        rawCapturePendingCount = pending,
        transmogSet = { setID = discovery.transmogSetId, name = "", description = "", label = "", localizedItemSetName = "", warnings = discovery.unresolved or {} },
        items = items,
    }
end

local function BuildPreflightEquipmentPayload(classKeys)
    local buildVersion, rawBuildNumber = GetBuildInfo()
    local classes, failures, pending = {}, {}, 0
    for _, classKey in ipairs(classKeys) do
        local classData, failure = BuildClassPreflightExport(classKey)
        if not classData then
            failures[#failures + 1] = { classKey = classKey, reason = failure }
        else
            classes[#classes + 1] = classData
            pending = pending + (classData.rawCapturePendingCount or 0)
        end
    end
    return {
        addonVersion = ADDON_VERSION,
        mode = "preflight_equipment",
        dataVersion = WoWLookTierSeasonConfig.dataVersion,
        releaseStatus = "preflight_raw_client_items",
        equipmentVariant = "drop_version",
        clientBuild = tonumber(rawBuildNumber) or 0,
        build = buildVersion or "",
        classes = classes,
        summary = { mode = "preflight_equipment", classCount = #classes, itemCount = #classes * 9, rawCapturePendingCount = pending, failures = failures },
    }
end

local function CapturePreflightItem(link)
    local itemId = ExtractItemIdFromLink(link)
    if not itemId then
        return false, "请在命令后 Shift 点击一件 S2 套装物品链接"
    end
    local tooltipLines = GetTooltipLines(link)
    local parsedTooltip = ParseTooltipLines(tooltipLines)
    if #tooltipLines == 0 or (parsedTooltip.itemLevel or 0) <= 0 then
        return false, "物品说明框尚未加载；请等待后再次 Shift 点击链接"
    end
    local name, normalizedLink, quality, _, _, itemType, itemSubType, _, equipLoc, icon = GetItemInfo(link)
    local _, rawBuildNumber = GetBuildInfo()
    local record = {
        itemId = itemId,
        rawLink = normalizedLink or link,
        name = name or "",
        quality = quality or 0,
        itemType = itemType or "",
        itemSubType = itemSubType or "",
        equipLoc = equipLoc or "",
        icon = icon or 0,
        tooltipItemLevel = parsedTooltip.itemLevel or 0,
        upgradeTrack = parsedTooltip.upgradeTrack or "",
        setData = parsedTooltip.setData or {},
        tooltipRaw = tooltipLines,
        clientBuild = tonumber(rawBuildNumber) or 0,
        capturedAt = date("!%Y-%m-%dT%H:%M:%SZ"),
    }
    local replaced = false
    for index, existing in ipairs(WoWLookTierExportDB.preflightItems) do
        if existing.itemId == itemId then
            WoWLookTierExportDB.preflightItems[index] = record
            replaced = true
            break
        end
    end
    if not replaced then
        WoWLookTierExportDB.preflightItems[#WoWLookTierExportDB.preflightItems + 1] = record
    end
    WoWLookTierExportDB.lastError = nil
    return true, record
end

local function StartExport(classKeys)
    if WoWLookTierSeasonConfig.releaseStatus ~= "finalized" then
        WoWLookTierExportDB.lastError = "final_export_blocked_until_manifest_finalized"
        PrintWarn("S2 最终套装规则尚未确认。请先运行 /wowtierexport preflight。")
        return
    end
    RequestLoadForClassKeys(classKeys)
    Print(string.format("预加载 %d 个职业套装，3秒后开始导出。", #classKeys))

    local maxAttempts = 6

    local function RunAttempt(attempt)
        local ok, payload, summary = pcall(BuildExportPayload, classKeys)
        if not ok then
            WoWLookTierExportDB.lastError = payload
            PrintWarn("导出失败: " .. tostring(payload))
            return
        end

        local missingTexts = CountMissingBonusTexts(payload)
        local missingItems = CountMissingItemData(payload)
        if (missingTexts > 0 or missingItems > 0) and attempt < maxAttempts then
            Print(string.format("第 %d/%d 次导出检测到 %d 条套装效果正文、%d 件物品数据未就绪，1秒后重试。",
                attempt, maxAttempts, missingTexts, missingItems))
            C_Timer.After(1, function()
                RunAttempt(attempt + 1)
            end)
            return
        end

        ResetExportDB()
        WoWLookTierExportDB.summary = summary
        WoWLookTierExportDB.payload = jsonEncode(payload)
        WoWLookTierExportDB.lastError = nil

        if missingTexts > 0 then
            PrintWarn(string.format("导出完成，但仍有 %d 条套装效果正文为空。", missingTexts))
        end
        if missingItems > 0 then
            PrintWarn(string.format("导出完成，但仍有 %d 件物品未通过289验证；不要发布这份数据。", missingItems))
        end
        Print(string.format("导出完成: %d 职业, %d 件装备（%d 件特效套装，额外 %d 件外观）, %d 组专精效果；289成功 %d，失败 %d。",
            summary.classCount or 0,
            summary.itemCount or 0,
            summary.bonusItemCount or 0,
            summary.extraAppearanceItemCount or 0,
            summary.bonusSpecMatches or 0,
            summary.maximumSuccessCount or 0,
            summary.maximumFailureCount or 0))
        Print("数据已保存到 SavedVariables/WoWLookTierExport.lua")
        Print("请 /reload 后到 WTF 目录查看。")
    end

    C_Timer.After(3, function()
        RunAttempt(1)
    end)
end

local function StartExportSafely(classKeys)
    local ok, err = pcall(StartExport, classKeys)
    if not ok then
        WoWLookTierExportDB.lastError = "final_export_start_error: " .. tostring(err)
        PrintWarn("满级采集启动失败：" .. tostring(err))
    end
end

local function StartDiscovery(classKeys)
    local config, configError = ValidateSeasonConfig()
    if not config then
        PrintWarn("S2 套装发现失败: " .. tostring(configError))
        return
    end
    local maxAttempts = 8
    local function RunAttempt(attempt)
        local ready, pending = 0, 0
        for _, classKey in ipairs(classKeys) do
            local ok, result = pcall(DiscoverTierSet, classKey)
            if not ok then
                result = { classKey = classKey, status = "discovery_lua_error_" .. tostring(result), items = {} }
                PrintWarn(string.format("%s 套装发现异常：%s", classKey, tostring(result.status)))
            end
            WoWLookTierExportDB.discoveries[classKey] = result
            if result.status == "ok" then
                ready = ready + 1
            elseif result.status == "item_data_pending" then
                pending = pending + 1
            end
        end
        if pending > 0 and attempt < maxAttempts then
            Print(string.format("套装 ID 发现第 %d/%d 次：%d 个职业等待物品缓存，1 秒后重试。", attempt, maxAttempts, pending))
            C_Timer.After(1, function() RunAttempt(attempt + 1) end)
            return
        end
        local _, buildNumber = GetBuildInfo()
        WoWLookTierExportDB.discoveryBuild = tonumber(buildNumber) or 0
        WoWLookTierExportDB.lastError = ready == #classKeys and nil or "tier_discovery_incomplete"
        Print(string.format("S2 套装 ID 发现完成：%d/%d 个职业各 9 件。使用 /wowtierexport status 查看失败原因。", ready, #classKeys))
        Print("成功后运行 /wowtierexport export-preflight 采集完整客户端装备信息。")
    end
    Print(string.format("开始发现 %d 个职业的 S2 九件套 ID。", #classKeys))
    RunAttempt(1)
end

local function StartPreflightEquipmentExport(classKeys)
    RequestLoadForClassKeys(classKeys)
    local maxAttempts = 8
    local function RunAttempt(attempt)
        local payload = BuildPreflightEquipmentPayload(classKeys)
        local pending = payload.summary.rawCapturePendingCount or 0
        if pending > 0 and attempt < maxAttempts then
            Print(string.format("客户端套装信息第 %d/%d 次采集仍有 %d 件未加载，1 秒后重试。", attempt, maxAttempts, pending))
            C_Timer.After(1, function() RunAttempt(attempt + 1) end)
            return
        end
        WoWLookTierExportDB.payload = jsonEncode(payload)
        WoWLookTierExportDB.summary = payload.summary
        WoWLookTierExportDB.lastError = (#(payload.summary.failures or {}) > 0 or pending > 0) and "preflight_equipment_incomplete" or nil
        Print(string.format("S2 套装预检装备导出完成：%d 个职业，%d 件完整装备记录，待加载 %d，失败职业 %d。",
            payload.summary.classCount or 0, payload.summary.itemCount or 0, pending, #(payload.summary.failures or {})))
        Print("数据已保存到 SavedVariables/WoWLookTierExport.lua；该数据仍不是最高装等正式版。")
    end
    Print("开始读取已发现的套装物品说明框。")
    C_Timer.After(2, function() RunAttempt(1) end)
end

local function PrintHelp()
    Print("用法:")
    Print("  /wowtierexport preflight")
    Print("  /wowtierexport discover（从幻化套装发现 13 职业各 9 个物品 ID）")
    Print("  /wowtierexport export-preflight（导出完整客户端装备记录，不可正式发布）")
    Print("  /wowtierexport capture <Shift 点击一件 S2 套装物品链接>")
    Print("  /wowtierexport all（S2 规则确认前会拒绝）")
    Print("  /wowtierexport monk")
    Print("  /wowtierexport monk,druid,mage")
    Print("  /wowtierexport summary")
    Print("  /wowtierexport help")
    Print("可用职业: " .. table.concat(CLASS_ORDER, ", "))
end

local function PrintDiscoveryStatus()
    local ready, total = 0, #CLASS_ORDER
    for _, classKey in ipairs(CLASS_ORDER) do
        local discovery = WoWLookTierExportDB.discoveries[classKey]
        if discovery and discovery.status == "ok" then
            ready = ready + 1
        else
            PrintWarn(string.format("%s: %s", classKey, discovery and discovery.status or "not_discovered"))
        end
    end
    Print(string.format("S2 九件套发现状态：%d/%d 完成；发现客户端 Build %d。", ready, total, WoWLookTierExportDB.discoveryBuild or 0))
end

local function PrintSummary()
    local summary = WoWLookTierExportDB.summary
    if not summary then
        PrintWarn("还没有导出记录。")
        return
    end

    Print(string.format("上次导出: %s", summary.exportedAt or ""))
    Print(string.format("模式: %s, 职业: %d, 物品: %d, 特效套装: %d, 额外外观: %d, 专精效果: %d, 289成功: %d, 失败: %d",
        summary.mode or "",
        summary.classCount or 0,
        summary.itemCount or 0,
        summary.bonusItemCount or 0,
        summary.extraAppearanceItemCount or 0,
        summary.bonusSpecMatches or 0,
        summary.maximumSuccessCount or 0,
        summary.maximumFailureCount or 0))
end

SLASH_WOWTIEREXPORT1 = "/wowtierexport"
SLASH_WOWTIEREXPORT2 = "/wte"
SlashCmdList["WOWTIEREXPORT"] = function(msg)
    local arg = (msg or ""):lower():match("^%s*(.-)%s*$")
    Print("命令已收到：" .. (arg ~= "" and arg or "all"))

    if arg == "preflight" then
        local ok, payload = pcall(BuildPreflightPayload)
        if not ok then
            WoWLookTierExportDB.lastError = payload
            PrintWarn("预检失败: " .. tostring(payload))
            return
        end
        WoWLookTierExportDB.payload = jsonEncode(payload)
        WoWLookTierExportDB.summary = payload.summary
        WoWLookTierExportDB.lastError = nil
        Print("S2 套装预检完成。请 /reload 保存；把 SavedVariables 文件交回以确认 13 职业和专精范围。")
        return
    end

    if arg == "discover" then
        StartDiscovery(CLASS_ORDER)
        return
    end

    if arg == "export-preflight" then
        StartPreflightEquipmentExport(CLASS_ORDER)
        return
    end

    local captureLink = arg:match("^capture%s+(.+)$")
    if captureLink then
        local ok, result = CapturePreflightItem(captureLink)
        if ok then
            Print(string.format("已记录 S2 套装预检：%s（装等%d）。再运行 /wowtierexport preflight 生成交付文件。",
                result.name ~= "" and result.name or tostring(result.itemId), result.tooltipItemLevel or 0))
        else
            PrintWarn(tostring(result))
        end
        return
    end

    if arg == "" or arg == "all" then
        StartExportSafely(CLASS_ORDER)
        return
    end

    if arg == "help" then
        PrintHelp()
        return
    end

    if arg == "summary" then
        PrintSummary()
        return
    end

    if arg == "status" then
        PrintDiscoveryStatus()
        return
    end

    local classKeys, invalidKey = NormalizeClassKeys(arg)
    if not classKeys then
        PrintWarn("未知职业 key: " .. tostring(invalidKey))
        PrintHelp()
        return
    end

    StartExportSafely(classKeys)
end

ApplySeasonTierManifest()
Print("已加载 v" .. ADDON_VERSION .. "。S2 九件套清单已由暴雪 API 校验；输入 /wowtierexport all 开始客户端满级采集。")
