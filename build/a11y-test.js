// Does the facade actually respond to KEYBOARD activation end to end?
// Attribute checks are not enough: two of the three facades wrap their play
// control in an inner <button>, so the container div carries no role/tabindex
// even though the control is reachable. This drives real Tab/Enter presses.
const { chromium } = require('playwright');
const BASE = process.env.BASE || 'https://lethometry.vercel.app';
const PAGES = ['/articles/dancing-plague-1518.html', '/articles/the-wow-signal.html',
               '/articles/agi-12-endings.html'];
let fails = 0;
const check = (n, ok, d) => { console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${n}${d ? '  -> ' + d : ''}`); if (!ok) fails++; };

(async () => {
  const browser = await chromium.launch();
  for (const p of PAGES) {
    console.log(`\n=== ${p} ===`);
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await ctx.newPage();
    await page.goto(BASE + p, { waitUntil: 'networkidle', timeout: 40000 });

    // Tab until focus lands inside the facade (max 60 presses)
    let focused = null;
    for (let i = 0; i < 60; i++) {
      await page.keyboard.press('Tab');
      focused = await page.evaluate(() => {
        const a = document.activeElement;
        return a ? { tag: a.tagName, cls: a.className,
                     inFacade: !!a.closest('.yt-facade'),
                     label: a.getAttribute('aria-label') } : null;
      });
      if (focused?.inFacade) break;
    }
    check('facade reachable by Tab', !!focused?.inFacade,
      focused ? `${focused.tag}.${focused.cls} "${focused.label || ''}"` : 'never focused');

    if (focused?.inFacade) {
      await page.keyboard.press('Enter');
      await page.waitForTimeout(2200);
      const src = await page.evaluate(() => document.querySelector('iframe')?.src || '');
      check('Enter activates the player', src.includes('youtube-nocookie.com'), src.slice(0, 70));
      check('player received focus', await page.evaluate(() =>
        document.activeElement?.tagName === 'IFRAME'));
    }
    await ctx.close();
  }
  await browser.close();
  console.log(fails ? `\n${fails} FAILURE(S)` : '\nALL KEYBOARD CHECKS PASSED');
  process.exit(fails ? 1 : 0);
})().catch((e) => { console.error('ERR', e); process.exit(2); });
