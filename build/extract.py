#!/usr/bin/env python3
"""Extract article content from the hand-written v3.6 HTML into a data file.

The v3.6 source has 52 near-identical article pages, each carrying its own
duplicated inline <style> block and hand-maintained <title>/meta/canonical.
This script pulls the variable parts (title, description, category, date,
body HTML, og:title) into content/articles.json so build.py can generate
every page from one template. The originals are never mutated.
"""
import json
import os
import re
import sys

SRC = os.path.join(os.path.dirname(__file__), "..", "src")
OUT = os.path.join(os.path.dirname(__file__), "..", "content", "articles.json")


def first(pattern, text, flags=re.S):
    m = re.search(pattern, text, flags)
    return m.group(1).strip() if m else ""


def extract_div(text, cls):
    """Return the inner HTML of the <div class="...cls..."> element.

    Counts <div> nesting depth so the matching close tag is found even when the
    body itself contains nested divs (stat boxes, callouts, tables). Handles the
    div carrying additional attributes. Returns None when the class is absent.
    """
    m = re.search(r'<div\b[^>]*\bclass\s*=\s*["\'][^"\']*\b' + re.escape(cls) + r'\b[^"\']*["\'][^>]*>', text)
    if not m:
        return None
    start = m.end()
    depth = 1
    for tok in re.finditer(r'<div\b|</div\s*>', text[start:]):
        depth += 1 if tok.group(0).startswith("<div") else -1
        if depth == 0:
            return text[start:start + tok.start()].strip()
    return text[start:].strip()


def main():
    arts_dir = os.path.join(SRC, "articles")
    if not os.path.isdir(arts_dir):
        sys.exit(f"no articles dir at {arts_dir}")

    records = []
    problems = []

    for name in sorted(os.listdir(arts_dir)):
        if not name.endswith(".html"):
            continue
        path = os.path.join(arts_dir, name)
        with open(path, encoding="utf-8", errors="replace") as fh:
            t = fh.read()

        slug = name[:-5]

        # --- the article body: everything inside <div class="ab"> ... ---
        # NOTE: the .ab div carries extra attributes in some pages, so match on the
        # class attribute rather than an exact "<div class=\"ab\">" literal, and find
        # the true end by counting <div>/</div> depth. A naive non-greedy regex
        # truncates at the first nested </div> and leaves the body unbalanced.
        body = extract_div(t, "ab")
        if body is None:
            problems.append(f"{name}: no .ab body found")
            body = ""

        title = first(r"<h1[^>]*class=\"at\"[^>]*>(.*?)</h1>", t)
        if not title:
            title = first(r"<h1[^>]*>(.*?)</h1>", t)
        # strip any inline tags from the h1
        title = re.sub(r"<[^>]+>", "", title).strip()

        desc = first(r'<meta name="description" content="([^"]*)"', t)
        og_title = first(r'<meta property="og:title" content="([^"]*)"', t)
        category = first(r'<span class="acls"[^>]*>(.*?)</span>', t)
        filed = first(r'<span class="adt"[^>]*>(.*?)</span>', t)
        sub = first(r'<p class="asub">(.*?)</p>', t)
        sub = re.sub(r"<[^>]+>", "", sub).strip()

        # YouTube video ids referenced anywhere in the body
        videos = sorted(set(
            re.findall(
                r"(?:youtube\.com/(?:embed/|watch\?v=)|youtu\.be/)([\w-]{6,})", t)
        ))

        if not body:
            problems.append(f"{name}: empty body")
        if not title:
            problems.append(f"{name}: no title")

        records.append({
            "slug": slug,
            "title": title,
            "ogTitle": og_title or title,
            "description": desc,
            "sub": sub,
            "category": category,
            "filed": filed,
            "videos": videos,
            "body": body,
            "bytes": len(body),
        })

    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, "w", encoding="utf-8") as fh:
        json.dump(records, fh, indent=1, ensure_ascii=False)

    total = len(records)
    words = sum(len(re.findall(r"\w+", re.sub(r"<[^>]+>", " ", r["body"]))) for r in records)
    withvid = sum(1 for r in records if r["videos"])
    print(f"extracted {total} articles -> content/articles.json")
    print(f"  ~{words:,} words total, avg {words // max(total, 1):,} words/article")
    print(f"  articles with video refs: {withvid}")
    print(f"  categories: {sorted({r['category'] for r in records if r['category']})}")
    if problems:
        print(f"\n{len(problems)} PROBLEMS:")
        for p in problems[:20]:
            print(f"  {p}")


if __name__ == "__main__":
    main()
