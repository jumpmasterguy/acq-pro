#!/usr/bin/env bash
#
# Path A, step 1 — upload the Debrief audio and Lesson Book PDFs to R2.
#
# These files are served today by /api/audio/:moduleId and
# /api/lesson-book/:moduleId straight off local disk (server/routes.ts).
# The object keys below deliberately match the filenames in that route's
# AUDIO_FILES and LESSON_BOOK_FILES maps, so the handlers only have to swap
# res.sendFile for a signed-URL redirect — no renaming, no lookup changes.
#
# Safe to re-run: `r2 object put` overwrites, so a failed run is fixed by
# running it again. Nothing here touches the app or the running deployment.
#
# Usage:
#   ./scripts/r2-upload.sh              # create bucket if needed, upload all
#   VERIFY=1 ./scripts/r2-upload.sh     # also re-download and checksum (slow)
#   BUCKET=my-bucket ./scripts/r2-upload.sh
#
# Requires: wrangler, and `wrangler login` (or CLOUDFLARE_API_TOKEN) already done.

set -euo pipefail

BUCKET="${BUCKET:-acqlerate-media}"
WRANGLER="${WRANGLER:-npx --yes wrangler@4}"
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MANIFEST="$REPO_ROOT/scripts/r2-manifest.txt"

AUDIO_DIR="$REPO_ROOT/server/assets/audio"
BOOKS_DIR="$REPO_ROOT/server/assets/lesson-books"

# --remote is not optional. Without it wrangler writes to local miniflare
# storage and reports success, leaving the real bucket empty.
put() {
  local path="$1" key="$2" ctype="$3"
  shift 3
  echo "  -> $key ($(du -h "$path" | cut -f1))"
  $WRANGLER r2 object put "$BUCKET/$key" \
    --file="$path" \
    --content-type="$ctype" \
    --cache-control="private, max-age=14400" \
    --remote "$@"
}

echo "==> Checking authentication"
$WRANGLER whoami

echo "==> Ensuring bucket '$BUCKET' exists"
if ! $WRANGLER r2 bucket create "$BUCKET" 2>/dev/null; then
  echo "    bucket already exists (or creation refused) — continuing"
fi

# Content-Disposition mirrors what the Express routes set today, so browser
# behaviour does not change: audio plays inline, PDFs open in the tab.
echo "==> Uploading audio (6 files, ~280 MB)"
for f in "$AUDIO_DIR"/*.m4a; do
  put "$f" "audio/$(basename "$f")" "audio/mp4" --content-disposition="inline"
done

echo "==> Uploading lesson books (14 files, ~8.7 MB)"
for f in "$BOOKS_DIR"/*.pdf; do
  put "$f" "lesson-books/$(basename "$f")" "application/pdf"
done

if [ "${VERIFY:-0}" = "1" ]; then
  echo "==> Verifying checksums against $MANIFEST (re-downloads ~289 MB)"
  tmp="$(mktemp -d)"
  trap 'rm -rf "$tmp"' EXIT
  fail=0
  while read -r key bytes want; do
    [ "$key" = "KEY" ] && continue
    $WRANGLER r2 object get "$BUCKET/$key" --file="$tmp/obj" --remote >/dev/null
    got="$(sha256sum "$tmp/obj" | cut -d' ' -f1)"
    if [ "$got" = "$want" ]; then
      echo "  ok   $key"
    else
      echo "  FAIL $key (expected $want, got $got)"
      fail=1
    fi
  done < "$MANIFEST"
  [ "$fail" = "0" ] || { echo "Checksum mismatch — re-run the upload."; exit 1; }
  echo "==> All checksums match"
fi

echo
echo "Done. 20 objects in '$BUCKET'."
echo "Next: step 2 — mint a read-only R2 API token and set the Railway vars."
