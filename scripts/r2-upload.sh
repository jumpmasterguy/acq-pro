#!/usr/bin/env bash
#
# Path A, step 1 — upload the Debrief audio and Lesson Book PDFs to R2.
#
# These files are served today by /api/audio/:moduleId and
# /api/lesson-book/:moduleId straight off local disk (server/routes.ts).
# The object keys deliberately mirror the paths under server/assets/, so they
# match the filenames in that route's AUDIO_FILES and LESSON_BOOK_FILES maps
# and the handlers only have to swap res.sendFile for a signed-URL redirect.
#
# What gets uploaded is exactly the list in scripts/r2-manifest.txt — the
# same list the pre-flight check verifies — so nothing unverified can slip
# in and nothing is missed. Regenerate the manifest with
# scripts/r2-manifest.sh whenever the media changes.
#
# Safe to re-run: `r2 object put` overwrites, so a failed run is fixed by
# running it again. Nothing here touches the app or the running deployment.
#
# Usage:
#   bash scripts/r2-upload.sh              # create bucket if needed, upload all
#   VERIFY=1 bash scripts/r2-upload.sh     # also re-download and checksum (slow)
#   BUCKET=my-bucket bash scripts/r2-upload.sh
#
# Requires: R2 enabled on the account (once, in the dashboard), and
# `npx wrangler login` (or CLOUDFLARE_API_TOKEN) already done.

set -euo pipefail

BUCKET="${BUCKET:-acqlerate-media}"
WRANGLER="${WRANGLER:-npx --yes wrangler@4}"
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MANIFEST="${MANIFEST:-$REPO_ROOT/scripts/r2-manifest.txt}"
ASSETS_DIR="$REPO_ROOT/server/assets"

# macOS ships `shasum`, Linux ships `sha256sum`. Pick whichever is here.
sha256_of() {
  if command -v sha256sum >/dev/null 2>&1; then
    sha256sum "$1" | cut -d' ' -f1
  else
    shasum -a 256 "$1" | cut -d' ' -f1
  fi
}

mb() { echo "$(( $1 / 1048576 ))"; }

# ── Read the manifest once ─────────────────────────────────────────────────
keys=(); sizes=(); shas=()
total_bytes=0
while read -r key bytes want; do
  [ -z "$key" ] || [ "$key" = "KEY" ] && continue
  case "$key" in
    audio/*.m4a|lesson-books/*.pdf) ;;
    *) echo "Manifest has an unexpected key: $key" >&2; exit 1 ;;
  esac
  keys+=("$key"); sizes+=("$bytes"); shas+=("$want")
  total_bytes=$(( total_bytes + bytes ))
done < "$MANIFEST"
count=${#keys[@]}
[ "$count" -gt 0 ] || { echo "Manifest is empty: $MANIFEST" >&2; exit 1; }

# ── Pre-flight: local files must match the manifest ────────────────────────
# Runs before anything touches Cloudflare. These objects become what paying
# members hear and download, so a file that is truncated, a cloud-sync
# placeholder, or a different version than the manifest must stop the run
# rather than be uploaded and discovered later.
echo "==> Checking $count local files against $(basename "$MANIFEST")"
mismatch=0
i=0
while [ "$i" -lt "$count" ]; do
  key="${keys[$i]}"; path="$ASSETS_DIR/$key"
  if [ ! -f "$path" ]; then
    echo "  MISSING  $key"
    mismatch=1
  elif [ "$(sha256_of "$path")" != "${shas[$i]}" ]; then
    echo "  DIFFERS  $key (local $(wc -c < "$path" | tr -d ' ') bytes, manifest ${sizes[$i]})"
    mismatch=1
  fi
  i=$(( i + 1 ))
done
if [ "$mismatch" != "0" ]; then
  echo >&2
  echo "Local files do not match the manifest. Nothing was uploaded." >&2
  echo "Usual causes:" >&2
  echo "  - Your branch is behind or ahead of the one the manifest was built" >&2
  echo "    from. Rebuild it from your committed files:" >&2
  echo "      bash scripts/r2-manifest.sh" >&2
  echo "  - The repo sits in an iCloud/Dropbox/OneDrive folder and some files" >&2
  echo "    are placeholders that were never fully downloaded." >&2
  exit 1
fi
echo "    all $count match ($(mb "$total_bytes") MB)"

# ── Cloudflare ─────────────────────────────────────────────────────────────
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

# Content-Type and Content-Disposition mirror what the Express routes send
# today, so browser behaviour does not change: audio plays inline, PDFs open
# in the tab. --remote is not optional: without it wrangler writes to local
# miniflare storage and reports success, leaving the real bucket empty.
echo "==> Uploading $count objects ($(mb "$total_bytes") MB)"
i=0
while [ "$i" -lt "$count" ]; do
  key="${keys[$i]}"; path="$ASSETS_DIR/$key"
  echo "  -> $key ($(mb "${sizes[$i]}") MB)"
  case "$key" in
    *.m4a) $WRANGLER r2 object put "$BUCKET/$key" --file="$path" --remote \
             --content-type="audio/mp4" --content-disposition="inline" \
             --cache-control="private, max-age=14400" ;;
    *.pdf) $WRANGLER r2 object put "$BUCKET/$key" --file="$path" --remote \
             --content-type="application/pdf" \
             --cache-control="private, max-age=14400" ;;
  esac
  i=$(( i + 1 ))
done

if [ "${VERIFY:-0}" = "1" ]; then
  echo "==> Verifying all $count objects in R2 (re-downloads $(mb "$total_bytes") MB)"
  tmp="$(mktemp -d)"
  trap 'rm -rf "$tmp"' EXIT
  fail=0
  i=0
  while [ "$i" -lt "$count" ]; do
    key="${keys[$i]}"
    $WRANGLER r2 object get "$BUCKET/$key" --file="$tmp/obj" --remote >/dev/null
    if [ "$(sha256_of "$tmp/obj")" = "${shas[$i]}" ]; then
      echo "  ok   $key"
    else
      echo "  FAIL $key"
      fail=1
    fi
    i=$(( i + 1 ))
  done
  [ "$fail" = "0" ] || { echo "Checksum mismatch — re-run the upload." >&2; exit 1; }
  echo "==> All checksums match"
fi

echo
echo "Done. $count objects in '$BUCKET'."
echo "Next: step 2 — mint a read-only R2 API token and set the Railway vars."
