const fs = require('fs');
const raw = fs.readFileSync('d:/ai/wowlook/WoWLookExport2.lua', 'utf8');
const m = raw.match(/\["payload"\]\s*=\s*"((?:[^"\\]|\\.)*)"/s);
if (!m) { console.log('No payload found'); process.exit(1); }
const json = m[1].replace(/\\"/g, '"').replace(/\\\\/g, '\\').replace(/\\n/g, '\n');
const data = JSON.parse(json);

const trinkets = Object.entries(data.items).filter(([_, v]) => v.equipLoc === 'INVTYPE_TRINKET');
const [pick, item] = trinkets[Math.floor(Math.random() * trinkets.length)];

let boss = '';
for (const inst of data.instances) {
  for (const enc of inst.encounters) {
    if (enc.itemIds.includes(Number(pick))) {
      boss = inst.name + ' - ' + enc.name;
    }
  }
}

console.log('=== 随机抽取装备 ===');
console.log('物品ID:', pick);
console.log('掉落来源:', boss);
console.log(JSON.stringify(item, null, 2));
