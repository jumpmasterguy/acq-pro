#!/usr/bin/env python3
"""
Build the Finance Cheat Sheets (pack 3) PDFs.

    python3 scripts/pack3/build_pack3_pdfs.py            # all four
    python3 scripts/pack3/build_pack3_pdfs.py ppbe evm   # just these

Outputs land in BOTH twin folders, client/public/products/pack3-finance-cheat-sheets/
(served) and products/pack3-finance-cheat-sheets/ (archive), so they cannot drift.

Rendering is headless Chromium via Playwright: real CSS, the brand font, and the
master SVG icon all render exactly as they do on the site. WeasyPrint cannot
draw the icon's gradients (see claude/brand-sweep-pages-diagrams-pdfs-2026-09-19.md).

Every page carries a tiled Acqlerate watermark above the content, and the file
is saved with permissions that allow printing but not editing or copying, so a
forwarded copy keeps its branding. The owner password is random per build; to
change a sheet, edit its template here and rebuild rather than editing the PDF.

The PPBE timeline is drawn from EDITION below. Next September, move EDITION and
the example cycle forward one year and rebuild.
"""
from __future__ import annotations

import secrets
import sys
from dataclasses import dataclass, field
from pathlib import Path

import pikepdf
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[2]
TPL = Path(__file__).resolve().parent / "templates"
FONT_DIR = ROOT / "client/public/fonts"
ICON = ROOT / "brand/acqlerate-icon.svg"
OUT_DIRS = [
    ROOT / "client/public/products/pack3-finance-cheat-sheets",
    ROOT / "products/pack3-finance-cheat-sheets",
]

EDITION = "September 2026"
TODAY = (2026, 9, 23)          # the "you are here" line on the PPBE chart
EXAMPLE_FY = 2028              # the budget the PPBE chart follows end to end

DOCS = {
    "ppbe": ("ppbe-cycle-one-pager.pdf", "ppbe.html", "landscape",
             "The PPBE Cycle on One Page", "How a defense dollar goes from strategy to spent, drawn as a timeline."),
    "com": ("color-of-money-decision-tree.pdf", "color-of-money.html", "landscape",
            "Color of Money Decision Tree", "Which appropriation pays for it, and the rules that decide."),
    "evm": ("evm-formulas-quick-reference.pdf", "evm.html", "portrait",
            "EVM Formulas Quick Reference", "Earned value formulas, EAC methods and how to read them."),
    "guide": ("pack-guide.pdf", "pack-guide.html", "portrait",
              "Defense Finance Cheat Sheets: Pack Guide", "What is in the pack and how to use each tool."),
}


# ── PPBE Gantt ────────────────────────────────────────────────────────────────

LABEL_W = 132                  # left label column
CHART_W = 960                  # 10in content width at 96px/in
PLOT_W = CHART_W - LABEL_W
START = (EXAMPLE_FY - 3, 10)   # Oct, three calendar years before the FY starts
MONTHS = 48                    # four fiscal years on the axis; long bars run off the edge
PPM = PLOT_W / MONTHS          # pixels per month


def mi(year: int, month: int, day: int = 1) -> float:
    """Month index on the axis. 0.0 = the first day of the first month shown."""
    return (year - START[0]) * 12 + (month - START[1]) + (day - 1) / 30.0


def x(m: float) -> float:
    return LABEL_W + min(m, MONTHS) * PPM


@dataclass
class Bar:
    start: float
    end: float
    text: str
    hatch: bool = False


@dataclass
class Milestone:
    at: float
    text: str
    side: str = "right"        # label to the right or left of the diamond


@dataclass
class Lane:
    label: str
    owner: str
    color: str
    bars: list[Bar] = field(default_factory=list)
    marks: list[Milestone] = field(default_factory=list)
    sub: bool = False          # an Execution sub-lane: thinner, no phase label


def esc(s: str) -> str:
    return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def gantt_svg() -> str:
    fy = EXAMPLE_FY
    y0 = fy - 3  # calendar year the axis starts in (October)

    lanes = [
        Lane("Planning", "OUSD(Policy), Joint Staff", "#3D8FD1",
             bars=[Bar(mi(y0, 10), mi(y0 + 1, 4), "Strategy, guidance")],
             marks=[Milestone(mi(y0 + 1, 3), "DPG and fiscal guidance")]),
        Lane("Programming", "Services build, CAPE reviews", "#2E8B57",
             bars=[Bar(mi(y0 + 1, 1), mi(y0 + 1, 8), "Services build the POM"),
                   Bar(mi(y0 + 1, 8), mi(y0 + 1, 11, 20), "Review")],
             marks=[Milestone(mi(y0 + 1, 8), "POM and BES in", side="left"),
                    Milestone(mi(y0 + 1, 11, 10), "Programmatic RMDs")]),
        Lane("Budgeting", "OUSD(Comptroller), OMB", "#5E3596",
             bars=[Bar(mi(y0 + 1, 8), mi(y0 + 2, 2), "Budget review")],
             marks=[Milestone(mi(y0 + 1, 12, 10), "Budgetary RMDs", side="left"),
                    Milestone(mi(y0 + 2, 2, 2), "President's Budget to Congress")]),
        Lane("Enactment", "Congress", "#D1571A",
             bars=[Bar(mi(y0 + 2, 2), mi(y0 + 2, 10), "Hearings, NDAA, approps"),
                   Bar(mi(y0 + 2, 10), mi(y0 + 3, 1), "CR", hatch=True)],
             marks=[Milestone(mi(y0 + 2, 10), "Target: law by Oct 1")]),
        Lane("Execution", "Programs, comptrollers, DFAS", "#B0327A", sub=True,
             bars=[Bar(mi(y0 + 2, 10), mi(y0 + 3, 10), "O&M, MILPERS: 1 year to obligate")]),
        Lane("", "", "#B0327A", sub=True,
             bars=[Bar(mi(y0 + 2, 10), mi(y0 + 4, 10), "RDT&E: 2 years")]),
        Lane("", "", "#B0327A", sub=True,
             bars=[Bar(mi(y0 + 2, 10), mi(y0 + 5, 10), f"Procurement: 3 years, to Sep {fy + 2} (Shipbuilding: 5)")]),
        Lane("", "", "#B0327A", sub=True,
             bars=[Bar(mi(y0 + 2, 10), mi(y0 + 7, 10), f"MILCON: 5 years, to Sep {fy + 4}")]),
    ]

    head_h = 36
    lane_h = {False: 40, True: 23}
    exec_top = head_h + sum(lane_h[l.sub] for l in lanes if not l.sub)
    total_h = head_h + sum(lane_h[l.sub] for l in lanes) + 6
    o: list[str] = []
    o.append(f'<svg xmlns="http://www.w3.org/2000/svg" width="{CHART_W}" height="{total_h}" '
             f'viewBox="0 0 {CHART_W} {total_h}" font-family="General Sans, Arial, sans-serif">')
    o.append('<defs><pattern id="hatch" width="6" height="6" patternUnits="userSpaceOnUse" '
             'patternTransform="rotate(45)"><rect width="6" height="6" fill="#FBE3D6"/>'
             '<line x1="0" y1="0" x2="0" y2="6" stroke="#D1571A" stroke-width="2.2"/></pattern></defs>')

    # Fiscal-year bands
    for i in range(MONTHS // 12):
        fx0, fx1 = x(i * 12), x((i + 1) * 12)
        label_fy = y0 + 1 + i
        ex = label_fy == fy
        o.append(f'<rect x="{fx0:.1f}" y="0" width="{fx1 - fx0:.1f}" height="{total_h}" '
                 f'fill="{"#E6F2F2" if ex else ("#F3F6F8" if i % 2 == 0 else "#FFFFFF")}"/>')
        o.append(f'<text x="{(fx0 + fx1) / 2:.1f}" y="13" text-anchor="middle" font-size="10.5" font-weight="700" '
                 f'fill="{"#01696F" if ex else "#0F172A"}">FY{label_fy}{" · the example budget" if ex else ""}</text>')
        o.append(f'<line x1="{fx0:.1f}" y1="0" x2="{fx0:.1f}" y2="{total_h}" stroke="#D5DEE6"/>')
    o.append(f'<line x1="{x(MONTHS):.1f}" y1="0" x2="{x(MONTHS):.1f}" y2="{total_h}" stroke="#D5DEE6"/>')

    # Quarter ticks with calendar labels
    names = {1: "Jan", 4: "Apr", 7: "Jul", 10: "Oct"}
    for m in range(0, MONTHS, 3):
        cal_m = (START[1] - 1 + m) % 12 + 1
        cal_y = START[0] + (START[1] - 1 + m) // 12
        tx = x(m)
        lbl = names[cal_m] + (f" {cal_y}" if cal_m == 1 else "")
        o.append(f'<text x="{tx + 3:.1f}" y="28" font-size="7.6" fill="#64748B">{lbl}</text>')
        o.append(f'<line x1="{tx:.1f}" y1="{head_h - 3}" x2="{tx:.1f}" y2="{total_h}" stroke="#E3E9EE" stroke-width="0.8"/>')
    o.append(f'<line x1="{LABEL_W}" y1="{head_h - 3}" x2="{CHART_W}" y2="{head_h - 3}" stroke="#0F172A" stroke-width="1.2"/>')

    # Lanes
    y = head_h
    for lane in lanes:
        h = lane_h[lane.sub]
        if lane.label:
            o.append(f'<line x1="0" y1="{y}" x2="{CHART_W}" y2="{y}" stroke="#D5DEE6" stroke-width="0.8"/>')
            n_sub = sum(1 for l in lanes if l.sub) if lane.label == "Execution" else 0
            bar_len = (h - 12) if not n_sub else (n_sub * lane_h[True] - 8)
            o.append(f'<rect x="0" y="{y + 6}" width="4" height="{bar_len}" rx="2" fill="{lane.color}"/>')
            o.append(f'<text x="10" y="{y + 17}" font-size="10" font-weight="700" fill="#0F172A">{esc(lane.label)}</text>')
            o.append(f'<text x="10" y="{y + 28}" font-size="7.3" fill="#475569">{esc(lane.owner)}</text>')
        bh = 15
        by = y + 5 if not lane.sub else y + 4
        for b in lane.bars:
            bx0, bx1 = x(b.start), x(b.end)
            runs_off = b.end > MONTHS
            fill = "url(#hatch)" if b.hatch else lane.color
            if runs_off:
                o.append(f'<rect x="{bx0:.1f}" y="{by}" width="{bx1 - bx0 - 8:.1f}" height="{bh}" rx="4" fill="{fill}"/>')
                o.append(f'<path d="M{bx1 - 10:.1f},{by - 2} L{bx1:.1f},{by + bh / 2} L{bx1 - 10:.1f},{by + bh + 2} Z" fill="{lane.color}"/>')
            else:
                o.append(f'<rect x="{bx0:.1f}" y="{by}" width="{bx1 - bx0:.1f}" height="{bh}" rx="4" fill="{fill}"/>')
            tcol = "#8A3A12" if b.hatch else "#FFFFFF"
            tx = bx0 + (bx1 - bx0) / 2 if b.hatch else bx0 + 6
            anchor = "middle" if b.hatch else "start"
            o.append(f'<text x="{tx:.1f}" y="{by + 10.6}" text-anchor="{anchor}" font-size="8" font-weight="600" fill="{tcol}">{esc(b.text)}</text>')
        for mk in lane.marks:
            mx, my = x(mk.at), by + bh + 9.5
            o.append(f'<path d="M{mx:.1f},{my - 5.5:.1f} L{mx + 5.5:.1f},{my:.1f} L{mx:.1f},{my + 5.5:.1f} L{mx - 5.5:.1f},{my:.1f} Z" fill="#0F172A"/>')
            lx, anc = (mx + 9, "start") if mk.side == "right" else (mx - 9, "end")
            o.append(f'<text x="{lx:.1f}" y="{my + 3:.1f}" text-anchor="{anc}" font-size="7.6" font-weight="600" fill="#0F172A">{esc(mk.text)}</text>')
        y += h

    # Today line, with its label in the empty space before execution starts
    tx = x(mi(*TODAY))
    o.append(f'<line x1="{tx:.1f}" y1="{head_h - 3}" x2="{tx:.1f}" y2="{total_h}" stroke="#B42318" stroke-width="1.5" stroke-dasharray="4 3"/>')
    py = exec_top + 34
    o.append(f'<rect x="{tx - 44:.1f}" y="{py}" width="88" height="16" rx="8" fill="#B42318"/>')
    today_lbl = f"TODAY · {['', 'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'][TODAY[1]]} {TODAY[0]}"
    o.append(f'<text x="{tx:.1f}" y="{py + 11.2}" text-anchor="middle" font-size="7.6" font-weight="700" fill="#FFFFFF">{today_lbl}</text>')

    o.append("</svg>")
    return "\n".join(o)


# ── Rendering ─────────────────────────────────────────────────────────────────

def render_html(name: str) -> str:
    _, tpl, orient, title, subject = DOCS[name]
    css = (TPL / "base.css").read_text().replace("{{FONT_DIR}}", FONT_DIR.as_uri())
    html = (TPL / tpl).read_text()
    reps = {
        "{{CSS}}": css,
        "{{ICON}}": ICON.as_uri(),
        "{{EDITION}}": EDITION,
        "{{FY}}": str(EXAMPLE_FY),
        "{{FYm1}}": str(EXAMPLE_FY - 1),
        "{{FYm2}}": str(EXAMPLE_FY - 2),
        "{{FYp1}}": str(EXAMPLE_FY + 1),
    }
    if "{{GANTT}}" in html:
        reps["{{GANTT}}"] = gantt_svg()
    for k, v in reps.items():
        html = html.replace(k, v)
    return html


def protect(src: Path, dst: Path, title: str, subject: str) -> None:
    with pikepdf.open(src) as pdf:
        pdf.docinfo["/Title"] = title
        pdf.docinfo["/Subject"] = subject
        pdf.docinfo["/Author"] = "Acqlerate"
        pdf.docinfo["/Creator"] = "Acqlerate (acqlerate.com)"
        pdf.docinfo["/Keywords"] = "Acqlerate, defense acquisition, DoD finance, acqlerate.com"
        with pdf.open_metadata() as meta:
            meta["dc:title"] = title
            meta["dc:creator"] = ["Acqlerate"]
            meta["dc:rights"] = "© 2026 Acqlerate. Free to share unaltered with branding intact. acqlerate.com"
        perms = pikepdf.Permissions(
            accessibility=True, extract=False,
            modify_annotation=False, modify_assembly=False, modify_form=False, modify_other=False,
            print_lowres=True, print_highres=True,
        )
        pdf.save(dst, encryption=pikepdf.Encryption(owner=secrets.token_urlsafe(24), user="", R=6,
                                                     allow=perms))


def build(names: list[str], scratch: Path) -> list[Path]:
    scratch.mkdir(parents=True, exist_ok=True)
    built = []
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        for name in names:
            fname, _, orient, title, subject = DOCS[name]
            html_path = scratch / f"{name}.html"
            html_path.write_text(render_html(name))
            page.goto(html_path.as_uri())
            page.wait_for_load_state("networkidle")
            page.evaluate("document.fonts.ready")
            w, h = ("11in", "8.5in") if orient == "landscape" else ("8.5in", "11in")
            raw = scratch / f"{name}.raw.pdf"
            page.pdf(path=str(raw), width=w, height=h, print_background=True,
                     margin={"top": "0", "right": "0", "bottom": "0", "left": "0"})
            for d in OUT_DIRS:
                d.mkdir(parents=True, exist_ok=True)
                protect(raw, d / fname, title, subject)
            built.append(OUT_DIRS[0] / fname)
            print(f"built {fname}")
        browser.close()
    return built


if __name__ == "__main__":
    wanted = sys.argv[1:] or list(DOCS)
    bad = [n for n in wanted if n not in DOCS]
    if bad:
        sys.exit(f"unknown: {bad}; choose from {list(DOCS)}")
    build(wanted, Path("/tmp/pack3-build"))
