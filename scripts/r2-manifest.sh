#!/usr/bin/env bash
#
# Rebuild scripts/r2-manifest.txt — the list of media objects that
# r2-upload.sh checks and uploads, with each file's size and SHA-256.
#
# Built from COMMITTED content (git), not from whatever is on disk. That is
# deliberate: the manifest is the reference the upload is checked against,
# so it must come from the version of record. A half-synced or locally
# edited file on disk then shows up as a mismatch instead of being blessed.
#
# Run it after media changes land, and commit the result alongside them.
#
# Usage:
#   bash scripts/r2-manifest.sh            # from HEAD
#   bash scripts/r2-manifest.sh origin/main

set -euo pipefail

REF="${1:-HEAD}"
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT="$REPO_ROOT/scripts/r2-manifest.txt"
cd "$REPO_ROOT"

sha256_stdin() {
  if command -v sha256sum >/dev/null 2>&1; then
    sha256sum | cut -d' ' -f1
  else
    shasum -a 256 | cut -d' ' -f1
  fi
}

tmp="$(mktemp)"
trap 'rm -f "$tmp"' EXIT

printf '%-58s %12s  %s\n' "KEY" "BYTES" "SHA256" > "$tmp"
git ls-tree -r --name-only "$REF" server/assets/audio server/assets/lesson-books \
  | grep -E '\.(m4a|pdf)$' \
  | LC_ALL=C sort \
  | while read -r p; do
      key="${p#server/assets/}"
      bytes="$(git cat-file -s "$REF:$p")"
      sha="$(git cat-file -p "$REF:$p" | sha256_stdin)"
      printf '%-58s %12s  %s\n' "$key" "$bytes" "$sha"
    done >> "$tmp"

mv "$tmp" "$OUT"
trap - EXIT
echo "Wrote $(( $(wc -l < "$OUT") - 1 )) entries to scripts/r2-manifest.txt from $REF"
