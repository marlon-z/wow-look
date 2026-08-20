const assert = require('assert');

let page;
global.Page = (definition) => { page = definition; };
require('../miniprogram/packages/rankings/rankings');

assert.ok(page, '独立排行榜页面应注册');
assert.strictEqual(page.data.phase, 'class');
assert.strictEqual(page.data.classes.length, 13, '职业选择页应包含全部职业');

const tabs = page.buildWclContentTabs({ mythicPlus: [{ fileKey: 'top' }], raid: [{ fileKey: 'raid' }] });
assert.deepStrictEqual(tabs, [
  { type: 'mythicPlus', name: '大秘境' },
  { type: 'raid', name: '团本' },
], '内容筛选不应携带方案数量');
assert.deepStrictEqual(page.buildWclDungeonFilters([{ encounter: { id: 1, name: 'A' } }]), [], '单一副本不应显示无意义筛选');
assert.deepStrictEqual(page.buildWclDungeonFilters([
  { encounter: { id: 1, name: 'A' } },
  { encounter: { id: 2, localName: 'B' } },
]), [{ id: 'all', name: '全部' }, { id: '1', name: 'A' }, { id: '2', name: 'B' }]);
assert.match(page.formatWclUpdateTime(Date.UTC(2026, 7, 20, 8, 5), 'remote'), /^云端 · 8月20日 /);

const context = {
  data: {
    selectedClassKey: 'warrior', selectedClassName: '战士', selectedSpecId: 71, selectedSpecName: '武器',
    selectedWclContentType: 'mythicPlus', selectedWclFileKey: 'top',
  },
};
const preset = { id: 'preset-1', wclFileKey: 'top', wclContentType: 'mythicPlus' };
const query = page.buildPresetQuery.call(context, preset);
assert.match(query, /openWcl=1/);
assert.match(query, /wclPresetId=preset-1/);
assert.match(query, /wclFileKey=top/);
assert.match(page.buildRankingQuery.call(context), /classKey=warrior/);
assert.match(page.buildRankingQuery.call(context), /fileKey=top/);

const app = require('../miniprogram/app.json');
assert.ok(app.subPackages.some((pkg) => pkg.root === 'packages/rankings' && pkg.pages.includes('rankings')), '独立路由应注册为分包。');
const source = require('fs').readFileSync(require('path').join(__dirname, '..', 'miniprogram', 'packages', 'rankings', 'rankings.wxml'), 'utf8');
assert.ok(!source.includes('套</text>'), '筛选区不应展示方案数量');
assert.match(source, /onPageBack/);
assert.match(page.onPageBack.toString(), /wx\.navigateBack/, '职业选择页应能返回调用来源');
assert.match(page.onPageBack.toString(), /onBackToClasses/, '结果页返回必须回到职业选择');
const rankingConfig = require('../miniprogram/packages/rankings/rankings.json');
assert.strictEqual(rankingConfig.navigationBarTitleText, '排行榜配装');
assert.strictEqual(rankingConfig.enableShareAppMessage, true);
assert.strictEqual(rankingConfig.enableShareTimeline, true);

delete global.Page;
console.log('rankings page tests passed');
