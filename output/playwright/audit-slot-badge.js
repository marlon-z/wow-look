async page => {
  await page.setViewportSize({ width: 1230, height: 768 });
  await page.goto('http://localhost:8787/?audit=slot-badge#class=hunter&requestBuild=1', { waitUntil: 'networkidle' });
  await page.evaluate(() => {
    localStorage.setItem('wowlook_web_locale_v1', 'zh-CN');
    localStorage.removeItem('wowlook_favorites_v1');
    localStorage.removeItem('wowlook_build_draft_v1');
  });
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForSelector('.item-card .favorite-star', { timeout: 15000 });
  await page.locator('.item-card .favorite-star').first().click();
  await page.locator('[data-action="buildDraft"]').first().click();
  await page.waitForSelector('.favorite-slot-badge', { timeout: 15000 });
  await page.screenshot({ path: 'output/playwright/slot-badge-build.png', fullPage: false });
  const buildInfo = await page.evaluate(() => {
    const badge = document.querySelector('.build-item .favorite-slot-badge').getBoundingClientRect();
    const remove = document.querySelector('.build-item .remove-dot').getBoundingClientRect();
    const style = getComputedStyle(document.querySelector('.build-item .favorite-slot-badge'));
    return {
      text: document.querySelector('.build-item .favorite-slot-badge').innerText,
      borderColor: style.borderColor,
      color: style.color,
      gap: Math.round(remove.left - badge.right),
      overlaps: !(badge.right <= remove.left || badge.left >= remove.right || badge.bottom <= remove.top || badge.top >= remove.bottom),
    };
  });

  await page.locator('[data-action="closeOverlay"]').first().click();
  await page.locator('.item-card .favorite-star').first().click();
  await page.locator('[data-action="favorites"]').first().click();
  await page.waitForSelector('.favorite-slot-badge', { timeout: 15000 });
  await page.screenshot({ path: 'output/playwright/slot-badge-favorites.png', fullPage: false });
  const favoriteInfo = await page.evaluate(() => {
    const badge = document.querySelector('.favorite-item .favorite-slot-badge');
    const style = getComputedStyle(badge);
    return {
      text: badge.innerText,
      borderColor: style.borderColor,
      color: style.color,
    };
  });

  return { buildInfo, favoriteInfo };
}
