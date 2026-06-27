const fs = require('fs');
const path = require('path');

const BASE64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
const DEFAULT_SERIALIZATION_VERSION = 2;
const TREE_HASH_BYTES = 16;
const BLUEPRINT_DIR = path.join(__dirname, 'wcl-talent-blueprints');

function collectBlueprintFiles(dir = BLUEPRINT_DIR) {
  const files = {};
  if (!fs.existsSync(dir)) return files;
  fs.readdirSync(dir)
    .filter((file) => file.endsWith('.json'))
    .forEach((file) => {
      const fullPath = path.join(dir, file);
      try {
        const blueprint = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
        const classKey = blueprint.classKey;
        const specId = Number(blueprint.specId);
        const changeSetId = Number(blueprint.changeSetId || (blueprint.changeSet && blueprint.changeSet.id));
        if (classKey && specId && changeSetId) {
          const key = `${classKey}:${specId}:${changeSetId}`;
          const current = files[key];
          if (!current || file.indexOf('-full') !== -1) files[key] = fullPath;
        }
      } catch {
        // Ignore malformed scratch files; tests cover the expected registry entries.
      }
    });
  return files;
}

const BLUEPRINT_FILES = collectBlueprintFiles();

function addValue(entries, bitWidth, value) {
  const numericValue = Number(value) || 0;
  if (numericValue >= 2 ** bitWidth) {
    throw new Error(`value ${numericValue} does not fit in ${bitWidth} bits`);
  }
  entries.push({ bitWidth, value: numericValue });
}

function convertToBase64(entries) {
  let exportString = '';
  let currentValue = 0;
  let currentReservedBits = 0;

  entries.forEach((entry) => {
    let remainingValue = entry.value;
    let remainingRequiredBits = entry.bitWidth;
    while (remainingRequiredBits > 0) {
      const spaceInCurrentValue = 6 - currentReservedBits;
      const maxStorableValue = 1 << spaceInCurrentValue;
      const remainder = remainingValue % maxStorableValue;
      remainingValue = Math.floor(remainingValue / maxStorableValue);
      currentValue += remainder << currentReservedBits;

      if (spaceInCurrentValue > remainingRequiredBits) {
        currentReservedBits = (currentReservedBits + remainingRequiredBits) % 6;
        remainingRequiredBits = 0;
      } else {
        exportString += BASE64_CHARS[currentValue];
        currentValue = 0;
        currentReservedBits = 0;
        remainingRequiredBits -= spaceInCurrentValue;
      }
    }
  });

  if (currentReservedBits > 0) {
    exportString += BASE64_CHARS[currentValue];
  }

  return exportString;
}

function selectedNodesFromTalentTree(talentTree = []) {
  return talentTree
    .filter((talent) => talent && (Number(talent.id) || Number(talent.nodeID || talent.nodeId)))
    .map((talent) => {
      const rank = Number(talent.rank) || 1;
      return {
        id: Number(talent.id) || 0,
        abilityId: Number(talent.id) || 0,
        nodeId: Number(talent.nodeID || talent.nodeId) || 0,
        rank,
      };
    });
}

function normalizeSelectedNodes(selectedNodes = []) {
  const abilities = new Map();
  const nodes = new Map();
  selectedNodes.forEach((node) => {
    if (Array.isArray(node)) {
      const abilityId = Number(node[0]);
      if (abilityId) abilities.set(abilityId, Number(node[1]) || 1);
      return;
    }
    if (node && typeof node === 'object') {
      const abilityId = Number(node.id || node.abilityId);
      const nodeId = Number(node.nodeID || node.nodeId);
      const rank = Number(node.rank) || 1;
      if (abilityId) abilities.set(abilityId, rank);
      if (nodeId) {
        if (!nodes.has(nodeId)) nodes.set(nodeId, []);
        nodes.get(nodeId).push({ abilityId, nodeId, rank });
      }
    }
  });
  return { abilities, nodes };
}

function loadBlueprint(classKey, specId, changeSetId) {
  const key = `${classKey}:${specId}:${changeSetId}`;
  const file = BLUEPRINT_FILES[key];
  if (!file) {
    throw new Error(`missing talent blueprint for ${key}`);
  }
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function hasBlueprint(classKey, specId, changeSetId) {
  const key = `${classKey}:${Number(specId)}:${Number(changeSetId)}`;
  return !!BLUEPRINT_FILES[key];
}

function getNodeChoiceIndex(node, selectedAbilityId) {
  const index = (node.abilities || []).findIndex((ability) => Number(ability.id) === selectedAbilityId);
  return index >= 0 ? index : 0;
}

function getSelectedAbilities(node, selected) {
  const nodeRecords = selected.nodes.get(Number(node.nodeId)) || [];
  if (nodeRecords.length) {
    const selectedIds = new Set(nodeRecords.map((record) => Number(record.abilityId)).filter(Boolean));
    const matched = (node.abilities || []).filter((ability) => selectedIds.has(Number(ability.id)));
    if (matched.length) return matched;
    return (node.abilities || []).length === 1 ? [node.abilities[0]] : [];
  }
  return (node.abilities || []).filter((ability) => selected.abilities.has(Number(ability.id)));
}

function getPurchasedRanks(node, selectedAbilities, selected) {
  const nodeRecords = selected.nodes.get(Number(node.nodeId)) || [];
  if (nodeRecords.length) {
    return nodeRecords.reduce((total, record) => total + (Number(record.rank) || 1), 0);
  }
  return selectedAbilities.reduce((total, ability) => {
    return total + (selected.abilities.get(Number(ability.id)) || 1);
  }, 0);
}

function getNodeMaxRanks(node, selectedAbilities) {
  if (Number(node.maxRanks)) return Number(node.maxRanks);
  return selectedAbilities.reduce((max, ability) => {
    return Math.max(max, Number(ability.maxRanks) || 1);
  }, 1);
}

function isChoiceNode(node) {
  return node.type === 'choice' || node.type === 'subtree';
}

function isGrantedNode(node) {
  return node.row === 1 && node.type === 'single' && node.treeType !== 'spec';
}

function encodeTalentImportString(options) {
  const specId = Number(options.specId);
  const serializationVersion = Number(options.serializationVersion) || DEFAULT_SERIALIZATION_VERSION;
  const blueprint = options.blueprint || loadBlueprint(options.classKey, specId, options.changeSetId);
  const selected = normalizeSelectedNodes(
    options.selectedNodes || selectedNodesFromTalentTree(options.talentTree || [])
  );

  const entries = [];
  addValue(entries, 8, serializationVersion);
  addValue(entries, 16, specId);
  for (let i = 0; i < TREE_HASH_BYTES; i += 1) {
    addValue(entries, 8, 0);
  }

  const nodes = (blueprint.changeSet && blueprint.changeSet.allNodes ? blueprint.changeSet.allNodes : [])
    .slice()
    .sort((left, right) => Number(left.nodeId) - Number(right.nodeId));

  nodes.forEach((node) => {
    const selectedAbilities = getSelectedAbilities(node, selected);
    const selectedAbility = selectedAbilities[0];
    const isNodeSelected = selectedAbilities.length > 0;
    addValue(entries, 1, isNodeSelected ? 1 : 0);
    if (!isNodeSelected) return;

    const isPurchased = !isGrantedNode(node);
    addValue(entries, 1, isPurchased ? 1 : 0);
    if (!isPurchased) return;

    const ranksPurchased = getPurchasedRanks(node, selectedAbilities, selected);
    const maxRanks = getNodeMaxRanks(node, selectedAbilities);
    const isPartiallyRanked = ranksPurchased !== maxRanks;
    addValue(entries, 1, isPartiallyRanked ? 1 : 0);
    if (isPartiallyRanked) {
      addValue(entries, 6, ranksPurchased);
    }

    const nodeIsChoice = isChoiceNode(node);
    addValue(entries, 1, nodeIsChoice ? 1 : 0);
    if (nodeIsChoice) {
      if (!selectedAbility) {
        throw new Error(`ambiguous choice node ${node.nodeId}`);
      }
      addValue(entries, 2, getNodeChoiceIndex(node, Number(selectedAbility.id)));
    }
  });

  return convertToBase64(entries);
}

module.exports = {
  BASE64_CHARS,
  BLUEPRINT_FILES,
  collectBlueprintFiles,
  DEFAULT_SERIALIZATION_VERSION,
  convertToBase64,
  hasBlueprint,
  loadBlueprint,
  selectedNodesFromTalentTree,
  encodeTalentImportString,
  isGrantedNode,
};
