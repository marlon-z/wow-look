const assert = require('assert');

const {
  buildWowheadTooltipUrl,
  normalizeBonusIDs,
  hasCraftingBonusSignature,
  parseCraftedStatsFromTooltip,
  resolveCrafting,
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
    '<span class="q2">+<!--rtg36-->45 急速</span>',
    '<br><span class="q2">+<!--rtg49-->45 精通</span>',
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

  const resolved = await resolveCrafting(
    { itemId: 239648, ilvl: 285, bonusIDs: [12214, 12497, 12066] },
    { id: 239648, itemLevel: 285, bonusIDs: [12214, 12497, 12066] },
    craftingMap,
    { tooltipResolver: async () => tooltipFixture, cache: {} }
  );
  assert.strictEqual(resolved.crafted, true);
  assert.strictEqual(resolved.craftedName, '殉难者的裹腕');
  assert.strictEqual(resolved.craftedStatsUnknown, undefined);
  assert.deepStrictEqual(resolved.craftedStats.map((stat) => stat.name), ['急速', '精通']);

  const unknown = await resolveCrafting(
    { itemId: 239648, ilvl: 285, bonusIDs: [12214, 12497, 12066] },
    { id: 239648, itemLevel: 285, bonusIDs: [12214, 12497, 12066] },
    craftingMap,
    { tooltipResolver: async () => ({ name: '殉难者的裹腕', tooltip: '', url: 'fixture://empty' }), cache: {} }
  );
  assert.strictEqual(unknown.craftedStatsUnknown, true);
  assert.strictEqual(unknown.missingCraftingTooltip, '239648|12214,12497,12066');

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
  assert.strictEqual(slots.wrist.craftedStats[0].type, 'haste');

  console.log('wcl authority snapshot tests passed');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
