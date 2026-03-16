export interface Lesson {
  id: string;
  title: string;
  duration: string;
  description: string;
  content: LessonContent[];
  quiz: QuizQuestion[];
  keyTerms: KeyTerm[];
}

export interface LessonContent {
  type: 'text' | 'callout' | 'list' | 'table' | 'formula' | 'tip' | 'warning';
  heading?: string;
  body?: string;
  items?: string[];
  headers?: string[];
  rows?: string[][];
  formula?: string;
  explanation?: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correct: number;
  explanation: string;
}

export interface KeyTerm {
  term: string;
  definition: string;
}

export interface Module {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  color: string;
  description: string;
  lessons: Lesson[];
  free?: boolean;
}

export const modules: Module[] = [
  {
    id: 'foundations',
    title: 'DoD Acquisitions Foundations',
    subtitle: 'Start Here',
    icon: '🏛️',
    color: 'navy',
    description: 'Learn the framework, key players, and lifecycle of DoD acquisitions. Essential for anyone entering the field.',
    free: true,
    lessons: [
      {
        id: 'foundations-1',
        title: 'The DoD Acquisition System Overview',
        duration: '12 min',
        description: 'Understand the structure, purpose, and key regulations governing DoD acquisitions.',
        keyTerms: [
          { term: 'FAR', definition: 'Federal Acquisition Regulation — the primary regulation governing federal procurement.' },
          { term: 'DFARS', definition: 'Defense Federal Acquisition Regulation Supplement — DoD-specific additions to FAR.' },
          { term: 'DoDI 5000.02', definition: 'The primary DoD instruction governing the acquisition of major defense systems.' },
          { term: 'JCIDS', definition: 'Joint Capabilities Integration and Development System — the requirements generation process.' },
          { term: 'PPBE', definition: 'Planning, Programming, Budgeting, and Execution — DoD\'s resource allocation process.' },
        ],
        content: [
          {
            type: 'text',
            heading: 'What is DoD Acquisitions?',
            body: 'The Department of Defense acquisitions system is the process by which the U.S. military procures goods, services, and systems to fulfill national security requirements. With an annual budget exceeding $400 billion, DoD is the largest acquisition enterprise in the world. Every dollar must be managed according to strict laws, regulations, and policies to ensure accountability, competition, and proper use of taxpayer funds.'
          },
          {
            type: 'callout',
            heading: 'The Big Three Processes',
            body: 'DoD acquisitions sits at the intersection of three interlocked processes: JCIDS (what we need), PPBE (how we fund it), and the Acquisition System (how we buy it). Understanding all three is essential for a successful PM or Contracting Officer career.'
          },
          {
            type: 'list',
            heading: 'Key Regulatory Framework',
            items: [
              'Title 10 U.S.C. — Statutory authority for defense acquisitions and armed forces',
              'FAR (Federal Acquisition Regulation) — Codified in 48 CFR, governs all federal procurement',
              'DFARS — Defense-specific supplements; adds 200+ pages of DoD-specific rules',
              'DoDI 5000.02 — The "bible" for major system acquisitions, defines program phases',
              'DODI 5000.74 — Governs Defense Acquisition of Services',
              'DODI 5000.75 — Governs Business Systems acquisitions',
            ]
          },
          {
            type: 'table',
            heading: 'Acquisition Program Categories',
            headers: ['Category', 'Threshold', 'Oversight Level'],
            rows: [
              ['ACAT I', 'RDT&E > $480M or Procurement > $2.79B', 'Milestone Decision Authority: USD(A&S)'],
              ['ACAT IA', 'IT: > $300M total', 'MDA: ASD(NII) or CIO'],
              ['ACAT II', 'RDT&E > $185M or Procurement > $835M', 'MDA: Component (Secretary level)'],
              ['ACAT III', 'Below ACAT II thresholds', 'MDA: Program Executive Officer'],
            ]
          },
          {
            type: 'text',
            heading: 'The Adaptive Acquisition Framework (AAF)',
            body: 'The 2020 introduction of the Adaptive Acquisition Framework (AAF) replaced the rigid "5000.02" single path model with six acquisition pathways: Urgent Capability Acquisition, Middle Tier of Acquisition, Major Capability Acquisition, Software Acquisition, Defense Business Systems, and Acquisition of Services. This flexibility allows programs to choose the pathway that best fits the nature of their acquisition.'
          },
          {
            type: 'tip',
            heading: 'Career Tip',
            body: 'The most valued PMs understand not just their own acquisition pathway, but how it connects to budget cycles (PPBE) and requirements generation (JCIDS). When you can speak all three languages fluently, you become indispensable to a program office.'
          }
        ],
        quiz: [
          {
            id: 'q1',
            question: 'Which regulation serves as the primary source of federal acquisition law, applicable to all federal agencies including DoD?',
            options: ['DFARS', 'FAR (Federal Acquisition Regulation)', 'DoDI 5000.02', 'Title 10 U.S.C.'],
            correct: 1,
            explanation: 'The FAR (Federal Acquisition Regulation) is codified in 48 CFR and applies to all federal agencies. DFARS is the DoD supplement to FAR. DoDI 5000.02 governs the acquisition of major defense systems specifically.'
          },
          {
            id: 'q2',
            question: 'An ACAT I program has RDT&E costs projected at $520 million. Which authority serves as the Milestone Decision Authority?',
            options: ['Program Executive Officer', 'Service Secretary', 'Under Secretary of Defense (Acquisition & Sustainment)', 'Comptroller General'],
            correct: 2,
            explanation: 'ACAT I programs — those exceeding $480M in RDT&E or $2.79B in procurement — have the Under Secretary of Defense for Acquisition & Sustainment (USD(A&S)) as the Milestone Decision Authority.'
          },
          {
            id: 'q3',
            question: 'The Adaptive Acquisition Framework replaced what previous single-path model?',
            options: ['DoDI 5000.74', 'DoDI 5000.02 single pathway', 'JCIDS Manual', 'Defense Acquisition University model'],
            correct: 1,
            explanation: 'The AAF, formalized in 2020, replaced the rigid single-path acquisition model previously required by DoDI 5000.02, offering six distinct pathways tailored to different acquisition needs.'
          }
        ]
      },
      {
        id: 'foundations-2',
        title: 'Roles & Career Paths in DoD Acquisitions',
        duration: '10 min',
        description: 'Understand the major acquisition workforce career fields, certifications, and how they interact.',
        keyTerms: [
          { term: 'DAWIA', definition: 'Defense Acquisition Workforce Improvement Act — establishes education, training, and experience standards.' },
          { term: 'APDP', definition: 'Acquisition Professional Development Program — the framework for acquisition workforce development.' },
          { term: 'FAC-PM', definition: 'Federal Acquisition Certification for Program and Project Managers.' },
          { term: 'PCO', definition: 'Procuring Contracting Officer — has authority to enter into, administer, and terminate contracts.' },
          { term: 'COR', definition: 'Contracting Officer\'s Representative — the government\'s technical eyes and ears on a contract.' },
        ],
        content: [
          {
            type: 'text',
            heading: 'The Acquisition Workforce',
            body: 'The DoD acquisition workforce comprises over 150,000 professionals across 14+ career fields. These individuals are responsible for planning, managing, and overseeing the acquisition of goods and services from the private sector. The workforce is governed by DAWIA (Defense Acquisition Workforce Improvement Act), which establishes education, training, and experience requirements for each career field.'
          },
          {
            type: 'table',
            heading: 'Key Acquisition Career Fields',
            headers: ['Career Field', 'Primary Role', 'Key Certification'],
            rows: [
              ['Program Management (PM)', 'Lead and manage acquisition programs from cradle to grave', 'DAU PM certifications (FL I, II, III)'],
              ['Contracting (1102)', 'Manage the contracting process, award and administer contracts', 'DAWIA Contracting + FAC-C'],
              ['Financial Management', 'Budget formulation, execution, and cost analysis', 'DAWIA FM + CDFM'],
              ['Systems Engineering (SE)', 'Technical oversight and systems architecture', 'DAWIA SE certifications'],
              ['Logistics', 'Lifecycle sustainment planning and execution', 'DAWIA LOG certifications'],
              ['Cost Estimating', 'Develop program cost estimates and ICEs', 'CCEA certification'],
            ]
          },
          {
            type: 'callout',
            heading: 'The Program Manager (PM) Role',
            body: 'The Program Manager is the single accountable individual responsible for all aspects of a program — cost, schedule, and performance. PMs must be skilled communicators, technical leaders, budget managers, and risk mitigators simultaneously. A good PM translates technical requirements into acquisition strategy while managing stakeholder relationships up and down the chain of command.'
          },
          {
            type: 'list',
            heading: 'What Makes a Successful PM?',
            items: [
              'Deep understanding of the FAR/DFARS and acquisition regulations',
              'Ability to read and interpret financial reports (EVM, budget exhibits)',
              'Experience managing contractor relationships and COR oversight',
              'Skill in risk management and mitigation planning',
              'Proficiency in requirements management and scope control',
              'Stakeholder management across technical, financial, and leadership teams',
              'Understanding of the PPBE cycle to protect program funding',
            ]
          },
          {
            type: 'tip',
            heading: 'Breaking In',
            body: 'Many successful acquisition professionals transition from the military (especially as O-3/O-4 officers), from technical engineering fields, or from federal service in adjacent roles. DoD\'s Pathways program and Defense Acquisition University offer entry-level pathways. Target GS-9 or GS-11 program analyst roles to build your foundation.'
          }
        ],
        quiz: [
          {
            id: 'q1',
            question: 'What law established education, training, and experience standards for the DoD acquisition workforce?',
            options: ['FAR Part 1', 'DAWIA (Defense Acquisition Workforce Improvement Act)', 'DoDI 5000.02', 'Competition in Contracting Act'],
            correct: 1,
            explanation: 'DAWIA, enacted in 1990 and regularly updated, is the foundational law that professionalized the DoD acquisition workforce by establishing standards for each of the 14+ career fields.'
          },
          {
            id: 'q2',
            question: 'A Contracting Officer\'s Representative (COR) primarily serves which function?',
            options: ['Award and sign contracts on behalf of the government', 'Serve as the technical monitor ensuring contractor performance meets contract requirements', 'Develop the acquisition strategy', 'Approve program funding at milestone reviews'],
            correct: 1,
            explanation: 'The COR is the government\'s technical representative on a contract, responsible for monitoring contractor performance, documenting issues, and providing technical direction within the scope of the contract. They cannot modify contract terms — that authority belongs to the Contracting Officer (CO).'
          }
        ]
      }
    ]
  },
  {
    id: 'finance',
    title: 'Defense Finance & Budgeting',
    subtitle: 'Module 2',
    icon: '💰',
    color: 'gold',
    description: 'Master the PPBE cycle, appropriations law, EVM, and financial management fundamentals that every PM must know.',
    lessons: [
      {
        id: 'finance-1',
        title: 'The PPBE Cycle: Planning Your Program\'s Money',
        duration: '15 min',
        description: 'Understand how DoD programs are funded through the Planning, Programming, Budgeting, and Execution process.',
        keyTerms: [
          { term: 'PPBE', definition: 'Planning, Programming, Budgeting, and Execution — DoD\'s annual resource management process.' },
          { term: 'POM', definition: 'Program Objectives Memorandum — the Services\' funding proposals submitted to OSD.' },
          { term: 'FYDP', definition: 'Future Years Defense Program — 5-year funding baseline for all DoD programs.' },
          { term: 'PBD', definition: 'Program Budget Decision — OSD decisions on Service POMs that shape the President\'s Budget.' },
          { term: 'NDAA', definition: 'National Defense Authorization Act — annual legislation authorizing DoD activities and funding.' },
        ],
        content: [
          {
            type: 'text',
            heading: 'Why PPBE Matters for PMs',
            body: 'Your program\'s funding is not automatic. Every year, program managers must compete for resources within the PPBE process. Understanding this cycle — who makes decisions, when, and based on what criteria — is the difference between a well-funded program and one that gets cut or restructured. Missing a POM submission window can delay your program by 2 years.'
          },
          {
            type: 'table',
            heading: 'The PPBE Annual Cycle',
            headers: ['Phase', 'When', 'Key Activity', 'Key Players'],
            rows: [
              ['Planning', 'Year -2 (Spring)', 'DPG issued; Services identify capability gaps and priorities', 'OSD, Joint Chiefs, Service Secretaries'],
              ['Programming', 'Year -2 (Summer)', 'Services submit POMs; OSD issues PBDs', 'Service HQ, PEOs, Program Offices'],
              ['Budgeting', 'Year -1 (Fall/Winter)', 'Budget Estimate Submissions; OMB passback', 'Service Comptrollers, OMB, OSD Comptroller'],
              ['Execution', 'Current Year', 'Congress appropriates; PMs execute approved funding', 'Congress, PMs, Budget Officers'],
            ]
          },
          {
            type: 'callout',
            heading: 'The Benny Hill Problem',
            body: 'Programs that don\'t have a well-documented funding justification going into the POM get "Benny Hill\'d" — cut to fund higher priorities. Your job as PM is to have a compelling cost/benefit narrative, performance data, and risk arguments ready every time OSD reviews your program. Document everything.'
          },
          {
            type: 'list',
            heading: 'Appropriations Types You\'ll Manage',
            items: [
              'RDT&E (Research, Development, Test & Evaluation) — 3-year availability; used to develop and test new systems',
              'Procurement — 3-year availability; used to buy production-ready systems',
              'O&M (Operations & Maintenance) — 1-year availability; day-to-day operating costs and services',
              'MILCON (Military Construction) — 5-year availability; construction of facilities',
              'MILPERS (Military Personnel) — 1-year; pay and allowances for uniformed personnel',
            ]
          },
          {
            type: 'formula',
            heading: 'Burn Rate Formula',
            formula: 'Monthly Burn Rate = Total Obligation Authority ÷ Number of Execution Months',
            explanation: 'Tracking burn rate against plan is critical. If you\'re burning faster than planned, you may need supplemental funding or a scope reduction. If you\'re under-executing, you risk losing future-year funding — the "use it or lose it" trap.'
          },
          {
            type: 'warning',
            heading: 'Anti-Deficiency Act',
            body: 'Never obligate funds in excess of what is appropriated or in advance of appropriation. Violations of the Anti-Deficiency Act (31 U.S.C. §§ 1341, 1342) are federal crimes and career-ending events. Every PM must understand these constraints cold.'
          }
        ],
        quiz: [
          {
            id: 'q1',
            question: 'What is the Future Years Defense Program (FYDP)?',
            options: ['A 10-year strategic plan', 'A 5-year resource database tracking all DoD programs and funding', 'The Congressional budget resolution for defense', 'The Services\' annual programming document submitted to OSD'],
            correct: 1,
            explanation: 'The FYDP is the official DoD database that tracks all programs and resources over a 5-year period. It serves as the baseline for the annual PPBE process and is the authoritative source for program funding profiles.'
          },
          {
            id: 'q2',
            question: 'O&M (Operations & Maintenance) appropriations have how many years of availability?',
            options: ['1 year', '2 years', '3 years', '5 years'],
            correct: 0,
            explanation: 'O&M funds have a 1-year period of availability. This means they must be obligated within the fiscal year they are appropriated. Unused O&M funds expire at year-end and cannot be used to fund future activities.'
          },
          {
            id: 'q3',
            question: 'Violating the Anti-Deficiency Act by obligating funds in excess of appropriations can result in:',
            options: ['A formal letter of reprimand', 'Administrative, civil, and criminal penalties up to imprisonment', 'Program restructuring only', 'A 30-day funding freeze'],
            correct: 1,
            explanation: 'The Anti-Deficiency Act (31 U.S.C. §§ 1341, 1342) violations can result in administrative discipline, civil fines, and criminal prosecution. In practice, they are career-ending events that are taken extremely seriously at all levels of DoD.'
          }
        ]
      },
      {
        id: 'finance-2',
        title: 'Earned Value Management (EVM)',
        duration: '18 min',
        description: 'Learn how to use EVM to measure cost and schedule performance on DoD contracts.',
        keyTerms: [
          { term: 'EVM', definition: 'Earned Value Management — an integrated cost/schedule/technical performance measurement methodology.' },
          { term: 'BCWS (PV)', definition: 'Budgeted Cost of Work Scheduled (Planned Value) — what you planned to spend by now.' },
          { term: 'BCWP (EV)', definition: 'Budgeted Cost of Work Performed (Earned Value) — the budget value of work actually accomplished.' },
          { term: 'ACWP (AC)', definition: 'Actual Cost of Work Performed (Actual Cost) — what you actually spent.' },
          { term: 'CPI', definition: 'Cost Performance Index — efficiency of cost performance (EV/AC).' },
          { term: 'SPI', definition: 'Schedule Performance Index — efficiency of schedule performance (EV/PV).' },
          { term: 'EAC', definition: 'Estimate at Completion — the projected total cost to complete the program.' },
        ],
        content: [
          {
            type: 'text',
            heading: 'Why EVM is Critical for Program Managers',
            body: 'EVM is required on most DoD contracts with a value over $20M. It provides an objective, quantitative measure of program performance. Without EVM, PMs rely on subjective "percent complete" estimates that are almost always wrong. With EVM, you can detect cost and schedule problems early — often 15-20% into a program — when correction is still possible and affordable.'
          },
          {
            type: 'formula',
            heading: 'Core EVM Formulas',
            formula: 'CV = EV - AC (Cost Variance: positive = under budget)\nSV = EV - PV (Schedule Variance: positive = ahead of schedule)\nCPI = EV / AC (>1.0 = under budget; <1.0 = over budget)\nSPI = EV / PV (>1.0 = ahead of schedule; <1.0 = behind)',
            explanation: 'Memorize these. At any program review, you should be able to calculate CPI and SPI instantly and explain what they mean for the program\'s trajectory.'
          },
          {
            type: 'formula',
            heading: 'Estimate at Completion (EAC)',
            formula: 'EAC = BAC / CPI (most common — assumes future work at current efficiency)\nEAC = AC + (BAC - EV) (assumes remaining work on original budget)\nEAC = AC + [(BAC - EV) / (CPI × SPI)] (combined factor)',
            explanation: 'BAC = Budget at Completion (the total approved budget). Choose your EAC method based on the nature of variances. The CPI method (BAC/CPI) is statistically the most accurate predictor for programs that are 20%+ complete.'
          },
          {
            type: 'callout',
            heading: 'The 20% Threshold Rule',
            body: 'Research by David Christensen (1993) showed that the CPI at 20% program completion is highly predictive of final CPI. Programs rarely recover a CPI worse than 0.8. If your program shows a CPI of 0.75 at 20% completion, plan for overruns — the data is telling you something systemic is wrong.'
          },
          {
            type: 'table',
            heading: 'EVM Performance Indicator Benchmarks',
            headers: ['Indicator', 'Green', 'Yellow', 'Red'],
            rows: [
              ['CPI', '>= 0.95', '0.90 - 0.94', '< 0.90'],
              ['SPI', '>= 0.95', '0.90 - 0.94', '< 0.90'],
              ['CV%', '<= 5% over', '5-10% over', '> 10% over'],
              ['TCPI', '<= 1.05', '1.05 - 1.10', '> 1.10'],
            ]
          },
          {
            type: 'tip',
            heading: 'IPMR Reporting',
            body: 'The Integrated Program Management Report (IPMR) replaced the CPR and CFSR. The IPMR has seven formats: Format 1 (WBS-based cost/schedule), Format 2 (Organizational), Format 3 (Baseline), Format 4 (Staffing), Format 5 (Problem Analysis), Format 6 (Milestone/IMS), and Format 7 (Explanations). Learn all seven — you\'ll review these monthly on every major program.'
          }
        ],
        quiz: [
          {
            id: 'q1',
            question: 'A program has: PV = $10M, EV = $8M, AC = $9M. What is the Cost Performance Index (CPI)?',
            options: ['1.125', '0.89', '0.80', '1.25'],
            correct: 1,
            explanation: 'CPI = EV / AC = $8M / $9M = 0.89. This means for every dollar spent, the program is only earning $0.89 of planned value — the program is over budget. The SPI would be 0.80 (EV/PV = $8M/$10M), meaning it\'s also behind schedule.'
          },
          {
            id: 'q2',
            question: 'Using the most statistically accurate EAC formula for a program that is 30% complete, with BAC = $100M and CPI = 0.85:',
            options: ['$100M', '$115M', '$117.6M', '$85M'],
            correct: 2,
            explanation: 'EAC = BAC / CPI = $100M / 0.85 = $117.6M. This formula (BAC/CPI) is the most accurate predictor once a program is more than 20% complete, according to historical DoD program data. The variance of $17.6M represents a 17.6% overrun at completion.'
          }
        ]
      },
      {
        id: 'finance-3',
        title: 'Cost Estimating & Independent Cost Estimates',
        duration: '14 min',
        description: 'Learn the methodologies for estimating program costs and the role of the ICE in acquisition decisions.',
        keyTerms: [
          { term: 'ICE', definition: 'Independent Cost Estimate — an estimate prepared independently of the program office, required at key milestones.' },
          { term: 'CAPE', definition: 'Cost Assessment and Program Evaluation — OSD office responsible for independent cost analysis.' },
          { term: 'Analogous Estimating', definition: 'Using costs from similar past programs to estimate the new program.' },
          { term: 'Parametric Estimating', definition: 'Using statistical relationships between cost and technical parameters.' },
          { term: 'Bottoms-Up Estimating', definition: 'Estimating each work package individually and rolling up to a total.' },
          { term: 'Cost Risk', definition: 'The uncertainty or variability in a cost estimate; typically quantified as 80th percentile.' },
        ],
        content: [
          {
            type: 'text',
            heading: 'Why Cost Estimates Matter in DoD',
            body: 'Cost growth is the number one reason programs get cancelled or restructured. The DoD has struggled historically with "optimism bias" — the tendency to underprice programs to win approval, then face costly breaches later. Understanding estimating methodologies helps PMs challenge unrealistic estimates and build credible baselines from day one.'
          },
          {
            type: 'list',
            heading: 'The Three Primary Estimating Methods',
            items: [
              'Analogous (Top-Down): Uses historical data from similar programs. Fast but less accurate. Best for early phase estimates (±50%).',
              'Parametric: Uses Cost Estimating Relationships (CERs) — statistical models built from large databases. Moderately accurate. Best for early-mid phase (±25%).',
              'Engineering Build-Up (Bottoms-Up): Detailed task-by-task estimate. Most accurate but requires mature design. Best for milestone B+ (±10-15%).',
              'Hybrid approaches: Most programs use a combination — parametric for unknowns, bottoms-up for well-defined work.',
            ]
          },
          {
            type: 'callout',
            heading: 'The Role of CAPE',
            body: 'The Cost Assessment and Program Evaluation (CAPE) office, within OSD, provides independent cost assessments for major defense acquisition programs. Their estimates are typically higher than program office estimates — and statistically, CAPE is more often correct. When CAPE\'s estimate exceeds the program office estimate by 20%+, Congress and leadership take note.'
          },
          {
            type: 'formula',
            heading: 'Key Cost Estimating Metrics',
            formula: 'Cost Risk = (P80 Cost - Point Estimate) / Point Estimate × 100%\nMean Cost Overrun (historical DoD) ≈ 20-30% above Milestone B estimate',
            explanation: 'DoD programs historically overrun by 20-30% at completion. Always include cost risk analysis in your estimates. The 80th percentile cost (P80) means there\'s an 80% probability the actual cost will be at or below that figure — this is the standard threshold DoD uses for major program budgeting.'
          },
          {
            type: 'tip',
            heading: 'Nunn-McCurdy',
            body: 'The Nunn-McCurdy Act requires DoD to notify Congress when program unit costs breach specific thresholds (15% = "significant breach"; 25% = "critical breach"). A critical breach requires the program to be certified by USD(A&S) or face cancellation. As a PM, preventing a Nunn-McCurdy breach is a top priority.'
          }
        ],
        quiz: [
          {
            id: 'q1',
            question: 'Which cost estimating method is most accurate but requires the most mature program design?',
            options: ['Analogous (top-down)', 'Parametric', 'Engineering Build-Up (bottoms-up)', 'Expert judgment'],
            correct: 2,
            explanation: 'Engineering Build-Up (Bottoms-Up) estimating, which estimates each individual work package and rolls it up, is the most accurate method (±10-15%) but requires a mature design and detailed work breakdown structure. It is typically used at or after Milestone B.'
          },
          {
            id: 'q2',
            question: 'A Nunn-McCurdy "critical breach" is triggered when program unit cost growth exceeds what threshold?',
            options: ['10%', '15%', '25%', '50%'],
            correct: 2,
            explanation: 'A 25% cost growth above the original baseline triggers a Nunn-McCurdy critical breach, requiring certification by USD(A&S) and potentially Congressional notification. The 15% threshold triggers a "significant breach" requiring notification but not the full certification process.'
          }
        ]
      }
    ]
  },
  {
    id: 'contracts',
    title: 'Defense Contracting Fundamentals',
    subtitle: 'Module 3',
    icon: '📋',
    color: 'blue',
    description: 'Master contract types, the source selection process, contract administration, and how to protect the government\'s interests.',
    lessons: [
      {
        id: 'contracts-1',
        title: 'Contract Types: Choosing the Right Vehicle',
        duration: '16 min',
        description: 'Understand the spectrum of contract types from FFP to Cost-Plus, and when to use each.',
        keyTerms: [
          { term: 'FFP', definition: 'Firm-Fixed-Price — the most preferred contract type; price is fixed, risk is on the contractor.' },
          { term: 'FPIF', definition: 'Fixed-Price Incentive Firm — fixed ceiling with incentives for cost/schedule performance.' },
          { term: 'CPFF', definition: 'Cost-Plus-Fixed-Fee — government pays all allowable costs plus a fixed fee; highest government risk.' },
          { term: 'CPIF', definition: 'Cost-Plus-Incentive-Fee — cost reimbursable with performance incentives.' },
          { term: 'T&M', definition: 'Time & Materials — hours at set labor rates plus materials at cost; used when effort cannot be predetermined.' },
          { term: 'Share Ratio', definition: 'In incentive contracts, the split of cost under/overruns between government and contractor.' },
        ],
        content: [
          {
            type: 'text',
            heading: 'The Risk Spectrum',
            body: 'Choosing the right contract type is one of the most consequential decisions in acquisition strategy. At one end of the spectrum, Firm-Fixed-Price (FFP) places maximum risk on the contractor — they bear all cost risk. At the other end, Cost-Plus contracts place most risk on the government. FAR 16.103 requires the contracting officer to use the contract type that will result in reasonable contractor risk and provide the contractor with the greatest incentive for efficient performance.'
          },
          {
            type: 'table',
            heading: 'Contract Type Comparison',
            headers: ['Type', 'Risk Bearer', 'Best Used When', 'Performance Incentive'],
            rows: [
              ['FFP', 'Contractor', 'Well-defined specs, mature tech, competitive market', 'Built-in (keep savings)'],
              ['FPIF', 'Shared', 'Good definition, some tech risk, cost uncertainty', 'Share ratio (e.g., 80/20)'],
              ['FPI (successive targets)', 'Shared', 'R&D with evolving requirements', 'Adjustable targets'],
              ['CPIF', 'Government', 'Development work, significant tech uncertainty', 'Incentive fee on target'],
              ['CPFF', 'Government', 'Early R&D, high technical uncertainty', 'Fixed fee only'],
              ['T&M/LH', 'Government', 'Services where hours can\'t be estimated', 'None (highest risk)'],
            ]
          },
          {
            type: 'callout',
            heading: 'The 68% Rule of Thumb',
            body: 'Historically, DoD uses FFP/FP-type contracts for about 68% of contract dollars (by value). The government preference for FFP reflects the competition in contracting principle and the goal of shifting cost risk to industry. However, using FFP on high-risk development work has caused major program failures — know when to use each type.'
          },
          {
            type: 'formula',
            heading: 'FPIF Share Ratio Calculation',
            formula: 'Cost = Target Cost + (Actual Cost - Target Cost) × Government Share %\nContractor Fee = Target Fee - (Actual Cost - Target Cost) × Contractor Share %',
            explanation: 'Example: Target Cost $10M, Target Fee $800K, 80/20 share ratio, Ceiling Price $13M. If actual cost is $11M: Government pays $10M + $1M × 80% = $10.8M. Contractor fee = $800K - $1M × 20% = $600K. The contractor still profits but less, incentivizing cost control.'
          },
          {
            type: 'list',
            heading: 'T&M Contract Restrictions (FAR 16.601)',
            items: [
              'Cannot be used unless no other contract type is suitable',
              'Requires a determination and findings (D&F) justifying its use',
              'Must have appropriate government surveillance to ensure efficient performance',
              'Limited to specific situations: equipment repair where time/cost can\'t be estimated',
              'Often misused for services — a common audit finding in DoD',
            ]
          }
        ],
        quiz: [
          {
            id: 'q1',
            question: 'Which contract type is most appropriate when acquiring a well-defined, commercially available product with multiple competing vendors?',
            options: ['Cost-Plus-Fixed-Fee (CPFF)', 'Time & Materials (T&M)', 'Firm-Fixed-Price (FFP)', 'Cost-Plus-Incentive-Fee (CPIF)'],
            correct: 2,
            explanation: 'FFP is the preferred contract type when specifications are well-defined, technical risk is low, and competition exists. The contractor bears all cost risk, incentivizing efficiency. FAR 16.202 states FFP is suitable when "fair and reasonable prices can be established at the outset."'
          },
          {
            id: 'q2',
            question: 'In an FPIF contract with a 75/25 share ratio (government/contractor), target cost of $10M, and actual cost of $9M, the government pays:',
            options: ['$9.0M', '$9.25M', '$9.75M', '$10.0M'],
            correct: 2,
            explanation: 'The $1M underrun is shared 75%/25%. Government pays: $10M - ($1M × 75%) = $9.25M. Wait — let\'s recalculate. Target cost - government share of savings: $10M - $0.75M = $9.25M. The contractor earns target fee plus their 25% share of the $1M savings ($250K).'
          }
        ]
      },
      {
        id: 'contracts-2',
        title: 'Source Selection: Choosing the Best Contractor',
        duration: '20 min',
        description: 'Master the competitive source selection process — from market research to award.',
        keyTerms: [
          { term: 'SSA', definition: 'Source Selection Authority — the official responsible for the final contract award decision.' },
          { term: 'SSEB', definition: 'Source Selection Evaluation Board — the team that evaluates proposals against stated criteria.' },
          { term: 'SSAC', definition: 'Source Selection Advisory Council — senior advisors to the SSA on competitive acquisitions.' },
          { term: 'LPTA', definition: 'Lowest Price Technically Acceptable — award to lowest priced technically acceptable offeror.' },
          { term: 'BVTO/Best Value', definition: 'Best Value Trade-off — awards based on overall value considering price and non-price factors.' },
          { term: 'RFP', definition: 'Request for Proposals — the solicitation document defining requirements and evaluation criteria.' },
        ],
        content: [
          {
            type: 'text',
            heading: 'The Source Selection Process',
            body: 'Competitive source selection is the cornerstone of fair and transparent government contracting. The process is governed by FAR Part 15 and the DoD Source Selection Procedures. A well-run source selection results in the government getting the best value solution while giving industry a fair chance to compete. Poorly executed source selections result in protests, program delays, and wasted resources.'
          },
          {
            type: 'list',
            heading: 'Source Selection Process Steps',
            items: [
              '1. Market Research — understand the industrial base, capabilities, and competition',
              '2. Acquisition Strategy — determine contract type, evaluation approach, set-asides',
              '3. Draft RFP — develop performance work statement/SOW, evaluation criteria',
              '4. Industry Day / Pre-solicitation — communicate requirements to industry',
              '5. Final RFP Release — post on SAM.gov with full evaluation factors',
              '6. Proposal Receipt — receive and secure proposals',
              '7. Technical/Cost Evaluation — SSEB evaluates against stated criteria',
              '8. Competitive Range Determination — narrow field for discussions (if used)',
              '9. Discussions / ENs — exchange information to improve proposals',
              '10. Final Proposal Revisions — offerors submit best and final proposals',
              '11. SSA Award Decision — documented trade-off analysis; award to best value',
              '12. Notification & Debriefings — notify winners/losers; provide debriefs',
            ]
          },
          {
            type: 'callout',
            heading: 'LPTA vs. Best Value: The Policy Shift',
            body: 'The FY2019 NDAA and DoD policy have restricted the use of LPTA, recognizing it drives down quality. LPTA is now required ONLY when: (1) ability to define requirements with sufficient clarity, (2) expected benefits of competition outweigh administrative burden, and (3) no value added by higher technical capability. When in doubt, use Best Value Trade-off.'
          },
          {
            type: 'table',
            heading: 'Evaluation Factor Types',
            headers: ['Factor Type', 'Description', 'Common Use'],
            rows: [
              ['Technical Approach', 'Proposed solution and methodology', 'All competitive acquisitions'],
              ['Past Performance', 'Relevant experience and performance record', 'Services > $5M threshold'],
              ['Price/Cost', 'Total evaluated price or most probable cost', 'All acquisitions'],
              ['Management Approach', 'Team qualifications, key personnel, organization', 'Complex services/programs'],
              ['Small Business', 'Small business utilization plan', 'Acquisitions > $750K'],
            ]
          },
          {
            type: 'warning',
            heading: 'Protest Risk',
            body: 'Any losing offeror can file a protest with the Government Accountability Office (GAO) within 10 days of debriefing, or the Court of Federal Claims. Common protest grounds: evaluation not consistent with stated criteria, unequal treatment, flawed cost realism analysis, inadequate documentation. A sustained protest can delay your program 6-12 months. Document every evaluation decision meticulously.'
          }
        ],
        quiz: [
          {
            id: 'q1',
            question: 'Under the FY2019 NDAA restrictions, when is LPTA (Lowest Price Technically Acceptable) appropriately used?',
            options: [
              'Whenever the program office wants to minimize cost',
              'Only when requirements can be clearly defined, and higher technical performance provides no added value',
              'For all services contracts over $10M',
              'When there are more than 10 competing offerors'
            ],
            correct: 1,
            explanation: 'The FY2019 NDAA restricted LPTA to situations where: requirements can be definitively described, the risk of technical failure is minimal, and increased technical capability would provide no additional benefit. For most complex defense acquisitions, Best Value Trade-off is preferred.'
          },
          {
            id: 'q2',
            question: 'A losing offeror wants to file a GAO protest after receiving a debriefing. What is the deadline?',
            options: ['5 calendar days', '10 calendar days', '30 calendar days', '60 calendar days'],
            correct: 1,
            explanation: 'Under CICA and GAO Bid Protest Regulations (4 C.F.R. § 21.2), a protest based on a debriefing must be filed within 10 calendar days of the debriefing. A protest based on solicitation improprieties must be filed before the proposal due date. Missing deadlines is a common protest defense.'
          }
        ]
      },
      {
        id: 'contracts-3',
        title: 'Contract Administration & COR Responsibilities',
        duration: '13 min',
        description: 'Learn how to properly administer contracts and fulfill COR duties to protect the government\'s interests.',
        keyTerms: [
          { term: 'ACO', definition: 'Administrative Contracting Officer — the CO responsible for post-award contract administration.' },
          { term: 'CDRL', definition: 'Contract Data Requirements List — the list of deliverables required under the contract.' },
          { term: 'PWS', definition: 'Performance Work Statement — defines required outcomes/results rather than methods.' },
          { term: 'QASP', definition: 'Quality Assurance Surveillance Plan — the government\'s plan for monitoring contractor performance.' },
          { term: 'Constructive Change', definition: 'Any government action (or inaction) that causes the contractor to perform beyond contract scope.' },
          { term: 'REA', definition: 'Request for Equitable Adjustment — contractor\'s formal request for contract price/schedule change.' },
        ],
        content: [
          {
            type: 'text',
            heading: 'Contract Administration is Where Programs Win or Lose',
            body: 'Many government professionals focus heavily on pre-award activities (source selection) but underestimate the complexity of post-award contract administration. Effective administration ensures contractors perform as promised, issues are identified early, and the government\'s rights are protected. The COR is the frontline of this effort.'
          },
          {
            type: 'list',
            heading: 'Core COR Responsibilities (DoDI 5000.72)',
            items: [
              'Monitor and document contractor technical performance against PWS/SOW',
              'Review and accept/reject deliverables per the CDRL',
              'Document all government-furnished equipment (GFE) and property',
              'Maintain records of all contractor communications and directions',
              'Report issues to the Contracting Officer — never direct contractors outside contract scope',
              'Certify invoices for payment (but cannot authorize payment over ceiling)',
              'Conduct or support contractor performance evaluations (CPARS)',
            ]
          },
          {
            type: 'warning',
            heading: 'The COR\'s Most Critical Rule',
            body: 'A COR CANNOT issue technical direction that changes the scope, price, or period of performance of the contract. Only the Contracting Officer has that authority. Unauthorized commitments made by CORs are a serious legal issue and can result in contractor claims, ratification proceedings, and personal liability. Document everything. When in doubt, call the CO.'
          },
          {
            type: 'callout',
            heading: 'CPARS: Documenting Contractor Performance',
            body: 'The Contractor Performance Assessment Reporting System (CPARS) is the government\'s official record of contractor past performance. CPARS ratings directly affect a contractor\'s ability to win future competitions. As a PM or COR, you are required to submit accurate, timely CPARS evaluations. Inflating ratings to maintain relationships is a disservice to the acquisition community.'
          },
          {
            type: 'table',
            heading: 'Common Contract Modifications',
            headers: ['Type', 'FAR Clause', 'Description'],
            rows: [
              ['Unilateral Modification', 'FAR 43.103(b)', 'Government-directed change; contractor must comply then can claim'],
              ['Bilateral Modification (Supplemental Agreement)', 'FAR 43.103(a)', 'Mutually agreed change to scope, price, or schedule'],
              ['Administrative Change', 'FAR 43.101', 'No change to T&Cs; e.g., correcting typos'],
              ['Novation Agreement', 'FAR 42.1204', 'Legal transfer of contract to successor company'],
            ]
          }
        ],
        quiz: [
          {
            id: 'q1',
            question: 'A COR notices the contractor is providing services that go slightly beyond the contract\'s PWS but the PM verbally approved it. What should the COR do?',
            options: [
              'Continue allowing the work since the PM approved it',
              'Document the situation and immediately notify the Contracting Officer — this is a potential unauthorized commitment',
              'Issue a unilateral modification to include the additional work',
              'Reject all additional work and terminate for convenience'
            ],
            correct: 1,
            explanation: 'Only the Contracting Officer (CO) can authorize changes to contract scope. The PM\'s verbal approval is an unauthorized commitment. The COR must notify the CO immediately, who can then evaluate whether to ratify the commitment or direct the contractor to stop. Unauthorized commitments can create contractor claims and government liability.'
          }
        ]
      }
    ]
  },
  {
    id: 'data',
    title: 'Data Analytics for PMs',
    subtitle: 'Module 4',
    icon: '📊',
    color: 'teal',
    description: 'Use data to drive decisions: dashboards, KPIs, reporting requirements, and data-driven program management.',
    lessons: [
      {
        id: 'data-1',
        title: 'Key Performance Indicators for Defense Programs',
        duration: '12 min',
        description: 'Identify and track the right metrics to assess program health and drive executive decisions.',
        keyTerms: [
          { term: 'KPI', definition: 'Key Performance Indicator — a quantifiable measure used to evaluate program success.' },
          { term: 'KPP', definition: 'Key Performance Parameter — a critical threshold a system must meet; breach = program concern.' },
          { term: 'KSA', definition: 'Key System Attribute — important but not threshold-critical performance parameters.' },
          { term: 'TEMP', definition: 'Test and Evaluation Master Plan — documents the test program for a system.' },
          { term: 'Technical Baseline', definition: 'The documented, approved set of technical requirements and design data.' },
        ],
        content: [
          {
            type: 'text',
            heading: 'Why Data-Driven Management Matters',
            body: 'Program Managers who rely on gut feel and anecdotal reporting consistently underperform. Modern DoD acquisition demands rigorous, data-driven program management. The ability to build meaningful dashboards, extract insights from contractor reports, and present clear performance data to leadership separates good PMs from great ones.'
          },
          {
            type: 'table',
            heading: 'Essential PM Dashboard Metrics',
            headers: ['Category', 'Key Metric', 'Target / Threshold'],
            rows: [
              ['Cost', 'CPI (Cost Performance Index)', '≥ 0.95 (Green)'],
              ['Schedule', 'SPI (Schedule Performance Index)', '≥ 0.95 (Green)'],
              ['Schedule', 'Program Schedule Risk Assessment (PSRA)', 'MR covered at 80th %ile'],
              ['Technical', 'KPP Compliance', '100% threshold met at each test event'],
              ['Risk', 'Top Risk Mitigation Actions On Track', '≥ 80% on schedule'],
              ['Contract', 'Obligation Rate vs. Plan', 'Within ±10% of profile'],
              ['Workforce', 'Staffing vs. Authorized', '≥ 90% fill rate'],
            ]
          },
          {
            type: 'list',
            heading: 'Building an Effective Program Dashboard',
            items: [
              'Organize by the "Iron Triangle": Cost, Schedule, and Performance',
              'Use RAG (Red/Amber/Green) status consistently and objectively',
              'Include trend data — is a yellow trending toward green or red?',
              'Tie metrics to program milestones and decision gates',
              'Show burn rate vs. plan on a single timeline chart',
              'Include top 5 risks with mitigation status and owners',
              'Keep it to one page — executives won\'t read 30 slides',
            ]
          },
          {
            type: 'tip',
            heading: 'Tools of the Trade',
            body: 'Common DoD program data tools include: Deltek Costpoint (EVM data), MS Project (scheduling), SharePoint/Teams (collaboration), ADVANA (DoD data analytics platform), and custom Power BI dashboards. Learning Power BI is one of the highest-ROI skills for a new PM — it allows you to connect multiple data sources and build executive-ready dashboards quickly.'
          }
        ],
        quiz: [
          {
            id: 'q1',
            question: 'A Key Performance Parameter (KPP) breach at a test event means:',
            options: [
              'The program receives a yellow status on the dashboard',
              'A technical risk is noted in the risk register',
              'A potential program concern that must be reported to the Milestone Decision Authority',
              'The contractor must submit a corrective action plan within 30 days'
            ],
            correct: 2,
            explanation: 'KPPs represent critical, threshold-level performance requirements that a system must achieve. Failure to meet a KPP is not just a yellow flag — it is a fundamental program concern that must be elevated to the MDA and may require a program restructure, requirements change, or additional testing resources.'
          }
        ]
      },
      {
        id: 'data-2',
        title: 'Reporting Requirements & Data Rights',
        duration: '11 min',
        description: 'Navigate the complex world of government reporting requirements and intellectual property.',
        keyTerms: [
          { term: 'CDRL', definition: 'Contract Data Requirements List — the contractual instrument requiring deliverables.' },
          { term: 'DI-MGMT', definition: 'Management data item descriptions; includes plans, reports, and schedules.' },
          { term: 'DFARS 252.227', definition: 'DoD clauses governing rights in technical data and computer software.' },
          { term: 'Government Purpose Rights', definition: 'Government can use and release data to third parties for government purposes.' },
          { term: 'Unlimited Rights', definition: 'Government has full rights to use, disclose, reproduce data without restriction.' },
          { term: 'Limited Rights', definition: 'Contractor-developed data; government use is restricted to internal government purposes.' },
        ],
        content: [
          {
            type: 'text',
            heading: 'Data as a Strategic Asset',
            body: 'In the era of digital engineering and model-based systems engineering (MBSE), data rights have become a major strategic issue for DoD. Getting the right data rights upfront in contracts is critical for future competition, depot maintenance, and program continuity. Many programs have learned the hard way that proprietary technical data can create vendor lock-in that costs billions over a system\'s lifecycle.'
          },
          {
            type: 'table',
            heading: 'Data Rights Categories (DFARS 252.227)',
            headers: ['Rights Type', 'Government Can', 'Common Source'],
            rows: [
              ['Unlimited Rights', 'Use, release, disclose, reproduce without restriction', 'Govt-funded development'],
              ['Government Purpose Rights', 'Use internally; release to support government purposes', 'Mixed-funded development'],
              ['Limited Rights', 'Use internally only; cannot release or disclose', 'Contractor-funded (private expense)'],
              ['Restricted Rights (software)', 'Use on government computers; cannot copy or disclose', 'Commercial software'],
              ['Specially Negotiated', 'Per contract terms; custom arrangement', 'Negotiated case-by-case'],
            ]
          },
          {
            type: 'list',
            heading: 'Key CDRL Data Items for Major Programs',
            items: [
              'DI-MGMT-81861: Program Management Plan (PMP)',
              'DI-MGMT-81650: Integrated Program Management Report (IPMR)',
              'DI-MGMT-81334: Integrated Master Schedule (IMS)',
              'DI-SESS-81002: Test and Evaluation Master Plan (TEMP)',
              'DI-MISC-80711: Risk Management Plan',
              'DI-MGMT-81466: Contract Funds Status Report (CFSR)',
              'DI-MISC-80508: Engineering Change Proposal (ECP)',
            ]
          },
          {
            type: 'callout',
            heading: 'The ADVANA Platform',
            body: 'DoD launched ADVANA (Advana is DoD\'s authoritative financial and contractual data platform) to consolidate acquisition, financial, and logistical data across all DoD components. As a modern PM, familiarity with ADVANA, its data environment, and tools like Jupiter (the analytics interface) is becoming a baseline expectation at the GS-13+ level.'
          }
        ],
        quiz: [
          {
            id: 'q1',
            question: 'A contractor developed software entirely with private funds (no government money). What data rights does the government receive by default?',
            options: ['Unlimited Rights', 'Government Purpose Rights', 'Limited Rights / Restricted Rights', 'No rights — government cannot use the software'],
            correct: 2,
            explanation: 'Under DFARS 252.227-7014, software developed entirely at private expense receives "Restricted Rights." The government can use it on its own computers for the purposes for which it was acquired, but cannot copy, disclose, or release it without contractor permission. This is why negotiating data rights upfront is critical for depot and competition scenarios.'
          }
        ]
      }
    ]
  },
  {
    id: 'capture',
    title: 'Capture Management & Business Development',
    subtitle: 'Module 5',
    icon: '🎯',
    color: 'amber',
    description: 'Win more contracts. Learn BD strategy, the capture process, teaming, and how to build winning proposals.',
    lessons: [
      {
        id: 'capture-1',
        title: 'Business Development Strategy in Defense',
        duration: '15 min',
        description: 'Build a pipeline, identify opportunities, and develop relationships before the RFP drops.',
        keyTerms: [
          { term: 'BD', definition: 'Business Development — the long-term relationship-building and opportunity identification process.' },
          { term: 'Pipeline', definition: 'The inventory of tracked opportunities at various stages of pursuit.' },
          { term: 'Pwin', definition: 'Probability of Win — a quantified estimate of likelihood of contract award.' },
          { term: 'Gate Review', definition: 'Formal decision to continue (Bid) or stop (No-Bid) pursuing an opportunity.' },
          { term: 'Black Hat', definition: 'A competitive assessment simulating how competitors will propose; helps identify your weaknesses.' },
          { term: 'VOC', definition: 'Voice of Customer — understanding customer priorities, pain points, and hot buttons before RFP.' },
        ],
        content: [
          {
            type: 'text',
            heading: 'BD is the Engine of Defense Growth',
            body: 'Defense companies live and die by their win rate. A healthy BD function identifies opportunities 18-36 months before award, builds customer relationships, shapes requirements, and positions the company to win. The best BD professionals think like the customer — understanding their mission, constraints, and pressures — and build solutions that solve real problems.'
          },
          {
            type: 'list',
            heading: 'The BD Lifecycle (Long Before the RFP)',
            items: [
              'Opportunity Identification (3+ years out): Monitor budget, congressional language, strategic plans, and agency needs',
              'Qualification (2-3 years out): Is this opportunity real, fundable, and within our win space?',
              'Customer Engagement (1-3 years out): Build relationships, conduct demos, attend industry days',
              'Competitive Intelligence: Who else is pursuing? What are their strengths/weaknesses?',
              'Positioning: Shape requirements, demonstrate unique capabilities, establish past performance',
              'Teaming: Identify strategic teammates, sign NDAs, evaluate make/buy/team decisions',
              'Capture (12-18 months out): Formal capture plan, win strategy development, gate reviews',
            ]
          },
          {
            type: 'callout',
            heading: 'The Three Keys to BD Success',
            body: '1) Relationship: Decision-makers award contracts to people and companies they trust. Be present, be helpful, and be the expert before they need you. 2) Intelligence: Know the budget, the timeline, the incumbents, and the evaluators better than your competitors. 3) Differentiation: If you can\'t articulate why the customer should choose you over three other qualified vendors, you don\'t have a win strategy.'
          },
          {
            type: 'table',
            heading: 'Opportunity Tracking: Key Data Points',
            headers: ['Data Element', 'Why It Matters', 'Source'],
            rows: [
              ['Budget Line / PE Number', 'Confirm funding exists in FYDP', 'DoD Budget Exhibits (R-2, P-5)'],
              ['Acquisition Timeline', 'Plan your BD and capture calendar', 'FedBizOpps, FPDS, agency forecasts'],
              ['Incumbent', 'Know who you\'re displacing and why they\'re vulnerable', 'FPDS-NG, USASpending.gov'],
              ['Contracting Vehicle', 'IDIQ? MAC? Open market? Affects competition strategy', 'Beta.SAM.gov, GSA eBuy'],
              ['Decision-makers', 'CO, COR, PM, end user — map the entire decision chain', 'Agency phone directories, LinkedIn'],
              ['Pwin', 'Is this worth our B&P investment?', 'Internal assessment + Gate criteria'],
            ]
          },
          {
            type: 'tip',
            heading: 'Tools for Defense BD Research',
            body: 'Essential BD intelligence tools: GovWin IQ (Deltek) for opportunity tracking and competitive intel; USASpending.gov for contract award history; SAM.gov for current solicitations; FPDS-NG for federal procurement data; LinkedIn for decision-maker mapping; and DAU\'s DITM for tracking acquisition milestones on major programs.'
          }
        ],
        quiz: [
          {
            id: 'q1',
            question: 'A "Black Hat" exercise in the capture process is designed to:',
            options: [
              'Identify unethical competitor tactics and report them to the government',
              'Simulate how your main competitors will propose, exposing your own vulnerabilities',
              'Assess the security clearance requirements for the opportunity',
              'Develop your pricing strategy by undercutting competitors'
            ],
            correct: 1,
            explanation: 'A Black Hat review simulates your competitor\'s perspective — their likely win strategy, differentiators, and how they will attack your weaknesses. It is an internal exercise that helps you identify and address your own discriminators and vulnerabilities before the proposal is written.'
          },
          {
            id: 'q2',
            question: 'At what point in the BD lifecycle should a formal Capture Plan typically be initiated?',
            options: [
              'When the RFP is released',
              '1-3 years before the anticipated RFP release',
              '30 days before proposal due date',
              'After receiving the draft RFP'
            ],
            correct: 1,
            explanation: 'A formal capture plan is typically initiated 12-36 months before RFP release, depending on the size and complexity of the opportunity. Waiting until the RFP drops to start capture is one of the most common mistakes in defense BD — by then, competitors who started early have already shaped requirements and built relationships.'
          }
        ]
      },
      {
        id: 'capture-2',
        title: 'Building Winning Proposals',
        duration: '18 min',
        description: 'Master the proposal development process — from storyboarding to submission.',
        keyTerms: [
          { term: 'Storyboard', definition: 'A pre-writing tool that outlines key messages, themes, and discriminators before drafting.' },
          { term: 'Win Theme', definition: 'A compelling, customer-focused statement that explains why you are the best choice.' },
          { term: 'Discriminator', definition: 'A unique strength or capability that sets you apart from competitors.' },
          { term: 'B&P', definition: 'Bid and Proposal — the internal cost of developing a proposal, tracked as overhead.' },
          { term: 'Pink Team', definition: 'An early proposal review (30-40% draft) to validate win strategy and section structure.' },
          { term: 'Red Team', definition: 'A formal independent evaluation of the near-complete proposal simulating government evaluators.' },
          { term: 'Gold Team', definition: 'Final pricing review; ensures price aligns with win strategy and competitive position.' },
        ],
        content: [
          {
            type: 'text',
            heading: 'Proposals Win Programs — and Careers',
            body: 'In defense contracting, a winning proposal is the result of months of pre-proposal positioning, disciplined planning, and excellent execution. The best proposals don\'t just respond to the RFP — they tell a compelling story about why this team, this solution, at this price represents the best value for the mission. Understanding proposal development is critical whether you\'re on the government side evaluating proposals or on the contractor side writing them.'
          },
          {
            type: 'list',
            heading: 'The Shipley Proposal Process (Industry Standard)',
            items: [
              '1. Kickoff: RFP analysis, team assignments, schedule, compliance matrix',
              '2. Outline Development: Section structure based on RFP requirements',
              '3. Storyboarding: Key messages, themes, graphics for each section',
              '4. Pink Team: Review storyboards and outlines (30-40% complete)',
              '5. Writing: Draft all volumes (Technical, Management, Past Performance, Price)',
              '6. Red Team: Full proposal review simulating evaluators (80% complete)',
              '7. Gold Team: Final pricing review aligned with win strategy',
              '8. Final Review / Sign-off: Legal, security, accuracy, compliance check',
              '9. Production: Format, assemble, reproduce, deliver on time',
            ]
          },
          {
            type: 'callout',
            heading: 'The Three Rules of Proposal Writing',
            body: '1) Be Compliant: Answer every requirement in the RFP — non-compliance is a fatal flaw. 2) Be Responsive: Address what the customer actually cares about, not what you want to tell them. 3) Be Compelling: Use active voice, specific data, and customer-focused language. Avoid "we have extensive experience" — prove it with numbers and examples.'
          },
          {
            type: 'table',
            heading: 'Common Proposal Fatal Flaws',
            headers: ['Fatal Flaw', 'Impact', 'Prevention'],
            rows: [
              ['Non-compliant response', 'Disqualification / low score', 'Compliance matrix, section reviews'],
              ['Orphaned win themes', 'Themes not backed by proof points', 'Storyboard with evidence statements'],
              ['Generic language', 'Evaluators can\'t distinguish you', 'Specific data, program names, metrics'],
              ['Price-to-win mismatch', 'Win at a loss or lose on price', 'Gold Team, market intelligence'],
              ['Late submission', 'Disqualification (FAR 15.208)', 'Submission schedule with buffers'],
              ['Key Personnel issues', 'Past performance gaps', 'Resume library, COR letters'],
            ]
          },
          {
            type: 'formula',
            heading: 'Win Rate Math',
            formula: 'Win Rate = Contracts Won / Contracts Bid × 100%\nB&P ROI = (Contract Value × Win Rate × Profit %) / Total B&P Spent',
            explanation: 'Industry-leading defense firms target 40-60% win rates on evaluated bids. A company spending $1M in B&P to win a $20M contract with 10% profit and 50% win rate generates: ($20M × 50% × 10%) / $1M = $1M return on B&P investment. Track your win rate by opportunity type, size, and customer to optimize where you invest B&P dollars.'
          }
        ],
        quiz: [
          {
            id: 'q1',
            question: 'A Red Team review in the proposal process is designed to:',
            options: [
              'Review the final pricing volume for competitiveness',
              'Provide early feedback on storyboards and win themes',
              'Simulate independent government evaluators assessing the near-complete proposal',
              'Conduct a legal and ethical review of the proposal content'
            ],
            correct: 2,
            explanation: 'The Red Team simulates the perspective of the government Source Selection Evaluation Board (SSEB) assessing the proposal at 80%+ completion. Red Team reviewers evaluate compliance, responsiveness, and competitiveness — identifying weaknesses before final submission. It is the most critical quality gate in proposal development.'
          }
        ]
      }
    ]
  },
  {
    id: 'operations',
    title: 'Program Operations & Leadership',
    subtitle: 'Module 6',
    icon: '⚙️',
    color: 'slate',
    description: 'Lead programs effectively: risk management, stakeholder communications, EVMS implementation, and career advancement.',
    lessons: [
      {
        id: 'ops-1',
        title: 'Risk Management in Defense Programs',
        duration: '14 min',
        description: 'Build and execute a rigorous risk management program that prevents problems before they become crises.',
        keyTerms: [
          { term: 'Risk Register', definition: 'A documented log of identified risks including probability, impact, and mitigation plans.' },
          { term: 'Risk Mitigation', definition: 'Actions taken to reduce the probability or impact of a risk.' },
          { term: 'Opportunity Management', definition: 'Actively exploiting positive events to improve program outcomes.' },
          { term: 'MR', definition: 'Management Reserve — budget set aside to address identified and unforeseen risks.' },
          { term: 'UB', definition: 'Undistributed Budget — budget that has not yet been assigned to specific work packages.' },
          { term: 'Risk Burn-down', definition: 'Tracking risk probability and impact over time as mitigation actions are executed.' },
        ],
        content: [
          {
            type: 'text',
            heading: 'Risk is Inherent in Defense Programs',
            body: 'Every defense program operates in an environment of uncertainty — technical risks, schedule risks, funding risks, and supply chain risks. The best Program Managers don\'t avoid risk; they manage it systematically. DoD\'s Risk, Issue, and Opportunity (RIO) Management Guide provides the framework. Integrating risk management into every program review — not just as a standalone briefing — is the mark of a mature program office.'
          },
          {
            type: 'formula',
            heading: 'Risk Assessment Matrix',
            formula: 'Risk Level = Probability × Impact\nHigh Risk: P ≥ 50% AND Impact ≥ 3 (on 5-point scale)\nMedium Risk: P 20-49% OR Impact = 2-3\nLow Risk: P < 20% AND Impact ≤ 2',
            explanation: 'Use a 5×5 risk matrix (Probability: 1-5, Impact: 1-5) to plot and prioritize risks. Focus mitigation resources on high-probability, high-impact risks first. Track risk burn-down over time as a program health indicator.'
          },
          {
            type: 'list',
            heading: 'The RIO Management Process (DoD Standard)',
            items: [
              'Identify: Brainstorm risks across technical, cost, schedule, and programmatic domains',
              'Analyze: Assess probability (1-5) and impact (1-5) for each risk, cost and schedule',
              'Plan: Develop mitigation strategies, owners, and timelines for high/medium risks',
              'Track: Update risk register monthly; show burn-down trends at program reviews',
              'Control: Execute mitigation actions, retire closed risks, elevate emerging risks',
              'Opportunities: Actively manage positive risks (early tech maturation, cost savings)',
            ]
          },
          {
            type: 'callout',
            heading: 'Management Reserve — Your Safety Net',
            body: 'MR is budget held back from the Performance Measurement Baseline (PMB) to fund identified risks. Typically 5-10% of the program budget. Using MR requires formal documentation and CO approval on cost-reimbursable contracts. PMs who protect their MR have the flexibility to weather surprises; those who spend it early on routine work find themselves with no cushion when real problems hit.'
          },
          {
            type: 'table',
            heading: 'Risk vs. Issue vs. Opportunity',
            headers: ['Category', 'Definition', 'Management Action'],
            rows: [
              ['Risk', 'A potential future adverse event', 'Mitigate: reduce P or I before it occurs'],
              ['Issue', 'A risk that has materialized', 'Resolve: develop corrective action plan'],
              ['Opportunity', 'A potential future positive event', 'Exploit, enhance, or accept the benefit'],
            ]
          }
        ],
        quiz: [
          {
            id: 'q1',
            question: 'Management Reserve (MR) in a defense program is intended to:',
            options: [
              'Cover known, well-defined work that is already planned',
              'Fund identified risks and unforeseen events that affect the Performance Measurement Baseline',
              'Pay for program management overhead costs',
              'Supplement the contractor\'s profit on cost-plus contracts'
            ],
            correct: 1,
            explanation: 'MR is budget above the Performance Measurement Baseline (PMB) held at the program manager level to address identified risks and unforeseen events. It is NOT planned into the PMB and NOT associated with specific work packages. MR use requires formal justification and modification of the approved PMB.'
          }
        ]
      },
      {
        id: 'ops-2',
        title: 'Stakeholder Management & Executive Communication',
        duration: '13 min',
        description: 'Build the relationships and communication skills that separate effective PMs from managers.',
        keyTerms: [
          { term: 'DAB', definition: 'Defense Acquisition Board — OSD-level review for major programs at milestone decisions.' },
          { term: 'IPT', definition: 'Integrated Product Team — a cross-functional team responsible for a specific area of the program.' },
          { term: 'OIPT', definition: 'Overarching Integrated Product Team — senior-level IPT that resolves cross-functional issues.' },
          { term: 'PEO', definition: 'Program Executive Officer — the management layer between the PM and the Service Acquisition Executive.' },
          { term: 'SAE', definition: 'Service Acquisition Executive — the senior acquisition official for each Military Department.' },
        ],
        content: [
          {
            type: 'text',
            heading: 'Programs Are a People Business',
            body: 'The most technically sound acquisition strategy will fail if the PM cannot build coalitions, manage upward expectations, and communicate clearly to decision-makers who have 10 minutes to understand your program. The ability to distill complex program status into a crisp, data-backed narrative is one of the most valuable skills in defense acquisitions.'
          },
          {
            type: 'list',
            heading: 'The PM\'s Stakeholder Map',
            items: [
              'Program Executive Officer (PEO): Your direct superior; manages your portfolio and fights for your resources',
              'Service Acquisition Executive (SAE): Delegated authority over all acquisition programs for the Service',
              'USD(A&S): Ultimate DoD acquisition authority; sees ACAT I programs at milestone reviews',
              'Program Office Team: Engineers, logisticians, financial managers, contracting officers, CORs',
              'Combatant Commands: The warfighters who will use the system — their requirements drive everything',
              'Congressional Staff: Monitors programs on their committees; a single staffer can affect funding',
              'Contractors: Partners in program execution; relationship management is critical',
              'OSD Cost / CAPE: Independent cost analysis; often skeptical of program office estimates',
            ]
          },
          {
            type: 'callout',
            heading: 'The "1-3-5" Communication Rule',
            body: 'Structure every executive brief as: 1 core message (what do I need you to know?), 3 supporting data points (why should you believe me?), 5 minutes maximum for the verbal summary. Senior leaders are making decisions across dozens of programs — the PM who can brief clearly and confidently earns trust and resources.'
          },
          {
            type: 'table',
            heading: 'Common Defense Program Reviews',
            headers: ['Review', 'Purpose', 'Audience', 'Typical Cadence'],
            rows: [
              ['Monthly Status Review (MSR)', 'Program health update: cost, schedule, performance, risk', 'PEO / PM', 'Monthly'],
              ['System Requirements Review (SRR)', 'Validate system requirements are complete and feasible', 'IPT, PEO', 'Once (Phase A)'],
              ['Preliminary Design Review (PDR)', 'Validate system design satisfies all requirements', 'IPT, PEO, ACAT I: DAB', 'Once (Phase B)'],
              ['Critical Design Review (CDR)', 'Validate detailed design is mature enough to build', 'IPT, PEO, ACAT I: DAB', 'Once (Phase C)'],
              ['Test Readiness Review (TRR)', 'Confirm system is ready for developmental testing', 'IPT, OT&E office', 'Pre-test events'],
              ['Defense Acquisition Board (DAB)', 'Milestone decisions for ACAT I programs', 'USD(A&S)', 'At each milestone'],
            ]
          },
          {
            type: 'tip',
            heading: 'Building Your Network Early',
            body: 'The acquisition community is small. The Captain or Major you work with today is the Colonel or General you\'ll brief in 10 years. The GS-11 analyst across the table becomes the SES you\'ll be pitching your company to. Invest in every professional relationship — return calls, deliver on commitments, and be the person who solves problems rather than creates them.'
          }
        ],
        quiz: [
          {
            id: 'q1',
            question: 'A Critical Design Review (CDR) is typically conducted to:',
            options: [
              'Validate that system requirements are complete at the beginning of Engineering & Manufacturing Development',
              'Confirm the detailed design is sufficiently mature to proceed with production',
              'Approve the program\'s budget and schedule baseline at Milestone B',
              'Review contractor past performance before source selection'
            ],
            correct: 1,
            explanation: 'The Critical Design Review (CDR) is conducted in Phase C (Production & Deployment) to confirm the detailed design is stable and mature enough to enter production. CDR examines complete design drawings, technical risk, test plans, and manufacturing readiness. A failed CDR typically results in a program pause and design rework.'
          }
        ]
      },
      {
        id: 'ops-3',
        title: 'Career Roadmap: Breaking Into DoD Acquisitions',
        duration: '10 min',
        description: 'A practical guide to landing your first acquisition role and building a long-term career.',
        keyTerms: [
          { term: 'GS Scale', definition: 'General Schedule — the federal pay scale for white-collar civilian federal employees (GS-1 through GS-15).' },
          { term: 'SES', definition: 'Senior Executive Service — the executive leadership corps of the federal government.' },
          { term: 'Pathways Program', definition: 'DoD\'s competitive hiring program for recent graduates and current students.' },
          { term: 'DAU', definition: 'Defense Acquisition University — the premier education institution for acquisition professionals.' },
          { term: 'DAPA', definition: 'Defense Acquisition Professional Development (formerly DAWIA certifications, now DAPA).' },
        ],
        content: [
          {
            type: 'text',
            heading: 'The Career Landscape',
            body: 'DoD acquisition offers two distinct career tracks: the government side (civilian or military) and the contractor/industry side. Both paths offer excellent opportunities, and many professionals move between them throughout their careers. The government side provides the "acquisitions professional" credentials through DAU training and DAPA requirements. The contractor side offers higher compensation but requires understanding government processes to be effective.'
          },
          {
            type: 'table',
            heading: 'Career Entry Points',
            headers: ['Background', 'Recommended Entry Role', 'Grade Level', 'First Steps'],
            rows: [
              ['Military (O-3 to O-5)', 'Program Manager / Deputy PM', 'GS-12/13 or equivalent', 'DAU courses, apply to PEO offices'],
              ['Enlisted Military', 'Program Analyst / Contracting Support', 'GS-9/11', 'DAU CLM 003, 049; USAJOBS'],
              ['Engineering degree', 'Systems Engineer / Technical Advisor', 'GS-11/12', 'Get security clearance first'],
              ['Finance / Accounting', 'Financial Manager / Cost Analyst', 'GS-9/11', 'CDFM certification, DAU FMF courses'],
              ['Business / Management', 'Contracts Specialist (1102)', 'GS-9/11', 'FAC-C training, use Pathways program'],
              ['No direct background', 'Program Analyst / Admin Support', 'GS-7/9', 'Pathways program, networking'],
            ]
          },
          {
            type: 'list',
            heading: 'Essential First Steps (Government Track)',
            items: [
              'Get your security clearance — many roles require Secret or TS/SCI; apply early',
              'Enroll at Defense Acquisition University (DAU) — free courses, essential credentials',
              'Target USAJOBS.gov listings under series 1102 (Contracting), 0340 (PM), or 0501 (Financial)',
              'Network at AFCEA, NDIA, and SAME events — the defense community is relationship-driven',
              'Obtain a relevant certification: PMP, CDFM, CPCM, DAWIA equivalents',
              'Build your resume around the FAR/DFARS, EVM, and program management language',
              'Consider the Pathways Recent Graduates program if you recently completed a degree',
            ]
          },
          {
            type: 'list',
            heading: 'Essential First Steps (Contractor Track)',
            items: [
              'Identify target companies: Booz Allen, Leidos, SAIC, Peraton, BAH, GDIT, ManTech, DXC',
              'Target roles: Program Analyst, Capture Analyst, Contract Support, Cost Analyst',
              'Build expertise in GovWin IQ, FPDS-NG, SAM.gov — essential tools for BD roles',
              'Get PMP certified — it\'s the universal credential for PM roles at contractors',
              'Understand EVM — most contractor PM roles require EVMS knowledge',
              'Leverage LinkedIn: connect with BD managers, capture managers, and proposal professionals',
              'Join APMP (Association of Proposal Management Professionals) — excellent community',
            ]
          },
          {
            type: 'callout',
            heading: 'Salary Expectations (2025 Market)',
            body: 'Government Track: GS-11 ($58-76K), GS-12 ($70-91K), GS-13 ($83-108K), GS-14 ($98-127K), GS-15 ($115-150K) — plus excellent benefits, pension, and work-life balance. Contractor Track: Program Analyst ($65-85K), Senior Analyst ($85-120K), Program Manager ($110-160K), Capture Manager ($130-200K), VP BD ($180-300K+). The government-to-contractor transition typically brings a 20-40% salary increase.'
          }
        ],
        quiz: [
          {
            id: 'q1',
            question: 'For a recent college graduate interested in the government contracting track, what is the most direct pathway into DoD acquisitions?',
            options: [
              'Apply directly for GS-14 Program Manager positions',
              'Use DoD\'s Pathways Recent Graduates program targeting GS-7/9 entry-level positions',
              'Get 10 years of private sector experience first',
              'Only military experience leads to acquisition careers'
            ],
            correct: 1,
            explanation: 'The Pathways Recent Graduates program is specifically designed for recent college graduates (within 2 years of degree) and provides a structured entry point into federal service at GS-7 to GS-9 levels. Combined with DAU training, it provides a clear pathway to a full-career acquisition professional role. Military experience is valuable but not required.'
          }
        ]
      }
    ]
  }
];

export const getAllLessons = (): { lesson: Lesson; module: Module }[] => {
  return modules.flatMap(mod => mod.lessons.map(lesson => ({ lesson, module: mod })));
};

export const getTotalLessons = () => getAllLessons().length;
export const getTotalModules = () => modules.length;
