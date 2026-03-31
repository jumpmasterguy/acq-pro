#!/usr/bin/env python3
"""Generate 3 Acqlerate pack guide PDFs using ReportLab."""

import os
from pathlib import Path
from functools import partial

from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from reportlab.lib.colors import HexColor, white, Color
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_CENTER
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, PageBreak, Table, TableStyle,
    KeepTogether, Flowable
)
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase import pdfmetrics

# ─── Font Setup ─────────────────────────────────────────────────────
FONT_DIR = Path("/tmp/fonts")

# Register Inter (already generated as static instances)
reg_path = FONT_DIR / "Inter-Regular-static.ttf"
bold_path = FONT_DIR / "Inter-Bold-static.ttf"

if reg_path.exists() and bold_path.exists():
    pdfmetrics.registerFont(TTFont("Inter", str(reg_path)))
    pdfmetrics.registerFont(TTFont("Inter-Bold", str(bold_path)))
    FONT_REG = "Inter"
    FONT_BOLD = "Inter-Bold"
    print("Using Inter font")
else:
    FONT_REG = "Helvetica"
    FONT_BOLD = "Helvetica-Bold"
    print("Falling back to Helvetica")

# ─── Brand Colors ───────────────────────────────────────────────────
TEAL = HexColor("#01696F")
NAVY = HexColor("#0D1B2A")
GOLD = HexColor("#F5C842")
LIGHT_SURFACE = HexColor("#F8FAFC")
BODY_TEXT = HexColor("#374151")
MUTED_GRAY = HexColor("#9CA3AF")
CALLOUT_BG = HexColor("#E8F5F5")
CALLOUT_BORDER = TEAL
ANALOGY_BG = HexColor("#FFF8E1")
ANALOGY_BORDER = GOLD
TABLE_BORDER = HexColor("#E5E7EB")

PAGE_W, PAGE_H = letter
MARGIN = 0.75 * inch
CONTENT_W = PAGE_W - 2 * MARGIN

# ─── Styles ─────────────────────────────────────────────────────────
def make_styles():
    s = {}
    s["body"] = ParagraphStyle(
        "Body", fontName=FONT_REG, fontSize=10, leading=15,
        textColor=BODY_TEXT, spaceAfter=8, alignment=TA_LEFT,
    )
    s["body_bold"] = ParagraphStyle(
        "BodyBold", parent=s["body"], fontName=FONT_BOLD,
    )
    s["section_title"] = ParagraphStyle(
        "SectionTitle", fontName=FONT_BOLD, fontSize=13,
        textColor=white, leading=18, spaceAfter=0, spaceBefore=0,
        alignment=TA_LEFT,
    )
    s["callout"] = ParagraphStyle(
        "Callout", fontName=FONT_REG, fontSize=10, leading=15,
        textColor=BODY_TEXT, spaceAfter=4, alignment=TA_LEFT,
    )
    s["callout_bold"] = ParagraphStyle(
        "CalloutBold", fontName=FONT_BOLD, fontSize=10, leading=15,
        textColor=TEAL, spaceAfter=2, alignment=TA_LEFT,
    )
    s["analogy_label"] = ParagraphStyle(
        "AnalogyLabel", fontName=FONT_BOLD, fontSize=8, leading=12,
        textColor=HexColor("#B8860B"), spaceAfter=2, alignment=TA_LEFT,
    )
    s["step_num"] = ParagraphStyle(
        "StepNum", fontName=FONT_BOLD, fontSize=10, leading=15,
        textColor=TEAL, spaceAfter=2, alignment=TA_LEFT,
    )
    s["table_header"] = ParagraphStyle(
        "TableHeader", fontName=FONT_BOLD, fontSize=9, leading=13,
        textColor=white, alignment=TA_LEFT,
    )
    s["table_cell"] = ParagraphStyle(
        "TableCell", fontName=FONT_REG, fontSize=9, leading=13,
        textColor=BODY_TEXT, alignment=TA_LEFT,
    )
    s["footer"] = ParagraphStyle(
        "Footer", fontName=FONT_REG, fontSize=8, leading=10,
        textColor=MUTED_GRAY,
    )
    s["subtitle"] = ParagraphStyle(
        "Subtitle", fontName=FONT_REG, fontSize=12, leading=16,
        textColor=HexColor("#D1D5DB"), alignment=TA_LEFT,
    )
    return s

STYLES = make_styles()

# ─── Flowable Helpers ───────────────────────────────────────────────

class SectionHeader(Flowable):
    """Navy background box full width with white bold text."""
    def __init__(self, text, width=CONTENT_W):
        Flowable.__init__(self)
        self.text = text
        self.box_width = width
        self.height = 32

    def wrap(self, availWidth, availHeight):
        self.box_width = availWidth
        return (availWidth, self.height)

    def draw(self):
        c = self.canv
        c.setFillColor(NAVY)
        c.roundRect(0, 0, self.box_width, self.height, 3, fill=1, stroke=0)
        c.setFillColor(white)
        c.setFont(FONT_BOLD, 13)
        c.drawString(12, 10, self.text)


def callout_box(text, styles=STYLES):
    """Light teal 'What it is' callout with teal left border."""
    p = Paragraph(text, styles["callout"])
    t = Table([[p]], colWidths=[CONTENT_W - 6])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), CALLOUT_BG),
        ("LINEBEFORE", (0, 0), (0, -1), 3, TEAL),
        ("TOPPADDING", (0, 0), (-1, -1), 10),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
        ("LEFTPADDING", (0, 0), (-1, -1), 14),
        ("RIGHTPADDING", (0, 0), (-1, -1), 10),
    ]))
    return t


def analogy_box(text, styles=STYLES):
    """Gold/amber analogy box with THE ANALOGY label."""
    label = Paragraph("THE ANALOGY", styles["analogy_label"])
    body = Paragraph(text, styles["callout"])
    inner = Table([[label], [body]], colWidths=[CONTENT_W - 6])
    inner.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), ANALOGY_BG),
        ("LINEBEFORE", (0, 0), (0, -1), 3, GOLD),
        ("TOPPADDING", (0, 0), (0, 0), 10),
        ("BOTTOMPADDING", (0, -1), (-1, -1), 10),
        ("LEFTPADDING", (0, 0), (-1, -1), 14),
        ("RIGHTPADDING", (0, 0), (-1, -1), 10),
        ("TOPPADDING", (0, 1), (0, 1), 2),
    ]))
    return inner


def step_list(steps, styles=STYLES, include_header=True):
    """Numbered steps with teal numbers, kept together with header."""
    elements = []
    if include_header:
        elements.append(Paragraph("How to Use It", styles["body_bold"]))
        elements.append(Spacer(1, 0.05 * inch))
    for i, step_text in enumerate(steps, 1):
        txt = f'<font name="{FONT_BOLD}" color="#01696F">Step {i}</font> — {step_text}'
        elements.append(Paragraph(txt, styles["body"]))
    return [KeepTogether(elements)]


def whats_inside_list(items, styles=STYLES):
    """Bulleted list for What's inside."""
    elements = []
    for item in items:
        txt = f'<font name="{FONT_BOLD}" color="#01696F">•</font>  {item}'
        elements.append(Paragraph(txt, styles["body"]))
    return elements


def styled_table(headers, rows, col_widths=None):
    """Table with teal header and alternating rows."""
    header_paras = [Paragraph(h, STYLES["table_header"]) for h in headers]
    data = [header_paras]
    for row in rows:
        data.append([Paragraph(str(c), STYLES["table_cell"]) for c in row])

    if col_widths is None:
        col_widths = [CONTENT_W / len(headers)] * len(headers)

    t = Table(data, colWidths=col_widths)
    style_cmds = [
        ("BACKGROUND", (0, 0), (-1, 0), TEAL),
        ("TEXTCOLOR", (0, 0), (-1, 0), white),
        ("FONTNAME", (0, 0), (-1, 0), FONT_BOLD),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("ALIGN", (0, 0), (-1, -1), "LEFT"),
        ("GRID", (0, 0), (-1, -1), 0.5, TABLE_BORDER),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
    ]
    # Alternating row backgrounds
    for i in range(1, len(data)):
        bg = white if i % 2 == 1 else LIGHT_SURFACE
        style_cmds.append(("BACKGROUND", (0, i), (-1, i), bg))
    t.setStyle(TableStyle(style_cmds))
    return t


# ─── Cover Page & Headers/Footers ──────────────────────────────────

def draw_cover(canvas_obj, doc, title, subtitle):
    """Full navy cover page."""
    c = canvas_obj
    c.saveState()
    # Navy background
    c.setFillColor(NAVY)
    c.rect(0, 0, PAGE_W, PAGE_H, fill=1, stroke=0)

    # Gold wordmark top-left
    c.setFillColor(GOLD)
    c.setFont(FONT_BOLD, 16)
    c.drawString(MARGIN, PAGE_H - MARGIN - 16, "ACQLERATE")

    # Title (large white)
    c.setFillColor(white)
    c.setFont(FONT_BOLD, 32)
    # Word-wrap title manually for long titles
    y = PAGE_H * 0.52
    words = title.split()
    line = ""
    for w in words:
        test = line + (" " if line else "") + w
        if c.stringWidth(test, FONT_BOLD, 32) > CONTENT_W:
            c.drawString(MARGIN, y, line)
            y -= 42
            line = w
        else:
            line = test
    if line:
        c.drawString(MARGIN, y, line)
    y -= 20

    # Gold accent line
    c.setStrokeColor(GOLD)
    c.setLineWidth(3)
    c.line(MARGIN, y, MARGIN + 80, y)
    y -= 30

    # Subtitle
    c.setFillColor(HexColor("#D1D5DB"))
    c.setFont(FONT_REG, 13)
    # Word wrap subtitle
    sub_words = subtitle.split()
    sub_line = ""
    for w in sub_words:
        test = sub_line + (" " if sub_line else "") + w
        if c.stringWidth(test, FONT_REG, 13) > CONTENT_W:
            c.drawString(MARGIN, y, sub_line)
            y -= 18
            sub_line = w
        else:
            sub_line = test
    if sub_line:
        c.drawString(MARGIN, y, sub_line)

    # Bottom left URL
    c.setFillColor(MUTED_GRAY)
    c.setFont(FONT_REG, 10)
    c.drawString(MARGIN, MARGIN, "acqlerate.com")

    c.restoreState()


def draw_header_footer(canvas_obj, doc, doc_title):
    """Header: teal bar. Footer: teal line + text."""
    c = canvas_obj
    c.saveState()

    # Header bar
    c.setFillColor(TEAL)
    c.rect(0, PAGE_H - 36, PAGE_W, 36, fill=1, stroke=0)
    c.setFillColor(white)
    c.setFont(FONT_BOLD, 10)
    c.drawString(MARGIN, PAGE_H - 24, "ACQLERATE")
    c.setFont(FONT_REG, 9)
    c.drawRightString(PAGE_W - MARGIN, PAGE_H - 24, doc_title)

    # Footer
    c.setStrokeColor(TEAL)
    c.setLineWidth(0.5)
    c.line(MARGIN, 38, PAGE_W - MARGIN, 38)
    c.setFillColor(MUTED_GRAY)
    c.setFont(FONT_REG, 8)
    c.drawString(MARGIN, 26, "acqlerate.com")
    c.drawRightString(PAGE_W - MARGIN, 26, f"Page {doc.page}")

    c.restoreState()


# ─── PDF Builder ────────────────────────────────────────────────────

def build_pdf(filepath, title, subtitle, story_fn):
    """Build a single PDF."""
    doc = SimpleDocTemplate(
        filepath,
        pagesize=letter,
        topMargin=MARGIN + 36,  # extra space for header bar
        bottomMargin=MARGIN + 20,
        leftMargin=MARGIN,
        rightMargin=MARGIN,
        title=title,
        author="Perplexity Computer",
    )

    story = story_fn()

    cover_fn = partial(draw_cover, title=title, subtitle=subtitle)
    later_fn = partial(draw_header_footer, doc_title=title)

    doc.build(
        story,
        onFirstPage=cover_fn,
        onLaterPages=later_fn,
    )
    print(f"  ✓ {filepath}")


# ─── Helper shortcuts ──────────────────────────────────────────────

def S(h=0.15):
    return Spacer(1, h * inch)

def body(text):
    return Paragraph(text, STYLES["body"])

def bold_body(text):
    return Paragraph(text, STYLES["body_bold"])

def section(text):
    return SectionHeader(text)

def PB():
    return PageBreak()


# ═══════════════════════════════════════════════════════════════════
# PACK 1: PM Essentials
# ═══════════════════════════════════════════════════════════════════

def pack1_story():
    s = []

    # Page 1 is the cover (drawn by onFirstPage), but we need a page break
    # to start content on page 2. The cover callback handles page 1.
    s.append(PB())

    # ── Page 2: Welcome & Overview ──
    s.append(section("Welcome & Overview"))
    s.append(S(0.15))
    s.append(body(
        "You just downloaded five tools that defense program managers actually use — "
        "and that most people spend weeks building from scratch on every new program."
    ))
    s.append(body(
        "This pack isn't a textbook. It's a set of ready-to-use templates designed for real "
        "DoD program environments — the kind where you're juggling cost reports, risk reviews, "
        "and stakeholder meetings before your coffee gets cold."
    ))
    s.append(body(
        "Each tool in this pack solves a specific problem. The RFP Compliance Matrix keeps your "
        "proposals from getting thrown out on a technicality. The Risk Register gives your leadership "
        "a clear picture of what could go wrong — before it does. The IGCE Calculator saves you from "
        "building cost formulas from scratch. The RACI Matrix stops the \"I thought you were handling that\" "
        "conversations. And the PM Briefing Deck gives you a professional template for program reviews "
        "instead of starting from a blank slide."
    ))
    s.append(body(
        "This guide walks you through every tool — what it does, why it matters, what's inside, and "
        "exactly how to use it. No jargon. No fluff. Just practical guidance you can apply immediately."
    ))

    s.append(PB())

    # ── Page 3: Tool 1 — RFP Compliance Matrix ──
    s.append(section("Tool 1: RFP Compliance Matrix"))
    s.append(S(0.15))

    s.append(bold_body("What It Is"))
    s.append(S(0.05))
    s.append(callout_box(
        "A checklist that maps every government requirement in the RFP to a specific place in your "
        "proposal. Think of it like a receipt — you want to make sure every item the government asked "
        "for has been \"checked off\" before you submit."
    ))
    s.append(S(0.1))

    s.append(bold_body("Why It Matters"))
    s.append(S(0.05))
    s.append(body(
        "The number-one reason proposals lose isn't a weak technical approach — it's non-compliance. "
        "The evaluator literally can't give you points for something you forgot to address. A missing "
        "section, an unanswered requirement, a mislabeled volume — any of these can knock you out "
        "before your best ideas even get read."
    ))
    s.append(S(0.1))

    s.append(bold_body("What's Inside"))
    s.append(S(0.05))
    for item in [
        "Sheet 1: 20 pre-filled DoD RFP requirements (Section L format) with columns for volume, "
        "page reference, compliance status (green/yellow/red dropdown), and owner.",
        "Sheet 2: An instructions guide explaining every column and how to customize it for your RFP.",
    ]:
        s.append(body(f'<font name="{FONT_BOLD}" color="#01696F">•</font>  {item}'))
    s.append(S(0.1))

    for st in step_list([
        "Read your RFP Section L — the instructions to offerors. This tells you exactly what the government wants.",
        "Add each requirement as a row in the matrix. Be specific — one requirement per row.",
        "Assign an owner and page reference as your proposal sections get written.",
        "Nothing goes to submit review until every row is green. Period.",
    ]):
        s.append(st)

    s.append(PB())

    # ── Page 4: Tool 2 — Risk Register ──
    s.append(section("Tool 2: Risk Register"))
    s.append(S(0.15))

    s.append(bold_body("What It Is"))
    s.append(S(0.05))
    s.append(callout_box(
        "A living spreadsheet that tracks every risk to your program — cost, schedule, technical, "
        "and external — with a calculated risk score that tells you which ones need attention right now."
    ))
    s.append(S(0.1))

    s.append(analogy_box(
        "Think of it like a weather forecast for your program. You can't stop the storm, but you can "
        "see it coming and prepare. The Risk Register is your forecast — it shows you which risks are "
        "building on the horizon and which ones have already passed."
    ))
    s.append(S(0.1))

    s.append(bold_body("What's Inside"))
    s.append(S(0.05))
    for item in [
        "15 pre-populated defense program risks covering cost, schedule, technical, and external categories.",
        "Probability × Impact scoring with auto-calculated risk levels.",
        "Color-coded heat map (red/yellow/green) so you can see your biggest risks at a glance.",
        "A 5×5 risk matrix chart for program reviews.",
    ]:
        s.append(body(f'<font name="{FONT_BOLD}" color="#01696F">•</font>  {item}'))
    s.append(S(0.1))

    for st in step_list([
        "Start with the 15 pre-loaded risks and delete what doesn't apply to your program.",
        "Add your program-specific risks. Think about what keeps you up at night.",
        "Score each one: 1–5 probability, 1–5 impact. The Risk Level column calculates automatically.",
        "Review with your team monthly and update the Status column. Risks change — your register should too.",
    ]):
        s.append(st)

    s.append(PB())

    # ── Page 5: Tool 3 — IGCE Calculator ──
    s.append(section("Tool 3: IGCE Calculator"))
    s.append(S(0.15))

    s.append(bold_body("What It Is"))
    s.append(S(0.05))
    s.append(callout_box(
        "A spreadsheet that calculates the government's estimated cost for your contract — the "
        "Independent Government Cost Estimate. It's the government's own math that says \"this is "
        "what we think this should cost\" before they open a single proposal."
    ))
    s.append(S(0.1))

    s.append(analogy_box(
        "Before you hire a contractor to renovate your kitchen, you get your own estimate so you "
        "know if their bid is reasonable. The IGCE is the government doing the same thing before "
        "they receive proposals. If your bid is wildly above or below the IGCE, it raises flags."
    ))
    s.append(S(0.1))

    s.append(bold_body("What's Inside"))
    s.append(S(0.05))
    for item in [
        "Labor Estimate tab: 10 Labor Category Descriptions (LCATs) with fully-loaded cost formulas "
        "— fringe, overhead, G&amp;A, and fee are already built in.",
        "ODC &amp; Travel tab: fields for materials, travel, subcontract costs, and other direct costs.",
        "IGCE Summary tab: rolls everything up automatically across 3 performance years.",
    ]:
        s.append(body(f'<font name="{FONT_BOLD}" color="#01696F">•</font>  {item}'))
    s.append(S(0.1))

    for st in step_list([
        "Enter your Labor Categories and hourly rates in the Labor tab. The fringe, overhead, G&amp;A, "
        "and fee calculations are already built in — just update the rates.",
        "Add materials, travel, and subcontract costs in the ODC tab.",
        "The Summary tab automatically totals everything across 3 years. Export it for your acquisition package.",
    ]):
        s.append(st)

    s.append(PB())

    # ── Page 6: Tool 4 — Stakeholder RACI Matrix ──
    s.append(section("Tool 4: Stakeholder RACI Matrix"))
    s.append(S(0.15))

    s.append(bold_body("What It Is"))
    s.append(S(0.05))
    s.append(callout_box(
        "A one-page map of who does what on your program. RACI stands for Responsible, Accountable, "
        "Consulted, Informed — the four roles any person can play in any activity."
    ))
    s.append(S(0.1))

    s.append(analogy_box(
        "If your program were a flight, the RACI tells you who's flying the plane (Responsible), "
        "who owns the aircraft (Accountable), who ATC needs to talk to (Consulted), and who gets "
        "notified when you land (Informed). Without it, everyone thinks someone else is flying."
    ))
    s.append(S(0.1))

    s.append(bold_body("What's Inside"))
    s.append(S(0.05))
    for item in [
        "25 common DoD program activities pre-mapped across 10 stakeholder roles.",
        "Color-coded cells: R = teal, A = navy, C = light blue, I = gray.",
        "Ready to customize with your actual team members and offices.",
    ]:
        s.append(body(f'<font name="{FONT_BOLD}" color="#01696F">•</font>  {item}'))
    s.append(S(0.1))

    # RACI reference table
    s.append(styled_table(
        ["Letter", "Role", "What It Means"],
        [
            ["R", "Responsible", "Does the work. Hands on keyboard."],
            ["A", "Accountable", "Owns the outcome. Signs off. Only one per activity."],
            ["C", "Consulted", "Gives input before or during the work."],
            ["I", "Informed", "Notified after the fact. Kept in the loop."],
        ],
        col_widths=[50, 100, CONTENT_W - 150],
    ))
    s.append(S(0.1))

    for st in step_list([
        "Replace the pre-filled role names with your actual team members or offices.",
        "Review each activity row — if more than one person has \"R\", clarify who's actually doing the work.",
        "Share with your team at program kickoff so everyone knows their lane from day one.",
    ]):
        s.append(st)

    s.append(PB())

    # ── Page 7: Tool 5 — PM Briefing Deck ──
    s.append(section("Tool 5: PM Briefing Deck"))
    s.append(S(0.15))

    s.append(bold_body("What It Is"))
    s.append(S(0.05))
    s.append(callout_box(
        "A 12-slide PowerPoint template for your program status review — the kind you'd give to "
        "leadership, the program office, or your customer. No more starting from a blank deck at "
        "10 PM the night before a review."
    ))
    s.append(S(0.1))

    s.append(bold_body("What's Inside"))
    s.append(S(0.05))
    s.append(styled_table(
        ["Slide", "Content"],
        [
            ["1", "Cover — Program name, date, classification"],
            ["2", "Agenda"],
            ["3", "Executive Summary with traffic light status indicators"],
            ["4", "Program Status overview"],
            ["5", "Schedule performance with SPI callout"],
            ["6", "Cost / EVM with KPI cards"],
            ["7", "Risk Status summary"],
            ["8", "Technical Progress"],
            ["9", "Contractor Performance (CPARS-aligned)"],
            ["10", "Issues &amp; Actions tracker"],
            ["11", "Way Forward — 30/60/90-day look-ahead"],
            ["12", "Backup / Appendix"],
        ],
        col_widths=[50, CONTENT_W - 50],
    ))
    s.append(S(0.1))

    for st in step_list([
        "Update the program name, date, and logo on the cover slide.",
        "Work through each slide left to right. The traffic lights are shapes you can recolor "
        "(green/yellow/red) — just right-click and change the fill.",
        "Delete slides you don't need for your specific review type. Not every review needs all 12 slides.",
    ]):
        s.append(st)

    s.append(S(0.25))

    # ── Quick Start Checklist (flows from previous to avoid sparse page) ──
    s.append(section("Quick Start Checklist"))
    s.append(S(0.1))
    s.append(body(
        "Not sure where to start? Here's the recommended order. You don't need to use all five "
        "tools on day one — but this sequence gets you set up the fastest."
    ))
    s.append(S(0.1))

    checklist = [
        ("Open the RACI first", "Know your team. Who's doing what? Get this agreed upon before anything else."),
        ("Pull up the Risk Register", "Know your threats. What could derail your program? Get those risks documented early."),
        ("Start your IGCE if you're in pre-award", "The cost estimate takes time. Don't wait until the last week."),
        ("Build your Compliance Matrix as soon as the RFP drops", "Every requirement gets a row. Every row gets an owner. No exceptions."),
        ("Use the Briefing Deck for your first program review", "You'll look prepared. Because you will be."),
    ]
    for i, (title, desc) in enumerate(checklist, 1):
        txt = (f'<font name="{FONT_BOLD}" color="#01696F" size="14">{i}</font>'
               f'  <font name="{FONT_BOLD}">{title}</font><br/>{desc}')
        s.append(body(txt))
        s.append(S(0.05))

    s.append(S(0.2))
    s.append(body(
        '<font name="' + FONT_BOLD + '" color="#01696F">Questions?</font> '
        'Visit <a href="https://acqlerate.com" color="#01696F">acqlerate.com</a> for tutorials, '
        'walkthroughs, and the full Acqlerate template library.'
    ))

    return s


# ═══════════════════════════════════════════════════════════════════
# PACK 2: GovCon Proposal Toolkit
# ═══════════════════════════════════════════════════════════════════

def pack2_story():
    s = []
    s.append(PB())

    # ── Page 2: Welcome ──
    s.append(section("Why Most Proposals Lose Before They're Written"))
    s.append(S(0.15))
    s.append(body(
        "Here's the uncomfortable truth about government proposals: the best proposals don't win "
        "because of great writing. They win because the team understood the customer's priorities "
        "before the RFP dropped and organized the response to address every evaluation criterion directly."
    ))
    s.append(body(
        "Most losing proposals aren't bad. They're incomplete, disorganized, or slightly off-target. "
        "They miss a requirement in Section L. They don't connect their technical approach to the "
        "evaluation factors in Section M. They scatter their win themes across 200 pages without "
        "reinforcing a clear message. They scramble on pricing at the last minute."
    ))
    s.append(body(
        "This toolkit gives you five tools that address each of those failure points. They won't "
        "write your proposal for you — but they'll make sure nothing falls through the cracks, "
        "your message is clear, and your pricing volume doesn't sink an otherwise strong submission."
    ))
    s.append(body(
        "Every tool in this pack has been designed for the realities of GovCon proposals: tight "
        "timelines, distributed teams, and evaluators who are checking boxes — not reading novels."
    ))

    s.append(PB())

    # ── Page 3: Tool 1 — Proposal Compliance Matrix ──
    s.append(section("Tool 1: Proposal Compliance Matrix"))
    s.append(S(0.15))

    s.append(bold_body("What It Is"))
    s.append(S(0.05))
    s.append(callout_box(
        "A requirement-by-requirement checklist that ensures your proposal responds to every "
        "\"shall\" and \"will\" in the RFP's Section L. It's the single most important document "
        "in your proposal process — because without it, you're guessing."
    ))
    s.append(S(0.1))

    s.append(analogy_box(
        "Think of the evaluator as a teacher grading a test. They're not reading your proposal "
        "front-to-back and admiring your writing — they're checking boxes: \"Did they answer "
        "question 1? Did they answer question 2?\" Your Compliance Matrix is how you make sure "
        "every answer is there."
    ))
    s.append(S(0.1))

    s.append(bold_body("What's Inside"))
    s.append(S(0.05))
    for item in [
        "Full compliance tracking by RFP section and paragraph reference.",
        "Volume mapping — which volume of your proposal addresses each requirement.",
        "Response status dropdowns (Not Started / In Progress / Complete / Verified).",
        "Instructions tab with guidance on how to decompose complex requirements.",
    ]:
        s.append(body(f'<font name="{FONT_BOLD}" color="#01696F">•</font>  {item}'))
    s.append(S(0.1))

    for st in step_list([
        "Load the RFP. Open Section L — the instructions to offerors.",
        "Go through Section L line by line. Every requirement gets a row. Every \"shall\" and \"will\" is a separate entry.",
        "Assign each requirement to a volume and a writer. Everyone needs to know what they own.",
        "As sections are written, update the status. Nothing goes to review without green across the board.",
    ]):
        s.append(st)

    s.append(PB())

    # ── Page 4: Tool 2 — Section L/M Decoder ──
    s.append(section("Tool 2: Section L/M Decoder"))
    s.append(S(0.15))

    s.append(bold_body("What It Is"))
    s.append(S(0.05))
    s.append(callout_box(
        "A translation tool. Section L tells you what to submit. Section M tells you how you'll be "
        "evaluated. The L/M Decoder maps every instruction to its evaluation criterion so you know "
        "exactly what the government cares about most when they read your response."
    ))
    s.append(S(0.1))

    s.append(analogy_box(
        "Section L is the recipe ingredients list. Section M is the judging criteria for the cooking "
        "competition. You need both to win — you can't just follow the recipe if you don't know "
        "what the judges are scoring on. The Decoder connects the two so you know where to invest "
        "your strongest arguments."
    ))
    s.append(S(0.1))

    s.append(bold_body("What's Inside"))
    s.append(S(0.05))
    for item in [
        "L–M mapping table — every Section L requirement linked to its Section M evaluation factor.",
        "Evaluation factor weights tracker — see which factors carry the most scoring weight.",
        "Discriminator identification column — flag where you can differentiate from competitors.",
        "How-to-Use tab with step-by-step instructions.",
    ]:
        s.append(body(f'<font name="{FONT_BOLD}" color="#01696F">•</font>  {item}'))
    s.append(S(0.1))

    for st in step_list([
        "Populate Section L requirements in the first column.",
        "Map each requirement to the Section M evaluation factor it supports.",
        "Identify which factors are weighted highest — those are where you spend the most writing time and your best evidence.",
        "Use the discriminator column to flag where you can stand out from the competition.",
    ]):
        s.append(st)

    s.append(PB())

    # ── Page 5: Tool 3 — Win Theme Development Tracker ──
    s.append(section("Tool 3: Win Theme Development Tracker"))
    s.append(S(0.15))

    s.append(bold_body("What It Is"))
    s.append(S(0.05))
    s.append(callout_box(
        "A structured way to identify, develop, and deploy the 3–5 core messages that should "
        "appear throughout your entire proposal — the reasons why your team wins."
    ))
    s.append(S(0.1))

    s.append(analogy_box(
        "Win themes are like a campaign slogan. \"We have the most relevant experience\" is a "
        "theme. It should show up in your technical approach, your management plan, your past "
        "performance, and your executive summary — not just once in a cover letter. Repetition "
        "isn't redundancy. It's reinforcement."
    ))
    s.append(S(0.1))

    s.append(bold_body("What's Inside"))
    s.append(S(0.05))
    for item in [
        "Win Theme tracker — theme statement, supporting evidence, and discriminators for each theme.",
        "Theme-to-Evaluation Factor Matrix — which theme supports which evaluation factor, ensuring full coverage.",
        "Instructions tab with tips on developing themes that actually resonate with evaluators.",
    ]:
        s.append(body(f'<font name="{FONT_BOLD}" color="#01696F">•</font>  {item}'))
    s.append(S(0.1))

    for st in step_list([
        "Start with what you know about the customer's hot buttons — their pain points, their priorities, their recent experiences.",
        "Develop 3–5 themes max. More than 5 and nothing sticks. Each theme should be a clear, provable statement.",
        "Use the matrix to ensure each theme shows up in at least 2 proposal sections. Themes that appear once aren't themes — they're sentences.",
        "Share with all writers before a single word is written. Everyone needs to sing from the same sheet of music.",
    ]):
        s.append(st)

    s.append(PB())

    # ── Page 6: Tool 4 — Past Performance Template ──
    s.append(section("Tool 4: Past Performance Template"))
    s.append(S(0.15))

    s.append(bold_body("What It Is"))
    s.append(S(0.05))
    s.append(callout_box(
        "A structured format for documenting your relevant contracts — the ones you'll cite as "
        "evidence that you've done this kind of work before and done it well."
    ))
    s.append(S(0.1))

    s.append(bold_body("Why It Matters"))
    s.append(S(0.05))
    s.append(body(
        "Past performance is typically 20–30% of the evaluation. A vague \"we supported DoD "
        "customers\" won't score well. What scores well is specific, relevant, quantified evidence: "
        "contract names, dollar values, performance metrics, and customer references who can "
        "confirm your claims."
    ))
    s.append(S(0.1))

    s.append(bold_body("What's Inside"))
    s.append(S(0.05))
    for item in [
        "Past Performance Reference Tracker — contract details, relevance mapping, POC info for each reference.",
        "Write-Up Template — structured narrative with prompts that guide you through scope, performance, and outcomes.",
        "Instructions tab explaining how to select and present your strongest references.",
    ]:
        s.append(body(f'<font name="{FONT_BOLD}" color="#01696F">•</font>  {item}'))
    s.append(S(0.1))

    for st in step_list([
        "Enter every relevant contract in the tracker. Aim for 3–5 references that are most similar to this pursuit.",
        "For each one, complete the relevance mapping — how does this contract demonstrate capability for this specific opportunity?",
        "Use the Write-Up Template to draft each narrative. The prompts guide you through scope, performance metrics, and measurable outcomes.",
    ]):
        s.append(st)

    s.append(PB())

    # ── Page 7: Tool 5 — Pricing Volume Checklist ──
    s.append(section("Tool 5: Pricing Volume Checklist"))
    s.append(S(0.15))

    s.append(bold_body("What It Is"))
    s.append(S(0.05))
    s.append(callout_box(
        "A compliance checklist specifically for your pricing volume — the part of the proposal "
        "where most teams scramble at the last minute and where small mistakes have big consequences."
    ))
    s.append(S(0.1))

    s.append(analogy_box(
        "The pricing volume is like your tax return. The technical volume is the story you tell. "
        "The pricing volume is where you show your math. One wrong number, one missing form, "
        "one uncertified rate — and you can be deemed non-compliant before anyone reads your "
        "technical approach."
    ))
    s.append(S(0.1))

    s.append(bold_body("What's Inside"))
    s.append(S(0.05))
    for item in [
        "Pricing checklist — Section L pricing requirements mapped to specific deliverables you need to prepare.",
        "CLIN/SLIN Pricing Table template — structure your cost breakdown in the format the government expects.",
    ]:
        s.append(body(f'<font name="{FONT_BOLD}" color="#01696F">•</font>  {item}'))
    s.append(S(0.1))

    for st in step_list([
        "Run through the checklist against your RFP's Section L pricing instructions. Check every item.",
        "Use the CLIN Pricing Table to structure your cost breakdown. Match the CLIN structure in the RFP exactly.",
        "Do a final compliance check 48 hours before submission — not the night before. You need time to fix what you find.",
    ]):
        s.append(st)

    s.append(S(0.25))

    # ── Proposal Timeline (flows from previous page to avoid orphan) ──
    s.append(section("Proposal Timeline & Quick Start"))
    s.append(S(0.1))
    s.append(body(
        "The best proposal teams work backwards from the submission deadline. Here's a recommended "
        "timeline showing when each tool in this pack comes into play."
    ))
    s.append(S(0.1))

    s.append(styled_table(
        ["Milestone", "When", "Tool to Use"],
        [
            ["RFP drops", "T-60 days", "Compliance Matrix + L/M Decoder"],
            ["Win themes developed", "T-55 days", "Win Theme Tracker"],
            ["Past performance selected", "T-50 days", "Past Performance Template"],
            ["Writing begins", "T-45 days", "All tools active — writers reference themes and compliance matrix"],
            ["Pink Team review", "T-30 days", "Check compliance matrix — is every row addressed?"],
            ["Red Team review", "T-14 days", "Full compliance + theme + past performance review"],
            ["Pricing volume finalized", "T-7 days", "Pricing Volume Checklist"],
            ["Final compliance sweep", "T-2 days", "Every checklist, every row — one last pass"],
            ["Submission", "T-day", "Submit with confidence"],
        ],
        col_widths=[CONTENT_W * 0.35, CONTENT_W * 0.15, CONTENT_W * 0.5],
    ))
    s.append(S(0.15))

    s.append(bold_body("Quick Start"))
    s.append(S(0.05))
    checklist = [
        ("Open the Compliance Matrix the day the RFP drops", "Every requirement gets a row before anyone starts writing."),
        ("Run the L/M Decoder in the first 48 hours", "Understand how you'll be evaluated. This shapes everything."),
        ("Develop win themes before writing begins", "3–5 themes. Share with every writer. Non-negotiable."),
        ("Start past performance write-ups early", "These take longer than you think. Don't leave them for the last week."),
        ("Run the Pricing Checklist 48 hours before submission", "Give yourself time to fix what you find."),
    ]
    for i, (title, desc) in enumerate(checklist, 1):
        txt = (f'<font name="{FONT_BOLD}" color="#01696F" size="14">{i}</font>'
               f'  <font name="{FONT_BOLD}">{title}</font><br/>{desc}')
        s.append(body(txt))
        s.append(S(0.05))

    # Closing text — placed right after last item, no extra spacing to avoid orphan page
    s.append(body(
        '<font name="' + FONT_BOLD + '" color="#01696F">Need more?</font> '
        'Visit <a href="https://acqlerate.com" color="#01696F">acqlerate.com</a> for proposal '
        'writing guides, evaluation criteria deep dives, and the full Acqlerate template library.'
    ))

    return s


# ═══════════════════════════════════════════════════════════════════
# PACK 3: Defense Finance Cheat Sheets
# ═══════════════════════════════════════════════════════════════════

def pack3_story():
    s = []
    s.append(PB())

    # ── Page 2: Welcome ──
    s.append(section("Why Defense Finance Confuses Everyone"))
    s.append(S(0.15))
    s.append(body(
        "The Department of Defense operates on one of the most complex financial systems ever created. "
        "Multiple appropriation types, each with their own rules. A budget cycle that takes two years. "
        "Cost accounting standards that would make a CPA's head spin. And an alphabet soup of acronyms "
        "that seems deliberately designed to keep outsiders confused."
    ))
    s.append(body(
        "But here's the thing — underneath the acronyms and appropriations law, defense finance "
        "follows a logic that actually makes sense once you understand what problem each rule is solving. "
        "Color of money exists because Congress wants to control how money is spent. EVM exists because "
        "the government needs to know if programs are on track before they're finished. The PPBE cycle "
        "exists because you can't build an aircraft carrier on a one-year budget."
    ))
    s.append(body(
        "This pack gives you four tools that translate the complexity into plain English. Each one is "
        "designed to be a quick reference — something you keep open during meetings, reviews, and "
        "budget drills. No textbook theory. Just the information you need, when you need it."
    ))

    s.append(S(0.25))

    # ── Page 3: Tool 1 — Color of Money Decision Tree ──
    s.append(section("Tool 1: Color of Money Decision Tree"))
    s.append(S(0.15))

    s.append(bold_body("What It Is"))
    s.append(S(0.05))
    s.append(callout_box(
        "A visual decision tool that helps you determine which appropriation type to use for any "
        "given expense. In DoD, money isn't just money — it comes in different \"colors\" that "
        "can only be used for specific purposes."
    ))
    s.append(S(0.1))

    s.append(analogy_box(
        "Imagine you have three bank accounts: one for home improvements, one for monthly bills, "
        "and one for groceries. You can't pay your electricity bill out of the grocery account — "
        "even if there's money in it. That's color of money. Mixing accounts isn't a bookkeeping "
        "error; in DoD it's an Anti-Deficiency Act violation — and people lose careers over it."
    ))
    s.append(S(0.1))

    s.append(bold_body("The Four Colors"))
    s.append(S(0.05))
    s.append(styled_table(
        ["Color", "Full Name", "Used For", "Availability"],
        [
            ["RDT&amp;E", "Research, Development, Test &amp; Evaluation", "Developing new capabilities, testing prototypes", "2 years"],
            ["Procurement", "Procurement", "Buying production items, weapons systems, equipment", "3 years"],
            ["O&amp;M", "Operations &amp; Maintenance", "Running day-to-day operations, maintenance, services", "1 year"],
            ["MILCON", "Military Construction", "Building or renovating facilities over $1M", "5 years"],
        ],
        col_widths=[CONTENT_W * 0.13, CONTENT_W * 0.22, CONTENT_W * 0.42, CONTENT_W * 0.23],
    ))
    s.append(S(0.1))

    s.append(bold_body("What's Inside"))
    s.append(S(0.05))
    for item in [
        "Decision Tree — a step-by-step selection guide that walks you through the question \"what kind of money do I use for this?\"",
        "Quick Reference Table — all appropriation types with periods of availability, authorized uses, and real-world examples.",
    ]:
        s.append(body(f'<font name="{FONT_BOLD}" color="#01696F">•</font>  {item}'))
    s.append(S(0.1))

    for st in step_list([
        "Identify what you're trying to buy or fund.",
        "Follow the decision tree — answer each question and it guides you to the right appropriation.",
        "When in doubt, the Quick Reference Table has examples of what each color covers.",
        "If you're still unsure, ask your resource manager — never guess on appropriations.",
    ]):
        s.append(st)

    s.append(S(0.25))

    # ── Page 4: Tool 2 — EVM Formulas Quick Reference ──
    s.append(section("Tool 2: EVM Formulas Quick Reference"))
    s.append(S(0.15))

    s.append(bold_body("What It Is"))
    s.append(S(0.05))
    s.append(callout_box(
        "A one-page reference card for Earned Value Management — the system DoD uses to measure "
        "whether a program is on track for cost and schedule. It's the universal language of "
        "defense program performance."
    ))
    s.append(S(0.1))

    s.append(analogy_box(
        "EVM is like checking the fuel gauge AND the GPS at the same time. How much fuel you've "
        "burned (cost) tells you one thing. Where you actually are on the map (schedule) tells "
        "you another. EVM compares both to where you planned to be — and that comparison tells "
        "you whether you're heading for trouble."
    ))
    s.append(S(0.1))

    s.append(bold_body("Key Metrics in Plain English"))
    s.append(S(0.05))
    s.append(styled_table(
        ["Metric", "Full Name", "Plain English"],
        [
            ["BCWS", "Budgeted Cost of Work Scheduled", "What you planned to spend by now"],
            ["BCWP", "Budgeted Cost of Work Performed", "What you actually earned (work completed)"],
            ["ACWP", "Actual Cost of Work Performed", "What you actually spent"],
            ["CV", "Cost Variance (BCWP − ACWP)", "Are you over or under budget?"],
            ["SV", "Schedule Variance (BCWP − BCWS)", "Are you ahead or behind schedule?"],
            ["CPI", "Cost Performance Index (BCWP ÷ ACWP)", "For every $1 spent, how much work do you get?"],
            ["SPI", "Schedule Performance Index (BCWP ÷ BCWS)", "How efficiently are you using time?"],
            ["EAC", "Estimate at Completion", "Where are you headed if nothing changes?"],
        ],
        col_widths=[CONTENT_W * 0.09, CONTENT_W * 0.35, CONTENT_W * 0.56],
    ))
    s.append(S(0.1))

    s.append(bold_body("What's Inside"))
    s.append(S(0.05))
    for item in [
        "All major EVM formulas with plain-English definitions you can actually remember.",
        "Interpretation guide — what a CPI of 0.85 actually means for your program.",
        "\"Pin to your wall\" format — designed to be printed and kept within arm's reach.",
    ]:
        s.append(body(f'<font name="{FONT_BOLD}" color="#01696F">•</font>  {item}'))
    s.append(S(0.1))

    s.append(bold_body("How to Use It"))
    s.append(S(0.05))
    s.append(body(
        "Keep this open during any program review. When someone says \"our CPI is 0.87\" — find that "
        "on the reference card. It means for every dollar spent, you're only getting 87 cents of work. "
        "That's a cost overrun trend. If CPI drops below 0.90, you're in trouble — and historically, "
        "programs almost never recover once CPI dips below 0.85."
    ))

    s.append(S(0.25))

    # ── Page 5: Tool 3 — PPBE Cycle Quick Reference ──
    s.append(section("Tool 3: PPBE Cycle Quick Reference"))
    s.append(S(0.15))

    s.append(bold_body("What It Is"))
    s.append(S(0.05))
    s.append(callout_box(
        "A one-page map of the Planning, Programming, Budgeting, and Execution cycle — the annual "
        "process through which DoD decides how to spend its money. If you've ever wondered why your "
        "funding request takes two years, this explains it."
    ))
    s.append(S(0.1))

    s.append(analogy_box(
        "The PPBE cycle is like the DoD's annual household budget meeting — except it takes 2 years, "
        "involves Congress, and the decisions made this year affect programs 3–5 years from now. "
        "Understanding where you are in the cycle explains why your funding request got delayed, "
        "why your program office is in a budget drill, or why a new initiative can't start until FY28."
    ))
    s.append(S(0.1))

    s.append(bold_body("The Four Phases"))
    s.append(S(0.05))
    s.append(styled_table(
        ["Phase", "What Happens", "Key Products"],
        [
            ["Planning", "Strategy and priorities are set. \"What do we need to accomplish?\"",
             "National Defense Strategy, Strategic Guidance"],
            ["Programming", "Priorities become programs with resources. \"How much for each program?\"",
             "Program Objective Memorandum (POM)"],
            ["Budgeting", "Numbers are refined for the President's Budget. \"Show me the exact dollars.\"",
             "Budget Estimate Submission (BES), President's Budget"],
            ["Execution", "Congress approves and money gets spent. \"Now go execute.\"",
             "Appropriations Act, Obligation/Expenditure tracking"],
        ],
        col_widths=[CONTENT_W * 0.15, CONTENT_W * 0.45, CONTENT_W * 0.4],
    ))
    s.append(S(0.1))

    s.append(bold_body("What's Inside"))
    s.append(S(0.05))
    for item in [
        "Full cycle timeline with phases mapped to the calendar year and key decision milestones.",
        "Major products at each phase — what documents matter and when they're due.",
        "Congressional timeline integration — how the appropriations process runs in parallel.",
    ]:
        s.append(body(f'<font name="{FONT_BOLD}" color="#01696F">•</font>  {item}'))
    s.append(S(0.1))

    s.append(bold_body("How to Use It"))
    s.append(S(0.05))
    s.append(body(
        "Find where you are in the calendar year. That tells you which phase you're in, what decisions "
        "are being made right now, and what you can and can't change about your program's funding. "
        "If you're in the Execution phase, the money is already decided — you're managing what you've got. "
        "If you're in the Programming phase, now is when you fight for next year's dollars."
    ))

    s.append(S(0.25))

    # ── Page 6: Tool 4 — Wrap Rate Calculator ──
    s.append(section("Tool 4: Wrap Rate Calculator"))
    s.append(S(0.15))

    s.append(bold_body("What It Is"))
    s.append(S(0.05))
    s.append(callout_box(
        "A calculator that shows you the fully-loaded cost of a contractor employee — what a "
        "defense company actually charges the government for one hour of a person's time, and "
        "why it's 2–3x their actual salary."
    ))
    s.append(S(0.1))

    s.append(analogy_box(
        "If you hire someone at $50/hour, you're not paying $50/hour. You're paying their salary "
        "plus your share of their benefits, plus the office they sit in, plus a slice of the "
        "company's admin staff, plus a small profit margin. Wrap rate is that total number expressed "
        "as a multiplier. A 2.5x wrap rate means a $50/hour employee costs the government $125/hour."
    ))
    s.append(S(0.1))

    s.append(bold_body("The Four Layers of Cost"))
    s.append(S(0.05))
    s.append(styled_table(
        ["Layer", "What It Covers", "Typical Range"],
        [
            ["Direct Labor", "Base salary / hourly rate", "—"],
            ["Fringe", "Benefits — health insurance, retirement, paid leave", "25–40%"],
            ["Overhead", "Facility costs, support staff, equipment", "40–100%"],
            ["G&amp;A", "Corporate overhead — executives, BD, legal, HR", "10–25%"],
            ["Fee / Profit", "The contractor's margin", "5–10%"],
        ],
        col_widths=[CONTENT_W * 0.2, CONTENT_W * 0.55, CONTENT_W * 0.25],
    ))
    s.append(S(0.1))

    s.append(bold_body("What's Inside"))
    s.append(S(0.05))
    for item in [
        "Wrap Rate Calculator — enter your base rates, and the fully-loaded cost calculates automatically.",
        "Rate Comparison table — typical wrap rates by contractor type: large prime, mid-tier, small business, and SETA.",
        "Instructions tab explaining each rate component and where to find your company's actual rates.",
    ]:
        s.append(body(f'<font name="{FONT_BOLD}" color="#01696F">•</font>  {item}'))
    s.append(S(0.1))

    for st in step_list([
        "Enter your labor category's hourly rate in the blue cells.",
        "Enter your indirect rates (fringe, overhead, G&amp;A) — these come from your accounting system or disclosed rates.",
        "The loaded rate calculates automatically. This is what the government actually pays.",
        "Compare against the Rate Comparison tab to see if your rates are competitive for your company type.",
    ]):
        s.append(st)

    s.append(S(0.25))

    # ── Page 7: Quick Reference Card ──
    s.append(section("Quick Reference Card"))
    s.append(S(0.15))
    s.append(body(
        "Keep this page handy. It's a one-page summary of the key concepts across all four cheat "
        "sheets — the stuff that comes up in every meeting, review, and budget drill."
    ))
    s.append(S(0.15))

    s.append(bold_body("The 4 Colors of Money"))
    s.append(S(0.05))
    colors_data = [
        ["RDT&amp;E", "Research &amp; development. New capabilities. 2-year money."],
        ["Procurement", "Buying production systems and equipment. 3-year money."],
        ["O&amp;M", "Day-to-day operations, maintenance, services. 1-year money — use it or lose it."],
        ["MILCON", "Building or renovating facilities over $1M. 5-year money."],
    ]
    for color_name, color_desc in colors_data:
        s.append(body(f'<font name="{FONT_BOLD}" color="#01696F">{color_name}:</font>  {color_desc}'))
    s.append(S(0.15))

    s.append(bold_body("EVM Thresholds to Know"))
    s.append(S(0.05))
    s.append(styled_table(
        ["Indicator", "Value", "What It Means"],
        [
            ["CPI below 0.90", "Trouble", "You're spending more than planned per unit of work. Cost overrun trend."],
            ["CPI below 0.85", "Serious trouble", "Programs almost never recover once CPI drops this low."],
            ["SPI below 0.90", "Schedule risk", "You're behind schedule. Work is not getting done as planned."],
            ["CPI or SPI above 1.0", "On track (or ahead)", "You're getting more work per dollar/per time period than planned."],
        ],
        col_widths=[CONTENT_W * 0.22, CONTENT_W * 0.18, CONTENT_W * 0.6],
    ))
    s.append(S(0.15))

    s.append(bold_body("PPBE Phases in Plain English"))
    s.append(S(0.05))
    ppbe_items = [
        ("Planning:", "\"What do we need?\" — strategy and priorities."),
        ("Programming:", "\"How much for each program?\" — the POM."),
        ("Budgeting:", "\"Show me the exact dollars\" — the President's Budget."),
        ("Execution:", "\"Go spend it wisely\" — obligation and expenditure tracking."),
    ]
    for label, desc in ppbe_items:
        s.append(body(f'<font name="{FONT_BOLD}" color="#01696F">{label}</font>  {desc}'))
    s.append(S(0.15))

    s.append(bold_body("Typical Wrap Rate Ranges"))
    s.append(S(0.05))
    s.append(styled_table(
        ["Contractor Type", "Typical Wrap Rate", "Notes"],
        [
            ["Large Prime", "2.5x – 3.2x", "Higher overhead, more corporate infrastructure"],
            ["Mid-Tier", "2.2x – 2.8x", "Moderate overhead structure"],
            ["Small Business", "1.8x – 2.4x", "Lower overhead, but rates vary widely"],
            ["SETA / FFRDC", "2.0x – 2.6x", "Non-profit or quasi-government support"],
        ],
        col_widths=[CONTENT_W * 0.25, CONTENT_W * 0.25, CONTENT_W * 0.5],
    ))

    s.append(S(0.2))
    s.append(body(
        '<font name="' + FONT_BOLD + '" color="#01696F">Want to go deeper?</font> '
        'Visit <a href="https://acqlerate.com" color="#01696F">acqlerate.com</a> for deep-dive '
        'guides on defense finance, acquisition strategy, and the full Acqlerate template library.'
    ))

    return s


# ═══════════════════════════════════════════════════════════════════
# BUILD ALL 3 PDFs
# ═══════════════════════════════════════════════════════════════════

if __name__ == "__main__":
    base = "/home/user/workspace/acq-pro/products"

    print("Building Pack 1: PM Essentials...")
    build_pdf(
        f"{base}/pack1-pm-essentials/pack-guide.pdf",
        "PM Essentials Template Pack",
        "Your plain-English guide to 5 tools every defense program manager needs",
        pack1_story,
    )

    print("Building Pack 2: GovCon Proposal Toolkit...")
    build_pdf(
        f"{base}/pack2-proposal-toolkit/pack-guide.pdf",
        "GovCon Proposal Toolkit",
        "5 tools that separate proposals that win from proposals that lose",
        pack2_story,
    )

    print("Building Pack 3: Defense Finance Cheat Sheets...")
    build_pdf(
        f"{base}/pack3-finance-cheat-sheets/pack-guide.pdf",
        "Defense Finance Cheat Sheets",
        "4 tools that make defense money make sense — finally",
        pack3_story,
    )

    print("\nAll 3 PDFs generated successfully!")
