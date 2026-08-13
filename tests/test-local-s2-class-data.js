const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'miniprogram', 'utils', 'class-data.js'), 'utf8');
const appJson = JSON.parse(fs.readFileSync(path.join(root, 'miniprogram', 'app.json'), 'utf8'));
const runtimeSources = fs.readdirSync(path.join(root, 'miniprogram'), { recursive: true })
  .filter((relativePath) => relativePath.endsWith('.js'))
  .map((relativePath) => fs.readFileSync(path.join(root, 'miniprogram', relativePath), 'utf8'))
  .join('\n');

assert.doesNotMatch(source, /wx\.request/, '职业数据加载器不得发起网络请求。');
assert.doesNotMatch(source, /https?:\/\//, '职业数据加载器不得包含远端地址。');
assert.match(source, /require\.async/, '职业数据应通过分包异步化读取。');
assert.match(source, /warrior:\s*\(\)\s*=>\s*require\.async\('\.\.\/packages\/class-warrior\/data\/warrior'\)/, '战士分包必须使用静态 require.async 路径。');
assert.strictEqual((source.match(/require\.async\('\.\.\/packages\/class-[^']+\/data\/[^']+'\)/g) || []).length, 13, '13 个职业都必须有静态分包模块入口。');
assert.ok(Array.isArray(appJson.subPackages), 'app.json 必须声明本地职业分包。');
const classKeys = [
  'warrior', 'paladin', 'hunter', 'rogue', 'priest', 'deathknight', 'shaman',
  'mage', 'warlock', 'monk', 'druid', 'demonhunter', 'evoker',
];
classKeys.forEach((classKey) => {
  assert.deepStrictEqual(appJson.subPackages.find((subpackage) => subpackage.name === `class-${classKey}`), {
    root: `packages/class-${classKey}`,
    name: `class-${classKey}`,
    pages: ['pages/loader/loader'],
  }, `${classKey} 职业分包及其加载页必须完整注册。`);
});
assert.deepStrictEqual(appJson.subPackages.find((subpackage) => subpackage.root === 'packages/logo-preview'), {
  root: 'packages/logo-preview',
  name: 'logo-preview',
  pages: ['pages/logo-preview/logo-preview'],
}, 'Logo 预览页必须作为独立分包注册。');
assert.doesNotMatch(runtimeSources, /wx\.request/, '纯本地运行代码不得发起网络请求。');
assert.doesNotMatch(runtimeSources, /wowlook-1308073800|127\.0\.0\.1/, '纯本地运行代码不得保留 COS 或本机数据服务地址。');

delete global.wx;
const classDataPath = path.join(root, 'miniprogram', 'utils', 'class-data.js');
delete require.cache[require.resolve(classDataPath)];
const classData = require(classDataPath);

Promise.all([
  classData.loadOverview(),
  classData.loadClassData('not-a-class'),
]).then(async ([overview, invalid]) => {
  assert.strictEqual(overview.dataVersion, '12.1-s2', '本地总览必须可读取。');
  assert.strictEqual(invalid, null, '未知职业必须保持原有空结果语义。');
  const runtimeRequire = (request) => {
    if (request === '../local-data/overview') {
      return require(path.join(root, 'miniprogram', 'local-data', 'overview'));
    }
    return require(request);
  };
  runtimeRequire.async = (request) => Promise.resolve(require(path.join(root, 'miniprogram', request.replace(/^\.\.\//, ''))));
  const runtimeModule = { exports: {} };
  vm.runInNewContext(source, {
    require: runtimeRequire,
    module: runtimeModule,
    exports: runtimeModule.exports,
    Promise,
    console,
  }, { filename: classDataPath });
  const runtimeClassData = runtimeModule.exports;
  const warrior = await runtimeClassData.loadClassData('warrior');
  assert.ok(warrior && warrior.instances && warrior.instances.length > 0, '模拟小程序分包加载时必须能读取战士装备数据。');
  const paladin = await runtimeClassData.loadClassData('paladin');
  assert.ok(paladin && paladin.instances && paladin.instances.length > 0, '模拟小程序分包加载时必须能读取圣骑士装备数据。');
  console.log('local S2 class-data tests passed');
}).catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
