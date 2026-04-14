import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const APP_URL = process.env.APP_URL || "https://acqlerate.com";
const FROM = process.env.EMAIL_FROM || "Lucas at Acqlerate <lucas@acqlerate.com>";

// ─── Shared HTML shell ──────────────────────────────────────────────────────

function emailShell(preheader: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/><title>Acqlerate</title></head>
<body style="margin:0;padding:0;background:#f0f2f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif">
<span style="display:none;max-height:0;overflow:hidden">${preheader}</span>
<div style="max-width:600px;margin:32px auto;background:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.07)">
<div style="background:#0d2137;padding:32px 48px;text-align:center">
<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto"><tr>
<td style="padding-right:12px;vertical-align:middle"><img src="https://acqlerate.com/icon-192x192.png" width="40" height="40" alt="" style="display:block;border-radius:9px"/></td>
<td style="vertical-align:middle"><span style="color:#ffffff;font-size:22px;font-weight:800;letter-spacing:-0.5px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif">Acqlerate</span></td>
</tr></table>
</div>
<div style="padding:36px 48px">${body}</div>
<div style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:22px 48px;text-align:center">
<p style="font-size:12px;color:#94a3b8;margin:0;line-height:1.7">You're receiving this because you created an account at Acqlerate.<br/><a href="${APP_URL}" style="color:#01696f;text-decoration:none">acqlerate.com</a> &nbsp;·&nbsp; Defense Acquisitions Academy</p>
</div>
</div>
</body></html>`;
}

// ─── Email 1: Welcome (immediate) ──────────────────────────────────────────

export async function sendWelcomeEmail(to: string, username: string): Promise<void> {
  if (!resend) { console.log("[email] RESEND_API_KEY not set — skipping email 1"); return; }

  const body = `
    <div class="greeting">Welcome aboard, ${username}.</div>
    <p>You just joined a small but growing community of defense professionals who decided to actually understand the acquisition system — not just survive it.</p>
    <p>Whether you're a Contracting Officer, Program Manager, BD lead, or making a career transition into the defense space, Acqlerate was built for this exact moment: when you're ready to go deeper than the DAU course catalog.</p>

    <div class="section-label">Your first move</div>
    <div class="highlight-box">
      <p><strong>Module 01 — DoD Acquisitions Foundations</strong> is yours free, right now. No credit card. No time limit.</p>
      <p style="margin-top:10px">It covers the Adaptive Acquisition Framework, ACAT categories, the FAR/DFARS structure, how programs get funded, and who the key players are across the government and industry side. Five lessons, full quizzes, and an AI study assistant ready to answer your questions in plain language.</p>
    </div>

    <div class="cta-box" style="background:#0d2137;border-radius:12px;padding:28px 32px;text-align:center;margin-bottom:28px;border:1px solid #264d73">
      <p style="color:#ffffff !important;font-size:14px;margin:0 0 20px;line-height:1.65">Start with Lesson 1 — it takes about 20 minutes and gives you a framework that makes everything else click.</p>
      <a href="${APP_URL}/#/module/dod-foundations" class="btn" style="display:inline-block;background:#f5c842;color:#0d2137;font-weight:800;font-size:15px;padding:13px 30px;border-radius:8px;text-decoration:none">Start Module 01 →</a>
    </div>

    <div class="section-label">What's ahead</div>
    <div class="module-row"><span class="mod-icon">🏛️</span><div><div class="mod-name">Module 01 — DoD Acquisitions Foundations</div><div class="mod-desc">FREE · AAF, ACAT, FAR/DFARS, lifecycle phases, key players</div></div></div>
    <div class="module-row"><span class="mod-icon">💰</span><div><div class="mod-name">Module 02 — Defense Finance & Budgeting</div><div class="mod-desc">Pro · PPBE, color of money, EVM, Nunn-McCurdy, appropriations</div></div></div>
    <div class="module-row"><span class="mod-icon">📋</span><div><div class="mod-name">Module 03 — Defense Contracting Fundamentals</div><div class="mod-desc">Pro · FFP vs. cost-plus, source selection, task orders, GSA vehicles</div></div></div>
    <div class="module-row"><span class="mod-icon">📊</span><div><div class="mod-name">Module 04 — Data Analytics for PMs</div><div class="mod-desc">Pro · Program dashboards, schedule analysis, TPMs, reporting</div></div></div>
    <div class="module-row"><span class="mod-icon">🎯</span><div><div class="mod-name">Module 05 — Capture Management & BD</div><div class="mod-desc">Pro · Win strategies, gate reviews, competitive intel, proposals</div></div></div>
    <div class="module-row"><span class="mod-icon">⚙️</span><div><div class="mod-name">Module 06 — Program Operations & Leadership</div><div class="mod-desc">Pro · Risk management, stakeholder comms, career roadmap</div></div></div>

    <hr class="divider"/>
    <p>Questions? Just reply to this email. We read every one.</p>
    <p style="font-size:14px;color:#0d2137;font-weight:700;margin-top:4px">— Lucas, Acqlerate</p>
  `;

  await resend.emails.send({
    from: FROM, to,
      replyTo: "lucas.l.cruz.es@gmail.com",
    subject: "Welcome to Acqlerate — your first module is ready",
    html: emailShell("Start Module 01 right now — it's free and takes 20 minutes.", body),
  });
  console.log(`[email] Email 1 (welcome) sent to ${to}`);
}

// ─── Starter Kit Email ────────────────────────────────────────────────────
// Sent after onboarding is complete and role is known

type UserRole = 'dod_employee' | 'dod_contractor' | 'career_changer' | 'student';

export async function sendStarterKitEmail(to: string, username: string, role: UserRole): Promise<void> {
  if (!resend) { console.log('[email] RESEND_API_KEY not set — skipping starter kit email'); return; }

  const isContractor = role === 'dod_contractor';
  const isUSG = role === 'dod_employee';
  const isCareerChanger = role === 'career_changer';

  // Career changers and students get both kits
  const getsBoth = isCareerChanger || role === 'student';

  const kitLabel = isContractor
    ? 'The Contractor\'s Acquisition Starter Kit'
    : isUSG
    ? 'The Acquisition Starter Kit (USG Edition)'
    : 'Both Starter Kits — USG & Contractor';

  const kitDesc = isContractor
    ? 'Built for defense contractors, BD professionals, and proposal teams — contracts, task orders, vehicles, IDIQ structures, common mistakes, and the acronym glossary you need from day one.'
    : isUSG
    ? 'Built for government acquisition professionals — DoD lifecycle, ACAT levels, key roles, acquisition pathways, the 5 most common PM mistakes, and the vocabulary you need to be effective.'
    : 'Because understanding both sides of the table is one of the fastest ways to accelerate your career — we\'re sending you both the USG and Contractor editions.';

  const downloadButtons = isContractor ? `
    <a href="${APP_URL}/starter-kit-contractor.pdf"
       style="display:inline-block;background:#01696f;color:#ffffff;font-weight:800;font-size:14px;padding:12px 28px;border-radius:8px;text-decoration:none">
      Download Your Starter Kit →
    </a>
  ` : isUSG ? `
    <a href="${APP_URL}/starter-kit-usg.pdf"
       style="display:inline-block;background:#01696f;color:#ffffff;font-weight:800;font-size:14px;padding:12px 28px;border-radius:8px;text-decoration:none">
      Download Your Starter Kit →
    </a>
  ` : `
    <a href="${APP_URL}/starter-kit-usg.pdf"
       style="display:inline-block;background:#01696f;color:#ffffff;font-weight:800;font-size:14px;padding:12px 24px;border-radius:8px;text-decoration:none;margin-right:10px">
      USG Edition →
    </a>
    <a href="${APP_URL}/starter-kit-contractor.pdf"
       style="display:inline-block;background:#0d2137;color:#ffffff;font-weight:700;font-size:14px;padding:12px 24px;border-radius:8px;text-decoration:none;border:1px solid #264d73">
      Contractor Edition →
    </a>
  `;

  const body = `
    <div style="font-size:17px;font-weight:700;color:#0d2137;margin:0 0 10px">Here's your Acqlerate Starter Kit, ${username.split(' ')[0]}.</div>
    <p style="font-size:15px;color:#374151;line-height:1.75;margin:0 0 18px">You told us you're on the ${isContractor ? 'contractor' : isUSG ? 'government' : 'career transition'} side of defense acquisitions. We put together a free reference guide specifically for your situation.</p>

    <div style="background:#f0f9fa;border-left:4px solid #01696f;border-radius:0 10px 10px 0;padding:20px 24px;margin-bottom:24px">
      <p style="margin:0 0 6px;font-size:13px;font-weight:800;text-transform:uppercase;letter-spacing:0.08em;color:#01696f">Your Starter Kit</p>
      <p style="margin:0 0 4px;font-size:15px;font-weight:700;color:#0d2137">${kitLabel}</p>
      <p style="margin:0;font-size:13px;color:#374151;line-height:1.6">${kitDesc}</p>
    </div>

    <div style="background:#0d2137;border-radius:12px;padding:28px 32px;text-align:center;margin-bottom:28px;border:2px solid #264d73">
      <p style="color:#ffffff;font-size:14px;margin:0 0 20px;line-height:1.65">Your PDF reference guide — save it, share it with your team, and use it when you need a quick reminder of the terminology or frameworks that come up every day in this field.</p>
      ${downloadButtons}
    </div>

    <p style="font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:1px;color:#01696f;margin:0 0 14px">What's inside</p>
    ${isContractor ? `
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:10px"><tr><td style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:14px 18px">
      <p style="font-size:14px;font-weight:700;color:#0d2137;margin:0 0 3px">Task Orders vs. Standalone Contracts</p>
      <p style="font-size:13px;color:#64748b;margin:0">IDIQs, fair opportunity, single vs. multiple award — how DoD actually buys services</p>
    </td></tr></table>
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:10px"><tr><td style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:14px 18px">
      <p style="font-size:14px;font-weight:700;color:#0d2137;margin:0 0 3px">GSA AAS-D & IDIQ Vehicle Landscape</p>
      <p style="font-size:13px;color:#64748b;margin:0">OASIS+, FEDSIM, ASTRO, and the vehicles that matter for defense contractors</p>
    </td></tr></table>
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:10px"><tr><td style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:14px 18px">
      <p style="font-size:14px;font-weight:700;color:#0d2137;margin:0 0 3px">Who's Buying — AFICC, ESS & MAJCOM Contracting</p>
      <p style="font-size:13px;color:#64748b;margin:0">The three tiers of Air Force contracting and how to engage each one</p>
    </td></tr></table>
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:24px"><tr><td style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:14px 18px">
      <p style="font-size:14px;font-weight:700;color:#0d2137;margin:0 0 3px">5 Most Common Contractor Mistakes + 70+ Acronym Glossary</p>
      <p style="font-size:13px;color:#64748b;margin:0">Pipeline strategy, COR relationship, DCAA compliance, recompete planning</p>
    </td></tr></table>
    ` : isUSG ? `
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:10px"><tr><td style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:14px 18px">
      <p style="font-size:14px;font-weight:700;color:#0d2137;margin:0 0 3px">DoD Acquisition Lifecycle Cheat Sheet</p>
      <p style="font-size:13px;color:#64748b;margin:0">All 6 AAF pathways with timelines, governing DoDIs, and MDA levels</p>
    </td></tr></table>
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:10px"><tr><td style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:14px 18px">
      <p style="font-size:14px;font-weight:700;color:#0d2137;margin:0 0 3px">ACAT Decision Tree</p>
      <p style="font-size:13px;color:#64748b;margin:0">ACAT I/II/III thresholds, MDA levels, Nunn-McCurdy breach triggers</p>
    </td></tr></table>
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:10px"><tr><td style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:14px 18px">
      <p style="font-size:14px;font-weight:700;color:#0d2137;margin:0 0 3px">5 Most Common PM Mistakes</p>
      <p style="font-size:13px;color:#64748b;margin:0">IMS discipline, Nunn-McCurdy thresholds, EVM signals, requirements quality, stakeholder management</p>
    </td></tr></table>
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:24px"><tr><td style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:14px 18px">
      <p style="font-size:14px;font-weight:700;color:#0d2137;margin:0 0 3px">50+ Acronym Glossary & AAF Pathway Selector</p>
      <p style="font-size:13px;color:#64748b;margin:0">Every acronym you'll encounter in your first year, organized by category</p>
    </td></tr></table>
    ` : `
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:10px"><tr><td style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:14px 18px">
      <p style="font-size:14px;font-weight:700;color:#0d2137;margin:0 0 3px">USG Edition — Lifecycle, ACAT, PM Mistakes, Acronyms</p>
      <p style="font-size:13px;color:#64748b;margin:0">The government side: programs, milestones, oversight, and career paths</p>
    </td></tr></table>
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:24px"><tr><td style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:14px 18px">
      <p style="font-size:14px;font-weight:700;color:#0d2137;margin:0 0 3px">Contractor Edition — Vehicles, Mistakes, Glossary, Who's Buying</p>
      <p style="font-size:13px;color:#64748b;margin:0">The industry side: IDIQs, BD strategy, DCAA compliance, COR relationship</p>
    </td></tr></table>
    `}

    <hr style="border:none;border-top:1px solid #f1f5f9;margin:4px 0 24px" />
    <p style="font-size:15px;color:#374151;line-height:1.75;margin:0 0 6px">This is just the start — Module 01 inside Acqlerate is waiting for you whenever you're ready to go deeper.</p>
    <p style="font-size:14px;color:#0d2137;font-weight:700;margin:0">— Lucas, Acqlerate</p>
  `;

  await resend.emails.send({
    from: FROM,
      replyTo: "lucas.l.cruz.es@gmail.com",
    to,
    subject: `Your Acqlerate Starter Kit is ready to download`,
    html: emailShell('Your free acquisition reference guide — tailored to your role.', body),
  });
  console.log(`[email] Starter kit email sent to ${to} (role: ${role})`);
}

// ─── Email 2: Why acquisition literacy matters (Day 2) ─────────────────────

export async function sendEmail2(to: string, username: string): Promise<void> {
  if (!resend) return;

  const body = `
    <div class="greeting">Hey ${username} —</div>
    <p>You signed up a couple of days ago, so I wanted to share something that might reframe how you think about what you're learning.</p>

    <div class="section-label">The real cost of not knowing</div>
    <p>The DoD spends roughly <strong>$400 billion per year</strong> on acquisition and contracting. That's not a rounding error — it's the largest discretionary procurement system in the world. And yet the people working inside it — program offices, contracting shops, defense contractors — often operate with significant knowledge gaps that nobody talks about openly.</p>

    <div class="highlight-box">
      <p>A program manager who doesn't understand color of money makes resourcing decisions that create Anti-Deficiency Act violations. A BD lead who can't read a PWIN assessment builds a pipeline full of wishful thinking. A contractor who doesn't understand source selection evaluation criteria writes proposals that miss the point entirely.</p>
      <p style="margin-top:10px"><strong>Acquisition literacy isn't a nice-to-have. It's the difference between being effective and being a liability.</strong></p>
    </div>

    <div class="section-label">Your quick win from Module 01</div>
    <p>If you've started the Foundations module, here's the single most important framework to internalize first:</p>

    <div class="highlight-box">
      <p><strong>The Adaptive Acquisition Framework (AAF)</strong> replaced the old "one-size-fits-all" DoDI 5000.02 process in 2020. Programs now choose from six distinct pathways — Major Capability Acquisition, Middle Tier, Software, Defense Business Systems, Urgent Capability, and Acquisition of Services.</p>
      <p style="margin-top:10px">Why does this matter? Because the pathway a program selects determines its oversight requirements, its documentation burden, its milestone review cadence, and how quickly it can field capability. If you don't know which pathway a program is on, you don't really know how the program works.</p>
    </div>

    <div class="cta-box" style="background:#0d2137;border-radius:12px;padding:28px 32px;text-align:center;margin-bottom:28px;border:1px solid #264d73">
      <p style="color:#ffffff !important;font-size:14px;margin:0 0 20px;line-height:1.65">Haven't started yet? Module 01 is waiting — five focused lessons, real DoD content, no filler.</p>
      <a href="${APP_URL}/#/module/dod-foundations" class="btn" style="display:inline-block;background:#f5c842;color:#0d2137;font-weight:800;font-size:15px;padding:13px 30px;border-radius:8px;text-decoration:none">Pick Up Where You Left Off →</a>
    </div>

    <div class="tip-box">
      <div class="tip-label">💡 Study tip</div>
      <p>Use the skill level selector in each lesson. Start on Novice if the terminology is new — the same content is presented with less assumed knowledge. Move up to Intermediate or Advanced once the concepts feel familiar. This isn't a test; it's a tool.</p>
    </div>

    <p style="font-size:14px;color:#0d2137;font-weight:700;margin-top:4px">— Lucas, Acqlerate</p>
  `;

  await resend.emails.send({
    from: FROM, to,
      replyTo: "lucas.l.cruz.es@gmail.com",
    subject: "Why acquisition literacy actually matters (and a quick win from Foundations)",
    html: emailShell("The DoD spends $400B/year. Here's why understanding it gives you a career edge.", body),
  });
  console.log(`[email] Email 2 (day 2) sent to ${to}`);
}

// ─── Email 3: AI Study Assistant (Day 4) ───────────────────────────────────

export async function sendEmail3(to: string, username: string): Promise<void> {
  if (!resend) return;

  const body = `
    <div class="greeting">Hey ${username} —</div>
    <p>Quick note about a feature inside Acqlerate that most people don't fully use at first — and then can't live without.</p>

    <div class="section-label">Meet your AI Study Assistant</div>
    <p>Every lesson has a built-in AI assistant that knows the entire curriculum — FAR clauses, DFARS supplements, appropriations law, program management frameworks, contracting vehicles, and more. It's not a generic chatbot. It's scoped specifically to defense acquisitions.</p>

    <div class="highlight-box">
      <p><strong>What you can actually ask it:</strong></p>
    </div>

    <ul class="checklist">
      <li>"What's the difference between a CPFF and a CPIF contract, and when would a CO choose one over the other?"</li>
      <li>"Walk me through what happens at a Milestone B review for an ACAT I program."</li>
      <li>"I'm confused about the relationship between OSD CAPE and the program office. Can you explain it simply?"</li>
      <li>"What does 'color of money' mean and why does it cause so many problems in program execution?"</li>
      <li>"How does an OASIS+ task order competition work?"</li>
    </ul>

    <p>The assistant explains things at whatever level you need — plain-language basics or nuanced technical depth. If a lesson introduces a concept that isn't clicking, just ask.</p>

    <div class="cta-box" style="background:#0d2137;border-radius:12px;padding:28px 32px;text-align:center;margin-bottom:28px;border:1px solid #264d73">
      <p style="color:#ffffff !important;font-size:14px;margin:0 0 20px;line-height:1.65">Open any lesson, scroll to the bottom, and start a conversation. You'll be surprised how much faster the material sticks when you can ask follow-up questions in real time.</p>
      <a href="${APP_URL}/#/module/dod-foundations" class="btn" style="display:inline-block;background:#f5c842;color:#0d2137;font-weight:800;font-size:15px;padding:13px 30px;border-radius:8px;text-decoration:none">Try It in Module 01 →</a>
    </div>

    <div class="tip-box">
      <div class="tip-label">💡 Power move</div>
      <p>After you finish a lesson, ask the assistant: <em>"Quiz me on this lesson's key concepts."</em> It'll generate custom practice questions beyond the built-in quiz — which is especially useful if you're preparing for a DAWIA certification or a role transition interview.</p>
    </div>

    <p style="font-size:14px;color:#0d2137;font-weight:700;margin-top:4px">— Lucas, Acqlerate</p>
  `;

  await resend.emails.send({
    from: FROM, to,
      replyTo: "lucas.l.cruz.es@gmail.com",
    subject: "The feature inside Acqlerate most people underuse",
    html: emailShell("Your AI Study Assistant can answer any acquisition question in real time.", body),
  });
  console.log(`[email] Email 3 (day 4) sent to ${to}`);
}

// ─── Email 4: Social proof + upgrade CTA (Day 7) ───────────────────────────

export async function sendEmail4(to: string, username: string): Promise<void> {
  if (!resend) return;

  const body = `
    <div class="greeting">Hey ${username} —</div>
    <p>It's been about a week since you joined. I wanted to check in and share what others are saying — and tell you what's waiting on the other side of Module 01.</p>

    <div class="section-label">What Acqlerate users are saying</div>

    <div class="highlight-box">
      <p>"I've been in defense contracting for three years and I finally understand how the PPBE cycle connects to what happens in my program office. This should be required reading for anyone starting in the field."</p>
      <p style="margin-top:8px;font-size:13px;color:#64748b"><strong>— Program Analyst, Army Program Executive Office</strong></p>
    </div>

    <div class="highlight-box">
      <p>"The Capture Management module alone was worth the price. I've been in BD for two years and it gave me a framework for win strategy that I've already started applying to active pursuits."</p>
      <p style="margin-top:8px;font-size:13px;color:#64748b"><strong>— BD Manager, Mid-size Defense Contractor</strong></p>
    </div>

    <div class="highlight-box">
      <p>"I used the AI assistant to prep for my PM interview. I asked it to simulate a program review scenario and grill me on EVM. Got the job."</p>
      <p style="margin-top:8px;font-size:13px;color:#64748b"><strong>— New Program Manager, DoD Civilian</strong></p>
    </div>

    <div class="section-label">What unlocks with Pro</div>
    <ul class="checklist">
      <li>All 6 modules — Defense Finance, Contracting, Data Analytics, Capture Management, Program Ops</li>
      <li>30+ lessons with real DoD content — not textbook theory</li>
      <li>Skill-level system: Novice → Intermediate → Advanced in every lesson</li>
      <li>Module gate assessments to validate what you've learned</li>
      <li>Career roadmap for USG and contractor tracks — with salary benchmarks</li>
      <li>AI Study Assistant — unlimited across all modules</li>
      <li>Content updates as regulations change (FAR/DFARS updates, new AAF guidance)</li>
    </ul>

    <div class="cta-box" style="background:#0d2137;border-radius:12px;padding:28px 32px;text-align:center;margin-bottom:28px;border:1px solid #264d73">
      <p style="color:#ffffff !important;font-size:14px;margin:0 0 20px;line-height:1.65">Start at $5.99/month — or get lifetime access for a one-time payment of $149. Either way, you're covered by a 30-day money-back guarantee.</p>
      <a href="${APP_URL}/#/upgrade" class="btn" style="display:inline-block;background:#f5c842;color:#0d2137;font-weight:800;font-size:15px;padding:13px 30px;border-radius:8px;text-decoration:none">Unlock All 6 Modules →</a>
    </div>

    <p>Still working through Module 01? No rush. It'll be there when you're ready.</p>
    <p style="font-size:14px;color:#0d2137;font-weight:700;margin-top:4px">— Lucas, Acqlerate</p>
  `;

  await resend.emails.send({
    from: FROM, to,
      replyTo: "lucas.l.cruz.es@gmail.com",
    subject: "What's waiting after Module 01 (and what users are saying)",
    html: emailShell("Real feedback from defense professionals — and what Pro unlocks.", body),
  });
  console.log(`[email] Email 4 (day 7) sent to ${to}`);
}

// ─── Email 5: Deep dive — Defense Finance or Contracting (Day 10) ──────────

export async function sendEmail5(to: string, username: string): Promise<void> {
  if (!resend) return;

  const body = `
    <div class="greeting">Hey ${username} —</div>
    <p>Let me give you a preview of what's inside the modules that professionals in this field call "the content they wish existed when they started."</p>

    <div class="section-label">Inside Module 02: Defense Finance & Budgeting</div>
    <p>This is the module that changes how you see every program. Once you understand how DoD money actually works, you'll recognize patterns in program delays, contractor disputes, and budget reductions that previously seemed random.</p>

    <div class="highlight-box">
      <p><strong>Color of Money</strong> — DoD appropriations aren't interchangeable. Research & Development (RDT&E), Procurement, Operations & Maintenance, and Military Personnel funds each have specific authorized uses, obligation windows, and expenditure periods. Mixing them up isn't a paperwork problem — it's an Anti-Deficiency Act violation that can end careers.</p>
    </div>

    <div class="highlight-box">
      <p><strong>Earned Value Management (EVM)</strong> — EVM is the language of program health. Cost Variance, Schedule Variance, Cost Performance Index, and the Estimate at Completion tell you whether a program is in trouble before the problems become public. Knowing how to read an EVM report is one of the highest-leverage skills in program management.</p>
    </div>

    <div class="highlight-box">
      <p><strong>Nunn-McCurdy</strong> — When a program's Unit Cost grows more than 15% above the baseline, it triggers a Nunn-McCurdy breach — a statutory requirement to notify Congress and potentially restructure or terminate the program. Understanding this threshold explains why program managers are intensely focused on unit cost and why restructuring decisions sometimes seem counterintuitive.</p>
    </div>

    <div class="section-label">Inside Module 03: Defense Contracting Fundamentals</div>
    <p>Most people in defense contracting know the contract types at a surface level. This module goes deeper — into why each type exists, when it's appropriate, and what the risk allocation means for both sides of the table.</p>

    <div class="highlight-box">
      <p><strong>The real difference between FFP and Cost-Plus</strong> isn't just "who bears the risk." It's about what kind of work is being done. FFP is appropriate when the government can write a detailed, stable Statement of Work and the contractor can price it with confidence. Cost-Plus is appropriate for high-uncertainty development work where locking in a price would force the contractor to pad the proposal with massive contingency — or lose money trying to deliver.</p>
    </div>

    <div class="cta-box" style="background:#0d2137;border-radius:12px;padding:28px 32px;text-align:center;margin-bottom:28px;border:1px solid #264d73">
      <p style="color:#ffffff !important;font-size:14px;margin:0 0 20px;line-height:1.65">This is what Modules 02 and 03 actually look like. Fifteen more lessons, full quizzes, key terms, and an AI assistant to fill in the gaps — starting at $5.99/month.</p>
      <a href="${APP_URL}/#/upgrade" class="btn" style="display:inline-block;background:#f5c842;color:#0d2137;font-weight:800;font-size:15px;padding:13px 30px;border-radius:8px;text-decoration:none">Unlock Defense Finance &amp; Contracting →</a>
    </div>

    <p style="font-size:14px;color:#0d2137;font-weight:700;margin-top:4px">— Lucas, Acqlerate</p>
  `;

  await resend.emails.send({
    from: FROM, to,
      replyTo: "lucas.l.cruz.es@gmail.com",
    subject: "A preview of what's inside Defense Finance & Contracting",
    html: emailShell("Color of money, Nunn-McCurdy, and the real difference between FFP and Cost-Plus.", body),
  });
  console.log(`[email] Email 5 (day 10) sent to ${to}`);
}

// ─── Email 6: Personalized learning path nudge (Day 14) ────────────────────

export async function sendEmail6(to: string, username: string): Promise<void> {
  if (!resend) return;

  const body = `
    <div class="greeting">Hey ${username} —</div>
    <p>Two weeks in. I want to make sure you're getting the most out of Acqlerate — so let me walk you through how the learning path system works and how to use it for your specific situation.</p>

    <div class="section-label">The two paths through Acqlerate</div>

    <div class="module-row">
      <span class="mod-icon">🏛️</span>
      <div>
        <div class="mod-name">USG Acquisition Personnel Path</div>
        <div class="mod-desc">COs, PMs, Budget Analysts, Program Analysts, and DoD civilians focused on the government side of the table. Your priorities: PPBE, appropriations law, EVM, source selection process, and program oversight. Start with Foundations → Finance → Contracting → Data Analytics.</div>
      </div>
    </div>

    <div class="module-row">
      <span class="mod-icon">🏢</span>
      <div>
        <div class="mod-name">Defense Contractor Path</div>
        <div class="mod-desc">BD leads, Capture Managers, proposal writers, Program Managers on the industry side. Your priorities: understanding the customer's decision process, writing to evaluation criteria, building winning strategies. Start with Foundations → Contracting → Capture Management → Program Ops.</div>
      </div>
    </div>

    <div class="highlight-box">
      <p>When you set up your profile inside Acqlerate, the platform personalizes your module sequence and surfaces the content most relevant to your role and experience level. If you haven't completed your profile yet, it takes about two minutes.</p>
    </div>

    <div class="section-label">Where to focus next based on your goals</div>
    <ul class="checklist">
      <li><strong>New to defense / career transition:</strong> Finish Foundations thoroughly. Then go straight to Contracting — it gives you the vocabulary to participate in almost any acquisition conversation.</li>
      <li><strong>On the government side:</strong> Defense Finance & Budgeting after Foundations. The PPBE module alone is worth the subscription.</li>
      <li><strong>In BD or Capture:</strong> Contracting first (understand the customer's process), then Capture Management. These two modules together will change how you approach every pursuit.</li>
      <li><strong>Program Manager:</strong> Finance + Data Analytics. EVM and program dashboards are where careers get made or broken.</li>
    </ul>

    <div class="cta-box" style="background:#0d2137;border-radius:12px;padding:28px 32px;text-align:center;margin-bottom:28px;border:1px solid #264d73">
      <p style="color:#ffffff !important;font-size:14px;margin:0 0 20px;line-height:1.65">Your path is waiting. All five Pro modules + your personalized sequence — starting at $5.99/month with a 30-day guarantee.</p>
      <a href="${APP_URL}/#/upgrade" class="btn" style="display:inline-block;background:#f5c842;color:#0d2137;font-weight:800;font-size:15px;padding:13px 30px;border-radius:8px;text-decoration:none">Start Your Learning Path →</a>
    </div>

    <p>Reply to this email if you want a more specific recommendation based on your role. I'm happy to point you in the right direction.</p>
    <p style="font-size:14px;color:#0d2137;font-weight:700;margin-top:4px">— Lucas, Acqlerate</p>
  `;

  await resend.emails.send({
    from: FROM, to,
      replyTo: "lucas.l.cruz.es@gmail.com",
    subject: "Your personalized path through Acqlerate (based on your role)",
    html: emailShell("USG personnel vs. contractor side — here's the sequence that fits your situation.", body),
  });
  console.log(`[email] Email 6 (day 14) sent to ${to}`);
}

// ─── Email 7: Final CTA with offer (Day 21) ────────────────────────────────

export async function sendEmail7(to: string, username: string): Promise<void> {
  if (!resend) return;

  const body = `
    <div class="greeting">Hey ${username} —</div>
    <p>Three weeks ago you created an account on Acqlerate. I wanted to send one final note before I stop checking in — because I think this might be the right moment.</p>

    <div class="section-label">An honest pitch</div>
    <p>The defense acquisition community is enormous — nearly 150,000 acquisition workforce members across the DoD, plus hundreds of thousands more on the contractor side. And yet the shared vocabulary, the institutional knowledge, the "how things actually work" understanding? It's mostly passed down informally, through years of experience, mentors, and making expensive mistakes.</p>

    <p>Acqlerate exists to compress that learning curve. Not to replace experience — nothing does — but to give you the frameworks and vocabulary so you can learn faster once you're in the room.</p>

    <div class="highlight-box">
      <p>If you go Pro today, here's what you're getting access to:</p>
    </div>

    <ul class="checklist">
      <li>5 Pro modules — Defense Finance, Contracting, Data Analytics, Capture Management, Program Ops</li>
      <li>30+ lessons built from real DoD programs, contracts, and career paths</li>
      <li>Skill levels (Novice → Intermediate → Advanced) so the content grows with you</li>
      <li>Module gate assessments to validate what you've actually learned</li>
      <li>Full career roadmap — USG and contractor tracks, salary benchmarks, certification guidance</li>
      <li>AI Study Assistant across all modules — unlimited</li>
      <li>All future content updates, included</li>
    </ul>

    <div class="cta-box" style="background:#0d2137;border-radius:12px;padding:28px 32px;text-align:center;margin-bottom:28px;border:1px solid #264d73">
      <p style="color:#ffffff !important;font-size:16px;font-weight:800;margin:0 0 6px">Start at $5.99/month</p>
      <p style="color:#ffffff !important;font-size:13px;margin:0 0 20px;opacity:0.8">or $149 one-time for lifetime access — no renewals, ever</p>
      <a href="${APP_URL}/#/upgrade" class="btn" style="display:inline-block;background:#f5c842;color:#0d2137;font-weight:800;font-size:15px;padding:13px 30px;border-radius:8px;text-decoration:none;margin-bottom:10px">Unlock Pro Access →</a>
      <p style="color:#ffffff !important;font-size:12px;margin:12px 0 0;opacity:0.7">30-day money-back guarantee. No questions asked.</p>
    </div>

    <p>If now isn't the right time, that's genuinely fine. Module 01 stays free forever — come back when you're ready.</p>

    <p>But if you've been thinking about it — this is me telling you the content is worth it. I built Acqlerate because this resource didn't exist when I needed it. I hope it helps you the way I wish it had helped me.</p>

    <p style="font-size:14px;color:#0d2137;font-weight:700;margin-top:4px">— Lucas, Acqlerate</p>

    <hr class="divider"/>
    <p style="font-size:12px;color:#94a3b8">After today I'll stop sending onboarding emails. You'll only hear from me when there's something genuinely worth sharing — a new module, a major content update, or something relevant to your path.</p>
  `;

  await resend.emails.send({
    from: FROM, to,
      replyTo: "lucas.l.cruz.es@gmail.com",
    subject: "One last note (and why I think Acqlerate is worth it)",
    html: emailShell("Module 01 stays free forever. But here's what's on the other side.", body),
  });
  console.log(`[email] Email 7 (day 21) sent to ${to}`);
}

// ─── Lead Nurture Email (landing page opt-in) ────────────────────────────────

/**
 * Sent immediately when someone submits the landing page email capture form.
 * Tells them their kit is tailored to their role — drives them to register
 * and complete the onboarding flow, which triggers sendStarterKitEmail().
 */
export async function sendLeadNurtureEmail(to: string, source?: string): Promise<void> {
  if (!resend) { console.log('[email] RESEND_API_KEY not set — skipping lead nurture email'); return; }

  // Teams playbook source gets a dedicated direct-download email
  if (source === 'teams_playbook') {
    const body = `
      <div style="font-size:18px;font-weight:800;color:#0d2137;margin:0 0 8px">Your GovCon Onboarding Playbook is ready.</div>
      <p style="font-size:15px;color:#374151;line-height:1.75;margin:0 0 20px">Thanks for downloading. Here’s your copy of the 30-day onboarding playbook for building acquisition-fluent GovCon teams.</p>
      <div style="background:#f0f9fa;border:2px solid #01696f;border-radius:12px;padding:24px 28px;margin-bottom:24px;text-align:center">
        <div style="font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#01696f;margin-bottom:10px">GovCon Onboarding Playbook</div>
        <div style="font-size:22px;font-weight:800;color:#0d2137;margin-bottom:8px">How to onboard new hires into<br>DoD acquisition in 30 days</div>
        <p style="font-size:13px;color:#374151;margin:0 0 20px;line-height:1.6">A 9-page practical guide covering the 30-day framework, role-specific learning paths, common onboarding mistakes, and a Day 1 checklist.</p>
        <a href="${APP_URL}/govcon-onboarding-playbook.pdf"
           style="display:inline-block;background:#01696f;color:#ffffff;font-weight:800;font-size:15px;padding:13px 32px;border-radius:8px;text-decoration:none">
          Download the Playbook →
        </a>
      </div>
      <div style="background:#0d2137;border-radius:12px;padding:24px 28px;text-align:center;margin-bottom:24px">
        <p style="color:#ffffff;font-size:14px;font-weight:700;margin:0 0 6px">Put it into practice with Acqlerate.</p>
        <p style="color:rgba(255,255,255,0.65);font-size:13px;margin:0 0 16px;line-height:1.6">Module 01 is completely free. Give your team a structured path through DoD acquisition — no classroom, no scheduling, no per-seat contracts.</p>
        <a href="${APP_URL}/app#/register"
           style="display:inline-block;background:#f5c842;color:#0d2137;font-weight:800;font-size:14px;padding:12px 28px;border-radius:8px;text-decoration:none">
          Start Free →
        </a>
      </div>
      <p style="font-size:12px;color:#9ca3af;line-height:1.7;margin:0">You’re receiving this because you requested the GovCon Onboarding Playbook from acqlerate.com. No spam — unsubscribe anytime.</p>
    `;
    await resend.emails.send({
      from: FROM,
      replyTo: "lucas.l.cruz.es@gmail.com",
      to,
      subject: 'Your GovCon Onboarding Playbook is ready to download',
      html: emailShell('GovCon Onboarding Playbook — download inside', body),
    });
    console.log(`[email] Playbook delivery email sent to ${to}`);
    return;
  }

  // Pay guide source gets a dedicated delivery email
  if (source === 'pay_guide') {
    const body = `
      <div style="font-size:18px;font-weight:800;color:#0d2137;margin:0 0 8px">Your pay guide is ready.</div>
      <p style="font-size:15px;color:#374151;line-height:1.75;margin:0 0 20px">Thanks for downloading. Here's your copy of <em>How Your Pay Works on a Government Contract</em> — the honest explanation nobody gave you when you started.</p>
      <div style="background:#f0f9fa;border:2px solid #01696f;border-radius:12px;padding:24px 28px;margin-bottom:24px;text-align:center">
        <div style="font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#01696f;margin-bottom:10px">Free Download</div>
        <div style="font-size:22px;font-weight:800;color:#0d2137;margin-bottom:8px">How Your Pay Works on a<br>Government Contract</div>
        <p style="font-size:13px;color:#374151;margin:0 0 20px;line-height:1.6">10 pages. Plain English. The full breakdown of rate structures, overhead, raises, contract types, and the questions you should be asking.</p>
        <a href="${APP_URL}/how-your-pay-works.pdf"
           style="display:inline-block;background:#01696f;color:#ffffff;font-weight:800;font-size:15px;padding:13px 32px;border-radius:8px;text-decoration:none">
          Download the Guide →
        </a>
      </div>
      <div style="background:#0d2137;border-radius:12px;padding:24px 28px;text-align:center;margin-bottom:24px">
        <p style="color:#ffffff;font-size:14px;font-weight:700;margin:0 0 6px">If this made you curious about the bigger picture —</p>
        <p style="color:rgba(255,255,255,0.65);font-size:13px;margin:0 0 16px;line-height:1.6">Module 01 at acqlerate.com is completely free. It covers the full DoD acquisition system in plain English — who the players are, how money flows, and how contracts actually get awarded.</p>
        <a href="${APP_URL}/app#/register"
           style="display:inline-block;background:#c8972a;color:#ffffff;font-weight:800;font-size:14px;padding:12px 28px;border-radius:8px;text-decoration:none">
          Start Module 01 — Free →
        </a>
      </div>
      <p style="font-size:12px;color:#9ca3af;line-height:1.7;margin:0">You're receiving this because you requested the pay guide from acqlerate.com. No spam — unsubscribe anytime.</p>
    `;
    await resend.emails.send({
      from: FROM,
      replyTo: "lucas.l.cruz.es@gmail.com",
      to,
      subject: 'Your pay guide is ready — How Your Pay Works on a Government Contract',
      html: emailShell('How Your Pay Works on a Government Contract — download inside', body),
    });
    console.log(`[email] Pay guide delivery email sent to ${to}`);
    return;
  }

  const body = `
    <div style="font-size:18px;font-weight:800;color:#0d2137;margin:0 0 8px">Your Acquisition Starter Kit is ready.</div>
    <p style="font-size:15px;color:#374151;line-height:1.75;margin:0 0 20px">We just need to know which side of the table you're on — so we can send you the right version.</p>

    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:24px">
      <tr>
        <td style="padding-right:8px;vertical-align:top;width:50%">
          <div style="background:#f0f9fa;border:2px solid #01696f;border-radius:12px;padding:20px 18px">
            <div style="font-size:22px;margin-bottom:8px">🏛️</div>
            <div style="font-size:14px;font-weight:800;color:#0d2137;margin-bottom:6px">USG Acquisition Personnel</div>
            <div style="font-size:12px;color:#374151;line-height:1.6;margin-bottom:12px">DoD civilians, active duty, COs, PMs, budget analysts working inside a program office or contracting shop.</div>
            <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:#01696f;margin-bottom:6px">Kit includes:</div>
            <ul style="font-size:12px;color:#374151;margin:0;padding-left:16px;line-height:1.8">
              <li>DoD Acquisition Lifecycle Cheat Sheet</li>
              <li>ACAT Decision Tree</li>
              <li>5 Most Common PM Mistakes</li>
              <li>50+ Acronym Glossary</li>
            </ul>
          </div>
        </td>
        <td style="padding-left:8px;vertical-align:top;width:50%">
          <div style="background:#fff8e6;border:2px solid #d4a017;border-radius:12px;padding:20px 18px">
            <div style="font-size:22px;margin-bottom:8px">🏢</div>
            <div style="font-size:14px;font-weight:800;color:#0d2137;margin-bottom:6px">Defense Industry Contractor</div>
            <div style="font-size:12px;color:#374151;line-height:1.6;margin-bottom:12px">Prime/sub contractors, BD leads, Capture Managers, proposal teams, and program support working for industry.</div>
            <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:#d4a017;margin-bottom:6px">Kit includes:</div>
            <ul style="font-size:12px;color:#374151;margin:0;padding-left:16px;line-height:1.8">
              <li>Task Orders vs. Contracts Guide</li>
              <li>GSA AAS-D & IDIQ Vehicle Landscape</li>
              <li>Who's Buying — AFICC, ESS & MAJCOM</li>
              <li>5 Common Contractor Mistakes + 70+ Acronyms</li>
            </ul>
          </div>
        </td>
      </tr>
    </table>

    <div style="background:#0d2137;border-radius:12px;padding:28px 32px;text-align:center;margin-bottom:24px;border:1px solid #264d73">
      <p style="color:#ffffff;font-size:15px;font-weight:700;margin:0 0 6px">Create your free account — takes 60 seconds.</p>
      <p style="color:rgba(255,255,255,0.7);font-size:13px;margin:0 0 20px;line-height:1.6">You'll pick your path during setup and we'll send the right kit straight to your inbox. Module 01 is free with no credit card required.</p>
      <a href="${APP_URL}/app#/register"
         style="display:inline-block;background:#f5c842;color:#0d2137;font-weight:800;font-size:15px;padding:13px 32px;border-radius:8px;text-decoration:none">
        Choose Your Path &amp; Get Your Kit →
      </a>
    </div>

    <p style="font-size:13px;color:#64748b;line-height:1.7;margin:0">Already have an account? <a href="${APP_URL}/app#/dashboard" style="color:#01696f;text-decoration:none;font-weight:600">Sign in here</a> and complete the quick onboarding if you haven't yet — that's what unlocks the kit delivery.</p>
  `;

  await resend.emails.send({
    from: FROM,
      replyTo: "lucas.l.cruz.es@gmail.com",
    to,
    subject: 'Your Acquisition Starter Kit — which side of the table are you on?',
    html: emailShell('USG or Contractor? Pick your path and get the right kit.', body),
  });
  console.log(`[email] Lead nurture email sent to ${to}`);
}

// ─── Admin Signup Notification ──────────────────────────────────────────────

/**
 * Notify the admin (Lucas) whenever a new user signs up.
 * Fires non-blocking — failures are logged but never surface to the user.
 */
export async function sendAdminNotification(
  newUserEmail: string,
  newUserName: string,
  method: 'email_password' | 'google'
): Promise<void> {
  const adminEmail = process.env.ADMIN_EMAILS || 'lucas.l.cruz.es@gmail.com';
  if (!resend) { console.log('[email] RESEND_API_KEY not set — skipping admin notification'); return; }

  const methodLabel = method === 'google' ? 'Google OAuth' : 'Email / Password';
  const now = new Date().toLocaleString('en-US', {
    timeZone: 'America/New_York',
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  const body = `
    <div style="font-size:17px;font-weight:700;color:#0d2137;margin:0 0 16px">🎉 New signup on Acqlerate</div>

    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:20px">
      <tr><td style="background:#f0f9fa;border:1px solid #d1ede0;border-radius:10px;padding:20px 24px">
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
          <tr>
            <td style="font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:0.08em;color:#01696f;padding-bottom:14px" colspan="2">User Details</td>
          </tr>
          <tr>
            <td style="font-size:13px;color:#64748b;padding:4px 0;width:120px">Name</td>
            <td style="font-size:14px;font-weight:700;color:#0d2137;padding:4px 0">${newUserName}</td>
          </tr>
          <tr>
            <td style="font-size:13px;color:#64748b;padding:4px 0">Email</td>
            <td style="font-size:14px;font-weight:600;color:#01696f;padding:4px 0">${newUserEmail}</td>
          </tr>
          <tr>
            <td style="font-size:13px;color:#64748b;padding:4px 0">Method</td>
            <td style="font-size:14px;font-weight:600;color:#0d2137;padding:4px 0">${methodLabel}</td>
          </tr>
          <tr>
            <td style="font-size:13px;color:#64748b;padding:4px 0">Time (ET)</td>
            <td style="font-size:14px;color:#0d2137;padding:4px 0">${now}</td>
          </tr>
        </table>
      </td></tr>
    </table>

    <p style="font-size:13px;color:#64748b;margin:0">This is an automated notification from Acqlerate. No action needed.</p>
  `;

  await resend.emails.send({
    from: FROM,
    to: adminEmail,
    subject: `New signup: ${newUserName} (${newUserEmail}) via ${methodLabel}`,
    html: emailShell(`${newUserName} just created an account on Acqlerate.`, body),
  });
  console.log(`[email] Admin notification sent — new user: ${newUserEmail} (${method})`);
}

// ─── Dispatch helper ───────────────────────────────────────────────────────

const EMAIL_SEQUENCE: Array<{
  day: number;
  fn: (to: string, username: string) => Promise<void>;
}> = [
  { day: 0,  fn: sendWelcomeEmail },
  { day: 2,  fn: sendEmail2 },
  { day: 4,  fn: sendEmail3 },
  { day: 7,  fn: sendEmail4 },
  { day: 10, fn: sendEmail5 },
  { day: 14, fn: sendEmail6 },
  { day: 21, fn: sendEmail7 },
];

/**
 * Send any emails due today for a user.
 * `registeredAt` — ISO date string of when the user signed up.
 * `sentEmailDays` — array of day-numbers already sent (e.g. [0, 2]).
 * Returns the updated sentEmailDays array.
 */
export async function processDripEmails(
  to: string,
  username: string,
  registeredAt: string,
  sentEmailDays: number[]
): Promise<number[]> {
  const regDate = new Date(registeredAt);
  const now = new Date();
  const daysSinceReg = Math.floor((now.getTime() - regDate.getTime()) / (1000 * 60 * 60 * 24));

  const updated = [...sentEmailDays];

  for (const { day, fn } of EMAIL_SEQUENCE) {
    if (daysSinceReg >= day && !updated.includes(day)) {
      try {
        await fn(to, username);
        updated.push(day);
      } catch (err) {
        console.error(`[email] Failed drip email day=${day} to=${to}:`, err);
      }
    }
  }

  return updated;
}
