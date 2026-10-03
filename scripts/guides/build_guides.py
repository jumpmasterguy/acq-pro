"""Build the free guides on the shared Acqlerate print system.

    python3 scripts/guides/build_guides.py                 # all
    python3 scripts/guides/build_guides.py onboarding      # one

Templates live in scripts/guides/templates; rendering, footer, watermark and
protection come from scripts/print/render.py.
"""
from __future__ import annotations

import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
sys.path.insert(0, str(ROOT / "scripts" / "print"))
from render import Doc, render_all  # noqa: E402

PUBLIC = ROOT / "client" / "public"
EDITION = "October 2026"

DOCS = {
    "onboarding": Doc(
        template=HERE / "templates" / "onboarding-playbook.html",
        outs=[PUBLIC / "govcon-onboarding-playbook.pdf"],
        title="GovCon Onboarding Playbook",
        subject="How to onboard new hires into DoD acquisition in 30 days.",
        footer_label=f"GovCon Onboarding Playbook · {EDITION} edition · Educational reference, not official guidance",
        reps={"{{EDITION}}": EDITION},
    ),
    "pay": Doc(
        template=HERE / "templates" / "how-your-pay-works.html",
        outs=[PUBLIC / "how-your-pay-works.pdf"],
        title="How Your Pay Works on a Government Contract",
        subject="Billing rates, wrap rates and what is left for your salary, in plain English.",
        footer_label=f"How Your Pay Works on a Government Contract · {EDITION} edition",
        reps={"{{EDITION}}": EDITION},
    ),
}

if __name__ == "__main__":
    wanted = sys.argv[1:] or list(DOCS)
    unknown = [w for w in wanted if w not in DOCS]
    if unknown:
        sys.exit(f"unknown: {unknown}; choose from {list(DOCS)}")
    render_all([DOCS[w] for w in wanted], scratch=Path("/tmp/acq-guides-build"))
