#!/usr/bin/env python3
"""
Generate Acqlerate Lesson Book PDFs from the curriculum.

The books are rendered with WeasyPrint from HTML in the shared Acqlerate print
style (scripts/print/acq-print.css, from the Acqlerate Design System): General
Sans throughout, navy for structure, teal for brand chrome, the warm parchment
and stone neutrals for rules, washes and secondary text, the navy hero cover and
the standard footer. Gold is reserved for XP in the app and is not used in print.
The generator handles every content block type the curriculum uses today.

Usage:
    npx tsx scripts/export-curriculum.ts          # writes /tmp/curriculum-export.json
    python3 scripts/generate_lesson_book.py \
        --json /tmp/curriculum-export.json \
        --out server/assets/lesson-books \
        --modules business,smallbiz            # omit to build every module

Requires: pip install weasyprint (v53+, which embeds the General Sans woff2
files from client/public/fonts directly). The few symbols General Sans lacks
(arrows, the quiz check mark) fall back to DejaVu Sans. Emoji never print:
status lights become brand-coloured dots and decorative icons are dropped.
"""
from __future__ import annotations

import argparse
import base64
import html
import json
import os
import re
import sys
from pathlib import Path

# ── Palette: Acqlerate Design System tokens, exactly as in acq-print.css ─────
NAVY         = "#0D1B2A"   # acq-navy: headings and structure
INK          = "#1A1A1A"   # text-body
MUTED        = "#4F4A44"   # text-secondary (stone-600)
FAINT        = "#6E6659"   # text-muted (stone-500)
RULE         = "#EAE0CE"   # border-subtle (parchment-200)
RULE_STRONG  = "#D9CBB3"   # border-default (parchment-300)
SOFT         = "#FAF6EE"   # surface-page (parchment-50)
TEAL         = "#01696F"   # brand: eyebrows, accents, rules
TEAL_SOFT    = "#E6F2F3"   # surface-brand-wash
CYAN         = "#4FC3CB"   # teal's stand-in on navy only
HERO         = "linear-gradient(135deg, #0D2137 0%, #123047 55%, #0A1B2D 100%)"
WARN_WASH    = "#FDF2EE"   # status: warning callouts
WARN_RULE    = "#F4C7B4"
WARN_INK     = "#B4410F"
SUCCESS_WASH = "#ECFDF5"   # status: the correct quiz answer
SUCCESS_INK  = "#065F46"

# General Sans, the brand face, straight from the site's own font files.
_ROOT = Path(__file__).resolve().parents[1]
FONT_DIR = _ROOT / "client" / "public" / "fonts"
FONT_FACES = "\n".join(
    f"@font-face {{ font-family: 'General Sans'; font-weight: {w}; font-style: normal; "
    f"src: url('{(FONT_DIR / f'GeneralSans-{n}.woff2').as_uri()}') format('woff2'); }}"
    for w, n in ((400, "Regular"), (500, "Medium"), (600, "Semibold"), (700, "Bold"))
)
SANS = "'General Sans', 'DejaVu Sans', sans-serif"

MODULE_NUMBERS = {
    "foundations": 1, "finance": 2, "contracts": 3, "data": 4, "capture": 5,
    "operations": 6, "business": 7, "smallbiz": 8, "compliance": 9,
    "preaward": 10, "lifecycle": 11, "onramp": 12, "veteran": 13, "history": 14,
}

FILENAMES = {
    "foundations": "module-1-foundations.pdf",
    "finance": "module-2-finance.pdf",
    "contracts": "module-3-contracts.pdf",
    "data": "module-4-data-analytics.pdf",
    "capture": "module-5-capture-bd.pdf",
    "operations": "module-6-operations-leadership.pdf",
    "business": "module-7-business-of-defense-contracting.pdf",
    "smallbiz": "module-8-small-business.pdf",
    "compliance": "module-9-compliance-stack.pdf",
    "preaward": "module-10-government-pre-award.pdf",
    "lifecycle": "module-11-beyond-award.pdf",
    "onramp": "module-12-startup-on-ramp.pdf",
    "veteran": "module-13-veteran-transition.pdf",
    "history": "module-14-why-the-rules-exist.pdf",
}

LEVEL_LABEL = {"intermediate": "Intermediate", "advanced": "Advanced"}


def esc(v) -> str:
    return html.escape(str(v if v is not None else ""))


def minutes(duration: str) -> int:
    m = re.search(r"\d+", str(duration or ""))
    return int(m.group()) if m else 0


def rich(text: str) -> str:
    """Escape, then honour the **bold** markers the lesson copy uses."""
    out = esc(text)
    return re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", out, flags=re.S)


# Emoji have no place in a printed book: they fall back to a colour emoji font
# that looks nothing like the rest of the page. The risk-matrix traffic lights
# become flat brand-coloured dots; purely decorative icons are dropped.
STATUS_DOTS = {"🟢": "#2E8B57", "🟡": "#E0B23A", "🟠": "#D1571A", "🔴": "#B42318"}
_ICON = re.compile(r"[\U0001F000-\U0001FAFF☀-➿️‍]")


def is_icon(s) -> bool:
    """True when a field holds only emoji/symbol characters (a decorative icon)."""
    s = str(s or "").strip()
    return bool(s) and not _ICON.sub("", s).strip()


def print_symbols(doc: str) -> str:
    for ch, color in STATUS_DOTS.items():
        doc = doc.replace(ch, f'<span class="dot" style="background:{color}"></span>')
    doc = doc.replace("‑", "-")      # non-breaking hyphen: General Sans has none
    return _ICON.sub("", doc)


def join_parts(parts: list[str]) -> str:
    """Join a visual block's text fields for print without em dashes: a space
    after a finished sentence, a middle dot between fragments."""
    out = ""
    for p in parts:
        p = p.strip()
        if not out:
            out = p
        elif out[-1] in ".!?:)":
            out += " " + p
        else:
            out += " · " + p
    return out


def bullet(raw) -> str:
    """List items across the curriculum use the 'label|||description' convention."""
    label, sep, desc = str(raw).partition("|||")
    if sep:
        return f"<li><strong>{rich(label)}</strong> {rich(desc)}</li>"
    return f"<li>{rich(raw)}</li>"


# ── Content blocks ───────────────────────────────────────────────────────────

def render_block(b: dict) -> str:
    t = b.get("type")
    heading = b.get("heading")
    head_html = f'<h3 class="sub">{esc(heading)}</h3>' if heading else ""

    if t == "text":
        return f'{head_html}<p>{rich(b.get("body", ""))}</p>'

    if t in ("callout", "tip", "lucas_note"):
        return (
            '<div class="callout">'
            + (f'<div class="callout-h">{esc(heading)}</div>' if heading else "")
            + f'<p>{rich(b.get("body", ""))}</p></div>'
        )

    if t == "warning":
        return (
            '<div class="callout warn">'
            + (f'<div class="callout-h">{esc(heading)}</div>' if heading else "")
            + f'<p>{rich(b.get("body", ""))}</p></div>'
        )

    if t == "highlight":
        return f'<div class="highlight"><p>{rich(b.get("body", ""))}</p></div>'

    if t == "list":
        items = []
        for raw in b.get("items", []) or []:
            items.append(bullet(raw))
        body = f'<p>{rich(b["body"])}</p>' if b.get("body") else ""
        return f'{head_html}{body}<ul class="bullets">' + "".join(items) + "</ul>"

    if t in ("table", "table_visual"):
        headers = b.get("headers") or []
        rows = b.get("rows") or []
        thead = "".join(f"<th>{esc(h)}</th>" for h in headers)
        tbody = "".join(
            "<tr>" + "".join(f"<td>{rich(c)}</td>" for c in row) + "</tr>" for row in rows
        )
        note = f'<p class="tnote">{rich(b["note"])}</p>' if b.get("note") else ""
        if not headers and not rows:
            # A few older lessons carry an empty visual placeholder immediately
            # before the real table. Nothing to draw.
            return head_html if b.get("note") else ""
        return (
            f"{head_html}<table><thead><tr>{thead}</tr></thead>"
            f"<tbody>{tbody}</tbody></table>{note}"
        )

    if t == "formula":
        return (
            f'{head_html}<div class="formula"><div class="formula-eq">'
            f'{esc(b.get("formula", ""))}</div>'
            + (f'<p class="formula-x">{rich(b.get("explanation", ""))}</p>'
               if b.get("explanation") else "")
            + "</div>"
        )

    if t == "stat_row":
        cells = []
        for s in b.get("stats", []) or []:
            cells.append(
                '<div class="stat">'
                + ("" if is_icon(s.get("value")) else f'<div class="stat-v">{esc(s.get("value", ""))}</div>') +
                f'<div class="stat-l">{esc(s.get("label", ""))}</div>'
                + (f'<div class="stat-s">{esc(s["sub"])}</div>' if s.get("sub") else "")
                + "</div>"
            )
        return f'{head_html}<div class="stats">' + "".join(cells) + "</div>"

    if t == "expandable_list":
        intro = f'<p>{rich(b["body"])}</p>' if b.get("body") else ""
        rows = []
        for it in b.get("expandableItems", []) or []:
            inner = []
            for c in (it.get("content") or []):
                # Older modules nest a heading or title plus a bullet list here;
                # newer ones just carry a body. Render whatever is present.
                head = c.get("heading") or c.get("title")
                if head:
                    inner.append(f'<div class="exp-sub">{esc(head)}</div>')
                if c.get("body"):
                    inner.append(f'<p class="exp-body">{rich(c["body"])}</p>')
                if c.get("items"):
                    lis = "".join(bullet(x) for x in c["items"])
                    inner.append(f'<ul class="bullets">{lis}</ul>')
                if isinstance(c.get("grid"), list) and c["grid"]:
                    cells = "".join(
                        f'<li><strong>{esc(g.get("label", ""))}</strong> '
                        f'{rich(g.get("value") or g.get("desc") or "")}</li>'
                        for g in c["grid"] if isinstance(g, dict)
                    )
                    inner.append(f'<ul class="bullets">{cells}</ul>')
            badge = (f'<span class="exp-badge">{esc(it["badge"])}</span>'
                     if it.get("badge") else "")
            sub = (f'<div class="exp-label-sub">{esc(it["sublabel"])}</div>'
                   if it.get("sublabel") else "")
            rows.append(
                '<div class="exp">'
                f'<div class="exp-h">{esc(it.get("label", ""))}{badge}</div>'
                + sub
                + (f'<p class="exp-sum">{rich(it["summary"])}</p>' if it.get("summary") else "")
                + "".join(inner) + "</div>"
            )
        return f'{head_html}{intro}<div class="exps">' + "".join(rows) + "</div>"

    if t == "related_lesson":
        refs = []
        for r in b.get("refs", []) or []:
            sub = f' <span class="rel-sub">{esc(r["sub"])}</span>' if r.get("sub") else ""
            refs.append(f'<li><strong>{esc(r.get("label", ""))}</strong>{sub}</li>')
        return (
            f'<div class="related"><div class="related-h">'
            f'{esc(heading or "Build on this")}</div><ul>' + "".join(refs) + "</ul></div>"
        )

    if t == "two_col":
        rows = "".join(
            f'<tr><td><strong>{esc(r.get("label", ""))}</strong>'
            + (f'<br><span class="tsub">{esc(r["badge"])}</span>' if r.get("badge") else "")
            + f'</td><td>{rich(r.get("text", ""))}</td></tr>'
            for r in (b.get("rows") or [])
        )
        return f"{head_html}<table class=\"twocol\"><tbody>{rows}</tbody></table>"

    if t == "lesson_image":
        cap = b.get("caption") or b.get("alt")
        return f'<p class="figcap">{esc(cap)}</p>' if cap else ""

    # Everything else is one of the bespoke visual blocks the app renders as a
    # React component. In print they become their own text: the prose fields
    # first, then whatever list payload they carry. Without this the PDFs
    # silently dropped thousands of words that the lessons do contain.
    bits = [head_html]
    for key in ("sub", "body", "explanation"):
        if b.get(key):
            bits.append(f'<p>{rich(b[key])}</p>')

    LABELS = ("label", "title", "phase", "name", "term", "oldTerm", "newTerm")
    DESCS = ("desc", "text", "detail", "summary", "meaning", "formula",
             "sublabel", "note", "value", "content")

    def render_payload(seq) -> str:
        out = []
        for entry in seq:
            if not isinstance(entry, dict):
                out.append(bullet(entry))
                continue
            label = next((entry[k] for k in LABELS if entry.get(k)), "")
            parts = [str(entry[k]) for k in DESCS
                     if entry.get(k) and not isinstance(entry[k], (list, dict)) and not is_icon(entry[k])]
            line = f"<strong>{esc(label)}</strong> " if label else ""
            line += rich(join_parts(parts)) if parts else ""
            nested = ""
            for nk in ("steps", "items", "content"):
                if isinstance(entry.get(nk), list) and entry[nk]:
                    nested += f'<ul class="bullets">{render_payload(entry[nk])}</ul>'
            out.append(f"<li>{line}{nested}</li>")
        return "".join(out)

    for key in ("items", "steps", "phases", "segments", "gauges", "stats"):
        seq = b.get(key)
        if isinstance(seq, list) and seq:
            bits.append(f'<ul class="bullets">{render_payload(seq)}</ul>')
    if b.get("note") and not b.get("explanation"):
        bits.append(f'<p class="tnote">{rich(b["note"])}</p>')
    return "".join(bits)


def render_content(blocks: list) -> str:
    out, current = [], "novice"
    for b in blocks or []:
        level = b.get("level") or "novice"
        if level != current:
            current = level
            if level in LEVEL_LABEL:
                out.append(f'<div class="tier"><span>{LEVEL_LABEL[level]}</span></div>')
        out.append(render_block(b))
    return "".join(out)


def render_levels(levels: dict) -> tuple[str, list]:
    """The alternative lesson shape: levels.{novice,intermediate,advanced}, each
    with its own sections and quiz. One lesson uses it (finance-8) and the
    generator used to skip it entirely, which is why that lesson printed as
    three pages when it is in fact the longest in the curriculum."""
    if not isinstance(levels, dict):
        return "", []
    out, quiz = [], []
    for tier in ("novice", "intermediate", "advanced"):
        data = levels.get(tier)
        if not isinstance(data, dict):
            continue
        if tier in LEVEL_LABEL:
            out.append(f'<div class="tier"><span>{LEVEL_LABEL[tier]}</span></div>')
        for sec in data.get("sections") or []:
            if sec.get("heading"):
                out.append(f'<h3 class="sub">{esc(sec["heading"])}</h3>')
            if sec.get("content"):
                out.append(f'<p>{rich(sec["content"])}</p>')
            if sec.get("items"):
                lis = "".join(bullet(x) for x in sec["items"])
                out.append(f'<ul class="bullets">{lis}</ul>')
            for key in ("table", "rows"):
                if isinstance(sec.get(key), list) and sec[key]:
                    out.append(render_block({"type": "table", "headers": sec.get("headers") or [],
                                             "rows": sec[key]}))
        quiz.extend(data.get("quiz") or [])
    return "".join(out), quiz


# ── Key terms and quiz ───────────────────────────────────────────────────────

def render_key_terms(terms: list) -> str:
    if not terms:
        return ""
    rows = "".join(
        f'<div class="kt"><div class="kt-t">{esc(t.get("term", ""))}</div>'
        f'<div class="kt-d">{rich(t.get("definition", ""))}</div></div>'
        for t in terms
    )
    return f'<div class="terms"><div class="terms-h">Key Terms</div>{rows}</div>'


LETTERS = "ABCDEFGH"


def render_quiz(quiz: list) -> str:
    if not quiz:
        return ""
    items = []
    for q in quiz:
        qt = q.get("type", "options")
        head = f'<div class="q">{rich(q.get("question", ""))}</div>'

        if qt == "drag_order":
            steps = "".join(bullet(s) for s in (q.get("orderedItems") or []))
            body = f'<div class="q-note">Correct order</div><ol class="order">{steps}</ol>'
        elif qt == "drag_match":
            pairs = "".join(
                f'<tr><td>{rich(p.get("left", ""))}</td>'
                f'<td>{rich(p.get("right", ""))}</td></tr>'
                for p in (q.get("pairs") or [])
            )
            body = (
                '<div class="q-note">Correct matches</div>'
                f'<table class="match"><tbody>{pairs}</tbody></table>'
            )
        else:
            opts = []
            correct = q.get("correct")
            for i, opt in enumerate(q.get("options") or []):
                # Older modules attach a per-option rationale as 'option|||why'.
                # In print that is worth keeping: it explains each distractor.
                text, _, why = str(opt).partition("|||")
                note = f'<div class="optwhy">{rich(why)}</div>' if why.strip() else ""
                if i == correct:
                    opts.append(
                        f'<div class="opt ok">&#10003; {LETTERS[i]}. {rich(text)}</div>{note}'
                    )
                else:
                    opts.append(f'<div class="opt">{LETTERS[i]}. {rich(text)}</div>{note}')
            body = "".join(opts)

        why = (
            f'<div class="why"><div class="why-h">Why</div>'
            f'<p>{rich(q["explanation"])}</p></div>'
            if q.get("explanation") else ""
        )
        items.append(f'<div class="qblock">{head}{body}{why}</div>')
    return (
        '<div class="check"><h2 class="check-h">Knowledge Check</h2>'
        + "".join(items) + "</div>"
    )


# ── Page assembly ────────────────────────────────────────────────────────────

# The brand icon, embedded as a data URI. WeasyPrint's SVG support mangles the
# master (its gradients and drop-shadow filter render as stray artefacts), and
# the mark must never be redrawn by hand, so read the master raster instead.
# 62px at ~300dpi is ~194px, so the 256px master is the right source.
_ICON_PNG = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
                         "brand", "acqlerate-icon-256.png")
with open(_ICON_PNG, "rb") as _fh:
    LOGO_SVG = ('<img alt="" style="width:100%;height:100%;display:block" '
                'src="data:image/png;base64,' + base64.b64encode(_fh.read()).decode() + '">')

# The full logo (icon + two-tone "Acq"/"lerate" wordmark), rendered from the master
# icon and General Sans by scripts/brand/make_brand_pngs.py. Never set the name as
# spaced capitals: the cover and the running head both use these lockups.
_BRAND_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "brand")


def _png_uri(name: str) -> str:
    with open(os.path.join(_BRAND_DIR, name), "rb") as fh:
        return "data:image/png;base64," + base64.b64encode(fh.read()).decode()


LOCKUP_DARK = _png_uri("acqlerate-lockup-dark-print.png")
LOCKUP_LIGHT = _png_uri("acqlerate-lockup-light-print.png")

# Every page gets the faint logo watermark after WeasyPrint writes the file.
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "brand"))
from pdf_brand import stamp as brand_stamp  # noqa: E402


def build_html(mod: dict) -> str:
    num = MODULE_NUMBERS.get(mod["id"], 0)
    lessons = mod.get("lessons") or []
    total_min = sum(minutes(l.get("duration")) for l in lessons)
    # The footer label is a running element (HTML), so it is escaped like any text.
    running_title = f'Module {num}: {mod["title"]} · Lesson Book'

    toc = "".join(
        f'<div class="toc-row"><span class="toc-n">{i:02d}</span>'
        f'<span class="toc-t">{esc(l.get("title", ""))}</span>'
        f'<span class="toc-dots"></span>'
        f'<span class="toc-d">{minutes(l.get("duration"))} min</span></div>'
        for i, l in enumerate(lessons, 1)
    )

    body_parts = []
    for i, l in enumerate(lessons, 1):
        levels_html, levels_quiz = render_levels(l.get("levels"))
        body_parts.append(
            f'<section class="lesson">'
            f'<div class="eyebrow">{esc(mod["title"]).upper()} &middot; LESSON {i}</div>'
            f'<h1 class="lesson-t">{esc(l.get("title", ""))}</h1>'
            f'<div class="lesson-d">{esc(l.get("duration", ""))}</div>'
            + (f'<div class="lede"><p>{rich(l["description"])}</p></div>'
               if l.get("description") else "")
            + render_content(l.get("content"))
            + levels_html
            + render_key_terms(l.get("keyTerms"))
            + render_quiz((l.get("quiz") or []) + levels_quiz)
            + "</section>"
        )

    assessment = ""
    if mod.get("assessment"):
        assessment = (
            '<section class="lesson">'
            f'<div class="eyebrow">{esc(mod["title"]).upper()} &middot; MODULE ASSESSMENT</div>'
            '<h1 class="lesson-t">Module Assessment</h1>'
            '<div class="lesson-d">Pass this to unlock the next skill level in the app.</div>'
            + render_quiz([
                {**q, "type": q.get("type", "options")} for q in mod["assessment"]
            ])
            + "</section>"
        )

    css = CSS_TEMPLATE
    return f"""<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8">
<title>{esc(mod['title'])} | Acqlerate Lesson Book</title>
<style>{css}</style></head>
<body>
<div class="foot-logo"><img alt="Acqlerate" src="{LOCKUP_LIGHT}"></div>
<div class="foot-label">{esc(running_title)}</div>
<div class="cover">
  <img class="cover-lockup" alt="Acqlerate" src="{LOCKUP_DARK}">
  <div class="cover-main">
    <div class="cover-rule"></div>
    <div class="cover-mod">Module {num}</div>
    <h1 class="cover-t">{esc(mod['title'])}</h1>
    <p class="cover-s">{esc(mod.get('description', ''))}</p>
  </div>
  <div class="cover-fine"><span>{len(lessons)} Lessons &nbsp;&middot;&nbsp; ~{total_min} Minutes
      &nbsp;&middot;&nbsp; Lesson Book Edition</span><span>acqlerate.com</span></div>
</div>
<div class="toc">
  <h2 class="toc-h">Course Lessons</h2>
  {toc}
</div>
{''.join(body_parts)}
{assessment}
</body></html>"""


CSS_TEMPLATE = f"""
{FONT_FACES}

/* Pages: no top header; the shared Acqlerate footer on every page after the cover
   (thin rule, small lockup, module label, acqlerate.com and the page number). */
@page {{
  size: letter;
  margin: 0.62in 0.9in 0.8in 0.9in;
  font-family: {SANS}; font-size: 7pt; color: {FAINT};
  @bottom-left {{
    content: element(footlogo); width: 1.1in;
    margin-top: 0.3in; border-top: 0.75pt solid {RULE}; padding-top: 5pt; vertical-align: top;
  }}
  @bottom-center {{
    content: element(footlabel); width: 4.5in;
    margin-top: 0.3in; border-top: 0.75pt solid {RULE}; padding-top: 5pt; vertical-align: top;
  }}
  @bottom-right {{
    content: "acqlerate.com \\00B7  " counter(page); width: 1.1in; text-align: right; white-space: nowrap;
    font-family: {SANS}; font-size: 7pt; color: {FAINT};
    margin-top: 0.3in; border-top: 0.75pt solid {RULE}; padding-top: 5pt; vertical-align: top; line-height: 12pt;
  }}
}}
@page :first {{
  margin: 0;
  @bottom-left {{ content: none; border: none; }}
  @bottom-center {{ content: none; border: none; }}
  @bottom-right {{ content: none; border: none; }}
}}
.foot-logo {{ position: running(footlogo); }}
.foot-logo img {{ height: 12pt; width: auto; display: block; }}
.foot-label {{ position: running(footlabel); font-family: {SANS}; font-size: 7pt; color: {FAINT};
  text-align: center; line-height: 12pt; white-space: nowrap; }}

html {{ font-family: {SANS}; }}
body {{ font-family: {SANS}; font-size: 10pt; line-height: 1.55; color: {INK}; margin: 0; }}
p {{ margin: 0 0 8pt; text-align: left; }}
strong, b {{ font-weight: 600; color: {NAVY}; }}

/* Cover: the same navy hero cover as every Acqlerate PDF */
.cover {{
  height: 100vh; width: 100%; position: relative; overflow: hidden;
  background: {HERO}; color: #ffffff; page-break-after: always;
}}
.cover-lockup {{ position: absolute; top: 0.5in; left: 0.62in; height: 21pt; width: auto; display: block; }}
.cover-main {{ position: absolute; top: 2.2in; left: 0.62in; right: 0.62in; }}
.cover-rule {{ width: 42pt; height: 2.25pt; background: {CYAN}; border-radius: 1.5pt; margin-bottom: 11pt; }}
.cover-mod {{ font-family: {SANS}; font-size: 8pt; font-weight: 700; letter-spacing: 0.07em;
  text-transform: uppercase; color: {CYAN}; margin-bottom: 8pt; }}
.cover-t {{ font-family: {SANS}; font-size: 36pt; font-weight: 700; color: #ffffff; line-height: 1.04;
  letter-spacing: -0.025em; margin: 0 0 14pt; max-width: 6.6in; }}
.cover-s {{ font-family: {SANS}; font-size: 12pt; font-weight: 400; color: rgba(255,255,255,0.82);
  line-height: 1.45; margin: 0; max-width: 5.9in; }}
.cover-fine {{ position: absolute; left: 0.62in; right: 0.62in; bottom: 0.5in;
  display: flex; justify-content: space-between; border-top: 0.75pt solid rgba(255,255,255,0.16);
  padding-top: 8pt; font-family: {SANS}; font-size: 7.6pt; color: rgba(255,255,255,0.68); }}

/* Tracked uppercase labels stay at 0.07em (acq-print.css uses up to 0.14em in
   Chromium): with WeasyPrint, from 0.08em up, PDF text extraction (search, copy,
   screen readers) starts splitting words such as "B OTH" or "SOFTWARE ,". */

/* Contents */
.toc {{ page-break-after: always; }}
.toc-h {{ font-family: {SANS}; font-size: 20pt; font-weight: 700; letter-spacing: -0.02em; color: {NAVY};
  line-height: 1.12; margin: 0 0 4pt; border-bottom: 1.5px solid {NAVY}; padding-bottom: 8pt; }}
.toc-h + .toc-row {{ margin-top: 8pt; }}
.toc-row {{ display: flex; align-items: baseline; gap: 8pt; padding: 7pt 0; border-bottom: 1px solid {RULE}; }}
.toc-n {{ font-family: {SANS}; font-size: 9pt; font-weight: 700; color: {TEAL}; width: 22pt; }}
.toc-t {{ font-family: {SANS}; font-size: 10.5pt; font-weight: 500; color: {NAVY}; flex: 1; }}
.toc-d {{ font-family: {SANS}; font-size: 8.5pt; color: {FAINT}; }}

/* Lesson */
.lesson {{ page-break-before: always; }}
.eyebrow {{ font-family: {SANS}; font-size: 7.4pt; font-weight: 700; letter-spacing: 0.07em; color: {TEAL}; margin-bottom: 6pt; }}
.lesson-t {{ font-family: {SANS}; font-size: 22pt; font-weight: 700; color: {NAVY}; line-height: 1.1;
  letter-spacing: -0.02em; margin: 0 0 5pt; }}
.lesson-d {{ font-family: {SANS}; font-size: 8.5pt; color: {FAINT}; margin-bottom: 14pt; }}
.lede {{ border-left: 3px solid {TEAL}; padding: 3pt 0 3pt 12pt; margin: 0 0 16pt; }}
.lede p {{ font-size: 11pt; line-height: 1.5; color: {MUTED}; margin: 0; }}

h3.sub {{ font-family: {SANS}; font-size: 12pt; font-weight: 700; color: {NAVY}; letter-spacing: -0.01em;
  line-height: 1.25; margin: 17pt 0 6pt; page-break-after: avoid; }}

.tier {{ margin: 20pt 0 10pt; border-top: 1px solid {RULE_STRONG}; page-break-after: avoid; }}
.tier span {{
  display: inline-block; font-family: {SANS}; font-size: 6.8pt; font-weight: 700;
  letter-spacing: 0.07em; text-transform: uppercase; color: {TEAL};
  background: {TEAL_SOFT}; border-radius: 99px; padding: 2pt 8pt; margin-top: -6pt;
}}

.callout {{ background: {TEAL_SOFT}; border-radius: 9px; padding: 10pt 13pt 3pt; margin: 12pt 0; page-break-inside: avoid; }}
.callout-h {{ font-family: {SANS}; font-size: 7.2pt; font-weight: 700; letter-spacing: 0.07em; text-transform: uppercase;
  color: {TEAL}; margin-bottom: 4pt; }}
.callout p {{ font-size: 9.8pt; color: {INK}; }}
.callout.warn {{ background: {WARN_WASH}; border: 1px solid {WARN_RULE}; }}
.callout.warn .callout-h {{ color: {WARN_INK}; }}

.highlight {{ background: {SOFT}; border-left: 3px solid {TEAL}; border-radius: 0 9px 9px 0;
  padding: 10pt 13pt 3pt; margin: 12pt 0; page-break-inside: avoid; }}
.highlight p {{ font-size: 10pt; font-weight: 500; color: {NAVY}; }}

ul.bullets {{ margin: 6pt 0 10pt; padding-left: 14pt; }}
ul.bullets li {{ margin-bottom: 5pt; font-size: 10pt; }}
ul.bullets li::marker {{ color: {TEAL}; }}
ul.bullets ul.bullets {{ list-style-type: "\\2013  "; margin: 4pt 0 2pt; }}  /* en dash: General Sans has no open circle */
ul.bullets ul.bullets li::marker {{ color: {FAINT}; }}

table {{ width: 100%; border-collapse: collapse; margin: 8pt 0 13pt; font-size: 8.9pt; line-height: 1.4; page-break-inside: avoid; }}
th {{ font-family: {SANS}; font-size: 7pt; font-weight: 700; letter-spacing: 0.07em; text-transform: uppercase;
  color: {FAINT}; text-align: left; padding: 5pt 7pt; border-bottom: 1.5px solid {NAVY}; vertical-align: bottom; }}
td {{ border-bottom: 1px solid {RULE}; padding: 5.5pt 7pt; vertical-align: top; }}
tbody tr:nth-child(even) {{ background: {SOFT}; }}

.formula {{ background: {SOFT}; border: 1px solid {RULE}; border-radius: 9px; padding: 11pt 13pt 3pt; margin: 10pt 0; page-break-inside: avoid; }}
.formula-eq {{ font-family: {SANS}; font-size: 10pt; font-weight: 500; color: {NAVY}; line-height: 1.6;
  margin-bottom: 7pt; white-space: pre-wrap; }}  /* formulas carry their own line breaks */
.formula-x {{ font-size: 9.5pt; color: {MUTED}; }}

.dot {{ display: inline-block; width: 7pt; height: 7pt; border-radius: 50%; margin-right: 3pt; vertical-align: 0; }}
.stats {{ display: flex; gap: 8pt; margin: 10pt 0 14pt; page-break-inside: avoid; }}
.stat {{ flex: 1; border: 1px solid {RULE}; border-top: 3px solid {TEAL}; border-radius: 9px; padding: 8pt 9pt; }}
.stat-v {{ font-family: {SANS}; font-size: 14pt; font-weight: 700; letter-spacing: -0.02em; color: {NAVY}; line-height: 1.1; }}
.stat-l {{ font-family: {SANS}; font-size: 8pt; font-weight: 500; color: {INK}; margin-top: 3pt; line-height: 1.3; }}
.stat-s {{ font-size: 7.6pt; color: {FAINT}; margin-top: 2pt; line-height: 1.3; }}

.exps {{ margin: 6pt 0 12pt; }}
.exp {{ border-left: 2px solid {RULE_STRONG}; padding: 0 0 2pt 11pt; margin-bottom: 10pt; page-break-inside: avoid; }}
.exp-h {{ font-family: {SANS}; font-size: 10pt; font-weight: 700; color: {NAVY}; margin-bottom: 3pt; }}
.exp-badge {{ font-family: {SANS}; font-size: 6.6pt; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase;
  color: {TEAL}; background: {TEAL_SOFT}; border-radius: 99px; padding: 1pt 6pt; margin-left: 6pt; vertical-align: 1px; }}
.exp-sum {{ font-size: 9.8pt; margin-bottom: 4pt; }}
.exp-label-sub {{ font-family: {SANS}; font-size: 8.5pt; color: {MUTED}; margin-bottom: 3pt; }}
.exp-sub {{ font-family: {SANS}; font-size: 8.6pt; font-weight: 600; color: {NAVY}; margin: 6pt 0 2pt; }}
.exp-body {{ font-size: 9.6pt; color: {MUTED}; margin-bottom: 3pt; }}
.tnote {{ font-size: 8.8pt; color: {FAINT}; margin: -5pt 0 11pt; }}
.tsub {{ font-family: {SANS}; font-size: 7.6pt; font-weight: 400; color: {FAINT}; }}
.figcap {{ font-size: 8.8pt; color: {FAINT}; margin: 6pt 0 10pt; }}
table.twocol, table.match {{ border-top: 1px solid {RULE_STRONG}; }}
table.twocol td {{ vertical-align: top; }}
table.twocol td:first-child {{ width: 26%; }}

.related {{ background: {SOFT}; border-radius: 9px; padding: 10pt 13pt; margin: 12pt 0; page-break-inside: avoid; }}
.related-h {{ font-family: {SANS}; font-size: 7.2pt; font-weight: 700; letter-spacing: 0.07em; text-transform: uppercase;
  color: {NAVY}; margin-bottom: 5pt; }}
.related ul {{ margin: 0; padding-left: 13pt; }}
.related li {{ font-size: 9.3pt; margin-bottom: 3pt; }}
.related li::marker {{ color: {TEAL}; }}
.rel-sub {{ color: {MUTED}; }}

.terms {{ background: {SOFT}; border-radius: 9px; border-top: 3px solid {TEAL}; padding: 13pt 15pt 5pt; margin: 18pt 0 0; page-break-inside: avoid; }}
.terms-h {{ font-family: {SANS}; font-size: 12pt; font-weight: 700; letter-spacing: -0.01em; color: {NAVY}; margin-bottom: 9pt; }}
.kt {{ margin-bottom: 8pt; }}
.kt-t {{ font-family: {SANS}; font-size: 9.4pt; font-weight: 700; color: {NAVY}; }}
.kt-d {{ font-size: 9.3pt; color: {MUTED}; }}

.check {{ page-break-before: always; }}
/* The module assessment has no lesson body: keep its questions under its title. */
.lesson-d + .check {{ page-break-before: auto; }}
.check-h {{ font-family: {SANS}; font-size: 18pt; font-weight: 700; letter-spacing: -0.02em; color: {NAVY}; line-height: 1.12;
  border-bottom: 1.5px solid {NAVY}; padding-bottom: 7pt; margin: 0 0 15pt; }}
.qblock {{ margin-bottom: 16pt; page-break-inside: avoid; }}
.q {{ font-family: {SANS}; font-size: 10pt; font-weight: 600; color: {NAVY}; line-height: 1.45; margin-bottom: 7pt; }}
.opt {{ font-size: 9.8pt; padding: 3.5pt 8pt; margin-bottom: 2pt; border-radius: 6px; }}
.opt.ok {{ background: {SUCCESS_WASH}; color: {SUCCESS_INK}; font-weight: 600; }}
.opt.ok strong {{ color: {SUCCESS_INK}; }}
.optwhy {{ font-size: 8.5pt; color: {FAINT}; margin: 0 0 4pt 20pt; }}
.q-note {{ font-family: {SANS}; font-size: 7pt; font-weight: 700; letter-spacing: 0.07em;
  text-transform: uppercase; color: {FAINT}; margin-bottom: 4pt; }}
ol.order {{ margin: 0 0 6pt; padding-left: 18pt; }}
ol.order li {{ font-size: 9.8pt; margin-bottom: 2pt; }}
ol.order li::marker {{ color: {TEAL}; font-weight: 700; }}
table.match {{ font-size: 9.3pt; margin-top: 0; }}
table.match td {{ background: #ffffff; }}
table.match tbody tr:nth-child(even) td {{ background: {SOFT}; }}
.why {{ background: {SOFT}; border-left: 3px solid {TEAL}; border-radius: 0 9px 9px 0; padding: 8pt 12pt 2pt; margin-top: 7pt; }}
.why-h {{ font-family: {SANS}; font-size: 7pt; font-weight: 700; letter-spacing: 0.07em; text-transform: uppercase; color: {TEAL}; margin-bottom: 3pt; }}
.why p {{ font-size: 9.3pt; color: {MUTED}; }}
"""


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--json", default="/tmp/curriculum-export.json")
    ap.add_argument("--out", default="server/assets/lesson-books")
    ap.add_argument("--modules", default="", help="comma-separated module ids; default all")
    ap.add_argument("--html-only", action="store_true")
    args = ap.parse_args()

    with open(args.json) as fh:
        modules = json.load(fh)

    wanted = [m.strip() for m in args.modules.split(",") if m.strip()]
    if wanted:
        modules = [m for m in modules if m["id"] in wanted]
        missing = set(wanted) - {m["id"] for m in modules}
        if missing:
            print(f"error: unknown module id(s): {', '.join(sorted(missing))}", file=sys.stderr)
            return 1

    os.makedirs(args.out, exist_ok=True)
    if not args.html_only:
        from weasyprint import HTML  # imported late so --html-only needs no install

    for mod in modules:
        doc = print_symbols(build_html(mod))
        name = FILENAMES.get(mod["id"], f"module-{mod['id']}.pdf")
        if args.html_only:
            path = os.path.join(args.out, name.replace(".pdf", ".html"))
            with open(path, "w") as fh:
                fh.write(doc)
        else:
            path = os.path.join(args.out, name)
            HTML(string=doc).write_pdf(path)
            brand_stamp(path)
        size = os.path.getsize(path)
        print(f"{mod['id']:12s} -> {path}  ({size/1024:.0f} KB)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
