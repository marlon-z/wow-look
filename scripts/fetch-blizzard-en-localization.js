#!/usr/bin/env node

const path = require('path');
const { spawnSync } = require('child_process');

const script = path.join(__dirname, 'fetch-blizzard-localization.js');
const result = spawnSync(process.execPath, [
  script,
  '--region=us',
  '--locale=en_US',
  '--outLocale=en-US',
  ...process.argv.slice(2),
], { stdio: 'inherit' });

process.exit(result.status ?? 1);
