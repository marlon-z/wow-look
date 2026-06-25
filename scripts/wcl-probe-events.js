// 深挖单条战报：用时间窗拉 CombatantInfo / Combatant 事件，并列出可用 dataType
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
async function main() {
  const token = await getToken(process.env.WCL_CLIENT_ID, process.env.WCL_CLIENT_SECRET);
  const code = process.argv[2] || 'jaH1RmbJ7PwCrMNn';
  const fight = Number(process.argv[3] || 9);

  // 1) 拿 fight 起止时间 + 玩家列表
  const q1 = `query($code:String!,$fight:Int!){reportData{report(code:$code){
    fights(fightIDs:[$fight]){id startTime endTime name keystoneLevel gameZone{id name}}
  }}}`;
  const d1 = await gql(token, q1, { code, fight });
  const f = d1.data.reportData.report.fights[0];
  console.log('fight:', JSON.stringify(f));

  // 2) 用时间窗拉 CombatantInfo 事件
  const q2 = `query($code:String!,$s:Float!,$e:Float!){reportData{report(code:$code){
    events(dataType: CombatantInfo, startTime:$s, endTime:$e, limit:100){ data }
  }}}`;
  const d2 = await gql(token, q2, { code, s: f.startTime, e: f.endTime });
  if (d2.errors) console.log('events err:', JSON.stringify(d2.errors).slice(0, 300));
  const ev = d2.data && d2.data.reportData.report.events.data;
  console.log('\nCombatantInfo 事件数:', ev ? ev.length : 0);
  if (ev && ev.length) {
    const c = ev[0];
    console.log('单条字段:', Object.keys(c).join(', '));
    fs.writeFileSync(path.join(__dirname, 'wcl-spike-out', 'probe-events.json'), JSON.stringify(ev[0], null, 2));
    ['strength', 'agility', 'intellect', 'critMelee', 'critSpell', 'hasteSpell', 'mastery', 'versatilityHealingDone', 'versatilityDamageDone'].forEach((k) => { if (c[k] != null) console.log('   ', k, '=', c[k]); });
    if (c.gear) console.log('  gear件数:', c.gear.length, '第1件:', JSON.stringify(c.gear[0]));
    if (c.talents) console.log('  talents:', JSON.stringify(c.talents).slice(0, 200));
    if (c.talentTree) console.log('  talentTree:', JSON.stringify(c.talentTree).slice(0, 200));
    console.log('  -> 完整已存 probe-events.json');
  }
}
main().catch((e) => console.error(e));
