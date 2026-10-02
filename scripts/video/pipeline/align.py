"""Forced alignment of a known line against a clip's audio (pocketsphinx).

Seedance clips carry their own sound effects (cheering, car noises, foam), so a plain
loudness gate can't find where the character actually speaks. We know the exact
words, so we force-align them instead: pocketsphinx ships an English acoustic model
in the pip package (no downloads), and alignment with a known transcript is robust
enough on cartoon voices. Output: [(word, start, end)] in clip seconds.
"""
import json, re, subprocess
from pathlib import Path


def _pcm16k(path):
    return subprocess.run(["ffmpeg", "-v", "error", "-i", str(path), "-af", "highpass=f=120,lowpass=f=3800",
                           "-f", "s16le", "-ac", "1", "-ar", "16000", "-"], capture_output=True).stdout


def align_words(clip_path, caption, ref_word_durs=None):
    """Return [(caption_word, s, e)] or None if alignment fails.
    ref_word_durs: optional per-word durations from the ElevenLabs alignment, used to
    stop the last word from swallowing trailing noise."""
    try:
        from pocketsphinx import Decoder, Config
    except ImportError:
        return None
    cap = caption.split()
    norm = [re.sub(r"[^a-z']", "", w.lower()) for w in cap]
    txt = " ".join(w for w in norm if w)
    if not txt:
        return None
    try:
        d = Decoder(Config(samprate=16000, loglevel="ERROR"))
        d.set_align_text(txt)
        d.start_utt(); d.process_raw(_pcm16k(clip_path), full_utt=True); d.end_utt()
        segs = [(s.word, s.start_frame / 100, s.end_frame / 100) for s in d.seg()]
    except Exception as e:
        print(f"  align failed: {e}")
        return None
    segs = [s for s in segs if s[0] not in ("<s>", "</s>", "<sil>", "[NOISE]", "[SPEECH]") and not s[0].startswith("<")]
    want = [w for w in norm if w]
    if len(segs) != len(want) or any(a.split("(")[0] != b for (a, _, _), b in zip(segs, want)):
        print(f"  align mismatch: {[s[0] for s in segs]} vs {want}")
        return None
    out, k = [], 0
    for w, n in zip(cap, norm):
        if not n:
            continue
        _, s, e = segs[k]
        if ref_word_durs and k < len(ref_word_durs) and ref_word_durs[k]:
            e = min(e, s + ref_word_durs[k] * 1.5 + .12)
        out.append((w, round(s, 3), round(max(e, s + .05), 3)))
        k += 1
    return out


def ref_word_durations(alignment_json, caption):
    """Per-word durations from an ElevenLabs with-timestamps alignment file (or None)."""
    try:
        al = json.loads(Path(alignment_json).read_text())["alignment"]
    except Exception:
        return None
    out, cur, inside = [], None, False
    for c, s, e in zip(al["characters"], al["character_start_times_seconds"], al["character_end_times_seconds"]):
        if c == "[": inside = True; continue
        if inside:
            if c == "]": inside = False
            continue
        if c.isspace():
            if cur: out.append(cur); cur = None
            continue
        if cur is None: cur = [s, e]
        cur[1] = e
    if cur: out.append(cur)
    if len(out) != len(caption.split()):
        return None
    return [e - s for s, e in out]
