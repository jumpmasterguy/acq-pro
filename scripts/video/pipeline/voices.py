"""Stage: voices. script.json -> vo/<id>_<spk>.mp3 (+ .json word timings) + vo/manifest.json
                              -> vo/pad/<id>.mp3 (dialogue lines padded to >= 2.6s for Seedance)

ElevenLabs (eleven_v3 with audio tags). Env: ELEVENLABS_API_KEY. DRY_RUN or --dry lists lines only.
Idempotent: lines whose mp3 already exists are skipped unless FORCE=1.
"""
import base64, json, os, subprocess, sys
from urllib.parse import quote
from .common import vdir, load_json, save_json, characters, curl, mark, media_duration

API = "https://api.elevenlabs.io"
MODEL = "eleven_v3"
PAD_TO = 2.6   # seconds; Seedance rejects audio references shorter than ~2s


def all_lines(script):
    for b in script["beats"]:
        if b["kind"] == "teach":
            for l in b["lines"]:
                yield {"id": l["id"], "spk": l["spk"], "tts": l["tts"], "caption": l["caption"], "beat": b["id"]}
        elif "tts" in b:
            yield {"id": b["id"], "spk": b["spk"], "tts": b["tts"], "caption": b["caption"], "beat": b["id"], "kind": b["kind"]}


def cast_voices(cast, dry):
    if dry:
        return {k: {"voice_id": "DRY", "name": v["elevenlabs"]["prefer"][0]} for k, v in cast.items() if isinstance(v, dict) and "elevenlabs" in v}
    key = os.environ.get("ELEVENLABS_API_KEY") or sys.exit("Missing ELEVENLABS_API_KEY")
    code, js = curl("GET", API + "/v1/voices", [f"xi-api-key: {key}"])
    if code != 200:
        sys.exit(f"Could not list voices ({code}): {js}")
    voices = js.get("voices", [])
    picks = {}
    for spk, c in cast.items():
        if not isinstance(c, dict) or "elevenlabs" not in c:
            continue
        el = c["elevenlabs"]
        if el.get("voice_id"):
            picks[spk] = {"voice_id": el["voice_id"], "name": el.get("voice_name", el["voice_id"])}; continue
        for want in el["prefer"]:
            hit = next((v for v in voices if v["name"].lower().split(" ")[0].strip(" -") == want.lower()), None)
            if hit:
                picks[spk] = {"voice_id": hit["voice_id"], "name": hit["name"]}; break
        if spk not in picks:
            sys.exit(f"No voice found for {spk} ({c['role']}). Available: {[v['name'] for v in voices][:40]}")
        print(f"  {spk} ({c['role']}): {picks[spk]['name']}")
    return picks


def pad(src, dst, to=PAD_TO):
    d = media_duration(src)
    if d >= to:
        subprocess.run(["cp", str(src), str(dst)], check=True); return
    extra = to - d
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(src), "-af", f"adelay={int(extra * 500)}|{int(extra * 500)},apad=pad_dur={extra / 2:.3f}",
                    "-c:a", "libmp3lame", "-b:a", "128k", str(dst)], check=True)


def main(slug, dry=False):
    d = vdir(slug)
    script = load_json(d / "script.json")
    if script.get("status") != "approved" and os.environ.get("ALLOW_DRAFT") != "1":
        sys.exit(f'script.json status is "{script.get("status")}"; set it to "approved" (or ALLOW_DRAFT=1) before voicing')
    cast = characters()
    out = d / "vo"; out.mkdir(exist_ok=True); (out / "pad").mkdir(exist_ok=True)
    dry = dry or os.environ.get("DRY_RUN") == "1"
    lines = list(all_lines(script))
    picks = cast_voices(cast, dry)
    print(f"{len(lines)} lines, {sum(len(l['tts']) for l in lines)} characters, model {MODEL}")
    if dry:
        for l in lines: print(f"  {l['id']} {l['spk']}: {l['tts']}")
        return
    key = os.environ["ELEVENLABS_API_KEY"]
    manifest = {"script": slug, "model": MODEL, "cast": picks, "lines": []}
    failures = 0
    for l in lines:
        v = picks[l["spk"]]; stem = f"{l['id']}_{l['spk']}"
        mp3 = out / f"{stem}.mp3"
        if mp3.exists() and os.environ.get("FORCE") != "1":
            manifest["lines"].append({**l, "file": mp3.name, "voice": v["name"]}); print(f"  {stem} exists, skipped"); continue
        body = {"text": l["tts"], "model_id": MODEL,
                "voice_settings": {"stability": cast[l["spk"]]["elevenlabs"].get("stability", 0.5), "similarity_boost": 0.75}}
        q = "?output_format=mp3_44100_128"; vid = quote(v["voice_id"], safe="")
        hdr = [f"xi-api-key: {key}", "Content-Type: application/json"]
        code, js = curl("POST", f"{API}/v1/text-to-speech/{vid}/with-timestamps{q}", hdr, body)
        if code == 200 and js.get("audio_base64"):
            mp3.write_bytes(base64.b64decode(js["audio_base64"]))
            (out / f"{stem}.json").write_text(json.dumps({"alignment": js.get("alignment"), "normalized_alignment": js.get("normalized_alignment")}))
            how = "with timings"
        else:
            if code in (401, 402, 403, 429):
                sys.exit(f"ElevenLabs refused ({code}): {js}")
            code2, err = curl("POST", f"{API}/v1/text-to-speech/{vid}{q}", hdr, body, out_file=mp3)
            if code2 != 200:
                print(f"  {stem} FAILED ({code2}): {err}"); failures += 1; continue
            how = f"audio only (timings endpoint said {code})"
        manifest["lines"].append({**l, "file": mp3.name, "voice": v["name"]})
        print(f"  {stem} ok, {how}")
    # padded copies of every on-screen dialogue line, for Seedance's audio reference
    for l in lines:
        if l.get("kind") == "dialogue":
            src = out / f"{l['id']}_{l['spk']}.mp3"
            if src.exists(): pad(src, out / "pad" / f"{l['id']}.mp3")
    save_json(out / "manifest.json", manifest)
    if failures:
        sys.exit(f"{failures} line(s) failed")
    mark(slug, "voices", "done", lines=len(manifest["lines"]))
