"""Stage: script. lesson -> video/<slug>/script.json (status: draft)

Claude writes the script through the Anthropic API from: the lesson content (curriculum
export), the theme beat sheet (themes/<theme>.md), the cast (characters.json) and the
reference script (examples/hank-heist/script.json), and must return JSON in exactly that
shape. The result is validated (beat kinds, required fields, line lengths) before it is
saved. Nothing is voiced or generated until a human sets "status": "approved".

Env: ANTHROPIC_API_KEY, CLAUDE_MODEL (default claude-sonnet-5-5), CURRICULUM_JSON
(default /tmp/curriculum-export.json, produced by `npx tsx scripts/export-curriculum.ts`).
"""
import json, os, re, sys, urllib.request, urllib.error
from pathlib import Path
from .common import vdir, load_json, save_json, characters, mark, VIDEO_SCRIPTS

MODEL = os.environ.get("CLAUDE_MODEL", "claude-sonnet-5-5")
FALLBACK = os.environ.get("CLAUDE_FALLBACK_MODEL", "claude-sonnet-5")
KINDS = {"broll", "dialogue", "rewind", "teach", "card", "cta"}


def lesson_text(lesson_id):
    cur = Path(os.environ.get("CURRICULUM_JSON", "/tmp/curriculum-export.json"))
    if not cur.exists():
        sys.exit(f"{cur} missing: run `npx tsx scripts/export-curriculum.ts {cur}` first")
    mods = json.loads(cur.read_text())
    for m in mods:
        for l in m.get("lessons", []):
            if l.get("id") == lesson_id:
                return m, l
    sys.exit(f"lesson {lesson_id} not found in {cur}")


def flatten(obj, out, depth=0):
    """Pull the readable strings out of a lesson's block tree."""
    if isinstance(obj, str):
        if len(obj) > 2: out.append(obj)
    elif isinstance(obj, dict):
        for k, v in obj.items():
            if k in ("id", "type", "icon", "image", "src", "href", "visual", "color"): continue
            flatten(v, out, depth + 1)
    elif isinstance(obj, list):
        for v in obj: flatten(v, out, depth + 1)


def api(payload):
    key = os.environ.get("ANTHROPIC_API_KEY") or sys.exit("ANTHROPIC_API_KEY is not set")
    req = urllib.request.Request("https://api.anthropic.com/v1/messages", data=json.dumps(payload).encode(),
                                 headers={"content-type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01"})
    with urllib.request.urlopen(req, timeout=600) as r:
        return json.loads(r.read())


def generate(prompt):
    for model in (MODEL, FALLBACK):
        try:
            res = api({"model": model, "max_tokens": 12000, "messages": [{"role": "user", "content": prompt}]})
            return "".join(b.get("text", "") for b in res["content"] if b.get("type") == "text"), model
        except urllib.error.HTTPError as e:
            print(f"  {model}: HTTP {e.code} {e.read().decode()[:300]}")
    sys.exit("both models failed")


def validate(s, slug):
    errs = []
    if s.get("slug") != slug: s["slug"] = slug
    beats = s.get("beats") or []
    if not 12 <= len(beats) <= 24: errs.append(f"{len(beats)} beats (want 12-24)")
    kinds = [b.get("kind") for b in beats]
    for k in ("rewind", "teach", "card", "cta"):
        if kinds.count(k) != 1: errs.append(f"need exactly one '{k}' beat")
    ids = set()
    for b in beats:
        if b.get("kind") not in KINDS: errs.append(f"beat {b.get('id')}: bad kind {b.get('kind')}")
        if b.get("id") in ids: errs.append(f"duplicate beat id {b.get('id')}")
        ids.add(b.get("id"))
        if b.get("kind") in ("broll", "dialogue"):
            sh = b.get("shot") or {}
            if not sh.get("motion"): errs.append(f"beat {b.get('id')}: shot.motion missing")
            if not sh.get("image") and not sh.get("keyframe_of"): errs.append(f"beat {b.get('id')}: shot.image missing")
        if b.get("kind") == "teach":
            if len(b.get("lines") or []) != 4: errs.append("teach beat needs 4 lines")
            B = b.get("board") or {}
            if not B.get("question") or not B.get("compare"): errs.append("teach board needs question + compare")
        if b.get("kind") != "teach":
            if b.get("kind") in ("broll", "dialogue", "rewind", "card", "cta"):
                if not b.get("tts") or not b.get("caption"): errs.append(f"beat {b.get('id')}: tts/caption missing")
                elif len(b["caption"].split()) > 22: errs.append(f"beat {b.get('id')}: caption too long")
        if b.get("kind") == "dialogue" and len((b.get("caption") or "").split()) > 9:
            errs.append(f"beat {b.get('id')}: dialogue lines must be short (<= 9 words) for a 4s clip")
        if b.get("kind") == "card" and len(b.get("checks") or []) != 3: errs.append("card needs 3 checks")
    for b in beats:
        for w in re.findall(r"acqlerate", b.get("tts", ""), re.I):
            errs.append(f"beat {b.get('id')}: spell the brand 'Ack-luh-rate' in tts")
    return errs


def main(slug, lesson_id, theme="heist", character="H", dry=False):
    if not lesson_id: sys.exit("--lesson is required")
    d = vdir(slug)
    if (d / "script.json").exists() and os.environ.get("FORCE") != "1":
        sys.exit(f"{d / 'script.json'} exists; set FORCE=1 to overwrite")
    mod, les = lesson_text(lesson_id)
    txt = []; flatten({k: v for k, v in les.items() if k not in ("quiz",)}, txt)
    body = "\n".join(txt)[:14000]
    cast = characters()
    theme_md = (VIDEO_SCRIPTS / "themes" / f"{theme}.md").read_text()
    example = (VIDEO_SCRIPTS / "examples" / "hank-heist" / "script.json").read_text()
    main_char = cast[character]
    others = [k for k, v in cast.items() if isinstance(v, dict) and "name" in v and k not in ("N", character)]
    prompt = f"""You write 60-second animated comedy lesson videos for Acqlerate, a Duolingo-style DoD acquisition training site.
Series: "Don't Be {main_char['name']}". A lovable, overconfident character does the wrong thing; a deadpan professional corrects him; a drawn teaching board explains the real rule.

THEME BEAT SHEET
{theme_md}

CAST (speaker letters used in "spk")
- N: narrator, movie-trailer energy.
- {character}: {main_char['role']}. Appearance: {main_char['description']}.
""" + "".join(f"- {k}: {cast[k]['role']}. Appearance: {cast[k]['description']}.\n" for k in others) + f"""
LESSON (id {les.get('id')}, "{les.get('title')}", module "{mod.get('title')}")
{body}

RULES
- Output ONLY a JSON object in exactly the shape of the reference script below (same keys, same beat kinds, same overlay/sfx/board vocabulary). No prose, no markdown fences.
- Keep the lesson's facts exact. Every number and term must come from the lesson text. Do not invent regulations, thresholds or dollar figures that are not in the lesson; use a round, obviously illustrative number for the story if the lesson has none.
- Dialogue lines ("kind":"dialogue") are 2-8 words: one short acted line per 4-second clip. Narration lines are one sentence, 6-16 words. Total runtime about 60-70 seconds (roughly 20-22 lines).
- "tts" may use ElevenLabs v3 audio tags like [smug] [whispers] [flatly] [shouts] [sighs]; "caption" is the same words without tags. Spell the brand "Ack-luh-rate" in tts and "Acqlerate" in caption.
- Humor comes from the character's confidence meeting reality, not from insults. No real films, shows, brands or people.
- "shot.image" describes a single still keyframe (what is in frame, expression, framing). "shot.motion" describes 4 seconds of motion and, for dialogue, includes: lip-synced to the reference audio: "<the line>". Both must say nothing about text on screen; the pipeline adds captions.
- The teach beat has exactly 4 narrator lines and a board with: question (2 short lines), evidence (two items with cutouts "crew" / "hank_wave" style labels), compare (two cards: title, l1, l2, big), punch (one sentence), shrink (label, from, to). Word anchors ("word": {{"line": "16", "w": "agent"}}) must be words that appear in that line's caption.
- The card beat: "stamp" = "DON'T BE {main_char['name'].upper()}", three "checks" of 2-4 imperative words whose "w" anchor is a word in the card's caption.
- The cta beat tts: "<lesson title>. <module short name>, on Ack-luh-rate."
- "social": caption (one punchy sentence, no hashtags), hashtags (5), youtube_title, linkedin (3 short paragraphs, plain English, no em dashes).
- "lesson": {{"id": "{les.get('id')}", "title": "{les.get('title')}", "module": "{mod.get('title')}"}}. "theme": "{theme}". "character": "{character}". "status": "draft".

REFERENCE SCRIPT (the Hank heist on revenue recognition; match its shape exactly)
{example}
"""
    if dry:
        print(prompt[:3000] + "\n...\n" + f"[{len(prompt)} chars]"); return
    text, model = generate(prompt)
    m = re.search(r"\{.*\}", text, re.S)
    if not m: sys.exit("no JSON in the response:\n" + text[:800])
    try:
        s = json.loads(m.group(0))
    except json.JSONDecodeError as e:
        sys.exit(f"bad JSON from the model: {e}\n{text[:800]}")
    s["status"] = "draft"; s["theme"] = theme; s["character"] = character; s["generated_by"] = model
    errs = validate(s, slug)
    save_json(d / "script.json", s)
    if errs:
        print("script saved with problems to fix before approval:\n  " + "\n  ".join(errs))
        mark(slug, "script", "draft-with-errors", errors=errs, lesson=lesson_id)
    else:
        print(f"script saved: {d / 'script.json'} ({len(s['beats'])} beats) by {model}")
        mark(slug, "script", "draft", lesson=lesson_id)
    # a readable copy for review
    lines = []
    for b in s["beats"]:
        if b["kind"] == "teach":
            for l in b["lines"]: lines.append(f"[{l['id']}] {l['spk']}: {l['caption']}")
        elif b.get("caption"): lines.append(f"[{b['id']}] {b['spk']} ({b['kind']}): {b['caption']}")
    (d / "script.txt").write_text(f"{s.get('title', '')}\nLesson: {les.get('title')} | theme: {theme}\n\n" + "\n".join(lines) + "\n")
    print((d / "script.txt").read_text())
