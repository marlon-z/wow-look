#!/usr/bin/env node

const { getSpecConfig, listSpecs } = require('./wcl-preset-config');

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
  return listSpecs();
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
  matrixSpecs,
};
