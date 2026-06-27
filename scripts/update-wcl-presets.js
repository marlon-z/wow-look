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

function parseTarget(argv) {
  const targetArgIndex = argv.indexOf('--target');
  if (targetArgIndex !== -1 && argv[targetArgIndex + 1]) {
    return argv[targetArgIndex + 1];
  }
  return process.env.WCL_PRESET_TARGET || 'all';
}

const TARGETS = {
  'fire-mage': [
    ['node', ['scripts/build-wcl-fire-mage-mplus-presets.js', '--top', '3']],
    ['node', ['scripts/build-wcl-fire-mage-raid-presets.js', '--top', '5']],
  ],
  'windwalker-monk': [
    ['node', ['scripts/build-wcl-windwalker-monk-mplus-presets.js', '--top', '3']],
    ['node', ['scripts/build-wcl-windwalker-monk-raid-presets.js', '--top', '5']],
  ],
};

assertEnv('WCL_CLIENT_ID');
assertEnv('WCL_CLIENT_SECRET');

const target = parseTarget(process.argv);
const commands = target === 'all'
  ? Object.values(TARGETS).flat()
  : TARGETS[target];

if (!commands) {
  console.error(`未知 WCL 预设目标: ${target}`);
  console.error(`可选目标: all, ${Object.keys(TARGETS).join(', ')}`);
  process.exit(1);
}

console.log(`WCL 预设更新目标: ${target}`);
commands.forEach(([command, args]) => run(command, args));

console.log('\nWCL 预设数据已生成完成');
