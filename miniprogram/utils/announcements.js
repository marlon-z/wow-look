const ANNOUNCEMENT_STORAGE_KEY = 'wowlook_announcement_read_version';

const CURRENT_ANNOUNCEMENT = {
  version: '4.2.0',
  date: '2026-04-30',
  title: '版本更新',
  summary: '本次更新主要优化装备筛选、收藏夹和套装数据。',
  items: [
    '装备筛选新增副属性排除。',
    '新增收藏夹功能。',
    '全职业套装数据由 5 件补齐至 9 件。',
    '特别感谢网友们提出的建议。',
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
