const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const ADDON_DIR = path.join(ROOT, 'addon', 'WoWLookTierExport');
const TOC_PATH = path.join(ADDON_DIR, 'WoWLookTierExport.toc');
const CONFIG_PATH = path.join(ADDON_DIR, 'SeasonConfig.lua');
const ADDON_PATH = path.join(ADDON_DIR, 'WoWLookTierExport.lua');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function parseArgs(argv) {
  const args = {};
  for (let index = 2; index < argv.length; index += 1) {
    const key = argv[index];
    if (!key.startsWith('--')) continue;
    const next = argv[index + 1];
    if (!next || next.startsWith('--')) args[key.slice(2)] = true;
    else {
      args[key.slice(2)] = next;
      index += 1;
    }
  }
  return args;
}

function decodeLuaString(value) {
  let result = '';
  for (let index = 0; index < value.length; index += 1) {
    if (value[index] !== '\\') {
      result += value[index];
      continue;
    }
    const next = value[index + 1];
    if (next === '"' || next === '\\') {
      result += next;
      index += 1;
    } else if (next === 'n' || next === 'r' || next === 't') {
      result += `\\${next}`;
      index += 1;
    } else result += value[index];
  }
  return result;
}

function readPayload(inputPath) {
  const raw = fs.readFileSync(inputPath, 'utf8');
  const matches = [...raw.matchAll(/(?:\["payload"\]|payload)\s*=\s*"((?:[^"\\]|\\.)*)"/gs)];
  assert(matches.length > 0, 'SavedVariables 中没有找到 payload。');
  return JSON.parse(decodeLuaString(matches[matches.length - 1][1]));
}

function runStaticChecks() {
  const toc = fs.readFileSync(TOC_PATH, 'utf8');
  assert(fs.existsSync(CONFIG_PATH), '缺少套装赛季配置 SeasonConfig.lua。');
  const config = fs.readFileSync(CONFIG_PATH, 'utf8');
  const addon = fs.readFileSync(ADDON_PATH, 'utf8');

  const configIndex = toc.indexOf('SeasonConfig.lua');
  const addonIndex = toc.indexOf('WoWLookTierExport.lua');
  assert(configIndex >= 0 && configIndex < addonIndex, 'TOC 必须先加载 SeasonConfig.lua。');
  assert(/seasonName\s*=\s*"Midnight Season 2"/.test(config), '套装插件尚未切换到 Midnight S2。');
  assert(/testedBuild\s*=\s*69273/.test(config), '套装插件未锁定客户端 Build 69273。');
  assert(/releaseStatus\s*=\s*"preflight_required"/.test(config), '套装插件必须先处于 S2 预检状态。');
  assert(addon.includes('local function BuildPreflightPayload'), '套装插件缺少预检导出构造函数。');
  assert(addon.includes('local function CapturePreflightItem'), '套装插件缺少真实 S2 物品链接采集函数。');
  assert(addon.includes('arg == "preflight"'), '套装插件缺少 /wowtierexport preflight 命令。');
  assert(addon.includes('arg:match("^capture%s+(.+)$")'), '套装插件缺少 /wowtierexport capture 命令。');
  assert(addon.includes('final_export_blocked_until_manifest_finalized'), '套装插件没有阻止未确认规则下的最终导出。');
  assert(!/targetItemLevel\s*=\s*289/.test(config), 'S1 套装装等仍写入 S2 配置。');
  assert(!/trackBonusId\s*=\s*12806/.test(config), 'S1 套装 Bonus ID 仍写入 S2 配置。');
  assert(/local ADDON_VERSION = "1\.0\.0-s2-preflight"/.test(addon), '套装插件版本不是 S2 预检版。');
  console.log('S2 套装预检插件静态检查通过。');
}

function runPayloadChecks(inputPath) {
  const payload = readPayload(path.resolve(process.cwd(), inputPath));
  const items = (payload.classes || []).flatMap((classData) => classData.items || []);
  const failures = [];

  assert(payload.maximumProfile, '导出数据缺少 maximumProfile。');
  assert(payload.maximumProfile.targetItemLevel === 289, '导出目标装等不是289。');
  assert(items.length === 117, `套装数量不是117，实际${items.length}。`);

  items.forEach((item) => {
    const parsed = item.tooltip && item.tooltip.parsed;
    let reason = '';
    if (item.maximumStatus !== 'ok') reason = item.maximumStatus || 'maximum_status_missing';
    else if (item.itemLevel !== 289) reason = `item_level_${item.itemLevel}`;
    else if (!item.detailedItemLevel || item.detailedItemLevel.effective !== 289) reason = 'api_item_level_mismatch';
    else if (!parsed || parsed.itemLevel !== 289) reason = 'tooltip_item_level_mismatch';
    else if (!String(parsed.upgradeTrack || '').includes('神话 6/6')) reason = 'myth_track_missing';
    else if (!/:12806(?=:|$)/.test(item.seasonLink || '')) reason = 'track_bonus_missing';
    else if (!/:1674(?=:|$)/.test(item.seasonLink || '')) reason = 'quality_bonus_missing';
    if (reason) failures.push(`${item.itemId}:${reason}`);
  });

  assert(failures.length === 0, `套装289验证失败${failures.length}件：${failures.slice(0, 20).join(', ')}`);
  assert(payload.summary && payload.summary.maximumSuccessCount === 117, '成功数不是117。');
  assert(payload.summary.maximumFailureCount === 0, '仍有套装最高档失败。');
  console.log('套装导出数据检查通过：117件装备全部为神话6/6、物品等级289。');
}

function runDataChecks(dataDir) {
  const resolvedDir = path.resolve(process.cwd(), dataDir);
  const files = fs.readdirSync(resolvedDir)
    .filter((name) => name.endsWith('.json') && name !== 'overview.json');
  assert(files.length === 13, `职业数据文件不是13个，实际${files.length}。`);

  const items = [];
  files.forEach((file) => {
    const data = JSON.parse(fs.readFileSync(path.join(resolvedDir, file), 'utf8'));
    assert(data.version === '4.3.x' && data.dataVersion === '4.3.x', `${file} 数据版本不是4.3.x。`);
    const tierInstance = (data.instances || []).find((instance) => instance.type === 'tier');
    assert(tierInstance, `${file} 缺少套装实例。`);
    const classItems = (tierInstance.encounters || []).flatMap((encounter) => encounter.items || []);
    assert(classItems.length === 9, `${file} 套装数量不是9，实际${classItems.length}。`);
    items.push(...classItems);
  });

  const failures = items.filter((item) => item.ilvl !== 289
    || item.upgradeTrack !== '神话 6/6'
    || !/:12806(?=:|$)/.test(item.link || '')
    || !/:1674(?=:|$)/.test(item.link || '')
    || !(item.stats && item.stats.stamina && item.stats.stamina.value > 0));
  assert(items.length === 117, `生成数据中的套装总数不是117，实际${items.length}。`);
  assert(failures.length === 0, `生成数据仍有${failures.length}件套装未正确转换为289。`);
  assert(items.filter((item) => item.isBonusPiece === true).length === 65, '核心套装数量不是65。');
  console.log('data-4.3.x 检查通过：13职业、117件套装全部为289。');
}

try {
  const args = parseArgs(process.argv);
  runStaticChecks();
  if (args.input) runPayloadChecks(args.input);
  if (args['data-dir']) runDataChecks(args['data-dir']);
  if (!args.input && !args['data-dir'] && !args.static) console.log('未提供输入，仅执行静态检查。');
} catch (error) {
  console.error(`检查失败：${error.message}`);
  process.exitCode = 1;
}
