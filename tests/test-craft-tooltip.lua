local namespace = {}

assert(loadfile("addon/WoWLookCraftExport/Constants.lua"))("WoWLookCraftExportTest", namespace)
assert(loadfile("addon/WoWLookCraftExport/Tooltip.lua"))("WoWLookCraftExportTest", namespace)
assert(loadfile("addon/WoWLookCraftExport/Scanner.lua"))("WoWLookCraftExportTest", namespace)

Enum = {
    CraftingReagentType = {
        Modifying = 0,
    },
}

local itemLevels = {
    ["item:base"] = 350,
    ["item:crest-low"] = 372,
    ["item:crest-max"] = 399,
}

C_Item = {
    GetDetailedItemLevelInfo = function(link)
        return itemLevels[link]
    end,
}

C_TradeSkillUI = {
    GetRecipeSchematic = function()
        return {
            reagentSlotSchematics = {
                {
                    reagentType = 0,
                    dataSlotIndex = 7,
                    quantityRequired = 1,
                    reagents = {
                        { itemID = 101 },
                        { itemID = 102 },
                    },
                },
            },
        }
    end,
    GetRecipeOutputItemData = function(_, reagents)
        if #reagents == 0 then
            return { hyperlink = "item:base" }
        end
        local reagentId = reagents[1].reagent.itemID
        if reagentId == 101 then
            return { hyperlink = "item:crest-low" }
        end
        return { hyperlink = "item:crest-max" }
    end,
}

assert(loadfile("addon/WoWLookCraftExport/AutoCapture.lua"))("WoWLookCraftExportTest", namespace)

local function line(left, right)
    return { left = left, right = right or "" }
end

local oneRandom = namespace.ParseTooltip({
    line("测试头盔"),
    line("物品等级285"),
    line("拾取后绑定"),
    line("头部", "板甲"),
    line("+83 智力"),
    line("+1031 耐力"),
    line("+130 随机属性1"),
})

assert(oneRandom.itemLevel == 285)
assert(oneRandom.slotText == "头部")
assert(oneRandom.armorTypeText == "板甲")
assert(#oneRandom.primaryStats == 1 and oneRandom.primaryStats[1].type == "intellect")
assert(oneRandom.stamina and oneRandom.stamina.value == 1031)
assert(oneRandom.randomAttributeCount == 1)
assert(oneRandom.randomAttributeSlots[1].index == 1)
assert(oneRandom.randomAttributeSlots[1].value == 130)
assert(#oneRandom.secondaryStats == 0)

local twoRandom = namespace.ParseTooltip({
    line("测试武器"),
    line("物品等级285"),
    line("单手", "斧"),
    line("+32 随机属性1"),
    line("+32 随机属性2"),
})

assert(twoRandom.randomAttributeCount == 2)
assert(twoRandom.randomAttributeSlots[1].value == 32)
assert(twoRandom.randomAttributeSlots[2].index == 2)

local fixedStats = namespace.ParseTooltip({
    line("固定属性胸甲"),
    line("物品等级285"),
    line("胸部", "板甲"),
    line("+73 急速"),
    line("+92 精通"),
})

assert(fixedStats.randomAttributeCount == 0)
assert(#fixedStats.secondaryStats == 2)
assert(fixedStats.secondaryStats[1].type == "haste")
assert(fixedStats.secondaryStats[2].type == "mastery")

local visiblePlus = namespace.Scanner.IsVisiblePlusCandidate({
    iLvlMin = 333,
    iLvlMax = nil,
    craftingQualityIDs = {},
})
assert(visiblePlus == true)

local fixedRange = namespace.Scanner.IsVisiblePlusCandidate({
    iLvlMin = 333,
    iLvlMax = 399,
    craftingQualityIDs = { 1, 2, 3 },
})
assert(fixedRange == false)

local missingQualities = namespace.Scanner.IsVisiblePlusCandidate({
    iLvlMin = 333,
    iLvlMax = nil,
})
assert(missingQualities == false)

local automaticLink, automaticMeta, automaticDiagnostics = namespace.FindAutomaticBestPreview({
    recipeId = 9001,
    craftingQualityIds = { 1, 2, 3, 4, 5 },
})
assert(automaticLink == "item:crest-max")
assert(automaticMeta.reagentItemId == 102)
assert(automaticDiagnostics.bestItemLevel == 399)
assert(automaticDiagnostics.tested == 3)

assert(namespace.DeriveMaximumItemLevel({
    first = { itemLevel = 350 },
    second = { itemLevel = 399 },
    third = { itemLevel = 372 },
}) == 399)

print("craft tooltip parser passed")
