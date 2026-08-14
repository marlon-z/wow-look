const ANNOUNCEMENT_STORAGE_KEY = 'wowlook_announcement_read_version';

const CURRENT_ANNOUNCEMENT = {
  version: '4.3.0',
  date: '2026-05-01',
  title: '分享功能上线',
  summary: '本次更新重磅推出收藏夹分享功能，一键发给好友，呼叫大佬在线配装！',
  items: [
    '新增收藏夹微信分享，支持将你的装备收藏列表一键发送给微信好友或微信群。',
    '支持一键导入装备：好友点击分享卡片即可无缝导入你的收藏列表，让大佬帮忙查漏补缺、指导配装变得更简单。',
    '视觉 UI 优化：重新设计了收藏夹操作面板的排版与样式，界面风格更加统一、精致。',
  ],
};

function getAnnouncement() {
  return CURRENT_ANNOUNCEMENT;
}

function isAnnouncementUnread() {
  try {
    return wx.getStorageSync(ANNOUNCEMENT_STORAGE_KEY) !== CURRENT_ANNOUNCEMENT.version;
  } catch (err) {
    return true;
  }
}

function markAnnouncementRead() {
  try {
    wx.setStorageSync(ANNOUNCEMENT_STORAGE_KEY, CURRENT_ANNOUNCEMENT.version);
  } catch (err) {
    console.error('mark announcement read failed', err);
  }
}

module.exports = {
  ANNOUNCEMENT_STORAGE_KEY,
  getAnnouncement,
  isAnnouncementUnread,
  markAnnouncementRead,
};
