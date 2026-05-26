#!/usr/bin/env python3
"""
Acqlerate Blog Post Generator
Runs Tuesdays (news) and Saturdays (educational) via cron.

Every post MUST contain:
  1. Email capture CTA (mid-article inline block + sidebar form)
  2. Internal link to the relevant Acqlerate module (inline text + teal CTA card)
  3. Comparison table OR downloadable template (topic-dependent, always one or the other)
"""

import os, re, sys, json, random, subprocess
from datetime import datetime, timezone
from pathlib import Path
import urllib.request

# ── Config ────────────────────────────────────────────────────────────────────
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "AIzaSyCb5cYnJh16swSRh7C1q7nEipBfgKAaW18")
BLOG_DIR       = Path(__file__).parent.parent / "client" / "public" / "blog"
REPO_ROOT      = Path(__file__).parent.parent

# ── Module map: module ID → display title + lesson area ─────────────────────
MODULES = {
    "foundations": {
        "title": "DoD Acquisitions Foundations",
        "desc":  "Start here — the complete overview of how DoD buys things, from FAR to program office.",
    },
    "finance": {
        "title": "Defense Finance & Budgeting",
        "desc":  "PPBE, color of money, EVM, appropriations, and the fiscal mechanics behind every program.",
    },
    "contracts": {
        "title": "Defense Contracting Fundamentals",
        "desc":  "Contract types, source selection, IDIQs, GWACs, modifications, and the COR role.",
    },
    "data": {
        "title": "Data Analytics for Program Managers",
        "desc":  "EVM deep dives, IPMR formats, KPIs, and data-driven decision making.",
    },
    "capture": {
        "title": "Capture Management & Business Development",
        "desc":  "BD lifecycle, proposal writing, win strategy, and the source selection process from both sides.",
    },
    "operations": {
        "title": "Program Operations & Leadership",
        "desc":  "Risk management, stakeholder comms, CMMI, subcontractor management, and career roadmaps.",
    },
}

# ── Topic pool ────────────────────────────────────────────────────────────────
# Tuesday = news/policy   Saturday = educational/how-to
# Each entry: search query, article angle, badge, audience, relevant module,
#             table_type ("comparison"|"template"|"checklist"), table_title, template_rows

TOPIC_POOL_NEWS = [
    {
        "search": "DoD defense acquisition major contract awards 2026",
        "angle": "What recent large DoD contract awards reveal about how — and where — the Pentagon is spending money right now",
        "badge": "News & Analysis", "audience": "USG & Contractor",
        "module": "contracts",
        "table_type": "comparison",
        "table_title": "Contract Types in Recent Major Awards",
        "table_headers": ["Program Area", "Typical Contract Type", "Why the Government Chose It", "What Contractors Need"],
        "table_rows": [
            ["Large IT Systems", "IDIQ / GWAC task order", "Speed to award; pre-competed pool", "Vehicle access + task order win strategy"],
            ["Weapons Systems EMD", "Cost-Plus Incentive Fee (CPIF)", "High tech risk; share savings", "DCAA-accepted accounting system"],
            ["Services & Sustainment", "Firm Fixed Price (FFP)", "Well-defined scope; low risk", "Competitive pricing + CPARS history"],
            ["Rapid Prototyping", "Other Transaction (OT)", "Bypass FAR; attract non-traditionals", "Non-traditional partner or innovative tech"],
        ],
    },
    {
        "search": "NDAA 2026 National Defense Authorization Act acquisition reform changes",
        "angle": "NDAA 2026 acquisition provisions every defense professional needs to know — and what changes in practice",
        "badge": "Policy Update", "audience": "USG & Contractor",
        "module": "foundations",
        "table_type": "comparison",
        "table_title": "Key NDAA 2026 Acquisition Changes at a Glance",
        "table_headers": ["Provision", "What It Changes", "Who It Affects", "Effective When"],
        "table_rows": [
            ["OTA threshold increase", "Raises prototype OT ceiling", "Non-traditional contractors", "FY2026"],
            ["Small business goals", "Adjusts SB prime contract targets", "Large primes, small subs", "FY2026"],
            ["CMMC implementation", "Accelerates CMMC Level 2 rollout", "All DIB contractors", "FY2026–2027"],
            ["Acquisition workforce", "New DAWIA alternative certification paths", "GS-1102 / PM workforce", "FY2026"],
        ],
    },
    {
        "search": "Pentagon Other Transaction Authority OTA prototype agreement 2026",
        "angle": "How DoD is using Other Transaction Authority in 2026 — and what the surge in OTAs means for defense contractors",
        "badge": "Contracting", "audience": "Contractor",
        "module": "contracts",
        "table_type": "comparison",
        "table_title": "OTA vs. Traditional FAR Contract",
        "table_headers": ["Factor", "Other Transaction (OT)", "Traditional FAR Contract"],
        "table_rows": [
            ["Applicable regulations", "Not subject to FAR/DFARS", "Full FAR + DFARS"],
            ["Cost accounting (CAS)", "Not required", "Required on cost-type above threshold"],
            ["Competition", "Flexible — can be sole source", "Full and open required (FAR Part 6)"],
            ["Best for", "Prototyping, non-traditional contractors, rapid delivery", "Production, recurring services, established vendors"],
            ["Primary risk", "Limited protest rights; less standard oversight", "Administrative burden; slower award timeline"],
        ],
    },
    {
        "search": "defense budget continuing resolution impact acquisition programs 2026",
        "angle": "Continuing resolutions: why budget gridlock is one of the biggest hidden risks to your defense program",
        "badge": "Finance", "audience": "USG Personnel",
        "module": "finance",
        "table_type": "comparison",
        "table_title": "CR vs. Full Appropriation — Impact on Programs",
        "table_headers": ["Factor", "Continuing Resolution", "Full Appropriation"],
        "table_rows": [
            ["Funding level", "Prior year rate (capped)", "Full authorized amount"],
            ["New program starts", "Generally prohibited", "Permitted"],
            ["Contract awards", "Limited to prior-year scope", "Full scope permitted"],
            ["Planning certainty", "Low — month-to-month risk", "High — full-year visibility"],
            ["PM Action Required", "Rate contracts, avoid new starts", "Execute to plan"],
        ],
    },
    {
        "search": "CMMC cybersecurity maturity model certification defense contractors requirements 2026",
        "angle": "CMMC in 2026: the compliance clock is ticking and most defense contractors are not ready",
        "badge": "Compliance", "audience": "Contractor",
        "module": "contracts",
        "table_type": "comparison",
        "table_title": "CMMC Level Requirements at a Glance",
        "table_headers": ["Level", "Applies To", "Key Requirement", "Assessment Type"],
        "table_rows": [
            ["Level 1 (Foundational)", "All DoD contractors handling FCI", "17 basic safeguarding practices", "Annual self-assessment"],
            ["Level 2 (Advanced)", "Contractors handling CUI", "110 NIST SP 800-171 practices", "Triennial C3PAO assessment"],
            ["Level 3 (Expert)", "Contractors on highest-priority programs", "110 + NIST SP 800-172 practices", "Government-led assessment (DCSA)"],
        ],
    },
    {
        "search": "GAO bid protest sustained government defense acquisition 2026",
        "angle": "The most common reasons the government loses bid protests — and what every acquisition professional should do about it",
        "badge": "Source Selection", "audience": "USG & Contractor",
        "module": "capture",
        "table_type": "comparison",
        "table_title": "Top Sustained Protest Grounds (GAO Annual Report)",
        "table_headers": ["Protest Ground", "What Went Wrong", "Fix for Government", "Fix for Contractors"],
        "table_rows": [
            ["Flawed evaluation", "SSEB ratings inconsistent with record", "Document every strength/weakness per M", "Submit proposals SSEB can quote directly"],
            ["Unequal treatment", "Different standards applied to offerors", "Apply identical process to all", "Request debrief; compare to Section M"],
            ["Past performance", "Improperly discounted relevant past perf", "Use neutral relevancy determination", "Submit detailed, specific PPQs"],
            ["Price/cost analysis", "Price reasonableness not documented", "Document methodology in selection record", "Price realistically; explain basis of estimate"],
        ],
    },
    {
        "search": "defense acquisition workforce shortage contracting officer GS-1102 vacancy 2026",
        "angle": "The defense acquisition workforce is understaffed — and that's creating opportunity for smart career changers",
        "badge": "Career", "audience": "Career Changer",
        "module": "operations",
        "table_type": "comparison",
        "table_title": "DoD Acquisition Career Paths Compared",
        "table_headers": ["Path", "Entry Point", "Certifications Needed", "Typical Starting Salary", "Growth Trajectory"],
        "table_rows": [
            ["Government PM (GS-1102)", "GS-9/11 contract specialist", "DAWIA Level I → III", "$65K–$85K entry", "→ GS-15 PM / SES"],
            ["Contractor PM", "Junior PM or analyst role", "PMP, DAWIA helpful", "$75K–$95K entry", "→ Sr. PM / BD / Exec"],
            ["Contracting Officer", "GS-1102 entry level", "DAWIA Contracting Level I-III + Warrant", "$60K–$85K entry", "→ PCO / ACO / SES"],
            ["Capture Manager", "BD analyst or proposal writer", "Shipley, APMP", "$85K–$115K", "→ VP BD / SVP Growth"],
        ],
    },
    {
        "search": "DoD small business set-aside defense contracts SDVOSB WOSB 8a 2026",
        "angle": "Small business set-asides in defense: the rules, the socioeconomic programs, and how to compete effectively",
        "badge": "Contracting", "audience": "Contractor",
        "module": "contracts",
        "table_type": "comparison",
        "table_title": "DoD Small Business Set-Aside Programs",
        "table_headers": ["Program", "Eligibility", "Annual Goal (% of prime $)", "Best Vehicles to Target"],
        "table_rows": [
            ["Small Business (SB)", "≤ size standard for NAICS code", "23%", "OASIS+ SB, SEWP V SB, GSA MAS"],
            ["8(a) Business Development", "SBA-certified; economically disadvantaged", "5%", "8(a) STARS III, agency 8(a) contracts"],
            ["Service-Disabled Veteran (SDVOSB)", "Veteran with service-connected disability, ≥51% owned", "3%", "VA VETS 2, OASIS+ SDVOSB pool"],
            ["Women-Owned (WOSB)", "≥51% women-owned; certain NAICS codes", "5%", "OASIS+ WOSB, SEWP V WOSB"],
            ["HUBZone", "≥35% employees in HUBZone area", "3%", "OASIS+ HUBZone, agency HUBZone vehicles"],
        ],
    },
]

TOPIC_POOL_EDUCATIONAL = [
    {
        "search": "earned value management EVM CPI SPI defense program basics",
        "angle": "Earned Value Management explained plainly — the numbers every defense PM watches and what they actually tell you",
        "badge": "Program Management", "audience": "USG Personnel",
        "module": "data",
        "table_type": "comparison",
        "table_title": "EVM Metrics Quick Reference",
        "table_headers": ["Metric", "Formula", "Means", "Red Flag"],
        "table_rows": [
            ["CPI (Cost Performance Index)", "EV ÷ AC", "Cost efficiency — how much work per dollar spent", "< 0.90 for 3+ months"],
            ["SPI (Schedule Performance Index)", "EV ÷ PV", "Schedule efficiency — how much work vs. plan", "< 0.90 and on critical path"],
            ["VAC (Variance at Completion)", "BAC − EAC", "Projected over/underrun at contract end", "Growing negative month-over-month"],
            ["EAC (Estimate at Completion)", "BAC ÷ CPI", "Most reliable final cost forecast", "Diverges from contractor's own EAC"],
        ],
    },
    {
        "search": "DoD PPBE planning programming budgeting execution defense budget process",
        "angle": "The Pentagon's budget process in plain English — why your program needs money years before a dollar is spent",
        "badge": "Finance", "audience": "USG & Contractor",
        "module": "finance",
        "table_type": "comparison",
        "table_title": "PPBE Cycle at a Glance",
        "table_headers": ["Phase", "Who Owns It", "Key Output", "Timeframe"],
        "table_rows": [
            ["Planning", "OSD / Joint Chiefs", "Defense Planning Guidance (DPG)", "Year N-2"],
            ["Programming", "Services / Agencies", "Program Objective Memorandum (POM)", "Year N-2"],
            ["Budgeting", "OSD Comptroller / OMB", "President's Budget Request", "Year N-1"],
            ["Execution", "Program Offices / Comptrollers", "Actual obligations & expenditures", "Year N"],
        ],
    },
    {
        "search": "IDIQ indefinite delivery indefinite quantity task order defense contracting",
        "angle": "IDIQs and task orders: why most of the defense market runs through these vehicles — and how to actually win on them",
        "badge": "Contracting", "audience": "Contractor",
        "module": "contracts",
        "table_type": "comparison",
        "table_title": "Single Award vs. Multiple Award IDIQ",
        "table_headers": ["Factor", "Single Award IDIQ", "Multiple Award IDIQ (MAIDIQ)"],
        "table_rows": [
            ["Post-award competition", "None — one contractor gets all orders", "Fair opportunity required per task order"],
            ["Government risk", "Higher — no competitive pressure", "Lower — ongoing competition keeps prices fair"],
            ["Contractor upside", "Full ceiling if performing well", "Share of ceiling; must keep winning TO competitions"],
            ["Typical use", "Highly specialized; incumbent-heavy", "Standard services; broad capability pools"],
            ["Examples", "LOGCAP IV, some systems engineering IDIQs", "OASIS+, SEWP V, ALLIANT 3, agency IDIQs"],
        ],
    },
    {
        "search": "defense acquisition program manager career path DAWIA certification",
        "angle": "What it actually takes to become a defense program manager — the certifications, the experience path, and the realistic timeline",
        "badge": "Career", "audience": "Career Changer",
        "module": "operations",
        "table_type": "comparison",
        "table_title": "DAWIA PM Certification Requirements",
        "table_headers": ["Level", "Experience Required", "Training Required", "What It Unlocks"],
        "table_rows": [
            ["Level I (Practitioner)", "1 year in acquisition", "DAU ACQ 101 + 202", "Junior PM billets"],
            ["Level II (Advanced)", "2 years in acquisition", "Level I + ACQ 203 + electives", "Mid-level PM positions"],
            ["Level III (Expert)", "4 years in acquisition", "Level II + ACQ 404 + continuous learning", "ACAT II/III PM billets; PEO staff"],
        ],
    },
    {
        "search": "ACAT acquisition category DoD program oversight milestone decision authority",
        "angle": "ACAT levels: why the category your program sits in determines almost everything about how it's managed and overseen",
        "badge": "Foundations", "audience": "USG Personnel",
        "module": "foundations",
        "table_type": "comparison",
        "table_title": "ACAT Level Decision Matrix",
        "table_headers": ["Level", "Dollar Threshold (PAUC)", "Milestone Decision Authority", "Key Oversight Requirements"],
        "table_rows": [
            ["ACAT I (MDAP)", "> $480M R&D or > $2.79B procurement", "USD(A&S) or CAE", "DAB review, CAPE ICE, Congressional reporting, Nunn-McCurdy"],
            ["ACAT II", "$185M–$480M R&D or $1.08B–$2.79B procurement", "CAE (Service SAE)", "Milestone reviews, APB, CAPE assistance"],
            ["ACAT III", "Below ACAT II thresholds", "Designated MDA (PEO or lower)", "Streamlined oversight; less external review"],
            ["ACAT IV", "Lowest dollar programs", "Program office level", "Minimal — internal reviews only"],
        ],
    },
    {
        "search": "defense contractor proposal writing win strategy RFP Section L Section M",
        "angle": "Why most defense proposals lose before they're written — and the Section L vs. Section M discipline that separates winners from losers",
        "badge": "Capture Management", "audience": "Contractor",
        "module": "capture",
        "table_type": "template",
        "table_title": "Proposal Writing Discipline — L vs. M Mapping Template",
        "table_headers": ["Section M Factor", "Section M Weight/Sub-factors", "Section L Instruction", "Your Response Strategy"],
        "table_rows": [
            ["Technical Approach", "List sub-factors here", "List L instruction here", "Address each sub-factor with a discriminating element"],
            ["Management Approach", "List sub-factors here", "List L instruction here", "Show org chart, key personnel, PM methodology"],
            ["Past Performance", "Recency + relevance + rating", "Up to 3 references via PPQ form", "Select contracts with highest CPARS ratings"],
            ["Price/Cost", "Price reasonableness", "No page limit; completed cost model", "Price to win, document assumptions clearly"],
        ],
    },
    {
        "search": "cost plus fixed price contract types defense selection factors",
        "angle": "Cost-plus vs. fixed-price: which contract type is right for which situation, and why the government cares so much about the choice",
        "badge": "Contracting", "audience": "USG & Contractor",
        "module": "contracts",
        "table_type": "comparison",
        "table_title": "Contract Type Selection Guide",
        "table_headers": ["Contract Type", "Risk Allocation", "Best Used When", "Contractor Upside/Downside"],
        "table_rows": [
            ["Firm Fixed Price (FFP)", "All on contractor", "Well-defined scope; low technical risk", "Full profit if efficient; loss if over budget"],
            ["Fixed Price Incentive (FPIF)", "Shared up to ceiling", "Moderate risk; want to incentivize efficiency", "Earn more if under target cost"],
            ["Cost Plus Fixed Fee (CPFF)", "All on government", "High tech risk; R&D; requirements unclear", "Low profit; no downside; DCAA oversight"],
            ["Cost Plus Incentive Fee (CPIF)", "Shared via share ratio", "High risk with measurable outcomes", "Earn more fee for better performance"],
            ["Time & Materials (T&M)", "Mostly on government", "Uncertain hours; labor-intensive services", "Billed at ceiling rates; ceiling is max"],
        ],
    },
    {
        "search": "DoD JCIDS requirements process capability gap warfighter needs",
        "angle": "JCIDS explained: how the military decides what it needs — and why understanding requirements is the foundation of everything in acquisition",
        "badge": "Foundations", "audience": "USG Personnel",
        "module": "foundations",
        "table_type": "comparison",
        "table_title": "JCIDS Requirements Documents",
        "table_headers": ["Document", "Phase", "Purpose", "Key Content"],
        "table_rows": [
            ["Initial Capabilities Document (ICD)", "Pre-Milestone A (MSA)", "Documents the capability gap and potential approaches", "Mission need, gap analysis, potential solutions"],
            ["Capability Development Document (CDD)", "Pre-Milestone B (TMRR)", "Defines KPPs, KSAs, and APAs for the solution", "Key Performance Parameters; threshold/objective values"],
            ["Capability Production Document (CPD)", "Pre-Milestone C", "Defines production-specific performance parameters", "Production KPPs; IOT&E criteria"],
        ],
    },
]


def gemini_generate(prompt: str) -> str:
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={GEMINI_API_KEY}"
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {"temperature": 0.7, "maxOutputTokens": 8192},
    }
    data = json.dumps(payload).encode("utf-8")
    req  = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=120) as resp:
            result = json.loads(resp.read())
            return result["candidates"][0]["content"]["parts"][0]["text"]
    except Exception as e:
        print(f"Gemini error: {e}"); sys.exit(1)


def build_comparison_table(title: str, headers: list, rows: list) -> str:
    head_cells = "".join(f"<th>{h}</th>" for h in headers)
    body_rows  = ""
    for row in rows:
        cells = "".join(f"<td>{c}</td>" for c in row)
        body_rows += f"      <tr>{cells}</tr>\n"
    return f"""
<h3>{title}</h3>
<table class="comparison-table">
  <thead><tr>{head_cells}</tr></thead>
  <tbody>
{body_rows}  </tbody>
</table>
"""


def build_template_table(title: str, headers: list, rows: list) -> str:
    """A fillable template table with a download note."""
    head_cells = "".join(f"<th>{h}</th>" for h in headers)
    body_rows  = ""
    for row in rows:
        cells = "".join(f"<td>{c}</td>" for c in row)
        body_rows += f"      <tr>{cells}</tr>\n"
    return f"""
<h3>{title}</h3>
<div class="callout">
  <p><strong>Use this template:</strong> Copy these columns into a spreadsheet before your next proposal. Fill in the left two columns from the RFP, then the right two columns from your win strategy session. Every scored section must have at least one discriminating element in column four.</p>
</div>
<table class="comparison-table">
  <thead><tr>{head_cells}</tr></thead>
  <tbody>
{body_rows}  </tbody>
</table>
"""


def build_email_capture_block(form_id: str, success_id: str, source: str) -> str:
    """Mid-article inline email capture block."""
    return f"""
<div style="background:linear-gradient(135deg,#01696F 0%,#0C4E54 100%);border-radius:14px;padding:28px 32px;margin:40px 0;color:white;">
  <div style="font-size:0.7rem;font-weight:800;text-transform:uppercase;letter-spacing:0.1em;opacity:0.7;margin-bottom:6px">Free Starter Kit</div>
  <h3 style="font-size:1.1rem;font-weight:800;margin:0 0 8px;color:white">Get the Acqlerate Acquisition Starter Kit — Free</h3>
  <p style="font-size:0.9rem;opacity:0.9;margin:0 0 18px;line-height:1.5">Key terms, ACAT levels, career roadmaps, and the 5 most common acquisition mistakes. Tailored to your role — USG, contractor, or career changer.</p>
  <form id="{form_id}" onsubmit="submitSidebarLead(event,'{form_id}','{success_id}')" style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">
    <input type="email" placeholder="your@email.com" required style="padding:10px 14px;border:none;border-radius:8px;font-size:0.9rem;font-family:inherit;width:240px;max-width:100%;outline:none;color:#1A1A1A" />
    <button type="submit" style="background:white;color:#01696F;border:none;cursor:pointer;font-size:0.9rem;font-weight:800;padding:10px 20px;border-radius:8px;font-family:inherit;white-space:nowrap">Send It Free →</button>
  </form>
  <div id="{success_id}" style="font-size:0.875rem;font-weight:700;color:rgba(255,255,255,0.9);display:none;margin-top:10px">✓ Check your inbox — it's on its way.</div>
</div>
"""


def build_module_cta(module_key: str, context_note: str) -> str:
    """Inline module deep-link CTA block."""
    mod = MODULES.get(module_key, MODULES["foundations"])
    return f"""
<div style="border:2px solid var(--teal);border-radius:14px;padding:24px 28px;margin:40px 0;background:var(--teal-light, #E6F2F3);">
  <div style="font-size:0.7rem;font-weight:800;text-transform:uppercase;letter-spacing:0.1em;color:var(--teal);margin-bottom:6px">Learn More on Acqlerate</div>
  <h3 style="font-size:1.05rem;font-weight:800;color:#0D1B2A;margin:0 0 8px">Module: {mod['title']}</h3>
  <p style="font-size:0.9rem;color:#374151;margin:0 0 16px;line-height:1.5">{context_note} {mod['desc']}</p>
  <a href="/app#/auth" style="display:inline-block;background:var(--teal, #01696F);color:white;font-weight:800;font-size:0.875rem;padding:10px 20px;border-radius:8px;text-decoration:none">Start This Module Free →</a>
</div>
"""


def generate_article_body(topic: dict, research: str, pub_date: str) -> tuple:
    """Ask Gemini for the article body + title + deck. Returns (title, deck, body_html)."""
    
    table_instruction = (
        "Include a comparison table where most helpful (use <table class='comparison-table'>)."
        if topic["table_type"] == "comparison"
        else "Include a practical template table readers can copy and use (use <table class='comparison-table'>)."
    )
    
    prompt = f"""You are a senior writer for Acqlerate — a defense acquisitions education platform at acqlerate.com.

Write a blog post about: {topic['angle']}

TARGET AUDIENCE: {topic['audience']}
PUBLICATION DATE: {pub_date}

RESEARCH TO DRAW FROM:
{research}

REQUIREMENTS:
1. Title: Compelling and specific (under 85 chars). Return it on line 1 as plain text, no formatting.
2. Deck: 1-sentence subtitle (under 160 chars). Return it on line 2 as plain text.  
3. Body: Start on line 3. Use <h2> section headers, <p> paragraphs, <ul>/<li> for bullets.
4. {table_instruction}
5. Include at least one <div class="callout"><p>...</p></div> with a key insight.
6. 4-6 sections. Total 800-1200 words of body text.
7. DO NOT include a "Start free at acqlerate.com" section — that will be added programmatically.
8. DO NOT use <h1> tags — the title is added separately.
9. Write like a knowledgeable colleague explaining something important over coffee. Direct, practical, zero fluff.
10. Every section should have a "so what" — connect facts to what the reader should actually DO or KNOW.

Start with the title on line 1, deck on line 2, then the body HTML."""
    
    raw = gemini_generate(prompt)
    lines = raw.strip().split('\n')
    
    # Parse title from line 1
    title = re.sub(r'[#*`]', '', lines[0]).strip().strip('"').strip("'")
    
    # Parse deck from line 2
    deck = ""
    if len(lines) > 1:
        deck = re.sub(r'[#*`]', '', lines[1]).strip().strip('"').strip("'")
    
    # Everything else is body
    body = '\n'.join(lines[2:]).strip()
    
    # Remove any stray h1 tags
    body = re.sub(r'<h1[^>]*>.*?</h1>', '', body, flags=re.DOTALL | re.IGNORECASE)
    
    # If title/deck look wrong (too long or contain HTML), regenerate
    if len(title) > 120 or '<' in title:
        title_raw = gemini_generate(f"Write ONE blog post title under 85 characters for this content. Return ONLY the title, no quotes:\n\n{body[:400]}")
        title = title_raw.strip().strip('"').strip("'")
    if len(deck) > 200 or '<' in deck:
        deck_raw = gemini_generate(f"Write ONE subtitle sentence under 160 characters for a blog post titled '{title}'. Return ONLY the sentence, no quotes.")
        deck = deck_raw.strip().strip('"').strip("'")
    
    return title, deck, body


def slugify(text: str) -> str:
    s = text.lower()
    s = re.sub(r'[^\w\s-]', '', s)
    s = re.sub(r'[\s_-]+', '-', s)
    return s.strip('-')[:80]


def get_read_time(html: str) -> int:
    text = re.sub(r'<[^>]+>', ' ', html)
    return max(6, round(len(text.split()) / 200))


def build_sidebar_capture(form_id: str, success_id: str) -> str:
    return f"""
    <div class="sidebar-capture" style="margin-top:24px;background:var(--gold-bg);border:1.5px solid #F0D060;border-radius:12px;padding:20px">
      <div style="font-size:0.7rem;font-weight:800;text-transform:uppercase;letter-spacing:0.08em;color:var(--gold);margin-bottom:6px">Free Resource</div>
      <p style="font-size:0.85rem;color:var(--text);margin:0 0 12px;line-height:1.5">Acquisition Starter Kit — tailored to your role. Key terms, career paths, the 5 biggest mistakes.</p>
      <form id="{form_id}" onsubmit="submitSidebarLead(event,'{form_id}','{success_id}')" style="display:flex;flex-direction:column;gap:8px">
        <input type="email" placeholder="your@email.com" required style="padding:9px 12px;border:1.5px solid #E0C050;border-radius:7px;font-size:0.85rem;font-family:inherit;outline:none" />
        <button type="submit" style="background:var(--gold);color:white;border:none;cursor:pointer;font-size:0.85rem;font-weight:700;padding:9px;border-radius:7px;font-family:inherit">Get Starter Kit →</button>
      </form>
      <div id="{success_id}" style="font-size:0.8rem;font-weight:700;color:var(--teal);display:none;margin-top:6px">✓ Check your inbox!</div>
    </div>
"""


def assemble_post(title: str, deck: str, body_html: str, topic: dict,
                  pub_date: str, slug: str, read_time: int) -> str:
    
    formatted_date = datetime.strptime(pub_date, "%Y-%m-%d").strftime("%B %Y")
    mod = MODULES.get(topic["module"], MODULES["foundations"])
    
    # Build the hard-required elements
    table_html = build_comparison_table(
        topic["table_title"], topic["table_headers"], topic["table_rows"]
    ) if topic["table_type"] in ("comparison", "template") else build_template_table(
        topic["table_title"], topic["table_headers"], topic["table_rows"]
    )
    
    # If body already has a comparison table from AI, keep it and add ours after first h2
    # Insert: email capture mid-way, module CTA, and our enforced table
    # Find a good injection point — after the 2nd <h2>
    h2_positions = [m.start() for m in re.finditer(r'<h2>', body_html)]
    
    if len(h2_positions) >= 2:
        inject_at = h2_positions[1]
        # Insert email capture before 2nd h2
        body_html = (
            body_html[:inject_at]
            + build_email_capture_block("midCapture", "midSuccess", f"blog_{slug}")
            + body_html[inject_at:]
        )
    else:
        # Append to end of body if not enough h2s
        body_html += build_email_capture_block("midCapture", "midSuccess", f"blog_{slug}")
    
    # Insert module CTA before last h2 (or at end)
    h2_positions = [m.start() for m in re.finditer(r'<h2>', body_html)]
    if h2_positions:
        last_h2 = h2_positions[-1]
        context_note = f"This post touches on concepts covered in depth in the {mod['title']} module."
        body_html = (
            body_html[:last_h2]
            + build_module_cta(topic["module"], context_note)
            + body_html[last_h2:]
        )
    
    # Append the enforced table at the end of body (before the closing CTA)
    # Only append if the AI didn't already include a similar one
    if "comparison-table" not in body_html:
        body_html += "\n" + table_html
    else:
        # AI included a table — append ours with a different heading
        extra_title = topic["table_title"].replace("at a Glance", "Reference").replace("Guide", "Summary")
        body_html += "\n" + build_comparison_table(
            extra_title, topic["table_headers"], topic["table_rows"]
        )
    
    # Build table of contents
    h2s = re.findall(r'<h2>(.*?)</h2>', body_html)
    toc_items = "\n".join(
        f'        <li style="font-size:0.8rem;margin-bottom:5px"><a href="#" style="color:var(--teal)">{h}</a></li>'
        for h in h2s[:6]
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
  <meta property="og:url" content="https://acqlerate.com/blog/{slug}" />
  <meta property="og:image" content="https://acqlerate.com/og-image.jpg" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="627" />
  <meta property="og:type" content="article" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:image" content="https://acqlerate.com/og-image.jpg" />
  <link rel="canonical" href="https://acqlerate.com/blog/{slug}" />
  <link rel="shortcut icon" href="/favicon.ico" />
  <link rel="icon" type="image/svg+xml" href="/acqlerate-icon.svg" />
  <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
  <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
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
{body_html}
    </div>

    <!-- Bottom CTA -->
    <div style="background:linear-gradient(135deg,#01696F 0%,#0C4E54 100%);border-radius:16px;padding:32px;margin-top:48px;color:white;">
      <div style="font-size:0.75rem;font-weight:800;text-transform:uppercase;letter-spacing:0.1em;opacity:0.7;margin-bottom:8px">Master Defense Acquisitions</div>
      <h3 style="font-size:1.25rem;font-weight:800;margin-bottom:10px;color:white">Start Free — Six Modules, 34+ Lessons</h3>
      <p style="font-size:0.95rem;opacity:0.9;margin-bottom:20px;line-height:1.6">Built for DoD program managers, contracting officers, and defense contractors. Novice through advanced. The <strong>{mod['title']}</strong> module goes deep on everything covered in this post.</p>
      <a href="/app#/auth" style="display:inline-block;background:white;color:#01696F;font-weight:800;font-size:0.95rem;padding:12px 24px;border-radius:10px;text-decoration:none;margin-right:12px">Start Learning Free →</a>
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

    <!-- Sidebar module link -->
    <div style="background:var(--teal-light,#E6F2F3);border:1.5px solid var(--teal,#01696F);border-radius:12px;padding:20px;margin-top:20px">
      <div style="font-size:0.7rem;font-weight:800;text-transform:uppercase;letter-spacing:0.08em;color:var(--teal);margin-bottom:6px">Relevant Module</div>
      <p style="font-size:0.85rem;font-weight:700;color:#0D1B2A;margin:0 0 6px">{mod['title']}</p>
      <p style="font-size:0.8rem;color:#374151;margin:0 0 14px;line-height:1.4">{mod['desc']}</p>
      <a href="/app#/auth" style="display:block;text-align:center;background:var(--teal,#01696F);color:white;font-weight:700;font-size:0.875rem;padding:9px 14px;border-radius:8px;text-decoration:none">Open This Module →</a>
    </div>

    <!-- Sidebar email capture -->
{build_sidebar_capture("sidebarCapture", "sidebarSuccess")}
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


def add_to_index(slug: str, title: str, excerpt: str, topic: dict, read_time: int) -> None:
    index = BLOG_DIR / "index.html"
    content = index.read_text()
    from datetime import date as _date
    today = _date.today().strftime('%b %-d, %Y')
    card = f"""
    <a href="/blog/{slug}" class="post-card" style="text-decoration:none;color:inherit">
      <div class="post-card-inner">
        <div class="post-meta-top">
          <span class="post-tag">{topic['badge']}</span>
          <span class="post-date">{today}</span>
        </div>
        <h2>{title}</h2>
        <p>{excerpt[:160]}</p>
        <div class="post-footer">
          <span>{read_time} min read</span>
          <span class="read-more">Read →</span>
        </div>
      </div>
    </a>
"""
    marker = '  <div class="posts-grid">\n'
    if marker in content:
        content = content.replace(marker, marker + card, 1)
        index.write_text(content)
        print(f"Added card to index: {title[:60]}")
    else:
        print("WARNING: Could not find posts-grid in index.html")


def git_push(slug: str, title: str) -> bool:
    try:
        for cmd in [
            ["git", "config", "user.email", "blog-bot@acqlerate.com"],
            ["git", "config", "user.name", "Acqlerate Blog Bot"],
            ["git", "add",
             f"client/public/blog/{slug}.html",
             "client/public/blog/index.html"],
            ["git", "commit", "-m", f"blog: publish '{title[:60]}'"],
        ]:
            subprocess.run(cmd, cwd=REPO_ROOT, check=True, capture_output=True)
        # Push using gh auth token — with multiple fallback strategies
        import shutil, os

        token = ""

        # Strategy 1: GH_ENTERPRISE_TOKEN (most reliable in cron environment)
        token = os.environ.get("GH_ENTERPRISE_TOKEN") or ""
        if token:
            print(f"Using GH_ENTERPRISE_TOKEN ({len(token)} chars)")

        # Strategy 2: GH_TOKEN / GITHUB_TOKEN env vars
        if not token:
            token = os.environ.get("GH_TOKEN") or os.environ.get("GITHUB_TOKEN") or ""
            if token:
                print(f"Using GH_TOKEN/GITHUB_TOKEN ({len(token)} chars)")

        # Strategy 3: gh auth token CLI
        if not token:
            gh = shutil.which("gh")
            if gh:
                token_result = subprocess.run([gh, "auth", "token"], capture_output=True, text=True)
                token = token_result.stdout.strip()
                if token:
                    print(f"Using gh auth token ({len(token)} chars)")

        if not token:
            print("No token found from env or gh CLI — push will fail")

        if token:
            result = subprocess.run(
                ["git", "-c", f"http.https://github.com/.extraheader=Authorization: token {token}",
                 "push", "https://github.com/jumpmasterguy/acq-pro.git", "HEAD:main"],
                cwd=REPO_ROOT, capture_output=True
            )
            if result.returncode != 0:
                err = result.stderr.decode() if result.stderr else ""
                print(f"Push failed (token strategy): {err}")
                raise subprocess.CalledProcessError(result.returncode, "git push", stderr=result.stderr)
            print("Push succeeded via token")
        else:
            raise subprocess.CalledProcessError(1, "git push", b"", b"No token available")
        return True
    except subprocess.CalledProcessError as e:
        print(f"Git error: {e.stderr.decode() if e.stderr else e}")
        return False


def main() -> int:
    now       = datetime.now(timezone.utc)
    pub_date  = now.strftime("%Y-%m-%d")
    is_tuesday = now.weekday() == 1

    print(f"Blog post generation — {pub_date} ({'Tuesday/News' if is_tuesday else 'Saturday/Educational'})")

    pool  = TOPIC_POOL_NEWS if is_tuesday else TOPIC_POOL_EDUCATIONAL
    week  = now.isocalendar()[1]
    topic = pool[week % len(pool)]
    print(f"Topic: {topic['angle'][:70]}...")

    # 1. Research
    print("Researching...")
    research_prompt = f"""You are a defense acquisition expert and journalist.
Research this topic and provide current (2025-2026) facts, developments, and context:
{topic['search']}

Provide: specific recent events with dates, key dollar amounts/statistics, practical implications
for defense PMs and contractors, any recent policy changes. Be specific and factual."""
    research = gemini_generate(research_prompt)

    # 2. Generate article
    print("Writing article...")
    title, deck, body_html = generate_article_body(topic, research, pub_date)
    print(f"Title: {title}")

    # 3. Build slug
    slug = slugify(title)
    if not slug: slug = f"defense-acquisition-{pub_date}"
    if (BLOG_DIR / f"{slug}.html").exists(): slug = f"{slug}-{pub_date}"

    read_time = get_read_time(body_html)

    # 4. Assemble full HTML with all required elements
    print("Assembling post...")
    post_html = assemble_post(title, deck, body_html, topic, pub_date, slug, read_time)

    # 5. Write file
    post_path = BLOG_DIR / f"{slug}.html"
    post_path.write_text(post_html)
    print(f"Written: {post_path.name}")

    # 6. Generate excerpt for index card
    excerpt_prompt = f"Write a 1-sentence excerpt (under 160 chars) for a blog index card. Title: {title}. No quotes."
    excerpt = gemini_generate(excerpt_prompt).strip().strip('"').strip("'")

    # 7. Update index
    add_to_index(slug, title, excerpt, topic, read_time)

    # 8. Push
    ok = git_push(slug, title)
    url = f"https://acqlerate.com/blog/{slug}"
    print(f"\n{'✓ Published' if ok else '✗ Written but push failed'}: {url}")
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
