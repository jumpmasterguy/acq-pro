ICON_SVG = '''<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <polygon points="50,22 71.2,36 71.2,64 50,78 28.8,64 28.8,36" fill="none" stroke="white" stroke-width="7" stroke-linejoin="round"/>
          <polygon points="50,34 63.9,42 63.9,58 50,66 36.1,58 36.1,42" fill="none" stroke="white" stroke-width="5" stroke-linejoin="round" transform="rotate(30,50,50)"/>
          <circle cx="50" cy="50" r="5" fill="white"/>
        </svg>'''

def header(page_num, title="GovCon Proposal Toolkit"):
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


def page(n,tag,ttl,what,why,inside,steps,analogy=None):
    an=f'<div class="callout"><div class="callout-label">The Analogy</div><p>{analogy}</p></div>' if analogy else ''
    ins=''.join(f'<li>{x}</li>' for x in inside)
    st=''.join(f'<div class="step"><div class="step-num">{i+1}</div><div class="step-body"><b>{h}</b><span>{d}</span></div></div>' for i,(h,d) in enumerate(steps))
    return f"""<div class="page content">{header(n+3)}<div class="body-area"><div class="tool-tag">{tag}</div><h3 class="tool-title">{ttl}</h3><h4 class="sub">What It Is</h4><p>{what}</p>{an}<h4 class="sub">Why It Matters</h4><p>{why}</p><h4 class="sub">What's Inside</h4><ul class="tight">{ins}</ul><h4 class="sub">How to Use It</h4>{st}</div>{FOOTER}</div>"""

cover=f"""<div class="page cover"><span class="pack-chip">Pack 2</span><div class="wordmark-row"><div class="icon-badge">{ICON_SVG}</div><span class="wordmark-text on-dark">Acq<span class="lerate">lerate</span></span></div><h1>GovCon Proposal Toolkit</h1><p class="subtitle">Five tools that separate winning proposals from losing ones</p><div class="divider"></div><div class="included-label">What's Included</div><div class="included-grid"><div class="included-item"><span class="dot"></span>Proposal Compliance Matrix</div><div class="included-item"><span class="dot"></span>Past Performance Template</div><div class="included-item"><span class="dot"></span>Section L/M Decoder + Phrase Library</div><div class="included-item"><span class="dot"></span>Pricing Checklist + Cost Realism Self-Check</div><div class="included-item"><span class="dot"></span>Win Theme Tracker</div></div><div class="cover-footer"><span>acqlerate.com</span><span>September 2026 Edition &middot; FAC 2025-06</span></div></div>"""

welcome=f"""<div class="page content">{header(2)}<div class="body-area"><h2 class="section-title">Why Most Proposals Lose Before They're Written</h2>
<p>Here is the uncomfortable truth about government proposals: the best proposals don't win because of great writing. They win because the team understood the customer's priorities before the RFP dropped and organized the response to address every evaluation criterion directly.</p>
<p>Most losing proposals aren't bad. They're incomplete, disorganized, or slightly off-target. They miss a requirement in Section L. They don't connect their technical approach to the evaluation factors in Section M. They scatter their win themes across 200 pages without reinforcing a clear message. They price below what their own technical volume requires, and the cost analyst adjusts it back up.</p>
<p>This toolkit gives you five tools that address each of those failure points. They won't write your proposal for you, but they will make sure nothing falls through the cracks, your message is clear, and your pricing volume doesn't sink an otherwise strong submission.</p>
<div class="callout"><div class="callout-label">What's Updated in This Edition</div><p style="margin-bottom:8px">Reflects FAC 2025-06 (effective Oct 1, 2025) and the CMMC rollout through Phase 2 (effective Nov 10, 2026).</p><ul class="tight">
<li>Section L/M Decoder: new Phrase Decoder tab with 32 common Section L and M phrases translated into what the evaluator actually wants, what to do, and the mistake people make</li>
<li>Pricing Volume Checklist: CLIN pricing table replaced by a Cost Realism Self-Check, the 22 questions a DoD cost/price analyst asks under FAR 15.404-1(d), with a readiness verdict</li>
<li>Compliance Matrix: page budget by volume and percent complete added. Page limits were tracked but never totaled</li>
<li>Win Theme Tracker: every weighted evaluation factor with zero themes mapped to it now flags GAP</li>
<li>Past Performance: recency check against the FAR 15.305 window (Current, AGING over 3 years, STALE over 5 years)</li>
<li>Thresholds: SAT $350,000, MPT $15,000, Competition J&amp;A $900,000 (FAC 2025-06); TINA $2.5M. DUNS references replaced by UEI throughout</li></ul></div></div>{FOOTER}</div>"""

timeline=f"""<div class="page content">{header(3)}<div class="body-area"><h2 class="section-title">Proposal Timeline &amp; Quick Start</h2>
<p>The best proposal teams work backwards from the submission deadline. Here is when each tool comes into play. Read this first, then flip to each tool's page.</p>
<table class="ref"><tr><th>Milestone</th><th>When</th><th>Tool to Use</th></tr>
<tr><td>RFP drops</td><td>T-60 days</td><td>Compliance Matrix + L/M Decoder + Phrase Decoder</td></tr>
<tr><td>Win themes developed</td><td>T-55 days</td><td>Win Theme Tracker</td></tr>
<tr><td>Past performance selected</td><td>T-50 days</td><td>Past Performance Template (check recency first)</td></tr>
<tr><td>Writing begins</td><td>T-45 days</td><td>All tools active; writers reference themes and the compliance matrix</td></tr>
<tr><td>Pink Team review</td><td>T-30 days</td><td>Compliance Matrix: every row addressed? Theme Matrix: any GAP?</td></tr>
<tr><td>Red Team review</td><td>T-14 days</td><td>Full compliance, theme, and past performance review; first pass of the Cost Realism Self-Check</td></tr>
<tr><td>Pricing volume finalized</td><td>T-7 days</td><td>Pricing Checklist; Cost Realism Self-Check reads READY</td></tr>
<tr><td>Final compliance sweep</td><td>T-2 days</td><td>Every checklist, every row, every page budget under its limit</td></tr>
<tr><td>Submission</td><td>T-1 day</td><td>Submit the day before. Confirm receipt in writing.</td></tr></table>
<h4 class="sub">Quick Start</h4>
<div class="step"><div class="step-num">1</div><div class="step-body"><b>Open the Compliance Matrix the day the RFP drops</b><span>Every requirement gets a row before anyone writes. Check the page budget by volume.</span></div></div>
<div class="step"><div class="step-num">2</div><div class="step-body"><b>Run the L/M Decoder and Phrase Decoder in the first 48 hours</b><span>Understand how you will be evaluated. Mark every phrase from the library that appears in your RFP.</span></div></div>
<div class="step"><div class="step-num">3</div><div class="step-body"><b>Develop win themes before writing begins</b><span>Three to five themes. Map them until the GAP row is clear.</span></div></div>
<div class="step"><div class="step-num">4</div><div class="step-body"><b>Start past performance write-ups early</b><span>Pick references that pass recency, relevance, and quality. They take longer than you think.</span></div></div>
<div class="step"><div class="step-num">5</div><div class="step-body"><b>Run the Cost Realism Self-Check at Red Team, and again at T-7</b><span>A price the government does not believe gets adjusted upward. Give yourself time to fix what you find.</span></div></div>
</div>{FOOTER}</div>"""

T=[
page(1,'Tool 1','Proposal Compliance Matrix',
 'A requirement-by-requirement checklist that ensures your proposal responds to every "shall" and "will" in the RFP. It is the single most important document in your proposal process, because without it you are guessing.',
 'The number-one reason proposals lose is not a weak approach. It is non-compliance: a missed requirement, a volume over its page limit, a format violation. The evaluator cannot give you points for what is not there, and pages past the limit are removed before anyone reads them.',
 ['Thirty pre-loaded Section L requirements across all five volumes, each with section reference, volume, page limit, format, status, location, and reviewer.',
  'Page Budget by Volume: sums page limits per volume so you know your ceiling before writing starts. Per-instance limits (2 per person, 1 per reference) are called out separately.',
  'Percent complete and a status breakdown chart for the daily standup.',
  'Instructions tab on decomposing complex requirements.'],
 [('Load the RFP','Open Section L. Every "shall" and "will" is a separate row.'),
  ('Assign each row a volume, a page limit, and a writer','Everyone needs to know what they own and how much room they have.'),
  ('Watch the page budget','If a volume is over budget at Pink Team, cut then. Never after Red Team.'),
  ('Nothing goes to review with a Non-Compliant row','Period.')],
 'The evaluator is a teacher grading a test. They are not reading front to back admiring your writing; they are checking boxes. Your matrix is how you make sure every answer is there.'),
page(2,'Tool 2','Section L/M Decoder + Phrase Decoder',
 'Two tabs. The Decoder maps every Section L instruction to its Section M evaluation factor and weight, so you know where the points are. The Phrase Decoder is a library of 32 phrases that appear in nearly every DoD RFP, translated into what the evaluator actually wants.',
 'Section L tells you what to submit. Section M tells you how you will be scored. Teams that write to L without reading M produce compliant proposals that lose. And the language in both is a code: "best value tradeoff" and "approximately equal to price" are instructions about where to spend your margin, if you know how to read them.',
 ['L-M mapping table: every requirement linked to its factor, with numeric weights and a check that they total 100 percent.',
  'Discriminator column to mark where you can differentiate.',
  'Phrase Decoder: 32 phrases in four columns. What the RFP says. What it actually means. What to do. The mistake people make. Filterable by L or M, with an "In my RFP" checkbox.',
  'How-to-Use tab.'],
 [('Populate the Decoder with your Section L requirements','Map each to its Section M factor and enter the weights. Confirm they total 100 percent.'),
  ('Read the Phrase Decoder against your RFP','Mark every phrase that appears. Hand the marked list to the writing team before they start.'),
  ('Invest where the weight is','Your best evidence and your best writer go on the highest-weighted factor.'),
  ('Flag discriminators','Where can you stand out? Those become win themes.')],
 'Section L is the recipe. Section M is the judging criteria. You cannot win the cooking competition by following the recipe if you do not know what the judges are scoring on.'),
page(3,'Tool 3','Win Theme Development Tracker',
 'A structured way to identify, develop, and deploy the three to five core messages that should appear throughout your entire proposal: the reasons your team wins.',
 'A win theme is not a slogan. It is a feature, the benefit the government gets from it, and the proof it is real. Themes that show up once are sentences. Themes that show up in every volume are the reason the evaluator can defend picking you in the source selection decision document.',
 ['Win Theme tracker: theme statement, feature, benefit, proof, and discriminator for each.',
  'Theme-to-Factor Matrix: which themes cover which Section M factors and volumes, with a count per factor.',
  'Coverage Check row: any weighted factor with zero themes reads GAP in red. Clear it before Pink Team.',
  'Instructions tab on developing themes evaluators actually respond to.'],
 [('Start with customer intelligence','Their hot buttons, their pain, what went wrong on the last contract.'),
  ('Develop three to five themes, no more','More than five and nothing sticks. Each must be a provable statement.'),
  ('Map every theme to the matrix until there are no GAPs','A heavily weighted factor with no theme is a factor you will score Acceptable on at best.'),
  ('Share before writing begins','Every writer sings from the same sheet of music.')],
 'A campaign slogan. It shows up in the technical approach, the management plan, the past performance, and the executive summary. Repetition is not redundancy. It is reinforcement.'),
page(4,'Tool 4','Past Performance Template',
 'A structured format for documenting the relevant contracts you will cite as evidence that you have done this work before and done it well.',
 'Past performance is evaluated on three separate tests: recency, relevance, and quality. A great reference that fails one of them scores as if it were not there. A vague "we supported DoD customers" scores nothing. What scores is specific, relevant, quantified evidence with a customer who will confirm it.',
 ['Reference Tracker: contract details, contract type, CPARS rating, relevance mapping, POC information, PPQ status.',
  'Recency Check: reads the end year from the period of performance and flags Current, AGING (over 3 years), or STALE (over 5 years) against the FAR 15.305 window.',
  'Write-Up Template: a structured narrative with prompts for scope, performance, metrics, and outcomes.',
  'Instructions on selecting and presenting your strongest references.'],
 [('Enter your candidate contracts','Aim for three to five most similar to this pursuit in size, scope, and complexity.'),
  ('Check recency first','Confirm the window in your Section M, then drop anything the check flags STALE.'),
  ('Complete relevance mapping','How does each contract demonstrate capability for this specific work?'),
  ('Draft narratives and send PPQs early','References take longer than you think. Do not leave them for the last week.')]),
page(5,'Tool 5','Pricing Checklist + Cost Realism Self-Check',
 'Two tabs. The Pricing Checklist is the compliance list for your price volume. The Cost Realism Self-Check is the 22 questions a DoD cost/price analyst will ask under FAR 15.404-1(d), each with what a strong answer looks like and the finding you get if it is weak.',
 'Price is evaluated for two different things. Reasonableness asks if it is too high. Realism asks if it is too low to actually do the work your technical volume describes. A price the government does not believe gets adjusted upward for evaluation. You cut margin to win and gave the advantage back, plus a realism weakness.',
 ['Pricing Checklist: Section L pricing requirements mapped to deliverables, including SAM.gov and UEI verification (DUNS was retired in April 2022).',
  'Cost Realism Self-Check: 22 items across labor rates, hours, mix, uncompensated overtime, indirect rates, fee, ODCs, subcontracts, cross-volume consistency, basis of estimate, transition, option years, CMMC costs, math, and certified cost data.',
  'Each item rated High or Medium risk, with a status dropdown and an evidence column.',
  'Readiness block: count of high-risk items still open and a verdict of NOT READY, AT RISK, INCOMPLETE, or READY TO SUBMIT.'],
 [('Run the checklist against your Section L','Every item.'),
  ('Work the Self-Check at Red Team','Mark each item Supported or Weak, with evidence. The verdict is not ready until every high-risk item is Supported.'),
  ('Reconcile the volumes','The most common realism finding is three volumes with three different headcounts. Fix that first.'),
  ('Run it again 48 hours before submission','Not the night before. You need time to fix what you find.')],
 'The pricing volume is your tax return. The technical volume is the story you tell; the pricing volume is where you show your math, and the auditor has seen every trick.'),
]
full=HEAD+cover+welcome+timeline+''.join(T)+"\n</body>\n</html>\n"
open('pack2_guide.html','w').write(full); print('pack2 guide html written')
