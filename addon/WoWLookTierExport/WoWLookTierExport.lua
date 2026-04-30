local ADDON_NAME = ...
local ADDON_VERSION = "0.5.0"

WoWLookTierExportDB = WoWLookTierExportDB or {
    version = ADDON_VERSION,
    summary = nil,
    classes = {},
    payload = "",
    lastError = nil,
}

WoWLookTierExportDB.version = ADDON_VERSION
WoWLookTierExportDB.classes = WoWLookTierExportDB.classes or {}

local SEASON_BONUS_ID = 3524
local RAID_HEROIC_DIFFICULTY = 5
local RAID_HEROIC_CONTEXT = 3606

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

local function BuildSeasonLink(itemId)
    return string.format("item:%d::::::::90:0::%d:1:%d:1:28:%d:::::",
        itemId, RAID_HEROIC_DIFFICULTY, SEASON_BONUS_ID, RAID_HEROIC_CONTEXT)
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
            if not HasText(item.name) or not item.icon or item.icon == 0 then
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
    local seasonLink = BuildSeasonLink(itemId)
    local name, baseLink, quality, _, minLevel, itemType, itemSubType,
        stackCount, equipLoc, icon, sellPrice, itemClassId, itemSubclassId, bindType, expacId, setId =
        GetItemInfo(itemId)
    if not name and C_Item and type(C_Item.RequestLoadItemDataByID) == "function" then
        C_Item.RequestLoadItemDataByID(itemId)
    end

    local tooltipLines = GetTooltipLines(seasonLink)
    local parsedTooltip = ParseTooltipLines(tooltipLines)
    local detailedItemLevel = {}
    if C_Item and type(C_Item.GetDetailedItemLevelInfo) == "function" then
        local effective, preview, sparse = C_Item.GetDetailedItemLevelInfo(seasonLink)
        detailedItemLevel = {
            effective = effective or 0,
            preview = preview or false,
            sparse = sparse or 0,
        }
    end

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

local function BuildClassExport(classKey)
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
            collectionKind = "appearance",
            isBonusPiece = false,
        })
        items[#items + 1] = itemRecord
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
    local classes = {}
    local summary = {
        exportedAt = date("%Y-%m-%d %H:%M:%S"),
        classCount = 0,
        itemCount = 0,
        bonusItemCount = 0,
        appearanceItemCount = 0,
        extraAppearanceItemCount = 0,
        bonusSpecMatches = 0,
        build = select(2, GetBuildInfo()),
        buildNumber = select(4, GetBuildInfo()),
        mode = (#classKeys == #CLASS_ORDER) and "all" or "partial",
    }

    for _, classKey in ipairs(classKeys) do
        local classData = BuildClassExport(classKey)
        if classData then
            classes[#classes + 1] = classData
            WoWLookTierExportDB.classes[classKey] = classData
            summary.classCount = summary.classCount + 1
            summary.itemCount = summary.itemCount + classData.itemCount
            summary.bonusItemCount = summary.bonusItemCount + (classData.bonusItemCount or 0)
            summary.appearanceItemCount = summary.appearanceItemCount + (classData.appearanceItemCount or 0)
            summary.extraAppearanceItemCount = summary.extraAppearanceItemCount + (classData.extraAppearanceItemCount or 0)
            summary.bonusSpecMatches = summary.bonusSpecMatches + classData.bonusSpecMatches
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
            for _, itemId in ipairs(setInfo.bonusItemIds or {}) do
                C_Item.RequestLoadItemDataByID(itemId)
            end
            for _, itemId in ipairs(setInfo.appearanceItemIds or {}) do
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
        payload = "",
        lastError = nil,
    }
end

local function StartExport(classKeys)
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
            PrintWarn(string.format("导出完成，但仍有 %d 件物品数据未就绪。", missingItems))
        end
        Print(string.format("导出完成: %d 职业, %d 件装备（%d 件特效套装，额外 %d 件外观）, %d 组专精效果。",
            summary.classCount or 0,
            summary.itemCount or 0,
            summary.bonusItemCount or 0,
            summary.extraAppearanceItemCount or 0,
            summary.bonusSpecMatches or 0))
        Print("数据已保存到 SavedVariables/WoWLookTierExport.lua")
        Print("请 /reload 后到 WTF 目录查看。")
    end

    C_Timer.After(3, function()
        RunAttempt(1)
    end)
end

local function PrintHelp()
    Print("用法:")
    Print("  /wowtierexport all")
    Print("  /wowtierexport monk")
    Print("  /wowtierexport monk,druid,mage")
    Print("  /wowtierexport summary")
    Print("  /wowtierexport help")
    Print("可用职业: " .. table.concat(CLASS_ORDER, ", "))
end

local function PrintSummary()
    local summary = WoWLookTierExportDB.summary
    if not summary then
        PrintWarn("还没有导出记录。")
        return
    end

    Print(string.format("上次导出: %s", summary.exportedAt or ""))
    Print(string.format("模式: %s, 职业: %d, 物品: %d, 特效套装: %d, 额外外观: %d, 专精效果: %d",
        summary.mode or "",
        summary.classCount or 0,
        summary.itemCount or 0,
        summary.bonusItemCount or 0,
        summary.extraAppearanceItemCount or 0,
        summary.bonusSpecMatches or 0))
end

SLASH_WOWTIEREXPORT1 = "/wowtierexport"
SlashCmdList["WOWTIEREXPORT"] = function(msg)
    local arg = (msg or ""):lower():match("^%s*(.-)%s*$")

    if arg == "" or arg == "all" then
        StartExport(CLASS_ORDER)
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

    local classKeys, invalidKey = NormalizeClassKeys(arg)
    if not classKeys then
        PrintWarn("未知职业 key: " .. tostring(invalidKey))
        PrintHelp()
        return
    end

    StartExport(classKeys)
end

Print("已加载 v" .. ADDON_VERSION .. "。输入 /wowtierexport help 查看命令。")
