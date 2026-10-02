"""Acqlerate video pipeline. One stage per module; `vp.py` is the CLI.

Stages (each reads/writes video/<slug>/ and records itself in state.json):
  script   lesson -> script.json           (Claude via the Anthropic API)
  voices   script.json -> vo/              (ElevenLabs, plus padded Seedance reference lines)
  shots    script.json -> shots.json       (the Higgsfield plan; run by a Claude session with the Higgsfield MCP -> jobs.json)
  fetch    jobs.json -> media/             (download finished clips + cutouts from Higgsfield's CDN)
  assemble script.json + vo/ + media/ -> draft.mp4
  social   script.json -> social/          (per-platform captions)
  publish  draft.mp4 -> upload / post
"""
