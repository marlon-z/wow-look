const assert = require('assert');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const converter = require('../scripts/convert-local-s2-icons');

const root = path.resolve(__dirname, '..');
const iconRoot = path.join(root, 'miniprogram', 'assets', 'icons');

async function main() {
  assert.strictEqual(converter.ICON_SIZE, 56);
  assert.strictEqual(converter.JPEG_QUALITY, 90);

  const iconFiles = fs.readdirSync(iconRoot).filter((name) => name.endsWith('.jpg'));
  assert.strictEqual(iconFiles.length, 390, '应生成完整且唯一的 390 个独立 JPEG 图标。');

  await Promise.all(iconFiles.map(async (iconFile) => {
    const metadata = await sharp(path.join(iconRoot, iconFile)).metadata();
    assert.strictEqual(metadata.format, 'jpeg', `${iconFile} 必须为 JPEG。`);
    assert.strictEqual(metadata.width, 56, `${iconFile} 宽度必须为 56px。`);
    assert.strictEqual(metadata.height, 56, `${iconFile} 高度必须为 56px。`);
  }));

  const emblemRoot = path.join(root, 'miniprogram', 'assets', 'classes', 'emblem');
  const emblemFiles = fs.readdirSync(emblemRoot).filter((name) => name.endsWith('.png'));
  assert.strictEqual(emblemFiles.length, 13, '应生成全部 13 个职业徽记。');
  await Promise.all(emblemFiles.map(async (emblemFile) => {
    const metadata = await sharp(path.join(emblemRoot, emblemFile)).metadata();
    assert.ok(metadata.width >= 120 && metadata.width <= 128, `${emblemFile} 宽度必须在 120px 至 128px 之间。`);
  }));

  console.log('local S2 icon generation tests passed');
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exitCode = 1;
});
