"""Stage: fetch. jobs.json -> media/

jobs.json is written by the Higgsfield runner (see SHOTS_RUNNER.md):
{
 "beats": {"01": {"keyframe": {"job": "...", "url": "..."},
                  "video":    {"job": "...", "url": "..."},
                  "voiced":   {"job": "...", "url": "..."},     # after voice_change (dialogue beats)
                  "voice":    {"job": "...", "url": "..."}},    # off-screen line audio (optional)
 "cutouts": {"hank_wave": {"url": "..."}}
}
Downloads: voiced.url (or video.url) -> media/<beat>.mp4, voice.url -> media/<beat>_voice.mp3,
cutouts -> media/<file>. Only Higgsfield hosts are allowed. Runs where the CDN is reachable
(GitHub Actions; the Claude workspace can't reach it).
"""
import subprocess, sys
from .common import vdir, load_json, save_json, characters, mark, state

def ok_url(u):
    return isinstance(u, str) and u.startswith("https://") and (".cloudfront.net/" in u or ".higgsfield.ai/" in u)


def dl(url, dest):
    if not ok_url(url):
        sys.exit(f"refusing non-Higgsfield URL: {url}")
    dest.parent.mkdir(parents=True, exist_ok=True)
    r = subprocess.run(["curl", "-fsSL", "--max-time", "300", "-o", str(dest), url], capture_output=True, text=True)
    if r.returncode:
        raise RuntimeError(f"download failed {url}: {r.stderr[:200]}")
    print(f"  {dest.name} {dest.stat().st_size // 1024} KB")


def main(slug):
    d = vdir(slug)
    jobs = load_json(d / "jobs.json")
    script = load_json(d / "script.json")
    media = d / "media"; media.mkdir(exist_ok=True)
    got, missing = [], []
    for b in script["beats"]:
        if "shot" not in b and not b.get("offscreen"):
            continue
        j = jobs.get("beats", {}).get(b["id"], {})
        src = (j.get("voiced") or j.get("video") or {}).get("url")
        if "shot" in b:
            if src: dl(src, media / f"{b['id']}.mp4"); got.append(b["id"])
            else: missing.append(b["id"])
        if b.get("offscreen") and (j.get("voice") or {}).get("url"):
            dl(j["voice"]["url"], media / f"{b['id']}_voice.mp3")
    cast = characters()
    files = {}
    for k, c in cast.items():
        if not isinstance(c, dict): continue
        for n, cu in ((c.get("cutouts") or {}) if k != "extras" else c).items():
            files[n] = cu["file"]
    for n, cu in jobs.get("cutouts", {}).items():
        if cu.get("url") and n in files:
            dl(cu["url"], media / files[n])
    if missing:
        print(f"still missing clips for beats: {missing}")
        mark(slug, "fetch", "partial", missing=missing); sys.exit(1)
    mark(slug, "fetch", "done", clips=got)
