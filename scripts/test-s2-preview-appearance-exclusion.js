const fs = require('fs');
const path = require('path');
const { APPEARANCE_UNLOCK_ITEM_IDS, CLASS_KEYS, countItems } = require('./s2-appearance-unlock-filter');

const ROOT = path.resolve(__dirname, '..');
const PREVIEW_DIR = path.join(ROOT, 'cos-upload', 'data-12.1-s2-crafted-preview');
const blockedIds = new Set(APPEARANCE_UNLOCK_ITEM_IDS);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function verify(label, readClassData) {
  let total = 0;
  const remaining = [];
  CLASS_KEYS.forEach((classKey) => {
    const data = readClassData(classKey);
    const itemCount = countItems(data.instances);
    assert(data.meta?.itemCount === itemCount,
      `${label}/${classKey} meta.itemCount=${data.meta?.itemCount}，实际=${itemCount}。`);
    total += itemCount;
    (data.instances || []).forEach((instance) => (instance.encounters || []).forEach((encounter) => {
      (encounter.items || []).forEach((item) => {
        if (blockedIds.has(Number(item.id))) remaining.push(`${classKey}:${item.id}`);
      });
    }));
  });
  assert(remaining.length === 0, `${label} 仍包含外观解锁物：${remaining.join(', ')}`);
  assert(total === 2269, `${label} 总记录应为2269，实际${total}。`);
  return total;
}

const previewTotal = verify('预览数据', (classKey) => JSON.parse(
  fs.readFileSync(path.join(PREVIEW_DIR, `${classKey}.json`), 'utf8')
));
const packageTotal = verify('小程序分包', (classKey) => require(
  path.join(ROOT, 'miniprogram', 'packages', `class-${classKey}`, 'data', classKey)
));

console.log(`S2 外观解锁物排除验证通过：预览数据与小程序分包各 ${previewTotal}/${packageTotal} 条。`);
