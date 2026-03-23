#!/usr/bin/env python3
"""
Acqlerate Blog Post Generator
Runs on Tuesdays and Saturdays via cron.
Researches current DoD acquisition news, writes a full HTML post,
updates the blog index, commits, and pushes to GitHub (Railway auto-deploys).
"""

import os
import re
import sys
import json
import random
import subprocess
from datetime import datetime, timezone
from pathlib import Path
import urllib.request
import urllib.parse

# ── Configuration ─────────────────────────────────────────────────────────────
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "AIzaSyCb5cYnJh16swSRh7C1q7nEipBfgKAaW18")
BLOG_DIR = Path(__file__).parent.parent / "client" / "public" / "blog"
REPO_ROOT = Path(__file__).parent.parent

# ── Topic rotation — alternates Tuesday (news-driven) / Saturday (educational) ─
TOPIC_POOL_NEWS = [
    {
        "search": "DoD defense acquisition contract awards 2026",
        "angle": "Recent large DoD contract awards and what they reveal about how the government buys defense capabilities",
        "badge": "News & Analysis",
        "audience": "USG & Contractor",
    },
    {
        "search": "NDAA 2026 defense acquisition reform provisions",
        "angle": "What the FY2026 NDAA changes for defense acquisition professionals and contractors",
        "badge": "Policy Update",
        "audience": "USG & Contractor",
    },
    {
        "search": "Pentagon OTA Other Transaction Authority 2026",
        "angle": "How DoD is using Other Transaction Authority in 2026 — what it means for non-traditional contractors",
        "badge": "Contracting",
        "audience": "Contractor",
    },
    {
        "search": "defense budget continuing resolution 2026 impact acquisitions",
        "angle": "How continuing resolutions disrupt defense acquisition programs and what PMs need to do",
        "badge": "Finance",
        "audience": "USG Personnel",
    },
    {
        "search": "DoD CMMC cybersecurity maturity model certification 2026 contractors",
        "angle": "CMMC in 2026: what defense contractors need to know right now to stay eligible for contracts",
        "badge": "Compliance",
        "audience": "Contractor",
    },
    {
        "search": "GAO bid protest defense contracts 2026",
        "angle": "The most common reasons the government loses bid protests — and what acquisition professionals can do about it",
        "badge": "Source Selection",
        "audience": "USG & Contractor",
    },
    {
        "search": "DoD small business defense contracts set-aside 2026",
        "angle": "Small business set-asides in defense: the opportunities, the eligibility traps, and how to compete",
        "badge": "Career",
        "audience": "Contractor",
    },
    {
        "search": "defense acquisition workforce shortage GS-1102 contracting officer 2026",
        "angle": "The defense acquisition workforce crisis: what it means for programs, contractors, and career opportunity",
        "badge": "Career",
        "audience": "Career Changer",
    },
]

TOPIC_POOL_EDUCATIONAL = [
    {
        "search": "earned value management EVM basics defense programs",
        "angle": "Earned Value Management (EVM) explained — the one number every defense PM watches obsessively and why",
        "badge": "Program Management",
        "audience": "USG Personnel",
    },
    {
        "search": "PPBE defense budget process planning programming budgeting",
        "angle": "The Pentagon's budget process in plain English — why your program needs money years before it's spent",
        "badge": "Finance",
        "audience": "USG & Contractor",
    },
    {
        "search": "IDIQ task order competition defense contracting",
        "angle": "IDIQs and task orders: why most of the defense market runs through these vehicles and how to win on them",
        "badge": "Contracting",
        "audience": "Contractor",
    },
    {
        "search": "defense acquisition program manager career path DAWIA",
        "angle": "What it actually takes to become a defense program manager — the certifications, the experience, and the path",
        "badge": "Career",
        "audience": "Career Changer",
    },
    {
        "search": "ACAT acquisition category DoD program milestone review",
        "angle": "ACAT levels: why the category your program sits in determines almost everything about how it's managed",
        "badge": "Foundations",
        "audience": "USG Personnel",
    },
    {
        "search": "defense contractor proposal writing Section L Section M RFP",
        "angle": "Why most defense proposals lose before they're written — the Section L vs. Section M mistake everyone makes",
        "badge": "Capture Management",
        "audience": "Contractor",
    },
    {
        "search": "cost plus fixed price contract types defense DoD",
        "angle": "Cost-plus vs. fixed-price: which contract type is better for who, and why the government cares so much",
        "badge": "Contracting",
        "audience": "USG & Contractor",
    },
    {
        "search": "DoD JCIDS requirements process capability gap",
        "angle": "JCIDS explained: how the military decides what it needs and why requirements drive everything downstream",
        "badge": "Foundations",
        "audience": "USG Personnel",
    },
]


def gemini_generate(prompt: str) -> str:
    """Call Gemini 2.5 Flash API to generate content."""
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={GEMINI_API_KEY}"
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "temperature": 0.7,
            "maxOutputTokens": 8192,
        },
    }
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=120) as resp:
            result = json.loads(resp.read())
            return result["candidates"][0]["content"]["parts"][0]["text"]
    except Exception as e:
        print(f"Gemini API error: {e}")
        sys.exit(1)


def search_news(query: str) -> str:
    """Use Gemini to research current news on a topic."""
    prompt = f"""You are a defense acquisition journalist and researcher. 
Research the following topic and provide a detailed summary of current (2025-2026) developments, facts, and context:

Topic: {query}

Provide:
1. 3-5 specific recent developments, events, or data points with approximate dates
2. Key numbers, dollar amounts, or statistics
3. Why this matters practically for DoD program managers and/or defense contractors
4. Any recent policy changes or announcements

Be specific and factual. If you don't have current data, use the most recent information available and note it's from your training data."""
    return gemini_generate(prompt)


def generate_blog_post(topic: dict, research: str, pub_date: str, slug: str) -> str:
    """Generate a complete blog post HTML using Gemini."""
    
    prompt = f"""You are a senior writer for Acqlerate, a defense acquisitions education platform (acqlerate.com).
Your job is to write a blog post that is:
- Down-to-earth and jargon-aware (explain terms when you use them)
- Focused on "why this matters" for real practitioners
- Educational but not textbook-dry — conversational, direct, like a knowledgeable colleague
- Ends with a natural CTA pointing readers to Acqlerate's courses

TOPIC ANGLE: {topic['angle']}
TARGET AUDIENCE: {topic['audience']}
BADGE/CATEGORY: {topic['badge']}
PUBLICATION DATE: {pub_date}

RESEARCH MATERIAL (use this as your factual foundation):
{research}

Write a complete blog post with:
- A compelling title (not clickbait, genuinely useful)
- A 1-2 sentence deck/subtitle 
- 4-6 substantive sections with H2 headers
- At least one practical "what this means for you" section
- A callout box with a key insight (use <div class="callout"><p>...</p></div>)
- A comparison table if appropriate (use class="comparison-table")
- A closing section that naturally transitions to: "If you want to go deeper on [topic], Acqlerate's [relevant module name] module covers this in full — at novice, intermediate, and advanced levels. Start free at acqlerate.com."
- Relevant module names from Acqlerate: DoD Acquisitions Foundations, Defense Finance & Budgeting, Defense Contracting Fundamentals, Data Analytics for Program Managers, Capture Management & Business Development, Program Operations & Leadership

Estimated reading time: 8-12 minutes

FORMAT RULES:
- Use <p> tags for paragraphs
- Use <ul><li> for bullets
- Use <strong> for emphasis on terms/numbers
- Use <h2> for section headers
- DO NOT include the HTML shell (head, body tags) — just the article content starting from the first <h2> or <p>
- DO NOT include the title as an H1 — that will be added separately
- DO NOT include a byline — that will be added separately

Write the full article body now (just the inner content, no HTML wrapper):"""

    return gemini_generate(prompt)


def extract_title_from_content(content: str, fallback: str) -> str:
    """Try to extract a title suggestion from the AI content."""
    # Look for a line that looks like a title at the very start
    lines = content.strip().split('\n')
    for line in lines[:5]:
        line = line.strip()
        if line and not line.startswith('<') and len(line) < 120 and len(line) > 20:
            return line
    return fallback


def slugify(title: str) -> str:
    """Convert title to URL slug."""
    slug = title.lower()
    slug = re.sub(r'[^\w\s-]', '', slug)
    slug = re.sub(r'[\s_-]+', '-', slug)
    slug = re.sub(r'^-+|-+$', '', slug)
    return slug[:80]


def get_read_time(html_content: str) -> int:
    """Estimate read time from HTML content."""
    text = re.sub(r'<[^>]+>', ' ', html_content)
    words = len(text.split())
    return max(5, round(words / 200))


def build_post_html(title: str, deck: str, article_body: str, topic: dict, 
                    pub_date: str, slug: str, read_time: int) -> str:
    """Build the complete blog post HTML file."""
    
    formatted_date = datetime.strptime(pub_date, "%Y-%m-%d").strftime("%B %Y")
    
    # Build table of contents from H2 headers
    h2s = re.findall(r'<h2>(.*?)</h2>', article_body)
    toc_items = '\n'.join(
        f'        <li style="font-size:0.8rem;margin-bottom:5px"><a href="#" style="color:var(--teal)">{h}</a></li>'
        for h in h2s[:6]
    )
    
    # Clean up any title that leaked into the body
    article_body = re.sub(r'^<h1>.*?</h1>\s*', '', article_body, flags=re.DOTALL)
    
    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>{title} — Acqlerate</title>
  <meta name="description" content="{deck}" />
  <meta property="og:title" content="{title}" />
  <meta property="og:description" content="{deck}" />
  <meta property="og:url" content="https://acqlerate.com/blog/{slug}" />
  <link rel="canonical" href="https://acqlerate.com/blog/{slug}" />
  <link rel="icon" href="/acqlerate-icon.svg" type="image/svg+xml" />
  <link rel="stylesheet" href="/blog/blog.css" />
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-SW42SFY999"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){{dataLayer.push(arguments);}}
    gtag('js', new Date());
    gtag('config', 'G-SW42SFY999');
  </script>
  <script type="application/ld+json">
  {{
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": "{title}",
    "description": "{deck}",
    "author": {{ "@type": "Organization", "name": "Acqlerate" }},
    "publisher": {{ "@type": "Organization", "name": "Acqlerate", "url": "https://acqlerate.com" }},
    "datePublished": "{pub_date}",
    "url": "https://acqlerate.com/blog/{slug}"
  }}
  </script>
</head>
<body>

<nav>
  <div class="nav-inner">
    <a href="/" class="nav-logo">
      <div class="nav-logo-icon">
        <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <polygon points="50,22 71.2,36 71.2,64 50,78 28.8,64 28.8,36" fill="none" stroke="white" stroke-width="7" stroke-linejoin="round"/>
          <polygon points="50,34 63.9,42 63.9,58 50,66 36.1,58 36.1,42" fill="none" stroke="white" stroke-width="5" stroke-linejoin="round" transform="rotate(30,50,50)"/>
          <circle cx="50" cy="50" r="5" fill="white"/>
        </svg>
      </div>
      <span class="nav-logo-text">Acql<span>erate</span></span>
    </a>
    <div class="nav-actions">
      <a href="/blog" class="btn-ghost nav-blog">← Blog</a>
      <a href="/app#/auth" class="btn-ghost">Sign In</a>
      <a href="/app#/auth" class="btn-primary">Start Free →</a>
    </div>
  </div>
</nav>

<div class="post-layout">
  <article class="post-main">
    <div class="breadcrumb"><a href="/blog">Blog</a><span>›</span><span>{topic['badge']}</span></div>
    <span class="post-badge">{topic['badge']}</span>
    <h1>{title}</h1>
    <p class="post-deck">{deck}</p>
    <div class="post-meta">By Acqlerate · {formatted_date} · {read_time} min read · For: {topic['audience']}</div>

    <div class="post-body">
{article_body}
    </div>

    <!-- CTA block -->
    <div style="background:linear-gradient(135deg,#01696F 0%,#0C4E54 100%);border-radius:16px;padding:32px;margin-top:48px;color:white;">
      <div style="font-size:0.75rem;font-weight:800;text-transform:uppercase;letter-spacing:0.1em;opacity:0.7;margin-bottom:8px">Learn More at Acqlerate</div>
      <h3 style="font-size:1.25rem;font-weight:800;margin-bottom:10px;color:white">Master Defense Acquisitions — Start Free</h3>
      <p style="font-size:0.95rem;opacity:0.9;margin-bottom:20px;line-height:1.6">Six modules. 34+ lessons. Novice through advanced. Built for DoD program managers, contracting officers, and defense contractors who need practical knowledge, not theory.</p>
      <a href="/app#/auth" style="display:inline-block;background:white;color:#01696F;font-weight:800;font-size:0.95rem;padding:12px 24px;border-radius:10px;text-decoration:none">Start Learning Free →</a>
    </div>
  </article>

  <aside class="post-sidebar">
    <div class="sidebar-toc">
      <div class="sidebar-toc-title">In This Article</div>
      <ul style="list-style:none;padding:0;margin:0">
{toc_items}
      </ul>
    </div>

    <!-- Sidebar CTA -->
    <div style="background:var(--teal-light);border:1.5px solid var(--teal);border-radius:12px;padding:20px;margin-top:24px">
      <div style="font-size:0.75rem;font-weight:800;text-transform:uppercase;letter-spacing:0.08em;color:var(--teal);margin-bottom:8px">Free Starter Kit</div>
      <p style="font-size:0.85rem;color:var(--text);margin-bottom:16px;line-height:1.5">Key terms, ACAT levels, career paths, and the 5 most common mistakes. Tailored to your role. Free.</p>
      <a href="/app#/auth" style="display:block;text-align:center;background:var(--teal);color:white;font-weight:700;font-size:0.875rem;padding:10px 16px;border-radius:8px;text-decoration:none">Get the Starter Kit →</a>
    </div>
  </aside>
</div>

<footer>
  <div class="footer-inner">
    <a href="/" class="footer-logo">
      <div class="nav-logo-icon" style="width:28px;height:28px;background:var(--teal);border-radius:7px;display:flex;align-items:center;justify-content:center">
        <svg viewBox="0 0 100 100" fill="none" width="18" height="18"><polygon points="50,22 71.2,36 71.2,64 50,78 28.8,64 28.8,36" fill="none" stroke="white" stroke-width="7" stroke-linejoin="round"/><circle cx="50" cy="50" r="5" fill="white"/></svg>
      </div>
      <span class="footer-logo-text">Acql<span>erate</span></span>
    </a>
    <div class="footer-links">
      <a href="/blog">Blog</a>
      <a href="/app#/auth">Sign Up Free</a>
      <a href="/app#/upgrade">Pricing</a>
      <a href="mailto:lucas@acqlerate.com">Contact</a>
    </div>
    <div class="footer-copy">© 2026 Acqlerate. Defense Acquisitions Academy.</div>
  </div>
</footer>
<script src="/blog/blog.js"></script>
</body>
</html>"""
    return html


def add_post_to_index(slug: str, title: str, excerpt: str, topic: dict, 
                       read_time: int) -> None:
    """Insert a new post card at the top of the blog index."""
    index_path = BLOG_DIR / "index.html"
    with open(index_path) as f:
        content = f.read()
    
    new_card = f"""
    <!-- {title} -->
    <a href="/blog/{slug}" class="post-card" style="text-decoration:none;color:inherit">
      <span class="post-card-badge">{topic['badge']}</span>
      <div class="post-card-body">
        <h2>{title}</h2>
        <p>{excerpt}</p>
        <div class="post-card-meta">
          <span>{read_time} min read</span>
          <span>·</span>
          <span>{topic['audience']}</span>
        </div>
        <span class="read-more">Read article →</span>
      </div>
    </a>
"""
    
    # Insert after the opening <!-- POSTS GRID --> comment's div
    insert_after = '  <div class="posts-grid">\n'
    if insert_after in content:
        content = content.replace(insert_after, insert_after + new_card, 1)
        with open(index_path, 'w') as f:
            f.write(content)
        print(f"Added '{title}' to blog index")
    else:
        print("WARNING: Could not find insertion point in blog index")


def git_commit_and_push(slug: str, title: str) -> bool:
    """Commit the new post and push to GitHub (Railway auto-deploys)."""
    try:
        subprocess.run(["git", "config", "user.email", "blog-bot@acqlerate.com"], 
                      cwd=REPO_ROOT, check=True, capture_output=True)
        subprocess.run(["git", "config", "user.name", "Acqlerate Blog Bot"], 
                      cwd=REPO_ROOT, check=True, capture_output=True)
        subprocess.run(["git", "add", 
                        f"client/public/blog/{slug}.html",
                        "client/public/blog/index.html"],
                      cwd=REPO_ROOT, check=True, capture_output=True)
        subprocess.run(["git", "commit", "-m", 
                        f"blog: auto-publish '{title[:60]}'"],
                      cwd=REPO_ROOT, check=True, capture_output=True)
        subprocess.run(["git", "push", "origin", "main"],
                      cwd=REPO_ROOT, check=True, capture_output=True)
        print(f"Pushed post to GitHub: {slug}")
        return True
    except subprocess.CalledProcessError as e:
        print(f"Git error: {e.stderr.decode() if e.stderr else e}")
        return False


def pick_topic(is_tuesday: bool) -> dict:
    """Pick a topic based on day. Tuesday = news, Saturday = educational."""
    pool = TOPIC_POOL_NEWS if is_tuesday else TOPIC_POOL_EDUCATIONAL
    # Rotate through topics based on week number to avoid repeats
    week_num = datetime.now(timezone.utc).isocalendar()[1]
    return pool[week_num % len(pool)]


def main():
    now = datetime.now(timezone.utc)
    pub_date = now.strftime("%Y-%m-%d")
    is_tuesday = now.weekday() == 1  # 0=Mon, 1=Tue, 5=Sat
    
    print(f"Starting blog post generation — {pub_date} ({'Tuesday/News' if is_tuesday else 'Saturday/Education'})")
    
    # Pick topic
    topic = pick_topic(is_tuesday)
    print(f"Topic angle: {topic['angle'][:60]}...")
    
    # Research
    print("Researching...")
    research = search_news(topic["search"])
    
    # Generate article body
    print("Generating article...")
    raw_content = generate_blog_post(topic, research, pub_date, "")
    
    # Extract title from first non-HTML line, or generate one
    lines = raw_content.strip().split('\n')
    title = ""
    deck = ""
    body_start = 0
    
    # Try to find a title line at the top (Gemini sometimes includes it)
    for i, line in enumerate(lines[:8]):
        clean = re.sub(r'<[^>]*>', '', line).strip()
        if clean and len(clean) > 20 and len(clean) < 120 and not clean.startswith('By '):
            if not title:
                title = clean
                body_start = i + 1
                break
    
    # If no title found, ask Gemini for one
    if not title:
        title_prompt = f"""Based on this blog post content about "{topic['angle']}", 
write ONE compelling, specific blog post title (under 80 characters). 
No quotes, no punctuation at the end. Just the title.
Post preview: {raw_content[:500]}"""
        title = gemini_generate(title_prompt).strip().strip('"').strip("'")
    
    # Generate deck if not found
    deck_prompt = f"""Write a 1-sentence compelling subtitle for this blog post titled "{title}".
Under 160 characters. No quotes. Direct and practical for defense acquisition professionals."""
    deck = gemini_generate(deck_prompt).strip().strip('"').strip("'")
    
    # Clean body — remove any title that leaked in
    article_body = '\n'.join(lines[body_start:])
    article_body = re.sub(r'^<h1>.*?</h1>\s*', '', article_body, flags=re.DOTALL | re.IGNORECASE)
    # Remove any standalone title line at start
    article_body = re.sub(r'^[A-Z][^<\n]{20,100}\n', '', article_body.strip())
    
    # Generate slug from title
    slug = slugify(title)
    if not slug:
        slug = f"defense-acquisition-{pub_date}"
    
    # Check slug doesn't already exist
    if (BLOG_DIR / f"{slug}.html").exists():
        slug = f"{slug}-{pub_date}"
    
    # Get read time
    read_time = get_read_time(article_body)
    
    # Generate a short excerpt for the index card
    excerpt_prompt = f"""Write a 1-2 sentence excerpt (under 180 chars) for a blog post index card.
Title: {title}
Content preview: {article_body[:600]}
Make it practical and compelling. No quotes."""
    excerpt = gemini_generate(excerpt_prompt).strip().strip('"').strip("'")
    
    # Build HTML
    print(f"Building HTML for '{title}'...")
    post_html = build_post_html(title, deck, article_body, topic, pub_date, slug, read_time)
    
    # Write post file
    post_path = BLOG_DIR / f"{slug}.html"
    with open(post_path, 'w') as f:
        f.write(post_html)
    print(f"Written: {post_path}")
    
    # Update index
    add_post_to_index(slug, title, excerpt, topic, read_time)
    
    # Commit and push
    success = git_commit_and_push(slug, title)
    
    if success:
        print(f"\n✓ Blog post published: https://acqlerate.com/blog/{slug}")
    else:
        print(f"\n✗ Post written but push failed. Manual push needed.")
    
    return 0


if __name__ == "__main__":
    sys.exit(main())
