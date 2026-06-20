const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const ADDON_DIR = path.join(ROOT, 'addon', 'WoWLookExport3');
const TOC_PATH = path.join(ADDON_DIR, 'WoWLookExport3.toc');
const CONFIG_PATH = path.join(ADDON_DIR, 'SeasonConfig.lua');
const ADDON_PATH = path.join(ADDON_DIR, 'WoWLookExport3.lua');

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function decodeLuaString(value) {
  let result = '';
  for (let index = 0; index < value.length; index += 1) {
    const char = value[index];
    if (char !== '\\') {
      result += char;
      continue;
    }
    const next = value[index + 1];
    if (next === '"' || next === '\\') {
      result += next;
      index += 1;
      continue;
    }
    if (next === 'n' || next === 'r' || next === 't') {
      result += `\\${next}`;
      index += 1;
      continue;
    }
    result += char;
  }
  return result;
}

function readPayload(inputPath) {
  const raw = fs.readFileSync(inputPath, 'utf8');
  const match = raw.match(/(?:\["payload"\]|payload)\s*=\s*"((?:[^"\\]|\\.)*)"/s);
  assert(match, 'SavedVariables 中没有找到 payload。');
  return JSON.parse(decodeLuaString(match[1]));
}

function parseArgs(argv) {
  const args = {};
  for (let index = 2; index < argv.length; index += 1) {
    const key = argv[index];
    if (!key.startsWith('--')) continue;
    const next = argv[index + 1];
    if (!next || next.startsWith('--')) {
      args[key.slice(2)] = true;
    } else {
      args[key.slice(2)] = next;
      index += 1;
    }
  }
  return args;
}

function readNumber(lua, key) {
  const match = lua.match(new RegExp(`${key}\\s*=\\s*(\\d+)`));
  return match ? Number(match[1]) : 0;
}

function runStaticChecks() {
  const toc = fs.readFileSync(TOC_PATH, 'utf8');
  const config = fs.readFileSync(CONFIG_PATH, 'utf8');
  const addon = fs.readFileSync(ADDON_PATH, 'utf8');
  const configIndex = toc.indexOf('SeasonConfig.lua');
  const addonIndex = toc.indexOf('WoWLookExport3.lua');

  assert(configIndex >= 0, 'TOC 未加载 SeasonConfig.lua。');
  assert(addonIndex >= 0, 'TOC 未加载 WoWLookExport3.lua。');
  assert(configIndex < addonIndex, 'SeasonConfig.lua 必须先于主文件加载。');
  assert(readNumber(config, 'profileVersion') > 0, 'profileVersion 无效。');
  assert(readNumber(config, 'seasonId') > 0, 'seasonId 无效。');
  assert(readNumber(config, 'testedBuild') > 0, 'testedBuild 无效。');
  assert(readNumber(config, 'minimumBuild') > 0, 'minimumBuild 无效。');

  const targetLevels = [...config.matchAll(/targetItemLevel\s*=\s*(\d+)/g)].map((match) => Number(match[1]));
  const trackBonuses = [...config.matchAll(/trackBonusId\s*=\s*(\d+)/g)].map((match) => Number(match[1]));
  assert(targetLevels.length >= 2 && targetLevels.every((value) => value > 0), '目标装等配置缺失或为占位值。');
  assert(trackBonuses.length >= 2 && trackBonuses.every((value) => value > 0), '轨道 Bonus ID 缺失或为占位值。');
  assert(/voidforged\s*=\s*\{/.test(config), '缺少虚空铸造配置。');
  assert(/voidforged[\s\S]*?targetItemLevel\s*=\s*298/.test(config), '虚空铸造目标装等不是 298。');
  assert(/itemContext\s*=\s*35/.test(config), '虚空铸造物品上下文不是 35。');
  assert(/markerBonusId\s*=\s*13654/.test(config), '缺少虚空铸造史诗标记 13654。');
  assert(/commonBonusIds\s*=\s*\{\s*13440,\s*6652\s*\}/.test(config), '虚空铸造公共 Bonus ID 不完整。');
  assert(/trinketBonusId\s*=\s*12699/.test(config), '虚空铸造饰品 Bonus ID 不正确。');
  assert(/weaponBonusId\s*=\s*12701/.test(config), '虚空铸造武器 Bonus ID 不正确。');
  assert(/INVTYPE_TRINKET\s*=\s*12699/.test(config), '虚空铸造配置未映射饰品。');
  assert(/INVTYPE_WEAPONMAINHAND\s*=\s*12701/.test(config), '虚空铸造配置未映射主手武器。');
  assert(/INVTYPE_WEAPONOFFHAND\s*=\s*12701/.test(config), '虚空铸造配置未映射副手武器。');
  assert(addon.includes('local function ValidateMaxVersion'), '缺少最高档验证函数。');
  assert(addon.includes('local function ApplyVoidforgedRule'), '缺少虚空铸造规则选择函数。');
  assert(!addon.includes('local function ApplySpecialSlotCap'), '旧的通用 298 上限逻辑尚未移除。');
  assert(addon.includes('addonVersion = ADDON_VERSION'), '导出元数据没有使用当前源码版本。');
  assert(addon.includes('local ADDON_VERSION = "3.3.3"'), '插件源码版本不是 3.3.3。');
  const converter = fs.readFileSync(path.join(ROOT, 'scripts', 'parse-export.js'), 'utf8');
  assert(converter.includes('voidforgedMarkerBonusId'), '转换脚本未验证虚空铸造史诗标记。');
  assert(converter.includes('voidforgedTrinketBonusId'), '转换脚本未验证虚空铸造饰品 Bonus ID。');
  assert(converter.includes('voidforgedWeaponBonusId'), '转换脚本未验证虚空铸造武器 Bonus ID。');
  assert(addon.includes('target_item_level_mismatch'), '缺少目标装等不一致状态。');
  assert(addon.includes('item_identity_mismatch'), '缺少装备身份不一致状态。');
  assert(addon.includes('item.dropVersion'), '导出器未保留 dropVersion。');
  assert(addon.includes('item.maxVersion'), '导出器未生成 maxVersion。');
  assert(addon.includes('SLASH_WOWLOOKMAXEXPORT1 = "/wowlook"'), '主斜杠命令注册名无效。');
  assert(addon.includes('SLASH_WOWLOOKMAXEXPORT2 = "/wle"'), '短斜杠命令注册名无效。');
  assert(addon.includes('SlashCmdList.WOWLOOKMAXEXPORT = function'), '斜杠命令处理函数未注册。');
  assert(!addon.includes('tonumber(select(4, GetBuildInfo()))'), '构建号读取会把多余返回值传给 tonumber。');
  assert(!addon.includes('buildNumber = select(4, GetBuildInfo())'), '导出元数据把界面版本误作客户端 Build。');
  assert(addon.includes('local buildVersion, rawBuildNumber = GetBuildInfo()'), '客户端 Build 必须读取 GetBuildInfo 的第 2 个返回值。');
  assert(addon.includes('local function HandleSlashCommand'), '缺少可隔离测试的斜杠命令处理函数。');
  assert(addon.includes('xpcall(function()'), '斜杠命令入口缺少异常保护。');
  assert(!addon.includes('SLASH_WOWLOOKEXPORT31'), '斜杠命令内部名称不能以命令数字和别名数字连写。');
  assert(!addon.includes('= "/wowlook3"'), 'WoW 斜杠命令主体不能依赖末尾数字。');
  console.log('静态检查通过：配置、加载顺序、验证门禁和双版本字段完整。');
}

function runPayloadChecks(inputPath) {
  const payload = readPayload(path.resolve(process.cwd(), inputPath));
  assert(payload.maximumProfile, '导出数据缺少 maximumProfile；请确认使用 v3.3 插件重新导出。');
  assert(payload.maximumProfile.weaponTargetItemLevel === 298, '导出元数据中的武器最高装等不是 298。');
  assert(payload.maximumProfile.trinketTargetItemLevel === 298, '导出元数据中的饰品最高装等不是 298。');
  assert(payload.maximumProfile.voidforgedMarkerBonusId === 13654, '导出元数据缺少虚空铸造史诗标记。');
  const items = Object.values(payload.items || {});
  assert(items.length > 0, '导出数据没有装备。');

  const failures = [];
  const distribution = {};
  const weaponEquipLocs = new Set([
    'INVTYPE_WEAPON', 'INVTYPE_2HWEAPON', 'INVTYPE_WEAPONMAINHAND', 'INVTYPE_WEAPONOFFHAND',
    'INVTYPE_SHIELD', 'INVTYPE_HOLDABLE', 'INVTYPE_RANGED', 'INVTYPE_RANGEDRIGHT', 'INVTYPE_THROWN',
  ]);
  items.forEach((item) => {
    const maxVersion = item.maxVersion || {};
    const isTrinket = item.dropVersion && item.dropVersion.equipLoc === 'INVTYPE_TRINKET';
    const isWeapon = item.dropVersion && weaponEquipLocs.has(item.dropVersion.equipLoc);
    const isFixedSource = maxVersion.ruleSource === 'raid_fixed_mythic';
    const isVoidforged = maxVersion.voidforged === true || maxVersion.ruleSource === 'voidforged_myth';
    let reason = '';
    if (!item.dropVersion || item.dropVersion.status !== 'ok') reason = 'drop_version_invalid';
    else if (maxVersion.status !== 'ok') reason = maxVersion.status || 'max_version_missing';
    else if (item.itemLevel !== maxVersion.itemLevel) reason = 'top_level_item_level_mismatch';
    else if (item.link !== maxVersion.link) reason = 'top_level_link_mismatch';
    else if (maxVersion.expectedItemLevel > 0 && maxVersion.itemLevel !== maxVersion.expectedItemLevel) reason = 'expected_item_level_mismatch';
    else if (isTrinket && maxVersion.itemLevel !== 298) reason = 'trinket_voidforged_level_mismatch';
    else if (isWeapon && maxVersion.itemLevel !== 298) reason = 'weapon_voidforged_level_mismatch';
    else if ((isTrinket || isWeapon) && !isFixedSource && !isVoidforged) reason = 'voidforged_rule_missing';
    else if (isVoidforged && isTrinket && !/:12699(?=:|$)/.test(maxVersion.link || '')) reason = 'trinket_voidforged_bonus_missing';
    else if (isVoidforged && isWeapon && !/:12701(?=:|$)/.test(maxVersion.link || '')) reason = 'weapon_voidforged_bonus_missing';
    else if (isVoidforged && !/:13654(?=:|$)/.test(maxVersion.link || '')) reason = 'voidforged_marker_missing';
    if (reason) failures.push(`${item.itemId}:${reason}`);
    distribution[maxVersion.itemLevel || 0] = (distribution[maxVersion.itemLevel || 0] || 0) + 1;
  });

  assert(failures.length === 0, `最高装等验证失败 ${failures.length} 件：${failures.slice(0, 20).join(', ')}`);
  const diagnostics = payload.diagnostics || {};
  assert(diagnostics.maxVersionFailureCount === 0, `插件诊断仍有 ${diagnostics.maxVersionFailureCount} 个失败。`);
  assert(diagnostics.maxVersionSuccessCount === items.length, '插件成功数与装备总数不一致。');
  console.log(`导出数据检查通过：${items.length} 件装备全部具有有效最高档版本。`);
  console.log(`最高装等分布：${JSON.stringify(distribution)}`);
}

function main() {
  const args = parseArgs(process.argv);
  runStaticChecks();
  if (args.input) {
    runPayloadChecks(args.input);
  } else if (!args.static) {
    console.log('未提供 --input，仅执行静态检查。');
  }
}

try {
  main();
} catch (error) {
  console.error(`检查失败：${error.message}`);
  process.exitCode = 1;
}
