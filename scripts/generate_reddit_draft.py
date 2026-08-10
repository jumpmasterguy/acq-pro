#!/usr/bin/env python3
"""
Acqlerate Reddit Draft Generator
Runs Mon/Wed/Fri — generates a community-first r/GovernmentContracting post draft
and emails it ready to copy-paste.
"""

import os
import sys
import json
import urllib.request
from datetime import datetime

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    raise SystemExit("GEMINI_API_KEY environment variable is not set. Set it before running this script.")
RESEND_API_KEY = os.environ.get("RESEND_API_KEY", "")
TO_EMAIL = os.environ.get("ADMIN_EMAILS", "lucas.l.cruz.es@gmail.com").split(",")[0].strip()
APP_URL = os.environ.get("APP_URL", "https://acqlerate.com")

# Topic pool — each maps to a blog URL and community angle
TOPICS = [
    {
        "title": "The COR relationship — most contractor PMs underinvest in it",
        "blog_slug": "cor-responsibilities-guide",
        "angle": "COR writes your CPARS. That rating follows you to every future competition. Yet most contractor PMs treat the COR as an administrative function, not a relationship. Discuss: how do you build a strong COR relationship without it feeling transactional?",
        "community_question": "How do you build a real working relationship with your COR — especially when they're stretched thin across multiple programs?",
    },
    {
        "title": "The September 30 scramble — how do you handle EOY buys?",
        "blog_slug": "color-of-money-dod-guide",
        "angle": "End of fiscal year is chaos in every contracting office. Requirements get rushed, SOWs get vague, and projects get funded that nobody had time to think through. What's your experience with EOY buys?",
        "community_question": "How do you handle the September push? What's your policy on accepting work with vague requirements just because a customer needs to obligate before EOD Sep 30?",
    },
    {
        "title": "IDIQ vehicles — winning the seat vs. winning the work",
        "blog_slug": "dod-contract-types-compared",
        "angle": "The IDIQ is the hunting license. The task order is the hunt. Companies celebrate a vehicle win for weeks, then realize they've done nothing to position for actual task orders. What does your firm do to win task order work after vehicle award?",
        "community_question": "What's your BD strategy for converting an IDIQ vehicle seat into actual task order wins?",
    },
    {
        "title": "Does your proposal team read Section M first?",
        "blog_slug": "section-l-vs-section-m-proposal",
        "angle": "Section M is the scoring rubric. Most proposals I've reviewed spend the most effort on what the team knows best — not on what the government is actually evaluating. How does your team structure a proposal response?",
        "community_question": "Do you start from Section M (evaluation factors) or Section C/PWS (the requirement)?",
    },
    {
        "title": "Constructive changes — the silent budget killer",
        "blog_slug": "contract-modifications-reas-claims",
        "angle": "The COR asks for something not in the SOW. The PM says yes to keep the relationship smooth. Six months later: 200 hours of unbillable labor, no paper trail for an REA. How do you handle out-of-scope requests without damaging the relationship?",
        "community_question": "What's your process for handling out-of-scope requests in a way that protects your firm and keeps the client relationship intact?",
    },
    {
        "title": "EVM on smaller contracts — useful tool or compliance theater?",
        "blog_slug": "evm-basics-defense",
        "angle": "EVMS thresholds just went up — non-validated to $50M, validated to $100M. On smaller programs, do you find EVM reporting actually helps you manage the work, or does it become a reporting exercise that nobody acts on?",
        "community_question": "For programs under $50M, do you use EVM as a genuine management tool or mainly to satisfy contract requirements?",
    },
    {
        "title": "Becoming a PM — what nobody tells you before you take the role",
        "blog_slug": "leadership-in-defense-pm-its-a-people-business",
        "angle": "The most common mistake: treating the PM role as a promotion from a technical track. The skills that make a great engineer are different from the skills that make a great PM. What was the biggest mindset shift you had to make?",
        "community_question": "For those who transitioned into PM from a technical or functional track — what do you wish someone had told you before you took the role?",
    },
    {
        "title": "DCAA audits — the contractors who panic vs. the ones who don't",
        "blog_slug": "dcaa-vs-dcma-difference",
        "angle": "DCAA showing up is not an emergency. If you have a compliant accounting system and accurate timecards, it's just a process. The PMs who panic are the ones who haven't been keeping clean books. What's your experience with DCAA floor check audits?",
        "community_question": "How does your firm stay prepared for DCAA audits? Any lessons learned from floor checks or incurred cost submissions?",
    },
    {
        "title": "What actually works in source selection debriefs?",
        "blog_slug": "source-selection-process-dod",
        "angle": "The firms that win consistently write for the evaluator, not for themselves. A good debrief tells you exactly how to improve — but not all debriefs are created equal. What's the most useful feedback you've gotten from a source selection debrief?",
        "community_question": "What's the most useful thing you've ever learned from a source selection debrief? Did it change how your team approaches proposals?",
    },
    {
        "title": "Breaking into DoD contracting — what actually works",
        "blog_slug": "breaking-into-govcon-guide",
        "angle": "The job postings ask for 5 years of DoD acquisition experience — for an entry-level role. The real path in often starts with a cleared support role, direct hire, or a contractor gig supporting a program office. What paths have worked for people you know?",
        "community_question": "For people trying to break into defense contracting without prior DoD experience — what's actually worked? What paths in do you see working for career changers?",
    },
]


def gemini_generate(prompt: str) -> str:
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={GEMINI_API_KEY}"
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {"temperature": 0.75, "maxOutputTokens": 4096},
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


def pick_topic() -> dict:
    day_of_year = datetime.now().timetuple().tm_yday
    return TOPICS[day_of_year % len(TOPICS)]


def generate_post(topic: dict) -> str:
    blog_url = f"{APP_URL}/blog/{topic['blog_slug']}"
    prompt = f"""Write a Reddit post for r/GovernmentContracting from the perspective of Lucas Cruz —
an experienced defense acquisition PM and founder of Acqlerate (acqlerate.com).

RULES:
- Community-first: open with genuine insight or a real situation, not a pitch
- Plain English, practitioner voice — "I've seen this happen..." style
- 220-320 words total
- End with ONE disclosure line linking to the blog
- Disclosure: "I run Acqlerate, a DoD acquisition training site — wrote more on this here: {blog_url}"
- NO corporate speak, NO bullet lists, NO headers, NO markdown formatting
- Write like a real Reddit post — conversational paragraphs

TOPIC: {topic['angle']}
COMMUNITY QUESTION TO OPEN WITH: {topic['community_question']}

Write only the post body — no title, no subreddit, no username."""

    return gemini_generate(prompt).strip()


def send_email(post_body: str, topic: dict) -> bool:
    blog_url = f"{APP_URL}/blog/{topic['blog_slug']}"
    today = datetime.now().strftime("%A, %B %d")

    html = f"""
    <div style="font-family:-apple-system,sans-serif;max-width:660px;margin:0 auto;padding:24px;">
      <div style="background:#0C2340;border-radius:12px;padding:20px 24px;margin-bottom:24px;">
        <div style="font-size:0.7rem;font-weight:800;text-transform:uppercase;letter-spacing:0.1em;color:#4FC3CB;margin-bottom:4px;">Reddit Draft — {today}</div>
        <div style="font-size:1rem;font-weight:800;color:white;">r/GovernmentContracting Post Ready to Copy</div>
      </div>

      <p style="font-size:0.9rem;color:#374151;margin-bottom:20px;line-height:1.6;">
        Post this yourself at
        <a href="https://www.reddit.com/r/GovernmentContracting/submit?type=text" style="color:#01696F;">r/GovernmentContracting</a>.
        Use a text post, not a link post — text posts get more engagement.
        <strong>Stay in the comments for 30–60 min after posting</strong> to respond to anyone who engages.
      </p>

      <div style="background:#F9FAFB;border:1px solid #E5E7EB;border-left:4px solid #01696F;border-radius:8px;padding:20px 24px;margin-bottom:20px;">
        <div style="font-size:0.7rem;font-weight:800;text-transform:uppercase;color:#6B7280;margin-bottom:6px;">SUGGESTED POST TITLE</div>
        <div style="font-size:1rem;font-weight:700;color:#1A1A1A;margin-bottom:20px;padding-bottom:16px;border-bottom:1px solid #E5E7EB;">{topic['title']}</div>
        <div style="font-size:0.7rem;font-weight:800;text-transform:uppercase;color:#6B7280;margin-bottom:8px;">POST BODY — copy this</div>
        <div style="font-size:0.9rem;color:#1A1A1A;line-height:1.8;white-space:pre-wrap;font-family:Georgia,serif;">{post_body}</div>
      </div>

      <div style="background:#E6F2F3;border-radius:8px;padding:12px 16px;margin-bottom:20px;font-size:0.8rem;">
        <strong style="color:#01696F;">Linked post:</strong>
        <a href="{blog_url}" style="color:#01696F;margin-left:6px;">{blog_url}</a>
      </div>

      <div style="font-size:0.8rem;color:#9CA3AF;border-top:1px solid #E5E7EB;padding-top:16px;line-height:1.6;">
        <strong>Reminder:</strong> Reply to every comment within 2 hours of posting.
        A single genuine exchange builds more credibility than five unanswered posts.
        Disclose you're the Acqlerate founder if anyone asks or if it comes up naturally.
      </div>
    </div>
    """

    if not RESEND_API_KEY:
        print(f"\n{'='*60}")
        print(f"TITLE: {topic['title']}")
        print(f"{'='*60}")
        print(post_body)
        print(f"{'='*60}\n")
        return True

    payload = {
        "from": "Acqlerate <hello@acqlerate.com>",
        "to": [TO_EMAIL],
        "subject": f"Reddit Draft — r/GovernmentContracting ({today})",
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
            print(f"[email] Draft sent to {TO_EMAIL} — id: {result.get('id')}")
            return True
    except Exception as e:
        print(f"[email] Failed: {e}")
        return False


if __name__ == "__main__":
    print(f"[reddit-draft] {datetime.now().strftime('%Y-%m-%d %H:%M')}")
    topic = pick_topic()
    print(f"[reddit-draft] Topic: {topic['title']}")
    post = generate_post(topic)
    print(f"[reddit-draft] Generated ({len(post.split())} words)")
    send_email(post, topic)
    print("[reddit-draft] Done")
