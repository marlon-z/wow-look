const assert = require('assert');

const {
  buildWowheadTooltipUrl,
  normalizeBonusIDs,
  hasCraftingBonusSignature,
  parseCraftedStatsFromTooltip,
  parseActualSecondaryStats,
  resolveGearStats,
  gearToSlots,
  wclGql,
} = require('../scripts/wcl-authority-snapshot');

const craftingMap = {
  craftedItems: {
    239648: {
      name: '殉难者的裹腕',
      slot: 'wrist',
    },
  },
};

const tooltipFixture = {
  name: '殉难者的裹腕',
  icon: 'inv_bracer_cloth_questbloodelf_b_01',
  tooltip: [
    '<span><!--amr-->42护甲</span>',
    '<span><!--stat5-->+67 智力</span>',
    '<span><!--stat7-->+948 耐力</span>',
    '<!--ebstats-->',
    '<span class="q2">+<!--rtg36-->45 急速</span>',
    '<br><span class="q2">+<!--rtg49-->45 精通</span>',
    '<!--egstats-->',
  ].join(''),
  url: 'fixture://wowhead-tooltip',
};

async function main() {
  const originalFetch = global.fetch;
  global.fetch = async () => ({
    ok: false,
    status: 429,
    headers: { get: () => null },
    text: async () => '{"error":"rate_limited"}',
  });
  await assert.rejects(
    () => wclGql('token', 'query { worldData { zones { id } } }', {}, { maxRetries: 0 }),
    /WCL GraphQL HTTP 429/
  );

  global.fetch = async () => ({
    ok: true,
    status: 200,
    headers: { get: () => null },
    text: async () => '{}',
  });
  await assert.rejects(
    () => wclGql('token', 'query { worldData { zones { id } } }', {}),
    /WCL GraphQL 缺少 data/
  );
  global.fetch = originalFetch;

  assert.strictEqual(normalizeBonusIDs([1, '2', 0, null, 3]), '1,2,3');
  assert.strictEqual(hasCraftingBonusSignature([12214, 12497, 12066]), true);
  assert.strictEqual(hasCraftingBonusSignature([12214, 12497]), false);

  assert.strictEqual(
    buildWowheadTooltipUrl({ id: 239648, bonusIDs: [12214, 13667] }, 4),
    'https://nether.wowhead.com/tooltip/item/239648?dataEnv=1&locale=4&bonus=12214%3A13667'
  );

  const parsed = parseCraftedStatsFromTooltip(tooltipFixture.tooltip);
  assert.deepStrictEqual(parsed.map((stat) => stat.type), ['haste', 'mastery']);
  assert.deepStrictEqual(parsed.map((stat) => stat.value), [45, 45]);

  assert.deepStrictEqual(
    parseActualSecondaryStats('<!--ebstats--><!--rtg36-->49急速<!--rtg49-->115精通<!--egstats-->'),
    [
      { type: 'haste', name: '急速', value: 49 },
      { type: 'mastery', name: '精通', value: 115 },
    ]
  );
  assert.deepStrictEqual(parseActualSecondaryStats('<!--ebstats--><!--egstats-->'), []);
  assert.deepStrictEqual(parseActualSecondaryStats('<!--ebstats--><!--rtg36-->20急速<!--rtg36-->15急速<!--egstats-->'), [
    { type: 'haste', name: '急速', value: 35 },
  ]);
  assert.deepStrictEqual(parseActualSecondaryStats('<!--ebstats--><!--rtg36-->49急速<!--rtg17-->30吸血<!--egstats-->'), [
    { type: 'haste', name: '急速', value: 49 },
  ]);
  assert.throws(() => parseActualSecondaryStats('<!--ebstats--><!--rtg36-->0急速<!--egstats-->'), /无效绿字数值/);
  assert.deepStrictEqual(parseActualSecondaryStats('<!--ebstats--><!--rtg999-->22未知绿字<!--egstats-->'), []);

  const resolved = await resolveGearStats(
    { itemId: 239648, ilvl: 285, bonusIDs: [12214, 12497, 12066] },
    { id: 239648, itemLevel: 285, bonusIDs: [12214, 12497, 12066] },
    craftingMap,
    { tooltipResolver: async () => tooltipFixture, cache: {} }
  );
  assert.strictEqual(resolved.crafted, true);
  assert.strictEqual(resolved.craftedName, '殉难者的裹腕');
  assert.strictEqual(resolved.craftedStatsUnknown, undefined);
  assert.strictEqual(resolved.snapshotStatus, 'resolved');
  assert.deepStrictEqual(resolved.snapshot, {
    name: '殉难者的裹腕',
    primaryStats: [{ type: 'intellect', name: '智力', value: 67 }],
    stamina: { name: '耐力', value: 948 },
    armor: 42,
    secondaryStats: [
      { type: 'haste', name: '急速', value: 45 },
      { type: 'mastery', name: '精通', value: 45 },
    ],
  });
  assert.deepStrictEqual(resolved.craftedStats.map((stat) => stat.name), ['急速', '精通']);

  await assert.rejects(() => resolveGearStats(
    { itemId: 239648, ilvl: 285, bonusIDs: [12214, 12497, 12066] },
    { id: 239648, itemLevel: 285, bonusIDs: [12214, 12497, 12066] },
    craftingMap,
    { tooltipResolver: async () => ({ name: '殉难者的裹腕', tooltip: '', url: 'fixture://empty' }), cache: {} }
  ), /无法确定绿字解析状态/);

  const cacheCalls = [];
  const cacheOptions = {
    cache: {},
    tooltipResolver: async (gearItem, context) => {
      cacheCalls.push(context.cacheKey);
      return tooltipFixture;
    },
  };
  await resolveGearStats({ itemId: 239648, bonusIDs: [1] }, { id: 239648, bonusIDs: [1] }, craftingMap, cacheOptions);
  await resolveGearStats({ itemId: 239648, bonusIDs: [2] }, { id: 239648, bonusIDs: [2] }, craftingMap, cacheOptions);
  await resolveGearStats({ itemId: 239648, bonusIDs: [1] }, { id: 239648, bonusIDs: [1] }, craftingMap, Object.assign({}, cacheOptions, { locale: 1 }));
  assert.deepStrictEqual(cacheCalls, ['239648|1|4', '239648|2|4', '239648|1|1']);

  const slots = await gearToSlots([
    { id: 100, itemLevel: 300, bonusIDs: [7] },
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    { id: 239648, itemLevel: 285, bonusIDs: [12214, 12497, 12066] },
  ], craftingMap, { tooltipResolver: async () => tooltipFixture, cache: {} });
  assert.strictEqual(slots.head.itemId, 100);
  assert.strictEqual(slots.head.snapshotStatus, 'resolved');
  assert.strictEqual(slots.head.snapshot.name, '殉难者的裹腕');
  assert.strictEqual(slots.wrist.craftedStats[0].type, 'haste');

  console.log('wcl authority snapshot tests passed');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
