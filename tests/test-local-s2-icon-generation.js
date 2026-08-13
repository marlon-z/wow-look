const assert = require('assert');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const converter = require('../scripts/convert-local-s2-icons');

const root = path.resolve(__dirname, '..');
const iconRoot = path.join(root, 'miniprogram', 'assets', 'icons');

async function main() {
  assert.strictEqual(converter.ICON_SIZE, 56);
  assert.strictEqual(converter.WEBP_QUALITY, 82);
  assert.strictEqual(converter.WEBP_EFFORT, 6);

  const iconFiles = fs.readdirSync(iconRoot).filter((name) => name.endsWith('.webp'));
  assert.strictEqual(iconFiles.length, 390, '应生成完整且唯一的 390 个独立 WebP 图标。');

  await Promise.all(iconFiles.map(async (iconFile) => {
    const metadata = await sharp(path.join(iconRoot, iconFile)).metadata();
    assert.strictEqual(metadata.format, 'webp', `${iconFile} 必须为 WebP。`);
    assert.strictEqual(metadata.width, 56, `${iconFile} 宽度必须为 56px。`);
    assert.strictEqual(metadata.height, 56, `${iconFile} 高度必须为 56px。`);
  }));

  console.log('local S2 icon generation tests passed');
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exitCode = 1;
});
