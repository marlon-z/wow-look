// 测团本日志能否拿到 combatantInfo（装备/天赋/属性）
const fs = require('fs');
const path = require('path');
const BASE = 'https://www.warcraftlogs.com';
async function getToken(id, secret) {
  const basic = Buffer.from(`${id}:${secret}`).toString('base64');
  const res = await fetch(`${BASE}/oauth/token`, { method: 'POST', headers: { Authorization: `Basic ${basic}`, 'Content-Type': 'application/x-www-form-urlencoded' }, body: 'grant_type=client_credentials' });
  return (await res.json()).access_token;
}
async function gql(token, q, v) {
  const res = await fetch(`${BASE}/api/v2/client`, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ query: q, variables: v }) });
  return res.json();
}
async function main() {
  const token = await getToken(process.env.WCL_CLIENT_ID, process.env.WCL_CLIENT_SECRET);
  const enc = Number(process.argv[2] || 3159);
  // 团本排行（不限职业），取 metric dps
  const qr = `query($enc:Int!){worldData{encounter(id:$enc){name characterRankings(metric: dps, leaderboard: Any)}}}`;
  const dr = await gql(token, qr, { enc });
  if (dr.errors) { console.log('rank err', JSON.stringify(dr.errors).slice(0, 300)); return; }
  const cr = dr.data.worldData.encounter.characterRankings;
  const list = cr.rankings || [];
  console.log(`团本 ${dr.data.worldData.encounter.name}: ${list.length} 条排名, 样本 count=${cr.count}`);
  if (list[0]) console.log('第1条:', JSON.stringify({ name: list[0].name, spec: list[0].spec, amount: list[0].amount, region: list[0].server && list[0].server.region, report: list[0].report }));

  const q = `query($code:String!,$fight:Int!){reportData{report(code:$code){ playerDetails(fightIDs:[$fight]) }}}`;
  for (let i = 0; i < Math.min(list.length, 15); i += 1) {
    const r = list[i].report;
    const d = await gql(token, q, { code: r.code, fight: r.fightID });
    const rep = d.data && d.data.reportData.report;
    if (!rep) { console.log(`  [${i}] ${r.code} 无`); continue; }
    const pd = rep.playerDetails.data.playerDetails;
    const all = [].concat(pd.dps || [], pd.healers || [], pd.tanks || []);
    const withCI = all.find((p) => p.combatantInfo && Object.keys(p.combatantInfo).length > 0);
    if (withCI) {
      const ci = withCI.combatantInfo;
      console.log(`\n✅ [${i}] ${r.code} 玩家 ${withCI.name} 有 combatantInfo!`);
      console.log('  字段:', Object.keys(ci).join(', '));
      if (ci.stats) console.log('  stats:', JSON.stringify(ci.stats).slice(0, 400));
      if (ci.gear) console.log('  gear件数:', ci.gear.length, '第1件:', JSON.stringify(ci.gear[0]));
      if (ci.talents) console.log('  talents条数:', ci.talents.length, '示例:', JSON.stringify(ci.talents[0]));
      if (ci.talentTree) console.log('  talentTree:', JSON.stringify(ci.talentTree).slice(0, 150));
      fs.writeFileSync(path.join(__dirname, 'wcl-spike-out', 'probe-raid-combatant.json'), JSON.stringify(withCI, null, 2));
      console.log('  -> 存 probe-raid-combatant.json');
      return;
    }
    console.log(`  [${i}] ${r.code} (${list[i].server.region}) CI空`);
  }
  console.log('团本前15条也没 combatantInfo。');
}
main().catch((e) => console.error(e));
