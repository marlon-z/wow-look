async page => {
  await page.addInitScript(() => {
    window.__shareUrls = [];
    Object.defineProperty(navigator, 'share', {
      configurable: true,
      value: undefined,
    });
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: async (value) => {
          window.__shareUrls.push(String(value));
        },
      },
    });
  });

  const waitReady = async () => {
    await page.waitForSelector('.filter-panel', { timeout: 15000 });
    await page.waitForSelector('.item-card', { timeout: 15000 });
  };

  await page.goto('http://localhost:8787/?audit=share#class=paladin', { waitUntil: 'networkidle' });
  await page.evaluate(() => {
    localStorage.setItem('wowlook_web_locale_v1', 'zh-CN');
    localStorage.removeItem('wowlook_favorites_v1');
    localStorage.removeItem('wowlook_build_draft_v1');
  });
  await page.reload({ waitUntil: 'networkidle' });
  await waitReady();

  await page.locator('[data-action="shareRequest"]').click();
  await page.waitForFunction(() => window.__shareUrls.length >= 1);
  const requestUrl = await page.evaluate(() => window.__shareUrls.at(-1));

  await page.goto(requestUrl, { waitUntil: 'networkidle' });
  await waitReady();
  const requestModeText = await page.locator('.build-request-card, .build-draft-strip, .hero-share-btn').evaluateAll((nodes) => nodes.map((node) => node.innerText).join('\n'));
  await page.locator('.item-card .favorite-star').first().click();
  await page.waitForFunction(() => document.body.innerText.includes('已加入'));
  await page.locator('[data-action="shareBuild"]').first().click();
  await page.waitForFunction(() => window.__shareUrls.length >= 1);
  const buildUrl = await page.evaluate(() => window.__shareUrls.at(-1));

  await page.goto(buildUrl, { waitUntil: 'networkidle' });
  await page.waitForSelector('.overlay-panel', { timeout: 15000 });
  const sharedText = await page.locator('.overlay-panel').innerText();

  await page.goto('http://localhost:8787/?audit=favorite#class=paladin', { waitUntil: 'networkidle' });
  await waitReady();
  await page.locator('.item-card .favorite-star').first().click();
  await page.locator('[data-action="favorites"]').first().click();
  await page.waitForSelector('[data-action="shareFavorites"]', { timeout: 15000 });
  await page.locator('[data-action="shareFavorites"]').click();
  await page.waitForFunction(() => window.__shareUrls.length >= 1);
  const favoriteUrl = await page.evaluate(() => window.__shareUrls.at(-1));

  return {
    requestUrl,
    requestHasClass: requestUrl.includes('classKey=paladin') && requestUrl.includes('requestBuild=1'),
    requestHasNoSharePayload: !requestUrl.includes('shareFav='),
    requestModeText,
    buildUrl,
    buildHasPayload: buildUrl.includes('shareFav=paladin%3A') || buildUrl.includes('shareFav=paladin:'),
    buildHasNoRequestFlag: !buildUrl.includes('requestBuild=1'),
    sharedRestored: sharedText.includes('好友分享') && sharedText.includes('保存到我的收藏夹'),
    favoriteUrl,
    favoriteHasPayload: favoriteUrl.includes('shareFav=paladin%3A') || favoriteUrl.includes('shareFav=paladin:'),
  };
}
