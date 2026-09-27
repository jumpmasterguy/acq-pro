import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side, Protection
from openpyxl.worksheet.datavalidation import DataValidation
from openpyxl.formatting.rule import FormulaRule

NAVY='FF0D1B2A'; TEAL='01696F'; TEALF='FF01696F'; LIGHT='FFE6F2F3'; GRAY='FF6B7280'
GREEN='FFC6EFCE'; YELLOW='FFFFEB9C'; RED='FFFFC7CE'
thin=Side(style='thin',color='FFE5E7EB'); B=Border(left=thin,right=thin,top=thin,bottom=thin)
RED_FONT=Font(color='FF9C0006',bold=True); GRN_FONT=Font(color='FF006100',bold=True); AMB_FONT=Font(color='FF9C5700',bold=True)

def hdr(ws,r,c,t):
    x=ws.cell(row=r,column=c,value=t); x.font=Font(bold=True,color='FFFFFFFF',size=10)
    x.fill=PatternFill('solid',fgColor=NAVY); x.border=B; x.alignment=Alignment(vertical='center',wrap_text=True); return x
def lock(ws,unlocked):
    for rng in unlocked:
        for row in ws[rng]:
            for c in row: c.protection=Protection(locked=False)
    ws.protection.sheet=True; ws.protection.formatCells=False; ws.protection.formatColumns=False
    ws.protection.formatRows=False; ws.protection.selectLockedCells=False; ws.protection.selectUnlockedCells=False
def cell(ws,r,c,v,wrap=True,bold=False,size=10,color=None,fill=None,center=False,nf=None):
    x=ws.cell(row=r,column=c,value=v); x.border=B; x.font=Font(size=size,bold=bold,color=color) if color else Font(size=size,bold=bold)
    x.alignment=Alignment(wrap_text=wrap,vertical='top',horizontal='center' if center else None)
    if fill: x.fill=PatternFill('solid',fgColor=fill)
    if nf: x.number_format=nf
    return x

# ═══════════════════ 1. PHRASE DECODER (added to section-lm-decoder.xlsx) ═══════════════════
PHRASES=[
# (section, phrase, what it actually means, what to do, the mistake people make)
('M','"Offerors will be evaluated on the degree to which..."','A graded scale, not pass/fail. "Degree" means there is a top score and you are competing for it.','Write to Outstanding, not Acceptable. Quantify everything. Give the evaluator a reason to write "exceeds."','Answering the requirement without exceeding it. Acceptable loses to Outstanding every time on a best-value award.'),
('M','"...demonstrates a clear understanding of the requirement."','They want proof you have done this before and know where it goes wrong. Restating the PWS is not understanding.','Name the two or three things that make this requirement hard, and say how you handle each. Cite a past contract where you did.','Parroting the PWS back with "we understand" in front of it. Evaluators call this "compliant but empty."'),
('M','"...the extent to which the approach is feasible / realistic."','They suspect offerors will over-promise. Feasibility is scored, and unrealistic staffing or schedule gets marked down even if the narrative is strong.','Show the math. Hours by task, staffing ramp, schedule with float. Tie it to your price volume so the two agree.','Technical volume promises 24/7 coverage; price volume staffs one shift. The cost/price analyst catches it and both volumes get dinged.'),
('M','"...will be evaluated for strengths, weaknesses, significant weaknesses, and deficiencies."','This is the FAR 15.001 vocabulary. A deficiency makes you unawardable. A significant weakness "appreciably increases risk." Strengths are what win.','Structure every section so strengths are easy to find: bold the discriminator, state the benefit to the government, give the proof.','Burying the strength in paragraph four. Evaluators are reading forty proposals; make it findable.'),
('M','"Risk will be assessed as part of each factor."','There is no separate risk factor, but every factor carries a risk rating. A great approach with high risk can lose to a good approach with low risk.','For each factor, name the top risk and your mitigation in one paragraph. Use the words "risk" and "mitigation."','Ignoring risk because there is no risk factor. The evaluator still has to fill in a risk rating and will find one for you.'),
('M','"Past performance will be evaluated for recency, relevance, and quality."','Three separate tests. A great reference that is not recent or not relevant scores as if it were not there.','Pick references that pass all three. Recent means inside the RFP window (usually 3 to 5 years). Relevant means same size, scope, and complexity. Quality means the CPARS or PPQ says so.','Leading with your biggest contract. If it is not relevant to this work, it is a wasted reference slot.'),
('M','"Offerors without a record of relevant past performance ... will receive a neutral rating."','Neutral is not a gift. In a competitive field, neutral loses to Substantial Confidence. The FAR says neutral cannot hurt you; it does not say it helps.','If you are thin on relevant past performance, use subcontractor or key personnel references, and say so explicitly in the past performance volume.','Assuming neutral is fine. Against an incumbent with Substantial Confidence, it is not.'),
('M','"Price will be evaluated for reasonableness and realism."','Two different tests. Reasonableness: is it too high? Realism: is it too low to actually do the work? A low price fails realism and can be adjusted upward for evaluation.','Price to win, but never below what your technical volume requires. Show your basis of estimate. Run the Cost Realism Self-Check in this pack.','Buying in. A price the government does not believe gets adjusted up on paper, and you lose the price advantage you cut margin for.'),
('M','"...best value tradeoff."','The government may pay more for a better proposal. Price matters, but it is not the tiebreaker unless technical proposals are close.','Decide early whether you are the technical leader or the price leader. Write the whole proposal around that choice.','Trying to be both. You end up mid-pack on technical and not cheap enough to win on price.'),
('M','"...lowest price technically acceptable (LPTA)."','Technical is pass/fail. Once you pass, only price matters. Extra strengths are worth zero.','Write to the minimum acceptable standard, cleanly, and put every dollar of effort into price. Do not gold-plate.','Writing an Outstanding technical volume for an LPTA award. You spent money on words that could not score.'),
('M','"...non-price factors, when combined, are significantly more important than price."','The government has told you the weighting. "Significantly more important" is the strongest phrasing. A technically superior proposal can win at a real price premium.','Invest in technical and past performance. Do not shave margin to compete on price; compete on being obviously better.','Reading "significantly more important" and still pricing to the floor. You gave away margin you did not need to.'),
('M','"...approximately equal to price."','Price is a peer of the technical factors, not subordinate. A modest technical edge will not survive a large price gap.','Price tight. Make sure every strength is a discriminator the evaluator can defend in the source selection decision document.','Assuming technical wins. Under "approximately equal," a 15% price gap usually decides it.'),
('M','"...the Government intends to award without discussions."','You get one shot. There will be no clarification round to fix a gap or explain an ambiguity.','Assume no discussions. Every requirement answered, every assumption stated, price fully supported on submission.','Leaving something thin and planning to fix it in discussions. Under FAR 15.306, there may not be any.'),
('M','"...the Government reserves the right to conduct discussions."','They probably will, but only with the competitive range. Falling out of the range is a silent loss.','Submit as if there will be no discussions, then be ready to answer evaluation notices fast and completely.','Treating the initial submission as a draft. The competitive range is set from initial proposals.'),
('M','"Key personnel will be evaluated on qualifications and availability."','Availability is a real test. A resume for someone who might not show up on day one is a weakness, sometimes a significant one.','Signed letters of commitment. Resumes that match the labor category requirements line by line. Name the backfill.','Proposing a star you have not signed. If the evaluator asks and you cannot produce a commitment letter, that is a weakness.'),
('M','"...resumes shall demonstrate..."','The evaluator will check each named qualification against the resume. Missing one is a gap.','Build the resume from the RFP requirement list, in that order, with the qualification stated in the same words.','Sending the candidate\'s standard resume. It answers a different question.'),
('M','"...Small Business Participation will be evaluated."','This is a scored factor for large businesses, separate from the subcontracting plan. Goals you commit to here become contract terms.','Commit to percentages you can hit, name the small businesses, and describe how you will track it.','Committing to 40% to score well, then failing to deliver. That becomes a CPARS finding and a past performance problem on the next bid.'),
('M','"Transition plan will be evaluated for risk to continuity of service."','On a recompete, the incumbent has a built-in advantage: zero transition risk. You have to prove yours is nearly zero too.','A day-by-day plan for the first 30 days with names, a knowledge capture approach, and the incumbent-capture strategy.','A one-page "we will work closely with the incumbent" transition plan. That is a significant weakness against an incumbent.'),
('L','"Proposals shall be submitted in separate volumes..."','Cross-referencing between volumes is usually prohibited. Each volume is evaluated by different people who may never see the others.','Make every volume self-contained. If price needs a technical assumption, restate it in the price volume.','Writing "see Technical Volume, section 3" in the price volume. The price evaluator never sees it.'),
('L','"Page limits are ... Pages exceeding the limit will not be evaluated."','Not "may not." The pages are removed before evaluation. Anything on page 31 of a 30-page limit does not exist.','Build a page budget by volume (Compliance Matrix in this pack does it). Cut before submission, never after.','Assuming the cover page or table of contents is excluded. Read the definition of "page" in Section L; it usually is not.'),
('L','"...12-point font, 1-inch margins, 8.5 x 11..."','Format compliance is checked first, before anyone reads a word. Violations can be treated as non-responsive.','A format checklist at the end of every review cycle. One person owns it.','Shrinking tables to 8-point to fit. Section L usually specifies font size for tables and graphics too.'),
('L','"...shall not merely restate the requirement or state that the offeror understands."','The government has been burned by empty proposals and is pre-emptively disqualifying them.','Every paragraph: what we will do, how, why it works, proof it has worked. If a paragraph does not contain a verb the government can evaluate, delete it.','"Offeror understands and will comply." That sentence is now a weakness by instruction.'),
('L','"Offerors shall address each element of the PWS..."','The evaluator has a checklist with every PWS paragraph. Missing one is a gap, and gaps become deficiencies.','Compliance matrix mapped PWS paragraph by paragraph to your section and page. Fill every row before pink team.','Addressing the PWS by theme instead of by paragraph. The evaluator is not reading by theme.'),
('L','"...assumptions and exceptions shall be clearly identified."','An unstated assumption is a risk finding when discovered. A stated exception to the terms can make you non-responsive. Both are traps.','State assumptions in one labeled section per volume. Take no exceptions to the terms unless you are prepared to lose on them.','Burying an assumption in the pricing narrative. When it surfaces, it reads as concealment.'),
('L','"...oral presentations will be conducted."','The orals are scored. Your presenters are being evaluated as the people who will do the work.','Rehearse with the actual key personnel who will present. Prepare for questions, not just the pitch.','Sending the capture manager to present. The government wants to hear from the PM they will be working with.'),
('L','"...the Government will not reimburse proposal preparation costs."','Standard, but it means your B&P is at risk. The bid/no-bid decision is a real financial decision.','Run a formal bid/no-bid with a probability of win estimate before spending on the proposal.','Bidding everything. Losing proposals cost the same to write as winning ones.'),
('L','"Questions must be submitted by ... and will be answered by amendment."','Answers become part of the RFP. Other offerors see your question. A question can reveal your strategy.','Ask questions that clarify requirements. Do not ask questions that reveal your approach or fish for a competitor\'s weakness.','Asking "would the government accept X?" You just told every competitor you plan to do X.'),
('L','"Offerors shall acknowledge all amendments."','Failure to acknowledge an amendment can make the proposal non-responsive, regardless of quality.','A line item on the submission checklist, owned by the contracts manager. Check SAM.gov the morning of submission.','Assuming no amendments were issued. There is almost always at least one.'),
('L','"...electronic submission via ... by [time] [time zone]."','Late is late. There is no grace period, and the time zone is the government\'s, not yours.','Submit the day before. Confirm receipt in writing. Keep the confirmation.','Submitting at 4:58 for a 5:00 deadline. Upload portals fail under load on due dates.'),
('L','"Section L instructions do not change the requirements of the PWS."','Section L tells you how to write; the PWS tells you what to do. When they seem to conflict, the PWS controls.','Read the PWS first, then Section L, then Section M. Build the compliance matrix from all three.','Writing to Section L headings and missing a PWS requirement that Section L did not mention.'),
('M','"Strengths must be tied to a benefit to the Government."','A feature is not a strength. A strength is a feature plus a stated benefit to the government that exceeds the requirement.','Every discriminator in three parts: what we do, what the government gets, why it is better than the standard. Use the Win Theme tool.','Listing capabilities. "We have an ISO 9001 certified quality system" is a feature. What does the government get from it?'),
('M','"...will be evaluated for the offeror\'s ability to retain qualified staff."','Retention is scored because turnover is the number-one delivery risk on services contracts. They want a retention plan, not a hiring plan.','Retention rate over the last three years, the compensation and career approach that produces it, and the retention plan for this contract.','A recruiting plan when the RFP asked about retention. Different question.'),
]

p='pack2_fixed/section-lm-decoder.xlsx'
wb=openpyxl.load_workbook(p)
if 'Phrase Decoder' in wb.sheetnames: wb.remove(wb['Phrase Decoder'])
ws=wb.create_sheet('Phrase Decoder',1)
for c,w in zip('ABCDEFGH',[2.5,7,40,44,44,44,14]): ws.column_dimensions[c].width=w
ws['B2']='Phrase Decoder: What the RFP Says vs. What It Means'; ws['B2'].font=Font(bold=True,size=14,color=NAVY)
ws['B3']=f'{len(PHRASES)} phrases that appear in nearly every DoD Section L and M, decoded. Filter by section. Mark the ones in your RFP and hand this to the writing team.'; ws['B3'].font=Font(size=10,italic=True,color=GRAY)
for i,h in enumerate(['L / M','What the RFP says','What it actually means','What to do','The mistake people make','In my RFP?']): hdr(ws,5,2+i,h)
for i,(sec,ph,mean,do,mist) in enumerate(PHRASES):
    r=6+i
    cell(ws,r,2,sec,center=True,bold=True,color=TEAL)
    cell(ws,r,3,ph,bold=True)
    cell(ws,r,4,mean); cell(ws,r,5,do); cell(ws,r,6,mist)
    cell(ws,r,7,None,center=True)
    ws.row_dimensions[r].height=78
    if r%2==0:
        for c in range(2,8): ws.cell(row=r,column=c).fill=PatternFill('solid',fgColor='FFF9FAFB')
last=6+len(PHRASES)-1
dv=DataValidation(type='list',formula1='"Yes,No"',allow_blank=True); ws.add_data_validation(dv); dv.add(f'G6:G{last}')
ws.conditional_formatting.add(f'B6:G{last}',FormulaRule(formula=['$G6="Yes"'],fill=PatternFill('solid',fgColor=LIGHT)))
ws.freeze_panes='B6'; ws.auto_filter.ref=f'B5:G{last}'
n=last+2
ws.cell(row=n,column=2,value='Phrases in my RFP:').font=Font(bold=True)
ws.cell(row=n,column=3,value=f'=COUNTIF(G6:G{last},"Yes")').font=Font(bold=True,size=12,color=TEAL)
ws.cell(row=n+2,column=2,value='Acqlerate Proposal Toolkit · acqlerate.com · September 2026 Edition').font=Font(size=8,italic=True,color=GRAY)
lock(ws,[f'G6:G{last}'])
ws.page_setup.orientation='landscape'; ws.page_setup.fitToWidth=1; ws.page_setup.fitToHeight=0; ws.sheet_properties.pageSetUpPr.fitToPage=True
wb.save(p); print(f'1. section-lm-decoder: Phrase Decoder added, {len(PHRASES)} phrases')

# ═══════════════════ 2. COST REALISM SELF-CHECK (replaces CLIN Pricing Template) ═══════════════════
CHECKS=[
# (category, the question the cost/price analyst asks, what a strong answer looks like, typical finding if weak)
('Labor rates','Are proposed labor rates realistic for the labor categories, the location, and the clearance level required?','Rates tied to a named source: BLS, GSA MAS, your forward pricing rate agreement, or current payroll for the same LCATs. A rate build-up per category.','Rates below market for cleared labor. Government adjusts upward to its own IGCE rate for evaluation; you lose the price advantage and gain a realism weakness.'),
('Labor rates','Do the rates escalate over the period of performance, and is the escalation defensible?','Annual escalation stated, with the basis (ECI, DoL wage determination, your actual history). Consistent across volumes.','Flat rates across five years. Analyst applies escalation for you and your evaluated price rises.'),
('Labor hours','Are proposed hours sufficient to perform the PWS as your technical volume describes it?','A basis of estimate by task showing how hours were derived. Hours in the price volume match the staffing in the technical volume.','Technical volume promises 24/7 coverage or surge capacity; hours support one shift. The two volumes contradict each other.'),
('Labor hours','Is the productive-hours assumption realistic?','Productive hours per FTE stated (typically 1,880 to 1,920 for a 2,080-hour year) with leave and training accounted for.','2,080 productive hours per FTE. Nobody works every hour of the year; the analyst knows it.'),
('Labor mix','Does the labor mix (senior vs. junior) match the complexity described in the technical volume?','Mix justified by task. Senior hours where the technical volume says the work is hard.','A senior-heavy technical narrative priced with a junior-heavy team, or the reverse.'),
('Uncompensated overtime','Are you relying on uncompensated overtime to make the price work?','Per FAR 52.237-10, disclose it if proposed. State the policy and show it is applied consistently, not just to this bid.','Undisclosed uncompensated overtime discovered in the rate build-up. Realism finding and a credibility problem.'),
('Indirect rates','Are fringe, overhead, and G&A consistent with your FPRA, FPRP, or most recent DCAA-accepted rates?','Rates match the agreement or are explained. If you are bidding below your accepted rates, say why and show it is sustainable.','Bid rates lower than your DCAA-accepted rates with no explanation. Analyst substitutes the accepted rates.'),
('Indirect rates','Is the indirect rate base applied correctly (e.g., overhead on direct labor plus fringe, G&A on total cost input)?','Rate build-up shows each base explicitly. Consistent with your disclosed accounting practices.','Overhead applied to a base that excludes fringe when your disclosure statement says it includes it. Recalculated for you.'),
('Fee / profit','Is fee within the range the government will find reasonable for this contract type and risk?','Fee stated, with a weighted-guidelines rationale if cost-type. Consistent with contract type (lower for CPFF, higher for FFP risk).','A 15% fee on a low-risk CPFF. Reasonableness finding.'),
('ODCs','Are all ODCs the PWS implies actually priced: travel, materials, software licenses, training, security clearances?','ODC schedule reconciled to the PWS and the technical volume. Travel by trip with JTR rates. Licenses by seat.','Travel described in the technical volume but not priced. Analyst adds it to your evaluated price.'),
('ODCs','Is travel priced at current JTR per diem and GSA airfare?','Trip table: destination, duration, travelers, per diem source, airfare source.','A lump-sum travel line. Cannot be evaluated for realism; treated as unsupported.'),
('Subcontracts','Are subcontractor costs supported by quotes or subcontractor cost proposals?','Quotes or sub proposals attached or available. Sub labor rates and hours visible if cost-type.','A subcontract line with no support. Treated as unsupported; may be excluded or adjusted.'),
('Subcontracts','Is your pass-through rate on subcontracts reasonable, and does it comply with DFARS 252.215-7009 if pass-through exceeds 70%?','Pass-through stated. If excessive pass-through applies, the added-value narrative is written.','Prime adds G&A and fee on a subcontract that is 80% of the work, with no added-value explanation.'),
('Consistency','Does every number in the price volume trace to the technical and management volumes?','A cross-walk: staffing plan headcount equals priced FTEs; schedule duration equals priced period; deliverables equal priced hours.','Three volumes, three different headcounts. This is the single most common realism finding.'),
('Consistency','Are assumptions stated in one place and consistent with the RFP?','An assumptions section listing every pricing assumption. Nothing in the assumptions contradicts a PWS requirement.','An assumption that shifts a requirement to the government, buried in a footnote. Read as an exception to the terms.'),
('Basis of estimate','Can every cost element be traced to a documented basis of estimate?','BOE per task or CLIN: method (engineering estimate, analogy, parametric, historical), source data, and the calculation.','Costs asserted without a method. Analyst cannot evaluate realism and marks it unsupported.'),
('Transition','Is transition-in priced, and does the price match the transition plan\'s duration and staffing?','Transition CLIN or line item with hours and duration matching the transition plan in the technical volume.','A 60-day transition plan with no transition costs. Either the plan is unrealistic or the price is.'),
('Contract type risk','Under FFP, have you priced the risk the technical volume takes on?','Contingency or risk-adjusted hours identified for the risks named in your own risk section.','An FFP price with no risk allowance, while the technical volume lists six significant risks.'),
('Option years','Are option years priced consistently with the base, and do they reflect learning or escalation?','Option pricing shows the escalation basis and any efficiency assumed. Efficiencies explained.','Option years priced identically to the base with no escalation, or with a learning-curve discount that is not explained.'),
('CMMC / compliance','Are CMMC assessment, cybersecurity, and other compliance costs included where the contract requires them?','CMMC Level 2 C3PAO assessment cost (Phase 2 effective November 10, 2026), NIST 800-171 sustainment, and any FedRAMP or clearance costs priced as ODCs or in overhead, and stated.','Compliance costs omitted entirely. Realism finding, and a delivery risk if you win.'),
('Math','Does the spreadsheet actually add up, and are formulas visible if requested?','Every total is a live formula. A recalculation has been run. Rounding stated. The file provided matches the PDF.','Hard-coded totals that do not sum. The analyst finds it in the first hour.'),
('Certified cost data','If over the TINA threshold ($2.5M), is certified cost or pricing data provided, or an exemption claimed correctly?','Table 15-2 format if required. Exemption (adequate price competition, commercial item) stated with basis.','Missing certified data on a covered action. Proposal is incomplete.'),
]
p='pack2_fixed/pricing-volume-checklist.xlsx'
wb=openpyxl.load_workbook(p)
if 'CLIN Pricing Template' in wb.sheetnames: wb.remove(wb['CLIN Pricing Template'])
if 'Cost Realism Self-Check' in wb.sheetnames: wb.remove(wb['Cost Realism Self-Check'])
ws=wb.create_sheet('Cost Realism Self-Check',1)
for c,w in zip('ABCDEFGHI',[2.5,16,42,42,42,12,14,36]): ws.column_dimensions[c].width=w
ws['B2']='Cost Realism Self-Check: Would the Government Believe Your Price?'; ws['B2'].font=Font(bold=True,size=14,color=NAVY)
ws['B3']='The questions a DoD cost/price analyst asks under FAR 15.404-1(d). Answer each before submission. A low price the government does not believe gets adjusted upward for evaluation, and you lose the advantage you cut margin for.'; ws['B3'].font=Font(size=10,italic=True,color=GRAY); ws['B3'].alignment=Alignment(wrap_text=True); ws.row_dimensions[3].height=30
for i,h in enumerate(['Category','The question the analyst asks','What a strong answer looks like','Typical finding if weak','Risk if weak','Status','Your evidence / notes']): hdr(ws,5,2+i,h)
for i,(cat,q,strong,weak) in enumerate(CHECKS):
    r=6+i
    cell(ws,r,2,cat,bold=True,color=TEAL); cell(ws,r,3,q,bold=True); cell(ws,r,4,strong); cell(ws,r,5,weak)
    cell(ws,r,6,'High' if cat in ('Labor hours','Consistency','Labor rates','Basis of estimate','Math') else 'Medium',center=True)
    cell(ws,r,7,'Not Checked',center=True); cell(ws,r,8,None)
    ws.row_dimensions[r].height=70
    if r%2==0:
        for c in range(2,9): ws.cell(row=r,column=c).fill=PatternFill('solid',fgColor='FFF9FAFB')
last=6+len(CHECKS)-1
dv1=DataValidation(type='list',formula1='"High,Medium,Low"',allow_blank=True); ws.add_data_validation(dv1); dv1.add(f'F6:F{last}')
dv2=DataValidation(type='list',formula1='"Not Checked,Supported,Weak,N/A"',allow_blank=True); ws.add_data_validation(dv2); dv2.add(f'G6:G{last}')
ws.conditional_formatting.add(f'G6:G{last}',FormulaRule(formula=['G6="Supported"'],fill=PatternFill('solid',fgColor=GREEN),font=GRN_FONT))
ws.conditional_formatting.add(f'G6:G{last}',FormulaRule(formula=['G6="Weak"'],fill=PatternFill('solid',fgColor=RED),font=RED_FONT))
ws.conditional_formatting.add(f'F6:F{last}',FormulaRule(formula=['F6="High"'],font=RED_FONT))
ws.freeze_panes='B6'
s=last+2
ws.cell(row=s,column=2,value='READINESS').font=Font(bold=True,size=12,color=NAVY)
rows=[('Items','=COUNTA(C6:C%d)'%last,'0'),
      ('Supported',f'=COUNTIF(G6:G{last},"Supported")','0'),
      ('Weak',f'=COUNTIF(G6:G{last},"Weak")','0'),
      ('Not yet checked',f'=COUNTIF(G6:G{last},"Not Checked")','0'),
      ('High-risk items still Weak or unchecked',f'=COUNTIFS(F6:F{last},"High",G6:G{last},"Weak")+COUNTIFS(F6:F{last},"High",G6:G{last},"Not Checked")','0'),
      ('% supported (excl. N/A)',f'=IF((C{s+1}-COUNTIF(G6:G{last},"N/A"))=0,0,C{s+2}/(C{s+1}-COUNTIF(G6:G{last},"N/A")))','0%'),
      ('Verdict',f'=IF(C{s+5}>0,"NOT READY: high-risk items open",IF(C{s+3}>0,"AT RISK: weak items remain",IF(C{s+4}>0,"INCOMPLETE: items unchecked","READY TO SUBMIT")))','@')]
for i,(k,f,nf) in enumerate(rows):
    ws.cell(row=s+1+i,column=2,value=k).font=Font(bold=True,size=10)
    c=ws.cell(row=s+1+i,column=3,value=f); c.number_format=nf; c.border=B; c.font=Font(bold=(i==6),size=11 if i==6 else 10)
V=f'C{s+7}'
ws.conditional_formatting.add(V,FormulaRule(formula=[f'LEFT({V},9)="NOT READY"'],fill=PatternFill('solid',fgColor=RED),font=RED_FONT))
ws.conditional_formatting.add(V,FormulaRule(formula=[f'OR(LEFT({V},7)="AT RISK",LEFT({V},10)="INCOMPLETE")'],fill=PatternFill('solid',fgColor=YELLOW),font=AMB_FONT))
ws.conditional_formatting.add(V,FormulaRule(formula=[f'{V}="READY TO SUBMIT"'],fill=PatternFill('solid',fgColor=GREEN),font=GRN_FONT))
ws.cell(row=s+9,column=2,value='FAR 15.404-1(d): cost realism analysis determines whether the estimated proposed cost elements are realistic for the work to be performed, reflect a clear understanding of the requirements, and are consistent with the unique methods of performance described in the technical proposal. That last clause is where most proposals fail.').font=Font(size=9,italic=True,color=GRAY)
ws.cell(row=s+9,column=2).alignment=Alignment(wrap_text=True); ws.merge_cells(start_row=s+9,start_column=2,end_row=s+9,end_column=8); ws.row_dimensions[s+9].height=42
ws.cell(row=s+11,column=2,value='Acqlerate Proposal Toolkit · acqlerate.com · September 2026 Edition · Reflects FAC 2025-06').font=Font(size=8,italic=True,color=GRAY)
lock(ws,[f'F6:H{last}'])
ws.page_setup.orientation='landscape'; ws.page_setup.fitToWidth=1; ws.page_setup.fitToHeight=0; ws.sheet_properties.pageSetUpPr.fitToPage=True
wb.save(p); print(f'2. pricing-volume-checklist: CLIN template replaced by Cost Realism Self-Check, {len(CHECKS)} items')
