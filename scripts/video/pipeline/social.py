"""Stage: social. script.json -> social/<platform>.txt (paste-ready captions)."""
from .common import vdir, load_json, mark

TAGS_DEFAULT = ["govcon", "defensecontracting", "acqlerate", "dontbehank"]


def main(slug):
    d = vdir(slug)
    s = load_json(d / "script.json")
    so = s.get("social", {})
    les = s.get("lesson", {})
    cap = so.get("caption") or s.get("title") or les.get("title", "")
    tags = so.get("hashtags") or TAGS_DEFAULT
    tagline = " ".join("#" + t.lstrip("#") for t in tags)
    out = d / "social"; out.mkdir(exist_ok=True)
    (out / "tiktok.txt").write_text(f"{cap} {tagline}\n")
    (out / "instagram.txt").write_text(f"{cap}\n\nFree lesson: {les.get('title', '')} on acqlerate.com\n\n{tagline}\n")
    (out / "youtube.txt").write_text(f"TITLE: {so.get('youtube_title') or cap}\n\n{cap}\n\nFull lesson: {les.get('title', '')} ({les.get('module', '')}) https://acqlerate.com\n\n{tagline}\n")
    (out / "linkedin.txt").write_text((so.get("linkedin") or f"{cap}\n\nFull lesson: {les.get('title', '')} on acqlerate.com") + "\n")
    for f in sorted(out.glob("*.txt")):
        print(f"--- {f.name}\n{f.read_text()}")
    mark(slug, "social", "done")
