#!/usr/bin/env python3
"""
Build the two free Acquisition Starter Kits (the homepage lead magnet).

    python3 scripts/starter-kit/build_starter_kits.py            # both editions
    python3 scripts/starter-kit/build_starter_kits.py usg        # just one

Writes client/public/starter-kit-usg.pdf and starter-kit-contractor.pdf, the
public URLs the homepage form and the welcome email link to. The download link
always serves the current file, so rebuilding updates everyone.

Same pipeline and design as the Finance Cheat Sheets (scripts/pack3): headless
Chromium via Playwright, the General Sans brand font, the master SVG icon, a
tiled watermark, and PDF permissions that allow printing but not editing.

Course counts (modules, lessons, CLPs) come from shared/courseTotals.generated.json,
which `npm run build` regenerates from curriculum.ts. Run a build first if the
curriculum changed, then rebuild the kits.

The build fails if any page's content runs into its footer, so a long edit
cannot silently push text off the page.

When a fact moves (CMMC Phase 2 date, the next FAR overhaul rule set, a new
threshold), edit the template, bump CHECKED, and rebuild.
"""
from __future__ import annotations

import json
import secrets
import sys
from pathlib import Path

import pikepdf
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[2]
HERE = Path(__file__).resolve().parent
TPL = HERE / "templates"
BASE_CSS = ROOT / "scripts/pack3/templates/base.css"
FONT_DIR = ROOT / "client/public/fonts"
ICON = ROOT / "brand/acqlerate-icon.svg"
OUT = ROOT / "client/public"
TOTALS = ROOT / "shared/courseTotals.generated.json"

EDITION = "September 2026"
CHECKED = "28 September 2026"      # the "status as of" date printed on page 2

DOCS = {
    "usg": ("starter-kit-usg.pdf", "usg.html", "Government edition",
            "The Acquisition Starter Kit (Government Edition)",
            "How DoD buys in 2026: pathways, milestones, thresholds, acronyms and the five mistakes new PMs make."),
    "contractor": ("starter-kit-contractor.pdf", "contractor.html", "Contractor edition",
                   "The Contractor's Acquisition Starter Kit",
                   "How the government buys in 2026, who buys, the terms evaluators notice, and the mistakes that cost contractors."),
}

FOOTER = """<div class="footer">
    <div class="lockup small"><img src="{icon}" alt=""><span class="word">Acq<span>lerate</span></span></div>
    <div class="sources">Acquisition Starter Kit · {edition_label} · {edition} · Educational reference, not official guidance</div>
    <div class="pg">acqlerate.com · {pg}</div>
  </div>"""


def render_html(name: str) -> str:
    _, tpl, edition_label, title, _ = DOCS[name]
    css = BASE_CSS.read_text().replace("{{FONT_DIR}}", FONT_DIR.as_uri())
    css += "\n" + (TPL / "kit.css").read_text()
    html = (TPL / tpl).read_text()
    totals = json.loads(TOTALS.read_text())
    reps = {
        "{{CSS}}": css,
        "{{TITLE}}": title,
        "{{ICON}}": ICON.as_uri(),
        "{{EDITION}}": EDITION,
        "{{CHECKED}}": CHECKED,
        "{{MODULES}}": str(totals["modules"]),
        "{{MODULES_WORD}}": totals["modulesWord"],
        "{{LESSONS}}": str(totals["lessons"]),
        "{{CLPS}}": f'{totals["clps"]:.1f}',
        "{{CLPS_WHOLE}}": str(totals["clpsWhole"]),
        "{{HOURS}}": str(round(totals["hours"])),
    }
    for k, v in reps.items():
        html = html.replace(k, v)
    # Number the pages: the cover is page 1, so the first footer is page 2.
    pg = 1
    while "{{FOOTER}}" in html:
        pg += 1
        html = html.replace("{{FOOTER}}", FOOTER.format(icon=ICON.as_uri(), edition_label=edition_label,
                                                        edition=EDITION, pg=pg), 1)
    left = [t for t in ("{{",) if t in html]
    if left:
        raise SystemExit(f"{name}: unreplaced placeholder in template")
    return html


OVERFLOW_JS = """
() => {
  const bad = [];
  document.querySelectorAll('section.page').forEach((pg, i) => {
    const foot = pg.querySelector('.footer');
    const limit = foot ? foot.getBoundingClientRect().top - 4 : pg.getBoundingClientRect().bottom - 30;
    let maxBottom = 0, culprit = null;
    pg.querySelectorAll('*').forEach(el => {
      if (el.closest('.footer') || el.classList.contains('watermark')) return;
      const r = el.getBoundingClientRect();
      if (r.height === 0) return;
      if (r.bottom > maxBottom) { maxBottom = r.bottom; culprit = el; }
    });
    if (maxBottom > limit) bad.push({ page: i + 1, over: Math.round(maxBottom - limit), text: (culprit.textContent || '').trim().slice(0, 70) });
  });
  return bad;
}
"""


def protect(src: Path, dst: Path, title: str, subject: str) -> None:
    with pikepdf.open(src) as pdf:
        pdf.docinfo["/Title"] = f"{title} | Acqlerate"
        pdf.docinfo["/Subject"] = subject
        pdf.docinfo["/Author"] = "Acqlerate"
        pdf.docinfo["/Creator"] = "Acqlerate (acqlerate.com)"
        pdf.docinfo["/Keywords"] = "Acqlerate, defense acquisition, starter kit, acqlerate.com"
        with pdf.open_metadata() as meta:
            meta["dc:title"] = title
            meta["dc:creator"] = ["Acqlerate"]
            meta["dc:rights"] = "© 2026 Acqlerate. Free to share unaltered with branding intact. acqlerate.com"
        perms = pikepdf.Permissions(
            accessibility=True, extract=False,
            modify_annotation=False, modify_assembly=False, modify_form=False, modify_other=False,
            print_lowres=True, print_highres=True,
        )
        pdf.save(dst, encryption=pikepdf.Encryption(owner=secrets.token_urlsafe(24), user="", R=6, allow=perms))


def build(names: list[str], scratch: Path) -> None:
    scratch.mkdir(parents=True, exist_ok=True)
    problems = []
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(viewport={"width": 816, "height": 1056})
        for name in names:
            fname, _, _, title, subject = DOCS[name]
            html_path = scratch / f"{name}.html"
            html_path.write_text(render_html(name))
            page.goto(html_path.as_uri())
            page.wait_for_load_state("networkidle")
            page.evaluate("document.fonts.ready")
            bad = page.evaluate(OVERFLOW_JS)
            if bad:
                problems.append((name, bad))
                continue
            raw = scratch / f"{name}.raw.pdf"
            page.pdf(path=str(raw), width="8.5in", height="11in", print_background=True,
                     margin={"top": "0", "right": "0", "bottom": "0", "left": "0"})
            protect(raw, OUT / fname, title, subject)
            with pikepdf.open(OUT / fname) as pdf:
                print(f"built {fname}: {len(pdf.pages)} pages")
        browser.close()
    if problems:
        for name, bad in problems:
            for b in bad:
                print(f"OVERFLOW {name} page {b['page']}: {b['over']}px past the footer near: {b['text']!r}")
        sys.exit(1)


if __name__ == "__main__":
    wanted = sys.argv[1:] or list(DOCS)
    unknown = [n for n in wanted if n not in DOCS]
    if unknown:
        sys.exit(f"unknown: {unknown}; choose from {list(DOCS)}")
    build(wanted, Path("/tmp/starter-kit-build"))
