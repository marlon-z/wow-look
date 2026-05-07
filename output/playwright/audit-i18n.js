async page => {
  const base = 'http://localhost:8787/';
  const storageKey = 'wowlook_web_locale_v1';
  const locales = ['zh-CN', 'zh-TW', 'en-US', 'en-GB', 'de-DE', 'fr-FR', 'es-ES', 'es-MX', 'pt-BR', 'it-IT', 'ru-RU', 'ko-KR'];
  const expected = {
    'zh-CN': ['请好友配装', '当前显示该职业全部可用装备', '圣骑士', '神圣', '防护', '惩戒', '暴击', '急速', '按部位', '胸', '执政团之座'],
    'zh-TW': ['請好友配裝', '目前顯示該職業全部可用裝備', '聖騎士', '神聖', '防護', '懲戒', '致命', '加速', '依部位', '胸', '三傑議會之座'],
    'en-US': ['Ask a friend', 'Showing all available items for this class', 'Paladin', 'Holy', 'Protection', 'Retribution', 'Crit', 'Haste', 'By slot', 'Chest', 'Seat of the Triumvirate'],
    'en-GB': ['Ask a friend', 'Showing all available items for this class', 'Paladin', 'Holy', 'Protection', 'Retribution', 'Crit', 'Haste', 'By slot', 'Chest', 'Seat of the Triumvirate'],
    'de-DE': ['Freund fragen', 'Alle verfügbaren Gegenstände dieser Klasse werden angezeigt', 'Paladin', 'Heilig', 'Schutz', 'Vergeltung', 'Krit', 'Tempo', 'Nach Platz', 'Brust', 'Sitz des Triumvirats'],
    'fr-FR': ['Demander à un ami', 'Tous les objets disponibles pour cette classe sont affichés', 'Paladin', 'Sacré', 'Protection', 'Vindicte', 'Crit.', 'Hâte', 'Par emplacement', 'Torse', 'Siège du triumvirat'],
    'es-ES': ['Pedir a un amigo', 'Mostrando todos los objetos disponibles para esta clase', 'Paladín', 'Sagrado', 'Protección', 'Reprensión', 'Crítico', 'Celeridad', 'Por ranura', 'Pecho', 'Trono del Triunvirato'],
    'es-MX': ['Pedir a un amigo', 'Mostrando todos los objetos disponibles para esta clase', 'Paladín', 'Sagrado', 'Protección', 'Reprensión', 'Crítico', 'Celeridad', 'Por ranura', 'Pecho', 'Trono del Triunvirato'],
    'pt-BR': ['Pedir a um amigo', 'Mostrando todos os itens disponíveis para esta classe', 'Paladino', 'Sagrado', 'Proteção', 'Retribuição', 'Crítico', 'Aceleração', 'Por espaço', 'Peito', 'Sede do Triunvirato'],
    'it-IT': ['Chiedi a un amico', 'Mostra tutti gli oggetti disponibili per questa classe', 'Paladino', 'Sacro', 'Protezione', 'Castigo', 'Critico', 'Celerità', 'Per slot', 'Torso', 'Seggio del Triumvirato'],
    'ru-RU': ['Попросить друга', 'Показаны все доступные предметы этого класса', 'Паладин', 'Свет', 'Защита', 'Воздаяние', 'Крит', 'Скорость', 'По слоту', 'Грудь', 'Престол Триумвирата'],
    'ko-KR': ['친구에게 요청', '이 직업의 모든 사용 가능한 아이템 표시 중', '성기사', '신성', '보호', '징벌', '치명타', '가속', '부위별', '가슴', '삼두정의 권좌'],
  };
  const staleEnglish = {
    common: ['Language', 'Ask a friend', 'Showing all available items for this class', 'By slot', 'By source', 'Head', 'Neck', 'Shoulder', 'Cloak', 'Chest', 'Wrist', 'Hands', 'Waist', 'Legs', 'Feet', 'Ring', 'Trinket', 'Weapon', 'Seat of the Triumvirate', 'Skyreach', 'Mythsara Caverns', 'Windrunner\'s Tower', 'Pit of Saron', 'Magisters\' Terrace', 'Favorite'],
    specs: ['Holy', 'Protection', 'Retribution'],
    stats: ['Haste', 'Mastery', 'Versatility'],
  };
  const leakTerms = {
    'zh-CN': [...staleEnglish.common, ...staleEnglish.specs, ...staleEnglish.stats, 'Crit'],
    'zh-TW': [...staleEnglish.common, ...staleEnglish.specs, ...staleEnglish.stats, 'Crit'],
    'de-DE': [...staleEnglish.common.filter((term) => term !== 'Ring'), ...staleEnglish.specs, ...staleEnglish.stats],
    'fr-FR': [...staleEnglish.common, 'Holy', 'Retribution', ...staleEnglish.stats],
    'es-ES': [...staleEnglish.common, 'Holy', 'Retribution', ...staleEnglish.stats],
    'es-MX': [...staleEnglish.common, 'Holy', 'Retribution', ...staleEnglish.stats],
    'pt-BR': [...staleEnglish.common, ...staleEnglish.specs, ...staleEnglish.stats],
    'it-IT': [...staleEnglish.common, ...staleEnglish.specs, ...staleEnglish.stats],
    'ru-RU': [...staleEnglish.common, ...staleEnglish.specs, ...staleEnglish.stats, 'Crit'],
    'ko-KR': [...staleEnglish.common, ...staleEnglish.specs, ...staleEnglish.stats, 'Crit'],
  };

  const results = [];
  await page.goto(base, { waitUntil: 'domcontentloaded' });
  for (const locale of locales) {
    await page.evaluate(([key, value]) => localStorage.setItem(key, value), [storageKey, locale]);
    await page.goto(`${base}?audit=${Date.now()}#class=paladin`, { waitUntil: 'networkidle' });
    await page.waitForSelector('.filter-panel', { timeout: 15000 });
    await page.waitForFunction(() => !/Loading|加载中|載入中|Загрузка|불러오는 중|Chargement|Cargando|Carregando|Caricamento|Lädt/.test(document.body.innerText), null, { timeout: 15000 }).catch(() => {});
    await page.screenshot({ path: `output/playwright/i18n-${locale}.png`, fullPage: false });
    const data = await page.evaluate(() => {
      const nodes = [...document.querySelectorAll('.top-bar, .hero-panel, .filter-panel, .group-head')].map((node) => node.cloneNode(true));
      nodes.forEach((node) => node.querySelectorAll('.locale-select').forEach((item) => item.remove()));
      const text = nodes.map((node) => node.innerText).join('\n');
      const chips = [...document.querySelectorAll('.chip')].map((node) => node.innerText.trim()).filter(Boolean);
      return { text, chips };
    });
    const missing = expected[locale].filter((term) => !data.text.includes(term));
    const leaks = (leakTerms[locale] || []).filter((term) => {
      if (term.includes(' ')) return data.text.includes(term);
      return new RegExp(`(^|[^\\p{L}\\p{N}])${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^\\p{L}\\p{N}]|$)`, 'u').test(data.text);
    });
    const cjkLeak = !locale.startsWith('zh') && locale !== 'ko-KR' && /[\u3400-\u9fff]/.test(data.text);
    results.push({
      locale,
      ok: !missing.length && !leaks.length && !cjkLeak,
      missing,
      englishLeaks: leaks,
      cjkLeak,
      chips: data.chips.slice(0, 36),
    });
  }
  return results;
}
