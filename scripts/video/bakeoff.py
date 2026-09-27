#!/usr/bin/env python3
"""Higgsfield bake-off: pick the sketch style and video model for Acqlerate videos.

Makes one "Handshake Hank" panel in 3 sketch styles, then animates the first
style with 3 video models. Downloads everything to OUT_DIR and writes a
REPORT.md with the real cost of each call.

Safety:
  * Estimates every call first and refuses to run if the total is over
    MAX_USD (default $5).
  * Stdlib only, no pip installs.
  * Credentials come from env vars HF_API_KEY_ID / HF_API_KEY_SECRET
    (GitHub secrets). They are never printed.

Run:  python3 scripts/video/bakeoff.py            (real run)
      DRY_RUN=1 python3 scripts/video/bakeoff.py  (no API calls)
"""
import json, os, subprocess, sys, time
from pathlib import Path

BASE = "https://api.higgsfield.ai"
OUT = Path(os.environ.get("OUT_DIR", "video-bakeoff"))
MAX_USD = float(os.environ.get("MAX_USD", "5"))
DRY = os.environ.get("DRY_RUN") == "1"

# --- The character, kept identical across styles so only the style changes ---
HANK = (
    "a stocky man in his fifties with a gray buzz cut, rolled-up white shirt "
    "sleeves and a loosened navy tie, big overconfident grin, small defense "
    "company owner"
)
SCENE = (
    f"{HANK}, standing in front of a planning board pinning up three index "
    "cards with string between them like a heist movie mastermind, "
    "office background, vertical composition, character centered"
)
NO_TEXT = "no text, no letters, no words, no logos, no watermark"

STYLES = {
    "A_whiteboard_marker": (
        f"Black marker line drawing on a clean white whiteboard, simple "
        f"explainer-video sketch style, one accent color of deep teal, "
        f"bold confident lines, minimal shading. {SCENE}. {NO_TEXT}"
    ),
    "B_pencil_storyboard": (
        f"Graphite pencil storyboard sketch on off-white paper, loose "
        f"cross-hatching, cinematic film storyboard panel. {SCENE}. {NO_TEXT}"
    ),
    "C_ink_cartoon": (
        f"Editorial cartoon, thick black ink outlines, flat muted colors, "
        f"slightly exaggerated proportions, magazine cartoon style. "
        f"{SCENE}. {NO_TEXT}"
    ),
}
IMAGE_MODEL = "/higgsfield-ai/soul/v2/standard"

MOTION = (
    "The man turns to the camera with a smug grin and taps the board "
    "confidently. Hand-drawn sketch style is preserved, lines gently wobble "
    "like hand-drawn animation. Slow camera push in. No text appears."
)
VIDEO_MODELS = {
    "kling25_standard": ("/kling-video/v2.5-turbo/standard/image-to-video", 5),
    "kling25_pro":      ("/kling-video/v2.5-turbo/pro/image-to-video", 5),
    "hailuo23_standard": ("/minimax/hailuo-2.3/standard/image-to-video", 6),
}
# Used only if the estimate endpoint doesn't answer. Deliberately high.
FALLBACK_USD = {"image": 0.01, "video_per_sec": 0.20}


def _auth():
    kid, sec = os.environ.get("HF_API_KEY_ID"), os.environ.get("HF_API_KEY_SECRET")
    if not kid or not sec:
        sys.exit("Missing HF_API_KEY_ID / HF_API_KEY_SECRET.")
    return f"Key {kid}:{sec}"


def _curl(args, cfg="", data=None):
    """Run curl. Higgsfield's firewall (Cloudflare 1010) blocks Python's
    default HTTP signature, and their own docs use curl, so we do too.
    The auth header goes in via stdin config so it never shows in args."""
    cmd = ["curl", "-sS", "--max-time", "120", "-K", "-"] + args
    stdin = cfg
    if data is not None:
        stdin += "data = " + json.dumps(json.dumps(data)) + "\n"
    return subprocess.run(cmd, input=stdin.encode(), capture_output=True)


def call(method, path, body=None):
    cfg = (f'header = "Authorization: {_auth()}"\n'
           'header = "Content-Type: application/json"\n'
           'header = "Accept: application/json"\n')
    r = _curl(["-X", method, "-w", "\n%{http_code}", BASE + path],
              cfg, body)
    out = r.stdout.decode(errors="replace").rsplit("\n", 1)
    if len(out) != 2 or not out[1].strip().isdigit():
        return 0, {"raw": (r.stderr or r.stdout).decode(errors="replace")[:500]}
    txt, code = out[0], int(out[1])
    try:
        js = json.loads(txt or "{}")
    except ValueError:
        js = {"raw": txt[:500]}
    return code, js


def estimate(path, body):
    """Return USD estimate or None. Tries POST then GET on /estimate/<path>."""
    for method, b in (("POST", body), ("GET", None)):
        code, js = call(method, "/estimate" + path, b)
        if code == 200 and isinstance(js, dict) and "usd" in js:
            return float(js["usd"])
    return None


def submit(path, variants):
    """Submit, trying body variants in order if the API rejects the shape."""
    last = None
    for body in variants:
        code, js = call("POST", path, body)
        if code in (200, 201, 202) and js.get("request_id"):
            return js["request_id"], body
        last = (code, js)
        if code in (401, 402, 403):
            break  # auth or money problem: retrying won't help
    raise RuntimeError(f"{path} rejected: {last}")


def wait(request_id, label, timeout=900):
    t0 = time.time()
    while time.time() - t0 < timeout:
        code, js = call("GET", f"/requests/{request_id}/status")
        st = js.get("status")
        if st == "completed":
            return js
        if st in ("failed", "nsfw", "canceled"):
            raise RuntimeError(f"{label}: {st} {js.get('error')}")
        time.sleep(8)
    raise RuntimeError(f"{label}: timed out")


def download(url, dest):
    dest.parent.mkdir(parents=True, exist_ok=True)
    r = _curl(["-fL", "-o", str(dest), url])
    if r.returncode != 0:
        raise RuntimeError(f"download failed: {r.stderr.decode()[:200]}")
    return dest


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    img_variants = lambda p: [
        {"prompt": p, "aspect_ratio": "9:16"},
        {"prompt": p},
    ]
    vid_variants = lambda url, d: [
        {"prompt": MOTION, "image_url": url, "duration": d},
        {"prompt": MOTION, "image_url": url, "duration": str(d)},
        {"prompt": MOTION, "image_url": url},
    ]

    # ---- 1. Budget check before spending anything ----
    total, lines = 0.0, []
    for name, prompt in STYLES.items():
        usd = None if DRY else estimate(IMAGE_MODEL, img_variants(prompt)[0])
        usd = usd if usd is not None else FALLBACK_USD["image"]
        total += usd; lines.append((f"image {name}", usd))
    for name, (path, d) in VIDEO_MODELS.items():
        body = vid_variants("https://example.com/x.png", d)[0]
        usd = None if DRY else estimate(path, body)
        usd = usd if usd is not None else FALLBACK_USD["video_per_sec"] * d
        total += usd; lines.append((f"video {name} ({d}s)", usd))
    print("Estimated cost:")
    for l, u in lines:
        print(f"  {l:40s} ${u:.3f}")
    print(f"  {'TOTAL':40s} ${total:.2f}  (cap ${MAX_USD:.2f})")
    if total > MAX_USD:
        sys.exit("Over budget cap. Nothing was generated.")
    if DRY:
        print("DRY_RUN: stopping before any generation.")
        return

    report = ["# Higgsfield bake-off", "",
              "Same character and scene in each image; only the style changes.",
              "Style A was animated with each video model.", "",
              "| Item | Model | Est. cost | File |", "|---|---|---|---|"]
    est = dict(lines)

    # ---- 2. Images: submit all 3, then collect ----
    jobs = {n: submit(IMAGE_MODEL, img_variants(p)) for n, p in STYLES.items()}
    img_urls = {}
    for n, (rid, body) in jobs.items():
        res = wait(rid, n)
        url = res["images"][0]["url"]
        img_urls[n] = url
        f = download(url, OUT / f"image_{n}.png")
        report.append(f"| Image {n} | soul v2 | ${est[f'image {n}']:.3f} | {f.name} |")
        print("image done:", n)

    # ---- 3. Animate style A with each video model ----
    src = img_urls["A_whiteboard_marker"]
    vjobs = {}
    for n, (path, d) in VIDEO_MODELS.items():
        try:
            vjobs[n] = submit(path, vid_variants(src, d))
        except RuntimeError as e:
            report.append(f"| Video {n} | {path} | - | FAILED to submit: {e} |")
            print("video submit failed:", n, e)
    for n, (rid, body) in vjobs.items():
        try:
            res = wait(rid, n)
            f = download(res["video"]["url"], OUT / f"video_{n}.mp4")
            d = VIDEO_MODELS[n][1]
            report.append(f"| Video {n} | {VIDEO_MODELS[n][0]} | "
                          f"${est[f'video {n} ({d}s)']:.3f} | {f.name} |")
            print("video done:", n)
        except RuntimeError as e:
            report.append(f"| Video {n} | {VIDEO_MODELS[n][0]} | - | FAILED: {e} |")
            print("video failed:", n, e)

    report += ["", f"Estimated total: ${total:.2f}. "
               "Check the Higgsfield console for the exact charge."]
    (OUT / "REPORT.md").write_text("\n".join(report))
    print("\n".join(report))


if __name__ == "__main__":
    main()
