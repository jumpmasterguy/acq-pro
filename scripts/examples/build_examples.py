"""Build the six example documents used in the lessons (client/public/examples).

    python3 scripts/examples/build_examples.py               # all six
    python3 scripts/examples/build_examples.py msr tdl       # some

They are realistic mock government documents with Acqlerate's commentary, built
on the shared print system (scripts/print/render.py). The lessons show page
images of them (client/public/examples/img/<key>-<page>.png at the size listed
in PREVIEWS); after a rebuild run with --previews to refresh those images.
"""
from __future__ import annotations

import subprocess
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
sys.path.insert(0, str(ROOT / "scripts" / "print"))
from render import Doc, render_all  # noqa: E402

EX = ROOT / "client" / "public" / "examples"
LABEL = "Sample document for training purposes only · All names, numbers and details are fictional"


def doc(key: str, fname: str, title: str, subject: str) -> Doc:
    return Doc(template=HERE / "templates" / f"{fname}.html", outs=[EX / f"{fname}.pdf"],
               title=title, subject=subject, footer_label=LABEL,
               keywords="Acqlerate, sample document, defense acquisition, acqlerate.com")


DOCS = {
    "cdrl": doc("cdrl", "example-cdrl-deliverables", "Example: Section F Contract Deliverables (CDRL)",
                "A sample Section F deliverables list with Acqlerate's commentary."),
    "cpaf": doc("cpaf", "example-cpaf-award-fee", "Example: Award Fee Determination Plan (CPAF)",
                "A sample award fee determination plan excerpt with Acqlerate's commentary."),
    "funding": doc("funding-page", "example-contract-funding-page", "Example: Contract Funding Page (Section B)",
                   "A sample Section B funding page with Acqlerate's commentary."),
    "msr": doc("msr", "example-msr", "Example: Monthly Status Report (MSR)",
               "A sample monthly status report with Acqlerate's commentary."),
    "sectionh": doc("sectionh", "example-section-h", "Example: Section H Key Personnel Requirements",
                    "A sample Section H excerpt with Acqlerate's commentary."),
    "tdl": doc("tdl", "example-tdl", "Example: Technical Direction Letter (TDL)",
               "A sample technical direction letter with Acqlerate's commentary."),
}

# Preview images the lessons embed: key -> (pdf stem, pages, dpi)
PREVIEWS = {
    "cdrl": ("example-cdrl-deliverables", 2, 120),
    "cpaf": ("example-cpaf-award-fee", 2, 120),
    "funding-page": ("example-contract-funding-page", 5, 150),
    "msr": ("example-msr", 2, 120),
    "sectionh": ("example-section-h", 2, 120),
    "tdl": ("example-tdl", 3, 120),
}


def refresh_previews() -> None:
    for key, (stem, pages, dpi) in PREVIEWS.items():
        for pg in range(1, pages + 1):
            out = EX / "img" / f"{key}-{pg}"
            subprocess.run(["pdftoppm", "-f", str(pg), "-l", str(pg), "-r", str(dpi), "-png", "-singlefile",
                            str(EX / f"{stem}.pdf"), str(out)], check=True)
            print("preview", out.with_suffix(".png").relative_to(ROOT))


if __name__ == "__main__":
    args = sys.argv[1:]
    if args == ["--previews"]:
        refresh_previews()
        sys.exit(0)
    wanted = args or list(DOCS)
    unknown = [w for w in wanted if w not in DOCS]
    if unknown:
        sys.exit(f"unknown: {unknown}; choose from {list(DOCS)}")
    render_all([DOCS[w] for w in wanted], scratch=Path("/tmp/acq-examples-build"))
