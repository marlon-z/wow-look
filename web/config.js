export const REMOTE_COS_BASE = 'https://wowlook-1308073800.cos.ap-guangzhou.myqcloud.com';

const params = new URLSearchParams(window.location.search);
const useRemoteCos = params.get('remote') === '1';

function localBaseFromPath(pathname) {
  const normalized = pathname.replace(/\/index\.html$/i, '/');
  const segments = normalized.split('/').filter(Boolean);
  if (!segments.length) return '.';
  return Array.from({ length: segments.length }, () => '..').join('/');
}

const LOCAL_BASE = localBaseFromPath(location.pathname);

export const DATA_VERSION = '4.2.x';
export const DATA_DIR_NAME = `data-${DATA_VERSION}`;
export const DATA_BASE = useRemoteCos ? `${REMOTE_COS_BASE}/${DATA_DIR_NAME}` : `${LOCAL_BASE}/${DATA_DIR_NAME}`;
export const LOCALE_DATA_BASE = `${LOCAL_BASE}/locales`;
export const ASSET_BASE = useRemoteCos ? REMOTE_COS_BASE : LOCAL_BASE;

export const STORAGE_KEYS = {
  locale: 'wowlook_web_locale_v1',
  favorites: 'wowlook_favorites_v1',
  buildDraft: 'wowlook_build_draft_v1',
};
