#!/usr/bin/env python
"""Stamp CSS and JS links with a content hash.

Without this, assets/css/styles.css is a stable URL sitting behind a long
Cache-Control, so a CDN and every browser keep serving the old file after a
deploy. Hashing the query string makes each build a distinct URL, which is
what makes long caching safe in the first place.

Run before committing:  python tools/version-assets.py
"""

import hashlib
import pathlib
import re

ASSETS = [
    "assets/css/flags.css",
    "assets/css/styles.css",
    "assets/js/main.js",
]


def digest(path: pathlib.Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()[:10]


def main() -> None:
    versions = {}
    for rel in ASSETS:
        p = pathlib.Path(rel)
        if not p.exists():
            print("missing:", rel)
            continue
        versions[rel] = digest(p)

    changed = 0
    for page in sorted(pathlib.Path(".").glob("*.html")):
        html = page.read_text(encoding="utf-8")
        before = html
        for rel, ver in versions.items():
            # match the asset with or without an existing ?v=
            html = re.sub(
                r'(["\'])' + re.escape(rel) + r'(?:\?v=[0-9a-f]+)?\1',
                lambda m, r=rel, v=ver: f'{m.group(1)}{r}?v={v}{m.group(1)}',
                html,
            )
        if html != before:
            page.write_text(html, encoding="utf-8")
            changed += 1

    for rel, ver in versions.items():
        print(f"  {rel:26s} v={ver}")
    print(f"stamped {changed} page(s)")


if __name__ == "__main__":
    main()
