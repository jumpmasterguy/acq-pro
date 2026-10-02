"""Synthesized music bed + sound effects, and the final mix.

Everything is generated with numpy (no sample libraries, no licensing). Cues come
from the beats in edl.json:
  beat.sfx: [{"kind": "hit", "at": 0.15}]            relative to the beat's clip start
            [{"kind": "whoosh", "word": "last"}]      at a caption word (+ "offset")
            [{"kind": "blip", "after_line": 0.25}]    after the line finishes
  automatic: record scratch on a freeze, rewind sweep, ding on the teach punch line,
             sad trombone on the teach shrink, stamp + ticks on the card, sting on the CTA.
Music: upbeat bed until the first beat marked music:"stop_before" (or the freeze / rewind),
bass-only under the teaching board until the trombone, back in from the card to the end.
"""
import numpy as np, soundfile as sf
from scipy.signal import butter, sosfilt
from .common import SR, load_audio, normalize

rng = np.random.default_rng(7)
def t_(d): return np.arange(int(d * SR)) / SR
def env(n, a=.005, r=.2): t = np.arange(n) / SR; return np.minimum(1, t / a) * np.exp(-t / r)
def bp(x, lo, hi): return sosfilt(butter(2, [lo, hi], "band", fs=SR, output="sos"), x)
def lp(x, f): return sosfilt(butter(2, f, "low", fs=SR, output="sos"), x)
def hp(x, f): return sosfilt(butter(2, f, "high", fs=SR, output="sos"), x)
def noise(d): return rng.uniform(-1, 1, int(d * SR))
def saw(f, d):
    ph = np.cumsum(np.broadcast_to(f, int(d * SR)) / SR) if np.ndim(f) else np.arange(int(d * SR)) * f / SR
    return 2 * (ph % 1) - 1


def sfx(kind, d=None):
    if kind == "whoosh":
        d = .35; x = noise(d); n = len(x); out = np.zeros(n); f = np.linspace(500, 3200, n)
        for i in range(0, n, 2048): out[i:i + 2048] = bp(x[i:i + 2048], f[i] * .7, f[i] * 1.3)
        return out * np.sin(np.linspace(0, np.pi, n)) ** 2 * .3
    if kind == "hit":
        t = t_(.7); return (np.sin(2 * np.pi * (70 - 30 * t) * t) * np.exp(-t / .25) * .9 + hp(noise(.7), 3000) * np.exp(-t / .03) * .5) * .8
    if kind == "pop":
        t = t_(.25); return (np.sin(2 * np.pi * 380 * t) * env(len(t), .001, .05) + hp(noise(.25), 2000) * env(len(t), .001, .015)) * .9
    if kind == "cheer":
        t = t_(.7); return lp(saw(520 + 25 * np.sin(2 * np.pi * 9 * t), .7), 2500) * env(len(t), .02, .5) * .16
    if kind == "recordscratch":
        t = t_(.55); f = 300 + 900 * np.abs(np.sin(2 * np.pi * 3.5 * t))
        return (lp(saw(f, .55), 3000) * .5 + bp(noise(.55), 800, 4000) * .5) * env(len(t), .005, .35) * .55
    if kind == "slide":
        t = t_(.7); return bp(noise(.7), 300, 1500) * np.sin(np.linspace(0, np.pi, len(t))) * .3
    if kind == "rewind":
        d = d or 1.3; t = t_(d); f = 400 + 900 * ((t * 5) % 1)
        return (lp(saw(f, d), 2500) * .22 + bp(noise(d), 2000, 6000) * .1) * np.minimum(1, (d - t) / .1)
    if kind == "ding":
        t = t_(1.4); return (np.sin(2 * np.pi * 1318.5 * t) + .5 * np.sin(2 * np.pi * 2637 * t)) * env(len(t), .002, .45) * .28
    if kind == "stamp":
        t = t_(.5); return (np.sin(2 * np.pi * 90 * t) * np.exp(-t / .12) + lp(noise(.5), 1200) * np.exp(-t / .04)) * .9
    if kind == "tick":
        t = t_(.12); return (bp(noise(.12), 2000, 6000) * env(len(t), .001, .02) + np.sin(2 * np.pi * 1200 * t) * env(len(t), .001, .03) * .4) * .5
    if kind == "sting":
        t = t_(2.2); out = sum(lp(saw(f, 2.2), 1800) * .25 for f in (220, 261.63, 329.63, 440)); return out * env(len(t), .01, .8) * .4
    if kind == "blip":
        t = t_(.12); return np.sin(2 * np.pi * (1200 + 3000 * t) * t) * env(len(t), .002, .05) * .25
    if kind == "honk":
        out = np.zeros(int(.55 * SR))
        for st in (0, .22):
            t = t_(.16); w = np.sign(np.sin(2 * np.pi * 370 * t)) + np.sign(np.sin(2 * np.pi * 466 * t))
            x = lp(w, 2500) * env(len(t), .005, .12) * .22; k = int(st * SR); out[k:k + len(x)] += x
        return out
    if kind == "backfire":
        t = t_(.6); return (lp(noise(.6), 700) * np.exp(-t / .1) + np.sin(2 * np.pi * 55 * t) * np.exp(-t / .12)) * .9
    if kind == "sputter":
        t = t_(1.2); pulses = (np.sin(2 * np.pi * 11 * t) > .6).astype(float)
        return lp(noise(1.2), 400) * pulses * .5 * np.minimum(1, (1.2 - t) / .2)
    if kind == "trombone":
        out = np.zeros(int(2.0 * SR))
        for f, st, dd in [(233.1, 0, .32), (220, .34, .32), (207.7, .68, .32), (196, 1.02, .95)]:
            t = t_(dd); vib = 1 + (.012 * np.sin(2 * np.pi * 6 * t) * (t > .3) if dd > .5 else 0)
            x = lp(saw(f * vib, dd), 1300) * (.6 + .4 * np.sin(np.pi * t / dd)) * np.minimum(1, t / .03) * np.minimum(1, (dd - t) / .08) * .3
            k = int(st * SR); out[k:k + len(x)] += x
        return out
    if kind == "cash":
        t = t_(.5); return (np.sin(2 * np.pi * 2093 * t) * env(len(t), .001, .12) + hp(noise(.5), 5000) * env(len(t), .001, .04) * .6) * .4
    if kind == "boing":
        t = t_(.6); f = 180 * (1 + .6 * np.exp(-t * 6)) * (1 + .05 * np.sin(2 * np.pi * 18 * t)); return lp(saw(f, .6), 2000) * env(len(t), .003, .25) * .45
    raise ValueError(kind)


def music(start, end, level, bass_only=False, bpm=104):
    beat = 60 / bpm; n8 = beat / 2
    notes = [55, 0, 65.41, 73.42, 77.78, 82.41, 98, 82.41]
    d = max(0, end - start); out = np.zeros(int(d * SR) + SR); i, tt = 0, 0.0
    while tt < d:
        f = notes[i % 8]; k = int(tt * SR)
        if f:
            t = t_(n8 * .95)
            out[k:k + len(t)] += (np.sin(2 * np.pi * f * t) + .5 * np.sin(2 * np.pi * 2 * f * t) + .2 * np.sin(2 * np.pi * 3 * f * t)) * env(len(t), .004, .18) * .55
        if not bass_only:
            if i % 2 == 1:
                h = hp(noise(.05), 7000) * env(int(.05 * SR), .001, .012) * .25; out[k:k + len(h)] += h
            if i % 4 == 2:
                sn = bp(noise(.12), 1200, 3500) * env(int(.12 * SR), .001, .03) * .5; out[k:k + len(sn)] += sn
        tt += n8; i += 1
    fade = np.minimum(1, np.minimum(np.arange(len(out)) / (.3 * SR), (len(out) - np.arange(len(out))) / (.6 * SR)))
    return start, out * fade * level


def cues_from_edl(E):
    seg = {s["id"]: s for s in E["segments"]}
    ln = {l["id"]: l for l in E["lines"]}
    beats = {b["id"]: b for b in E["beats"]}
    TOTAL = E["total"]

    def wa(lid, needle):
        for w in ln.get(lid, {"words": []})["words"]:
            if w["w"].lower().strip(".,!?'\"").startswith(needle.lower()): return w["s"]
        return ln[lid]["start"] if lid in ln else 0

    cues, music_plan = [], []
    stop_at = None
    for s in E["segments"]:
        b = beats.get(s.get("beat"), {})
        if s["kind"] == "clip" and not s.get("freeze"):
            if b.get("music") == "stop_before" and stop_at is None: stop_at = s["start"]
            for c in b.get("sfx", []):
                if "at" in c: at = s["start"] + c["at"]
                elif "word" in c: at = wa(b["id"], c["word"]) + c.get("offset", 0)
                elif "after_line" in c and b["id"] in ln: at = ln[b["id"]]["start"] + ln[b["id"]]["dur"] + c["after_line"]
                else: continue
                cues.append((c["kind"], at))
        if s.get("freeze"):
            cues.append(("recordscratch", s["start"] - .02))
            if stop_at is None: stop_at = s["start"]
        if s.get("scene") == "rewind":
            cues.append(("rewind", s["start"], s["dur"]))
            if stop_at is None: stop_at = s["start"]
        if s.get("scene") == "teach":
            B = s.get("board", {})
            if B.get("punch", {}).get("ding"): cues.append(("ding", wa(B["punch"]["word"]["line"], B["punch"]["word"]["w"])))
            if s.get("trombone"): cues.append(("trombone", s["trombone"]))
            music_plan.append((s["start"] + .2, s["trombone"] or (s["start"] + s["dur"] - .5), .10, True))
        if s.get("scene") == "card":
            l = ln.get(s["line"]); t0 = l["start"] if l else s["start"] + .3
            cues.append(("stamp", t0 - .03))
            for c in s.get("checks", []):
                if c.get("w"): cues.append(("tick", wa(s["line"], c["w"]) + .1))
            music_plan.append((s["start"], TOTAL, .13, False))
        if s.get("scene") == "cta":
            cues.append(("sting", s["start"] + .05))
    music_plan.insert(0, (0, stop_at if stop_at is not None else TOTAL, .17, False))
    return cues, music_plan


def mix(E, vo_track, out_wav):
    TOTAL = E["total"]
    vo, vsr = sf.read(vo_track)
    assert vsr == SR, vsr
    L = int((TOTAL + .5) * SR)
    V = np.zeros(L); V[:min(L, len(vo))] = vo[:L]
    added = 0
    for s in E["segments"]:
        if s.get("own_audio"):
            a = load_audio(s["file"], ss=s["src_in"], t=s["dur"])
            if len(a) < SR * .3:
                print(f"  WARNING: no audio in {s['id']}", flush=True); continue
            a = normalize(a)
            n = int(SR * .04); a[:n] *= np.linspace(0, 1, n); a[-n:] *= np.linspace(1, 0, n)
            k = int(s["start"] * SR); a = a[:L - k]; V[k:k + len(a)] += a; added += 1
    print(f"  own-audio clips mixed in: {added}", flush=True)
    e = lp(np.abs(V), 8); e = e / (e.max() + 1e-9); duck = 1 - .6 * np.clip(e * 4, 0, 1)
    cues, plan = cues_from_edl(E)
    M = np.zeros(L)
    for st, en, lvl, bass in plan:
        st, m = music(st, en, lvl, bass_only=bass); k = int(st * SR); m = m[:L - k]; M[k:k + len(m)] += m
    M *= duck
    FX = np.zeros(L)
    for c in cues:
        kind, at = c[0], c[1]
        x = sfx(kind, c[2] if len(c) > 2 else None); k = int(max(0, at) * SR); x = x[:L - k]; FX[k:k + len(x)] += x
    out = V + M + FX * .8
    out = out / (np.abs(out).max() + 1e-9) * .92
    sf.write(out_wav, out.astype(np.float32), SR)
    print(f"  cues: {len(cues)}, music segments: {len(plan)}")
