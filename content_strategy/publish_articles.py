#!/usr/bin/env python3
"""
Assembles all 20 JSON article files into full HTML blog posts and publishes them.
Adds: nav, sidebar (TOC + module CTA + email capture), email capture mid-article,
bottom CTA, footer. Updates blog index with all 20 post cards.
"""

import json, re, subprocess
from pathlib import Path
from datetime import date

ARTICLES_DIR = Path(__file__).parent / "articles"
BLOG_DIR     = Path(__file__).parent.parent / "client" / "public" / "blog"
REPO_ROOT    = Path(__file__).parent.parent

MODULES = {
    "foundations": {
        "title": "DoD Acquisitions Foundations",
        "desc":  "Module 1 — the complete overview of how DoD buys things, from FAR to program office.",
    },
    "finance": {
        "title": "Defense Finance & Budgeting",
        "desc":  "Module 2 — PPBE, color of money, EVM, appropriations, and the fiscal mechanics of every program.",
    },
    "contracts": {
        "title": "Defense Contracting Fundamentals",
        "desc":  "Module 3 — contract types, source selection, IDIQs, GWACs, modifications, and the COR role.",
    },
    "data": {
        "title": "Data Analytics for Program Managers",
        "desc":  "Module 4 — EVM deep dives, IPMR formats, KPIs, and data-driven decision making.",
    },
    "capture": {
        "title": "Capture Management & Business Development",
        "desc":  "Module 5 — BD lifecycle, proposal writing, win strategy, and the source selection process from both sides.",
    },
    "operations": {
        "title": "Program Operations & Leadership",
        "desc":  "Module 6 — risk management, stakeholder comms, CMMI, subcontractor management, and career roadmaps.",
    },
}

# Badge → colour label for post cards
BADGE_COLORS = {
    "Foundations": "#01696F",
    "Finance": "#1D4ED8",
    "Contracting": "#7C3AED",
    "Capture Management": "#B45309",
    "Career": "#DC2626",
    "News & Analysis": "#059669",
    "Policy Update": "#0284C7",
    "Compliance": "#9333EA",
    "Source Selection": "#4F46E5",
    "Program Management": "#0D9488",
}

NAV_HTML = """<nav>
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
</nav>"""

FOOTER_HTML = """<footer>
  <div class="footer-inner">
    <a href="/" class="footer-logo">
      <div class="nav-logo-icon" style="width:28px;height:28px;background:var(--teal);border-radius:7px;display:flex;align-items:center;justify-content:center">
        <svg viewBox="0 0 100 100" fill="none" width="18" height="18">
          <polygon points="50,22 71.2,36 71.2,64 50,78 28.8,64 28.8,36" fill="none" stroke="white" stroke-width="7" stroke-linejoin="round"/>
          <circle cx="50" cy="50" r="5" fill="white"/>
        </svg>
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
</footer>"""


def email_capture_block(form_id: str, success_id: str) -> str:
    return f"""
<div style="background:linear-gradient(135deg,#01696F 0%,#0C4E54 100%);border-radius:14px;padding:28px 32px;margin:40px 0;color:white;">
  <div style="font-size:0.7rem;font-weight:800;text-transform:uppercase;letter-spacing:0.1em;opacity:0.7;margin-bottom:6px">Free Starter Kit</div>
  <h3 style="font-size:1.1rem;font-weight:800;margin:0 0 8px;color:white">Get the Acqlerate Acquisition Starter Kit — Free</h3>
  <p style="font-size:0.9rem;opacity:0.9;margin:0 0 18px;line-height:1.5">Key terms, ACAT levels, career roadmaps, and the 5 most common acquisition mistakes. Tailored to your role.</p>
  <form id="{form_id}" onsubmit="submitSidebarLead(event,'{form_id}','{success_id}')" style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">
    <input type="email" placeholder="your@email.com" required style="padding:10px 14px;border:none;border-radius:8px;font-size:0.9rem;font-family:inherit;width:240px;max-width:100%;outline:none;color:#1A1A1A" />
    <button type="submit" style="background:white;color:#01696F;border:none;cursor:pointer;font-size:0.9rem;font-weight:800;padding:10px 20px;border-radius:8px;font-family:inherit;white-space:nowrap">Send It Free →</button>
  </form>
  <div id="{success_id}" style="font-size:0.875rem;font-weight:700;color:rgba(255,255,255,0.9);display:none;margin-top:10px">✓ Check your inbox — it's on its way.</div>
</div>"""


def module_cta_block(module_key: str, context_note: str) -> str:
    mod = MODULES.get(module_key, MODULES["foundations"])
    return f"""
<div style="border:2px solid var(--teal);border-radius:14px;padding:24px 28px;margin:40px 0;background:var(--teal-light,#E6F2F3);">
  <div style="font-size:0.7rem;font-weight:800;text-transform:uppercase;letter-spacing:0.1em;color:var(--teal);margin-bottom:6px">Go Deeper on Acqlerate</div>
  <h3 style="font-size:1.05rem;font-weight:800;color:#0D1B2A;margin:0 0 8px">{mod['title']}</h3>
  <p style="font-size:0.9rem;color:#374151;margin:0 0 16px;line-height:1.5">{context_note} {mod['desc']}</p>
  <a href="/app#/auth" style="display:inline-block;background:var(--teal,#01696F);color:white;font-weight:800;font-size:0.875rem;padding:10px 20px;border-radius:8px;text-decoration:none">Start This Module Free →</a>
</div>"""


def sidebar_html(toc_items: str, module_key: str) -> str:
    mod = MODULES.get(module_key, MODULES["foundations"])
    return f"""  <aside class="post-sidebar">
    <div class="sidebar-toc">
      <div class="sidebar-toc-title">In This Article</div>
      <ul style="list-style:none;padding:0;margin:0">
{toc_items}
      </ul>
    </div>

    <div style="background:var(--teal-light,#E6F2F3);border:1.5px solid var(--teal,#01696F);border-radius:12px;padding:20px;margin-top:20px">
      <div style="font-size:0.7rem;font-weight:800;text-transform:uppercase;letter-spacing:0.08em;color:var(--teal);margin-bottom:6px">Relevant Module</div>
      <p style="font-size:0.85rem;font-weight:700;color:#0D1B2A;margin:0 0 6px">{mod['title']}</p>
      <p style="font-size:0.8rem;color:#374151;margin:0 0 14px;line-height:1.4">{mod['desc']}</p>
      <a href="/app#/auth" style="display:block;text-align:center;background:var(--teal,#01696F);color:white;font-weight:700;font-size:0.875rem;padding:9px 14px;border-radius:8px;text-decoration:none">Open This Module →</a>
    </div>

    <div style="background:var(--gold-bg,#FEF9E7);border:1.5px solid #F0D060;border-radius:12px;padding:20px;margin-top:20px">
      <div style="font-size:0.7rem;font-weight:800;text-transform:uppercase;letter-spacing:0.08em;color:var(--gold,#D19900);margin-bottom:6px">Free Resource</div>
      <p style="font-size:0.85rem;color:var(--text);margin:0 0 12px;line-height:1.5">Acquisition Starter Kit — key terms, career paths, and the 5 biggest mistakes. Tailored to your role.</p>
      <form id="sidebarCapture" onsubmit="submitSidebarLead(event,'sidebarCapture','sidebarSuccess')" style="display:flex;flex-direction:column;gap:8px">
        <input type="email" placeholder="your@email.com" required style="padding:9px 12px;border:1.5px solid #E0C050;border-radius:7px;font-size:0.85rem;font-family:inherit;outline:none" />
        <button type="submit" style="background:var(--gold,#D19900);color:white;border:none;cursor:pointer;font-size:0.85rem;font-weight:700;padding:9px;border-radius:7px;font-family:inherit">Get Starter Kit →</button>
      </form>
      <div id="sidebarSuccess" style="font-size:0.8rem;font-weight:700;color:var(--teal);display:none;margin-top:6px">✓ Check your inbox!</div>
    </div>
  </aside>"""


def bottom_cta(module_key: str) -> str:
    mod = MODULES.get(module_key, MODULES["foundations"])
    return f"""    <div style="background:linear-gradient(135deg,#01696F 0%,#0C4E54 100%);border-radius:16px;padding:32px;margin-top:48px;color:white;">
      <div style="font-size:0.75rem;font-weight:800;text-transform:uppercase;letter-spacing:0.1em;opacity:0.7;margin-bottom:8px">Master Defense Acquisitions</div>
      <h3 style="font-size:1.25rem;font-weight:800;margin-bottom:10px;color:white">Start Free — Six Modules, 34+ Lessons</h3>
      <p style="font-size:0.95rem;opacity:0.9;margin-bottom:20px;line-height:1.6">Built for DoD program managers, contracting officers, and defense contractors. The <strong>{mod['title']}</strong> module covers everything in this guide — novice through advanced.</p>
      <a href="/app#/auth" style="display:inline-block;background:white;color:#01696F;font-weight:800;font-size:0.95rem;padding:12px 24px;border-radius:10px;text-decoration:none;margin-right:12px">Start Learning Free →</a>
      <a href="/app#/upgrade" style="display:inline-block;color:rgba(255,255,255,0.85);font-weight:600;font-size:0.9rem;padding:12px 0;text-decoration:none">See all modules →</a>
    </div>"""


def inject_captures(body_html: str, slug: str) -> str:
    """Inject email capture + module CTA into body at strategic positions."""
    # We'll rely on what the subagents already embedded, but ensure they're present.
    # If no capture block found, inject after the 2nd h2.
    if "submitSidebarLead" not in body_html and "midCapture" not in body_html:
        h2s = [m.start() for m in re.finditer(r'<h2', body_html)]
        if len(h2s) >= 2:
            idx = h2s[1]
            body_html = (body_html[:idx]
                + email_capture_block(f"mid_{slug[:20]}", f"mid_{slug[:20]}_ok")
                + body_html[idx:])
    return body_html


def assemble(article: dict, pub_date: str) -> str:
    slug       = article["slug"]
    title      = article["title"]
    deck       = article.get("deck", "")
    badge      = article.get("badge", "Foundations")
    audience   = article.get("audience", "USG & Contractor")
    module_key = article.get("module", "foundations")
    read_time  = article.get("read_time", 10)
    body_html  = article["body_html"]

    formatted_date = "2026"
    try:
        from datetime import datetime
        formatted_date = datetime.strptime(pub_date, "%Y-%m-%d").strftime("%B %Y")
    except:
        pass

    # Ensure captures present
    body_html = inject_captures(body_html, slug)

    # TOC from h2s
    h2s = re.findall(r'<h2[^>]*>(.*?)</h2>', body_html)
    toc_items = "\n".join(
        f'        <li style="font-size:0.8rem;margin-bottom:5px">'
        f'<a href="#" style="color:var(--teal)">{re.sub(r"<[^>]+>","",h)}</a></li>'
        for h in h2s[:7]
    )

    # Context note for module CTA
    context_note = f"This article covers concepts taught in depth in Acqlerate's"

    return f"""<!DOCTYPE html>
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

{NAV_HTML}

<div class="post-layout">
  <article class="post-main">
    <div class="breadcrumb"><a href="/blog">Blog</a><span>›</span><span>{badge}</span></div>
    <span class="post-badge">{badge}</span>
    <h1>{title}</h1>
    <p class="post-deck">{deck}</p>
    <div class="post-meta">By Acqlerate · {formatted_date} · {read_time} min read · For: {audience}</div>

    <div class="post-body">
{body_html}
    </div>

{bottom_cta(module_key)}
  </article>

{sidebar_html(toc_items, module_key)}
</div>

{FOOTER_HTML}
<script src="/blog/blog.js"></script>
</body>
</html>"""


def build_index_card(article: dict) -> str:
    slug      = article["slug"]
    title     = article["title"]
    excerpt   = article.get("excerpt", "")
    badge     = article.get("badge", "Foundations")
    audience  = article.get("audience", "USG & Contractor")
    read_time = article.get("read_time", 10)
    # Mark pillar articles
    is_pillar = "guide" in slug or "complete" in slug or "101" in slug or "breaking-into" in slug
    pillar_tag = ' <span style="font-size:0.65rem;background:#01696F;color:white;padding:2px 6px;border-radius:4px;vertical-align:middle;margin-left:4px">PILLAR</span>' if is_pillar else ''
    return f"""
    <a href="/blog/{slug}" class="post-card" style="text-decoration:none;color:inherit">
      <span class="post-card-badge">{badge}</span>
      <div class="post-card-body">
        <h2>{title}{pillar_tag}</h2>
        <p>{excerpt}</p>
        <div class="post-card-meta">
          <span>{read_time} min read</span>
          <span>·</span>
          <span>{audience}</span>
        </div>
        <span class="read-more">Read article →</span>
      </div>
    </a>
"""


def update_index(articles: list) -> None:
    index_path = BLOG_DIR / "index.html"
    content = index_path.read_text()

    # Build all new cards
    new_cards = "".join(build_index_card(a) for a in articles)

    marker = '  <div class="posts-grid">\n'
    if marker in content:
        content = content.replace(marker, marker + new_cards, 1)
        index_path.write_text(content)
        print(f"Updated blog index with {len(articles)} new cards")
    else:
        print("WARNING: Could not find posts-grid marker in index.html")


def main():
    pub_date = date.today().isoformat()
    json_files = sorted(ARTICLES_DIR.glob("*.json"))
    print(f"Found {len(json_files)} article files")

    articles = []
    for jf in json_files:
        try:
            article = json.loads(jf.read_text())
            articles.append(article)
        except Exception as e:
            print(f"ERROR parsing {jf.name}: {e}")
            continue

    # Assemble and write HTML files
    published = []
    for article in articles:
        slug = article.get("slug", "")
        if not slug:
            print(f"Skipping article with no slug")
            continue

        html = assemble(article, pub_date)
        out_path = BLOG_DIR / f"{slug}.html"
        out_path.write_text(html)
        published.append(article)
        print(f"  Written: {slug}.html ({len(html)//1024}KB)")

    # Update blog index — put pillar articles first, then clusters
    pillars   = [a for a in published if any(x in a["slug"] for x in
                 ["complete-guide", "defense-finance-program-managers-guide",
                  "federal-contracting-101", "breaking-into-govcon-guide"])]
    clusters  = [a for a in published if a not in pillars]
    update_index(pillars + clusters)

    # Git commit and push
    print("\nCommitting and pushing...")
    try:
        subprocess.run(["git", "config", "user.email", "content@acqlerate.com"], cwd=REPO_ROOT, check=True, capture_output=True)
        subprocess.run(["git", "config", "user.name", "Acqlerate Content Bot"], cwd=REPO_ROOT, check=True, capture_output=True)
        subprocess.run(["git", "add", "client/public/blog/", "content_strategy/"], cwd=REPO_ROOT, check=True, capture_output=True)
        subprocess.run(["git", "commit", "-m",
            f"content: publish 20 pillar+cluster articles — 4 pillars, 16 clusters\n\n"
            f"Pillar 1: Complete Guide to DoD Acquisition (+ 4 clusters)\n"
            f"Pillar 2: Defense Finance for Program Managers (+ 4 clusters)\n"
            f"Pillar 3: Federal Contracting 101 (+ 4 clusters)\n"
            f"Pillar 4: Breaking Into GovCon (+ 4 clusters)\n\n"
            f"Keywords: what is PPBE, DoD contract types, how to become 1102,\n"
            f"EVM for beginners, ACAT levels explained, source selection process DoD,\n"
            f"color of money DoD, OTA vs FAR, COR responsibilities, CPARS ratings\n"
            f"Total: ~40,000 words of SEO-optimized defense acquisition content"
        ], cwd=REPO_ROOT, check=True, capture_output=True)
        subprocess.run(["git", "push", "origin", "main"], cwd=REPO_ROOT, check=True, capture_output=True)
        print(f"\n✓ Published {len(published)} articles to https://acqlerate.com/blog")
    except subprocess.CalledProcessError as e:
        print(f"Git error: {e.stderr.decode() if e.stderr else e}")


if __name__ == "__main__":
    main()
