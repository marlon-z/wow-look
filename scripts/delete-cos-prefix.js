#!/usr/bin/env node

const DEFAULT_BUCKET = 'wowlook-1308073800';
const DEFAULT_REGION = 'ap-guangzhou';
const LEGACY_PREFIX = 'wcl-presets/data-4.4.x/';

function parseArgs(argv) {
  const args = {
    prefix: '',
    bucket: process.env.COS_BUCKET || DEFAULT_BUCKET,
    region: process.env.COS_REGION || DEFAULT_REGION,
    dryRun: false,
    confirmDelete: false,
  };
  for (let index = 2; index < argv.length; index += 1) {
    const key = argv[index];
    const value = argv[index + 1];
    if (key === '--prefix') { args.prefix = value; index += 1; }
    else if (key === '--bucket') { args.bucket = value; index += 1; }
    else if (key === '--region') { args.region = value; index += 1; }
    else if (key === '--dry-run') args.dryRun = true;
    else if (key === '--confirm-delete') args.confirmDelete = true;
  }
  return args;
}

function assertLegacyPrefix(prefix) {
  if (prefix !== LEGACY_PREFIX) {
    throw new Error(`只允许清理已退役的精确前缀 ${LEGACY_PREFIX}`);
  }
}

function getSecrets() {
  const secretId = process.env.COS_SECRET_ID || process.env.TENCENT_SECRET_ID;
  const secretKey = process.env.COS_SECRET_KEY || process.env.TENCENT_SECRET_KEY;
  if (!secretId || !secretKey) throw new Error('缺少 COS_SECRET_ID/COS_SECRET_KEY');
  return { secretId, secretKey };
}

function createCosClient(secrets) {
  let COS;
  try {
    COS = require('cos-nodejs-sdk-v5');
  } catch (error) {
    throw new Error('缺少 cos-nodejs-sdk-v5；请先安装依赖后再运行清理。');
  }
  return new COS({ SecretId: secrets.secretId, SecretKey: secrets.secretKey });
}

function callCos(cos, method, options) {
  return new Promise((resolve, reject) => {
    cos[method](options, (error, data) => {
      if (error) reject(error);
      else resolve(data || {});
    });
  });
}

async function listAllKeys(cos, args) {
  const keys = [];
  let marker = '';
  do {
    const data = await callCos(cos, 'getBucket', {
      Bucket: args.bucket,
      Region: args.region,
      Prefix: args.prefix,
      ...(marker ? { Marker: marker } : {}),
    });
    const pageKeys = (data.Contents || []).map((item) => item.Key).filter(Boolean);
    pageKeys.forEach((key) => {
      if (!key.startsWith(args.prefix)) throw new Error(`COS 返回了前缀外对象，已中止: ${key}`);
      keys.push(key);
    });
    marker = data.IsTruncated === 'true' || data.IsTruncated === true ? data.NextMarker : '';
    if (marker === undefined || marker === null) marker = '';
  } while (marker);
  return keys;
}

async function deleteKeys(cos, args, keys) {
  for (let start = 0; start < keys.length; start += 1000) {
    const batch = keys.slice(start, start + 1000);
    await callCos(cos, 'deleteMultipleObject', {
      Bucket: args.bucket,
      Region: args.region,
      Objects: batch.map((Key) => ({ Key })),
      Quiet: true,
    });
  }
}

async function run(args, cos) {
  assertLegacyPrefix(args.prefix);
  const keys = await listAllKeys(cos, args);
  if (!keys.length) return { keys, deleted: false, empty: true };
  if (args.dryRun) return { keys, deleted: false, empty: false };
  if (!args.confirmDelete) throw new Error('请先使用 --dry-run 确认对象列表，再显式传 --confirm-delete。');
  await deleteKeys(cos, args, keys);
  const remaining = await listAllKeys(cos, args);
  if (remaining.length) throw new Error(`删除后前缀仍有 ${remaining.length} 个对象，已中止。`);
  return { keys, deleted: true, empty: true };
}

async function main() {
  const args = parseArgs(process.argv);
  assertLegacyPrefix(args.prefix);
  const cos = createCosClient(getSecrets());
  const result = await run(args, cos);
  result.keys.forEach((key) => console.log(`${args.dryRun ? '[dry-run] ' : ''}${key}`));
  console.log(result.deleted ? `已删除 ${result.keys.length} 个旧 WCL 对象。` : `发现 ${result.keys.length} 个旧 WCL 对象。`);
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error.message || error);
    process.exit(1);
  });
}

module.exports = {
  LEGACY_PREFIX,
  parseArgs,
  assertLegacyPrefix,
  listAllKeys,
  deleteKeys,
  run,
};
