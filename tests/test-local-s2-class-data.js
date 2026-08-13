const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'miniprogram', 'utils', 'class-data.js'), 'utf8');
const appJson = JSON.parse(fs.readFileSync(path.join(root, 'miniprogram', 'app.json'), 'utf8'));
const runtimeSources = fs.readdirSync(path.join(root, 'miniprogram'), { recursive: true })
  .filter((relativePath) => relativePath.endsWith('.js'))
  .map((relativePath) => fs.readFileSync(path.join(root, 'miniprogram', relativePath), 'utf8'))
  .join('\n');

assert.doesNotMatch(source, /wx\.request/, '职业数据加载器不得发起网络请求。');
assert.doesNotMatch(source, /https?:\/\//, '职业数据加载器不得包含远端地址。');
assert.match(source, /wx\.loadSubPackage/, '职业数据应按需下载微信本地分包。');
assert.match(source, /require\.async/, '职业数据应通过分包异步化读取。');
assert.ok(Array.isArray(appJson.subPackages), 'app.json 必须声明本地职业分包。');
assert.strictEqual(appJson.subPackages.length, 13, '必须有 13 个职业分包。');
assert.doesNotMatch(runtimeSources, /wx\.request/, '纯本地运行代码不得发起网络请求。');
assert.doesNotMatch(runtimeSources, /wowlook-1308073800|127\.0\.0\.1/, '纯本地运行代码不得保留 COS 或本机数据服务地址。');

delete global.wx;
const classDataPath = path.join(root, 'miniprogram', 'utils', 'class-data.js');
delete require.cache[require.resolve(classDataPath)];
const classData = require(classDataPath);

Promise.all([
  classData.loadOverview(),
  classData.loadClassData('not-a-class'),
]).then(([overview, invalid]) => {
  assert.strictEqual(overview.dataVersion, '12.1-s2', '本地总览必须可读取。');
  assert.strictEqual(invalid, null, '未知职业必须保持原有空结果语义。');
  console.log('local S2 class-data tests passed');
}).catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
