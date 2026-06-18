#!/usr/bin/env python3
"""Update all 40 article pages with article-page-UX elements.

Adds inline to each article (idempotent — can be re-run safely):
  1. Bumps style.css?v=15 → ?v=16
  2. Reading progress bar element
  3. Back-to-top button
  4. Mobile TOC button + collapsible accordion container
  5. Desktop TOC sidebar container (JS inserts into flex layout)
  6. Share buttons block (before <div class="related">)
"""
import os
import re
import sys

ARTICLES_DIR = "/home/oldpc/lethometry-2.0/articles"

# Inline HTML injected before <script src="../js/main.js" defer></script>
# Order matters for JS: #btt, #toc-side, #toc-mob-btn, #toc-mob, #rp are referenced by id.
INLINE_BLOCK = """  <!-- Article page UX v3.6: progress, back-to-top, TOC (desktop+mobile), share. -->
  <div id="rp" class="rp" aria-hidden="true"></div>
  <button id="btt" class="btt" type="button" aria-label="Back to top" title="Back to top">↑</button>
  <aside id="toc-side" class="toc-side" aria-label="Table of contents"><h4>// CONTENTS //</h4></aside>
  <button id="toc-mob-btn" class="toc-mob-btn" type="button" aria-expanded="false" aria-controls="toc-mob"><span>// CONTENTS //</span><span class="toc-mob-arrow">▾</span></button>
  <nav id="toc-mob" class="toc-mob" aria-label="Table of contents (mobile)"></nav>
"""

SHARE_BLOCK = """    <div class="share-block">
      <span class="share-lbl">// SHARE //</span>
      <a data-share="twitter" href="#" rel="noopener" target="_blank"><span class="share-icon">𝕏</span> TWITTER</a>
      <a data-share="facebook" href="#" rel="noopener" target="_blank"><span class="share-icon">f</span> FACEBOOK</a>
      <a data-share="linkedin" href="#" rel="noopener" target="_blank"><span class="share-icon">in</span> LINKEDIN</a>
      <button data-share="copy" type="button"><span class="share-icon">⎘</span> COPY LINK</button>
    </div>
"""

CSS_VER_OLD = '../css/style.css?v=15'
CSS_VER_NEW = '../css/style.css?v=16'
SCRIPT_MARKER = '<script src="../js/main.js" defer></script>'


def transform(path: str) -> tuple[bool, str]:
    """Return (changed, message)."""
    with open(path, "r", encoding="utf-8") as f:
        html = f.read()

    original = html
    messages = []

    # 1. Bump CSS version.
    if CSS_VER_OLD in html:
        html = html.replace(CSS_VER_OLD, CSS_VER_NEW)
        messages.append("css:v15→v16")
    elif CSS_VER_NEW in html:
        messages.append("css:already v16")
    else:
        messages.append("css:NO VERSION FOUND (skipped)")

    # 2. Insert share block before <div class="related">.
    if '<div class="related">' in html and 'class="share-block"' not in html:
        html = html.replace(
            '<div class="related">',
            SHARE_BLOCK + '  <div class="related">',
            1,
        )
        messages.append("share:inserted")
    elif 'class="share-block"' in html:
        messages.append("share:already present")
    else:
        messages.append("share:NO RELATED DIV (skipped)")

    # 3. Insert inline UX block (progress, back-to-top, TOC containers) before the main.js script.
    if 'id="rp"' not in html and SCRIPT_MARKER in html:
        html = html.replace(
            SCRIPT_MARKER,
            INLINE_BLOCK + "  " + SCRIPT_MARKER,
            1,
        )
        messages.append("ux:inserted")
    elif 'id="rp"' in html:
        messages.append("ux:already present")
    else:
        messages.append("ux:NO SCRIPT MARKER (skipped)")

    if html != original:
        with open(path, "w", encoding="utf-8") as f:
            f.write(html)
        return True, " ".join(messages)
    return False, "no change: " + " ".join(messages)


def main():
    if not os.path.isdir(ARTICLES_DIR):
        print(f"ERROR: {ARTICLES_DIR} not found", file=sys.stderr)
        sys.exit(1)
    files = sorted(f for f in os.listdir(ARTICLES_DIR) if f.endswith(".html"))
    print(f"Processing {len(files)} articles in {ARTICLES_DIR}\n")
    changed = 0
    errors = 0
    for f in files:
        path = os.path.join(ARTICLES_DIR, f)
        try:
            ok, msg = transform(path)
            marker = "✓" if ok else " "
            print(f"  {marker} {f:42s}  {msg}")
            if ok:
                changed += 1
        except Exception as e:
            errors += 1
            print(f"  ✗ {f:42s}  ERROR: {e}")
    print(f"\nDone. {changed}/{len(files)} files changed, {errors} errors.")


if __name__ == "__main__":
    main()
