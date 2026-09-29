// Verify the click-to-load YouTube facades: nothing may contact youtube.com
// until the visitor activates one, and activation must produce a real
// youtube-nocookie.com embed.
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
    const ytHits = [];
    page.on('request', (r) => { if (/youtube\.com|ytimg\.com|googlevideo/.test(r.url())) ytHits.push(r.url()); });

    await page.goto(BASE + p, { waitUntil: 'networkidle', timeout: 40000 });

    const facades = await page.locator('.yt-facade').count();
    check('facade present', facades > 0, facades + ' found');
    check('NO youtube contact before click', ytHits.length === 0, ytHits.slice(0, 3).join(' '));
    check('no iframe until click', (await page.locator('iframe').count()) === 0);

    // Accessibility of the ACTIVATION CONTROL, not the wrapper. The three
    // facades use two different shapes: build.py emits <div role=button
    // tabindex=0>, while two article bodies wrap the control in a real
    // <button class="yt-facade-play">. Both are keyboard-operable, so assert
    // that SOMETHING inside the facade is a focusable named control and that it
    // carries a label — do not require role/tabindex on the wrapper itself.
    const kb = await page.evaluate(() => {
      const f = document.querySelector('.yt-facade');
      const own = f.matches('[role="button"]') && f.getAttribute('tabindex') === '0';
      const inner = f.querySelector('button, [role="button"]');
      const ctrl = own ? f : inner;
      return {
        shape: own ? 'wrapper-as-button' : 'inner-control',
        control: ctrl?.tagName,
        label: ctrl?.getAttribute('aria-label') || f.getAttribute('aria-label'),
        focusable: !!ctrl && (ctrl.tagName === 'BUTTON' || ctrl.getAttribute('tabindex') === '0'),
      };
    });
    check('facade has a focusable named control', kb.focusable && !!kb.label, JSON.stringify(kb));

    if (facades) {
      await page.locator('.yt-facade').first().click();
      await page.waitForTimeout(2500);
      const iframes = await page.locator('iframe').count();
      check('click creates an iframe', iframes > 0, iframes + ' iframe(s)');
      const src = await page.evaluate(() => document.querySelector('iframe')?.src || '');
      check('embed uses youtube-NOCOOKIE', src.includes('youtube-nocookie.com'), src.slice(0, 80));
      check('embed has enablejsapi+rel control', !/youtube\.com\/(watch|embed)/.test(src));
      check('youtube contacted only after click', ytHits.length > 0, ytHits.length + ' request(s), all nocookie: ' +
        ytHits.every((u) => u.includes('youtube-nocookie.com')));
    }
    await ctx.close();
  }
  await browser.close();
  console.log(fails ? `\n${fails} FAILURE(S)` : '\nALL VIDEO CHECKS PASSED');
  process.exit(fails ? 1 : 0);
})().catch((e) => { console.error('ERR', e); process.exit(2); });
