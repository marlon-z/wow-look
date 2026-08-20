const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const {
  auditDirectory,
  expectedItemSlot,
  isSlotCompatible,
} = require('../scripts/audit-wcl-preset-mapping');

const classData = {
  instances: [{
    id: 1,
    encounters: [{
      id: 1,
      items: [
        { id: 1, slot: 'head', specs: [103], sourceType: 'tier' },
        { id: 2, slot: 'finger', specs: [103] },
        { id: 3, slot: 'trinket', specs: [103] },
        { id: 4, slot: 'weapon', specs: [103] },
        { id: 5, slot: 'feet', specs: [103] },
        { id: 6, slot: 'head', specs: [102] },
      ],
    }],
  }],
};

const source = {
  entries: [{
    presets: [{
      id: 'fixture-preset',
      combatantStats: { fieldSources: { crit: 'critMelee' } },
      slots: {
        head: {
          itemId: 1, permanentEnchant: 10, enchantName: '附魔', gems: [{ id: 20, name: '宝石' }],
          snapshotStatus: 'resolved', snapshot: { secondaryStats: [] },
        },
        finger1: { itemId: 2 },
        finger2: { itemId: 2 },
        trinket1: { itemId: 3 },
        trinket2: { itemId: 3 },
        weapon: { itemId: 4 },
        weapon2: { itemId: 4 },
        wrist: { itemId: 999, craftedStats: [{ type: 'haste', value: 45 }] },
        feet: { itemId: 6 },
        neck: { itemId: 5 },
      },
    }],
  }],
};

const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'wowlook-wcl-audit-'));
fs.writeFileSync(path.join(temp, 'mythic-plus-top.json'), JSON.stringify(source));
const report = auditDirectory({ source: temp, classKey: 'druid', specId: 103, classData });
fs.rmSync(temp, { recursive: true, force: true });

assert.strictEqual(expectedItemSlot('finger1'), 'finger');
assert.strictEqual(expectedItemSlot('trinket2'), 'trinket');
assert.strictEqual(expectedItemSlot('weapon2'), 'weapon');
assert.strictEqual(isSlotCompatible('finger2', { slot: 'finger' }), true);
assert.strictEqual(isSlotCompatible('head', { slot: 'feet' }), false);
assert.strictEqual(report.summary.files, 1);
assert.strictEqual(report.summary.presets, 1);
assert.strictEqual(report.summary.mappedItems, 7);
assert.strictEqual(report.summary.missingItems.length, 1);
assert.strictEqual(report.summary.missingItems[0].itemId, 999);
assert.strictEqual(report.summary.wrongSpecItems.length, 1);
assert.strictEqual(report.summary.wrongSpecItems[0].itemId, 6);
assert.strictEqual(report.summary.slotMismatches.length, 1);
assert.strictEqual(report.summary.slotMismatches[0].itemId, 5);
assert.deepStrictEqual(report.summary.preservedMetadata, { craftedStats: 1, enchants: 1, gems: 1 });
assert.deepStrictEqual(report.summary.snapshot, { resolved: 1, missing: 9, noSecondary: 1, tierMapped: 1 });
assert.deepStrictEqual(report.summary.combatantStats, { resolved: 1, missing: 0 });

console.log('wcl preset mapping audit tests passed');
