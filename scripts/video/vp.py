#!/usr/bin/env python3
"""Acqlerate video pipeline CLI.

  python3 scripts/video/vp.py script   <slug> --lesson finance-9 [--theme heist] [--character H]
  python3 scripts/video/vp.py voices   <slug>
  python3 scripts/video/vp.py shots    <slug>            # writes shots.json (the Higgsfield plan)
  python3 scripts/video/vp.py fetch    <slug>            # jobs.json -> media/
  python3 scripts/video/vp.py assemble <slug> [--fps 30] [--scale 1] [--out file]
  python3 scripts/video/vp.py social   <slug>
  python3 scripts/video/vp.py publish  <slug> [--to higgsfield|tiktok]
  python3 scripts/video/vp.py status   <slug>
  python3 scripts/video/vp.py next                       # next lesson in queue.json

Set VIDEO_ROOT to point at the folder holding video/<slug>/ (default: <repo>/video).
"""
import argparse, json, sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
from pipeline.common import state, video_root, load_json, VIDEO_SCRIPTS


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("stage", choices=["script", "voices", "shots", "fetch", "assemble", "social", "publish", "status", "next", "draft"])
    ap.add_argument("slug", nargs="?")
    ap.add_argument("--lesson"); ap.add_argument("--theme", default="heist"); ap.add_argument("--character", default="H")
    ap.add_argument("--fps", type=int); ap.add_argument("--scale", type=float); ap.add_argument("--out")
    ap.add_argument("--to", default="higgsfield"); ap.add_argument("--dry", action="store_true")
    a = ap.parse_args()

    if a.stage == "next":
        q = load_json(VIDEO_SCRIPTS / "queue.json")
        for item in q["queue"]:
            if not (video_root() / item["slug"] / "script.json").exists():
                print(json.dumps(item)); return
        print("{}"); return

    if not a.slug:
        sys.exit("slug required")
    if a.stage == "status":
        print(json.dumps(state(a.slug), indent=1)); return
    if a.stage == "script":
        from pipeline import script_gen
        script_gen.main(a.slug, a.lesson, a.theme, a.character, dry=a.dry)
    elif a.stage == "voices":
        from pipeline import voices
        voices.main(a.slug, dry=a.dry)
    elif a.stage == "shots":
        from pipeline import shots
        shots.main(a.slug)
    elif a.stage == "fetch":
        from pipeline import fetch
        fetch.main(a.slug)
    elif a.stage == "assemble":
        from pipeline import assemble
        assemble.main(a.slug, fps=a.fps, scale=a.scale, out=a.out)
    elif a.stage == "social":
        from pipeline import social
        social.main(a.slug)
    elif a.stage == "publish":
        from pipeline import publish
        publish.main(a.slug, to=a.to, dry=a.dry)
    elif a.stage == "draft":   # everything that can run without Higgsfield, in order
        from pipeline import voices, shots, social
        voices.main(a.slug, dry=a.dry); shots.main(a.slug); social.main(a.slug)


if __name__ == "__main__":
    main()
