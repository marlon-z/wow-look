local AddonName, CraftExport = ...

local function GetLinkItemLevel(link)
    if not link then
        return nil
    end

    if C_Item and type(C_Item.GetDetailedItemLevelInfo) == "function" then
        local ok, itemLevel = pcall(C_Item.GetDetailedItemLevelInfo, link)
        if ok and itemLevel and itemLevel > 0 then
            return itemLevel
        end
    end

    local lines = CraftExport.CaptureTooltipLines(link)
    if #lines > 0 then
        return CraftExport.ParseTooltip(lines).itemLevel
    end
    return nil
end

local function GetHighestQualityId(candidate)
    local qualityIds = candidate and candidate.craftingQualityIds or nil
    if type(qualityIds) ~= "table" or #qualityIds == 0 then
        return nil
    end
    return qualityIds[#qualityIds]
end

local function SplitColonPreservingEmpty(text)
    local fields = {}
    local startIndex = 1
    while true do
        local separator = string.find(text, ":", startIndex, true)
        if not separator then
            fields[#fields + 1] = string.sub(text, startIndex)
            return fields
        end
        fields[#fields + 1] = string.sub(text, startIndex, separator - 1)
        startIndex = separator + 1
    end
end

local function ExtractItemPayload(link)
    local hyperlinkStart = string.find(link, "|Hitem:", 1, true)
    if hyperlinkStart then
        local payloadStart = hyperlinkStart + #"|Hitem:"
        local payloadEnd = string.find(link, "|h", payloadStart, true)
        if not payloadEnd then
            return nil, nil, nil, "item_hyperlink_missing_text_marker"
        end
        return string.sub(link, 1, payloadStart - 1),
            string.sub(link, payloadStart, payloadEnd - 1),
            string.sub(link, payloadEnd),
            nil
    end

    if string.sub(link, 1, 5) == "item:" then
        return "item:", string.sub(link, 6), "", nil
    end
    return nil, nil, nil, "not_an_item_link"
end

function CraftExport.ReplaceBonusIdsInItemLink(link, bonusIds)
    if type(link) ~= "string" or link == "" then
        return nil, "item_link_unavailable"
    end
    if type(bonusIds) ~= "table" or #bonusIds == 0 then
        return nil, "crafted_bonus_ids_unavailable"
    end
    local normalizedBonusIds = {}
    for _, bonusId in ipairs(bonusIds) do
        bonusId = tonumber(bonusId)
        if not bonusId or bonusId <= 0 or bonusId % 1 ~= 0 then
            return nil, "invalid_crafted_bonus_id"
        end
        normalizedBonusIds[#normalizedBonusIds + 1] = tostring(bonusId)
    end

    local prefix, payload, suffix, extractError = ExtractItemPayload(link)
    if not payload then
        return nil, extractError
    end

    local fields = SplitColonPreservingEmpty(payload)
    if #fields < 13 or fields[13] == "" then
        return nil, "item_link_missing_bonus_count"
    end
    local bonusCount = tonumber(fields[13])
    if not bonusCount or bonusCount < 0 or bonusCount % 1 ~= 0 then
        return nil, "item_link_invalid_bonus_count"
    end
    if #fields < 13 + bonusCount then
        return nil, "item_link_truncated_bonus_list"
    end

    local unchanged = bonusCount == #normalizedBonusIds
    for index, bonusText in ipairs(normalizedBonusIds) do
        if fields[13 + index] ~= bonusText then
            unchanged = false
            break
        end
    end
    if unchanged then
        return link, nil
    end

    for _ = 1, bonusCount do
        table.remove(fields, 14)
    end
    fields[13] = tostring(#normalizedBonusIds)
    for index, bonusText in ipairs(normalizedBonusIds) do
        table.insert(fields, 13 + index, bonusText)
    end
    return prefix .. table.concat(fields, ":") .. suffix, nil
end

local function IsValidProfile(profile)
    return type(profile) == "table"
        and type(profile.targetRule) == "string"
        and type(profile.targetItemLevel) == "number"
        and type(profile.craftedBonusIds) == "table"
        and #profile.craftedBonusIds > 0
end

function CraftExport.GetConfiguredCraftProfile(candidate, forceNormal)
    local config = CraftExport.SEASON_CONFIG
    if type(config) ~= "table" or not IsValidProfile(config.normalProfile) then
        return nil, "season_config_invalid"
    end
    if not forceNormal
        and candidate
        and type(config.specialEquipLocs) == "table"
        and config.specialEquipLocs[candidate.equipLoc] then
        if not IsValidProfile(config.specialProfile) then
            return nil, "special_profile_invalid"
        end
        return config.specialProfile, nil, true
    end
    return config.normalProfile, nil, false
end

function CraftExport.PreloadConfiguredLink(link)
    if type(link) ~= "string" or link == "" then
        return false
    end
    local ok, lines = pcall(CraftExport.CaptureTooltipLines, link)
    return ok and type(lines) == "table"
end

function CraftExport.FindConfiguredMaximumPreview(candidate, forceNormal)
    if not candidate or not candidate.recipeId then
        return nil, nil, { reason = "candidate_missing_recipe" }
    end
    if not C_TradeSkillUI or type(C_TradeSkillUI.GetRecipeOutputItemData) ~= "function" then
        return nil, nil, { reason = "recipe_output_api_unavailable" }
    end

    local profile, profileError, isSpecial = CraftExport.GetConfiguredCraftProfile(candidate, forceNormal)
    if not profile then
        return nil, nil, { reason = profileError }
    end

    local qualityId = GetHighestQualityId(candidate)
    if not qualityId then
        return nil, nil, { reason = "highest_quality_unavailable" }
    end

    local ok, outputInfo = pcall(
        C_TradeSkillUI.GetRecipeOutputItemData,
        candidate.recipeId,
        {},
        nil,
        qualityId
    )
    if not ok or not outputInfo or not outputInfo.hyperlink then
        return nil, nil, { reason = "base_output_link_unavailable" }
    end

    local baseLink = outputInfo.hyperlink
    local baseItemLevel = GetLinkItemLevel(baseLink)
    local adjustedLink, rebuildError = CraftExport.ReplaceBonusIdsInItemLink(
        baseLink,
        profile.craftedBonusIds
    )
    if not adjustedLink then
        return nil, nil, {
            reason = rebuildError,
            baseItemLevel = baseItemLevel,
        }
    end

    local adjustedItemLevel = GetLinkItemLevel(adjustedLink)
    if adjustedItemLevel ~= profile.targetItemLevel then
        return nil, nil, {
            reason = "configured_link_not_target_item_level",
            baseItemLevel = baseItemLevel,
            adjustedItemLevel = adjustedItemLevel,
            adjustedLink = adjustedLink,
            targetItemLevel = profile.targetItemLevel,
            targetRule = profile.targetRule,
            isSpecial = isSpecial,
        }
    end

    return adjustedLink, {
        mode = "configured_crafted_bonus_ids",
        profileId = profile.id,
        targetRule = profile.targetRule,
        targetItemLevel = profile.targetItemLevel,
        isSpecial = isSpecial,
        highestQualityId = qualityId,
        craftedBonusIds = profile.craftedBonusIds,
        baseLink = baseLink,
        baseItemLevel = baseItemLevel,
    }, {
        baseItemLevel = baseItemLevel,
        adjustedItemLevel = adjustedItemLevel,
        adjustedLink = adjustedLink,
        targetItemLevel = profile.targetItemLevel,
        targetRule = profile.targetRule,
        isSpecial = isSpecial,
    }
end
