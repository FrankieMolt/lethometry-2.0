#!/usr/bin/env python3
"""Playwright verification of the new article-page UX features on lethometry.com (sync version)."""
import json
import sys
from playwright.sync_api import sync_playwright

ARTICLES = [
    "lethe-river.html",            # template
    "agi-12-endings.html",         # FILED: 2026-06-18
    "haarp.html",                  # FILED: 2026-05-18 + CLEARANCE: OMEGA
    "mandela-effect.html",         # No FILED; should fall back to a year
    "longevity-simulation.html",   # LONGEVITY NEXUS category
    "digital-amnesia.html",        # SOCIAL MEDIA CONTROL
    "baghdad-battery.html",        # SUPPRESSED TECHNOLOGY
    "platos-cave.html",            # ANCIENT SIMULATION CLUES, 380 BCE
]

BASE = "https://lethometry.com/articles/"


def verify(article):
    name = article
    r = {"article": name, "checks": {}}
    with sync_playwright() as p:
        browser = p.chromium.launch()
        ctx = browser.new_context(viewport={"width": 1280, "height": 900})
        page = ctx.new_page()
        url = BASE + article
        try:
            resp = page.goto(url, wait_until="domcontentloaded", timeout=20000)
            r["status"] = resp.status if resp else 0
            page.wait_for_timeout(900)

            # 1. CSS version
            css_href = page.eval_on_selector(
                'link[rel="stylesheet"][href*="style.css"]',
                "el => el.getAttribute('href')"
            )
            r["checks"]["css_v16"] = "?v=16" in (css_href or "")

            # 2. Reading progress bar
            rp = page.query_selector("#rp")
            if rp:
                wp0 = page.evaluate("document.getElementById('rp').getBoundingClientRect().width")
                page.evaluate("""() => {
                  const aw = document.querySelector('main .aw');
                  if (aw) {
                    const r = aw.getBoundingClientRect();
                    window.scrollTo(0, r.top + window.scrollY + (r.height * 0.5));
                  } else { window.scrollTo(0, document.body.scrollHeight / 2); }
                }""")
                page.wait_for_timeout(280)
                wp1 = page.evaluate("document.getElementById('rp').getBoundingClientRect().width")
                r["checks"]["rp_present"] = True
                r["checks"]["rp_grows"] = wp1 > wp0 + 50
                r["checks"]["rp_mid_pct"] = round((wp1 / 1280) * 100, 1)
            else:
                r["checks"]["rp_present"] = False
                r["checks"]["rp_grows"] = False

            # 3. Back-to-top button visibility past 30%
            btt = page.query_selector("#btt")
            if btt:
                visible_mid = page.evaluate("getComputedStyle(document.getElementById('btt')).opacity")
                page.evaluate("window.scrollTo(0, 0)")
                page.wait_for_timeout(220)
                visible_top = page.evaluate("getComputedStyle(document.getElementById('btt')).opacity")
                page.evaluate("""() => {
                  const aw = document.querySelector('main .aw');
                  if (aw) {
                    const r = aw.getBoundingClientRect();
                    window.scrollTo(0, r.top + window.scrollY + (r.height * 0.4));
                  } else { window.scrollTo(0, document.body.scrollHeight * 0.4); }
                }""")
                page.wait_for_timeout(220)
                visible_40 = page.evaluate("getComputedStyle(document.getElementById('btt')).opacity")
                r["checks"]["btt_present"] = True
                r["checks"]["btt_hidden_top"] = float(visible_top) < 0.1
                r["checks"]["btt_shown_mid"] = float(visible_mid) > 0.9
                r["checks"]["btt_shown_40"] = float(visible_40) > 0.9
                page.click("#btt")
                page.wait_for_timeout(550)
                sy = page.evaluate("window.scrollY")
                r["checks"]["btt_click_scrolls_top"] = sy < 20
            else:
                r["checks"]["btt_present"] = False

            # 4. Header meta injected
            meta = page.query_selector(".at-meta")
            if meta:
                text = (meta.text_content() or "").strip()
                r["checks"]["meta_present"] = True
                r["checks"]["meta_has_category"] = "at-cat" in (meta.inner_html() or "")
                r["checks"]["meta_has_filed"] = "FILED" in text
                r["checks"]["meta_has_readtime"] = "READ TIME" in text
                r["checks"]["meta_has_wordcount"] = "WORDS" in text
                r["meta_text"] = text[:120]
            else:
                r["checks"]["meta_present"] = False

            # 5. Share block + 4 options
            sb = page.query_selector(".share-block")
            if sb:
                n = len(sb.query_selector_all('[data-share]'))
                r["checks"]["share_present"] = True
                r["checks"]["share_count_4"] = n == 4
            else:
                r["checks"]["share_present"] = False

            # 6. Table of contents — sidebar populated
            toc_side = page.query_selector("#toc-side")
            n_side = 0
            n_h2 = 0
            if toc_side:
                n_side = len(toc_side.query_selector_all("a[data-target]"))
            n_h2 = len(page.query_selector_all("main .ab h2"))
            r["checks"]["toc_side_present"] = n_side > 0
            r["checks"]["toc_side_count"] = n_side
            r["checks"]["toc_h2_count"] = n_h2
            if n_h2 >= 2:
                r["checks"]["toc_side_matches_h2"] = n_side == n_h2
            else:
                r["checks"]["toc_side_skipped"] = True

            # 7. Mobile TOC button present in DOM
            mb = page.query_selector("#toc-mob-btn")
            r["checks"]["toc_mob_btn_present"] = mb is not None
            mm = page.query_selector("#toc-mob")
            r["checks"]["toc_mob_present"] = mm is not None

            # 8. Screenshots
            page.evaluate("window.scrollTo(0, 0)")
            page.wait_for_timeout(300)
            page.screenshot(path=f"/tmp/ux-{article.replace('.html', '')}-top.png", full_page=False)
            page.evaluate("""() => {
              const aw = document.querySelector('main .aw');
              if (aw) {
                const r = aw.getBoundingClientRect();
                window.scrollTo(0, r.top + window.scrollY + (r.height * 0.25));
              } else { window.scrollTo(0, 400); }
            }""")
            page.wait_for_timeout(300)
            page.screenshot(path=f"/tmp/ux-{article.replace('.html', '')}-scrolled.png", full_page=False)

        except Exception as e:
            r["error"] = str(e)
        finally:
            browser.close()
    return r


def main():
    print(f"Verifying {len(ARTICLES)} articles on {BASE}\n")
    results = []
    for art in ARTICLES:
        r = verify(art)
        results.append(r)
        c = r.get("checks", {})
        bools = [v for v in c.values() if isinstance(v, bool)]
        all_pass = all(bools) and r.get("status") == 200 and "error" not in r
        marker = "✓" if all_pass else "✗"
        print(f"  {marker} {r['article']:38s}  status={r.get('status', '?')}  passed={sum(bools)}/{len(bools)}")
        if "error" in r:
            print(f"     ERROR: {r['error']}")
        if "meta_text" in r:
            print(f"     meta: {r['meta_text']}")
    with open("/tmp/ux-verify.json", "w") as f:
        json.dump(results, f, indent=2)
    print(f"\nFull report saved to /tmp/ux-verify.json")
    all_ok = all(r.get("status") == 200 and "error" not in r for r in results)
    return 0 if all_ok else 1


if __name__ == "__main__":
    sys.exit(main())
