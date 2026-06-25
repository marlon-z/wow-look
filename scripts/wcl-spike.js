#!/usr/bin/env node
/**
 * WCL 数据验证脚本 (spike)
 * ---------------------------------------------------------------
 * 目的：在写任何小程序代码之前，先确认 Warcraft Logs v2 API 到底能
 *      返回哪些字段，能不能凑出竞品截图里那七块东西。
 *
 * 这是一个独立的开发期工具，不属于小程序，也不会被打包进小程序。
 *
 * 用法：
 *   1) 去 https://www.warcraftlogs.com/api/clients/ 创建一个 API client
 *      （免费，登录后点 "Create Client"，名字随便填，Redirect URL 填
 *        http://localhost 即可），拿到 Client ID 和 Client Secret。
 *   2) 设置环境变量后运行：
 *        Windows PowerShell:
 *          $env:WCL_CLIENT_ID="xxx"; $env:WCL_CLIENT_SECRET="yyy"; node scripts/wcl-spike.js
 *        Git Bash / Linux:
 *          WCL_CLIENT_ID=xxx WCL_CLIENT_SECRET=yyy node scripts/wcl-spike.js
 *
 *   可选参数：
 *     --class Mage      职业英文名（默认 Mage）
 *     --spec Fire       专精英文名（默认 Fire）
 *     --metric dps      排序指标（默认 dps）
 *     --zone 43         指定 zoneID（不填则自动列出、并选最新的 M+ 赛季）
 *
 * 输出：所有原始返回会写到 scripts/wcl-spike-out/*.json，方便我们逐字段看。
 *
 * 需要 Node 18+（用到内置 fetch）。
 */

const fs = require('fs');
const path = require('path');

const OUT_DIR = path.join(__dirname, 'wcl-spike-out');
// 站点基址：V2 client 在 www.warcraftlogs.com 创建，密钥就打 www 的接口。
// 国服(CN)数据通过 region 过滤来取，而不是换站点。可用环境变量 WCL_BASE 覆盖。
const BASE = (process.env.WCL_BASE || 'https://www.warcraftlogs.com').replace(/\/$/, '');
const TOKEN_URL = `${BASE}/oauth/token`;
const GQL_URL = `${BASE}/api/v2/client`;

// ----------------------------- 参数解析 -----------------------------
function parseArgs(argv) {
  const args = { class: 'Mage', spec: 'Fire', metric: 'dps', zone: null };
  for (let i = 2; i < argv.length; i += 1) {
    const key = argv[i];
    const val = argv[i + 1];
    if (key === '--class') { args.class = val; i += 1; }
    else if (key === '--spec') { args.spec = val; i += 1; }
    else if (key === '--metric') { args.metric = val; i += 1; }
    else if (key === '--zone') { args.zone = Number(val); i += 1; }
  }
  return args;
}

function ensureOutDir() {
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
}

function save(name, data) {
  ensureOutDir();
  const file = path.join(OUT_DIR, name);
  fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
  console.log(`  -> 已保存原始数据: ${path.relative(process.cwd(), file)}`);
}

// ----------------------------- 鉴权 -----------------------------
async function getToken(clientId, clientSecret) {
  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basic}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });
  if (!res.ok) {
    throw new Error(`鉴权失败 ${res.status}: ${await res.text()}`);
  }
  const json = await res.json();
  return json.access_token;
}

// ----------------------------- GraphQL 调用 -----------------------------
async function gql(token, query, variables) {
  const res = await fetch(GQL_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (json.errors) {
    console.error('GraphQL 错误:', JSON.stringify(json.errors, null, 2));
  }
  return json.data;
}

// ----------------------------- 步骤 1：列出赛区/副本 -----------------------------
async function step1ListZones(token) {
  console.log('\n[步骤1] 列出所有 zone（团本 + 大秘境赛季），找出 encounter ID...');
  const query = `
    query {
      worldData {
        zones {
          id
          name
          expansion { id name }
          encounters { id name }
        }
      }
    }`;
  const data = await gql(token, query, {});
  const zones = (data && data.worldData && data.worldData.zones) || [];
  save('step1-zones.json', zones);
  console.log(`  共 ${zones.length} 个 zone。最近的几个：`);
  zones.slice(-8).forEach((z) => {
    console.log(`    zoneID=${z.id}  ${z.name}  (${z.encounters.length} 个 encounter)`);
  });
  return zones;
}

// ----------------------------- 步骤 2：拉排行榜 -----------------------------
async function step2Rankings(token, encounterId, className, specName, metric) {
  console.log(`\n[步骤2] 拉 encounter=${encounterId} 的排行榜 (${className}/${specName}, metric=${metric})...`);
  const query = `
    query($encounterId: Int!, $class: String!, $spec: String!, $metric: CharacterRankingMetricType!) {
      worldData {
        encounter(id: $encounterId) {
          name
          characterRankings(
            className: $class
            specName: $spec
            metric: $metric
            leaderboard: Any
          )
        }
      }
    }`;
  const data = await gql(token, query, {
    encounterId, class: className, spec: specName, metric,
  });
  const enc = data && data.worldData && data.worldData.encounter;
  if (!enc) { console.log('  没拿到 encounter 数据。'); return null; }
  save('step2-rankings.json', enc.characterRankings);
  const cr = enc.characterRankings || {};
  const list = cr.rankings || [];
  console.log(`  encounter 名称: ${enc.name}`);
  console.log(`  样本总数(count/total): ${cr.count != null ? cr.count : '(看 step2-rankings.json 顶层字段)'}`);
  console.log(`  拿到 ${list.length} 条排名记录。第 1 条的全部字段：`);
  if (list[0]) console.log(JSON.stringify(list[0], null, 2).split('\n').map((l) => `    ${l}`).join('\n'));
  return list;
}

// ----------------------------- 步骤 3：拉单场战报的装备/天赋/属性 -----------------------------
async function step3CombatantInfo(token, reportCode, fightId, sourceName) {
  console.log(`\n[步骤3] 拉战报 code=${reportCode} fight=${fightId} 的 CombatantInfo / table（装备/天赋/属性评级/伤害构成）...`);
  const query = `
    query($code: String!, $fight: Int!) {
      reportData {
        report(code: $code) {
          combatant: events(fightIDs: [$fight], dataType: CombatantInfo, limit: 100) { data }
          damageTable: table(fightIDs: [$fight], dataType: DamageDone)
          playerDetails: playerDetails(fightIDs: [$fight])
        }
      }
    }`;
  const data = await gql(token, query, { code: reportCode, fight: fightId });
  const report = data && data.reportData && data.reportData.report;
  if (!report) { console.log('  没拿到战报数据。'); return; }

  save('step3-combatantinfo.json', report.combatant);
  save('step3-damage-table.json', report.damageTable);
  save('step3-player-details.json', report.playerDetails);

  const events = (report.combatant && report.combatant.data) || [];
  console.log(`  CombatantInfo 事件 ${events.length} 个。`);
  let mine = events[0];
  if (sourceName) {
    // playerDetails 里能把 name -> sourceID 对上；这里只做粗略提示
    console.log(`  （想精确匹配 ${sourceName} 时，用 step3-player-details.json 里的 id 对应 sourceID）`);
  }
  if (mine) {
    const keys = Object.keys(mine);
    console.log('  单个 CombatantInfo 含有的顶层字段：');
    console.log(`    ${keys.join(', ')}`);
    // 重点展示：副属性评级 + 装备件数 + 天赋
    const interesting = {};
    ['strength', 'agility', 'intellect', 'critMelee', 'critSpell', 'hasteSpell', 'hasteMelee',
      'mastery', 'versatilityDamageDone', 'speed', 'leech'].forEach((k) => {
      if (mine[k] != null) interesting[k] = mine[k];
    });
    console.log('  副/主属性评级样例（这就是「属性排名」的原料）：');
    console.log(`    ${JSON.stringify(interesting)}`);
    if (Array.isArray(mine.gear)) {
      console.log(`  装备件数: ${mine.gear.length}，第一件: ${JSON.stringify(mine.gear[0])}`);
    }
    if (mine.talents || mine.talentTree) {
      console.log('  天赋字段存在（talents / talentTree）—— 可用于「推荐天赋 / 导出」。');
    }
  }
}

// ----------------------------- 主流程 -----------------------------
async function main() {
  const args = parseArgs(process.argv);
  const clientId = process.env.WCL_CLIENT_ID;
  const clientSecret = process.env.WCL_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    console.error('请先设置环境变量 WCL_CLIENT_ID 和 WCL_CLIENT_SECRET。见本文件顶部用法说明。');
    process.exit(1);
  }

  console.log(`使用站点: ${BASE}`);
  console.log('正在鉴权...');
  const token = await getToken(clientId, clientSecret);
  console.log('  鉴权成功。');

  const zones = await step1ListZones(token);

  // 选一个 encounter：优先用 --zone 指定的；否则用最后一个 zone 的第一个 encounter
  let encounterId = null;
  if (args.zone) {
    const z = zones.find((x) => x.id === args.zone);
    if (z && z.encounters[0]) encounterId = z.encounters[0].id;
  }
  if (!encounterId) {
    const last = zones[zones.length - 1];
    if (last && last.encounters[0]) encounterId = last.encounters[0].id;
  }
  if (!encounterId) {
    console.log('\n没找到可用的 encounter，请看 step1-zones.json 手动挑一个，再用 --zone 重跑。');
    return;
  }

  const rankings = await step2Rankings(token, encounterId, args.class, args.spec, args.metric);

  // 取第一条记录的 report 信息进入步骤3
  if (rankings && rankings[0] && rankings[0].report) {
    const r = rankings[0].report;
    const code = r.code;
    const fightId = r.fightID != null ? r.fightID : r.fightId;
    if (code && fightId != null) {
      await step3CombatantInfo(token, code, fightId, rankings[0].name);
    } else {
      console.log('\n第 1 条排名里没有 report.code / fightID，请看 step2-rankings.json 确认字段名。');
    }
  } else {
    console.log('\n排行榜里没有 report 引用，无法进入步骤3。请看 step2-rankings.json 的实际结构。');
  }

  console.log('\n完成。请把 scripts/wcl-spike-out/ 下的 json 发我，或直接告诉我里面有没有 gear / talents / 各项属性评级。');
}

main().catch((err) => {
  console.error('运行出错:', err);
  process.exit(1);
});
