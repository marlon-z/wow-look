#!/usr/bin/env node
// 聚合本地排行榜预设, 算出每专精「前列高分日志装备中占比最高的副属性」。
// 只读本地: cos-upload/wcl-presets(手动同步的副本) + web/data-4.4.x(装备属性)。全程 0 COS。
// 产物 web/data-4.4.x/wcl-stat-tendency.json 提交入库, SEO 生成器只读它。
const fs = require('fs');
const path = require('path');
const { listSpecs, DATA_VERSION } = require('./wcl-preset-config');

const PRESET_ROOT = path.resolve('cos-upload', 'wcl-presets', `data-${DATA_VERSION}`);
const DATA_ROOT = path.resolve('web', `data-${DATA_VERSION}`);
const OUT_FILE = path.join(DATA_ROOT, 'wcl-stat-tendency.json');
const SECONDARY = ['crit', 'haste', 'mastery', 'versatility'];

function readJsonSafe(file) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return null; }
}

// itemId -> [{type,value}] 副属性 (来自本地装备库)
function buildItemStatIndex(classKey) {
  const data = readJsonSafe(path.join(DATA_ROOT, `${classKey}.json`));
  const index = {};
  (data?.instances || []).forEach((inst) => (inst.encounters || []).forEach((enc) => (enc.items || []).forEach((item) => {
    const secondary = (item.stats?.secondary || []).map((stat) => ({
      type: stat.type === 'critical' ? 'crit' : stat.type,
      value: Number(stat.value) || 0,
    }));
    index[String(item.id)] = secondary;
  })));
  return index;
}

function slotSecondary(slot, itemIndex) {
  // 制造业绿字优先(预设自带), 否则用装备库解析 itemId
  if (Array.isArray(slot.craftedStats) && slot.craftedStats.length) {
    return slot.craftedStats.map((stat) => ({
      type: stat.type === 'critical' ? 'crit' : stat.type,
      value: Number(stat.value) || 0,
    }));
  }
  return itemIndex[String(slot.itemId)] || [];
}

// 选用于统计的预设集合: 优先最高层大秘境, 否则最高团本难度。返回 {contentType,fileKey,file}
function pickTopFile(rel, index) {
  const pick = (list, contentType) => {
    const entry = (list || [])[0];
    if (!entry?.fileKey) return null;
    const file = readJsonSafe(path.join(PRESET_ROOT, rel, `${entry.fileKey}.json`));
    return file ? { contentType, fileKey: entry.fileKey, file } : null;
  };
  return pick(index.mythicPlus, 'mythicPlus') || pick(index.raid, 'raid') || null;
}

function main() {
  const out = { generatedAt: new Date().toISOString(), dataVersion: DATA_VERSION, specs: {} };
  let done = 0;
  for (const spec of listSpecs()) {
    const rel = `${spec.classKey}/${spec.specId}`;
    const index = readJsonSafe(path.join(PRESET_ROOT, rel, 'index.json'));
    if (!index) { console.warn(`skip ${rel}: no local index`); continue; }
    const top = pickTopFile(rel, index);
    if (!top) { console.warn(`skip ${rel}: no local preset file`); continue; }

    const itemIndex = buildItemStatIndex(spec.classKey);
    const totals = { crit: 0, haste: 0, mastery: 0, versatility: 0 };
    let sampleCount = 0;
    (top.file.entries || []).forEach((entry) => (entry.presets || []).forEach((preset) => {
      sampleCount += 1;
      Object.values(preset.slots || {}).forEach((slot) => {
        if (!slot) return;
        slotSecondary(slot, itemIndex).forEach((stat) => {
          if (totals[stat.type] !== undefined) totals[stat.type] += stat.value;
        });
      });
    }));

    const grand = SECONDARY.reduce((sum, k) => sum + totals[k], 0);
    if (!grand || !sampleCount) { console.warn(`skip ${rel}: empty totals`); continue; }
    const order = [...SECONDARY].sort((a, b) => totals[b] - totals[a]);
    // 每套平均原始 rating(按价值累积, 非 DR 转化后的百分比)
    const avg = {};
    SECONDARY.forEach((k) => { avg[k] = Math.round(totals[k] / sampleCount); });

    out.specs[String(spec.specId)] = {
      classKey: spec.classKey,
      contentType: top.contentType,
      fileKey: top.fileKey,
      sampleCount,
      order,
      avg,
    };
    done += 1;
    console.log(`${rel}: n=${sampleCount} | ${order.map((k) => `${k} ≈${avg[k]}`).join(' > ')}`);
  }
  fs.writeFileSync(OUT_FILE, `${JSON.stringify(out, null, 2)}\n`);
  console.log(`\nWrote ${OUT_FILE} (${done} specs)`);
}

if (require.main === module) main();

module.exports = { buildItemStatIndex, slotSecondary, pickTopFile };
