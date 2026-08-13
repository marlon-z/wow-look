'use strict';

/*
 * Generates the standalone mini-program item icons used by the local-only
 * 12.1 S2 build. WebP keeps every item as an independent image (no sprite
 * coordinates or UI changes) while retaining enough source detail for mobile
 * equipment cards.
 */
const fs = require('fs');
const path = require('path');
const ICON_SIZE = 56;
const WEBP_QUALITY = 82;
const WEBP_EFFORT = 6;
let sharp;
try {
  sharp = require('sharp');
} catch (error) {
  throw new Error('Missing build dependency "sharp". Run "npm install" in the repository before generating local S2 assets.');
}

function readArgument(name) {
  const index = process.argv.indexOf(name);
  if (index === -1 || !process.argv[index + 1]) {
    throw new Error(`Missing required argument: ${name}`);
  }
  return process.argv[index + 1];
}

async function main() {
  const sourceRoot = readArgument('--source-root');
  const targetRoot = readArgument('--target-root');
  const manifestPath = readArgument('--manifest');
  const iconNames = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

  fs.mkdirSync(targetRoot, { recursive: true });
  const concurrency = 12;
  let index = 0;

  async function worker() {
    while (index < iconNames.length) {
      const iconName = iconNames[index];
      index += 1;
      const source = path.join(sourceRoot, iconName);
      const target = path.join(targetRoot, `${path.parse(iconName).name}.webp`);
      if (!fs.existsSync(source)) {
        throw new Error(`Local icon source does not exist: ${source}`);
      }
      await sharp(source)
        .resize(ICON_SIZE, ICON_SIZE, { fit: 'fill' })
        .webp({ quality: WEBP_QUALITY, effort: WEBP_EFFORT })
        .toFile(target);
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, iconNames.length) }, worker));
  console.log(`Generated ${iconNames.length} standalone WebP item icons.`);
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error.stack || error.message);
    process.exitCode = 1;
  });
}

module.exports = {
  ICON_SIZE,
  WEBP_QUALITY,
  WEBP_EFFORT,
};
