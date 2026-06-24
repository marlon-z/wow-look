local AddonName, CraftExport = ...

CraftExport.ADDON_NAME = AddonName
CraftExport.VERSION = "1.0.0"
CraftExport.SCHEMA_VERSION = 1
CraftExport.CANDIDATE_ITEM_LEVEL = 246
CraftExport.TARGET_ITEM_LEVEL = 285

CraftExport.SUPPORTED_EQUIP_LOCS = {
    INVTYPE_HEAD = true,
    INVTYPE_NECK = true,
    INVTYPE_SHOULDER = true,
    INVTYPE_CLOAK = true,
    INVTYPE_CHEST = true,
    INVTYPE_ROBE = true,
    INVTYPE_WRIST = true,
    INVTYPE_HAND = true,
    INVTYPE_WAIST = true,
    INVTYPE_LEGS = true,
    INVTYPE_FEET = true,
    INVTYPE_FINGER = true,
    INVTYPE_TRINKET = true,
    INVTYPE_WEAPON = true,
    INVTYPE_2HWEAPON = true,
    INVTYPE_WEAPONMAINHAND = true,
    INVTYPE_WEAPONOFFHAND = true,
    INVTYPE_SHIELD = true,
    INVTYPE_HOLDABLE = true,
    INVTYPE_RANGED = true,
    INVTYPE_RANGEDRIGHT = true,
    INVTYPE_THROWN = true,
}

CraftExport.SLOT_TEXTS = {
    ["头部"] = true,
    ["颈部"] = true,
    ["肩部"] = true,
    ["背部"] = true,
    ["胸部"] = true,
    ["手腕"] = true,
    ["手"] = true,
    ["腰部"] = true,
    ["腿部"] = true,
    ["脚"] = true,
    ["手指"] = true,
    ["饰品"] = true,
    ["单手"] = true,
    ["双手"] = true,
    ["主手"] = true,
    ["副手"] = true,
    ["远程"] = true,
}

CraftExport.STAT_LABELS = {
    ["力量"] = "strength",
    ["敏捷"] = "agility",
    ["智力"] = "intellect",
    ["耐力"] = "stamina",
    ["暴击"] = "crit",
    ["爆击"] = "crit",
    ["急速"] = "haste",
    ["精通"] = "mastery",
    ["全能"] = "versatility",
}

CraftExport.STAT_NAMES = {
    strength = "力量",
    agility = "敏捷",
    intellect = "智力",
    stamina = "耐力",
    crit = "暴击",
    haste = "急速",
    mastery = "精通",
    versatility = "全能",
}

CraftExport.PRIMARY_STAT_KEYS = {
    strength = true,
    agility = true,
    intellect = true,
}

CraftExport.SECONDARY_STAT_KEYS = {
    crit = true,
    haste = true,
    mastery = true,
    versatility = true,
}

CraftExport.STAT_SORT_ORDER = {
    strength = 1,
    agility = 2,
    intellect = 3,
    stamina = 4,
    crit = 5,
    haste = 6,
    mastery = 7,
    versatility = 8,
}

function CraftExport.GetItemApiInfo(itemId)
    if not itemId or not C_Item or type(C_Item.GetItemInfoInstant) ~= "function" then
        return nil
    end

    local resolvedItemId, itemType, itemSubType, equipLoc, icon, classId, subClassId =
        C_Item.GetItemInfoInstant(itemId)
    if not resolvedItemId then
        return nil
    end

    return {
        itemId = resolvedItemId,
        itemType = itemType or "",
        itemSubType = itemSubType or "",
        equipLoc = equipLoc or "",
        icon = icon or 0,
        classId = classId,
        subClassId = subClassId,
    }
end

function CraftExport.IsSupportedCombatItem(itemId)
    local info = CraftExport.GetItemApiInfo(itemId)
    if not info then
        return false, "item_info_unavailable", nil
    end

    local weaponClass = Enum and Enum.ItemClass and Enum.ItemClass.Weapon or 2
    local armorClass = Enum and Enum.ItemClass and Enum.ItemClass.Armor or 4
    if info.classId ~= weaponClass and info.classId ~= armorClass then
        return false, "not_weapon_or_armor", info
    end

    if not CraftExport.SUPPORTED_EQUIP_LOCS[info.equipLoc] then
        return false, "unsupported_equip_location", info
    end

    return true, nil, info
end
