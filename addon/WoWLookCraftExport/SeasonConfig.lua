local AddonName, CraftExport = ...

-- S2 crafted maximum profiles are deliberately empty until preflight captures
-- the live order-form previews and their real Bonus IDs.
CraftExport.SEASON_CONFIG = {
    profileId = "midnight-season-2-pending",
    seasonName = "Midnight Season 2",
    dataVersion = "12.1-s2",
    testedBuild = 69273,
    minimumBuild = 69273,
    releaseStatus = "preflight_required",
    normalProfile = nil,
    specialProfile = nil,
    specialEquipLocs = {},
    description = "S2 预检：仅采集制造订单候选和实际预览，不生成最终制造装备。",
}
