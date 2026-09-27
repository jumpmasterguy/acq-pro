#!/usr/bin/env python3
"""
Acqlerate Certificate of Completion generator.
Usage: python3 certificate.py '<json>'
JSON fields: name, module_id, module_title, clps, date, email
Outputs the PDF to stdout as binary.
"""

import sys
import json
import io
import os
from datetime import datetime

# Suppress reportlab warnings
import warnings
warnings.filterwarnings("ignore")

from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, HRFlowable, Table, TableStyle
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.pdfgen import canvas as rl_canvas

# Brand colors
NAVY   = colors.HexColor("#0C2340")
TEAL   = colors.HexColor("#01696F")
GOLD   = colors.HexColor("#C8972A")
LIGHT  = colors.HexColor("#F7F6F2")
MUTED  = colors.HexColor("#6B7280")
WHITE  = colors.white

def generate(data: dict) -> bytes:
    name         = data.get("name", "Defense Professional")
    module_id    = data.get("module_id", "")
    module_title = data.get("module_title", "Defense Acquisition Module")
    clps         = data.get("clps", 0)
    date_str     = data.get("date", datetime.now().strftime("%B %d, %Y"))
    email        = data.get("email", "")

    # DAWIA functional area mapping
    FUNC_MAP = {
        "foundations": "Program Management (PM) · Contracting (CON)",
        "finance":     "Business Financial Management (BFM) · Program Management (PM)",
        "contracts":   "Contracting (CON) · Program Management (PM)",
        "data":        "Program Management (PM) · Business Financial Management (BFM)",
        "capture":     "Contracting (CON) · Program Management (PM)",
        "operations":  "Program Management (PM)",
    }
    func_areas = FUNC_MAP.get(module_id, "Program Management (PM)")
    hours = round(clps, 1)

    buf = io.BytesIO()
    w, h = letter  # 612 x 792

    c = rl_canvas.Canvas(buf, pagesize=letter)
    c.setTitle(f"Acqlerate Certificate of Completion — {module_title}")
    c.setAuthor("Acqlerate")

    # ── Background ──────────────────────────────────────────────────────────
    c.setFillColor(NAVY)
    c.rect(0, 0, w, h, fill=1, stroke=0)

    # Top accent bar
    c.setFillColor(TEAL)
    c.rect(0, h - 8, w, 8, fill=1, stroke=0)

    # Gold left accent bar
    c.setFillColor(GOLD)
    c.rect(0, 0, 6, h, fill=1, stroke=0)

    # Inner white certificate panel
    margin = 48
    panel_x = margin + 20
    panel_y = 110
    panel_w = w - (margin + 20) * 2
    panel_h = h - 140
    c.setFillColor(WHITE)
    c.roundRect(panel_x, panel_y, panel_w, panel_h, 12, fill=1, stroke=0)

    # Subtle teal border on panel
    c.setStrokeColor(TEAL)
    c.setLineWidth(1.5)
    c.roundRect(panel_x, panel_y, panel_w, panel_h, 12, fill=0, stroke=1)

    # ── Header inside panel ──────────────────────────────────────────────────
    # Acqlerate wordmark
    c.setFillColor(NAVY)
    c.setFont("Helvetica-Bold", 22)
    c.drawCentredString(w / 2, panel_y + panel_h - 52, "ACQLERATE")

    c.setFillColor(TEAL)
    c.setFont("Helvetica", 10)
    c.drawCentredString(w / 2, panel_y + panel_h - 68, "Defense Acquisitions Academy  ·  acqlerate.com")

    # Decorative line
    c.setStrokeColor(TEAL)
    c.setLineWidth(0.5)
    c.line(panel_x + 40, panel_y + panel_h - 80, panel_x + panel_w - 40, panel_y + panel_h - 80)

    # ── Certificate of Completion heading ───────────────────────────────────
    c.setFillColor(NAVY)
    c.setFont("Helvetica", 11)
    c.drawCentredString(w / 2, panel_y + panel_h - 108, "CERTIFICATE OF COMPLETION")

    c.setFillColor(TEAL)
    c.setFont("Helvetica-Bold", 9)
    c.drawCentredString(w / 2, panel_y + panel_h - 122, "This certifies that")

    # ── Recipient name ───────────────────────────────────────────────────────
    c.setFillColor(NAVY)
    c.setFont("Helvetica-Bold", 30)
    c.drawCentredString(w / 2, panel_y + panel_h - 170, name)

    # Name underline
    name_width = c.stringWidth(name, "Helvetica-Bold", 30)
    c.setStrokeColor(GOLD)
    c.setLineWidth(1.5)
    ul_x = w / 2 - name_width / 2
    c.line(ul_x, panel_y + panel_h - 175, ul_x + name_width, panel_y + panel_h - 175)

    # ── Completion statement ─────────────────────────────────────────────────
    c.setFillColor(MUTED)
    c.setFont("Helvetica", 10)
    c.drawCentredString(w / 2, panel_y + panel_h - 200, "has successfully completed")

    # Module title
    c.setFillColor(NAVY)
    c.setFont("Helvetica-Bold", 18)
    # Wrap long titles
    if len(module_title) > 40:
        words = module_title.split()
        mid = len(words) // 2
        line1 = " ".join(words[:mid])
        line2 = " ".join(words[mid:])
        c.drawCentredString(w / 2, panel_y + panel_h - 230, line1)
        c.drawCentredString(w / 2, panel_y + panel_h - 252, line2)
        title_bottom = panel_y + panel_h - 262
    else:
        c.drawCentredString(w / 2, panel_y + panel_h - 235, module_title)
        title_bottom = panel_y + panel_h - 245

    c.setFillColor(MUTED)
    c.setFont("Helvetica", 9)
    c.drawCentredString(w / 2, title_bottom - 16, "offered by Acqlerate — Defense Acquisitions Academy")

    # ── CLP Box ──────────────────────────────────────────────────────────────
    box_y = title_bottom - 80
    box_x = w / 2 - 200
    box_w = 400
    box_h = 56

    c.setFillColor(colors.HexColor("#E6F2F3"))
    c.setStrokeColor(TEAL)
    c.setLineWidth(1)
    c.roundRect(box_x, box_y, box_w, box_h, 8, fill=1, stroke=1)

    c.setFillColor(TEAL)
    c.setFont("Helvetica-Bold", 22)
    c.drawCentredString(w / 2, box_y + 28, f"{hours} CLPs")

    c.setFillColor(NAVY)
    c.setFont("Helvetica", 8.5)
    c.drawCentredString(w / 2, box_y + 14, "Continuous Learning Points  ·  1 CLP = 1 hour of instruction")

    # ── Details grid ────────────────────────────────────────────────────────
    detail_y = box_y - 30
    detail_items = [
        ("Date Completed", date_str),
        ("Instruction Hours", f"{hours} hours"),
        ("DAWIA Functional Areas", func_areas),
        ("Self-Report Portal", "CAPPMIS (Army) / eDACM (Navy/AF) / FAITAS (Civ)"),
    ]
    label_x = panel_x + 44
    value_x = panel_x + 200
    row_h = 20

    for i, (label, value) in enumerate(detail_items):
        y = detail_y - i * row_h
        c.setFillColor(TEAL)
        c.setFont("Helvetica-Bold", 8)
        c.drawString(label_x, y, label.upper())
        c.setFillColor(NAVY)
        c.setFont("Helvetica", 9)
        # Wrap long values
        if len(value) > 55:
            c.drawString(value_x, y + 3, value[:55])
            c.drawString(value_x, y - 8, value[55:])
        else:
            c.drawString(value_x, y, value)

    # Separator
    sep_y = detail_y - len(detail_items) * row_h - 8
    c.setStrokeColor(colors.HexColor("#D1D5DB"))
    c.setLineWidth(0.5)
    c.line(panel_x + 44, sep_y, panel_x + panel_w - 44, sep_y)

    # ── Self-report note ─────────────────────────────────────────────────────
    note_y = sep_y - 18
    c.setFillColor(MUTED)
    c.setFont("Helvetica-Oblique", 8)
    note = ("This certificate documents completion of self-paced online training. "
            "DAW members may self-report this training as External Training in their DAU learning portal. "
            "Content maps to DAWIA functional area requirements per DAU CLP policy.")
    # Simple word wrap
    words = note.split()
    lines = []
    cur = ""
    for word in words:
        test = cur + (" " if cur else "") + word
        if c.stringWidth(test, "Helvetica-Oblique", 8) < panel_w - 90:
            cur = test
        else:
            lines.append(cur)
            cur = word
    if cur:
        lines.append(cur)

    for i, line in enumerate(lines):
        c.drawString(panel_x + 44, note_y - i * 11, line)

    # ── Footer ───────────────────────────────────────────────────────────────
    c.setFillColor(WHITE)
    c.setFont("Helvetica", 8)
    c.drawCentredString(w / 2, 75, "Acqlerate — Defense Acquisitions Academy  ·  acqlerate.com")
    c.setFillColor(colors.HexColor("#94A3B8"))
    c.setFont("Helvetica", 7.5)
    c.drawCentredString(w / 2, 60, f"Certificate ID: ACQ-{module_id.upper()}-{datetime.now().strftime('%Y%m')}-{abs(hash(email + name)) % 100000:05d}")

    c.save()
    return buf.getvalue()


if __name__ == "__main__":
    if len(sys.argv) < 2:
        sys.exit(1)
    data = json.loads(sys.argv[1])
    sys.stdout.buffer.write(generate(data))
