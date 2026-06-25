// 探针：扫排行榜多条战报，找到第一条带 combatantInfo 的，dump 装备/天赋/属性
const fs = require('fs');
const path = require('path');
const BASE = 'https://www.warcraftlogs.com';

async function getToken(id, secret) {
  const basic = Buffer.from(`${id}:${secret}`).toString('base64');
  const res = await fetch(`${BASE}/oauth/token`, {
    method: 'POST',
    headers: { Authorization: `Basic ${basic}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=client_credentials',
  });
  return (await res.json()).access_token;
}
async function gql(token, query, variables) {
  const res = await fetch(`${BASE}/api/v2/client`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables }),
  });
  return res.json();
}

async function main() {
  const token = await getToken(process.env.WCL_CLIENT_ID, process.env.WCL_CLIENT_SECRET);
  const rankings = require('./wcl-spike-out/step2-rankings.json').rankings;
  console.log(`扫描 ${rankings.length} 条排名，找带 combatantInfo 的战报...`);

  const q = `query($code:String!,$fight:Int!){reportData{report(code:$code){
    playerDetails(fightIDs:[$fight])
  }}}`;

  for (let i = 0; i < Math.min(rankings.length, 25); i += 1) {
    const r = rankings[i].report;
    const data = await gql(token, q, { code: r.code, fight: r.fightID });
    const rep = data && data.data && data.data.reportData && data.data.reportData.report;
    if (!rep) { console.log(`  [${i}] ${r.code} 无数据`); continue; }
    const pd = rep.playerDetails.data.playerDetails;
    const all = [].concat(pd.dps || [], pd.healers || [], pd.tanks || []);
    const withCI = all.find((p) => p.combatantInfo && Object.keys(p.combatantInfo).length > 0);
    if (withCI) {
      console.log(`\n✅ [${i}] 战报 ${r.code} fight ${r.fightID} 找到 combatantInfo！玩家: ${withCI.name} (${withCI.type})`);
      fs.writeFileSync(path.join(__dirname, 'wcl-spike-out', 'probe-combatant.json'), JSON.stringify(withCI, null, 2));
      const ci = withCI.combatantInfo;
      console.log('  combatantInfo 顶层字段:', Object.keys(ci).join(', '));
      if (ci.stats) console.log('  属性 stats 字段:', JSON.stringify(ci.stats).slice(0, 500));
      if (ci.gear) console.log(`  装备件数: ${ci.gear.length}, 第1件: ${JSON.stringify(ci.gear[0])}`);
      if (ci.talents) console.log(`  天赋条数: ${ci.talents.length}, 第1条: ${JSON.stringify(ci.talents[0])}`);
      if (ci.talentTree) console.log(`  talentTree 存在`);
      console.log('  -> 完整已存 probe-combatant.json');
      return;
    }
    console.log(`  [${i}] ${r.code} (${rankings[i].server.region}) combatantInfo 空`);
  }
  console.log('\n前25条都没有 combatantInfo。');
}
main().catch((e) => console.error(e));
