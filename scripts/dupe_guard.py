#!/usr/bin/env python3
"""Refuse to publish a post that duplicates one already on the blog.

Why this exists
---------------
The generator picked its topic with `pool[week % len(pool)]` over a fixed
list, with no idea what was already published. Both posts it generated in
its first week were duplicates of existing ones:

  13 Sep  the 4th Section L vs M post. Deleted and 301'd the same day.
  19 Sep  the 4th cost-plus vs fixed-price post.

Near-duplicates are worse than useless for a site competing on organic
search: two posts chasing one query compete with each other and split the
internal-link equity the SEO work was meant to concentrate.

So this runs BEFORE the post is written (on the topic angle) and AGAIN after
(on the real title and headings), and fails the run rather than adding a
competing URL. A red Action run is a much cheaper signal than a duplicate
that someone has to find and redirect later.

Usage:
    from dupe_guard import check, DuplicateTopic
    check(BLOG_DIR, "the drafted title", extra="section headings ...")
"""
import os
import re
import sys
from pathlib import Path

# Cosine over token frequency, same approach as scripts/seo-enrich.mjs uses
# for its "Continue Reading" picks, so both agree on what "related" means.
# Calibrated against this blog on 21 Sep 2026, comparing drafted title+angle
# against each live post's title, headings, description AND body prose (title
# alone is too weak: the Section L/M duplicate scored only 0.18 on titles).
# Score = cosine + 0.12 per distinctive term shared with a live post's TITLE or
# SLUG. That second signal matters because plain cosine dilutes exactly the
# words that prove two posts are about one thing: "NDAA", "CMMC", "ACAT",
# "IDIQ" carry almost all the meaning but only a few tokens of weight.
#
# Measured on this blog, 21 Sep 2026:
#   16 known-duplicate topics:  0.31 - 1.09
#   candidate uncovered topics: 0.10 - 0.37
# The two ranges overlap slightly, and no bag-of-words scorer will fully
# separate them on a 56-post corpus. So the threshold is not asked to be
# perfect: the caller walks its topic pool and takes the first topic that
# passes, which turns a false positive into "a different post today" instead
# of "no post today". Only an exhausted pool fails the run.
# ALLOW_SIMILAR=1 overrides.
THRESHOLD = 0.30
STOP = set("""a an and are as at be by for from has have how in is it its of on or that the this to
was what when where which who why will with you your our we they their not no do does can vs into
than then there these those every each more most much may might should would could just like get
one two three 2025 2026 dod defense acquisition acquisitions program programs contract contracts
guide really actually right now here plain english explained""".split())


class DuplicateTopic(Exception):
    """Raised when a drafted post is too close to something already live."""


def _tokens(text: str):
    text = re.sub(r"<[^>]+>", " ", text)
    words = re.sub(r"[^a-z0-9\s-]", " ", text.lower()).replace("-", " ").split()
    return [w for w in words if len(w) > 3 and w not in STOP]


def _vector(title: str, extra: str = "", weight_title: int = 3):
    v = {}
    for t in _tokens(title):
        v[t] = v.get(t, 0) + weight_title
    for t in _tokens(extra):
        v[t] = v.get(t, 0) + 1
    return v


def _cosine(a: dict, b: dict) -> float:
    if not a or not b:
        return 0.0
    dot = sum(x * b.get(k, 0) for k, x in a.items())
    na = sum(x * x for x in a.values()) ** 0.5
    nb = sum(x * x for x in b.values()) ** 0.5
    return dot / (na * nb) if na and nb else 0.0


def live_posts(blog_dir: Path):
    """(slug, title, vector) for every published post. The vector weights
    title x3, section headings x2 and body prose x1 — body text is what makes
    this reliable, since two posts on one subject share vocabulary even when
    their titles are worded completely differently."""
    out = []
    for f in sorted(Path(blog_dir).glob("*.html")):
        if f.name == "index.html":
            continue
        html = f.read_text(encoding="utf-8", errors="replace")
        m = re.search(r"<title>(.*?)</title>", html, re.S)
        title = re.sub(r"\s*[|\u2014-]\s*Acqlerate\s*$", "", m.group(1).strip()) if m else f.stem
        heads = " ".join(re.findall(r"<h2[^>]*>(.*?)</h2>", html, re.S))
        desc = re.search(r'<meta name="description" content="(.*?)"', html)
        body = re.sub(r"<[^>]+>", " ", html.split('class="post-body"')[-1])[:4000]
        v = {}
        for t in _tokens(title):
            v[t] = v.get(t, 0) + 3
        for t in _tokens(heads + " " + (desc.group(1) if desc else "")):
            v[t] = v.get(t, 0) + 2
        for t in _tokens(body):
            v[t] = v.get(t, 0) + 1
        out.append((f.stem, title, v))
    return out


_CACHE = {}


def _corpus(blog_dir: Path):
    """live_posts plus, per post, its title/slug tokens and how rare each token
    is across all titles. Cached: the guard is called once per candidate topic."""
    key = str(blog_dir)
    if key in _CACHE:
        return _CACHE[key]
    posts = live_posts(blog_dir)
    title_terms, rarity = {}, {}
    for slug, ptitle, _ in posts:
        ts = set(_tokens(ptitle + " " + slug.replace("-", " ")))
        title_terms[slug] = ts
        for t in ts:
            rarity[t] = rarity.get(t, 0) + 1
    _CACHE[key] = (posts, title_terms, rarity)
    return _CACHE[key]


def nearest(blog_dir: Path, title: str, extra: str = ""):
    """The closest live post to this draft: (score, slug, title)."""
    posts, title_terms, rarity = _corpus(blog_dir)
    v = _vector(title, extra)
    draft_terms = set(_tokens(title + " " + extra))
    # a term naming this subject in only one or two existing titles is a
    # strong signal; one appearing in ten is just house vocabulary
    distinctive = {t for t in draft_terms if 1 <= rarity.get(t, 0) <= 2}
    best = (0.0, None, None)
    for slug, ptitle, pv in posts:
        score = _cosine(v, pv) + 0.12 * len(distinctive & title_terms[slug])
        if score > best[0]:
            best = (score, slug, ptitle)
    return best


def check(blog_dir: Path, title: str, extra: str = "", threshold: float = THRESHOLD,
          stage: str = "") -> float:
    """Raise DuplicateTopic if this draft is too close to a live post."""
    score, slug, ptitle = nearest(blog_dir, title, extra)
    where = f" [{stage}]" if stage else ""
    if slug is None:
        print(f"Duplicate check{where}: no live posts to compare against")
        return 0.0
    print(f"Duplicate check{where}: nearest live post scores {score:.2f} "
          f"(threshold {threshold:.2f}) -> {slug}")
    if score >= threshold and os.environ.get("ALLOW_SIMILAR") not in ("1", "true", "yes"):
        raise DuplicateTopic(
            f"'{title}' is too close to an existing post (similarity {score:.2f}).\n"
            f"  Existing: {ptitle}\n"
            f"            /blog/{slug}\n"
            f"Nothing was published. Either pick an uncovered angle, or update the "
            f"existing post in place (better for SEO than a second competing URL)."
        )
    return score


if __name__ == "__main__":
    # dupe_guard.py "title to test" -> prints the nearest live post and exits 1 if too close
    blog = Path(__file__).parent.parent / "client" / "public" / "blog"
    if len(sys.argv) < 2:
        print(__doc__)
        raise SystemExit(0)
    try:
        check(blog, sys.argv[1], " ".join(sys.argv[2:]))
    except DuplicateTopic as e:
        print(f"\nDUPLICATE\n{e}")
        raise SystemExit(1)
    print("OK, not a duplicate")
