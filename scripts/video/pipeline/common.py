"""Shared helpers: paths, state.json, audio measurement, curl."""
import json, os, subprocess, sys, time
from pathlib import Path

HERE = Path(__file__).resolve().parent            # scripts/video/pipeline
VIDEO_SCRIPTS = HERE.parent                        # scripts/video
REPO = VIDEO_SCRIPTS.parent.parent                 # repo root
SR = 44100
FPS = 30
W, H = 1080, 1920


def video_root() -> Path:
    """Where video/<slug>/ folders live. Default: <repo>/video (the video-assets branch
    checked out as a worktree in CI, or a plain folder locally). Override with VIDEO_ROOT."""
    return Path(os.environ.get("VIDEO_ROOT", REPO / "video"))


def vdir(slug: str) -> Path:
    if not slug or any(c for c in slug if not (c.isalnum() or c in "-_")):
        sys.exit(f"bad slug: {slug!r}")
    d = video_root() / slug
    d.mkdir(parents=True, exist_ok=True)
    return d


def load_json(p: Path, default=None):
    if not Path(p).exists():
        if default is not None:
            return default
        sys.exit(f"missing {p}")
    return json.loads(Path(p).read_text())


def save_json(p: Path, data):
    Path(p).parent.mkdir(parents=True, exist_ok=True)
    Path(p).write_text(json.dumps(data, indent=1, ensure_ascii=False) + "\n")


def characters():
    return load_json(VIDEO_SCRIPTS / "characters.json")


# ---------------------------------------------------------------- state
def state(slug):
    return load_json(vdir(slug) / "state.json", {"slug": slug, "stages": {}})


def mark(slug, stage, status="done", **extra):
    s = state(slug)
    s["stages"][stage] = {"status": status, "at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()), **extra}
    save_json(vdir(slug) / "state.json", s)
    return s


def require(slug, stage):
    st = state(slug)["stages"].get(stage, {})
    if st.get("status") != "done":
        sys.exit(f"{slug}: stage '{stage}' has not run yet (state.json says {st.get('status', 'missing')}). Run it first.")


# ---------------------------------------------------------------- shell
def run(cmd, **kw):
    r = subprocess.run(cmd, capture_output=True, text=True, **kw)
    if r.returncode:
        raise RuntimeError(" ".join(map(str, cmd)) + "\n" + r.stderr[-2000:])
    return r.stdout


def curl(method, url, headers=(), body=None, out_file=None, timeout=180):
    """curl with headers passed via stdin config so secrets never appear in argv.
    Returns (http_code, parsed_json_or_text)."""
    conf = "".join(f'header = "{h}"\n' for h in headers)
    if body is not None:
        conf += "data = " + json.dumps(json.dumps(body)) + "\n"
    args = ["curl", "-sS", "--max-time", str(timeout), "-K", "-", "-X", method, "-w", "\n%{http_code}"]
    if out_file:
        args += ["-o", str(out_file)]
    r = subprocess.run(args + [url], input=conf.encode(), capture_output=True)
    txt, _, code = r.stdout.decode(errors="replace").rpartition("\n")
    code = int(code) if code.strip().isdigit() else 0
    if out_file:
        return code, (Path(out_file).read_text(errors="replace")[:400] if code >= 400 and Path(out_file).exists() else None)
    try:
        return code, json.loads(txt or "{}")
    except ValueError:
        return code, {"raw": (txt or r.stderr.decode(errors="replace"))[:600]}


# ---------------------------------------------------------------- audio
def load_audio(path, tempo=1.0, ss=None, t=None):
    """Decode any audio/video file to mono float32 at SR (optionally retimed with atempo)."""
    import numpy as np
    pre = []
    if ss is not None: pre += ["-ss", str(ss)]
    if t is not None: pre += ["-t", str(t)]
    af = ["-af", f"atempo={tempo}"] if tempo != 1.0 else []
    raw = subprocess.run(["ffmpeg", "-v", "error"] + pre + ["-i", str(path)] + af +
                         ["-f", "f32le", "-ac", "1", "-ar", str(SR), "-"], capture_output=True).stdout
    return np.frombuffer(raw, np.float32).copy()


def audible_span(a, thr=0.008, frame=441):
    """(start, end) seconds of the audible part of a signal. (0, len) if silent."""
    import numpy as np
    if len(a) < frame * 2:
        return 0.0, len(a) / SR
    n = len(a) // frame
    e = np.sqrt(np.mean(a[:n * frame].reshape(n, frame) ** 2, axis=1))
    on = np.where(e > thr)[0]
    if not len(on):
        return 0.0, len(a) / SR
    return on[0] * frame / SR, (on[-1] + 1) * frame / SR


def speech_span(a, thr=0.02, frame=441, min_gap=0.35):
    """Like audible_span but for a clip that may carry room tone / music: the longest
    run of frames over the threshold, bridging gaps shorter than min_gap."""
    import numpy as np
    n = len(a) // frame
    if n < 2:
        return 0.0, len(a) / SR
    e = np.sqrt(np.mean(a[:n * frame].reshape(n, frame) ** 2, axis=1))
    ref = np.percentile(e, 95) if (e > 0).any() else 1
    on = e > max(thr, ref * 0.12)
    runs, i = [], 0
    while i < n:
        if on[i]:
            j = i
            while j < n and (on[j] or (j + int(min_gap * SR / frame) < n and on[j:j + int(min_gap * SR / frame)].any())):
                j += 1
            runs.append((i, j)); i = j
        else:
            i += 1
    if not runs:
        return audible_span(a, thr, frame)
    i, j = max(runs, key=lambda r: r[1] - r[0])
    return i * frame / SR, j * frame / SR


def normalize(a, dbfs=-20.0, peak=0.95):
    import numpy as np
    v = a[np.abs(a) > .01]
    if not len(v):
        return a
    g = 10 ** (dbfs / 20) / (np.sqrt(np.mean(v ** 2)) + 1e-9)
    return a * min(g, peak / (np.abs(a).max() + 1e-9))


def media_duration(path):
    out = run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(path)])
    return float(out.strip())
