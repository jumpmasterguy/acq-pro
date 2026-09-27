#!/usr/bin/env python3
"""Deterministic whiteboard-diagram renderer for blog posts.

Why this exists
---------------
generate_blog_post.py used to ask the model for a raw inline <svg> with
hand-placed absolute coordinates. That failed in exactly the ways hand-placed
coordinates always fail. The 19 Sep 2026 post shipped with:

  * <rect stroke="#0D1B2A"/> and no fill attribute. SVG's default fill is
    BLACK, so two boxes rendered as solid black slabs with near-black text
    on top of them.
  * <text x="540"> at a box's centre with no text-anchor, so the label
    left-aligned from the centre and ran outside the box. "Contractor
    absorbs the $2,000,000" was clipped to "$2,00".

No prompt wording reliably prevents that, because the model is being asked to
do arithmetic and typography in its head. So the split is now:

    model  -> WHAT to show   (a small JSON spec: labels, values, groupings)
    python -> WHERE to put it (coordinates, wrapping, centring, arrows)

Code cannot forget to set a fill or centre a label, and it measures text
before it places it. Every shape gets an explicit fill; every label is
centred and wrapped to fit its box; box heights grow to fit their content;
arrows are computed edge-to-edge. render() raises on anything that would
land outside the canvas, so a bad diagram fails the build instead of
shipping.

Usage:
    from diagram import render
    svg = render({"kind": "flow", "steps": [...], "outcomes": [...]})

Kinds: flow, compare, bars, timeline. See SPEC_DOC for the shapes.
"""

W, H = 720, 360          # viewBox; .post-figure svg scales it to the column
PAD = 20                 # keep all ink inside this margin
INK = "#0D1B2A"
PRIMARY = "#01696F"
WASH = "#E6F2F3"
HIGHLIGHT = "#C9A227"
PAPER = "#FCFCF7"        # matches .post-figure background

SPEC_DOC = """
flow      {"kind":"flow","steps":[{"label":str,"value":str?}...],
           "outcomes":[{"heading":str,"lines":[str,...]}...]}   1-3 steps, 0-3 outcomes
compare   {"kind":"compare","columns":[{"heading":str,"lines":[str,...]}...]}   2-3 columns
bars      {"kind":"bars","bars":[{"label":str,"value":number,"display":str}...],"note":str?}   2-6 bars
timeline  {"kind":"timeline","steps":[{"label":str,"sub":str?}...]}   3-5 steps
""".strip()


# ---------------------------------------------------------------------------
# Text measurement. Approximate advance widths for the stylesheet's sans stack,
# as a fraction of font-size. Deliberately errs wide: overestimating means a
# label wraps a word early, underestimating means it runs off the box.
# ---------------------------------------------------------------------------
_NARROW = set("iljtfrI.,:;'!|()[]/ ")
_WIDE = set("mwMW@%&")
_CAPS = set("ABCDEFGHJKLNOPQRSTUVXYZ")


def text_width(s: str, size: float) -> float:
    total = 0.0
    for ch in s:
        if ch in _NARROW:
            total += 0.30
        elif ch in _WIDE:
            total += 0.88
        elif ch in _CAPS:
            total += 0.68
        elif ch.isdigit() or ch == "$":
            total += 0.57
        else:
            total += 0.52
    return total * size


def wrap(s: str, size: float, max_w: float) -> list:
    """Greedy wrap on spaces. A single word wider than max_w is left alone
    (callers size boxes from the result, so it still fits)."""
    words, lines, cur = s.split(), [], ""
    for word in words:
        trial = f"{cur} {word}".strip()
        if cur and text_width(trial, size) > max_w:
            lines.append(cur)
            cur = word
        else:
            cur = trial
    if cur:
        lines.append(cur)
    return lines or [""]


def esc(s) -> str:
    return (str(s).replace("&", "&amp;").replace("<", "&lt;")
            .replace(">", "&gt;").replace('"', "&quot;"))


# ---------------------------------------------------------------------------
# Primitives. Every one sets fill explicitly — that is the whole point.
# ---------------------------------------------------------------------------
def box(x, y, w, h, stroke=INK, fill="none", rx=6):
    return (f'<rect x="{x:.0f}" y="{y:.0f}" width="{w:.0f}" height="{h:.0f}" rx="{rx}" '
            f'fill="{fill}" stroke="{stroke}" stroke-width="2.5" stroke-linejoin="round"/>')


def label(x, y, s, size=13, fill=INK, weight=None, anchor="middle"):
    w = f' font-weight="{weight}"' if weight else ""
    return (f'<text x="{x:.0f}" y="{y:.0f}" font-size="{size}" fill="{fill}" '
            f'text-anchor="{anchor}"{w}>{esc(s)}</text>')


def block(cx, top, lines, size=13, gap=17, fill=INK, weight=None):
    """A centred stack of pre-wrapped lines. Returns (svg, height)."""
    out = [label(cx, top + size + i * gap, ln, size, fill, weight) for i, ln in enumerate(lines)]
    return "\n".join(out), size + (len(lines) - 1) * gap


def bullets(x, top, items, size=13, gap=17, max_w=200.0, fill=INK):
    """Left-aligned bullet list with a hanging indent, so a wrapped second
    line sits under the text and not under the bullet glyph. Centring a
    bullet list reads as broken, so these are deliberately ragged-right."""
    glyph_w = text_width("\u2022 ", size)
    out, n = [], 0
    for item in items:
        lines = wrap(item, size, max_w - glyph_w)
        for i, ln in enumerate(lines):
            y = top + size + n * gap
            tx = x if i == 0 else x + glyph_w
            txt = ("\u2022 " + ln) if i == 0 else ln
            out.append(label(tx, y, txt, size, fill, anchor="start"))
            n += 1
    return "\n".join(out), (size + (n - 1) * gap if n else 0), n


def arrow(x1, y1, x2, y2, stroke=PRIMARY):
    """Line with a filled arrowhead at (x2,y2), sized off the direction vector."""
    import math
    ang = math.atan2(y2 - y1, x2 - x1)
    head, spread = 9.0, 0.42
    # stop the shaft short so it does not poke through the head
    sx, sy = x2 - math.cos(ang) * head * 0.85, y2 - math.sin(ang) * head * 0.85
    p1 = (x2 - math.cos(ang - spread) * head, y2 - math.sin(ang - spread) * head)
    p2 = (x2 - math.cos(ang + spread) * head, y2 - math.sin(ang + spread) * head)
    return (f'<line x1="{x1:.0f}" y1="{y1:.0f}" x2="{sx:.0f}" y2="{sy:.0f}" '
            f'fill="none" stroke="{stroke}" stroke-width="2.5" stroke-linecap="round"/>\n'
            f'<path d="M{x2:.1f} {y2:.1f} L{p1[0]:.1f} {p1[1]:.1f} L{p2[0]:.1f} {p2[1]:.1f} Z" '
            f'fill="{stroke}" stroke="none"/>')


# ---------------------------------------------------------------------------
# Renderers. Each returns (shapes, texts) so shapes can go in <g class="sketch">
# (the hand-drawn wobble filter) while text stays outside it and sharp.
# ---------------------------------------------------------------------------
def _flow(spec):
    steps = spec.get("steps", [])[:3]
    outs = spec.get("outcomes", [])[:3]
    if not steps:
        raise ValueError("flow needs at least one step")
    shapes, texts = [], []
    y = PAD + 10
    step_w = 330.0
    cx = W / 2

    last_bottom = y
    for i, st in enumerate(steps):
        inner = step_w - 36
        lines = wrap(st.get("label", ""), 14, inner)
        if st.get("value"):
            lines += wrap(str(st["value"]), 14, inner)
        h = max(46.0, 22 + len(lines) * 18)
        box_x = cx - step_w / 2
        shapes.append(box(box_x, y, step_w, h, stroke=INK if i == 0 else PRIMARY, fill=PAPER))
        t, _ = block(cx, y + (h - (14 + (len(lines) - 1) * 18)) / 2, lines, 14, 18)
        texts.append(t)
        last_bottom = y + h
        if i < len(steps) - 1:
            shapes.append(arrow(cx, last_bottom + 2, cx, last_bottom + 26, INK))
            y = last_bottom + 30

    if not outs:
        return shapes, texts, last_bottom + PAD

    # Outcome cards across the bottom, sized to the widest wrapped content.
    n = len(outs)
    gutter = 40.0
    avail = W - 2 * PAD - gutter * (n - 1)
    card_w = avail / n
    inner = card_w - 32
    wrapped, heights = [], []
    for o in outs:
        ls = []
        for ln in o.get("lines", []):
            ls += wrap(ln, 13, inner)
        wrapped.append(ls)
        heights.append(26 + 20 + len(ls) * 17)
    card_h = max(heights)
    card_y = last_bottom + 40

    for i, o in enumerate(outs):
        x = PAD + i * (card_w + gutter)
        ccx = x + card_w / 2
        shapes.append(box(x, card_y, card_w, card_h, stroke=INK, fill=WASH))
        texts.append(label(ccx, card_y + 24, o.get("heading", ""), 14, INK, "bold"))
        t, _ = block(ccx, card_y + 34, wrapped[i], 13, 17)
        texts.append(t)
        # arrow from the last step down into this card
        shapes.append(arrow(cx + (ccx - cx) * 0.22, last_bottom + 3, ccx, card_y - 5, PRIMARY))
    return shapes, texts, card_y + card_h + PAD


def _compare(spec):
    cols = spec.get("columns", [])[:3]
    if len(cols) < 2:
        raise ValueError("compare needs 2 or 3 columns")
    shapes, texts = [], []
    n = len(cols)
    gutter = 34.0
    avail = W - 2 * PAD - gutter * (n - 1)
    cw = avail / n
    inner = cw - 30
    # size every card to the tallest column's wrapped bullet count
    glyph = text_width("• ", 13)
    counts = [sum(len(wrap(ln, 13, inner - glyph)) for ln in c.get("lines", []))
              for c in cols]
    head_h = 40.0
    total = head_h + 22 + max(counts) * 18
    y = PAD
    for i, c in enumerate(cols):
        x = PAD + i * (cw + gutter)
        ccx = x + cw / 2
        shapes.append(box(x, y, cw, total, stroke=INK, fill=PAPER))
        shapes.append(box(x, y, cw, head_h, stroke=PRIMARY, fill=PRIMARY, rx=6))
        texts.append(label(ccx, y + 26, c.get("heading", ""), 15, "#FFFFFF", "bold"))
        t, _, _ = bullets(x + 15, y + head_h + 6, c.get("lines", []), 13, 18, inner)
        texts.append(t)
    return shapes, texts, y + total + PAD


def _bars(spec):
    bars = spec.get("bars", [])[:6]
    if len(bars) < 2:
        raise ValueError("bars needs at least 2 bars")
    shapes, texts = [], []
    top = PAD + 14
    label_w = max(text_width(b.get("label", ""), 13) for b in bars) + 16
    label_w = min(label_w, 210.0)
    value_w = max(text_width(b.get("display", ""), 13) for b in bars) + 16
    track_x = PAD + label_w
    track_w = W - PAD - value_w - track_x - 10
    if track_w < 120:
        raise ValueError("bars: labels too long to leave room for the bars")
    peak = max(abs(float(b.get("value", 0))) for b in bars) or 1.0
    note = spec.get("note")
    row, bar_h = 46.0, 26.0
    for i, b in enumerate(bars):
        cy = top + i * row + row / 2
        texts.append(label(PAD, cy + 4, b.get("label", ""), 13, INK, anchor="start"))
        shapes.append(box(track_x, cy - bar_h / 2, track_w, bar_h, stroke="#CBD5DC", fill="#FFFFFF", rx=4))
        w = max(3.0, track_w * (abs(float(b.get("value", 0))) / peak))
        fill = HIGHLIGHT if b.get("emphasis") else PRIMARY
        shapes.append(box(track_x, cy - bar_h / 2, w, bar_h, stroke=fill, fill=fill, rx=4))
        texts.append(label(W - PAD, cy + 4, b.get("display", ""), 13, INK, "bold", anchor="end"))
    bottom = top + len(bars) * row
    if note:
        for i, ln in enumerate(wrap(note, 12, W - 2 * PAD)[:2]):
            texts.append(label(W / 2, bottom + 10 + i * 15, ln, 12, "#5A6B78"))
        bottom += 10 + len(wrap(note, 12, W - 2 * PAD)[:2]) * 15
    return shapes, texts, bottom + PAD


def _timeline(spec):
    steps = spec.get("steps", [])[:5]
    if len(steps) < 2:
        raise ValueError("timeline needs at least 2 steps")
    shapes, texts = [], []
    n = len(steps)
    slot = (W - 2 * PAD) / n
    max_lines = max(len(wrap(st.get("label", ""), 13, slot - 14)) for st in steps)
    has_sub = any(st.get("sub") for st in steps)
    y = PAD + 26 + max_lines * 17
    shapes.append(f'<line x1="{PAD}" y1="{y:.0f}" x2="{W - PAD}" y2="{y:.0f}" '
                  f'fill="none" stroke="{PRIMARY}" stroke-width="2.5" stroke-linecap="round"/>')
    for i, st in enumerate(steps):
        cx = PAD + slot * (i + 0.5)
        shapes.append(f'<circle cx="{cx:.0f}" cy="{y:.0f}" r="9" fill="{WASH}" '
                      f'stroke="{INK}" stroke-width="2.5"/>')
        lines = wrap(st.get("label", ""), 13, slot - 14)
        t, h = block(cx, y - 26 - len(lines) * 17, lines, 13, 17, weight="bold")
        texts.append(t)
        if st.get("sub"):
            sub = wrap(str(st["sub"]), 12, slot - 14)
            t2, _ = block(cx, y + 18, sub, 12, 15, fill="#5A6B78")
            texts.append(t2)
    return shapes, texts, y + (46 if has_sub else 20) + PAD


_KINDS = {"flow": _flow, "compare": _compare, "bars": _bars, "timeline": _timeline}


# ---------------------------------------------------------------------------
def render(spec: dict) -> str:
    """Render a spec to a <figure> block. Raises ValueError on a spec that
    cannot be drawn cleanly, so the caller fails loudly instead of shipping
    a broken diagram."""
    kind = spec.get("kind")
    if kind not in _KINDS:
        raise ValueError(f"unknown diagram kind {kind!r}; expected one of {sorted(_KINDS)}")
    shapes, texts, height = _KINDS[kind](spec)
    height = max(120.0, min(height, 520.0))

    body = "\n".join(texts)
    _assert_inside(body, height)

    caption = spec.get("caption", "")
    cap = f"<figcaption>{esc(caption)}</figcaption>" if caption else ""
    return (f'<figure class="post-figure"><svg viewBox="0 0 {W} {height:.0f}" role="img">\n'
            f'<g class="sketch">\n' + "\n".join(shapes) + "\n</g>\n"
            + body + f"\n</svg>{cap}</figure>")


def _assert_inside(text_svg: str, height: float = H):
    """Catch the 19 Sep failure mode directly: a label whose rendered width
    would cross the canvas edge. Anchors are known here, so this is exact
    enough to trust."""
    import re
    for m in re.finditer(r'<text x="([\d.]+)" y="([\d.]+)" font-size="([\d.]+)"[^>]*?'
                         r'text-anchor="(\w+)"[^>]*>([^<]*)</text>', text_svg):
        x, y, size, anchor, s = (float(m.group(1)), float(m.group(2)),
                                 float(m.group(3)), m.group(4), m.group(5))
        w = text_width(s, size)
        left = x - w / 2 if anchor == "middle" else (x - w if anchor == "end" else x)
        right = left + w
        if left < 2 or right > W - 2 or y < 8 or y > height - 2:
            raise ValueError(f"label would fall outside the canvas: {s!r} "
                             f"(x {left:.0f}..{right:.0f}, y {y:.0f})")


# ---------------------------------------------------------------------------
def sanitize_svg(svg: str) -> str:
    """Safety net for any hand-written SVG that still reaches the page.
    Fixes the two bugs that shipped on 19 Sep: a stroked shape with no fill
    (SVG defaults it to BLACK) and text sitting at a box centre with no
    text-anchor (left-aligns and overflows)."""
    import re

    def fix_shape(m):
        tag = m.group(0)
        if "fill=" not in tag and "stroke=" in tag:
            tag = tag.replace("/>", ' fill="none"/>')
        return tag

    svg = re.sub(r"<(?:rect|circle|ellipse|polygon|polyline|path)\b[^>]*/>", fix_shape, svg)
    svg = re.sub(r"<line\b(?![^>]*fill=)([^>]*)/>", r'<line\1 fill="none"/>', svg)
    svg = re.sub(r"<text\b(?![^>]*text-anchor)([^>]*)>", r'<text\1 text-anchor="middle">', svg)
    return svg


if __name__ == "__main__":
    import json, sys
    if len(sys.argv) > 1 and sys.argv[1] == "--doc":
        print(SPEC_DOC)
    else:
        print(render(json.load(sys.stdin)))
