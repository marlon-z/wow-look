local AddonName, CraftExport = ...

CraftExport.Scanner = {}
local Scanner = CraftExport.Scanner

local CUSTOMER_ORDERS_ADDON = "Blizzard_ProfessionsCustomerOrders"

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

local function IsCustomerOrdersAddonLoaded()
    if C_AddOns and type(C_AddOns.IsAddOnLoaded) == "function" then
        return C_AddOns.IsAddOnLoaded(CUSTOMER_ORDERS_ADDON) and true or false
    end
    if type(IsAddOnLoaded) == "function" then
        return IsAddOnLoaded(CUSTOMER_ORDERS_ADDON) and true or false
    end
    return nil
end

-- The customer-order browser is a Blizzard load-on-demand module.  Loading it
-- here makes the catalog request independent of whether the player has opened
-- the profession window in this session.
function Scanner.EnsureCustomerOrdersModule()
    local loaded = IsCustomerOrdersAddonLoaded()
    if loaded then
        return true, "制造订单模块已就绪"
    end

    local loader = nil
    if C_AddOns and type(C_AddOns.LoadAddOn) == "function" then
        loader = C_AddOns.LoadAddOn
    elseif type(LoadAddOn) == "function" then
        loader = LoadAddOn
    end

    if not loader then
        -- The catalog API itself is the authoritative availability check below.
        return true, "客户端未提供订单模块加载接口，继续检查订单接口"
    end

    local ok, loadResult, loadReason = pcall(loader, CUSTOMER_ORDERS_ADDON)
    if not ok then
        return false, "无法加载制造订单模块：" .. tostring(loadResult)
    end
    if loadResult == false then
        return false, "游戏拒绝加载制造订单模块：" .. tostring(loadReason or "未知原因")
    end
    return true, "已请求加载制造订单模块"
end

function Scanner.GetDiagnostics()
    local moduleState = IsCustomerOrdersAddonLoaded()
    local apiReady = C_CraftingOrders
        and type(C_CraftingOrders.ParseCustomerOptions) == "function"
        and type(C_CraftingOrders.GetCustomerOptions) == "function"
    local attempts = tonumber(Scanner.scanAttempts) or 0
    local lastResult = Scanner.lastScanResult or "尚未检查结果"
    return string.format(
        "订单模块=%s，接口=%s，请求次数=%d，最近结果=%s",
        moduleState == true and "已加载" or (moduleState == false and "未加载" or "未知"),
        apiReady and "可用" or "不可用",
        attempts,
        tostring(lastResult)
    )
end

function Scanner.RequestCustomerOptions()
    if not C_CraftingOrders
        or type(C_CraftingOrders.ParseCustomerOptions) ~= "function"
        or type(C_CraftingOrders.GetCustomerOptions) ~= "function" then
        Scanner.lastScanResult = "制造订单接口不可用"
        return false, "当前客户端没有可用的制造订单接口"
    end

    Scanner.scanAttempts = (tonumber(Scanner.scanAttempts) or 0) + 1
    local ok, errorMessage = pcall(C_CraftingOrders.ParseCustomerOptions)
    if not ok then
        Scanner.lastScanResult = "ParseCustomerOptions 失败：" .. tostring(errorMessage)
        return false, "无法解析制造订单：" .. tostring(errorMessage)
    end
    Scanner.lastScanResult = "已请求客户端订单目录"
    return true, nil
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
    local moduleOk, moduleMessage = Scanner.EnsureCustomerOrdersModule()
    if not moduleOk then
        return false, moduleMessage
    end

    Scanner.scanRequested = true
    Scanner.scanStartedAt = GetTime and GetTime() or 0
    Scanner.scanAttempts = 0
    Scanner.lastScanResult = nil
    local ok, errorMessage = Scanner.RequestCustomerOptions()
    if not ok then
        Scanner.scanRequested = false
        return false, errorMessage
    end
    return true, moduleMessage .. "；正在自动读取制造订单目录（最多 18 秒；完成后会提示）"
end

function Scanner.RetryScanRequest()
    if not Scanner.scanRequested then
        return false, "没有等待中的扫描任务"
    end
    return Scanner.RequestCustomerOptions()
end

function Scanner.CompleteScan()
    if not Scanner.scanRequested then
        return false, "没有等待中的扫描任务"
    end
    Scanner.scanRequested = false

    local ok, searchResults = pcall(C_CraftingOrders.GetCustomerOptions, Scanner.BuildSearchParams())
    if not ok or not searchResults or type(searchResults.options) ~= "table" then
        Scanner.lastScanResult = "目录尚未返回：" .. tostring(searchResults)
        return false, "扫描结果仍未就绪：" .. tostring(searchResults)
    end

    Scanner.lastScanResult = "已返回 " .. tostring(#searchResults.options) .. " 项"

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

function Scanner.TryCompleteScan(trigger)
    if not Scanner.scanRequested then
        return false, "没有等待中的扫描任务"
    end
    local ok, result = Scanner.CompleteScan()
    if ok then
        result.trigger = trigger or "unknown"
        return true, result
    end
    Scanner.scanRequested = true
    return false, result
end
