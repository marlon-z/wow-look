-- Midnight Season 2 maximum obtainable-item rules.  These values are only
-- accepted when the current client resolves every generated link to the exact
-- target item level and tooltip; failed items stay out of the final payload.
WoWLookSeasonConfig = {
    profileVersion = 4,
    seasonId = 17,
    seasonName = "Midnight Season 2",
    testedBuild = 69273,
    minimumBuild = 69273,
    releaseStatus = "finalized",
    dataVersion = "12.1-s2",

    dungeon = {
        ruleSource = "dungeon_great_vault",
        track = "myth",
        rank = 6,
        targetItemLevel = 334,
        trackBonusId = 12854,
    },

    raid = {
        maxDifficulty = 16,
        tracks = {
            [16] = {
                ruleSource = "raid_mythic",
                track = "myth",
                rank = 6,
                targetItemLevel = 334,
                trackBonusId = 12854,
            },
        },
    },

    -- Do not invent a special weapon/trinket modifier.  Enable this only when
    -- a current-client capture proves a specific season mechanism and IDs.
    voidforged = {
        enabled = false,
    },

    commonBonusIds = {},
    slotBonusIds = {},
    specialItems = {},
    nonUpgradeableItems = {},
    -- Fallback for the 12.1 client: its ChallengeMode map table can be empty
    -- before the season is active. These are the eight real dungeon tiles in
    -- the live Chinese Adventure Guide, not the "史诗钥石地下城" entry card.
    preflightDungeonNames = {
        "毒牙祭坛",
        "纳洛拉克的洞穴",
        "密谋小径",
        "夺目谷",
        "虚空之痕竞技场",
        "诸王之眠",
        "红玉新生法池",
        "塞塔里斯神庙",
    },
    -- Product scope: only these two S2 raids. IDs are stable even when the
    -- Adventure Guide card name and Encounter Journal name differ.
    preflightRaidInstanceIds = {
        1317, -- 潮缚石窟（冒险指南：潮鸣石窟）
        1320, -- 烈毒之渊
    },
}
