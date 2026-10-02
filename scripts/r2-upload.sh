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
MANIFEST="${MANIFEST:-$REPO_ROOT/scripts/r2-manifest.txt}"

AUDIO_DIR="$REPO_ROOT/server/assets/audio"
BOOKS_DIR="$REPO_ROOT/server/assets/lesson-books"

# macOS ships `shasum`, Linux ships `sha256sum`. Pick whichever is here.
sha256_of() {
  if command -v sha256sum >/dev/null 2>&1; then
    sha256sum "$1" | cut -d' ' -f1
  else
    shasum -a 256 "$1" | cut -d' ' -f1
  fi
}

# --remote is not optional. Without it wrangler writes to local miniflare
# storage and reports success, leaving the real bucket empty.
put() {
  local path="$1" key="$2" ctype="$3"
  shift 3
  # Byte length, not `du`: du reports disk blocks allocated, which reads low
  # for a cloud-sync placeholder and hides exactly the problem worth seeing.
  echo "  -> $key ($(( $(wc -c < "$path") / 1048576 )) MB)"
  $WRANGLER r2 object put "$BUCKET/$key" \
    --file="$path" \
    --content-type="$ctype" \
    --cache-control="private, max-age=14400" \
    --remote "$@"
}

# Runs before anything touches Cloudflare. These objects become what paying
# members hear and download, so a file that is truncated, a cloud-sync
# placeholder, or a different version than the manifest must stop the run
# rather than be uploaded and discovered later.
echo "==> Checking local files against $(basename "$MANIFEST")"
mismatch=0
while read -r key bytes want; do
  [ "$key" = "KEY" ] && continue
  case "$key" in
    audio/*)        path="$AUDIO_DIR/${key#audio/}" ;;
    lesson-books/*) path="$BOOKS_DIR/${key#lesson-books/}" ;;
    *)              echo "  UNKNOWN KEY $key"; mismatch=1; continue ;;
  esac
  if [ ! -f "$path" ]; then
    echo "  MISSING  $key"
    mismatch=1
    continue
  fi
  if [ "$(sha256_of "$path")" != "$want" ]; then
    echo "  DIFFERS  $key (local $(wc -c < "$path" | tr -d ' ') bytes, manifest $bytes)"
    mismatch=1
  fi
done < "$MANIFEST"
if [ "$mismatch" != "0" ]; then
  echo >&2
  echo "Local files do not match the manifest. Nothing was uploaded." >&2
  echo "Usual causes:" >&2
  echo "  - The repo sits in an iCloud/Dropbox/OneDrive folder and some files" >&2
  echo "    are placeholders that were never fully downloaded." >&2
  echo "  - This branch has a different version of a file than the manifest." >&2
  echo "    If that change is intentional, regenerate the manifest first." >&2
  exit 1
fi
echo "    all 20 files match"

echo "==> Checking authentication"
$WRANGLER whoami

echo "==> Ensuring bucket '$BUCKET' exists"
# Only "already exists" is survivable here. Anything else (R2 not enabled on
# the account, a token without R2 edit) must surface now rather than showing
# up later as a confusing 403 on the first object.
if ! create_out="$($WRANGLER r2 bucket create "$BUCKET" 2>&1)"; then
  if printf '%s' "$create_out" | grep -qi "already exists\|10004"; then
    echo "    bucket already exists — continuing"
  else
    echo "$create_out" >&2
    echo >&2
    echo "Bucket creation failed. Two usual causes:" >&2
    echo "  1. R2 is not enabled on this account yet — enable it once in the" >&2
    echo "     Cloudflare dashboard under R2, then re-run." >&2
    echo "  2. The current credentials lack R2 write access. Check with:" >&2
    echo "       $WRANGLER whoami" >&2
    echo "     and use an API token with 'Workers R2 Storage: Edit'." >&2
    exit 1
  fi
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
    got="$(sha256_of "$tmp/obj")"
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
