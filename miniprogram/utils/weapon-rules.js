var TWO_HAND = 'two_hand';
var ONE_HAND = 'one_hand';
var MAIN_HAND = 'main_hand';
var OFF_HAND = 'off_hand';
var SHIELD = 'shield';
var HOLDABLE = 'holdable';

// Each entry is a complete, legal main-hand/off-hand layout. null means that
// the main-hand item occupies both weapon slots.
var SPEC_WEAPON_LAYOUTS = {
  71: [[TWO_HAND, null]],
  72: [[TWO_HAND, TWO_HAND]],
  73: [[ONE_HAND, SHIELD]],
  65: [[ONE_HAND, SHIELD]],
  66: [[ONE_HAND, SHIELD]],
  70: [[TWO_HAND, null]],
  253: [[TWO_HAND, null]],
  254: [[TWO_HAND, null]],
  255: [[TWO_HAND, null], [ONE_HAND, ONE_HAND]],
  259: [[ONE_HAND, ONE_HAND]],
  260: [[ONE_HAND, ONE_HAND]],
  261: [[ONE_HAND, ONE_HAND]],
  256: [[TWO_HAND, null], [ONE_HAND, HOLDABLE]],
  257: [[TWO_HAND, null], [ONE_HAND, HOLDABLE]],
  258: [[TWO_HAND, null], [ONE_HAND, HOLDABLE]],
  250: [[TWO_HAND, null]],
  251: [[TWO_HAND, null], [ONE_HAND, ONE_HAND]],
  252: [[TWO_HAND, null]],
  262: [[TWO_HAND, null], [ONE_HAND, SHIELD]],
  263: [[ONE_HAND, ONE_HAND]],
  264: [[TWO_HAND, null], [ONE_HAND, SHIELD]],
  62: [[TWO_HAND, null], [ONE_HAND, HOLDABLE]],
  63: [[TWO_HAND, null], [ONE_HAND, HOLDABLE]],
  64: [[TWO_HAND, null], [ONE_HAND, HOLDABLE]],
  265: [[TWO_HAND, null], [ONE_HAND, HOLDABLE]],
  266: [[TWO_HAND, null], [ONE_HAND, HOLDABLE]],
  267: [[TWO_HAND, null], [ONE_HAND, HOLDABLE]],
  268: [[TWO_HAND, null], [ONE_HAND, ONE_HAND]],
  269: [[TWO_HAND, null], [ONE_HAND, ONE_HAND]],
  270: [[TWO_HAND, null], [ONE_HAND, HOLDABLE]],
  102: [[TWO_HAND, null], [ONE_HAND, HOLDABLE]],
  103: [[TWO_HAND, null]],
  104: [[TWO_HAND, null]],
  105: [[TWO_HAND, null], [ONE_HAND, HOLDABLE]],
  577: [[ONE_HAND, ONE_HAND]],
  581: [[ONE_HAND, ONE_HAND]],
  1480: [[ONE_HAND, ONE_HAND]],
  1467: [[TWO_HAND, null], [ONE_HAND, HOLDABLE]],
  1468: [[TWO_HAND, null], [ONE_HAND, HOLDABLE]],
  1473: [[TWO_HAND, null], [ONE_HAND, HOLDABLE]],
};

function getEquipLoc(item) {
  return (item && (item.equipLoc
    || (item.maxVersion && item.maxVersion.equipLoc)
    || (item.dropVersion && item.dropVersion.equipLoc))) || '';
}

function getWeaponKind(item) {
  var equipLoc = getEquipLoc(item);
  if (equipLoc === 'INVTYPE_2HWEAPON' || equipLoc === 'INVTYPE_RANGED' || equipLoc === 'INVTYPE_RANGEDRIGHT') return TWO_HAND;
  if (equipLoc === 'INVTYPE_SHIELD') return SHIELD;
  if (equipLoc === 'INVTYPE_HOLDABLE') return HOLDABLE;
  if (equipLoc === 'INVTYPE_WEAPONMAINHAND') return MAIN_HAND;
  if (equipLoc === 'INVTYPE_WEAPONOFFHAND') return OFF_HAND;
  if (equipLoc === 'INVTYPE_WEAPON') return ONE_HAND;

  var subtype = (item && item.itemSubType) || '';
  if (/双手|法杖|长柄武器|弓|弩|枪械/.test(subtype)) return TWO_HAND;
  if (subtype === '盾牌') return SHIELD;
  if (subtype === '其它') return HOLDABLE;
  return ONE_HAND;
}

function getLayouts(specId) {
  return SPEC_WEAPON_LAYOUTS[Number(specId)] || [];
}

function kindMatches(actual, expected, slotIndex) {
  if (actual === MAIN_HAND) return slotIndex === 0 && expected === ONE_HAND;
  if (actual === OFF_HAND) return slotIndex === 1 && expected === ONE_HAND;
  return actual === expected;
}

function canItemUseSlot(specId, slotKey, item) {
  var kind = getWeaponKind(item);
  var index = slotKey === 'weapon2' ? 1 : 0;
  return getLayouts(specId).some(function (layout) {
    return layout[index] !== null && kindMatches(kind, layout[index], index);
  });
}

function itemSupportsSpec(item, specId) {
  return !item || !Array.isArray(item.specs) || !item.specs.length || item.specs.indexOf(Number(specId)) !== -1;
}

function isCompleteLayoutValid(specId, mainHand, offHand) {
  if (!mainHand && !offHand) return true;
  var mainKind = mainHand ? getWeaponKind(mainHand) : null;
  var offKind = offHand ? getWeaponKind(offHand) : null;
  return getLayouts(specId).some(function (layout) {
    if (mainKind && !kindMatches(mainKind, layout[0], 0)) return false;
    if (offKind && (layout[1] === null || !kindMatches(offKind, layout[1], 1))) return false;
    return true;
  });
}

function mainHandOccupiesBoth(specId, item) {
  if (!item || getWeaponKind(item) !== TWO_HAND) return false;
  return getLayouts(specId).some(function (layout) {
    return layout[0] === TWO_HAND && layout[1] === null;
  }) && !getLayouts(specId).some(function (layout) {
    return layout[0] === TWO_HAND && layout[1] === TWO_HAND;
  });
}

function applyWeaponSelection(slots, specId, slotKey, item) {
  if (!canItemUseSlot(specId, slotKey, item) || !itemSupportsSpec(item, specId)) {
    return { ok: false, message: slotKey === 'weapon2' ? '该装备不能放入副手' : '该装备不能放入主手' };
  }
  var next = Object.assign({}, slots);
  next[slotKey] = item;
  var clearedOffHand = false;

  if (slotKey === 'weapon' && !isCompleteLayoutValid(specId, next.weapon, next.weapon2)) {
    next.weapon2 = null;
    clearedOffHand = true;
  }
  if (!isCompleteLayoutValid(specId, next.weapon, next.weapon2)) {
    return { ok: false, message: '这件装备与当前主手组合不兼容' };
  }
  return { ok: true, slots: next, clearedOffHand: clearedOffHand };
}

function sanitizeWeaponSlots(slots, specId) {
  var next = Object.assign({}, slots);
  var changed = false;
  if (next.weapon && (!itemSupportsSpec(next.weapon, specId) || !canItemUseSlot(specId, 'weapon', next.weapon))) {
    next.weapon = null;
    changed = true;
  }
  if (next.weapon2 && (!itemSupportsSpec(next.weapon2, specId) || !canItemUseSlot(specId, 'weapon2', next.weapon2))) {
    next.weapon2 = null;
    changed = true;
  }
  if (!isCompleteLayoutValid(specId, next.weapon, next.weapon2)) {
    next.weapon2 = null;
    changed = true;
  }
  return { slots: next, changed: changed };
}

module.exports = {
  SPEC_WEAPON_LAYOUTS: SPEC_WEAPON_LAYOUTS,
  getEquipLoc: getEquipLoc,
  getWeaponKind: getWeaponKind,
  getLayouts: getLayouts,
  canItemUseSlot: canItemUseSlot,
  isCompleteLayoutValid: isCompleteLayoutValid,
  mainHandOccupiesBoth: mainHandOccupiesBoth,
  applyWeaponSelection: applyWeaponSelection,
  sanitizeWeaponSlots: sanitizeWeaponSlots,
};
