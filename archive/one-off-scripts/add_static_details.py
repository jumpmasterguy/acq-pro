"""
Add |||detail to list items in high-traffic lessons.
Format: 'Original bullet text|||Static detail shown on expand'
"""

with open('client/src/lib/curriculum.ts', 'r') as f:
    content = f.read()

SEP = '|||'

# Map of exact item text → detail to append
# Key must exactly match the start of the item string in the curriculum
DETAILS = {

  # ── MODULE 1: Lesson 1 — What Is Defense Acquisition ─────────────────────
  'Competition — the government must generally compete its requirements so multiple companies can bid. This keeps prices fair and ensures the government gets the best value, not just the most connected vendor.':
    'FAR Part 6 governs competition requirements. Full and open competition is the default — exceptions (sole source, urgency, follow-on) must be documented in a Justification & Approval (J&A) and are scrutinized by oversight bodies. Reducing competition requires CO and often higher-level approval.',

  'Transparency — the rules, evaluation criteria, and award decisions must be documented and defensible. A losing contractor can protest an award if they believe the process was unfair.':
    'Protests can be filed at the GAO (within 10 days of debriefing), the Court of Federal Claims, or the agency level. The GAO resolves protests within 100 days and has a ~40% sustain rate — meaning roughly 4 in 10 protests result in corrective action. Transparent documentation is the CO\'s best defense.',

  'Accountability — taxpayers, Congress, and oversight agencies (like the GAO and DoD IG) monitor how money is spent. Program managers and contracting officers are personally accountable for following the rules.':
    'The Anti-Deficiency Act (ADA) makes improper spending a personal liability — not just an organizational one. Violations must be reported to Congress and OMB. The DoD IG and GAO conduct audits that become public record. Acquisition professionals who cut corners face administrative action and potential criminal referral.',

  'Products (Systems & Equipment) — physical items: aircraft, vehicles, ships, weapons, satellites, radios, body armor. These often involve years of development before they can be produced and fielded. The most complex category.':
    'Major defense systems (ACAT I programs) can take 15–25 years from concept to full fielding and cost $1B–$100B+. The F-35 program, for example, has a total lifecycle cost estimated above $1.7 trillion. The complexity of systems acquisition is why the DoD 5000 series of instructions exists specifically for it.',

  'Services — people doing work for the government: program management support, IT services, base operations, maintenance, security, training. This is the largest category by contract volume and where most contractors spend their time.':
    'Services represent over 50% of DoD contract spending by volume. They are governed by FAR Part 37 and the Services Acquisition pathway (DoDI 5000.74) for requirements above $250M. Most services are competed through IDIQ vehicles like OASIS+ rather than standalone contracts.',

  'Research & Development (R&D) — funding for science, technology, experimentation, and innovation. Not buying a finished product, but funding the work to create new capabilities that may eventually become programs.':
    'R&D is funded through RDT&E appropriations (2-year availability). DoD spends ~$100B/year on R&D across six budget activities: Basic Research (6.1), Applied Research (6.2), Advanced Technology Development (6.3), Advanced Component Development (6.4), System Development (6.5), and Management Support (6.6). The "6.X" number you\'ll see in budget exhibits refers to these categories.',

  'The Contracting Community — Contracting Officers (COs) and their teams. They write and award contracts, negotiate prices, administer contract performance, and authorize payments. They are the government\'s legal agents. Only a CO can obligate the government to spend money.':
    'COs are "warranted" — they hold a Certificate of Appointment (DD Form 2579) that specifies their contracting authority limit. A CO can only sign contracts up to their warrant threshold; larger actions require a higher-warranted CO. This is why large programs always involve a PCO (Procuring CO) at the awarding office.',

  'The Program Management Community — Program Managers (PMs) and their program offices. They define requirements, manage the technical and schedule execution, work with contractors day-to-day, and are accountable for delivering the capability. They rely on COs to handle the contractual side.':
    'PMs are accountable for the Acquisition Program Baseline (APB) — the formal cost, schedule, and performance targets. Significant deviations from the APB trigger reporting requirements to OSD and Congress. For ACAT I programs, the PM is typically an O-6 (Colonel/Captain) or SES civilian with DAWIA Program Management Level III certification.',

  # ── MODULE 1: Lesson 2 — Contracts vs Task Orders ─────────────────────────
  'One contractor wins the vehicle. All task orders go to that firm without further competition.':
    'Single-award IDIQs require the government to justify why only one firm can meet the requirement — it\'s a high bar. They\'re most common for highly specialized support contracts where the government needs continuity (e.g., a single systems engineering support contractor for a specific weapons program). Losing a single-award IDIQ recompete means losing 100% of that revenue.',

  'Revenue certainty is high — if you won the IDIQ, you\'re getting the work.':
    'This certainty comes at a price: winning a single-award IDIQ is extremely competitive precisely because the stakes are so high. Firms often spend $1M–$5M+ on a proposal for a major single-award IDIQ. The upside is that once won, there\'s no further competition — just execution.',

  'Entry is extremely competitive because the stakes are so high.':
    'For single-award IDIQs above $100M, expect 5–15 qualified offerors all investing heavily in proposals. Win probability is low for any individual firm, but the expected value is high because the winner gets everything. Small businesses rarely compete successfully for single-award IDIQs above $50M without a strong teaming arrangement.',

  'Multiple contractors (often 5–20+) hold the vehicle. Each task order is competed among the awardees under FAR 16.505 fair opportunity rules.':
    'The number of awardees varies widely by vehicle. OASIS+ has hundreds of awardees per pool. A large Air Force A&AS IDIQ might have 9. More awardees means easier entry but more competition per task order. The government prefers MA-IDIQs for most services because they maintain ongoing competition and price pressure throughout the contract period.',

  'Entry is easier than single-award, but you must keep winning task orders to generate revenue.':
    'Getting on an MA-IDIQ is the prerequisite, not the win. Many firms win vehicle positions and then generate little or no revenue because they lack the BD infrastructure to pursue task orders continuously. A firm with 10 IDIQ positions and no dedicated task order capture team will consistently underperform a firm with 3 positions and strong BD.',

  'Requires sustained BD effort post-award — the competition never stops.':
    'Task order BD is fundamentally different from new vehicle pursuit. It\'s relationship-intensive, faster-paced, and requires deep understanding of the specific program office\'s requirements. The best predictor of task order win rate is COR relationship quality — firms that invest in COR engagement consistently outperform those focused only on proposal quality.',

  # ── MODULE 1: Lesson 3 — Who\'s Who ─────────────────────────────────────────
  'Congress — Authorizes and appropriates all defense spending. Sets statutory requirements that no one can waive (Nunn-McCurdy, TINA, competition requirements). Defense committees oversee the largest programs closely.':
    'The House and Senate Armed Services Committees (HASC/SASC) authorize programs through the National Defense Authorization Act (NDAA), passed annually. The Appropriations Committees (HAC-D/SAC-D) then fund them. A program can be authorized but not funded — or funded at a different level than requested. Congressional staff track major programs closely and Congressional direction in NDAAs has direct programmatic impact.',

  'OSD (Office of the Secretary of Defense) — Sets policy, runs oversight reviews for major programs, controls the defense budget request. Key OSD offices: USD(A&S) for acquisition policy, CAPE for independent cost estimates, DOT&E for testing oversight.':
    'USD(A&S) — Under Secretary of Defense for Acquisition and Sustainment — is the principal acquisition authority for DoD. CAPE (Cost Assessment and Program Evaluation) produces independent cost estimates that are almost always higher than program office estimates; CAPE\'s track record on accuracy is strong. DOT&E (Director of Operational Test & Evaluation) provides independent testing oversight and can effectively block a Milestone C if IOT&E results are inadequate.',

  'Service Acquisition Executives (SAEs) — One per service (Army: ASA(ALT), Navy: ASN(RDA), Air Force: SAF/AQ). The SAE is responsible for all acquisition programs within their service and is the Milestone Decision Authority for most ACAT I programs.':
    'The SAE is a Senate-confirmed political appointee (Assistant Secretary level). They chair the service-level milestone decision reviews and sign the Acquisition Decision Memorandum (ADM) that formally advances a program. For ACAT ID programs, the MDA is elevated to USD(A&S). The SAE also chairs the Service Acquisition Review (SAR) process that reviews programs below ACAT I threshold.',

  'Program Executive Officers (PEOs) — Oversee portfolios of related programs. A PEO might manage all Army ground vehicles, or all Air Force electronic warfare programs. They are the PM\'s direct chain of command.':
    'PEOs are typically major generals (O-8) or equivalent SES civilians. They manage multiple PMs simultaneously and are accountable for the entire portfolio\'s performance. A PEO will often have 10–30 programs under their oversight. They brief the SAE regularly and are the first escalation point when a PM\'s program has a problem.',

  'Contracting Officers (COs) — Award and administer contracts. Independent authority — a CO can refuse to sign a contract they believe is improper even under PM pressure.':
    'This independence is intentional and legally protected. A CO who signs a contract they believe to be improper faces personal liability. COs are trained to recognize and resist unauthorized commitments — government employees who direct contractor work without contractual authority create illegal obligations. The CO\'s independent judgment is a key check on the system.',

  'Contracting Officer\'s Representatives (CORs) — Delegated by the CO to monitor contractor performance day-to-day. Often technical staff embedded with the program. One of the most influential people in a contractor\'s daily life.':
    'CORs must complete mandatory training (CLC 106 at DAU) and hold a formal written appointment letter from the CO specifying their authority and limitations. CORs cannot direct contract changes or authorize additional work — only the CO can do that. But their CPARS ratings and performance observations directly influence option year exercises and recompete outcomes. A contractor with a bad COR relationship is in serious trouble.',

  'Business Development (BD) — Identifies opportunities, builds relationships with government customers, and tracks the market 12–24 months before any RFP is released. BD is the front end of the revenue pipeline.':
    'BD professionals are measured on pipeline value and opportunity identification, not wins. They work 12–36 months ahead of the proposal, attending industry days, responding to RFIs, and building customer relationships. The most effective BD contacts are mid-level program office staff (GS-13/14 level) and CORs — not senior executives, who often don\'t control requirement shaping.',

  'Capture Manager — Takes over from BD once a specific opportunity is identified and pursued. Leads the strategy to win: competitive analysis, teaming, solution shaping, customer engagement. Makes the go/no-go decision to bid.':
    'The capture manager is accountable for pWin (probability of win) assessment and the gate review decision to invest proposal resources. A mature capture process has formal gates at 12 months, 6 months, and 30 days before RFP. A capture manager who consistently bids low-pWin opportunities is not doing their job — the goal is to win, not to submit proposals.',

  'Proposal Manager — Leads proposal development in response to the RFP. Coordinates writing, pricing, graphics, reviews, and submission. Often the most intense role in the company during a bid.':
    'Proposal development for a major IDIQ vehicle or large standalone contract can involve 20–50+ people working for 30–60 days. Costs $500K–$2M+ for large bids. The proposal manager enforces the compliance matrix (Section L), coordinates color reviews (Pink, Red, Gold teams), and manages the production schedule to avoid a last-minute scramble. A late or non-compliant proposal is an automatic disqualifier.',

  'GAO (Government Accountability Office) — The "congressional watchdog." Audits government programs and contracting actions, issues public reports. Contractors can protest contract awards to the GAO.':
    'GAO bid protests must be filed within 10 days of debriefing or 10 days of when the protester knew (or should have known) the basis of protest. GAO has 100 days to issue a decision. The GAO sustain rate is ~40% — meaning roughly 4 in 10 protests result in some form of corrective action (re-evaluation, re-solicitation, or cancellation). Filing a protest does not automatically stay contract performance.',

  'DoD IG (Inspector General) — Investigates fraud, waste, and abuse within DoD. Can refer cases for criminal prosecution.':
    'The DoD IG is independent of the military services and reports directly to the Secretary of Defense and Congress. IG hotlines allow anonymous reporting. IG investigations can lead to suspension and debarment proceedings against contractors, criminal referrals to DOJ, and career-ending findings for government employees. The False Claims Act allows whistleblowers to bring qui tam suits and share in recoveries.',

  'DCAA (Defense Contract Audit Agency) — Audits contractor costs on cost-reimbursable contracts. Approves contractor accounting systems. A DCAA finding can halt progress payments.':
    'DCAA employs ~5,000 auditors and audits billions in contract costs annually. A DCAA "inadequate" determination on a contractor\'s accounting system can result in withheld progress payments and can disqualify the firm from cost-reimbursable contracts. Common DCAA findings: inadequate timekeeping, unallowable cost commingling, indirect rate structure problems, and missing written policies.',

  'DCMA (Defense Contract Management Agency) — Provides contract administration services for DoD, including overseeing contractor performance and EVMS (Earned Value Management System) surveillance.':
    'DCMA assigns Contract Management Officers (CMOs) to large defense contractors — often co-located at contractor facilities. For ACAT I programs, DCMA conducts formal EVMS surveillance and can issue Corrective Action Requests (CARs) if the contractor\'s earned value system is not functioning properly. DCMA also conducts past performance assessments that feed into CPARS.',

  'CAPE (Cost Assessment and Program Evaluation) — Produces independent cost estimates for major programs. Often the source of uncomfortable but accurate news about program cost overruns.':
    'CAPE ICEs (Independent Cost Estimates) are required for all ACAT I programs before Milestone B. CAPE estimates are typically 20–40% higher than program office estimates — and historical data shows CAPE is more accurate. A PM whose program CAPE has estimated at 3x the program office number faces a difficult milestone review. Engaging CAPE early and addressing their methodology concerns is far better than being surprised at the review.',

  # ── MODULE 1: Lesson 4 — How Money Works ────────────────────────────────────
  'Funds expire — every appropriation has a period of availability. O&M funds must be obligated within one year. After expiration, they can no longer be obligated for new work. After the expenditure period, they close entirely.':
    'The lifecycle of an appropriation: (1) Available period — can be obligated for new contracts; (2) Expired period (5 years after availability ends) — can only pay existing obligations, no new work; (3) Closed — all balances cancelled, no further payments. O&M: 1-year available + 5-year expired. Procurement: 3-year + 5-year. If a contractor submits an invoice after funds have closed, the government cannot pay it from those funds — it must use current-year money, which requires reprogramming.',

  'You cannot exceed what Congress gave you — a program cannot spend more than its appropriated amount. If a program runs over budget, it must either get more money from Congress (reprogramming) or descope the work.':
    'Reprogramming moves money between budget lines. Below-threshold reprogramming (under $10M–$20M depending on the service) can be done administratively. Above-threshold reprogramming requires Congressional notification and a waiting period (usually 15–30 days). Emergency reprogramming requests during execution are common on programs with unexpected technical problems and typically involve difficult negotiations with both the service and Congressional committees.',

  'Money must be used for its intended purpose — using RDT&E money to buy production equipment is illegal. Using O&M to build a permanent facility is illegal. These rules are enforced, and violations are serious.':
    'Bona Fide Need Rule: funds may only be used to meet a genuine, authorized need that arose during the period of availability. Using FY25 O&M to pre-buy FY26 supplies is an ADA violation even if the funds haven\'t expired. The "purpose statute" (31 U.S.C. § 1301) requires that appropriations be used only for the specific purposes for which they were appropriated.',

  'Fiscal year end is a real deadline — the end of the government fiscal year (September 30) is a hard deadline for obligating O&M funds. Programs scramble to obligate expiring funds responsibly — but "use it or lose it" thinking can lead to wasteful spending.':
    'September is the busiest month in government contracting by volume. Contract modifications, new awards, and delivery orders spike dramatically. "End of year money" is real — programs that have unobligated O&M approaching September 30 are under pressure to obligate it or lose it. This creates procurement pressure that can lead to poorly scoped requirements and rushed awards. GAO has repeatedly flagged end-of-year spending as a waste risk.',

  'Reprogramming requires approval — if a program needs to move money between budget lines or fiscal years, it typically requires Congressional notification or approval depending on the amount.':
    'There are four types of reprogramming: (1) Above-threshold (Congressional notification required, 15–30 day waiting period); (2) Below-threshold (internal service approval); (3) Transfers (moving between appropriations — very restricted, requires specific statutory authority); (4) Supplemental appropriations (requires a new act of Congress). PMs who anticipate reprogramming needs should work with their financial manager 6–12 months in advance.',

  # ── PRO MODULES: High-traffic list blocks ────────────────────────────────────

  # Contract Types
  'FFP (Firm-Fixed-Price): Price locked at award. Contractor eats every dollar over target. Best for well-defined, low-risk, competitive work.':
    'FAR 16.202. FFP is the government\'s preferred contract type because it transfers cost risk to the contractor and creates strong incentive for efficiency. The contractor earns more profit by managing costs below the fixed price. Required for commercial items. Not appropriate when the statement of work has significant technical uncertainty — using FFP on immature development work forces excessive contingency into the price or creates underpriced contracts that result in default.',

  'FPIF (Fixed-Price Incentive Firm): Starts like FFP with a target cost and ceiling price, but performance above/below target shares savings/overruns between government and contractor per a share ratio.':
    'FAR 16.403. FPIF has three key numbers: Target Cost, Target Profit, and Ceiling Price. The share ratio (e.g., 80/20) means for every dollar over target cost, the contractor absorbs 80 cents and the government absorbs 20 cents — up to the ceiling price, above which the contractor bears 100% of cost growth. FPIF is the standard contract type for LRIP as programs transition from development to production.',

  'CPIF (Cost-Plus-Incentive-Fee): Government pays all allowable costs. Contractor earns a base fee plus/minus incentive based on cost performance against targets.':
    'FAR 16.304. The incentive formula rewards the contractor for finishing under target cost and penalizes overruns. CPIF is appropriate for complex development work where the technical risk is real but cost targets can be established. The fee range (minimum to maximum) must be specified — a typical range is 4% to 12% of target cost. CPIF gives the contractor a financial reason to control costs while protecting them from catastrophic loss on genuinely uncertain work.',

  'CPAF (Cost-Plus-Award-Fee): Government pays all allowable costs plus a base fee. An award fee (subjective) is added based on performance evaluation by a Fee Determining Official (FDO).':
    'FAR 16.305. The award fee is subjective — it\'s based on the government\'s evaluation of performance quality, responsiveness, and management, not just cost metrics. An Award Fee Plan defines the evaluation criteria and periods. Award fees are powerful motivators for contractor management attention, but they require significant government evaluation effort. The FDO (often the PM or PEO) must evaluate and document performance each award fee period.',

  'CPFF (Cost-Plus-Fixed-Fee): Government pays all allowable costs plus a fixed fee (profit) that does not change based on performance. Lowest incentive for cost control.':
    'FAR 16.306. CPFF gives the contractor the least incentive of all cost-type contracts — the fee doesn\'t change whether the contractor performs efficiently or not. Appropriate for exploratory R&D, studies, and work where cost and scope are genuinely unknowable. Completion fee vs. Term fee: a Completion CPFF fixes the fee to delivering a specific result; a Term CPFF fixes the fee to a level of effort over time, with no specified end result.',

  'T&M (Time & Materials): Government pays hourly labor rates plus materials at cost. Highest risk to government — no ceiling without a cap. Used only when no other type is possible.':
    'FAR 16.601. T&M is the riskiest contract type for the government because there is no incentive for the contractor to control costs — they bill hours regardless of efficiency. FAR requires a determination that no other contract type is suitable, a ceiling price with a completion clause, and enhanced COR surveillance. T&M is most common for emergency repairs, undefinitized periods (before a FFP is negotiated), and situations where the level of effort is genuinely unknowable.',

  # IDIQ Ordering Process
  'Step 1: Requirement identified — program office describes work needed, writes a Performance Work Statement or Statement of Work.':
    'The quality of the PWS/SOW at this step determines the quality of the task order proposals and ultimately the quality of performance. A vague SOW produces vague proposals and an ambiguous contract. A good task order SOW describes outcomes (performance-based), includes measurable acceptance criteria, and specifies deliverables with clear format and timing. Writing a good SOW is one of the most underinvested activities in task order contracting.',

  'Step 2: Determine if an existing IDIQ can satisfy the requirement (scope, ceiling, period, pool).':
    'The CO must conduct a scope determination — verify that the work falls within the original IDIQ\'s scope of work. Placing a task order outside the IDIQ\'s scope is an improper order and effectively a sole-source contract without competition justification. For GWACs like OASIS+, scope is broadly defined but still has limits — IT products, for example, must go through an IT GWAC, not OASIS+.',

  'Step 3: Issue a task order Request for Proposal (TORFP) to awardees in the applicable pool.':
    'TORFPs under MA-IDIQs must provide fair opportunity per FAR 16.505. The TORFP includes the SOW/PWS, evaluation factors, proposal instructions, and period of performance. Page limits are common (10–30 pages for most task orders vs. 100+ pages for new vehicle bids). Response times are typically 7–30 days — much faster than full proposals. Contractors who aren\'t tracking the program office relationship often get TORFPs with too little time to respond well.',

  # OASIS+ Ordering Steps
  'Step 1: Determine the requirement fits OASIS+ scope (professional/technical services)':
    'OASIS+ covers complex professional services: program management, management consulting, logistics, engineering, scientific, and financial management services. It does NOT cover IT products, construction, or commercial off-the-shelf items. Before using OASIS+, the ordering CO must verify scope fit and document it. Misaligned orders are a protest risk. GSA\'s OASIS+ Program Office can assist with scope determinations.',

  'Step 2: Identify the correct OASIS+ pool (unrestricted vs. small business, functional area)':
    'OASIS+ has separate pools for unrestricted (large business), small business, 8(a), HUBZone, SDVOSB, and WOSB. Within each pool, there are functional areas (domains) — the requirement must align to a pool where the work fits. Ordering from the wrong pool is a compliance error. The government must also decide whether to use a set-aside pool (if the requirement can be satisfied by SB pool holders) before going unrestricted.',

  'Step 3: Establish an Interagency Acquisition Agreement (IAA) with GSA (if not already in place)':
    'An IAA (usually an Economy Act determination or assisted acquisition agreement) authorizes the ordering agency to use GSA\'s contract vehicle. The ordering agency CO must document the authority basis, confirm it\'s cost-effective vs. running an independent procurement, and comply with their own agency\'s ordering procedures. GSA charges an Industrial Funding Fee (IFF) of 0.75% on all OASIS+ orders — this must be included in the price analysis.',

  'Step 4: Issue a Task Order Request for Proposal (TORFP) to the applicable pool':
    'The TORFP must provide fair opportunity to all pool holders — typically issued through eBuy (GSA\'s e-procurement system). The TORFP defines evaluation factors, proposal instructions, submission format, and the period of performance. The ordering CO issues the TORFP under their own agency\'s procurement authority, not GSA\'s. Exception: if using GSA as the contracting agent (assisted acquisition via FEDSIM/AAS), GSA runs the source selection.',

  'Step 5: Provide fair opportunity to all eligible pool holders per FAR 16.505':
    'Fair opportunity is the default rule for all MA-IDIQ task orders. The CO must document how fair opportunity was provided. Exceptions are narrow: unusual urgency (documented and time-limited), only one awardee is capable (rare and risky to claim), public interest determination, logical follow-on to an existing order, or the order is below the simplified acquisition threshold. Using an improper exception is a top protest ground.',

  'Step 6: Evaluate proposals and make best-value task order award':
    'Best Value Tradeoff (BVTO) is the standard evaluation approach. The technical approach and past performance typically carry more weight than price on complex services task orders. The Source Selection Authority (SSA) documents the tradeoff decision. Unlike formal FAR Part 15 source selections, task order source selections have lighter documentation requirements — but the decision must still be defensible to a protest.',

  'Step 7: Administer the task order — the ordering agency\'s CO retains oversight':
    'The ordering CO and COR manage performance after award. DCMA may assist with contractor surveillance for large orders. CPARS ratings are entered by the COR/PM at task order completion and are one of the most valuable or damaging pieces of past performance evidence in future competitions. Good contract administration — consistent documentation, timely deliverable acceptance, proactive issue resolution — is what protects the government\'s recompete position.',

  # Source Selection Steps
  'Step 1: Develop Acquisition Strategy — contract type, competition, evaluation approach, schedule.':
    'The Acquisition Strategy is approved by the MDA/CO supervisor before the solicitation is drafted. It documents the contract type rationale, competition approach (full and open, set-aside, sole source), evaluation methodology (LPTA vs. BVTO), and estimated schedule. For large acquisitions, a pre-solicitation industry engagement (industry day, RFI) often precedes the strategy to inform government decision-making.',

  'Step 2: Draft RFP — Sections L (instructions) and M (evaluation factors) drive everything.':
    'Section L tells offerors HOW to prepare proposals. Section M tells them HOW they will be evaluated. Inconsistency between L and M is the single most common source of protests. Every evaluation factor in Section M must have corresponding instructions in Section L. The Source Selection Plan (SSP), written before RFP release, defines the evaluation criteria, weights, rating scales, and source selection procedures in detail.',

  # COR Responsibilities
  'Monitor contractor performance against the PWS/SOW and CDRLs daily/weekly, and document all observations.':
    'The COR is the government\'s eyes and ears on contract performance. Monitoring includes reviewing deliverables, attending contractor status meetings, observing work in progress, and verifying that labor categories and personnel match the contract. Documentation is critical — undocumented COR observations have no legal standing in disputes or CPARS assessments. CORs should maintain a contemporaneous log of every significant contractor interaction.',

  'Document all contractor communications — emails, meeting minutes, phone calls — in the contract file.':
    'The contract file is a legal document. In a dispute, claim, or protest, the government\'s case rests on contemporaneous documentation. A COR who verbally agrees to a scope change without documentation has potentially created an unauthorized commitment — a legally binding obligation without contracting authority. The rule: if it\'s not in writing and in the file, it didn\'t happen.',

  'Review and accept/reject deliverables within the specified timeframe.':
    'Most contracts specify an acceptance period (e.g., 30 days) after deliverable submission. If the government doesn\'t accept or reject within the specified period, constructive acceptance may occur — meaning the government is deemed to have accepted even if it didn\'t explicitly do so. This waives the right to reject on quality grounds. CORs must review deliverables promptly and document acceptance or provide written rejection with specific deficiencies cited.',

  # Career / Ops lessons
  'When you see a risk, bring a mitigation — never just the problem.':
    'This is the single most important behavioral shift for junior acquisition professionals. Presenting a problem without a recommended solution signals that you don\'t understand the issue deeply enough to solve it. PMs and senior leaders want problem-solvers, not reporters. When you identify a risk: (1) quantify it (probability × impact), (2) propose 2–3 mitigation options with tradeoffs, (3) recommend one. Then let the leader decide.',

  'Own your lane completely: know your numbers, your schedule, your risks at all times.':
    'At any program review or briefing, you should be able to answer questions about your area without hesitation. If you\'re the budget analyst, know the obligation rate, the EAC, and the Nunn-McCurdy thresholds cold. If you\'re the contracts lead, know the contract value, option year dates, and any open modifications. Being caught unprepared in front of your PEO or SAE once is a memorable career moment — for the wrong reasons.',

  'Communicate up early — a PM who surfaces problems late destroys trust faster than any technical failure.':
    'The cardinal rule of program management: no surprises for leadership. A cost overrun discovered at a milestone review that the PM knew about for months is a career-defining moment. A cost problem surfaced 12 months early with a recovery plan is a manageable challenge. Leaders need time to make decisions, find additional resources, or adjust expectations. The PM who delivers honest, early bad news is trusted. The PM who hides problems until they\'re unavoidable is not.',

  # IMS Best Practices
  'Hold weekly schedule scrubs with IPT leads — not just reviews of the summary schedule, but work package level status with responsible parties defending their dates.':
    'Effective schedule scrubs have three elements: (1) the responsible work package owner presents status (not the PM doing it for them); (2) every slipped task has a documented recovery plan with a new completion date; (3) critical path impacts are explicitly discussed. Schedule scrubs that become "green-light shows" where everyone reports on schedule are worse than no scrubs at all — they create false confidence.',

  'Enforce schedule discipline at the work package level. If a work package owner reports "on schedule" but their completion date has slipped, that is a red flag requiring immediate discussion.':
    'The most dangerous phrase in program management is "we\'ll make it up later." Work packages that slip rarely recover on their own — they typically impact downstream work and propagate schedule growth. A work package owner who has slipped their date but is still claiming "on schedule" either doesn\'t understand their critical path relationship or is managing expectations optimistically. Both require the PM\'s attention.',

  'Never let the IMS drift more than one reporting cycle from ground truth. A single reporting period of "we\'ll catch up" compounds into months of unrecoverable schedule growth.':
    'The IMS is only useful as a management tool if it reflects reality. Programs that maintain an artificially optimistic IMS for external reporting while keeping a separate "real" schedule internally are creating two problems: they lose their management tool and they create a credibility gap when the truth eventually surfaces. Update the IMS to reflect actual status every period, even when the news is bad.',

  # Requirements Quality
  'Is the requirement testable? Can you write a test procedure that would definitively confirm compliance or non-compliance? If no, the requirement is vague.':
    'A requirement that can\'t be tested can\'t be enforced. "The system shall be user-friendly" is unenforceable — what does user-friendly mean? How do you test it? Compare to "95% of trained users shall complete Task X in under 3 minutes with zero errors on first attempt" — this is testable, measurable, and enforceable. Every KPP in a CDD should have a corresponding verification method (analysis, inspection, demonstration, or test) documented before the requirement enters the contract.',

  'Does the requirement have both a threshold and an objective value? Threshold = minimum acceptable; Objective = desired goal. Both must be defined.':
    'JCIDS requires threshold/objective pairs for all KPPs. Threshold is the minimum — if not met, the program doesn\'t satisfy the validated need. Objective is what the program will try to achieve. The threshold is what\'s contractually required; the objective drives design trade decisions. Example: Range threshold = 300 miles; objective = 400 miles. A system that achieves 280 miles fails. One that achieves 350 miles meets threshold but not objective.',

  'Is the requirement traceable from ICD/CDD through the system specification and into the contract SOW? Untraced requirements become invisible — and expensive — at CDR and PDR.':
    'Requirements traceability means every requirement in a lower-level document (system spec, subsystem spec, SOW) can be traced back to a validated requirement in the CDD, and every CDD requirement flows down to at least one lower-level document. Untraced requirements — those in the CDD that aren\'t reflected in the contract — won\'t be built. Requirements in the contract that aren\'t in the CDD create unauthorized scope growth. A Requirements Traceability Matrix (RTM) is the standard tool for tracking this.',

  'Does the requirement state what the system must do, not how it must do it? HOW requirements constrain contractor solutions unnecessarily and invite constructive change claims when the approach doesn\'t work.':
    '"How" requirements are design specifications, not performance requirements. When the government tells a contractor HOW to build something and that approach fails, the government bears the technical risk — it\'s a constructive change. When the government specifies WHAT performance is needed and the contractor chooses the approach, the contractor bears the risk of making their approach work. "Shall use X technology" is a how-requirement. "Shall detect targets at 10km range in specified conditions" is a what-requirement.',

}

count = 0
for item_text, detail in DETAILS.items():
    # Build the replacement: item string with ||| appended
    # Find exact occurrence: the item string is enclosed in single quotes
    # We need to find: '...item_text...' and replace with '...item_text|||detail...'
    
    # Escape for search - use simple string replacement  
    old = f"'{item_text}'"
    new = f"'{item_text}{SEP}{detail}'"
    
    if old in content:
        content = content.replace(old, new)
        count += 1
    else:
        # Try with escaped apostrophes
        old_esc = old.replace("'s", "\\'s").replace("'t", "\\'t").replace("'re", "\\'re").replace("'ve", "\\'ve").replace("'ll", "\\'ll")
        # Try double-quoted version
        old_dq = f'"{item_text}"'
        if old_dq in content:
            new_dq = f'"{item_text}{SEP}{detail}"'
            content = content.replace(old_dq, new_dq)
            count += 1
        else:
            print(f"NOT FOUND: {item_text[:60]}...")

print(f"\n✅ Added static detail to {count}/{len(DETAILS)} items")

with open('client/src/lib/curriculum.ts', 'w') as f:
    f.write(content)
