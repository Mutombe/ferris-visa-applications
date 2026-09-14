#!/usr/bin/env python
"""Stamp every asset URL in the HTML with a content hash.

/assets/* is served `Cache-Control: public, max-age=31536000, immutable`, so a
file that keeps its name after its content changes is never refetched by a
browser or the CDN. Hashing the query string turns every change into a new
URL, which is what makes that long cache safe.

Covers src, href and every candidate inside srcset: stylesheets, scripts,
photographs, logos, flags, avatars and the favicon.

Run before committing:  python tools/version-assets.py
"""

import hashlib
import pathlib
import re

ROOT = pathlib.Path(".")
# an asset path, optionally already carrying ?v=
ASSET = re.compile(r"(assets/[A-Za-z0-9/_.-]+\.(?:css|js|jpg|jpeg|png|svg|webp|avif))(?:\?v=[0-9a-f]+)?")
ATTR = re.compile(r'\b(src|href|srcset)="([^"]*)"')

_cache = {}


def version(rel: str) -> str:
    if rel not in _cache:
        p = ROOT / rel
        _cache[rel] = hashlib.sha256(p.read_bytes()).hexdigest()[:10] if p.exists() else None
    return _cache[rel]


def stamp_value(value: str, missing: set) -> str:
    def repl(m):
        rel = m.group(1)
        v = version(rel)
        if v is None:
            missing.add(rel)
            return m.group(0)
        return f"{rel}?v={v}"
    return ASSET.sub(repl, value)


def main() -> None:
    missing = set()
    pages = changed = 0
    for page in sorted(ROOT.glob("*.html")):
        pages += 1
        html = page.read_text(encoding="utf-8")
        new = ATTR.sub(lambda m: f'{m.group(1)}="{stamp_value(m.group(2), missing)}"', html)
        if new != html:
            page.write_text(new, encoding="utf-8")
            changed += 1

    kinds = {}
    for rel, v in _cache.items():
        if v:
            kinds[rel.split("/")[1]] = kinds.get(rel.split("/")[1], 0) + 1
    print("versioned:", ", ".join(f"{n} {k}" for k, n in sorted(kinds.items())))
    print(f"stamped {changed} of {pages} page(s)")
    if missing:
        print("WARNING, referenced but not on disk:", ", ".join(sorted(missing)))


if __name__ == "__main__":
    main()
