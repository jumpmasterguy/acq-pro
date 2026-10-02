# Higgsfield shots runner

The one stage that cannot run in GitHub Actions. Higgsfield's subscription credits are only
reachable through the Higgsfield connector (MCP) in a Claude session, so a Claude session
executes `video/<slug>/shots.json` and records the results in `video/<slug>/jobs.json`.
Follow this exactly; the gotchas at the bottom each cost real credits to learn.

Inputs (on the `video-assets` branch): `video/<slug>/shots.json`, `video/<slug>/vo/pad/*.mp3`.
Output: `video/<slug>/jobs.json`, committed to `video-assets`. Then dispatch `video-pipeline.yml` with `stage=fetch`, then `stage=assemble`.

## 0. Before spending anything
1. `balance` — compare with `shots.json.estimated_credits`. Stop and ask Lucas if the balance is lower.
2. `list_projects` (search "Don't Be Hank") and use that project for every job (`project_id`).
3. Read `video/<slug>/shots.json`. Every ID below refers to it.

## 1. Reference audio for the dialogue clips
Seedance needs each spoken line as an audio reference, uploaded to Higgsfield (a raw.githubusercontent
URL is rejected as octet-stream). For every `videos[].audio_reference`:
1. `media_upload` with `filename: <id>.mp3`, `type: audio` → `media_id` + presigned `upload_url`.
2. Collect all pairs and dispatch one upload run from the Mac shell:
   `python3 scripts/video/gh_dispatch.py run video-upload.yml 'pairs=video/<slug>/vo/pad/02.mp3=<url> video/<slug>/vo/pad/04.mp3=<url> ...'`
3. When the run is green, `media_confirm` each `media_id` (type audio). Keep the confirmed ids.

## 2. Keyframes (images)
For each `keyframes[]`: `generate_image` with model `nano_banana_flash`, `aspect_ratio: 9:16`, the prompt verbatim,
and `medias: [{role: image, value: <reference_image_job>}]` for each id in `reference_image_jobs` (these are existing
Higgsfield image jobs: the character sheets). `generate_image_batch` is fine here (no audio refs). `jobs_wait`, then
`show_generation_by_ids` and LOOK at every frame: the character must match the sheet, no text anywhere. Regenerate the
bad ones (1.5 credits each) before touching video. Record `beats.<id>.keyframe = {job, url}` (the raw image URL).

## 3. Clips (Seedance 2.5)
For each `videos[]`, one `generate_video` call at a time (batching with audio refs returns 422, and more than
about 6 running jobs returns 429 rate_limit_reached; if you get 429, wait for a running job to finish):
- model `seedance_2_5`, `mode`/preset omni_reference, `aspect_ratio: 9:16`, `duration` from the plan (4, or 5 when set),
  `resolution: 720p`, prompt verbatim.
- medias: `{role: image, value: <keyframe job id for videos[].keyframe>}`; for dialogue also
  `{role: audio, value: <confirmed media_id of audio_reference>}` and `generate_audio: true`.
- Jobs take 10 to 15 minutes. Submit up to 6, `jobs_wait`, record `beats.<id>.video = {job, url}`, then submit the next 6.
- Watch each result once. A clip where the mouth never moves on a dialogue beat, or the character changes, gets one retry.

## 4. Voice change (dialogue clips only)
For each `voice_changes[]`: `voice_change` with the finished clip job as the input video and `voice_id` / `voice_type`
from the plan (Hank = Benji preset, Accountant = Vera preset). 1 credit, about a minute. Record
`beats.<id>.voiced = {job, url}`. Never run voice_change on a clip without dialogue (it does nothing and costs a credit).

## 5. Off-screen lines
For each `audio[]`: `generate_audio` (seed_audio) with the text and the same preset voice. Record `beats.<id>.voice = {job, url}`.

## 6. Cutouts
For each `cutouts` entry, record `{url}` from `job_display` of that job (they already exist for Hank: wave, plead, crew).
If `cutouts_to_make` is present, make them with `remove_background` on the relevant keyframe and record the job + url.

## 7. Write jobs.json and hand over
```
{"beats": {"01": {"keyframe": {"job": "...", "url": "..."}, "video": {"job": "...", "url": "..."}},
           "02": {"keyframe": {...}, "video": {...}, "voiced": {"job": "...", "url": "..."}},
           "13": {"keyframe": {...}, "video": {...}, "voice": {"job": "...", "url": "..."}}},
 "cutouts": {"hank_wave": {"url": "..."}, "hank_plead": {"url": "..."}, "crew": {"url": "..."}},
 "credits_spent": 456, "notes": "..."}
```
Write it to `video/<slug>/jobs.json` on the `video-assets` branch from the Mac repo folder (main folder, not a worktree),
commit, push. Then:
```
python3 scripts/video/gh_dispatch.py run video-pipeline.yml stage=fetch slug=<slug>
python3 scripts/video/gh_dispatch.py run video-pipeline.yml stage=assemble slug=<slug>
```
The assemble run attaches `draft.mp4` as a workflow artifact and commits it to `video/<slug>/draft.mp4`.
Send Lucas the draft (under 30 MB) with the captions from `video/<slug>/social/`. He approves or asks for changes.

## Gotchas (each one was learned the expensive way)
- Audio references shorter than ~2 s are rejected (422). The voices stage pads them to 2.6 s in `vo/pad/`.
- Seedance re-times the reference audio; do not try to line the ElevenLabs file up by hand. The edit uses the clip's own
  (voice-changed) audio, and `pipeline/align.py` finds the words with forced alignment.
- Keyframes: `nano_banana_flash` with the character sheet as reference keeps Hank consistent. Always "no text, no logos".
- Prompts for dialogue must include `lip-synced to the reference audio: "<line>"` or the mouth doesn't move.
- One API key for the Cloud API exists (`HF_API_KEY_ID/SECRET` secrets) but it bills separately and has no voice change;
  the subscription plan is only reachable through the connector. That is why this stage is run by a Claude session.
