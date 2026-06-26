#!/usr/bin/env node

const { spawnSync } = require('child_process');

function run(command, args) {
  console.log(`\n> ${command} ${args.join(' ')}`);
  const result = spawnSync(command, args, {
    stdio: 'inherit',
    shell: process.platform === 'win32',
    env: process.env,
  });
  if (result.status !== 0) {
    process.exit(result.status || 1);
  }
}

function assertEnv(name) {
  if (!process.env[name]) {
    console.error(`缺少环境变量 ${name}`);
    process.exit(1);
  }
}

assertEnv('WCL_CLIENT_ID');
assertEnv('WCL_CLIENT_SECRET');

run('node', ['scripts/build-wcl-fire-mage-mplus-presets.js', '--top', '3']);
run('node', ['scripts/build-wcl-fire-mage-raid-presets.js', '--top', '5']);

console.log('\nWCL 预设数据已生成完成');
