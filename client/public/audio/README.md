# The Debrief — audio overview files

Drop each module's NotebookLM audio overview in here, named exactly like this:

```
module-1-foundations.mp3
module-2-finance.mp3
module-3-contracts.mp3
module-4-data-analytics.mp3
module-5-capture-bd.mp3
module-6-operations-leadership.mp3
```

That's the only step on this side. The player, the free/paid gating, and the
download link are already wired up in `client/src/lib/curriculum.ts` and
`client/src/pages/ModulePage.tsx` — they just check for the file at that path.

After you add a file, open `client/src/lib/curriculum.ts`, find that module's
entry, and flip its `audioReady` flag from `false` to `true`. That's what
turns the player on for that module. Leaving it `false` keeps the module
showing a quiet "Coming soon" state instead of a broken player, so you can
ship modules as each episode is actually done instead of waiting for all six.

Keep files under ~25MB each if you can (NotebookLM overviews usually export
well under that). If a file ever needs to be bigger, move hosting to an
object store (Cloudflare R2 / S3) instead of committing it to this repo —
large binaries in git slow down every future deploy.
