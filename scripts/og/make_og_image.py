"""Render client/public/og-image.jpg (1200x627), the link-preview card used by
/app, the landing page and every blog post. Uses the master icon and the brand
font, so it can never drift from the site. No lesson or module counts on the
card on purpose: they change, and an image cannot be re-synced by sync-blog.

    python3 scripts/og/make_og_image.py
"""
from pathlib import Path
from playwright.sync_api import sync_playwright
from PIL import Image

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
html = (HERE / "og-image.html").read_text()
html = (html.replace("{{FONTS}}", (ROOT / "client/public/fonts").as_uri())
            .replace("{{ICON}}", (ROOT / "brand/acqlerate-icon.svg").as_uri())
            .replace("{{MARK}}", (HERE / "mark.svgfrag").read_text()))
tmp = Path("/tmp/acq-og.html"); tmp.write_text(html)
png = Path("/tmp/acq-og.png")
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(viewport={"width": 1200, "height": 627})
    pg.goto(tmp.as_uri()); pg.wait_for_load_state("networkidle"); pg.evaluate("document.fonts.ready"); pg.wait_for_timeout(200)
    pg.locator(".card").screenshot(path=str(png)); b.close()
out = ROOT / "client/public/og-image.jpg"
Image.open(png).convert("RGB").save(out, "JPEG", quality=90, optimize=True, progressive=True)
print("wrote", out, Image.open(out).size)
