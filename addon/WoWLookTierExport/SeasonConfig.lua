-- S2 tier IDs, final links, and 2/4-piece text must come from the live client.
WoWLookTierSeasonConfig = {
    profileVersion = 3,
    seasonId = 17,
    seasonName = "Midnight Season 2",
    testedBuild = 69273,
    minimumBuild = 69273,
    releaseStatus = "preflight_required",
    dataVersion = "12.1-s2",
    tierSets = nil,
    -- 这些仅用于从客户端幻化集合定位 S2 套装；最终 9 件 ID 必须由客户端发现。
    tierAnchors = {
        warrior = { 271456, 271454, 271459, 271457, 271455 },
        paladin = { 271465, 271463, 271468, 271466, 271464 },
        hunter = { 271492, 271490, 271495, 271493, 271491 },
        rogue = { 271510, 271508, 271513, 271511, 271509 },
        priest = { 271555, 271553, 271558, 271556, 271554 },
        deathknight = { 271474, 271472, 271477, 271475, 271473 },
        shaman = { 271483, 271481, 271486, 271484, 271482 },
        mage = { 271564, 271562, 271567, 271565, 271563 },
        warlock = { 271546, 271544, 271549, 271547, 271545 },
        monk = { 271519, 271517, 271522, 271520, 271518 },
        druid = { 271528, 271526, 271531, 271529, 271527 },
        demonhunter = { 271537, 271535, 271540, 271538, 271536 },
        evoker = { 271501, 271499, 271504, 271502, 271500 },
    },
}
