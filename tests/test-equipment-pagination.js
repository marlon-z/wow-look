const assert = require('assert');
const path = require('path');

const {
  groupItems,
  groupItemsBySource,
  paginateGroups,
} = require('../miniprogram/utils/equipment');

function makeItem(index, slot = 'head') {
  return {
    id: `item-${index}`,
    slot,
    slotName: slot === 'head' ? '头' : '武',
    instanceId: `instance-${Math.floor(index / 20)}`,
    instanceName: `副本${Math.floor(index / 20)}`,
    instanceType: 'dungeon',
    encounterId: `encounter-${Math.floor(index / 10)}`,
    encounterName: `首领${Math.floor(index / 10)}`,
    source: { difficultyName: '史诗' },
    _sort: { order: index },
  };
}

const items = Array.from({ length: 35 }, (_, index) => makeItem(index))
  .concat(Array.from({ length: 20 }, (_, index) => makeItem(index + 35, 'weapon')));

const slotGroups = groupItems(items);
assert.deepStrictEqual(slotGroups.map((group) => group.key), ['head', 'weapon'], '按部位分组必须使用稳定的槽位 key。');

const sourceGroups = groupItemsBySource(items);
assert.ok(sourceGroups.length > 1, '测试数据必须产生多个来源分组。');
assert.strictEqual(new Set(sourceGroups.map((group) => group.key)).size, sourceGroups.length, '按来源分组 key 不得重复。');

const firstPage = paginateGroups(slotGroups, 30);
assert.strictEqual(firstPage.reduce((total, group) => total + group.items.length, 0), 30, '首批只能投影 30 件装备。');
assert.strictEqual(firstPage.length, 1, '首批不应包含空的后续分组。');
assert.strictEqual(firstPage[0].totalCount, 35, '投影组必须保留完整分组数量。');
assert.deepStrictEqual(firstPage[0].items.map((item) => item.id), items.slice(0, 30).map((item) => item.id), '首批必须保持原始排序。');

const secondPage = paginateGroups(slotGroups, 60);
assert.strictEqual(secondPage.reduce((total, group) => total + group.items.length, 0), 55, '追加一批后应包含全部 55 件装备。');
assert.deepStrictEqual(secondPage.map((group) => group.key), ['head', 'weapon'], '追加后分组 key 必须稳定且不重复。');
assert.strictEqual(secondPage[0].totalCount, 35, '追加后首组完整数量必须保持。');
assert.strictEqual(secondPage[1].totalCount, 20, '追加后第二组完整数量必须保持。');
assert.strictEqual(new Set(secondPage.flatMap((group) => group.items.map((item) => item.id))).size, 55, '分页投影不得重复装备。');

assert.deepStrictEqual(paginateGroups(slotGroups, 0), [], '重置后的 0 件投影应为空。');
assert.strictEqual(paginateGroups(slotGroups, 999).reduce((total, group) => total + group.items.length, 0), 55, '超过结果数时应安全停在末尾。');
assert.strictEqual(slotGroups[0].items.length, 35, '分页投影不得修改完整分组。');

const pageFile = path.join(__dirname, '..', 'miniprogram/pages/equipment/equipment.js');
let pageDefinition = null;
global.Page = (definition) => {
  pageDefinition = definition;
};
delete require.cache[require.resolve(pageFile)];
require(pageFile);
delete global.Page;
assert.strictEqual(Object.hasOwn(pageDefinition.data, 'allItems'), false, '完整装备记录不得放进页面 data。');

const page = {
  ...pageDefinition,
  data: { ...pageDefinition.data },
  setData(nextData, callback) {
    Object.assign(this.data, nextData);
    if (callback) callback();
  },
  filteredGroups: slotGroups,
  filteredItemCount: 55,
};

page.resetVisibleItems();
assert.strictEqual(page.data.loadedResultCount, 30, '页面重置必须只显示首批 30 件。');
assert.strictEqual(page.data.hasMoreItems, true, '首批之后必须仍可继续加载。');
assert.strictEqual(page.data.groupedItems.reduce((total, group) => total + group.items.length, 0), 30, '页面首批渲染数必须为 30。');

page.onReachBottom();
assert.strictEqual(page.data.loadedResultCount, 55, '触底后必须追加下一批结果。');
assert.strictEqual(page.data.hasMoreItems, false, '加载完整结果后必须结束分页。');
assert.strictEqual(page.data.groupedItems.reduce((total, group) => total + group.items.length, 0), 55, '触底后页面必须显示所有已追加的装备。');

page.onReachBottom();
assert.strictEqual(page.data.loadedResultCount, 55, '已经到底时触底不得重复追加结果。');

console.log('equipment pagination tests passed');
