"""Render the brand PNGs the PDF generators use.

    python3 scripts/brand/make_brand_pngs.py

Writes, from the master icon and the General Sans Bold wordmark (never redrawn
by hand):

  brand/acqlerate-lockup-light-print.png   icon + "Acq" navy / "lerate" teal, for light pages
  brand/acqlerate-lockup-dark-print.png    icon + "Acq" white / "lerate" #4FC3CB, for navy pages
  brand/acqlerate-watermark.png      the light lockup at 7% opacity, stamped on light PDF pages
  brand/acqlerate-watermark-dark.png the dark lockup at 7% opacity, stamped on navy PDF pages

All are rendered at 4x so they stay sharp in print. (brand/acqlerate-lockup-light.png,
the 2x lockup the Excel builders size by pixel, is made by scripts/pack3/make_lockup_png.py
and is deliberately left alone here.) The wordmark spec
matches the site and the pack 3 / starter kit templates: General Sans 700,
letter-spacing -0.02em, icon-to-word gap 0.35 of the icon size.
"""
from __future__ import annotations

from pathlib import Path

from PIL import Image
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[2]
BRAND = ROOT / "brand"
FONT = ROOT / "client" / "public" / "fonts" / "GeneralSans-Bold.woff2"
ICON = BRAND / "acqlerate-icon.svg"

WATERMARK_OPACITY = 0.07

STYLES = {
    "light": ("#0F172A", "#01696F"),
    "dark": ("#FFFFFF", "#4FC3CB"),
}


def page_html(acq: str, lerate: str) -> str:
    return f"""<!doctype html><html><head><style>
@font-face {{ font-family: 'General Sans'; font-weight: 700; src: url('{FONT.as_uri()}') format('woff2'); }}
html, body {{ margin: 0; background: transparent; }}
.l {{ display: inline-flex; align-items: center; gap: 20px; padding: 2px; }}
.l img {{ width: 58px; height: 58px; display: block; }}
.w {{ font-family: 'General Sans'; font-weight: 700; font-size: 44px; letter-spacing: -0.02em;
      line-height: 1; color: {acq}; }}
.w span {{ color: {lerate}; }}
</style></head><body><div class="l" id="l"><img src="{ICON.as_uri()}"><span class="w">Acq<span>lerate</span></span></div></body></html>"""


def main() -> None:
    tmp = BRAND / ".lockup-tmp.html"
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(device_scale_factor=4)
        for name, (acq, lerate) in STYLES.items():
            tmp.write_text(page_html(acq, lerate))
            page.goto(tmp.as_uri())
            page.evaluate("document.fonts.ready")
            page.wait_for_timeout(300)
            out = BRAND / f"acqlerate-lockup-{name}-print.png"
            page.locator("#l").screenshot(path=str(out), omit_background=True)
            print("wrote", out.relative_to(ROOT), Image.open(out).size)
        browser.close()
    tmp.unlink(missing_ok=True)

    # Two watermarks: the light-page one is the navy/teal logo, the dark-page one the
    # white/cyan logo, so the full name shows whatever the page colour.
    for src, name in (("light", "acqlerate-watermark.png"), ("dark", "acqlerate-watermark-dark.png")):
        im = Image.open(BRAND / f"acqlerate-lockup-{src}-print.png").convert("RGBA")
        im.putalpha(im.getchannel("A").point(lambda a: int(a * WATERMARK_OPACITY)))
        out = BRAND / name
        im.save(out, optimize=True)
        print("wrote", out.relative_to(ROOT), im.size)


if __name__ == "__main__":
    main()
