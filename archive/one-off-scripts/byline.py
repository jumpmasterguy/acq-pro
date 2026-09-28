"""One-off: put Lucas Cruz's byline, Person schema and an AI note on every blog post.

Usage: python3 byline.py <repo root>
Idempotent: running it twice changes nothing the second time.
"""
import glob, json, os, re, sys

ROOT = sys.argv[1]
BLOG = os.path.join(ROOT, "client/public/blog")

ORG_ID = "https://acqlerate.com/#organization"
PERSON = {"@type": "Person", "@id": "https://acqlerate.com/why#lucas-cruz",
          "name": "Lucas Cruz", "url": "https://acqlerate.com/why#founder"}
AUTHOR_LINK = '<a class="byline-author" href="/why#founder" rel="author">Lucas Cruz</a>'
NOTE_TEXT = ('Drafted with AI from public sources. Spot a mistake? Email '
             '<a href="mailto:lucas@acqlerate.com">lucas@acqlerate.com</a> and I\'ll fix it.')
NOTE = f'<p class="ai-note">{NOTE_TEXT}</p>'
# The one legacy post has no blog.css, so it carries its own styling.
NOTE_INLINE = (f'<p class="ai-note" style="font-size:0.85rem;color:inherit;opacity:0.7;font-style:italic;'
               f'margin:32px 0 0;padding-top:16px;border-top:1px solid rgba(128,128,128,0.3)">{NOTE_TEXT}</p>')

BYLINES = [  # (pattern, replacement) — each post must match exactly one
    (r'(<div class="post-meta">)By (?:Acqlerate|Lucas Cruz)( ·)', rf'\1By {AUTHOR_LINK}\2'),
    (r'(<div class="post-byline">)By Acqlerate( &middot;)', rf'\1By {AUTHOR_LINK}\2'),
    (r'<span>By Acqlerate</span>', f'<span>By {AUTHOR_LINK}</span>'),
    (r'(<p class="meta">)Acqlerate( &nbsp;·&nbsp;)', rf'\1By {AUTHOR_LINK}\2'),
]


def value_span(s, start):
    """End index of the JSON value beginning at s[start] ({...} or [...])."""
    open_c = s[start]
    close_c = {"{": "}", "[": "]"}[open_c]
    depth, i, in_str = 0, start, False
    while i < len(s):
        c = s[i]
        if in_str:
            if c == "\\": i += 1
            elif c == '"': in_str = False
        elif c == '"': in_str = True
        elif c in "{[": depth += 1
        elif c in "}]":
            depth -= 1
            if depth == 0: return i + 1
        i += 1
    raise ValueError("unbalanced JSON value")


def fix_key(block, key, fn):
    """Rewrite every value of "key" in a JSON-LD block text, leaving the rest byte-identical."""
    out, pos, n = [], 0, 0
    for m in re.finditer(rf'"{key}"\s*:\s*', block):
        if m.start() < pos: continue
        vstart = m.end()
        if block[vstart] not in "{[": continue
        vend = value_span(block, vstart)
        new = json.dumps(fn(json.loads(block[vstart:vend])), ensure_ascii=False)
        out.append(block[pos:vstart]); out.append(new); pos = vend; n += 1
    out.append(block[pos:])
    return "".join(out), n


def publisher(v):
    items = v if isinstance(v, list) else [v]
    for p in items:
        if isinstance(p, dict) and p.get("@type") == "Organization" and p.get("name") == "Acqlerate":
            # "@id" first so the entity link reads clearly; keep every other field.
            rest = {k: x for k, x in p.items() if k not in ("@type", "@id")}
            p.clear(); p.update({"@type": "Organization", "@id": ORG_ID, **rest})
            p.setdefault("url", "https://acqlerate.com")
    return v


def post_body_end(s):
    m = re.search(r'<div class="post-body[^"]*"[^>]*>', s)
    if not m: return None
    depth, i = 1, m.end()
    for t in re.finditer(r'<div\b|</div>', s[i:]):
        depth += 1 if t.group() == "<div" else -1
        if depth == 0: return i + t.end()
    raise ValueError("post-body never closes")


changed = []
for path in sorted(glob.glob(os.path.join(BLOG, "*.html"))):
    name = os.path.basename(path)
    if name == "index.html": continue
    s = orig = open(path, encoding="utf-8").read()

    # 1. Visible byline
    if AUTHOR_LINK not in s:
        hits = 0
        for pat, rep in BYLINES:
            s, k = re.subn(pat, rep, s, count=1)
            hits += k
        assert hits == 1, f"{name}: {hits} byline matches"

    # 2. JSON-LD author -> Person; publisher carries the org @id
    def fix_block(m):
        block = m.group(2)
        block, _ = fix_key(block, "author", lambda v: dict(PERSON))
        block, _ = fix_key(block, "publisher", publisher)
        json.loads(block)  # must still parse
        return m.group(1) + block + m.group(3)
    s = re.sub(r'(<script type="application/ld\+json">)(.*?)(</script>)', fix_block, s, flags=re.S)

    # 3. AI note, right after the article body
    if 'class="ai-note"' not in s:
        end = post_body_end(s)
        if end is not None:
            s = s[:end] + "\n    " + NOTE + s[end:]
        else:
            anchor = '<div class="cta-card">'
            assert s.count(anchor) == 1, f"{name}: no place for the note"
            s = s.replace(anchor, NOTE_INLINE + "\n    " + anchor)

    if s != orig:
        open(path, "w", encoding="utf-8").write(s)
        changed.append(name)

print(f"{len(changed)} posts changed")
