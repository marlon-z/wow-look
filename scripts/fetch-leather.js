const https = require('https');

const CLIENT_ID = 'ef493b018f2a4948b86780dfb9fc2549';
const CLIENT_SECRET = '77REvGoG6zhJrjSCNUX06WSdQzGlm6UE';

const INSTANCES = {
  dungeons: [
    { id: 1316, name: '节点希纳斯' },
    { id: 1315, name: '迈萨拉洞窟' },
    { id: 1299, name: '风行者之塔' },
    { id: 1300, name: '魔导师平台' },
    { id: 945, name: '执政团之座' },
    { id: 1201, name: '艾杰斯亚学院' },
    { id: 278, name: '萨隆矿坑' },
    { id: 476, name: '通天峰' },
  ],
  raids: [
    { id: 1314, name: '梦境裂隙' },
    { id: 1307, name: '虚影尖塔' },
    { id: 1308, name: '进军奎尔丹纳斯' },
  ],
};

const SLOT_MAP = {
  HEAD: { key: 'head', name: '头部' },
  SHOULDER: { key: 'shoulder', name: '肩部' },
  CLOAK: { key: 'cloak', name: '披风' },
  CHEST: { key: 'chest', name: '胸部' },
  ROBE: { key: 'chest', name: '胸部' },
  WRIST: { key: 'wrist', name: '护腕' },
  HAND: { key: 'hand', name: '手部' },
  WAIST: { key: 'waist', name: '腰部' },
  LEGS: { key: 'legs', name: '腿部' },
  FEET: { key: 'feet', name: '脚部' },
  NECK: { key: 'neck', name: '项链' },
  FINGER: { key: 'finger', name: '戒指' },
  TRINKET: { key: 'trinket', name: '饰品' },
  WEAPON: { key: 'weapon', name: '武器' },
  TWOHWEAPON: { key: 'weapon', name: '武器' },
  SHIELD: { key: 'weapon', name: '武器' },
  HOLDABLE: { key: 'weapon', name: '武器' },
  RANGED: { key: 'weapon', name: '武器' },
  RANGEDRIGHT: { key: 'weapon', name: '武器' },
  WEAPONMAINHAND: { key: 'weapon', name: '武器' },
  WEAPONOFFHAND: { key: 'weapon', name: '武器' },
};

function httpsGet(url, headers = {}) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers }, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch { reject(new Error('JSON parse error: ' + data.substring(0, 200))); }
      });
    });
    req.on('error', reject);
    req.setTimeout(15000, () => { req.destroy(); reject(new Error('timeout')); });
  });
}

function httpsPost(url, body) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const postData = body;
    const req = https.request({
      hostname: u.hostname, path: u.pathname, method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData),
      },
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => { try { resolve(JSON.parse(data)); } catch { reject(new Error(data)); } });
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function getToken() {
  const body = `grant_type=client_credentials&client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}`;
  const res = await httpsPost('https://oauth.battle.net/token', body);
  return res.access_token;
}

async function blizzGet(path, token) {
  const sep = path.includes('?') ? '&' : '?';
  const url = `https://us.api.blizzard.com${path}${sep}locale=zh_CN`;
  return httpsGet(url, { Authorization: `Bearer ${token}` });
}

async function getWowheadStats(itemId) {
  const url = `https://nether.wowhead.com/tooltip/item/${itemId}?dataEnv=1&locale=4&ilvl=246`;
  const data = await httpsGet(url);
  const tooltip = data.tooltip || '';
  const icon = data.icon || '';

  const statMap = {
    rtg36: { type: 'haste', name: '急速' },
    rtg32: { type: 'crit', name: '暴击' },
    rtg49: { type: 'mastery', name: '精通' },
    rtg40: { type: 'versatility', name: '全能' },
  };

  const secondary = [];
  for (const [rtg, info] of Object.entries(statMap)) {
    const regex = new RegExp(`<!--${rtg}-->([\\d,]+)${info.name}`);
    const match = tooltip.match(regex);
    if (match) {
      secondary.push({
        type: info.type,
        name: info.name,
        value: parseInt(match[1].replace(/,/g, '')),
      });
    }
  }

  if (secondary.length === 2) {
    if (secondary[0].value > secondary[1].value) {
      secondary[0].isMajor = true;
      secondary[1].isMajor = false;
    } else if (secondary[0].value < secondary[1].value) {
      secondary[0].isMajor = false;
      secondary[1].isMajor = true;
    } else {
      secondary[0].isMajor = true;
      secondary[1].isMajor = true;
    }
  }

  // 解析主属性
  let primary = null;
  const priMatches = [
    { regex: /\+(\d+) 智力/, type: 'intellect', name: '智力' },
    { regex: /\+(\d+) 敏捷/, type: 'agility', name: '敏捷' },
    { regex: /\+(\d+) 力量/, type: 'strength', name: '力量' },
  ];
  for (const pm of priMatches) {
    const m = tooltip.match(pm.regex);
    if (m && !tooltip.includes(`>${m[0]}</span><br><span>`) === false) {
      // 检查是否为灰色（不可用）属性
      const grayCheck = new RegExp(`128,128,128.*?\\+${m[1]} ${pm.name}|is_negated`);
      if (!grayCheck.test(tooltip)) {
        primary = { type: pm.type, name: pm.name, value: parseInt(m[1]) };
        break;
      }
    }
  }

  // 解析耐力
  let stamina = null;
  const staMatch = tooltip.match(/\+([\\d,]+) 耐力/);
  if (staMatch) stamina = { value: parseInt(staMatch[1].replace(/,/g, '')) };

  return { icon, secondary, primary, stamina };
}

async function main() {
  console.log('=== 开始拉取皮甲装备数据 ===\n');

  console.log('1. 获取OAuth Token...');
  const token = await getToken();
  console.log('   Token获取成功\n');

  const allInstances = [
    ...INSTANCES.dungeons.map(d => ({ ...d, type: 'dungeon' })),
    ...INSTANCES.raids.map(r => ({ ...r, type: 'raid' })),
  ];

  const result = {
    version: '12.0.1-S1',
    updatedAt: new Date().toISOString().split('T')[0],
    ilvl: 246,
    filter: 'leather',
    filterName: '皮甲',
    instances: [],
  };

  for (const inst of allInstances) {
    console.log(`2. 拉取副本: ${inst.name} (ID:${inst.id})...`);
    await sleep(100);

    const instData = await blizzGet(
      `/data/wow/journal-instance/${inst.id}?namespace=static-us`, token
    );

    const instResult = {
      id: inst.id,
      name: inst.name,
      type: inst.type,
      encounters: [],
    };

    for (const enc of instData.encounters) {
      console.log(`   Boss: ${enc.name} (ID:${enc.id})`);
      await sleep(100);

      const encData = await blizzGet(
        `/data/wow/journal-encounter/${enc.id}?namespace=static-us`, token
      );

      const encResult = {
        id: enc.id,
        name: enc.name,
        items: [],
      };

      if (!encData.items) {
        console.log(`     无掉落物品`);
        continue;
      }

      for (const drop of encData.items) {
        const itemId = drop.item.id;
        await sleep(100);

        const itemData = await blizzGet(
          `/data/wow/item/${itemId}?namespace=static-us`, token
        );

        // 只保留皮甲（armor class 4, subclass 2）
        if (itemData.item_class?.id !== 4 || itemData.item_subclass?.id !== 2) {
          continue;
        }

        const slotType = itemData.inventory_type?.type;
        const slotInfo = SLOT_MAP[slotType];
        if (!slotInfo) continue;

        console.log(`     [皮甲] ${itemData.name} (ID:${itemId}) - ${slotInfo.name}`);

        // 从Wowhead获取246装等数据
        await sleep(200);
        const whStats = await getWowheadStats(itemId);

        encResult.items.push({
          id: itemId,
          name: itemData.name,
          icon: whStats.icon,
          slot: slotInfo.key,
          slotName: slotInfo.name,
          armorType: 'leather',
          armorTypeName: '皮甲',
          ilvl: 246,
          stats: {
            primary: whStats.primary,
            stamina: whStats.stamina,
            secondary: whStats.secondary,
          },
        });
      }

      if (encResult.items.length > 0) {
        instResult.encounters.push(encResult);
      }
    }

    if (instResult.encounters.length > 0) {
      result.instances.push(instResult);
    }
    console.log('');
  }

  // 统计
  let totalItems = 0;
  for (const inst of result.instances) {
    for (const enc of inst.encounters) {
      totalItems += enc.items.length;
    }
  }
  console.log(`\n=== 完成！共拉取 ${totalItems} 件皮甲装备 ===\n`);

  // 写入文件
  const fs = require('fs');
  const outDir = require('path').join(__dirname, '..', 'data');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const outPath = require('path').join(outDir, 'leather.json');
  fs.writeFileSync(outPath, JSON.stringify(result, null, 2), 'utf-8');
  console.log(`数据已写入: ${outPath}`);
}

main().catch(err => {
  console.error('错误:', err.message);
  process.exit(1);
});
