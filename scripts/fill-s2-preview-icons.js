const fs = require('fs');
const path = require('path');
const https = require('https');

const ROOT = path.resolve(__dirname, '..');
const DATA_DIR = path.join(ROOT, 'cos-upload', 'data-12.1-s2-crafted-preview');
const ASSET_DIR = path.join(ROOT, 'cos-upload', 'assets', 'icons');
const LISTFILE_PATH = path.join(ROOT, '.cache', 'community-listfile.csv');
const CLASS_FILES = [
  'warrior', 'paladin', 'hunter', 'rogue', 'priest', 'deathknight', 'shaman',
  'mage', 'warlock', 'monk', 'druid', 'demonhunter', 'evoker',
];

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function iconNameFromListfilePath(filePath) {
  const normalized = String(filePath || '').trim().toLowerCase();
  if (!normalized.includes('interface/icons/') || !normalized.endsWith('.blp')) return '';
  return path.basename(normalized, '.blp').replace(/\s+/g, '');
}

function resolveIconNames(iconIds) {
  if (!fs.existsSync(LISTFILE_PATH)) {
    throw new Error(`缺少图标映射表：${LISTFILE_PATH}`);
  }
  const wanted = new Set(iconIds.map(String));
  const result = {};
  for (const line of fs.readFileSync(LISTFILE_PATH, 'utf8').split(/\r?\n/)) {
    const separator = line.indexOf(';');
    if (separator < 1) continue;
    const fileId = line.slice(0, separator);
    if (!wanted.has(fileId)) continue;
    const iconName = iconNameFromListfilePath(line.slice(separator + 1));
    if (iconName) result[fileId] = iconName;
    if (Object.keys(result).length === wanted.size) break;
  }
  return result;
}

function getBuffer(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'WoWLook-local-preview' } }, (response) => {
      if ([301, 302, 303, 307, 308].includes(response.statusCode) && response.headers.location) {
        resolve(getBuffer(response.headers.location));
        return;
      }
      if (response.statusCode !== 200) {
        reject(new Error(`下载失败 ${response.statusCode}: ${url}`));
        return;
      }
      const chunks = [];
      response.on('data', (chunk) => chunks.push(chunk));
      response.on('end', () => resolve(Buffer.concat(chunks)));
    }).on('error', reject);
  });
}

async function downloadIcon(iconName) {
  const filename = `${iconName}.jpg`;
  const output = path.join(ASSET_DIR, filename);
  if (fs.existsSync(output)) return filename;
  const image = await getBuffer(`https://wow.zamimg.com/images/wow/icons/large/${iconName}.jpg`);
  fs.writeFileSync(output, image);
  return filename;
}

async function downloadFileDataIcon(iconId) {
  const filename = `filedata-${iconId}.jpg`;
  const output = path.join(ASSET_DIR, filename);
  if (fs.existsSync(output)) return filename;
  const image = await getBuffer(`https://render.worldofwarcraft.com/us/icons/56/${iconId}.jpg`);
  fs.writeFileSync(output, image);
  return filename;
}

function collectItems(classData) {
  return (classData.instances || []).flatMap((instance) => (
    (instance.encounters || []).flatMap((encounter) => encounter.items || [])
  ));
}

async function main() {
  fs.mkdirSync(ASSET_DIR, { recursive: true });
  const entries = CLASS_FILES.map((classKey) => ({
    classKey,
    path: path.join(DATA_DIR, `${classKey}.json`),
    data: readJson(path.join(DATA_DIR, `${classKey}.json`)),
  }));
  const missing = entries.flatMap((entry) => collectItems(entry.data))
    .filter((item) => !item.iconAsset && Number(item.icon) > 0);
  const iconIds = [...new Set(missing.map((item) => Number(item.icon)))];
  const iconNames = resolveIconNames(iconIds);
  const unresolvedIds = iconIds.filter((iconId) => !iconNames[iconId]);

  const assets = {};
  let downloaded = 0;
  let nextIndex = 0;
  let completed = 0;
  async function downloadNext() {
    const index = nextIndex;
    nextIndex += 1;
    if (index >= iconIds.length) return;
    const iconId = iconIds[index];
    const iconName = iconNames[iconId] || '';
    const outputPath = path.join(ASSET_DIR, iconName ? `${iconName}.jpg` : `filedata-${iconId}.jpg`);
    const existed = fs.existsSync(outputPath);
    assets[iconId] = iconName
      ? await downloadIcon(iconName)
      : await downloadFileDataIcon(iconId);
    if (!existed) downloaded += 1;
    completed += 1;
    if (completed % 25 === 0 || completed === iconIds.length) {
      console.log(`图标 ${completed}/${iconIds.length}`);
    }
    await downloadNext();
  }
  await Promise.all(Array.from({ length: Math.min(16, iconIds.length) }, () => downloadNext()));

  entries.forEach((entry) => {
    collectItems(entry.data).forEach((item) => {
      if (!item.iconAsset && assets[item.icon]) {
        item.iconName = iconNames[item.icon] || `filedata-${item.icon}`;
        item.iconAsset = `/assets/icons/${assets[item.icon]}`;
      }
    });
    writeJson(entry.path, entry.data);
  });

  const remaining = entries.flatMap((entry) => collectItems(entry.data))
    .filter((item) => !item.iconAsset);
  if (remaining.length > 0) {
    throw new Error(`仍有 ${remaining.length} 条装备记录没有图标。`);
  }
  console.log(`已补齐 ${missing.length} 条装备记录的 ${iconIds.length} 个图标；新下载 ${downloaded} 个；${unresolvedIds.length} 个使用官方 FileDataID 图标。`);
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}

module.exports = { resolveIconNames, iconNameFromListfilePath };
