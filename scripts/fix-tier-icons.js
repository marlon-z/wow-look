const fs = require('fs');
const path = require('path');
const https = require('https');
const { execFileSync } = require('child_process');

const ROOT_DIR = path.resolve(__dirname, '..');
const DATA_DIR = path.join(ROOT_DIR, 'cos-upload', 'data-4.2.x');
const ASSET_DIR = path.join(ROOT_DIR, 'cos-upload', 'assets', 'icons');
const CACHE_DIR = path.join(ROOT_DIR, '.cache');
const LISTFILE_CACHE_PATH = path.join(CACHE_DIR, 'community-listfile.csv');
const LISTFILE_URL = 'https://github.com/wowdev/wow-listfile/releases/latest/download/community-listfile.csv';

const CLASS_KEYS = ['warrior','paladin','hunter','rogue','priest','deathknight','shaman','mage','warlock','monk','druid','demonhunter','evoker'];

function httpsGetBuffer(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Codex' } }, (response) => {
      if ([301, 302, 303, 307, 308].includes(response.statusCode) && response.headers.location) {
        resolve(httpsGetBuffer(response.headers.location));
        return;
      }
      if (response.statusCode !== 200) {
        reject(new Error(`HTTP ${response.statusCode}: ${url}`));
        return;
      }
      const chunks = [];
      response.on('data', (chunk) => chunks.push(chunk));
      response.on('end', () => resolve(Buffer.concat(chunks)));
    }).on('error', reject);
  });
}

function ensureListfileCache() {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
  if (fs.existsSync(LISTFILE_CACHE_PATH)) {
    return LISTFILE_CACHE_PATH;
  }
  console.log('Downloading listfile...');
  const escapedUrl = LISTFILE_URL.replace(/'/g, "''");
  execFileSync('powershell', [
    '-NoProfile', '-Command',
    `Invoke-WebRequest -Uri '${escapedUrl}' -Headers @{ 'User-Agent' = 'Codex' } -OutFile '${LISTFILE_CACHE_PATH}'`,
  ], { stdio: 'inherit' });
  return LISTFILE_CACHE_PATH;
}

function resolveIconNames(iconIds, listfilePath) {
  const targetIds = new Set(iconIds.map(id => String(id)));
  const iconMap = {};
  const content = fs.readFileSync(listfilePath, 'utf8');
  const lines = content.split(/\r?\n/);
  for (const line of lines) {
    if (!line) continue;
    const sep = line.indexOf(';');
    if (sep === -1) continue;
    const fileId = line.slice(0, sep);
    if (!targetIds.has(fileId)) continue;
    const filePath = line.slice(sep + 1).trim().toLowerCase();
    if (!filePath.includes('interface/icons/') || !filePath.endsWith('.blp')) continue;
    const iconName = path.basename(filePath, '.blp').replace(/\s+/g, '');
    if (iconName) iconMap[fileId] = iconName;
    if (Object.keys(iconMap).length === targetIds.size) break;
  }
  return iconMap;
}

async function downloadIcon(iconName) {
  const fileName = `${iconName}.jpg`;
  const filePath = path.join(ASSET_DIR, fileName);
  if (fs.existsSync(filePath)) {
    console.log(`  [exists] ${fileName}`);
    return fileName;
  }
  const url = `https://wow.zamimg.com/images/wow/icons/large/${iconName}.jpg`;
  const buffer = await httpsGetBuffer(url);
  fs.writeFileSync(filePath, buffer);
  console.log(`  [downloaded] ${fileName}`);
  return fileName;
}

async function main() {
  fs.mkdirSync(ASSET_DIR, { recursive: true });

  // Collect all icon IDs from appearance-only items
  const needIcons = []; // { classKey, itemIndex, iconId }
  CLASS_KEYS.forEach(classKey => {
    const dataFile = path.join(DATA_DIR, `${classKey}.json`);
    const data = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
    const tierInst = data.instances.find(i => i.type === 'tier');
    if (!tierInst) return;
    tierInst.encounters[0].items.forEach((item, idx) => {
      if (item.tier && item.tier.appearanceOnly && item.icon) {
        needIcons.push({ classKey, idx, iconId: item.icon, name: item.name });
      }
    });
  });

  console.log(`Found ${needIcons.length} appearance items needing icons`);
  const uniqueIconIds = [...new Set(needIcons.map(n => n.iconId))];
  console.log(`Unique icon IDs: ${uniqueIconIds.length}`);

  // Resolve icon names via listfile
  const listfilePath = ensureListfileCache();
  console.log('Resolving icon names from listfile...');
  const iconNameMap = resolveIconNames(uniqueIconIds, listfilePath);
  console.log(`Resolved ${Object.keys(iconNameMap).length} / ${uniqueIconIds.length} icons`);

  const missing = uniqueIconIds.filter(id => !iconNameMap[String(id)]);
  if (missing.length) {
    console.log(`WARNING: Could not resolve icons for IDs: ${missing.join(', ')}`);
  }

  // Download icons
  console.log('Downloading icons...');
  const downloadedMap = {};
  for (const [iconId, iconName] of Object.entries(iconNameMap)) {
    try {
      await downloadIcon(iconName);
      downloadedMap[iconId] = iconName;
    } catch (e) {
      console.log(`  [FAILED] ${iconName}: ${e.message}`);
    }
  }

  // Update JSON files
  console.log('Updating JSON data...');
  CLASS_KEYS.forEach(classKey => {
    const dataFile = path.join(DATA_DIR, `${classKey}.json`);
    const data = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
    const tierInst = data.instances.find(i => i.type === 'tier');
    if (!tierInst) return;

    let updated = 0;
    tierInst.encounters[0].items.forEach(item => {
      if (item.tier && item.tier.appearanceOnly && item.icon) {
        const iconName = downloadedMap[String(item.icon)];
        if (iconName) {
          item.iconName = iconName;
          item.iconAsset = `/assets/icons/${iconName}.jpg`;
          updated++;
        }
      }
    });

    if (updated > 0) {
      fs.writeFileSync(dataFile, JSON.stringify(data, null, 2), 'utf8');
      console.log(`  ${classKey}: updated ${updated} icon paths`);
    }
  });

  console.log('\nDone!');
}

main().catch(e => { console.error(e); process.exit(1); });
