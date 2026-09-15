ICON_SVG = '''<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <polygon points="50,22 71.2,36 71.2,64 50,78 28.8,64 28.8,36" fill="none" stroke="white" stroke-width="7" stroke-linejoin="round"/>
          <polygon points="50,34 63.9,42 63.9,58 50,66 36.1,58 36.1,42" fill="none" stroke="white" stroke-width="5" stroke-linejoin="round" transform="rotate(30,50,50)"/>
          <circle cx="50" cy="50" r="5" fill="white"/>
        </svg>'''

def header(page_num, title="CPARS Playbook"):
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
    return f"""<div class="page content">{header(n+2)}<div class="body-area"><div class="tool-tag">{tag}</div><h3 class="tool-title">{ttl}</h3><h4 class="sub">What It Is</h4><p>{what}</p>{an}<h4 class="sub">Why It Matters</h4><p>{why}</p><h4 class="sub">What's Inside</h4><ul class="tight">{ins}</ul><h4 class="sub">How to Use It</h4>{st}</div>{FOOTER}</div>"""


cover=f"""<div class="page cover"><span class="pack-chip">Pack 4</span><div class="wordmark-row"><div class="icon-badge">{ICON_SVG}</div><span class="wordmark-text on-dark">Acq<span class="lerate">lerate</span></span></div><h1>CPARS Playbook</h1><p class="subtitle">How ratings get decided, and how to earn the one you want</p><div class="divider"></div><div class="included-label">What's Included</div><div class="included-grid"><div class="included-item"><span class="dot"></span>Rating Decoder</div><div class="included-item"><span class="dot"></span>Interim Check-In</div><div class="included-item"><span class="dot"></span>Evidence Log</div><div class="included-item"><span class="dot"></span>Rebuttal Builder</div><div class="included-item"><span class="dot"></span>Self-Assessment</div></div><div class="cover-footer"><span>acqlerate.com</span><span>September 2026 Edition &middot; FAR 42.15</span></div></div>"""
welcome=f"""<div class="page content">{header(2)}<div class="body-area"><h2 class="section-title">Satisfactory Loses Recompetes</h2>
<p>Here is how a CPARS rating actually happens. Near the end of the period, your COR or Assessing Official opens the system and has to write a rating in each area, on a five-point scale, with a narrative that justifies it. They are doing this for several contracts. They are working from memory and whatever is in their email.</p>
<p>Satisfactory means you met the contract. It is the default, because meeting the contract is what the file usually shows. Very Good and Exceptional require the Assessing Official to write down specific instances where you exceeded a requirement to the Government's benefit. If you never gave them those instances in writing, during the period, they cannot write them down, and you get Satisfactory.</p>
<p>Satisfactory is not a criticism. It is also not a discriminator. On your next recompete, past performance is evaluated on recency, relevance, and quality, and quality means the CPARS rating. Against a competitor with Very Good, Satisfactory loses.</p>
<p>This playbook is how you build the file the Assessing Official rates from. Log the evidence when it happens. Share it with the COR in writing. Check in at the mid-point so nothing is a surprise. And if the draft is wrong, respond in 14 days with the contract clause and the document, not with effort or excuses.</p>
<div class="callout"><div class="callout-label">The rules, from FAR 42.1503</div><ul class="tight">
<li>Ratings: Exceptional, Very Good, Satisfactory, Marginal, Unsatisfactory. Definitions are in the Rating Decoder.</li>
<li>Areas: Quality, Schedule, Cost Control, Management, Small Business Utilization, Regulatory Compliance, and other areas the contract specifies.</li>
<li>Comment period: 14 calendar days from notification of the draft.</li>
<li>Disagreement: you may request review by an official one level above the Contracting Officer. Your comments stay attached to the record either way.</li>
<li>Retention: three years (six for construction and architect-engineer). Every source selection board you bid to can read it.</li>
<li>Applicability: contracts above the Simplified Acquisition Threshold, $350,000 under FAC 2025-06.</li></ul></div></div>{FOOTER}</div>"""
T=[
page(1,'Tab 1','Rating Decoder',
 'Thirty rows: six evaluation areas by five ratings. For each, the FAR definition, what the Assessing Official actually has to be able to write down to justify it, and why contractors who deserved the rating got the one below.',
 'The FAR definitions are short and abstract. "Exceeds many requirements to the Government\'s benefit" does not tell you what to do on Tuesday. The middle column does: named instances, measured benefit, several of them, shared in writing. The right column is the pattern in almost every disappointed rebuttal.',
 ['Six areas: Quality, Schedule, Cost Control, Management, Small Business Utilization, Regulatory Compliance.','Five ratings each, color-coded.','Filterable by area or rating. Print the area you are targeting and hand it to the team.'],
 [('Pick your target rating per area','Very Good in every area is a realistic target on a well-run contract. Exceptional in one or two is a campaign.'),('Read what the AO needs to see','That is your evidence plan for the period.'),('Read why people get the rating below','Then do not do that.')],
 'A rubric. Students who read the rubric before the assignment score higher than students who read it after. The Assessing Official is grading with this rubric whether you read it or not.'),
page(2,'Tab 2','Evidence Log',
 'One row per performance event, positive or negative, with the area, what happened in measurable terms, the benefit to the Government, whether you shared it with the COR, where it is documented, and whether it is closed.',
 'This is the file. At rating time, the Assessing Official rates from what they can recall and find. If your positive events are in your project folder and not in their inbox, they do not exist. If your negative events are fixed but not formally closed, they are on the draft.',
 ['Six pre-loaded example rows showing what a useful entry looks like: specific, dated, measured, shared, documented.','Dropdowns for area, plus or minus, shared, and status.','Tally by area: positives, negatives, negatives still open, positives not yet shared. Yellow means the COR has never seen it. Red means it will be on the draft.','Feeds the Self-Assessment tab.'],
 [('Log monthly at minimum','Weekly on a fast-moving contract. If you cannot remember what happened last month, neither can the COR.'),('Share every positive in writing when it happens','A two-line email to the COR. "For your file: we delivered X nine days early; the test team started dry runs a week ahead." That email is the rating.'),('Close every negative before the period ends','Corrective action taken and documented. An open negative caps you at Marginal in that area.')],
 'A running receipt. You would not go to a tax audit and try to remember what you spent. Do not go to a rating period that way either.'),
page(3,'Tab 3','Self-Assessment',
 'Rate yourself by area against the Decoder definitions, set a target, and cite the log rows that justify it. A Reality Check block compares your self-rating to what the evidence actually supports.',
 'Contractors consistently rate themselves higher than the record supports, then feel blindsided by the draft. The Reality Check is the blindside, early, from a spreadsheet instead of the Contracting Officer, while there is still time to build the evidence.',
 ['Six rows: my rating, positive evidence count, open negatives, unshared positives, target rating, justification, action to close the gap.','Reality Check: the rating the evidence supports, your rating, and a flag. Very Good needs at least two shared positives; Exceptional four or more; any open negative caps you at Marginal.','Both rating columns color-coded.'],
 [('Rate yourself honestly','Use the Decoder definitions, not how hard the team worked.'),('Read the flag','"Rating exceeds evidence" means you have work to do or a rating to lower. "Open negative" means close it this week.'),('Write the action','Specific: which event to create, which email to send, which negative to close, by when.')],
 'Weighing yourself before the doctor does. The number is the same either way, but one of them gives you time.'),
page(4,'Tab 4','Interim Check-In',
 'Eight questions to ask your COR at the mid-point of the rating period, what each answer tells you, and a place to record what they said and what you did about it.',
 'A rating you first hear about in the draft is a rating you have already lost. The 14-day comment period is for correcting errors, not for discovering the Government\'s opinion of you. The interim check-in is where you discover it, six months earlier, while you can still change it.',
 ['One question per area plus two overall: "is there anything that, if it continued, would result in a rating below Satisfactory?" and "what would it take for you to rate us Exceptional?"','What each answer tells you, and what to do with it.','Columns for their answer with date, and the action you took.'],
 [('Schedule it at the mid-point','Quarterly on a cost-type contract. Put it on the calendar the day the period starts.'),('Bring the Evidence Log tally','Show them what you have shared. Ask what they have not seen.'),('Leave with a written record','Send a summary email the same day. "Per our conversation, you indicated..." That email is also the rating.')]),
page(5,'Tab 5','Rebuttal Builder',
 'For a draft rating you can prove is wrong against the contract: the area, the rating given and sought, the specific contractual requirement by clause or paragraph, the evidence, proposed comment language, and a countdown from the notification date.',
 'Most rebuttals fail because they argue effort, circumstances, or fairness. The Assessing Official can only revise a rating based on the contract and the record. A rebuttal that cites the PWS paragraph and the acceptance document wins. A rebuttal that explains how hard the team worked does not, and it stays in the file for three years where the next source selection board reads it.',
 ['One row per area with a worked example in Quality: the requirement, the evidence, and comment language that a Contracting Officer can act on.','Days remaining, computed from the notification date. Red at three days.','What to argue: the contract said X, we did X or better, here is the document.','What not to argue: effort, Government-caused delay you never documented at the time, tone, and everything at once.','If the CO does not revise: how to request review one level up, and why to write the comment as if it is the last word.'],
 [('Enter the notification date first','The clock is running. Fourteen calendar days, not business days.'),('Pick the areas you can win','Where the contract and the evidence are unambiguous. One strong area beats six weak ones.'),('Cite, attach, and stay professional','Every sentence is read by future evaluators. Write for them.'),('Request review if needed','State it in the comment. Your comment stays attached regardless of outcome.')],
 'An appeal, not a complaint. The judge can only rule on the law and the evidence. Bring the law and the evidence.'),
]
full=HEAD+cover+welcome+''.join(T)+"\n</body>\n</html>\n"
open('cpars_guide.html','w').write(full); print('cpars guide html written')
