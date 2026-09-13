import io, re, subprocess
from pathlib import Path
from datetime import date

BLOG = Path("client/public/blog")
STATIC = Path("server/static.ts")

# keep, remove  (chosen by publication date and depth, not by title)
PAIRS = [
 ("mastering-idiqs-your-2025-2026-playbook-for-winning-defense-task-orders",
  "idiqs-task-orders-win-big-in-defenses-contract-powerhouse"),
 ("what-it-actually-takes-to-become-a-defense-program-manager-in-2026",
  "defense-pm-your-2026-playbook-for-certs-skills-timeline"),
 ("decoding-dods-latest-spends-fy26-contracts-point-to-future-priorities",
  "fy26-dod-contracts-pentagons-big-bets-what-they-mean"),
]

index = BLOG / "index.html"
content = index.read_text(encoding="utf-8")
static = STATIC.read_text(encoding="utf-8")
anchor = "    'acat-levels-explained':"
added = []

for keep, drop in PAIRS:
    f = BLOG / f"{drop}.html"
    if not f.exists():
        print(f"  {drop}: already gone"); continue
    if not (BLOG / f"{keep}.html").exists():
        print(f"  SKIP {drop}: keeper {keep} missing"); continue

    subprocess.run(["git", "rm", "-q", str(f)], check=True)

    start = content.find(f'<a href="/blog/{drop}"')
    if start != -1:
        start = content.rfind("\n", 0, start) + 1
        end = content.index("</a>", start) + len("</a>\n")
        content = content[:start] + content[end:]

    if f"'{drop}'" not in static:
        added.append(f"    '{drop}': '{keep}',\n")
    print(f"  {drop}\n     -> 301 -> {keep}")

if added:
    static = static.replace(anchor, f"    // Duplicate-intent merges, {date.today()}.\n" + "".join(added) + anchor)
    STATIC.write_text(static, encoding="utf-8")

# make sure a featured card still exists
if "post-card-featured" not in content:
    grid = '  <div class="posts-grid">\n'
    i = content.index(grid) + len(grid)
    nxt = content.index('class="post-card"', i)
    content = content[:nxt] + 'class="post-card post-card-featured"' + content[nxt+len('class="post-card"'):]
    meta = content.index('<div class="post-meta-top">', nxt)
    a = content.index("\n", meta) + 1
    b = content.index("\n", a) + 1
    content = content[:a] + '          <span class="post-tag post-tag-hot">\U0001F525 Latest</span>\n' + content[b:]
    print("  re-promoted a featured card")

content = re.sub(r"\n{3,}", "\n\n", content)
index.write_text(content, encoding="utf-8")

# drop the dead slugs from the sitemap so it lists only live URLs
sm = Path("client/public/sitemap.xml")
if sm.exists():
    s = sm.read_text(encoding="utf-8")
    n = 0
    for _, drop in PAIRS:
        s2 = re.sub(r"\s*<url>\s*<loc>[^<]*/blog/" + re.escape(drop) + r"</loc>.*?</url>", "", s, flags=re.S)
        if s2 != s: n += 1; s = s2
    sm.write_text(s, encoding="utf-8")
    print(f"  sitemap: {n} dead entries removed")
