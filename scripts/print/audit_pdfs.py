"""Check every PDF in the repo against the Acqlerate print rules.

    python3 scripts/print/audit_pdfs.py

For each tracked PDF it checks:
  * no em dashes in the text
  * the name never appears as "ACQLERATE" (spaced or not)
  * every embedded font is General Sans (DejaVu Sans allowed for missing symbols)
  * the logo watermark marker is present (pdf_brand.stamp ran)
  * footer page numbers match the real page ("acqlerate.com · N" on page N)
Exit code 1 if anything fails.
"""
from __future__ import annotations

import re
import subprocess
import sys
from pathlib import Path

import pymupdf

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "scripts" / "brand"))
from pdf_brand import MARKER  # noqa: E402

PAGE_NO = re.compile(r"acqlerate\.com\s*·\s*(\d+)")


def tracked_pdfs() -> list[Path]:
    out = subprocess.run(["git", "ls-files", "*.pdf"], cwd=ROOT, capture_output=True, text=True).stdout
    return [ROOT / p for p in out.split() if "node_modules" not in p]


def fonts(path: Path) -> set[str]:
    """Embedded font names from pdffonts (Chromium embeds General Sans as Type 3,
    which PyMuPDF reports without a name)."""
    out = subprocess.run(["pdffonts", str(path)], capture_output=True, text=True).stdout
    return {re.sub(r"^[A-Z]{6}\+", "", line.split()[0]) for line in out.splitlines()[2:] if line.strip()}


def audit(path: Path) -> list[str]:
    problems = []
    doc = pymupdf.open(path)
    text_pages = [p.get_text() for p in doc]
    text = "\n".join(text_pages)
    if "—" in text:
        problems.append(f"{text.count('—')} em dash(es)")
    if re.search(r"A\s?C\s?Q\s?L\s?E\s?R\s?A\s?T\s?E", text):
        problems.append("spaced/all-caps ACQLERATE")
    # DejaVu Sans is the allowed fallback for the few symbols General Sans lacks
    # (arrows, check marks); anything else is a stray font.
    bad_fonts = sorted(f for f in fonts(path)
                       if "GeneralSans" not in f.replace(" ", "").replace("-", "") and not f.startswith("DejaVu"))
    if bad_fonts:
        problems.append(f"non-brand fonts {bad_fonts}")
    if MARKER not in (doc.metadata or {}).get("keywords", ""):
        problems.append("no watermark marker")
    for i, t in enumerate(text_pages, start=1):
        nums = [int(n) for n in PAGE_NO.findall(t)]
        if nums and nums[-1] != i:
            problems.append(f"page {i} footer says {nums[-1]}")
    doc.close()
    return problems


def main() -> None:
    failed = 0
    for path in tracked_pdfs():
        rel = path.relative_to(ROOT)
        probs = audit(path)
        if probs:
            failed += 1
            print(f"FAIL {rel}: " + "; ".join(probs))
        else:
            print(f"ok   {rel}")
    print(f"\n{failed} file(s) with problems")
    sys.exit(1 if failed else 0)


if __name__ == "__main__":
    main()
