#!/usr/bin/env python3
"""Patch remaining 78 items using direct replacement in the file text."""

with open('client/src/lib/curriculum.ts') as f:
    content = f.read()

SEP = '|||'
count = 0

# Each tuple: (exact_bullet_text, detail_to_append)
PATCHES = [
    ("The Federal Acquisition Roster \u2014 a list of approved contractors",
     "Incorrect. The FAR stands for the Federal Acquisition Regulation \u2014 the master rulebook governing how all U.S. federal agencies buy goods and services. There is no such thing as a \\'Federal Acquisition Roster.\\'"),

    ("The Federal Acquisition Regulation \u2014 the primary rulebook governing how the U.S. government buys goods and services",
     "Correct. The FAR (Federal Acquisition Regulation) is codified at 48 C.F.R. Chapter 1. It establishes uniform policies and procedures for all federal agencies. DoD supplements FAR with the DFARS for defense-specific requirements."),

    ("The Forward Acquisition Rate \u2014 a cost estimating tool",
     "Incorrect. \\'Forward Acquisition Rate\\' is not a real term. The FAR is the Federal Acquisition Regulation. Forward Pricing Rate Agreements (FPRAs) are a related but separate concept \u2014 negotiated labor and overhead rates used to estimate future contract costs."),

    ("$200M \u2014 the full ceiling value",
     "Incorrect. The ceiling is the maximum total value of all task orders that can be placed over the contract life \u2014 it does not guarantee any particular contractor that amount. Each contractor is guaranteed only the minimum and must compete for every task order."),

    ("$40M \u2014 their proportional share among 5 awardees",
     "Incorrect. IDIQ contracts do not split the ceiling equally. The $200M ceiling is a government-side limit on total spending. Each awardee competes for individual task orders. One contractor could win 90% of orders; another could win nothing beyond the minimum guarantee."),

    ("The government can award to any awardee at its sole discretion",
     "Incorrect for MAIDIQ. Under FAR 16.505, Multiple Award IDIQ contracts require a \\'fair opportunity\\' process for task orders over the threshold. Sole discretion applies only to Single Award IDIQs."),

    ("There is no issue \u2014 O&M funds are available indefinitely",
     "Incorrect. O&M funds are 1-year money \u2014 they must be obligated within the fiscal year in which they are appropriated. New obligations cannot be made after the end of the fiscal year. Failure to observe these rules violates the Anti-Deficiency Act."),

    ("The MDA approves entry into Engineering & Manufacturing Development \u2014 the system is built and tested",
     "Correct. Milestone B is the most significant acquisition decision for most programs. The MDA reviews the program\\'s readiness to begin detailed design, fabrication, and developmental testing. An Acquisition Program Baseline (APB) is established at this point."),

    ("Middle Tier \u2014 Rapid Fielding",
     "Correct. The Middle Tier Rapid Fielding pathway (Section 804 of FY2016 NDAA) is used to field proven capabilities with minimal development risk within 5 years of start. It bypasses some traditional milestone reviews for speed. Appropriate for commercial technology and productionized items with low technical risk."),

    ("Because requirements, design approach, and technology choices made early determine the complexity and cost of everything that follows \u2014 changing them later is exponentially more expensive",
     "Correct. Studies show 70-80% of a program\\'s life cycle cost is locked in by the end of the design phase. Adding requirements after EMD begins, or discovering technology limitations during production, creates delays and cost overruns that are orders of magnitude more expensive than getting it right during MSA."),

    ("Milestone A \u2014 Entry into Technology Maturation & Risk Reduction (TMRR)",
     "Correct. Milestone A is the entry point into the TMRR phase. The MDA approves the program\\'s approach to maturing technology and reducing risk before committing to a specific design. Key inputs: ICD validation, AoA completion, technology readiness assessments."),

    ("Milestone B \u2014 Entry into Engineering & Manufacturing Development (EMD)",
     "Correct. Milestone B is often the most consequential acquisition decision. The MDA approves the program\\'s plan to develop, fabricate, and test the system. Key inputs: CDD validation, systems engineering plan, APB establishment, CAPE independent cost estimate for ACAT I."),

    ("Milestone C \u2014 Entry into Production & Deployment (Low-Rate Initial Production authorized)",
     "Correct. Milestone C authorizes Low-Rate Initial Production (LRIP) \u2014 a limited production run before full-rate production. The MDA reviews developmental test results and approves the production contract strategy. LRIP units are used for operational testing (IOT&E) and initial fielding."),

    ("Full-Rate Production (FRP) Decision \u2014 After IOT&E completion",
     "Correct. The FRP Decision Review is held after operational testing (IOT&E) is complete and the Director, Operational Test and Evaluation (DOT&E) has certified results. The MDA approves full production."),

    ("The proposal is non-compliant \u2014 ceiling rates are contractually binding and the contractor cannot exceed them without a contract modification",
     "Correct. IDIQ labor category ceiling rates establish the maximum rate the contractor may bill. Proposing above the ceiling rate for a task order is a material non-compliance. The contractor must either reduce rates to the ceiling or request a formal contract modification."),

    ("The contractor is proposing an inflated labor mix \u2014 over-leveling LCATs to drive up cost without improving performance",
     "Correct. Over-leveling (or \\'labor-loading\\') involves proposing Senior Engineer-level hours for work that could be performed by Mid-level or Junior staff. On a T&M or cost-plus contract, this directly inflates billable cost. The CO and DCAA scrutinize the labor mix during cost or price analysis."),

    ("Method 2: AC + (BAC - EV) \u2014 Remaining work at original budget rates",
     "Correct. This EAC formula assumes cost overruns to date were anomalies and remaining work will proceed at originally planned rates. It is optimistic and appropriate only when the PM has strong evidence that past overruns were non-recurring."),

    ("Method 1/3: BAC / CPI \u2014 Remaining work at current cost efficiency",
     "Correct. This is the most commonly used and most statistically reliable EAC formula. Empirical research (Christensen studies) shows CPI rarely improves significantly after the 20% completion point. EAC = BAC/CPI is required for government EAC validation in most DoD programs."),

    ("Method 4: AC + [(BAC-EV)/(CPI\u00d7SPI)] \u2014 Combined cost and schedule inefficiency",
     "Correct. This composite EAC formula accounts for both cost (CPI) and schedule (SPI) efficiency \u2014 appropriate when schedule pressure is driving cost inefficiency (overtime, surge staffing). It is the most pessimistic of the standard EAC methods."),

    ("Direct Labor Rate (DLR) \u2014 base hourly rate for the labor category",
     "Correct. The DLR is the foundation of cost-type contract pricing. It represents the base hourly compensation for a specific labor category (e.g., Senior Systems Engineer: $85/hr). All indirect costs (fringe, overhead, G&A) and fee are applied on top of the DLR."),

    ("Fringe Benefits \u2014 applied to DLR (health, retirement, FICA, leave)",
     "Correct. Fringe is an indirect cost pool applied to direct labor. It typically includes FICA (7.65%), health/dental/vision insurance, 401k match, paid leave, and workers\\' compensation. Fringe rates for large contractors run 25-40% of direct labor."),

    ("Overhead \u2014 applied to direct labor within a business unit",
     "Correct. Overhead covers costs of running a business division not directly attributable to a specific contract \u2014 division management, facility costs, IT infrastructure, training. Overhead rates vary by business unit and are subject to DCAA Rate Agreements."),

    ("G&A \u2014 applied to Total Cost Input (all of the above)",
     "Correct. General and Administrative (G&A) expense covers enterprise-wide costs \u2014 CEO, CFO, legal, HR, corporate marketing. G&A is typically applied to Total Cost Input. G&A rates run 10-20% for large defense contractors and is the last indirect rate layer before fee."),

    ("Fee / Profit \u2014 applied to total estimated cost as final layer",
     "Correct. Fee (on cost-type contracts) or profit (on fixed-price) is negotiated between the CO and contractor. FAR 15.404-4 provides fee guidelines. For CPFF contracts, fee is fixed at negotiation. For CPAF, additional fee can be earned based on performance."),

    ("Optimized Acquisition Services \u2014 IT systems only",
     "Incorrect. OASIS+ stands for One Acquisition Solution for Integrated Services Plus. It is NOT limited to IT \u2014 it covers professional and technical services including program management, management consulting, engineering, scientific, financial, and logistics support. SEWP V is the GSA IT-focused GWAC."),

    ("One Acquisition Solution for Integrated Services Plus \u2014 professional and technical services across all disciplines",
     "Correct. OASIS+ is GSA\\'s flagship professional and technical services GWAC. Awarded in 2023-2024, it replaced the original OASIS contract with an expanded scope covering management consulting, program management support, engineering, R&D, data analytics, logistics, and more."),

    ("Operations and Sustainment Integrated Services \u2014 logistics and supply chain only",
     "Incorrect. No GWAC uses the abbreviation OASIS+ to mean \\'Operations and Sustainment Integrated Services.\\' OASIS+ is a GSA GWAC for professional and technical services \u2014 not a logistics-only vehicle."),

    ("Agency IDIQs require Congressional notification; GWACs do not",
     "Incorrect. There is no general rule requiring Congressional notification for agency IDIQs vs. GWACs. Large contracts may trigger Congressional notification under specific statutes (e.g., Nunn-McCurdy for cost growth on MDAPs), but that is program-specific, not vehicle-type-specific."),

    ("GWACs are only for small businesses; agency IDIQs are unrestricted",
     "Incorrect. GWACs are available to all businesses \u2014 large and small. Some GWACs have small business pools alongside large business pools (e.g., OASIS+, ALLIANT 2). Agency IDIQs can also be set-aside for small businesses. The restriction to small businesses is a set-aside decision, not inherent to GWACs."),

    ("WBS elements with negative CV (Cost Variance) \u2014 over-budget areas. Drill down to understand root cause.",
     "Correct. The most actionable Format 1 analysis starts with CV \u2014 negative CV means AC > EV, indicating a cost overrun. Sorting by CV magnitude identifies where program dollars are most at risk. Drill down to CAP (Control Account Plan) level to identify root causes: scope growth, rework, inefficiency, or inaccurate estimates."),

    ("WBS elements with negative SV (Schedule Variance) \u2014 behind-schedule areas. Cross-check against the IMS.",
     "Correct. Negative SV (EV < PV) indicates the program is behind schedule in EV terms. Cross-reference Format 1 SV against the IMS to identify whether schedule slippage is on the critical path or in float-absorbing near-critical tasks."),

    ("BAC vs. EAC at the total contract level \u2014 the delta is VAC. A growing negative VAC trend is the most critical warning sign.",
     "Correct. VAC (Variance at Completion) = BAC - EAC. A growing negative VAC trend \u2014 month over month \u2014 is the single most important indicator of program cost health. A program with declining CPI that does not adjust its EAC is masking the true projected overrun."),

    ("MR (Management Reserve) balance \u2014 if MR is eroding rapidly, the contractor is using contingency to mask overruns.",
     "Correct. MR is budget held outside the PMB for unplanned in-scope work. Rapid MR burn-down \u2014 especially without corresponding PMB growth or new work authorization \u2014 may indicate the contractor is using MR to absorb overruns instead of properly recognizing negative variance."),

    ("Undistributed Budget (UB) \u2014 budget not yet assigned to WBS elements. Large UB balances late in the program are a concern.",
     "Correct. UB represents authorized but unplanned work \u2014 budget not yet assigned to specific Control Accounts. Large UB balances in the middle or late phases of a program suggest poor planning, inadequate work authorization, or potential use of UB as a hidden reserve."),

    ("Which organizational element has the worst CPI \u2014 often points to staffing or technical problems in that org",
     "Correct. Format 2 breaks performance data by organizational reporting elements (OREs) \u2014 the contractor\\'s internal organizational structure. The ORE with the worst CPI is typically experiencing a localized problem: understaffing, technical difficulty, management issues, or subcontractor problems within that organizational unit."),

    ("Compare Format 2 performance by org against staffing data \u2014 declining BCWP with high ACWP from a specific org often means unproductive labor",
     "Correct. When an organization shows declining BCWP (accomplishment) but sustained or increasing ACWP (spending), it indicates labor investment is not translating to earned work \u2014 a classic inefficiency or management problem indicator."),

    ("Baseline changes from last period \u2014 any retroactive replanning (moving budget backward to cover past variances) is a serious concern",
     "Correct. Retroactive replanning \u2014 changing the PMB to cover past variances \u2014 is prohibited without explicit government approval. Format 3 changes must always be prospective; government approval is required for significant baseline changes."),

    ("Management Reserve (MR) draw-downs \u2014 compare total MR used against original MR balance",
     "Correct. Calculate the MR burn rate: (Original MR - Current MR Balance) / Months elapsed = Average MR burn per month. At the current rate, how many months until MR is exhausted? Premature MR exhaustion forces the PM into difficult tradeoffs."),

    ("Budget shifts between near-term and far-term \u2014 \"rubber baseline\" behavior is a gaming indicator",
     "Correct. \\'Rubber baseline\\' behavior \u2014 repeatedly moving planned value (BCWS/PV) further into the future to avoid recording negative schedule variance \u2014 is a form of baseline gaming. The baseline \\'stretches\\' to accommodate actual performance instead of recording the true schedule delay."),

    ("Current PMB vs. original PMB \u2014 large deviations indicate significant re-planning requiring government approval",
     "Correct. The PMB should only change through formally approved processes: Engineering Change Proposals (ECPs), Over-Target Baseline (OTB) approval, or government-approved replanning. Large deviations from the original PMB without formal authorization indicate improper baseline management."),

    ("Understaffing vs. plan \u2014 if actual headcount is significantly below planned, BCWP will lag BCWS (negative SV). Schedule slippage is predictable.",
     "Correct. Format 4 provides staffing data by labor category. Comparing actual headcount to planned identifies the root cause of SV in Format 1. Understaffing is the most common and predictable schedule driver \u2014 if the contractor is not putting the people on the program, the work cannot get done on schedule."),

    ("Overstaffing vs. plan \u2014 more labor than planned drives ACWP above BCWP (negative CV). May indicate rework or underestimated complexity.",
     "Correct. Overstaffing \u2014 more actual labor than planned \u2014 drives ACWP up without corresponding BCWP gain if the additional labor is not producing incremental value. Common causes: rework from failed tests, underestimated task complexity, or inefficient work authorization."),

    ("LCAT mix changes \u2014 substituting lower-grade labor for planned senior roles may affect technical quality",
     "Correct. Labor category mix shifts can affect both cost and technical quality. Substituting junior staff for planned senior engineers may reduce ACWP short-term but increase rework costs and schedule risk if junior staff cannot perform at the required technical level."),

    ("Causality, not just description \u2014 \"labor hours exceeded plan due to test failures\" is better than \"costs increased\"",
     "Correct. The most common Format 5 weakness is descriptive narratives that describe what happened without explaining why. Government reviewers expect causal analysis: what specific event or condition caused the variance? Root cause quality is the primary criterion for Format 5 adequacy."),

    ("Corrective action specificity \u2014 vague actions (\"team is working the issue\") with no timeline are not acceptable",
     "Correct. Acceptable corrective actions name a specific action, identify an owner by name and position, and include a target completion date. \\'The deputy PM is implementing a revised subcontractor surveillance plan, with monthly performance reviews beginning March 15\\' is acceptable. \\'We are working the issue\\' is not."),

    ("Recovery schedule \u2014 if behind schedule, Format 5 should show how the contractor plans to recover",
     "Correct. For WBS elements with negative SV, Format 5 should include a recovery plan \u2014 specific actions to recover the schedule slip. If recovery is not achievable, the narrative should acknowledge that and quantify the expected schedule impact."),

    ("EAC rationale \u2014 the Format 5 should explain the basis for the contractor\\'s EAC, especially if it differs from statistical EAC",
     "Correct. The contractor\\'s EAC must be explained in Format 5 when it differs materially from statistical EAC methods (BAC/CPI). If the contractor\\'s EAC is more optimistic than statistical methods predict, the government should require a detailed justification."),

    ("Variance thresholds \u2014 ensure all threshold variances (typically CV or SV over plus or minus 10% and over $100K) have narratives",
     "Correct. Most government contracts specify variance thresholds (e.g., CV or SV >10% and >$100K) that require written narratives in Format 5. Inconsistency in threshold reporting is itself a compliance finding."),

    ("Critical path \u2014 any slip on critical path tasks directly delays contract completion",
     "Correct. The integrated master schedule critical path is the sequence of tasks with zero total float. Any delay to a critical path task delays the program end date by the same amount. Government reviewers focus on critical path health, stability, and the float status of near-critical tasks."),

    ("Total Float \u2014 tasks with zero or negative total float are on or near critical path. Negative float means the task is already late.",
     "Correct. Total float represents how much a task can be delayed without delaying the program end date. Zero total float = critical path. Negative total float = the task\\'s schedule is already late relative to the plan. Negative float is a direct indicator of embedded schedule problems."),

    ("Schedule density \u2014 unusually high milestone clusters (\"schedule packing\") are a sign of unrealistic planning",
     "Correct. Schedule packing \u2014 an unrealistic concentration of milestones or completion events in a specific period \u2014 suggests the schedule was built backward from a desired end date rather than built bottom-up from realistic work estimates. It is a planning integrity red flag."),

    ("Logic ties \u2014 all tasks should have predecessor/successor relationships. Tasks with no ties cannot drive accurate critical path analysis.",
     "Correct. Every task in a well-structured IMS should have at least one predecessor and one successor. Tasks with no predecessor/successor relationships \u2014 called \\'open-ended tasks\\' or \\'dangling activities\\' \u2014 float freely and do not contribute to a realistic critical path analysis."),

    ("Compare current IMS critical path to last period \u2014 an unstable critical path indicates poor schedule management",
     "Correct. An unstable critical path \u2014 one that shifts significantly month to month \u2014 indicates poor schedule management or deliberate baseline gaming. Major shifts suggest the schedule is being manipulated rather than updated based on actual progress."),

    ("CPI < 1.0: cost overrun \u2014 how far, how fast is it moving?",
     "Correct. CPI = EV/AC. A CPI below 1.0 means the program is spending more than the budgeted value for work accomplished. The critical questions: (1) How far below 1.0? (0.95 is concerning; 0.80 is severe). (2) Is the trend worsening month over month? (3) Has it crossed the 20% completion point?"),

    ("VAC (negative): projected overrun at completion \u2014 is it growing each month?",
     "Correct. VAC = BAC - EAC. A growing negative VAC trend \u2014 month over month \u2014 is the most critical program cost health indicator. If VAC deteriorates by $5M each month report, the program office needs to act before the overrun becomes unmanageable."),

    ("SPI < 1.0: behind schedule \u2014 note which months it started declining",
     "Correct. SPI = EV/PV. SPI < 1.0 indicates schedule slippage in EV terms. Identifying when SPI started declining is critical \u2014 was it a specific event (test failure, key personnel departure) or a slow degradation?"),

    ("Note if the same WBS element appears in both CV and SV worst lists \u2014 that is a compounding problem",
     "Correct. A WBS element appearing in both the worst CV and worst SV lists is a compounding problem: spending more than planned AND achieving less than planned simultaneously. These dual-variance elements pose the highest program risk and require immediate management attention."),

    ("Undistributed Budget (UB): large UB that\\'s been sitting means work is not yet planned in detail \u2014 schedule risk.",
     "Correct. UB represents authorized work not yet planned at the Control Account level. Large, persistent UB late in a program indicates work is not being planned in detail \u2014 which means schedule cannot be tracked, and the PMB understates the full scope of planned activity."),

    ("\"Volume I \u2014 Technical Approach, not to exceed 50 pages, 12pt Times New Roman, 1-inch margins\"",
     "Correct. Volume I contains the technical approach \u2014 typically the highest-weighted evaluation factor. Page limits are strictly enforced; a non-compliant submission may be deemed non-responsive. Every page should directly support a strength evaluation against Section M criteria."),

    ("\"Volume II \u2014 Management Approach, not to exceed 25 pages\"",
     "Correct. The Management Volume demonstrates the contractor\\'s ability to organize, staff, and execute. Key elements: organizational chart, key personnel resumes, program management methodology, risk management approach, quality assurance plan, and subcontractor management strategy."),

    ("\"Volume III \u2014 Past Performance, provide up to 3 references using the government-provided form\"",
     "Correct. Past performance is evaluated using CPARS data and submitted references. Select references that are: (1) recent (within 3-5 years), (2) relevant (similar scope, complexity, contract type), and (3) had excellent CPARS ratings."),

    ("\"Volume IV \u2014 Price/Cost, no page limit, must include completed DD Form 1423 (CDRLs)\"",
     "Correct. The Price/Cost Volume must be complete, consistent with the technical approach, and independently auditable. Key elements: labor category hours by WBS, basis of estimate, direct labor rates, indirect rates, other direct costs, and required government forms."),

    ("Strengths must be documented \u2014 evaluators can only credit what they can see and quote.",
     "Correct. Source selection decisions are legally defensible only when based on documented evaluation. If an SSEB member believes a proposal feature is a strength but cannot quote specific text, the strength cannot be formally recorded. Every strength must be explicitly stated in the proposal."),

    ("The SSDD is the legal basis for the award \u2014 it must be defensible in a protest",
     "Correct. The SSDD is the most legally significant acquisition document. In a GAO protest, the GAO reviews the SSDD to determine whether the source selection was reasonable, consistent with stated criteria, and documented. SSDD deficiencies are the most common grounds for sustained protests."),

    ("Source Selection Plan (SSP): SSA approves the SSP \u2014 defines factors, sub-factors, weights, rating scales, and the evaluation process BEFORE solicitation release",
     "Correct. The SSP is the government\\'s internal roadmap for the evaluation. It must be approved before the RFP is released because Section M (evaluation factors for award) must be consistent with the SSP. The SSP is not released to offerors."),

    ("Q&A Period: Written questions answered via amendment distributed to ALL offerors \u2014 no private answers",
     "Correct. Procurement integrity requirements (FAR 3.1) prohibit private communications that give any offeror an advantage. All questions submitted in writing are answered via an amendment distributed simultaneously to all offerors. Answers received privately create protest risk."),

    ("Contract Execution: CO executes \u2014 award notice posted to SAM.gov",
     "Correct. The CO executes the contract (signs the award document) and the award notice is posted to SAM.gov per FAR 5.301. The contract is legally binding upon the CO\\'s signature on behalf of the government and the contractor\\'s signature."),

    ("Strong BD performance \u2014 a large pipeline maximizes win probability",
     "Incorrect. A large pipeline without qualification exhausts proposal resources on low-probability pursuits. A $500M pipeline with 15% average pWin is less productive than a $200M pipeline with 40% average pWin. Quality beats volume in BD pipeline management."),

    ("Normal BD operations \u2014 most opportunities in any pipeline have low pWin",
     "Correct. Most early-stage opportunities have inherently low pWin because they are being tracked before the company has built a discriminating solution. As opportunities mature through the BD lifecycle (identify \u2192 qualify \u2192 shape \u2192 pursue), pWin should increase."),

    ("Contemporaneous timekeeping \u2014 capturing time by contract daily, not retroactively",
     "Correct. DCAA requires employees on cost-type contracts to capture time contemporaneously \u2014 at the time of performance, not reconstructed after the fact. Retroactive timesheet entries are a serious accounting system deficiency. Each employee must record hours by specific contract number daily."),

    ("At contract award \u2014 the moment the current period of performance begins",
     "Correct. Sophisticated contractors begin recompete strategy at contract award \u2014 sometimes called \\'Day 1 positioning.\\' The first day of performance sets the trajectory for CPARS ratings, customer relationships, and technical differentiation that will ultimately determine the recompete outcome."),

    ("MR is never included \u2014 it violates the Anti-Deficiency Act",
     "Incorrect. Management Reserve is a standard and required element of EVM-based program management. MR is held above the PMB but within the total program budget \u2014 it does not violate the Anti-Deficiency Act. MR is pre-authorized by the government within the program\\'s total budget authority."),

    ("Direct oversight authority \u2014 the PM can issue direction to subcontractors",
     "Incorrect. There is no privity of contract between the government and subcontractors. The PM cannot issue binding direction to subcontractors. Doing so would be an unauthorized commitment and could expose the government to liability. The PM communicates subcontractor concerns through the prime."),

    ("Insight rights through the prime \u2014 the PM can receive data but cannot direct subcontractors independently",
     "Correct. The government\\'s relationship to subcontractors is indirect \u2014 mediated through the prime contractor. The PM can request subcontractor performance data and assess subcontractor risk, but cannot direct subcontractor work independently. The prime remains responsible for managing its supply chain."),

    ("Normal performance variation \u2014 single-period CPI fluctuations are expected",
     "Incorrect for a program with three consecutive declining months. Single-period CPI fluctuations are normal. But three consecutive months of declining CPI \u2014 especially past the 20% completion point \u2014 is statistically significant. Sustained CPI decline after 20% completion rarely reverses."),

    ("It is untestable \u2014 meaning there is no way to confirm compliance or non-compliance, creating contract disputes and requirements creep",
     "Correct. A non-testable requirement (e.g., \\'the system shall be user-friendly\\') is a systems engineering deficiency. If there is no defined test method or acceptance criterion, the government and contractor will disagree on whether the requirement has been met \u2014 creating disputes and requirements creep."),

    ("They wait until a problem is visible before engaging upward \u2014 losing the political capital built through proactive communication",
     "Correct. The most common PM communication failure is reactive rather than proactive stakeholder management. PMs who brief problems only after they become visible lose credibility. PMs who proactively brief emerging risks build the trust that allows them to navigate bad news without program-threatening consequences."),
]

for bullet_text, detail in PATCHES:
    # Build the exact string to find: '...bullet_text...',
    old_str = f"'{bullet_text}',"
    new_str = f"'{bullet_text}{SEP}{detail}',"

    if old_str in content:
        content = content.replace(old_str, new_str, 1)
        count += 1
    else:
        print(f"NOT FOUND: {bullet_text[:60]}")

with open('client/src/lib/curriculum.ts', 'w') as f:
    f.write(content)

print(f"\nPatched {count} items")

# Verify remaining
with open('client/src/lib/curriculum.ts') as f:
    content2 = f.read()
lines2 = content2.split('\n')
plain_bullets = []
for l in lines2:
    s = l.strip()
    if s.startswith("'") and s.endswith("',") and '|||' not in s:
        inner = s[1:-2].strip()
        if inner and len(inner) > 10 and not inner.startswith('http'):
            plain_bullets.append(inner)

print(f"Remaining without detail: {len(plain_bullets)}")
for b in plain_bullets[:10]:
    print(f"  - {b[:80]}")
