#!/usr/bin/env python3
"""
r/DefenseAcquisitions Post Draft Generator
Runs every 2 days at 9am CEST.
- Plain-English educational posts about DoD acquisition
- One Acqlerate reference per week (every 7th post, tracked by state file)
- Emails draft ready to copy-paste to r/DefenseAcquisitions
"""

import os
import sys
import json
import urllib.request
from datetime import datetime
from pathlib import Path

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "AIzaSyCb5cYnJh16swSRh7C1q7nEipBfgKAaW18")
# Resend key — set via env var or hardcoded fallback
RESEND_API_KEY = os.environ.get("RESEND_API_KEY", "")  # injected by cron environment or set below
# If not in environment, the send_email function will print to stdout instead
TO_EMAIL = os.environ.get("ADMIN_EMAILS", "lucas.l.cruz.es@gmail.com").split(",")[0].strip()
APP_URL = os.environ.get("APP_URL", "https://acqlerate.com")

STATE_FILE = Path("/home/user/workspace/cron_tracking/defense_acq_reddit_state.json")

# ── Topic pool ────────────────────────────────────────────────────────────────
# Each topic has: title, prompt angle, optional blog_slug (used on Acqlerate weeks)
# Topics are grouped loosely by theme to ensure variety

TOPICS = [
    # Contracts & vehicles
    {
        "title": "What's the actual difference between an IDIQ and a BPA?",
        "angle": "Break down the difference between IDIQs and BPAs in plain English. When does the government use each one? What does it mean for a contractor holding one vs. the other? Include the practical reality of minimum guarantees and ordering periods.",
        "blog_slug": "dod-contract-types-compared",
    },
    {
        "title": "FFP vs. CPFF — why does the contract type matter so much?",
        "angle": "Explain fixed-price vs. cost-plus in plain English. Who absorbs the risk in each? Why does the government prefer FFP but still uses CPFF for certain work? What does it mean day-to-day for the program team?",
        "blog_slug": "cost-plus-vs-fixed-price-guiding-defense-acquisition-choices-in-2026",
    },
    {
        "title": "Task orders vs. standalone contracts — what's the practical difference?",
        "angle": "Explain the two-level structure: the IDIQ base contract sets the terms, the task order authorizes actual work and funds it. No task order = no work, no billing. Why does this matter to contractor PMs and government PMs alike?",
        "blog_slug": "dod-contract-types-compared",
    },
    {
        "title": "What is a contract modification — and when do you actually need one?",
        "angle": "Plain-English breakdown of bilateral vs. unilateral mods, supplemental agreements, and REAs. When is a mod required? What happens if work gets done without one? Keep it practical for program managers.",
        "blog_slug": "contract-modifications-reas-claims",
    },
    {
        "title": "GSA vehicles explained — OASIS+, SEWP, STARS III",
        "angle": "Plain-English guide to the major governmentwide acquisition contracts. What is each vehicle good for? How does a contractor get on one? How does the government use them? Cover fair opportunity and why the vehicle doesn't guarantee work.",
        "blog_slug": "dod-contract-types-compared",
    },
    # Finance & budgeting
    {
        "title": "Color of money — what it is and why it matters every September",
        "angle": "Explain DoD appropriation types (O&M, RDT&E, Procurement, MILCON) in plain English. Why can't you use O&M to buy a $400K piece of equipment? What happens at the end of the fiscal year when money expires? Real consequences for real people.",
        "blog_slug": "color-of-money-dod-guide",
    },
    {
        "title": "The PPBE cycle — how DoD actually plans and budgets",
        "angle": "Walk through Planning, Programming, Budgeting, and Execution in plain English. How does a program get funded? What's the relationship between the FYDP and annual appropriations? Why does it take so long to get money?",
        "blog_slug": "ppbe-cycle-explained",
    },
    {
        "title": "EVM basics — what CPI and SPI actually tell you",
        "angle": "Explain Earned Value Management without the acronym fog. What does CPI below 1.0 mean in practice? How does a program manager use SPI to course-correct? Why do most programs generate EVM reports but never act on them?",
        "blog_slug": "evm-basics-defense",
    },
    {
        "title": "What does DCAA actually do — and why should contractors care?",
        "angle": "Plain-English breakdown of what DCAA audits, what they're looking for, and what happens if they find something. What makes a DCAA visit go smoothly vs. badly? Why timecards matter more than most people think.",
        "blog_slug": "dcaa-vs-dcma-difference",
    },
    {
        "title": "Wrap rates explained — what's in a contractor's overhead?",
        "angle": "Break down the components of a contractor's wrap rate: fringe, overhead, G&A, fee. Why do rates vary so much between firms? How does the government evaluate price when comparing proposals? Keep it plain English.",
        "blog_slug": "defense-finance-program-managers-guide",
    },
    # Acquisition process
    {
        "title": "What actually happens in a source selection?",
        "angle": "Walk through the source selection process from RFP to award in plain English. What does an evaluation board actually do? What's the difference between best value and LPTA? Why do companies win and lose based on documentation, not just capability?",
        "blog_slug": "source-selection-process-dod",
    },
    {
        "title": "What is a COR — and why is the relationship so important?",
        "angle": "Explain the COR's role in plain English. They're the eyes and ears of the contracting officer. They monitor performance, document issues, and write CPARS. For contractors, the COR relationship is often the most important one on the program.",
        "blog_slug": "cor-responsibilities-guide",
    },
    {
        "title": "CPARS — what it is and why it follows you everywhere",
        "angle": "Explain the Contractor Performance Assessment Reporting System in plain English. How are ratings determined? Who sees them? How much do they matter in future source selections? What separates an Exceptional from a Satisfactory?",
        "blog_slug": "cpars-ratings-guide",
    },
    {
        "title": "ACAT levels — how the DoD categorizes acquisition programs",
        "angle": "Plain-English guide to ACAT I, II, III, and IV. What determines the level? What oversight comes with each? Why does a program's ACAT level affect every decision from staffing to schedule?",
        "blog_slug": "acat-levels-explained",
    },
    {
        "title": "OTAs — the acquisition authority everyone's talking about",
        "angle": "Explain Other Transaction Agreements in plain English. What are they, what are they not (not FAR contracts), when can agencies use them, and what do they mean for non-traditional defense contractors? Cover the prototype-to-follow-on path.",
        "blog_slug": "ota-vs-far-contracts",
    },
    # Careers
    {
        "title": "What does a DoD program manager actually do all day?",
        "angle": "Honest plain-English description of what a defense PM's job looks like. Not the job description — the actual work: program reviews, contractor oversight, budget drills, stakeholder management, and the leadership side nobody talks about.",
        "blog_slug": "leadership-in-defense-pm-its-a-people-business",
    },
    {
        "title": "1102 vs. program manager — what's the difference?",
        "angle": "Explain the difference between a contracting officer (1102 series) and a program manager in plain English. Different authorities, different accountabilities, different career paths. How do they work together and where do they conflict?",
        "blog_slug": "key-roles-dod-acquisition",
    },
    {
        "title": "DAWIA and CLPs — what the DoD workforce training system actually requires",
        "angle": "Explain DAWIA functional areas and the 80-CLP biennial requirement in plain English. What are the three main career tracks (PM, Contracting, BFM)? What counts toward CLPs? What's the difference between DAU certification and practical fluency?",
        "blog_slug": "dau-vs-acqlerate-acquisition-training",
    },
    {
        "title": "How to read a contract — the sections that actually matter",
        "angle": "Plain-English guide to the Uniform Contract Format. Section C (SOW/PWS), Section H (special requirements), Section I (clauses), Section J (attachments). What does a new PM or contractor need to read first, and what do they actually need to understand?",
        "blog_slug": "federal-contracting-101",
    },
    {
        "title": "Breaking into defense acquisition — paths that actually work",
        "angle": "Plain-English guide for career changers and new grads. Cleared support roles, direct hire authority, internships, contingency hiring, and the GS schedule. What credentials matter (or don't) at entry level? What does the first 2 years look like?",
        "blog_slug": "breaking-into-govcon-guide",
    },
    # Proposals & BD
    {
        "title": "Section L vs. Section M — the most important part of any RFP",
        "angle": "Explain the difference between Section L (instructions to offerors) and Section M (evaluation criteria) in plain English. Why should you read M before L? How do most companies get this backward? What does the government actually evaluate?",
        "blog_slug": "section-l-vs-section-m-proposal",
    },
    {
        "title": "What does 'best value' actually mean in source selection?",
        "angle": "Explain best value tradeoff analysis in plain English. How does it differ from lowest-price technically acceptable (LPTA)? What factors get weighted? How does the SSA make the final call? What does it mean for proposal strategy?",
        "blog_slug": "source-selection-process-dod",
    },
]

# ── State management ──────────────────────────────────────────────────────────

def load_state() -> dict:
    STATE_FILE.parent.mkdir(parents=True, exist_ok=True)
    if STATE_FILE.exists():
        try:
            return json.loads(STATE_FILE.read_text())
        except Exception:
            pass
    return {"post_count": 0, "last_acqlerate_week": -1, "used_topics": []}


def save_state(state: dict):
    STATE_FILE.write_text(json.dumps(state, indent=2))


def pick_topic(state: dict) -> dict:
    # Avoid recently used topics
    used = state.get("used_topics", [])[-10:]  # avoid last 10
    available = [i for i in range(len(TOPICS)) if i not in used]
    if not available:
        available = list(range(len(TOPICS)))

    # Deterministic but varied: use post_count + day of month
    day = datetime.now().day
    idx = available[(state.get("post_count", 0) + day) % len(available)]
    return idx, TOPICS[idx]


def should_include_acqlerate(state: dict) -> bool:
    """Include an Acqlerate mention once per week (~every 3-4 posts)."""
    current_week = datetime.now().isocalendar()[1]  # ISO week number
    last_week = state.get("last_acqlerate_week", -1)
    return current_week != last_week


# ── Content generation ────────────────────────────────────────────────────────

def gemini_generate(prompt: str) -> str:
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={GEMINI_API_KEY}"
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {"temperature": 0.72, "maxOutputTokens": 4096},
    }
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            result = json.loads(resp.read())
            return result["candidates"][0]["content"]["parts"][0]["text"]
    except Exception as e:
        print(f"Gemini error: {e}")
        sys.exit(1)


def generate_post(topic: dict, include_acqlerate: bool) -> tuple[str, str]:
    """Returns (title, body)."""

    acqlerate_line = ""
    if include_acqlerate:
        blog_url = f"{APP_URL}/blog/{topic['blog_slug']}"
        acqlerate_line = f"\n\nIf you want a deeper dive, I wrote a plain-English breakdown of this at Acqlerate: {blog_url} — it's the training resource I built for this community."

    prompt = f"""Write a Reddit post for r/DefenseAcquisitions — a subreddit focused on plain-English 
education about DoD acquisition for both government and contractor professionals.

The subreddit moderator is Lucas Cruz, an experienced defense acquisition PM. Posts are educational, 
not promotional. The goal is genuine community learning.

TOPIC: {topic['angle']}

RULES:
- Plain English — write for someone who's new to this, not for a DAU course
- 250-350 words
- No bullet-point lists, no headers — flowing paragraphs
- Conversational and direct, like explaining something to a colleague
- End with an open question to invite discussion
- NO corporate speak, NO "As we navigate...", NO "In conclusion"
{f'- Add this line at the very end (after the question): {acqlerate_line}' if include_acqlerate else '- Do NOT mention Acqlerate or any website'}

Write only the post body — no title, no subreddit."""

    body = gemini_generate(prompt).strip()
    return topic["title"], body


# ── Email delivery ────────────────────────────────────────────────────────────

def send_email(title: str, body: str, include_acqlerate: bool) -> bool:
    today = datetime.now().strftime("%A, %B %d")
    acqlerate_note = (
        '<div style="background:#E6F2F3;border-radius:8px;padding:10px 14px;font-size:0.8rem;color:#01696F;font-weight:700;margin-bottom:16px;">🔗 This post includes your weekly Acqlerate mention</div>'
        if include_acqlerate else
        '<div style="background:#F9FAFB;border-radius:8px;padding:10px 14px;font-size:0.8rem;color:#6B7280;margin-bottom:16px;">No Acqlerate mention this post — saving it for later this week</div>'
    )

    html = f"""
    <div style="font-family:-apple-system,sans-serif;max-width:660px;margin:0 auto;padding:24px;">
      <div style="background:#0C2340;border-radius:12px;padding:20px 24px;margin-bottom:20px;">
        <div style="font-size:0.7rem;font-weight:800;text-transform:uppercase;letter-spacing:0.1em;color:#4FC3CB;margin-bottom:4px;">r/DefenseAcquisitions — {today}</div>
        <div style="font-size:1rem;font-weight:800;color:white;">Post Draft Ready</div>
      </div>

      {acqlerate_note}

      <p style="font-size:0.85rem;color:#374151;margin-bottom:16px;line-height:1.6;">
        Post at <a href="https://www.reddit.com/r/DefenseAcquisitions/submit?type=text" style="color:#01696F;">r/DefenseAcquisitions</a>
        — text post format. Pin it or flair it as you see fit as mod.
        <strong>Reply to comments</strong> to keep the thread active.
      </p>

      <div style="background:#F9FAFB;border:1px solid #E5E7EB;border-left:4px solid #01696F;border-radius:8px;padding:20px 24px;margin-bottom:16px;">
        <div style="font-size:0.7rem;font-weight:800;text-transform:uppercase;color:#6B7280;margin-bottom:6px;">POST TITLE</div>
        <div style="font-size:1.05rem;font-weight:700;color:#1A1A1A;margin-bottom:20px;padding-bottom:16px;border-bottom:1px solid #E5E7EB;">{title}</div>
        <div style="font-size:0.7rem;font-weight:800;text-transform:uppercase;color:#6B7280;margin-bottom:8px;">POST BODY — copy this</div>
        <div style="font-size:0.9rem;color:#1A1A1A;line-height:1.85;white-space:pre-wrap;font-family:Georgia,serif;">{body}</div>
      </div>

      <div style="font-size:0.78rem;color:#9CA3AF;line-height:1.6;">
        Tip: After posting, respond to every comment within a few hours.
        A thread with 3 engaged replies gets more organic visibility than a post with 0.
      </div>
    </div>
    """

    if not RESEND_API_KEY:
        print(f"\n{'='*60}")
        print(f"TITLE: {title}")
        print(f"{'='*60}")
        print(body)
        print(f"{'='*60}\n")
        return True

    payload = {
        "from": "Acqlerate <hello@acqlerate.com>",
        "to": [TO_EMAIL],
        "subject": f"r/DefenseAcquisitions Draft — {today}",
        "html": html,
    }
    req = urllib.request.Request(
        "https://api.resend.com/emails",
        data=json.dumps(payload).encode(),
        headers={"Authorization": f"Bearer {RESEND_API_KEY}", "Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            result = json.loads(resp.read())
            print(f"[email] Sent to {TO_EMAIL} — id: {result.get('id')}")
            return True
    except Exception as e:
        print(f"[email] Failed: {e}")
        return False


# ── Main ──────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    print(f"[r/DefenseAcquisitions] {datetime.now().strftime('%Y-%m-%d %H:%M')}")

    state = load_state()
    include_acqlerate = should_include_acqlerate(state)
    topic_idx, topic = pick_topic(state)

    print(f"[r/DefenseAcquisitions] Topic: {topic['title']}")
    print(f"[r/DefenseAcquisitions] Include Acqlerate: {include_acqlerate}")

    title, body = generate_post(topic, include_acqlerate)
    print(f"[r/DefenseAcquisitions] Generated ({len(body.split())} words)")

    sent = send_email(title, body, include_acqlerate)

    # Update state
    state["post_count"] = state.get("post_count", 0) + 1
    used = state.get("used_topics", [])
    used.append(topic_idx)
    state["used_topics"] = used[-20:]  # keep last 20
    if include_acqlerate:
        state["last_acqlerate_week"] = datetime.now().isocalendar()[1]

    save_state(state)
    print(f"[r/DefenseAcquisitions] Done (post #{state['post_count']})")
