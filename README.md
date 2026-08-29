# Ferris Visa Consultants — website

Static site. No build step, no dependencies. Open `index.html` or serve the
folder with any static server:

```bash
python -m http.server 8124
```

## Pages

| File | Purpose |
|---|---|
| `index.html` | Home — hero + glass eligibility finder, services, process, destinations, testimonials, FAQ |
| `services.html` | Six visa services and the full pricing table |
| `destinations.html` | Six core destinations plus the wider coverage table |
| `about.html` | Story, operating principles, team, milestones |
| `contact.html` | Contact routes, enquiry form, quick-answer FAQ |
| `apply.html` | Application form (prefills from the home page finder via query string) |

## Brand palette

Sampled directly from `logos/ferris-visa-applications.png`:

| Token | Hex | Use |
|---|---|---|
| `--forest-900` | `#012C18` | Logo ground, nav glass, footer, dark bands, primary buttons |
| `--cream` | `#FFF9F3` | Logo wordmark, page sheet, text on dark |
| `--amber` | `#FFAA1C` | Logo subline — accents, prices, primary CTA, stat figures |

Supporting tints (`--forest-700/600`, `--cream-2`, `--ink`, `--body`, `--muted`)
are derived from those three and declared at the top of `assets/css/styles.css`.

## Type system

Fluid modular scale, roughly a perfect fourth at the display end easing to a
major third at the small end. Every step is `clamp(min, <rem> + <vw>, max)` where
the middle term is the real interpolation slope between a 390px phone and the
1600px content column:

    slope     = (max - min) / (1600 - 390)
    intercept = min - slope x 390

Keeping a `rem` term in the preferred value (rather than pure `vw`) is what lets
browser zoom still scale the text — a pure-`vw` preferred value fails WCAG 1.4.4.

| Step | 390px | 1600px+ |
|---|---|---|
| display | 44 | 92 |
| h1 | 38 | 68 |
| h2 | 31 | 52 |
| **stat** | **34** | **72** |
| h3 | 18 | 25 |
| lead | 17 | 21 |
| body | 17 | 18 |
| small | 14 | 15.5 |

Line height tightens as size grows (1.0 display, 1.1–1.25 headings, 1.5–1.65
reading). Tracking follows the same curve: body stays at `normal`, all-caps
labels open to +0.13em, and only display-size type takes negative tracking
(−0.02 to −0.038em).

Statistics, prices and any counting figure use `font-variant-numeric:
tabular-nums lining-nums` so digits share one advance width — the count-up
animation cannot reflow its own layout mid-count, and columns of figures align.

## Hero treatment

The hero photograph carries no flat overlay. Legibility comes from directional
gradients in warm black (`rgba(10,8,5)` rather than neutral or green), so the
picture stays clean where it matters:

- **desktop** — a left-to-right scrim under the copy that fades out by 80%
  across, plus a gentle bottom-up lift and an off-centre vignette
- **mobile** — a bottom-up cinematic gradient, since the copy sits over the
  middle of the frame

Warmth is baked into the JPEGs themselves (red lifted ~4.5%, blue pulled ~3%,
saturation +7%) rather than applied as a CSS filter, which keeps paint cost off
a full-bleed hero. Glassmorphism is reserved for elements that sit *on* the
photograph (nav, the eligibility finder), never as a panel behind the headline.

## Design language

Taken from the two supplied references:

- **Floating white sheet** over a fixed, darkened photographic backdrop
  (`.backdrop` + `.shell` + `.sheet`) — the Marwa template's core device.
- **Glassmorphism** on the nav pill, hero finder, card tags, destination tiles
  and the floating captions over imagery: `backdrop-filter: blur() saturate()`
  with a translucent fill and a 1px light border.
- **Image cards** with a bottom gradient, a category chip and a circular arrow
  badge — the tour-package card pattern.
- **Pill eyebrows**, large tight-tracked headings, generous white space.

Type is Plus Jakarta Sans throughout (Google Fonts).

## Logo files

`assets/logos/` holds the supplied marks plus two generated variants:

- `wordmark-cream.png` / `wordmark-forest.png` — the "ferris" wordmark cropped
  away from the subline, so the nav can set "VISA APPLICATIONS" as live text at
  a legible size. The full supplied lockup is used in the footer.

## Flags

`assets/flags/` is a self-contained repository of 14 country flags (SVG, 4:3 and
1:1) with a machine-readable colour palette in `palette.json` and CSS custom
properties in `assets/css/flags.css`. Artwork is flag-icons (MIT), recoloured to
each issuing authority's published specification by `tools/build-flags.py`.

See `assets/flags/README.md` for coverage, the colour corrections applied, and
how to add a country.

## Known follow-ups

1. **The client-story reviews are placeholder content.** The section is built
   to display genuine Google reviews via the Google Places API
   (`place details -> reviews[]`). The three names, the wording, the dates and
   the 4.9 / 312 aggregate are invented. Publishing fabricated reviews
   attributed to Google breaches Google's own policies, the UK DMCC Act 2024
   and the US FTC rule on consumer reviews, so this must be wired to real data
   before launch. There is a comment marking the block in `index.html`.
2. **The photographs are watermarked iStock previews, and now much more
   visible.** Removing the heavy scrim from the hero means the watermark reads
   clearly. Every image in
   `assets/img/` carries a visible "iStock / Credit:" watermark. Licensed
   copies need to be dropped in over the same filenames before this goes live.
3. **The forms are front-end only.** `contact.html` and `apply.html` validate
   and show a success state, but nothing is sent anywhere — wire them to a form
   endpoint or a backend.
4. **Flags in native `<select>`s** render beside the control, not inside the
   options — an `<option>` cannot contain an image. A custom listbox would be
   needed to put flags in the dropdown itself.
5. **Placeholder content:** phone number, email, Chancery Lane address, prices,
   approval rates, processing times and testimonials are all invented and need
   replacing with real figures. Footer legal links (`#`) need real pages.
