"""script.json + vo/ + media/ -> edl.json + vo_track.wav

Builds the edit decision list the renderer and the mixer consume. All times are
absolute seconds on the final timeline.

Beat kinds
  broll     narration (or an off-screen line) over a Seedance clip that is retimed to fit
  dialogue  a Seedance clip whose OWN audio is the voice (Higgsfield voice_change made it
            lip-synced by construction); the speech span is measured from the clip
  rewind    VHS reverse montage of everything before it, under a narration line
  teach     the drawn teaching board (data in beat.board), under several narration lines
  card      the drawn "DON'T BE <NAME>" stamp card with checklist
  cta       the drawn end card (logo, lesson title, module, url)
"""
import json, sys
from pathlib import Path
import numpy as np, soundfile as sf
from .common import SR, FPS, vdir, load_json, save_json, characters, load_audio, audible_span, speech_span, normalize, media_duration
from . import align

DEFAULT_CUT = {"lead": 0.3, "tail": 0.4}
NARR_LEAD, NARR_TAIL = 0.05, 0.1


def words_from_alignment(al_path, caption, tempo=1.0, shift=0.0):
    """Caption words with (s, e) relative to the trimmed/retimed audio start.
    Falls back to proportional spacing if the alignment doesn't line up."""
    cap = caption.split()
    try:
        al = json.loads(Path(al_path).read_text())["alignment"]
        out, cur, inside = [], None, False
        for c, s, e in zip(al["characters"], al["character_start_times_seconds"], al["character_end_times_seconds"]):
            if c == "[": inside = True; continue
            if inside:
                if c == "]": inside = False
                continue
            if c.isspace():
                if cur: out.append(cur); cur = None
                continue
            if cur is None: cur = {"s": s, "e": e}
            cur["e"] = e
        if cur: out.append(cur)
        if len(out) == len(cap):
            return [{"w": w, "s": o["s"] / tempo - shift, "e": o["e"] / tempo - shift} for w, o in zip(cap, out)]
    except Exception:
        pass
    return None


def spread_words(caption, s0, s1):
    """Proportional word timing across a measured speech span, weighted by word length + punctuation pauses."""
    cap = caption.split()
    wts = [len(w) + 1 + (5 if w[-1] in ".?!" else 3 if w[-1] == "," else 0) for w in cap]
    tot, acc, out = sum(wts), 0, []
    for w, wt in zip(cap, wts):
        a = s0 + (s1 - s0) * acc / tot; acc += wt
        out.append({"w": w, "s": round(a, 3), "e": round(s0 + (s1 - s0) * acc / tot, 3)})
    return out


class Builder:
    def __init__(self, slug):
        self.slug = slug
        self.d = vdir(slug)
        self.script = load_json(self.d / "script.json")
        self.cast = characters()
        self.man = {l["id"]: l for l in load_json(self.d / "vo" / "manifest.json")["lines"]}
        self.segs, self.lines, self.voice = [], [], []
        self.T = 0.0
        self.marks = {}

    # ---- audio placement ----
    def _line_audio(self, lid, tempo):
        l = self.man[lid]
        alt = self.d / "media" / f"{lid}_voice.mp3"          # Higgsfield preset-voice version of an off-screen line, if fetched
        src = alt if alt.exists() else self.d / "vo" / l["file"]
        a = load_audio(src, tempo)
        s, e = audible_span(a)
        c0 = max(0, s - .03)
        a = normalize(a[int(c0 * SR): int((e + .06) * SR)])
        return a, c0, (None if alt.exists() else self.d / "vo" / (l["file"][:-4] + ".json"))

    def narr(self, lid, at):
        """Place a voiced line (trimmed) at absolute time `at`. Returns its duration."""
        spk = self.man[lid]["spk"]
        tempo = self.cast.get(spk, {}).get("tempo", 1.0)
        a, c0, al = self._line_audio(lid, tempo)
        self.voice.append((at, a))
        dur = len(a) / SR
        words = words_from_alignment(al, self.man[lid]["caption"], tempo, c0) if al else None
        if words:
            words = [{"w": w["w"], "s": round(at + max(0, w["s"]), 3), "e": round(at + min(dur, w["e"]), 3)} for w in words]
        else:
            words = spread_words(self.man[lid]["caption"], at, at + dur)
        self.lines.append({"id": lid, "spk": spk, "start": round(at, 3), "dur": round(dur, 3), "words": words})
        return dur

    # ---- segments ----
    def clip(self, sid, file, dur, src_in=0.0, src_out=None, **kw):
        self.segs.append({"id": sid, "kind": "clip", "file": str(file), "start": round(self.T, 3), "dur": round(dur, 3),
                          "src_in": round(src_in, 3), "src_out": None if src_out is None else round(src_out, 3), **kw})
        self.T += dur

    def html(self, sid, scene, dur, **kw):
        self.segs.append({"id": sid, "kind": "html", "scene": scene, "start": round(self.T, 3), "dur": round(dur, 3), **kw})
        self.T += dur

    def media(self, b):
        f = self.d / "media" / f"{b['id']}.mp4"
        if not f.exists():
            sys.exit(f"missing clip for beat {b['id']}: {f}")
        return f

    # ---- beats ----
    def beat_broll(self, b):
        f = self.media(b)
        L = media_duration(f)
        at = self.T + (0.15 if b.get("fit") == "full" else NARR_LEAD)
        d = self.narr(b["id"], at)
        if b.get("fit") == "full":
            self.clip(b["id"], f, L, 0, L, speed=1, beat=b["id"])
        else:
            self.clip(b["id"], f, NARR_LEAD + d + NARR_TAIL + b.get("cut", {}).get("tail", 0), 0, L, beat=b["id"])

    def beat_dialogue(self, b):
        f = self.media(b)
        L = media_duration(f)
        vo_al = self.d / "vo" / (self.man[b["id"]]["file"][:-4] + ".json") if b["id"] in self.man else None
        aligned = align.align_words(f, b["caption"], align.ref_word_durations(vo_al, b["caption"]) if vo_al and vo_al.exists() else None)
        if aligned:
            sp0, sp1 = aligned[0][1], aligned[-1][2]
        else:
            sp0, sp1 = speech_span(load_audio(f))
            print(f"  WARNING beat {b['id']}: forced alignment failed, using loudness ({sp0:.2f}-{sp1:.2f})", flush=True)
        if sp1 - sp0 < 0.3 or sp1 > L:
            sp0, sp1 = max(0.0, min(sp0, L - .5)), min(L, max(sp1, sp0 + .3))
        cut = {**DEFAULT_CUT, **b.get("cut", {})}
        start = max(0.0, sp0 - cut["lead"])
        end = min(L, cut["end_abs"] if cut.get("end_abs") is not None else sp1 + cut["tail"])
        off = self.T - start
        words = [{"w": w, "s": round(off + s, 3), "e": round(off + e, 3)} for w, s, e in aligned] if aligned else spread_words(b["caption"], off + sp0, off + sp1)
        self.lines.append({"id": b["id"], "spk": b["spk"], "start": round(off + sp0, 3), "dur": round(sp1 - sp0, 3), "words": words, "aligned": bool(aligned)})
        self.clip(b["id"], f, end - start, start, end, speed=1, own_audio=True, beat=b["id"])
        if b.get("freeze"):
            fz = b["freeze"] if isinstance(b["freeze"], dict) else {}
            self.clip(b["id"] + "_freeze", f, fz.get("dur", 0.55), max(0.0, end - .15), end, freeze=True, beat=b["id"], label=fz.get("label", "*record scratch*"))

    def beat_rewind(self, b):
        self.marks["rewind_index"] = len(self.segs)
        d = self.narr(b["id"], self.T + .1)
        self.html(b["id"], "rewind", max(1.1, .1 + d + .15), beat=b["id"])

    def beat_teach(self, b):
        t0 = self.T
        t = t0 + .2
        starts = {}
        for i, l in enumerate(b["lines"]):
            starts[l["id"]] = t
            d = self.narr(l["id"], t)
            t += d + (.35 if i == 0 else .15)
        t -= .15
        board = dict(b.get("board", {}))
        board["line_starts"] = {k: round(v, 3) for k, v in starts.items()}
        trombone = round(t + .02, 3) if board.get("shrink", {}).get("trombone") else None
        self.marks["trombone"] = trombone
        self.html(b["id"], "teach", t - t0 + 1.25, board=board, trombone=trombone, beat=b["id"], line_ids=[l["id"] for l in b["lines"]])

    def beat_card(self, b):
        d = self.narr(b["id"], self.T + .3)
        self.html(b["id"], "card", .3 + d + .35, beat=b["id"], stamp=b["stamp"], cutout=b.get("cutout"), checks=b.get("checks", []), line=b["id"])

    def beat_cta(self, b):
        d = self.narr(b["id"], self.T + .1)
        les = self.script.get("lesson", {})
        self.html(b["id"], "cta", .1 + d + .25, beat=b["id"], line=b["id"], title=les.get("title", ""), module=les.get("module", ""),
                  title_word=b.get("title_word"), module_word=b.get("module_word"), url_word=b.get("url_word"), cutout=b.get("cutout"))

    def build(self):
        for b in self.script["beats"]:
            getattr(self, "beat_" + b["kind"])(b)
        TOTAL = self.T
        mix = np.zeros(int((TOTAL + 1) * SR))
        for at, a in self.voice:
            i = int(at * SR); mix[i:i + len(a)] += a[:len(mix) - i]
        sf.write(self.d / "build" / "vo_track.wav", mix[:int(TOTAL * SR)].astype(np.float32), SR)
        cutouts = {}
        for k, c in self.cast.items():
            if isinstance(c, dict):
                for n, cu in (c.get("cutouts") or {}).items():
                    cutouts[n] = {"file": cu["file"], "crop": cu.get("crop", {})}
                if k == "extras":
                    for n, cu in c.items():
                        cutouts[n] = {"file": cu["file"], "crop": cu.get("crop", {})}
        edl = {"slug": self.slug, "total": round(TOTAL, 3), "fps": FPS, "segments": self.segs,
               "lines": sorted(self.lines, key=lambda l: l["start"]), "beats": self.script["beats"],
               "character": self.script.get("character", "H"), "cast": {k: {kk: vv for kk, vv in v.items() if kk in ("name", "tag", "caption_color", "tag_color")} for k, v in self.cast.items() if isinstance(v, dict) and "name" in v},
               "cutouts": cutouts, "marks": self.marks}
        save_json(self.d / "build" / "edl.json", edl)
        print(f"TOTAL {TOTAL:.1f}s, {len(self.segs)} segments, {len(self.lines)} lines")
        for s in self.segs:
            print(f"  {s['id']:12s} {s['kind']:4s} {s['start']:5.1f} +{s['dur']:4.2f}  {s.get('scene', Path(s.get('file', '')).name)}")
        return edl


def main(slug):
    (vdir(slug) / "build").mkdir(exist_ok=True)
    return Builder(slug).build()
