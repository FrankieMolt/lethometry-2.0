// Full production crawl: every article page gets loaded in a real browser and
// checked for runtime errors, missing assets, TOC/progress wiring, video facades
// and heading structure. Complements the HTTP-level crawl in Python.
const { chromium } = require('playwright');
const BASE = process.env.BASE || 'https://lethometry.vercel.app';
const fs = require('fs');

(async () => {
  const slugList = JSON.parse(fs.readFileSync(
    'C:/Users/Tyson/Projects/_lethometry_restore/content/articles.json', 'utf8'));
  const slugs = slugList.map((a) => a.slug);

  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();

  const problems = [];
  const failedRequests = [];
  page.on('requestfailed', (r) => failedRequests.push(r.url()));
  page.on('response', (r) => {
    if (r.status() >= 400) failedRequests.push(`${r.status()} ${r.url()}`);
  });

  const seen = { videos: 0, toc: 0, progress: 0, emptyBody: 0, badH1: 0 };
  for (const slug of slugs) {
    const errs = [];
    const onErr = (e) => errs.push(e.message);
    page.on('pageerror', onErr);
    await page.goto(`${BASE}/articles/${slug}.html`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(160);

    const r = await page.evaluate(() => {
      const ab = document.querySelector('.ab');
      return {
        h1: document.querySelectorAll('h1').length,
        words: ab ? ab.innerText.trim().split(/\s+/).length : 0,
        toc: document.querySelectorAll('.toc a').length,
        progress: !!document.getElementById('rp'),
        videos: document.querySelectorAll('.yt-facade, .yt-thumb, [data-yt-id]').length,
        title: (document.querySelector('h1')?.innerText || '').trim(),
      };
    });

    if (errs.length) problems.push(`${slug}: JS ${errs.join('; ')}`);
    if (r.h1 !== 1) { problems.push(`${slug}: ${r.h1} h1 tags`); seen.badH1++; }
    if (r.words < 200) { problems.push(`${slug}: only ${r.words} words of body`); seen.emptyBody++; }
    if (r.toc > 0) seen.toc++;
    if (r.progress) seen.progress++;
    seen.videos += r.videos;
    if (!r.title) problems.push(`${slug}: empty h1 text`);
    page.off('pageerror', onErr);
  }

  await browser.close();

  console.log(`crawled ${slugs.length} article pages at ${BASE}`);
  console.log(`  TOC built on      : ${seen.toc}/${slugs.length}`);
  console.log(`  progress bar on   : ${seen.progress}/${slugs.length}`);
  console.log(`  video facades     : ${seen.videos}`);
  console.log(`  short/empty bodies: ${seen.emptyBody}`);
  console.log(`  h1 count != 1     : ${seen.badH1}`);
  const realFails = [...new Set(failedRequests)];
  console.log(`  failed requests   : ${realFails.length}`);
  realFails.slice(0, 10).forEach((u) => console.log('    ' + u));
  console.log(`  page problems     : ${problems.length}`);
  problems.slice(0, 15).forEach((p) => console.log('    ' + p));
  process.exit(problems.length || realFails.length ? 1 : 0);
})().catch((e) => { console.error('ERR', e); process.exit(2); });
