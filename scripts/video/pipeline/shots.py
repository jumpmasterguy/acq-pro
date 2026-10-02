"""Stage: shots (plan). script.json -> shots.json

shots.json is the complete Higgsfield work order for one video: every keyframe image,
every Seedance clip, every voice change and every off-screen line, with the exact
prompts and reference IDs. It is executed by the Higgsfield runner (a Claude session
with the Higgsfield MCP, following scripts/video/SHOTS_RUNNER.md), which records the
resulting job IDs and URLs in jobs.json. The fetch stage then downloads them.

Why a plan file: Higgsfield's subscription credits are only reachable through the MCP /
CLI session auth, not a server key, so this stage separates "what to generate" (code,
deterministic, reviewable) from "pressing the buttons" (an agent with the connector).
"""
from .common import vdir, load_json, save_json, characters, mark

IMAGE_MODEL = "nano_banana_flash"
VIDEO_MODEL = "seedance_2_5"
STYLE_PREFIX = "Same character ({name}) and same stylized 3D animated style as the reference. "
STYLE_PREFIX_NOCHAR = "Same stylized 3D animated style as the reference image (do not show {name}). "
MOTION_PREFIX = "Use the reference image as the exact first frame, character and style: stylized 3D animated comedy. "
NO_TEXT = " No text, no subtitles, no logos."
DEFAULT_DURATION = 4
COST = {"image": 1.5, "video_per_4s": 28, "video_5s": 35, "voice_change": 1, "audio": 1}


def main(slug):
    d = vdir(slug)
    s = load_json(d / "script.json")
    cast = characters()
    main_char = cast[s.get("character", "H")]
    plan = {"slug": slug, "project": "Acqlerate - Don't Be Hank videos", "aspect_ratio": "9:16",
            "image_model": IMAGE_MODEL, "video_model": VIDEO_MODEL, "keyframes": [], "videos": [], "voice_changes": [], "audio": [], "cutouts": {}}
    needed_cutouts = set()
    for b in s["beats"]:
        sh = b.get("shot")
        if sh:
            refs = [cast[r]["ref_image_job"] for r in sh.get("ref", []) if r in cast and cast[r].get("ref_image_job")]
            if not refs:
                refs = [main_char["ref_image_job"]]
            if sh.get("keyframe_of"):
                kf_id = sh["keyframe_of"]
            else:
                kf_id = b["id"]
                who = cast[sh["ref"][0]]["name"] if sh.get("ref") else main_char["name"]
                prefix = STYLE_PREFIX_NOCHAR.format(name=main_char["name"]) if sh.get("no_character") else STYLE_PREFIX.format(name=who)
                plan["keyframes"].append({"id": kf_id, "model": IMAGE_MODEL, "aspect_ratio": "9:16",
                                          "prompt": prefix + sh["image"].rstrip() + NO_TEXT, "reference_image_jobs": refs})
            dur = sh.get("duration", DEFAULT_DURATION)
            v = {"id": b["id"], "model": VIDEO_MODEL, "mode": "omni_reference", "aspect_ratio": "9:16", "duration": dur,
                 "prompt": MOTION_PREFIX + sh["motion"].rstrip() + NO_TEXT, "keyframe": kf_id,
                 "generate_audio": b["kind"] == "dialogue"}
            if b["kind"] == "dialogue":
                v["audio_reference"] = f"vo/pad/{b['id']}.mp3"
                v["spoken_line"] = b["caption"]
                hv = cast[b["spk"]].get("higgsfield_voice")
                if hv:
                    plan["voice_changes"].append({"id": b["id"], "input_video": b["id"], **hv})
            plan["videos"].append(v)
        if b.get("offscreen") and b.get("tts"):
            hv = cast[b["spk"]].get("higgsfield_voice")
            if hv:
                plan["audio"].append({"id": b["id"], "model": "seed_audio", "text": b["caption"], **hv, "note": "off-screen line; laid over the clip in the edit"})
        for key in ("cutout",):
            if b.get(key): needed_cutouts.add(b[key])
        if b.get("board"):
            B = b["board"]
            for e in B.get("evidence", []): needed_cutouts.add(e["cutout"])
            if B.get("compare", {}).get("pin_cutout"): needed_cutouts.add(B["compare"]["pin_cutout"])
    for k, c in cast.items():
        if not isinstance(c, dict): continue
        for n, cu in (c.get("cutouts") or {}).items():
            if n in needed_cutouts: plan["cutouts"][n] = {"job": cu["job"], "file": cu["file"]}
        if k == "extras":
            for n, cu in c.items():
                if n in needed_cutouts: plan["cutouts"][n] = {"job": cu["job"], "file": cu["file"]}
    missing = needed_cutouts - set(plan["cutouts"])
    if missing:
        plan["cutouts_to_make"] = sorted(missing)
    n5 = sum(1 for v in plan["videos"] if v["duration"] >= 5)
    plan["estimated_credits"] = round(len(plan["keyframes"]) * COST["image"] + (len(plan["videos"]) - n5) * COST["video_per_4s"] + n5 * COST["video_5s"]
                                      + len(plan["voice_changes"]) * COST["voice_change"] + len(plan["audio"]) * COST["audio"], 1)
    save_json(d / "shots.json", plan)
    print(f"{len(plan['keyframes'])} keyframes, {len(plan['videos'])} clips ({len(plan['voice_changes'])} voice changes), {len(plan['audio'])} off-screen lines, "
          f"{len(plan['cutouts'])} cutouts; about {plan['estimated_credits']} Higgsfield credits")
    mark(slug, "shots", "planned", credits=plan["estimated_credits"])
    return plan
