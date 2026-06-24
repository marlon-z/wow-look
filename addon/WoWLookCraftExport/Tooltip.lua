local AddonName, CraftExport = ...

local hiddenTip

local function CleanText(value)
    local text = tostring(value or "")
    text = text:gsub("|c%x%x%x%x%x%x%x%x", "")
    text = text:gsub("|r", "")
    text = text:gsub("|A.-|a", "")
    text = text:gsub("\r", "")
    text = text:gsub("^%s+", "")
    text = text:gsub("%s+$", "")
    return text
end

local function ParseNumber(value)
    if not value then
        return nil
    end
    local normalized = tostring(value):gsub(",", "")
    return tonumber(normalized)
end

local function EnsureHiddenTooltip()
    if hiddenTip then
        return hiddenTip
    end
    hiddenTip = CreateFrame("GameTooltip", "WoWLookCraftExportHiddenTip", nil, "GameTooltipTemplate")
    hiddenTip:SetOwner(WorldFrame, "ANCHOR_NONE")
    return hiddenTip
end

local function CaptureWithStructuredApi(link)
    local lines = {}
    local tipData = C_TooltipInfo.GetHyperlink(link)
    if not tipData or not tipData.lines then
        return lines
    end

    for _, line in ipairs(tipData.lines) do
        local left = CleanText(line.leftText)
        local right = CleanText(line.rightText)
        if left ~= "" or right ~= "" then
            lines[#lines + 1] = { left = left, right = right }
        end
    end
    return lines
end

local function CaptureWithHiddenTooltip(link)
    local tip = EnsureHiddenTooltip()
    tip:ClearLines()
    tip:SetHyperlink(link)

    local lines = {}
    for index = 1, tip:NumLines() do
        local leftObj = _G["WoWLookCraftExportHiddenTipTextLeft" .. index]
        local rightObj = _G["WoWLookCraftExportHiddenTipTextRight" .. index]
        local left = CleanText(leftObj and leftObj:GetText() or "")
        local right = CleanText(rightObj and rightObj:GetText() or "")
        if left ~= "" or right ~= "" then
            lines[#lines + 1] = { left = left, right = right }
        end
    end
    return lines
end

function CraftExport.CaptureTooltipLines(link)
    if not link or link == "" then
        return {}
    end
    if C_TooltipInfo and type(C_TooltipInfo.GetHyperlink) == "function" then
        local lines = CaptureWithStructuredApi(link)
        if #lines > 0 then
            return lines
        end
    end
    return CaptureWithHiddenTooltip(link)
end

local function IsStatLine(text)
    return text and text:match("^%+[%d,]+%s*.+$") ~= nil
end

local function IsEffectTerminator(text)
    if not text or text == "" then
        return false
    end
    return text:match("^卖价")
        or text:match("^商人")
        or text:match("^ID:")
        or text:match("^物品等级")
        or text:match("^升级[：:]")
        or text:match("^拾取后")
        or text:match("^装备唯一")
        or text:match("^品质[：:]")
        or text:match('^".*"$')
        or CraftExport.SLOT_TEXTS[text]
        or text:match("^[%d,]+点护甲$")
        or text:match("^[%d,]+%s*%-%s*[%d,]+点伤害$")
        or text:match("^（每秒伤害[%d%.,]+）$")
        or IsStatLine(text)
end

local function BuildStatEntry(statKey, value)
    return {
        type = statKey,
        name = CraftExport.STAT_NAMES[statKey] or statKey,
        value = value,
    }
end

function CraftExport.ParseTooltip(lines)
    local parsed = {
        itemLevel = nil,
        upgradeTrack = "",
        binding = "",
        slotText = "",
        armorTypeText = "",
        white = {},
        primaryStats = {},
        stamina = nil,
        secondaryStats = {},
        randomAttributeSlots = {},
        randomAttributeCount = 0,
        equipEffects = {},
        useEffects = {},
        flags = {
            uniqueEquipped = false,
            prismaticSocket = false,
        },
    }

    local statValues = {}
    local effects = {}
    local currentEffect

    for _, rawLine in ipairs(lines or {}) do
        local left = CleanText(rawLine.left)
        local right = CleanText(rawLine.right)

        local itemLevel = left:match("^物品等级%s*([%d,]+)$")
        if itemLevel then
            parsed.itemLevel = ParseNumber(itemLevel)
        end

        local upgradeTrack = left:match("^升级[：:]%s*(.+)$")
        if upgradeTrack then
            parsed.upgradeTrack = upgradeTrack
        end

        if left:match("^拾取后绑定") or left:match("^装备后绑定") or left:match("^战团绑定") then
            parsed.binding = left
        end

        if left:match("^装备唯一") then
            parsed.flags.uniqueEquipped = true
        end
        if left:find("棱彩插槽", 1, true) then
            parsed.flags.prismaticSocket = true
        end

        if CraftExport.SLOT_TEXTS[left] and parsed.slotText == "" then
            parsed.slotText = left
            parsed.armorTypeText = right
        end

        local armor = left:match("^([%d,]+)点护甲$")
        if armor then
            parsed.white.armor = ParseNumber(armor)
        end

        local damageMin, damageMax = left:match("^([%d,]+)%s*%-%s*([%d,]+)点伤害$")
        if damageMin and damageMax then
            parsed.white.damageMin = ParseNumber(damageMin)
            parsed.white.damageMax = ParseNumber(damageMax)
        end

        local dps = left:match("^（每秒伤害([%d%.,]+)）$")
        if dps then
            parsed.white.dps = ParseNumber(dps)
        end

        local speed = right:match("^速度%s*([%d%.]+)$")
        if speed then
            parsed.white.speed = tonumber(speed)
        end

        local randomValue, randomIndex = left:match("^%+([%d,]+)%s*随机属性%s*(%d*)$")
        if randomValue then
            local resolvedIndex = tonumber(randomIndex)
            if not resolvedIndex then
                resolvedIndex = #parsed.randomAttributeSlots + 1
            end
            parsed.randomAttributeSlots[#parsed.randomAttributeSlots + 1] = {
                index = resolvedIndex,
                value = ParseNumber(randomValue),
                label = "随机属性" .. tostring(resolvedIndex),
            }
        else
            local value, label = left:match("^%+([%d,]+)%s*(.+)$")
            local statKey = label and CraftExport.STAT_LABELS[label] or nil
            if value and statKey then
                statValues[statKey] = ParseNumber(value)
            end
        end

        if left:match("^装备[：:]") or left:match("^使用[：:]") then
            local effectType = left:match("^装备") and "equip" or "use"
            currentEffect = { type = effectType, lines = { left } }
            effects[#effects + 1] = currentEffect
        elseif currentEffect and not IsEffectTerminator(left) and not left:match("^你尚未收藏过此外观") then
            currentEffect.lines[#currentEffect.lines + 1] = left
        elseif currentEffect and IsEffectTerminator(left) then
            currentEffect = nil
        end
    end

    table.sort(parsed.randomAttributeSlots, function(left, right)
        return left.index < right.index
    end)
    parsed.randomAttributeCount = #parsed.randomAttributeSlots

    for statKey, value in pairs(statValues) do
        local entry = BuildStatEntry(statKey, value)
        if CraftExport.PRIMARY_STAT_KEYS[statKey] then
            parsed.primaryStats[#parsed.primaryStats + 1] = entry
        elseif CraftExport.SECONDARY_STAT_KEYS[statKey] then
            parsed.secondaryStats[#parsed.secondaryStats + 1] = entry
        elseif statKey == "stamina" then
            parsed.stamina = entry
        end
    end

    local function SortStats(left, right)
        return (CraftExport.STAT_SORT_ORDER[left.type] or 999) < (CraftExport.STAT_SORT_ORDER[right.type] or 999)
    end
    table.sort(parsed.primaryStats, SortStats)
    table.sort(parsed.secondaryStats, SortStats)

    for _, effect in ipairs(effects) do
        local text = table.concat(effect.lines, "")
        if effect.type == "equip" then
            parsed.equipEffects[#parsed.equipEffects + 1] = text
        else
            parsed.useEffects[#parsed.useEffects + 1] = text
        end
    end

    return parsed
end
