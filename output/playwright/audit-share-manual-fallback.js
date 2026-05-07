async page => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'share', {
      configurable: true,
      value: undefined,
    });
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: async () => {
          throw new Error('blocked clipboard');
        },
      },
    });
    document.execCommand = () => false;
  });

  await page.goto('http://localhost:8787/?audit=manual-share#class=paladin', { waitUntil: 'networkidle' });
  await page.evaluate(() => {
    localStorage.setItem('wowlook_web_locale_v1', 'zh-CN');
    localStorage.removeItem('wowlook_build_draft_v1');
  });
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForSelector('.filter-panel');
  await page.locator('[data-action="shareRequest"]').click();
  await page.waitForSelector('.manual-share-body textarea', { timeout: 15000 });
  const text = await page.locator('.overlay-panel').innerText();
  const url = await page.locator('.manual-share-body textarea').inputValue();
  return {
    openedManualPanel: text.includes('分享链接') && text.includes('复制这个链接发给好友'),
    hasRequestUrl: url.includes('classKey=paladin') && url.includes('requestBuild=1'),
  };
}
