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
sys.path.insert(0, str(Path(__file__).parent))
import diagram
from curriculum_counts import counts as curriculum_counts
from dupe_guard import check as dupe_check, nearest as dupe_nearest, DuplicateTopic


# ── Config ────────────────────────────────────────────────────────────────────
ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY")
if not ANTHROPIC_API_KEY:
    raise SystemExit("ANTHROPIC_API_KEY environment variable is not set. Set it before running this script.")
DUPE_THRESHOLD = float(os.environ.get("DUPE_THRESHOLD", "0.30"))
CLAUDE_MODEL = os.environ.get("CLAUDE_MODEL", "claude-sonnet-5")
WEB_SEARCH_TOOL = os.environ.get("WEB_SEARCH_TOOL", "web_search_20260318")
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

# Topic pools, rebuilt 21 Sep 2026.
#
# The previous 16 topics were ALL subjects the blog already covered, so the
# rotation could only produce duplicates: it made a 4th Section L/M post on
# 13 Sep and a 4th cost-plus post on 19 Sep. Every topic below was scored
# against all 56 live posts with scripts/dupe_guard.py and scores under the
# 0.30 threshold, i.e. genuinely uncovered ground. Scores are noted so the
# next person can see the margin.
#
# The gaps clustered in three areas the blog had never touched: post-award
# execution, audit and accounting mechanics, and intellectual property.
#
# THERE IS NO SEPARATE "USED TOPICS" LEDGER, deliberately. Once a topic is
# published it becomes a live post, so dupe_guard blocks it the next time the
# rotation reaches it, and main() walks past to the next uncovered topic. The
# blog itself is the state. The consequence to plan for: this pool drains at
# about two topics a week, so top it up roughly every two months. When it is
# empty the run fails loudly with the list of what it skipped rather than
# publishing a duplicate.

TOPIC_POOL_NEWS = [
    {
        "search": "government shutdown stop work order 52.242-15 standby costs contractor employees lapse 2026",
        "angle": "Stop work orders in a shutdown: who keeps working and who eats the standby cost",
        "badge": "Finance", "audience": "USG & Contractor",
        "module": "finance",
        "table_type": "comparison",
        "table_title": "What Keeps Running When the Money Stops",  # dupe_guard 0.23
        "table_headers": ["Situation", "Work Continues?", "Who Decides", "What You Do Monday"],
        "table_rows": [
            ["Fully funded contract, work already obligated", "Yes", "Nobody, the money is already yours", "Keep working, keep invoicing"],
            ["Incrementally funded, funds exhausted", "No", "Contracting Officer issues stop work", "Stop, protect the cost, log everything"],
            ["Option not yet exercised when the lapse starts", "No", "Government cannot obligate new money", "Do not start, do not staff up"],
            ["Government site closed, your work is on site", "Usually no", "CO plus the facility", "Ask in writing before assuming"],
        ],
    },
    {
        "search": "suspension and debarment federal contractors SAM exclusions responsibility determination 2026",
        "angle": "Suspension and debarment: how a company loses the right to hold federal contracts, and how it gets it back",
        "badge": "Compliance", "audience": "Contractor",
        "module": "contracts",
        "table_type": "comparison",
        "table_title": "Suspension vs. Proposed Debarment vs. Debarment",  # 0.25
        "table_headers": ["Action", "Trigger", "How Long", "Effect on Existing Work"],
        "table_rows": [
            ["Suspension", "Adequate evidence, indictment pending", "Temporary, pending proceedings", "No new awards, existing work usually continues"],
            ["Proposed debarment", "Notice from the agency official", "Until the decision", "Treated as ineligible while pending"],
            ["Debarment", "Conviction, civil judgment or serious cause", "Generally up to 3 years", "No new awards or options across all agencies"],
            ["Administrative agreement", "Negotiated in place of the above", "Set by the agreement", "Work continues under monitoring"],
        ],
    },
    {
        "search": "technical data rights DFARS 252.227-7013 unlimited government purpose limited rights 2026",
        "angle": "Technical data rights: who owns what you built, and what the government can do with it later",
        "badge": "Contracting", "audience": "Contractor",
        "module": "contracts",
        "table_type": "comparison",
        "table_title": "What Each Data Rights Category Lets the Government Do",  # 0.25
        "table_headers": ["Category", "When It Applies", "Government Can", "Your Exposure"],
        "table_rows": [
            ["Unlimited rights", "Developed with government funds", "Use and release to anyone, including your competitors", "Highest, your design can be recompeted"],
            ["Government purpose rights", "Mixed funding", "Use freely inside government, 5 years before it becomes unlimited", "Time limited, then unlimited"],
            ["Limited rights (data)", "Developed entirely at private expense", "Use in house only, no release without permission", "Lowest, if you can prove the funding"],
            ["Restricted rights (software)", "Private expense software", "One computer, strict conditions", "Lowest, marking must be correct"],
        ],
    },
    {
        "search": "Cost Accounting Standards CAS applicability threshold full modified coverage disclosure statement 2026",
        "angle": "Cost Accounting Standards: when CAS applies to you and what it forces you to change",
        "badge": "Finance", "audience": "Contractor",
        "module": "finance",
        "table_type": "comparison",
        "table_title": "CAS Coverage at a Glance",  # 0.24
        "table_headers": ["Coverage Level", "Roughly When", "What You Must File", "Practical Cost"],
        "table_rows": [
            ["Exempt", "Small business, or only commercial or fixed-price competitive work", "Nothing", "None"],
            ["Modified coverage", "One covered award above the trigger, below the full threshold", "4 standards only", "Moderate, mostly consistency"],
            ["Full coverage", "Larger covered awards in the same year", "All 19 standards plus a Disclosure Statement", "High, changes need cost impact analysis"],
            ["Changed practice", "Any accounting change once covered", "Cost impact proposal", "The government can claw back the difference"],
        ],
    },
    {
        "search": "Service Contract Act wage determination SCA fringe benefits conformance 2026 service contract labor standards",
        "angle": "Service Contract Act wage determinations: the labor rates you do not get to choose",
        "badge": "Compliance", "audience": "Contractor",
        "module": "operations",
        "table_type": "comparison",
        "table_title": "Where Your Labor Rate Actually Comes From",  # 0.12
        "table_headers": ["Situation", "Who Sets the Rate", "Your Room to Move", "If You Get It Wrong"],
        "table_rows": [
            ["Service work, covered labor category", "Department of Labor wage determination", "You may pay more, never less", "Back wages, interest, possible debarment"],
            ["Category not on the determination", "You propose, DOL conforms it", "Some, the comparison must be defensible", "Conformance dispute and repricing"],
            ["Collective bargaining agreement in place", "The CBA carries into the successor contract", "Very little", "Successorship claim"],
            ["Professional exempt staff", "The market", "Full", "Misclassification exposure"],
        ],
    },
    {
        "search": "option exercise notice FAR 52.217-9 52.217-8 extension ordering period 2026",
        "angle": "Option exercise notices: the paperwork between a one year deal and a five year one",
        "badge": "Contracting", "audience": "USG & Contractor",
        "module": "contracts",
        "table_type": "comparison",
        "table_title": "Base Period, Option, Ordering Period: Not the Same Thing",  # 0.26
        "table_headers": ["Term", "What It Is", "What Guarantees You Work", "Common Mistake"],
        "table_rows": [
            ["Base period", "The work the government has committed to now", "Funded and obligated scope", "Assuming the total value is committed"],
            ["Option period", "Government's unilateral right to extend", "Nothing until it is exercised in writing", "Staffing up before the notice arrives"],
            ["Ordering period (IDIQ)", "The window in which task orders may be issued", "Only the guaranteed minimum", "Reading the ceiling as revenue"],
            ["Extension under 52.217-8", "Short continuation at existing rates", "Up to six months, at the government's option", "Treating it as a new option year"],
        ],
    },
    {
        "search": "government furnished property GFP GFE accountability contractor property management system DFARS 245 2026",
        "angle": "Government furnished property: the equipment you never bought and are still accountable for",
        "badge": "Program Management", "audience": "Contractor",
        "module": "operations",
        "table_type": "template",
        "table_title": "GFP Accountability Checklist",  # 0.19
        "table_headers": ["Check", "Why It Matters", "Where It Lives", "Who Owns It"],
        "table_rows": [
            ["Is every item on the GFP attachment?", "Property not listed is not authorized", "Contract attachment", "PM with the CO"],
            ["Is it in your property system of record?", "An approved system is a contract requirement", "Property management system", "Property administrator"],
            ["Are loss, damage and destruction reported?", "Unreported loss becomes your liability", "Written notice to the PA and CO", "PM"],
            ["Is disposition instructed in writing?", "Returning or scrapping without direction is a finding", "Plant clearance", "Property administrator"],
        ],
    },
]

TOPIC_POOL_EDUCATIONAL = [
    {
        "search": "termination for convenience versus default settlement proposal recovery costs FAR 49",
        "angle": "Termination for convenience versus default: what you can actually recover when the work stops",
        "badge": "Contracting", "audience": "Contractor",
        "module": "contracts",
        "table_type": "comparison",
        "table_title": "Two Ways a Contract Ends Early",  # 0.17
        "table_headers": ["", "Termination for Convenience", "Termination for Default"],
        "table_rows": [
            ["Why it happens", "Government no longer needs the work", "You failed to perform"],
            ["What you recover", "Costs incurred, profit on work done, settlement expenses", "Nothing, and you may owe reprocurement costs"],
            ["What you file", "Settlement proposal", "An appeal, if you dispute it"],
            ["First move", "Stop work, protect the costs, start the settlement file", "Get counsel, and check whether the cure notice was proper"],
        ],
    },
    {
        "search": "novation agreement FAR 42.12 successor in interest asset sale size recertification 2026",
        "angle": "Novation: the approval that decides whether your backlog survives an acquisition",
        "badge": "Contracting", "audience": "Contractor",
        "module": "contracts",
        "table_type": "comparison",
        "table_title": "Which Deal Structure Needs What",  # 0.28
        "table_headers": ["What Changed", "Instrument Needed", "Government Can Refuse?", "Watch Out For"],
        "table_rows": [
            ["Legal name only", "Change of name agreement", "No, it is administrative", "Every invoice and SAM record must follow"],
            ["Stock purchase, same legal entity", "Usually nothing", "No", "Facility clearance and size status may still change"],
            ["Asset sale, contracts transfer", "Novation agreement", "Yes, it is discretionary", "Performing before novation is unauthorized"],
            ["Small business bought by a large one", "Novation plus size recertification", "Yes", "Set-aside work can be lost on recertification"],
        ],
    },
    {
        "search": "unallowable costs FAR part 31 entertainment lobbying interest alcohol penalties selected costs",
        "angle": "Unallowable costs: the expenses the government will never reimburse, and why they still cost you twice",
        "badge": "Finance", "audience": "Contractor",
        "module": "finance",
        "table_type": "comparison",
        "table_title": "Common Unallowables and the Allowable Version",  # 0.16
        "table_headers": ["Cost", "Status", "Why", "The Allowable Version"],
        "table_rows": [
            ["Alcohol", "Never allowable", "FAR 31.205-51", "None, exclude it and screen it"],
            ["Entertainment", "Never allowable", "FAR 31.205-14", "Bona fide employee morale, within limits"],
            ["Lobbying", "Never allowable", "FAR 31.205-22", "Technical and factual communication with agencies"],
            ["Interest on borrowing", "Never allowable", "FAR 31.205-20", "None, finance cost stays with you"],
            ["Bid and proposal", "Allowable, indirect", "FAR 31.205-18", "Charge to B&P, never direct to the contract"],
        ],
    },
    {
        "search": "incurred cost submission proposal final indirect rates adequacy DCAA audit FAR 52.216-7",
        "angle": "The incurred cost submission: the annual filing that decides what you actually get to keep",
        "badge": "Finance", "audience": "Contractor",
        "module": "finance",
        "table_type": "template",
        "table_title": "Incurred Cost Submission: What Goes In",  # 0.27
        "table_headers": ["Schedule", "What It Shows", "Where the Numbers Come From", "Where Filings Fail"],
        "table_rows": [
            ["Summary of claimed rates", "Your actual indirect rates for the year", "General ledger, closed and reconciled", "Rates that do not tie to the trial balance"],
            ["Direct cost by contract", "What each contract consumed", "Job cost detail", "Contracts missing, or totals that do not foot"],
            ["Reconciliation to the books", "That the claim matches the accounting system", "Trial balance", "The step people skip, and the top adequacy finding"],
            ["Adjustments for unallowables", "That unallowables were removed", "Screening accounts", "Screening that was never actually run"],
        ],
    },
    {
        "search": "organizational conflict of interest OCI mitigation plan impaired objectivity unequal access biased ground rules",
        "angle": "Organizational conflicts of interest: the work that quietly disqualifies you from the bid you wanted",
        "badge": "Capture Management", "audience": "Contractor",
        "module": "capture",
        "table_type": "comparison",
        "table_title": "The Three Kinds of OCI",  # 0.09
        "table_headers": ["Type", "What Happened", "Example", "Can It Be Mitigated?"],
        "table_rows": [
            ["Biased ground rules", "You helped write the requirement", "You wrote the SOW, now you want to bid it", "Rarely, usually you are out"],
            ["Impaired objectivity", "You would be evaluating your own work", "Advising the government on a system you build", "Sometimes, with firewalls or a subcontractor"],
            ["Unequal access to information", "You hold nonpublic data competitors do not", "Another contract gave you their cost data", "Often, with a firewall and non-disclosure"],
        ],
    },
    {
        "search": "contract data requirements list CDRL DD form 1423 deliverable acceptance data item description",
        "angle": "CDRLs: the deliverable list that quietly decides whether you get paid on time",
        "badge": "Program Management", "audience": "Contractor",
        "module": "operations",
        "table_type": "template",
        "table_title": "Reading a CDRL Before You Commit to It",  # 0.15
        "table_headers": ["Block", "What It Tells You", "The Trap", "What To Ask"],
        "table_rows": [
            ["Data item description", "The format and content required", "A DID can be far heavier than the title suggests", "Have we actually read the DID?"],
            ["Frequency", "How often it is due", "Monthly for five years is 60 deliverables", "Did we price the recurrence?"],
            ["Approval code", "Whether the government approves or just receives", "Approval means rework cycles you do not control", "How many review cycles are assumed?"],
            ["Distribution", "Who gets it", "Wider distribution can affect your data rights markings", "Are our markings right for this list?"],
        ],
    },
    {
        "search": "debriefing enhanced debriefing required FAR 15.506 protest clock timeline questions",
        "angle": "Debriefs: how to get one that tells you something, and why the clock starts the moment it ends",
        "badge": "Source Selection", "audience": "Contractor",
        "module": "capture",
        "table_type": "template",
        "table_title": "Debrief Requests That Get Real Answers",  # 0.18
        "table_headers": ["Ask For", "Why", "What You Usually Get", "Do Not Bother Asking"],
        "table_rows": [
            ["The evaluation of your own proposal", "You are entitled to your own strengths and weaknesses", "Ratings and narrative on your proposal", "The awardee's full proposal"],
            ["The overall ranking and price of the awardee", "Required content in a post-award debrief", "Award price and your relative standing", "Line-item detail of competitors"],
            ["The rationale for the award decision", "Shows how the tradeoff was made", "A summary of the source selection rationale", "The names of individual evaluators"],
            ["Written follow-up questions", "Extends the record and, in enhanced debriefs, the clock", "Written answers", "Anything you did not ask before it closed"],
        ],
    },
]


def _api(payload: dict) -> dict:
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request("https://api.anthropic.com/v1/messages", data=data, headers={
        "content-type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
    })
    with urllib.request.urlopen(req, timeout=600) as resp:
        return json.loads(resp.read())


def _text_of(result: dict) -> str:
    return "".join(b.get("text", "") for b in result.get("content", []) if b.get("type") == "text")


def claude_generate(prompt: str) -> str:
    try:
        return _text_of(_api({
            "model": CLAUDE_MODEL,
            "max_tokens": 8192,
            "messages": [{"role": "user", "content": prompt}],
        }))
    except urllib.error.HTTPError as e:
        print(f"Claude API error {e.code}: {e.read().decode()[:500]}"); sys.exit(1)
    except Exception as e:
        print(f"Claude error: {e}"); sys.exit(1)


def claude_research(prompt: str) -> str:
    """Research with live web search. Falls back to a plain call if the tool fails,
    so a search outage degrades quality instead of killing the run."""
    tools = [{"type": WEB_SEARCH_TOOL, "name": "web_search", "max_uses": 4}]
    messages = [{"role": "user", "content": prompt}]
    collected, searches = [], 0
    try:
        for _ in range(5):
            result = _api({"model": CLAUDE_MODEL, "max_tokens": 8192,
                           "messages": messages, "tools": tools})
            searches += (result.get("usage", {}).get("server_tool_use", {})
                                .get("web_search_requests", 0))
            collected.append(_text_of(result))
            if result.get("stop_reason") != "pause_turn":
                break
            messages.append({"role": "assistant", "content": result["content"]})
        out = "\n".join(t for t in collected if t.strip())
        print(f"Research complete ({searches} web searches)")
        return out
    except urllib.error.HTTPError as e:
        print(f"Web search unavailable ({e.code}): {e.read().decode()[:300]}")
        print("Falling back to research without web access.")
        return claude_generate(prompt)
    except Exception as e:
        print(f"Web search error: {e} - falling back to research without web access.")
        return claude_generate(prompt)


EM_DASH_RANGE = re.compile(r"(\d)\s*[\u2014\u2013]\s*(\d)")

def strip_em_dashes(text: str) -> str:
    """House style: no em dashes. They read as AI-generated."""
    text = EM_DASH_RANGE.sub(r"\1-\2", text)
    text = re.sub(r"\s*[\u2014\u2013]\s*", ", ", text)
    return re.sub(r",\s*,", ",", text)


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
  <h3 style="font-size:1.1rem;font-weight:800;margin:0 0 8px;color:white">Get the Acqlerate Acquisition Starter Kit (Free)</h3>
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



def render_diagram_blocks(body: str) -> str:
    """Turn ```diagram {json}``` fences into rendered SVG figures.

    The model supplies the spec; scripts/diagram.py does the drawing, so a
    diagram cannot ship with an unset fill or a label running off the canvas.
    A spec that will not render is dropped with a warning rather than
    shipping broken: the article still reads without it.

    Any raw <svg> the model emitted anyway is run through the sanitizer,
    which sets the missing fills and text anchors that broke 19 Sep.
    """
    def one(m):
        raw = m.group(1).strip()
        try:
            spec = json.loads(raw)
        except json.JSONDecodeError as e:
            print(f"  diagram: spec is not valid JSON ({e}); dropped")
            return ""
        try:
            svg = diagram.render(spec)
            print(f"  diagram: rendered '{spec.get('kind')}' ok")
            return svg
        except Exception as e:
            print(f"  diagram: {e}; dropped")
            return ""

    body = re.sub(r"```diagram\s*(.+?)```", one, body, flags=re.DOTALL)
    # Belt and braces: if raw SVG slipped through, fix the known failure modes.
    if "<svg" in body:
        body = diagram.sanitize_svg(body)
    return body


def generate_article_body(topic: dict, research: str, pub_date: str) -> tuple:
    """Ask Claude for the article body + title + deck. Returns (title, deck, body_html)."""
    
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
9. VOICE. Write like a knowledgeable colleague explaining something important over coffee.
   Warm, conversational, with real personality and light humor throughout. Acqlerate has a voice;
   it is not a government training portal. Humor stays workplace-appropriate, never silly.
   Plain English always. Explain through concrete mechanics, not abstract definitions. Assume the
   reader may still be learning fundamentals, so do not lean on FAR clause citations or heavy
   regulatory jargon. Respect them: they are professionals, just not all specialists.
10. Every section needs a "so what". Connect facts to what the reader should actually DO or KNOW.
11. NO EM DASHES OR EN DASHES anywhere, in the title, deck or body. They read as AI-generated.
    Use periods, commas or parentheses instead. This rule is absolute.
12. DIAGRAM. The post needs exactly one diagram, but you do NOT draw it. Hand-placed SVG
    coordinates are how the 19 Sep 2026 post shipped with black boxes and a label clipped to
    "$2,00", so the drawing is done by scripts/diagram.py instead. You choose WHAT it shows;
    the renderer handles layout, wrapping, centring and arrows.
    Emit a single fenced block, anywhere after the section it illustrates, exactly like this:

    ```diagram
    {"kind": "flow", "caption": "One line saying what it shows.", ...}
    ```

    Pick the kind that fits the DATA:
      flow      {"kind":"flow","steps":[{"label":str,"value":str?}...],
                 "outcomes":[{"heading":str,"lines":[str,...]}...]}   1-3 steps, 0-3 outcomes
      compare   {"kind":"compare","columns":[{"heading":str,"lines":[str,...]}...]}   2-3 columns
      bars      {"kind":"bars","bars":[{"label":str,"value":number,"display":str}...],"note":str?}   2-6 bars
      timeline  {"kind":"timeline","steps":[{"label":str,"sub":str?}...]}   3-5 steps

    Rules for the spec:
      - Valid JSON on one line. No SVG, no coordinates, no colours, no font sizes.
      - It must carry information from THIS article. Real numbers wherever the topic has them.
      - UNITS ALWAYS. Never a bare number: every value carries $ or % or a unit word, and where
        a whole splits into parts, label the whole too.
      - Keep each label under about 45 characters. The renderer wraps, but short reads better.
      - "caption" is required: one plain sentence naming the takeaway.

Start with the title on line 1, deck on line 2, then the body HTML."""
    
    raw = claude_generate(prompt)
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

    body = render_diagram_blocks(body)
    
    # If title/deck look wrong (too long or contain HTML), regenerate
    if len(title) > 120 or '<' in title:
        title_raw = claude_generate(f"Write ONE blog post title under 85 characters for this content. Return ONLY the title, no quotes:\n\n{body[:400]}")
        title = title_raw.strip().strip('"').strip("'")
    if len(deck) > 200 or '<' in deck:
        deck_raw = claude_generate(f"Write ONE subtitle sentence under 160 characters for a blog post titled '{title}'. Return ONLY the sentence, no quotes.")
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
      <p style="font-size:0.85rem;color:var(--text);margin:0 0 12px;line-height:1.5">Acquisition Starter Kit, tailored to your role. Key terms, career paths, the 5 biggest mistakes.</p>
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
    # Module/lesson totals come from curriculum.ts, never a literal. These have
    # gone stale twice; scripts/sync-blog.mjs also rewrites them in already
    # published posts on every build.
    CC = curriculum_counts()
    
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
  <title>{title} | Acqlerate</title>
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
<svg width="0" height="0" aria-hidden="true" focusable="false" style="position:absolute">
  <defs>
    <filter id="sketch" filterUnits="userSpaceOnUse" x="-20" y="-20" width="800" height="440">
      <feTurbulence type="fractalNoise" baseFrequency="0.015" numOctaves="3" seed="11" result="n"/>
      <feDisplacementMap in="SourceGraphic" in2="n" scale="5" xChannelSelector="R" yChannelSelector="G"/>
    </filter>
  </defs>
</svg>

<nav>
  <div class="nav-inner">
    <a href="/" class="nav-logo">
      <div class="nav-logo-icon">
        <img src="/acqlerate-icon.svg" alt="" style="width:100%;height:100%;display:block;border-radius:inherit">
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
      <h3 style="font-size:1.25rem;font-weight:800;margin-bottom:10px;color:white">Start Free. {CC["modules_word"]} Modules, {CC["lessons"]} Lessons</h3>
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
        <img src="/acqlerate-icon.svg" alt="" style="width:100%;height:100%;display:block;border-radius:inherit">
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
    # Remove old featured tag and add to the new card
    import re as _re
    content = _re.sub(r' post-card-featured', '', content)
    content = _re.sub(r'<span class="post-tag post-tag-hot">[^<]*</span>', '', content)
    # Make the new card featured
    card = card.replace('class="post-card"', 'class="post-card post-card-featured"', 1)
    card = card.replace(f'<span class="post-tag">{topic["badge"]}</span>',
                        f'<span class="post-tag post-tag-hot">🔥 Latest</span>', 1)

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
        # In GitHub Actions, actions/checkout has already put an Authorization
        # header on the remote. Adding a second one makes git send two, and
        # GitHub rejects the push with 400 Duplicate header. Just push normally.
        if os.environ.get("GITHUB_ACTIONS") == "true":
            result = subprocess.run(["git", "push", "origin", "HEAD:main"],
                                    cwd=REPO_ROOT, capture_output=True)
            if result.returncode != 0:
                err = result.stderr.decode() if result.stderr else ""
                print(f"Push failed: {err}")
                raise subprocess.CalledProcessError(result.returncode, "git push", stderr=result.stderr)
            print("Push succeeded (Actions credentials)")
            return True

        # Local runs: fall back to an explicit token
        import shutil

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

    # Walk the pool from this week's slot and take the first topic that is not
    # already covered on the blog. Before this existed the generator took
    # pool[week % len(pool)] unconditionally and had no idea what was already
    # published, which is how it produced a 4th Section L/M post on 13 Sep and
    # a 4th cost-plus post on 19 Sep. Walking (rather than failing on the first
    # near-miss) means a false positive costs a different post, not no post.
    topic, skipped = None, []
    for offset in range(len(pool)):
        cand = pool[(week + offset) % len(pool)]
        score, slug, _ = dupe_nearest(BLOG_DIR, cand["angle"], cand.get("search", ""))
        if score < DUPE_THRESHOLD:
            topic = cand
            break
        skipped.append(f"{cand['angle'][:52]}... ({score:.2f} vs {slug})")
    if topic is None:
        print("Every topic in the pool is already covered on the blog:")
        for line in skipped:
            print(f"  - {line}")
        print("\nNothing published. Add uncovered topics to the pool, or refresh an "
              "existing post instead of adding a competing one.")
        return 1
    for line in skipped:
        print(f"Skipped (already covered): {line}")
    print(f"Topic: {topic['angle'][:70]}...")

    # 1. Research
    print("Researching...")
    research_prompt = f"""You are a defense acquisition expert and journalist.
Search the web for the CURRENT state of this topic and report what you find:
{topic['search']}

Prioritise, with dates and sources:
- Anything that changed in the last 6 months, and where it stands as of {pub_date}
- Recent FAR/DFARS rules, proposed rules and class deviations touching this topic
- Major contract awards, recompetes and GAO bid protest decisions
- Commercial and big-tech moves into the defense market where relevant
- Specific dollar amounts, programme names, agency names, dates and statistics

Prefer primary sources: acquisition.gov, GAO, DoD and service press releases, Federal Register,
congressional documents. Say plainly when something is uncertain or contested rather than
guessing. Do not state a figure you did not find."""
    research = claude_research(research_prompt)

    # 2. Generate article
    print("Writing article...")
    title, deck, body_html = generate_article_body(topic, research, pub_date)
    title, deck, body_html = strip_em_dashes(title), strip_em_dashes(deck), strip_em_dashes(body_html)
    print(f"Title: {title}")

    # Second gate: the drafted title and headings, not just the planned angle.
    # The article can drift toward covered ground while it is being written, so
    # this checks what was actually produced. Failing here costs the API spend
    # for one article, which is still cheaper than a live duplicate.
    try:
        heads = " ".join(re.findall(r"<h2[^>]*>(.*?)</h2>", body_html, re.S))
        dupe_check(BLOG_DIR, title, f"{deck} {heads}", stage="drafted title")
    except DuplicateTopic as e:
        print(f"\nDUPLICATE, not publishing:\n{e}")
        return 1

    # 3. Build slug
    slug = slugify(title)
    if not slug: slug = f"defense-acquisition-{pub_date}"
    if (BLOG_DIR / f"{slug}.html").exists(): slug = f"{slug}-{pub_date}"

    read_time = get_read_time(body_html)

    # 4. Assemble full HTML with all required elements
    print("Assembling post...")
    post_html = strip_em_dashes(assemble_post(title, deck, body_html, topic, pub_date, slug, read_time))

    # 5. Write file
    post_path = BLOG_DIR / f"{slug}.html"
    post_path.write_text(post_html)
    print(f"Written: {post_path.name}")

    # 6. Generate excerpt for index card
    excerpt_prompt = f"Write a 1-sentence excerpt (under 160 chars) for a blog index card. Title: {title}. No quotes."
    excerpt = strip_em_dashes(claude_generate(excerpt_prompt).strip().strip('"').strip("'"))

    # 7. Update index
    add_to_index(slug, title, excerpt, topic, read_time)

    # 8. Push
    ok = git_push(slug, title)
    url = f"https://acqlerate.com/blog/{slug}"
    print(f"\n{'✓ Published' if ok else '✗ Written but push failed'}: {url}")
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
