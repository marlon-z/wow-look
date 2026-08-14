const { filterAppearanceUnlockItems } = require('./s2-appearance-unlock-filter');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const cosmetic = (id, name) => ({
  id,
  name,
  stats: { effects: { use: ['使用：将此外观添加到你的战团收藏中。'] } },
});

const source = {
  meta: { itemCount: 4 },
  instances: [{
    id: 1320,
    encounters: [{
      id: 1,
      items: [
        { id: 999999, name: '正常装备', stats: { effects: { use: [] } } },
        cosmetic(258045, '黎明之刃的战刃'),
        cosmetic(275937, '妖术领主的面容'),
        cosmetic(281227, '盘魂者的鲁希卡面具'),
      ],
    }],
  }],
};

const result = filterAppearanceUnlockItems(source);
const items = result.data.instances[0].encounters[0].items;

assert(items.length === 1, `应仅保留一件正常装备，实际 ${items.length}。`);
assert(items[0].id === 999999, '正常装备被错误排除。');
assert(result.excludedItemIds.join(',') === '258045,275937,281227', `排除 ID 不正确：${result.excludedItemIds.join(',')}`);
assert(result.data.meta.itemCount === 1, `meta.itemCount 未同步：${result.data.meta.itemCount}`);
console.log('S2 外观解锁物过滤检查通过。');
