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

local function PromoteCandidateFromLink(candidate, outputLink, previewMeta)
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
    if parsed.itemLevel ~= CraftExport.TARGET_ITEM_LEVEL then
        candidate.status = "preview_not_285"
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
        return false, "当前预览是" .. tostring(parsed.itemLevel or "未知") .. "装等，请放入最高制造材料并确认预览达到285"
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
            candidateRule = "customer_option_246_plus",
            candidateItemLevel = candidate.iLvlMin,
            targetItemLevel = CraftExport.TARGET_ITEM_LEVEL,
        },
        preview = preview,
        tooltipRaw = CopyRawLines(tooltipLines),
        capturedAt = Now(),
        capturedBy = CharacterName(),
        clientBuild = tonumber(clientBuild) or clientBuild,
        addonVersion = CraftExport.VERSION,
    }

    db.items[key] = formalItem
    candidate.status = "accepted_285"
    candidate.statusReason = "verified_tooltip_285"
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
        return false, "当前配方不在246+候选中，请先运行 /wowcraft scan"
    end

    local outputLink, linkError, optionalReagents, highestQualityId = GetOutputLink(form, recipeId)
    if not outputLink then
        RecordError("output_link_unavailable", linkError, { recipeId = recipeId, itemId = candidate.itemId })
        return false, linkError
    end

    return PromoteCandidateFromLink(candidate, outputLink, {
        mode = "manual_order_form",
        highestQualityId = highestQualityId,
        optionalReagentCount = #optionalReagents,
    })
end


function CraftExport.StartAutomaticCapture()
    if CraftExport.automaticCaptureRunning then
        return false, "自动285验证正在运行"
    end

    local db = EnsureDatabase()
    local keys = {}
    for key in pairs(db.candidates) do
        if not db.items[key] then
            keys[#keys + 1] = key
        end
    end
    table.sort(keys, function(left, right)
        return tonumber(left) < tonumber(right)
    end)

    local run = {
        startedAt = Now(),
        total = #keys,
        processed = 0,
        accepted = 0,
        pending = 0,
        failed = 0,
    }
    db.automaticRun = run

    if #keys == 0 then
        run.completedAt = Now()
        Print("没有等待自动验证的246+装备")
        return true, run
    end

    CraftExport.automaticCaptureRunning = true
    Print(string.format("开始自动验证 %d 件246+装备，无需打开制造订单界面", #keys))

    local index = 0
    local function ProcessNext()
        index = index + 1
        local key = keys[index]
        if not key then
            CraftExport.automaticCaptureRunning = false
            run.completedAt = Now()
            CraftExport.RefreshSummary()
            Print(string.format(
                "自动验证完成：通过 %d，待验证 %d，失败 %d",
                run.accepted,
                run.pending,
                run.failed
            ))
            return
        end

        local candidate = db.candidates[key]
        if candidate then
            local outputLink, previewMeta, diagnostics = CraftExport.FindAutomatic285Preview(candidate)
            run.processed = run.processed + 1
            if outputLink then
                previewMeta = previewMeta or {}
                previewMeta.automatic = true
                previewMeta.testedPreviewCount = diagnostics and diagnostics.tested or 0
                local accepted, result = PromoteCandidateFromLink(candidate, outputLink, previewMeta)
                if accepted then
                    run.accepted = run.accepted + 1
                else
                    run.failed = run.failed + 1
                    candidate.status = "automatic_capture_failed"
                    candidate.statusReason = tostring(result)
                end
            else
                run.pending = run.pending + 1
                candidate.status = "automatic_285_pending"
                candidate.statusReason = diagnostics and diagnostics.reason or "automatic_285_preview_not_found"
                candidate.automaticPreview = {
                    bestItemLevel = diagnostics and diagnostics.bestItemLevel or nil,
                    bestLink = diagnostics and diagnostics.bestLink or nil,
                    tested = diagnostics and diagnostics.tested or 0,
                    checkedAt = Now(),
                }
            end
        end

        if run.processed % 10 == 0 then
            Print(string.format("自动验证进度：%d/%d", run.processed, run.total))
        end
        CraftExport.RefreshSummary()
        C_Timer.After(0, ProcessNext)
    end

    C_Timer.After(0, ProcessNext)
    return true, run
end

local function ShowStatus()
    local summary = CraftExport.RefreshSummary()
    Print(string.format(
        "已通过 %d，246+候选 %d，已排除 %d，错误 %d",
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
            "自动验证：%d/%d，通过 %d，待验证 %d，失败 %d",
            run.processed or 0,
            run.total or 0,
            run.accepted or 0,
            run.pending or 0,
            run.failed or 0
        ))
    end
end

local function ShowHelp()
    Print("/wowcraft scan - 无需打开界面，自动扫描246+装备并验证285结果")
    Print("/wowcraft capture - 手动补采自动验证失败的当前订单预览")
    Print("/wowcraft status - 查看采集数量")
    Print("/wowcraft reset confirm - 清空本插件的采集数据")
    Print("/wowcraft help - 显示本说明")
end

local function HandleCommand(message)
    local command, rest = tostring(message or ""):match("^%s*(%S*)%s*(.-)%s*$")
    command = string.lower(command or "")

    if command == "scan" then
        local ok, result = CraftExport.Scanner.RequestScan()
        Print(result)
        if not ok then
            RecordError("scan_request_failed", result)
        end
    elseif command == "capture" then
        local ok, result = CaptureCurrentPreview()
        if ok then
            Print(string.format(
                "已导出：%s（285，随机属性%d项）",
                result.name or "未知装备",
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
        local ok, result = CraftExport.Scanner.CompleteScan()
        if ok then
            Print(string.format(
                "扫描完成：共 %d 项，找到 %d 件246+战斗装备，排除 %d 项",
                result.scanned,
                result.candidates,
                result.rejected
            ))
            C_Timer.After(0, function()
                CraftExport.StartAutomaticCapture()
            end)
        else
            Print(result)
            RecordError("scan_failed", result)
        end
    end
end)
