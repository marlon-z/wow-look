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

const args = ['scripts/build-wcl-presets.js'];
if (process.env.WCL_CLASS_KEY) args.push('--class-key', process.env.WCL_CLASS_KEY);
if (process.env.WCL_SPEC_ID) args.push('--spec-id', process.env.WCL_SPEC_ID);
if (process.env.WCL_CONTENT) args.push('--content', process.env.WCL_CONTENT);
if (process.env.WCL_TOP_MPLUS) args.push('--top-mplus', process.env.WCL_TOP_MPLUS);
if (process.env.WCL_TOP_RAID) args.push('--top-raid', process.env.WCL_TOP_RAID);
if (process.env.WCL_SAMPLE === '1') args.push('--sample');

run('node', args);

console.log('\nWCL 预设数据已生成完成');
