"""Build the pack guide PDFs (packs 1, 2 and 4) and brand them.

    python3 scripts/pack-guides/build_pack_guides.py

Each builder writes a standalone HTML file; this renders it with WeasyPrint,
stamps the logo watermark on every page (scripts/brand/pdf_brand.py), and copies
the result to the public product folder and its twin under products/.
Pack 3 has its own builder (scripts/pack3/build_pack3_pdfs.py).
"""
from __future__ import annotations

import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

from weasyprint import HTML

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
sys.path.insert(0, str(ROOT / "scripts" / "brand"))
from pdf_brand import stamp  # noqa: E402

GUIDES = [
    ("build_pack1_guide.py", "pack1_guide_v2.html",
     ["client/public/products/pack1-pm-essentials/pack-guide.pdf", "products/pack1-pm-essentials/pack-guide.pdf"]),
    ("build_pack2_guide.py", "pack2_guide.html",
     ["client/public/products/pack2-proposal-toolkit/pack-guide.pdf", "products/pack2-proposal-toolkit/pack-guide.pdf"]),
    ("build_cpars_guide.py", "cpars_guide.html",
     ["client/public/products/pack4-cpars-playbook/pack-guide.pdf"]),
]


def main() -> None:
    for script, html_name, targets in GUIDES:
        with tempfile.TemporaryDirectory() as tmp:
            subprocess.run([sys.executable, str(HERE / script)], cwd=tmp, check=True,
                           stdout=subprocess.DEVNULL)
            pdf = Path(tmp) / "guide.pdf"
            HTML(str(Path(tmp) / html_name)).write_pdf(pdf)
            stamp(pdf)
            for t in targets:
                dest = ROOT / t
                dest.parent.mkdir(parents=True, exist_ok=True)
                shutil.copyfile(pdf, dest)
                print("wrote", t)


if __name__ == "__main__":
    main()
