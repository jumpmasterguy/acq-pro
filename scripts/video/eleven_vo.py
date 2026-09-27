#!/usr/bin/env python3
"""Generate one audio file per script line with ElevenLabs.

Reads a <script>.lines.json, casts each speaker to a voice on your
ElevenLabs account (first name match from the 'prefer' list, or an explicit
'voice_id'), and writes OUT_DIR/<id>_<spk>.mp3 plus <id>_<spk>.json with
word/character timings when the API returns them. Also writes manifest.json.

Env: ELEVENLABS_API_KEY (required), LINES (path), OUT_DIR, DRY_RUN=1.
Requests go through curl (same reason as the Higgsfield bake-off).
"""
import base64, json, os, subprocess, sys
from urllib.parse import quote
from pathlib import Path

API = "https://api.elevenlabs.io"
LINES = Path(os.environ.get("LINES", "scripts/video/hank-heist.lines.json"))
OUT = Path(os.environ.get("OUT_DIR", "video-vo"))
DRY = os.environ.get("DRY_RUN") == "1"
cfg = json.loads(LINES.read_text())


def curl(method, path, body=None, out_file=None):
    key = os.environ.get("ELEVENLABS_API_KEY")
    if not key:
        sys.exit("Missing ELEVENLABS_API_KEY")
    conf = f'header = "xi-api-key: {key}"\nheader = "Content-Type: application/json"\n'
    if body is not None:
        conf += "data = " + json.dumps(json.dumps(body)) + "\n"
    args = ["curl", "-sS", "--max-time", "180", "-K", "-", "-X", method, "-w", "\n%{http_code}"]
    if out_file:
        args += ["-o", str(out_file)]
    r = subprocess.run(args + [API + path], input=conf.encode(), capture_output=True)
    txt, _, code = r.stdout.decode(errors="replace").rpartition("\n")
    code = int(code) if code.strip().isdigit() else 0
    if out_file:
        return code, (Path(out_file).read_text(errors="replace")[:400] if code >= 400 else None)
    try:
        return code, json.loads(txt or "{}")
    except ValueError:
        return code, {"raw": (txt or r.stderr.decode())[:400]}


def cast_voices():
    if DRY:
        return {s: {"voice_id": "DRY", "name": c["prefer"][0]} for s, c in cfg["cast"].items()}
    code, js = curl("GET", "/v1/voices")
    if code != 200:
        sys.exit(f"Could not list voices ({code}): {js}")
    voices = js.get("voices", [])
    print(f"{len(voices)} voices on the account")
    picks = {}
    for spk, c in cfg["cast"].items():
        if c.get("voice_id"):
            picks[spk] = {"voice_id": c["voice_id"], "name": c.get("voice_name", c["voice_id"])}
            continue
        for want in c["prefer"]:
            hit = next((v for v in voices if v["name"].lower().split(" ")[0].strip(" -") == want.lower()), None)
            if hit:
                picks[spk] = {"voice_id": hit["voice_id"], "name": hit["name"]}
                break
        if spk not in picks:
            sys.exit(f"No voice found for {spk} ({c['role']}). Available: {[v['name'] for v in voices][:40]}")
        print(f"  {spk} ({c['role']}): {picks[spk]['name']}")
    return picks


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    picks = cast_voices()
    chars = sum(len(l["tts"]) for l in cfg["lines"])
    print(f"{len(cfg['lines'])} lines, {chars} characters, model {cfg['model']}")
    if DRY:
        for l in cfg["lines"]:
            print(f"  {l['id']} {l['spk']}: {l['tts']}")
        return
    manifest = {"script": cfg["script"], "model": cfg["model"], "cast": picks, "lines": []}
    failures = 0
    for l in cfg["lines"]:
        v = picks[l["spk"]]
        vid = quote(v["voice_id"], safe="")
        stem = f"{l['id']}_{l['spk']}"
        body = {"text": l["tts"], "model_id": cfg["model"],
                "voice_settings": {"stability": cfg["cast"][l["spk"]].get("stability", 0.5), "similarity_boost": 0.75}}
        q = "?output_format=mp3_44100_128"
        code, js = curl("POST", f"/v1/text-to-speech/{vid}/with-timestamps{q}", body)
        if code == 200 and js.get("audio_base64"):
            (OUT / f"{stem}.mp3").write_bytes(base64.b64decode(js["audio_base64"]))
            (OUT / f"{stem}.json").write_text(json.dumps({"alignment": js.get("alignment"), "normalized_alignment": js.get("normalized_alignment")}))
            how = "with timings"
        else:
            if code in (401, 402, 403, 429):
                sys.exit(f"ElevenLabs refused ({code}): {js}")
            code2, err = curl("POST", f"/v1/text-to-speech/{vid}{q}", body, out_file=OUT / f"{stem}.mp3")
            if code2 != 200:
                body.pop("voice_settings")
                code2, err = curl("POST", f"/v1/text-to-speech/{vid}{q}", body, out_file=OUT / f"{stem}.mp3")
            if code2 != 200:
                print(f"  {stem} FAILED ({code2}): {err}")
                failures += 1
                continue
            how = f"audio only (timings endpoint said {code})"
        manifest["lines"].append({**l, "file": f"{stem}.mp3", "voice": v["name"]})
        print(f"  {stem} ok, {how}")
    (OUT / "manifest.json").write_text(json.dumps(manifest, indent=1))
    if failures:
        sys.exit(f"{failures} line(s) failed")


if __name__ == "__main__":
    main()
