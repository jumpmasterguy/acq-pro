import io, re, subprocess, sys

SLUG   = "why-most-defense-proposals-lose-before-anyone-writes-a-word"
TARGET = "losing-before-you-write-the-l-m-discipline-for-2026-defense-wins"

# 1. remove the post file
post = f"client/public/blog/{SLUG}.html"
r = subprocess.run(["git", "rm", "-q", post], capture_output=True, text=True)
print("removed file  :", post if r.returncode == 0 else f"FAILED {r.stderr.strip()}")

# 2. drop its card from the index and promote the next card to featured
p = "client/public/blog/index.html"
s = io.open(p, encoding="utf-8").read()
start = s.find(f'<a href="/blog/{SLUG}"')
if start == -1:
    print("index card    : not found, nothing to do")
else:
    start = s.rfind("\n", 0, start) + 1
    end = s.index("</a>", start) + len("</a>\n")
    s = s[:start] + s[end:]
    s = re.sub(r"\n\s*\n\s*\n", "\n\n", s, count=1)
    print("index card    : removed")

    grid = '  <div class="posts-grid">\n'
    i = s.index(grid) + len(grid)
    nxt = s.index('class="post-card"', i)
    s = s[:nxt] + 'class="post-card post-card-featured"' + s[nxt + len('class="post-card"'):]
    meta = s.index('<div class="post-meta-top">', nxt)
    blank_start = s.index("\n", meta) + 1
    blank_end = s.index("\n", blank_start) + 1
    s = s[:blank_start] + '          <span class="post-tag post-tag-hot">\U0001F525 Latest</span>\n' + s[blank_end:]
    print("promoted      :", re.search(r'href="(/blog/[^"]+)"', s[nxt-200:nxt]).group(1))
io.open(p, "w", encoding="utf-8").write(s)

# 3. 301 the dead slug at the surviving post
p2 = "server/static.ts"
t = io.open(p2, encoding="utf-8").read()
if SLUG in t:
    print("redirect      : already present")
else:
    anchor = "    'acat-levels-explained':"
    add = (f"    // Fourth post on the same Section L vs M thesis, removed {__import__('datetime').date.today()}.\n"
           f"    '{SLUG}': '{TARGET}',\n")
    assert t.count(anchor) == 1
    t = t.replace(anchor, add + anchor)
    io.open(p2, "w", encoding="utf-8").write(t)
    print("redirect      : added ->", TARGET)
