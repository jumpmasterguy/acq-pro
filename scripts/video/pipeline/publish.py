"""Stage: publish. draft.mp4 -> somewhere people can see it.

  --to final       copy draft.mp4 to final/<slug>.mp4 on the video-assets branch (the hand-off file)
  --to higgsfield  PUT draft.mp4 to a presigned upload URL (env UPLOAD_URL, from the Higgsfield
                   MCP `media_upload`); the Claude session then calls media_confirm + tiktok_prepare_publish.
                   TikTok posting itself stays a human-approved step (see README: "Posting").
Other platforms (YouTube Shorts, Instagram, LinkedIn) are posted by hand from final/<slug>.mp4 with
social/<platform>.txt until an API route is approved.
"""
import os, shutil, subprocess, sys
from .common import vdir, load_json, mark, video_root


def main(slug, to="final", dry=False):
    d = vdir(slug)
    draft = d / "draft.mp4"
    if not draft.exists():
        sys.exit("no draft.mp4 yet; run assemble")
    if to == "final":
        dest = video_root().parent / "final" / f"{slug}.mp4"
        dest.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy(draft, dest)
        print(f"copied to {dest} ({dest.stat().st_size / 1e6:.1f} MB)")
        mark(slug, "publish", "final", file=str(dest))
    elif to == "higgsfield":
        url = os.environ.get("UPLOAD_URL") or sys.exit("UPLOAD_URL (presigned PUT from media_upload) is required")
        if not (url.startswith("https://") and (".amazonaws.com/" in url or ".higgsfield.ai/" in url)):
            sys.exit("refusing a non-Higgsfield upload URL")
        if dry:
            print("dry run: would PUT", draft); return
        r = subprocess.run(["curl", "-sS", "-o", "/dev/null", "-w", "%{http_code}", "-X", "PUT", "-H", "Content-Type: video/mp4", "--data-binary", f"@{draft}", url], capture_output=True, text=True)
        print("HTTP", r.stdout)
        if r.stdout.strip() != "200":
            sys.exit("upload failed")
        mark(slug, "publish", "uploaded")
    else:
        sys.exit(f"unknown target {to}")
