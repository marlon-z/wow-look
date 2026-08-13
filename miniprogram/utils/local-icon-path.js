function normalizeLocalIconPath(iconAsset) {
  if (typeof iconAsset !== 'string') {
    return iconAsset;
  }
  return iconAsset.replace(/^\/assets\/icons\/([^/]+)\.webp$/i, '/assets/icons/$1.jpg');
}

module.exports = {
  normalizeLocalIconPath,
};
