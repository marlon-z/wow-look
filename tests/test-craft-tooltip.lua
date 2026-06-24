local namespace = {}

assert(loadfile("addon/WoWLookCraftExport/Constants.lua"))("WoWLookCraftExportTest", namespace)
assert(loadfile("addon/WoWLookCraftExport/SeasonConfig.lua"))("WoWLookCraftExportTest", namespace)
assert(loadfile("addon/WoWLookCraftExport/Tooltip.lua"))("WoWLookCraftExportTest", namespace)
assert(loadfile("addon/WoWLookCraftExport/Scanner.lua"))("WoWLookCraftExportTest", namespace)

local baseLink = "|cnIQ4:|Hitem:237832::::::::90:269::13:1:3524:2:40:2753:38:8:::::|h[测试装备]|h|r"
local expectedNormalLink = "|cnIQ4:|Hitem:237832::::::::90:269::13:5:12214:13667:12497:12066:13622:2:40:2753:38:8:::::|h[测试装备]|h|r"
local expectedSpecialLink = "|cnIQ4:|Hitem:237832::::::::90:269::13:6:12214:13655:12497:12066:13640:13622:2:40:2753:38:8:::::|h[测试装备]|h|r"

C_Item = {
    GetDetailedItemLevelInfo = function(link)
        if link == expectedNormalLink then
            return 285
        end
        if link == expectedSpecialLink then
            return 295
        end
        if link == baseLink then
            return 259
        end
    end,
}

C_TradeSkillUI = {
    GetRecipeOutputItemData = function(_, reagents, _, qualityId)
        assert(#reagents == 0)
        assert(qualityId == 5)
        return { hyperlink = baseLink }
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

local rebuiltLink, rebuildError = namespace.ReplaceBonusIdsInItemLink(
    baseLink,
    { 12214, 13667, 12497, 12066, 13622 }
)
assert(rebuildError == nil)
assert(rebuiltLink == expectedNormalLink)

local duplicateLink = namespace.ReplaceBonusIdsInItemLink(
    expectedNormalLink,
    { 12214, 13667, 12497, 12066, 13622 }
)
assert(duplicateLink == expectedNormalLink)

local malformedLink, malformedError = namespace.ReplaceBonusIdsInItemLink("item:237832", { 13622 })
assert(malformedLink == nil)
assert(malformedError == "item_link_missing_bonus_count")

local automaticLink, automaticMeta, automaticDiagnostics = namespace.FindConfiguredMaximumPreview({
    recipeId = 9001,
    craftingQualityIds = { 1, 2, 3, 4, 5 },
    equipLoc = "INVTYPE_CHEST",
})
assert(automaticLink == expectedNormalLink)
assert(automaticMeta.mode == "configured_crafted_bonus_ids")
assert(automaticMeta.targetRule == "configured_crafted_normal_285")
assert(automaticMeta.highestQualityId == 5)
assert(#automaticMeta.craftedBonusIds == 5)
assert(automaticMeta.craftedBonusIds[5] == 13622)
assert(automaticDiagnostics.baseItemLevel == 259)
assert(automaticDiagnostics.adjustedItemLevel == 285)

for _, equipLoc in ipairs({
    "INVTYPE_WEAPON",
    "INVTYPE_2HWEAPON",
    "INVTYPE_TRINKET",
    "INVTYPE_SHIELD",
    "INVTYPE_HOLDABLE",
}) do
    local specialLink, specialMeta, specialDiagnostics = namespace.FindConfiguredMaximumPreview({
        recipeId = 9001,
        craftingQualityIds = { 1, 2, 3, 4, 5 },
        equipLoc = equipLoc,
    })
    assert(specialLink == expectedSpecialLink)
    assert(specialMeta.targetRule == "configured_crafted_special_295")
    assert(#specialMeta.craftedBonusIds == 6)
    assert(specialDiagnostics.targetItemLevel == 295)
end

local fallbackLink, fallbackMeta = namespace.FindConfiguredMaximumPreview({
    recipeId = 9001,
    craftingQualityIds = { 1, 2, 3, 4, 5 },
    equipLoc = "INVTYPE_WEAPON",
}, true)
assert(fallbackLink == expectedNormalLink)
assert(fallbackMeta.targetRule == "configured_crafted_normal_285")

print("craft tooltip parser passed")
