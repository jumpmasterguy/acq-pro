import datetime, openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side, Protection
from openpyxl.worksheet.datavalidation import DataValidation
from openpyxl.formatting.rule import FormulaRule

NAVY='FF0D1B2A'; TEAL='01696F'; LIGHT='FFE6F2F3'; GRAY='FF6B7280'
GREEN='FFC6EFCE'; YELLOW='FFFFEB9C'; RED='FFFFC7CE'
thin=Side(style='thin',color='FFE5E7EB'); B=Border(left=thin,right=thin,top=thin,bottom=thin)
RED_FONT=Font(color='FF9C0006',bold=True); GRN_FONT=Font(color='FF006100',bold=True); AMB_FONT=Font(color='FF9C5700',bold=True)
def hdr(ws,r,c,t):
    x=ws.cell(row=r,column=c,value=t); x.font=Font(bold=True,color='FFFFFFFF',size=10); x.fill=PatternFill('solid',fgColor=NAVY); x.border=B; x.alignment=Alignment(vertical='center',wrap_text=True); return x
def cell(ws,r,c,v,bold=False,center=False,color=None,nf=None,fill=None):
    x=ws.cell(row=r,column=c,value=v); x.border=B; x.font=Font(size=10,bold=bold,color=color) if color else Font(size=10,bold=bold)
    x.alignment=Alignment(wrap_text=True,vertical='top',horizontal='center' if center else None)
    if nf: x.number_format=nf
    if fill: x.fill=PatternFill('solid',fgColor=fill)
    return x
def lock(ws,unlocked):
    for rng in unlocked:
        for row in ws[rng]:
            for c in row: c.protection=Protection(locked=False)
    ws.protection.sheet=True; ws.protection.formatCells=False; ws.protection.formatColumns=False; ws.protection.formatRows=False
    ws.protection.selectLockedCells=False; ws.protection.selectUnlockedCells=False
def title(ws,t,sub): ws['B2']=t; ws['B2'].font=Font(bold=True,size=14,color=NAVY); ws['B3']=sub; ws['B3'].font=Font(size=10,italic=True,color=GRAY); ws['B3'].alignment=Alignment(wrap_text=True)
def foot(ws,r): ws.cell(row=r,column=2,value='Acqlerate CPARS Playbook · acqlerate.com · September 2026 Edition').font=Font(size=8,italic=True,color=GRAY)
def landscape(ws): ws.page_setup.orientation='landscape'; ws.page_setup.fitToWidth=1; ws.page_setup.fitToHeight=0; ws.sheet_properties.pageSetUpPr.fitToPage=True

AREAS=['Quality','Schedule','Cost Control','Management','Small Business Utilization','Regulatory Compliance']
RATINGS=['Exceptional','Very Good','Satisfactory','Marginal','Unsatisfactory']
SCORE={'Exceptional':5,'Very Good':4,'Satisfactory':3,'Marginal':2,'Unsatisfactory':1}

wb=openpyxl.Workbook(); wb.remove(wb.active)

# ═══════════ START HERE ═══════════
sh=wb.create_sheet('Start Here'); sh.column_dimensions['A'].width=2.5; sh.column_dimensions['B'].width=110
L=[('CPARS Playbook: How Ratings Get Decided, and How to Earn the One You Want',True,15),
('For contractors. The rating you get at the end of the period is decided by what is on file during the period. This workbook is how you build that file.',False,10),('',False,10),
('How CPARS actually works',True,12),
('Your Contracting Officer\u2019s Representative or Assessing Official drafts a rating in each evaluation area, on a five-point scale defined in FAR 42.1503: Exceptional, Very Good, Satisfactory, Marginal, Unsatisfactory. The Contracting Officer reviews it. You are notified and have 14 calendar days to comment. If you disagree, you may request review by a Government official one level above the Contracting Officer. The final rating stays in the system for three years and is visible to every source selection you bid on.',False,10),
('The part most contractors get wrong: Satisfactory means you met the contract. Very Good and Exceptional require documented performance that exceeded requirements to the Government\u2019s benefit, and the Assessing Official has to be able to write down what that was. If you did not give them the words and the evidence during the period, you will get Satisfactory, and Satisfactory loses recompetes.',False,10),('',False,10),
('The tabs',True,12),
('1. Rating Decoder: what each rating means in each area, what the Assessing Official needs to see to justify it, and why contractors who deserved Very Good got Satisfactory.',False,10),
('2. Evidence Log: a dated record of performance events, positive and negative, by area. This is the file. Keep it monthly.',False,10),
('3. Self-Assessment: rate yourself by area against the definitions, with evidence counts pulled from the log. Predicts your rating before the draft arrives.',False,10),
('4. Interim Check-In: the questions to ask your COR at the mid-point so the final rating is not a surprise, and a place to record the answers.',False,10),
('5. Rebuttal Builder: if the draft is wrong, a structured 14-day response: the requirement, the evidence, the rating sought, and the language. What to argue and what not to.',False,10),('',False,10),
('Where this is taught',True,12),
('Module 6: Operations & Leadership, Lesson 4 (contractor performance) and Module 5: Capture & BD, Lesson 7 (past performance as a discriminator). acqlerate.com/app',False,10),('',False,10),
('Sources',True,12),
('FAR 42.15 (Contractor Performance Information), FAR 42.1503 (procedures, rating definitions, comment period, review), FAR 42.1502 (applicability above the Simplified Acquisition Threshold, $350,000 under FAC 2025-06). Verify current text at acquisition.gov; this edition reflects the regulation as of September 2026.',False,10),('',False,10),
('License & Use',True,12),
('Licensed for one contract or one organization. Customize freely. Company-wide deployment or resale requires an Acqlerate Team License (acqlerate.com/team).',False,10)]
r=2
for t,b,s in L:
    c=sh.cell(row=r,column=2,value=t); c.font=Font(bold=b,size=s,color=NAVY if b else '333333'); c.alignment=Alignment(wrap_text=True,vertical='top'); r+=1
sh.protection.sheet=True

# ═══════════ RATING DECODER ═══════════
rd=wb.create_sheet('Rating Decoder')
title(rd,'Rating Decoder: What Each Rating Requires, by Area','The FAR definition is one column. What the Assessing Official actually has to be able to write down is the other. The gap between them is where Very Good becomes Satisfactory.')
for c,w in zip('ABCDEFG',[2.5,22,16,46,46,46]): rd.column_dimensions[c].width=w
for i,h in enumerate(['Area','Rating','What FAR 42.1503 says','What the AO has to be able to write down','Why deserving contractors get the rating below']): hdr(rd,5,2+i,h)
DEF={'Exceptional':'Performance meets contractual requirements and exceeds many to the Government\u2019s benefit. No significant weaknesses.',
     'Very Good':'Performance meets contractual requirements and exceeds some to the Government\u2019s benefit. No significant weaknesses.',
     'Satisfactory':'Performance meets contractual requirements. Minor problems, if any, and corrective actions were effective.',
     'Marginal':'Performance does not meet some contractual requirements. A significant weakness that corrective action has not yet fixed.',
     'Unsatisfactory':'Performance does not meet most contractual requirements. Serious problems; corrective actions ineffective.'}
NEED={
'Quality':{'Exceptional':'Specific deliverables or outcomes that exceeded the spec, with a measured benefit: defect rates below the requirement by a stated margin, rework avoided, customer time saved. Several instances, not one.',
 'Very Good':'At least a few named instances where quality exceeded the requirement, with a benefit the AO can describe in a sentence. Zero significant quality findings.',
 'Satisfactory':'Deliverables accepted. Any rejections were corrected promptly. No pattern.',
 'Marginal':'A rejected deliverable or quality finding that was not fully corrected in the period.','Unsatisfactory':'Repeated rejections; a corrective action plan that did not work.'},
'Schedule':{'Exceptional':'Milestones delivered early with a stated benefit to the Government (earlier fielding, freed resources). Proactive schedule risk management the AO witnessed.',
 'Very Good':'All milestones on time, some early. Schedule risks identified by you before the Government saw them.',
 'Satisfactory':'Milestones met. Any slip was recovered and did not affect the Government.',
 'Marginal':'A missed milestone that affected the Government, with recovery still in progress.','Unsatisfactory':'Multiple missed milestones; Government mission affected.'},
'Cost Control':{'Exceptional':'Underran with documented savings returned or repurposed. Cost data timely and accurate every period. Cost-saving initiatives you proposed and the Government accepted.',
 'Very Good':'On budget with accurate forecasting. At least one instance where you flagged a cost risk early or found a saving.',
 'Satisfactory':'Within budget. Invoices and cost reports accurate and on time.',
 'Marginal':'An overrun or a cost reporting problem that required Government intervention.','Unsatisfactory':'Significant overrun; unreliable cost data.'},
'Management':{'Exceptional':'Key personnel stable all period. Problems solved before the Government had to act. Communication the AO would describe as a model.',
 'Very Good':'Key personnel stable or replaced without gap. Proactive communication on issues. Subcontractors managed without Government involvement.',
 'Satisfactory':'Staffed as proposed. Issues raised and resolved. Reports on time.',
 'Marginal':'Key personnel gap, or an issue the Government had to escalate.','Unsatisfactory':'Staffing failures affecting performance; unresponsive management.'},
'Small Business Utilization':{'Exceptional':'Exceeded subcontracting plan goals with documented outreach beyond the plan and mentoring or development of small business subs.',
 'Very Good':'Met all plan goals; exceeded some. Reports (ISR/SSR) on time and accurate.',
 'Satisfactory':'Met plan goals or good-faith effort documented. Reports on time.',
 'Marginal':'Missed a goal without documented good-faith effort, or a late report.','Unsatisfactory':'Failed the plan; no good-faith effort shown.'},
'Regulatory Compliance':{'Exceptional':'Full compliance plus proactive identification of compliance risks (CMMC, export control, safety) with mitigation before they became issues.',
 'Very Good':'Full compliance; at least one instance of raising a compliance matter before being asked.',
 'Satisfactory':'No compliance findings. Required certifications and reports current.',
 'Marginal':'A compliance finding corrected in the period.','Unsatisfactory':'Uncorrected compliance failure or a finding with contractual consequence.'}}
WHY={'Exceptional':'The AO agrees you were excellent but cannot cite the specific instances, because you never wrote them down and sent them. Exceptional needs a list.',
 'Very Good':'You exceeded requirements but nobody told the COR at the time. Six months later it reads as "did the job." Very Good needs contemporaneous evidence.',
 'Satisfactory':'You met the contract. This is the rating for meeting the contract. It is not a criticism; it is also not a discriminator on the next bid.',
 'Marginal':'A single significant problem that you fixed, but the fix landed after the rating period closed. Timing matters.',
 'Unsatisfactory':'Usually not a surprise. If it is, the interim check-in was skipped.'}
r=6
for a in AREAS:
    for rt in RATINGS:
        cell(rd,r,2,a,bold=True,color=TEAL); cell(rd,r,3,rt,bold=True,center=True)
        cell(rd,r,4,DEF[rt]); cell(rd,r,5,NEED[a][rt]); cell(rd,r,6,WHY[rt])
        rd.row_dimensions[r].height=64
        fill={'Exceptional':GREEN,'Very Good':GREEN,'Satisfactory':YELLOW,'Marginal':RED,'Unsatisfactory':RED}[rt]
        rd.cell(row=r,column=3).fill=PatternFill('solid',fgColor=fill)
        r+=1
rd.freeze_panes='B6'; rd.auto_filter.ref=f'B5:F{r-1}'; foot(rd,r+1); rd.protection.sheet=True; landscape(rd)

# ═══════════ EVIDENCE LOG ═══════════
ev=wb.create_sheet('Evidence Log')
title(ev,'Evidence Log: The File That Decides Your Rating','One row per performance event, positive or negative. Send the positive ones to your COR when they happen. Fix and close the negative ones before the period ends. Monthly, minimum.')
for c,w in zip('ABCDEFGHI',[2.5,12,22,10,48,40,16,14,14]): ev.column_dimensions[c].width=w
for i,h in enumerate(['Date','Area','+ / \u2212','What happened (specific, measurable)','Benefit to the Government / impact','Shared with COR?','Documented where','Status']): hdr(ev,5,2+i,h)
SAMPLE=[(datetime.date(2026,7,14),'Schedule','+','Delivered Increment 2 test readiness package 9 working days ahead of the CDRL due date.','Government test team started dry runs a week early; freed range time worth an estimated $40K.','Yes','Email to COR 7/14; CDRL A012 transmittal','Closed'),
 (datetime.date(2026,7,28),'Quality','+','Zero defects on Increment 2 software acceptance testing, 412 test cases.','No rework cycle; acceptance signed same day.','Yes','Test report TR-2026-07','Closed'),
 (datetime.date(2026,8,5),'Management','\u2212','Deputy PM resigned; position vacant.','Risk to schedule reviews and stakeholder communication.','Yes','Letter to CO 8/6; resolved 8/19','Closed'),
 (datetime.date(2026,8,19),'Management','+','Deputy PM backfilled within 10 business days with candidate meeting all key personnel qualifications; CO approved substitution.','No gap in program reviews; Government did not have to intervene.','Yes','CO approval 8/19','Closed'),
 (datetime.date(2026,8,30),'Cost Control','+','Identified $85K underrun in Year 2 travel; proposed repurposing to accelerate Increment 3 tooling. Government accepted.','Increment 3 tooling delivered a quarter early at no added cost.','Yes','Mod P00007','Closed'),
 (datetime.date(2026,9,3),'Regulatory Compliance','+','Completed CMMC Level 2 C3PAO assessment two months ahead of the Phase 2 effective date; all subcontractors handling CUI assessed.','Program has no CMMC risk at Phase 2 (Nov 10, 2026); Government did not have to track it.','Yes','Assessment certificate; email to COR 9/3','Closed')]
for i,row in enumerate(SAMPLE):
    r=6+i
    for j,v in enumerate(row):
        c=cell(ev,r,2+j,v,center=(j in (2,5,7)))
        if j==0: c.number_format='mm/dd/yyyy'
    ev.row_dimensions[r].height=48
last=45
for r in range(6+len(SAMPLE),last+1):
    for j in range(8): cell(ev,r,2+j,None)
dvA=DataValidation(type='list',formula1='"'+','.join(AREAS)+'"',allow_blank=True); ev.add_data_validation(dvA); dvA.add(f'C6:C{last}')
dvS=DataValidation(type='list',formula1='"+,\u2212"',allow_blank=True); ev.add_data_validation(dvS); dvS.add(f'D6:D{last}')
dvY=DataValidation(type='list',formula1='"Yes,No"',allow_blank=True); ev.add_data_validation(dvY); dvY.add(f'G6:G{last}')
dvSt=DataValidation(type='list',formula1='"Open,Closed"',allow_blank=True); ev.add_data_validation(dvSt); dvSt.add(f'I6:I{last}')
ev.conditional_formatting.add(f'D6:D{last}',FormulaRule(formula=['D6="+"'],fill=PatternFill('solid',fgColor=GREEN),font=GRN_FONT))
ev.conditional_formatting.add(f'D6:D{last}',FormulaRule(formula=['D6="\u2212"'],fill=PatternFill('solid',fgColor=RED),font=RED_FONT))
ev.conditional_formatting.add(f'G6:G{last}',FormulaRule(formula=['AND(D6="+",G6="No")'],fill=PatternFill('solid',fgColor=YELLOW),font=AMB_FONT))
ev.conditional_formatting.add(f'I6:I{last}',FormulaRule(formula=['AND(D6="\u2212",I6="Open")'],fill=PatternFill('solid',fgColor=RED),font=RED_FONT))
ev.freeze_panes='B6'
s=last+2
ev.cell(row=s,column=2,value='TALLY BY AREA').font=Font(bold=True,size=11,color=NAVY)
for i,h in enumerate(['Area','Positive','Negative','Neg. still open','Positive not yet shared']): hdr(ev,s+1,2+i,h)
for i,a in enumerate(AREAS):
    rr=s+2+i
    cell(ev,rr,2,a,bold=True)
    cell(ev,rr,3,f'=COUNTIFS($C$6:$C${last},$B{rr},$D$6:$D${last},"+")',center=True)
    cell(ev,rr,4,f'=COUNTIFS($C$6:$C${last},$B{rr},$D$6:$D${last},"\u2212")',center=True)
    cell(ev,rr,5,f'=COUNTIFS($C$6:$C${last},$B{rr},$D$6:$D${last},"\u2212",$I$6:$I${last},"Open")',center=True)
    cell(ev,rr,6,f'=COUNTIFS($C$6:$C${last},$B{rr},$D$6:$D${last},"+",$G$6:$G${last},"No")',center=True)
TALLY_START=s+2
ev.conditional_formatting.add(f'E{s+2}:E{s+7}',FormulaRule(formula=[f'E{s+2}>0'],fill=PatternFill('solid',fgColor=RED),font=RED_FONT))
ev.conditional_formatting.add(f'F{s+2}:F{s+7}',FormulaRule(formula=[f'F{s+2}>0'],fill=PatternFill('solid',fgColor=YELLOW),font=AMB_FONT))
ev.cell(row=s+9,column=2,value='Yellow in "not yet shared" means you have evidence the COR has never seen. It does not count until they have it in writing. Red in "still open" means a negative that will be on the draft rating unless you close it.').font=Font(size=9,italic=True,color=GRAY)
foot(ev,s+11); lock(ev,[f'B6:I{last}']); landscape(ev)

# ═══════════ SELF-ASSESSMENT ═══════════
sa=wb.create_sheet('Self-Assessment')
title(sa,'Self-Assessment: Predict Your Rating Before the Draft Arrives','Rate yourself honestly against the Rating Decoder. Evidence counts come from the log. If your self-rating is higher than your evidence supports, the AO will not give it to you either.')
for c,w in zip('ABCDEFGHI',[2.5,24,16,12,12,12,16,44,40]): sa.column_dimensions[c].width=w
for i,h in enumerate(['Area','My rating','Positive evidence','Negative open','Not shared','Target rating','What justifies my rating (cite log rows)','Gap to target: action before period end']): hdr(sa,5,2+i,h)
for i,a in enumerate(AREAS):
    r=6+i; t=TALLY_START+i
    cell(sa,r,2,a,bold=True,color=TEAL)
    cell(sa,r,3,'Satisfactory',center=True)
    cell(sa,r,4,f"='Evidence Log'!C{t}",center=True); cell(sa,r,5,f"='Evidence Log'!E{t}",center=True); cell(sa,r,6,f"='Evidence Log'!F{t}",center=True)
    cell(sa,r,7,'Very Good',center=True); cell(sa,r,8,None); cell(sa,r,9,None)
    sa.row_dimensions[r].height=54
dvR=DataValidation(type='list',formula1='"'+','.join(RATINGS)+'"',allow_blank=False); sa.add_data_validation(dvR); dvR.add('C6:C11'); dvR.add('G6:G11')
for col in 'CG':
    for rt,fl in [('Exceptional',GREEN),('Very Good',GREEN),('Satisfactory',YELLOW),('Marginal',RED),('Unsatisfactory',RED)]:
        sa.conditional_formatting.add(f'{col}6:{col}11',FormulaRule(formula=[f'{col}6="{rt}"'],fill=PatternFill('solid',fgColor=fl)))
sa.conditional_formatting.add('E6:E11',FormulaRule(formula=['E6>0'],fill=PatternFill('solid',fgColor=RED),font=RED_FONT))
# reality check column via helper: rating implied by evidence
sa.cell(row=13,column=2,value='REALITY CHECK').font=Font(bold=True,size=11,color=NAVY)
for i,h in enumerate(['Area','Evidence supports','My rating','Flag']): hdr(sa,14,2+i,h)
for i,a in enumerate(AREAS):
    r=15+i; src=6+i
    cell(sa,r,2,a,bold=True)
    cell(sa,r,3,f'=IF(E{src}>0,"Marginal or below",IF(D{src}>=4,"Exceptional",IF(D{src}>=2,"Very Good","Satisfactory")))',center=True)
    cell(sa,r,4,f'=C{src}',center=True)
    cell(sa,r,5,f'=IF(E{src}>0,"OPEN NEGATIVE: close it",IF(MATCH(C{src},{{"Unsatisfactory","Marginal","Satisfactory","Very Good","Exceptional"}},0)>MATCH(C{src+9},{{"Marginal or below","Satisfactory","Very Good","Exceptional"}},0)+1,"Rating exceeds evidence","Supported"))',center=True,bold=True)
sa.conditional_formatting.add('E15:E20',FormulaRule(formula=['E15="Supported"'],fill=PatternFill('solid',fgColor=GREEN),font=GRN_FONT))
sa.conditional_formatting.add('E15:E20',FormulaRule(formula=['E15<>"Supported"'],fill=PatternFill('solid',fgColor=RED),font=RED_FONT))
sa.cell(row=22,column=2,value='Rule of thumb built into the check: Very Good needs at least two shared positive events in the area; Exceptional needs four or more; any open negative caps you at Marginal until it is closed. Adjust to your COR, but do not expect a rating your log cannot support.').font=Font(size=9,italic=True,color=GRAY)
sa.cell(row=22,column=2).alignment=Alignment(wrap_text=True); sa.merge_cells('B22:I22'); sa.row_dimensions[22].height=32
foot(sa,24); lock(sa,['C6:C11','G6:I11']); landscape(sa)

# ═══════════ INTERIM CHECK-IN ═══════════
ic=wb.create_sheet('Interim Check-In')
title(ic,'Interim Check-In: No Surprises at the Final Rating','Schedule this with your COR at the mid-point of every rating period. Ask these questions, write down the answers, and act on them. A rating you first hear about in the draft is a rating you have already lost.')
for c,w in zip('ABCDEF',[2.5,22,48,44,14,30]): ic.column_dimensions[c].width=w
for i,h in enumerate(['Area','Ask the COR','What the answer tells you','Their answer (date)','Action taken']): hdr(ic,5,2+i,h)
Q=[('Quality','If you were rating quality today, what would it be, and what one thing would move it up?','If they cannot name the thing that would move it up, they have not seen your evidence. Send it.'),
 ('Schedule','Is there any milestone you consider late or at risk from your side?','Their view of "late" may differ from yours. Reconcile now, not in the comment period.'),
 ('Cost Control','Is our cost reporting giving you what you need, on time? Any concerns on burn rate?','Cost Control is the area most often rated Satisfactory by default. Ask what Very Good would look like.'),
 ('Management','Any communication or responsiveness issues from your side? Anything you had to escalate?','If they escalated anything, it is on the draft. Find out what and close it.'),
 ('Small Business Utilization','Have you seen the latest ISR/SSR? Any concerns about goals?','Late or inaccurate reports are the most common cause of a Marginal here. Confirm they have them.'),
 ('Regulatory Compliance','Any compliance concern on your side we should know about? CMMC, safety, export, security?','Compliance findings are often known to the Government before the contractor. Ask.'),
 ('Overall','Is there anything that, if it continued, would result in a rating below Satisfactory?','This is the question that prevents a surprise Marginal. Ask it directly.'),
 ('Overall','What would it take for you to rate us Exceptional in any area?','Now you know what to document for the rest of the period.')]
for i,(a,q,w) in enumerate(Q):
    r=6+i; cell(ic,r,2,a,bold=True,color=TEAL); cell(ic,r,3,q,bold=True); cell(ic,r,4,w); cell(ic,r,5,None); cell(ic,r,6,None); ic.row_dimensions[r].height=54
ic.cell(row=15,column=2,value='Timing: mid-point of the rating period at minimum; quarterly on a cost-type contract. Bring the Evidence Log tally. Leave with a written record of what they said.').font=Font(size=9,italic=True,color=GRAY)
ic.cell(row=15,column=2).alignment=Alignment(wrap_text=True); ic.merge_cells('B15:F15'); ic.row_dimensions[15].height=30
foot(ic,17); lock(ic,['E6:F13']); landscape(ic)

# ═══════════ REBUTTAL BUILDER ═══════════
rb=wb.create_sheet('Rebuttal Builder')
title(rb,'Rebuttal Builder: The 14-Day Response','Only for a draft rating you can prove is wrong against the contract. Build the argument here, then write the comment. Fourteen calendar days from notification (FAR 42.1503); if still unresolved, you may request review one level above the Contracting Officer.')
for c,w in zip('ABCDEFG',[2.5,22,44,48,44,16]): rb.column_dimensions[c].width=w
for i,h in enumerate(['Area','Rating given / sought','The specific contractual requirement (cite clause, CDRL, PWS paragraph)','Evidence that we met or exceeded it (log rows, dates, documents)','Proposed comment language','Days remaining']): hdr(rb,5,2+i,h)
rb['B4']='Draft notification date:'; rb['B4'].font=Font(bold=True,size=10); rb['C4']=datetime.date(2026,9,15); rb['C4'].number_format='mm/dd/yyyy'; rb['C4'].border=B; rb['C4'].fill=PatternFill('solid',fgColor='FFFFFBEB')
for i in range(6):
    r=6+i; a=AREAS[i]
    cell(rb,r,2,a,bold=True,color=TEAL); cell(rb,r,3,'Satisfactory \u2192 Very Good' if i==0 else None,center=True)
    cell(rb,r,4,'Example: PWS 3.2.1 requires acceptance test defect density below 2 per KSLOC. Increment 2 delivered at 0.4 per KSLOC (Test Report TR-2026-07).' if i==0 else None)
    cell(rb,r,5,'Example: Evidence Log rows 7/28 and 7/14. Government acceptance signed same day; no rework cycle.' if i==0 else None)
    cell(rb,r,6,'Example: "We respectfully request the Quality rating be revised to Very Good. PWS 3.2.1 sets a defect density threshold of 2.0/KSLOC; Increment 2 was accepted at 0.4/KSLOC (TR-2026-07), with acceptance signed the day of delivery and no rework. We believe this exceeds the requirement to the Government\u2019s benefit."' if i==0 else None)
    cell(rb,r,7,'=IF($C$4="","",MAX(0,14-(TODAY()-$C$4)))',center=True,bold=True)
    rb.row_dimensions[r].height=80
rb.conditional_formatting.add('G6:G11',FormulaRule(formula=['AND(G6<>"",G6<=3)'],fill=PatternFill('solid',fgColor=RED),font=RED_FONT))
rb.conditional_formatting.add('G6:G11',FormulaRule(formula=['AND(G6<>"",G6>3,G6<=7)'],fill=PatternFill('solid',fgColor=YELLOW),font=AMB_FONT))
rules=[('WHAT TO ARGUE',True),('The contract said X. We did X or better. Here is the document that proves it. That is the entire argument.',False),
('Argue against the rating, area by area. Do not argue against the Assessing Official.',False),
('Cite the PWS paragraph, the CDRL, the clause. A rebuttal without a citation is an opinion.',False),
('Attach or reference the evidence by document number and date. Make it easy to verify.',False),('',False),
('WHAT NOT TO ARGUE',True),
('Effort. "We worked very hard" is not a contractual requirement.',False),
('Government-caused delays, unless you have a documented request for equitable adjustment or a letter from the period. Raising it for the first time in the rebuttal reads as an excuse.',False),
('Tone. Every sentence of your comment stays in the system for three years and is read by future source selection boards. Write for them.',False),
('Everything. A rebuttal on six areas dilutes the one you can win. Pick the areas where the contract and the evidence are unambiguous.',False),('',False),
('IF THE CO DOES NOT REVISE',True),
('Request review by the official one level above the Contracting Officer (FAR 42.1503(d)). State the request in your comment. Your comments remain attached to the record either way, so write them as if the rebuttal is the last word, because it may be.',False)]
r=13
for t,b in rules:
    c=rb.cell(row=r,column=2,value=t); c.font=Font(bold=b,size=10 if b else 9,color=NAVY if b else '333333'); c.alignment=Alignment(wrap_text=True); rb.merge_cells(start_row=r,start_column=2,end_row=r,end_column=7)
    if not b and t: rb.row_dimensions[r].height=28
    r+=1
foot(rb,r+1); lock(rb,['C4:C4','C6:F11']); landscape(rb)

wb.save('cpars-playbook.xlsx'); print('built:',wb.sheetnames)
