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

local function GetRecipeSchematic(recipeId)
    if not C_TradeSkillUI or type(C_TradeSkillUI.GetRecipeSchematic) ~= "function" then
        return nil, "recipe_schematic_api_unavailable"
    end
    local ok, schematic = pcall(C_TradeSkillUI.GetRecipeSchematic, recipeId, false)
    if not ok or not schematic then
        return nil, "recipe_schematic_unavailable"
    end
    return schematic, nil
end

local function BuildReagentInfo(slot, reagent)
    return {
        reagent = {
            itemID = reagent.itemID,
            currencyID = reagent.currencyID,
        },
        dataSlotIndex = slot.dataSlotIndex,
        quantity = slot.quantityRequired and math.max(1, slot.quantityRequired) or 1,
    }
end

local function ReagentKey(reagent)
    if reagent.itemID then
        return "item:" .. tostring(reagent.itemID)
    end
    if reagent.currencyID then
        return "currency:" .. tostring(reagent.currencyID)
    end
    return nil
end

local function BuildReagentSlotMap(schematic)
    local slotMap = {}
    for _, slot in ipairs(schematic.reagentSlotSchematics or {}) do
        for _, reagent in ipairs(slot.reagents or {}) do
            local key = ReagentKey(reagent)
            if key then
                slotMap[key] = { slot = slot, reagent = reagent }
            end
        end
    end
    return slotMap
end

local function BuildReagentCombination(schematic, targetSlot, targetReagent)
    local slotMap = BuildReagentSlotMap(schematic)
    local infos = {}
    local reagentKeys = {}
    local added = {}

    local function AddWithDependencies(slot, reagent)
        local key = ReagentKey(reagent)
        if not key or added[key] then
            return
        end
        added[key] = true
        infos[#infos + 1] = BuildReagentInfo(slot, reagent)
        reagentKeys[#reagentKeys + 1] = key

        if C_TradeSkillUI and type(C_TradeSkillUI.GetDependentReagents) == "function" then
            local ok, dependencies = pcall(C_TradeSkillUI.GetDependentReagents, reagent)
            if ok then
                for _, dependency in ipairs(dependencies or {}) do
                    local dependencyEntry = slotMap[ReagentKey(dependency)]
                    if dependencyEntry then
                        AddWithDependencies(dependencyEntry.slot, dependencyEntry.reagent)
                    end
                end
            end
        end
    end

    AddWithDependencies(targetSlot, targetReagent)
    return infos, reagentKeys
end

function CraftExport.DeriveMaximumItemLevel(previews)
    local maximum
    for _, preview in pairs(previews or {}) do
        if type(preview.itemLevel) == "number" and (not maximum or preview.itemLevel > maximum) then
            maximum = preview.itemLevel
        end
    end
    return maximum
end

function CraftExport.FindAutomaticBestPreview(candidate)
    if not candidate or not candidate.recipeId then
        return nil, nil, { reason = "candidate_missing_recipe" }
    end
    if not C_TradeSkillUI or type(C_TradeSkillUI.GetRecipeOutputItemData) ~= "function" then
        return nil, nil, { reason = "recipe_output_api_unavailable" }
    end

    local schematic, schematicError = GetRecipeSchematic(candidate.recipeId)
    if not schematic then
        return nil, nil, { reason = schematicError }
    end

    local qualityId = GetHighestQualityId(candidate)
    if not qualityId then
        return nil, nil, { reason = "highest_quality_unavailable" }
    end

    local bestItemLevel = 0
    local bestLink
    local bestMeta
    local tested = 0

    local function TestReagents(reagents, meta)
        tested = tested + 1
        local ok, outputInfo = pcall(
            C_TradeSkillUI.GetRecipeOutputItemData,
            candidate.recipeId,
            reagents,
            nil,
            qualityId
        )
        if not ok or not outputInfo or not outputInfo.hyperlink then
            return
        end

        local itemLevel = GetLinkItemLevel(outputInfo.hyperlink)
        if itemLevel and itemLevel > bestItemLevel then
            bestItemLevel = itemLevel
            bestLink = outputInfo.hyperlink
            bestMeta = meta
        end
        return
    end

    TestReagents({}, { mode = "highest_quality_without_optional_reagent" })

    local modifyingType = Enum and Enum.CraftingReagentType and Enum.CraftingReagentType.Modifying or 0
    local seen = {}
    for _, slot in ipairs(schematic.reagentSlotSchematics or {}) do
        if slot.reagentType == modifyingType then
            for _, reagent in ipairs(slot.reagents or {}) do
                if reagent.itemID then
                    local reagentKey = tostring(slot.dataSlotIndex) .. ":" .. tostring(reagent.itemID)
                    if not seen[reagentKey] then
                        seen[reagentKey] = true
                        local reagentInfos, reagentKeys = BuildReagentCombination(schematic, slot, reagent)
                        local reagentInfo = reagentInfos[1]
                        local meta = {
                            mode = #reagentInfos > 1 and "modifying_reagent_with_dependencies"
                                or "single_modifying_reagent",
                            reagentItemId = reagent.itemID,
                            reagentKeys = reagentKeys,
                            dataSlotIndex = slot.dataSlotIndex,
                            quantity = reagentInfo.quantity,
                            highestQualityId = qualityId,
                        }
                        TestReagents(reagentInfos, meta)
                    end
                end
            end
        end
    end

    if bestLink then
        return bestLink, bestMeta, {
            bestItemLevel = bestItemLevel,
            tested = tested,
        }
    end

    return nil, nil, {
        reason = "automatic_maximum_preview_not_found",
        tested = tested,
    }
end
