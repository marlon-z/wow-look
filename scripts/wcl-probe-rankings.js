// 试 report.rankings（排行详情，内嵌 gear/talents）+ 确认事件接口可用
const fs = require('fs');
const path = require('path');
const BASE = 'https://www.warcraftlogs.com';
async function getToken(id, secret) {
  const basic = Buffer.from(`${id}:${secret}`).toString('base64');
  const res = await fetch(`${BASE}/oauth/token`, { method: 'POST', headers: { Authorization: `Basic ${basic}`, 'Content-Type': 'application/x-www-form-urlencoded' }, body: 'grant_type=client_credentials' });
  return (await res.json()).access_token;
}
async function gql(token, query, variables) {
  const res = await fetch(`${BASE}/api/v2/client`, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ query, variables }) });
  return res.json();
}
function shape(o, d) { if (d < 0 || o === null || typeof o !== 'object') return typeof o; if (Array.isArray(o)) return '[' + (o.length ? shape(o[0], d - 1) : '') + ']x' + o.length; const k = {}; Object.keys(o).slice(0, 25).forEach((x) => { k[x] = shape(o[x], d - 1); }); return k; }

async function main() {
  const token = await getToken(process.env.WCL_CLIENT_ID, process.env.WCL_CLIENT_SECRET);
  const code = process.argv[2] || 'jaH1RmbJ7PwCrMNn';
  const fight = Number(process.argv[3] || 9);

  // A) report.rankings
  const qa = `query($code:String!,$fight:Int!){reportData{report(code:$code){ rankings(fightIDs:[$fight]) }}}`;
  const da = await gql(token, qa, { code, fight });
  if (da.errors) console.log('rankings err:', JSON.stringify(da.errors).slice(0, 300));
  const rk = da.data && da.data.reportData.report.rankings;
  console.log('=== report.rankings 结构 ===');
  console.log(JSON.stringify(shape(rk, 4), null, 1).slice(0, 1500));
  if (rk) fs.writeFileSync(path.join(__dirname, 'wcl-spike-out', 'probe-report-rankings.json'), JSON.stringify(rk, null, 2));

  // B) 确认事件接口能用：拉一点 DamageDone 事件
  const qb = `query($code:String!,$fight:Int!){reportData{report(code:$code){ events(dataType: DamageDone, fightIDs:[$fight], limit:3){ data } }}}`;
  const db = await gql(token, qb, { code, fight });
  const ev = db.data && db.data.reportData.report.events.data;
  console.log('\n=== DamageDone 事件可用性 ===', ev ? `${ev.length} 条` : (db.errors ? JSON.stringify(db.errors).slice(0, 200) : '无'));
}
main().catch((e) => console.error(e));
