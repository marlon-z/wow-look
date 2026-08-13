const assert = require('assert');

const favoritesPath = require.resolve('../miniprogram/utils/favorites');
const draftPath = require.resolve('../miniprogram/utils/build-draft');
const buildsPath = require.resolve('../miniprogram/utils/builds');
const helperPath = require.resolve('../miniprogram/utils/local-icon-path');

function loadModules(storage) {
  [favoritesPath, draftPath, buildsPath, helperPath].forEach((modulePath) => {
    delete require.cache[modulePath];
  });
  const writes = [];
  global.wx = {
    getStorageSync(key) {
      return storage[key];
    },
    setStorageSync(key, value) {
      writes.push({ key, value });
      storage[key] = value;
    },
  };
  return {
    writes,
    helper: require('../miniprogram/utils/local-icon-path'),
    favorites: require('../miniprogram/utils/favorites'),
    draft: require('../miniprogram/utils/build-draft'),
    builds: require('../miniprogram/utils/builds'),
  };
}

function webpSnapshot(extra = {}) {
  return {
    key: 'warrior:123',
    itemId: 123,
    classKey: 'warrior',
    iconAsset: '/assets/icons/sword.webp',
    ...extra,
  };
}

{
  const storage = {};
  const { helper } = loadModules(storage);
  assert.strictEqual(helper.normalizeLocalIconPath('/assets/icons/sword.webp'), '/assets/icons/sword.jpg');
  assert.strictEqual(helper.normalizeLocalIconPath('https://example.com/sword.webp'), 'https://example.com/sword.webp');
  assert.strictEqual(helper.normalizeLocalIconPath('/assets/classes/icon.webp'), '/assets/classes/icon.webp');
  assert.strictEqual(helper.normalizeLocalIconPath('/assets/icons/nested/sword.webp'), '/assets/icons/nested/sword.webp');
}

{
  const storage = { wowlook_favorites_v1: [webpSnapshot(), webpSnapshot({ key: 'warrior:124', itemId: 124, iconAsset: 'https://example.com/sword.webp' })] };
  const { favorites, writes } = loadModules(storage);
  assert.strictEqual(favorites.getFavorites()[0].iconAsset, '/assets/icons/sword.jpg');
  assert.strictEqual(favorites.getFavorites()[1].iconAsset, 'https://example.com/sword.webp');
  assert.strictEqual(writes.length, 1, '收藏读取迁移后应只写回一次。');
  assert.strictEqual(storage.wowlook_favorites_v1[0].iconAsset, '/assets/icons/sword.jpg');
}

{
  const storage = { wowlook_build_draft_v1: { classKey: 'warrior', className: '战士', items: [webpSnapshot()], updatedAt: 1 } };
  const { draft, writes } = loadModules(storage);
  assert.strictEqual(draft.getBuildDraft().items[0].iconAsset, '/assets/icons/sword.jpg');
  assert.strictEqual(draft.getBuildDraft().items[0].iconAsset, '/assets/icons/sword.jpg');
  assert.strictEqual(writes.length, 1, '草稿读取迁移后应只写回一次。');
  assert.strictEqual(storage.wowlook_build_draft_v1.items[0].iconAsset, '/assets/icons/sword.jpg');
}

{
  const storage = { wowlook_builds_v1: [{ id: 'build-1', classKey: 'warrior', specId: 71, slots: { head: webpSnapshot(), wrist: webpSnapshot({ iconAsset: 'https://example.com/sword.webp' }) } }] };
  const { builds, writes } = loadModules(storage);
  assert.strictEqual(builds.getBuilds()[0].slots.head.iconAsset, '/assets/icons/sword.jpg');
  assert.strictEqual(builds.getBuilds()[0].slots.wrist.iconAsset, 'https://example.com/sword.webp');
  assert.strictEqual(writes.length, 1, '已保存配装读取迁移后应只写回一次。');
  assert.strictEqual(storage.wowlook_builds_v1[0].slots.head.iconAsset, '/assets/icons/sword.jpg');
}

delete global.wx;
console.log('local icon path migration tests passed');
