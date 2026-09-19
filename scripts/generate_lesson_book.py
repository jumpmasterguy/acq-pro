#!/usr/bin/env python3
"""
Generate Acqlerate Lesson Book PDFs from the curriculum.

The six original module PDFs were produced with WeasyPrint from HTML; this
script reproduces that design exactly (fonts, palette, page furniture) so new
modules are indistinguishable from the originals, and it handles every content
block type the curriculum uses today.

Usage:
    npx tsx scripts/export-curriculum.ts          # writes /tmp/curriculum-export.json
    python3 scripts/generate_lesson_book.py \
        --json /tmp/curriculum-export.json \
        --out server/assets/lesson-books \
        --modules business,smallbiz            # omit to build every module

Requires: pip install weasyprint  (plus the Liberation fonts, which are the
default serif/sans on most Linux images and are what the originals used).
"""
from __future__ import annotations

import argparse
import base64
import html
import json
import os
import re
import sys

# ── Palette, lifted from the original PDFs so new books match exactly ────────
NAVY        = "#0b2545"
COVER_MID   = "#2c4a78"
GOLD        = "#d9b64c"
BODY        = "#1c2430"
MUTED       = "#454f61"
LIGHT       = "#8a93a6"
PANEL       = "#f4f6fa"
PANEL_ALT   = "#f7f8fb"
CORRECT_BG  = "#eaf3ea"
CORRECT_FG  = "#245c2e"
COVER_SUB   = "#cdd8ea"
COVER_META  = "#9db3d6"
COVER_FOOT  = "#7d8fb3"
TEAL        = "#01696f"
RULE        = "#d7dde8"

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
                f'<div class="stat-v">{esc(s.get("value", ""))}</div>'
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
            parts = [str(entry[k]) for k in DESCS if entry.get(k) and not isinstance(entry[k], (list, dict))]
            line = f"<strong>{esc(label)}</strong> " if label else ""
            line += rich(" — ".join(parts)) if parts else ""
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


def build_html(mod: dict) -> str:
    num = MODULE_NUMBERS.get(mod["id"], 0)
    lessons = mod.get("lessons") or []
    total_min = sum(minutes(l.get("duration")) for l in lessons)
    # The @top-center content string is CSS, not HTML: entities are not parsed,
    # so this needs the real character and no escaping.
    running = f'ACQLERATE \u00b7 MODULE {num}: {mod["title"].upper()}'.replace('"', "'")

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

    css = CSS_TEMPLATE.replace("__RUNNING__", running)
    return f"""<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8">
<title>{esc(mod['title'])} — Acqlerate Lesson Book</title>
<style>{css}</style></head>
<body>
<div class="cover">
  <div class="cover-inner">
    <div class="logo">{LOGO_SVG}</div>
    <div class="brand">ACQLERATE</div>
    <div class="cover-mod">MODULE {num}</div>
    <h1 class="cover-t">{esc(mod['title'])}</h1>
    <p class="cover-s">{esc(mod.get('description', ''))}</p>
    <div class="cover-rule"></div>
    <div class="cover-meta">{len(lessons)} Lessons &nbsp;&middot;&nbsp; ~{total_min} Minutes
      &nbsp;&middot;&nbsp; Lesson Book Edition</div>
  </div>
</div>
<div class="toc">
  <h2 class="toc-h">Course Lessons</h2>
  {toc}
</div>
{''.join(body_parts)}
{assessment}
</body></html>"""


CSS_TEMPLATE = f"""
@page {{
  size: letter;
  margin: 26mm 22mm 22mm 22mm;
  @top-center {{
    content: "__RUNNING__";
    font-family: "Liberation Sans", sans-serif; font-size: 8pt; letter-spacing: 0.08em;
    color: {LIGHT};
  }}
  @bottom-center {{
    content: counter(page);
    font-family: "Liberation Serif", serif; font-size: 9pt; color: {LIGHT};
  }}
}}
@page :first {{ margin: 0; @top-center {{ content: ""; }} @bottom-center {{ content: ""; }} }}

body {{ font-family: "Liberation Serif", serif; font-size: 11pt; line-height: 1.5; color: {BODY}; }}
p {{ margin: 0 0 9pt; text-align: left; }}
strong {{ font-weight: bold; }}

/* Cover */
.cover {{
  page: first; height: 100vh; width: 100%;
  background: linear-gradient(160deg, {NAVY} 0%, {COVER_MID} 60%, {NAVY} 100%);
  page-break-after: always; position: relative;
}}
.cover-inner {{ position: absolute; left: 26mm; right: 26mm; top: 34%; }}
.logo {{ width: 62px; height: 62px; margin-bottom: 16pt; }}
.brand {{ font-family: "Liberation Sans", sans-serif; font-size: 13pt; letter-spacing: 0.22em; color: {GOLD}; margin-bottom: 26pt; }}
.cover-mod {{ font-family: "Liberation Sans", sans-serif; font-size: 12pt; letter-spacing: 0.12em; color: {COVER_META}; margin-bottom: 6pt; }}
.cover-t {{ font-family: "Liberation Sans", sans-serif; font-size: 34pt; font-weight: bold; color: #ffffff; line-height: 1.12; margin: 0 0 14pt; }}
.cover-s {{ font-style: italic; font-size: 13pt; color: {COVER_SUB}; line-height: 1.45; margin: 0 0 22pt; max-width: 118mm; }}
.cover-rule {{ height: 1px; background: rgba(255,255,255,0.28); width: 112mm; margin-bottom: 10pt; }}
.cover-meta {{ font-family: "Liberation Sans", sans-serif; font-size: 9pt; color: {COVER_FOOT}; }}

/* Contents */
.toc {{ page-break-after: always; }}
.toc-h {{ font-family: "Liberation Sans", sans-serif; font-size: 20pt; color: {NAVY}; margin: 0 0 4pt; }}
.toc {{ }}
.toc-h + .toc-row {{ margin-top: 10pt; }}
.toc-h {{ border-bottom: 2.2pt solid {NAVY}; padding-bottom: 8pt; }}
.toc-row {{ display: flex; align-items: baseline; gap: 8pt; padding: 6pt 0; border-bottom: 0.5pt dotted {RULE}; }}
.toc-n {{ font-family: "Liberation Sans", sans-serif; font-size: 10pt; font-weight: bold; color: {GOLD}; width: 22pt; }}
.toc-t {{ font-family: "Liberation Sans", sans-serif; font-size: 10.5pt; color: {BODY}; flex: 1; }}
.toc-d {{ font-family: "Liberation Sans", sans-serif; font-size: 9pt; color: {LIGHT}; }}

/* Lesson */
.lesson {{ page-break-before: always; }}
.eyebrow {{ font-family: "Liberation Sans", sans-serif; font-size: 9pt; font-weight: bold; letter-spacing: 0.09em; color: {GOLD}; margin-bottom: 6pt; }}
.lesson-t {{ font-family: "Liberation Sans", sans-serif; font-size: 21pt; font-weight: bold; color: {NAVY}; line-height: 1.2; margin: 0 0 4pt; }}
.lesson-d {{ font-family: "Liberation Sans", sans-serif; font-size: 9pt; color: {LIGHT}; margin-bottom: 12pt; }}
.lede {{ border-left: 3pt solid {GOLD}; padding: 2pt 0 2pt 12pt; margin: 0 0 14pt; }}
.lede p {{ font-style: italic; font-size: 11pt; color: {MUTED}; margin: 0; }}

h3.sub {{ font-family: "Liberation Sans", sans-serif; font-size: 12.5pt; font-weight: bold; color: {NAVY}; margin: 16pt 0 6pt; page-break-after: avoid; }}

.tier {{ margin: 18pt 0 10pt; border-top: 0.8pt solid {RULE}; page-break-after: avoid; }}
.tier span {{
  display: inline-block; font-family: "Liberation Sans", sans-serif; font-size: 7.5pt; font-weight: bold;
  letter-spacing: 0.12em; text-transform: uppercase; color: {NAVY};
  background: {PANEL}; border: 0.5pt solid {RULE}; border-radius: 3pt;
  padding: 2pt 7pt; margin-top: -7pt;
}}

.callout {{ background: {PANEL}; border-left: 3pt solid {NAVY}; padding: 9pt 12pt 2pt; margin: 12pt 0; page-break-inside: avoid; }}
.callout.warn {{ border-left-color: #b45309; }}
.callout-h {{ font-family: "Liberation Sans", sans-serif; font-size: 8.5pt; font-weight: bold; letter-spacing: 0.08em; text-transform: uppercase; color: {NAVY}; margin-bottom: 5pt; }}
.callout p {{ font-size: 10.5pt; color: {MUTED}; }}

.highlight {{ background: #fdf8ea; border-left: 3pt solid {GOLD}; padding: 9pt 12pt 2pt; margin: 12pt 0; page-break-inside: avoid; }}
.highlight p {{ font-size: 10.5pt; color: {BODY}; }}

ul.bullets {{ margin: 6pt 0 10pt; padding-left: 14pt; }}
ul.bullets li {{ margin-bottom: 5pt; font-size: 10.5pt; }}

table {{ width: 100%; border-collapse: collapse; margin: 8pt 0 12pt; font-size: 9pt; page-break-inside: avoid; }}
th {{ background: {NAVY}; color: #ffffff; font-family: "Liberation Sans", sans-serif; font-size: 8pt; font-weight: bold;
     letter-spacing: 0.06em; text-transform: uppercase; text-align: left; padding: 6pt 7pt; }}
td {{ border-bottom: 0.5pt solid {RULE}; padding: 5pt 7pt; vertical-align: top; }}
tbody tr:nth-child(even) {{ background: {PANEL}; }}

.formula {{ background: {PANEL}; border: 0.5pt solid {RULE}; border-radius: 3pt; padding: 10pt 12pt 3pt; margin: 10pt 0; page-break-inside: avoid; }}
.formula-eq {{ font-family: "Liberation Mono", monospace; font-size: 10pt; color: {NAVY};
  margin-bottom: 7pt; white-space: pre-wrap; }}  /* formulas carry their own line breaks */
.formula-x {{ font-size: 10pt; color: {MUTED}; }}

.stats {{ display: flex; gap: 8pt; margin: 10pt 0 14pt; page-break-inside: avoid; }}
.stat {{ flex: 1; background: {PANEL}; border-top: 2pt solid {GOLD}; padding: 8pt 9pt; }}
.stat-v {{ font-family: "Liberation Sans", sans-serif; font-size: 13pt; font-weight: bold; color: {NAVY}; line-height: 1.15; }}
.stat-l {{ font-family: "Liberation Sans", sans-serif; font-size: 8pt; color: {BODY}; margin-top: 3pt; line-height: 1.3; }}
.stat-s {{ font-size: 8pt; color: {LIGHT}; margin-top: 2pt; line-height: 1.3; }}

.exps {{ margin: 6pt 0 12pt; }}
.exp {{ border-left: 2pt solid {RULE}; padding: 0 0 2pt 10pt; margin-bottom: 9pt; page-break-inside: avoid; }}
.exp-h {{ font-family: "Liberation Sans", sans-serif; font-size: 10pt; font-weight: bold; color: {NAVY}; margin-bottom: 3pt; }}
.exp-badge {{ font-family: "Liberation Sans", sans-serif; font-size: 7pt; font-weight: bold; letter-spacing: 0.08em; text-transform: uppercase;
  color: {MUTED}; background: {PANEL}; border: 0.5pt solid {RULE}; border-radius: 2pt; padding: 1pt 5pt; margin-left: 6pt; }}
.exp-sum {{ font-size: 10pt; margin-bottom: 4pt; }}
.exp-label-sub {{ font-family: "Liberation Sans", sans-serif; font-size: 8.5pt; color: {MUTED}; margin-bottom: 3pt; }}
.exp-sub {{ font-family: "Liberation Sans", sans-serif; font-size: 9pt; font-weight: bold; color: {MUTED}; margin: 5pt 0 2pt; }}
.tnote {{ font-size: 9.5pt; color: {MUTED}; font-style: italic; margin: -4pt 0 10pt; }}
.tsub {{ font-family: "Liberation Sans", sans-serif; font-size: 8pt; color: {LIGHT}; }}
.figcap {{ font-size: 9.5pt; color: {MUTED}; font-style: italic; margin: 6pt 0 10pt; }}
table.twocol td {{ vertical-align: top; }}
table.twocol td:first-child {{ width: 26%; }}
.exp-body {{ font-size: 10pt; color: {MUTED}; margin-bottom: 3pt; }}

.related {{ background: {PANEL}; border-radius: 3pt; padding: 9pt 12pt; margin: 12pt 0; page-break-inside: avoid; }}
.related-h {{ font-family: "Liberation Sans", sans-serif; font-size: 8.5pt; font-weight: bold; letter-spacing: 0.08em; text-transform: uppercase; color: {NAVY}; margin-bottom: 5pt; }}
.related ul {{ margin: 0; padding-left: 13pt; }}
.related li {{ font-size: 9.5pt; margin-bottom: 3pt; }}
.rel-sub {{ color: {MUTED}; }}

.terms {{ background: {PANEL}; border-top: 2.2pt solid {NAVY}; padding: 12pt 14pt 4pt; margin: 16pt 0 0; page-break-inside: avoid; }}
.terms-h {{ font-family: "Liberation Sans", sans-serif; font-size: 12pt; font-weight: bold; color: {NAVY}; margin-bottom: 9pt; }}
.kt {{ margin-bottom: 8pt; }}
.kt-t {{ font-family: "Liberation Sans", sans-serif; font-size: 9.5pt; font-weight: bold; color: {NAVY}; }}
.kt-d {{ font-size: 9.5pt; color: {MUTED}; }}

.check {{ page-break-before: always; }}
.check-h {{ font-family: "Liberation Sans", sans-serif; font-size: 15pt; font-weight: bold; color: {NAVY};
  border-bottom: 2.2pt solid {NAVY}; padding-bottom: 7pt; margin: 0 0 14pt; }}
.qblock {{ margin-bottom: 15pt; page-break-inside: avoid; }}
.q {{ font-family: "Liberation Sans", sans-serif; font-size: 10pt; font-weight: bold; color: {BODY}; margin-bottom: 7pt; }}
.opt {{ font-size: 10pt; padding: 3pt 6pt; margin-bottom: 2pt; }}
.opt.ok {{ background: {CORRECT_BG}; color: {CORRECT_FG}; font-weight: bold; }}
.optwhy {{ font-size: 8.5pt; color: {LIGHT}; margin: 0 0 4pt 18pt; }}
.q-note {{ font-family: "Liberation Sans", sans-serif; font-size: 7.5pt; font-weight: bold; letter-spacing: 0.08em;
  text-transform: uppercase; color: {LIGHT}; margin-bottom: 4pt; }}
ol.order {{ margin: 0 0 6pt; padding-left: 16pt; }}
ol.order li {{ font-size: 10pt; margin-bottom: 2pt; }}
table.match {{ font-size: 9.5pt; margin-top: 0; }}
table.match td {{ background: {PANEL_ALT}; }}
table.match tbody tr:nth-child(even) td {{ background: {PANEL}; }}
.why {{ background: {PANEL_ALT}; border-left: 3pt solid {COVER_META}; padding: 8pt 11pt 1pt; margin-top: 7pt; }}
.why-h {{ font-family: "Liberation Sans", sans-serif; font-size: 7.5pt; font-weight: bold; letter-spacing: 0.1em; text-transform: uppercase; color: {MUTED}; margin-bottom: 4pt; }}
.why p {{ font-size: 9.5pt; color: {MUTED}; }}
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
        doc = build_html(mod)
        name = FILENAMES.get(mod["id"], f"module-{mod['id']}.pdf")
        if args.html_only:
            path = os.path.join(args.out, name.replace(".pdf", ".html"))
            with open(path, "w") as fh:
                fh.write(doc)
        else:
            path = os.path.join(args.out, name)
            HTML(string=doc).write_pdf(path)
        size = os.path.getsize(path)
        print(f"{mod['id']:12s} -> {path}  ({size/1024:.0f} KB)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
