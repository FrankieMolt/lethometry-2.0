// Deterministic test for the article reading-progress and back-to-top features.
//
// The browser-use harness reports prefers-reduced-motion: reduce and has a short
// viewport, which made the progress bar impossible to trust there (a scrolled page
// read 0% and manual re-runs of the script appeared to "fix" it). This drives a
// real Chromium at a normal size, in both motion modes, and asserts the bar
// actually tracks scroll position.
const { chromium } = require('playwright');

const BASE = process.env.BASE || 'http://127.0.0.1:8899';
const ARTICLE = `${BASE}/articles/baghdad-battery.html`;

let failures = 0;
function check(name, pass, detail) {
  console.log(`  ${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? '  -> ' + detail : ''}`);
  if (!pass) failures++;
}

(async () => {
  const browser = await chromium.launch();

  for (const motion of ['no-preference', 'reduce']) {
    console.log(`\n=== prefers-reduced-motion: ${motion} ===`);
    const ctx = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      reducedMotion: motion,
    });
    const page = await ctx.newPage();

    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });

    await page.goto(ARTICLE, { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);

    check('no page errors', errors.length === 0, errors.join(' | '));

    const bar = () => page.evaluate(() => document.getElementById('rp').style.width);
    const bttShown = () => page.evaluate(() =>
      document.querySelector('.btt')?.classList.contains('show'));
    const bttVisible = () => page.evaluate(() => {
      const b = document.querySelector('.btt');
      if (!b) return false;
      const s = getComputedStyle(b);
      return s.visibility === 'visible' && parseFloat(s.opacity) > 0;
    });

    check('progress bar exists', await page.evaluate(() => !!document.getElementById('rp')));
    check('back-to-top exists', await page.evaluate(() => !!document.querySelector('.btt')));
    check('TOC built', (await page.evaluate(() => document.querySelectorAll('.toc a').length)) > 0);

    check('bar starts near 0', parseFloat(await bar()) < 5, await bar());
    check('BTT hidden at top', !(await bttVisible()));

    // Scroll to the very bottom of the article
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await page.waitForTimeout(600);
    const bottomBar = parseFloat(await bar());
    check('bar reaches ~100% at bottom', bottomBar > 95, bottomBar + '%');
    check('BTT shown at bottom', await bttShown());
    check('BTT actually visible', await bttVisible());

    // Mid-scroll should land roughly halfway
    await page.evaluate(() => window.scrollTo(0, 2000));
    await page.waitForTimeout(500);
    const midBar = parseFloat(await bar());
    check('bar moves with scroll (mid > 0, mid < 100)', midBar > 0 && midBar < 100, midBar + '%');

    // Real click, not synthetic scroll
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await page.waitForTimeout(400);
    await page.click('.btt');
    await page.waitForTimeout(900);
    const y = await page.evaluate(() => Math.round(window.scrollY));
    check('BTT click returns to top', y < 60, y + 'px');

    // TOC click should move and set a hash
    await page.click('.toc a:nth-child(1) , .toc li:nth-child(2) a');
    await page.waitForTimeout(900);
    check('TOC link sets a hash', (await page.evaluate(() => location.hash.length)) > 1,
      await page.evaluate(() => location.hash));

    await ctx.close();
  }

  // Home page + archive, motion on
  console.log('\n=== home + archive (no-preference) ===');
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', (e) => errs.push(e.message));

  await page.goto(BASE + '/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);
  check('home: no errors', errs.length === 0, errs.join(' | '));
  check('home: 11 category cards', (await page.locator('.cc').count()) === 11);
  check('home: reveals fire on scroll', await page.evaluate(async () => {
    window.scrollTo(0, 1500);
    await new Promise(r => setTimeout(r, 500));
    return document.querySelectorAll('.fu.v').length > 0;
  }));

  await page.goto(BASE + '/articles.html?cat=SIMULATION%20THEORY', { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  const vis = () => page.evaluate(() =>
    [...document.querySelectorAll('#archive .ac')].filter(c => c.style.display !== 'none').length);
  check('archive: ?cat= filters', (await vis()) === 6, await vis() + ' visible');
  await page.fill('#search-input', 'mandela');
  await page.waitForTimeout(400);
  check('archive: search takes over', (await vis()) > 0, await vis() + ' visible');
  check('archive: live region announces', (await page.evaluate(() =>
    document.getElementById('search-status').textContent)).includes('results'));

  await browser.close();
  console.log(failures ? `\n${failures} FAILURE(S)` : '\nALL CHECKS PASSED');
  process.exit(failures ? 1 : 0);
})().catch((e) => { console.error('HARNESS ERROR:', e); process.exit(2); });
