const assert = require('assert');
const fs = require('fs');
const path = require('path');
const {
  DATA_VERSION,
  MYTHIC_PLUS_DUNGEONS,
  RAIDS,
  getSpecConfig,
  listSpecs,
  buildDefaultSpecMap,
} = require('../scripts/wcl-preset-config');

assert.strictEqual(DATA_VERSION, '12.1');
assert.deepStrictEqual(MYTHIC_PLUS_DUNGEONS.map((dungeon) => dungeon.id), [12993, 12813, 12825, 12859, 12923, 61762, 112521, 61877]);
assert.strictEqual(RAIDS.length, 1);
assert.strictEqual(RAIDS[0].zoneId, 53);
assert.strictEqual(RAIDS[0].fileKey, 'raid-mythic-venomous-abyss');
assert.strictEqual(RAIDS[0].bosses.length, 9);

const workflow = fs.readFileSync(path.join(__dirname, '..', '.github', 'workflows', 'update-wcl-presets.yml'), 'utf8');
assert.match(workflow, /WCL_DATA_DIR=data-\$\(node -p/);
assert.ok(!workflow.includes('\\"require'), '工作流的 Node 表达式不能在 Bash 命令替换中转义双引号。');
assert.ok(!workflow.includes('data-4.4.x'), '工作流不能继续上传旧 WCL 数据目录。');

const guardian = getSpecConfig('druid', 104);
assert.strictEqual(guardian.className, 'Druid');
assert.strictEqual(guardian.specName, 'Guardian');
assert.strictEqual(guardian.role, 'tank');
assert.strictEqual(guardian.metric, 'dps');

const mistweaver = getSpecConfig('monk', 270);
assert.strictEqual(mistweaver.className, 'Monk');
assert.strictEqual(mistweaver.specName, 'Mistweaver');
assert.strictEqual(mistweaver.role, 'healer');
assert.strictEqual(mistweaver.metric, 'hps');

const fire = getSpecConfig('mage', 63);
assert.strictEqual(fire.metric, 'dps');
assert.strictEqual(fire.talentChangeSetId, 13);

const specs = listSpecs();
assert.ok(specs.length >= 39);
assert.ok(specs.every((spec) => spec.classKey && spec.specId && spec.className && spec.specName));

const defaultSpec = buildDefaultSpecMap();
assert.strictEqual(defaultSpec.monk[270].metric, 'hps');
assert.strictEqual(defaultSpec.druid[104].metric, 'dps');

console.log('wcl preset config tests passed');
