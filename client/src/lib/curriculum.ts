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
  type: 'text' | 'callout' | 'list' | 'table' | 'formula' | 'tip' | 'warning' | 'risk_chart';
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
  type?: 'multiple_choice' | 'drag_match' | 'drag_order';
  question: string;
  // multiple_choice fields
  options: string[];
  correct: number;
  explanation: string;
  // drag_match fields: match left items to right items by index
  pairs?: { left: string; right: string }[];
  // drag_order fields: items to be sorted into correct order
  orderedItems?: string[];
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
  // ─────────────────────────────────────────────────────────────
  // MODULE 1 — FOUNDATIONS (FREE)
  // ─────────────────────────────────────────────────────────────
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
            heading: "What is DoD Acquisitions?",
            body: "The Department of Defense acquisitions system is the process by which the U.S. military procures goods, services, and systems to fulfill national security requirements. With an annual budget exceeding $400 billion, DoD is the largest acquisition enterprise in the world. Every dollar must be managed according to strict laws, regulations, and policies to ensure accountability, competition, and proper use of taxpayer funds."
          },
          {
            type: 'callout',
            heading: "The Big Three Processes",
            body: "DoD acquisitions sits at the intersection of three interlocked processes: JCIDS (what we need), PPBE (how we fund it), and the Acquisition System (how we buy it). Understanding all three is essential for a successful PM or Contracting Officer career."
          },
          {
            type: 'list',
            heading: "Key Regulatory Framework",
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
            heading: "Acquisition Program Categories",
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
            heading: "The Adaptive Acquisition Framework (AAF)",
            body: "The 2020 introduction of the Adaptive Acquisition Framework (AAF) replaced the rigid \"5000.02\" single path model with six acquisition pathways: Urgent Capability Acquisition, Middle Tier of Acquisition, Major Capability Acquisition, Software Acquisition, Defense Business Systems, and Acquisition of Services. This flexibility allows programs to choose the pathway that best fits the nature of their acquisition."
          },
          {
            type: 'tip',
            heading: "Career Tip",
            body: "The most valued PMs understand not just their own acquisition pathway, but how it connects to budget cycles (PPBE) and requirements generation (JCIDS). When you can speak all three languages fluently, you become indispensable to a program office."
          }
        ],
        quiz: [
          {
            id: 'q1',
            question: "Which regulation serves as the primary source of federal acquisition law, applicable to all federal agencies including DoD?",
            options: ['DFARS', 'FAR (Federal Acquisition Regulation)', 'DoDI 5000.02', 'Title 10 U.S.C.'],
            correct: 1,
            explanation: "The FAR (Federal Acquisition Regulation) is codified in 48 CFR and applies to all federal agencies. DFARS is the DoD supplement to FAR. DoDI 5000.02 governs the acquisition of major defense systems specifically."
          },
          {
            id: 'q2',
            question: "An ACAT I program has RDT&E costs projected at $520 million. Which authority serves as the Milestone Decision Authority?",
            options: ['Program Executive Officer', 'Service Secretary', 'Under Secretary of Defense (Acquisition & Sustainment)', 'Comptroller General'],
            correct: 2,
            explanation: "ACAT I programs — those exceeding $480M in RDT&E or $2.79B in procurement — have the Under Secretary of Defense for Acquisition & Sustainment (USD(A&S)) as the Milestone Decision Authority."
          },
          {
            id: 'q3',
            question: "The Adaptive Acquisition Framework replaced what previous single-path model?",
            options: ['DoDI 5000.74', 'DoDI 5000.02 single pathway', 'JCIDS Manual', 'Defense Acquisition University model'],
            correct: 1,
            explanation: "The AAF, formalized in 2020, replaced the rigid single-path acquisition model previously required by DoDI 5000.02, offering six distinct pathways tailored to different acquisition needs."
          },
          {
            id: 'q4',
            question: "Which of the three DoD \"Big processes\" is primarily responsible for generating requirements — identifying what capabilities the military needs?",
            options: ['PPBE', 'The Acquisition System', 'JCIDS', 'AAF'],
            correct: 2,
            explanation: "JCIDS (Joint Capabilities Integration and Development System) is the requirements generation process. It identifies capability gaps and defines what needs to be procured. PPBE funds it, and the Acquisition System buys it."
          },
          {
            id: 'q5',
            question: "Which AAF pathway is specifically designed for software-intensive programs using Agile and DevSecOps approaches?",
            options: ['Major Capability Acquisition', 'Middle Tier of Acquisition', 'Software Acquisition Pathway', 'Urgent Capability Acquisition'],
            correct: 2,
            explanation: "The Software Acquisition Pathway (DoDI 5000.87) was created specifically for software-intensive programs and enables use of Agile, DevSecOps, and continuous delivery methods without following the traditional hardware-focused milestone process."
          },
          {
            id: 'q6',
            question: "An ACAT II program has total procurement costs of $900 million. Who serves as the Milestone Decision Authority?",
            options: ['USD(A&S)', 'Component Acquisition Executive (e.g., ASA(ALT) for Army)', 'Program Executive Officer', 'Defense Acquisition Board'],
            correct: 1,
            explanation: "ACAT II programs (RDT&E > $185M or procurement > $835M) have the Component Acquisition Executive — such as the Assistant Secretary of the Army for Acquisition, Logistics, and Technology — as the MDA, not USD(A&S)."
          },
          {
            id: 'q7',
            question: "DoDI 5000.74 specifically governs what type of acquisition?",
            options: ['Major weapon systems', 'Defense Acquisition of Services', 'Defense Business Systems', 'Urgent Capability Acquisition'],
            correct: 1,
            explanation: "DoDI 5000.74 specifically governs the Defense Acquisition of Services — the process for acquiring services contracts, which now represent more than half of DoD's annual contract spending."
          },
          {
            id: 'q8',
            question: "Which acquisition pathway is designed for rapid fielding of capabilities within 2 years without a formal Milestone B decision?",
            options: ['Major Capability Acquisition', 'Middle Tier of Acquisition (MTA)', 'Urgent Capability Acquisition', 'Defense Business Systems'],
            correct: 1,
            explanation: "The Middle Tier of Acquisition (MTA) pathway, authorized by Section 804 of the FY2016 NDAA, allows programs to rapidly prototype or rapidly field capabilities within 5 years without a formal Milestone B. Many programs targeting 2-year fielding use MTA Rapid Fielding."
          },
          {
            id: 'q9',
            question: "Title 10 U.S.C. provides what primary authority for DoD acquisitions?",
            options: ['Tax authority for defense spending', 'Statutory authority for the armed forces and defense acquisitions', 'Congressional appropriations authority', 'The authority to enter into international agreements'],
            correct: 1,
            explanation: "Title 10 U.S.C. is the statutory foundation for the armed forces and defense acquisitions, establishing the legal authority under which DoD operates. It defines acquisition thresholds, authorities, and requirements that flow down into DoDI 5000 series instructions and regulations."
          },
          {
            id: 'q10',
            question: "What is the primary purpose of the Adaptive Acquisition Framework's \"Urgent Capability Acquisition\" pathway?",
            options: ['Procure commercial off-the-shelf items rapidly', 'Address urgent warfighter needs within 2 years using streamlined approval processes', 'Develop and test new defense systems through rapid prototyping', 'Acquire defense business systems using commercial software'],
            correct: 1,
            explanation: "The Urgent Capability Acquisition pathway is designed to rapidly meet urgent warfighter needs, typically within 2 years. It uses streamlined oversight and accelerated approvals, often in response to combatant command urgent requests or unforeseen operational requirements."
          },
          {
            id: 'q11',
            type: 'drag_order',
            question: "Place these DoD acquisition milestones in the correct sequence from earliest to latest:",
            options: [],
            correct: 0,
            explanation: "The standard MDA pathway flows: Milestone A (approve entry into Technology Maturation) → Milestone B (approve entry into Engineering & Manufacturing Development) → Milestone C (approve entry into Production & Deployment) → Full-Rate Production Decision. Each milestone requires a formal review and documented approval.",
            orderedItems: [
              "Milestone A — Materiel Development Decision",
              "Milestone B — Engineering & Manufacturing Development",
              "Milestone C — Production & Deployment",
              "Full-Rate Production (FRP) Decision"
            ]
          },
          {
            id: 'q12',
            type: 'drag_match',
            question: "Match each DoD process to its primary function:",
            options: [],
            correct: 0,
            explanation: "JCIDS generates requirements (what the military needs). PPBE allocates funding (how it's paid for). The Acquisition System procures the capability (how it's bought). These three processes must stay synchronized for a program to succeed.",
            pairs: [
              { left: 'JCIDS', right: 'Generates validated warfighter requirements' },
              { left: 'PPBE', right: 'Allocates and manages defense funding' },
              { left: 'Acquisition System', right: 'Procures and delivers the capability' },
              { left: 'DAWIA', right: 'Sets workforce training & certification standards' }
            ]
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
            heading: "The Acquisition Workforce",
            body: "The DoD acquisition workforce comprises over 150,000 professionals across 14+ career fields. These individuals are responsible for planning, managing, and overseeing the acquisition of goods and services from the private sector. The workforce is governed by DAWIA (Defense Acquisition Workforce Improvement Act), which establishes education, training, and experience requirements for each career field."
          },
          {
            type: 'table',
            heading: "Key Acquisition Career Fields",
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
            heading: "The Program Manager (PM) Role",
            body: "The Program Manager is the single accountable individual responsible for all aspects of a program — cost, schedule, and performance. PMs must be skilled communicators, technical leaders, budget managers, and risk mitigators simultaneously. A good PM translates technical requirements into acquisition strategy while managing stakeholder relationships up and down the chain of command."
          },
          {
            type: 'list',
            heading: "What Makes a Successful PM?",
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
            heading: "Breaking In",
            body: "Many successful acquisition professionals transition from the military (especially as O-3/O-4 officers), from technical engineering fields, or from federal service in adjacent roles. DoD's Pathways program and Defense Acquisition University offer entry-level pathways. Target GS-9 or GS-11 program analyst roles to build your foundation."
          }
        ],
        quiz: [
          {
            id: 'q1',
            question: "What law established education, training, and experience standards for the DoD acquisition workforce?",
            options: ['FAR Part 1', 'DAWIA (Defense Acquisition Workforce Improvement Act)', 'DoDI 5000.02', 'Competition in Contracting Act'],
            correct: 1,
            explanation: "DAWIA, enacted in 1990 and regularly updated, is the foundational law that professionalized the DoD acquisition workforce by establishing standards for each of the 14+ career fields."
          },
          {
            id: 'q2',
            question: "A Contracting Officer's Representative (COR) primarily serves which function?",
            options: ['Award and sign contracts on behalf of the government', 'Serve as the technical monitor ensuring contractor performance meets contract requirements', 'Develop the acquisition strategy', 'Approve program funding at milestone reviews'],
            correct: 1,
            explanation: "The COR is the government's technical representative on a contract, responsible for monitoring contractor performance, documenting issues, and providing technical direction within the scope of the contract. They cannot modify contract terms — that authority belongs to the Contracting Officer (CO)."
          },
          {
            id: 'q3',
            question: "Which acquisition career field series (OPM) is responsible for contracting specialists and Contracting Officers?",
            options: ['Series 0340', 'Series 1102', 'Series 0501', 'Series 0801'],
            correct: 1,
            explanation: "The 1102 occupational series (Contract Specialist) covers acquisition contracting professionals, including those who become warranted Contracting Officers. Series 0340 is for Program Management, 0501 is Financial Administration, and 0801 is General Engineering."
          },
          {
            id: 'q4',
            question: "The Program Manager is singularly accountable for which triad of program outcomes?",
            options: ['Requirements, funding, and workforce', 'Cost, schedule, and performance', 'Risk, quality, and delivery', 'Planning, programming, and budgeting'],
            correct: 1,
            explanation: "The PM is the single individual accountable for cost, schedule, and performance (the \"iron triangle\" of program management). These three dimensions are inherently linked — changing one almost always affects the others."
          },
          {
            id: 'q5',
            question: "Which certification is most aligned with federal agency Program and Project Managers specifically?",
            options: ['PMP (Project Management Professional)', 'FAC-PM (Federal Acquisition Certification for Program/Project Managers)', 'CDFM (Certified Defense Financial Manager)', 'FAC-C (Federal Acquisition Certification in Contracting)'],
            correct: 1,
            explanation: "FAC-PM is the federal-government-specific certification for Program and Project Managers, issued in accordance with OMB policy. PMP is the industry-standard certification. Both are valued; FAC-PM is specifically tailored to federal acquisition program requirements."
          },
          {
            id: 'q6',
            question: "A Procuring Contracting Officer (PCO) differs from an Administrative Contracting Officer (ACO) in that the PCO:",
            options: ['Monitors day-to-day contract performance at the contractor\'s facility', 'Has authority to enter into contracts during source selection and award', 'Is responsible for contract closeout only', 'Reviews and approves technical data packages'],
            correct: 1,
            explanation: "The PCO has the authority to enter into, negotiate, and award contracts. The ACO administers contracts post-award, often at or near the contractor's facility. Both require a Contracting Officer warrant, but their roles in the contract lifecycle are distinct."
          },
          {
            id: 'q7',
            question: "Which DoD organization serves as the premier educational institution providing free training for acquisition professionals?",
            options: ['National Defense University', 'Defense Acquisition University (DAU)', 'Air War College', 'Armed Forces Staff College'],
            correct: 1,
            explanation: "Defense Acquisition University (DAU) provides free, DoD-focused acquisition training to acquisition workforce members. Courses range from foundational (e.g., ACQ 101) to advanced and are required for DAWIA certification at each level."
          },
          {
            id: 'q8',
            question: "In the context of DAWIA certification levels, what does \"Foundational Level\" represent?",
            options: ['Entry-level experience only, no formal training required', 'The first tier of certification demonstrating core competencies in a career field', 'A temporary authorization pending full certification', 'Certifications reserved for GS-7 and below'],
            correct: 1,
            explanation: "DAWIA certification is structured in three levels: Foundational (Level I equivalent, entry-level competency), Practitioner (Level II, mid-level), and Advanced (Level III, senior). Each level requires a combination of DAU training hours, education, and experience."
          },
          {
            id: 'q9',
            question: "A COR who directs a contractor to perform work outside the contract's defined Statement of Work is:",
            options: ['Exercising appropriate government oversight authority', 'Potentially creating an unauthorized commitment and Anti-Deficiency Act risk', 'Performing their standard role in contract administration', 'Exercising authority delegated by the PCO'],
            correct: 1,
            explanation: "A COR directing out-of-scope work creates an unauthorized commitment — a potentially illegal act that can bind the government to pay for work without proper authority or funding. Only the Contracting Officer can direct changes to contract scope. This is a leading cause of COR-related legal problems."
          },
          {
            id: 'q10',
            question: "DoD's Pathways Recent Graduates program typically targets entry-level positions at which GS grade levels?",
            options: ['GS-5 to GS-7', 'GS-7 to GS-9', 'GS-11 to GS-12', 'GS-13 to GS-14'],
            correct: 1,
            explanation: "The Pathways Recent Graduates program typically offers positions at GS-7 to GS-9 for recent graduates (within 2 years of degree completion). This provides a structured entry into federal service with formal training, mentoring, and a clear pathway to full career positions."
          }
        ]
      }
    ]
  },

  // ─────────────────────────────────────────────────────────────
  // MODULE 2 — FINANCE
  // ─────────────────────────────────────────────────────────────
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
            heading: "Why PPBE Matters for PMs",
            body: "Your program's funding is not automatic. Every year, program managers must compete for resources within the PPBE process. Understanding this cycle — who makes decisions, when, and based on what criteria — is the difference between a well-funded program and one that gets cut or restructured. Missing a POM submission window can delay your program by 2 years."
          },
          {
            type: 'table',
            heading: "The PPBE Annual Cycle",
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
            heading: "The Benny Hill Problem",
            body: "Programs that don't have a well-documented funding justification going into the POM get \"Benny Hill'd\" — cut to fund higher priorities. Your job as PM is to have a compelling cost/benefit narrative, performance data, and risk arguments ready every time OSD reviews your program. Document everything."
          },
          {
            type: 'list',
            heading: "Appropriations Types You'll Manage",
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
            heading: "Burn Rate Formula",
            formula: 'Monthly Burn Rate = Total Obligation Authority ÷ Number of Execution Months',
            explanation: "Tracking burn rate against plan is critical. If you're burning faster than planned, you may need supplemental funding or a scope reduction. If you're under-executing, you risk losing future-year funding — the \"use it or lose it\" trap."
          },
          {
            type: 'warning',
            heading: "Anti-Deficiency Act",
            body: "Never obligate funds in excess of what is appropriated or in advance of appropriation. Violations of the Anti-Deficiency Act (31 U.S.C. §§ 1341, 1342) are federal crimes and career-ending events. Every PM must understand these constraints cold."
          }
        ],
        quiz: [
          {
            id: 'q1',
            question: "What is the Future Years Defense Program (FYDP)?",
            options: ['A 10-year strategic plan', 'A 5-year resource database tracking all DoD programs and funding', 'The Congressional budget resolution for defense', 'The Services\' annual programming document submitted to OSD'],
            correct: 1,
            explanation: "The FYDP is the official DoD database that tracks all programs and resources over a 5-year period. It serves as the baseline for the annual PPBE process and is the authoritative source for program funding profiles."
          },
          {
            id: 'q2',
            question: "O&M (Operations & Maintenance) appropriations have how many years of availability?",
            options: ['1 year', '2 years', '3 years', '5 years'],
            correct: 0,
            explanation: "O&M funds have a 1-year period of availability. This means they must be obligated within the fiscal year they are appropriated. Unused O&M funds expire at year-end and cannot be used to fund future activities."
          },
          {
            id: 'q3',
            question: "Violating the Anti-Deficiency Act by obligating funds in excess of appropriations can result in:",
            options: ['A formal letter of reprimand', 'Administrative, civil, and criminal penalties up to imprisonment', 'Program restructuring only', 'A 30-day funding freeze'],
            correct: 1,
            explanation: "The Anti-Deficiency Act (31 U.S.C. §§ 1341, 1342) violations can result in administrative discipline, civil fines, and criminal prosecution. In practice, they are career-ending events that are taken extremely seriously at all levels of DoD."
          },
          {
            id: 'q4',
            question: "Which document do the Military Services submit to OSD during the Programming phase to propose how they plan to allocate resources across programs?",
            options: ['Budget Estimate Submission (BES)', 'Program Objectives Memorandum (POM)', 'Future Years Defense Program (FYDP)', 'Defense Planning Guidance (DPG)'],
            correct: 1,
            explanation: "The Program Objectives Memorandum (POM) is the Services' formal proposal to OSD during the Programming phase of PPBE. It outlines how the Service proposes to allocate resources across programs over the FYDP. OSD then issues Program Budget Decisions (PBDs) to adjust the POM."
          },
          {
            id: 'q5',
            question: "What is the period of availability for Procurement appropriations?",
            options: ['1 year', '2 years', '3 years', '5 years'],
            correct: 2,
            explanation: "Procurement appropriations have a 3-year period of availability. This allows programs to obligate production contracts over multiple fiscal years. After the 3-year availability period, unobligated funds enter a 5-year expired period before being cancelled."
          },
          {
            id: 'q6',
            question: "What happens to appropriated funds that are not obligated before the end of their period of availability?",
            options: ['They are immediately cancelled and returned to Treasury', 'They enter an "expired" status for 5 years, then are cancelled', 'They roll over automatically to the next fiscal year', 'They convert to O&M funds for current operations'],
            correct: 1,
            explanation: "Unobligated funds that pass their period of availability enter a 5-year expired period. During this time, they can still be used to adjust or liquidate existing obligations but cannot fund new obligations. After 5 years, the funds are cancelled and returned to the Treasury."
          },
          {
            id: 'q7',
            question: "The Defense Planning Guidance (DPG) is issued during which phase of PPBE and by whom?",
            options: ['Budgeting phase, by OMB', 'Execution phase, by the Comptroller', 'Planning phase, by the Secretary of Defense', 'Programming phase, by the Service Secretaries'],
            correct: 2,
            explanation: "The DPG is issued by the Secretary of Defense during the Planning phase (approximately 2 years before execution). It sets strategic priorities and guidance that shape how Services structure their POMs. Programs not aligned to DPG priorities risk being unfunded."
          },
          {
            id: 'q8',
            question: "A program office under-executing its O&M budget late in the fiscal year (\"low burn rate\") risks what consequence?",
            options: ['Immediate funding cancellation', 'A supplemental appropriation request', 'Reduced future-year funding due to apparent lack of need', 'An automatic contract extension'],
            correct: 2,
            explanation: "Under-execution signals to higher headquarters that the program doesn't need as much money as requested, leading to reductions in future-year FYDP funding. The \"use it or lose it\" dynamic in O&M encourages prudent year-end execution but can lead to poor spending decisions if not managed carefully."
          },
          {
            id: 'q9',
            question: "MILCON (Military Construction) appropriations have what period of availability?",
            options: ['1 year', '2 years', '3 years', '5 years'],
            correct: 3,
            explanation: "Military Construction (MILCON) appropriations have a 5-year period of availability, reflecting the lengthy nature of construction projects. This is the longest standard period among the major appropriation types."
          },
          {
            id: 'q10',
            question: "Which congressional action authorizes DoD activities and programs but does NOT actually provide spending authority?",
            options: ['Appropriations Act', 'National Defense Authorization Act (NDAA)', 'Continuing Resolution', 'Omnibus Spending Bill'],
            correct: 1,
            explanation: "The NDAA authorizes programs, policy, and force structure but does NOT appropriate money. A separate annual Appropriations Act (or Omnibus bill) provides the actual spending authority. Programs can be authorized but not funded if Congress passes an NDAA without a corresponding appropriation."
          },
          {
            id: 'q11',
            type: 'drag_order',
            question: "Place the PPBE phases in the correct order as they occur in the annual DoD budget cycle:",
            options: [],
            correct: 0,
            explanation: "The PPBE cycle flows: Planning (strategic guidance) → Programming (POM/RMD development) → Budgeting (President's Budget submission) → Execution (obligation and expenditure of appropriated funds). Each phase feeds the next; execution data feeds back into next year's planning.",
            orderedItems: [
              "Planning — Issue DPG strategic guidance",
              "Programming — Services submit Program Objectives Memorandum (POM)",
              "Budgeting — OSD/OMB review; President's Budget submitted to Congress",
              "Execution — Obligate and expend appropriated funds"
            ]
          },
          {
            id: 'q12',
            type: 'drag_match',
            question: "Match each appropriation type to its standard period of availability:",
            options: [],
            correct: 0,
            explanation: "Knowing the period of availability is critical for PMs — O&M is 1-year (use it or lose it each fiscal year), Procurement is 3-year (for major equipment), RDT&E is 2-year (research and development), and MILCON is 5-year (construction projects take time).",
            pairs: [
              { left: 'O&M (Operations & Maintenance)', right: '1 Year' },
              { left: 'RDT&E (Research, Dev, Test & Eval)', right: '2 Years' },
              { left: 'Procurement', right: '3 Years' },
              { left: 'MILCON (Military Construction)', right: '5 Years' }
            ]
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
            heading: "Why EVM is Critical for Program Managers",
            body: "EVM is required on most DoD contracts with a value over $20M. It provides an objective, quantitative measure of program performance. Without EVM, PMs rely on subjective \"percent complete\" estimates that are almost always wrong. With EVM, you can detect cost and schedule problems early — often 15-20% into a program — when correction is still possible and affordable."
          },
          {
            type: 'formula',
            heading: "Core EVM Formulas",
            formula: 'CV = EV - AC (Cost Variance: positive = under budget)\nSV = EV - PV (Schedule Variance: positive = ahead of schedule)\nCPI = EV / AC (>1.0 = under budget; <1.0 = over budget)\nSPI = EV / PV (>1.0 = ahead of schedule; <1.0 = behind)',
            explanation: "Memorize these. At any program review, you should be able to calculate CPI and SPI instantly and explain what they mean for the program's trajectory."
          },
          {
            type: 'formula',
            heading: "Estimate at Completion (EAC)",
            formula: 'EAC = BAC / CPI (most common — assumes future work at current efficiency)\nEAC = AC + (BAC - EV) (assumes remaining work on original budget)\nEAC = AC + [(BAC - EV) / (CPI × SPI)] (combined factor)',
            explanation: "BAC = Budget at Completion (the total approved budget). Choose your EAC method based on the nature of variances. The CPI method (BAC/CPI) is statistically the most accurate predictor for programs that are 20%+ complete."
          },
          {
            type: 'callout',
            heading: "The 20% Threshold Rule",
            body: "Research by David Christensen (1993) showed that the CPI at 20% program completion is highly predictive of final CPI. Programs rarely recover a CPI worse than 0.8. If your program shows a CPI of 0.75 at 20% completion, plan for overruns — the data is telling you something systemic is wrong."
          },
          {
            type: 'table',
            heading: "EVM Performance Indicator Benchmarks",
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
            heading: "IPMR Reporting",
            body: "The Integrated Program Management Report (IPMR) replaced the CPR and CFSR. The IPMR has seven formats: Format 1 (WBS-based cost/schedule), Format 2 (Organizational), Format 3 (Baseline), Format 4 (Staffing), Format 5 (Problem Analysis), Format 6 (Milestone/IMS), and Format 7 (Explanations). Learn all seven — you'll review these monthly on every major program."
          }
        ],
        quiz: [
          {
            id: 'q1',
            question: "A program has: PV = $10M, EV = $8M, AC = $9M. What is the Cost Performance Index (CPI)?",
            options: ['1.125', '0.89', '0.80', '1.25'],
            correct: 1,
            explanation: "CPI = EV / AC = $8M / $9M = 0.89. This means for every dollar spent, the program is only earning $0.89 of planned value — the program is over budget. The SPI would be 0.80 (EV/PV = $8M/$10M), meaning it's also behind schedule."
          },
          {
            id: 'q2',
            question: "Using the most statistically accurate EAC formula for a program that is 30% complete, BAC = $100M and CPI = 0.85:",
            options: ['$100M', '$115M', '$117.6M', '$85M'],
            correct: 2,
            explanation: "EAC = BAC / CPI = $100M / 0.85 = $117.6M. This formula is the most accurate predictor once a program is more than 20% complete. The projected overrun of $17.6M signals a systemic cost efficiency problem."
          },
          {
            id: 'q3',
            question: "What does a Schedule Performance Index (SPI) of 0.80 indicate?",
            options: ['The program is 20% over budget', 'For every $1.00 of work planned, only $0.80 of work has been accomplished — behind schedule', 'The program has completed 80% of its total work', 'The schedule has slipped by 20 days'],
            correct: 1,
            explanation: "SPI = EV / PV = 0.80 means only 80 cents of planned work has been accomplished for every dollar of work scheduled. The program is behind schedule. SPI < 1.0 always means behind schedule; SPI > 1.0 means ahead of schedule."
          },
          {
            id: 'q4',
            question: "The To-Complete Performance Index (TCPI) represents:",
            options: ['The CPI achieved so far on the program', 'The cost efficiency required on remaining work to achieve the EAC', 'The ratio of planned work to actual work', 'The schedule efficiency required to meet the deadline'],
            correct: 1,
            explanation: "TCPI = (BAC - EV) / (EAC - AC). It tells you the cost efficiency you must achieve on all remaining work to hit your EAC. A TCPI > 1.10 is generally considered unrealistic — it means you need to be significantly more efficient than you've been, which rarely happens."
          },
          {
            id: 'q5',
            question: "EVM is contractually required on DoD contracts above what minimum threshold?",
            options: ['$5M', '$20M', '$50M', '$100M'],
            correct: 1,
            explanation: "DFARS 252.234-7002 requires Earned Value Management System (EVMS) compliance on DoD contracts above $20M. Programs above $100M require a formal EVMS that meets ANSI/EIA-748 criteria and is subject to government review and acceptance."
          },
          {
            id: 'q6',
            question: "In EVM, the Performance Measurement Baseline (PMB) is:",
            options: ['The original program budget as approved at Milestone B', 'The time-phased budget plan against which actual performance is measured (BAC minus MR)', 'The contractor\'s cost estimate for the remaining work', 'The government\'s independent cost estimate'],
            correct: 1,
            explanation: "The PMB is the time-phased budget baseline for all authorized work, equal to BAC minus Management Reserve (MR). MR is held above the PMB by the PM and not included in the performance measurement baseline. Variances are measured against the PMB, not the total program budget."
          },
          {
            id: 'q7',
            question: "A Cost Variance (CV) of -$2M means:",
            options: ['The program is $2M ahead of schedule', 'The program has spent $2M less than planned', 'The program has spent $2M more than the earned value of work accomplished', 'The program will overrun by $2M at completion'],
            correct: 2,
            explanation: "CV = EV - AC. A negative CV (-$2M) means the program has spent $2M more (AC) than the budget value of work accomplished (EV). This is a cost overrun on the work performed to date. It does NOT directly state the final overrun — that requires an EAC calculation."
          },
          {
            id: 'q8',
            question: "Which IPMR format specifically covers problem analysis — explaining the root cause of significant variances?",
            options: ['Format 1', 'Format 3', 'Format 5', 'Format 7'],
            correct: 2,
            explanation: "IPMR Format 5 is the \"Problem Analysis Report\" — it requires the contractor to explain significant variances (typically CV% or SV% above threshold), identify root causes, and describe corrective action plans. This format is often the most closely scrutinized by program managers."
          },
          {
            id: 'q9',
            question: "According to Christensen's research, when a program's CPI is established at what completion percentage, it rarely improves significantly?",
            options: ['10%', '15%', '20%', '50%'],
            correct: 2,
            explanation: "Christensen's landmark 1993 study found that the CPI at 20% program completion is a highly reliable predictor of final CPI, and that the final CPI is almost always worse than the CPI at 20% completion. This is why early EVM analysis is critical — problems caught at 15% are far cheaper to fix than at 50%."
          },
          {
            id: 'q10',
            question: "Management Reserve (MR) in an EVMS context is:",
            options: ['Budget included in the PMB for identified risks', 'Budget held outside the PMB by the PM to handle unplanned work or risks', 'The contractor\'s profit margin on a cost-plus contract', 'Undistributed budget awaiting work package assignment'],
            correct: 1,
            explanation: "Management Reserve is budget held by the PM above (outside) the Performance Measurement Baseline. It is not in the PMB, not distributed to work packages, and requires formal authorization to use. MR covers unforeseen in-scope work. Undistributed Budget (UB) is different — it's budget not yet assigned to specific work packages but IS within the PMB."
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
            heading: "Why Cost Estimates Matter in DoD",
            body: "Cost growth is the number one reason programs get cancelled or restructured. The DoD has struggled historically with \"optimism bias\" — the tendency to underprice programs to win approval, then face costly breaches later. Understanding estimating methodologies helps PMs challenge unrealistic estimates and build credible baselines from day one."
          },
          {
            type: 'list',
            heading: "The Three Primary Estimating Methods",
            items: [
              'Analogous (Top-Down): Uses historical data from similar programs. Fast but less accurate. Best for early phase estimates (±50%).',
              'Parametric: Uses Cost Estimating Relationships (CERs) — statistical models built from large databases. Moderately accurate. Best for early-mid phase (±25%).',
              'Engineering Build-Up (Bottoms-Up): Detailed task-by-task estimate. Most accurate but requires mature design. Best for milestone B+ (±10-15%).',
              'Hybrid approaches: Most programs use a combination — parametric for unknowns, bottoms-up for well-defined work.',
            ]
          },
          {
            type: 'callout',
            heading: "The Role of CAPE",
            body: "The Cost Assessment and Program Evaluation (CAPE) office, within OSD, provides independent cost assessments for major defense acquisition programs. Their estimates are typically higher than program office estimates — and statistically, CAPE is more often correct. When CAPE's estimate exceeds the program office estimate by 20%+, Congress and leadership take note."
          },
          {
            type: 'formula',
            heading: "Key Cost Estimating Metrics",
            formula: 'Cost Risk = (P80 Cost - Point Estimate) / Point Estimate × 100%\nMean Cost Overrun (historical DoD) ≈ 20-30% above Milestone B estimate',
            explanation: "DoD programs historically overrun by 20-30% at completion. Always include cost risk analysis in your estimates. The 80th percentile cost (P80) means there's an 80% probability the actual cost will be at or below that figure — this is the standard threshold DoD uses for major program budgeting."
          },
          {
            type: 'tip',
            heading: "Nunn-McCurdy",
            body: "The Nunn-McCurdy Act requires DoD to notify Congress when program unit costs breach specific thresholds (15% = \"significant breach\"; 25% = \"critical breach\"). A critical breach requires the program to be certified by USD(A&S) or face cancellation. As a PM, preventing a Nunn-McCurdy breach is a top priority."
          }
        ],
        quiz: [
          {
            id: 'q1',
            question: "Which cost estimating method is most accurate but requires the most mature program design?",
            options: ['Analogous (top-down)', 'Parametric', 'Engineering Build-Up (bottoms-up)', 'Expert judgment'],
            correct: 2,
            explanation: "Engineering Build-Up (Bottoms-Up) estimating, which estimates each individual work package and rolls it up, is the most accurate method (±10-15%) but requires a mature design and detailed work breakdown structure. It is typically used at or after Milestone B."
          },
          {
            id: 'q2',
            question: "A Nunn-McCurdy \"critical breach\" is triggered when program unit cost growth exceeds what threshold?",
            options: ['10%', '15%', '25%', '50%'],
            correct: 2,
            explanation: "A 25% cost growth above the original baseline triggers a Nunn-McCurdy critical breach, requiring certification by USD(A&S) and Congressional notification. The 15% threshold triggers a \"significant breach\" requiring notification but not the full certification process."
          },
          {
            id: 'q3',
            question: "CAPE's independent cost estimates for major programs are notable because:",
            options: ['They are always lower than program office estimates', 'They are typically higher than program office estimates and historically more accurate', 'They are only used for ACAT III programs', 'They replace the program office estimate at Milestone B'],
            correct: 1,
            explanation: "CAPE estimates are consistently higher than program office estimates and are statistically more accurate — reflecting the well-documented \"optimism bias\" in program offices. When CAPE's estimate diverges significantly, it flags the program for additional scrutiny."
          },
          {
            id: 'q4',
            question: "The P80 cost estimate represents:",
            options: ['80% of the program\'s total budget', 'The cost at which there is an 80% probability that actual costs will be at or below that figure', 'The 80th percentile of contractor bids received', 'A cost growth of 80% over the baseline estimate'],
            correct: 1,
            explanation: "P80 is the 80th percentile of the cost probability distribution — there is an 80% chance actual costs will be at or below this number. DoD typically uses P80 for budgeting ACAT I programs to provide a reasonable level of confidence that funding will be sufficient."
          },
          {
            id: 'q5',
            question: "Which estimating method is most appropriate for an early-phase analysis where the program is not yet well-defined?",
            options: ['Engineering Build-Up', 'Parametric', 'Analogous', 'Activity-Based Costing'],
            correct: 2,
            explanation: "Analogous estimating — using costs from similar historical programs — is most appropriate in early phases when design details are lacking. While accuracy is limited (±50%), it provides a useful order-of-magnitude estimate to support early programming decisions."
          },
          {
            id: 'q6',
            question: "An ICE (Independent Cost Estimate) is required at which program milestone events?",
            options: ['Only at Milestone A', 'Only at Milestone C', 'At each major milestone decision (A, B, C) for ACAT I programs', 'Only when a Nunn-McCurdy breach has occurred'],
            correct: 2,
            explanation: "For ACAT I programs, an ICE is required at each major milestone (A, B, C) decision. The ICE is prepared independently from the program office estimate, typically by CAPE at the OSD level or by the Service Cost Center at the component level."
          },
          {
            id: 'q7',
            question: "Parametric cost estimating uses what primary analytical tool to relate cost to technical characteristics?",
            options: ['Work Breakdown Structures (WBS)', 'Cost Estimating Relationships (CERs)', 'Performance Measurement Baselines', 'Bill of Materials (BOM)'],
            correct: 1,
            explanation: "Parametric estimating relies on Cost Estimating Relationships (CERs) — statistical equations derived from historical data that relate cost to technical parameters (e.g., weight, power, throughput). CERs are typically developed from databases of completed programs and are validated against historical actuals."
          },
          {
            id: 'q8',
            question: "Historical DoD program data shows that programs overrun their Milestone B estimates by approximately:",
            options: ['5-10%', '10-15%', '20-30%', '50-60%'],
            correct: 2,
            explanation: "DoD's own historical analysis shows programs overrun their Milestone B cost estimates by an average of 20-30%. This chronic \"optimism bias\" is why CAPE uses higher-confidence (P80) estimates and why Congress enacted Nunn-McCurdy to flag significant overruns."
          },
          {
            id: 'q9',
            question: "A Cost Estimating Relationship (CER) would be most useful for which type of cost analysis?",
            options: ['Validating a detailed contractor proposal after contract award', 'Estimating the cost of a new radar system using weight and frequency specifications as independent variables', 'Calculating earned value variances on an active contract', 'Preparing year-end financial closeout documentation'],
            correct: 1,
            explanation: "CERs are ideal for parametric estimation of new systems where cost can be related to measurable technical parameters. For a radar system, parameters like antenna size, peak power, and frequency range have well-established statistical relationships to cost that can drive early estimates."
          },
          {
            id: 'q10',
            question: "When a Nunn-McCurdy critical breach (25%) is declared, the primary consequence if USD(A&S) does not certify the program is:",
            options: ['A 1-year program freeze', 'Mandatory program restructuring with a new baseline', 'Program termination', 'Transfer to a different ACAT category'],
            correct: 2,
            explanation: "A Nunn-McCurdy critical breach requires certification by the USD(A&S) — the program must be re-validated as essential to national security, with reasonable cost and schedule. If USD(A&S) cannot certify the program, it must be terminated. This statutory requirement gives Congress significant leverage over poorly performing programs."
          }
        ]
      },
      // ── NEW LESSON: Finance-4 (Appropriations by Service / Color of Money) ──
      {
        id: 'finance-4',
        title: 'DoD Appropriations by Service: Color of Money',
        duration: '20 min',
        description: 'Master the specific appropriation accounts used across the Army, Navy, Air Force, and Marine Corps — and why using the wrong "color of money" is a federal violation.',
        keyTerms: [
          { term: 'TAS', definition: 'Treasury Account Symbol — the unique identifier for each appropriation account (e.g., AF 3400 for Air Force O&M).' },
          { term: 'O&M', definition: 'Operations & Maintenance — 1-year appropriation funding day-to-day operations, maintenance, and most services contracts.' },
          { term: 'RDT&E', definition: 'Research, Development, Test & Evaluation — 2-year appropriation funding research and development activities.' },
          { term: 'Procurement', definition: '3-year appropriation funding production and purchase of end-items (aircraft, ships, missiles, vehicles).' },
          { term: 'MILCON', definition: 'Military Construction — 5-year appropriation funding construction of military facilities.' },
          { term: 'Bona Fide Need Rule', definition: 'Funds may only be used to satisfy a legitimate, genuine need that arose during the period of availability.' },
          { term: 'Purpose Statute', definition: '31 U.S.C. § 1301 — appropriations may only be applied to the objects for which they were made.' },
          { term: 'Color of Money', definition: 'The appropriation type funding a particular contract line — mixing appropriation types on one CLIN is illegal.' },
          { term: 'Expired Funds', definition: 'Funds past their period of availability but still available for 5 years to adjust or pay existing obligations.' },
          { term: 'Canceled Funds', definition: 'Funds that have completed the 5-year expired period; permanently returned to the Treasury.' },
        ],
        content: [
          {
            type: 'text',
            heading: "Why \"Color of Money\" Can End Your Career",
            body: "Every appropriation type has strict statutory limits on what it can buy. Using RDT&E money to fund a production contract, or O&M money to fund a capital acquisition, is a federal violation of the Purpose Statute (31 U.S.C. § 1301). Program Managers who ignore these rules face potential Antideficiency Act violations, personal liability, and career termination. Understanding each appropriation's \"color\" — and matching the right color to the right expenditure — is non-negotiable."
          },
          {
            type: 'table',
            heading: "Major Appropriation Types: Rules & Period of Availability",
            headers: ['Appropriation', 'What It Funds', 'Period of Availability', 'Key Rule'],
            rows: [
              ['O&M', 'Operations, training, maintenance, most services contracts under $250K threshold', '1 Year', 'Cannot fund capital equipment > $250K or construction > $750K'],
              ['RDT&E', 'Research, development, prototypes, testing — from basic research through system development', '2 Years', 'Cannot fund production quantities; use ends at Milestone C'],
              ['Procurement', 'Production units, end-items: aircraft, ships, missiles, vehicles, major components', '3 Years', 'System must be past Milestone C / production-ready'],
              ['MILCON', 'Permanent construction of buildings, infrastructure, and facilities', '5 Years', 'Threshold $1.5M+; below threshold uses O&M (minor construction)'],
              ['MILPERS', 'Military pay, allowances, bonuses, PCS moves', '1 Year', 'Cannot fund civilian personnel or contractor costs'],
            ]
          },
          {
            type: 'text',
            heading: "The Three Laws Governing Appropriations Use",
            body: "Three statutory principles govern every spending decision in DoD: (1) The Purpose Statute (31 U.S.C. § 1301) — funds may only be used for what Congress intended. (2) The Time Statute (31 U.S.C. § 1502) — funds may only obligate for needs arising within their period of availability. (3) The Amount Statute / Antideficiency Act (31 U.S.C. §§ 1341, 1342) — cannot obligate more than was appropriated. Violating any of these three is a federal offense."
          },
          {
            type: 'table',
            heading: "Per-Service Treasury Account Symbols (TAS) — Key Accounts",
            headers: ['Service', 'Appropriation', 'TAS', 'What It Funds'],
            rows: [
              ['Air Force', 'O&M', '57-3400', 'AF operations, training, depot maintenance, most AF services'],
              ['Air Force', 'RDT&E', '57-3600', 'AF research, development, testing — from basic research to EMD'],
              ['Air Force', 'Aircraft Procurement', '57-3010', 'Procurement of AF aircraft (F-35A, C-130, KC-46, etc.)'],
              ['Air Force', 'Missile Procurement', '57-3020', 'Procurement of AF missiles (JASSM, AMRAAM, ICBM sustainment production)'],
              ['Air Force', 'Other Procurement AF', '57-3080', 'AF vehicles, C2 systems, comm equipment, training equipment'],
              ['Army', 'O&M', '21-2010 (2400)', 'Army operations, training, depot maintenance, most Army services'],
              ['Army', 'RDT&E', '21-0400 (2040)', 'Army research and development'],
              ['Army', 'Aircraft Procurement', '21-2010', 'Army rotary-wing aircraft (AH-64, UH-60, CH-47)'],
              ['Army', 'Missile Procurement', '21-2020', 'Army missiles (Patriot, Stinger, Javelin production)'],
              ['Army', 'Procurement of W&TCV', '21-2035', 'Wheeled & tracked combat vehicles (M1 Abrams, Bradley, Stryker)'],
              ['Army', 'Other Procurement Army', '21-2060', 'Army C4I, aircraft modifications, soldier systems'],
              ['Navy', 'O&M (Navy)', '17-1453', 'Navy operations, training, base support'],
              ['Navy', 'O&M (Marine Corps)', '17-1105', 'USMC operations and training'],
              ['Navy', 'Aircraft Procurement Navy', '17-1506', 'Navy/USMC aircraft (F/A-18, F-35B/C, E-2D, P-8)'],
              ['Navy', 'Weapons Procurement Navy', '17-1507', 'Navy weapons (Tomahawk, Standard Missile, torpedoes)'],
              ['Navy', 'Shipbuilding & Conversion', '17-1611', 'Construction and conversion of Navy vessels (CVN, DDG, SSN)'],
              ['Navy', 'Other Procurement Navy', '17-1804', 'Navy C4ISR, shore activities, training equipment'],
              ['Navy', 'Procurement Marine Corps', '17-1109', 'USMC procurement (AAV, LAV, ground equipment)'],
              ['Defense-Wide', 'O&M Defense-Wide', '97-0400 (0100)', 'DISA, DLA, SOCOM, and other defense agencies operations'],
              ['Defense-Wide', 'RDT&E Defense-Wide', '97-0400 (0603)', 'DARPA, MDA, and other defense agency R&D'],
            ]
          },
          {
            type: 'callout',
            heading: "The AF 3400 Account — A PM's Daily Reality",
            body: "Air Force 3400 (O&M) is the most frequently used appropriation in day-to-day AF program management. It funds training, logistics, maintenance, most advisory & assistance services, and sustainment contracts. When PMs confuse 3400 (O&M) with 3600 (RDT&E) — for example, using 3400 to pay for developmental testing — they violate the Purpose Statute. Always ask: \"Is this work developing/testing a new capability (RDT&E), buying a production item (Procurement), or sustaining/operating an existing capability (O&M)?\""
          },
          {
            type: 'formula',
            heading: "The Appropriation Decision Framework",
            formula: 'Is it research/development/testing? → RDT&E\nIs it buying production units/end items? → Procurement (aircraft, ships, missiles, vehicles)\nIs it day-to-day operations/maintenance/services? → O&M\nIs it permanent construction ($1.5M+)? → MILCON\nIs it military pay/allowances? → MILPERS',
            explanation: "Apply this framework before every obligation decision. When in doubt, consult your budget officer. The consequences of misusing appropriations are serious — every obligation must be traceable to the correct appropriation type."
          },
          {
            type: 'text',
            heading: "What Happens When Funds Expire and Cancel",
            body: "After a fund's period of availability ends, unobligated balances enter \"expired\" status for 5 years. During this period, the funds can still be used to adjust existing obligations (e.g., pay a contract invoice that was obligated on time). After the 5-year expired window, funds are permanently \"cancelled\" and returned to the Treasury — they cannot be used for any purpose. A FY2024 O&M obligation that generates an invoice in FY2028 is still payable; a FY2024 O&M invoice arriving in FY2031 cannot be paid from those funds."
          },
          {
            type: 'tip',
            heading: "Real Example: Buying a Radar System",
            body: "A new radar program follows this funding progression: Basic research uses RDT&E (3600 for AF). Engineering development and testing uses RDT&E. First production units use Procurement (3080 for AF). Fielded radar maintenance and upgrades use O&M (3400 for AF). Training operators uses O&M. Building a radar maintenance facility uses MILCON. The same physical system touches four different appropriation accounts over its life."
          }
        ],
        quiz: [
          {
            id: 'q1',
            question: "What is the Air Force Treasury Account Symbol (TAS) for Operations & Maintenance funds?",
            options: ['57-3600', '57-3010', '57-3400', '57-3080'],
            correct: 2,
            explanation: "The Air Force O&M appropriation is identified by TAS 57-3400 (commonly called \"3400 money\"). It has a 1-year period of availability and funds day-to-day AF operations, training, maintenance, and most services contracts. 3600 is RDT&E, 3010 is Aircraft Procurement, and 3080 is Other Procurement."
          },
          {
            id: 'q2',
            question: "Which statutory principle states that appropriations may only be used for the purposes Congress intended?",
            options: ['Anti-Deficiency Act', 'Bona Fide Need Rule', 'Purpose Statute (31 U.S.C. § 1301)', 'Time Statute (31 U.S.C. § 1502)'],
            correct: 2,
            explanation: "The Purpose Statute (31 U.S.C. § 1301) is the core rule that each appropriation may only be applied to its intended purpose. Using O&M funds for procurement, or RDT&E for O&M activities, violates this statute — regardless of whether sufficient funds exist."
          },
          {
            id: 'q3',
            question: "RDT&E appropriations have what period of availability?",
            options: ['1 year', '2 years', '3 years', '5 years'],
            correct: 1,
            explanation: "RDT&E appropriations have a 2-year period of availability, reflecting the multi-year nature of development activities. O&M has 1 year, Procurement has 3 years, and MILCON has 5 years."
          },
          {
            id: 'q4',
            question: "The Navy's Shipbuilding & Conversion (SCN) appropriation uses which Treasury Account Symbol?",
            options: ['17-1506', '17-1507', '17-1611', '17-1804'],
            correct: 2,
            explanation: "Navy Shipbuilding & Conversion (SCN) uses TAS 17-1611. This is the appropriation that funds construction of Navy vessels — carriers (CVN), destroyers (DDG), submarines (SSN/SSBN), and amphibious ships. 17-1506 is Aircraft Procurement Navy, 17-1507 is Weapons Procurement Navy, and 17-1804 is Other Procurement Navy."
          },
          {
            id: 'q5',
            question: "An Army program wants to buy 500 Javelin anti-tank missile systems in production. Which appropriation should be used?",
            options: ['Army O&M (2400)', 'Army RDT&E', 'Army Missile Procurement (21-2020)', 'Army Other Procurement (21-2060)'],
            correct: 2,
            explanation: "Production quantities of guided missiles are funded with Procurement appropriations. For the Army, Missile Procurement (TAS 21-2020) specifically funds production of missiles including Javelin, Patriot, and Stinger. Using O&M or RDT&E for production purchases would violate the Purpose Statute."
          },
          {
            id: 'q6',
            question: "The Bona Fide Need Rule requires that appropriated funds be used for:",
            options: ['The most cost-effective solution available', 'Needs that legitimately arose during the appropriation\'s period of availability', 'Purchases over $250K only', 'Programs listed in the FYDP'],
            correct: 1,
            explanation: "The Bona Fide Need Rule (31 U.S.C. § 1502(a)) requires that funds obligated must meet a legitimate need that arose during the fund's period of availability. For example, you cannot use FY2025 O&M funds in FY2025 to pre-pay for services entirely to be delivered in FY2027 — the need hasn't arisen yet."
          },
          {
            id: 'q7',
            question: "After a fund's period of availability expires, the unobligated balance enters \"expired\" status. For how many additional years can these expired funds still be used to pay existing obligations?",
            options: ['1 year', '2 years', '5 years', 'They cannot be used at all'],
            correct: 2,
            explanation: "After the period of availability ends, funds enter a 5-year expired period during which they can still adjust or liquidate existing obligations (pay invoices on contracts that were properly obligated during the availability period). After 5 years, the funds are permanently cancelled and returned to the Treasury."
          },
          {
            id: 'q8',
            question: "Which Air Force appropriation specifically funds the procurement of aircraft such as the F-35A and KC-46?",
            options: ['57-3400 (O&M)', '57-3600 (RDT&E)', '57-3010 (Aircraft Procurement)', '57-3080 (Other Procurement AF)'],
            correct: 2,
            explanation: "TAS 57-3010 — Aircraft Procurement, Air Force — funds the production purchase of Air Force aircraft including the F-35A, KC-46 tanker, C-130J, and B-21. RDT&E (3600) funds their development and testing, while O&M (3400) funds sustainment after fielding."
          },
          {
            id: 'q9',
            question: "A program manager uses O&M funds to construct a new $2 million maintenance facility. This likely violates:",
            options: ['The Bona Fide Need Rule only', 'The Time Statute only', 'The Purpose Statute — construction over $750K threshold requires MILCON appropriations', 'No rule, since O&M can fund any maintenance-related activity'],
            correct: 2,
            explanation: "Permanent construction above $1.5M ($750K in some contexts) generally requires MILCON appropriations — not O&M. Using O&M for construction that should be MILCON violates the Purpose Statute. \"Minor construction\" below threshold may use O&M, but a $2M facility exceeds that threshold."
          },
          {
            id: 'q10',
            question: "DARPA's research and development funding falls under which Defense-Wide appropriation?",
            options: ['97-0400 (O&M Defense-Wide)', '97-0400 (RDT&E Defense-Wide)', '17-1506 (Aircraft Procurement Navy)', '57-3600 (RDT&E Air Force)'],
            correct: 1,
            explanation: "DARPA, the Missile Defense Agency (MDA), and other defense-wide R&D activities are funded through RDT&E Defense-Wide appropriations (TAS 97-0603/0400 series). Each Service has its own RDT&E account (Air Force 3600, Army 2040, Navy 1319), but DARPA and other OSD-level agencies use the Defense-Wide account."
          }
        ]
      }
    ]
  },

  // ─────────────────────────────────────────────────────────────
  // MODULE 3 — CONTRACTS
  // ─────────────────────────────────────────────────────────────
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
          { term: 'FFP', definition: 'Firm-Fixed-Price — price is set at award and does not change. Contractor bears 100% of cost risk. Most preferred by FAR. Used when requirements are well-defined and market competition exists. (FAR 16.202)' },
          { term: 'FPIF', definition: 'Fixed-Price Incentive (Firm Target) — has a target cost, target fee, ceiling price, and share ratio. Contractor and government share cost savings/overruns up to the ceiling. Above the Point of Total Assumption (PTA), contractor absorbs 100%. (FAR 16.403-1)' },
          { term: 'CPFF', definition: 'Cost-Plus-Fixed-Fee — government reimburses all allowable costs plus a fixed fee that does not change with cost performance. Contractor has no financial incentive to control costs. Used for R&D and early development where costs cannot be estimated. (FAR 16.306)' },
          { term: 'CPIF', definition: 'Cost-Plus-Incentive-Fee — government reimburses all allowable costs, and the fee adjusts based on cost performance against a target. If the contractor beats the target cost, fee goes up; if they overspend, fee goes down. Still cost-reimbursable — government pays all costs regardless. (FAR 16.304)' },
          { term: 'CPAF', definition: 'Cost-Plus-Award-Fee — government reimburses all allowable costs plus a base fee, with additional award fee determined subjectively by a Fee Determining Official (FDO) based on periodic performance evaluations. Unlike CPIF, the award fee is not tied to a formula — it is a judgment call. Used when performance quality matters more than cost control. (FAR 16.305)' },
          { term: 'T&M', definition: 'Time & Materials — contractor is paid fixed hourly labor rates plus actual material costs. Government bears essentially all cost risk since there is no ceiling on hours. Requires CO surveillance and a not-to-exceed ceiling. D&F required to justify use. (FAR 16.601)' },
          { term: 'Share Ratio', definition: 'In incentive contracts, the split of cost savings or overruns between government and contractor (e.g., 80/20 means government absorbs 80¢ and contractor keeps/loses 20¢ of every dollar above/below target cost).' },
          { term: 'PTA', definition: 'Point of Total Assumption — on an FPIF contract, the cost level at which the contractor has lost all its fee and begins absorbing 100% of additional costs. Above the PTA, the contract behaves like FFP.' },
          { term: 'D&F', definition: 'Determination and Findings — a documented government decision required to justify use of certain contract types (e.g., T&M, cost-reimbursable) or acquisition actions that deviate from standard FAR policy.' },
        ],
        content: [
          {
            type: 'text',
            heading: "Contract Type = Risk Allocation",
            body: "Choosing the right contract type is one of the most consequential decisions in acquisition strategy. Contract type determines who bears cost risk — the government or the contractor. The FAR's overarching principle is clear: use firm-fixed-price whenever possible. When market conditions, technology maturity, or performance uncertainty prevent FFP, you move along the spectrum toward cost-reimbursable contracts — but each step increases government risk and oversight burden."
          },
          {
            type: 'table',
            heading: "The Contract Type Spectrum",
            headers: ['Type', 'Full Name', 'Who Bears Risk?', 'Best Used When', 'FAR Ref'],
            rows: [
              ['FFP',    'Firm-Fixed-Price',                  'Contractor (100%)',  'Well-defined requirements; stable design; competitive market', 'FAR 16.202'],
              ['FPIF',   'Fixed-Price Incentive (Firm)',       'Shared via formula', 'Design fairly mature; some cost uncertainty remains', 'FAR 16.403'],
              ['CPIF',   'Cost-Plus-Incentive-Fee',           'Shared via formula', 'Development programs where cost targets can be set', 'FAR 16.304'],
              ['CPAF',   'Cost-Plus-Award-Fee',               'Mostly Government',  'Complex services where performance quality is hard to quantify', 'FAR 16.305'],
              ['CPFF',   'Cost-Plus-Fixed-Fee',               'Government (100%)',  'Early R&D; high tech risk; level-of-effort work', 'FAR 16.306'],
              ['T&M',    'Time & Materials',                  'Government (100%)',  'Cannot define hours/effort upfront; last resort; D&F required', 'FAR 16.601'],
            ]
          },
          {
            type: 'list',
            heading: 'Contract Type Definitions — Know These Cold',
            items: [
              'FFP (Firm-Fixed-Price): Price locked at award. Contractor eats every dollar over budget. Government pays nothing extra. Maximum incentive for contractor efficiency.',
              'FPIF (Fixed-Price Incentive Firm): Starts like FFP with a target cost and ceiling price. Cost savings/overruns are shared via a ratio (e.g., 80/20) until the Point of Total Assumption (PTA), where contractor absorbs 100%.',
              'CPIF (Cost-Plus-Incentive-Fee): Government pays all allowable costs. Contractor fee goes up if they beat the target cost, down if they overspend — but they always get reimbursed. Incentive is on cost performance.',
              'CPAF (Cost-Plus-Award-Fee): Government pays all allowable costs plus a base fee. Additional award fee is determined subjectively by a Fee Determining Official (FDO) after each evaluation period. No formula — purely judgment-based. Incentive is on performance quality.',
              'CPFF (Cost-Plus-Fixed-Fee): Government pays all allowable costs plus a fixed fee that never changes regardless of actual cost. No financial incentive for contractor to control costs. Used for early R&D where cost estimation is impossible.',
              'T&M (Time & Materials): Government pays hourly labor rates plus materials at cost. No cap on hours unless a ceiling is set. Least preferred — requires a D&F that no other type is suitable and active CO surveillance.',
            ]
          },
          {
            type: 'risk_chart',
          },
          {
            type: 'callout',
            heading: "The FAR's Hierarchy of Preference",
            body: "FAR 16.103(d) requires the contracting officer to document the contract type selection rationale in the written acquisition plan. The presumption is FFP. Every step away from FFP must be justified. An undocumented contract type decision is a significant finding in a contract audit."
          },
          {
            type: 'formula',
            heading: "Incentive Contract Math",
            formula: 'Target Cost (TC): $10M | Target Fee (TF): $1M | Share Ratio: 80/20 (Gov/Contractor)\nIf actual cost = $9M (under target by $1M): Contractor earns TF + 20% × $1M = $1.2M fee\nIf actual cost = $11M (over target by $1M): Contractor earns TF - 20% × $1M = $0.8M fee\nPoint of Total Assumption (PTA): Where contractor absorbs 100% of overrun',
            explanation: "In incentive contracts, sharing ratios motivate cost control. A 80/20 share ratio means for every dollar saved, the contractor keeps 20 cents. The PTA is critical — above it, all risk falls on the contractor (like FFP ceiling)."
          },
          {
            type: 'warning',
            heading: "T&M Contracts Require Special Justification",
            body: "Time & Materials (T&M) and Labor-Hour (LH) contracts provide the least incentive for efficient performance. FAR 16.601(c) requires a D&F (Determination and Findings) that no other contract type is suitable. T&M contracts must also have a ceiling price that the contractor cannot exceed without CO approval."
          },
          {
            type: 'tip',
            heading: "Contract Type in Development Programs",
            body: "Defense development programs often evolve through contract types: CPFF or CPIF during early development (high technical risk), transitioning to FPIF as design matures, then FFP for production. This progression mirrors the risk reduction achieved through the acquisition lifecycle."
          }
        ],
        quiz: [
          {
            id: 'q1',
            question: "Which contract type places 100% of cost risk on the contractor and is most preferred by the FAR?",
            options: ['Cost-Plus-Fixed-Fee (CPFF)', 'Fixed-Price-Incentive-Firm (FPIF)', 'Firm-Fixed-Price (FFP)', 'Time & Materials (T&M)'],
            correct: 2,
            explanation: "Firm-Fixed-Price (FFP) is the government's most preferred contract type because it places maximum cost risk on the contractor, creating the strongest incentive for efficiency. Under FFP, if the contractor spends more than the agreed price, it absorbs the loss."
          },
          {
            id: 'q2',
            question: "On a Cost-Plus-Incentive-Fee contract with a 70/30 share ratio, if the contractor comes in $2M under the target cost, how much additional fee do they earn?",
            options: ['$2M', '$1.4M', '$0.6M', '$0.7M'],
            correct: 2,
            explanation: "With a 70/30 (Government/Contractor) share ratio, the contractor earns 30% of cost savings. On a $2M underrun: contractor additional fee = 30% × $2M = $0.6M added to their target fee. The government retains 70% of the savings ($1.4M)."
          },
          {
            id: 'q3',
            question: "A Time & Materials contract requires what special documentation before award?",
            options: ['A Nunn-McCurdy waiver', 'A Determination and Findings (D&F) that no other contract type is suitable', 'Congressional notification', 'A GAO protest review'],
            correct: 1,
            explanation: "Per FAR 16.601(d), T&M and Labor-Hour contracts require a written D&F (Determination and Findings) signed by the contracting officer (or higher official for contracts over $1M) justifying that no other contract type is suitable. T&M provides the least incentive for efficiency and must be used only when necessary."
          },
          {
            id: 'q4',
            question: "The Point of Total Assumption (PTA) on a Fixed-Price Incentive Firm (FPIF) contract is the point at which:",
            options: ['The government assumes 100% of remaining cost risk', 'The contractor assumes 100% of cost overruns above the ceiling price', 'The target fee is fully earned', 'The contract converts to cost-plus'],
            correct: 1,
            explanation: "The PTA on an FPIF contract is the cost level at which the contractor absorbs 100% of additional costs — effectively making it FFP above that point. Beyond the PTA, the contractor's fee has been entirely eroded by the cost overrun sharing."
          },
          {
            id: 'q5',
            question: "Which contract type is most appropriate for a program in early technology development where cost and technical scope cannot be well-defined?",
            options: ['FFP', 'FPIF', 'CPFF', 'BPA'],
            correct: 2,
            explanation: "CPFF (Cost-Plus-Fixed-Fee) is appropriate when technical risk is high and costs cannot be reliably estimated. The government pays all allowable costs plus a fixed fee that does not change with cost performance. It is the standard for early R&D work covered by FAR Part 35."
          },
          {
            id: 'q6',
            question: "Under FAR 16.103, what must the contracting officer document to justify the chosen contract type?",
            options: ['A cost analysis certified by the comptroller', 'Written rationale in the acquisition plan explaining why the chosen type is appropriate', 'Congressional approval for non-FFP contracts', 'A GAO pre-award review'],
            correct: 1,
            explanation: "FAR 16.103(d) requires the contracting officer to document the contract type selection rationale in the written acquisition plan. This is a standard audit requirement — unsupported contract type decisions are a common finding in IG and GAO reviews."
          },
          {
            id: 'q7',
            question: "A Cost-Plus-Award-Fee (CPAF) contract is distinguished from CPIF in that the award fee is:",
            options: ['Calculated using a fixed formula tied to cost performance', 'Subjectively determined by the government based on overall performance evaluation', 'Paid automatically at contract completion', 'The same as the base fee on a CPFF contract'],
            correct: 1,
            explanation: "CPAF award fees are subjectively evaluated by a government Fee Determining Official (FDO) based on qualitative performance criteria. This makes CPAF useful for service contracts where the quality of performance matters most. CPIF, by contrast, uses a formula-based fee tied to measurable cost targets."
          },
          {
            id: 'q8',
            question: "Which contract type is specifically PROHIBITED for use with commercial items under FAR Part 12?",
            options: ['FFP', 'FPIF', 'Cost-reimbursable contracts (CPFF, CPIF, CPAF)', 'T&M'],
            correct: 2,
            explanation: "FAR 12.207 prohibits the use of cost-reimbursable contracts for the acquisition of commercial items. Commercial items must use FFP, FPIF, or T&M/LH contract types. This rule reflects the commercial marketplace reality that vendors sell at firm prices, not on a cost-reimbursable basis."
          },
          {
            id: 'q9',
            question: "What is the primary advantage of an FPIF contract over a pure FFP contract for a development program?",
            options: ['FPIF requires less government oversight', 'FPIF shares cost risk while still incentivizing cost control', 'FPIF allows the contractor unlimited cost reimbursement', 'FPIF requires no competition'],
            correct: 1,
            explanation: "FPIF shares cost risk between government and contractor through a negotiated share ratio, while maintaining a firm ceiling price. This is appropriate when some cost uncertainty exists but a pure cost-plus arrangement is not warranted. The incentive structure motivates the contractor to control costs without fully absorbing unpredictable risk."
          },
          {
            id: 'q10',
            question: "The FAR preference for contract type selection, in order from most to least preferred, is:",
            options: ['T&M → CPFF → FPIF → FFP', 'FFP → FPIF → CPIF → CPFF → T&M', 'CPFF → FFP → T&M', 'CPIF → FFP → CPFF → T&M'],
            correct: 1,
            explanation: "The FAR preference order moves from maximum contractor risk (FFP) to maximum government risk (T&M/CPFF): FFP → FPI → Cost-Reimbursable (CPIF, CPFF, CPAF) → T&M/LH. Each step requires additional justification and imposes greater government oversight obligations."
          },
          {
            id: 'q11',
            type: 'drag_order',
            question: "Order these contract types from HIGHEST contractor risk to LOWEST contractor risk:",
            options: [],
            correct: 0,
            explanation: "FFP places 100% cost risk on the contractor — they absorb every dollar over budget. FPIF shares risk via a formula up to the ceiling/PTA. CPIF reimburses all costs with incentive fee adjustments. CPAF reimburses all costs with subjective award fee. T&M reimburses hours + materials with no ceiling unless set — government bears virtually all cost risk.",
            orderedItems: [
              "FFP — Firm-Fixed-Price (Contractor 100%)",
              "FPIF — Fixed-Price Incentive Firm (Shared, formula-based)",
              "CPIF — Cost-Plus-Incentive-Fee (Mostly Government)",
              "CPAF — Cost-Plus-Award-Fee (Mostly Government, subjective)",
              "T&M — Time & Materials (Government ~100%)"
            ]
          },
          {
            id: 'q12',
            type: 'drag_match',
            question: "Match each contract type to the scenario where it is MOST appropriate:",
            options: [],
            correct: 0,
            explanation: "Contract type selection must match the risk environment. FFP works when requirements are stable and competition exists. FPIF works when some cost uncertainty remains but a ceiling is feasible. CPFF works for early R&D where you truly can't estimate cost. T&M requires a D&F and is the last resort when effort is completely undefined.",
            pairs: [
              { left: 'FFP', right: 'Stable requirements, mature design, competitive market' },
              { left: 'FPIF', right: 'Design mostly mature; some cost uncertainty remains' },
              { left: 'CPFF', right: 'Early R&D; cost cannot be estimated with any confidence' },
              { left: 'T&M', right: 'Undefined hours/effort; last resort; D&F required' }
            ]
          }
        ]
      },
      {
        id: 'contracts-2',
        title: 'Source Selection: How the Government Chooses',
        duration: '15 min',
        description: 'Walk through the source selection process from RFP to award decision.',
        keyTerms: [
          { term: 'RFP', definition: 'Request for Proposal — the government\'s solicitation document inviting offerors to submit proposals.' },
          { term: 'SSEB', definition: 'Source Selection Evaluation Board — the team that evaluates proposals against established criteria.' },
          { term: 'SSAC', definition: 'Source Selection Advisory Council — senior advisory body that reviews SSEB results.' },
          { term: 'SSA', definition: 'Source Selection Authority — the individual with authority to make the award decision.' },
          { term: 'LPTA', definition: 'Lowest Price Technically Acceptable — award to the lowest priced proposal that meets minimum requirements.' },
          { term: 'Best Value', definition: 'Award to the proposal offering the best combination of technical merit and price.' },
          { term: 'Past Performance', definition: 'An evaluation factor assessing the offeror\'s track record on similar contracts.' },
        ],
        content: [
          {
            type: 'text',
            heading: "The Source Selection Process",
            body: "Source selection is the competitive process by which the government evaluates proposals and selects a contractor. For most DoD acquisitions above the simplified acquisition threshold ($250K), competition is required by the Competition in Contracting Act (CICA). The process must be objective, documented, and defensible — any deviation from the stated evaluation criteria is grounds for a GAO bid protest."
          },
          {
            type: 'list',
            heading: "Source Selection Steps",
            items: [
              'Step 1: Develop Acquisition Strategy — contract type, competition, evaluation approach',
              'Step 2: Draft RFP — Sections L (instructions) and M (evaluation factors) are most critical',
              'Step 3: Issue Draft RFP — industry review and comment period (30-45 days typical)',
              'Step 4: Issue Final RFP — proposals due date typically 45-60 days out',
              'Step 5: SSEB Evaluation — each proposal scored against stated evaluation factors',
              'Step 6: Competitive Range Determination — eliminate clearly unacceptable proposals',
              'Step 7: Discussions (if applicable) — exchanges with offerors in competitive range',
              'Step 8: Final Proposal Revisions — offerors submit best and final offers (BAFOs)',
              'Step 9: SSAC Review — advisory recommendation to the SSA',
              'Step 10: SSA Award Decision — documented source selection decision statement',
            ]
          },
          {
            type: 'table',
            heading: "LPTA vs. Best Value Tradeoff",
            headers: ['Approach', 'When to Use', 'Risk', 'Example'],
            rows: [
              ['LPTA', 'Well-defined requirements; commoditized services; minimal performance variation', 'Risk of minimum acceptable quality', 'Janitorial services, standard IT help desk'],
              ['Best Value Tradeoff', 'Complex programs; performance matters; clear benefit to paying more', 'More subjective; higher protest risk', 'Software development, systems integration'],
              ['Value Adjusted Total Evaluated Price (VATEP)', 'When non-cost factors can be monetized', 'Requires thorough methodology', 'Logistics support with reliability trade-offs'],
            ]
          },
          {
            type: 'callout',
            heading: "The \"Equal\" Evaluation Obligation",
            body: "Every offeror must be evaluated against the same factors, using the same standards. If the SSEB gives credit to offeror A for a feature not mentioned in Section L, and the same feature is overlooked in offeror B's proposal, that is a basis for a successful bid protest. Disciplined source selection panels document every finding."
          },
          {
            type: 'tip',
            heading: "Protest Risk Management",
            body: "GAO bid protest rates have risen steadily. Best practices to minimize protest risk: use clear, specific evaluation criteria in Section M; document all evaluation findings with specific proposal citations; ensure debriefs are conducted professionally within 5 days of request; never deviate from stated evaluation factors regardless of CO or PM preference."
          }
        ],
        quiz: [
          {
            id: 'q1',
            question: "Which RFP section describes the evaluation factors and their relative importance used to select the contractor?",
            options: ['Section L', 'Section M', 'Section C', 'Section H'],
            correct: 1,
            explanation: "Section M of a DoD RFP contains the evaluation factors and their relative importance (e.g., Technical > Past Performance > Price, or they may be listed as equal). Section L contains the instructions for proposal preparation. Offerors must directly address Section L requirements, knowing they'll be evaluated against Section M."
          },
          {
            id: 'q2',
            question: "LPTA (Lowest Price Technically Acceptable) is most appropriate when:",
            options: ['The acquisition is for a complex, technically challenging development program', 'Requirements are well-defined and there is minimal performance benefit to paying more', 'Past performance is the most important evaluation factor', 'International competition is expected'],
            correct: 1,
            explanation: "LPTA is used when requirements can be expressed precisely and performance above the minimum offers no added value. It's common for commodity services (janitorial, food service, standard IT maintenance). For complex programs where better performance justifies higher cost, Best Value Tradeoff is more appropriate."
          },
          {
            id: 'q3',
            question: "The Source Selection Authority (SSA) is the individual who:",
            options: ['Evaluates proposals on the SSEB', 'Has final authority to make the contract award decision', 'Chairs the Source Selection Advisory Council', 'Prepares the government\'s independent cost estimate'],
            correct: 1,
            explanation: "The SSA is the senior official with final authority to make the source selection decision and execute the award. Depending on program value, the SSA may be the CO, PEO, or even a senior Service official. The SSA reviews the SSAC recommendation but is not bound by it — and must document the rationale for any deviation."
          },
          {
            id: 'q4',
            question: "A contractor files a GAO bid protest after losing a contract award. What is the standard GAO resolution timeframe?",
            options: ['30 days', '60 days', '100 days', '180 days'],
            correct: 2,
            explanation: "GAO is required to issue a decision within 100 days of the protest filing. An express option exists for 65 days. During this time, performance on the protested contract is typically suspended unless the agency overrides the stay. This 100-day window creates significant program schedule risk."
          },
          {
            id: 'q5',
            question: "The Competition in Contracting Act (CICA) requires competition for most DoD acquisitions above what threshold?",
            options: ['$10,000', '$25,000', '$250,000 (Simplified Acquisition Threshold)', '$1,000,000'],
            correct: 2,
            explanation: "CICA requires full and open competition for acquisitions above the Simplified Acquisition Threshold (SAT), currently $250,000. Below the SAT, simplified acquisition procedures apply. Sole-source awards above the SAT require a written Justification and Approval (J&A)."
          },
          {
            id: 'q6',
            question: "During source selection, the Competitive Range Determination is used to:",
            options: ['Set the government\'s should-cost estimate range', 'Identify proposals with a reasonable chance of award to focus discussions', 'Determine whether LPTA or Best Value applies', 'Establish the price range for negotiations'],
            correct: 1,
            explanation: "The Competitive Range Determination (FAR 15.306) identifies which offerors have a reasonable chance of being selected for award, allowing the government to focus discussions on viable competitors. Proposals outside the competitive range are eliminated. However, COs must document this decision carefully as exclusions are a common protest basis."
          },
          {
            id: 'q7',
            question: "Discussions during source selection (FAR 15.306) must be conducted with:",
            options: ['Only the incumbent contractor', 'All offerors, regardless of technical rating', 'All offerors within the competitive range equally', 'Only offerors whose price is within 10% of the lowest bid'],
            correct: 2,
            explanation: "FAR 15.306 requires that if discussions are held, they must be conducted with all offerors in the competitive range. The government must address significant weaknesses or deficiencies with each offeror. Engaging only certain offerors is a violation and a strong basis for a successful protest."
          },
          {
            id: 'q8',
            question: "What is a \"best value tradeoff\" analysis primarily used to determine?",
            options: ['Which offeror has the lowest cost per unit', 'Whether the additional technical merit of a higher-priced proposal justifies the price premium', 'The maximum price the government is willing to pay', 'The government\'s should-cost estimate'],
            correct: 1,
            explanation: "Best Value Tradeoff analysis weighs technical merit, past performance, and price against each other. The SSA must document that any price premium paid over the lowest-priced technically acceptable offer is justified by demonstrably superior technical or performance features."
          },
          {
            id: 'q9',
            question: "A offeror requests a debriefing after losing a source selection. The government is required to provide the debriefing within:",
            options: ['5 business days of the request', '10 business days of request', '30 calendar days of award', 'Only if required by statute'],
            correct: 0,
            explanation: "FAR 15.505-15.506 requires that post-award debriefings be provided within 5 business days of the debriefing request. Timely, professional debriefs are critical — they help contractors improve future proposals and reduce protest likelihood by explaining the award rationale."
          },
          {
            id: 'q10',
            question: "The SSEB (Source Selection Evaluation Board) evaluates proposals against which established document?",
            options: ['The government\'s cost estimate', 'The evaluation criteria published in Section M of the RFP', 'The offeror\'s past performance database only', 'The program office\'s internal scoring matrix not shared with offerors'],
            correct: 1,
            explanation: "The SSEB evaluates every proposal exclusively against the criteria and standards stated in Section M of the RFP. Using unstated criteria or changing the evaluation standard mid-process is a violation of FAR Part 15 and the basis for a successful protest. Consistency and documentation are the SSEB's most important obligations."
          }
        ]
      },
      {
        id: 'contracts-3',
        title: 'Contract Administration & COR Fundamentals',
        duration: '14 min',
        description: 'Learn how contracts are administered after award and the critical role of the COR.',
        keyTerms: [
          { term: 'ACO', definition: 'Administrative Contracting Officer — responsible for contract administration after award.' },
          { term: 'DCMA', definition: 'Defense Contract Management Agency — the primary government agency for DoD contract administration.' },
          { term: 'CDRL', definition: 'Contract Data Requirements List — the official list of data deliverables required under the contract.' },
          { term: 'SOW', definition: 'Statement of Work — defines the technical requirements and work the contractor must perform.' },
          { term: 'PWS', definition: 'Performance Work Statement — outcome-based work description focused on desired results, not methods.' },
          { term: 'Constructive Change', definition: 'An informal action by the government that changes contract scope without a formal contract modification.' },
        ],
        content: [
          {
            type: 'text',
            heading: "The Post-Award Phase",
            body: "Contract award is not the end — it's the beginning of the most critical phase. The vast majority of cost growth, schedule delays, and disputes occur during contract administration, not before award. A program office that does excellent source selection but weak contract administration will still fail. Understanding the roles of the CO, ACO, COR, and DCMA is essential for any PM."
          },
          {
            type: 'table',
            heading: "Key Contract Administration Roles",
            headers: ['Role', 'Responsibility', 'Key Authority'],
            rows: [
              ['PCO', 'Award and modification authority; contract terms and conditions', 'Only one who can change contract scope or price'],
              ['ACO', 'Day-to-day administration; payments; contractor compliance', 'Can approve interim payments; suspend work'],
              ['COR', 'Technical oversight; performance monitoring; CDRL acceptance', 'NO contract authority — advisory only to CO'],
              ['DCMA', 'On-site contractor oversight; quality, delivery, and finance surveillance', 'Can withhold payment for non-conforming items'],
            ]
          },
          {
            type: 'warning',
            heading: "The Constructive Change Trap",
            body: "A \"constructive change\" occurs when a government action effectively changes the contract's scope, schedule, or cost without a formal contract modification. Common examples: a COR directing \"a little extra work,\" a PM verbally approving scope expansion, or government-caused delays. These are legally binding and can result in large, retroactive contractor claims. All changes must go through the CO via a formal contract modification (mod)."
          },
          {
            type: 'list',
            heading: "Critical COR Responsibilities",
            items: [
              'Monitor contractor performance against the PWS/SOW and CDRLs daily/weekly',
              'Document all contractor communications — emails, meeting minutes, phone notes',
              'Review and accept/reject deliverables within the specified timeframe',
              'Notify the CO immediately of any performance deficiencies, schedule slips, or scope issues',
              'Maintain a surveillance plan and daily/weekly surveillance records',
              'Never direct the contractor to do work not in the contract scope — that creates constructive changes',
              'Track invoices against actual work performed; do not accept invoices for work not completed',
            ]
          },
          {
            type: 'callout',
            heading: "CDRL Management",
            body: "CDRLs (Contract Data Requirements Lists, DD Form 1423) are the formal mechanism for requiring data deliverables from contractors. A PM who fails to review CDRLs on time and provide Government Furnished Information (GFI) on schedule may inadvertently waive the government's right to reject substandard work or trigger an excusable delay claim. Every CDRL has a review period — track them religiously."
          },
          {
            type: 'tip',
            heading: "QASP and Surveillance",
            body: "Every services contract should have a Quality Assurance Surveillance Plan (QASP). The QASP defines how the government will monitor performance, what metrics are tracked, and what constitutes acceptable performance. A well-executed QASP provides the documentation needed to support negative past performance ratings, withhold award fees, or terminate for cause."
          }
        ],
        quiz: [
          {
            id: 'q1',
            question: "Which individual is the ONLY person with authority to change a contract's scope, price, or delivery schedule?",
            options: ['Program Manager', 'COR (Contracting Officer\'s Representative)', 'Contracting Officer (CO)', 'DCMA Quality Assurance Representative'],
            correct: 2,
            explanation: "Only a warranted Contracting Officer (CO) with appropriate authority has legal power to modify a contract. The PM, COR, and government technical personnel cannot direct changes to scope, price, or schedule. Doing so creates an unauthorized commitment and potential constructive change claim."
          },
          {
            id: 'q2',
            question: "DCMA (Defense Contract Management Agency) primarily provides which service to DoD?",
            options: ['Contract award and source selection support', 'On-site contractor oversight including quality, delivery, and financial surveillance', 'Independent cost estimates for program offices', 'Legal review of contract disputes'],
            correct: 1,
            explanation: "DCMA provides post-award contract administration and on-site oversight at contractor facilities, including quality assurance, production surveillance, delivery monitoring, EVMS surveillance, and property management. They act as the government's eyes and ears at the contractor's facility."
          },
          {
            id: 'q3',
            question: "A constructive change claim may arise when:",
            options: ['A CO issues a formal bilateral modification', 'A COR verbally directs the contractor to perform work beyond the contract scope', 'DCMA approves a contractor\'s quality plan', 'An offeror submits a proposal for additional work'],
            correct: 1,
            explanation: "A constructive change occurs when a government action — including informal direction from a COR or government technical personnel — effectively changes contract scope without a formal modification. The contractor can file a claim for the additional cost. All scope direction must go through the CO via formal contract modification."
          },
          {
            id: 'q4',
            question: "The Performance Work Statement (PWS) differs from a Statement of Work (SOW) in that a PWS:",
            options: ['Lists every specific task the contractor must perform', 'Focuses on desired outcomes and performance standards rather than prescribing how work is done', 'Is only used for cost-plus contracts', 'Requires the contractor to use government-specified methods and procedures'],
            correct: 1,
            explanation: "A PWS defines the outcomes and standards the contractor must achieve, not the specific methods or procedures. This gives the contractor flexibility to innovate while holding them accountable for results. An SOW, by contrast, specifies exactly what tasks must be performed. PWS is required for performance-based services contracts."
          },
          {
            id: 'q5',
            question: "A CDRL (Contract Data Requirements List) is used to:",
            options: ['List all government-furnished equipment provided to the contractor', 'Formally specify data deliverables the contractor must provide under the contract', 'Define the contract quality inspection criteria', 'Identify subcontractor qualifications required'],
            correct: 1,
            explanation: "CDRLs (DD Form 1423) are the contractually binding list of data deliverables — reports, technical documents, test plans, drawings — that the contractor must deliver. Each CDRL specifies the data item description (DID), frequency, format, and review period. Failure to track and respond to CDRLs is a common government oversight failure."
          },
          {
            id: 'q6',
            question: "What is a Quality Assurance Surveillance Plan (QASP) primarily used for?",
            options: ['Contractor proposal evaluation during source selection', 'Defining how the government will monitor, measure, and document contractor performance', 'Approving contractor subcontracting plans', 'Setting contract award fee criteria'],
            correct: 1,
            explanation: "The QASP defines the government's plan for monitoring contract performance — what will be measured, how often, by whom, and what constitutes acceptable vs. unacceptable performance. A QASP is required for performance-based services contracts and provides the documentation baseline for past performance assessments and award fee decisions."
          },
          {
            id: 'q7',
            question: "A COR discovers a contractor has submitted an invoice for deliverables not yet completed. The COR should:",
            options: ['Approve the invoice to maintain the contractor relationship', 'Reject the invoice and immediately notify the Contracting Officer with documentation', 'Ignore it and wait for the CO to review all invoices', 'Direct the contractor to complete the work and resubmit'],
            correct: 1,
            explanation: "CORs have a responsibility to verify work completion before approving invoices. Accepting invoices for work not performed is improper payment — potentially a fraud issue. The COR should reject the invoice, document the discrepancy, and immediately notify the CO so proper action can be taken."
          },
          {
            id: 'q8',
            question: "The Administrative Contracting Officer (ACO) differs from the Procuring Contracting Officer (PCO) in that the ACO:",
            options: ['Has authority to award new contracts and modifications', 'Handles post-award administration including payments, contractor compliance, and closeout', 'Is responsible for source selection only', 'Reports directly to the program manager'],
            correct: 1,
            explanation: "The PCO focuses on pre-award activities (strategy, solicitation, negotiation, award) and significant modifications. The ACO handles ongoing contract administration after award — processing invoices, monitoring compliance, managing property, and handling routine modifications within delegated authority."
          },
          {
            id: 'q9',
            question: "A contractor misses a contractual delivery milestone due to a government delay in providing Government Furnished Equipment (GFE). This may entitle the contractor to:",
            options: ['Termination for convenience', 'An excusable delay extension to the contract schedule', 'Increased profit on remaining work', 'Conversion to a cost-plus contract type'],
            correct: 1,
            explanation: "When government-caused events — like late delivery of GFE, late approval of drawings, or government-directed changes — impact the contractor's schedule, the contractor is generally entitled to an \"excusable delay\" — a schedule extension with no liability for delay damages. PMs must track GFE and GFI delivery dates carefully to avoid creating government-caused delays."
          },
          {
            id: 'q10',
            question: "Past Performance Assessments (PPAs) in the Contractor Performance Assessment Reporting System (CPARS) are important because:",
            options: ['They determine the contractor\'s fee on the current contract', 'They become part of the contractor\'s official record and are used in future source selections', 'They trigger mandatory audits by DCAA', 'They are only used to document contractor failures'],
            correct: 1,
            explanation: "CPARS records are used in future source selections as the past performance evaluation factor. Both positive and negative assessments follow contractors for 3 years. CORs and PMs have a legal and ethical obligation to complete CPARS assessments accurately and on time — they are the government's institutional memory of contractor performance."
          }
        ]
      },
      // ── NEW LESSON: Contracts-4 (Contracts vs. Task Orders — Fundamental) ──
      {
        id: 'contracts-4',
        title: 'Contracts vs. Task Orders: Know the Difference',
        duration: '14 min',
        description: 'Understand the fundamental distinction between base contracts and task orders — and why it matters for how work gets authorized, modified, and paid.',
        keyTerms: [
          { term: 'IDIQ', definition: 'Indefinite Delivery / Indefinite Quantity — a contract type that establishes terms and conditions for ordering supplies or services over time.' },
          { term: 'Task Order (TO)', definition: 'An order for services placed under an IDIQ contract — the mechanism that authorizes and funds specific work.' },
          { term: 'Delivery Order (DO)', definition: 'An order for supplies placed under an IDIQ contract (parallel to task order, but for products).' },
          { term: 'MAC-IDIQ', definition: 'Multiple Award Contract IDIQ — competition is split among multiple awardees who then compete for individual task orders.' },
          { term: 'GWAC', definition: 'Government-Wide Acquisition Contract — an IDIQ available for use by multiple federal agencies, awarded by a lead agency.' },
          { term: 'Ordering Period', definition: 'The time window during which task orders may be placed under an IDIQ contract (distinct from the period of performance on individual TOs).' },
          { term: 'Ceiling', definition: 'The maximum dollar value of all orders that may be placed under an IDIQ contract.' },
          { term: 'Minimum Guarantee', definition: 'The minimum value the government is obligated to order under an IDIQ — typically a nominal amount ($1,000–$25,000).' },
          { term: 'Fair Opportunity', definition: 'The requirement under FAR 16.505 to provide each MAC-IDIQ awardee a fair opportunity to compete for each task order over $3,500.' },
          { term: 'BPA', definition: 'Blanket Purchase Agreement — a simplified ordering agreement under GSA Schedule or open market, similar in concept to an IDIQ but without minimum/maximum guarantees.' },
        ],
        content: [
          {
            type: 'text',
            heading: "Two Levels of Agreement",
            body: "In federal contracting, there are two distinct levels of agreement you must understand: the base contract and the order. The base contract (the IDIQ) establishes all the legal terms and conditions — pricing, labor categories, clauses, applicable regulations, and the overall ordering ceiling. The task order (TO) is where actual work gets authorized and funded. No work begins until a task order is issued. This two-level structure gives agencies flexibility to order services on demand without re-competing every single requirement."
          },
          {
            type: 'table',
            heading: "Contract vs. Task Order vs. BPA: Key Differences",
            headers: ['Element', 'IDIQ Base Contract', 'Task Order', 'BPA'],
            rows: [
              ['What it does', 'Establishes legal framework, terms, clauses, labor rates', 'Authorizes & funds specific work', 'Sets up ordering arrangement (no guaranteed min/max)'],
              ['When competed', 'Once, at contract award', 'Each order (fair opportunity)', 'Once, at BPA establishment'],
              ['Funds obligated', 'Only minimum guarantee at award', 'Full amount of each order', 'At time of call (order) placement'],
              ['Period', 'Ordering period (e.g., 5+5 years)', 'Task order PoP (can extend past IDIQ ordering period)', 'Typically 1 year, renewable'],
              ['Modifications', 'Change terms, rates, ceiling, ordering period', 'Change scope/funding on that specific task', 'Modify terms of BPA arrangement'],
              ['Competition', 'Full & open or small biz set-aside', 'Fair opportunity among awardees', 'Schedule price competition'],
            ]
          },
          {
            type: 'text',
            heading: "How IDIQs Work: Single Award vs. Multiple Award",
            body: "A Single Award IDIQ gives one contractor exclusive rights to receive all task orders — appropriate when a single firm has unique capabilities. A Multiple Award Contract IDIQ (MAC-IDIQ) awards the base contract to multiple vendors who then compete for individual task orders. FAR 16.504 establishes a preference for multiple awards because they maintain price competition at the task order level and give the government access to a pool of qualified vendors."
          },
          {
            type: 'list',
            heading: "The IDIQ Ordering Process (Step by Step)",
            items: [
              'Step 1: Requirement identified — program office describes work needed',
              'Step 2: Determine if an existing IDIQ can satisfy the requirement (scope check)',
              'Step 3: Issue a task order Request for Proposal (TORFP) to awardees in the pool',
              'Step 4: Provide fair opportunity — all pool members get a reasonable chance to compete',
              'Step 5: Evaluate task order proposals (simplified process vs. full source selection)',
              'Step 6: Award task order to the best value offeror',
              'Step 7: Execute work; administer the task order like a standalone contract',
              'Step 8: Modify the task order (not the base contract) for scope/funding changes',
            ]
          },
          {
            type: 'callout',
            heading: "The Fair Opportunity Requirement",
            body: "FAR 16.505 requires that for MAC-IDIQ task orders over $3,500, all awardees must receive a fair opportunity to compete — meaning each must receive notice of the opportunity and a reasonable time to respond. Six narrow exceptions allow sole-source task orders: urgency, only one awardee is capable, follow-on to a prototype, logical follow-on, minimum guarantee, and national security. Bypassing fair opportunity without a valid exception is illegal and a common IG finding."
          },
          {
            type: 'formula',
            heading: "IDIQ Contract Structure",
            formula: 'IDIQ Contract = Base Contract (terms, rates, ceiling) + n Task Orders\nTotal ordered value ≤ Maximum Ceiling\nTotal ordered value ≥ Minimum Guarantee\nEach Task Order = Independent Scope + Independent Funding + Independent PoP',
            explanation: "The base contract ceiling sets the absolute limit on cumulative task order value. The minimum guarantee is the only amount the government is legally obligated to order — it protects the contractor's investment in the contract. Each task order is funded independently with its own period of performance."
          },
          {
            type: 'table',
            heading: "Common DoD IDIQ Vehicles by Type",
            headers: ['Contract Vehicle', 'Type', 'Administered By', 'Best For'],
            rows: [
              ['OASIS+', 'MAC-IDIQ GWAC', 'GSA', 'Professional services across all disciplines'],
              ['Alliant 2', 'MAC-IDIQ GWAC', 'GSA', 'Large-scale IT services and solutions'],
              ['STARS III', 'MAC-IDIQ GWAC (SDVOSB/SB)', 'GSA', 'IT services — small business set-aside'],
              ['SeaPort-NxG', 'MAC-IDIQ', 'NAVSEA', 'Navy engineering and program support'],
              ['AFCAP IV', 'MAC-IDIQ', 'AFCEC', 'Air Force contingency base support'],
              ['EAGLE II', 'MAC-IDIQ', 'DHS', 'IT solutions for DHS components'],
            ]
          },
          {
            type: 'tip',
            heading: "Task Order vs. Contract Modification — Don't Confuse Them",
            body: "A modification to a task order changes the scope, funding, or schedule of that specific task. A modification to the base IDIQ changes the contract-wide terms — labor rates, clauses, ceiling value, ordering period, or adding/removing CLINs. Most day-to-day changes (adding work, extending a PoP, adding funding) are task order mods. Changes to underlying pricing or terms require base contract modifications."
          }
        ],
        quiz: [
          {
            id: 'q1',
            question: "Under a Multiple Award IDIQ contract, what is the primary mechanism that actually authorizes a contractor to begin work and obligates government funding?",
            options: ['The base IDIQ contract award', 'A task order (or delivery order) issued under the IDIQ', 'A Blanket Purchase Agreement call', 'A contract modification to the base IDIQ'],
            correct: 1,
            explanation: "The IDIQ base contract establishes the legal framework and terms but does NOT authorize specific work or obligate funds. A task order (or delivery order for supplies) is the mechanism that authorizes a specific scope of work and obligates the corresponding funding. No work should begin without an issued task order."
          },
          {
            id: 'q2',
            question: "What is the minimum guarantee on an IDIQ contract, and why does it exist?",
            options: ['50% of the contract ceiling, to ensure the contractor recovers setup costs', 'A nominal amount (typically $1K–$25K) obligated at award, protecting the contractor from a zero-value contract', 'The amount needed to fund the first task order', 'The government\'s estimated annual spend, used for market research'],
            correct: 1,
            explanation: "The minimum guarantee is a nominal amount (typically $1,000–$25,000) obligated at contract award that represents the government's only guaranteed obligation under the IDIQ. It protects the contractor from the scenario where no task orders are ever placed. Above the minimum, the government has no obligation to order any specific amount up to the ceiling."
          },
          {
            id: 'q3',
            question: "FAR 16.505 requires \"fair opportunity\" for MAC-IDIQ task orders above what threshold?",
            options: ['$100,000', '$250,000', '$3,500', '$1,000,000'],
            correct: 2,
            explanation: "FAR 16.505 requires that all MAC-IDIQ awardees receive fair opportunity to compete for task orders exceeding $3,500. Below this threshold, the contracting officer may place orders without following the fair opportunity procedures. This relatively low threshold means nearly all meaningful task orders require fair opportunity competition."
          },
          {
            id: 'q4',
            question: "What distinguishes an IDIQ contract from a Blanket Purchase Agreement (BPA)?",
            options: ['BPAs have a maximum ceiling; IDIQs do not', 'IDIQs have enforceable minimum/maximum quantities; BPAs have no such guarantees', 'BPAs require full and open competition; IDIQs do not', 'IDIQs are only for services; BPAs are only for supplies'],
            correct: 1,
            explanation: "IDIQs have both a minimum guarantee (legally obligated at award) and a maximum ceiling (cannot exceed). BPAs are simplified ordering arrangements — typically against GSA Schedule contracts — with no minimum guarantee and no maximum ceiling (though agencies usually set an estimated value). BPAs are simpler to establish but provide less legal certainty."
          },
          {
            id: 'q5',
            question: "The \"ordering period\" on an IDIQ contract refers to:",
            options: ['The period of performance for individual task orders', 'The time window during which new task orders may be placed against the IDIQ', 'The fiscal year in which funds were appropriated', 'The time from award to the first task order competition'],
            correct: 1,
            explanation: "The ordering period defines when task orders may be placed. A common structure is 5 years base plus one 5-year option. Task order periods of performance CAN extend beyond the IDIQ ordering period (a common misconception) — what matters is that the task order itself was awarded before the ordering period closed."
          },
          {
            id: 'q6',
            question: "Which of the following is NOT a recognized exception to the fair opportunity requirement under FAR 16.505?",
            options: ['Urgency — need so urgent that fair opportunity would cause harm', 'Only one IDIQ awardee is technically capable of performing the work', 'The contracting officer prefers working with a particular contractor', 'Minimum guarantee — task order to fulfill the contract\'s minimum'],
            correct: 2,
            explanation: "Personal preference is never a valid exception to fair opportunity. The six valid exceptions are: urgency, only one awardee is capable, logical follow-on to a prototype, follow-on for consistency, minimum guarantee order, and national security. Violating fair opportunity without a documented exception is a serious contracting violation."
          },
          {
            id: 'q7',
            question: "The IDIQ contract vehicle OASIS+ (administered by GSA) is best described as:",
            options: ['A single-award IDIQ for IT services only', 'A Government-Wide Acquisition Contract (GWAC) MAC-IDIQ for professional services available to all federal agencies', 'A Navy-specific contract vehicle for shipbuilding support', 'A simplified acquisition tool for purchases under $250K'],
            correct: 1,
            explanation: "OASIS+ (One Acquisition Solution for Integrated Services Plus) is a GSA-administered GWAC MAC-IDIQ that provides professional services across multiple functional areas (management consulting, engineering, R&D, financial management, logistics, IT) to all federal agencies. It replaced the original OASIS contract and is structured with unrestricted and small business pools."
          },
          {
            id: 'q8',
            question: "A program manager wants to add new work to an existing task order that was not in the original task order statement of work. The correct action is to:",
            options: ['Issue a new task order for the additional work', 'Verbally direct the contractor to start the new work immediately', 'Execute a task order modification adding the new scope and corresponding funding', 'Award a new sole-source contract for the additional work'],
            correct: 2,
            explanation: "New in-scope work under an existing task order should be incorporated through a task order modification (bilateral mod signed by both parties, or a unilateral mod if using Changes clause). The modification adds the scope and obligates additional funding. Simply directing the contractor to start work without a mod is an unauthorized commitment and a constructive change."
          },
          {
            id: 'q9',
            question: "Under a MAC-IDIQ, when a task order competition results in an award, which document governs the evaluation of task order proposals?",
            options: ['The evaluation criteria in the original base IDIQ solicitation', 'The task order Request for Proposal (TORFP) issued to the pool', 'The Federal Acquisition Regulation Part 15 formal source selection process', 'The GSA Price List for schedule contracts'],
            correct: 1,
            explanation: "Task order competitions use a Task Order Request for Proposal (TORFP) that specifies the requirements, evaluation factors, and instructions for that specific task. This is typically a simplified process compared to full FAR Part 15 source selection — but the same principles of consistency and documentation apply, and task order awards can be protested to GAO or the CO."
          },
          {
            id: 'q10',
            question: "A government program has multiple contractors all holding IDIQ contracts under the same MAC vehicle. To place a task order, the ordering officer must:",
            options: ['Select whichever contractor most recently won an order to balance workload', 'Issue a TORFP providing all eligible pool members a fair opportunity to compete', 'Always select the lowest-priced contractor from the original competition', 'Get CO approval only if the order exceeds the simplified acquisition threshold'],
            correct: 1,
            explanation: "Under a MAC-IDIQ, the ordering officer must provide all pool members a fair opportunity to compete by issuing a TORFP. This maintains competition at the task order level and is the core benefit of the MAC-IDIQ structure. Bypassing fair opportunity without a valid FAR 16.505 exception is illegal."
          }
        ]
      },
      // ── NEW LESSON: Contracts-5 (GSA Vehicles: OASIS+, FEDSIM, AAS-D — Advanced) ──
      {
        id: 'contracts-5',
        title: 'GSA Vehicles: OASIS+, FEDSIM, and AAS-D',
        duration: '18 min',
        description: 'Master the most important government-wide acquisition contracts for professional services — how they work, when to use them, and what the differences are.',
        keyTerms: [
          { term: 'GWAC', definition: 'Government-Wide Acquisition Contract — a task order contract established by one agency for use by any federal agency.' },
          { term: 'OASIS+', definition: 'One Acquisition Solution for Integrated Services Plus — GSA\'s flagship GWAC for professional and technical services across all disciplines.' },
          { term: 'FEDSIM', definition: 'Federal Systems Integration and Management Center — GSA\'s assisted acquisition service that manages the contracting process on behalf of customer agencies.' },
          { term: 'AAS-D', definition: 'Assisted Acquisition Services — Defense — GSA\'s defense-focused assisted acquisition service supporting DoD agencies.' },
          { term: 'Assisted Acquisition', definition: 'When one agency (the servicing agency) conducts an acquisition on behalf of another agency (the requesting agency) using an Economy Act or similar authority.' },
          { term: 'Ordering Agency', definition: 'The agency that places task orders against a GWAC for its own requirements (distinct from the agency that holds the contract).' },
          { term: 'Interagency Agreement (IAA)', definition: 'The agreement between the requesting agency and servicing agency (e.g., GSA/FEDSIM) that authorizes the assisted acquisition.' },
          { term: 'Alliant 2', definition: 'GSA\'s large-scale IT GWAC for complex IT solutions, available to all federal agencies.' },
          { term: 'STARS III', definition: '8(a) STARS III — GSA\'s GWAC for small business IT services, including 8(a) and HUBZone set-asides.' },
          { term: 'Economy Act', definition: '31 U.S.C. § 1535 — the statutory authority allowing federal agencies to request services or supplies from other federal agencies.' },
        ],
        content: [
          {
            type: 'text',
            heading: "Why GWACs Matter to DoD Program Managers",
            body: "Government-Wide Acquisition Contracts (GWACs) allow agencies to place task orders without conducting a full standalone acquisition. For DoD program managers, understanding GSA GWACs — especially OASIS+ — is increasingly essential. These vehicles save acquisition lead time, maintain competition, and provide access to pre-vetted contractor pools. Knowing when to use a GWAC vs. competing a standalone contract is a key PM and contracting competency."
          },
          {
            type: 'table',
            heading: "Major GSA GWACs: At a Glance",
            headers: ['Vehicle', 'Type', 'Focus', 'Ceiling', 'Pools'],
            rows: [
              ['OASIS+', 'MAC-IDIQ GWAC', 'Professional & technical services (all disciplines)', '$60B+', 'Unrestricted + SB pools by functional area'],
              ['Alliant 2', 'MAC-IDIQ GWAC', 'Large-scale, complex IT services & solutions', '$50B', 'Unrestricted only (Large Business)'],
              ['STARS III', 'MAC-IDIQ GWAC', 'IT services — small business', '$50B', '8(a), WOSB, SDVOSB, HUBZone pools'],
              ['8(a) STARS III', 'MAC-IDIQ GWAC', 'IT services — 8(a) SDB only', '(part of STARS III)', '8(a) small disadvantaged business'],
              ['MAS (Schedules)', 'IDIQ Schedule', 'Commercial products and services (broad)', 'No ceiling', 'Multiple SINs (Special Item Numbers)'],
            ]
          },
          {
            type: 'text',
            heading: "OASIS+ In Depth",
            body: "OASIS+ (One Acquisition Solution for Integrated Services Plus) is GSA's marquee professional services GWAC, replacing the original OASIS contract. It covers essentially all professional and technical service categories: management consulting, engineering, research & development, program management support, IT services, logistics, financial management, and more. OASIS+ is structured in two primary tracks — Unrestricted (large businesses and small businesses competing full-and-open) and Small Business — each with multiple functional area pools. A DoD agency can access OASIS+ by establishing an Interagency Agreement with GSA, then placing task orders directly against the appropriate pool using fair opportunity competition."
          },
          {
            type: 'list',
            heading: "How to Use OASIS+ as an Ordering Agency",
            items: [
              'Step 1: Determine the requirement fits OASIS+ scope (professional/technical services)',
              'Step 2: Identify the correct OASIS+ pool (unrestricted vs. small business, functional area)',
              'Step 3: Establish an Interagency Acquisition Agreement (IAA) with GSA (if not already in place)',
              'Step 4: Issue a Task Order Request for Proposal (TORFP) to the applicable pool',
              'Step 5: Provide fair opportunity to all eligible pool holders per FAR 16.505',
              'Step 6: Evaluate proposals and make best-value task order award',
              'Step 7: Administer the task order — the ordering agency\'s CO retains oversight',
              'Note: GSA charges an Industrial Funding Fee (IFF) or similar fee on OASIS+ orders',
            ]
          },
          {
            type: 'text',
            heading: "FEDSIM: Assisted Acquisition Services",
            body: "FEDSIM (Federal Systems Integration and Management Center) is GSA's assisted acquisition service. Rather than just providing a contract vehicle for agencies to use, FEDSIM acts as the contracting office on behalf of the customer agency. The customer agency defines its requirements and provides funding, and FEDSIM manages the entire acquisition process — drafting the solicitation, conducting source selection, awarding the contract, and administering it. FEDSIM commonly uses vehicles like Alliant 2, STARS III, and OASIS+ for IT and professional services acquisitions."
          },
          {
            type: 'table',
            heading: "OASIS+ Self-Service vs. FEDSIM Assisted Acquisition",
            headers: ['Aspect', 'OASIS+ (Self-Service)', 'FEDSIM (Assisted)'],
            rows: [
              ['Who runs the acquisition?', 'Ordering agency\'s own CO', 'GSA/FEDSIM CO on behalf of customer'],
              ['CO authority', 'Ordering agency retains CO authority', 'FEDSIM CO holds contracting authority'],
              ['Best for', 'Agencies with strong in-house contracting capacity', 'Agencies without sufficient CO capacity or expertise'],
              ['Timeline', 'Faster if agency has resources', 'May be slower due to coordination; adds FEDSIM process'],
              ['Cost', 'IFF/fee to GSA for vehicle use', 'Acquisition management fee to FEDSIM (varies by contract value)'],
              ['Vehicles used', 'OASIS+ pool directly', 'FEDSIM may use Alliant 2, STARS III, OASIS+, or others'],
            ]
          },
          {
            type: 'text',
            heading: "AAS-D: GSA Defense Assisted Acquisition",
            body: "AAS-D (Assisted Acquisition Services — Defense) is GSA's defense-specific assisted acquisition capability, designed for DoD agencies. Like FEDSIM, AAS-D can manage the entire acquisition process on behalf of a DoD program office. AAS-D has strong experience with DoD-specific requirements — DFARS compliance, classified acquisitions, and defense-unique contract clauses. DoD program offices use AAS-D when they need acquisition support but lack sufficient contracting office capacity, particularly for complex IT and professional services requirements that can be served by existing GWACs."
          },
          {
            type: 'callout',
            heading: "The Buy Decision: GWAC vs. Standalone Contract",
            body: "A GWAC is not always the right answer. Use a GWAC when: (1) the requirement fits squarely within the vehicle's scope; (2) speed matters — GWACs eliminate re-competition of the base contract; (3) competition is maintained at the task order level. Consider a standalone contract when: (1) requirements are unique and don't fit any GWAC scope; (2) you need non-standard terms or special contract structure; (3) a single strategic partner relationship is more valuable than rotating competition. Misusing a GWAC by placing out-of-scope orders is a serious contracting violation and a recurring IG audit finding."
          },
          {
            type: 'warning',
            heading: "Scope Discipline: The IG's Favorite Finding",
            body: "The most common GWAC compliance failure is awarding task orders that exceed the scope of the base contract. OASIS+ covers professional and technical services — it does NOT cover construction (use a construction IDIQ), supplies (use MAS schedules or standalone contracts), or highly classified programs requiring specialized contract structures. Every task order must be scope-checked against the GWAC's Statement of Objectives. Inspectors General regularly find out-of-scope orders on GWACs, resulting in contract actions being voided and requiring re-procurement."
          },
          {
            type: 'tip',
            heading: "FEDSIM vs. In-House — The Practical Decision",
            body: "Many DoD program offices consider FEDSIM when their own contracting office is understaffed or lacks experience with a particular acquisition type. FEDSIM brings deep expertise and established processes, but adds coordination overhead and fees. The practical question is: does your contracting office have the bandwidth and skills to run a full competitive acquisition on this vehicle? If not, FEDSIM or AAS-D is a legitimate and efficient alternative — used by major DoD agencies including Army, Air Force, and numerous defense agencies."
          }
        ],
        quiz: [
          {
            id: 'q1',
            question: "What does OASIS+ stand for, and what type of services does it primarily cover?",
            options: [
              'Optimized Acquisition Services — IT systems only',
              'One Acquisition Solution for Integrated Services Plus — professional and technical services across all disciplines',
              'Operations and Sustainment Integrated Services — logistics and supply chain only',
              'Ordered Acquisition System for IT Services — information technology only'
            ],
            correct: 1,
            explanation: "OASIS+ (One Acquisition Solution for Integrated Services Plus) is GSA's flagship GWAC for professional and technical services, covering management consulting, engineering, R&D, program management, IT, logistics, financial management, and more. It is not limited to IT — that distinguishes it from vehicles like Alliant 2 and STARS III."
          },
          {
            id: 'q2',
            question: "FEDSIM (Federal Systems Integration and Management Center) differs from a self-service GWAC in that FEDSIM:",
            options: [
              'Provides a contract vehicle that agencies use independently',
              'Manages the entire acquisition process on behalf of the customer agency, serving as the contracting office',
              'Only supports civilian agencies, not DoD',
              'Is restricted to purchases under the simplified acquisition threshold'
            ],
            correct: 1,
            explanation: "FEDSIM is an assisted acquisition service — it acts as the contracting office for customer agencies, managing solicitation, source selection, award, and administration on the customer's behalf. A self-service GWAC (like using OASIS+ directly) puts the ordering agency's own CO in charge of the process."
          },
          {
            id: 'q3',
            question: "A Government-Wide Acquisition Contract (GWAC) is distinct from an agency-specific IDIQ in that a GWAC:",
            options: [
              'Can only be used by the agency that established it',
              'Is available for use by any federal agency as an ordering agency',
              'Does not require competition at the task order level',
              'Has no ceiling on total contract value'
            ],
            correct: 1,
            explanation: "A GWAC is established by a lead agency (like GSA) for use by all federal agencies. Any agency can place task orders against the GWAC as an \"ordering agency.\" An agency-specific IDIQ is established by and for use by the establishing agency only — other agencies cannot place orders against it without a formal arrangement."
          },
          {
            id: 'q4',
            question: "Which GSA vehicle is specifically designed for large-scale, complex IT services and solutions, primarily for large businesses?",
            options: ['OASIS+', 'STARS III', 'Alliant 2', 'MAS IT Schedule'],
            correct: 2,
            explanation: "Alliant 2 is GSA's GWAC specifically for large-scale IT services and solutions, targeting complex enterprise IT requirements. It is an unrestricted (large business) contract with a $50B ceiling. STARS III is the small business IT equivalent. OASIS+ covers professional services more broadly including IT but also non-IT disciplines."
          },
          {
            id: 'q5',
            question: "The Economy Act (31 U.S.C. § 1535) is relevant to assisted acquisitions because it:",
            options: [
              'Limits the total value of task orders under any GWAC',
              'Provides statutory authority for one agency to procure services or supplies from another federal agency',
              'Requires competition for all orders over $250K',
              'Prohibits the use of GWACs for classified requirements'
            ],
            correct: 1,
            explanation: "The Economy Act authorizes federal agencies to request goods or services from other federal agencies (the \"servicing agency\"). This is the legal foundation for arrangements like using FEDSIM or AAS-D — the customer agency uses Economy Act authority to have GSA conduct the acquisition on its behalf, reimbursing GSA for costs and fees."
          },
          {
            id: 'q6',
            question: "AAS-D (Assisted Acquisition Services — Defense) is specifically designed to serve:",
            options: [
              'Civilian agencies only',
              'DoD agencies requiring assisted acquisition support, particularly for IT and professional services',
              'Small businesses seeking to enter the defense market',
              'Foreign military sales programs only'
            ],
            correct: 1,
            explanation: "AAS-D is GSA's defense-focused assisted acquisition service that works specifically with DoD components. It has deep expertise in DFARS requirements, security requirements, and defense-specific contract structures. DoD program offices use AAS-D when they need acquisition support for requirements suited to existing GWACs."
          },
          {
            id: 'q7',
            question: "What is the primary compliance risk when using a GWAC like OASIS+?",
            options: [
              'Paying too high a price due to lack of competition',
              'Placing task orders for work outside the scope of the GWAC base contract',
              'Failing to meet small business goals',
              'Exceeding the ordering period without an extension'
            ],
            correct: 1,
            explanation: "The primary GWAC compliance risk is out-of-scope task orders — placing work that doesn't fit within the GWAC's established scope. This is the most common IG audit finding on GWACs and can result in orders being voided and requiring re-procurement. Every task order must be scope-checked against the GWAC's Statement of Objectives before placement."
          },
          {
            id: 'q8',
            question: "STARS III is best characterized as:",
            options: [
              'A large-business IT GWAC for complex solutions',
              'A small business IT GWAC with 8(a), WOSB, SDVOSB, and HUBZone pools',
              'A professional services GWAC for all service disciplines',
              'A GSA Schedule for commercial IT products'
            ],
            correct: 1,
            explanation: "STARS III (Streamlined Technology Acquisition Resources for Services) is GSA's small business IT GWAC. It includes pools for different small business categories: 8(a) Small Disadvantaged Business, Woman-Owned Small Business (WOSB), Service-Disabled Veteran-Owned Small Business (SDVOSB), and HUBZone. It's a key vehicle for meeting small business goals on IT programs."
          },
          {
            id: 'q9',
            question: "When should a DoD PM recommend using FEDSIM rather than using a GWAC directly?",
            options: [
              'When the acquisition is under $250K and competition is not required',
              'When the program office\'s contracting office lacks capacity, expertise, or bandwidth to run the full acquisition',
              'When competition is not desired to protect the incumbent contractor',
              'When the requirement exceeds the GWAC ceiling'
            ],
            correct: 1,
            explanation: "FEDSIM is the right choice when the program office contracting office doesn't have the resources or specialized expertise to run the acquisition effectively. FEDSIM brings experienced contracting professionals who manage the process end-to-end. The tradeoff is coordination overhead and fees — for programs with strong in-house contracting capacity, self-service GWAC use is typically faster and cheaper."
          },
          {
            id: 'q10',
            question: "An Interagency Acquisition Agreement (IAA) between a DoD program office and GSA for OASIS+ use primarily documents:",
            options: [
              'The technical requirements for the specific task order',
              'The mutual terms under which the ordering agency will use the GWAC, including funding transfer and responsibilities',
              'The competition strategy for individual task orders',
              'The contractor team members who will perform the work'
            ],
            correct: 1,
            explanation: "An IAA (often in the form of a Reimbursable Work Order or Economy Act agreement) between the ordering agency and GSA establishes the terms for the assisted acquisition or GWAC use — including funding transfer, fee arrangements, roles and responsibilities, and performance expectations. It must be in place before task orders are placed under the assisted acquisition arrangement."
          }
        ]
      }
    ]
  },

  // ─────────────────────────────────────────────────────────────
  // MODULE 4 — DATA
  // ─────────────────────────────────────────────────────────────
  {
    id: 'data',
    title: 'Data Analytics for Program Managers',
    subtitle: 'Module 4',
    icon: '📊',
    color: 'teal',
    description: 'Use data to drive decisions, measure performance, and communicate program health with confidence.',
    lessons: [
      {
        id: 'data-1',
        title: 'Program Metrics & KPIs for Defense PMs',
        duration: '13 min',
        description: 'Identify and track the key performance indicators that matter most in defense program management.',
        keyTerms: [
          { term: 'KPI', definition: 'Key Performance Indicator — a measurable value demonstrating how effectively an objective is being achieved.' },
          { term: 'Technical Performance Measure (TPM)', definition: 'A parameter that tracks achievement of key technical requirements against a planned profile.' },
          { term: 'Threshold', definition: 'The minimum acceptable value for a performance parameter; program fails if not met.' },
          { term: 'Objective', definition: 'The desired best value for a performance parameter; program tries to achieve this.' },
          { term: 'Leading Indicator', definition: 'A metric that predicts future performance (e.g., staffing levels predict schedule performance).' },
          { term: 'Lagging Indicator', definition: 'A metric that reports past performance (e.g., CPI shows what has already happened).' },
        ],
        content: [
          {
            type: 'text',
            heading: "Metrics-Driven Program Management",
            body: "The best program managers don't wait for problems to surface in reviews — they see them coming in the data. Building a robust set of leading and lagging indicators gives you early warning of cost, schedule, and technical issues before they become crises. The challenge is selecting the right metrics: too few and you're flying blind; too many and you're drowning in noise that doesn't drive decisions."
          },
          {
            type: 'table',
            heading: "Core PM Dashboard Metrics",
            headers: ['Category', 'Metric', 'What It Tells You', 'Warning Sign'],
            rows: [
              ['Cost', 'CPI (EV/AC)', 'Cost efficiency of work performed', 'CPI < 0.90'],
              ['Schedule', 'SPI (EV/PV)', 'Schedule efficiency vs. plan', 'SPI < 0.90'],
              ['Cost', 'VAC (BAC - EAC)', 'Projected overrun/underrun at completion', 'VAC < -5%'],
              ['Technical', 'TPM achievement %', 'Technical parameter vs. planned maturity', '< 80% on schedule'],
              ['Risk', 'Open high-risk items', 'Count of unmitigated high risks', '> 5 high items'],
              ['Quality', 'Defect closure rate', 'Rate of defect identification vs. resolution', 'Backlog growing'],
              ['Schedule', 'Critical path float', 'Days of slack on program critical path', '< 10 days float'],
            ]
          },
          {
            type: 'callout',
            heading: "Technical Performance Measures (TPMs)",
            body: "TPMs are contractually defined parameters with threshold (minimum acceptable) and objective (desired) values, tracked against a planned maturity profile over the program timeline. For a communications system, a TPM might be \"data throughput ≥ 100 Mbps.\" If the contractor's current throughput is below the planned maturity curve, the PM knows — before integration testing — that a technical risk is materializing."
          },
          {
            type: 'list',
            heading: "Leading vs. Lagging Indicators",
            items: [
              'Leading (predictive): Staffing levels, test asset availability, GFE/GFI delivery status, risk burn-down rate, supplier delivery performance',
              'Lagging (historical): CPI, SPI, defect count, actual vs. planned milestones, budget execution rate',
              'Best practice: Track both — lead indicators give you time to act; lagging indicators confirm trends',
              'Red flag: If ALL your metrics are lagging, you\'re managing by looking in the rear-view mirror',
            ]
          },
          {
            type: 'tip',
            heading: "The Dashboard Design Rule",
            body: "A PM's dashboard should fit on one page and answer three questions at a glance: Are we on cost? Are we on schedule? Are we achieving technical performance? Any metric that doesn't answer one of those three questions is overhead noise — useful in deep dives but not in an executive dashboard."
          }
        ],
        quiz: [
          {
            id: 'q1',
            question: "A Technical Performance Measure (TPM) with a \"threshold\" value represents:",
            options: ['The ideal best-case technical outcome', 'The minimum acceptable technical performance — below this the program fails', 'The baseline value at contract award', 'The contractor\'s internal target for performance'],
            correct: 1,
            explanation: "In DoD acquisitions, threshold values are the minimum acceptable performance levels for Key Performance Parameters (KPPs) and TPMs. If a system cannot achieve the threshold, it fails to meet the requirement. The \"objective\" value is the desired best value. PMs track both to understand performance margin."
          },
          {
            id: 'q2',
            question: "Which of the following is a LEADING indicator of future schedule performance?",
            options: ['SPI (Schedule Performance Index)', 'Actual vs. planned milestone completion dates', 'Contractor staffing levels and key personnel fill rate', 'Cost variance percentage'],
            correct: 2,
            explanation: "Staffing levels are a leading indicator — understaffed programs have not yet shown schedule slippage in the SPI, but the lag in hiring predicts future schedule problems. SPI and milestone data are lagging indicators — they report what has already happened. Leading indicators are more valuable because they allow preventive action."
          },
          {
            id: 'q3',
            question: "Critical path float of less than 10 days on a defense program indicates:",
            options: ['The program is ahead of schedule', 'There is minimal schedule buffer, and any delay on critical path activities will directly slip the milestone', 'The program has sufficient margin for risk events', 'Float only matters on commercial programs, not defense'],
            correct: 1,
            explanation: "Critical path float (also called \"slack\") represents the amount of time an activity can be delayed without delaying the program's critical path milestone. Less than 10 days of float means the program has virtually no schedule buffer — any delay, vendor issue, or test failure that affects the critical path will directly slip the contract delivery date."
          },
          {
            id: 'q4',
            question: "VAC (Variance at Completion) is calculated as:",
            options: ['EV minus AC', 'BAC minus EAC', 'PV minus EV', 'CPI minus SPI'],
            correct: 1,
            explanation: "VAC = BAC - EAC. A negative VAC indicates a projected cost overrun at completion. For example, if BAC = $100M and EAC = $115M, then VAC = -$15M, meaning the program is projected to overrun by $15M. VAC translates the current performance indices into a projected dollar impact at program completion."
          },
          {
            id: 'q5',
            question: "A defense PM's dashboard shows CPI = 0.88, SPI = 0.92, and 8 open high-risk items. Based on standard DoD benchmarks, this program should be rated:",
            options: ['Green — all indicators are above 0.85', 'Yellow/Red — CPI below 0.90 is a red indicator requiring corrective action report', 'Yellow — SPI is acceptable but needs monitoring', 'Green — risk count below 10 is acceptable'],
            correct: 1,
            explanation: "CPI < 0.90 is a \"Red\" indicator on standard DoD program dashboards, requiring a formal corrective action report. SPI of 0.92 is \"Yellow.\" The combination of Red cost performance and 8 open high risks makes this a program requiring immediate attention. PMs should never rationalize away a CPI below 0.90."
          },
          {
            id: 'q6',
            question: "The primary reason to include BOTH leading and lagging indicators in a program dashboard is:",
            options: ['To satisfy audit requirements', 'Leading indicators enable preventive action; lagging indicators confirm whether interventions worked', 'They are required by DFARS for all ACAT I programs', 'To compare contractor performance against industry benchmarks'],
            correct: 1,
            explanation: "Leading indicators (predictive) allow the PM to see problems forming and take action before they appear in cost/schedule data. Lagging indicators (historical) confirm trends and validate whether corrective actions are working. Using only lagging indicators means managing reactively — always behind the problem."
          },
          {
            id: 'q7',
            question: "For a defense program's executive dashboard, what is the recommended design principle?",
            options: ['Include every available metric to demonstrate thoroughness', 'Fit on one page, answering: Are we on cost? On schedule? Achieving technical performance?', 'Focus exclusively on financial metrics since that is what leadership cares about', 'Use a separate dashboard for each program stakeholder'],
            correct: 1,
            explanation: "Executive dashboards should be concise and decision-focused. A well-designed PM dashboard fits on a single page and answers the three critical questions: cost performance, schedule performance, and technical achievement. Excessive detail belongs in backup briefings, not the executive summary."
          },
          {
            id: 'q8',
            question: "A growing defect backlog (more defects being found than closed) is a warning sign indicating:",
            options: ['The test program is more thorough than expected — a positive sign', 'Quality and schedule risk: the program is accumulating technical debt that will affect later milestones', 'Normal behavior during early integration testing', 'The contractor is ahead on testing, finding issues early'],
            correct: 1,
            explanation: "A growing defect backlog indicates the program is generating quality issues faster than it can resolve them — a strong predictor of test phase overruns and potential milestone delays. Even if defects are \"expected\" in early integration, a sustained or growing backlog is a risk that requires active management and root cause analysis."
          },
          {
            id: 'q9',
            question: "Supplier delivery performance tracking is best classified as which type of indicator?",
            options: ['Lagging — it reports what suppliers have already delivered', 'Leading — delays in supplier deliveries predict future schedule problems for the prime contractor', 'Technical performance measure', 'A financial indicator only'],
            correct: 1,
            explanation: "Supplier delivery performance is a leading indicator. When a critical component supplier starts slipping delivery dates, the prime contractor's schedule will eventually be impacted — but often weeks or months later. Tracking supplier on-time delivery gives PMs early warning to identify alternative sources or accelerate efforts before the prime program schedule is affected."
          },
          {
            id: 'q10',
            question: "TPMs (Technical Performance Measures) are tracked against a \"planned maturity profile\" because:",
            options: ['All technical parameters must be 100% achieved at contract award', 'Technical performance is expected to improve progressively; the profile shows whether achievement is on pace', 'DFARS requires a specific TPM format at every program review', 'TPMs are only meaningful at final delivery testing'],
            correct: 1,
            explanation: "TPMs are not expected to achieve their final values immediately — they mature progressively as development proceeds. The planned maturity profile shows what value should be achievable at each point in time. Tracking actual TPM values against the profile tells the PM whether technical development is proceeding on pace or falling behind — before the program reaches system integration testing."
          }
        ]
      },
      {
        id: 'data-2',
        title: 'Data-Driven Decisions & Visualization',
        duration: '12 min',
        description: 'Use charts, dashboards, and data storytelling to communicate program status and drive decisions.',
        keyTerms: [
          { term: 'S-Curve', definition: 'A cumulative cost/schedule plot showing planned vs. actual expenditure over time — the standard EVM visualization.' },
          { term: 'Burn Rate', definition: 'The rate at which a program is consuming its budget over time.' },
          { term: 'Waterfall Chart', definition: 'Shows how an initial value is affected by positive and negative changes — useful for variance analysis.' },
          { term: 'Trend Line', definition: 'A line projected from historical data showing where the program is headed if current performance continues.' },
          { term: 'Data Normalization', definition: 'Adjusting data to a common scale for meaningful comparison (e.g., cost per unit, not total cost).' },
        ],
        content: [
          {
            type: 'text',
            heading: "Data Tells a Story — Make Sure It's the Right One",
            body: "Numbers without context mislead. A $10M cost overrun means very different things on a $100M contract vs. a $10B contract. Effective program managers present data in ways that correctly convey the program's health status — not to hide problems, not to exaggerate them, but to enable the right decision at the right level of leadership. Misleading data presentation is a leadership failure and an integrity issue."
          },
          {
            type: 'list',
            heading: "Essential Charts for a PM's Toolkit",
            items: [
              'S-Curve: Cumulative BCWS vs. BCWP vs. ACWP — the fundamental EVM visualization. Any divergence between the three lines tells the whole cost/schedule story.',
              'Gantt/IMS Bar Chart: Timeline view of all program activities, dependencies, and critical path. Updated monthly.',
              'Risk Matrix (5×5): Plot all risks by probability and impact. Shows at a glance where attention is needed.',
              'Burn Rate Chart: Monthly and cumulative obligation vs. plan. Reveals execution patterns.',
              'TPM Trend Chart: Actual technical parameter values vs. planned maturity profile over time.',
              'Waterfall/Variance Chart: Decompose cost variance by work package or contractor to identify root causes.',
            ]
          },
          {
            type: 'callout',
            heading: "The S-Curve: Your Program's EKG",
            body: "An S-Curve plots BCWS (planned), BCWP (earned), and ACWP (actual) on the same axis over time. The gap between BCWP and ACWP is cost variance. The gap between BCWP and BCWS is schedule variance. Any experienced acquisition professional can read a program's entire cost/schedule health from a properly formatted S-Curve in 30 seconds."
          },
          {
            type: 'tip',
            heading: "Data Presentation for Executives",
            body: "Executive briefings demand different data presentation than program team reviews. For executives: lead with the conclusion (not the data), use traffic light color coding (red/yellow/green), limit to 3 charts maximum, and have backup data ready for questions. For program teams: show all the detail — waterfall variances, WBS-level trends, and root cause analysis."
          },
          {
            type: 'table',
            heading: "Chart Selection Guide",
            headers: ['What You Want to Show', 'Best Chart Type'],
            rows: [
              ['Overall cost & schedule health over time', 'S-Curve (BCWS/BCWP/ACWP)'],
              ['Where cost variance is coming from', 'Waterfall chart by WBS element'],
              ['Program schedule and dependencies', 'Gantt / IMS bar chart'],
              ['Risk portfolio status', '5×5 Risk matrix'],
              ['Budget execution vs. plan by month', 'Bar chart (planned vs. actual burn)'],
              ['Technical parameter trend vs. target', 'Line chart with threshold/objective bands'],
              ['Comparing multiple programs', 'Radar/spider chart or normalized bar chart'],
            ]
          }
        ],
        quiz: [
          {
            id: 'q1',
            question: "An S-Curve for an EVM program plots which three curves?",
            options: ['BAC, EAC, and VAC over time', 'BCWS (PV), BCWP (EV), and ACWP (AC) over time', 'CPI, SPI, and TCPI over time', 'Planned staffing, actual staffing, and required staffing'],
            correct: 1,
            explanation: "The S-Curve plots three cumulative cost lines over time: BCWS (Planned Value — what was planned to be spent), BCWP (Earned Value — the budget value of work accomplished), and ACWP (Actual Cost — what was actually spent). The gaps between these three lines visually reveal cost variance (EV vs. AC) and schedule variance (EV vs. PV)."
          },
          {
            id: 'q2',
            question: "For an executive-level program briefing, which data presentation approach is most effective?",
            options: ['Present all available data in detail to demonstrate transparency', 'Lead with the conclusion, use traffic-light color coding, limit to 3 charts, have backup detail ready', 'Present only positive results to maintain stakeholder confidence', 'Use WBS-level waterfall charts as the primary visualization'],
            correct: 1,
            explanation: "Executive briefings require a different approach than working-level reviews. Executives need to make decisions quickly — they need the \"so what\" upfront, color-coded health indicators, and a limited number of charts. Detailed backup should be available for Q&A. Burying the status in raw data is a failure to communicate effectively."
          },
          {
            id: 'q3',
            question: "A waterfall chart in program management is best used to:",
            options: ['Show cumulative cost trends over time', 'Decompose cost or schedule variance by WBS element to identify root causes', 'Display the program schedule and critical path', 'Compare contractor staffing against requirements'],
            correct: 1,
            explanation: "A waterfall chart decomposes a total variance into its contributing elements, showing which WBS areas, contractors, or contract line items are driving cost or schedule problems. It allows a PM to answer the question \"WHERE is the variance coming from?\" rather than just knowing the total variance magnitude."
          },
          {
            id: 'q4',
            question: "On an S-Curve, if the BCWP (EV) line is consistently below the BCWS (PV) line, this indicates:",
            options: ['The program is over budget', 'The program is behind schedule — less work has been accomplished than planned', 'The program is technically deficient', 'Contractor staffing is insufficient'],
            correct: 1,
            explanation: "On an S-Curve, BCWP below BCWS represents a schedule variance (SV = EV - PV < 0) — the program has accomplished less work than planned. This is a schedule problem, not necessarily a cost problem. If ACWP is also above BCWP, there is simultaneously a cost problem. Reading S-Curve gap patterns is a core EVM skill."
          },
          {
            id: 'q5',
            question: "Data normalization is important when comparing program metrics because:",
            options: ['It reduces the volume of data to present', 'It adjusts data to a common scale, enabling meaningful comparison (e.g., cost per unit rather than total cost)', 'It removes classified information from reports', 'It is required by DFARS for IPMR reporting'],
            correct: 1,
            explanation: "Normalization adjusts raw data to a common scale so meaningful comparisons can be made. A $10M overrun on a $50M program is far more significant than a $10M overrun on a $5B program — normalizing to percentage reveals the relative magnitude. Without normalization, comparing programs of different scales produces misleading conclusions."
          },
          {
            id: 'q6',
            question: "The primary purpose of a 5×5 risk matrix in a program review is to:",
            options: ['Calculate the exact dollar cost of each risk', 'Visually display all program risks by probability and impact to prioritize management attention', 'Replace the formal risk register with a simpler tool', 'Satisfy DCMA surveillance requirements'],
            correct: 1,
            explanation: "A 5×5 risk matrix plots risks on a grid of probability (1-5) vs. impact (1-5), creating a visual \"heat map\" that immediately shows where management attention should focus — the high-probability, high-impact upper-right quadrant. It complements (but does not replace) the detailed risk register with a quick-look visualization for leadership."
          },
          {
            id: 'q7',
            question: "A program's monthly burn rate chart shows actual obligations consistently 20% below planned. The most likely implication for future-year funding is:",
            options: ['The program is performing efficiently and will save money', 'The program may face future-year funding reductions due to apparent under-execution', 'The program needs a contract modification to reduce the ceiling', 'The government should immediately terminate the contract'],
            correct: 1,
            explanation: "Consistent under-execution signals to higher headquarters that the program either doesn't need as much money as it requested, or is unable to efficiently execute its current funding. This is the \"use it or lose it\" dynamic — programs that routinely under-execute face FYDP reductions, as budget analysts assume the excess funding can be applied to higher-priority programs."
          },
          {
            id: 'q8',
            question: "A trend line projected from historical CPI data is valuable to a PM because:",
            options: ['It is the official DoD method for calculating EAC', 'It shows where program cost performance is heading if current trends continue, enabling proactive intervention', 'It satisfies the IPMR Format 5 requirement', 'It replaces the need for contractor EAC submissions'],
            correct: 1,
            explanation: "Trend lines (often called \"CPI trend analysis\") extrapolate historical performance into the future, giving PMs a data-driven view of likely outcomes absent intervention. A declining CPI trend that is not yet in \"red\" territory but is consistently worsening should prompt investigation and corrective action before a formal threshold breach."
          },
          {
            id: 'q9',
            question: "When presenting a program's TPM (Technical Performance Measure) data, including the \"planned maturity profile\" alongside actual values is important because:",
            options: ['It is required by DFARS 252.234-7002', 'It allows stakeholders to assess whether technical achievement is pacing correctly, not just whether the final target has been met', 'The planned profile determines the contractor\'s award fee', 'It replaces the need for system testing data'],
            correct: 1,
            explanation: "The planned maturity profile contextualizes TPM data — a radar system achieving 60 Mbps throughput is either excellent or poor depending on whether the plan called for 40 Mbps or 80 Mbps at that point in development. Without the planned profile, decision-makers cannot assess whether technical development is on track."
          },
          {
            id: 'q10',
            question: "A radar chart (spider chart) is most useful for which type of program management analysis?",
            options: ['Showing cumulative cost and schedule trends over time', 'Comparing multiple programs or contractors across several dimensions simultaneously', 'Displaying the critical path and dependencies', 'Calculating EAC from CPI data'],
            correct: 1,
            explanation: "Radar/spider charts plot multiple dimensions (e.g., cost, schedule, technical, risk, quality) for multiple entities on the same chart, making them ideal for portfolio-level comparisons. A PEO reviewing 10 programs can quickly identify which programs are strong across all dimensions and which have specific weaknesses. They're not appropriate for single-program trend analysis over time."
          }
        ]
      }
    ]
  },

  // ─────────────────────────────────────────────────────────────
  // MODULE 5 — CAPTURE
  // ─────────────────────────────────────────────────────────────
  {
    id: 'capture',
    title: 'Capture Management & Business Development',
    subtitle: 'Module 5',
    icon: '🎯',
    color: 'amber',
    description: 'Master the art and science of winning government contracts — from opportunity identification through proposal submission.',
    lessons: [
      {
        id: 'capture-1',
        title: 'The BD-to-Capture Lifecycle',
        duration: '15 min',
        description: 'Understand how leading defense firms identify, qualify, and pursue government contract opportunities.',
        keyTerms: [
          { term: 'Pipeline', definition: 'The portfolio of all opportunities a company is tracking at various stages of pursuit.' },
          { term: 'Pwin', definition: 'Probability of Win — an estimate of the likelihood of winning a given opportunity.' },
          { term: 'B&P', definition: 'Bid & Proposal — funding spent pursuing a specific opportunity (not chargeable to government contracts).' },
          { term: 'Opportunity Qualification', definition: 'The process of deciding whether to invest BD resources in pursuing an opportunity (gate review).' },
          { term: 'Incumbent', definition: 'The contractor currently performing work on a contract being re-competed.' },
          { term: 'Shaping', definition: 'Influencing the RFP requirements, scope, and evaluation criteria before the solicitation is released.' },
        ],
        content: [
          {
            type: 'text',
            heading: "How Defense Contractors Win Business",
            body: "Winning government contracts is not an accident — it's a disciplined process that begins years before the RFP is released. The best capture managers are already executing their win strategy while competitors are just becoming aware of the opportunity. Understanding this lifecycle helps both government PMs (who interact with BD teams) and industry professionals who want to build winning capture programs."
          },
          {
            type: 'table',
            heading: "The BD-to-Capture-to-Proposal Lifecycle",
            headers: ['Phase', 'Activities', 'Key Deliverables', 'Pwin Range'],
            rows: [
              ['Opportunity Identification', 'Market research, relationship building, forecast monitoring', 'Opportunity Brief', '< 20%'],
              ['Qualification', 'Gate review: strategic fit, competition, Pwin assessment', 'Go/No-Go Decision', '20-30%'],
              ['Capture', 'Customer engagement, team formation, win strategy development', 'Capture Plan, Black Hat', '30-50%'],
              ['Proposal Development', 'Writing, review cycles (Pink/Red/Gold teams), pricing', 'Compliant, compelling proposal', '50-70%'],
              ['Negotiation/Award', 'BAFO, negotiations, award', 'Contract Award', 'Award or loss'],
            ]
          },
          {
            type: 'callout',
            heading: "The Shaping Window",
            body: "The most impactful capture work happens BEFORE the RFP drops. During the shaping window, smart capture managers engage government stakeholders (within the boundaries of procurement integrity), suggest evaluation criteria that favor their firm's differentiators, help define requirements that their solution already meets, and understand the incumbent's weaknesses. Once the RFP is released, the opportunity to shape the competition is 95% closed."
          },
          {
            type: 'list',
            heading: "Building a Winning Capture Plan",
            items: [
              'Customer profile: Who are the decision-makers? What do they care about most?',
              'Competitive analysis: Who will bid? What are their strengths and vulnerabilities?',
              'Win themes: 3-5 compelling reasons why your solution is the best choice for this customer',
              'Discriminators: What can your firm do that competitors cannot? (or do demonstrably better)',
              'Team strategy: Prime vs. sub; which partners add capability, contract vehicles, or customer relationships?',
              'Price-to-win (PTW): What price position will win? (Not your cost — the price that wins)',
              'Risk assessment: What could derail this capture? What\'s the mitigation?',
            ]
          },
          {
            type: 'tip',
            heading: "Black Hat Reviews",
            body: "A \"Black Hat\" review is when your team role-plays as your competitor — developing their proposal strategy, win themes, and pricing approach as if you were them. This forces you to honestly assess your competitor's strengths and identify vulnerabilities in your own approach. The best black hats are brutal; if yours is comfortable, you're not being honest enough about the competition."
          }
        ],
        quiz: [
          {
            id: 'q1',
            question: "The \"shaping window\" in defense capture management refers to:",
            options: ['The final week before proposal submission', 'The period before RFP release when capture managers can influence requirements and evaluation criteria', 'The competitive range determination phase', 'The period after contract award when pricing is finalized'],
            correct: 1,
            explanation: "The shaping window is the pre-RFP period when companies legally engage with government stakeholders to understand requirements, provide industry input, and potentially influence how requirements are written and evaluated. Once the RFP is released, the ability to shape the competition is largely foreclosed."
          },
          {
            id: 'q2',
            question: "A \"Black Hat\" review in capture management is used to:",
            options: ['Conduct a security review of proposal sensitive information', 'Role-play competitor strategy to identify your vulnerabilities and their likely approach', 'Evaluate the cost/price elements of the proposal', 'Review the proposal for compliance with Section L'],
            correct: 1,
            explanation: "A Black Hat review involves your team acting as the competition — developing their proposal strategy, strengths, win themes, and pricing approach as if you were them. This reveals your own vulnerabilities, helps counter competitor discriminators in your proposal, and creates more realistic Pwin assessments."
          },
          {
            id: 'q3',
            question: "B&P (Bid & Proposal) costs are:",
            options: ['Reimbursable by the government as a direct contract cost', 'Company-funded investments in pursuing specific opportunities, not chargeable to government contracts', 'Included in indirect overhead pools', 'Only applicable to cost-plus contracts'],
            correct: 1,
            explanation: "B&P costs are the company's investment in pursuing a specific opportunity — proposal writing, customer engagement, pricing analysis. These are NOT directly chargeable to government contracts. They are typically funded from company overhead pools (G&A or B&P pools) and represent a significant strategic investment, often 1-3% of revenue for major defense firms."
          },
          {
            id: 'q4',
            question: "The \"Price to Win\" (PTW) analysis in capture management determines:",
            options: ['The contractor\'s cost to perform the work', 'The price point at which your proposal will be competitive and most likely to win, based on competitor pricing analysis', 'The government\'s independent cost estimate', 'The minimum acceptable profit margin'],
            correct: 1,
            explanation: "PTW is the price at which you expect to win based on competitive analysis — not your internal cost estimate. A PTW significantly higher than your internal cost suggests strong competitive position; one lower than your cost requires a decision about whether to compete, reduce costs, or accept lower margin. PTW drives pricing strategy and team composition decisions."
          },
          {
            id: 'q5',
            question: "In the BD-to-Capture lifecycle, what is the primary purpose of the \"gate review\" or opportunity qualification process?",
            options: ['To review the draft proposal for compliance', 'To make a disciplined go/no-go decision on whether to invest B&P resources in pursuing an opportunity', 'To evaluate subcontractor qualifications', 'To finalize the teaming arrangement'],
            correct: 1,
            explanation: "The gate review is the company's governance process for allocating limited B&P resources. It evaluates strategic fit, competitive position, Pwin, customer relationship, and resource availability. A \"no-go\" decision is not a failure — it conserves B&P investment for higher-Pwin opportunities. Companies that pursue every opportunity without qualification waste resources on long shots."
          },
          {
            id: 'q6',
            question: "Pwin (Probability of Win) in defense capture management is important because:",
            options: ['It is a contractual requirement that must be documented', 'It drives resource allocation decisions — higher Pwin opportunities justify more B&P investment', 'It determines the contractor\'s profit margin on the contract', 'It is used by the government to evaluate offeror qualifications'],
            correct: 1,
            explanation: "Pwin guides B&P resource allocation. A 70% Pwin opportunity justifies significant investment; a 15% Pwin opportunity may not. Pwin should be continuously updated as new information emerges — customer intel, competitive developments, RFP changes. An honest, data-driven Pwin assessment is a sign of mature capture management."
          },
          {
            id: 'q7',
            question: "During capture management, \"teaming\" decisions are made to:",
            options: ['Satisfy DCMA contract administration requirements', 'Add capability, past performance, or diversity qualifications that strengthen the prime\'s proposal position', 'Meet internal headcount goals', 'Reduce the amount of B&P investment required'],
            correct: 1,
            explanation: "Teaming decisions are strategic — companies partner with firms that add critical capabilities the prime lacks, bring relationships with the customer, provide small business credits, add key personnel with relevant experience, or hold contract vehicles the prime cannot access. The best teams are built to win, not assembled as an afterthought."
          },
          {
            id: 'q8',
            question: "The \"incumbent\" advantage in a contract re-competition is significant because:",
            options: ['The government is required to award the follow-on to the incumbent', 'Incumbents have superior program knowledge, established customer relationships, and lower risk perception', 'Incumbent pricing is automatically accepted as fair and reasonable', 'Incumbents are exempt from past performance evaluation'],
            correct: 1,
            explanation: "Incumbents have significant advantages: deep knowledge of the program, established customer trust, a staffed team already in place, and an in-place performance record. For challengers, displacing a performing incumbent requires compelling discriminators and a clear articulation of why the new team will perform better. Incumbent win rates on re-competes often exceed 70%."
          },
          {
            id: 'q9',
            question: "A \"Gold Team\" review in proposal development is typically the:",
            options: ['First internal review of the proposal outline', 'Final senior leadership review of the near-final proposal before submission', 'Government\'s evaluation of the submitted proposal', 'Pricing team\'s review of cost volumes'],
            correct: 1,
            explanation: "In the standard defense proposal review cycle: Pink Team reviews the draft, Red Team reviews the near-final draft for compliance and quality, and Gold Team is the final senior leadership review of an essentially complete proposal. Gold Team focuses on win themes, discriminators, and executive summary — not line editing."
          },
          {
            id: 'q10',
            question: "Win themes in a capture plan should be:",
            options: ['Generic statements about quality and past performance that apply to any proposal', 'Specific, customer-validated reasons why your solution best addresses THIS customer\'s most important needs', 'Primarily focused on price competitiveness', 'Developed after the RFP is released based on Section M criteria'],
            correct: 1,
            explanation: "Win themes must be specific to the customer and opportunity — generic themes like \"we are a quality company with excellent past performance\" are meaningless in a competitive environment. Effective win themes are customer-validated (you know this is what the customer cares about), tied to your discriminators (you can do this better than competitors), and ghost competitor weaknesses (they cannot match you here)."
          }
        ]
      },
      {
        id: 'capture-2',
        title: 'Proposal Development & Win Strategy',
        duration: '14 min',
        description: 'Write and review proposals that win — from compliance matrices to compelling executive summaries.',
        keyTerms: [
          { term: 'Compliance Matrix', definition: 'A document cross-referencing every Section L requirement against the proposal section that addresses it.' },
          { term: 'Discriminator', definition: 'A specific, provable capability or attribute that differentiates your proposal from competitors\' proposals.' },
          { term: 'Ghosting', definition: 'Subtly highlighting a competitor\'s weakness in your proposal without naming them directly.' },
          { term: 'Win Theme', definition: 'A compelling, customer-specific message that explains why your solution best meets the customer\'s need.' },
          { term: 'APMP', definition: 'Association of Proposal Management Professionals — the industry organization for proposal professionals.' },
          { term: 'Executive Summary', definition: 'The first and most read section of a proposal — must convey all win themes and discriminators concisely.' },
        ],
        content: [
          {
            type: 'text',
            heading: "Proposals Are Evaluated, Not Read",
            body: "SSEB evaluators often have 50+ proposals to review in 3-4 weeks. They are looking for specific evidence that requirements are met — they are NOT reading your proposal like a book. This means every proposal must be compliance-first (answer everything Section L asks), discriminator-forward (lead with your strengths), and evaluator-friendly (headers that mirror Section M factors, clear evidence, no fluff)."
          },
          {
            type: 'list',
            heading: "Anatomy of a Winning Technical Proposal",
            items: [
              'Executive Summary: State your win themes and discriminators upfront — 2 pages maximum',
              'Technical Approach: Describe HOW you will solve the problem — specific, not generic',
              'Management Approach: How will you staff, manage, and deliver? Show your program management process',
              'Past Performance: Analogous contracts with measurable results — quality over quantity',
              'Price/Cost Volume: Realistic, well-supported pricing with clear assumptions',
              'Compliance Matrix: Every Section L requirement mapped to your proposal response',
            ]
          },
          {
            type: 'callout',
            heading: "The Discriminator Rule",
            body: "A true discriminator is something you can do (or have done) that your competitors cannot match. \"20 years of experience\" is not a discriminator — every major defense firm has 20 years of experience. A discriminator sounds like: \"We hold the only cleared facility for this specific testing in the continental U.S.\" or \"Our team developed the predecessor system and holds all historical technical data.\" If your competitor could say the same thing, it's not a discriminator."
          },
          {
            type: 'table',
            heading: "Proposal Review Cycle",
            headers: ['Review', 'When', 'Focus', 'Output'],
            rows: [
              ['Pink Team', '30-40% complete', 'Outline, approach, compliance check', 'Annotated outline feedback'],
              ['Red Team', '80-90% complete', 'Full compliance, win themes, narrative quality', 'Detailed written evaluation vs. Section M'],
              ['Gold Team', '95-100% complete', 'Senior leadership approval; win theme coherence', 'Final approval to submit'],
              ['Price Review', 'Concurrent with volumes', 'Price-to-win, cost realism, assumptions', 'Final price decision'],
            ]
          },
          {
            type: 'tip',
            heading: "The Ghost-Discriminate-Prove Framework",
            body: "Structure every key proposal section using three elements: (1) Ghost — hint at why your competitor's approach is riskier (\"Unlike approaches relying on commercial hardware not designed for military environments...\"). (2) Discriminate — state your advantage clearly (\"Our MIL-SPEC hardened components provide 3× the MTBF of commercial equivalents\"). (3) Prove — evidence that backs your claim (\"demonstrated on Contract #: X, achieving 99.7% availability in deployed conditions\")."
          }
        ],
        quiz: [
          {
            id: 'q1',
            question: "A compliance matrix in proposal development is used to:",
            options: ['Ensure the proposal price is competitive', 'Cross-reference every Section L requirement with the proposal section that addresses it, ensuring no requirement is missed', 'Document the contractor\'s legal compliance certifications', 'Map past performance examples to technical requirements'],
            correct: 1,
            explanation: "A compliance matrix is a cross-reference tool that maps every requirement in Section L (Instructions to Offerors) to the specific proposal section, page, and paragraph that responds to it. It ensures no requirement is missed and provides the SSEB with a navigational aid. Missing a Section L requirement is an automatic compliance deficiency."
          },
          {
            id: 'q2',
            question: "\"Ghosting\" in a proposal context means:",
            options: ['Submitting the proposal without notifying the CO', 'Subtly highlighting a competitor\'s weakness without naming them, making evaluators consider the risk', 'Using a subcontractor\'s capabilities as your own without disclosure', 'Withdrawing a proposal after submission'],
            correct: 1,
            explanation: "Ghosting is a legal and ethical proposal technique where you allude to competitor weaknesses without naming them. For example: \"Unlike approaches that rely on a single vendor for critical components, our multi-source supply chain mitigates delivery risk.\" This plants a risk concern in the evaluator's mind about competitors without direct attacks."
          },
          {
            id: 'q3',
            question: "The Red Team review of a proposal is typically conducted when the proposal is approximately:",
            options: ['10-20% complete (outline stage)', '80-90% complete (near-final draft)', '100% complete (final version)', 'Before capture planning begins'],
            correct: 1,
            explanation: "Red Team reviews the near-final draft (80-90% complete) for full compliance with Section L, win theme effectiveness, narrative quality, and how the proposal would score against Section M criteria. Reviewing too early misses actual proposal content; reviewing too late leaves no time to incorporate feedback."
          },
          {
            id: 'q4',
            question: "The executive summary of a proposal is the most important section because:",
            options: ['It is the only section evaluated by the SSEB for cost-plus contracts', 'It is the first and most read section, and must convey all win themes and discriminators concisely', 'It determines the final proposal score under FAR 15', 'It is submitted separately from the main proposal volumes'],
            correct: 1,
            explanation: "The executive summary is often the only section read by senior evaluators and the SSA. If your win themes and discriminators aren't clear in the executive summary, they may never be seen. Senior leadership reads exec summaries; technical evaluators read the volumes. Write for both audiences, but get the exec summary right first."
          },
          {
            id: 'q5',
            question: "APMP (Association of Proposal Management Professionals) is relevant to DoD acquisition professionals because:",
            options: ['Membership is required for all Contracting Officers', 'It is the professional community and certification body for proposal management, providing standards and training for BD/capture/proposal roles', 'It is a government agency managing the federal procurement portal', 'It issues security clearances for proposal work'],
            correct: 1,
            explanation: "APMP is the international professional organization for proposal management professionals. It offers certifications (Foundation, Practitioner, Professional), best practices, training, and a community of practice. For contractors building proposal capability, APMP membership and certification signals professional-grade proposal management skills."
          },
          {
            id: 'q6',
            question: "When writing a proposal technical section, which approach is most effective for SSEB evaluators?",
            options: ['Long narrative descriptions of the company\'s history and capabilities', 'Section headers that mirror Section M evaluation factors, with clear evidence and specific discriminators', 'Generic quality and performance statements applicable to any program', 'Technical detail far exceeding the page limit requirements'],
            correct: 1,
            explanation: "SSEB evaluators use Section M criteria to score proposals. Organizing your proposal with headers that mirror evaluation factor names and subfactors makes it easy for evaluators to find your response, verify compliance, and assign credit. Proposals that bury responses in running prose make evaluators work harder — and they may not find your strengths."
          },
          {
            id: 'q7',
            question: "A true proposal discriminator is characterized by which quality?",
            options: ['It applies generically to any offeror in the defense market', 'It is a specific, provable capability that competitors cannot credibly claim', 'It focuses primarily on price competitiveness', 'It is developed during the Red Team review phase'],
            correct: 1,
            explanation: "Discriminators must be specific (linked to a particular capability or achievement), provable (backed by verifiable evidence), and unique (competitors cannot honestly make the same claim). Generic statements like \"experienced team\" or \"commitment to quality\" are not discriminators — they are table stakes."
          },
          {
            id: 'q8',
            question: "Past performance in a proposal is evaluated based on:",
            options: ['The number of contracts listed regardless of relevance', 'The recency, relevance, and quality of demonstrated performance on similar work', 'Years in business as the prime contractor', 'The size of contracts listed regardless of scope'],
            correct: 1,
            explanation: "Past performance evaluations focus on recency (within 3-5 years), relevance (similar size, scope, and complexity), and quality (CPARs ratings, customer feedback, measurable outcomes). A single highly relevant, recently completed, highly rated contract is worth more than five marginally relevant historical contracts from 10 years ago."
          },
          {
            id: 'q9',
            question: "In the \"Ghost-Discriminate-Prove\" proposal framework, \"prove\" requires:",
            options: ['A legal certification from the company\'s general counsel', 'Specific, verifiable evidence backing the discriminating claim (e.g., contract number, metrics achieved)', 'A competitor analysis showing their weaknesses', 'Senior executive endorsement of the win theme'],
            correct: 1,
            explanation: "\"Prove\" means providing specific evidence that your discriminator claim is real — a contract number, a measurable result (99.7% system availability), a customer quote from CPARS, or a technical test result. Claims without evidence are assertions; claims with evidence are discriminators. SSEB evaluators specifically look for substantiated claims."
          },
          {
            id: 'q10',
            question: "When developing a proposal management plan (PMP) for a large defense opportunity, the most critical schedule consideration is:",
            options: ['Setting the Gold Team date as far from submission as possible', 'Working backward from the RFP due date to set Pink/Red/Gold review milestones with sufficient time to incorporate feedback', 'Scheduling all reviews in the week before submission', 'Setting the Price review after the Technical volumes are complete'],
            correct: 1,
            explanation: "Effective proposal scheduling works backward from the submission due date. Gold Team needs to complete 5-7 days before due date to allow final revisions and production. Red Team needs to complete with enough time to incorporate feedback. Pink Team needs to review an outline that allows substantive volume development afterward. Compressing the review cycle is the most common proposal management failure."
          }
        ]
      }
    ]
  },

  // ─────────────────────────────────────────────────────────────
  // MODULE 6 — OPERATIONS
  // ─────────────────────────────────────────────────────────────
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
            heading: "Risk is Inherent in Defense Programs",
            body: "Every defense program operates in an environment of uncertainty — technical risks, schedule risks, funding risks, and supply chain risks. The best Program Managers don't avoid risk; they manage it systematically. DoD's Risk, Issue, and Opportunity (RIO) Management Guide provides the framework. Integrating risk management into every program review — not just as a standalone briefing — is the mark of a mature program office."
          },
          {
            type: 'formula',
            heading: "Risk Assessment Matrix",
            formula: 'Risk Level = Probability × Impact\nHigh Risk: P ≥ 50% AND Impact ≥ 3 (on 5-point scale)\nMedium Risk: P 20-49% OR Impact = 2-3\nLow Risk: P < 20% AND Impact ≤ 2',
            explanation: "Use a 5×5 risk matrix (Probability: 1-5, Impact: 1-5) to plot and prioritize risks. Focus mitigation resources on high-probability, high-impact risks first. Track risk burn-down over time as a program health indicator."
          },
          {
            type: 'list',
            heading: "The RIO Management Process (DoD Standard)",
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
            heading: "Management Reserve — Your Safety Net",
            body: "MR is budget held back from the Performance Measurement Baseline (PMB) to fund identified risks. Typically 5-10% of the program budget. Using MR requires formal documentation and CO approval on cost-reimbursable contracts. PMs who protect their MR have the flexibility to weather surprises; those who spend it early on routine work find themselves with no cushion when real problems hit."
          },
          {
            type: 'table',
            heading: "Risk vs. Issue vs. Opportunity",
            headers: ['Category', 'Definition', 'Management Action'],
            rows: [
              ['Risk', 'A potential future adverse event', 'Mitigate: reduce probability or impact before it occurs'],
              ['Issue', 'A risk that has materialized', 'Resolve: develop corrective action plan immediately'],
              ['Opportunity', 'A potential future positive event', 'Exploit, enhance, share, or accept the benefit'],
            ]
          }
        ],
        quiz: [
          {
            id: 'q1',
            question: "Management Reserve (MR) in a defense program is intended to:",
            options: [
              'Cover known, well-defined work that is already planned',
              'Fund identified risks and unforeseen events that affect the Performance Measurement Baseline',
              'Pay for program management overhead costs',
              "Supplement the contractor's profit on cost-plus contracts"
            ],
            correct: 1,
            explanation: "MR is budget above the Performance Measurement Baseline (PMB) held at the program manager level to address identified risks and unforeseen events. It is NOT planned into the PMB and NOT associated with specific work packages. MR use requires formal justification."
          },
          {
            id: 'q2',
            question: "In a 5×5 risk matrix, a risk rated Probability=4 and Impact=4 would be classified as:",
            options: ['Low risk', 'Medium risk', 'High risk', 'Critical risk requiring immediate program restructure'],
            correct: 2,
            explanation: "A P=4, I=4 risk scores 16 on a 25-point scale — firmly in the High risk category. DoD guidance calls for active mitigation plans, dedicated resources, and tracking at the senior PM level for high risks. The risk burn-down chart should show this risk trending down over time as mitigation actions are executed."
          },
          {
            id: 'q3',
            question: "What is a \"risk burn-down chart\" used for in defense program management?",
            options: [
              'Tracking the number of risks added per month',
              'Showing how risk probability and impact decrease over time as mitigation actions are executed',
              'Charting contractor cost overruns by risk category',
              'Displaying the Management Reserve balance over time'
            ],
            correct: 1,
            explanation: "A risk burn-down chart tracks risk scores (probability × impact) over time as mitigation actions reduce them. It is a standard artifact at program reviews, demonstrating that the PM is actively managing risk — not just listing it. Flat or rising burn-down charts signal to leadership that mitigation is ineffective."
          },
          {
            id: 'q4',
            question: "Under DoD's RIO Management framework, what is the correct definition of an \"Issue\"?",
            options: [
              'A potential future adverse event that has not yet occurred',
              'A risk that has already materialized and requires a corrective action plan',
              'Any unplanned cost or schedule variance',
              'A concern raised by the contractor that has not been resolved'
            ],
            correct: 1,
            explanation: "In the DoD Risk, Issue, and Opportunity (RIO) framework, an Issue is specifically a risk that has materialized — it is no longer a potential event but an actual problem requiring resolution. Issues require corrective action plans with assigned owners, timelines, and escalation paths if not resolved."
          },
          {
            id: 'q5',
            question: "Undistributed Budget (UB) in a defense program refers to:",
            options: [
              'Budget that has been allocated but not yet spent',
              'Budget that has not yet been assigned to specific control accounts or work packages',
              "The contractor's fee on a cost-plus contract",
              'Reserve funding held by the contracting officer'
            ],
            correct: 1,
            explanation: "Undistributed Budget (UB) is budget within the program's Total Allocated Budget that has not yet been distributed to specific control accounts or work packages. It typically occurs when work scope is known but not yet formally assigned. UB must be distributed as planning progresses and cannot remain undistributed indefinitely."
          },
          {
            id: 'q6',
            question: "Which of the following is an example of \"Opportunity Management\" in defense programs?",
            options: [
              'Identifying a new contract vehicle that reduces administrative costs',
              'Exploiting early technology maturation to reduce schedule by accelerating testing',
              'Hiring additional staff to address a schedule delay',
              'Requesting supplemental funding from Congress'
            ],
            correct: 1,
            explanation: "Opportunity management involves actively exploiting positive risks — events that, if they occur, would benefit the program. Early technology maturation allowing accelerated testing is a classic opportunity. PMs should manage opportunities with the same rigor as risks: identify, analyze, plan exploitation, and track."
          },
          {
            id: 'q7',
            question: "A program is at the 15% completion point with a CPI of 0.72. Based on historical DoD program data, what is the most likely outcome?",
            options: [
              'The program will likely recover to a CPI > 0.90 by completion',
              'This is too early to draw meaningful conclusions about final CPI',
              'The CPI is unlikely to recover significantly; a substantial cost overrun at completion is probable',
              'The program will be restructured within 6 months'
            ],
            correct: 2,
            explanation: "Research by David Christensen and others demonstrates that CPI rarely improves once programs are 20%+ complete. A CPI of 0.72 at 15% completion is a serious warning sign. While some recovery is possible, the statistical likelihood of finishing near budget is low. The PM should be preparing a formal re-baseline or program restructure."
          },
          {
            id: 'q8',
            question: "What does the DoD's \"5-step\" risk management process include in order?",
            options: [
              'Plan, Identify, Analyze, Track, Control',
              'Identify, Analyze, Plan, Track, Control',
              'Analyze, Identify, Mitigate, Retire, Report',
              'Identify, Plan, Execute, Assess, Close'
            ],
            correct: 1,
            explanation: "The DoD RIO Management Guide defines the five-step process as: Identify (brainstorm risks), Analyze (assess probability and impact), Plan (develop mitigation strategies), Track (monitor risk status at reviews), and Control (execute mitigations and retire closed risks). This sequence is important: you cannot plan before you analyze."
          },
          {
            id: 'q9',
            question: "When should Management Reserve (MR) typically be included in a program's budget?",
            options: [
              'MR is never included — it violates the Anti-Deficiency Act',
              'MR is included above the Performance Measurement Baseline to cover risk events',
              'MR is held by the contracting officer and cannot be accessed by the PM',
              'MR is only available on fixed-price contracts'
            ],
            correct: 1,
            explanation: "MR is legitimate and expected in defense programs. It is held above the PMB by the PM (not built into individual work packages) and used to respond to identified risks or unforeseen events. On cost-type contracts, accessing MR typically requires a contract modification. MR is distinct from contractor-held contingency."
          },
          {
            id: 'q10',
            question: "Which review type is specifically designed to validate that identified risks have adequate mitigation plans before proceeding to the next program phase?",
            options: ['System Requirements Review (SRR)', 'In-Process Review (IPR)', 'Risk Management Review (RMR)', 'Program Management Review (PMR)'],
            correct: 2,
            explanation: "A Risk Management Review (RMR) is a dedicated program review focused specifically on the status of the risk register, burn-down progress, and adequacy of mitigation plans. Unlike PMRs which cover all program aspects, RMRs provide focused scrutiny on risk posture and are often held quarterly or before major milestone events."
          }
        ]
      },
      {
        id: 'ops-2',
        title: 'Stakeholder Management & Executive Communication',
        duration: '13 min',
        description: 'Build the relationships and communication skills that separate effective PMs from mere managers.',
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
            heading: "Programs Are a People Business",
            body: "The most technically sound acquisition strategy will fail if the PM cannot build coalitions, manage upward expectations, and communicate clearly to decision-makers who have 10 minutes to understand your program. The ability to distill complex program status into a crisp, data-backed narrative is one of the most valuable skills in defense acquisitions."
          },
          {
            type: 'list',
            heading: "The PM's Stakeholder Map",
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
            heading: "The \"1-3-5\" Communication Rule",
            body: "Structure every executive brief as: 1 core message (what do I need you to know?), 3 supporting data points (why should you believe me?), 5 minutes maximum for the verbal summary. Senior leaders are making decisions across dozens of programs — the PM who can brief clearly and confidently earns trust and resources."
          },
          {
            type: 'table',
            heading: "Common Defense Program Reviews",
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
            heading: "Building Your Network Early",
            body: "The acquisition community is small. The Captain or Major you work with today is the Colonel or General you'll brief in 10 years. The GS-11 analyst across the table becomes the SES you'll be pitching your company to. Invest in every professional relationship — return calls, deliver on commitments, and be the person who solves problems rather than creates them."
          }
        ],
        quiz: [
          {
            id: 'q1',
            question: "A Critical Design Review (CDR) is typically conducted to:",
            options: [
              'Validate that system requirements are complete at the beginning of Engineering & Manufacturing Development',
              'Confirm the detailed design is sufficiently mature to proceed with production',
              "Approve the program's budget and schedule baseline at Milestone B",
              'Review contractor past performance before source selection'
            ],
            correct: 1,
            explanation: "The Critical Design Review (CDR) confirms the detailed design is stable and mature enough to enter production. CDR examines complete design drawings, technical risk, test plans, and manufacturing readiness. A failed CDR typically results in a program pause and design rework."
          },
          {
            id: 'q2',
            question: "The Program Executive Officer (PEO) in the defense acquisition hierarchy primarily:",
            options: [
              'Signs all contracts on behalf of the government',
              'Manages a portfolio of programs and is the direct superior of individual Program Managers',
              'Reports directly to the Secretary of Defense',
              "Represents Congress's oversight interest in acquisition programs"
            ],
            correct: 1,
            explanation: "The PEO manages a portfolio of related acquisition programs and serves as the direct superior to individual PMs. PEOs report to the Service Acquisition Executive (SAE) and are typically general officers or senior civilian equivalents. They fight for resources, resolve cross-program issues, and represent their portfolio at senior acquisition forums."
          },
          {
            id: 'q3',
            question: "An Integrated Product Team (IPT) in defense acquisitions is best described as:",
            options: [
              'A congressional oversight committee for major programs',
              'A cross-functional team of government and contractor representatives responsible for a specific program area',
              'An OSD-level board that approves milestone decisions',
              'A testing organization that certifies systems for operational use'
            ],
            correct: 1,
            explanation: "IPTs are cross-functional teams that bring together all relevant functional areas (engineering, logistics, finance, contracting, testing) to collaboratively manage a specific aspect of a program. The Overarching IPT (OIPT) sits above program-level IPTs and resolves cross-functional conflicts that cannot be resolved at the program level."
          },
          {
            id: 'q4',
            question: "Which stakeholder group is most responsible for generating the requirements that drive defense acquisition programs?",
            options: [
              'OSD Cost Assessment and Program Evaluation (CAPE)',
              'Congressional defense committees',
              'Combatant Commands and operational users through JCIDS',
              'Defense contractors during market research'
            ],
            correct: 2,
            explanation: "Requirements for new military systems originate from the warfighters — the Combatant Commands and operational users who identify capability gaps. These needs flow through the Joint Capabilities Integration and Development System (JCIDS), which validates and prioritizes requirements before they reach the acquisition system."
          },
          {
            id: 'q5',
            question: "The \"1-3-5\" executive communication rule is designed to:",
            options: [
              'Limit briefings to 1 slide, 3 bullets, and 5 minutes of Q&A',
              'Structure communications as 1 core message, 3 supporting data points, and 5-minute verbal summary',
              'Set 1-year, 3-year, and 5-year program objectives for executives',
              'Require 1 weekly, 3 monthly, and 5 quarterly reviews for ACAT I programs'
            ],
            correct: 1,
            explanation: "The 1-3-5 rule structures executive communication for maximum clarity: 1 core message (what you need the leader to know or decide), 3 supporting data points (the evidence), and a 5-minute verbal summary. Senior acquisition leaders manage many programs simultaneously — concise, structured communication earns credibility and trust."
          },
          {
            id: 'q6',
            question: "A System Requirements Review (SRR) is conducted at which point in the acquisition lifecycle?",
            options: [
              'After Milestone C, before production begins',
              'Before Milestone A, during the Materiel Solution Analysis phase',
              'During the Technology Maturation and Risk Reduction phase (Phase A)',
              'After Critical Design Review, before testing begins'
            ],
            correct: 2,
            explanation: "The SRR is conducted during the Technology Maturation and Risk Reduction (TMRR) phase — Phase A — to validate that system-level requirements are complete, feasible, and testable before design begins. Conducting an SRR too late (after design has started) is a common and costly mistake."
          },
          {
            id: 'q7',
            question: "Congressional staff members who monitor defense acquisition programs are significant stakeholders because:",
            options: [
              'They can directly cancel programs through committee votes at any time',
              'They influence authorization and appropriations legislation, and their concerns can affect program funding and direction',
              'They must approve all contracts over $100M',
              'They conduct independent technical reviews of all ACAT I programs'
            ],
            correct: 1,
            explanation: "Congressional staff on defense authorization and appropriations committees wield significant influence. They can add or cut program funding, attach restrictive conditions, require reports, or trigger oversight hearings. A well-briefed congressional staffer is an ally; an uninformed or adversarial staffer can complicate program execution considerably."
          },
          {
            id: 'q8',
            question: "The Defense Acquisition Board (DAB) primarily serves which function?",
            options: [
              'Managing day-to-day program execution for all ACAT programs',
              'Providing milestone decision authority for ACAT I programs to USD(A&S)',
              'Conducting annual budget reviews for the FYDP',
              'Certifying contracting officers for major acquisitions'
            ],
            correct: 1,
            explanation: "The Defense Acquisition Board (DAB) is the senior DoD forum for reviewing major defense acquisition programs at milestone decisions. USD(A&S) serves as the DAB chair for ACAT I programs. The DAB examines program status across cost, schedule, performance, and risk before authorizing transition to the next acquisition phase."
          },
          {
            id: 'q9',
            question: "When preparing a Monthly Status Review (MSR) for the PEO, what information should the PM always be ready to present?",
            options: [
              'Contractor profit margins and fee structures',
              'Cost and schedule performance (CPI/SPI), technical progress, risk status, and upcoming decision points',
              'Individual employee performance ratings',
              'Market research data for future acquisitions'
            ],
            correct: 1,
            explanation: "An MSR should provide a complete picture of program health: EVM metrics (CPI, SPI), technical performance against requirements, risk register status and burn-down, schedule milestones, and upcoming key decisions. PEOs need this data to manage their portfolio and escalate issues before they become crises."
          },
          {
            id: 'q10',
            question: "OSD's Cost Assessment and Program Evaluation (CAPE) office is frequently perceived as adversarial by program offices because:",
            options: [
              'CAPE has authority to cancel programs unilaterally',
              "CAPE's independent cost estimates are typically higher than program office estimates, and they are often statistically more accurate",
              'CAPE controls the release of all program funding',
              'CAPE approves all contract modifications over $10M'
            ],
            correct: 1,
            explanation: "CAPE produces independent cost assessments that are almost always higher than program office estimates — and historical data shows CAPE is typically more accurate. This creates tension, but experienced PMs understand that engaging CAPE early and addressing their methodological concerns proactively is far better than being surprised at a milestone review."
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
          { term: 'Pathways Program', definition: "DoD's competitive hiring program for recent graduates and current students." },
          { term: 'DAU', definition: 'Defense Acquisition University — the premier education institution for acquisition professionals.' },
          { term: 'DAPA', definition: 'Defense Acquisition Professional Development (formerly DAWIA certifications, now DAPA).' },
        ],
        content: [
          {
            type: 'text',
            heading: "The Career Landscape",
            body: "DoD acquisition offers two distinct career tracks: the government side (civilian or military) and the contractor/industry side. Both paths offer excellent opportunities, and many professionals move between them throughout their careers. The government side provides the acquisitions professional credentials through DAU training and DAPA requirements. The contractor side offers higher compensation but requires understanding government processes to be effective."
          },
          {
            type: 'table',
            heading: "Career Entry Points",
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
            heading: "Essential First Steps (Government Track)",
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
            heading: "Essential First Steps (Contractor Track)",
            items: [
              'Identify target companies: Booz Allen, Leidos, SAIC, Peraton, BAH, GDIT, ManTech, DXC',
              'Target roles: Program Analyst, Capture Analyst, Contract Support, Cost Analyst',
              'Build expertise in GovWin IQ, FPDS-NG, SAM.gov — essential tools for BD roles',
              "Get PMP certified — it's the universal credential for PM roles at contractors",
              'Understand EVM — most contractor PM roles require EVMS knowledge',
              'Leverage LinkedIn: connect with BD managers, capture managers, and proposal professionals',
              'Join APMP (Association of Proposal Management Professionals) — excellent community',
            ]
          },
          {
            type: 'callout',
            heading: "Salary Expectations (2025 Market)",
            body: "Government Track: GS-11 ($58-76K), GS-12 ($70-91K), GS-13 ($83-108K), GS-14 ($98-127K), GS-15 ($115-150K) — plus excellent benefits, pension, and work-life balance. Contractor Track: Program Analyst ($65-85K), Senior Analyst ($85-120K), Program Manager ($110-160K), Capture Manager ($130-200K), VP BD ($180-300K+). The government-to-contractor transition typically brings a 20-40% salary increase."
          }
        ],
        quiz: [
          {
            id: 'q1',
            question: "For a recent college graduate interested in the government contracting track, what is the most direct pathway into DoD acquisitions?",
            options: [
              'Apply directly for GS-14 Program Manager positions',
              "Use DoD's Pathways Recent Graduates program targeting GS-7/9 entry-level positions",
              'Get 10 years of private sector experience first',
              'Only military experience leads to acquisition careers'
            ],
            correct: 1,
            explanation: "The Pathways Recent Graduates program is specifically designed for recent college graduates (within 2 years of degree) and provides a structured entry point into federal service at GS-7 to GS-9 levels. Combined with DAU training, it provides a clear pathway to a full-career acquisition professional role."
          },
          {
            id: 'q2',
            question: "Defense Acquisition University (DAU) courses are:",
            options: [
              'Paid courses costing $2,000-5,000 per course',
              'Free to DoD acquisition workforce members and mandatory for certification',
              'Only available to military officers',
              "Equivalent to a master's degree from an accredited university"
            ],
            correct: 1,
            explanation: "DAU courses are provided free of charge to DoD acquisition workforce members and are mandatory for DAPA certification at each level. They cover all acquisition career fields including program management, contracting, finance, systems engineering, and logistics. Many courses are now available online through the DAU learning management system."
          },
          {
            id: 'q3',
            question: "A former Army O-4 (Major) transitioning to a civilian acquisition career is most likely to enter at what GS grade level?",
            options: ['GS-7/9', 'GS-12/13', 'GS-15', 'SES'],
            correct: 1,
            explanation: "O-4 officers (Majors/Lieutenant Commanders) with acquisition experience typically qualify for GS-12 to GS-13 positions, reflecting their supervisory experience, program management background, and leadership responsibilities. Military pay tables translate roughly to GS grade equivalents, and hiring authorities can credit military experience for non-competitive appointments."
          },
          {
            id: 'q4',
            question: "Which professional certification is considered the most universally valuable for contractor-side program management roles?",
            options: ['CDFM (Certified Defense Financial Manager)', 'CPCM (Certified Professional Contracts Manager)', 'PMP (Project Management Professional)', 'CCEA (Certified Cost Estimating & Analysis)'],
            correct: 2,
            explanation: "The PMP (Project Management Professional), issued by PMI, is the most widely recognized PM certification across both government and contractor organizations. While defense-specific certifications are valuable, the PMP is typically required or preferred for PM roles at defense contractors and is the baseline credential for leadership positions."
          },
          {
            id: 'q5',
            question: "The GS-13 grade in the federal pay scale represents approximately what compensation range (2025)?",
            options: ['$45,000 - $60,000', '$83,000 - $108,000', '$130,000 - $165,000', '$175,000 - $210,000'],
            correct: 1,
            explanation: "GS-13 positions in 2025 pay approximately $83,000 to $108,000 base salary (varying by locality pay adjustment). GS-13 is typically the entry point for senior program analyst and experienced program manager roles. With full federal benefits (health, pension, TSP), total compensation is considerably higher than base salary suggests."
          },
          {
            id: 'q6',
            question: "USAJOBS occupational series 1102 corresponds to which acquisition career field?",
            options: ['Program Management', 'Contracting', 'Financial Management', 'Systems Engineering'],
            correct: 1,
            explanation: "OPM occupational series 1102 is the Contracting series — covering contract specialists, contracting officers, and related positions throughout the federal government. Program management roles typically fall under 0340 (Program Management) or 0343 (Management and Program Analysis). Financial management roles use 0501 (Financial Administration)."
          },
          {
            id: 'q7',
            question: "Which professional association is most focused on proposal management and business development in the defense industry?",
            options: ['AFCEA (Armed Forces Communications and Electronics Association)', 'NDIA (National Defense Industrial Association)', 'APMP (Association of Proposal Management Professionals)', 'SAME (Society of American Military Engineers)'],
            correct: 2,
            explanation: "APMP is specifically focused on proposal development, business development, and capture management in the government contracting sector. It offers the Certified Professional Proposal Manager (APMP Foundation/Practitioner/Professional) certifications. For PM and engineering roles, AFCEA and NDIA are more relevant networking communities."
          },
          {
            id: 'q8',
            question: "The transition from a GS government position to a contractor role typically results in what salary change?",
            options: ['10-15% decrease due to loss of federal benefits', '5-10% increase', '20-40% increase', 'No significant change — pay scales are equivalent'],
            correct: 2,
            explanation: "Government-to-contractor transitions typically yield a 20-40% salary increase, though this comes with the loss of federal benefits (pension, subsidized healthcare, and job security). Many experienced acquisition professionals make this transition at the GS-13 to GS-15 level, leveraging their clearances, program knowledge, and government relationships."
          },
          {
            id: 'q9',
            question: "Which of the following tools is most essential for defense contractor business development (BD) roles?",
            options: ['USAJOBS.gov', 'GovWin IQ', 'DAU Learning Management System', 'Defense Contract Audit Agency (DCAA) portal'],
            correct: 1,
            explanation: "GovWin IQ (Deltek) is the premier market intelligence platform for defense contractors, providing early visibility into government opportunities, incumbent data, procurement forecasts, and competitive intelligence. BD professionals and capture managers rely on GovWin IQ daily to identify, qualify, and track opportunities. It's considered an essential tool for anyone in defense BD."
          },
          {
            id: 'q10',
            question: "The Senior Executive Service (SES) in the federal government is equivalent to what military grade?",
            options: ['O-5 (Lieutenant Colonel/Commander)', 'O-6 (Colonel/Captain)', 'General/Flag Officers (O-7 through O-10)', 'Warrant Officers (W-1 through W-5)'],
            correct: 2,
            explanation: "The SES is the executive corps of the federal civilian workforce, serving in the most senior leadership roles below political appointees. SES positions are equivalent in seniority and influence to General and Flag Officer positions (O-7 through O-10). There are approximately 7,000 SES members across the federal government, with significant concentrations in DoD."
          }
        ]
      },
      {
        id: 'ops-4',
        title: 'Subcontractor Management in Defense Programs',
        duration: '16 min',
        description: "Master the government PM's role in overseeing subcontractor performance, flow-down requirements, and managing the prime-sub relationship.",
        keyTerms: [
          { term: 'SMP', definition: 'Subcontract Management Plan — a document detailing how the prime contractor will manage and oversee its subcontractors.' },
          { term: 'CPSR', definition: "Contractor Purchasing System Review — a DCMA audit of the prime contractor's purchasing/subcontracting system." },
          { term: 'Flow-Down Clauses', definition: 'FAR/DFARS contract clauses that the prime is required to include in its subcontracts.' },
          { term: 'Consent to Subcontract', definition: 'Government approval required before a prime can award certain subcontracts on cost-reimbursable contracts.' },
          { term: 'DFARS 252.244-7001', definition: 'The DFARS clause requiring contractor compliance with approved purchasing system requirements.' },
          { term: 'DCMA', definition: 'Defense Contract Management Agency — provides contract administration and oversight services for DoD.' },
          { term: 'Small Business Subcontracting Plan', definition: 'Required plan (FAR 52.219-9) for large contractors to maximize subcontracting to small businesses.' },
        ],
        content: [
          {
            type: 'text',
            heading: "The Prime Owns the Entire Supply Chain",
            body: "As a government Program Manager, you have a legal relationship only with the prime contractor — not with its subcontractors. But that does not mean you ignore what happens below the prime. Subcontractor failures are the leading cause of program schedule slips and technical shortfalls. The PM's job is to ensure the prime has robust subcontract management processes, adequate oversight, and effective escalation paths when subcontractor issues arise. When a subcontractor misses a delivery, the prime is accountable to the government — period."
          },
          {
            type: 'callout',
            heading: "Government Insight vs. Oversight",
            body: "The government has 'insight' (the right to receive information and review data) into subcontractor performance but does not have direct 'oversight' authority over subcontractors — that belongs to the prime. You can ask the prime to provide subcontractor performance data, attend sub reviews, and explain their mitigation plans. You cannot direct subcontractors independently. Violating this boundary creates unauthorized contractual commitments."
          },
          {
            type: 'list',
            heading: "What a Subcontract Management Plan (SMP) Must Cover",
            items: [
              'Identification of critical subcontractors and the make/buy strategy',
              'Subcontract surveillance approach: how the prime monitors each major sub',
              'Frequency and format of subcontractor performance reviews',
              'Flow-down clause requirements applicable to each subcontract tier',
              'Corrective action process when a subcontractor misses performance milestones',
              'Government insight mechanisms: data rights, audit access, review participation',
              'Small business subcontracting plan goals and tracking methodology',
            ]
          },
          {
            type: 'table',
            heading: "Key DFARS Flow-Down Clauses",
            headers: ['Clause', 'Requirement', 'Applies To'],
            rows: [
              ['DFARS 252.204-7012', 'Safeguarding Covered Defense Information & Cyber Incident Reporting', 'All subs handling CDI/CUI'],
              ['DFARS 252.246-7007', 'Contractor Counterfeit Electronic Parts Detection & Avoidance', 'Electronic parts subcontracts'],
              ['DFARS 252.225-7009', 'Restriction on Acquisition of Certain Articles Containing Specialty Metals', 'Applicable subs with specialty metals'],
              ['FAR 52.219-9', 'Small Business Subcontracting Plan', 'Large business prime > $750K threshold'],
              ['FAR 52.222-26', 'Equal Opportunity clause', 'Most subcontracts > $10K'],
              ['DFARS 252.244-7001', 'Contractor Purchasing System Administration', 'Cost-reimbursable contracts'],
            ]
          },
          {
            type: 'text',
            heading: "Consent to Subcontract",
            body: "On cost-reimbursable contracts, the government's Contracting Officer must \"consent to subcontract\" before the prime can award subcontracts above certain thresholds (typically $1.5M for cost-type; higher for FFP). This consent process reviews the proposed subcontractor's cost or price reasonableness, qualifications, and competition. As PM, you should be aware of upcoming consent requests and ensure the CO has the technical information needed to make a sound decision quickly."
          },
          {
            type: 'table',
            heading: "Subcontract Type vs. Government Visibility",
            headers: ['Subcontract Type', 'Government Visibility', 'Key Oversight Mechanism'],
            rows: [
              ['Major subcontract (> $25M)', 'High — prime required to provide performance data; DCMA may conduct independent reviews', 'Monthly sub-IPT reviews, CPSR, IPMR Format 2'],
              ['Critical path subcontract', 'High — regardless of dollar value; drives program schedule', 'Schedule variance reporting, TRR participation'],
              ['Commercial item subcontract', 'Limited — commercial pricing protections restrict insight', 'Prime certification of price reasonableness'],
              ['Small business subcontract', 'Moderate — tracked via SF-294/295 reporting', 'Subcontracting plan annual reports, eSRS'],
              ['COTS subcontract', 'Low — treated as catalog purchase', 'Prime incoming inspection, delivery confirmation'],
            ]
          },
          {
            type: 'warning',
            heading: "The Most Common PM Mistake",
            body: "PMs who ignore the subcontractor tier until problems surface are consistently blindsided at critical program milestones. Establish a rhythm early: require the prime to brief subcontractor status at every monthly program review, demand SMP updates when critical subs change, and escalate immediately if the prime's sub oversight is inadequate. By the time a subcontractor failure becomes visible in the prime's IPMR, you're already 3-6 months behind on corrective action."
          },
          {
            type: 'list',
            heading: "How to Escalate Subcontractor Issues",
            items: [
              'Step 1: Identify the issue through prime reporting or DCMA surveillance — document in writing',
              'Step 2: Direct the prime PM (not the subcontractor directly) to develop a corrective action plan (CAP)',
              'Step 3: Set a hard CAP review deadline — 30 days maximum for critical issues',
              "Step 4: Evaluate the CAP's adequacy; if insufficient, escalate to the prime's senior management via the CO",
              'Step 5: If the prime fails to correct: formal cure notice or show cause letter issued by the Contracting Officer',
              'Step 6: Consult with legal and CO on contract remedies if pattern of non-performance continues',
            ]
          }
        ],
        quiz: [
          {
            id: 'q1',
            question: "A government PM discovers that a critical subcontractor is 3 months behind schedule. What is the correct first action?",
            options: [
              'Contact the subcontractor directly and direct them to accelerate',
              'Direct the prime contractor to develop a corrective action plan addressing the subcontractor delay',
              'Issue a stop-work order to the prime contractor immediately',
              'Notify Congress of the schedule delay'
            ],
            correct: 1,
            explanation: "The government's contractual relationship is with the prime contractor only. The PM should direct the prime — not the subcontractor — to address the issue and develop a corrective action plan. Contacting the subcontractor directly could create unauthorized contractual commitments and undermine the prime's management authority."
          },
          {
            id: 'q2',
            question: "What does \"Consent to Subcontract\" refer to in defense contracting?",
            options: [
              "The subcontractor's agreement to accept government-directed changes",
              "The government Contracting Officer's required approval before the prime awards certain subcontracts on cost-type contracts",
              "The prime contractor's internal approval process for subcontract awards",
              "Congressional notification required for subcontracts over $50M"
            ],
            correct: 1,
            explanation: "On cost-reimbursable contracts, FAR 44.2 requires the prime to obtain the government CO's consent before awarding subcontracts above specified thresholds. This process ensures price reasonableness and contractor qualification. The CO reviews the subcontract proposal and either consents, withholds consent pending additional information, or denies consent."
          },
          {
            id: 'q3',
            question: "DFARS 252.204-7012 is a mandatory flow-down clause that requires subcontractors to:",
            options: [
              'Submit certified cost or pricing data for subcontracts over $2M',
              'Safeguard Covered Defense Information (CDI) and report cyber incidents within 72 hours',
              'Provide small business subcontracting plans',
              'Use only specialty metals from qualifying countries'
            ],
            correct: 1,
            explanation: "DFARS 252.204-7012 (Safeguarding Covered Defense Information and Cyber Incident Reporting) is one of the most consequential flow-down clauses. It requires any subcontractor handling Covered Defense Information (CDI) or operating on systems that process CUI to maintain adequate cybersecurity (NIST SP 800-171) and report cyber incidents within 72 hours. Non-compliance can result in contract termination."
          },
          {
            id: 'q4',
            question: "A Contractor Purchasing System Review (CPSR) is conducted by which organization?",
            options: [
              'The Government Accountability Office (GAO)',
              'The Defense Contract Audit Agency (DCAA)',
              'The Defense Contract Management Agency (DCMA)',
              'The program office Contracting Officer'
            ],
            correct: 2,
            explanation: "CPSRs are conducted by the Defense Contract Management Agency (DCMA) to evaluate whether the prime contractor's purchasing system complies with FAR and DFARS requirements. An approved purchasing system is required for primes to have consent authority (the right to award subcontracts without individual government consent). DCMA conducts CPSRs periodically, typically every 3 years for active contractors."
          },
          {
            id: 'q5',
            question: "Under FAR 52.219-9, large prime contractors with contracts exceeding $750K must:",
            options: [
              'Reserve 25% of the contract value for small business subcontractors',
              'Submit a Small Business Subcontracting Plan with goals for various small business categories',
              'Exclusively use small businesses for all subcontracts',
              'Certify as a small business to qualify for the contract'
            ],
            correct: 1,
            explanation: "FAR 52.219-9 requires large business primes on contracts exceeding $750K (or $1.5M for construction) to submit subcontracting plans with specific dollar and percentage goals for small businesses, small disadvantaged businesses, women-owned small businesses, HUBZone businesses, veteran-owned small businesses, and service-disabled veteran-owned small businesses. These plans are tracked and reported through the Electronic Subcontracting Reporting System (eSRS)."
          },
          {
            id: 'q6',
            question: "The government PM's relationship with subcontractors is best characterized as:",
            options: [
              'Direct oversight authority — the PM can issue direction to subcontractors',
              'Insight rights through the prime — the PM can receive data but cannot direct subcontractors independently',
              "No relationship — subcontractor performance is entirely the prime's internal matter",
              "Equivalent authority to the prime's subcontract program manager"
            ],
            correct: 1,
            explanation: "The government has 'insight' into subcontractor performance — the right to receive data and participate in reviews — but not direct 'oversight' authority. The prime contractor is the government's sole point of accountability. Direct PM-to-subcontractor direction, without going through the prime, creates unauthorized contractual commitments and can expose the government to legal liability."
          },
          {
            id: 'q7',
            question: "In the IPMR reporting system, which format provides the organizational (subcontractor) breakdown of cost and schedule performance?",
            options: ['Format 1 (WBS-based)', 'Format 2 (Organizational)', 'Format 5 (Problem Analysis)', 'Format 6 (IMS/Milestone)'],
            correct: 1,
            explanation: "IPMR Format 2 provides performance data organized by the contractor's Organizational Breakdown Structure (OBS), which maps to major subcontractors and functional organizations. This format allows PMs to identify which organizational elements (and by extension, which subcontractors) are driving cost or schedule variances — crucial for targeted corrective action."
          },
          {
            id: 'q8',
            question: "When a prime contractor receives a \"Cure Notice\" from the Contracting Officer, it indicates:",
            options: [
              'The government has found a billing error that needs to be corrected',
              'The contractor has a specified time (typically 10 days) to cure conditions endangering contract performance or face termination',
              'The government intends to exercise a contract option',
              'The DCMA has completed a CPSR with findings requiring resolution'
            ],
            correct: 1,
            explanation: "A Cure Notice (FAR 49.607) is issued when a contractor's performance is in danger of resulting in default. It gives the contractor a specified period (typically 10 days) to show progress toward curing the problem. If the contractor fails to cure, the CO may issue a Show Cause notice or proceed to termination for default. Cure notices are serious escalation signals that PM should avoid through proactive management."
          },
          {
            id: 'q9',
            question: "A \"make/buy\" analysis in the context of a Subcontract Management Plan determines:",
            options: [
              'Whether the government should produce the item organically or purchase it from industry',
              "Which components the prime will manufacture internally versus subcontract to other companies",
              'The comparison of fixed-price vs. cost-type contracts for major subcontracts',
              'Whether to buy commercial off-the-shelf items or develop custom solutions'
            ],
            correct: 1,
            explanation: "A make/buy analysis is conducted by the prime contractor to determine which components, subsystems, or services to produce in-house ('make') versus procure from subcontractors ('buy'). Government PMs review and may require justification for make/buy decisions because they significantly affect program risk, schedule, competition, and the small business subcontracting base."
          },
          {
            id: 'q10',
            question: "Which of the following represents the most proactive approach to subcontractor risk management?",
            options: [
              "Waiting for the prime's monthly IPMR to identify subcontractor problems",
              "Requiring the prime to brief critical subcontractor status monthly, establishing early warning metrics, and including sub performance in the prime's performance evaluation",
              'Bypassing the prime and conducting government-to-subcontractor reviews directly',
              'Requiring the prime to bond all subcontracts above $1M'
            ],
            correct: 1,
            explanation: "Proactive subcontractor risk management means building visibility into the prime's oversight processes early — requiring sub performance briefings at monthly reviews, establishing leading indicators (technical progress, staffing levels, test results) before schedule slips become apparent, and including sub management quality in past performance evaluations. Waiting for IPMR data means problems are already 60-90 days old by the time you see them."
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
