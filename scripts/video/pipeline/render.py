"""edl.json -> draft.mp4

1. clip segments  -> normalized 1080x1920 silent mp4s (trim + retime, or a freeze frame)
2. drawn segments -> Playwright screenshots of stage.html -> mp4
3. rewind segment -> reversed sampled story frames with VHS jitter
4. concat -> base.mp4
5. overlay layer (captions, name cards, tags) rendered transparent and composited
6. audio: voice + music + sfx, loudness-normalized, muxed

Env / args: FPS (default 30), SCALE (1 = 1080x1920; 0.5 for a quick preview).
"""
import json, subprocess, asyncio, os, sys, time, shutil
from pathlib import Path
from .common import vdir, load_json, run, HERE
from . import audio

STAGE = HERE / "stage"


class Renderer:
    def __init__(self, slug, fps=None, scale=None, crf=18):
        self.slug = slug
        self.d = vdir(slug)
        self.b = self.d / "build"
        self.E = load_json(self.b / "edl.json")
        self.FPS = int(fps or os.environ.get("FPS", self.E.get("fps", 30)))
        self.scale = float(scale or os.environ.get("SCALE", 1))
        self.W, self.H = int(1080 * self.scale) // 2 * 2, int(1920 * self.scale) // 2 * 2
        self.X264 = ["-c:v", "libx264", "-preset", "medium", "-crf", str(crf), "-pix_fmt", "yuv420p", "-r", str(self.FPS)]
        self.segs = self.E["segments"]
        if not (STAGE / "node_modules" / "roughjs").exists():
            sys.exit(f"stage dependencies missing: run `npm ci` in {STAGE}")

    def nf(self, d): return int(round(d * self.FPS))
    def segfile(self, i): return str(self.b / f"seg{i:02d}.mp4")

    # ---- 1. clips
    def do_clip(self, i, s):
        out = self.segfile(i); n = self.nf(s["dur"]); W, H, FPS = self.W, self.H, self.FPS
        if s.get("freeze"):
            still = str(self.b / f"freeze{i:02d}.png")
            run(["ffmpeg", "-v", "error", "-y", "-ss", str(s["src_in"]), "-i", s["file"], "-frames:v", "1", still])
            if not os.path.exists(still):   # seeking past the last keyframe: take the last decodable frame instead
                run(["ffmpeg", "-v", "error", "-y", "-sseof", "-0.5", "-i", s["file"], "-update", "1", "-frames:v", "1", still])
            vf = f"scale={W}:{H}:flags=lanczos,eq=saturation=0.15:contrast=1.15,zoompan=z='1+0.0025*on':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d={n}:s={W}x{H}:fps={FPS}"
            run(["ffmpeg", "-v", "error", "-y", "-loop", "1", "-i", still, "-vf", vf, "-frames:v", str(n)] + self.X264 + ["-an", out])
            return out
        a, b = s["src_in"], s["src_out"]
        speed = s.get("speed") or (b - a) / s["dur"]
        vf = (f"trim=start={a}:end={b},setpts=(PTS-STARTPTS)/{speed},fps={FPS},scale={W}:{H}:flags=lanczos,setsar=1,tpad=stop_mode=clone:stop_duration=1")
        run(["ffmpeg", "-v", "error", "-y", "-i", s["file"], "-vf", vf, "-frames:v", str(n)] + self.X264 + ["-an", out])
        return out

    # ---- 2/5. browser renders
    async def browser(self, drawn, overlay):
        from playwright.async_api import async_playwright
        W, H, FPS = self.W, self.H, self.FPS
        async with async_playwright() as pw:
            br = await pw.chromium.launch(args=["--allow-file-access-from-files"])
            pg = await br.new_page(viewport={"width": W, "height": H}, device_scale_factor=1)
            errs = []
            pg.on("pageerror", lambda e: errs.append(str(e)))
            pg.on("console", lambda m: errs.append(m.text) if m.type == "error" else None)
            await pg.goto((STAGE / "stage.html").as_uri())
            if self.scale != 1:
                await pg.evaluate(f"document.getElementById('stage').setAttribute('width', {W}); document.getElementById('stage').setAttribute('height', {H});")
            media_base = (self.d / "media").as_uri() + "/"
            await pg.evaluate("([e, m]) => bootStage(e, m)", [self.E, media_base])
            for i, s in drawn:
                n = self.nf(s["dur"])
                enc = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "image2pipe", "-framerate", str(FPS), "-c:v", "mjpeg", "-i", "-"] + self.X264 + ["-an", self.segfile(i)], stdin=subprocess.PIPE)
                for f in range(n):
                    await pg.evaluate(f"renderScene('{s['id']}', {s['start'] + f / FPS})")
                    enc.stdin.write(await pg.screenshot(type="jpeg", quality=93))
                enc.stdin.close(); enc.wait()
                print(f"  drawn {s['id']} ({n} frames)", flush=True)
            if overlay:
                n = self.nf(self.E["total"])
                enc = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-i", str(self.b / "base.mp4"), "-f", "image2pipe", "-framerate", str(FPS), "-c:v", "png", "-i", "-",
                                        "-filter_complex", "[0:v][1:v]overlay=0:0:shortest=1[v]", "-map", "[v]"] + self.X264 + ["-an", str(self.b / "video.mp4")], stdin=subprocess.PIPE)
                t0 = time.time()
                for f in range(n):
                    await pg.evaluate(f"renderOverlay({f / FPS})")
                    try:
                        enc.stdin.write(await pg.screenshot(type="png", omit_background=True))
                    except BrokenPipeError:
                        break
                    if f % 300 == 0: print(f"  overlay {f}/{n} {time.time() - t0:.0f}s", flush=True)
                try: enc.stdin.close()
                except BrokenPipeError: pass
                enc.wait()
            await br.close()
            if errs: print("PAGE ERRORS:", errs[:8], flush=True)

    # ---- 3. rewind
    def do_rewind(self, i, s, story):
        n = self.nf(s["dur"]); total = sum(d for _, d in story)
        tmp = self.b / "rw"; shutil.rmtree(tmp, ignore_errors=True); tmp.mkdir()
        for k in range(n):
            ta = total * (1 - (k + 1) / (n + 1)); acc = 0
            for f, d in story:
                if ta < acc + d:
                    run(["ffmpeg", "-v", "error", "-y", "-ss", f"{min(ta - acc, d - .08):.3f}", "-i", f, "-frames:v", "1", str(tmp / f"{k:03d}.png")]); break
                acc += d
        for k in range(n):
            if not (tmp / f"{k:03d}.png").exists():
                prev = tmp / f"{k - 1:03d}.png" if k else None
                nxt = next((tmp / f"{j:03d}.png" for j in range(k + 1, n) if (tmp / f"{j:03d}.png").exists()), None)
                shutil.copy(prev if prev and prev.exists() else nxt, tmp / f"{k:03d}.png")
        vf = "rgbashift=rh=6:bh=-6,noise=alls=18:allf=t,eq=saturation=0.7"
        run(["ffmpeg", "-v", "error", "-y", "-framerate", str(self.FPS), "-i", str(tmp / "%03d.png"), "-vf", vf, "-frames:v", str(n)] + self.X264 + ["-an", self.segfile(i)])

    # ---- main
    def render(self, out=None):
        t0 = time.time()
        out = out or (self.d / "draft.mp4")
        files, story = [], []
        ri = next((i for i, x in enumerate(self.segs) if x.get("scene") == "rewind"), None)
        for i, s in enumerate(self.segs):
            if s["kind"] == "clip":
                f = self.do_clip(i, s)
                if ri is None or i < ri: story.append((f, s["dur"]))
            files.append(self.segfile(i))
        print(f"clips done {time.time() - t0:.0f}s", flush=True)
        if ri is not None:
            self.do_rewind(ri, self.segs[ri], story)
        drawn = [(i, s) for i, s in enumerate(self.segs) if s["kind"] == "html" and s.get("scene") != "rewind"]
        asyncio.run(self.browser(drawn, overlay=False))
        with open(self.b / "list.txt", "w") as fh:
            for f in files: fh.write(f"file '{os.path.abspath(f)}'\n")
        run(["ffmpeg", "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", str(self.b / "list.txt"), "-c", "copy", str(self.b / "base.mp4")])
        print(f"base done {time.time() - t0:.0f}s", flush=True)
        asyncio.run(self.browser([], overlay=True))
        audio.mix(self.E, self.b / "vo_track.wav", self.b / "mix.wav")
        run(["ffmpeg", "-v", "error", "-y", "-i", str(self.b / "video.mp4"), "-i", str(self.b / "mix.wav"), "-c:v", "libx264", "-preset", "medium", "-crf", "22", "-pix_fmt", "yuv420p",
             "-c:a", "aac", "-b:a", "192k", "-af", "loudnorm=I=-14:TP=-1.5:LRA=11", "-shortest", "-movflags", "+faststart", str(out)])
        print(f"DONE {out} ({os.path.getsize(out) / 1e6:.1f} MB) in {time.time() - t0:.0f}s", flush=True)
        return out


def main(slug, **kw):
    return Renderer(slug, **kw).render()
