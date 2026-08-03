#!/usr/bin/env python3
"""Build posts/index.json from the posts' frontmatter.

Walks posts/content/*.md, reads each post's flat `key: value` frontmatter
(title, type, author, description, logo — all optional), derives the date
from the YYYY-MM-DD filename prefix, and writes posts/index.json: the
listing and search index the site loads in one fetch.

The frontmatter is the single source of truth — this file is generated,
never edited, and never committed (it's gitignored; CI builds it into the
Pages artifact on every push).

Usage: .scripts/build-posts-index.py          (run from anywhere)
Stdlib only. Mirrors the fallbacks in assets/posts.js: a missing title
falls back to the first heading, then the slug; a missing description
falls back to the first paragraph, truncated.
"""
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CONTENT = os.path.join(ROOT, "posts", "content")
OUT = os.path.join(ROOT, "posts", "index.json")

FM_RE = re.compile(r"^---\n(.*?)\n---\n?", re.S)
KV_RE = re.compile(r"^([A-Za-z][\w-]*):\s*(.*)$")
H1_RE = re.compile(r"^\s*#\s+(.+?)\s*$", re.M)


def parse_post(slug, text):
    meta = {
        "slug": slug,
        "date": (re.match(r"^(\d{4}-\d{2}-\d{2})", slug) or [None, ""])[1],
        "title": re.sub(r"^\d{4}-\d{2}-\d{2}-", "", slug).replace("-", " "),
        "type": "", "author": "", "description": "", "logo": "",
    }
    fm = FM_RE.match(text)
    body = text
    if fm:
        for line in fm.group(1).splitlines():
            kv = KV_RE.match(line)
            if kv and kv.group(1).lower() in meta:
                meta[kv.group(1).lower()] = kv.group(2).strip()
        body = text[fm.end():]
    if (not fm or "title" not in fm.group(1).lower()):
        h1 = H1_RE.search(body)
        if h1:
            meta["title"] = h1.group(1)
    if not meta["description"]:
        for block in re.split(r"\n\s*\n", H1_RE.sub("", body)):
            block = block.strip()
            if block and not re.match(r"^[#>\-*`]", block):
                meta["description"] = re.sub(r"\s+", " ", block)[:180]
                break
    return meta


def main():
    if not os.path.isdir(CONTENT):
        sys.exit(f"no content directory at {CONTENT}")
    posts = []
    for name in sorted(os.listdir(CONTENT), reverse=True):
        if not name.endswith(".md"):
            continue
        with open(os.path.join(CONTENT, name)) as f:
            posts.append(parse_post(name[:-3], f.read()))
    with open(OUT, "w") as f:
        json.dump(posts, f, indent=1, ensure_ascii=False)
        f.write("\n")
    print(f"wrote {os.path.relpath(OUT, ROOT)}: {len(posts)} post(s)")


if __name__ == "__main__":
    main()
