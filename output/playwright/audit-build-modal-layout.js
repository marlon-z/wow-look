async page => {
  await page.setViewportSize({ width: 1230, height: 768 });
  await page.goto('http://localhost:8787/?audit=build-modal#class=hunter&requestBuild=1', { waitUntil: 'networkidle' });
  await page.evaluate(() => {
    localStorage.setItem('wowlook_web_locale_v1', 'zh-CN');
    localStorage.removeItem('wowlook_build_draft_v1');
  });
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForSelector('.item-card .favorite-star', { timeout: 15000 });
  await page.locator('.item-card .favorite-star').nth(0).click();
  await page.locator('.item-card .favorite-star').nth(1).click();
  await page.locator('[data-action="buildDraft"]').first().click();
  await page.waitForSelector('.build-item', { timeout: 15000 });
  await page.screenshot({ path: 'output/playwright/build-modal-layout.png', fullPage: false });
  return await page.evaluate(() => {
    return [...document.querySelectorAll('.build-item')].map((item) => {
      const remove = item.querySelector('.remove-dot').getBoundingClientRect();
      const slot = item.querySelector('.favorite-row span').getBoundingClientRect();
      return {
        slotText: item.querySelector('.favorite-row span').innerText,
        removeLeft: Math.round(remove.left),
        slotRight: Math.round(slot.right),
        gap: Math.round(remove.left - slot.right),
        overlaps: !(slot.right <= remove.left || slot.left >= remove.right || slot.bottom <= remove.top || slot.top >= remove.bottom),
      };
    });
  });
}
