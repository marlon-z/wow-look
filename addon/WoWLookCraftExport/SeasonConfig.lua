local AddonName, CraftExport = ...

-- 每个赛季只需要更新并实测普通/特殊栏位的目标装等与公共制造 Bonus ID。
CraftExport.SEASON_CONFIG = {
    profileId = "midnight-season-1-crafted",
    normalProfile = {
        id = "midnight-season-1-crafted-285",
        targetRule = "configured_crafted_normal_285",
        targetItemLevel = 285,
        craftedBonusIds = {
            12214,
            13667,
            12497,
            12066,
            13622,
        },
    },
    specialProfile = {
        id = "midnight-season-1-crafted-special-295",
        targetRule = "configured_crafted_special_295",
        targetItemLevel = 295,
        craftedBonusIds = {
            12214,
            13655,
            12497,
            12066,
            13640,
            13622,
        },
    },
    specialEquipLocs = {
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
    },
    linkRetryCount = 1,
    linkRetryDelaySeconds = 2,
    description = "当前赛季普通285、武器栏位与饰品295制造装备",
}
