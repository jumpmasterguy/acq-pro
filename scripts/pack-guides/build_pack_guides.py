"""Build the pack guide PDFs (packs 1, 2 and 4) on the shared Acqlerate print system.

    python3 scripts/pack-guides/build_pack_guides.py            # all three
    python3 scripts/pack-guides/build_pack_guides.py pack1      # just one

Templates live in scripts/pack-guides/templates; rendering, cover and footer
styles, the logo watermark and file protection come from scripts/print/render.py.
Packs 1 and 2 are written to the served product folder and its twin under
products/; pack 4 only to the served folder.
Pack 3 has its own builder (scripts/pack3/build_pack3_pdfs.py).
"""
from __future__ import annotations

import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
sys.path.insert(0, str(ROOT / "scripts" / "print"))
from render import Doc, render_all  # noqa: E402

PUBLIC = ROOT / "client" / "public" / "products"
ARCHIVE = ROOT / "products"
EDITION = "September 2026"
REFLECTS = "Reflects FAC 2025-06"

DOCS = {
    "pack1": Doc(
        template=HERE / "templates" / "pack1-pm-essentials.html",
        outs=[PUBLIC / "pack1-pm-essentials" / "pack-guide.pdf",
              ARCHIVE / "pack1-pm-essentials" / "pack-guide.pdf"],
        title="PM Essentials: Pack Guide",
        subject="How to use every tab of the PM Essentials workbook and the PM Briefing Deck.",
        footer_label=f"PM Essentials · {EDITION} edition · {REFLECTS}",
        reps={"{{EDITION}}": EDITION},
    ),
    "pack2": Doc(
        template=HERE / "templates" / "pack2-proposal-toolkit.html",
        outs=[PUBLIC / "pack2-proposal-toolkit" / "pack-guide.pdf",
              ARCHIVE / "pack2-proposal-toolkit" / "pack-guide.pdf"],
        title="GovCon Proposal Toolkit: Pack Guide",
        subject="When to use each of the five proposal tools, and how.",
        footer_label=f"GovCon Proposal Toolkit · {EDITION} edition · {REFLECTS}",
        reps={"{{EDITION}}": EDITION},
    ),
    "pack4": Doc(
        template=HERE / "templates" / "pack4-cpars-playbook.html",
        outs=[PUBLIC / "pack4-cpars-playbook" / "pack-guide.pdf"],
        title="CPARS Playbook: Pack Guide",
        subject="How CPARS ratings get decided, and how to use each tab of the playbook.",
        footer_label=f"CPARS Playbook · {EDITION} edition · {REFLECTS}",
        reps={"{{EDITION}}": EDITION},
    ),
}

if __name__ == "__main__":
    wanted = sys.argv[1:] or list(DOCS)
    unknown = [w for w in wanted if w not in DOCS]
    if unknown:
        sys.exit(f"unknown: {unknown}; choose from {list(DOCS)}")
    render_all([DOCS[w] for w in wanted], scratch=Path("/tmp/acq-pack-guides-build"))
