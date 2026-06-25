// 演示：法师火 Top100 的饰品(trinket)选取比例
// 思路：排行榜100条 -> 逐个开战报读 combatantInfo -> 取饰品槽 -> 统计占比
const fs = require('fs');
const BASE = 'https://www.warcraftlogs.com';

async function getToken(id, s) {
  const b = Buffer.from(`${id}:${s}`).toString('base64');
  const r = await fetch(`${BASE}/oauth/token`, { method: 'POST', headers: { Authorization: `Basic ${b}`, 'Content-Type': 'application/x-www-form-urlencoded' }, body: 'grant_type=client_credentials' });
  return (await r.json()).access_token;
}
async function gql(t, q, v) {
  const r = await fetch(`${BASE}/api/v2/client`, { method: 'POST', headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ query: q, variables: v }) });
  return r.json();
}

async function main() {
  const t = await getToken(process.env.WCL_CLIENT_ID, process.env.WCL_CLIENT_SECRET);
  const rankings = require('./wcl-spike-out/step2-rankings.json').rankings; // 法师火 Algeth'ar Academy Top100
  console.log(`样本: 法师/火 「Algeth'ar Academy」 Top${rankings.length}`);

  const q = `query($c:String!){reportData{report(code:$c){
    masterData{actors(type:"Player"){id name subType}}
    events(dataType:CombatantInfo,startTime:0,endTime:999999999,limit:300){data}
  }}}`;

  // 报告会复用，做个缓存
  const cache = {};
  async function getReport(code) {
    if (cache[code]) return cache[code];
    const d = await gql(t, q, { c: code });
    cache[code] = d.data && d.data.reportData && d.data.reportData.report;
    return cache[code];
  }

  const trinketCount = {}; // itemId -> {count, icon}
  let counted = 0;
  let missing = 0;

  // 限速：每条之间小睡，避免打满频率
  for (let i = 0; i < rankings.length; i += 1) {
    const e = rankings[i];
    try {
      const rep = await getReport(e.report.code);
      if (!rep) { missing += 1; continue; }
      // 用 name 找到这个玩家的 sourceID
      const actor = rep.masterData.actors.find((a) => a.name === e.name);
      const events = rep.events.data;
      let ci = actor ? events.find((x) => x.sourceID === actor.id) : null;
      // 兜底：按法师专精找（subType=Mage）
      if (!ci) ci = events.find((x) => x.gear && x.gear.length >= 14);
      if (!ci || !ci.gear) { missing += 1; continue; }
      // 饰品在 gear 第 12、13 槽（用 icon 含 trinket 复核）
      const trinkets = ci.gear.filter((g, idx) => (idx === 12 || idx === 13) || (g.icon && /trinket/i.test(g.icon)));
      const uniq = [...new Map(trinkets.map((g) => [g.id, g])).values()];
      uniq.forEach((g) => {
        if (!g.id) return;
        if (!trinketCount[g.id]) trinketCount[g.id] = { count: 0, icon: g.icon };
        trinketCount[g.id].count += 1;
      });
      counted += 1;
    } catch (err) { missing += 1; }
    if (i % 20 === 19) process.stdout.write(`  ...已处理 ${i + 1}/${rankings.length}\n`);
    await new Promise((r) => setTimeout(r, 80));
  }

  console.log(`\n有效样本 ${counted} 人（缺失/归档 ${missing}）。\n按选取人数排序的饰品比例：`);
  const rows = Object.entries(trinketCount).sort((a, b) => b[1].count - a[1].count);
  rows.forEach(([id, info]) => {
    const pct = ((info.count / counted) * 100).toFixed(1);
    console.log(`  饰品ID ${id}  被 ${info.count}/${counted} 人选 = ${pct}%   (${info.icon})`);
  });
  fs.writeFileSync('scripts/wcl-spike-out/trinket-ratio.json', JSON.stringify({ counted, rows }, null, 2));
}
main().catch((e) => console.error(e));
