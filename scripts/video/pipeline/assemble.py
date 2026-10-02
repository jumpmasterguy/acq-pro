"""Stage: assemble. script.json + vo/ + media/ -> draft.mp4"""
import sys
from .common import vdir, load_json, mark, require
from . import edl, render


def check_inputs(slug):
    d = vdir(slug)
    s = load_json(d / "script.json")
    missing = []
    if not (d / "vo" / "manifest.json").exists():
        missing.append("vo/manifest.json (run the voices stage)")
    for b in s["beats"]:
        if b["kind"] in ("broll", "dialogue") and not (d / "media" / f"{b['id']}.mp4").exists():
            missing.append(f"media/{b['id']}.mp4")
    if missing:
        sys.exit("assemble: missing inputs:\n  " + "\n  ".join(missing))


def main(slug, fps=None, scale=None, out=None):
    check_inputs(slug)
    mark(slug, "assemble", "running")
    edl.main(slug)
    f = render.main(slug, fps=fps, scale=scale) if out is None else render.Renderer(slug, fps=fps, scale=scale).render(out)
    mark(slug, "assemble", "done", file=str(f))
    return f
