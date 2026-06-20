const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const fixture = path.join(ROOT, 'tests', 'fixtures', 'max-export-valid.lua');
const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'wowlook-data-version-'));
const outputDir = path.join(tempRoot, 'data');
const assetDir = path.join(tempRoot, 'assets');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

try {
  const converterSource = fs.readFileSync(path.join(ROOT, 'scripts', 'parse-export.js'), 'utf8');
  assert(converterSource.includes("7702761: 'inv_1207_fungarianraid_trinket'"), '缺少孢陨幽境饰品图标覆盖。');
  const result = spawnSync(process.execPath, [
    path.join(ROOT, 'scripts', 'parse-export.js'),
    '--input', fixture,
    '--output', outputDir,
    '--assets', assetDir,
    '--skip-icon-download', 'true',
    '--data-version', '4.3.x',
  ], { cwd: ROOT, encoding: 'utf8' });

  assert(result.status === 0, result.stderr || result.stdout || '转换脚本执行失败。');
  const warrior = JSON.parse(fs.readFileSync(path.join(outputDir, 'warrior.json'), 'utf8'));
  const overview = JSON.parse(fs.readFileSync(path.join(outputDir, 'overview.json'), 'utf8'));
  assert(warrior.version === '4.3.x', '职业 JSON version 未使用 --data-version。');
  assert(warrior.dataVersion === '4.3.x', '职业 JSON dataVersion 未使用 --data-version。');
  assert(overview.version === '4.3.x', 'overview version 未使用 --data-version。');
  assert(overview.dataVersion === '4.3.x', 'overview dataVersion 未使用 --data-version。');
  console.log('数据版本输出检查通过：职业与 overview 均为 4.3.x。');
} finally {
  const resolvedTemp = path.resolve(tempRoot);
  assert(resolvedTemp.startsWith(path.resolve(os.tmpdir())), '拒绝清理非临时目录。');
  fs.rmSync(resolvedTemp, { recursive: true, force: true });
}
