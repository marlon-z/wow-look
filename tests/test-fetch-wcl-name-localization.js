const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const {
  apiLocaleNamesToWeb,
  collectGemIdsFromItemRows,
  collectWclIdsFromObject,
  collectWclIdsFromLocal,
  numericEnchantLocaleNames,
  parseCsvLine,
  parseCsvObjects,
  resolveEnchantDb2Name,
  scoreEnchantSearchResult,
  stripWagoMarkup,
  WAGO_LOCALES,
} = require('../scripts/fetch-wcl-name-localization');

function testCollectWclIdsFromObject() {
  const ids = collectWclIdsFromObject({
    entries: [{
      presets: [{
        slots: {
          head: {
            itemId: 1,
            permanentEnchant: 8017,
            gems: [{ id: 240892 }, { id: 240916 }],
          },
          chest: {
            itemId: 2,
            permanentEnchant: 7987,
          },
        },
      }],
    }],
  });

  assert.deepStrictEqual([...ids.enchants].sort(), ['7987', '8017']);
  assert.deepStrictEqual([...ids.gems].sort(), ['240892', '240916']);
}

function testCollectWclIdsFromLocal() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'wcl-names-'));
  const specDir = path.join(root, 'mage', '63');
  fs.mkdirSync(specDir, { recursive: true });
  fs.writeFileSync(path.join(specDir, 'index.json'), '{}');
  fs.writeFileSync(path.join(specDir, 'mythic-plus-10.json'), JSON.stringify({
    entries: [{
      presets: [{
        slots: {
          finger1: {
            permanentEnchant: 7967,
            gems: [{ id: 240900 }],
          },
        },
      }],
    }],
  }));

  const ids = collectWclIdsFromLocal(root);
  assert.deepStrictEqual([...ids.enchants], ['7967']);
  assert.deepStrictEqual([...ids.gems], ['240900']);
}

function testScoreEnchantSearchResultPrefersEnchantItem() {
  const zhName = '强化闪避符文';
  const enchantItem = {
    name: { zh_CN: '附魔头盔 - 强化闪避符文' },
    item_subclass: { name: { zh_CN: '附魔' } },
  };
  const recipeItem = {
    name: { zh_CN: '公式：附魔头盔 - 强化闪避符文' },
    item_subclass: { name: { zh_CN: '附魔' } },
  };

  assert(scoreEnchantSearchResult(enchantItem, zhName) > scoreEnchantSearchResult(recipeItem, zhName));
  assert.strictEqual(scoreEnchantSearchResult({ name: { zh_CN: '无关物品' } }, zhName), -1);
}

function testApiLocaleNamesToWeb() {
  const names = apiLocaleNamesToWeb({
    en_US: 'Enchant Helm - Empowered Rune of Avoidance',
    de_DE: 'Helm - Ermächtigte Rune der Vermeidung',
    zh_CN: '附魔头盔 - 强化闪避符文',
  });

  assert.strictEqual(names['en-US'], 'Enchant Helm - Empowered Rune of Avoidance');
  assert.strictEqual(names['de-DE'], 'Helm - Ermächtigte Rune der Vermeidung');
  assert.strictEqual(names['zh-CN'], '附魔头盔 - 强化闪避符文');
}

function testNumericEnchantLocaleNames() {
  const names = numericEnchantLocaleNames(7935);
  assert.strictEqual(names['en-US'], '+41 Intellect & +115 Stamina');
  assert.strictEqual(names['de-DE'], '+41 Intelligenz & +115 Ausdauer');
  assert.strictEqual(names['zh-CN'], '+41 智力 & +115 耐力');
  assert.strictEqual(numericEnchantLocaleNames(999999), null);
}

function testWagoLocaleMap() {
  assert.strictEqual(WAGO_LOCALES['de-DE'], 'deDE');
  assert.strictEqual(WAGO_LOCALES['zh-CN'], 'zhCN');
  assert.strictEqual(WAGO_LOCALES['ko-KR'], 'koKR');
}

function testParseCsvObjects() {
  assert.deepStrictEqual(parseCsvLine('8017,"Helm ""Rune""",0'), ['8017', 'Helm "Rune"', '0']);
  assert.deepStrictEqual(parseCsvObjects('ID,Name\n8017,"Helm, Rune"\n'), [{ ID: '8017', Name: 'Helm, Rune' }]);
}

function testStripWagoMarkup() {
  assert.strictEqual(
    stripWagoMarkup('Helm - Rune |A:Professions-ChatIcon-Quality-12-Tier2:20:20|a'),
    'Helm - Rune',
  );
}

function testResolveEnchantDb2Name() {
  // 部位前缀被剥离 (与槽位标签重复)
  assert.strictEqual(
    resolveEnchantDb2Name(8017, 'Helm - Ermächtigte Rune der Vermeidung |A:foo|a', 'de-DE'),
    'Ermächtigte Rune der Vermeidung',
  );
  assert.strictEqual(
    resolveEnchantDb2Name(8017, 'Enchant Helm - Empowered Rune of Avoidance |A:foo|a', 'en-US'),
    'Empowered Rune of Avoidance',
  );
  // 模板替换保留 wago 原文措辞
  assert.strictEqual(
    resolveEnchantDb2Name(7935, '+$k1 Intelligenz und +$k2 Ausdauer |A:foo|a', 'de-DE'),
    '+41 Intelligenz und +115 Ausdauer',
  );
  assert.strictEqual(
    resolveEnchantDb2Name(7937, '+$k1 Intellect & +$457616s1% Mana |A:foo|a', 'en-US'),
    '+41 Intellect & +4% Mana',
  );
  // bug 修复: 2841 的 $k1 之前未被替换, 现回退数字公式
  assert.strictEqual(
    resolveEnchantDb2Name(2841, '+$k1 Ausdauer |A:foo|a', 'de-DE'),
    '+3 Ausdauer',
  );
  assert.strictEqual(
    resolveEnchantDb2Name(2841, '+$k1 Stamina |A:foo|a', 'en-US'),
    '+3 Stamina',
  );
}

function testCollectGemIdsFromItemRows() {
  const ids = collectGemIdsFromItemRows([
    { ID: '1', ClassID: '2' },
    { ID: '240892', ClassID: '3' },
    { ID: '240916', ClassID: '3' },
  ]);
  assert.deepStrictEqual([...ids].sort(), ['240892', '240916']);
}

testCollectWclIdsFromObject();
testCollectWclIdsFromLocal();
testScoreEnchantSearchResultPrefersEnchantItem();
testApiLocaleNamesToWeb();
testNumericEnchantLocaleNames();
testWagoLocaleMap();
testParseCsvObjects();
testStripWagoMarkup();
testResolveEnchantDb2Name();
testCollectGemIdsFromItemRows();

console.log('test-fetch-wcl-name-localization passed');
