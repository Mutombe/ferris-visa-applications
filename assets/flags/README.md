# Flag repository

14 countries × 2 aspect variants = 28 self-contained SVGs, plus a machine-readable
colour palette.

```
assets/flags/
  4x3/<code>.svg      # UI standard — used everywhere on the site
  1x1/<code>.svg       # square variant, for avatars/favicons/list bullets
  palette.json         # official colours, ratios and issuing authority
  LICENSE              # flag-icons, MIT
assets/css/flags.css   # generated — the palette as CSS custom properties
tools/build-flags.py   # the generator; edit SPEC here, never the outputs
```

## Coverage

| Code | Country | Official ratio | Colours |
|---|---|---|---|
| `gb` | United Kingdom | 1:2 | 3 |
| `eu` | European Union | 2:3 | 2 |
| `us` | United States | 10:19 | 3 |
| `ca` | Canada | 1:2 | 2 |
| `ae` | United Arab Emirates | 1:2 | 4 |
| `au` | Australia | 1:2 | 3 |
| `jp` | Japan | 2:3 | 2 |
| `cn` | China | 2:3 | 2 |
| `in` | India | 2:3 | 4 |
| `za` | South Africa | 2:3 | 6 |
| `tr` | Türkiye | 2:3 | 2 |
| `sg` | Singapore | 2:3 | 2 |
| `br` | Brazil | 7:10 | 4 |
| `nz` | New Zealand | 1:2 | 3 |

## Colour accuracy

Artwork comes from [flag-icons](https://github.com/lipis/flag-icons) 7.5.0 (MIT).
That set ships a few legacy approximations, so `tools/build-flags.py` rewrites
every fill to the value the issuing authority actually publishes. Corrections
applied:

| Flag | Was | Now | Why |
|---|---|---|---|
| `au` | `darkblue`, `red` | `#012169`, `#E4002B` | Pantone 280 C / 185 C per PM&C |
| `us` | `#BD3D44`, `#192F5D` | `#B31942`, `#0A3161` | Old Glory Red/Blue, EO 10834 |
| `in` | `#128807`, `#008` | `#138808`, `#000080` | IS 1:1968 (BIS) |
| `za` | 4 approximations | `#007A4D` `#FFB612` `#DE3831` `#002395` | Bureau of Heraldry |
| `br` | `#229E45`, `#F8E509`, `#2B49A3` | `#009C3B`, `#FFDF00`, `#002776` | Lei 5.700/1971 |
| `sg` | `#DF0000` | `#EF3340` | Pantone 032 C |
| `nz` | Union Flag colours in canton | `#00247D`, `#CC142B` | NZ specifies its own throughout |
| `ae`, `za` | `#000001` | `#000000` | true black |

`gb`, `eu`, `ca`, `cn`, `jp`, `tr` already matched their specification and were
left untouched. A build-time check asserts every colour in every file appears in
that country's declared palette, and vice versa.

Two judgement calls worth knowing about: Canada's red is kept at `#D52B1E` and
China's at `#EE1C25`, because both have competing "official" sRGB renderings and
these are the most widely used. Both are noted in `palette.json`.

## Aspect ratio

Real flags vary from 1:2 (UK) to 10:19 (US). The artwork is normalised to **4:3**
so flags align on a consistent UI grid — the standard trade-off for interface flag
sets. Each country's true ratio is recorded in `palette.json` as `officialRatio`.

## Using the palette

`flags.css` publishes every colour twice — by role and by prominence:

```css
--flag-gb-navy: #012169;   --flag-gb-1: #012169;
--flag-gb-white: #FFFFFF;  --flag-gb-2: #FFFFFF;
--flag-gb-red: #C8102E;    --flag-gb-3: #C8102E;
```

Tag any element with `data-country` and those colours become available generically
as `--flag-1`, `--flag-2`, … so a component can theme itself without knowing which
country it is showing:

```html
<div class="tile" data-country="gb">…</div>
```
```css
.tile[data-country]{ --tile-accent: var(--flag-1); }
```

That is how the destination tiles derive their hover accent.

## Markup

```html
<span class="flag-chip">
  <span class="flag-frame">
    <img class="flag" src="assets/flags/4x3/gb.svg"
         alt="Flag of United Kingdom" width="40" height="30" loading="lazy">
  </span>
  <span class="code">GB</span>
</span>
```

`.flag-frame` supplies the rounded mask and a hairline — without it, white-heavy
flags (Japan, Singapore, Canada) dissolve into a pale surface. Add
`.flag-frame--onDark` over the green bands, and `--sm` / `--lg` for 22px / 44px.

## Where flags appear

- Destination tiles — `index.html`, `destinations.html` (44px, on dark)
- Wider-coverage table — `destinations.html` (30px, on light)
- Live preview beside the destination `<select>` — hero finder, `contact.html`,
  `apply.html`. Native `<option>` cannot contain an image, so the flag renders
  next to the control and swaps on change (see `main.js`).

## Adding a country

1. Copy its SVG into `4x3/` and `1x1/` from flag-icons.
2. Add an entry to `SPEC` in `tools/build-flags.py` with the official palette.
3. Run `python tools/build-flags.py` — it rewrites the artwork and regenerates
   `palette.json` and `flags.css`.

## Licence

Flag artwork: flag-icons, MIT © 2013 Panayiotis Lipiridis — see `LICENSE`.
