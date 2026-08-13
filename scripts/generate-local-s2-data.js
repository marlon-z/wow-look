/*
 * Builds the no-COS 12.1 S2 mini-program data set.
 *
 * Source files are retained untouched in cos-upload/ as export evidence. This
 * script writes only fields the mini-program renders, then creates one data
 * subpackage per class and copies the assets those records reference.
 */
const fs = require('fs');
const path = require('path');
const childProcess = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const SOURCE_ROOT = path.join(ROOT, 'cos-upload', 'data-12.1-s2-crafted-preview');
const SOURCE_ASSET_ROOT = path.join(ROOT, 'cos-upload', 'assets');
const TARGET_ROOT = path.join(ROOT, 'miniprogram');
const PACKAGE_ROOT = path.join(TARGET_ROOT, 'packages');
const LOCAL_DATA_ROOT = path.join(TARGET_ROOT, 'local-data');
const LOCAL_ASSET_ROOT = path.join(TARGET_ROOT, 'assets');
const PACKAGE_LIMIT = 2 * 1024 * 1024;

const CLASS_LIST = [
  { key: 'warrior', assetCode: 'zs' },
  { key: 'paladin', assetCode: 'qs' },
  { key: 'hunter', assetCode: 'lr' },
  { key: 'rogue', assetCode: 'dz' },
  { key: 'priest', assetCode: 'ms' },
  { key: 'deathknight', assetCode: 'dk' },
  { key: 'shaman', assetCode: 'sm' },
  { key: 'mage', assetCode: 'fs' },
  { key: 'warlock', assetCode: 'ss' },
  { key: 'monk', assetCode: 'ws' },
  { key: 'druid', assetCode: 'dly' },
  { key: 'demonhunter', assetCode: 'dh' },
  { key: 'evoker', assetCode: 'hms' },
];

function removeDirectory(directory) {
  if (fs.existsSync(directory)) {
    fs.rmSync(directory, { recursive: true, force: true });
  }
}

function ensureDirectory(directory) {
  fs.mkdirSync(directory, { recursive: true });
}

function writeModule(filePath, value) {
  ensureDirectory(path.dirname(filePath));
  fs.writeFileSync(filePath, `'use strict';\n\nmodule.exports = ${JSON.stringify(value)};\n`, 'utf8');
}

function copyFile(sourcePath, targetPath) {
  ensureDirectory(path.dirname(targetPath));
  fs.copyFileSync(sourcePath, targetPath);
}

function localAssetPath(sourceAssetPath) {
  return sourceAssetPath.replace(/^\/assets\//, '/assets/');
}

function trimItem(item) {
  const { tooltipRaw, dropVersion, captureStatus, ...runtimeItem } = item;
  return {
    ...runtimeItem,
    iconAsset: localAssetPath(runtimeItem.iconAsset || ''),
  };
}

function trimInstances(instances) {
  return (instances || []).map((instance) => ({
    id: instance.id,
    name: instance.name,
    type: instance.type,
    difficulty: instance.difficulty,
    order: instance.order,
    encounters: (instance.encounters || []).map((encounter) => ({
      id: encounter.id,
      name: encounter.name,
      order: encounter.order,
      items: (encounter.items || []).map(trimItem),
    })),
  }));
}

function buildClassData(source) {
  return {
    version: source.version,
    dataVersion: source.dataVersion,
    addonVersion: source.addonVersion,
    updatedAt: source.updatedAt,
    releaseStatus: source.releaseStatus,
    equipmentVariant: source.equipmentVariant,
    maximumProfile: source.maximumProfile,
    class: source.class,
    specs: source.specs,
    meta: source.meta,
    instances: trimInstances(source.instances),
  };
}

function collectIconAssets(classData) {
  const assets = new Set();
  classData.instances.forEach((instance) => {
    instance.encounters.forEach((encounter) => {
      encounter.items.forEach((item) => {
        if (item.iconAsset) assets.add(item.iconAsset);
      });
    });
  });
  return assets;
}

function directorySize(directory) {
  return fs.readdirSync(directory, { recursive: true })
    .map((relativePath) => path.join(directory, relativePath))
    .filter((filePath) => fs.statSync(filePath).isFile())
    .reduce((total, filePath) => total + fs.statSync(filePath).size, 0);
}

function main() {
  if (!fs.existsSync(SOURCE_ROOT)) {
    throw new Error(`S2 source data does not exist: ${SOURCE_ROOT}`);
  }

  removeDirectory(PACKAGE_ROOT);
  removeDirectory(LOCAL_DATA_ROOT);
  removeDirectory(path.join(LOCAL_ASSET_ROOT, 'icons'));
  removeDirectory(path.join(LOCAL_ASSET_ROOT, 'classes'));
  removeDirectory(path.join(LOCAL_ASSET_ROOT, 'public'));

  const overview = JSON.parse(fs.readFileSync(path.join(SOURCE_ROOT, 'overview.json'), 'utf8'));
  writeModule(path.join(LOCAL_DATA_ROOT, 'overview.js'), overview);

  const copiedAssets = new Set();
  const packageReport = [];
  CLASS_LIST.forEach(({ key }) => {
    const source = JSON.parse(fs.readFileSync(path.join(SOURCE_ROOT, `${key}.json`), 'utf8'));
    const classData = buildClassData(source);
    const packageDirectory = path.join(PACKAGE_ROOT, `class-${key}`);
    const dataPath = path.join(packageDirectory, 'data', `${key}.js`);
    writeModule(dataPath, classData);
    fs.mkdirSync(path.join(packageDirectory, 'pages', 'loader'), { recursive: true });
    fs.writeFileSync(
      path.join(packageDirectory, 'pages', 'loader', 'loader.js'),
      `'use strict';\n\n// Static dependency anchor: the main package resolves this module with require.async.\nconst classData = require('../../data/${key}');\nPage({ data: { classKey: classData.class.key } });\n`,
      'utf8'
    );
    fs.writeFileSync(path.join(packageDirectory, 'pages', 'loader', 'loader.json'), '{}\n', 'utf8');
    fs.writeFileSync(path.join(packageDirectory, 'pages', 'loader', 'loader.wxml'), '<view></view>\n', 'utf8');
    fs.writeFileSync(path.join(packageDirectory, 'pages', 'loader', 'loader.wxss'), '', 'utf8');

    collectIconAssets(classData).forEach((assetPath) => {
      const sourcePath = path.join(SOURCE_ASSET_ROOT, assetPath.replace(/^\/assets\//, ''));
      const targetPath = path.join(TARGET_ROOT, assetPath.replace(/^\//, ''));
      if (!copiedAssets.has(assetPath)) {
        copyFile(sourcePath, targetPath);
        copiedAssets.add(assetPath);
      }
    });

    const size = directorySize(packageDirectory);
    if (size >= PACKAGE_LIMIT) {
      throw new Error(`${key} package is ${(size / 1024 / 1024).toFixed(2)} MiB; must remain below 2 MiB.`);
    }
    packageReport.push({ key, bytes: size, kib: Number((size / 1024).toFixed(1)) });
  });

  childProcess.execFileSync(
    'powershell.exe',
    [
      '-NoProfile', '-ExecutionPolicy', 'Bypass', '-File',
      path.join(__dirname, 'resize-local-s2-assets.ps1'),
      '-SourceRoot', SOURCE_ASSET_ROOT,
      '-TargetRoot', LOCAL_ASSET_ROOT,
    ],
    { stdio: 'inherit' }
  );

  fs.writeFileSync(
    path.join(LOCAL_DATA_ROOT, 'package-report.json'),
    `${JSON.stringify({ dataVersion: overview.dataVersion, packages: packageReport }, null, 2)}\n`,
    'utf8'
  );
  console.log(`Generated ${packageReport.length} local S2 class packages and ${copiedAssets.size} local assets.`);
}

main();
