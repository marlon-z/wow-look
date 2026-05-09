async page => {
  await page.addInitScript(() => {
    window.__shareCalled = false;
    window.__copied = [];
    Object.defineProperty(navigator, 'share', {
      configurable: true,
      value: async () => {
        window.__shareCalled = true;
        throw new Error('native share should not be called on desktop');
      },
    });
    Object.defineProperty(navigator, 'canShare', {
      configurable: true,
      value: () => true,
    });
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: async (value) => {
          window.__copied.push(String(value));
        },
      },
    });
  });

  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('http://localhost:8787/?audit=desktop-share#class=paladin', { waitUntil: 'networkidle' });
  await page.evaluate(() => localStorage.setItem('wowlook_web_locale_v1', 'zh-CN'));
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForSelector('[data-action="shareRequest"]', { timeout: 15000 });
  await page.locator('[data-action="shareRequest"]').click();
  await page.waitForFunction(() => window.__copied.length > 0);
  return {
    nativeShareCalled: await page.evaluate(() => window.__shareCalled),
    copiedUrl: await page.evaluate(() => window.__copied.at(-1)),
  };
}
