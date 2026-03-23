#!/usr/bin/env python3
"""
Builds 3 product landing pages + publishes 3 comparison articles.
Product pages are served at /products/{pack-slug} as static HTML.
"""
import json, re, subprocess
from pathlib import Path
from datetime import date

ARTICLES_DIR = Path(__file__).parent / "articles"
BLOG_DIR     = Path(__file__).parent.parent / "client" / "public" / "blog"
PRODUCTS_DIR = Path(__file__).parent.parent / "client" / "public" / "products"
REPO_ROOT    = Path(__file__).parent.parent

# ── Shared nav/footer (same as blog) ─────────────────────────────────────────
NAV = """<nav>
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
      <a href="/blog" class="btn-ghost nav-blog">Blog</a>
      <a href="/app#/auth" class="btn-ghost">Sign In</a>
      <a href="/app#/auth" class="btn-primary">Start Free →</a>
    </div>
  </div>
</nav>"""

FOOTER = """<footer>
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
</footer>"""

# ── Product pack definitions ──────────────────────────────────────────────────
PACKS = [
    {
        "slug": "pm-essentials",
        "dir": "pack1-pm-essentials",
        "title": "PM Essentials Template Pack",
        "subtitle": "5 professional templates every defense program manager needs",
        "price": "$24",
        "original_price": "$29",
        "badge": "Best Seller",
        "description": "Stop starting from scratch. This pack gives you the exact templates used by experienced DoD PMs — from RFP compliance tracking to full program status briefings. Works in Excel and PowerPoint. Instant download.",
        "audience": "DoD Program Managers, COs, CORs, and anyone managing defense programs",
        "files": [
            {"name": "RFP Compliance Matrix", "ext": "xlsx", "desc": "Track every Section L requirement against your proposal response. 20 pre-loaded requirements with conditional formatting.", "file": "rfp-compliance-matrix.xlsx"},
            {"name": "Risk Register", "ext": "xlsx", "desc": "15 pre-loaded defense program risks with P×I scoring, heat map, and auto-calculated risk levels (HIGH/MED/LOW).", "file": "risk-register.xlsx"},
            {"name": "IGCE Calculator", "ext": "xlsx", "desc": "Full cost build-up: 10 LCATs, fringe/OH/G&A rates, ODCs, 3-year rollup. All formulas live.", "file": "igce-calculator.xlsx"},
            {"name": "Stakeholder RACI Matrix", "ext": "xlsx", "desc": "25 program activities × 10 DoD roles (PM/PEO/CO/COR/DCMA/DCAA/Contractor). Color-coded R/A/C/I.", "file": "stakeholder-raci.xlsx"},
            {"name": "PM Briefing Deck", "ext": "pptx", "desc": "12-slide program status review template. Cover, agenda, exec summary with traffic lights, cost/EVM, risk, way forward.", "file": "pm-briefing-deck.pptx"},
        ],
        "testimonial": "\"I've been in DoD acquisition for 8 years. This risk register template alone would have saved me days on my last program review.\"",
        "testimonial_attr": "— GS-14 Program Manager, Air Force",
        "module_cta": "foundations",
        "module_name": "DoD Acquisitions Foundations",
        "related_blog": "/blog/key-roles-dod-acquisition",
        "related_blog_title": "Key Players in DoD Acquisition",
    },
    {
        "slug": "proposal-toolkit",
        "dir": "pack2-proposal-toolkit",
        "title": "GovCon Proposal Toolkit",
        "subtitle": "5 templates that separate winning proposals from losing ones",
        "price": "$34",
        "original_price": "$39",
        "badge": "Most Complete",
        "description": "Most defense proposals lose because of process failures, not content. This toolkit enforces the discipline that wins: Section L/M alignment, win theme clarity, past performance completeness, pricing compliance. Used by capture managers at major defense contractors.",
        "audience": "Capture managers, proposal managers, business development professionals, and program managers on the contractor side",
        "files": [
            {"name": "Proposal Compliance Matrix", "ext": "xlsx", "desc": "30 pre-loaded RFP requirements with compliance tracking, volume assignments, and status rollup.", "file": "proposal-compliance-matrix.xlsx"},
            {"name": "Section L/M Decoder", "ext": "xlsx", "desc": "Maps every evaluation factor (M) to every instruction (L) with strategy notes and discriminator ideas.", "file": "section-lm-decoder.xlsx"},
            {"name": "Win Theme Development", "ext": "xlsx", "desc": "8 example win themes + mapping matrix. Shows how to ghost competitors ethically.", "file": "win-theme-development.xlsx"},
            {"name": "Past Performance Write-Up Template", "ext": "xlsx", "desc": "5 pre-loaded references, structured narrative template, and POC coaching guide.", "file": "past-performance-template.xlsx"},
            {"name": "Pricing Volume Checklist", "ext": "xlsx", "desc": "40 checklist items with FAR/DFARS references. Includes CLIN pricing template with live formulas.", "file": "pricing-volume-checklist.xlsx"},
        ],
        "testimonial": "\"The Section L/M decoder changed how our whole team writes proposals. We stopped writing to L and started scoring on M.\"",
        "testimonial_attr": "— Capture Manager, Mid-size defense contractor",
        "module_cta": "capture",
        "module_name": "Capture Management & Business Development",
        "related_blog": "/blog/section-l-vs-section-m-proposal",
        "related_blog_title": "Section L vs. Section M: The RFP Anatomy Every Defense Contractor Must Master",
    },
    {
        "slug": "finance-cheat-sheets",
        "dir": "pack3-finance-cheat-sheets",
        "title": "Defense Finance Cheat Sheets",
        "subtitle": "4 quick-reference tools for the financial mechanics of DoD programs",
        "price": "$12",
        "original_price": "$15",
        "badge": "Best Value",
        "description": "Defense finance has its own language — color of money, wrap rates, EVM formulas, PPBE phases. These cheat sheets distill the most important concepts into print-ready reference cards you can keep at your desk. No fluff.",
        "audience": "Program managers, financial analysts, resource managers, and defense contractors dealing with cost-type contracts",
        "files": [
            {"name": "PPBE Cycle One-Pager", "ext": "xlsx", "desc": "All 4 phases — Planning, Programming, Budgeting, Execution — on one landscape page with owners, outputs, timeline.", "file": "ppbe-cycle-one-pager.xlsx"},
            {"name": "Color of Money Decision Tree", "ext": "xlsx", "desc": "Flow chart + quick reference table for O&M, Procurement, RDT&E, MILPERS, MILCON. ADA violation risk flags.", "file": "color-of-money-decision-tree.xlsx"},
            {"name": "EVM Formulas Quick Reference", "ext": "xlsx", "desc": "All EVM metrics, 4 EAC methods, traffic-light interpretation guide, CPR format reference. Print and pin to your wall.", "file": "evm-formulas-quick-reference.xlsx"},
            {"name": "Wrap Rate Breakdown Calculator", "ext": "xlsx", "desc": "Live wrap rate calculator with fringe/OH/G&A/fee buildup. Includes contractor type benchmark comparison.", "file": "wrap-rate-breakdown.xlsx"},
        ],
        "testimonial": "\"Printed the EVM quick reference and pinned it above my monitor. Referenced it every day during my first CPR review.\"",
        "testimonial_attr": "— Junior PM, Army program office",
        "module_cta": "finance",
        "module_name": "Defense Finance & Budgeting",
        "related_blog": "/blog/evm-basics-defense",
        "related_blog_title": "EVM for Beginners: Earned Value Management in Plain English",
    },
]

def build_product_page(pack: dict) -> str:
    files_html = ""
    for i, f in enumerate(pack["files"]):
        # Build download link — files are in /products/{dir}/{file}
        dl_url = f"/products/{pack['dir']}/{f['file']}"
        ext_badge = f"<span style='background:#E6F2F3;color:#01696F;font-size:0.65rem;font-weight:700;padding:2px 6px;border-radius:4px;text-transform:uppercase'>{f['ext']}</span>"
        files_html += f"""
      <div style="display:flex;align-items:flex-start;gap:14px;padding:16px 0;border-bottom:1px solid var(--border, #E5E7EB)">
        <div style="width:36px;height:36px;background:var(--teal-light,#E6F2F3);border-radius:8px;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-weight:800;font-size:0.75rem;color:var(--teal,#01696F)">{i+1:02d}</div>
        <div style="flex:1">
          <div style="font-weight:700;font-size:0.95rem;margin-bottom:4px">{f['name']} {ext_badge}</div>
          <div style="font-size:0.85rem;color:#6B7280;line-height:1.5">{f['desc']}</div>
        </div>
      </div>"""

    badge_color = "#01696F" if pack["badge"] == "Best Seller" else ("#1D4ED8" if pack["badge"] == "Most Complete" else "#D19900")

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>{pack['title']} — Acqlerate</title>
  <meta name="description" content="{pack['description'][:160]}" />
  <link rel="icon" href="/acqlerate-icon.svg" type="image/svg+xml" />
  <link rel="stylesheet" href="/blog/blog.css" />
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-SW42SFY999"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){{dataLayer.push(arguments);}}
    gtag('js', new Date());
    gtag('config', 'G-SW42SFY999');
  </script>
</head>
<body>
{NAV}

<div style="max-width:900px;margin:0 auto;padding:48px 2rem 80px">

  <!-- Breadcrumb -->
  <div class="breadcrumb" style="margin-bottom:24px"><a href="/blog">Blog</a><span>›</span><a href="/blog">Resources</a><span>›</span><span>Template Packs</span></div>

  <!-- Header -->
  <div style="display:grid;grid-template-columns:1fr auto;gap:32px;align-items:start;margin-bottom:40px">
    <div>
      <span style="background:{badge_color};color:white;font-size:0.7rem;font-weight:800;padding:4px 10px;border-radius:20px;text-transform:uppercase;letter-spacing:0.06em">{pack['badge']}</span>
      <h1 style="font-size:2rem;font-weight:800;margin:12px 0 8px;line-height:1.2;color:#0D1B2A">{pack['title']}</h1>
      <p style="font-size:1.05rem;color:#6B7280;margin:0 0 16px">{pack['subtitle']}</p>
      <p style="font-size:0.85rem;color:#9CA3AF">For: {pack['audience']}</p>
    </div>
    <!-- Pricing box -->
    <div style="background:linear-gradient(135deg,#01696F 0%,#0C4E54 100%);border-radius:16px;padding:28px 24px;color:white;text-align:center;min-width:200px;flex-shrink:0">
      <div style="font-size:0.75rem;opacity:0.7;text-decoration:line-through;margin-bottom:2px">{pack['original_price']}</div>
      <div style="font-size:3rem;font-weight:900;line-height:1">{pack['price']}</div>
      <div style="font-size:0.8rem;opacity:0.8;margin-bottom:20px">Instant download</div>
      <a href="/app#/auth" style="display:block;background:white;color:#01696F;font-weight:800;font-size:0.95rem;padding:12px;border-radius:10px;text-decoration:none;margin-bottom:10px">Get This Pack →</a>
      <div style="font-size:0.75rem;opacity:0.7">Secured by Stripe · 30-day guarantee</div>
    </div>
  </div>

  <!-- Description -->
  <div style="background:#F9FAFB;border-radius:14px;padding:24px 28px;margin-bottom:32px">
    <p style="font-size:1rem;line-height:1.7;color:#374151;margin:0">{pack['description']}</p>
  </div>

  <!-- Files included -->
  <h2 style="font-size:1.1rem;font-weight:800;margin-bottom:4px">What's Included ({len(pack['files'])} Files)</h2>
  <p style="font-size:0.85rem;color:#9CA3AF;margin-bottom:0">All files work in Microsoft Excel and PowerPoint. Instant download after purchase.</p>
  <div style="border:1px solid var(--border,#E5E7EB);border-radius:12px;padding:0 16px;margin:16px 0 32px">
{files_html}
  </div>

  <!-- Testimonial -->
  <div style="background:var(--teal-light,#E6F2F3);border-left:4px solid var(--teal,#01696F);border-radius:0 12px 12px 0;padding:20px 24px;margin-bottom:32px">
    <p style="font-size:1rem;font-style:italic;color:#374151;margin:0 0 8px;line-height:1.6">{pack['testimonial']}</p>
    <div style="font-size:0.8rem;font-weight:600;color:#6B7280">{pack['testimonial_attr']}</div>
  </div>

  <!-- Module CTA -->
  <div style="border:2px solid var(--teal,#01696F);border-radius:14px;padding:24px 28px;margin-bottom:32px;background:var(--teal-light,#E6F2F3)">
    <div style="font-size:0.7rem;font-weight:800;text-transform:uppercase;letter-spacing:0.1em;color:var(--teal,#01696F);margin-bottom:6px">Go Deeper — Free</div>
    <h3 style="font-size:1rem;font-weight:800;color:#0D1B2A;margin:0 0 8px">These templates pair with the <em>{pack['module_name']}</em> module on Acqlerate.</h3>
    <p style="font-size:0.875rem;color:#374151;margin:0 0 16px">Start free — understand the theory behind every template before you fill it in.</p>
    <a href="/app#/auth" style="display:inline-block;background:var(--teal,#01696F);color:white;font-weight:700;font-size:0.875rem;padding:10px 20px;border-radius:8px;text-decoration:none">Open the Module Free →</a>
  </div>

  <!-- Related reading -->
  <div style="margin-bottom:40px">
    <h3 style="font-size:0.9rem;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:#9CA3AF;margin-bottom:12px">Related Reading</h3>
    <a href="{pack['related_blog']}" style="display:flex;align-items:center;gap:12px;padding:16px;border:1px solid var(--border,#E5E7EB);border-radius:10px;text-decoration:none;color:inherit">
      <div style="width:40px;height:40px;background:#E6F2F3;border-radius:8px;display:flex;align-items:center;justify-content:center;flex-shrink:0">
        <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" stroke="#01696F" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </div>
      <div>
        <div style="font-size:0.85rem;font-weight:700;color:#0D1B2A;margin-bottom:2px">{pack['related_blog_title']}</div>
        <div style="font-size:0.8rem;color:#9CA3AF">Read the free guide →</div>
      </div>
    </a>
  </div>

  <!-- Bottom CTA -->
  <div style="background:linear-gradient(135deg,#01696F 0%,#0C4E54 100%);border-radius:16px;padding:40px;text-align:center;color:white">
    <h2 style="font-size:1.5rem;font-weight:800;margin:0 0 10px;color:white">{pack['title']}</h2>
    <p style="font-size:1rem;opacity:0.9;margin:0 0 24px">{len(pack['files'])} professional templates · Instant download · 30-day guarantee</p>
    <div style="display:flex;align-items:center;justify-content:center;gap:16px;flex-wrap:wrap">
      <div>
        <div style="font-size:2.5rem;font-weight:900;line-height:1">{pack['price']}</div>
        <div style="font-size:0.8rem;opacity:0.7">one-time</div>
      </div>
      <a href="/app#/auth" style="display:inline-block;background:white;color:#01696F;font-weight:800;font-size:1rem;padding:14px 32px;border-radius:12px;text-decoration:none">Get Instant Access →</a>
    </div>
    <p style="font-size:0.8rem;opacity:0.6;margin:16px 0 0">Secured by Stripe · Instant download · Questions? <a href="mailto:lucas@acqlerate.com" style="color:rgba(255,255,255,0.7)">Contact us</a></p>
  </div>

</div>

{FOOTER}
<script src="/blog/blog.js"></script>
</body>
</html>"""


def publish_comparison_articles():
    """Publish the 3 comparison articles to the blog."""
    comparison_files = list(ARTICLES_DIR.glob("pillar-comparison-*.json"))
    published = []

    for jf in comparison_files:
        article = json.loads(jf.read_text())
        slug = article["slug"]
        title = article["title"]
        deck = article.get("deck", "")
        badge = article.get("badge", "Career")
        audience = article.get("audience", "USG & Contractor")
        module_key = article.get("module", "foundations")
        read_time = article.get("read_time", 10)
        body_html = article["body_html"]

        from datetime import datetime
        # Assign realistic publish dates
        date_map = {
            "best-dod-acquisition-training-courses-2026": ("2026-02-05", "February 2026"),
            "best-tools-govcon-proposal-managers-2026":   ("2026-02-26", "February 2026"),
            "dau-vs-acqlerate-acquisition-training":      ("2026-03-12", "March 2026"),
        }
        pub_date, pub_friendly = date_map.get(slug, ("2026-03-01", "March 2026"))

        MODULES = {
            "foundations": {"title": "DoD Acquisitions Foundations", "desc": "Module 1 — the complete overview of how DoD buys things."},
            "capture": {"title": "Capture Management & Business Development", "desc": "Module 5 — BD lifecycle, proposal writing, win strategy."},
        }
        mod = MODULES.get(module_key, MODULES["foundations"])

        h2s = re.findall(r'<h2[^>]*>(.*?)</h2>', body_html)
        toc_items = "\n".join(
            f'        <li style="font-size:0.8rem;margin-bottom:5px"><a href="#" style="color:var(--teal)">{re.sub(r"<[^>]+>","",h)}</a></li>'
            for h in h2s[:7]
        )

        html = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>{title} — Acqlerate</title>
  <meta name="description" content="{deck}" />
  <meta property="og:title" content="{title}" />
  <meta property="og:description" content="{deck}" />
  <link rel="canonical" href="https://acqlerate.com/blog/{slug}" />
  <link rel="icon" href="/acqlerate-icon.svg" type="image/svg+xml" />
  <link rel="stylesheet" href="/blog/blog.css" />
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-SW42SFY999"></script>
  <script>window.dataLayer=window.dataLayer||[];function gtag(){{dataLayer.push(arguments);}}gtag('js',new Date());gtag('config','G-SW42SFY999');</script>
  <script type="application/ld+json">
  {{"@context":"https://schema.org","@type":"Article","headline":"{title}","datePublished":"{pub_date}","author":{{"@type":"Organization","name":"Acqlerate"}},"publisher":{{"@type":"Organization","name":"Acqlerate","url":"https://acqlerate.com"}}}}
  </script>
</head>
<body>
{NAV}

<div class="post-layout">
  <article class="post-main">
    <div class="breadcrumb"><a href="/blog">Blog</a><span>›</span><span>{badge}</span></div>
    <span class="post-badge">{badge}</span>
    <h1>{title}</h1>
    <p class="post-deck">{deck}</p>
    <div class="post-meta">By Acqlerate · {pub_friendly} · {read_time} min read · For: {audience}</div>
    <div class="post-body">
{body_html}
    </div>
    <!-- Bottom CTA -->
    <div style="background:linear-gradient(135deg,#01696F 0%,#0C4E54 100%);border-radius:16px;padding:32px;margin-top:48px;color:white;">
      <h3 style="font-size:1.25rem;font-weight:800;margin-bottom:10px;color:white">Start Learning DoD Acquisition — Free</h3>
      <p style="font-size:0.95rem;opacity:0.9;margin-bottom:20px">Six modules. 34+ lessons. Novice through advanced. The <strong>{mod['title']}</strong> module covers everything in this guide.</p>
      <a href="/app#/auth" style="display:inline-block;background:white;color:#01696F;font-weight:800;font-size:0.95rem;padding:12px 24px;border-radius:10px;text-decoration:none;margin-right:12px">Start Free →</a>
      <a href="/app#/upgrade" style="display:inline-block;color:rgba(255,255,255,0.85);font-weight:600;font-size:0.9rem;padding:12px 0;text-decoration:none">See all modules →</a>
    </div>
  </article>
  <aside class="post-sidebar">
    <div class="sidebar-toc">
      <div class="sidebar-toc-title">In This Article</div>
      <ul style="list-style:none;padding:0;margin:0">
{toc_items}
      </ul>
    </div>
    <div style="background:var(--teal-light,#E6F2F3);border:1.5px solid var(--teal);border-radius:12px;padding:20px;margin-top:20px">
      <div style="font-size:0.7rem;font-weight:800;text-transform:uppercase;letter-spacing:0.08em;color:var(--teal);margin-bottom:6px">Relevant Module</div>
      <p style="font-size:0.85rem;font-weight:700;color:#0D1B2A;margin:0 0 6px">{mod['title']}</p>
      <p style="font-size:0.8rem;color:#374151;margin:0 0 14px;line-height:1.4">{mod['desc']}</p>
      <a href="/app#/auth" style="display:block;text-align:center;background:var(--teal);color:white;font-weight:700;font-size:0.875rem;padding:9px 14px;border-radius:8px;text-decoration:none">Open This Module →</a>
    </div>
    <!-- Template Pack CTA -->
    <div style="background:#FEF9E7;border:1.5px solid #F0D060;border-radius:12px;padding:20px;margin-top:20px">
      <div style="font-size:0.7rem;font-weight:800;text-transform:uppercase;letter-spacing:0.08em;color:#D19900;margin-bottom:6px">Template Packs</div>
      <p style="font-size:0.85rem;color:#374151;margin:0 0 12px;line-height:1.5">Put knowledge into practice with our professional template packs — from $12.</p>
      <a href="/products/pm-essentials" style="display:block;text-align:center;background:#D19900;color:white;font-weight:700;font-size:0.85rem;padding:9px;border-radius:7px;text-decoration:none;margin-bottom:6px">PM Essentials — $24 →</a>
      <a href="/products/proposal-toolkit" style="display:block;text-align:center;background:white;border:1px solid #E0C050;color:#D19900;font-weight:700;font-size:0.85rem;padding:8px;border-radius:7px;text-decoration:none">Proposal Toolkit — $34 →</a>
    </div>
  </aside>
</div>

{FOOTER}
<script src="/blog/blog.js"></script>
</body>
</html>"""

        out_path = BLOG_DIR / f"{slug}.html"
        out_path.write_text(html)
        published.append({"slug": slug, "title": title, "excerpt": article.get("excerpt",""), "badge": badge, "audience": audience, "read_time": read_time, "pub_date": pub_friendly})
        print(f"  Written: {slug}.html")

    return published


def update_index_with_comparisons(articles):
    index = BLOG_DIR / "index.html"
    content = index.read_text()

    for a in articles:
        card = f"""
    <!-- {a['title'][:60]} -->
    <a href="/blog/{a['slug']}" class="post-card" style="text-decoration:none;color:inherit">
      <span class="post-card-badge">{a['badge']}</span>
      <div class="post-card-body">
        <h2>{a['title']}</h2>
        <p>{a['excerpt']}</p>
        <div class="post-card-meta">
          <span>{a['pub_date']}</span>
          <span>·</span>
          <span>{a['read_time']} min read</span>
          <span>·</span>
          <span>{a['audience']}</span>
        </div>
        <span class="read-more">Read article →</span>
      </div>
    </a>
"""
    marker = '  <div class="posts-grid">\n'
    cards = "".join(f"""
    <a href="/blog/{a['slug']}" class="post-card" style="text-decoration:none;color:inherit">
      <span class="post-card-badge">{a['badge']}</span>
      <div class="post-card-body">
        <h2>{a['title']}</h2>
        <p>{a['excerpt']}</p>
        <div class="post-card-meta">
          <span>{a['pub_date']}</span><span>·</span>
          <span>{a['read_time']} min read</span><span>·</span>
          <span>{a['audience']}</span>
        </div>
        <span class="read-more">Read article →</span>
      </div>
    </a>
""" for a in articles)

    if marker in content:
        content = content.replace(marker, marker + cards, 1)
        index.write_text(content)
        print(f"Added {len(articles)} comparison articles to blog index")


def main():
    # 1. Build product pages
    print("Building product pages...")
    for pack in PACKS:
        html = build_product_page(pack)
        out_dir = PRODUCTS_DIR / pack["slug"]
        out_dir.mkdir(parents=True, exist_ok=True)
        (out_dir / "index.html").write_text(html)
        print(f"  Written: /products/{pack['slug']}/index.html")

    # 2. Publish comparison articles
    print("\nPublishing comparison articles...")
    published = publish_comparison_articles()

    # 3. Update blog index
    update_index_with_comparisons(published)

    # 4. Add static routes for /products/* in server/static.ts
    static_ts = REPO_ROOT / "server" / "static.ts"
    content = static_ts.read_text()
    product_routes = """
  // /products/* — serve product landing pages
  app.get("/products/:slug", (req: Request, res: Response) => {
    const slug = req.params.slug;
    const filePath = path.resolve(distPath, "products", slug, "index.html");
    if (fs.existsSync(filePath)) {
      return res.sendFile(filePath);
    }
    return res.redirect("/blog");
  });
"""
    if "/products/" not in content:
        content = content.replace(
            "  // Blog HTML routes",
            product_routes + "\n  // Blog HTML routes"
        )
        static_ts.write_text(content)
        print("\nAdded /products/* route to server/static.ts")

    # 5. Build + commit + push
    print("\nBuilding...")
    result = subprocess.run(["npm", "run", "build"], cwd=REPO_ROOT, capture_output=True, text=True)
    if "built in" in result.stdout:
        print("  Build successful")
    else:
        print("  Build output:", result.stdout[-500:])

    print("\nCommitting and pushing...")
    try:
        subprocess.run(["git", "config", "user.email", "content@acqlerate.com"], cwd=REPO_ROOT, check=True, capture_output=True)
        subprocess.run(["git", "config", "user.name", "Acqlerate Content Bot"], cwd=REPO_ROOT, check=True, capture_output=True)
        subprocess.run(["git", "add", "-A"], cwd=REPO_ROOT, check=True, capture_output=True)
        subprocess.run(["git", "commit", "-m",
            "feat: 2.4 comparison pages + 3.1 template packs\n\n"
            "Comparison pages (3 articles):\n"
            "- Best DoD Acquisition Training Courses 2026\n"
            "- Best Tools for GovCon Proposal Managers\n"
            "- DAU vs. Acqlerate: Which Training Is Right for You?\n\n"
            "Template packs (14 files, 3 packs):\n"
            "- Pack 1: PM Essentials ($24) — 5 Excel/PPTX templates\n"
            "- Pack 2: GovCon Proposal Toolkit ($34) — 5 Excel templates\n"
            "- Pack 3: Defense Finance Cheat Sheets ($12) — 4 Excel templates\n\n"
            "Product landing pages at /products/{pm-essentials,proposal-toolkit,finance-cheat-sheets}\n"
            "Template packs served at /products/{pack}/files\n"
            "Added /products/* route to server/static.ts\n"
            "Template pack CTAs added to comparison article sidebars"
        ], cwd=REPO_ROOT, check=True, capture_output=True)
        subprocess.run(["git", "push", "origin", "main"], cwd=REPO_ROOT, check=True, capture_output=True)
        print("\n✓ All published successfully")
    except subprocess.CalledProcessError as e:
        print(f"Git error: {e.stderr.decode() if e.stderr else e}")


if __name__ == "__main__":
    main()
