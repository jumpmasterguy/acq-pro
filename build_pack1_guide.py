# The brand icon as a self-contained data URI. These guides are rendered from a
# standalone HTML file, so an absolute /acqlerate-icon.svg URL would not resolve;
# and the mark must never be redrawn by hand here — read the master raster.
import base64 as _b64, pathlib as _pl
_ICON_PNG = _pl.Path(__file__).parent / "brand" / "acqlerate-icon-256.png"
ICON_SVG = ('<img alt="" style="width:100%;height:100%;display:block;border-radius:inherit" src="data:image/png;base64,'
            + _b64.b64encode(_ICON_PNG.read_bytes()).decode() + '">')

def header(page_num, title="PM Essentials: Your First 90 Days"):
    return f'''<div class="header-bar">
    <div class="left">
      <div class="icon-badge sm">{ICON_SVG}</div>
      <span class="wordmark-text on-dark sm">Acq<span class="lerate">lerate</span></span>
      <span style="color:#5C6B7A">|</span>
      <span class="title">{title}</span>
    </div>
    <div class="right">Page {page_num}</div>
  </div>
  <div class="header-accent"></div>'''

FOOTER = '<div class="footer-bar">Last Updated: September 2026 &nbsp;|&nbsp; Reflects FAC 2025-06 &nbsp;|&nbsp; acqlerate.com</div>'

HEAD = '''<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  @page { size: letter; margin: 0; }
  * { box-sizing: border-box; }
  body { margin: 0; font-family: 'Helvetica Neue', Arial, sans-serif; }

  :root {
    --navy: #0D1B2A;
    --teal: #01696F;
    --teal-light: #E6F2F3;
    --gray: #6B7280;
    --border: #E5E7EB;
  }

  .page { width: 8.5in; height: 11in; position: relative; page-break-after: always; overflow: hidden; }
  .page:last-child { page-break-after: avoid; }

  .icon-badge { width: 46px; height: 46px; background: var(--teal); border-radius: 11px; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .icon-badge svg { width: 30px; height: 30px; }
  .icon-badge.sm { width: 26px; height: 26px; border-radius: 7px; }
  .icon-badge.sm svg { width: 17px; height: 17px; }
  .wordmark-row { display: flex; align-items: center; gap: 12px; }
  .wordmark-text { font-weight: 700; font-size: 20px; letter-spacing: -0.01em; }
  .wordmark-text .lerate { color: var(--teal); }
  .wordmark-text.on-dark { color: white; }
  .wordmark-text.on-light { color: var(--navy); }
  .wordmark-text.sm { font-size: 13px; }

  .cover { background: var(--navy); color: white; padding: 0.7in 0.75in; }
  .pack-chip { display: inline-block; background: var(--teal); color: white; font-size: 11px; font-weight: 800; letter-spacing: 0.08em; padding: 5px 12px; border-radius: 20px; text-transform: uppercase; }
  .cover .wordmark-row { margin-top: 26px; }
  .cover h1 { font-size: 34px; font-weight: 800; line-height: 1.15; margin: 22px 0 10px; max-width: 6in; }
  .cover .subtitle { font-size: 16px; color: #A9B4BF; margin: 0; }
  .cover .divider { height: 3px; background: var(--teal); margin: 0.55in 0 22px; }
  .included-label { font-size: 11px; font-weight: 800; letter-spacing: 0.12em; color: #7FB8BC; text-transform: uppercase; margin-bottom: 14px; }
  .included-grid { display: flex; flex-wrap: wrap; gap: 10px 40px; }
  .included-item { display: flex; align-items: center; gap: 10px; font-size: 14px; width: 46%; }
  .dot { width: 7px; height: 7px; border-radius: 50%; background: var(--teal); flex-shrink: 0; }
  .cover-footer { position: absolute; bottom: 0.6in; left: 0.75in; right: 0.75in; display: flex; justify-content: space-between; font-size: 11px; color: #8792A0; }

  .content { background: white; color: #1f2937; }
  .header-bar { position: absolute; top: 0; left: 0; right: 0; height: 46px; background: var(--navy); display: flex; align-items: center; justify-content: space-between; padding: 0 0.6in; }
  .header-bar .left { display: flex; align-items: center; gap: 8px; color: #E8EDF1; font-size: 12px; }
  .header-bar .left .title { white-space: nowrap; }
  .header-bar .right { color: #9AA6B2; font-size: 12px; flex-shrink: 0; margin-left: 12px; }
  .header-accent { position: absolute; top: 46px; left: 0; right: 0; height: 3px; background: var(--teal); }
  .body-area { position: absolute; top: 80px; bottom: 46px; left: 0.75in; right: 0.75in; }
  .footer-bar { position: absolute; bottom: 0; left: 0; right: 0; height: 46px; background: #F3F4F6; display: flex; align-items: center; justify-content: center; font-size: 10.5px; color: #8792A0; }

  h2.section-title { font-size: 22px; color: var(--navy); font-weight: 800; margin: 0 0 8px; border-bottom: 2px solid var(--teal); padding-bottom: 10px; }
  .tool-tag { font-size: 11px; font-weight: 800; letter-spacing: 0.1em; color: var(--teal); text-transform: uppercase; margin-bottom: 4px; }
  h3.tool-title { font-size: 24px; color: var(--navy); font-weight: 800; margin: 0 0 16px; }
  h4.sub { font-size: 13px; font-weight: 800; letter-spacing: 0.04em; color: var(--navy); text-transform: uppercase; margin: 16px 0 6px; }
  p { font-size: 12.5px; line-height: 1.55; color: #374151; margin: 0 0 9px; }
  .callout { background: var(--teal-light); border-left: 4px solid var(--teal); border-radius: 0 10px 10px 0; padding: 12px 16px; margin: 10px 0; }
  .callout p { margin: 0; }
  .callout-label { font-size: 10.5px; font-weight: 800; letter-spacing: 0.08em; color: var(--teal); text-transform: uppercase; margin-bottom: 5px; }
  ul.tight { margin: 4px 0 9px; padding-left: 18px; }
  ul.tight li { font-size: 12.5px; line-height: 1.55; color: #374151; margin-bottom: 3px; }
  .step { display: flex; gap: 12px; margin-bottom: 10px; align-items: flex-start; }
  .step-num { width: 22px; height: 22px; border-radius: 50%; background: var(--teal); color: white; font-size: 11px; font-weight: 800; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 1px; }
  .step-body b { display: block; font-size: 13px; color: var(--navy); margin-bottom: 2px; }
  .step-body span { font-size: 12px; color: var(--gray); }
  table.ref { width: 100%; border-collapse: collapse; margin: 8px 0 14px; font-size: 12px; }
  table.ref th { background: var(--navy); color: white; text-align: left; padding: 6px 10px; font-size: 11px; }
  table.ref td { padding: 6px 10px; border-bottom: 1px solid var(--border); color: #374151; }
  table.ref tr:nth-child(even) td { background: #F9FAFB; }
</style>
</head>
<body>
'''

# ---------- PAGE 1: COVER ----------
cover = f'''<div class="page cover">
  <span class="pack-chip">Pack 1</span>
  <div class="wordmark-row">
    <div class="icon-badge">{ICON_SVG}</div>
    <span class="wordmark-text on-dark">Acq<span class="lerate">lerate</span></span>
  </div>
  <h1>PM Essentials: Your First 90 Days</h1>
  <p class="subtitle">One workbook that builds its own program status report</p>
  <div class="divider"></div>
  <div class="included-label">What's Included</div>
  <div class="included-grid">
    <div class="included-item"><span class="dot"></span>Program Dashboard</div>
    <div class="included-item"><span class="dot"></span>Risk Register + Risk Map</div>
    <div class="included-item"><span class="dot"></span>First 90 Days Checklist</div>
    <div class="included-item"><span class="dot"></span>RACI</div>
    <div class="included-item"><span class="dot"></span>Spend Plan</div>
    <div class="included-item"><span class="dot"></span>PM Briefing Deck</div>
  </div>
  <div class="cover-footer">
    <span>acqlerate.com</span>
    <span>September 2026 Edition &middot; FAC 2025-06</span>
  </div>
</div>'''

# ---------- PAGE 2: WELCOME ----------
welcome = f'''<div class="page content">
  {header(2)}
  <div class="body-area">
    <h2 class="section-title">Welcome &amp; Overview</h2>
    <p>You just got handed a program, or you are about to. This pack is what an experienced DoD program manager does in the first 90 days, built as one Excel workbook instead of five separate files.</p>
    <p>It is not a set of blank forms. The Risk Register already knows the sixteen things that kill DoD programs. The RACI already knows that the PEO owns the milestone decision and the Contracting Officer owns the mod. The First 90 Days checklist is the list an experienced PM keeps in their head. The Spend Plan knows your appropriation's obligation goal. You overwrite the examples with your program, and the Dashboard tab reads all of it and builds your PEO brief.</p>
    <p>The PM Briefing Deck is the only separate file. Every slide's speaker notes tell you the questions leadership will actually ask and what to say when your light is red.</p>
    <p>This guide walks you through every tab: what it does, why it matters, and how to use it. Start with the Dashboard so you can see where everything lands, then work the tabs in the order below.</p>
    <div class="callout">
      <div class="callout-label">What's Updated in This Edition</div>
      <p style="margin-bottom:8px">Reflects FAC 2025-06 (effective Oct 1, 2025) and the CMMC rollout through Phase 2 (effective Nov 10, 2026).</p>
      <ul class="tight">
        <li>Simplified Acquisition Threshold (SAT) updated to $350,000 (FAC 2025-06, effective Oct 1, 2025)</li>
        <li>Micro-Purchase Threshold (MPT) updated to $15,000</li>
        <li>TINA / certified cost &amp; pricing data threshold: $2.5M</li>
        <li>Competition J&amp;A approval threshold: $900,000</li>
        <li>CMMC Phase 1 (effective Nov 10, 2025): CMMC clauses now appear in new contracts; self-assessment accepted for Level 2</li>
        <li>CMMC Phase 2 (effective Nov 10, 2026, two months out as of this edition): C3PAO third-party assessment required for Level 2. If your subcontractor base isn't assessed yet, start now</li>
        <li>Risk Register updated with CMMC compliance as a program risk consideration</li>
        <li>September 2026 rebuild: IGCE Calculator and RFP Compliance Matrix retired from this pack; Program Dashboard, First 90 Days Checklist, and Spend Plan added; all tools consolidated into one workbook</li>
      </ul>
    </div>
  </div>
  {FOOTER}
</div>'''

# ---------- PAGE 3: QUICK START (moved up as pre-read) ----------
quickstart = f'''<div class="page content">
  {header(3)}
  <div class="body-area">
    <h2 class="section-title">Quick Start Checklist</h2>
    <p>Not sure where to start? Here's the recommended order. You don't need to use all five tools on day one, but this sequence gets you set up the fastest. Read this first, then flip to each tool's page for the full walkthrough.</p>
    <div class="step"><div class="step-num">1</div><div class="step-body"><b>Open the Dashboard and fill in the three header cells</b><span>Program, your name, as-of date. Everything else on that tab fills itself in.</span></div></div>
    <div class="step"><div class="step-num">2</div><div class="step-body"><b>Work the First 90 Days tab in order</b><span>Orient, then Assess, then Act. Mark each item as you go. The Dashboard tracks your progress.</span></div></div>
    <div class="step"><div class="step-num">3</div><div class="step-body"><b>Fix the RACI before anything else</b><span>Know who owns each decision. Every row already has an Accountable owner; replace the roles with names.</span></div></div>
    <div class="step"><div class="step-num">4</div><div class="step-body"><b>Rescore the Risk Register for your program</b><span>Keep the sixteen risks, change the probability and impact. The Risk Map redraws itself.</span></div></div>
    <div class="step"><div class="step-num">5</div><div class="step-body"><b>Load the Spend Plan and post actuals monthly</b><span>Appropriation, budget authority, planned obligations. The BEHIND flag is your early warning.</span></div></div>
    <div class="step"><div class="step-num">6</div><div class="step-body"><b>Brief from the Dashboard and the Deck</b><span>Print the Dashboard for your PEO. Read the speaker notes before every PMR.</span></div></div>
    <p style="margin-top:16px">Questions? Visit acqlerate.com for tutorials, walkthroughs, and the full Acqlerate template library.</p>
  </div>
  {FOOTER}
</div>'''


tool1 = f'''<div class="page content">
  {header(4)}
  <div class="body-area">
    <div class="tool-tag">Tab 1</div>
    <h3 class="tool-title">Program Dashboard</h3>
    <h4 class="sub">What It Is</h4>
    <p>A one-page program status that reads every other tab in the workbook. You fill in three cells (program, your name, as-of date). It fills in the rest.</p>
    <div class="callout"><div class="callout-label">The Analogy</div><p>It is the gauge cluster in a truck. You do not drive by looking at the engine; you drive by looking at the gauges. The gauges are only useful because they are wired to the engine.</p></div>
    <h4 class="sub">Why It Matters</h4>
    <p>Leadership does not want your spreadsheets. They want to know if the money is on plan, what the top risks are, and whether you have the program under control. The Dashboard answers all three on one printed page, and it cannot drift out of sync with the detail because it is computed from the detail.</p>
    <h4 class="sub">What's Inside</h4>
    <ul class="tight">
      <li>MONEY: appropriation, budget authority, obligated to date, percent of plan achieved, remaining to your first-year obligation goal, and a BEHIND / ON PLAN / AHEAD light.</li>
      <li>RISK: counts of HIGH, MEDIUM, and LOW, plus a live list of every open HIGH risk by ID and title.</li>
      <li>FIRST 90 DAYS: percent complete for Orient, Assess, and Act.</li>
      <li>ACCOUNTABILITY: decisions tracked and how many are missing an Accountable owner. Should read zero.</li>
      <li>A "How to read this" column explaining what each light means and what to do about it.</li>
    </ul>
    <h4 class="sub">How to Use It</h4>
    <div class="step"><div class="step-num">1</div><div class="step-body"><b>Fill in the header</b><span>Program name, your name, and the as-of date. Nothing else on this tab is typed.</span></div></div>
    <div class="step"><div class="step-num">2</div><div class="step-body"><b>Work the other tabs</b><span>Every number here comes from Spend Plan, Risk Register, First 90 Days, and RACI. Update those; this updates.</span></div></div>
    <div class="step"><div class="step-num">3</div><div class="step-body"><b>Print it for your PEO</b><span>Landscape, one page. Lead with whatever is red.</span></div></div>
  </div>
  {FOOTER}
</div>'''

tool2 = f'''<div class="page content">
  {header(5)}
  <div class="body-area">
    <div class="tool-tag">Tab 2</div>
    <h3 class="tool-title">First 90 Days Checklist</h3>
    <h4 class="sub">What It Is</h4>
    <p>Thirty things to do when you inherit a DoD program, in three phases: Orient (days 1 to 30), Assess (31 to 60), Act (61 to 90). Each has a status, an owner, and a place for evidence.</p>
    <h4 class="sub">Why It Matters</h4>
    <p>The first 90 days decide whether you run the program or the program runs you. New PMs lose that window finding out things they should have been told: which appropriation expires this year, which risk the last PM was hiding, who actually has authority over the contract mod. This list is what an experienced PM already knows to go find.</p>
    <h4 class="sub">What's Inside</h4>
    <ul class="tight">
      <li>Orient: baseline, stakeholders, contracts, spend status, CPARS, RACI, near-term milestones, CMMC posture, the outgoing PM's top risks.</li>
      <li>Assess: rescore risks, reconcile obligations, walk the IMS, review EVM if it applies, audit CDRLs, meet DCMA and DCAA, staffing, open mods, test readiness, draft your first PMR.</li>
      <li>Act: deliver the PMR, publish the battle rhythm, refresh the register, adjust the spend plan, set CPARS expectations, lock milestone criteria, start a decision log, brief lessons learned.</li>
      <li>Status dropdown per item (Not Started, In Progress, Done, N/A) with per-phase and overall percent complete.</li>
    </ul>
    <h4 class="sub">How to Use It</h4>
    <div class="step"><div class="step-num">1</div><div class="step-body"><b>Do them in order</b><span>Orient before Assess before Act. Skipping ahead is how you brief a risk you do not understand.</span></div></div>
    <div class="step"><div class="step-num">2</div><div class="step-body"><b>Mark status honestly</b><span>Done means done, with evidence in the Notes column. The Dashboard reads this tab.</span></div></div>
    <div class="step"><div class="step-num">3</div><div class="step-body"><b>Add your own</b><span>Every program has three or four items nobody else would think of. Add rows; the formulas extend.</span></div></div>
  </div>
  {FOOTER}
</div>'''

tool3 = f'''<div class="page content">
  {header(6)}
  <div class="body-area">
    <div class="tool-tag">Tab 3</div>
    <h3 class="tool-title">Spend Plan</h3>
    <h4 class="sub">What It Is</h4>
    <p>A monthly plan of obligations and expenditures for one fiscal year, one appropriation line, against your appropriation's first-year obligation goal. Post actuals each month and it tells you whether you are on plan.</p>
    <div class="callout"><div class="callout-label">The Analogy</div><p>It is a fuel gauge with a trip computer. The gauge tells you how much is left. The trip computer tells you whether you will make it at this rate, which is the question that matters.</p></div>
    <h4 class="sub">Why It Matters</h4>
    <p>An appropriation that expires unobligated is money you had and lost, and it is the single most avoidable failure in program finance. The failure never shows up in September. It shows up in February as "a little behind," and nobody acts on it. This tab makes "a little behind" a red cell in February.</p>
    <h4 class="sub">What's Inside</h4>
    <ul class="tight">
      <li>Header inputs: fiscal year, appropriation (O&M, RDT&E, Procurement), total budget authority. Years available and the obligation goal fill in from a lookup table.</li>
      <li>Twelve monthly rows: planned and actual obligations, cumulative both ways, variance in dollars and percent, and a BEHIND / ON PLAN / AHEAD flag at plus or minus 10 percent. Same structure for expenditures.</li>
      <li>Year-to-date block: months posted, planned vs. obligated to date, percent of budget authority obligated, percent of plan achieved, remaining to goal, overall status.</li>
      <li>Pre-loaded with a realistic S-curve on a 4.15 million dollar O&M line, actuals posted through March, so you can see how it behaves before you clear it.</li>
    </ul>
    <h4 class="sub">How to Use It</h4>
    <div class="step"><div class="step-num">1</div><div class="step-body"><b>Set the header</b><span>Appropriation drives the goal. Budget authority drives every percentage.</span></div></div>
    <div class="step"><div class="step-num">2</div><div class="step-body"><b>Enter the plan</b><span>Planned obligations by month. If you do not have a plan, the S-curve example is a reasonable starting shape.</span></div></div>
    <div class="step"><div class="step-num">3</div><div class="step-body"><b>Post actuals monthly</b><span>Actual obligations and expenditures. Leave future months blank; the flags only trip on posted months.</span></div></div>
    <div class="step"><div class="step-num">4</div><div class="step-body"><b>Act on BEHIND in Q2</b><span>If the line is red in February, you still have time. If it is red in August, you have a story to write.</span></div></div>
  </div>
  {FOOTER}
</div>'''

tool4 = f'''<div class="page content">
  {header(7)}
  <div class="body-area">
    <div class="tool-tag">Tabs 4 and 5</div>
    <h3 class="tool-title">Risk Register and Risk Map</h3>
    <h4 class="sub">What It Is</h4>
    <p>A register of sixteen pre-loaded DoD program risks with probability, impact, mitigation, and contingency written, and a 5 by 5 map that plots every risk by ID so you can see where they cluster.</p>
    <div class="callout"><div class="callout-label">The Analogy</div><p>A weather forecast. You cannot stop the storm, but you can see it coming, and the map shows you where it will hit hardest.</p></div>
    <h4 class="sub">Why It Matters</h4>
    <p>A blank risk register is a test of what you already know. This one is a checklist of what experienced PMs worry about: Nunn-McCurdy breach, continuing resolution impact, CMMC Phase 2, requirements creep, key personnel loss. You will delete some and rescore the rest, but you will not start from a blank page wondering what you forgot.</p>
    <h4 class="sub">What's Inside</h4>
    <ul class="tight">
      <li>Sixteen risks across Technical, Schedule, Cost, External, and Programmatic categories, each with a written mitigation and contingency.</li>
      <li>Probability times Impact scoring with automatic HIGH / MEDIUM / LOW, color-scaled.</li>
      <li>Summary counts by level, category, and status, which the Dashboard reads.</li>
      <li>Risk Map: a static scoring key plus a "Where Your Risks Land" grid that lists risk IDs in the right cell. Print it for the weekly review.</li>
      <li>CMMC Phase 2 (C3PAO assessment required for Level 2, effective November 10, 2026) is pre-loaded as R-016. If your program handles CUI and your subcontractors are not assessed, score it HIGH and act now.</li>
    </ul>
    <h4 class="sub">How to Use It</h4>
    <div class="step"><div class="step-num">1</div><div class="step-body"><b>Keep the sixteen</b><span>Delete only what genuinely does not apply. Most of these apply to most programs.</span></div></div>
    <div class="step"><div class="step-num">2</div><div class="step-body"><b>Rescore for your program</b><span>Change probability and impact. The score, level, summary, Map, and Dashboard all update.</span></div></div>
    <div class="step"><div class="step-num">3</div><div class="step-body"><b>Name an owner per HIGH</b><span>The Dashboard lists every open HIGH. If you cannot name the owner, that is your first finding.</span></div></div>
    <div class="step"><div class="step-num">4</div><div class="step-body"><b>Review monthly</b><span>Risks change. Close them, re-scope them, add new ones from the First 90 Days assessment.</span></div></div>
  </div>
  {FOOTER}
</div>'''

tool5 = f'''<div class="page content">
  {header(8)}
  <div class="body-area">
    <div class="tool-tag">Tab 6</div>
    <h3 class="tool-title">RACI</h3>
    <h4 class="sub">What It Is</h4>
    <p>Twenty-five program decisions, one row each, with who is Responsible, Accountable, Consulted, and Informed. Four fields per row. No grid.</p>
    <div class="callout"><div class="callout-label">The Analogy</div><p>If the program were a flight: who is flying (Responsible), who owns the aircraft (Accountable), who air traffic control talks to (Consulted), who is notified when you land (Informed).</p></div>
    <h4 class="sub">Why It Matters</h4>
    <p>Most RACI matrices die because they are grids: adding a decision means filling ten columns, so nobody adds decisions, so the RACI is out of date by month two. This one is a list. Adding a decision is one row. And every row already has exactly one Accountable owner, which is the only rule that matters and the one most templates break.</p>
    <h4 class="sub">What's Inside</h4>
    <ul class="tight">
      <li>Twenty-five decisions from Program Initiation to Lessons Learned, pre-mapped to PM, PEO, CO, COR, DCMA, DCAA, Contractor PM, Systems Engineer, Finance, and Legal.</li>
      <li>Responsible and Accountable get a dropdown of the standard roles. Consulted and Informed take comma-separated lists.</li>
      <li>Accountable column highlighted. The Dashboard counts blanks; it should read zero.</li>
      <li>RACI Instructions tab with role definitions and how to customize.</li>
    </ul>
    <h4 class="sub">How to Use It</h4>
    <div class="step"><div class="step-num">1</div><div class="step-body"><b>Replace roles with names</b><span>"PEO" is a role. "Col. Reyes" is a person who can be asked. Names make the RACI real.</span></div></div>
    <div class="step"><div class="step-num">2</div><div class="step-body"><b>Brief it at kickoff</b><span>Everyone needs to know their lane from day one. Store it with the Program Management Plan.</span></div></div>
    <div class="step"><div class="step-num">3</div><div class="step-body"><b>Update when roles change</b><span>Personnel turnover is on the Risk Register for a reason. Keep this current.</span></div></div>
  </div>
  {FOOTER}
</div>'''

tool6 = f'''<div class="page content">
  {header(9)}
  <div class="body-area">
    <div class="tool-tag">Separate File</div>
    <h3 class="tool-title">PM Briefing Deck</h3>
    <h4 class="sub">What It Is</h4>
    <p>A twelve-slide PowerPoint template for your program status review, with a difference: every slide's speaker notes tell you what leadership will actually ask on that slide, and what to say if your light is red.</p>
    <h4 class="sub">Why It Matters</h4>
    <p>The slides are not the hard part of a PMR. The questions are. New PMs get ambushed on the cost slide with "do you believe that EAC?" or on the risk slide with "who owns that?" The notes put the question in front of you before you are standing in front of them.</p>
    <h4 class="sub">What's Inside</h4>
    <ul class="tight">
      <li>Twelve slides: cover, agenda, executive summary with traffic lights, program status, schedule with SPI, cost and EVM with KPI cards, risk status, technical progress, contractor performance, issues and actions, way forward, backup.</li>
      <li>Speaker notes on every slide in two parts: WHAT LEADERSHIP WILL ASK, and IF THIS SLIDE IS RED.</li>
      <li>Designed to be fed from the workbook: the Dashboard is your executive summary, the Risk Map is your risk slide, the Spend Plan is your cost backup.</li>
    </ul>
    <h4 class="sub">How to Use It</h4>
    <div class="step"><div class="step-num">1</div><div class="step-body"><b>Read the notes first</b><span>Before you build the slide, read what it has to answer.</span></div></div>
    <div class="step"><div class="step-num">2</div><div class="step-body"><b>Paste from the workbook</b><span>Dashboard on slide 3, Risk Map on slide 7, Spend Plan year-to-date block on slide 6 or in backup.</span></div></div>
    <div class="step"><div class="step-num">3</div><div class="step-body"><b>Delete what you do not need</b><span>Not every review needs twelve slides. Every review needs the executive summary and the way forward.</span></div></div>
  </div>
  {FOOTER}
</div>'''

full = HEAD + cover + welcome + quickstart + tool1 + tool2 + tool3 + tool4 + tool5 + tool6 + "\n</body>\n</html>\n"

with open('pack1_guide_v2.html', 'w') as f:
    f.write(full)

print("written, length:", len(full))
