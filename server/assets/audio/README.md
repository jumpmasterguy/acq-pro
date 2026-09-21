# The Debrief — audio overview files

One NotebookLM audio overview per module. These are NOT static assets. They sit
outside `client/public/` on purpose, and are streamed through the authenticated
route `GET /api/audio/:moduleId` in `server/routes.ts`. Anything under
`client/public/` is downloadable by anyone who guesses the URL, which is the gap
this layout closes.

## Filenames

The server looks these up by exact name in the `AUDIO_FILES` map in
`server/routes.ts`. The scheme mirrors `LESSON_BOOK_FILES` for the PDFs.

```
module-1-foundations.m4a
module-2-finance.m4a
module-3-contracts.m4a
module-4-data-analytics.m4a
module-5-capture-bd.m4a
module-6-operations-leadership.m4a
module-7-business-of-defense-contracting.m4a
module-8-small-business.m4a
module-9-compliance-stack.m4a
module-10-government-pre-award.m4a
module-11-beyond-award.m4a
module-12-startup-on-ramp.m4a
module-13-veteran-transition.m4a
module-14-why-the-rules-exist.m4a
```

## Adding or replacing an episode

1. Re-encode before committing (see below). Do not commit a NotebookLM export
   as it comes out.
2. Drop it in here under the exact name above.
3. Confirm the module has an entry in `AUDIO_FILES` in `server/routes.ts`.
   Without one the route returns 404 no matter what is on disk.
4. In `client/src/lib/curriculum.ts`, set that module's `audioReady: true`.
   That flag is what turns the player on. Left `false`, the module shows a
   quiet "Coming soon" instead of a broken player, so episodes can ship one
   at a time.

## Always re-encode first

NotebookLM exports at roughly 257 kbps stereo. That is CD settings for two
people talking, and it is about 5x larger than it needs to be. All 14 episodes
as exported came to 1.4 GB, with several single files over GitHub's hard
100 MB per-file limit.

```
ffmpeg -i <export>.m4a -vn -c:a aac -b:a 48k -ac 1 -ar 44100 \
  -movflags +faststart module-N-slug.m4a
```

48 kbps mono is the normal bitrate for spoken-word podcasts and is not audibly
different for this material. It took the same 14 episodes to about 250 MB.
`+faststart` moves the index to the front of the file so streaming and scrubbing
work over the `/api/audio` route without downloading the whole thing.

Always check the encoded duration against the source before committing. A
mismatch means the encode was truncated.

## When to stop committing these to git

About 250 MB of audio is the current cost of a fresh clone and every Railway
deploy. It is workable at 14 modules. It is not a pattern that survives 25.
If the library grows meaningfully past this, move hosting to an object store
(Cloudflare R2 / S3) and have `/api/audio/:moduleId` redirect to a signed URL
instead. The gating logic stays exactly the same; only the last few lines of
the route change.
