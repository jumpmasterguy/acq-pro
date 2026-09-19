# Acqlerate app icon — Option A (soft depth)

Generated 2026-09-19. Mark geometry unchanged from the original: flat-top outer
hexagon, inner hexagon rotated 30 degrees at 0.472 of the outer, centre dot.

## What to ship where

| File | Use |
|---|---|
| `acqlerate-icon.svg` | Master. Rounded tile. Use anywhere that scales. |
| `acqlerate-icon-square.svg` | Square master, no corner rounding. |
| `acqlerate-icon-1024.png` | General purpose largest raster. |
| `ios-app-store-1024.png` | App Store / iOS submission. Square — iOS applies its own mask. |
| `apple-touch-icon.png` | 180px. `<link rel="apple-touch-icon">` |
| `icon-192.png` / `acqlerate-icon-512.png` | PWA manifest. |
| `icon-maskable-512.png` | PWA `"purpose": "maskable"`. Mark pulled to 72% so a circle crop is safe. |
| `favicon.ico` | 48 + 32 + 16 in one file. |
| `favicon-16/32/48.png` | Individual sizes if you prefer PNG favicons. |
| `acqlerate-favicon.svg` | Simplified SVG favicon — outer hexagon and dot only. |
| `acqlerate-mark-only.svg` | Mark on transparent, for dark surfaces and the sidebar. |

The favicon files drop the inner hexagon on purpose. Below about 32px it closes
up into a blob and costs legibility rather than adding detail.

## HTML

```html
<link rel="icon" href="/favicon.ico" sizes="48x48">
<link rel="icon" href="/acqlerate-favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">
```

```json
{ "icons": [
  { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
  { "src": "/acqlerate-icon-512.png", "sizes": "512x512", "type": "image/png" },
  { "src": "/icon-maskable-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
]}
```

## Specification

Tile
- Radius 22.37% of size (229px on the 1024 master)
- Background: linear-gradient(155deg, #0b868c 0%, #01696f 47%, #063c46 100%)
- Bloom: radial 78% 68% at 46% 30%, rgba(126,207,214,.30) to transparent
- Top rim: inset 0 1px 0 rgba(255,255,255,.38)
- Bottom shade: inset 0 -2px 6px rgba(0,20,24,.40), scaled with size

Mark — 92% of the tile, optically centred, 200-unit viewBox
- Outer hexagon: flat-top, R92, centre 100,100
- Inner hexagon: rotated 30 degrees, R43.4
- Stroke widths: outer 13, inner 11, dot r11 (about 6% of tile width)
- Joins and caps: round

Line build, bottom to top
1. Occlusion rim — width +2.8, #023f47 at 55%, offset 0.4 / 0.9
2. Shaded lip — full width, #5d9aa2 to #3d7c86, offset 1.8 / 2.3
3. Body — #ffffff to #f6fdfe to #ddf2f5 to #a5d4db at 138 degrees
4. Specular — 0.38 width, white fading to 10%, offset -1.1 / -1.7

Cast shadow: dx 0.6, dy 4.6, blur 4.2, #01262c at 52%

One light source throughout: upper left, shadow down and slightly right.

## Brand colours used

#01696f acq-teal · #0b868c lighter teal · #063c46 deep teal · #7ecfd6 cyan-soft

---

## Where these ship in this repo (added 19 Sep 2026)

The repo keeps its own filenames so every existing reference — emails already
sent, the manifest, index.html, landing.html, the native projects — keeps
working. Mapping from the pack:

| Pack file | Shipped as |
|---|---|
| `favicon.ico` | `client/public/favicon.ico` |
| `favicon-16/32/48.png` | `client/public/favicon-{16,32,48}x{16,32,48}.png` |
| `icon-192.png` | `client/public/icon-192x192.png`, `favicon-192x192.png` |
| `acqlerate-icon-512.png` | `client/public/icon-512x512.png` |
| `acqlerate-icon-1024.png` | `client/public/icon-1024x1024.png` |
| `icon-maskable-512.png` | `client/public/icon-maskable-512.png` |
| `apple-touch-icon.png` | `client/public/apple-touch-icon.png` (180) |
| — (resized from 1024) | `client/public/apple-touch-icon-{57,72,76,114,120,144,152,167}x*.png` |
| `acqlerate-icon.svg` | `client/public/acqlerate-icon.svg` |
| `acqlerate-favicon.svg` | `client/public/favicon.svg` |
| `acqlerate-mark-only.svg` | `client/public/acqlerate-mark.svg` |
| `ios-app-store-1024.png` | `ios/.../AppIcon.appiconset/AppIcon-512@2x.png` |

Also derived here:
- `client/public/acqlerate-logo.svg` — wordmark lockup; the mark is the master
  SVG nested at 100x100, the "Acql/erate" text is unchanged.
- Android `mipmap-*/ic_launcher.png` (rounded tile) and `ic_launcher_round.png`
  (circle crop of the maskable art), at 48/72/96/144/192.
- Android `mipmap-*/ic_launcher_foreground.png` — mark only on transparent, at
  60% of the 108dp canvas so the circle crop is safe. Background is now
  `drawable/ic_launcher_background.xml`, a gradient matching the tile.
- iOS + Android splash screens — new mark on the unchanged #01696F, at the same
  20.4%-of-short-edge scale the previous splash used.

`client/src/components/AcqlerateLogo.tsx` renders `/acqlerate-icon.svg` via
`<img>` rather than redrawing the mark inline, so the in-app logo can't drift
from the favicon again.

Regenerate rasters from these masters; don't hand-edit the PNGs.
