#!/usr/bin/env node
// 一次性把 COS 上的排行榜预设同步到本地 cos-upload/wcl-presets/data-<版本>。
// 这是「副属性倾向」管线中唯一读 COS 的一步, 手动触发; 之后聚合与生成 SEO 全程只读本地。
const fs = require('fs');
const path = require('path');
const { listSpecs, DATA_VERSION } = require('./wcl-preset-config');

const COS_BASE = (process.env.WCL_COS_BASE || 'https://wowlook-1308073800.cos.ap-guangzhou.myqcloud.com').replace(/\/$/, '');
const OUT_ROOT = path.resolve('cos-upload', 'wcl-presets', `data-${DATA_VERSION}`);

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  const text = await res.text();
  return { json: JSON.parse(text), bytes: Buffer.byteLength(text) };
}

function writeLocal(relDir, name, obj) {
  const dir = path.join(OUT_ROOT, relDir);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, name), JSON.stringify(obj));
}

async function main() {
  const specs = listSpecs();
  let totalBytes = 0;
  let files = 0;
  let failed = 0;
  for (const spec of specs) {
    const rel = `${spec.classKey}/${spec.specId}`;
    const specBase = `${COS_BASE}/wcl-presets/data-${DATA_VERSION}/${rel}`;
    let index;
    try {
      const res = await fetchJson(`${specBase}/index.json?t=${Date.now()}`);
      index = res.json;
      totalBytes += res.bytes;
      files += 1;
      writeLocal(rel, 'index.json', index);
    } catch (err) {
      console.warn(`skip ${rel}: ${err.message}`);
      failed += 1;
      continue;
    }
    const fileKeys = [...(index.mythicPlus || []), ...(index.raid || [])].map((f) => f.fileKey).filter(Boolean);
    for (const fileKey of fileKeys) {
      try {
        const res = await fetchJson(`${specBase}/${fileKey}.json?t=${Date.now()}`);
        writeLocal(rel, `${fileKey}.json`, res.json);
        totalBytes += res.bytes;
        files += 1;
      } catch (err) {
        console.warn(`skip ${rel}/${fileKey}: ${err.message}`);
        failed += 1;
      }
    }
    console.log(`${rel}: ${fileKeys.length + 1} file(s)`);
  }
  console.log(`\nDone. ${files} file(s), ${failed} failed, ${(totalBytes / 1048576).toFixed(2)} MB from COS -> ${OUT_ROOT}`);
}

if (require.main === module) {
  main().catch((err) => { console.error(err); process.exit(1); });
}
