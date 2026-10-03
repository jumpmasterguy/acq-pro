"""Render Acqlerate print templates into branded PDFs.

Every Acqlerate PDF built with headless Chromium goes through here, so they all
share one stylesheet (scripts/print/acq-print.css, from the design system), one
cover, one footer, the logo watermark and the same file protection.

    from render import Doc, render_all      # sys.path.insert(0, "scripts/print")
    render_all([Doc(template=..., outs=[...], title=..., subject=..., footer_label=...)])

Template rules (see any file in scripts/guides/templates for a full example):
  * one <section class="page portrait"> (or "landscape") per page; the first
    page is usually <section class="page portrait cover">
  * {{CSS}} inside <style>, {{ICON}} wherever the logo icon goes
  * {{FOOTER}} as the last line of every page except the cover; it becomes the
    standard footer with the page number of the section it sits in
  * any other {{KEY}} must be supplied in Doc.reps, or the build stops
  * no em dashes anywhere: the build stops if it finds one

The build also stops if any page's content runs into its footer.
"""
from __future__ import annotations

import re
import secrets
import shutil
import sys
from dataclasses import dataclass, field
from pathlib import Path

import pikepdf
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[2]
CSS = Path(__file__).resolve().parent / "acq-print.css"
FONT_DIR = ROOT / "client" / "public" / "fonts"
ICON = ROOT / "brand" / "acqlerate-icon.svg"

sys.path.insert(0, str(ROOT / "scripts" / "brand"))
from pdf_brand import stamp, MARKER  # noqa: E402

FOOTER = """<div class="footer">
    <div class="lockup small"><img src="{icon}" alt=""><span class="word">Acq<span>lerate</span></span></div>
    <div class="sources">{label}</div>
    <div class="pg">acqlerate.com · {pg}</div>
  </div>"""

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


@dataclass
class Doc:
    template: Path
    outs: list[Path]
    title: str
    subject: str
    footer_label: str
    reps: dict[str, str] = field(default_factory=dict)
    protect: bool = True
    keywords: str = "Acqlerate, defense acquisition, acqlerate.com"


def fill(doc: Doc) -> str:
    html = Path(doc.template).read_text()
    # Number footers by the page (section) they sit in. Done on the bare
    # template, before the stylesheet goes in, and only after <body>, so a
    # comment that mentions a page section can never shift the count.
    head, sep, body = html.partition("<body")
    if not sep:
        raise SystemExit(f"{doc.template.name}: no <body> tag")
    parts = re.split(r'(?=<section class="page)', body)
    out, pg = [], 0
    for part in parts:
        if part.startswith('<section class="page'):
            pg += 1
        out.append(part.replace("{{FOOTER}}", FOOTER.format(icon=ICON.as_uri(), label=doc.footer_label, pg=pg)))
    html = head + sep + "".join(out)
    css = CSS.read_text().replace("{{FONT_DIR}}", FONT_DIR.as_uri())
    reps = {"{{CSS}}": css, "{{ICON}}": ICON.as_uri(), **doc.reps}
    for k, v in reps.items():
        html = html.replace(k, v)
    left = sorted(set(re.findall(r"\{\{[A-Z0-9_]+\}\}", html)))
    if left:
        raise SystemExit(f"{doc.template.name}: unreplaced placeholders {left}")
    if "—" in html or "&mdash;" in html:
        raise SystemExit(f"{doc.template.name}: contains an em dash; rewrite the sentence")
    return html


RIGHTS = "© 2026 Acqlerate. Free to share unaltered with branding intact. acqlerate.com"


def brand_metadata(pdf: "pikepdf.Pdf", title: str, subject: str, keywords: str) -> None:
    """Title, author, subject, rights and keywords (with the watermark marker).

    XMP first, then the document info dictionary: closing open_metadata() syncs
    XMP over docinfo, so setting docinfo first silently loses the keywords."""
    full_title = title if title.endswith("| Acqlerate") else f"{title} | Acqlerate"
    if MARKER not in keywords:
        keywords = f"{keywords}, {MARKER}"
    with pdf.open_metadata(set_pikepdf_as_editor=False) as meta:
        meta["dc:title"] = full_title
        meta["dc:creator"] = ["Acqlerate"]
        meta["dc:description"] = subject
        meta["dc:rights"] = RIGHTS
        meta["pdf:Keywords"] = keywords
        meta["xmp:CreatorTool"] = "Acqlerate (acqlerate.com)"
    pdf.docinfo["/Title"] = full_title
    pdf.docinfo["/Subject"] = subject
    pdf.docinfo["/Author"] = "Acqlerate"
    pdf.docinfo["/Creator"] = "Acqlerate (acqlerate.com)"
    pdf.docinfo["/Keywords"] = keywords


def save_protected(pdf: "pikepdf.Pdf", dst: Path) -> None:
    """Printing allowed; editing and copying text out are not. No open password."""
    perms = pikepdf.Permissions(
        accessibility=True, extract=False,
        modify_annotation=False, modify_assembly=False, modify_form=False, modify_other=False,
        print_lowres=True, print_highres=True,
    )
    pdf.save(dst, encryption=pikepdf.Encryption(owner=secrets.token_urlsafe(24), user="", R=6, allow=perms))


def finish(raw: Path, dst: Path, doc: Doc) -> None:
    stamp(raw)
    with pikepdf.open(raw) as pdf:
        brand_metadata(pdf, doc.title, doc.subject, doc.keywords)
        if doc.protect:
            save_protected(pdf, dst)
        else:
            pdf.save(dst)


def render_all(docs: list[Doc], scratch: Path = Path("/tmp/acq-print-build")) -> None:
    scratch.mkdir(parents=True, exist_ok=True)
    problems = []
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(viewport={"width": 816, "height": 1056})
        for doc in docs:
            html = fill(doc)
            stem = Path(doc.template).stem
            html_path = scratch / f"{stem}.html"
            html_path.write_text(html)
            page.goto(html_path.as_uri())
            page.wait_for_load_state("networkidle")
            page.evaluate("document.fonts.ready")
            bad = page.evaluate(OVERFLOW_JS)
            if bad:
                problems.append((stem, bad))
                continue
            landscape = 'class="page landscape' in html
            w, h = ("11in", "8.5in") if landscape else ("8.5in", "11in")
            raw = scratch / f"{stem}.raw.pdf"
            page.pdf(path=str(raw), width=w, height=h, print_background=True,
                     margin={"top": "0", "right": "0", "bottom": "0", "left": "0"})
            first = Path(doc.outs[0])
            first.parent.mkdir(parents=True, exist_ok=True)
            finish(raw, first, doc)
            for extra in doc.outs[1:]:
                Path(extra).parent.mkdir(parents=True, exist_ok=True)
                shutil.copyfile(first, extra)
            with pikepdf.open(first) as pdf:
                print(f"built {first.relative_to(ROOT)}: {len(pdf.pages)} pages")
        browser.close()
    if problems:
        for stem, bad in problems:
            for b in bad:
                print(f"OVERFLOW {stem} page {b['page']}: {b['over']}px past the footer near: {b['text']!r}")
        sys.exit(1)
