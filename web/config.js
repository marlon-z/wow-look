export const REMOTE_COS_BASE = 'https://wowlook-1308073800.cos.ap-guangzhou.myqcloud.com';

const params = new URLSearchParams(window.location.search);
const useRemoteCos = params.get('remote') === '1';

// 本站部署在域名根目录, 本地资源/数据用"从根开始的绝对路径"(/assets、/data-4.4.x)。
// 不能用按当前路径算的相对路径: 切换语言时 SPA 会用 replaceState 改 URL 深度,
// 相对路径会按新深度错位解析导致图片/数据 404(需刷新才恢复)。绝对根路径不受影响。
const LOCAL_BASE = '';

export const DATA_VERSION = '4.4.x';
export const DATA_DIR_NAME = `data-${DATA_VERSION}`;
// 数据内部版本 4.4.x 对应的游戏补丁号(玩家可识别)
export const GAME_VERSION = '12.0.7';
export const DATA_BASE = useRemoteCos ? `${REMOTE_COS_BASE}/${DATA_DIR_NAME}` : `${LOCAL_BASE}/${DATA_DIR_NAME}`;
export const LOCALE_DATA_BASE = `${LOCAL_BASE}/locales`;
export const ASSET_BASE = useRemoteCos ? REMOTE_COS_BASE : LOCAL_BASE;

export const STORAGE_KEYS = {
  locale: 'wowlook_web_locale_v1',
  favorites: 'wowlook_favorites_v1',
  buildDraft: 'wowlook_build_draft_v1',
  builds: 'wowlook_builds_v1',
};
