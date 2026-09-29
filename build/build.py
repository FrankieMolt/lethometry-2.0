#!/usr/bin/env python3
"""LETHOMETRY build — generates the whole static site from one template set.

Replaces 59 hand-maintained HTML pages (each with a duplicated ~1.5KB inline
<style> block and hand-typed <title>/meta/canonical/sitemap entries) with:

  content/articles.json  <- build/extract.py
  templates/*.html       <- this file renders them
  src/                   <- untouched v3.6 source, kept as the extraction input
  dist/                  <- generated output, this is what gets deployed

Fixes carried in this build (all verified against the live v3.6 site):
  * article count is derived from the content, never hardcoded (v3.6 said
    "46 investigations" in 4 places while shipping 52 articles)
  * three.js (589KB) is gone; the CSS/SVG hero already carried the visuals
  * one shared stylesheet instead of 52 inline copies
  * per-article JSON-LD (Article) so articles can earn rich results
  * og:image:width/height, which v3.6 omitted on every page
  * video embeds are click-to-load facades, never autoloading iframes
"""
import html
import json
import os
import re
import shutil
import sys
import time
from datetime import datetime, timezone
from urllib.parse import quote

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CONTENT = os.path.join(ROOT, "content", "articles.json")
TEMPLATES = os.path.join(ROOT, "templates")
ASSETS = os.path.join(ROOT, "src")
DIST = os.path.join(ROOT, "dist")

SITE = "https://lethometry.com"
NAME = "LETHOMETRY"
SUBTITLE = "The Simulation Archive"
VERSION = "4.0"
CSS_VERSION = "405"


# ---------------------------------------------------------------- helpers
def esc(s):
    return html.escape(s or "", quote=True)


def read_template(name):
    with open(os.path.join(TEMPLATES, name), encoding="utf-8") as fh:
        return fh.read()


def fill(tpl, **kw):
    """Replace {{KEY}} tokens. Unknown tokens are left visible so they fail loudly."""
    out = tpl
    for k, v in kw.items():
        out = out.replace("{{" + k + "}}", v if isinstance(v, str) else str(v))
    return out


def rfc3339(stamp):
    if not stamp:
        return ""
    m = re.search(r"(\d{4})(?:-(\d{2}))?(?:-(\d{2}))?", stamp)
    if not m:
        return ""
    y, mo, d = m.group(1), m.group(2) or "01", m.group(3) or "01"
    return f"{y}-{mo}-{d}T00:00:00+00:00"


def strip_tags(h):
    return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", h or "")).strip()


def count_words(h):
    return len(re.findall(r"\w+", strip_tags(h)))


def youtube_facade(vid, title):
    """Click-to-load embed. No iframe is fetched until the visitor clicks."""
    if not vid:
        return ""
    return (
        f'<div class="yt-facade" data-vid="{esc(vid)}" role="button" tabindex="0"'
        f' aria-label="Play video: {esc(title)}">'
        f'<div class="yt-facade-frame">'
        f'<span class="yt-facade-play" aria-hidden="true"></span>'
        f'<span class="yt-facade-lbl">WATCH // YOUTUBE</span>'
        f'</div></div>'
    )


# ---------------------------------------------------------------- head block
def head(title, desc, url, og_type="website", extra_ld="", art_meta=""):
    """One canonical <head> for every page. Nothing is hand-maintained.

    `title` is the bare page title; the "| LETHOMETRY" suffix is appended here
    exactly once, so callers must not include it themselves (v3.6 pages had
    "| LETHOMETRY" hand-typed into all 52 <title> tags).
    """
    suffix = "" if title.startswith(NAME) else f" | {NAME}"
    full = f"{title}{suffix}"
    ld = {
        "@context": "https://schema.org",
        "@type": "WebSite",
        "name": NAME,
        "alternateName": SUBTITLE,
        "url": SITE,
        "description": desc,
        "publisher": {"@type": "Organization", "name": "Lethometry Research", "url": SITE},
        "potentialAction": {
            "@type": "SearchAction",
            "target": {
                "@type": "EntryPoint",
                "urlTemplate": f"{SITE}/articles.html?q={{search_term_string}}",
            },
            "query-input": "required name=search_term_string",
        },
    }
    blocks = (
        "<script type=\"application/ld+json\">"
        + json.dumps(ld, ensure_ascii=False)
        + "</script>"
        + (extra_ld or "")
    )
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0,maximum-scale=5">
<meta name="theme-color" content="#050508">
<meta name="color-scheme" content="dark">
<title>{esc(full)}</title>
<meta name="description" content="{esc(desc)}">
<link rel="canonical" href="{esc(url)}">
<meta name="robots" content="index, follow">
<meta property="og:type" content="{og_type}">
<meta property="og:title" content="{esc(title)}">
<meta property="og:description" content="{esc(desc)}">
<meta property="og:url" content="{esc(url)}">
<meta property="og:site_name" content="{NAME}">
<meta property="og:image" content="{SITE}/og-image.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="{esc(NAME)} — {esc(SUBTITLE)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{esc(title)}">
<meta name="twitter:description" content="{esc(desc)}">
<meta name="twitter:image" content="{SITE}/og-image.png">
{art_meta}
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="/css/style.css?v={CSS_VERSION}">
<link rel="alternate" hreflang="en" href="{esc(url)}">
{blocks}
</head>
<body>
<a class="skip-link" href="#main">Skip to main content</a>
"""


def tail(extra_js=""):
    return f"""
<script src="/js/main.js?v={CSS_VERSION}" defer></script>
{extra_js}
</body>
</html>
"""


# ---------------------------------------------------------------- pages
def build_article(a, nav, cats):
    url = f"{SITE}/articles/{a['slug']}.html"
    words = count_words(a["body"])
    mins = max(1, round(words / 230))
    cat = a["category"] or "ARCHIVE"
    related = cats.get(cat, [])
    body = a["body"]
    if a["videos"]:
        vid = a["videos"][0]
        body += youtube_facade(vid, a["title"])

    art_ld = {
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": a["title"],
        "description": a["description"],
        "url": url,
        "image": f"{SITE}/og-image.png",
        "datePublished": rfc3339(a["filed"]) or "2026-01-01T00:00:00+00:00",
        "author": {"@type": "Organization", "name": "Lethometry Research"},
        "publisher": {
            "@type": "Organization",
            "name": "Lethometry Research",
            "url": SITE,
        },
        "mainEntityOfPage": {"@type": "WebPage", "@id": url},
        "wordCount": words,
        "articleSection": cat,
    }
    art_meta = (
        f'<meta property="article:section" content="{esc(cat)}">\n'
        f'<meta property="article:author" content="Lethometry Research">'
    )

    rel_html = ""
    if related:
        items = "".join(
            f'<li><a href="/articles/{esc(r["slug"])}.html">'
            f'<span class="ar-cat">{esc(r["category"] or "ARCHIVE")}</span>'
            f'<span class="ar-ti">{esc(r["title"])}</span></a></li>'
            for r in related[:4]
        )
        rel_html = (
            '<section class="rel" aria-labelledby="rel-h"><h2 id="rel-h">'
            "// RELATED FILE</h2><ul>" + items + "</ul></section>"
        )

    page = (
        head(a["ogTitle"] or a["title"], a["description"], url,
             og_type="article", extra_ld="<script type=\"application/ld+json\">"
             + json.dumps(art_ld, ensure_ascii=False) + "</script>",
             art_meta=art_meta)
        + nav
        + f"""<main id="main"><div class="aw">
<div class="rp" id="rp" aria-hidden="true"></div>
<a class="bta" href="/articles.html">&larr; BACK TO ARCHIVE</a>
<header class="ah">
<div class="am"><span class="acls">{esc(cat)}</span><span class="adt">{esc(a['filed'] or '')}</span></div>
<h1 class="at">{esc(a['title'])}</h1>
{f'<p class="asub">{esc(a["sub"])}</p>' if a['sub'] else ''}
</header>
<article class="ab">
{body}
</article>
{rel_html}
<footer class="af"><div class="afl">{NAME}</div><div class="aft">// {esc(SUBTITLE)} //</div></footer>
</div></main>
"""
        + footer_nav()
        + tail('<script src="/js/youtube-facade.js"></script>')
    )
    return f"articles/{a['slug']}.html", page, words


def build_home(articles, nav, cats):
    n = len(articles)
    desc = (
        f"Deep investigations into simulation theory, Mandela effects, suppressed "
        f"technology, and the anomalies reality tries to hide. {n} files in the archive."
    )
    featured = sorted(articles, key=lambda a: -a["_words"])[:6]
    cards = "".join(
        f'<a class="ac fu" href="/articles/{esc(a["slug"])}.html">'
        f'<span class="ac-cat">{esc(a["category"] or "ARCHIVE")}</span>'
        f'<h3 class="ac-ti">{esc(a["title"])}</h3>'
        f'<p class="ac-de">{esc(a["description"])}</p>'
        f'<span class="ac-mt">{a["_words"]:,} WORDS</span></a>'
        for a in featured
    )
    # quote() the category: several contain spaces and an em-dash
    # ("SIMULATION THEORY", "GOVERNMENT — DECLASSIFIED"), which produce a
    # broken ?cat= parameter if left raw.
    catlist = "".join(
        f'<a class="cc" href="/articles.html?cat={quote(c)}">'
        f'<span class="cc-n">{sum(1 for a in articles if (a["category"] or "ARCHIVE") == c)}</span>'
        f'<span class="cc-l">{esc(c)}</span></a>'
        for c in sorted(cats, key=lambda c: (-len(cats[c]), c))
    )
    page = (
        head(f"{NAME} — {SUBTITLE}", desc, f"{SITE}/")
        + nav
        + f"""<main id="main">
<section id="hero" class="hero">
  <div id="hero-scene" aria-hidden="true">
    <div class="hs-orb"></div><div class="hs-halo"></div>
    <svg class="hs-rings" viewBox="0 0 100 100"><circle cx="50" cy="50" r="46" fill="none" stroke="rgba(0,255,65,.18)" stroke-width=".3"/><circle cx="50" cy="50" r="34" fill="none" stroke="rgba(0,229,255,.16)" stroke-width=".3" stroke-dasharray="2 4"/><circle cx="50" cy="50" r="22" fill="none" stroke="rgba(255,170,0,.14)" stroke-width=".3"/></svg>
    <div class="hs-particles"></div>
  </div>
  <div class="h-content">
    <span class="h-cap">OBSERVATION // {esc(SUBTITLE.upper())}</span>
    <h1 class="h-title" data-text="LETHOMETRY">LETHOMETRY</h1>
    <p class="h-sub">WHAT TIME TRIES TO FORGET, WE DEFY.</p>
    <p class="h-lede">{esc(desc)}</p>
    <div class="h-cta">
      <a class="btn-rp" href="#categories">TAKE THE RED PILL</a>
      <a class="btn-sec" href="/articles.html">EXPLORE THE ARCHIVE &rarr;</a>
    </div>
  </div>
  <div class="dc" aria-label="Reality distortion">
    <label for="distortion-slider">REALITY DISTORTION</label>
    <input type="range" id="distortion-slider" min="0" max="1" step="0.01" value="0">
  </div>
</section>
<section id="categories" class="sec" aria-labelledby="cat-h">
  <h2 id="cat-h" class="fu">// CLASSIFY THE ANOMALY</h2>
  <div class="cc-grid">{catlist}</div>
</section>
<section id="articles" class="sec" aria-labelledby="art-h">
  <h2 id="art-h" class="fu">// FEATURED FILES</h2>
  <div class="ac-grid">{cards}</div>
  <p class="sec-more"><a href="/articles.html">VIEW ALL {n} FILES &rarr;</a></p>
</section>
</main>
"""
        + tail()
    )
    return "index.html", page


def build_articles_index(articles, nav):
    n = len(articles)
    desc = f"Every file in the LETHOMETRY archive. {n} investigations into simulation theory, anomalies, and suppressed technology."
    items = []
    for a in sorted(articles, key=lambda a: (a["category"] or "", a["title"])):
        items.append(
            f'<a class="ac fu" data-cat="{esc(a["category"] or "ARCHIVE")}" '
            f'href="/articles/{esc(a["slug"])}.html">'
            f'<span class="ac-cat">{esc(a["category"] or "ARCHIVE")}</span>'
            f'<h3 class="ac-ti">{esc(a["title"])}</h3>'
            f'<p class="ac-de">{esc(a["description"])}</p>'
            f'<span class="ac-mt">{a["_words"]:,} WORDS</span></a>'
        )
    ld = json.dumps(
        {
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            "name": f"{NAME} Archive",
            "url": f"{SITE}/articles.html",
            "numberOfItems": n,
        },
        ensure_ascii=False,
    )
    page = (
        head("Archive", desc, f"{SITE}/articles.html",
             extra_ld=f'<script type="application/ld+json">{ld}</script>')
        + nav
        + f"""<main id="main"><div class="aw">
<h1 class="at">THE ARCHIVE</h1>
<p class="asub">{n} files. Sorted by classification.</p>
<div class="idx-tools">
  <label class="sr-only" for="search-input">Search the archive</label>
  <input id="search-input" type="search" placeholder="SEARCH THE ARCHIVE..." autocomplete="off">
</div>
<div class="ac-grid" id="archive">{''.join(items)}</div>
</div></main>
"""
        + tail()
    )
    return "articles.html", page


def build_sitemap(articles, pages):
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    out = ['<?xml version="1.0" encoding="UTF-8"?>',
           '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
    for loc, pri in pages:
        out.append(
            f"<url><loc>{esc(loc)}</loc><lastmod>{today}</lastmod>"
            f"<changefreq>weekly</changefreq><priority>{pri}</priority></url>"
        )
    for a in articles:
        out.append(
            f"<url><loc>{SITE}/articles/{esc(a['slug'])}.html</loc>"
            f"<lastmod>{today}</lastmod><changefreq>monthly</changefreq>"
            f"<priority>0.7</priority></url>"
        )
    out.append("</urlset>")
    return "\n".join(out)


def build_nav(active=""):
    links = [("/", "HOME"), ("/articles.html", "ARCHIVE"), ("/mandela.html", "MANDELA LAB"),
             ("/timeline.html", "TIMELINE"), ("/calculator.html", "CALCULATOR")]
    items = "".join(
        f'<a href="{h}"{" aria-current=\"page\"" if h == active else ""}>{l}</a>'
        for h, l in links
    )
    return (
        '<nav class="nav" aria-label="Primary">'
        f'<a class="brand" href="/">{NAME}</a>'
        f'<button class="n-toggle" aria-label="Menu" aria-expanded="false">☰</button>'
        f'<div class="n-links">{items}</div></nav>'
    )


def footer_nav():
    """Site-wide footer nav.

    Must NOT reuse the .nav class: that class is position:sticky, so a second
    copy renders as a second sticky bar pinned to the top of the page. v3.6 had
    exactly this bug — every article carried two sticky navs, and the second one
    intercepted pointer events over the back-to-top button, making it unclickable
    for real users.
    """
    links = [("/", "HOME"), ("/articles.html", "ARCHIVE"), ("/mandela.html", "MANDELA LAB"),
             ("/timeline.html", "TIMELINE"), ("/calculator.html", "CALCULATOR")]
    items = "".join(f'<a href="{h}">{l}</a>' for h, l in links)
    return (
        '<footer class="f-nav">'
        f'<div class="f-nav-in"><span class="f-nav-brand">{NAME}</span>'
        f'<nav class="f-links" aria-label="Footer">{items}</nav>'
        f'<span class="f-nav-c">// {esc(SUBTITLE)} //</span></div>'
        "</footer>"
    )


def main():
    if not os.path.exists(CONTENT):
        sys.exit("run build/extract.py first (no content/articles.json)")
    with open(CONTENT, encoding="utf-8") as fh:
        articles = json.load(fh)
    for a in articles:
        a["_words"] = count_words(a["body"])
    articles.sort(key=lambda a: a["title"].lower())

    cats = {}
    for a in articles:
        cats.setdefault(a["category"] or "ARCHIVE", []).append(a)

    nav = build_nav()
    # Build into a fresh dir, then swap. rmtree on Windows fails if a preview
    # server or editor still holds the directory (WinError 32), and a half-deleted
    # dist/ is worse than a stale one. Removing last also means a build error
    # never leaves the tree with no output at all.
    staging = DIST + ".new"
    if os.path.isdir(staging):
        shutil.rmtree(staging, ignore_errors=True)
    os.makedirs(os.path.join(staging, "articles"), exist_ok=True)
    DIST_PREV = DIST + ".prev"
    if os.path.isdir(DIST_PREV):
        shutil.rmtree(DIST_PREV, ignore_errors=True)

    written = []
    # carry over static assets (img, favicon, og images) from src
    for item in ("img", "favicon.svg", "og-image.png", "og-image.webp",
                 "50x.html", "404.html", "mandela.html", "timeline.html",
                 "calculator.html"):
        s = os.path.join(ASSETS, item)
        d = os.path.join(staging, item)
        if os.path.isdir(s):
            shutil.copytree(s, d, dirs_exist_ok=True)
        elif os.path.exists(s):
            shutil.copy2(s, d)

    # css + js come from build/, not src/ — that is the whole point of the refactor
    os.makedirs(os.path.join(staging, "css"), exist_ok=True)
    os.makedirs(os.path.join(staging, "js"), exist_ok=True)
    shutil.copy2(os.path.join(ROOT, "build", "style.css"),
                 os.path.join(staging, "css", "style.css"))
    shutil.copy2(os.path.join(ROOT, "build", "main.js"),
                 os.path.join(staging, "js", "main.js"))
    shutil.copy2(os.path.join(ROOT, "build", "youtube-facade.js"),
                 os.path.join(staging, "js", "youtube-facade.js"))

    n = len(articles)
    home, page = build_home(articles, nav, cats)
    open(os.path.join(staging, home), "w", encoding="utf-8").write(page)
    written.append(home)

    idx, page = build_articles_index(articles, nav)
    open(os.path.join(staging, idx), "w", encoding="utf-8").write(page)
    written.append(idx)

    for a in articles:
        rel, page, _ = build_article(a, nav, cats)
        open(os.path.join(staging, rel), "w", encoding="utf-8").write(page)
        written.append(rel)

    pages = [(f"{SITE}/", "1.0"), (f"{SITE}/articles.html", "0.9")]
    open(os.path.join(staging, "sitemap.xml"), "w", encoding="utf-8").write(
        build_sitemap(articles, pages))

    robots = (
        "User-agent: *\nAllow: /\nDisallow: /articles/_\n"
        f"Sitemap: {SITE}/sitemap.xml\n"
    )
    open(os.path.join(staging, "robots.txt"), "w", encoding="utf-8").write(robots)

    # ---- swap staging into place ----
    # A preview server or editor can hold dist/ open on Windows, which makes both
    # rmtree and rename fail (WinError 32 / 183). Retry a few times, then fall
    # back to building in place so a build never dead-ends on a locked file.
    swapped = False
    for attempt in range(3):
        try:
            if os.path.isdir(DIST):
                os.rename(DIST, DIST_PREV)
            os.rename(staging, DIST)
            if os.path.isdir(DIST_PREV):
                shutil.rmtree(DIST_PREV, ignore_errors=True)
            swapped = True
            break
        except OSError as e:
            last = e
            if os.path.isdir(DIST) and not os.path.isdir(DIST_PREV):
                pass  # dist/ still in place; retry the rename next loop
            time.sleep(0.6)
    if not swapped:
        # dist/ is locked. Copy the new tree over it instead of giving up, and
        # leave the stale files that no longer exist in the build.
        print(f"  note: {DIST} is in use; merging in place ({last})")
        shutil.copytree(staging, DIST, dirs_exist_ok=True)
        keep = set()
        for dp, _, fs in os.walk(staging):
            for f in fs:
                keep.add(os.path.relpath(os.path.join(dp, f), staging))
        for dp, dns, fs in list(os.walk(DIST)):
            for f in fs:
                rel = os.path.relpath(os.path.join(dp, f), DIST)
                if rel not in keep:
                    try:
                        os.remove(os.path.join(dp, f))
                    except OSError:
                        pass
        shutil.rmtree(staging, ignore_errors=True)

    total = sum(
        os.path.getsize(os.path.join(dp, f))
        for dp, _, fs in os.walk(DIST) for f in fs
    )
    print(f"built {len(written) + 2} files -> dist/  ({total/1024:.0f} KB)")
    print(f"  {n} articles, {len(cats)} categories, "
          f"{sum(a['_words'] for a in articles):,} words")
    stale = [a for a in articles if not a["description"]]
    if stale:
        print(f"  WARNING: {len(stale)} articles missing a description")
    thin = [a for a in articles if a["_words"] < 400]
    if thin:
        print(f"  note: {len(thin)} thin articles (<400 words): "
              f"{[a['slug'] for a in thin]}")


if __name__ == "__main__":
    t0 = time.time()
    main()
    print(f"done in {time.time() - t0:.1f}s")
