-- Midnight Season 2 starts with evidence collection only.  Do not enter target
-- item levels or Bonus IDs until links/tooltips have been captured in-game.
WoWLookSeasonConfig = {
    profileVersion = 3,
    seasonId = 17,
    seasonName = "Midnight Season 2",
    testedBuild = 69273,
    minimumBuild = 69273,
    releaseStatus = "preflight_required",
    dataVersion = "12.1-s2",
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
    -- Client truth from Adventure Guide -> 本赛季团队副本. The broader expansion
    -- tier contains additional old raids. Product scope explicitly excludes
    -- 至暗之夜, so retain only the two selected raids.
    preflightRaidNames = {
        "潮鸣石窟",
        "烈毒之渊",
    },
    finalRules = nil,
}
