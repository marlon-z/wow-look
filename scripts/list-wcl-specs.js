#!/usr/bin/env node

const { getSpecConfig, listSpecs } = require('./wcl-preset-config');

// 每组专精数：受 WCL 限流(3600点/小时)约束，2 个/组(~2400点)留 1.5 倍余量。
const GROUP_SIZE = Number(process.env.WCL_GROUP_SIZE) || 2;

function chunk(list, size) {
  const groups = [];
  for (let i = 0; i < list.length; i += size) {
    groups.push(list.slice(i, i + size));
  }
  return groups;
}

// 按当前整点小时轮转选当前组：每过 1 小时推进一组，全部 N 组约 N 小时刷完一圈。
function currentGroupSpecs(env) {
  const groups = chunk(listSpecs(), GROUP_SIZE);
  if (!groups.length) return [];
  let index;
  if (env.WCL_GROUP_INDEX != null && env.WCL_GROUP_INDEX !== '') {
    index = ((Number(env.WCL_GROUP_INDEX) % groups.length) + groups.length) % groups.length;
  } else {
    index = Math.floor(Date.now() / 3600000) % groups.length;
  }
  return groups[index];
}

function selectedSpecsFromEnv(env) {
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
  // 默认(定时任务)：当前轮转组
  return currentGroupSpecs(env);
}

function matrixSpecs(specs) {
  return specs.map((spec) => ({
    classKey: spec.classKey,
    specId: spec.specId,
    name: `${spec.classKey}-${spec.specId}`,
  }));
}

function main() {
  const specs = matrixSpecs(selectedSpecsFromEnv(process.env));
  process.stdout.write(JSON.stringify(specs));
}

if (require.main === module) {
  try {
    main();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

module.exports = {
  selectedSpecsFromEnv,
  currentGroupSpecs,
  chunk,
  matrixSpecs,
  GROUP_SIZE,
};
