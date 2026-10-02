# Acqlerate video pipeline ("Don't Be Hank")

One lesson in, one 60-70 s vertical animated comedy video out. Each stage is a separate module
with one input file and one output folder, so any stage can be re-run, swapped or done by hand.

```
lesson id ──script──▶ script.json ──(approve)──▶ voices ──▶ vo/        ┐
                                                 shots  ──▶ shots.json ─┤─▶ Higgsfield runner ──▶ jobs.json ──fetch──▶ media/
                                                 social ──▶ social/    ┘                                                  │
                                                                                               assemble ◀─────────────────┘
                                                                                                   │
                                                                                               draft.mp4 ──(approve)──▶ publish ──▶ final/<slug>.mp4 → TikTok / Shorts / Reels / LinkedIn
```

| Stage | Where it runs | Input → output | Needs |
|---|---|---|---|
| `script` | GitHub Actions (Mondays, or on demand) | lesson → `script.json` (status `draft`) + `script.txt` | `ANTHROPIC_API_KEY` |
| **approve 1** | Lucas | reads `script.txt`, edits `script.json` if needed, sets `"status": "approved"` | |
| `voices` | GitHub Actions | `script.json` → `vo/*.mp3` + word timings + `vo/pad/` | `ELEVENLABS_API_KEY` |
| `shots` | runs with voices | `script.json` → `shots.json` (every prompt, reference, voice and the credit estimate) | |
| **Higgsfield runner** | a Claude session with the Higgsfield connector | `shots.json` → images, Seedance clips, voice changes → `jobs.json` | `SHOTS_RUNNER.md` |
| `fetch` | GitHub Actions | `jobs.json` → `media/` | |
| `assemble` | GitHub Actions | `script.json` + `vo/` + `media/` → `draft.mp4` | ffmpeg, Chromium |
| `social` | runs with assemble | `script.json` → `social/{tiktok,instagram,youtube,linkedin}.txt` | |
| **approve 2** | Lucas | watches `draft.mp4` | |
| `publish` | GitHub Actions / by hand | `draft.mp4` → `final/<slug>.mp4` (+ optional Higgsfield upload for TikTok) | |

Code lives on `main` under `scripts/video/`. Everything a video produces lives on the `video-assets`
branch under `video/<slug>/` so the site never redeploys. `state.json` in each folder records which
stages ran.

## Files
```
scripts/video/
  vp.py                 CLI: python3 scripts/video/vp.py <stage> <slug>
  pipeline/             one module per stage (script_gen, voices, shots, fetch, edl, render, audio, align, assemble, social, publish)
  pipeline/stage/       the drawn scenes + caption overlay (stage.html, stage.js) and their npm deps
  characters.json       cast: descriptions, ElevenLabs voices, Higgsfield preset voices, reference image jobs, cutouts
  themes/<theme>.md     beat sheets Claude writes to (heist, infomercial; add more)
  examples/hank-heist/  the reference script.json (the shape every script must have)
  queue.json            which lesson is next, with theme + character
  SHOTS_RUNNER.md       the Higgsfield recipe for the Claude session
  gh_dispatch.py        dispatch / poll workflows from the Mac repo folder
.github/workflows/video-pipeline.yml   the stages above, one per run (input: stage)
.github/workflows/video-upload.yml     PUT files from video-assets to Higgsfield presigned URLs
```

## Running it
```
# a new video from the queue (or pass slug + lesson)
python3 scripts/video/gh_dispatch.py run video-pipeline.yml stage=script
# ... Lucas approves: set "status": "approved" in video/<slug>/script.json on video-assets ...
python3 scripts/video/gh_dispatch.py run video-pipeline.yml stage=voices slug=<slug>
# ... Claude session runs SHOTS_RUNNER.md, commits jobs.json ...
python3 scripts/video/gh_dispatch.py run video-pipeline.yml stage=fetch slug=<slug>
python3 scripts/video/gh_dispatch.py run video-pipeline.yml stage=assemble slug=<slug>
# ... Lucas approves the draft ...
python3 scripts/video/gh_dispatch.py run video-pipeline.yml stage=publish slug=<slug>
```
Locally (any machine with ffmpeg, Python 3.11+, Node): `VIDEO_ROOT=/path/to/video python3 scripts/video/vp.py assemble <slug> --scale 0.5 --fps 12`
renders a quick preview in about 90 s; full quality takes about 10 minutes.

## script.json in one paragraph
A list of `beats`. `broll` = narrator over a retimed Seedance clip. `dialogue` = a 4 s Seedance clip where the
character speaks (the clip's own voice-changed audio is used; words are found by forced alignment, so captions
land on the right frames). `rewind`, `teach`, `card`, `cta` are drawn in Chromium from the data in the beat
(the teach `board` has question → evidence → compare cards → punch → shrink). Overlays (`title`, `namecard`,
`banner`, `freeze`, `pop_text`, `lowerthird`) and `sfx` cues are declared on the beat. `characters.json` supplies
looks and voices; `themes/*.md` supplies the story shape. See `examples/hank-heist/script.json`.

## Posting
TikTok posting through Higgsfield's connector (`tiktok_prepare_publish`) works technically but the new
@acqlerate_official account is under a spam restriction (Oct 2026), so posting is a human step: download
`final/<slug>.mp4`, paste `social/<platform>.txt`. Each post is approved by Lucas; nothing auto-posts.

## Cost per video (Plus plan, 1,200 credits/month)
About 450-500 Higgsfield credits (13 keyframes at 1.5, 15 Seedance clips at 28-35, 9 voice changes at 1), about
1,000 ElevenLabs characters, one Claude call for the script. Roughly two videos a month on Plus.
To cut it: fewer dialogue inserts, reuse keyframes (`shot.keyframe_of`), or B-roll with a cheaper model.
