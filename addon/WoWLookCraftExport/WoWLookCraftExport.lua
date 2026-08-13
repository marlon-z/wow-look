local AddonName, CraftExport = ...

local eventFrame = CreateFrame("Frame")

local function Print(message)
    DEFAULT_CHAT_FRAME:AddMessage("|cff66ccffWoWLookCraftExport|r " .. tostring(message))
end

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

local function CountEntries(tbl)
    local count = 0
    for _ in pairs(tbl or {}) do
        count = count + 1
    end
    return count
end

local function NewDatabase()
    return {
        schemaVersion = CraftExport.SCHEMA_VERSION,
        addonVersion = CraftExport.VERSION,
        createdAt = Now(),
        updatedAt = Now(),
        items = {},
        candidates = {},
        rejected = {},
        errors = {},
        summary = {},
    }
end

local function EnsureDatabase()
    if type(WoWLookCraftExportDB) ~= "table"
        or WoWLookCraftExportDB.schemaVersion ~= CraftExport.SCHEMA_VERSION then
        WoWLookCraftExportDB = NewDatabase()
    end

    WoWLookCraftExportDB.items = WoWLookCraftExportDB.items or {}
    WoWLookCraftExportDB.candidates = WoWLookCraftExportDB.candidates or {}
    WoWLookCraftExportDB.rejected = WoWLookCraftExportDB.rejected or {}
    WoWLookCraftExportDB.errors = WoWLookCraftExportDB.errors or {}
    WoWLookCraftExportDB.summary = WoWLookCraftExportDB.summary or {}
    WoWLookCraftExportDB.addonVersion = CraftExport.VERSION
    return WoWLookCraftExportDB
end

function CraftExport.GetDB()
    return EnsureDatabase()
end

function CraftExport.RefreshSummary()
    local db = EnsureDatabase()
    db.updatedAt = Now()
    db.summary = {
        mode = db.mode or "preflight",
        dataVersion = (CraftExport.SEASON_CONFIG or {}).dataVersion or "",
        clientBuild = tonumber(select(2, GetBuildInfo())) or 0,
        accepted = CountEntries(db.items),
        candidates = CountEntries(db.candidates),
        rejected = CountEntries(db.rejected),
        errors = #db.errors,
    }
    return db.summary
end

local function RecordError(code, message, context)
    local db = EnsureDatabase()
    db.errors[#db.errors + 1] = {
        code = code,
        message = tostring(message or ""),
        context = context,
        character = CharacterName(),
        occurredAt = Now(),
    }
    CraftExport.RefreshSummary()
end

local function GetActiveOrderForm()
    local frame = _G.ProfessionsCustomerOrdersFrame
    local form = frame and frame.Form or nil
    if not frame or not frame:IsShown() or not form or not form:IsShown() then
        return nil, "请先打开“发布制造订单”并进入一件装备的订单详情"
    end
    if not form.transaction then
        return nil, "当前订单详情还没有生成制造预览"
    end
    return form, nil
end

local function GetHighestQualityId(recipeId)
    if not C_TradeSkillUI or type(C_TradeSkillUI.GetQualitiesForRecipe) ~= "function" then
        return nil
    end
    local qualityIds = C_TradeSkillUI.GetQualitiesForRecipe(recipeId)
    if type(qualityIds) ~= "table" or #qualityIds == 0 then
        return nil
    end
    return qualityIds[#qualityIds]
end

local function GetOutputLink(form, recipeId)
    local transaction = form.transaction
    if not C_TradeSkillUI or type(C_TradeSkillUI.GetRecipeOutputItemData) ~= "function" then
        return nil, "当前客户端没有制造结果预览接口"
    end
    if type(transaction.CreateOptionalCraftingReagentInfoTbl) ~= "function" then
        return nil, "当前制造预览无法读取附加材料"
    end
    local optionalReagents = transaction:CreateOptionalCraftingReagentInfoTbl() or {}
    local highestQualityId = GetHighestQualityId(recipeId)
    local ok, outputInfo = pcall(
        C_TradeSkillUI.GetRecipeOutputItemData,
        recipeId,
        optionalReagents,
        nil,
        highestQualityId
    )
    if not ok or not outputInfo or not outputInfo.hyperlink then
        return nil, "当前制造预览没有可读取的输出装备链接"
    end
    return outputInfo.hyperlink, nil, optionalReagents, highestQualityId
end

local function GetFullItemInfo(link, fallback)
    local itemName, resolvedLink, quality, apiItemLevel, minimumLevel, itemType, itemSubType,
        stackCount, equipLoc, icon, sellPrice, classId, subClassId, bindType, expansionId = C_Item.GetItemInfo(link)
    return {
        name = itemName or (fallback and fallback.itemName) or "",
        link = resolvedLink or link,
        quality = quality,
        apiItemLevel = apiItemLevel,
        minimumLevel = minimumLevel,
        itemType = itemType or (fallback and fallback.itemType) or "",
        itemSubType = itemSubType or (fallback and fallback.itemSubType) or "",
        stackCount = stackCount,
        equipLoc = equipLoc or (fallback and fallback.equipLoc) or "",
        icon = icon or (fallback and fallback.icon) or 0,
        sellPrice = sellPrice,
        classId = classId or (fallback and fallback.classId),
        subClassId = subClassId or (fallback and fallback.subClassId),
        bindType = bindType,
        expansionId = expansionId,
    }
end

local function CopyRawLines(lines)
    local result = {}
    for _, line in ipairs(lines or {}) do
        result[#result + 1] = {
            left = line.left or "",
            right = line.right or "",
        }
    end
    return result
end

local function PromoteCandidateFromLink(candidate, outputLink, previewMeta, expectedMaximumItemLevel)
    local db = EnsureDatabase()
    local recipeId = candidate.recipeId
    local key = tostring(recipeId)

    local supported, supportReason, apiInfo = CraftExport.IsSupportedCombatItem(candidate.itemId)
    if not supported then
        candidate.status = "rejected"
        candidate.statusReason = supportReason
        db.rejected[key] = candidate
        db.candidates[key] = nil
        CraftExport.RefreshSummary()
        return false, "当前输出不是支持的战斗装备：" .. tostring(supportReason)
    end

    local tooltipLines = CraftExport.CaptureTooltipLines(outputLink)
    if #tooltipLines == 0 then
        RecordError("tooltip_unavailable", "无法读取当前制造预览说明框", {
            recipeId = recipeId,
            itemId = candidate.itemId,
            link = outputLink,
        })
        return false, "无法读取当前制造预览说明框"
    end

    local parsed = CraftExport.ParseTooltip(tooltipLines)
    if type(expectedMaximumItemLevel) ~= "number" or parsed.itemLevel ~= expectedMaximumItemLevel then
        candidate.status = "preview_not_configured_maximum"
        candidate.statusReason = "preview_item_level_" .. tostring(parsed.itemLevel or "unknown")
        candidate.lastPreview = {
            itemLevel = parsed.itemLevel,
            link = outputLink,
            capturedAt = Now(),
        }
        db.rejected[key] = {
            recipeId = recipeId,
            itemId = candidate.itemId,
            itemName = candidate.itemName,
            status = "rejected",
            statusReason = candidate.statusReason,
            rejectedAt = Now(),
        }
        CraftExport.RefreshSummary()
        return false, "当前预览是" .. tostring(parsed.itemLevel or "未知")
            .. "装等，本次扫描计算出的制造业最高装等是" .. tostring(expectedMaximumItemLevel or "未知")
    end

    local fullInfo = GetFullItemInfo(outputLink, apiInfo)
    local _, _, _, clientBuild = GetBuildInfo()
    local professionName = candidate.professionName
    if professionName == ""
        and C_TradeSkillUI
        and type(C_TradeSkillUI.GetProfessionNameForSkillLineAbility) == "function" then
        professionName = C_TradeSkillUI.GetProfessionNameForSkillLineAbility(candidate.skillLineAbilityId) or ""
    end

    local preview = { link = outputLink }
    for metaKey, metaValue in pairs(previewMeta or {}) do
        preview[metaKey] = metaValue
    end

    local formalItem = {
        recipeId = recipeId,
        itemId = candidate.itemId,
        name = fullInfo.name,
        icon = fullInfo.icon,
        professionId = candidate.professionId,
        professionName = professionName,
        skillLineAbilityId = candidate.skillLineAbilityId,
        expansionId = candidate.expansionId or fullInfo.expansionId,
        itemType = fullInfo.itemType,
        itemSubType = fullInfo.itemSubType,
        equipLoc = fullInfo.equipLoc,
        classId = fullInfo.classId,
        subClassId = fullInfo.subClassId,
        quality = fullInfo.quality,
        binding = parsed.binding,
        itemLevel = parsed.itemLevel,
        apiItemLevel = fullInfo.apiItemLevel,
        slotText = parsed.slotText,
        armorTypeText = parsed.armorTypeText,
        white = parsed.white,
        primaryStats = parsed.primaryStats,
        stamina = parsed.stamina,
        fixedSecondaryStats = parsed.secondaryStats,
        randomAttributeCount = parsed.randomAttributeCount,
        randomAttributeSlots = parsed.randomAttributeSlots,
        effects = {
            equip = parsed.equipEffects,
            use = parsed.useEffects,
        },
        flags = parsed.flags,
        source = {
            type = "crafted",
            candidateRule = "customer_option_scaling_plus",
            candidateItemLevel = candidate.iLvlMin,
            targetItemLevel = expectedMaximumItemLevel,
            targetRule = previewMeta and previewMeta.targetRule or "configured_crafted_bonus_ids",
        },
        preview = preview,
        tooltipRaw = CopyRawLines(tooltipLines),
        capturedAt = Now(),
        capturedBy = CharacterName(),
        clientBuild = tonumber(clientBuild) or clientBuild,
        addonVersion = CraftExport.VERSION,
    }

    db.items[key] = formalItem
    candidate.status = "accepted_maximum"
    candidate.statusReason = "verified_configured_maximum"
    candidate.acceptedAt = formalItem.capturedAt
    db.rejected[key] = nil
    CraftExport.RefreshSummary()
    return true, formalItem
end

CraftExport.PromoteCandidateFromLink = PromoteCandidateFromLink

local function CaptureCurrentPreview()
    local form, formError = GetActiveOrderForm()
    if not form then
        return false, formError
    end

    local transaction = form.transaction
    if type(transaction.GetRecipeID) ~= "function" then
        return false, "当前制造订单缺少配方编号"
    end
    local recipeId = transaction:GetRecipeID()
    if not recipeId then
        return false, "无法识别当前制造配方"
    end

    local db = EnsureDatabase()
    local candidate = db.candidates[tostring(recipeId)]
    if not candidate then
        return false, "当前配方不在可变装等候选中，请先运行 /wowcraft scan"
    end

    local outputLink, linkError, optionalReagents, highestQualityId = GetOutputLink(form, recipeId)
    if not outputLink then
        RecordError("output_link_unavailable", linkError, { recipeId = recipeId, itemId = candidate.itemId })
        return false, linkError
    end

    local profile = CraftExport.GetConfiguredCraftProfile(candidate, false)
    local targetItemLevel = profile and profile.targetItemLevel or nil
    if not targetItemLevel then
        return false, "尚未载入本赛季制造业最高装等配置，请先运行 /wowcraft scan"
    end

    return PromoteCandidateFromLink(candidate, outputLink, {
        mode = "manual_order_form",
        highestQualityId = highestQualityId,
        optionalReagentCount = #optionalReagents,
        targetRule = profile.targetRule,
    }, targetItemLevel)
end


function CraftExport.StartAutomaticCapture()
    if (CraftExport.SEASON_CONFIG or {}).releaseStatus ~= "finalized" then
        return false, "final_export_blocked_until_manifest_finalized"
    end
    if CraftExport.automaticCaptureRunning then
        return false, "自动目标装等验证正在运行"
    end

    local db = EnsureDatabase()
    local config = CraftExport.SEASON_CONFIG
    local normalProfile = config and config.normalProfile or nil
    local specialProfile = config and config.specialProfile or nil
    if type(config) ~= "table"
        or type(normalProfile) ~= "table"
        or type(specialProfile) ~= "table"
        or type(normalProfile.targetItemLevel) ~= "number"
        or type(specialProfile.targetItemLevel) ~= "number"
        or type(normalProfile.craftedBonusIds) ~= "table"
        or type(specialProfile.craftedBonusIds) ~= "table" then
        return false, "本赛季制造装等配置无效"
    end

    local currentCandidateItemLevel
    for _, candidate in pairs(db.candidates) do
        if type(candidate.iLvlMin) == "number"
            and (not currentCandidateItemLevel or candidate.iLvlMin > currentCandidateItemLevel) then
            currentCandidateItemLevel = candidate.iLvlMin
        end
    end

    local keys = {}
    for key, candidate in pairs(db.candidates) do
        if candidate.iLvlMin == currentCandidateItemLevel then
            keys[#keys + 1] = key
        else
            candidate.status = "legacy_scaling_candidate"
            candidate.statusReason = "below_current_candidate_item_level_"
                .. tostring(currentCandidateItemLevel or "unknown")
        end
    end
    table.sort(keys, function(left, right)
        return tonumber(left) < tonumber(right)
    end)

    local run = {
        startedAt = Now(),
        total = #keys,
        phase = "capture",
        probed = 0,
        processed = 0,
        accepted = 0,
        normalAccepted = 0,
        specialAccepted = 0,
        fallbackAccepted = 0,
        retryCount = 0,
        belowMaximum = 0,
        pending = 0,
        failed = 0,
        maximumItemLevel = specialProfile.targetItemLevel,
        normalTargetItemLevel = normalProfile.targetItemLevel,
        specialTargetItemLevel = specialProfile.targetItemLevel,
        normalCraftedBonusIds = normalProfile.craftedBonusIds,
        specialCraftedBonusIds = specialProfile.craftedBonusIds,
        currentCandidateItemLevel = currentCandidateItemLevel,
    }
    db.automaticRun = run
    db.previousItems = db.items
    db.items = {}
    db.maximumProfile = {
        rule = "configured_crafted_dual_profiles",
        profileId = config.profileId,
        maximumItemLevel = specialProfile.targetItemLevel,
        normalTargetItemLevel = normalProfile.targetItemLevel,
        specialTargetItemLevel = specialProfile.targetItemLevel,
        normalCraftedBonusIds = normalProfile.craftedBonusIds,
        specialCraftedBonusIds = specialProfile.craftedBonusIds,
        specialEquipLocs = config.specialEquipLocs,
        currentCandidateItemLevel = currentCandidateItemLevel,
        candidateCount = #keys,
        configuredAt = Now(),
    }

    if #keys == 0 then
        run.completedAt = Now()
        Print("没有找到会显示“装等+”的战斗装备")
        return true, run
    end

    CraftExport.automaticCaptureRunning = true
    Print(string.format(
        "开始验证 %d 件当前赛季装备：起始装等 %s，普通 %d，武器栏位/饰品 %d，无需打开制造订单界面",
        #keys,
        tostring(currentCandidateItemLevel or "未知"),
        normalProfile.targetItemLevel,
        specialProfile.targetItemLevel
    ))

    local index = 0
    local ProcessCandidate

    local function Finish()
        CraftExport.automaticCaptureRunning = false
        run.phase = "complete"
        run.completedAt = Now()
        CraftExport.RefreshSummary()
        Print(string.format(
            "自动验证完成：普通%d件，特殊%d件，回退%d件，未验证%d件，失败%d件",
            run.normalAccepted,
            run.specialAccepted,
            run.fallbackAccepted,
            run.pending,
            run.failed
        ))
    end

    local function FinishCandidate()
        run.processed = run.processed + 1
        if run.processed % 10 == 0 then
            Print(string.format("目标装等验证进度：%d/%d", run.processed, run.total))
        end
        CraftExport.RefreshSummary()
        C_Timer.After(0, ProcessCandidate)
    end

    local function MarkPending(candidate, diagnostics, specialFallbackReason)
        run.pending = run.pending + 1
        candidate.status = "configured_maximum_unverified"
        candidate.statusReason = diagnostics and diagnostics.reason or "configured_maximum_unverified"
        candidate.automaticPreview = {
            baseItemLevel = diagnostics and diagnostics.baseItemLevel or nil,
            adjustedItemLevel = diagnostics and diagnostics.adjustedItemLevel or nil,
            targetItemLevel = diagnostics and diagnostics.targetItemLevel or nil,
            targetRule = diagnostics and diagnostics.targetRule or nil,
            specialFallbackReason = specialFallbackReason,
            checkedAt = Now(),
        }
        FinishCandidate()
    end

    local function AcceptPreview(candidate, outputLink, previewMeta, isFallback)
        previewMeta.automatic = true
        previewMeta.configuredMaximumItemLevel = previewMeta.targetItemLevel
        local accepted, result = PromoteCandidateFromLink(
            candidate,
            outputLink,
            previewMeta,
            previewMeta.targetItemLevel
        )
        if accepted then
            run.accepted = run.accepted + 1
            if previewMeta.isSpecial then
                run.specialAccepted = run.specialAccepted + 1
            else
                run.normalAccepted = run.normalAccepted + 1
            end
            if isFallback then
                run.fallbackAccepted = run.fallbackAccepted + 1
            end
        else
            run.failed = run.failed + 1
            candidate.status = "automatic_capture_failed"
            candidate.statusReason = tostring(result)
        end
        FinishCandidate()
    end

    local function TryCandidate(candidate, retryAttempt)
        local outputLink, previewMeta, diagnostics = CraftExport.FindConfiguredMaximumPreview(candidate, false)
        run.probed = run.probed + 1
        if outputLink then
            AcceptPreview(candidate, outputLink, previewMeta, false)
            return
        end

        local maxRetries = tonumber(config.linkRetryCount) or 0
        local shouldRetry = diagnostics
            and diagnostics.isSpecial
            and diagnostics.adjustedItemLevel == nil
            and diagnostics.adjustedLink
            and retryAttempt < maxRetries
        if shouldRetry then
            CraftExport.PreloadConfiguredLink(diagnostics.adjustedLink)
            run.retryCount = run.retryCount + 1
            local delay = tonumber(config.linkRetryDelaySeconds) or 0
            C_Timer.After(delay, function()
                TryCandidate(candidate, retryAttempt + 1)
            end)
            return
        end

        if diagnostics and diagnostics.isSpecial then
            local specialFallbackReason = diagnostics.reason or "special_profile_unverified"
            local fallbackLink, fallbackMeta, fallbackDiagnostics =
                CraftExport.FindConfiguredMaximumPreview(candidate, true)
            run.probed = run.probed + 1
            if fallbackLink then
                fallbackMeta.specialFallbackReason = specialFallbackReason
                AcceptPreview(candidate, fallbackLink, fallbackMeta, true)
            else
                MarkPending(candidate, fallbackDiagnostics, specialFallbackReason)
            end
            return
        end

        MarkPending(candidate, diagnostics, nil)
    end

    ProcessCandidate = function()
        index = index + 1
        local key = keys[index]
        if not key then
            Finish()
            return
        end

        local candidate = db.candidates[key]
        if not candidate then
            FinishCandidate()
            return
        end
        TryCandidate(candidate, 0)
    end

    local function PrewarmSpecialLinks()
        local preloaded = 0
        for _, key in ipairs(keys) do
            local candidate = db.candidates[key]
            local _, _, isSpecial = CraftExport.GetConfiguredCraftProfile(candidate, false)
            if candidate and isSpecial then
                local outputLink, _, diagnostics = CraftExport.FindConfiguredMaximumPreview(candidate, false)
                local preloadLink = outputLink or (diagnostics and diagnostics.adjustedLink)
                if preloadLink and CraftExport.PreloadConfiguredLink(preloadLink) then
                    preloaded = preloaded + 1
                end
            end
        end
        return preloaded
    end

    run.preloadedSpecialLinks = PrewarmSpecialLinks()
    local initialDelay = run.preloadedSpecialLinks > 0
        and (tonumber(config.linkRetryDelaySeconds) or 0)
        or 0
    if run.preloadedSpecialLinks > 0 then
        Print(string.format("已预热%d件特殊栏位链接，等待说明框效果加载", run.preloadedSpecialLinks))
    end
    C_Timer.After(initialDelay, ProcessCandidate)
    return true, run
end

local function ShowStatus()
    local summary = CraftExport.RefreshSummary()
    Print(string.format(
        "已通过 %d，可变装等候选 %d，已排除 %d，错误 %d",
        summary.accepted,
        summary.candidates,
        summary.rejected,
        summary.errors
    ))
    local db = EnsureDatabase()
    if db.lastScan and db.lastScan.stats then
        local stats = db.lastScan.stats
        Print(string.format(
            "最近扫描：总计 %d，候选 %d，排除 %d，物品信息未就绪 %d",
            stats.scanned or 0,
            stats.candidates or 0,
            stats.rejected or 0,
            stats.unresolved or 0
        ))
    end
    if db.automaticRun then
        local run = db.automaticRun
        Print(string.format(
            "自动验证：处理%d/%d，普通%d，特殊%d，回退%d，未验证%d，失败%d",
            run.processed or 0,
            run.total or 0,
            run.normalAccepted or 0,
            run.specialAccepted or 0,
            run.fallbackAccepted or 0,
            run.pending or 0,
            run.failed or 0
        ))
    end
end

local function ShowHelp()
    Print("/wowcraft preflight - 自动加载订单模块并采集 S2 制造订单候选")
    Print("/wowcraft scan - S2 规则确认前会拒绝最终制造装备导出")
    Print("/wowcraft capture - 手动补采自动验证失败的当前订单预览")
    Print("/wowcraft status - 查看采集数量")
    Print("/wowcraft reset confirm - 清空本插件的采集数据")
    Print("/wowcraft help - 显示本说明")
end

local function FinishPreflightScan(trigger)
    local ok, result = CraftExport.Scanner.TryCompleteScan(trigger)
    if ok then
        Print(string.format(
            "预检扫描已完成：共 %d 项，找到 %d 件可变装等战斗装备，排除 %d 项。",
            result.scanned, result.candidates, result.rejected
        ))
        Print("S2 制造预检完成。请 /reload 保存；候选清单不能作为最终制造数据发布。")
        return true
    end
    return false, result
end

local PREFLIGHT_POLL_SECONDS = 2
local PREFLIGHT_MAX_POLLS = 9

local function StopPreflightScan(code, message)
    CraftExport.Scanner.scanRequested = false
    Print(message)
    RecordError(code, message, CraftExport.Scanner.GetDiagnostics())
end

local function PollPreflightScan(attempt)
    if not CraftExport.Scanner.scanRequested then
        return
    end

    local completed, result = FinishPreflightScan("timer_" .. tostring(attempt))
    if completed then
        return
    end

    if attempt >= PREFLIGHT_MAX_POLLS then
        StopPreflightScan(
            "preflight_timeout",
            "扫描未完成：18 秒内没有得到订单目录。" .. CraftExport.Scanner.GetDiagnostics()
        )
        return
    end

    local retryOk, retryMessage = CraftExport.Scanner.RetryScanRequest()
    if not retryOk then
        StopPreflightScan("preflight_retry_failed", retryMessage .. "。" .. CraftExport.Scanner.GetDiagnostics())
        return
    end

    if attempt == 1 or attempt % 3 == 0 then
        Print(string.format("仍在自动读取制造订单目录（第 %d/%d 次检查）。", attempt, PREFLIGHT_MAX_POLLS))
    end
    C_Timer.After(PREFLIGHT_POLL_SECONDS, function()
        PollPreflightScan(attempt + 1)
    end)
end

local function HandleCommand(message)
    local command, rest = tostring(message or ""):match("^%s*(%S*)%s*(.-)%s*$")
    command = string.lower(command or "")

    if command == "preflight" then
        local config = CraftExport.SEASON_CONFIG or {}
        local _, buildNumber = GetBuildInfo()
        if tonumber(buildNumber) < tonumber(config.minimumBuild) then
            Print("当前客户端 Build 过旧：" .. tostring(buildNumber)
                .. "，至少需要 " .. tostring(config.minimumBuild))
            return
        end
        if tonumber(buildNumber) ~= tonumber(config.testedBuild) then
            Print("当前客户端 Build 为 " .. tostring(buildNumber)
                .. "（预检基线 " .. tostring(config.testedBuild) .. "）；将继续采集并记录实际 Build。")
        end
        local db = EnsureDatabase()
        db.mode = "preflight"
        db.dataVersion = config.dataVersion
        db.seasonName = config.seasonName
        db.clientBuild = tonumber(buildNumber) or 0
        local ok, result = CraftExport.Scanner.RequestScan()
        Print(result)
        if not ok then
            RecordError("preflight_request_failed", result)
        else
            C_Timer.After(1, function()
                if CraftExport.Scanner.scanRequested then
                    PollPreflightScan(1)
                end
            end)
        end
    elseif command == "scan" then
        if (CraftExport.SEASON_CONFIG or {}).releaseStatus ~= "finalized" then
            Print("final_export_blocked_until_manifest_finalized：请先运行 /wowcraft preflight")
            return
        end
        local ok, result = CraftExport.Scanner.RequestScan()
        Print(result)
        if not ok then
            RecordError("scan_request_failed", result)
        end
    elseif command == "capture" then
        local ok, result = CaptureCurrentPreview()
        if ok then
            Print(string.format(
                "已导出：%s（装等%d，随机属性%d项）",
                result.name or "未知装备",
                result.itemLevel or 0,
                result.randomAttributeCount or 0
            ))
        else
            Print(result)
        end
    elseif command == "status" then
        ShowStatus()
    elseif command == "reset" then
        if rest == "confirm" then
            WoWLookCraftExportDB = NewDatabase()
            Print("采集数据已清空")
        else
            Print("此操作会清空全部制造业采集数据，请输入 /wowcraft reset confirm")
        end
    elseif command == "help" or command == "" then
        ShowHelp()
    else
        Print("未知命令：" .. command)
        ShowHelp()
    end
end

SLASH_WOWLOOKCRAFTEXPORT1 = "/wowcraft"
SLASH_WOWLOOKCRAFTEXPORT2 = "/wc"
SlashCmdList.WOWLOOKCRAFTEXPORT = HandleCommand

eventFrame:RegisterEvent("ADDON_LOADED")
eventFrame:RegisterEvent("CRAFTINGORDERS_CUSTOMER_OPTIONS_PARSED")
eventFrame:SetScript("OnEvent", function(_, event, ...)
    if event == "ADDON_LOADED" then
        local loadedAddon = ...
        if loadedAddon == AddonName then
            EnsureDatabase()
            CraftExport.RefreshSummary()
        end
    elseif event == "CRAFTINGORDERS_CUSTOMER_OPTIONS_PARSED" and CraftExport.Scanner.scanRequested then
        FinishPreflightScan("client_event")
    end
end)
