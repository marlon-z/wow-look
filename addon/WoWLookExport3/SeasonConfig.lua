-- WoWLookExport3 season-specific maximum obtainable item-level rules.
-- Update this file when a new season changes upgrade tracks or bonus IDs.

WoWLookSeasonConfig = {
    profileVersion = 2,
    seasonId = 16,
    seasonName = "Midnight Season 1",
    testedBuild = 68256,
    minimumBuild = 68232,

    dungeon = {
        ruleSource = "dungeon_great_vault",
        track = "myth",
        rank = 6,
        targetItemLevel = 289,
        trackBonusId = 12806,
    },

    raid = {
        maxDifficulty = 16,
        tracks = {
            [17] = { ruleSource = "raid_lfr", track = "veteran", rank = 6, targetItemLevel = 250, trackBonusId = 12782 },
            [14] = { ruleSource = "raid_normal", track = "champion", rank = 6, targetItemLevel = 263, trackBonusId = 12790 },
            [15] = { ruleSource = "raid_heroic", track = "hero", rank = 6, targetItemLevel = 276, trackBonusId = 12798 },
            [16] = { ruleSource = "raid_mythic", track = "myth", rank = 6, targetItemLevel = 289, trackBonusId = 12806 },
        },
    },

    commonBonusIds = {
        quality = 1674,
    },

    slotBonusIds = {
        INVTYPE_FINGER = 13534,
        INVTYPE_NECK = 13534,
    },

    -- Current-season Voidforged Myth rule for weapon-slot and trinket-slot items.
    voidforged = {
        ruleSource = "voidforged_myth",
        track = "voidforged_myth",
        targetItemLevel = 298,
        itemContext = 35,
        markerBonusId = 13654,
        commonBonusIds = { 13440, 6652 },
        trinketBonusId = 12699,
        weaponBonusId = 12701,
        slotBonusIds = {
            INVTYPE_TRINKET = 12699,
            INVTYPE_WEAPON = 12701,
            INVTYPE_2HWEAPON = 12701,
            INVTYPE_WEAPONMAINHAND = 12701,
            INVTYPE_WEAPONOFFHAND = 12701,
            INVTYPE_SHIELD = 12701,
            INVTYPE_HOLDABLE = 12701,
            INVTYPE_RANGED = 12701,
            INVTYPE_RANGEDRIGHT = 12701,
            INVTYPE_THROWN = 12701,
        },
    },

    -- Sporefall uses fixed difficulty bonuses instead of the normal track.
    fixedSourceRules = {
        [1305] = {
            ruleSource = "raid_fixed_mythic",
            difficulty = 16,
            fixedBonusId = 13786,
            track = "fixed_mythic",
            rank = 0,
        },
    },

    -- Bonuses that preserve item-specific behavior when rebuilding a link.
    specialItems = {
        [178708] = { bonusIds = { 6917 } },
        [178715] = { bonusIds = { 6923 } },
        [243308] = { bonusIds = { 13503 } },
    },

    nonUpgradeableItems = {
        [268280] = true,
    },
}
