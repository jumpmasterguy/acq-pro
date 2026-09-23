"""Render brand/acqlerate-lockup-light.png: icon + Acq/lerate wordmark on transparent, for
light backgrounds (Excel headers, docs). Run: python3 scripts/pack3/make_lockup_png.py"""
from playwright.sync_api import sync_playwright
from pathlib import Path
root=Path(__file__).resolve().parents[2]
html=f"""<html><head><style>
@font-face {{ font-family:'General Sans'; font-weight:700; src:url('{(root/'client/public/fonts/GeneralSans-Bold.woff2').as_uri()}') format('woff2'); }}
body{{margin:0;background:transparent}}
.l{{display:inline-flex;align-items:center;gap:14px;padding:4px 6px}}
.l img{{width:56px;height:56px}}
.w{{font-family:'General Sans';font-weight:700;font-size:40px;letter-spacing:-0.02em;color:#0F172A;line-height:1}}
.w span{{color:#01696F}}
</style></head><body><div class="l" id="l"><img src="{(root/'brand/acqlerate-icon.svg').as_uri()}"><span class="w">Acq<span>lerate</span></span></div></body></html>"""
Path('/tmp/acq-lockup.html').write_text(html)
with sync_playwright() as p:
    b=p.chromium.launch(); pg=b.new_page(device_scale_factor=2)
    pg.goto('file:///tmp/acq-lockup.html'); pg.evaluate('document.fonts.ready'); pg.wait_for_timeout(300)
    pg.locator('#l').screenshot(path=str(root/'brand/acqlerate-lockup-light.png'), omit_background=True)
    b.close()
