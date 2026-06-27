#!/usr/bin/env node

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const DEFAULT_BUCKET = 'wowlook-1308073800';
const DEFAULT_REGION = 'ap-guangzhou';

const CONTENT_TYPE = {
  '.json': 'application/json; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
};

function createCosClient(secrets) {
  let COS;
  try {
    COS = require('cos-nodejs-sdk-v5');
  } catch (err) {
    throw new Error('缺少 cos-nodejs-sdk-v5。请先运行 npm install cos-nodejs-sdk-v5，或在 GitHub Actions 中安装该依赖。');
  }
  return new COS({
    SecretId: secrets.secretId,
    SecretKey: secrets.secretKey,
  });
}

function parseArgs(argv) {
  const args = {
    source: path.join(process.cwd(), 'cos-upload', 'wcl-presets'),
    prefix: 'wcl-presets',
    bucket: process.env.COS_BUCKET || DEFAULT_BUCKET,
    region: process.env.COS_REGION || DEFAULT_REGION,
    dryRun: false,
  };
  for (let i = 2; i < argv.length; i += 1) {
    const key = argv[i];
    const val = argv[i + 1];
    if (key === '--source') { args.source = path.resolve(process.cwd(), val); i += 1; }
    else if (key === '--prefix') { args.prefix = String(val || '').replace(/^\/|\/$/g, ''); i += 1; }
    else if (key === '--bucket') { args.bucket = val; i += 1; }
    else if (key === '--region') { args.region = val; i += 1; }
    else if (key === '--dry-run') { args.dryRun = true; }
  }
  return args;
}

function env(name, fallbackName) {
  return process.env[name] || (fallbackName ? process.env[fallbackName] : '');
}

function assertConfig(args) {
  const secretId = env('COS_SECRET_ID', 'TENCENT_SECRET_ID');
  const secretKey = env('COS_SECRET_KEY', 'TENCENT_SECRET_KEY');
  if (!secretId) throw new Error('缺少 COS_SECRET_ID 或 TENCENT_SECRET_ID');
  if (!secretKey) throw new Error('缺少 COS_SECRET_KEY 或 TENCENT_SECRET_KEY');
  if (!fs.existsSync(args.source)) throw new Error(`上传目录不存在: ${args.source}`);
  return { secretId, secretKey };
}

function walkFiles(dir) {
  const files = [];
  fs.readdirSync(dir, { withFileTypes: true }).forEach((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkFiles(fullPath));
    } else if (entry.isFile()) {
      files.push(fullPath);
    }
  });
  return files;
}

function encodePathPart(value) {
  return encodeURIComponent(value).replace(/[!'()*]/g, function (char) {
    return '%' + char.charCodeAt(0).toString(16).toUpperCase();
  });
}

function encodeCosPath(key) {
  return '/' + key.split('/').map(encodePathPart).join('/');
}

function sha1(value) {
  return crypto.createHash('sha1').update(value).digest('hex');
}

function hmacSha1(key, value) {
  return crypto.createHmac('sha1', key).update(value).digest('hex');
}

function authorization(options) {
  const now = Math.floor(Date.now() / 1000);
  const signTime = `${now};${now + 3600}`;
  const keyTime = signTime;
  const httpMethod = options.method.toLowerCase();
  const canonicalUri = encodeCosPath(options.key);
  const canonicalQueryString = '';
  const canonicalHeaderList = `host=${options.host}\n`;
  const signedHeaderList = 'host';
  const httpString = [
    httpMethod,
    canonicalUri,
    canonicalQueryString,
    canonicalHeaderList,
    '',
  ].join('\n');
  const stringToSign = [
    'sha1',
    signTime,
    sha1(httpString),
    '',
  ].join('\n');
  const signKey = hmacSha1(options.secretKey, keyTime);
  const signature = hmacSha1(Buffer.from(signKey, 'hex'), stringToSign);

  return [
    'q-sign-algorithm=sha1',
    `q-ak=${options.secretId}`,
    `q-sign-time=${signTime}`,
    `q-key-time=${keyTime}`,
    `q-header-list=${signedHeaderList}`,
    'q-url-param-list=',
    `q-signature=${signature}`,
  ].join('&');
}

function contentType(file) {
  return CONTENT_TYPE[path.extname(file).toLowerCase()] || 'application/octet-stream';
}

async function putObject(args, secrets, file) {
  const relative = path.relative(args.source, file).split(path.sep).join('/');
  const key = [args.prefix, relative].filter(Boolean).join('/');
  const body = fs.readFileSync(file);
  if (args.dryRun) {
    console.log(`[dry-run] ${key} (${body.length} bytes)`);
    return;
  }

  const cos = args.cos || createCosClient(secrets);
  args.cos = cos;

  await new Promise((resolve, reject) => {
    cos.putObject({
      Bucket: args.bucket,
      Region: args.region,
      Key: key,
      Body: body,
      ContentType: contentType(file),
      CacheControl: 'public, max-age=300',
    }, (err) => {
      if (err) {
        reject(new Error(`上传失败 ${key}: ${err.statusCode || ''} ${err.code || ''} ${err.message || JSON.stringify(err)}`));
        return;
      }
      resolve();
    });
  });
  console.log(`uploaded ${key}`);
}

async function main() {
  const args = parseArgs(process.argv);
  const secrets = assertConfig(args);
  const files = walkFiles(args.source);
  console.log(`准备上传 ${files.length} 个文件到 ${args.bucket}/${args.prefix}`);
  for (const file of files) {
    await putObject(args, secrets, file);
  }
  console.log('COS 上传完成');
}

if (require.main === module) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = {
  parseArgs,
  encodeCosPath,
  authorization,
};
