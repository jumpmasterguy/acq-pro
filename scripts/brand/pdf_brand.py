"""Brand every Acqlerate PDF page with a faint logo watermark.

    from scripts.brand.pdf_brand import stamp      # or import by path
    stamp("in.pdf", "out.pdf")

    python3 scripts/brand/pdf_brand.py file.pdf [more.pdf ...]   # stamps in place

The watermark is the full logo at 7% opacity (made by make_brand_pngs.py),
centred on every page at 56% of the page width and drawn above the content so a
copy cannot drop it by removing a background. Light pages get the navy/teal
logo, dark pages (covers) the white/cyan one, judged from the page's own pixels
under the watermark. Each image is embedded once per file and reused.

A file that already carries the watermark is left alone (the marker lives in
the PDF keywords), so running this twice never doubles it. Generators call
stamp() on their fresh output before any encryption step.
"""
from __future__ import annotations

import os
import sys
import tempfile
from pathlib import Path

import pymupdf

ROOT = Path(__file__).resolve().parents[2]
WATERMARK = ROOT / "brand" / "acqlerate-watermark.png"
WATERMARK_DARK = ROOT / "brand" / "acqlerate-watermark-dark.png"
MARKER = "acqlerate-watermark-v1"
WIDTH_FRACTION = 0.56


def is_dark(page: "pymupdf.Page", rect: "pymupdf.Rect") -> bool:
    """True when the area under the watermark is mostly dark (a navy cover)."""
    pix = page.get_pixmap(clip=rect, dpi=24, colorspace=pymupdf.csGRAY, alpha=False)
    data = pix.samples
    return bool(data) and sum(data) / len(data) < 100


def is_stamped(doc: "pymupdf.Document") -> bool:
    return MARKER in (doc.metadata or {}).get("keywords", "")


def stamp(src: str | os.PathLike, dst: str | os.PathLike | None = None) -> bool:
    """Watermark every page of src into dst (default: in place). Returns False if already stamped."""
    src = Path(src)
    dst = Path(dst) if dst else src
    doc = pymupdf.open(src)
    if is_stamped(doc):
        doc.close()
        if dst != src:
            dst.write_bytes(src.read_bytes())
        return False

    from PIL import Image
    w_px, h_px = Image.open(WATERMARK).size
    xrefs = {}
    for page in doc:
        box = page.rect
        w = box.width * WIDTH_FRACTION
        h = w * h_px / w_px
        x0 = box.x0 + (box.width - w) / 2
        y0 = box.y0 + (box.height - h) / 2
        rect = pymupdf.Rect(x0, y0, x0 + w, y0 + h)
        img = WATERMARK_DARK if is_dark(page, rect) else WATERMARK
        if img in xrefs:
            page.insert_image(rect, xref=xrefs[img], overlay=True)
        else:
            xrefs[img] = page.insert_image(rect, filename=str(img), overlay=True)

    meta = dict(doc.metadata or {})
    keywords = [k for k in (meta.get("keywords") or "").split(",") if k.strip()]
    keywords.append(MARKER)
    meta["keywords"] = ", ".join(k.strip() for k in keywords)
    if not meta.get("author"):
        meta["author"] = "Acqlerate"
    doc.set_metadata(meta)

    fd, tmp = tempfile.mkstemp(suffix=".pdf", dir=str(dst.parent))
    os.close(fd)
    doc.save(tmp, garbage=3, deflate=True)
    doc.close()
    os.replace(tmp, dst)
    return True


if __name__ == "__main__":
    for arg in sys.argv[1:]:
        print(("stamped " if stamp(arg) else "already stamped ") + arg)
