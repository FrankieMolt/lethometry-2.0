// Capture review screenshots of the v4 build for visual analysis.
const { chromium } = require('playwright');
const BASE = process.env.BASE || 'https://lethometry.vercel.app';
const OUT = process.env.OUT || 'C:/Users/Tyson/.hermes/cache/scratch';

(async () => {
  const browser = await chromium.launch();
  const shots = [
    { name: 'v4-home-top',   url: '/',                              w: 1440, h: 900,  scroll: 0 },
    { name: 'v4-home-mid',   url: '/',                              w: 1440, h: 900,  scroll: 1800 },
    { name: 'v4-archive',    url: '/articles.html',                 w: 1440, h: 900,  scroll: 0 },
    { name: 'v4-article-top',url: '/articles/baghdad-battery.html', w: 1440, h: 900,  scroll: 0 },
    { name: 'v4-article-mid',url: '/articles/baghdad-battery.html', w: 1440, h: 900,  scroll: 3200 },
    { name: 'v4-article-end',url: '/articles/baghdad-battery.html', w: 1440, h: 900,  scroll: 99999 },
    { name: 'v4-calculator', url: '/calculator.html',               w: 1440, h: 900,  scroll: 0 },
    { name: 'v4-timeline',   url: '/timeline.html',                 w: 1440, h: 900,  scroll: 400 },
    { name: 'v4-mobile-home',url: '/',                              w: 390,  h: 844,  scroll: 0 },
    { name: 'v4-mobile-art', url: '/articles/baghdad-battery.html', w: 390,  h: 844,  scroll: 1500 },
  ];
  for (const s of shots) {
    const ctx = await browser.newContext({ viewport: { width: s.w, height: s.h } });
    const page = await ctx.newPage();
    await page.goto(BASE + s.url, { waitUntil: 'networkidle', timeout: 40000 });
    await page.waitForTimeout(1200);
    if (s.scroll) { await page.evaluate((y) => window.scrollTo(0, y), s.scroll); await page.waitForTimeout(900); }
    const p = `${OUT}/${s.name}.png`;
    await page.screenshot({ path: p });
    console.log('  ' + s.name + '  ->  ' + p);
    await ctx.close();
  }
  await browser.close();
})().catch((e) => { console.error('ERR', e.message); process.exit(1); });
