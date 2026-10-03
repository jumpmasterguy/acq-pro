"""One-time brand fix for the PDFs that have no generator in the repo.

    python3 scripts/brand/fix_legacy_pdfs.py

These were made in ReportLab before the repo existed, so they are corrected in
place: the off-brand text wordmark is removed (text only; backgrounds and art
are untouched) and the real logo lockup goes where it was, any replacement
line is set in General Sans, and every page gets the logo watermark
(pdf_brand.stamp). A file already fixed is skipped, so re-running is safe.

  govcon-onboarding-playbook.pdf  spaced-caps "ACQLERATE" on the cover -> logo;
                                  cover strapline loses its em dash
  how-your-pay-works.pdf          "Published by Acqlerate — Defense Acquisitions
                                  Academy" -> logo + "Defense Acquisitions Academy"
  examples/*.pdf (6)              footer "Acqlerate — Sample Document for Training
                                  Purposes Only" -> small logo + "Sample document
                                  for training purposes only"

Body text in these files still contains em dashes; changing body copy needs a
rebuild of the document, not a patch.
"""
from __future__ import annotations

import io
import os
import sys
import tempfile
from pathlib import Path

import pymupdf
from fontTools.ttLib import TTFont

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
sys.path.insert(0, str(HERE))
from pdf_brand import stamp  # noqa: E402

PUBLIC = ROOT / "client" / "public"
LOCKUP_DARK = ROOT / "brand" / "acqlerate-lockup-dark-print.png"
LOCKUP_LIGHT = ROOT / "brand" / "acqlerate-lockup-light-print.png"
FIX_MARKER = "acqlerate-brandfix-v1"


def ttf_from_woff2(name: str) -> bytes:
    font = TTFont(str(PUBLIC / "fonts" / name))
    font.flavor = None
    buf = io.BytesIO()
    font.save(buf)
    return buf.getvalue()


GS_REGULAR = ttf_from_woff2("GeneralSans-Regular.woff2")


def rgb(hexstr: str) -> tuple[float, float, float]:
    h = hexstr.lstrip("#")
    return tuple(int(h[i:i + 2], 16) / 255 for i in (0, 2, 4))


def find(page: "pymupdf.Page", text: str) -> "pymupdf.Rect":
    """The one text span on the page whose text is exactly `text` (case-sensitive)."""
    hits = [pymupdf.Rect(s["bbox"])
            for b in page.get_text("dict")["blocks"] for l in b.get("lines", [])
            for s in l["spans"] if s["text"].strip() == text]
    if len(hits) != 1:
        raise SystemExit(f"expected one {text!r} on page {page.number + 1}, found {len(hits)}")
    return hits[0]


def remove_text(page: "pymupdf.Page", rect: "pymupdf.Rect") -> None:
    page.add_redact_annot(rect)
    page.apply_redactions(images=pymupdf.PDF_REDACT_IMAGE_NONE,
                          graphics=pymupdf.PDF_REDACT_LINE_ART_NONE,
                          text=pymupdf.PDF_REDACT_TEXT_REMOVE)


def place_logo(page, png: Path, x: float, center_y: float, height: float) -> float:
    """Insert the lockup with its left edge at x, vertically centred; returns its right edge."""
    from PIL import Image
    w_px, h_px = Image.open(png).size
    width = height * w_px / h_px
    page.insert_image(pymupdf.Rect(x, center_y - height / 2, x + width, center_y + height / 2),
                      filename=str(png))
    return x + width


def write(page, x: float, baseline: float, text: str, size: float, color: str) -> None:
    page.insert_font(fontname="GenSans", fontbuffer=GS_REGULAR)
    page.insert_text((x, baseline), text, fontname="GenSans", fontsize=size, color=rgb(color))


def fix_onboarding(doc) -> None:
    cover = doc[0]
    r = find(cover, "ACQLERATE")
    remove_text(cover, r)
    place_logo(cover, LOCKUP_DARK, r.x0, (r.y0 + r.y1) / 2 - 1, 20)
    line = "A practical guide from Acqlerate — Defense Acquisitions Academy"
    r = find(cover, line)
    remove_text(cover, r)
    write(cover, r.x0, r.y1 - 3, "A practical guide from Acqlerate · Defense Acquisitions Academy", 10, "#88b0b3")


def fix_pay_guide(doc) -> None:
    cover = doc[0]
    r = find(cover, "Published by Acqlerate — Defense Acquisitions Academy")
    remove_text(cover, r)
    right = place_logo(cover, LOCKUP_DARK, r.x0, (r.y0 + r.y1) / 2 - 2, 17)
    write(cover, right + 10, r.y1 - 4, "Defense Acquisitions Academy", 10, "#999999")


def fix_example(doc) -> None:
    for page in doc:
        r = find(page, "Acqlerate — Sample Document for Training Purposes Only")
        remove_text(page, r)
        right = place_logo(page, LOCKUP_LIGHT, r.x0, (r.y0 + r.y1) / 2, 10)
        write(page, right + 7, r.y1 - 2.4, "Sample document for training purposes only", 7.5, "#7a7974")


JOBS = [("govcon-onboarding-playbook.pdf", fix_onboarding),
        ("how-your-pay-works.pdf", fix_pay_guide)] + [
       (f"examples/{p.name}", fix_example) for p in sorted((PUBLIC / "examples").glob("*.pdf"))]


def main() -> None:
    for rel, fix in JOBS:
        path = PUBLIC / rel
        doc = pymupdf.open(path)
        if FIX_MARKER in (doc.metadata or {}).get("keywords", ""):
            print("already fixed", rel)
            doc.close()
            continue
        fix(doc)
        meta = dict(doc.metadata or {})
        meta["keywords"] = ", ".join(k for k in [meta.get("keywords", "").strip(), FIX_MARKER] if k)
        meta["author"] = "Acqlerate"
        doc.set_metadata(meta)
        fd, tmp = tempfile.mkstemp(suffix=".pdf", dir=str(path.parent))
        os.close(fd)
        doc.save(tmp, garbage=3, deflate=True)
        doc.close()
        os.replace(tmp, path)
        stamp(path)
        print("fixed", rel)


if __name__ == "__main__":
    main()
