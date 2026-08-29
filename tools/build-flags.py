#!/usr/bin/env python
"""
Build the Ferris flag repository.

Source artwork: flag-icons 7.5.0 (MIT), normalised 640x480 SVGs.

The shipped artwork carries a few legacy approximations (Australia's field as
plain `darkblue`, the US as the old Wikipedia values, India off the BIS spec).
This script rewrites every fill to the colour the issuing authority actually
specifies, then emits the palette as JSON and as CSS custom properties.

Run from the project root:  python tools/build-flags.py
"""

import json
import pathlib
import re

FLAG_DIR = pathlib.Path("assets/flags")

# ---------------------------------------------------------------------------
# Official colour specifications.
#
#   corrections : {colour as shipped -> colour as specified}
#   palette     : the authoritative colours, in visual order of prominence
#   ratio       : the country's own legally specified flag proportion
#                 (artwork is normalised to 4:3 for a consistent UI grid)
# ---------------------------------------------------------------------------
SPEC = {
    "gb": {
        "name": "United Kingdom",
        "flag": "Union Flag",
        "ratio": "1:2",
        "authority": "College of Arms / Flag Institute",
        "corrections": {},
        "palette": [
            ("navy",  "#012169", "Pantone 280 C"),
            ("white", "#FFFFFF", "Safe"),
            ("red",   "#C8102E", "Pantone 186 C"),
        ],
    },
    "eu": {
        "name": "European Union",
        "flag": "Flag of Europe",
        "ratio": "2:3",
        "authority": "Council of Europe graphical specification",
        "corrections": {},
        "palette": [
            ("reflex-blue", "#003399", "Pantone Reflex Blue"),
            ("gold",        "#FFCC00", "Pantone Yellow"),
        ],
    },
    "us": {
        "name": "United States",
        "flag": "Stars and Stripes",
        "ratio": "10:19",
        "authority": "Executive Order 10834 / Pantone translation",
        "corrections": {"#BD3D44": "#B31942", "#192F5D": "#0A3161"},
        "palette": [
            ("old-glory-blue", "#0A3161", "Pantone 282 C"),
            ("white",          "#FFFFFF", "Safe"),
            ("old-glory-red",  "#B31942", "Pantone 193 C"),
        ],
    },
    "ca": {
        "name": "Canada",
        "flag": "Maple Leaf",
        "ratio": "1:2",
        "authority": "Canadian Heritage — Pantone 032 C",
        "corrections": {},
        "palette": [
            ("red",   "#D52B1E", "Pantone 032 C (common sRGB rendering)"),
            ("white", "#FFFFFF", "Safe"),
        ],
    },
    "ae": {
        "name": "United Arab Emirates",
        "flag": "Flag of the UAE",
        "ratio": "1:2",
        "authority": "UAE Cabinet flag specification",
        "corrections": {"#000001": "#000000"},
        "palette": [
            ("green", "#00732F", "Pantone 349 C"),
            ("white", "#FFFFFF", "Safe"),
            ("black", "#000000", "Black"),
            ("red",   "#FF0000", "Pantone 485 C"),
        ],
    },
    "au": {
        "name": "Australia",
        "flag": "Australian National Flag",
        "ratio": "1:2",
        "authority": "Awards and National Symbols Branch, PM&C",
        "corrections": {"#00008B": "#012169", "#FF0000": "#E4002B"},  # field shipped as darkblue; red as CSS `red`
        "palette": [
            ("navy",  "#012169", "Pantone 280 C"),
            ("white", "#FFFFFF", "Safe"),
            ("red",   "#E4002B", "Pantone 185 C"),
        ],
    },
    "jp": {
        "name": "Japan",
        "flag": "Nisshoki / Hinomaru",
        "ratio": "2:3",
        "authority": "Act on National Flag and Anthem (1999)",
        "corrections": {},
        "palette": [
            ("white",   "#FFFFFF", "Safe"),
            ("crimson", "#BC002D", "JIS Z 8721 crimson"),
        ],
    },
    "cn": {
        "name": "China",
        "flag": "Five-star Red Flag",
        "ratio": "2:3",
        "authority": "GB 12983-2004",
        "corrections": {},
        "palette": [
            ("red",    "#EE1C25", "GB 12983-2004 red"),
            ("yellow", "#FFFF00", "GB 12983-2004 yellow"),
        ],
    },
    "in": {
        "name": "India",
        "flag": "Tiranga",
        "ratio": "2:3",
        "authority": "IS 1:1968 (Bureau of Indian Standards)",
        "corrections": {"#128807": "#138808", "#000088": "#000080"},  # chakra navy shipped as shorthand #008
        "palette": [
            ("saffron",    "#FF9933", "India saffron"),
            ("white",      "#FFFFFF", "Safe"),
            ("india-green", "#138808", "India green"),
            ("navy",       "#000080", "Navy blue (Ashoka Chakra)"),
        ],
    },
    "id": {
        "name": "Indonesia",
        "flag": "Sang Saka Merah-Putih",
        "ratio": "2:3",
        "authority": "Law 24/2009 on the National Flag",
        "corrections": {"#E70011": "#CE1126"},  # shipped value sits between the two common renderings
        "palette": [
            ("red",   "#CE1126", "Pantone 186 C"),
            ("white", "#FFFFFF", "Safe"),
        ],
    },
    "za": {
        "name": "South Africa",
        "flag": "Flag of South Africa",
        "ratio": "2:3",
        "authority": "Bureau of Heraldry specification",
        "corrections": {
            "#007847": "#007A4D",
            "#E1392D": "#DE3831",
            "#FFB915": "#FFB612",
            "#000C8A": "#002395",
            "#000001": "#000000",
        },
        "palette": [
            ("green", "#007A4D", "Pantone 3415 C"),
            ("gold",  "#FFB612", "Pantone 1235 C"),
            ("red",   "#DE3831", "Pantone 179 C"),
            ("blue",  "#002395", "Pantone Reflex Blue"),
            ("white", "#FFFFFF", "Safe"),
            ("black", "#000000", "Black"),
        ],
    },
    "tr": {
        "name": "Türkiye",
        "flag": "Ay-yıldız",
        "ratio": "2:3",
        "authority": "Turkish Flag Law No. 2893",
        "corrections": {},
        "palette": [
            ("red",   "#E30A17", "Turkish Flag Law red"),
            ("white", "#FFFFFF", "Safe"),
        ],
    },
    "sg": {
        "name": "Singapore",
        "flag": "Flag of Singapore",
        "ratio": "2:3",
        "authority": "Singapore Arms and Flag Rules",
        "corrections": {"#DF0000": "#EF3340"},
        "palette": [
            ("red",   "#EF3340", "Pantone 032 C"),
            ("white", "#FFFFFF", "Safe"),
        ],
    },
    "br": {
        "name": "Brazil",
        "flag": "Auriverde",
        "ratio": "7:10",
        "authority": "Lei 5.700/1971",
        "corrections": {
            "#229E45": "#009C3B",
            "#309E3A": "#009C3B",
            "#F8E509": "#FFDF00",
            "#2B49A3": "#002776",
            "#FFFFEF": "#FFFFFF",
            "#F7FFFF": "#FFFFFF",
        },
        "palette": [
            ("green",  "#009C3B", "Pantone 355 C"),
            ("yellow", "#FFDF00", "Pantone 116 C"),
            ("blue",   "#002776", "Pantone 280 C"),
            ("white",  "#FFFFFF", "Safe"),
        ],
    },
    "nz": {
        "name": "New Zealand",
        "flag": "Flag of New Zealand",
        "ratio": "1:2",
        "authority": "Flags, Emblems, and Names Protection Act 1981",
        # the canton shipped with Union Flag colours; NZ specifies its own
        "corrections": {"#012169": "#00247D", "#C8102E": "#CC142B"},
        "palette": [
            ("royal-blue", "#00247D", "Pantone 280 C"),
            ("white",      "#FFFFFF", "Safe"),
            ("red",        "#CC142B", "Pantone 186 C"),
        ],
    },
}


# CSS named colours that appear in the source artwork. Anything not listed
# here raises, rather than being silently left un-normalised.
NAMED = {
    "red": "#FF0000",
    "white": "#FFFFFF",
    "black": "#000000",
    "blue": "#0000FF",
    "navy": "#000080",
    "darkblue": "#00008B",
    "green": "#008000",
    "yellow": "#FFFF00",
    "gold": "#FFD700",
    "orange": "#FFA500",
}

COLOR_ATTR = re.compile(r'(fill|stroke|stop-color)="([^"]+)"')


def normalise(svg: str) -> str:
    """Expand every colour literal to full uppercase 6-digit hex.

    The source mixes `#fff`, `#008`, `red` and `#FFFFFF` for the same values,
    which makes a plain find/replace unreliable.
    """
    def repl(m):
        attr, val = m.group(1), m.group(2).strip()
        low = val.lower()
        if low in ("none", "currentcolor"):
            return m.group(0)
        if low in NAMED:
            return f'{attr}="{NAMED[low]}"'
        if re.fullmatch(r"#[0-9a-fA-F]{3}", val):
            return f'{attr}="#{"".join(c * 2 for c in val[1:]).upper()}"'
        if re.fullmatch(r"#[0-9a-fA-F]{6}", val):
            return f'{attr}="{val.upper()}"'
        if low.startswith("url(") or low.startswith("rgb"):
            return m.group(0)
        raise ValueError(f"unrecognised colour literal: {attr}={val!r}")

    return COLOR_ATTR.sub(repl, svg)


def apply_corrections(svg: str, corrections: dict) -> tuple[str, int]:
    """Rewrite colour literals. Run after normalise(), so keys are exact."""
    changed = 0
    for old, new in corrections.items():
        pattern = re.compile(re.escape(old.upper()))
        svg, n = pattern.subn(new.upper(), svg)
        changed += n
    return svg, changed


def main() -> None:
    report = []
    for code, spec in sorted(SPEC.items()):
        for variant in ("4x3", "1x1"):
            path = FLAG_DIR / variant / f"{code}.svg"
            if not path.exists():
                report.append(f"{code}/{variant}: MISSING")
                continue
            svg = normalise(path.read_text(encoding="utf-8"))
            svg, n = apply_corrections(svg, spec["corrections"])
            # strip the vendor id so inlining several flags can never collide
            svg = re.sub(r'\s+id="flag-icons-[a-z]{2}"', "", svg)
            path.write_text(svg, encoding="utf-8")
            if variant == "4x3":
                report.append(f"{code}: {n} colour(s) corrected")

    # ---- palette.json -----------------------------------------------------
    palette = {
        "$comment": "Official flag colours. Artwork: flag-icons 7.5.0 (MIT), "
                    "recoloured to each issuing authority's published specification.",
        "countries": {
            code: {
                "code": code.upper(),
                "name": spec["name"],
                "flag": spec["flag"],
                "officialRatio": spec["ratio"],
                "artworkRatio": "4:3 (normalised for a consistent UI grid)",
                "authority": spec["authority"],
                "svg": {
                    "4x3": f"assets/flags/4x3/{code}.svg",
                    "1x1": f"assets/flags/1x1/{code}.svg",
                },
                "colors": [
                    {"name": n, "hex": h, "reference": r}
                    for n, h, r in spec["palette"]
                ],
            }
            for code, spec in sorted(SPEC.items())
        },
    }
    (FLAG_DIR / "palette.json").write_text(
        json.dumps(palette, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )

    # ---- flags.css --------------------------------------------------------
    lines = [
        "/* ============================================================",
        "   Flag colour palette — generated by tools/build-flags.py",
        "   Do not edit by hand; edit the SPEC table in that script.",
        "",
        "   Each country exposes its official colours both by role",
        "   (--flag-gb-navy) and by prominence (--flag-gb-1), so a tint",
        "   can be pulled generically without knowing the flag.",
        "   ============================================================ */",
        "",
        ":root{",
    ]
    for code, spec in sorted(SPEC.items()):
        lines.append(f"  /* {spec['name']} — {spec['flag']} ({spec['authority']}) */")
        for i, (n, h, r) in enumerate(spec["palette"], start=1):
            lines.append(f"  --flag-{code}-{n}:{h};")
            lines.append(f"  --flag-{code}-{i}:{h};")
        lines.append("")
    lines.append("}")

    # Scoping hook: any element tagged data-country="gb" republishes that
    # flag's colours as generic --flag-1..n, so a component can style itself
    # from the palette without hard-coding a country.
    lines += ["", "/* generic aliases, scoped by country */"]
    for code, spec in sorted(SPEC.items()):
        aliases = ";".join(
            f"--flag-{i}:var(--flag-{code}-{i})"
            for i in range(1, len(spec["palette"]) + 1)
        )
        lines.append(f'[data-country="{code}"]{{{aliases}}}')
    (pathlib.Path("assets/css") / "flags.css").write_text(
        "\n".join(lines) + "\n", encoding="utf-8"
    )

    print("\n".join(report))
    print(f"\nwrote {FLAG_DIR/'palette.json'} and assets/css/flags.css")


if __name__ == "__main__":
    main()
