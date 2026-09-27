#!/usr/bin/env python3
"""Publish staged blog drafts once their publication date arrives.

Drafts live in client/public/blog/_drafts/. Each carries its own datePublished in
JSON-LD. On or after that date this moves the file into the live blog directory,
adds its card to the index as the featured post, and leaves the commit to the
caller. Deterministic: no model, no API key, no network.
"""
import re, sys, json, shutil
from pathlib import Path
from datetime import date

BLOG   = Path(__file__).parent.parent / "client" / "public" / "blog"
DRAFTS = BLOG / "_drafts"

def field(html, pattern, default=""):
    m = re.search(pattern, html, re.S)
    return m.group(1).strip() if m else default

def publish(draft: Path) -> bool:
    html = draft.read_text(encoding="utf-8")
    when = field(html, r'"datePublished"\s*:\s*"([0-9]{4}-[0-9]{2}-[0-9]{2})"')
    if not when:
        print(f"  {draft.name}: no datePublished, skipped")
        return False
    if date.fromisoformat(when) > date.today():
        print(f"  {draft.name}: scheduled for {when}, not yet")
        return False

    slug    = draft.stem
    title   = field(html, r"<title>(.*?)(?:\s*\|\s*Acqlerate)?</title>")
    excerpt = field(html, r'<meta name="description" content="(.*?)"')
    read    = field(html, r"<span>(\d+) min read</span>", "7")
    shown   = date.fromisoformat(when).strftime("%b %-d, %Y")

    card = f"""
    <a href="/blog/{slug}" class="post-card post-card-featured" style="text-decoration:none;color:inherit">
      <div class="post-card-inner">
        <div class="post-meta-top">
          <span class="post-tag post-tag-hot">\U0001F525 Latest</span>
          <span class="post-date">{shown}</span>
        </div>
        <h2>{title}</h2>
        <p>{excerpt[:160]}</p>
        <div class="post-footer">
          <span>{read} min read</span>
          <span class="read-more">Read →</span>
        </div>
      </div>
    </a>
"""
    index = BLOG / "index.html"
    content = index.read_text(encoding="utf-8")
    if f'href="/blog/{slug}"' in content:
        print(f"  {draft.name}: already in index, skipped")
        return False
    content = re.sub(r" post-card-featured", "", content)
    content = re.sub(r'<span class="post-tag post-tag-hot">[^<]*</span>', "", content)
    marker = '  <div class="posts-grid">\n'
    if marker not in content:
        print("  ERROR: posts-grid not found in index.html")
        return False
    index.write_text(content.replace(marker, marker + card, 1), encoding="utf-8")

    shutil.move(str(draft), str(BLOG / draft.name))
    print(f"  PUBLISHED {slug} (scheduled {when})")
    return True

def main() -> int:
    if not DRAFTS.is_dir():
        print("No _drafts directory, nothing to do."); return 0
    drafts = sorted(DRAFTS.glob("*.html"))
    if not drafts:
        print("No staged drafts."); return 0
    print(f"{len(drafts)} staged draft(s):")
    n = sum(publish(d) for d in drafts)
    print(f"{n} published.")
    return 0

if __name__ == "__main__":
    sys.exit(main())
