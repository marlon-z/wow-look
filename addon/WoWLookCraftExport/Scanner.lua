local AddonName, CraftExport = ...

CraftExport.Scanner = {}
local Scanner = CraftExport.Scanner

local function Now()
    return date("!%Y-%m-%dT%H:%M:%SZ")
end

local function CharacterName()
    local name = UnitName("player") or ""
    local realm = GetRealmName() or ""
    if realm ~= "" then
        return name .. "-" .. realm
    end
    return name
end

local function CopyNumberList(source)
    local result = {}
    for _, value in ipairs(source or {}) do
        result[#result + 1] = value
    end
    return result
end

local function GetProfessionName(option)
    if C_TradeSkillUI and type(C_TradeSkillUI.GetProfessionNameForSkillLineAbility) == "function" then
        return C_TradeSkillUI.GetProfessionNameForSkillLineAbility(option.skillLineAbilityID) or ""
    end
    return ""
end

function Scanner.IsVisiblePlusCandidate(option)
    if not option or type(option.iLvlMin) ~= "number" then
        return false, "minimum_item_level_unavailable"
    end
    if option.iLvlMax ~= nil then
        return false, "fixed_item_level_range"
    end
    if type(option.craftingQualityIDs) ~= "table" then
        return false, "not_quality_scaling"
    end
    return true, nil
end

function Scanner.BuildSearchParams()
    return {
        isFavoritesSearch = false,
        categoryFilters = {},
        searchText = nil,
        minLevel = 0,
        maxLevel = 0,
        uncollectedOnly = false,
        usableOnly = false,
        upgradesOnly = false,
        currentExpansionOnly = true,
        includePoor = true,
        includeCommon = true,
        includeUncommon = true,
        includeRare = true,
        includeEpic = true,
        includeLegendary = true,
        includeArtifact = true,
    }
end

local function BuildOptionRecord(option, apiInfo)
    local _, rawBuildNumber = GetBuildInfo()
    return {
        recipeId = option.spellID,
        itemId = option.itemID,
        itemName = option.itemName or "",
        professionId = option.professionID,
        professionName = GetProfessionName(option),
        skillLineAbilityId = option.skillLineAbilityID,
        expansionId = option.expansionID,
        primaryCategoryId = option.primaryCategoryID,
        secondaryCategoryId = option.secondaryCategoryID,
        tertiaryCategoryId = option.tertiaryCategoryID,
        iLvlMin = option.iLvlMin,
        iLvlMax = option.iLvlMax,
        craftingQualityIds = CopyNumberList(option.craftingQualityIDs),
        qualityIlvlBonuses = CopyNumberList(option.qualityIlvlBonuses),
        canUse = option.canUse and true or false,
        bindOnPickup = option.bindOnPickup and true or false,
        itemType = apiInfo and apiInfo.itemType or "",
        itemSubType = apiInfo and apiInfo.itemSubType or "",
        equipLoc = apiInfo and apiInfo.equipLoc or "",
        icon = apiInfo and apiInfo.icon or 0,
        classId = apiInfo and apiInfo.classId or nil,
        subClassId = apiInfo and apiInfo.subClassId or nil,
        discoveredAt = Now(),
        discoveredBy = CharacterName(),
        clientBuild = tonumber(rawBuildNumber) or 0,
    }
end

function Scanner.RequestScan()
    if not C_CraftingOrders
        or type(C_CraftingOrders.ParseCustomerOptions) ~= "function"
        or type(C_CraftingOrders.GetCustomerOptions) ~= "function" then
        return false, "当前客户端没有可用的制造订单接口"
    end

    Scanner.scanRequested = true
    local ok, errorMessage = pcall(C_CraftingOrders.ParseCustomerOptions)
    if not ok then
        Scanner.scanRequested = false
        return false, "无法解析制造订单：" .. tostring(errorMessage)
    end
    return true, "正在读取当前版本的制造订单目录"
end

function Scanner.CompleteScan()
    if not Scanner.scanRequested then
        return false, "没有等待中的扫描任务"
    end
    Scanner.scanRequested = false

    local ok, searchResults = pcall(C_CraftingOrders.GetCustomerOptions, Scanner.BuildSearchParams())
    if not ok or not searchResults or type(searchResults.options) ~= "table" then
        return false, "读取制造订单目录失败：" .. tostring(searchResults)
    end

    local db = CraftExport.GetDB()
    local config = CraftExport.SEASON_CONFIG or {}
    local stats = {
        scanned = 0,
        candidates = 0,
        rejected = 0,
        unresolved = 0,
    }

    for _, option in ipairs(searchResults.options) do
        stats.scanned = stats.scanned + 1
        local key = tostring(option.spellID)
        local supported, supportReason, apiInfo = CraftExport.IsSupportedCombatItem(option.itemID)
        local plusCandidate, plusReason = Scanner.IsVisiblePlusCandidate(option)
        local record = BuildOptionRecord(option, apiInfo)

        if supported and plusCandidate then
            if db.items[key] then
                record.status = "accepted_maximum"
                record.statusReason = "verified_configured_maximum"
                record.acceptedAt = db.items[key].capturedAt
            else
                record.status = "pending_maximum_preview"
                record.statusReason = "visible_scaling_plus"
            end
            db.candidates[key] = record
            db.rejected[key] = nil
            stats.candidates = stats.candidates + 1
        else
            local reason = supportReason or plusReason or "not_candidate"
            record.status = "rejected"
            record.statusReason = reason
            db.rejected[key] = record
            db.candidates[key] = nil
            stats.rejected = stats.rejected + 1
            if reason == "item_info_unavailable" then
                stats.unresolved = stats.unresolved + 1
            end
        end
    end

    db.lastScan = {
        mode = "preflight",
        dataVersion = config.dataVersion or "",
        seasonName = config.seasonName or "",
        clientBuild = tonumber(select(2, GetBuildInfo())) or 0,
        completedAt = Now(),
        character = CharacterName(),
        stats = stats,
    }
    CraftExport.RefreshSummary()
    return true, stats
end
