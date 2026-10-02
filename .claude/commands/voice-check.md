---
description: Voice-check blog posts in parallel, one voice-checker subagent per post, then apply approved fixes.
argument-hint: [file paths | "drafts" | "all" | "changed"]
---

Voice-check: $ARGUMENTS

1. Resolve the post list:
   - "drafts" -> `client/public/blog/_drafts/*.html`
   - "changed" -> blog HTML files changed vs origin/main (`git diff --name-only origin/main -- client/public/blog`)
   - "all" -> `client/public/blog/*.html` except index.html
   - otherwise the paths given. Blank means "changed."
2. Launch one `voice-checker` subagent per post, in parallel, in batches of up to 10 per message. Prompt each with only: "Voice-check <path>."
3. Reply to me with a table sorted FAIL first: post, verdict, words, em dashes, soft flags, biggest problem. Then total counts.
4. Apply every exact FIX from FAIL and PASS reports (em dashes, filler, colon rules, stale counts) to the files. Do not apply REWRITE SUGGESTIONS without my OK.
5. After edits, re-run `grep -c $'\u2014'` on each touched file to confirm zero em dashes, then commit with message "Voice pass: <n> posts" and push to main. Confirm the Railway deploy from boot logs, not the status badge.
