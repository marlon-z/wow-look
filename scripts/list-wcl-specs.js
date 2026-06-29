#!/usr/bin/env node

const { getSpecConfig, listSpecs, DATA_VERSION } = require('./wcl-preset-config');

// 每组专精数：受 WCL 限流(3600点/小时)约束。3 个/组≈3600点，配合退避重试可用。
const GROUP_SIZE = Number(process.env.WCL_GROUP_SIZE) || 3;
const COS_BASE = process.env.WCL_COS_BASE || 'https://wowlook-1308073800.cos.ap-guangzhou.myqcloud.com';

function matrixSpecs(specs) {
  return specs.map((spec) => ({
    classKey: spec.classKey,
    specId: spec.specId,
    name: `${spec.classKey}-${spec.specId}`,
  }));
}

// 手动覆盖：指定专精 / 指定职业 / 全部。返回 null 表示走默认(最旧优先)。
function manualSpecsFromEnv(env) {
  const classKey = env.WCL_CLASS_KEY || '';
  const specId = env.WCL_SPEC_ID ? Number(env.WCL_SPEC_ID) : null;
  if (classKey && specId) {
    const spec = getSpecConfig(classKey, specId);
    if (!spec) throw new Error(`未知专精: ${classKey}/${specId}`);
    return [spec];
  }
  if (classKey) {
    const specs = listSpecs().filter((spec) => spec.classKey === classKey);
    if (!specs.length) throw new Error(`未知职业: ${classKey}`);
    return specs;
  }
  if (env.WCL_ALL === '1') return listSpecs();
  return null;
}

// 读取某专精在 COS 上的更新时间(generatedAt)；取不到/无数据视为最旧(0)。
async function fetchGeneratedAt(spec) {
  try {
    const url = `${COS_BASE}/wcl-presets/data-${DATA_VERSION}/${spec.classKey}/${spec.specId}/index.json?t=${Date.now()}`;
    const res = await fetch(url);
    if (!res.ok) return 0;
    const json = await res.json();
    return Number(json.generatedAt) || 0;
  } catch (err) {
    return 0;
  }
}

// 最旧优先：选 COS 上更新时间最旧的 size 个专精(无数据排最前)。
// 这样不依赖定时任务是否准点——每次都补最旧的，绝不会有专精被永久跳过。
async function stalestSpecs(size) {
  const specs = listSpecs();
  const timed = await Promise.all(specs.map(async (spec) => ({ spec, at: await fetchGeneratedAt(spec) })));
  timed.sort((a, b) => a.at - b.at);
  return timed.slice(0, size).map((item) => item.spec);
}

async function resolveSpecs(env) {
  const manual = manualSpecsFromEnv(env);
  if (manual) return manual;
  return stalestSpecs(GROUP_SIZE);
}

async function main() {
  const specs = matrixSpecs(await resolveSpecs(process.env));
  process.stdout.write(JSON.stringify(specs));
}

if (require.main === module) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = {
  manualSpecsFromEnv,
  stalestSpecs,
  fetchGeneratedAt,
  matrixSpecs,
  GROUP_SIZE,
};
