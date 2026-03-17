export interface Lesson {
  id: string;
  title: string;
  duration: string;
  description: string;
  content: LessonContent[];
  quiz: QuizQuestion[];
  keyTerms: KeyTerm[];
}

export type SkillLevel = 'novice' | 'intermediate' | 'advanced';

export interface ExpandableItem {
  label: string;          // The collapsed row label (e.g. "Qualification")
  sublabel?: string;      // Optional short descriptor shown collapsed (e.g. "Gate review — 20-30% Pwin")
  badge?: string;         // Optional badge text (e.g. "20-30% Pwin", "Pink Team")
  badgeColor?: 'blue' | 'amber' | 'green' | 'red' | 'purple' | 'gray';
  summary?: string;       // 1-2 sentence summary shown collapsed below the label
  content: Array<{
    heading?: string;
    body?: string;
    items?: string[];
    type?: 'text' | 'bullets' | 'grid';
    // For grid: columns is array of {label, value} pairs
    grid?: Array<{ label: string; value: string }>;
  }>;
}

export interface LessonContent {
  type: 'text' | 'callout' | 'list' | 'table' | 'formula' | 'tip' | 'warning' | 'risk_chart' | 'expandable_list';
  heading?: string;
  body?: string;
  items?: string[];
  headers?: string[];
  rows?: string[][];
  formula?: string;
  explanation?: string;
  // For expandable_list type:
  expandableItems?: ExpandableItem[];
  // Optional: restrict this block to a specific skill level.
  // If absent, the block shows to all levels.
  level?: SkillLevel;
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

export interface ModuleAssessmentQuestion {
  id: string;
  question: string;
  options: string[];
  correct: number;
  explanation: string;
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
  // Module-level gate assessment: 10 questions drawn from across all lessons.
  // Pass ≥75% to unlock next skill level.
  assessment?: ModuleAssessmentQuestion[];
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
          },
          {
            type: 'text',
            level: 'intermediate',
            heading: "How JCIDS, PPBE, and Acquisition Interlock in Practice",
            body: "These three systems are interdependent, and the seams between them are where programs fail. A requirement validated by JROC but not funded through PPBE is just a wish list. Funding programmed through POM but without a validated requirement can't proceed to contract. And an acquisition program without a funded, validated requirement will hit a Milestone roadblock. As a mid-career PM, you need to own all three timelines simultaneously: your JROC review schedule, your POM submission window, and your acquisition milestone dates. When they slip out of sync, programs get delayed at Milestone B waiting for funding or requirements that aren't ready."
          },
          {
            type: 'table',
            level: 'intermediate',
            heading: "AAF Pathways: When to Use Each",
            headers: ['Pathway', 'Best For', 'Key Characteristic', 'Typical Timeline'],
            rows: [
              ['Major Capability Acquisition (MCA)', 'Large, complex systems (ACAT I/II)', 'Full DoDI 5000 oversight; Milestones A/B/C; most rigorous', '10-20+ years'],
              ['Middle Tier (MTA) - Rapid Prototyping', 'Fielding prototype within 5 years', 'No Milestone A; accelerated; used for emerging tech (OTA-friendly)', '2-5 years'],
              ['Middle Tier (MTA) - Rapid Fielding', 'Fielding proven capability within 6 months-5 years', 'Leverages existing technology; limited production; no new development', '6 months - 5 years'],
              ['Software Acquisition', 'Software-intensive programs', 'Agile delivery; no traditional milestones; continuous iteration', 'Ongoing sprints'],
              ['Urgent Capability Acquisition', 'Validated urgent operational need (UON)', 'Bypasses normal process; less than 2 years to field', '< 2 years'],
              ['Defense Business Systems', 'Financial/HR/ERP IT systems', 'Business case required; milestone reviews adjusted for IT', 'Varies'],
            ]
          },
          {
            type: 'text',
            level: 'advanced',
            heading: "Title 10 Authorities and the Limits of DAU Training",
            body: "Most PM training focuses on DoDI 5000.02 as if it exists in isolation. At the senior level, you need to understand that DoDI 5000.02 is DoD policy interpreting a statutory framework — and when the statute and the policy conflict, the statute wins. Title 10 U.S.C. Chapter 137 (now recodified under Chapter 221-243) is where acquisition authority actually lives. Sections 3201-3249 cover source selection. Sections 3761-3775 govern multiyear procurement. Section 4021-4025 authorizes OTAs. When a program office lawyer tells you \"we can't do X under policy,\" your question should be: does the statute prohibit it, or just the policy? Policies can be waived and tailored. Statutes cannot — unless you go to Congress. Senior PMs who understand this distinction can unlock flexibilities that others think are unavailable."
          },
          {
            type: 'callout',
            level: 'advanced',
            heading: "The Real Purpose of Milestone Reviews — and Why They Fail",
            body: "Milestone reviews exist to ensure the government is not committing to programs that are not ready. In theory, a Milestone B review verifies that requirements are stable, design is mature, and cost/schedule are executable before committing to EMD. In practice, programs routinely breach Milestones with immature technology, unstable requirements, and optimistic cost estimates — because the institutional pressure to keep programs moving outweighs the discipline to hold the gate. As a senior PM, your job is to resist this pressure. A program that breaches Milestone B with a 60% design maturity will statistically overrun its cost estimate by 40%+ and breach schedule by 2+ years. The Milestone review is your last, best chance to reset before billions are committed. Use it."
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
            type: 'callout',
            heading: 'The Contracting Officer (CO/1102) Role',
            body: 'The Contracting Officer is the only person legally authorized to obligate the U.S. government to spend money on a contract. They hold a \"warrant\" — a written delegation of authority specifying dollar thresholds they can sign up to. COs manage the full contract lifecycle: developing solicitations, evaluating proposals, negotiating terms, awarding contracts, issuing contract modifications, and closing out contracts. They are the legal guardians of the procurement process and must ensure every action complies with the FAR, DFARS, and applicable agency supplements. Without a CO\'s signature, nothing is official — not a delivery order, not a modification, not even a letter acknowledging a contractor claim.',
          },
          {
            type: 'list',
            heading: 'What Makes a Successful Contracting Officer?',
            items: [
              'FAR/DFARS mastery — understands what the regulations require and where flexibility exists',
              'Negotiation skills — ability to drive fair and reasonable pricing without litigation risk',
              'Business acumen — understands contractor cost structures, profit motives, and market dynamics',
              'Legal judgment — recognizes unauthorized commitments, organizational conflicts of interest, and protest risks',
              'Writing precision — contract language must be unambiguous and legally defensible',
              'Series 1102 federal position + DAWIA Contracting certification (Foundational, Practitioner, Advanced)',
              'FAC-C certification (for civilian agencies); warrant issued by the Head of Contracting Activity (HCA)',
            ]
          },
          {
            type: 'callout',
            heading: 'The Contracting Officer\'s Representative (COR) Role',
            body: 'The COR is the government\'s eyes and ears on an active contract. Nominated by the PM and formally appointed by the CO in writing, the COR monitors contractor performance on the ground — accepting or rejecting deliverables, documenting performance issues, and providing technical guidance within the contract\'s scope. Critically, the COR has NO contract authority: they cannot direct changes, approve additional work, or modify contract terms. Any direction that changes cost, schedule, or scope must go through the CO via a formal contract modification. A COR who oversteps — even with good intentions — can create an \"unauthorized commitment\" that exposes the government to liability.',
          },
          {
            type: 'list',
            heading: 'What Makes a Successful COR?',
            items: [
              'Deep technical knowledge of the contracted work — the COR must understand what \"good\" looks like',
              'Documentation discipline — maintains a contract file with dated records of every interaction with the contractor',
              'Scope awareness — instantly recognizes when a contractor request or government action would change contract scope',
              'Mandatory COR training (CLC 106 via DAU) and formal written appointment letter from the CO',
              'Independence — comfortable escalating contractor performance problems even when there is political pressure not to',
              'CORs must be a government employee (military or civilian) — contractors cannot serve as CORs',
            ]
          },
          {
            type: 'callout',
            heading: 'The Financial Manager (FM) Role',
            body: 'The Financial Manager is the PM\'s budget expert — the person who ensures the program has the right type of money, at the right time, in the right amount. DoD uses multiple appropriation types (RDT&E, Procurement, O&M, MILCON) and each has strict rules about what it can fund and when it expires. The FM formulates the program\'s budget exhibits (POM submissions), tracks obligations and expenditures against plan, manages the program\'s Spend Plan, and serves as the early warning system for funding shortfalls. When the PM says \"we\'re running out of money,\" the FM already knew two months ago.',
          },
          {
            type: 'list',
            heading: 'What Makes a Successful Financial Manager?',
            items: [
              'Appropriations law fluency — understands the \"color of money\" rules and what each fund type can legally purchase',
              'PPBE cycle expertise — knows how to build a winning POM submission and defend it through the budget cycle',
              'EVM literacy — can read a CPR/IPMR and identify early indicators of cost growth',
              'Anti-Deficiency Act (ADA) awareness — recognizes obligations that exceed available funding before they become violations',
              'CDFM (Certified Defense Financial Manager) or DAWIA FM certification strongly preferred',
              'Works closely with the PM and CO — no contract mod should be signed without FM confirming funds are available',
            ]
          },
          {
            type: 'callout',
            heading: 'The Systems Engineer (SE) Role',
            body: 'The Systems Engineer translates warfighter requirements into a technically feasible, integrated system design. SEs own the technical baseline — the specifications, interface control documents, and system architecture that define what the contractor must build. On major programs, the SE leads Technical Reviews (SRR, PDR, CDR) and tracks technical performance measures (TPMs) to ensure the system will meet Key Performance Parameters (KPPs). The PM relies on the SE to catch technical risk early, before it becomes a cost and schedule problem. SEs bridge the gap between operational needs and engineering reality.',
          },
          {
            type: 'callout',
            heading: 'The Cost Estimator Role',
            body: 'The Cost Estimator builds the government\'s independent assessment of what a program should cost — the Independent Cost Estimate (ICE). This estimate is produced independently of the contractor and is used to validate contractor proposals during source selection and at milestone reviews. On ACAT I programs, CAPE (Cost Assessment and Program Evaluation) produces a separate independent cost estimate called a CAPE ICE. Cost estimators use parametric models (SEER, PRICE H, ACEIT), analogous estimates from historical programs, and engineering build-ups. Their work directly influences whether a program is funded, restructured, or cancelled.',
          },
          {
            type: 'callout',
            heading: 'The Logistics / Life Cycle Sustainment Planner Role',
            body: 'Logistics professionals plan how a system will be supported throughout its operational life — maintenance, spare parts, technical manuals, training, and depot support. The Life Cycle Sustainment Plan (LCSP) is their primary product and is reviewed at every milestone. Sustainment costs often exceed development and procurement costs over a system\'s lifetime: for many defense systems, 70% of total ownership cost is sustainment. A Logistics professional who engages late — after the design is locked — has almost no ability to reduce those costs. Early involvement in design trade-offs (reliability, maintainability, testability) is where sustainment value is created.',
          },
          {
            type: 'table',
            heading: 'How the Roles Work Together on a Program',
            headers: ['Role', 'Primary Authority', 'What They Own', 'Key Limitation'],
            rows: [
              ['Program Manager (PM)', 'Cost, Schedule & Performance accountability', 'Overall program success — the integrator', 'No contracting authority; cannot sign contracts'],
              ['Contracting Officer (CO)', 'Warrant authority to bind the government', 'Contract award, mods, and closeout', 'Cannot direct technical work beyond contract terms'],
              ['COR', 'Delegated by CO (in writing)', 'Day-to-day technical oversight of contractor', 'ZERO contract authority — advisory role only'],
              ['Financial Manager (FM)', 'Funds certification authority', 'Budget formulation, execution, and spend plan', 'Cannot obligate funds without CO involvement'],
              ['Systems Engineer (SE)', 'Technical baseline authority', 'Requirements, specs, and technical reviews', 'Cannot approve contract changes unilaterally'],
              ['Cost Estimator', 'Independent estimate authority', 'ICE and cost realism analysis', 'Advisory — does not set program budgets alone'],
              ['Logistics/Sustainment', 'LCSP ownership', 'Sustainment planning across system lifecycle', 'Often engaged too late; must be involved at design'],
            ]
          },
          {
            type: 'tip',
            heading: "Breaking In",
            body: "Many successful acquisition professionals transition from the military (especially as O-3/O-4 officers), from technical engineering fields, or from federal service in adjacent roles. DoD's Pathways program and Defense Acquisition University offer entry-level pathways. Target GS-9 or GS-11 program analyst roles to build your foundation."
          },
          {
          type: 'text' as const,
          level: 'intermediate' as const,
          heading: 'Building Cross-Functional Credibility as a PM',
          body: 'A mid-career PM sits at the intersection of the technical, contracting, and financial communities — but is authoritative over none of them. Your COR has more contract expertise. Your cost analyst understands EVM better. Your systems engineer owns the technical baseline. Your power comes from orchestration, not expertise. The key skill is knowing enough about each domain to ask the right questions, catch inconsistencies, and drive decisions. In practice: read every contract modification before signing, attend DCAA floor check briefings even when not required, and sit with the systems engineer during CDRs. The informal knowledge you build is what makes you credible when you challenge a contractor on cost realism.',
        },
        {
          type: 'callout' as const,
          level: 'advanced' as const,
          heading: 'The PM as Program Architect — Shaping the Acquisition Before It Starts',
          body: 'The most impactful PMs shape their programs before Milestone B — not after. At the senior level, your job is acquisition strategy: contract type selection, source selection criteria weighting, EVMS thresholds, and data rights. These decisions, made 18-24 months before contract award, determine whether your program is executable. A CPIF with a 70/30 share ratio on a software program with unstable requirements will give the contractor every incentive to slow-roll risk mitigation. A FFRDC study that locks in requirements before the market is ready will waste a year. Senior PMs think about incentive structures, competitive dynamics, and industrial base health — not just Gantt charts.',
        },
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
            explanation: "The COR is the government\'s technical representative on a contract, responsible for monitoring contractor performance, documenting issues, and providing technical direction within the scope of the contract. They cannot modify contract terms — that authority belongs to the Contracting Officer (CO)."
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
,
{
        id: 'foundations-3',
        title: 'ACAT Levels: How the DoD Categorizes Your Program',
        duration: '18 min',
        description: 'Master ACAT levels, milestone decision authority, tailoring, and how program categorization drives oversight, reporting, and your day-to-day responsibilities as a PM.',
        keyTerms: [
          { term: 'ACAT', definition: 'Acquisition Category — a classification system that determines the level of oversight, reporting, and milestone decision authority for a DoD acquisition program. Higher ACAT = more oversight.' },
          { term: 'ACAT I', definition: 'Major Defense Acquisition Program — total cost > $480M (RDT&E) or $2.79B (procurement). MDA is USD(A&S) or a designated Service Acquisition Executive (SAE). Highest oversight.' },
          { term: 'ACAT II', definition: 'Major System — total cost > $185M (RDT&E) or $835M (procurement). MDA is the DoD Component Acquisition Executive (CAE). Significant but less oversight than ACAT I.' },
          { term: 'ACAT III', definition: 'Below ACAT I/II thresholds. MDA is designated by the CAE, typically a Program Executive Officer (PEO) or head of contracting activity. Streamlined oversight.' },
          { term: 'ACAT IV', definition: 'Services and non-major acquisitions managed below ACAT III threshold. Component manages with minimal centralized oversight.' },
          { term: 'MDA', definition: 'Milestone Decision Authority — the individual with authority to approve milestones, authorize program entry into lifecycle phases, and certify programs. Varies by ACAT level.' },
          { term: 'SAE', definition: 'Service Acquisition Executive — the senior official responsible for acquisition programs within an Armed Service (ASA(ALT) for Army, ASN(RDA) for Navy/USMC, SAF/AQ for Air Force/Space Force).' },
          { term: 'Tailoring', definition: 'The process of adjusting DoDI 5000.02 requirements to match the program\'s complexity, acquisition pathway, risk, and urgency. Not all programs need all standard requirements.' },
          { term: 'AAF', definition: 'Adaptive Acquisition Framework — DoDI 5000.02\'s six acquisition pathways, allowing programs to select the pathway best suited to their type of acquisition.' },
          { term: 'MDAP', definition: 'Major Defense Acquisition Program — an ACAT I program. Subject to full statutory reporting to Congress (SAR, unit cost reporting) and CAPE independent cost estimates at each milestone.' },
        ],
        content: [
          {
            type: 'text',
            heading: 'Why ACAT Level Determines Your Entire Program Experience',
            body: 'The first question asked about any new DoD acquisition is: what ACAT is this program? The answer determines who approves your milestones, how many oversight reviews you will conduct, whether you need an independent cost estimate, whether you must report to Congress, and how much staff support you will have. An ACAT I program like the F-35 involves USD(A&S) as the MDA, mandatory SAR reports to Congress, CAPE independent cost estimates, and DoD-level reviews at every milestone. An ACAT III program may be approved by a PEO with minimal external oversight. Understanding ACAT levels is the starting point for understanding any DoD program\'s regulatory environment.',
          },
          {
            type: 'table',
            heading: 'ACAT Levels — Thresholds, MDA, and Key Requirements',
            headers: ['ACAT', 'Cost Threshold (2024)', 'MDA', 'Key Requirements', 'Reporting'],
            rows: [
              ['ACAT ID', 'RDT&E > $480M or Procurement > $2.79B; OR designated by USD(A&S)', 'USD(A&S) or designated SAE', 'Full DoDI 5000 compliance; ICE required; full documentation', 'SAR to Congress; unit cost reporting; CAPE ICE'],
              ['ACAT IC', 'Same thresholds as ACAT ID', 'Component Acquisition Executive (CAE) / SAE', 'Same as ACAT ID minus OSD-level milestone approval', 'SAR; CAPE ICE optional but often requested'],
              ['ACAT II', 'RDT&E > $185M or Procurement > $835M', 'CAE (ASA(ALT), ASN(RDA), SAF/AQ)', 'Component-level ICE; DoDI 5000 compliance with tailoring', 'Component-level reporting; no mandatory SAR'],
              ['ACAT III', 'Below ACAT I/II; designated by CAE', 'PEO or designated official', 'Significant tailoring available; streamlined documentation', 'Program office reporting only'],
              ['ACAT IV', 'Non-major services/acquisitions', 'Head of contracting activity', 'Minimum oversight; acquisition plan required', 'Internal only'],
            ],
          },
          {
            type: 'text',
            heading: 'The Adaptive Acquisition Framework — Six Pathways',
            body: 'DoDI 5000.02 (updated in 2020) introduced the Adaptive Acquisition Framework (AAF), replacing the previous "one-size-fits-all" linear acquisition model with six distinct pathways. Each pathway is tailored to a specific type of acquisition: (1) Major Capability Acquisition (MCA) — the traditional ACAT process for large, complex defense systems; (2) Middle Tier of Acquisition (MTA) — Rapid Prototyping (2 years) or Rapid Fielding (5 years); (3) Software Acquisition — for software-intensive systems using Agile/DevSecOps; (4) Defense Business Systems (DBS) — for ERP and business IT systems; (5) Acquisition of Services — for services contracts managed under the service acquisition framework; (6) Urgent Capability Acquisition — for combat-emergent needs addressable within 2 years.',
          },
          {
            type: 'table',
            heading: 'AAF Pathway Selection Guide',
            headers: ['Pathway', 'Best For', 'Timeline', 'Key Advantage'],
            rows: [
              ['Major Capability Acquisition (MCA)', 'Large, complex systems requiring full R&D lifecycle (aircraft, ships, satellites)', '10-20+ years', 'Full oversight and documentation — appropriate for highest-risk, highest-cost programs'],
              ['Middle Tier — Rapid Prototyping', 'Technology demonstrations; filling known capability gaps quickly', '≤ 2 years to field', 'Skip traditional milestones; prototype and learn fast'],
              ['Middle Tier — Rapid Fielding', 'Mature technology ready to field with minor modification', '≤ 5 years to field', 'Streamlined acquisition; use existing systems/platforms'],
              ['Software Acquisition', 'Software-intensive systems; cloud apps; command and control IT', 'Continuous delivery cycles', 'Agile/DevSecOps; iterative delivery; avoid "big bang" software programs'],
              ['Defense Business Systems', 'ERP, finance, HR, logistics IT systems', 'Per commercial release cycle', 'Use commercial software best practices; avoid military customization'],
              ['Urgent Capability Acquisition', 'Combat-emergent gaps; urgent warfighter needs', '≤ 2 years', 'Highest streamlining; near-direct fielding from combatant command request'],
            ],
          },
          {
            type: 'callout',
            heading: 'ACAT Determination Is Not Static — Programs Get Re-Categorized',
            body: 'Programs can be re-categorized upward if cost growth triggers higher ACAT thresholds — which means more oversight, more reporting, and a new MDA. An ACAT II program that grows to ACAT I cost levels gets re-designated, and the PM suddenly must comply with full ACAT I requirements retroactively. This is another reason aggressive cost management is not just financial discipline — it is also a program management imperative to avoid triggering additional oversight burdens.',
          },
          {
            type: 'text',
            heading: 'Selected Acquisition Report (SAR) — The ACAT I Report to Congress',
            body: 'For ACAT I programs (MDAPs), the PM must produce a Selected Acquisition Report (SAR) annually — or whenever a Nunn-McCurdy breach or other significant change occurs. The SAR is submitted to Congress and covers: current program description, total program cost (including all variants), cost and schedule changes from original baseline, current schedule, and performance status. The SAR is a legal disclosure document — PMs must ensure all data is accurate. False or misleading SARs can trigger Congressional investigations. For an experienced PM, the SAR is also a professional document that reflects directly on your program\'s credibility and your ability to manage to a baseline.',
          },
          {
            type: 'formula',
            heading: 'Key ACAT I Statutory Requirements — What Congress Requires',
            formula: 'MANDATORY FOR ACAT I (MDAP) PROGRAMS:\n\n1. Selected Acquisition Report (SAR)\n   → Annual submission to Congress\n   → Unit cost growth > 15% (significant breach) triggers special SAR\n\n2. Independent Cost Estimate (ICE)\n   → Required at each Milestone (A, B, C)\n   → CAPE prepares for ACAT ID; Service cost center for ACAT IC\n\n3. Nunn-McCurdy Unit Cost Reporting\n   → Significant breach: 15% cost growth over baseline\n   → Critical breach: 25% cost growth over baseline → Congressional notification + USD(A&S) certification\n\n4. Acquisition Program Baseline (APB)\n   → Formally documents cost, schedule, and performance objectives\n   → Breaches of APB thresholds trigger reporting and review\n\n5. Test and Evaluation Master Plan (TEMP)\n   → Documents all DT&E, OT&E, and LFT&E requirements\n   → Must be approved by DOT&E for major programs',
            explanation: 'These requirements are statutory — they come from law (USC Title 10), not just DoD policy. That means Congress mandated them, and they cannot be tailored away regardless of what the PM or MDA prefers. As an ACAT I PM, these are non-negotiable obligations.',
          },
          {
            type: 'tip',
            heading: 'Tailoring — Use It, Don\'t Abuse It',
            body: 'Tailoring under DoDI 5000.02 allows PMs to adjust documentation, review, and reporting requirements based on program risk, complexity, and pathway. A small ACAT III program does not need a 200-page Acquisition Strategy or a full EVMS — tailoring allows appropriate scaling. However, tailoring is a two-way street: the MDA can also impose additional requirements if the program needs more oversight. The best tailoring approach is to clearly justify every decision to omit or reduce a requirement — not simply to skip paperwork but to demonstrate the program has equivalent risk management in place.',
          },
          {
          type: 'text' as const,
          level: 'intermediate' as const,
          heading: 'Managing Oversight Bodies as a Mid-Career PM',
          body: 'ACAT level determines not just who approves your milestones, but who scrutinizes your program continuously. An ACAT I program will have OSD Cost Assessment and Program Evaluation (CAPE) producing independent cost estimates, DOT&E reviewing your test plans, and OUSD(R&E) evaluating technology maturity. Understanding what each oversight body cares about — and feeding them the data they need proactively — is a mid-career PM survival skill. CAPE cares about cost realism. DOT&E cares about whether testing is operationally realistic. OUSD(R&E) cares about TRL. Brief them early, brief them often, and never surprise them in a milestone review. Surprises at DAB reviews kill programs.',
        },
        {
          type: 'callout' as const,
          level: 'advanced' as const,
          heading: 'Tailoring Acquisition — What Senior PMs Actually Do at Milestone B',
          body: 'The DoDI 5000 framework provides the default acquisition structure, but senior PMs know that almost everything can be tailored. At Milestone B, the MDA approves your Acquisition Program Baseline (APB), your contract strategy, and your tailoring decisions. Smart tailoring means: selecting the minimum oversight that still provides adequate risk visibility, adjusting milestone criteria to match your specific technology maturity, and requesting waivers for documentation requirements that add process burden without insight. The danger is tailoring away safeguards that exist for good reasons. ACAT I programs that waive IBR requirements or skip SEPs have consistently worse cost outcomes. Know which gates exist to protect the program — and which ones are just bureaucratic inertia.',
        },
        ],
      quiz: [
          {
            id: 'q1',
            question: 'An ACAT I program (MDAP) requires which of the following that ACAT III programs do not?',
            options: ['A written acquisition strategy', 'A Selected Acquisition Report (SAR) submitted to Congress and an Independent Cost Estimate at each milestone', 'A Performance Work Statement', 'A contract administration plan'],
            correct: 1,
            explanation: 'ACAT I programs are MDAPs subject to statutory reporting requirements including annual SARs to Congress, CAPE independent cost estimates at each milestone, and Nunn-McCurdy unit cost reporting. ACAT III programs require an acquisition strategy and various documents, but are not subject to mandatory Congressional reporting via SAR.',
          },
          {
            id: 'q2',
            question: 'The current ACAT I threshold for Research, Development, Test and Evaluation (RDT&E) is approximately:',
            options: ['$100M', '$185M', '$480M', '$2.79B'],
            correct: 2,
            explanation: 'Programs with RDT&E costs exceeding approximately $480M (or procurement costs exceeding $2.79B) are classified ACAT I. These thresholds are adjusted periodically for inflation. Programs below $185M RDT&E / $835M procurement are typically ACAT III.',
          },
          {
            id: 'q3',
            question: 'Under the Adaptive Acquisition Framework, the "Middle Tier — Rapid Prototyping" pathway is designed for programs that can:',
            options: ['Take 20 years to deliver a full production system', 'Field a prototype or demonstration within 2 years, leveraging existing technology', 'Deliver software via continuous Agile sprints', 'Acquire commercial off-the-shelf services directly'],
            correct: 1,
            explanation: 'Rapid Prototyping (AAF Middle Tier) allows programs to field a prototype or proof of concept within 2 years, bypassing traditional Milestone A-B-C review requirements. It is intended for programs using mature technology that can be demonstrated quickly — not for programs requiring extensive R&D.',
          },
          {
            id: 'q4',
            question: 'If an ACAT II program\'s costs grow and exceed ACAT I thresholds, what happens?',
            options: ['The program is automatically cancelled', 'The program is re-designated as ACAT I, triggering additional oversight requirements, SAR reporting, and a new MDA', 'The program continues under ACAT II oversight regardless of cost growth', 'The PM must request a waiver from Congress'],
            correct: 1,
            explanation: 'ACAT categorization follows cost — if a program grows beyond the ACAT II threshold into ACAT I territory, it must be re-designated ACAT I. This brings additional requirements: the MDA shifts to USD(A&S) or SAE, SAR reporting begins, CAPE ICE is required, and Nunn-McCurdy cost reporting applies. This is why PM cost management is both a financial and an oversight discipline.',
          },
          {
            id: 'q5',
            question: 'Tailoring under DoDI 5000.02 allows a PM to:',
            options: ['Eliminate all oversight requirements for expedited programs', 'Adjust documentation, review, and reporting requirements based on program risk and pathway — with MDA approval', 'Override Congressional reporting requirements for classified programs', 'Skip the Acquisition Program Baseline for rapid fielding programs'],
            correct: 1,
            explanation: 'Tailoring is a policy mechanism — it requires MDA approval and must be documented in the Acquisition Strategy. Statutory requirements (SAR, Nunn-McCurdy, ICE for ACAT I) cannot be tailored away. Tailoring adjusts DoD policy requirements (specific documents, review formats, approval levels) to be appropriately scaled to the program\'s complexity and risk.',
          },
          {
            id: 'q6',
            question: 'The Milestone Decision Authority (MDA) for an ACAT ID program is:',
            options: ['The Program Manager', 'The Program Executive Officer (PEO)', 'USD(A&S) or designated Service Acquisition Executive', 'The Secretary of Defense'],
            correct: 2,
            explanation: 'ACAT ID MDAs are USD(A&S) or a designated Service Acquisition Executive (SAE) — the most senior acquisition officials in their respective Service. ACAT IC MDAs are also the SAE. For ACAT II, the MDA is typically the CAE. For ACAT III, it may be the PEO. The MDA is the one person who can approve milestone entry — the PM\'s most critical stakeholder.',
          },
          {
            id: 'q7',
            question: 'An Acquisition Program Baseline (APB) documents which three key program parameters?',
            options: ['Contract type, vendor selection, and delivery location', 'Cost objectives (threshold and objective), schedule, and performance (key performance parameters)', 'Funding levels, test events, and contractor team', 'Congressional appropriations, FYDP profile, and POM submission'],
            correct: 1,
            explanation: 'The APB establishes the program\'s "triple constraint" baseline: cost (threshold and objective values), schedule (key milestone dates), and performance (Key Performance Parameters from the capabilities document). Breaches of APB threshold values trigger reporting and potentially MDA review. The APB is the official record of what the program promised to deliver at what cost and schedule.',
          },
          {
            id: 'q8',
            question: 'The "Software Acquisition" pathway under the AAF is specifically designed for:',
            options: ['Purchasing commercial off-the-shelf software licenses', 'Software-intensive systems using continuous delivery, Agile development, and DevSecOps practices', 'Programs that use software as a minor component of a hardware-dominant system', 'Business system acquisitions below $185M'],
            correct: 1,
            explanation: 'The Software Acquisition pathway (DoDI 5000.87) enables Agile/DevSecOps continuous delivery for software-intensive programs — replacing the traditional "plan everything upfront, deliver years later" model. It is intended for programs where software is the primary deliverable and iterative development cycles are appropriate. It is distinct from Defense Business Systems, which handles ERP and administrative IT.',
          },
          {
            id: 'q9',
            question: 'A Selected Acquisition Report (SAR) is submitted to Congress:',
            options: ['Monthly during active program phases', 'Annually, and additionally whenever a Nunn-McCurdy breach or significant baseline change occurs', 'Only when a program is cancelled', 'Only at each major milestone decision'],
            correct: 1,
            explanation: 'SARs are annual reports to Congress covering ACAT I program cost, schedule, and performance status. Special SARs are required when a Nunn-McCurdy breach occurs (significant 15% or critical 25% unit cost growth). They represent one of the primary mechanisms through which Congress exercises oversight over major defense programs.',
          },
          {
            id: 'q10',
            question: 'What distinguishes an "Urgent Capability Acquisition" pathway program from a standard ACAT program?',
            options: ['It requires more oversight due to its urgency', 'It allows fielding a capability within 2 years through streamlined approvals, typically driven by combatant command urgent needs', 'It is only available to classified programs', 'It eliminates all contractor competition requirements'],
            correct: 1,
            explanation: 'The Urgent Capability Acquisition pathway (governed by DoDI 5000.02 Enclosure 8) enables rapid response to urgent warfighter needs — typically within 2 years. It uses streamlined milestone approvals, expedited contracting, and flexible oversight tailored to the urgency. It does not eliminate competition where time allows, but allows use of other-than-full-and-open competition procedures under FAR 6.302.',
          },
          {
            id: 'q11',
            type: 'drag_match',
            question: 'Match each AAF pathway to the type of acquisition it is designed for:',
            options: [],
            correct: 0,
            explanation: 'Each AAF pathway is designed for a specific acquisition type and risk profile. Matching the pathway to the program type is the first decision a PM makes — choosing the wrong pathway creates unnecessary overhead (e.g., applying full MCA process to a software program) or insufficient oversight (e.g., using Rapid Fielding for an immature technology).',
            pairs: [
              { left: 'Major Capability Acquisition', right: 'Large complex defense systems: aircraft, ships, satellites' },
              { left: 'Middle Tier — Rapid Prototyping', right: 'Field a prototype within 2 years using mature technology' },
              { left: 'Software Acquisition', right: 'Software-intensive systems using Agile/DevSecOps continuous delivery' },
              { left: 'Urgent Capability Acquisition', right: 'Combat-emergent warfighter need requiring capability within 2 years' },
            ],
          },
          {
            id: 'q12',
            type: 'drag_order',
            question: 'Place these ACAT I program milestone events in the correct lifecycle order:',
            options: [],
            correct: 0,
            explanation: 'The ACAT I lifecycle flows: Milestone A approves entry into Technology Maturation and Risk Reduction (TMRR) → Milestone B approves entry into Engineering and Manufacturing Development (EMD) → Milestone C approves entry into Production and Deployment → Full-Rate Production (FRP) Decision authorizes full production. Each milestone is preceded by a Defense Acquisition Board (DAB) review at the OSD level for ACAT ID programs.',
            orderedItems: [
              'Milestone A — Entry into Technology Maturation & Risk Reduction (TMRR)',
              'Milestone B — Entry into Engineering & Manufacturing Development (EMD)',
              'Milestone C — Entry into Production & Deployment (Low-Rate Initial Production authorized)',
              'Full-Rate Production (FRP) Decision — After IOT&E completion',
            ],
          },
        ],
      },

      {
        id: 'foundations-4',
        title: 'OTAs, FAR Part 12 & Streamlined Acquisition Authorities',
        duration: '18 min',
        description: 'Master Other Transaction Authority, commercial item acquisition under FAR Part 12, Simplified Acquisition Procedures, and the emerging tools that let DoD move at the speed of relevance.',
        keyTerms: [
          { term: 'OTA', definition: 'Other Transaction Authority — statutory authority allowing DoD to enter agreements (not contracts) for prototype projects and follow-on production outside FAR/DFARS requirements.' },
          { term: 'Other Transaction Agreement', definition: 'An agreement (not a procurement contract) executed under OTA authority. Not subject to FAR, DFARS, CAS, or most standard acquisition regulations.' },
          { term: 'FAR Part 12', definition: 'Acquisition of Commercial Products and Commercial Services — streamlined procedures for buying items available in the commercial marketplace, with reduced regulatory burden.' },
          { term: 'Commercial Item', definition: 'An item sold or offered in the commercial marketplace for non-government purposes. FAR Part 12 allows acquisition with fewer regulations and no certified cost or pricing data requirement.' },
          { term: 'SAP', definition: 'Simplified Acquisition Procedures — streamlined procurement process for purchases below the SAT ($250K). Faster, less documentation, but still requires competition where practical.' },
          { term: 'SAT', definition: 'Simplified Acquisition Threshold — $250K (as of 2024). Acquisitions below this threshold use SAP. Between SAT and $750K there are additional micro-purchase/simplified procedures.' },
          { term: 'Micro-Purchase', definition: 'Purchases at or below $10K. May be made by any government employee with a purchase card without competition requirement (FAR Part 13.2).' },
          { term: 'Sole Source', definition: 'Award without competition. Requires justification under FAR 6.302 — valid reasons include: only one responsible source, urgency, national security, follow-on R&D.' },
          { term: 'COTS', definition: 'Commercial Off-The-Shelf — products sold or used commercially without modification. COTS acquisition is the fastest, cheapest path but requires active market research.' },
          { term: '10 USC 4022', definition: 'The primary statutory authority for DoD prototype OTAs and follow-on production OTAs. Allows non-traditional defense contractors to participate without the FAR compliance burden.' },
        ],
        content: [
          {
            type: 'text',
            heading: 'The Regulatory Burden Problem — Why Streamlined Paths Exist',
            body: 'The FAR and DFARS were designed for accountability and competition — but they create a compliance burden that some commercial technology companies refuse to accept. Google, Amazon, and many AI/tech firms will not participate in traditional DoD contracting because CAS compliance, DFARS business systems requirements, and certified cost or pricing data requirements add millions in overhead costs and years in lead time. DoD created streamlined paths — OTAs, FAR Part 12, SAP — to access commercial innovation that would otherwise avoid the defense market. As a PM, knowing when to use these paths is as important as knowing how to run a traditional acquisition.',
          },
          {
            type: 'table',
            heading: 'Acquisition Paths Compared — Regulatory Burden vs. Speed',
            headers: ['Path', 'Regulatory Burden', 'Timeline', 'Best For', 'Key Limitation'],
            rows: [
              ['Traditional FAR/DFARS Contract', 'Full FAR/DFARS/CAS compliance', '12-36+ months', 'Complex development; cost-reimbursable R&D; traditional defense programs', 'Slow; excludes many commercial firms'],
              ['FAR Part 12 Commercial', 'Reduced — no CAS, no certified cost data', '6-18 months', 'Products/services available commercially without substantial modification', 'Item must be genuinely commercial'],
              ['OTA Prototype', 'No FAR/DFARS/CAS', '3-12 months', 'Innovative prototypes; non-traditional contractors; technology demonstration', 'Non-competitive follow-on must still meet criteria'],
              ['OTA Production (follow-on)', 'No FAR/DFARS', '1-6 months if directly follows prototype', 'Production of successfully demonstrated OTA prototype', 'Requires successful prototype; scale limits apply'],
              ['Simplified Acquisition Procedures', 'Minimal', 'Days to weeks', 'Purchases < $250K; immediate needs', '$250K ceiling; cannot be used to circumvent competition for larger requirements'],
              ['Micro-Purchase', 'None', 'Hours', 'Purchases < $10K; credit card', '$10K ceiling; no strategic use'],
            ],
          },
          {
            type: 'text',
            heading: 'Other Transaction Authority — The Most Powerful Tool You\'re Not Using Enough',
            body: 'OTA was originally authorized in 1958 for NASA (10 USC 4001) and expanded dramatically for DoD prototyping in the 2010s. Under 10 USC 4022, DoD can enter prototype OTAs and — critically — non-competitively award follow-on production contracts to the OTA performer if the prototype is successfully demonstrated. This is a major advantage: a company can win prototype work through OTA, demonstrate success, and then convert directly to production without re-competing. For DoD, OTA allows engagement with commercial tech firms, startups, and nontraditional contractors who refuse FAR-regulated contracts. OTA agreements can include flexible payment terms, IP arrangements, and milestone-based payments that are impossible under FAR.',
          },
          {
            type: 'callout',
            heading: 'OTA Safeguards — What You Can\'t Do',
            body: 'OTA is powerful but not unlimited. Key restrictions: (1) Prototype OTAs must include at least one "nontraditional defense contractor" (a company that has not received DoD contracts over $1M in the past year subject to full CAS compliance) OR significant government cost-share (one-third of total project cost). (2) The prototype must be for a "prototype project" — not production of a fielded system. (3) Follow-on production OTAs require a successful demonstration of the prototype. (4) Congress must be notified of OTAs over $500M. (5) OTAs over $250M generally require competitive processes. There is significant congressional scrutiny of OTA misuse — using OTA to avoid competition for production work that should be competitively bid.',
          },
          {
            type: 'formula',
            heading: 'FAR Part 12 Commercial Item Determination — The Test',
            formula: 'FAR 2.101 defines "commercial product" — meets ANY of these:\n\n1. Sold/offered for sale in the commercial marketplace in the past 3 years\n2. Sold/offered in modified form (modifications customary to commercial market)\n3. An item that evolved from a commercial item through advances in technology\n4. Any item described in (1)-(3) for which modifications are described in (2)\n\nCOMMERCIAL SERVICES test (FAR 2.101):\n→ Offered and sold competitively to the general public\n→ Established catalog or market prices for specific tasks performed\n→ Not developed exclusively for government use\n\nIF COMMERCIAL → FAR Part 12 applies:\n  → No certified cost or pricing data (no TINA)\n  → No CAS\n  → Reduced DFARS clauses (FAR 52.212-4 and 52.212-5 replace dozens of clauses)\n  → Use of commercial warranty and terms\n  → No requirement for government-unique accounting\n  → Streamlined source selection using simplified procedures',
            explanation: 'The commercial item determination is made by the contracting officer, but the PM drives the market research that supports it. Document your market research thoroughly — a challenged commercial item determination can unravel an entire acquisition strategy post-award.',
          },
          {
            type: 'table',
            heading: 'Sole Source Justifications Under FAR 6.302 — When Competition Is Not Required',
            headers: ['Exception', 'FAR Cite', 'Example', 'Key Documentation Required'],
            rows: [
              ['Only one responsible source', 'FAR 6.302-1', 'Spare parts from OEM only; unique IP holder', 'J&A documenting why only one source can satisfy requirement'],
              ['Unusual and compelling urgency', 'FAR 6.302-2', 'Time-critical mission need; emergency repair', 'J&A with timeline; limited period; must compete ASAP'],
              ['Industrial mobilization; engineering development', 'FAR 6.302-3', 'Maintaining defense industrial base capability', 'D&F with SecDef or component secretary approval'],
              ['International agreement', 'FAR 6.302-4', 'NATO standardization agreement requires specific vendor', 'Reference to international agreement'],
              ['Authorized or required by statute', 'FAR 6.302-5', 'Small Business set-asides; 8(a) direct awards', 'Documentation of statutory authority'],
              ['National security', 'FAR 6.302-6', 'Classified programs; ITAR restrictions', 'National security D&F'],
            ],
          },
          {
            type: 'text',
            heading: 'Simplified Acquisition Procedures — Speed and Flexibility for Small Buys',
            body: 'For purchases below $250K, FAR Part 13 allows significantly streamlined procedures. Competition is still encouraged — generally three quotes are sufficient — but the complex evaluation, documentation, and review requirements of FAR Part 15 do not apply. Below $10K (micro-purchase threshold), Government Purchase Card (GPC) holders can buy without any competition requirement. For PMs managing programs with many small supporting contracts, understanding SAP allows faster decisions without compromising legal compliance. However, SAP cannot be used to intentionally break up larger requirements to stay below the threshold (a practice called "split purchasing" — a federal violation).',
          },
          {
            type: 'warning',
            heading: 'OTA Abuse — A Growing Congressional Concern',
            body: 'OTA use has grown dramatically — from $3.4B in FY2017 to over $23B in recent years. Congress has flagged concerns about OTA being used to circumvent competition requirements for production work that should be competitively bid, and about follow-on production OTAs being used well beyond the demonstrated prototype scope. PMs must ensure OTAs are used appropriately: for genuine prototypes, with nontraditional contractor participation, and for production only when the prototype was successfully demonstrated. An OTA that looks like a production contract without competition will face Congressional scrutiny and potential investigation.',
          },
          {
            type: 'tip',
            heading: 'Practical OTA Uses for Today\'s PM',
            body: 'Modern defense PMs use OTAs for: AI/ML capability demonstrations with Silicon Valley firms; cybersecurity prototype testing with startups; rapid software prototyping with nontraditional vendors; cloud platform demonstrations. The key is ensuring your OTA is genuinely a prototype — a learning/demonstration activity — not production by another name. Work closely with your legal and contracting teams. The most common OTA mistake is treating it as a shortcut to sole-source production rather than a genuine innovation tool.',
          },
          {
          type: 'text' as const,
          level: 'intermediate' as const,
          heading: 'OTA Strategy for Mid-Career PMs: When and How to Use Them',
          body: 'Other Transaction Agreements under 10 U.S.C. § 4022 offer significant flexibility: no FAR applicability, no Cost Accounting Standards, and the ability to engage non-traditional defense contractors who won\'t bid on traditional contracts. For mid-career PMs, the critical skill is knowing when OTA fits — and when it doesn\'t. OTAs excel for prototype and rapid fielding work with commercial or non-traditional performers. They fail for programs requiring long-term cost accountability, competitive follow-on production (unless structured carefully), or sustained government oversight of contractor financials. An OTA that transitions to a sole-source production contract without competition will face legal scrutiny. Structure the prototype OTA from day one to enable competitive production awards.',
        },
        {
          type: 'callout' as const,
          level: 'advanced' as const,
          heading: 'The Legal Boundaries of Streamlined Acquisition — Where Senior PMs Get Burned',
          body: 'FAR Part 12 commercial item authority and OTAs are powerful tools, but senior PMs know the legal tripwires. Commercial item determinations require a market analysis demonstrating the item is sold to the general public in substantial quantities. Labeling something "commercial" without adequate justification creates GAO protest risk and audit exposure. For OTAs: the "significant non-traditional contractor involvement" requirement is frequently gamed but increasingly scrutinized — if your "non-traditional" partner is a JV with a traditional prime as the majority partner, a DoD IG audit will flag it. The OTA authority explicitly prohibits using them to circumvent the Clinger-Cohen Act or the Competition in Contracting Act for production. Know the statutory text, not just the guidance.',
        },
        ],
      quiz: [
          {
            id: 'q1',
            question: 'What makes OTA (Other Transaction Authority) attractive to non-traditional defense contractors like tech startups?',
            options: ['OTA provides larger contracts than FAR-based contracts', 'OTA agreements are not subject to FAR, DFARS, or CAS requirements — eliminating compliance costs that deter commercial firms', 'OTA guarantees sole-source follow-on production', 'OTA eliminates all intellectual property protections for the government'],
            correct: 1,
            explanation: 'The primary appeal of OTA for nontraditional contractors is freedom from FAR/DFARS/CAS compliance — the accounting, reporting, and audit requirements that add significant overhead costs and complexity. Companies like commercial AI firms, cloud providers, and defense tech startups often refuse traditional DoD contracts specifically because of this compliance burden. OTA removes those barriers.',
          },
          {
            id: 'q2',
            question: 'Under 10 USC 4022, a follow-on production OTA (without competition) is permitted when:',
            options: ['The program manager approves it', 'The prototype project was competitively awarded and successfully demonstrated', 'Congress has not objected within 30 days', 'The original OTA was below $100M'],
            correct: 1,
            explanation: 'A key benefit of prototype OTAs is the ability to award follow-on production to the same performer without competition — IF the prototype was competitively awarded (or met the nontraditional contractor requirement) AND was successfully demonstrated. This production must directly follow from the demonstrated prototype; using it to award unrelated production work is OTA misuse.',
          },
          {
            id: 'q3',
            question: 'A product qualifies as "commercial" under FAR Part 12 when:',
            options: ['It was developed specifically for DoD', 'It has been sold or offered for sale in the commercial marketplace, or evolved from such an item through advances in technology', 'It costs less than the simplified acquisition threshold', 'The contractor certifies it does not require unique modifications'],
            correct: 1,
            explanation: 'FAR 2.101 defines commercial products broadly — sold in the commercial marketplace, offered with customary modifications, or evolved from commercial items. The CO makes the determination based on market research. Commercial item status eliminates CAS, certified cost or pricing data (TINA), and many DFARS clauses — dramatically reducing contractor compliance burden.',
          },
          {
            id: 'q4',
            question: 'The simplified acquisition threshold (SAT) is currently:',
            options: ['$10,000', '$50,000', '$150,000', '$250,000'],
            correct: 3,
            explanation: 'The SAT is $250,000 (as of 2024 per FAR 2.101 and DFARS 202.101 adjustments). Acquisitions below the SAT use simplified acquisition procedures (FAR Part 13). The micro-purchase threshold (no competition required) is $10,000. The SAT is adjusted periodically for inflation and certain exceptions apply (e.g., commercial items, construction).',
          },
          {
            id: 'q5',
            question: '"Split purchasing" — intentionally breaking a $500K requirement into three $150K purchases to use SAP — is:',
            options: ['A legitimate use of simplified acquisition procedures', 'A violation of FAR 13.003(c) — requirements cannot be artificially split to circumvent competition or dollar thresholds', 'Permitted if the items are needed at different times', 'Only a problem if audited by DCAA'],
            correct: 1,
            explanation: 'FAR 13.003(c) explicitly prohibits splitting requirements into smaller purchases to avoid competition requirements or threshold limitations. This is a common compliance violation that auditors and inspectors general actively look for. The test is whether the items serve a single end purpose that should be acquired as one requirement — if so, they must be consolidated and competed appropriately.',
          },
          {
            id: 'q6',
            question: 'Which FAR clause replaces dozens of standard DFARS clauses when FAR Part 12 commercial item procedures are used?',
            options: ['FAR 52.215-2 (Audit and Records)', 'FAR 52.212-4 (Contract Terms and Conditions — Commercial Products) and FAR 52.212-5', 'DFARS 252.204-7012 (Cybersecurity)', 'FAR 52.222-26 (Equal Opportunity)'],
            correct: 1,
            explanation: 'FAR 52.212-4 and 52.212-5 are the streamlined commercial terms clauses that substitute for the full list of individual standard FAR clauses normally required. This is what makes commercial acquisitions so much faster — instead of reviewing 30+ clause flowdown requirements, the CO simply incorporates 52.212-4/5, which contain the essential terms in a single, commercial-friendly format.',
          },
          {
            id: 'q7',
            question: 'A sole source justification under FAR 6.302-2 ("unusual and compelling urgency") requires the PM to demonstrate:',
            options: ['The requirement is classified', 'There is an immediate danger to life, national security, or critical mission; and competition would cause unacceptable delay', 'The contractor is the only one in the world with the capability', 'The acquisition is below the simplified acquisition threshold'],
            correct: 1,
            explanation: 'FAR 6.302-2 urgency requires a genuine time-critical situation where competing the requirement would cause serious harm — not just inconvenience. The J&A must document the specific harm of delay, the limited period for the noncompetitive award, and a plan to compete follow-on requirements. "We didn\'t plan ahead" does not qualify as unusual and compelling urgency.',
          },
          {
            id: 'q8',
            question: 'A key OTA safeguard that prevents its use solely as a competition-avoidance tool for production is:',
            options: ['OTAs must be reviewed by GAO before award', 'Production OTAs require the prototype to have been successfully demonstrated AND the OTA must include at least one nontraditional contractor OR significant government cost-share', 'OTAs are automatically cancelled after 2 years', 'All OTAs must be competitively awarded through a public notice'],
            correct: 1,
            explanation: 'The nontraditional contractor OR government cost-share requirement prevents traditional defense contractors from simply using OTA to avoid competition. The "successful demonstration" requirement ensures follow-on production is genuinely tied to demonstrated prototype results. Together, these safeguards are intended to prevent OTA from becoming a regulatory loophole for routine production contracting.',
          },
          {
            id: 'q9',
            question: 'Government Purchase Cards (GPCs) can be used without any competition requirement for purchases at or below:',
            options: ['$2,500', '$10,000', '$25,000', '$50,000'],
            correct: 1,
            explanation: 'The micro-purchase threshold is $10,000 (FAR 13.201) — purchases at or below this amount may be made with a GPC by any authorized cardholder without a competition requirement. Above $10K, SAP competition standards apply. Above $250K (SAT), full competition and documentation requirements apply.',
          },
          {
            id: 'q10',
            question: 'Which statement best describes the relationship between OTA and FAR?',
            options: ['OTAs are a type of contract governed by FAR Part 16', 'OTAs are agreements (not procurement contracts) that operate outside the FAR — they are governed by their own negotiated terms and the authorizing statute (10 USC 4022)', 'OTAs are subject to FAR but exempt from DFARS', 'OTAs must be converted to FAR contracts within 180 days'],
            correct: 1,
            explanation: 'OTAs are explicitly not procurement contracts and are not subject to the FAR or DFARS. They are governed by the statutory authority (10 USC 4022 for prototype and production), the negotiated agreement terms, and any agency-specific OTA guidance (like the OSD OTA Guide). This is the source of their flexibility — and the reason they require careful legal and policy oversight.',
          },
          {
            id: 'q11',
            type: 'drag_match',
            question: 'Match each acquisition path to its best use case:',
            options: [],
            correct: 0,
            explanation: 'Matching the acquisition strategy to the requirement type is a core PM competency. Traditional FAR contracts for complex regulated programs. FAR Part 12 for genuine commercial products. OTA for innovative prototypes with nontraditional contractors. SAP for small routine purchases. Each path exists to serve a specific need — using the wrong path creates legal, financial, and oversight risk.',
            pairs: [
              { left: 'Traditional FAR/DFARS Contract', right: 'Complex defense system requiring cost reimbursable R&D and CAS compliance' },
              { left: 'FAR Part 12 Commercial', right: 'Cloud services or COTS software sold commercially without modification' },
              { left: 'Other Transaction Authority (OTA)', right: 'AI prototype with Silicon Valley startup that refuses FAR compliance' },
              { left: 'Simplified Acquisition Procedures', right: 'Routine supplies purchase of $180K for program support' },
            ],
          },
          {
            id: 'q12',
            type: 'drag_order',
            question: 'Order these acquisition paths from MOST regulated/slowest to LEAST regulated/fastest:',
            options: [],
            correct: 0,
            explanation: 'Traditional FAR/DFARS contracts carry the full regulatory burden — CAS, DFARS business systems, certified cost data, competition requirements. FAR Part 12 is faster with reduced clause requirements. OTA eliminates FAR/DFARS entirely. SAP is streamlined for sub-SAT buys. Micro-purchases are immediate with no competition required. The trade-off: less regulation means less accountability — use the appropriate level for the risk.',
            orderedItems: [
              'Traditional FAR/DFARS Contract (full CAS, DFARS, TINA, competition)',
              'FAR Part 12 Commercial Item (reduced clauses; no CAS; no certified cost data)',
              'Other Transaction Authority (no FAR/DFARS/CAS; negotiated terms only)',
              'Simplified Acquisition Procedures (below $250K; three quotes; minimal docs)',
              'Micro-Purchase / Government Purchase Card (below $10K; no competition required)',
            ],
          },
        ],
      }
    ],
    assessment: [
      {
        id: 'a1',
        question: "The DoD 5000 series acquisition lifecycle begins at which phase before Milestone A?",
        options: ['Engineering & Manufacturing Development', 'Materiel Solution Analysis (MSA)', 'Operations & Support', 'Production & Deployment'],
        correct: 1,
        explanation: "The MSA phase precedes Milestone A and is where the DoD explores alternative materiel solutions to meet a validated need. It culminates in a Milestone A decision to begin Technology Maturation & Risk Reduction (TMRR)."
      },
      {
        id: 'a2',
        question: "Which document formally captures validated operational requirements and drives the acquisition program?",
        options: ['Acquisition Program Baseline (APB)', 'Initial Capabilities Document (ICD)', 'Capability Development Document (CDD)', 'Test & Evaluation Master Plan (TEMP)'],
        correct: 2,
        explanation: "The CDD (Capability Development Document) is the primary requirements document that drives the acquisition program through Milestone B. It defines Key Performance Parameters (KPPs), Key System Attributes (KSAs), and other system-level requirements validated through the JCIDS process."
      },
      {
        id: 'a3',
        question: "ACAT I programs are characterized by which threshold (as of current DoD policy)?",
        options: ['RDT&E > $100M or Procurement > $500M', 'RDT&E > $480M or Procurement > $2.79B', 'RDT&E > $185M or Procurement > $835M', 'Any program designated by the Secretary of Defense only'],
        correct: 1,
        explanation: "ACAT I (MDAPs) meet the threshold of RDT&E costs exceeding $480M or procurement costs exceeding $2.79B (FY2020 constant dollars), OR are designated by the USD(A&S) due to special interest. ACAT II uses the $185M/$835M thresholds."
      },
      {
        id: 'a4',
        question: "The Milestone Decision Authority (MDA) for ACAT IC programs is:",
        options: ['USD(A&S)', 'Component Acquisition Executive (CAE)', 'Program Executive Officer (PEO)', 'Deputy Secretary of Defense'],
        correct: 1,
        explanation: "For ACAT IC programs, the MDA is the Component Acquisition Executive (CAE) — e.g., ASA(ALT) for Army, ASN(RDA) for Navy, SAF/AQ for Air Force. The USD(A&S) serves as MDA for ACAT ID programs (the highest tier)."
      },
      {
        id: 'a5',
        question: "The Pathways Recent Graduates Program entry-level positions are typically at what GS grade range?",
        options: ['GS-5 to GS-7', 'GS-7 to GS-9', 'GS-9 to GS-12', 'GS-12 to GS-13'],
        correct: 1,
        explanation: "Pathways Recent Graduates positions typically start at GS-7 to GS-9 for candidates within two years of earning a degree. The program provides structured training, mentorship, and a clear pathway to full career positions."
      },
      {
        id: 'a6',
        question: "Which acquisition strategy element is tailored by the MDA to adjust DoDI 5000 policy requirements for a specific program?",
        options: ['Nunn-McCurdy certification', 'Acquisition Program Baseline', 'Tailoring plan documented in the Acquisition Strategy', 'Selected Acquisition Report (SAR)'],
        correct: 2,
        explanation: "Tailoring is documented in the Acquisition Strategy and requires MDA approval. It allows the program to adjust (but not eliminate) DoDI 5000 policy requirements to match program complexity and risk. Statutory requirements (e.g., SAR, Nunn-McCurdy, ICE for ACAT I) cannot be tailored away."
      },
      {
        id: 'a7',
        question: "An Other Transaction Authority (OTA) agreement differs from a FAR-based contract primarily because:",
        options: ['It is only available to ACAT III programs', 'It is exempt from FAR, DFARS, and CAS — terms are fully negotiated', 'It requires certified cost or pricing data from all parties', 'It limits competition to small businesses only'],
        correct: 1,
        explanation: "OTAs are explicitly excluded from the FAR and DFARS. They are authorized under 10 U.S.C. §§ 4021-4022 for prototype and follow-on production projects. This makes them powerful for engaging non-traditional defense contractors and companies that will not accept standard FAR clauses."
      },
      {
        id: 'a8',
        question: "A FAR Part 12 commercial item contract does NOT require:",
        options: ['A written contract', 'Competition where practicable', 'Certified cost or pricing data under TINA', 'A period of performance'],
        correct: 2,
        explanation: "FAR Part 12 commercial item contracts are explicitly exempt from the Truth in Negotiations Act (TINA) — no certified cost or pricing data is required. The rationale is that commercial market pricing is self-regulating and government-unique cost analysis requirements would deter commercial vendors."
      },
      {
        id: 'a9',
        question: "What is the maximum dollar threshold for Simplified Acquisition Procedures (SAP) under the FAR?",
        options: ['$10,000', '$100,000', '$250,000', '$500,000'],
        correct: 2,
        explanation: "FAR Subpart 13 Simplified Acquisition Procedures apply to acquisitions at or below the Simplified Acquisition Threshold (SAT) of $250,000. Below SAT, the contracting officer can use streamlined procedures (request for quotes, three quotes minimum, simplified documentation) instead of full and open competition requirements."
      },
      {
        id: 'a10',
        question: "The JCIDS process validates requirements at what authority level before an ACAT I program can proceed to Milestone A?",
        options: ['Program Manager', 'Program Executive Officer (PEO)', 'Joint Requirements Oversight Council (JROC) or delegated FCB', 'Component Acquisition Executive'],
        correct: 2,
        explanation: "For ACAT I programs, the Joint Requirements Oversight Council (JROC) — or a delegated Functional Capabilities Board (FCB) — must validate the Initial Capabilities Document (ICD) before Milestone A. The JROC is chaired by the Vice Chairman of the Joint Chiefs of Staff and ensures requirements are joint and prioritized across all services."
      },
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
          },
          {
          type: 'text' as const,
          level: 'intermediate' as const,
          heading: 'POM Execution: Managing Your Program Through the Budget Cycle',
          body: 'Mid-career PMs live in two worlds simultaneously: executing the current year\'s approved budget and defending next year\'s POM submission. Your POM submission must be defensible with cost data, supported by your program\'s APB, and internally consistent with your contract structure. The most common POM mistake: projecting out-year costs that don\'t match your contract\'s performance schedule, or requesting procurement funding before RDT&E work is complete. Budget analysts at the Component and OSD level will catch these inconsistencies. Build your POM from the contract up — not from the budget down. Cross-walk your WBS to your budget line items. When the two don\'t align, you get reprogramming problems in execution.',
        },
        {
          type: 'callout' as const,
          level: 'advanced' as const,
          heading: 'Congressional Marks and Unfunded Priorities: The Hidden Budget Game',
          body: 'The President\'s Budget Request is a starting position, not an ending position. Congress marks up every defense bill — adding earmarks, cutting programs, fencing funds pending reports. Senior PMs must track their program\'s budget through the NDAA markup process: House HASC mark, Senate SASC mark, conference report. Fenced funding (congressionally restricted) requires notifications or reports before obligation — failing to track these leads to Anti-Deficiency Act violations. Unfunded Priorities Lists (UPLs) are the Service Chiefs\' mechanism for asking Congress to add money above the budget request. If your program is on a UPL, it creates both opportunity (more money) and risk (congressional attention). Know where your program sits in the congressional priority stack — your program\'s survival may depend on it.',
        },
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
          },
          {
          type: 'text' as const,
          level: 'intermediate' as const,
          heading: 'Using EVM Data to Drive Contractor Behavior',
          body: 'EVM data is only valuable if the government PM uses it to hold contractors accountable. Mid-career PMs should establish a monthly rhythm: review IPMR data within 5 days of receipt, convene a PMR within 10 days, and issue formal corrective action requests for threshold breaches within 15 days. The most powerful question you can ask a contractor at a PMR: "Your Format 5 says you\'ll recover 15 schedule days by end of quarter — what specific tasks will be completed early and by whom?" Vague recovery plans are not plans. Require specificity: named individuals, milestone dates, budget planned for the recovery effort. Document these commitments in meeting minutes so the contractor can\'t walk them back.',
        },
        {
          type: 'callout' as const,
          level: 'advanced' as const,
          heading: 'EVM Compliance Surveillance and EVMS Acceptance — What Senior PMs Must Know',
          body: 'DoDI 5000.02 requires EVMS on cost-type contracts over $20M and fixed-price over $50M. But having EVMS is not enough — the system must be compliant with ANSI/EIA-748. DCMA conducts EVMS surveillance and can issue non-compliance findings. A Level III finding (systemic noncompliance) can result in a compliance improvement plan, increased surveillance, and in extreme cases, withholding of fee. Senior PMs must understand their contractor\'s EVMS compliance status before accepting performance data. An EVMS system that rubber-baselines (retroactively adjusts PMB to reduce variances) produces data that is technically compliant but strategically meaningless. When CPI is suspiciously stable at 1.00 month after month on a complex development contract, question the system — not just the data.',
        },
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
        duration: '24 min',
        description: 'Master cost estimating methodologies, the CAPE independent cost estimate process, and — critically — how contractors price labor through LCATs, pre-priced labor, job codes, and compensation ratios that directly drive your program cost.',
        keyTerms: [
          { term: 'ICE', definition: 'Independent Cost Estimate — an estimate prepared independently of the program office, required at key milestones for ACAT I programs.' },
          { term: 'CAPE', definition: 'Cost Assessment and Program Evaluation — OSD office responsible for independent cost analysis of major defense acquisition programs.' },
          { term: 'Analogous Estimating', definition: 'Using costs from similar past programs to estimate the new program. Fast but least accurate (±50%). Best for pre-Milestone A.' },
          { term: 'Parametric Estimating', definition: 'Using statistical Cost Estimating Relationships (CERs) to relate cost to technical parameters (weight, power, throughput). Moderate accuracy (±25%).' },
          { term: 'Bottoms-Up Estimating', definition: 'Estimating each work package or task individually and rolling up to a total. Most accurate (±10-15%) but requires mature design. Used at Milestone B+.' },
          { term: 'Cost Risk', definition: 'The uncertainty or variability in a cost estimate; typically quantified at the 80th percentile (P80) for DoD program budgeting.' },
          { term: 'LCAT', definition: 'Labor Category — a defined skill level and discipline (e.g., Software Engineer Level III, Program Manager Level II) that establishes what work a person performs and at what rate they are billed.' },
          { term: 'Pre-Priced Labor', definition: 'Labor categories with negotiated, fixed billing rates established in the base contract (e.g., an IDIQ or GWAC), allowing task orders to be placed without re-pricing labor for each award.' },
          { term: 'Compensation Ratio (Compa-Ratio)', definition: 'An employee\'s actual salary divided by the midpoint of their pay band. A ratio of 1.0 means the employee is paid exactly at midpoint. Used to assess whether a contractor\'s labor pricing is fair and competitive.' },
          { term: 'Job Code', definition: 'A contractor-internal identifier linking an employee to a specific LCAT and pay band within their compensation structure. Audited by DCAA to verify labor charging accuracy.' },
          { term: 'Direct Labor Rate', definition: 'The base hourly wage paid to an employee before fringe benefits or overhead are applied. The foundation of any labor cost estimate: Direct Labor Rate × Hours = Direct Labor Cost.' },
          { term: 'Fully Burdened Rate', definition: 'The total cost per labor hour including all fringe benefits, overhead, G&A, and fee. What the government actually pays per hour of contractor labor.' },
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
          },
          {
            type: 'text',
            heading: "Labor Categories (LCATs): The Hidden Engine of Cost Proposals",
            body: "When a contractor submits a cost proposal, the single largest line item — typically 50-70% of total contract cost — is direct labor. That labor is not proposed as a lump sum. It is built from Labor Categories (LCATs): defined, titled skill levels that specify the education, years of experience, and functional role a person must have to work in that slot. Examples: \"Systems Engineer Level II (SE-II)\" requires a BS in engineering + 5-8 years experience. \"Program Manager Level III (PM-III)\" requires 10+ years managing programs > $50M. Each LCAT has a specific direct labor rate — the hourly base wage — that is burdened with fringe, overhead, and G&A before you see the final billing rate. As a PM, your ability to evaluate whether a contractor's proposed labor mix is realistic directly determines whether your cost estimate is credible."
          },
          {
            type: 'table',
            heading: "LCAT Structure: How a Contractor Builds a Labor Proposal",
            headers: ['LCAT Title', 'Skill Level Indicators', 'Typical Direct Labor Rate ($/hr)', 'Fully Burdened Rate Example'],
            rows: [
              ['Program Manager I', 'BS + 5 yrs; manages subteams; no independent authority', '$65-85/hr', '$165-215/hr (1.5-2.5x wrap)'],
              ['Program Manager II', 'BS + 10 yrs or MS + 8 yrs; manages programs <$50M', '$90-120/hr', '$225-300/hr'],
              ['Program Manager III', 'BS + 15 yrs or MS + 12 yrs; manages programs >$50M; strategic decisions', '$130-175/hr', '$325-440/hr'],
              ['Systems Engineer II', 'BS + 4-7 yrs; requirements analysis, design trade studies', '$70-90/hr', '$175-225/hr'],
              ['Systems Engineer III', 'BS + 8-12 yrs or MS + 5 yrs; system architecture, integration lead', '$95-130/hr', '$240-325/hr'],
              ['Software Engineer II', 'BS CS/CE + 3-6 yrs; coding, testing, integration', '$75-100/hr', '$190-250/hr'],
              ['Financial Analyst I', 'BS Finance/Accounting + 2-4 yrs; budget tracking, reporting', '$55-70/hr', '$138-175/hr'],
              ['Contracts Specialist II', 'BS + 5 yrs contracting; proposal prep, mods, compliance', '$65-85/hr', '$163-213/hr'],
            ]
          },
          {
            type: 'callout',
            heading: "Pre-Priced LCATs: How IDIQs Lock In Labor Rates",
            body: "On IDIQ contracts and GWACs (like SEAPORT-NXG, OASIS, GSAM), labor rates are negotiated and fixed in the base contract — these are called pre-priced labor categories. When a task order is competed under that vehicle, the contractor cannot re-price their LCATs above the contract ceiling rates. This is powerful for the government: you are comparing proposals on the same rate structure, so competition becomes about hours and approach rather than rate games. As a PM, when you use a pre-priced IDIQ, verify the ceiling rates were set competitively and recently — rates negotiated 5 years ago may no longer reflect the labor market, and contractors may propose fewer hours at higher mix levels to compensate."
          },
          {
            type: 'formula',
            heading: "Job Codes, Pay Bands, and the Compensation Ratio",
            formula: 'Compa-Ratio = Employee Annual Salary ÷ Pay Band Midpoint\n\nExample:\n  Employee salary: $95,000\n  LCAT \"Systems Engineer II\" pay band: $75,000 – $105,000 (midpoint: $90,000)\n  Compa-Ratio = $95,000 ÷ $90,000 = 1.056 (slightly above midpoint = fair)\n\nCompa-Ratio Interpretation:\n  < 0.80 = Underpaid relative to market (retention risk; DCAA flag)\n  0.80–1.00 = Below midpoint (new hire, lower experience)\n  1.00 = Exactly at midpoint (market rate)\n  1.00–1.20 = Above midpoint (senior, high performer)\n  > 1.20 = Significantly above midpoint (may require justification)',
            explanation: "Every contractor employee has a job code — an internal HR identifier that maps them to a specific LCAT and pay band. When DCAA audits a contractor's labor charging, they pull the job code and verify: (1) Is this employee actually qualified for the LCAT they're charging? (2) Is their salary consistent with the pay band? (3) Are they charging the correct contract? A compa-ratio above 1.20 is not illegal, but it prompts DCAA to verify the employee's qualifications match the LCAT. If a contractor is billing a junior employee at a senior LCAT rate, that is a False Claims Act violation. As a PM, understanding this structure lets you challenge a cost proposal that looks too heavy at senior levels."
          },
          {
            type: 'text',
            heading: "How LCATs Connect to Your Cost Estimate as a PM",
            body: "When you review a contractor's cost proposal at Milestone B or for a new task order, don't just look at total price. Drill into the labor mix. Ask: What percentage of hours are at senior LCAT levels vs. junior? Is the proposed mix realistic for the work? A software sustainment task that is 80% \"Software Engineer III\" when \"Software Engineer I and II\" could do 60% of the work is a red flag — it inflates cost without improving quality. Also watch for \"labor substitution\" clauses in contracts: if the contract requires senior engineers but the contractor is actually staffing junior personnel (billing at junior rates but billing more hours), your actual cost stays the same but quality drops. The LCAT structure, job codes, and compensation ratios are DCAA's primary audit tools to catch exactly this kind of misbilling — and they should be YOUR primary evaluation tools when reviewing proposals."
          },
          {
            type: 'list',
            heading: "Five Questions Every PM Should Ask When Reviewing a Labor Proposal",
            items: [
              '1. Does the LCAT mix make sense for the statement of work? Senior engineers should not dominate routine maintenance tasks.',
              '2. Are the proposed direct labor rates consistent with the contractor\'s disclosed forward pricing rates (FPRAs)? If not, why not?',
              '3. For IDIQ/pre-priced vehicles: are the proposed rates at or below the contract ceiling rates? Any ceiling rate exception requires CO approval.',
              '4. Is the contractor proposing the same LCATs they actually staff? Request key personnel resumes and verify job codes match proposed LCATs.',
              '5. What is the annual escalation rate applied to labor in out-years? Defense labor typically escalates 3-4% annually — proposals using 0% escalation are understating future costs.',
            ]
          },
          {
          type: 'text' as const,
          level: 'intermediate' as const,
          heading: 'Defending Your Cost Estimate in a CAPE Review',
          body: 'The OSD Cost Assessment and Program Evaluation (CAPE) office produces Independent Cost Estimates (ICEs) for major programs at each milestone. When CAPE\'s ICE is significantly higher than your Program Office Estimate (POE), the MDA must choose which to use for the APB — and MDA almost always uses the higher one. Mid-career PMs need to understand how CAPE builds its ICEs: parametric models (SEER, PRICE, COCOMO for software) calibrated to historical analogues. To reduce the gap, you must document your differences with CAPE: what makes your program different from the analogues, what risk mitigations justify lower estimates, and what ground rules and assumptions diverge. The goal isn\'t to beat CAPE — it\'s to narrow the gap through credible technical justification.',
        },
        {
          type: 'callout' as const,
          level: 'advanced' as const,
          heading: 'Should-Cost vs. Will-Cost: The Senior PM\'s Most Powerful Tool',
          body: 'Should-Cost analysis is a government-led deep dive into contractor cost structure to identify efficiencies — not just to project what costs will be, but to drive them down. DoDI 5000.02 requires Should-Cost management on major programs. In practice, should-cost teams examine contractor labor mix (are they using senior engineers where journeymen would do?), overhead allocation (is G&A allocation methodology favorable to the program?), and make-buy decisions. The results feed should-cost targets — negotiating positions for the next contract award. Senior PMs who run aggressive should-cost programs routinely achieve 10-15% cost reductions. The political challenge: your contractor will resist deeply, and your own program office staff (who work with the contractor daily) will resist disrupting the relationship. Push anyway.',
        },
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
          },
          {
            id: 'q11',
            question: "On a pre-priced IDIQ contract, a contractor submits a task order proposal with labor rates 15% above the IDIQ contract ceiling rates. What is the correct course of action?",
            options: [
              'Accept the proposal since ceiling rates are guidelines, not hard limits',
              'The proposal is non-compliant — ceiling rates are contractually binding and the contractor cannot exceed them without a contract modification',
              'Request a waiver from DCAA before accepting',
              'The contracting officer may accept if the work is highly specialized',
            ],
            correct: 1,
            explanation: "Pre-priced ceiling rates on IDIQ contracts and GWACs are contractually binding. A contractor cannot propose labor rates above the ceiling without a modification to the base contract. A task order proposal that exceeds ceiling rates is non-compliant and must be returned for correction. This is one of the primary government protections in IDIQ vehicles — it prevents rate inflation on individual task orders."
          },
          {
            id: 'q12',
            type: 'drag_match',
            question: "Match each LCAT/labor concept to its correct definition.",
            options: [],
            correct: 0,
            pairs: [
              { left: 'Compa-Ratio', right: 'Employee salary ÷ pay band midpoint; measures pay fairness vs. market' },
              { left: 'Job Code', right: 'Internal HR identifier linking an employee to a specific LCAT and pay band; DCAA audit target' },
              { left: 'Pre-Priced Labor', right: 'Labor categories with rates fixed in the base contract; task orders cannot exceed these rates' },
              { left: 'Direct Labor Rate', right: 'Base hourly wage before fringe, overhead, or G&A are applied' },
            ],
            explanation: "These four concepts form the backbone of defense contractor labor pricing. DCAA uses job codes and compa-ratios to audit labor charging accuracy. Government PMs use pre-priced rates and direct labor rates to evaluate proposal realism and prevent cost growth."
          },
          {
            id: 'q13',
            question: "A contractor's cost proposal for a software sustainment task shows 80% of hours at 'Software Engineer Level III' rates ($105/hr direct). You know similar tasks at other contractors typically run 60% at Level I/II ($65-75/hr). What is the most likely issue?",
            options: [
              'The contractor is using an incorrect estimating methodology',
              'The contractor is proposing an inflated labor mix — over-leveling LCATs to drive up cost without improving performance',
              'The direct labor rates are too low for Level III engineers',
              'The proposal violates TINA because it uses parametric estimating',
            ],
            correct: 1,
            explanation: "'Over-leveling' — proposing too many senior LCAT hours on work that could be done by more junior (and less expensive) personnel — is one of the most common ways cost proposals are inflated in defense contracting. As a PM, comparing the proposed labor mix against similar tasks or industry benchmarks is a critical cost realism check. You can challenge this during negotiations by requesting a staffing rationale or comparison to the contractor's actual workforce supporting similar work."
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
          },
          {
          type: 'text' as const,
          level: 'intermediate' as const,
          heading: 'Managing Color of Money Across a Complex Program',
          body: 'Real programs use multiple appropriation types simultaneously. A typical ACAT II program in EMD might have RDT&E funding the development contract, O&M funding government lab support, and MILCON funding a test facility. Each appropriation has different obligation and expenditure rules. The most common mid-career mistake: using RDT&E to fund activities that have crossed into production (violates the appropriation\'s purpose), or letting O&M funds expire while trying to transfer them to RDT&E (not permitted). Your comptroller is your best friend — but you need to give them enough lead time to structure funding actions properly. Last-minute funding transfers almost always fail or create audit exposure.',
        },
        {
          type: 'callout' as const,
          level: 'advanced' as const,
          heading: 'Anti-Deficiency Act Violations and How They Happen to Good PMs',
          body: 'The Anti-Deficiency Act (31 U.S.C. § 1341) prohibits obligating funds in excess of or in advance of appropriations. Violations are career-ending. They happen most often through: (1) continuing contract performance after a CR expires and before new appropriations are enacted without a proper Continuing Resolution Authority authorization; (2) using one appropriation to fund activities that belong to another ("purpose" violations); (3) obligating contracts before funds are available in USASpending. Senior PMs must build a personal funding calendar: when does each appropriation expire? When does the CR end? What is the period of availability for each line item? These are not comptroller problems — they are PM problems. The PM signs the obligation documents.',
        },
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
,
{
        id: 'finance-5',
        title: 'EAC Deep Dive: Forecasting Final Program Cost',
        duration: '22 min',
        description: 'Master all four EAC methods, understand when to use each, and learn how senior leaders use EAC to make go/no-go program decisions.',
        keyTerms: [
          { term: 'EAC', definition: 'Estimate at Completion — the total forecasted cost to complete the entire program, calculated using current performance data.' },
          { term: 'BAC', definition: 'Budget at Completion — the total approved budget for all authorized work on the program (the baseline).' },
          { term: 'ETC', definition: 'Estimate to Complete — the projected cost of work remaining: ETC = EAC - AC.' },
          { term: 'VAC', definition: 'Variance at Completion — the projected difference between BAC and EAC: VAC = BAC - EAC. Negative means overrun.' },
          { term: 'TCPI', definition: 'To-Complete Performance Index — the cost efficiency required on all remaining work to achieve the EAC goal: TCPI = (BAC - EV) / (EAC - AC).' },
          { term: 'CPI', definition: 'Cost Performance Index — current cost efficiency: EV / AC. The most reliable single predictor of final EAC.' },
          { term: 'SPI', definition: 'Schedule Performance Index — current schedule efficiency: EV / PV. Used in combined EAC formulas.' },
          { term: 'IPMR Format 5', definition: 'Problem Analysis Report — the IPMR format where contractors explain EAC variances, root causes, and corrective actions.' },
        ],
        content: [
          {
            type: 'text',
            heading: 'Why EAC is the Number That Keeps PMs Up at Night',
            body: 'The Estimate at Completion is the most scrutinized number in any program review. It tells leadership one thing: how much is this program actually going to cost? Unlike the BAC (your original plan), the EAC incorporates real performance data — what you have spent and what you have accomplished. Senior leaders, PEOs, and Congress use the EAC to decide whether to continue, restructure, or cancel a program. If your EAC exceeds the BAC by 25%, you are in Nunn-McCurdy territory. If it exceeds it by enough to exceed Available Congressional Budget Authority, you may face a program termination. Getting your EAC right — and updating it honestly every reporting period — is one of the most important things a PM does.',
          },
          {
            type: 'callout',
            heading: 'The Golden Rule of EAC',
            body: 'Never manage to the EAC you want — manage to the EAC the data tells you. PMs who "sandbag" EACs to avoid leadership scrutiny are not protecting their programs — they are destroying their credibility. Leaders at the PEO and SAE level have seen thousands of programs. They know when an EAC is unrealistic, and a PM who consistently produces optimistic EACs that then miss is far more damaging than one who delivers accurate, uncomfortable forecasts early.',
          },
          {
            type: 'formula',
            heading: 'The Four EAC Methods — Know All of Them',
            formula: 'METHOD 1: EAC = BAC / CPI\n  → Assumes: Future work will be performed at the same efficiency as to date\n  → When to use: Program is ≥20% complete; CPI has stabilized; systemic cost problems exist\n  → Most statistically accurate for mature programs\n  → Example: BAC = $200M, CPI = 0.85 → EAC = $200M / 0.85 = $235.3M\n\nMETHOD 2: EAC = AC + (BAC - EV)\n  → Assumes: All remaining work will be performed at budgeted rates (original plan)\n  → When to use: Current overrun is a one-time anomaly; not expected to recur\n  → Most optimistic method; use only when you can defend why the past won\'t predict the future\n  → Example: AC = $50M, BAC = $200M, EV = $40M → EAC = $50M + $160M = $210M\n\nMETHOD 3: EAC = AC + [(BAC - EV) / CPI]\n  → Assumes: Remaining work performed at current cost efficiency\n  → Same as Method 1 but written differently to show ETC separately\n  → ETC = (BAC - EV) / CPI\n\nMETHOD 4: EAC = AC + [(BAC - EV) / (CPI × SPI)]\n  → Assumes: Both cost AND schedule inefficiency will continue to affect remaining work\n  → When to use: Program has both cost and schedule problems; recovery will take time\n  → Most conservative (highest EAC) method\n  → Example: AC = $50M, BAC = $200M, EV = $40M, CPI = 0.85, SPI = 0.90\n  → EAC = $50M + [$160M / (0.85 × 0.90)] = $50M + $209.2M = $259.2M',
            explanation: 'Having four methods is not a trick to pick the one that looks best — each reflects a different assumption about the future. A mature PM can articulate exactly why they chose a specific EAC method and defend it against scrutiny. The method you choose tells leadership what your theory of the program\'s cost future is.',
          },
          {
            type: 'table',
            heading: 'EAC Method Selection Guide',
            headers: ['Method', 'Assumption', 'Best For', 'Red Flag If Used When...'],
            rows: [
              ['BAC / CPI', 'Efficiency stays same as today', 'Mature programs (≥20%), systemic issues', 'Program is <20% complete; single anomaly caused overrun'],
              ['AC + (BAC-EV)', 'Remaining work on original budget', 'One-time anomaly; clear corrective action', 'CPI has been <0.9 for 3+ consecutive periods'],
              ['AC + (BAC-EV)/CPI', 'Future at current cost efficiency', 'Standard alternative to Method 1', 'SPI is also significantly <1.0'],
              ['AC + (BAC-EV)/(CPI×SPI)', 'Both cost and schedule problems continue', 'Programs with dual cost+schedule problems', 'CPI and SPI are ≥1.0 (produces artificially low EAC)'],
            ],
          },
          {
            type: 'formula',
            heading: 'VAC and TCPI — The "So What" Numbers',
            formula: 'VAC (Variance at Completion) = BAC - EAC\n  → Negative = projected overrun → Positive = projected underrun\n  → Example: BAC = $200M, EAC = $235M → VAC = -$35M (overrun)\n\nTCPI (To-Complete Performance Index) = (BAC - EV) / (EAC - AC)\n  → What cost efficiency must you achieve on ALL remaining work to hit your EAC?\n  → TCPI > 1.10 is generally considered unachievable (you\'d need to be 10%+ more efficient than you\'ve ever been)\n  → TCPI = 1.00 means remaining work at current efficiency gets you to EAC exactly\n  → TCPI < 1.00 means you can afford to be less efficient and still make EAC (program is in good shape)\n\nExample: BAC = $200M, EV = $40M, AC = $50M, EAC = $235M\n  → TCPI = ($200M - $40M) / ($235M - $50M) = $160M / $185M = 0.865\n  → You only need 86.5% efficiency on remaining work to hit EAC — achievable',
            explanation: 'TCPI is the reality check on your EAC. If you claim an EAC that requires a TCPI of 1.25, you are telling leadership you will be 25% more efficient on remaining work than you have ever been — that is not credible. Reconcile your EAC until the TCPI is defensible.',
          },
          {
            type: 'text',
            heading: 'How Senior Leaders Read EAC Trends',
            body: 'Program executives and PEOs do not look at a single EAC number — they look at EAC trends over time. A steadily rising EAC signals a systemic problem that corrective action is not fixing. A "hockey stick" EAC (stable for months, then sharp jump) signals that someone was managing the EAC rather than reporting reality. Leaders expect EAC to be updated every IPMR reporting period and to reflect current risk. If your EAC has not moved in 6 months while the program has cost and schedule variances, expect scrutiny. The EAC should be living data.',
          },
          {
            type: 'table',
            heading: 'EAC as a Leadership Decision Tool',
            headers: ['EAC Signal', 'What Leadership Sees', 'Likely Action'],
            rows: [
              ['EAC rising gradually, TCPI still achievable', 'Honest reporting; manageable growth', 'Monitor; request corrective action plan'],
              ['EAC static despite CPI < 0.90 for 6+ months', 'Sandbagged EAC; PM may be protecting program', 'Independent review; replace EAC with BAC/CPI'],
              ['EAC jumps sharply in one period ("hockey stick")', 'Prior periods were optimistic; crisis acknowledgment', 'DepSecDef-level review; potential program breach'],
              ['EAC > 125% of original baseline', 'Nunn-McCurdy Critical Breach threshold approaching', 'Congressional notification; USD(A&S) certification required'],
              ['TCPI > 1.10 on published EAC', 'EAC is not credible; PM cannot justify forecast', 'OSD CAPE independent estimate required'],
            ],
          },
          {
            type: 'tip',
            heading: 'PM Best Practice: Maintain Three EAC Scenarios',
            body: 'The most credible PMs bring three EAC scenarios to every senior review: (1) Best Case — assumes corrective actions succeed; (2) Most Likely — Method 1 or 3 based on current data; (3) Worst Case — Method 4 including schedule delays. Showing the range demonstrates analytical rigor and gives leadership the full picture. The worst thing a PM can say to a PEO is "I didn\'t see it coming." Three-scenario EAC reporting eliminates that excuse.',
          },
          {
            type: 'warning',
            heading: 'EAC vs. EAC at Completion vs. Contract EAC',
            body: 'Know the difference: (1) Contractor EAC — what the contractor reports in the IPMR Format 1. (2) Government EAC — what the PM\'s office independently calculates using the same data. These often differ. (3) AFCAA/Service Cost Center EAC — independent agency estimate. When all three diverge significantly, leadership loses confidence in the program. The PM must reconcile differences and explain them clearly.',
          },
          {
          type: 'text' as const,
          level: 'intermediate' as const,
          heading: 'EAC Reconciliation: When Government and Contractor Disagree',
          body: 'Every IPMR submission includes the contractor\'s EAC. The government PM should independently calculate a statistical EAC (BAC ÷ CPI, or BAC ÷ (0.2×SPI + 0.8×CPI)) and compare it to the contractor\'s number. A contractor EAC significantly below the statistical EAC is a red flag — the contractor may be sandbagging risk or building an optimistic recovery plan. When the gap exceeds 5-10%, require a written EAC reconciliation: line-by-line explanation of why the contractor\'s estimate differs from the statistical prediction, including what specific actions justify the optimism. Undocumented optimism in an EAC is a program risk, not a performance metric.',
        },
        {
          type: 'callout' as const,
          level: 'advanced' as const,
          heading: 'Over Target Baseline (OTB) and Over Target Schedule (OTS): The Nuclear Option',
          body: 'When a program\'s EVM data has lost informational value because the baseline is so unrealistic that CPI and SV are meaningless, the government can authorize an Over Target Baseline (OTB) reprogramming. This resets the PMB — but does NOT change the contract price or schedule. It is a measurement reset, not a bailout. OTB requires MDA/SSA approval, a new Integrated Baseline Review, and a formal reprogramming plan. An OTS (Over Target Schedule) similarly resets time-phasing without changing the contract completion date. Senior PMs use OTB reluctantly — it signals that earlier oversight failed, creates congressional scrutiny, and is frequently reported in DAES and SARs. But refusing to authorize OTB when the baseline is clearly broken means making decisions based on meaningless data. Know when to pull the trigger.',
        },
        ],
      quiz: [
          {
            id: 'q1',
            question: 'A program is 35% complete with CPI = 0.82 and BAC = $150M. Using the most statistically accurate EAC formula, what is the projected final cost?',
            options: ['$123M', '$150M', '$182.9M', '$210M'],
            correct: 2,
            explanation: 'EAC = BAC / CPI = $150M / 0.82 = $182.9M. Since the program is >20% complete and the CPI has likely stabilized, the BAC/CPI method is the most statistically reliable predictor. The projected overrun is $32.9M — a 21.9% cost growth.',
          },
          {
            id: 'q2',
            question: 'When is EAC Method 2 (AC + BAC - EV) most appropriately used?',
            options: ['Any time the program has a negative cost variance', 'When a specific one-time event caused the overrun and it is not expected to recur', 'When the program is less than 10% complete', 'When the TCPI is greater than 1.10'],
            correct: 1,
            explanation: 'Method 2 assumes the remaining work will be completed at the originally budgeted rates — implying current inefficiency was a one-time anomaly. It requires strong justification and documentation. Using it when CPI has been consistently below 0.9 for multiple periods is not defensible.',
          },
          {
            id: 'q3',
            question: 'A program has: BAC = $100M, EV = $30M, AC = $40M, EAC = $130M. What is the TCPI?',
            options: ['0.78', '1.00', '0.78 (remaining work at 78% efficiency)', '1.56'],
            correct: 0,
            explanation: 'TCPI = (BAC - EV) / (EAC - AC) = ($100M - $30M) / ($130M - $40M) = $70M / $90M = 0.778. This means the program only needs 77.8% cost efficiency on remaining work to achieve its EAC — actually achievable since current CPI is 30/40 = 0.75, and TCPI is slightly higher but comparable.',
          },
          {
            id: 'q4',
            question: 'A TCPI of 1.25 on a published contractor EAC should raise what concern?',
            options: ['The EAC is too conservative', 'The EAC is not credible — it requires 25% better efficiency than current performance, which is historically unprecedented', 'The contractor needs to increase staff', 'The TCPI calculation uses the wrong formula'],
            correct: 1,
            explanation: 'A TCPI above 1.10 is widely considered unrealistic. A TCPI of 1.25 means the contractor must perform 25% more efficiently on all remaining work than they have to date — an extreme assumption that is almost never realized. This signals the EAC is understated and requires independent review.',
          },
          {
            id: 'q5',
            question: 'VAC (Variance at Completion) = BAC - EAC. If BAC = $200M and EAC = $235M, what does the VAC tell you?',
            options: ['The program will save $35M', 'The program is projected to overrun by $35M at completion', 'The program has already overspent by $35M', 'The schedule will slip by $35M worth of work'],
            correct: 1,
            explanation: 'VAC = $200M - $235M = -$35M. A negative VAC is a projected cost overrun — the EAC exceeds the BAC. This does not mean money has already been spent; it is a forecast of where the program will end up. The PM must identify corrective actions to reduce this projected overrun.',
          },
          {
            id: 'q6',
            question: 'Which EAC formula incorporates BOTH cost and schedule inefficiency into the remaining work forecast?',
            options: ['EAC = BAC / CPI', 'EAC = AC + (BAC - EV)', 'EAC = AC + [(BAC - EV) / CPI]', 'EAC = AC + [(BAC - EV) / (CPI × SPI)]'],
            correct: 3,
            explanation: 'Method 4 divides remaining work (BAC - EV) by the combined CPI × SPI factor, making it the most conservative estimate. It reflects the reality that a program with both cost overruns and schedule delays will face compounding inefficiency on future work — both spending more per unit of work AND doing that work more slowly.',
          },
          {
            id: 'q7',
            question: 'An EAC that has not changed across 8 consecutive IPMR reporting periods despite a CPI of 0.78 throughout is MOST likely to signal:',
            options: ['The program is being managed very effectively', 'The contractor is sandbagging — managing the EAC number rather than reporting reality', 'The CPI formula is being applied incorrectly', 'The contract type has been changed to FFP'],
            correct: 1,
            explanation: 'When CPI consistently falls below 1.0 but EAC stays flat, the EAC is not reflecting actual performance trends — it is being "managed." This is a red flag. Leaders should request an independent EAC using BAC/CPI and compare it to the contractor\'s reported EAC. A large discrepancy warrants a program review or DCMA surveillance action.',
          },
          {
            id: 'q8',
            question: 'ETC (Estimate to Complete) is defined as:',
            options: ['The total projected cost at program completion', 'The cost of work performed to date', 'The cost of all remaining work: EAC minus AC', 'The budget set aside for management reserve'],
            correct: 2,
            explanation: 'ETC = EAC - AC. It is the forecasted cost of all work remaining to be done. ETC is distinct from EAC (total forecast) and AC (actual spend to date). When briefing leadership: "We have spent $50M (AC), we project a final cost of $130M (EAC), which means we have $80M (ETC) of work remaining."',
          },
          {
            id: 'q9',
            question: 'At what program completion percentage does Christensen\'s research show the CPI becomes a reliable predictor of final cost efficiency?',
            options: ['5%', '10%', '20%', '50%'],
            correct: 2,
            explanation: 'Christensen\'s 1993 research — the most cited study in EVM literature — established that the CPI at 20% completion is highly predictive of final CPI, and that CPI almost never improves significantly after that point. This is why early EVM data is so valuable: a CPI of 0.80 at 20% should be treated as a strong signal the program will finish at approximately that efficiency, not recover to 1.0.',
          },
          {
            id: 'q10',
            question: 'Which IPMR format is specifically designed for contractor explanation of significant cost and schedule variances?',
            options: ['Format 1 (WBS-based cost)', 'Format 3 (Baseline)', 'Format 5 (Problem Analysis)', 'Format 6 (Milestone/IMS)'],
            correct: 2,
            explanation: 'IPMR Format 5 is the Problem Analysis Report — it requires detailed variance analysis, root cause identification, and corrective action plans for variances exceeding government-specified thresholds (typically ±$X million or ±Y% variance). This is the format PMs read most carefully at monthly program reviews.',
          },
          {
            id: 'q11',
            type: 'drag_order',
            question: 'Order these EAC methods from MOST optimistic (lowest projected cost) to MOST conservative (highest projected cost) when CPI < 1.0 and SPI < 1.0:',
            options: [],
            correct: 0,
            explanation: 'When both CPI and SPI are below 1.0: Method 2 (assumes remaining work at budget) is most optimistic. Method 1/3 (CPI-adjusted) is the middle ground and most statistically reliable. Method 4 (CPI × SPI combined) is most conservative, projecting the highest cost because it factors in schedule inefficiency multiplying the cost problem.',
            orderedItems: [
              'Method 2: AC + (BAC - EV) — Remaining work at original budget rates',
              'Method 1/3: BAC / CPI — Remaining work at current cost efficiency',
              'Method 4: AC + [(BAC-EV)/(CPI×SPI)] — Combined cost and schedule inefficiency',
            ],
          },
          {
            id: 'q12',
            type: 'drag_match',
            question: 'Match each EAC scenario to the leadership action it typically triggers:',
            options: [],
            correct: 0,
            explanation: 'EAC interpretation directly drives leadership actions. An honest, gradually rising EAC with a credible TCPI earns trust. An EAC that never moves despite poor CPI loses credibility. A hockey-stick EAC signals deferred honesty. An EAC crossing 125% of baseline triggers statutory Nunn-McCurdy notification requirements.',
            pairs: [
              { left: 'EAC rising gradually, TCPI ≤ 1.10', right: 'Monitor and request corrective action plan' },
              { left: 'Static EAC despite CPI < 0.90 for 6 months', right: 'Independent review; EAC credibility questioned' },
              { left: '"Hockey stick" jump in single period', right: 'DepSecDef review; potential program breach declared' },
              { left: 'EAC > 125% of original program baseline', right: 'Nunn-McCurdy Critical Breach — Congressional notification' },
            ],
          },
        ],
      },

      {
        id: 'finance-6',
        title: 'Contractor Cost Structure: Wrap Rates, Overhead & G&A',
        duration: '25 min',
        description: 'Understand how defense contractors build their prices — wrap rates, fringe, overhead, G&A, fee/profit, and how PMs use this knowledge to evaluate proposals and control costs.',
        keyTerms: [
          { term: 'Direct Cost', definition: 'A cost that can be specifically identified with a single final cost objective (a contract). Examples: direct labor hours, direct materials, travel directly supporting a contract.' },
          { term: 'Indirect Cost', definition: 'A cost that cannot be directly attributed to a single contract and must be allocated across multiple cost objectives. Examples: facility rent, HR, finance, IT infrastructure.' },
          { term: 'Fringe Benefits Rate', definition: 'The rate applied to direct labor to cover employee benefits — health insurance, retirement, FICA, paid leave. Typically 25-35% of direct labor.' },
          { term: 'Overhead Rate', definition: 'Indirect costs allocated to direct labor or direct costs within a specific organizational unit (division, department). Covers facilities, supervision, equipment, and indirect labor.' },
          { term: 'G&A Rate', definition: 'General and Administrative rate — company-wide indirect costs covering executive management, corporate HR, legal, finance, and business development. Applied to total cost input.' },
          { term: 'Wrap Rate', definition: 'The total billing rate for one hour of labor, combining direct labor + fringe + overhead + G&A + fee. The all-in cost of one hour of contractor work.' },
          { term: 'Fee / Profit', definition: 'The contractor\'s profit on a contract. On cost-type contracts, fee is negotiated separately; on fixed-price contracts, profit is embedded in the price. DFARS limits fee rates by contract type.' },
          { term: 'Cost Pool', definition: 'A grouping of indirect costs that are accumulated and then allocated using a common allocation base (e.g., a facilities cost pool allocated based on square footage).' },
          { term: 'Allocation Base', definition: 'The measure used to distribute indirect costs to contracts (e.g., direct labor hours, direct labor dollars, total cost input).' },
          { term: 'CAS', definition: 'Cost Accounting Standards — 19 standards (48 CFR 9900) governing how defense contractors accumulate, measure, and allocate costs. Required for contracts over $2M.' },
          { term: 'CASB', definition: 'Cost Accounting Standards Board — the federal board that promulgates CAS. Contractors must disclose their accounting practices in a Disclosure Statement (CASB DS-1).' },
          { term: 'Forward Pricing Rate Agreement', definition: 'FPRA — a negotiated agreement between the contractor and the government on indirect cost rates for use in forward pricing of proposals. Eliminates rate negotiation on every proposal.' },
        ],
        content: [
          {
            type: 'text',
            heading: 'Why PMs Must Understand Contractor Cost Structure',
            body: 'Most PMs focus entirely on total contract price — but the price is built from dozens of individual cost elements that a contractor controls. Understanding how a contractor builds their price gives you critical leverage: you can identify inflated overhead, challenge unrealistic rates, spot rate trends that predict cost growth, and negotiate better deals. More importantly, when DCAA audits a contractor\'s accounting system and finds non-compliant cost pools or unsupported rates, your contract is at risk. Knowing the structure means you can ask the right questions before signing.',
          },
          {
            type: 'text',
            heading: 'Direct Costs: What the Contractor Directly Charges Your Contract',
            body: 'Direct costs are the foundation of any cost estimate. Direct Labor — the hours your program pays for directly, billed at the contractor\'s direct labor rate for each labor category (e.g., Systems Engineer Level III: $75/hour direct). Direct Materials — hardware, software licenses, test equipment, and supplies that can be traced to your contract. Other Direct Costs (ODCs) — travel, subcontractor costs, consultant fees, special test equipment. Direct costs are identifiable, auditable, and must be allocable to your contract under CAS and FAR Part 31.',
          },
          {
            type: 'formula',
            heading: 'Building a Wrap Rate from the Ground Up',
            formula: 'DIRECT LABOR RATE (DLR): e.g., Systems Engineer Level III = $65.00/hr\n\n+ FRINGE BENEFITS (applied to DLR)\n  Fringe Rate Example: 32% of DLR\n  Fringe = $65.00 × 0.32 = $20.80\n  Labor + Fringe = $85.80/hr\n\n+ OVERHEAD (applied to Direct Labor + Fringe, or to DLR alone depending on contractor)\n  Overhead Rate Example: 45% of DLR\n  Overhead = $65.00 × 0.45 = $29.25\n  Subtotal = $85.80 + $29.25 = $115.05/hr\n\n+ G&A (applied to Total Cost Input = all direct + overhead costs)\n  G&A Rate Example: 12% of Total Cost Input\n  G&A = $115.05 × 0.12 = $13.81\n  Subtotal = $115.05 + $13.81 = $128.86/hr\n\n+ FEE / PROFIT (applied to Total Estimated Cost)\n  Fee Rate Example: 8% of Total Cost\n  Fee = $128.86 × 0.08 = $10.31\n  WRAP RATE = $128.86 + $10.31 = $139.17/hr\n\nINTERPRETATION: Every hour of SE-III time on your contract costs the government $139.17 — \n  even though the engineer earns $65/hr in direct labor.',
            explanation: 'This is why government contracts cost what they do. The $65/hr engineer actually costs $139/hr by the time fringe, overhead, G&A, and fee are applied. Understanding each layer allows PMs to challenge unreasonable rates — a G&A of 25% when industry average is 12-15% is a red flag worth questioning.',
          },
          {
            type: 'table',
            heading: 'Typical Rate Ranges by Contractor Size (Defense Industry)',
            headers: ['Rate Type', 'Small Business', 'Mid-Size Contractor', 'Large Prime (LM, RTNA, Boeing)'],
            rows: [
              ['Fringe Benefits', '28-35%', '30-38%', '32-42%'],
              ['Overhead (Engineering)', '40-70%', '50-80%', '60-100%'],
              ['G&A', '8-15%', '10-18%', '12-22%'],
              ['Total Wrap Rate (multiplier)', '2.5× – 3.0× DLR', '2.8× – 3.5× DLR', '3.0× – 4.0× DLR'],
              ['Typical Fee (Cost-Plus)', '7-10%', '7-10%', '7-12%'],
              ['Typical Fee (FFP)', '10-15% embedded', '10-18% embedded', '12-20% embedded'],
            ],
          },
          {
            type: 'text',
            heading: 'Overhead vs. G&A: The Critical Distinction',
            body: 'Overhead and G&A are both indirect costs, but they are structured very differently. Overhead is typically division or department-level — it covers the cost of running a specific business unit (facilities for that division, department manager salaries, indirect engineers, IT servers for that group). A company with three divisions will have three separate overhead pools, each with a different rate. G&A is company-wide — it covers the CEO\'s salary, corporate HR, corporate finance, corporate legal, and business development costs that benefit the entire enterprise. G&A is applied to Total Cost Input (direct + overhead) as the final layer before fee. Understanding this two-layer structure is critical for evaluating proposals.',
          },
          {
            type: 'callout',
            heading: 'Forward Pricing Rate Agreements (FPRAs) — What They Are and Why They Matter',
            body: 'An FPRA is a negotiated agreement between a large contractor and DCAA/ACO that establishes the indirect cost rates to be used for pricing future proposals for a set period (typically 1-2 years). Once an FPRA is in place, contractors must use those rates in all proposals — they cannot negotiate rates individually on each contract. For PMs, FPRAs mean two things: (1) you know what rates to expect from major contractors — they are public record in FPRA letters; (2) if a contractor\'s actual rates come in higher than their FPRA rates, the government may be owed money via an equitable adjustment.',
          },
          {
            type: 'formula',
            heading: 'Fee Limits Under DFARS — What Profit Is Actually Capped At',
            formula: 'DFARS 215.404-4 — Profit/Fee Limits by Contract Type:\n\nCost-Plus-Fixed-Fee (CPFF):\n  → Completion contracts: Max fee = 10% of estimated cost\n  → Term contracts: Max fee = 7% of estimated cost\n  → (FAR 15.404-4(c)(4))\n\nCost-Plus-Incentive-Fee (CPIF):\n  → Max total fee = 15% of target cost\n  → Min fee cannot be below 0% (contractor cannot owe money)\n\nCost-Plus-Award-Fee (CPAF):\n  → Base fee: typically 0-3%\n  → Award fee pool: typically 5-10% of estimated cost\n  → Combined max: varies by program; typically 10-15%\n\nFixed-Price contracts:\n  → No statutory profit cap — profit is embedded in price\n  → Government uses profit analysis (DFARS 215.404-4) to assess reasonableness\n  → Weighted Guidelines Method produces a target profit rate (7-15% typical)',
            explanation: 'Fee caps exist because cost-reimbursable contracts have no price ceiling — without caps, contractors could earn unlimited profit by simply spending more. For PMs on cost-plus contracts, understanding fee structure means you can verify the contractor is not manipulating cost estimates to maximize award fee under CPAF.',
          },
          {
            type: 'text',
            heading: 'The Weighted Guidelines Method — How Profit is Determined',
            body: 'For negotiated defense contracts, the government uses the Weighted Guidelines Method (DFARS 215.404-71) to determine a target profit/fee rate. The method scores five factors: (1) Performance Risk — how technically difficult and risky is the work? (2) Contract Type Risk — how much cost risk is the contractor bearing? (3) Facilities Capital Employed — how much has the contractor invested in its own equipment and facilities? (4) Cost Efficiency — is the contractor managing costs well? (5) Independent Development — has the contractor invested in technology beneficial to DoD? Each factor gets a weight and score, and the result is a target profit percentage. PMs should understand this because when contractors claim they need higher fee to cover "risk," the Weighted Guidelines method already accounts for that.',
          },
          {
            type: 'table',
            heading: 'Cost Accounting Standards (CAS) — What PMs Need to Know',
            headers: ['Standard', 'Subject', 'PM Relevance'],
            rows: [
              ['CAS 401', 'Consistency in estimating, accumulating, and reporting costs', 'Contractor must estimate costs the same way they accumulate them — prevents gaming'],
              ['CAS 402', 'Consistency in allocating costs — direct vs. indirect', 'Costs cannot be both direct on one contract and indirect on another'],
              ['CAS 403', 'Allocation of home office expenses', 'Controls how corporate G&A is allocated across business units'],
              ['CAS 404', 'Capitalization of tangible assets', 'Defines what gets capitalized vs. expensed — prevents inflating direct costs'],
              ['CAS 410', 'Allocation of business unit G&A', 'Governs the G&A rate structure and base'],
              ['CAS 418', 'Allocation of direct and indirect costs', 'Most frequently cited in DCAA audits — cost pools must be consistent'],
            ],
          },
          {
            type: 'tip',
            heading: 'Reading a Contractor\'s Incurred Cost Submission (ICS)',
            body: 'Every year, contractors on cost-reimbursable contracts must submit an Incurred Cost Submission (ICS) — also called an Incurred Cost Proposal or ICP — showing their actual indirect cost rates for the year. DCAA audits these submissions to verify that final rates match what was billed to contracts. If actual overhead ends up lower than the rates billed to your contract, the contractor owes the government a refund. If actual rates are higher, the government may owe the contractor more. As a PM, you should know your major contractors\' ICS filing status — delayed ICS submissions (often years late) are a compliance red flag.',
          },
          {
            type: 'warning',
            heading: 'Unallowable Costs — The FAR Part 31 Trap',
            body: 'FAR Part 31 defines which costs are allowable on government contracts. Certain costs are expressly unallowable — meaning the contractor CANNOT bill them to government contracts, even if they are legitimately incurred. Key unallowable costs: entertainment and gifts, lobbying and political contributions, alcoholic beverages, certain advertising costs, costs of organizing or reorganizing the contractor\'s business, excessive executive compensation above the statutory cap (currently ~$600K/year for the 5 highest-paid executives), fines and penalties. If DCAA discovers unallowable costs in an incurred cost audit, the contractor must reimburse the government. PMs should flag unusually high G&A rates, which may indicate unallowable costs improperly bundled into cost pools.',
          },
          {
          type: 'text' as const,
          level: 'intermediate' as const,
          heading: 'Auditing Contractor Indirect Rates During Performance',
          body: 'Mid-career PMs on cost-type contracts must understand that the rates billed on invoices are provisional — final rates are not established until DCAA audits and negotiates final billing rates, typically 2-3 years after the accounting period closes. This creates a reconciliation risk: if final rates are higher than provisional rates, the contractor gets a retroactive billing increase. Track your contractor\'s provisional vs. forward pricing rate agreements (FPRAs). When provisional rates diverge significantly from actuals, push for an FPRA update. PMs who ignore this find themselves in a final rate reconciliation dispute 3 years after contract closeout — when the contractor is trying to bill $2M in additional indirect costs that weren\'t budgeted.',
        },
        {
          type: 'callout' as const,
          level: 'advanced' as const,
          heading: 'Unallowable Costs, Direct Charging, and the DCAA Audit Trail',
          body: 'FAR Part 31 defines cost allowability — what contractors can bill to the government. Unallowable costs (entertainment, lobbying, certain IR&D that doesn\'t qualify, executive compensation above the cap) must be segregated and excluded from billings. DCAA\'s job is to verify this segregation. What senior PMs need to know: if DCAA finds unallowable costs billed to your contract, the contractor must repay them with interest — and the PM has an obligation to pursue collection. The more dangerous scenario is "direct charging" problems: a contractor billing costs directly to your contract that should be in indirect pools (inflating the direct cost base artificially). This is fraud when intentional. Look for anomalous direct labor charges — senior executives billed at 100% direct to a single contract, or subcontractor pass-through markups that exceed the prime\'s normal margins.',
        },
        ],
      quiz: [
          {
            id: 'q1',
            question: 'A contractor\'s Systems Engineer earns $70/hr direct labor. Fringe = 33%, Overhead = 55% of DLR, G&A = 13% of total cost input, Fee = 9%. What is the approximate wrap rate?',
            options: ['$70/hr', '$148/hr', '$168/hr', '$192/hr'],
            correct: 2,
            explanation: 'Step by step: DLR = $70. + Fringe (33%): $70 × 0.33 = $23.10 → $93.10. + Overhead (55% of DLR): $70 × 0.55 = $38.50 → $131.60. + G&A (13% of $131.60): $17.11 → $148.71. + Fee (9%): $13.38 → $162.09 ≈ $162/hr. Closest to $168/hr at these rounding conventions. The multiplier is approximately 2.4× DLR — typical for a mid-size contractor.',
          },
          {
            id: 'q2',
            question: 'Which cost element covers company-wide expenses like executive management, corporate legal, and enterprise IT — applied as the final indirect rate layer before fee?',
            options: ['Fringe Benefits', 'Overhead', 'G&A (General and Administrative)', 'Management Reserve'],
            correct: 2,
            explanation: 'G&A covers company-wide administrative costs that benefit the entire enterprise — not just a single division. It is applied to Total Cost Input (all direct + overhead costs) as the final indirect cost layer before fee. Overhead is division/department-level; G&A is corporate-level.',
          },
          {
            id: 'q3',
            question: 'Under FAR 15.404-4, the maximum fee on a Cost-Plus-Fixed-Fee (CPFF) completion contract is:',
            options: ['5% of estimated cost', '7% of estimated cost', '10% of estimated cost', '15% of estimated cost'],
            correct: 2,
            explanation: 'CPFF completion contracts are capped at 10% of estimated cost per FAR 15.404-4(c)(4)(i). CPFF term contracts are capped at 7%. These caps exist because on cost-reimbursable contracts, there is no upper limit on cost — unlimited fee on unlimited cost would remove all incentive for cost control.',
          },
          {
            id: 'q4',
            question: 'An FPRA (Forward Pricing Rate Agreement) benefits the government primarily by:',
            options: ['Allowing contractors to charge any rate they choose per contract', 'Establishing negotiated indirect rates applicable to all future proposals, eliminating per-contract rate negotiation', 'Capping profit at 10% on all contracts', 'Requiring DCAA audit of every individual proposal'],
            correct: 1,
            explanation: 'An FPRA establishes pre-negotiated indirect rates (overhead, G&A, fringe) that the contractor must use in all proposals for the agreement period. This saves significant negotiation time, provides rate predictability, and allows the government to evaluate proposals against known rates rather than contractor-asserted rates.',
          },
          {
            id: 'q5',
            question: 'Under CAS 402, a contractor discovers it has been classifying a particular engineer\'s time as "indirect" on commercial contracts but "direct" on government contracts. This is:',
            options: ['Acceptable as long as total costs are the same', 'A CAS 402 violation — costs must be treated consistently as direct or indirect across all contracts', 'Permitted since commercial contracts have different rules', 'Only a problem if DCAA identifies it'],
            correct: 1,
            explanation: 'CAS 402 requires consistent treatment of similar costs — a cost cannot be treated as direct on government contracts and indirect on commercial contracts (or vice versa). This is one of the most frequently cited CAS violations in DCAA audits. Inconsistent treatment allows contractors to maximize government billings by allocating their most expensive costs directly to government contracts.',
          },
          {
            id: 'q6',
            question: 'Which of the following is expressly UNALLOWABLE under FAR Part 31 and cannot be billed to government contracts?',
            options: ['Direct engineer labor on contract tasks', 'Fringe benefits for employees working on the contract', 'Entertainment costs and gifts', 'Facilities overhead for space used to perform the contract'],
            correct: 2,
            explanation: 'FAR 31.205-14 expressly identifies entertainment costs as unallowable. Other key unallowable costs include: lobbying (31.205-22), alcoholic beverages (31.205-51), advertising costs not related to recruitment or product sale (31.205-1), and excessive executive compensation above the statutory cap. When DCAA finds unallowable costs in indirect pools, the government is owed a credit adjustment.',
          },
          {
            id: 'q7',
            question: 'A contractor\'s wrap rate multiplier is 3.8× their direct labor rate. Compared to an industry average of 3.0×, what should a PM do?',
            options: ['Accept it since contractors set their own rates', 'Request an explanation and FPRA documentation; question overhead and G&A rates specifically', 'Immediately terminate the contract', 'Use the rate only if the contract is cost-plus'],
            correct: 1,
            explanation: 'A 3.8× multiplier is above typical industry range (2.5-3.5× for most defense contractors). The PM should request the FPRA letter or rate documentation, identify which pool (overhead or G&A) is driving the high rate, and challenge rates that are not supported by audited actuals. High rates may indicate excessive overhead, unallowable costs in pools, or the contractor\'s rates not being DCAA-audited.',
          },
          {
            id: 'q8',
            question: 'What is the purpose of a contractor\'s annual Incurred Cost Submission (ICS)?',
            options: ['To propose new labor categories for the upcoming year', 'To report actual indirect cost rates for the completed year, enabling reconciliation with billed rates', 'To submit a new FPRA request', 'To report earned value performance data'],
            correct: 1,
            explanation: 'The ICS (also called Incurred Cost Proposal) reports a contractor\'s actual indirect rates for the fiscal year, which are compared to the provisional or FPRA rates that were billed to contracts during the year. If actual rates were lower than billed, the contractor owes a credit. If higher, the government may owe additional costs on cost-reimbursable contracts. DCAA audits ICS submissions — delays of years are common and represent a significant financial risk to the government.',
          },
          {
            id: 'q9',
            question: 'The Weighted Guidelines Method (DFARS 215.404-71) is used to determine:',
            options: ['The period of availability of a specific appropriation type', 'A target profit/fee rate on negotiated defense contracts based on risk, contract type, and capital employed', 'The contractor\'s overhead rate pool structure', 'The maximum labor categories allowed in a proposal'],
            correct: 1,
            explanation: 'The Weighted Guidelines Method scores five factors (performance risk, contract type risk, facilities capital employed, cost efficiency, and independent R&D) to produce a target profit percentage. It ensures profit is commensurate with the risk and investment a contractor bears — higher risk contracts earn higher fee rates. Government negotiators use this analysis to ensure profit is fair but not excessive.',
          },
          {
            id: 'q10',
            question: 'Fringe benefits are applied to which cost base in a standard defense contractor cost buildup?',
            options: ['Total Contract Value', 'All indirect costs', 'Direct Labor Rate — fringe is a percentage of the employee\'s direct labor', 'G&A base only'],
            correct: 2,
            explanation: 'Fringe benefits (FICA, health insurance, retirement contributions, vacation/sick leave accrual, workers\' comp) are applied as a percentage of direct labor dollars. They represent the employer\'s cost of employee benefits above base salary. A fringe rate of 32% on a $70/hr DLR adds $22.40/hr, representing the employer\'s share of the employee\'s total compensation package.',
          },
          {
            id: 'q11',
            type: 'drag_order',
            question: 'Build a wrap rate from scratch — order these cost elements in the correct sequence of application:',
            options: [],
            correct: 0,
            explanation: 'Wrap rate builds bottom-up: Direct Labor is the base → Fringe is applied to DLR → Overhead is applied to direct labor (or labor+fringe depending on contractor structure) → G&A is applied to total cost input (all direct + overhead costs) → Fee is the final layer applied to total estimated cost. This sequence matches FAR Part 31 cost structure.',
            orderedItems: [
              'Direct Labor Rate (DLR) — base hourly rate for the labor category',
              'Fringe Benefits — applied to DLR (health, retirement, FICA, leave)',
              'Overhead — applied to direct labor within a business unit',
              'G&A — applied to Total Cost Input (all of the above)',
              'Fee / Profit — applied to total estimated cost as final layer',
            ],
          },
          {
            id: 'q12',
            type: 'drag_match',
            question: 'Match each indirect rate type to its correct description:',
            options: [],
            correct: 0,
            explanation: 'Understanding the structure: Fringe is individual-employee-level benefits. Overhead is division-level indirect cost. G&A is enterprise-level corporate cost. CAS ensures consistent accounting across all of these. FPRAs lock these rates in advance for government proposals.',
            pairs: [
              { left: 'Fringe Benefits', right: 'Health, retirement, FICA — % of direct labor' },
              { left: 'Overhead Rate', right: 'Division-level indirect costs: facilities, supervision, indirect labor' },
              { left: 'G&A Rate', right: 'Corporate-wide costs: executive mgmt, legal, finance — % of total cost input' },
              { left: 'FPRA', right: 'Pre-negotiated indirect rates used across all forward-priced proposals' },
            ],
          },
        ],
      },

      {
        id: 'finance-7',
        title: 'DCAA & DCMA: Your Two Most Important Oversight Partners',
        duration: '20 min',
        description: 'Understand the roles, authorities, and tools of DCAA and DCMA — and how to work with them effectively to protect your program and the taxpayer.',
        keyTerms: [
          { term: 'DCAA', definition: 'Defense Contract Audit Agency — the DoD agency responsible for auditing contractor accounting systems, cost proposals, and incurred cost submissions. Provides independent financial advice to contracting officers.' },
          { term: 'DCMA', definition: 'Defense Contract Management Agency — the DoD agency responsible for contract administration, quality assurance, and contractor performance oversight on major contracts. DCMA is the government\'s "eyes and ears" at contractor facilities.' },
          { term: 'ACO', definition: 'Administrative Contracting Officer — a DCMA contracting officer delegated authority to administer specific aspects of a contract (billing, consent to subcontract, property management).' },
          { term: 'QAR', definition: 'Quality Assurance Representative — a DCMA official who monitors contractor quality processes and product acceptance at the contractor\'s facility.' },
          { term: 'EVMS Compliance', definition: 'DCMA validates that contractor EVMS meets ANSI/EIA-748 criteria before government accepts it for IPMR reporting. A non-compliant EVMS is a major program risk.' },
          { term: 'Accounting System Adequacy', definition: 'DCAA determination that a contractor\'s accounting system properly identifies, accumulates, and reports costs in accordance with FAR Part 31 and CAS. Required before award of cost-reimbursable contracts.' },
          { term: 'Billing System', definition: 'The contractor\'s system for submitting invoices to the government. DCAA audits billing systems for accuracy and compliance.' },
          { term: 'Estimating System', definition: 'The contractor\'s system for preparing cost proposals. DCAA audits estimating systems to ensure proposed costs are reasonable and consistent with actuals.' },
          { term: 'CIPR', definition: 'Contractor Insurance and Pension Review — DCAA audit verifying that insurance and pension costs charged to government contracts are allowable and allocable.' },
          { term: 'Provisional Billing Rates', definition: 'Interim indirect rates approved by the ACO/DCAA for billing purposes while actual rates are being finalized in the ICS process.' },
        ],
        content: [
          {
            type: 'text',
            heading: 'Two Agencies, Two Missions — Both Critical to Your Program',
            body: 'Every major defense PM operates within a three-way oversight structure: the PCO (Procuring Contracting Officer) awarded the contract, DCMA administers it day-to-day, and DCAA audits the financial side. Many new PMs confuse DCAA and DCMA — they have different missions, different authorities, and different relationships with your program. Understanding what each can and cannot do determines whether you use them as effective oversight tools or accidentally create friction that slows your program down.',
          },
          {
            type: 'table',
            heading: 'DCAA vs. DCMA: Side-by-Side Comparison',
            headers: ['Attribute', 'DCAA', 'DCMA'],
            rows: [
              ['Full Name', 'Defense Contract Audit Agency', 'Defense Contract Management Agency'],
              ['Mission', 'Financial auditing — audit contractor accounting systems, cost proposals, and incurred costs', 'Contract administration — oversee contractor performance, quality, and schedule at contractor facilities'],
              ['Established', '1965 (Secretary of Defense directive)', '2000 (formerly Defense Contract Management Command)'],
              ['Workforce', '~4,900 civilian auditors', '~12,500 civilian and military personnel'],
              ['Key Output', 'Audit reports (favorable/qualified/adverse) to ACO/PCO', 'Contractor Performance Assessment Reports (CPARs), EVMS validation, consent to subcontract decisions'],
              ['Authority Over Contracts', 'None — DCAA advises; ACO/PCO decide', 'Yes — ACOs have direct contract administration authority'],
              ['Physical Location', 'At DCAA field offices (resident or visiting teams)', 'At contractor facilities (resident teams for major contractors)'],
              ['Relationship to PM', 'Independent — PM cannot direct DCAA work', 'Collaborative — PM works with ACO daily on contract administration'],
            ],
          },
          {
            type: 'text',
            heading: 'DCAA: What They Actually Audit',
            body: 'DCAA does not audit every contractor — it prioritizes its limited resources on the highest-risk contracts. The major audit types every PM should understand: (1) Pre-Award Surveys — before award of a cost-reimbursable contract, DCAA may audit the contractor\'s accounting system to confirm it meets FAR requirements. An "inadequate" accounting system can block contract award. (2) Incurred Cost Audits — after each fiscal year, DCAA audits the contractor\'s ICS to verify actual indirect rates and ensure only allowable costs were billed. These audits often take years to complete, creating significant cost uncertainty. (3) Forward Pricing Rate Audits — DCAA audits proposed indirect rates to support FPRA negotiations. (4) Truth in Negotiations Act (TINA) / Defective Pricing Audits — post-award audits to verify that cost or pricing data submitted before award was accurate, current, and complete.',
          },
          {
            type: 'callout',
            heading: 'The Accounting System Adequacy Finding — A PM\'s Red Flag',
            body: 'When DCAA finds a contractor\'s accounting system "inadequate," it is a program emergency. An inadequate finding means the system does not properly identify, accumulate, and segregate costs by contract — which means you cannot trust the costs being billed to your program. In extreme cases, the ACO may suspend contractor billing or require withholds (typically 5-10% of billings) until the system is corrected. If your contractor has an open inadequate accounting system finding, flag it to your PCO immediately and track the remediation plan.',
          },
          {
            type: 'formula',
            heading: 'DCAA Audit Universe — Major Audit Types',
            formula: 'PRE-AWARD:\n  → Accounting System Adequacy Survey (before cost-type contract award)\n  → Estimating System Survey (before >$50M proposals)\n  → Billing System Review (before >$50M contracts)\n\nONGOING:\n  → Provisional Billing Rate Review (quarterly/annually)\n  → Forward Pricing Rate Audits (supporting FPRA)\n  → Consent to Subcontract Reviews (for major subs)\n\nPOST-AWARD:\n  → Incurred Cost Submission (ICS) Audit (annual, often years delayed)\n  → TINA/Defective Pricing Audit (if >$2M cost or pricing data was required)\n  → Contractor Insurance & Pension Review (CIPR)\n  → Labor Timekeeping Reviews (direct/indirect labor allocations)',
            explanation: 'PMs should know which DCAA audits are open on their major contractors. Open, unresolved audits create financial exposure — the government may owe money (for underbilled rates) or be owed money (for overbilled rates or unallowable costs). DCAA maintains a public database of audit backlogs — multi-year ICS backlogs are common.',
          },
          {
            type: 'text',
            heading: 'DCMA: Your Government Representative at the Contractor\'s Facility',
            body: 'DCMA is the operational arm of government contract oversight. On major programs, DCMA assigns a resident Administrative Contracting Officer (ACO) and team directly to the contractor\'s facility. This team monitors schedule, quality, property management, and contract compliance on a daily basis. DCMA\'s ACO has the authority to: consent to or disapprove major subcontracts, accept or reject deliverables, issue cure notices, issue show cause letters before termination, and manage Government-Furnished Property (GFP). For PMs, the ACO is your proxy at the contractor — your most direct source of real-time performance intelligence.',
          },
          {
            type: 'table',
            heading: 'DCMA Key Functions and PM Interactions',
            headers: ['DCMA Function', 'What They Do', 'PM\'s Role'],
            rows: [
              ['EVMS Validation', 'Validates contractor EVMS meets ANSI/EIA-748 before government accepts it for reporting', 'PM coordinates with DCMA; without validation, IPMR data is not credible'],
              ['Contract Administration', 'ACO manages billing, modifications, property, subcontracts day-to-day', 'PM works with ACO on mod approvals, billing disputes, and performance issues'],
              ['Quality Assurance', 'QARs witness testing, inspect deliverables, maintain Product Acceptance', 'PM ensures QAR access; ACO signs final acceptance on deliverables'],
              ['Consent to Subcontract', 'ACO approves major subcontracts when required by contract clause', 'PM ensures subcontract consent is included in program schedule — delays cost time'],
              ['Cure Notice / Show Cause', 'ACO issues cure notice when contractor is at risk of default; show cause before termination', 'PM must be informed — these are escalation steps toward potential termination'],
              ['CPARS Entries', 'DCMA contributes to CPARs assessments on contractor performance', 'PM provides input; CPARS records follow contractor for 3 years in future source selections'],
            ],
          },
          {
            type: 'text',
            heading: 'DFARS Business Systems — The Six Systems DCMA and DCAA Watch',
            body: 'DFARS 252.242-7005 (Contractor Business Systems) identifies six contractor business systems that are subject to government review and withholding if found "significant deficiencies": (1) Accounting System (DCAA audits), (2) Estimating System (DCAA audits), (3) Earned Value Management System — EVMS (DCMA validates), (4) Purchasing System (DCMA reviews), (5) Material Management and Accounting System — MMAS (DCMA), (6) Property Management System (DCMA). When DCAA or DCMA finds a "significant deficiency" in any of these systems, the ACO can withhold 5% of contract billings (up to 10% total). As a PM, a withheld billing is cash flow risk for your contractor and a potential harbinger of deeper systemic problems.',
          },
          {
            type: 'warning',
            heading: 'Do Not Obstruct DCAA Access',
            body: 'DCAA auditors have the right to access contractor records, employees, and facilities under FAR 52.215-2 (Audit and Records — Negotiation). A contractor that limits, delays, or obstructs DCAA access is committing a serious FAR violation. Equally important: as a government PM, never pressure a contractor to limit DCAA access to manage a schedule or cost outcome. This constitutes improper interference with an audit — a federal law violation with serious career and legal consequences. If a contractor claims they cannot provide records to DCAA, contact your PCO and legal office immediately.',
          },
          {
            type: 'tip',
            heading: 'Working With Your ACO — Practical Tips',
            body: 'The most effective PMs build a strong relationship with their DCMA ACO. Best practices: (1) Include the ACO in your monthly program reviews — they are your government ally at the contractor. (2) Read every DCMA report your ACO produces — they often contain early warnings before IPMR data shows problems. (3) Ensure your contract includes appropriate DCMA access clauses (FAR 52.246-2, 52.242-4). (4) Do not go around your ACO to address contractor performance issues — work through them. (5) For CPARS, get the ACO\'s performance input before finalizing your assessment — their daily visibility is invaluable.',
          },
          {
          type: 'text' as const,
          level: 'intermediate' as const,
          heading: 'Working the DCAA/DCMA Relationship to Your Advantage',
          body: 'Mid-career PMs who treat DCAA and DCMA as adversaries are leaving oversight resources on the table. Both agencies work for the government — their findings protect your program, not the contractor. Establish a quarterly touchpoint with your ACO and DCAA auditor: share your program priorities, the highest-risk WBS elements, and any contractor behaviors that concern you. DCAA can target its audit resources to your hot spots if you tell them where to look. Request a floor check audit when your contractor reports a staffing surge that isn\'t reflected in performance. Ask DCMA to review the contractor\'s subcontract management practices when you see a subcontractor performance problem the prime isn\'t addressing. These agencies have authorities you don\'t — use them.',
        },
        {
          type: 'callout' as const,
          level: 'advanced' as const,
          heading: 'Withholding Payments and Disallowing Costs — When and How',
          body: 'Senior PMs have mechanisms to financially pressure non-performing contractors that junior PMs rarely use. For cost-type contracts, DCAA can recommend disapproval of incurred cost submissions — triggering a withhold of up to 5% of billed costs pending resolution. For fixed-price contracts with performance milestones, you can withhold milestone payments when deliverables fail to meet contract requirements. The key: document the basis for the withhold in writing, citing specific contract clauses (FAR 52.232-7 for cost; the specific milestone clause for FP). Contractors will push back aggressively and threaten REAs. That\'s acceptable. What\'s not acceptable: using withholds as negotiating leverage for contract modifications (that\'s coercion). Withholds must be based on legitimate contract performance deficiencies, not as a tool to extract concessions.',
        },
        ],
      quiz: [
          {
            id: 'q1',
            question: 'What is the primary mission of DCAA?',
            options: ['Administer contracts and oversee contractor performance at contractor facilities', 'Provide independent financial auditing of contractor accounting systems and cost proposals', 'Award defense contracts and negotiate contract modifications', 'Certify contractor EVMS compliance with ANSI/EIA-748'],
            correct: 1,
            explanation: 'DCAA\'s mission is financial auditing — it audits contractor accounting systems, cost proposals, and incurred cost submissions to protect the government\'s financial interests. DCAA does not administer contracts (that is DCMA\'s ACO) and does not have contract award authority (that is the PCO). EVMS certification is DCMA\'s function.',
          },
          {
            id: 'q2',
            question: 'An Administrative Contracting Officer (ACO) from DCMA has the authority to:',
            options: ['Award new contracts independently', 'Withhold contractor billings for EVMS deficiencies, consent to subcontracts, and accept deliverables', 'Conduct financial audits of contractor cost proposals', 'Authorize Nunn-McCurdy breach notifications'],
            correct: 1,
            explanation: 'The ACO has direct contract administration authority — including consent to subcontract decisions, GFP management, billing approval, cure notices, and deliverable acceptance. The ACO can withhold up to 5% of billings (10% maximum total) when contractor business systems have significant deficiencies. DCAA conducts audits (separate from ACO), and PCOs award contracts.',
          },
          {
            id: 'q3',
            question: 'A DCAA "inadequate" accounting system finding on your prime contractor most immediately means:',
            options: ['The contract must be terminated for default', 'Cost billings may not be trustworthy; the ACO may withhold a portion of billings until the system is corrected', 'The contractor must rebid the contract', 'DCMA takes over all contractor financial management'],
            correct: 1,
            explanation: 'An inadequate accounting system finding means DCAA cannot rely on the contractor\'s cost data — which means billed costs may not accurately reflect what was charged to your contract. The ACO typically implements a billing withhold (5% to 10%) pending remediation. The PM should elevate this to the PCO and monitor the corrective action plan closely.',
          },
          {
            id: 'q4',
            question: 'Which of the six DFARS Business Systems does DCMA validate (not DCAA)?',
            options: ['Accounting System', 'Estimating System', 'Earned Value Management System (EVMS)', 'Billing System'],
            correct: 2,
            explanation: 'DCMA is responsible for EVMS validation — confirming the contractor\'s EVM system meets ANSI/EIA-748 criteria. DCAA audits the Accounting System, Estimating System, and Billing System. The split reflects each agency\'s expertise: DCMA understands program performance systems; DCAA understands financial accounting systems.',
          },
          {
            id: 'q5',
            question: 'Under DFARS 252.242-7005, when DCAA or DCMA finds a "significant deficiency" in a contractor business system, the maximum billing withhold is:',
            options: ['2%', '5%', '10%', '25%'],
            correct: 2,
            explanation: 'DFARS 252.242-7005 allows withholds of 5% per deficient system, up to a maximum of 10% total across all systems. These withholds are intended to incentivize rapid system correction while preserving contractor cash flow to the extent possible. Withholds are lifted when the ACO approves a corrective action plan or confirms the deficiency has been resolved.',
          },
          {
            id: 'q6',
            question: 'An Incurred Cost Submission (ICS) is filed by contractors to:',
            options: ['Propose rates for the upcoming fiscal year', 'Report actual indirect cost rates for a completed fiscal year, enabling reconciliation with billed rates', 'Submit progress payments for completed milestones', 'Certify EVMS compliance to DCMA'],
            correct: 1,
            explanation: 'The ICS (filed within 6 months after fiscal year end) reports actual indirect rates for the year. DCAA audits these against the provisional rates billed to government contracts. If the contractor over-billed (provisional rates higher than actuals), the government gets a credit. If under-billed, the government owes additional cost on cost-reimbursable contracts. ICS audit backlogs of 5-10 years create significant financial uncertainty.',
          },
          {
            id: 'q7',
            question: 'A DCMA Quality Assurance Representative (QAR) at a contractor facility primarily performs:',
            options: ['Financial audits of contractor billing records', 'Oversight of contractor quality processes, product inspections, and delivery acceptance at contractor facilities', 'Negotiation of contract modifications', 'Performance of independent cost estimates'],
            correct: 1,
            explanation: 'QARs are DCMA\'s quality oversight representatives resident at contractor facilities. They witness testing, inspect deliverables, monitor quality management systems, and sign off on acceptance. Their daily presence gives the government real-time visibility into product quality — long before a PM receives formal reports or delivery.',
          },
          {
            id: 'q8',
            question: 'The Truth in Negotiations Act (TINA) / Defective Pricing audit by DCAA is triggered when:',
            options: ['Any contract over $250K is awarded', 'A contract over $2M required the submission of certified cost or pricing data before award', 'A contractor files an ICS late', 'A Nunn-McCurdy breach is declared'],
            correct: 1,
            explanation: 'TINA (codified as 41 U.S.C. § 3502) requires contractors to submit certified cost or pricing data for contracts exceeding $2M (where competition and other exceptions do not apply). Post-award, DCAA may audit whether that data was accurate, current, and complete at the time of submission. If data was defective (incorrect or outdated), the government is entitled to a price reduction equal to the amount overpaid.',
          },
          {
            id: 'q9',
            question: 'Which statement about DCAA access to contractor records is correct?',
            options: ['Contractors may limit DCAA access to protect proprietary information', 'DCAA has the right under FAR 52.215-2 to access all relevant records; obstructing this access is a FAR violation', 'DCAA access requires a court order for private contractor records', 'DCAA can only access records voluntarily provided by the contractor'],
            correct: 1,
            explanation: 'FAR clause 52.215-2 (Audit and Records — Negotiation) — included in negotiated contracts — gives the government (and DCAA) the right to examine and audit all records related to the contract. Contractor obstruction of DCAA access is a serious FAR violation. PMs must ensure contractors understand their audit access obligations and escalate access disputes immediately to the PCO and legal.',
          },
          {
            id: 'q10',
            question: 'In the context of DFARS Business Systems, a "Purchasing System" review by DCMA focuses on:',
            options: ['The contractor\'s system for purchasing commercial supplies', 'The contractor\'s system for acquiring subcontracted work and materials — ensuring competition, cost analysis, and flowdown of contract requirements', 'The contractor\'s enterprise resource planning (ERP) system', 'The contractor\'s EVMS purchasing module'],
            correct: 1,
            explanation: 'DCMA\'s Purchasing System review examines how the contractor manages its supply chain — whether it properly competed subcontracts, performed cost/price analysis on non-competitive subs, and flowed down required government contract clauses to subcontractors. Poor purchasing system controls can result in overbilled subcontract costs, undisclosed subcontractor teaming, and failure to meet small business subcontracting goals.',
          },
          {
            id: 'q11',
            type: 'drag_match',
            question: 'Match each oversight function to the correct agency:',
            options: [],
            correct: 0,
            explanation: 'DCAA is exclusively financial auditing — accounting systems, cost proposals, and incurred costs. DCMA is contract administration and performance oversight — ACO authority, EVMS validation, quality oversight, and CPARS. Neither agency awards contracts (that is the PCO) or certifies programs (that is the SAE/MDA).',
            pairs: [
              { left: 'Accounting system adequacy audit', right: 'DCAA' },
              { left: 'EVMS validation and compliance', right: 'DCMA' },
              { left: 'Incurred Cost Submission audit', right: 'DCAA' },
              { left: 'Deliverable acceptance and quality oversight', right: 'DCMA' },
            ],
          },
          {
            id: 'q12',
            type: 'drag_order',
            question: 'Order these DCAA audit activities from the earliest in the contract lifecycle to the latest:',
            options: [],
            correct: 0,
            explanation: 'Pre-award surveys happen before contract award. Forward pricing rate audits support proposal pricing before or at award. Provisional billing rate reviews happen during contract performance. Incurred cost submission audits happen after each fiscal year ends. TINA/defective pricing audits can happen anytime post-award, but are often triggered years after award.',
            orderedItems: [
              'Pre-Award Accounting System Survey (before cost-type contract award)',
              'Forward Pricing Rate Audit (supporting FPRA before/at award)',
              'Provisional Billing Rate Review (during contract performance)',
              'Incurred Cost Submission (ICS) Audit (after each fiscal year end)',
            ],
          },
        ],
      }
    ],
    assessment: [
      {
        id: 'fa1',
        question: 'Which appropriation type funds the development and testing of a new weapons system before production begins?',
        options: ['Operations & Maintenance (O&M)', 'Procurement', 'Research, Development, Test & Evaluation (RDT&E)', 'Military Construction (MILCON)'],
        correct: 2,
        explanation: 'RDT&E funds the research, development, test, and evaluation activities before a system enters production. It is a two-year appropriation and cannot be used for procurement of production-representative articles beyond a limited number of test articles.'
      },
      {
        id: 'fa2',
        question: 'Earned Value Management (EVM): if your program has a CPI of 0.85, what does this mean?',
        options: ['You are spending $0.85 for every $1.00 of planned work — ahead of budget', 'You are getting $0.85 of work for every $1.00 spent — over budget', 'Your schedule is 15% behind plan', 'The contract has a 15% profit fee'],
        correct: 1,
        explanation: 'CPI (Cost Performance Index) = EV / AC. A CPI of 0.85 means you are only getting 85 cents of earned value for every dollar spent — you are over budget. A CPI below 1.0 is a cost overrun indicator.'
      },
      {
        id: 'fa3',
        question: 'The PPBE cycle\'s "Programming" phase produces which key document?',
        options: ['Program Objective Memorandum (POM)', 'President\'s Budget (PB)', 'Future Years Defense Program (FYDP)', 'Both A and C — the POM feeds into the FYDP'],
        correct: 3,
        explanation: 'During Programming, each Military Department submits a POM to OSD. The approved programs are then reflected in the FYDP — the official 5-year financial plan. The POM IS the programming document; the FYDP is the output.'
      },
      {
        id: 'fa4',
        question: 'An Estimate at Completion (EAC) calculated as BAC / CPI represents which assumption?',
        options: ['All remaining work will be completed at the budgeted rate', 'Future work will continue at the same cost efficiency as work completed to date', 'A specific re-estimate of remaining work was performed', 'The contract will be terminated for convenience'],
        correct: 1,
        explanation: 'EAC = BAC / CPI assumes future cost performance will mirror past cost performance. It is the most common EAC method used by DoD and tends to be the most accurate on programs with stable performance trends.'
      },
      {
        id: 'fa5',
        question: 'O&M (Operations & Maintenance) funding expires after how long?',
        options: ['1 year', '2 years', '3 years', '5 years'],
        correct: 0,
        explanation: 'O&M is a one-year appropriation — it must be obligated within the fiscal year it is appropriated. Using it after expiration (expired funds) or for the wrong purpose violates appropriations law and can trigger an Anti-Deficiency Act (ADA) violation.'
      },
      {
        id: 'fa6',
        question: 'Which EVM metric directly measures schedule efficiency?',
        options: ['CPI (Cost Performance Index)', 'SPI (Schedule Performance Index)', 'TCPI (To-Complete Performance Index)', 'VAC (Variance at Completion)'],
        correct: 1,
        explanation: 'SPI = EV / PV. An SPI below 1.0 means you have accomplished less work than planned — you are behind schedule. Note: EVM-based SPI is a dollar-weighted measure, not a time-based one. SPI converges to 1.0 at program completion regardless of lateness.'
      },
      {
        id: 'fa7',
        question: 'A program manager discovers that O&M funds were used to buy a capital asset worth $500K. This is most likely a violation of:',
        options: ['The Competition in Contracting Act', 'The Bona Fide Needs Rule', 'The Purpose Statute (31 U.S.C. § 1301)', 'The Antideficiency Act'],
        correct: 2,
        explanation: 'The Purpose Statute requires that appropriations be used only for the purposes for which they were appropriated. Buying capital assets with O&M funds violates this statute — capital equipment should be funded with Procurement or RDT&E depending on the item.'
      },
      {
        id: 'fa8',
        question: 'TCPI (To-Complete Performance Index) is used to determine:',
        options: ['How efficiently the program has spent money to date', 'The cost efficiency required on remaining work to meet a target (BAC or EAC)', 'Whether the current contract type is appropriate', 'The final profit margin the contractor will earn'],
        correct: 1,
        explanation: 'TCPI = (BAC - EV) / (BAC - AC) when calculated against BAC. A TCPI above 1.0 means remaining work must be performed more efficiently than past work — this is a warning sign. A TCPI above 1.1 is considered essentially unachievable without a re-baseline.'
      },
    ],
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
          },
          {
          type: 'text' as const,
          level: 'intermediate' as const,
          heading: 'Contract Type Strategy for Mid-Career PMs',
          body: 'Contract type selection is one of the most consequential decisions a PM makes, and it\'s made during acquisition planning — before the contractor is even selected. Mid-career PMs must think beyond risk allocation (cost-type = government bears risk; fixed-price = contractor bears risk) to incentive design. A CPIF with a 80/20 share ratio incentivizes cost control; a 50/50 ratio gives the contractor less motivation to reduce costs since they keep more savings. For schedule incentives: use CPIF-CPAF combos where the fixed-fee portion covers profit at plan, the incentive fee rewards cost performance, and the award fee rewards schedule and technical performance. Complex programs often have multiple CLINs with different contract types — a development CLIN at CPFF and a production option at FFP. Design the structure so each CLIN type matches the risk profile of that work.',
        },
        {
          type: 'callout' as const,
          level: 'advanced' as const,
          heading: 'Undefinitized Contract Actions (UCAs): The Most Dangerous Contract Tool',
          body: 'UCAs (contracts or modifications executed before price is agreed) are authorized by FAR 16.603 and DFARS 217.74, but they are the source of some of the worst cost outcomes in DoD acquisition. DFARS requires definitization within 180 days or 40% of not-to-exceed value obligated — whichever comes first. In practice, programs routinely miss these deadlines, and definitization happens after the contractor has incurred most costs, eliminating negotiating leverage. The contractor who knows you MUST definitize has no incentive to reduce costs during definitization. Senior PMs minimize UCAs, use them only when true urgency justifies starting before price is agreed, and definitize aggressively — before the contractor has spent their way into a position of strength.',
        },
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
          },
          {
          type: 'text' as const,
          level: 'intermediate' as const,
          heading: 'Shaping the Solicitation: What Mid-Career PMs Can Control',
          body: 'By the time an RFP is released, the source selection outcome is largely determined by the evaluation criteria. Mid-career PMs who engage early in PWS/SOW development and Section M criteria weighting have the most influence. Push for evaluation factors that discriminate on the qualities that matter: management approach (how does the contractor plan to staff and manage the program?), cost realism (does their estimate reflect what the work actually costs?), and relevant past performance (not just any past performance). Weight price lower on high-complexity development work — the cheapest proposal is rarely the best value. The most common mistake: writing evaluation criteria so broad they discriminate on nothing, leading to a selection driven entirely by price.',
        },
        {
          type: 'callout' as const,
          level: 'advanced' as const,
          heading: 'Protest-Proofing Your Source Selection',
          body: 'GAO sustains about 15-20% of bid protests it reviews. Most sustained protests result not from wrong decisions, but from inadequate documentation of correct decisions. Senior PMs preparing for a source selection must ensure: (1) the SSDD documents the SSA\'s independent judgment — not just a recitation of SSAC recommendations; (2) every strength and weakness is documented with specific proposal references; (3) the best-value tradeoff explicitly states why higher price is (or is not) worth better technical factors; (4) all offerors in the competitive range received equal treatment during discussions. The most protest-prone decision is the competitive range determination — excluding an offeror requires thorough documentation of why their proposal has no realistic chance of award. Assume every decision will be reviewed by a GAO attorney.',
        },
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
          },
          {
          type: 'text' as const,
          level: 'intermediate' as const,
          heading: 'COR Oversight of High-Risk Performance Areas',
          body: 'Mid-career PMs must direct their COR\'s oversight efforts to the highest-risk contract areas — not just routine deliverable acceptance. Risk areas that warrant enhanced COR attention: (1) subcontractor performance (prime contractors often absorb subcontractor failures rather than escalating to the government, masking systemic problems); (2) key personnel substitutions (contractors routinely propose senior experts who disappear post-award — CORs must verify key personnel presence); (3) Government-Furnished Equipment (GFE) receipt and accountability; and (4) cybersecurity compliance under DFARS 252.204-7012. A COR who only reviews deliverables is missing 80% of performance risk. Build a COR surveillance plan that maps oversight activities to contract risk, not just to deliverable schedules.',
        },
        {
          type: 'callout' as const,
          level: 'advanced' as const,
          heading: 'Cure Notices, Show Cause, and Termination for Default: The Escalation Ladder',
          body: 'Senior PMs have a contract escalation ladder they must understand thoroughly. Cure Notice (FAR 49.607): when a contractor is in danger of default, the CO issues a cure notice giving typically 10 days to cure the condition. Show Cause Notice: when default appears imminent, requires contractor to explain why the contract should not be terminated. Termination for Default (T4D): the nuclear option — the government terminates, the contractor loses all rights to claim for termination costs, and the government can reprocure at the contractor\'s expense. T4D creates its own risks: contractors routinely convert T4D to Termination for Convenience through litigation by arguing the default was government-caused (weather, GFE delays, government-directed changes). Document government actions meticulously throughout performance — the paper trail determines whether T4D survives a challenge.',
        },
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
          },
          {
          type: 'text' as const,
          level: 'intermediate' as const,
          heading: 'IDIQ Management: Ceiling vs. Scope vs. Competition',
          body: 'Mid-career PMs using IDIQs and GWACs must navigate three overlapping constraints: (1) the IDIQ ceiling — you cannot exceed the maximum order value without a modification, but you can order below the minimum; (2) scope limitations — task orders must be within the IDIQ\'s scope (ordering outside scope violates CICA and creates protest risk); (3) competition requirements — most IDIQs require fair opportunity among all awardees for task orders above $3,500 (DARS 16.505). The most common mid-career mistake: treating an IDIQ as a preferred vehicle even when better-suited vehicles exist, or placing task orders that are technically "within scope" but stretch the scope definition to the breaking point. Contractors monitor IDIQ usage patterns and will protest if they believe scope is being stretched to steer work.',
        },
        {
          type: 'callout' as const,
          level: 'advanced' as const,
          heading: 'Bridge Contracts and Option Exercise Discipline',
          body: 'Two of the most common contracting failures senior PMs face: bridge contracts and missed option windows. Bridge contracts (short-term extensions to maintain continuity between contracts) are legal but signal poor acquisition planning, attract GAO scrutiny, and often pay above-market rates because competition is waived. The bridge becomes a habit — some programs have been on "bridge" for 5+ years, paying a sole-source premium indefinitely. Option exercise discipline: options must be exercised before expiration — missed windows forfeit the option and require a new competition. With 12-24 month options, build a calendar trigger 90 days before each option expiration. The J&A required for a bridge after a missed option is a career embarrassment that documents your planning failure for the record.',
        },
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
          },
          {
          type: 'text' as const,
          level: 'intermediate' as const,
          heading: 'GSA OASIS+ and FEDSIM: Navigating the Competitive Order Process',
          body: 'Mid-career PMs using OASIS+ must understand that the task order competition is where outcomes are determined — not at the MAC vehicle level. For orders above $10M, FEDSIM (the GSA competition office) conducts the competition on your behalf. The government PM\'s role: write a well-scoped PWS, establish meaningful evaluation criteria, and review the price analysis. Common pitfalls: (1) PWS written so broadly that every OASIS+ contractor can qualify, leading to a lowest-price competition; (2) past performance evaluation relying on contractor-provided references that are selectively positive; (3) underestimating transition risk when switching from an incumbent. Build transition requirements directly into the PWS — require a 60-day joint transition with the incumbent, with knowledge transfer milestones and penalties for transition failures.',
        },
        {
          type: 'callout' as const,
          level: 'advanced' as const,
          heading: 'MAC Vehicle Strategy: When to Use Which and Protest Risk Management',
          body: 'Senior acquisition professionals understand that MAC vehicle selection is itself a strategic decision. OASIS+ for complex professional services; ALLIANT 3 for IT services; SeaPort NxG for Navy; CIO-SP4 for HHS/civilian. The wrong vehicle creates protest risk: using a vehicle whose scope doesn\'t cover your requirement, or using a sole-source exception under a MAC vehicle when fair opportunity competition was required. The most legally dangerous pattern: steering task orders to preferred contractors by writing evaluation criteria tailored to a specific firm\'s past performance or unique capabilities. Experienced protesters know how to document this, and GAO has sustained numerous protests on exactly these grounds. Run your task order strategy through your legal team before release.',
        },
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
,
{
        id: 'contracts-6',
        title: 'Modifications, REAs & Claims: When Contracts Change',
        duration: '22 min',
        description: 'Master contract modifications, constructive changes, Requests for Equitable Adjustment, and the claims process — the most contentious and costly aspects of contract administration.',
        keyTerms: [
          { term: 'Bilateral Modification', definition: 'A contract change signed by both the contractor and the contracting officer. Used for definitized changes, price adjustments, and scope changes both parties agree to.' },
          { term: 'Unilateral Modification', definition: 'A contract change signed only by the contracting officer, using a contract authority clause (e.g., Changes clause, stop-work order, exercise of option). Contractor may disagree but must perform.' },
          { term: 'Changes Clause', definition: 'FAR 52.243-1 through 52.243-4 — authorizes the CO to direct changes within the general scope of the contract. Contractor must perform the change; has right to an equitable adjustment.' },
          { term: 'Constructive Change', definition: 'A change that is not formally directed but results from government action or inaction that effectively changes the contractor\'s work. Examples: defective specifications, government-caused delays, over-inspection.' },
          { term: 'REA', definition: 'Request for Equitable Adjustment — a contractor\'s formal request for a contract price or schedule adjustment due to a government-directed or constructive change. Precursor to a claim.' },
          { term: 'Claim', definition: 'A written demand by a contractor to the CO for payment of a specific sum, adjustment to contract terms, or other relief — subject to the Contract Disputes Act. Claims over $100K must be certified.' },
          { term: 'Definitization', definition: 'The process of negotiating and finalizing the price and terms of an undefinitized contract action (UCA) — converting a letter contract or other interim vehicle to a fully priced contract.' },
          { term: 'UCA', definition: 'Undefinitized Contract Action — a contract where work begins before price is agreed. Risky for government — contractor has little incentive to control costs before definitization.' },
          { term: 'Contract Disputes Act', definition: '41 U.S.C. § 7101 et seq. — establishes the process for resolving government contract disputes, including CO Final Decisions, ASBCA appeals, and Court of Federal Claims.' },
          { term: 'ASBCA', definition: 'Armed Services Board of Contract Appeals — administrative tribunal that hears contractor appeals of Contracting Officer Final Decisions on contract disputes.' },
        ],
        content: [
          {
            type: 'text',
            heading: 'Why Contract Changes Are Every PM\'s Biggest Financial Risk',
            body: 'The initial contract price is a starting point — not the final cost. On complex defense programs, contract modifications routinely add 20-50% to the original contract value. Every undefinitized UCA, every government-caused delay, every specification change, every constructive change creates entitlement for the contractor to more money. PMs who do not understand modification authority, REA management, and claims risk losing budget discipline entirely. The contractors\' contracts and claims departments are professional — PMs must be equally sophisticated.',
          },
          {
            type: 'table',
            heading: 'Types of Contract Modifications — Know the Difference',
            headers: ['Type', 'Who Signs', 'Authority', 'Common Use', 'Key Risk'],
            rows: [
              ['Bilateral Mod (SF30)', 'CO + Contractor', 'Mutual agreement', 'Definitize changes; price supplements; scope adjustments', 'Scope creep if poorly scoped; waiver of claims if "accord & satisfaction" language added'],
              ['Unilateral Mod — Change Order', 'CO only', 'Changes Clause (FAR 52.243-1)', 'Direct contractor to change work; price to be negotiated after', 'Contractor has 30 days to submit REA; undefinitized cost risk grows over time'],
              ['Unilateral Mod — Admin', 'CO only', 'Administrative necessity', 'Correct errors, change COR, update addresses, issue/modify options', 'Low risk if truly administrative; never use to sneak in scope changes'],
              ['Letter Contract / UCA', 'CO + Contractor', 'FAR 16.603 / DFARS 217.74', 'Begin urgent work before price is agreed; requires definitization schedule', 'Highest risk — contractor bills costs with limited incentive to control; DFARS requires definitization within 180 days'],
            ],
          },
          {
            type: 'text',
            heading: 'The Changes Clause — Your Most Important Tool and Risk',
            body: 'The Changes clause (FAR 52.243-1 for fixed-price supply, 52.243-2 for cost-reimbursable, etc.) is one of the most powerful tools in government contracting. It allows the CO to unilaterally direct changes to the contract\'s technical requirements, delivery schedule, place of performance, or other specified areas — without the contractor\'s consent. The contractor must perform. But the Changes clause also creates the contractor\'s entitlement to an equitable adjustment for any change that increases cost or time. The PM must ensure every directed change is formally documented — verbal direction to "just go do it" is a constructive change waiting to happen.',
          },
          {
            type: 'callout',
            heading: 'Constructive Changes — The Silent Budget Killer',
            body: 'A constructive change is not a formal directive — it is a government action or inaction that effectively changes the contractor\'s work without formal paperwork. Common examples: Government-issued specifications that turn out to be defective (requiring rework); CO over-inspection that goes beyond contract standards; Government delay in furnishing data, GFE, or approvals; Government interference with contractor methods of performance; Informal technical direction from a COR or Government engineer that exceeds their authority. The contractor can pursue an REA or claim for a constructive change years after the work was performed. The best defense is meticulous daily documentation of all government-contractor interactions.',
          },
          {
            type: 'formula',
            heading: 'The REA Process — Timeline and Requirements',
            formula: 'TRIGGER: Government directs change (formal or constructive)\n\nSTEP 1: Contractor submits REA\n  → Must include: Factual basis (what changed), legal entitlement (what clause), quantum (how much $)\n  → No specific time limit — but best practice is 30-60 days after the triggering event\n  → Informal REAs: "We think we\'re entitled" without full cost detail\n  → Formal REAs: Full cost proposal with certified cost/pricing data if >$2M\n\nSTEP 2: Government review\n  → ACO/CO reviews entitlement and quantum\n  → DCAA may audit the REA cost proposal if >$2M\n  → Government requests additional information as needed\n\nSTEP 3: Negotiate bilateral modification\n  → Both parties agree on price and schedule adjustment\n  → Signed bilateral mod definitizes the change\n  → IDEAL OUTCOME: Bilateral mod settles the REA; no claim necessary\n\nIF NEGOTIATIONS FAIL → REA converts to Claim:\n  → Contractor certifies the claim (if >$100K)\n  → CO issues Contracting Officer Final Decision (COFD) within 60 days\n  → Contractor may appeal: ASBCA (administrative) or Court of Federal Claims (judicial)\n  → Interest runs from date of claim submission at Renegotiation Act rate',
            explanation: 'The earlier you can resolve an REA via bilateral modification, the better. Once an REA becomes a claim and enters dispute resolution, costs escalate for both sides and relationships deteriorate. PMs should push for rapid, fair REA resolution — a contractor that knows its REAs will be resolved promptly is less likely to inflate future REAs.',
          },
          {
            type: 'text',
            heading: 'Undefinitized Contract Actions (UCAs) — The Highest-Risk Modification',
            body: 'A UCA (also called a letter contract or undefinitized change order) authorizes a contractor to begin work before the price is agreed. UCAs are necessary for urgent national security situations — but they create serious cost risk. A contractor performing under a UCA has no price ceiling and a weak incentive to control costs: they bill actual costs and know the government will pay them regardless of final negotiated price. DFARS 217.7404 requires definitization within 180 days of initial performance. In practice, many UCAs run for years undefinitized. For PMs, every open UCA is a financial exposure that should be tracked and closed as quickly as possible.',
          },
          {
            type: 'table',
            heading: 'Cardinal Change Doctrine — When a Change Becomes a Breach',
            headers: ['Concept', 'Definition', 'Example', 'Consequence'],
            rows: [
              ['Within-Scope Change', 'Change is within the general scope of the original contract — CO can direct it unilaterally', 'Changing radar frequency range on a radar development contract', 'Contractor must perform; entitled to equitable adjustment'],
              ['Cardinal Change', 'Change so significant it falls outside the general scope — essentially a new contract requirement', 'Changing a radar development contract to also develop a missile guidance system', 'Cannot be directed unilaterally; must be competed separately or bilateral agreement required'],
              ['Change vs. Breach', 'An unauthorized direction that constitutes a cardinal change is a government breach — contractor can terminate for cause', 'CO directs contractor to provide services not contemplated anywhere in the original SOW', 'Contractor entitled to settlement as if for termination for convenience'],
            ],
          },
          {
            type: 'tip',
            heading: 'The PM\'s Best Defense: An Active Change Control Board',
            body: 'Every major program should have a formal Change Control Board (CCB) that reviews, approves, and documents every technical, schedule, or contract change before it is executed. The CCB records: what changed, why, who authorized it, and the estimated cost/schedule impact. Good CCB discipline prevents constructive changes (changes that happen informally), gives the PM visibility into cumulative scope growth, and provides documentation if a contractor\'s REA is disputed. PMs who run informal programs without CCBs routinely lose REA negotiations because they cannot reconstruct what was actually directed.',
          },
          {
            type: 'warning',
            heading: 'Accord & Satisfaction — Read Every Bilateral Mod Carefully',
            body: 'When a contractor signs a bilateral modification that includes "accord and satisfaction" language (or "full and final settlement"), they may be waiving their right to any future claim related to that change. Contractors sometimes sign these under time pressure without fully recognizing the financial waiver. As a PM working with the CO, be aware that modification language matters legally. Conversely, if you want to definitively close out all claims associated with a change, including "full and final settlement" language is appropriate — just ensure both parties understand what they are agreeing to.',
          },
          {
          type: 'text' as const,
          level: 'intermediate' as const,
          heading: 'Constructive Changes: The Most Expensive Undocumented Government Actions',
          body: 'A constructive change occurs when government actions — without a formal modification — effectively change the contract\'s scope, schedule, or performance requirements. Examples: a government engineer verbally directing the contractor to add features not in the SOW; a COR demanding deliverables in a format not specified in the contract; unreasonable inspection failures that require rework not called for by contract quality standards. Contractors document every instance and compile them into REAs at contract closeout. Mid-career PMs prevent constructive changes by enforcing a single communication protocol: all direction goes through the CO, all informal guidance is labeled as "information only, not direction," and CORs are trained that they cannot direct scope changes. Track every verbal exchange with contractors at the technical level.',
        },
        {
          type: 'callout' as const,
          level: 'advanced' as const,
          heading: 'Armed Services Board of Contract Appeals: What Senior PMs Need to Know',
          body: 'When REAs become claims and claims become disputes, they go to the Armed Services Board of Contract Appeals (ASBCA) or the Court of Federal Claims. Senior PMs are rarely ASBCA participants personally, but their decisions — and their documentation — become the evidence. ASBCA cases routinely turn on: (1) whether government direction was communicated in writing or only verbally; (2) whether the contractor provided timely notice of a changed condition (failure to provide REQ notice waives the right to recover); (3) whether government delay was "excusable" (sovereign acts, weather) or "compensable" (government failure to perform its obligations). Build a file culture from day one: every significant decision in writing, every government-caused delay documented with specific dates and contract references. The ASBCA judge reading your file 5 years from now is your actual audience.',
        },
        ],
      quiz: [
          {
            id: 'q1',
            question: 'Which type of contract modification requires signatures from BOTH the contracting officer and the contractor?',
            options: ['Change order', 'Administrative modification', 'Bilateral modification', 'Stop-work order'],
            correct: 2,
            explanation: 'A bilateral modification (Standard Form 30) is executed by both the CO and the contractor, typically reflecting a mutual agreement on scope, price, or schedule changes. Change orders and stop-work orders are unilateral modifications — signed only by the CO using an existing contract authority clause.',
          },
          {
            id: 'q2',
            question: 'A government program manager verbally tells a contractor\'s engineer to "add this new feature while you\'re at it" without a formal contract modification. This most likely creates:',
            options: ['A valid contract change under the Changes clause', 'A constructive change — the contractor may pursue an REA based on government-directed work outside the contract SOW', 'No obligation since it was not in writing', 'An unauthorized commitment by the contractor'],
            correct: 1,
            explanation: 'Verbal direction to perform out-of-scope work without a formal modification is a classic constructive change. The contractor performed work beyond the contract requirements based on government direction. Even without a formal mod, the contractor has entitlement to an equitable adjustment. This is why COR authorities are strictly limited — informal technical direction can bind the government to pay for work without contractual authority.',
          },
          {
            id: 'q3',
            question: 'An Undefinitized Contract Action (UCA) must be definitized within how many days under DFARS 217.7404?',
            options: ['30 days', '90 days', '180 days', '365 days'],
            correct: 2,
            explanation: 'DFARS 217.7404-3 requires UCAs to be definitized within 180 days of issuance of the authorization to proceed, or by the time 50% of the work is completed — whichever comes first. In practice, many UCAs remain undefinitized beyond this requirement. Every day a UCA is undefinitized, the government faces increasing cost risk because the contractor is billing actual costs with no negotiated price ceiling.',
          },
          {
            id: 'q4',
            question: 'A contractor submits an REA that grows into a formal claim of $2.5M. For the claim to be valid, it must be:',
            options: ['Submitted within 30 days of the change', 'Certified by a senior company official and submitted as a written demand to the CO', 'Approved by DCAA before submission', 'Accompanied by a technical evaluation from DCMA'],
            correct: 1,
            explanation: 'Under the Contract Disputes Act (41 U.S.C. § 7103), claims exceeding $100K must be certified by an authorized contractor representative that the claim is made in good faith, supporting data are accurate and complete to the best of their knowledge, and the amount requested accurately reflects the contract adjustment believed to be due. False certification can expose the contractor to criminal liability under the False Claims Act.',
          },
          {
            id: 'q5',
            question: 'A "cardinal change" is significant because:',
            options: ['It requires a 30-day waiting period before performance', 'It falls outside the general scope of the contract and cannot be directed unilaterally — it may constitute a breach', 'It always requires Congressional approval', 'It must be competed under full and open competition'],
            correct: 1,
            explanation: 'The cardinal change doctrine (developed through case law at the ASBCA and Court of Federal Claims) holds that changes so substantial they alter the nature of the bargained-for contract cannot be directed unilaterally under the Changes clause. Doing so constitutes a government breach, and the contractor is entitled to breach remedies. For PMs, this means very large scope additions should be scrutinized for cardinal change risk before direction is issued.',
          },
          {
            id: 'q6',
            question: 'A Contracting Officer Final Decision (COFD) in response to a contractor claim must be issued within:',
            options: ['30 days of the claim', '60 days of the claim (or reasonable time with notification for complex claims)', '180 days', 'There is no time requirement'],
            correct: 1,
            explanation: 'The Contract Disputes Act requires the CO to issue a Final Decision within 60 days of a certified claim, or within a reasonable time for more complex claims — provided the CO notifies the contractor of the anticipated decision date. If the CO fails to issue a COFD, the contractor may treat the inaction as a denial and appeal directly to the ASBCA or Court of Federal Claims (deemed denial).',
          },
          {
            id: 'q7',
            question: 'Which of the following is an example of a constructive change based on defective government specifications?',
            options: ['The CO directs a formal change to the system\'s performance requirements', 'Government-provided technical specifications contain errors that cause the contractor to perform excessive rework to meet the actual requirement', 'The contractor voluntarily redesigns the system to improve performance', 'The CO exercises an option on the contract'],
            correct: 1,
            explanation: 'Defective government specifications are one of the most common sources of constructive changes. When the government provides faulty specs that the contractor relies on — only to find they are incorrect or impossible to meet — the extra work required to correct the problem is a constructive change entitling the contractor to an equitable adjustment. The government warrants the accuracy of specifications it provides (the "Spearin Doctrine," 248 U.S. 132 (1918)).',
          },
          {
            id: 'q8',
            question: 'A bilateral modification that includes "full and final settlement" language regarding all claims related to a change means:',
            options: ['The contractor retains the right to pursue additional claims for hidden costs', 'The contractor waives their right to future claims arising from that change — an accord and satisfaction', 'DCAA must approve the settlement before it is final', 'The modification automatically triggers a DCMA review'],
            correct: 1,
            explanation: '"Accord and satisfaction" in a bilateral mod means both parties agree the modification fully resolves all claims arising from the specified change. Once signed, the contractor generally cannot pursue additional claims for that change. This is a powerful tool for closing out changes cleanly — but contractors sometimes sign without fully understanding the financial waiver implications.',
          },
          {
            id: 'q9',
            question: 'The ASBCA (Armed Services Board of Contract Appeals) has jurisdiction over:',
            options: ['Pre-award bid protests by losing offerors', 'Contractor appeals of Contracting Officer Final Decisions (COFDs) on contract disputes', 'DCAA audit disputes between contractors and auditors', 'Congressional notification of Nunn-McCurdy breaches'],
            correct: 1,
            explanation: 'The ASBCA (and its civilian counterpart, the CBCA) hears contractor appeals of CO Final Decisions under the Contract Disputes Act. It is an administrative tribunal (not a federal court), but its decisions can be appealed to the Court of Appeals for the Federal Circuit. The alternative forum is the U.S. Court of Federal Claims, a judicial (Article III) court.',
          },
          {
            id: 'q10',
            question: 'A Change Control Board (CCB) on a major defense program primarily serves to:',
            options: ['Review and approve DCAA audit findings before they are released', 'Document, review, and approve all technical and contractual changes before execution — preventing constructive changes and scope creep', 'Authorize program managers to exceed budget without congressional notification', 'Approve new hire requests for the program office'],
            correct: 1,
            explanation: 'A CCB provides the formal process for evaluating and approving changes to the baseline — technical, schedule, and contractual. Every proposed change is evaluated for cost/schedule impact before it is directed. This prevents informal, undocumented changes (constructive changes) and gives the PM a documented record of all directed changes — essential for defending against REAs that claim the government directed more work than the formal record shows.',
          },
          {
            id: 'q11',
            type: 'drag_order',
            question: 'Place the REA-to-Claim process in the correct sequence:',
            options: [],
            correct: 0,
            explanation: 'The process flows: triggering change → contractor submits REA → government review/DCAA audit of cost proposal → negotiation → bilateral mod (ideal resolution). If negotiation fails, the REA becomes a certified claim → CO issues Final Decision → contractor may appeal to ASBCA or Court of Federal Claims. Each step that advances past bilateral mod resolution increases cost and time for both parties.',
            orderedItems: [
              'Government directs change (formal or constructive)',
              'Contractor submits REA with entitlement and cost proposal',
              'DCAA audits REA cost proposal (if >$2M)',
              'CO and contractor negotiate equitable adjustment',
              'Bilateral modification definitizes the change (ideal outcome)',
              'If failed: REA converts to certified Claim; CO issues Final Decision',
            ],
          },
          {
            id: 'q12',
            type: 'drag_match',
            question: 'Match each modification or change concept to its correct definition:',
            options: [],
            correct: 0,
            explanation: 'These concepts form the vocabulary of contract changes. Bilateral mods require consent; unilateral mods do not. Constructive changes happen informally. UCAs are open-ended cost risks. Cardinal changes exceed what can be directed unilaterally. Understanding each distinction allows PMs to manage scope, cost, and legal exposure effectively.',
            pairs: [
              { left: 'Bilateral Modification', right: 'Requires signatures from both CO and contractor' },
              { left: 'Constructive Change', right: 'Informal government direction or inaction that effectively changes the work' },
              { left: 'UCA (Letter Contract)', right: 'Work begins before price is agreed; must be definitized within 180 days' },
              { left: 'Cardinal Change', right: 'Change outside original scope; cannot be directed unilaterally; may be a breach' },
            ],
          },
        ],
      }
    ],
    assessment: [
      {
        id: 'ca1',
        question: 'Under a Firm-Fixed-Price (FFP) contract, who bears 100% of the cost risk?',
        options: ['The Government', 'The Contractor', 'Cost risk is split 50/50', 'A third-party surety'],
        correct: 1,
        explanation: 'Under FFP, the contractor\'s price is fixed at award and does not change regardless of actual costs incurred. The contractor bears all cost risk — if costs exceed the price, the contractor absorbs the loss. If costs are lower, the contractor keeps the savings. This is why FFP is preferred for well-defined, stable requirements.'
      },
      {
        id: 'ca2',
        question: 'Which FAR part governs the general principles of contract types?',
        options: ['FAR Part 12', 'FAR Part 13', 'FAR Part 15', 'FAR Part 16'],
        correct: 3,
        explanation: 'FAR Part 16 covers contract types — from Fixed-Price (16.2) through Cost-Reimbursement (16.3) to Indefinite Delivery (16.5) and Time-and-Materials (16.6). FAR Part 15 covers negotiated acquisitions; Part 12 covers commercial items; Part 13 covers simplified acquisition.'
      },
      {
        id: 'ca3',
        question: 'In source selection, Section L and Section M of a solicitation serve which purposes respectively?',
        options: ['Section L = Contract terms; Section M = Statement of Work', 'Section L = Instructions to offerors; Section M = Evaluation criteria and factors', 'Section L = Pricing instructions; Section M = Technical requirements', 'Section L = Past performance forms; Section M = Price/cost instructions'],
        correct: 1,
        explanation: 'Section L (Instructions, Conditions, and Notices to Offerors) tells contractors HOW to prepare and submit their proposal. Section M (Evaluation Factors) tells them HOW the government will evaluate and award. Section M must be aligned with Section L — you cannot evaluate something you didn\'t ask for.'
      },
      {
        id: 'ca4',
        question: 'A "constructive change" to a contract occurs when:',
        options: ['The contractor proactively improves the system beyond what was required', 'A government action effectively changes contract scope without a formal modification', 'The CO issues a bilateral modification agreed to by both parties', 'The contractor submits a value engineering change proposal'],
        correct: 1,
        explanation: 'A constructive change arises when a government action — such as a COR directing extra work, an overly strict inspection standard, or government-caused delays — effectively changes what the contract requires, even without a formal modification. These can result in large, retroactive contractor claims.'
      },
      {
        id: 'ca5',
        question: 'Under the FAR, "best value" source selection most accurately means:',
        options: ['Always selecting the lowest price technically acceptable offer', 'The government can only consider technical factors, not price', 'A tradeoff process where technical merit and price are both considered to select the offer providing the greatest overall benefit to the government', 'Selecting the offeror with the highest past performance rating regardless of price'],
        correct: 2,
        explanation: 'Best value allows the government to pay a price premium for superior technical capability when the additional benefit justifies the higher cost. The tradeoff rationale must be documented. The alternative is Lowest Price Technically Acceptable (LPTA), where only technical acceptability is evaluated and price wins.'
      },
      {
        id: 'ca6',
        question: 'Which contract type is generally PROHIBITED for use when acquiring services that are closely related to inherently governmental functions?',
        options: ['Firm-Fixed-Price (FFP)', 'Time-and-Materials (T&M)', 'Cost-Plus-Incentive-Fee (CPIF)', 'Indefinite Delivery / Indefinite Quantity (IDIQ)'],
        correct: 1,
        explanation: 'Time-and-Materials contracts provide no incentive for the contractor to control costs — the government pays for labor hours regardless of efficiency. FAR 16.601 requires a determination that no other contract type is suitable before using T&M, and requires government surveillance of labor hours. T&M is particularly problematic for services near inherently governmental functions.'
      },
      {
        id: 'ca7',
        question: 'The "Point of Total Assumption" (PTA) in an FPIF contract is the cost point at which:',
        options: ['The government assumes 100% of cost risk above that amount', 'The contractor assumes 100% of cost risk above that amount (equivalent to FFP above PTA)', 'Both parties renegotiate the contract target cost', 'The ceiling price is triggered and the contract converts to FFP'],
        correct: 1,
        explanation: 'Above the PTA, the contractor\'s share ratio effectively becomes 100/0 — the contractor absorbs every dollar of cost overrun because the ceiling price caps government payments. The PTA is calculated as: PTA = (Ceiling Price - Target Price) / Government Share Ratio + Target Cost.'
      },
      {
        id: 'ca8',
        question: 'DCMA\'s primary mission in contract administration is to:',
        options: ['Audit contractor accounting systems and cost claims', 'Administer contracts on behalf of the PCO — monitoring performance, accepting deliverables, and managing GFP', 'Evaluate contractor proposals during source selection', 'Provide legal representation to the government in contract disputes'],
        correct: 1,
        explanation: 'DCMA is the operational contract administration arm of DoD. DCMA\'s Administrative Contracting Officers (ACOs) are assigned to contractor facilities to monitor schedule, quality, property, and compliance daily. DCAA handles accounting audits; DCMA handles performance administration.'
      },
    ],
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
          },
          {
          type: 'text' as const,
          level: 'intermediate' as const,
          heading: 'Designing a Meaningful KPI Framework for Your Program',
          body: 'Mid-career PMs often inherit a metrics framework designed by someone else — or no framework at all. Building a good one requires discipline: limit leading indicators to 5-7 (more creates noise), ensure each KPI has a data owner responsible for accuracy, and tie thresholds to contract performance criteria not arbitrary round numbers. The most important distinction: leading indicators (staffing ramp, BCWP/BCWS trend, open action item age) predict future performance; lagging indicators (CPI, SPI, schedule slippage) confirm what already happened. Programs that only track lagging indicators are always reacting, never preventing. Build at least two leading indicators per major risk area. Review them weekly at the PM level, not just monthly at program reviews.',
        },
        {
          type: 'callout' as const,
          level: 'advanced' as const,
          heading: 'Metrics Manipulation: How Contractors Game KPIs and How to Catch It',
          body: 'Experienced senior PMs know that any metric a contractor is evaluated on will eventually be gamed. The classic EVM manipulations: retroactive replanning (moving budget into periods where work was already done), schedule logic manipulation (adding constraints to remove negative float), and loading budget into early periods then underspending to generate positive CPI artificially. For technical metrics: systems that report "green" on readiness metrics by narrowing the denominator (counting only tested units, not all units required). The countermeasure: build cross-referencing requirements into your metrics framework. If CPI is 1.05 but cost-per-unit is rising, something is wrong. If schedule shows green but critical path items keep slipping, the schedule logic is suspect. Require contractors to explain anomalies — not just report metrics.',
        },
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
          },
          {
          type: 'text' as const,
          level: 'intermediate' as const,
          heading: 'Presenting Data to Non-Technical Decision Makers',
          body: 'Mid-career PMs spend a significant portion of their time briefing flag officers, SES officials, and congressional staff who have limited technical background. The most effective briefings for this audience: one chart per major message, direct headline titles that state the conclusion (not "CPI Trend" but "Cost Performance Is Recovering — CPI Up 0.08 in 90 Days"), and explicit "so what" statements. Avoid EVM jargon in flag-level briefings — translate: "negative SV" becomes "we are behind schedule"; "VAC" becomes "projected overrun at completion." Spend 80% of your preparation on the narrative, 20% on the charts. Decision makers who can\'t understand your data can\'t support your program.',
        },
        {
          type: 'callout' as const,
          level: 'advanced' as const,
          heading: 'Building a Program Data Architecture — From Contract to Dashboard',
          body: 'Senior PMs on large programs should architect the data flow from the start: IPMR data → government EVMS analysis tool (SMART, Cobra, wInsight) → program office dashboard → leadership briefing. Each translation introduces error and delay; minimize handoffs. Define your data schema before contract award: what format does the contractor submit IPMR data in? What are your visualization requirements? For software programs, define your agile metrics pipeline: how does sprint velocity, defect backlog, and code coverage data flow from contractor dev tools (Jira, GitLab) to your dashboard? Programs that build data architecture retroactively spend 6-12 months cleaning inconsistent data before they can make it useful. Contract for the data architecture — not just the deliverable.',
        },
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
      },
      {
        id: 'data-3',
        title: 'EVM Acronym Deep Dive — Every Term Defined and Explained',
        duration: '30 min',
        description: 'Master every EVM acronym — BCWS, BCWP, ACWP, CPI, SPI, EAC, ETC, VAC, TCPI — with clear definitions, formulas, and PM-level context.',
        keyTerms: [
          { term: 'BAC', definition: 'Budget at Completion — the total authorized budget for all work on the contract.' },
          { term: 'BCWS / PV', definition: 'Budgeted Cost of Work Scheduled (Planned Value) — what you planned to spend by today.' },
          { term: 'BCWP / EV', definition: 'Budgeted Cost of Work Performed (Earned Value) — the budget value of work actually completed.' },
          { term: 'ACWP / AC', definition: 'Actual Cost of Work Performed — real dollars spent on completed work, from the accounting system.' },
          { term: 'CPI', definition: 'Cost Performance Index = BCWP / ACWP. Below 1.0 means over budget.' },
          { term: 'SPI', definition: 'Schedule Performance Index = BCWP / BCWS. Below 1.0 means behind schedule.' },
          { term: 'EAC', definition: 'Estimate at Completion — projected total cost to finish all authorized work.' },
          { term: 'ETC', definition: 'Estimate to Complete — projected cost to finish remaining work only.' },
          { term: 'VAC', definition: 'Variance at Completion = BAC − EAC. Negative means projected overrun.' },
          { term: 'TCPI', definition: 'To-Complete Performance Index — efficiency needed on remaining work to hit BAC or EAC.' },
        ],
        content: [
          {
            type: 'text',
            heading: 'Why EVM Has So Many Acronyms',
            body: "EVM integrates three independent measurement systems — cost accounting, schedule management, and performance measurement — into one framework. Every acronym is a specific data point. Confusing EAC with ETC or VAC with SV is not just embarrassing in a program review — it leads to wrong decisions. All calculations flow from three source numbers: BCWS (planned), BCWP (accomplished), ACWP (spent)."
          },
          {
            type: 'expandable_list',
            heading: 'The Three Source Numbers — Everything Starts Here',
            body: 'Every EVM metric is calculated from these three values. Know them cold.',
            expandableItems: [
              {
                label: 'BCWS / PV — Budgeted Cost of Work Scheduled (Planned Value)',
                badge: 'Baseline',
                badgeColor: 'blue',
                sublabel: 'What you planned to spend by today',
                summary: 'The cumulative budget for all work planned to be completed as of the data date. Comes directly from the time-phased PMB.',
                content: [
                  { type: 'grid', grid: [
                    { label: 'Full Name', value: 'Budgeted Cost of Work Scheduled' },
                    { label: 'Modern Equivalent', value: 'PV (Planned Value)' },
                    { label: 'Source', value: 'Sum of work packages planned to start/complete through the data date per the approved schedule' },
                    { label: 'What It Tells You', value: 'Where you should be on the S-curve. Denominator for SPI = EV/PV.' },
                  ]},
                  { type: 'text', body: 'BCWS/PV does NOT tell you what was spent or what was done — only what was supposed to be done. The power of EVM comes from comparing BCWS to BCWP (actual work done) and ACWP (actual dollars spent).' }
                ]
              },
              {
                label: 'BCWP / EV — Budgeted Cost of Work Performed (Earned Value)',
                badge: 'Earned Value',
                badgeColor: 'green',
                sublabel: 'The heart of EVM — value of work actually completed',
                summary: 'The budget VALUE of work actually completed as of the data date. The only metric that directly measures accomplishment — not spending.',
                content: [
                  { type: 'grid', grid: [
                    { label: 'Full Name', value: 'Budgeted Cost of Work Performed' },
                    { label: 'Modern Equivalent', value: 'EV (Earned Value)' },
                    { label: 'Formula', value: '% Complete × Budget for that work package' },
                    { label: 'Critical Distinction', value: 'BCWP is based on BUDGET, not actual cost. If a $100K task is 50% complete, BCWP = $50K regardless of whether you spent $30K or $90K.' },
                  ]},
                  { type: 'text', body: "Earning Methods matter: Discrete (milestone-based: 0/50/100, 25/75), Apportioned (tied to related work), Level of Effort (LOE — time-phased only, used for management overhead). LOE work packages always show SV=0 and never show behind-schedule." }
                ]
              },
              {
                label: 'ACWP / AC — Actual Cost of Work Performed (Actual Cost)',
                badge: 'Actual Cost',
                badgeColor: 'red',
                sublabel: 'Real dollars spent on completed work',
                summary: 'Actual dollars incurred to accomplish the work measured by BCWP. Comes from the accounting system.',
                content: [
                  { type: 'grid', grid: [
                    { label: 'Full Name', value: 'Actual Cost of Work Performed' },
                    { label: 'Modern Equivalent', value: 'AC (Actual Cost)' },
                    { label: 'Source', value: 'Accounting system actuals — payroll, accounts payable, subcontractor invoices, material receipts' },
                    { label: 'Key Insight', value: 'If ACWP > BCWP you are spending more than the work is worth (overrun). If ACWP < BCWP you are under-running.' },
                  ]}
                ]
              },
            ]
          },
          {
            type: 'expandable_list',
            heading: 'Variances — How Far Off Are You?',
            body: 'Variances tell you the dollar magnitude of cost and schedule problems.',
            expandableItems: [
              {
                label: 'CV — Cost Variance',
                badge: 'CV = BCWP − ACWP',
                badgeColor: 'red',
                sublabel: 'Over or under budget for completed work?',
                summary: 'Negative CV = spending more than the work is worth. Positive CV = under budget.',
                content: [
                  { type: 'grid', grid: [
                    { label: 'Formula', value: 'CV = BCWP − ACWP (EV − AC)' },
                    { label: 'Positive CV', value: 'Under budget. Green.' },
                    { label: 'Negative CV', value: 'Over budget. Red. Requires Variance Analysis Report (VAR).' },
                    { label: 'Related Index', value: 'CPI = BCWP / ACWP. CPI > 1.0 = efficient. CPI < 1.0 = over budget.' },
                  ]}
                ]
              },
              {
                label: 'SV — Schedule Variance',
                badge: 'SV = BCWP − BCWS',
                badgeColor: 'amber',
                sublabel: 'Ahead or behind schedule in dollar terms?',
                summary: 'Negative SV = less work completed than planned. Measured in dollars, not days.',
                content: [
                  { type: 'grid', grid: [
                    { label: 'Formula', value: 'SV = BCWP − BCWS (EV − PV)' },
                    { label: 'Positive SV', value: 'Ahead of schedule. Green.' },
                    { label: 'Negative SV', value: 'Behind schedule. Red.' },
                    { label: 'Limitation', value: 'SV converges to zero at contract completion regardless of how late you finish. Use Earned Schedule (ES) for late-phase schedule analysis.' },
                  ]}
                ]
              },
              {
                label: 'VAC — Variance at Completion',
                badge: 'VAC = BAC − EAC',
                badgeColor: 'red',
                sublabel: 'Projected total overrun or underrun',
                summary: 'VAC tells you whether the program will finish within budget. This is the number executives focus on.',
                content: [
                  { type: 'grid', grid: [
                    { label: 'Formula', value: 'VAC = BAC − EAC' },
                    { label: 'Positive VAC', value: 'Projected under-run. Green.' },
                    { label: 'Negative VAC', value: 'Projected overrun. Red. Threshold typically ±10-15% of BAC triggers formal notification.' },
                    { label: 'PM Action', value: 'Negative VAC requires a credible recovery plan or formal EAC rebaseline.' },
                  ]}
                ]
              },
            ]
          },
          {
            type: 'expandable_list',
            heading: 'Indices and Completion Forecasts',
            body: 'Indices normalize performance to ratios. Forecasts project where you will end up.',
            expandableItems: [
              {
                label: 'CPI — Cost Performance Index',
                badge: 'CPI = BCWP ÷ ACWP',
                badgeColor: 'green',
                sublabel: 'Cost efficiency — cents of value per dollar spent',
                summary: 'CPI is the most important predictive metric in EVM. Once it drops below 1.0 after 20% completion, it almost never recovers.',
                content: [
                  { type: 'grid', grid: [
                    { label: 'CPI = 1.0', value: 'On budget — earning exactly what you are spending' },
                    { label: 'CPI = 0.85', value: 'For every $1 spent, only $0.85 of value earned. 15% overrun rate.' },
                    { label: 'CPI = 1.15', value: 'For every $1 spent, $1.15 of value earned. 15% under-run.' },
                    { label: 'Humphreys Rule', value: 'Research shows cumulative CPI below 1.0 after 20% completion virtually never recovers. Early CPI trends are critical.' },
                  ]}
                ]
              },
              {
                label: 'SPI — Schedule Performance Index',
                badge: 'SPI = BCWP ÷ BCWS',
                badgeColor: 'amber',
                sublabel: 'Schedule efficiency — how much work completed vs planned',
                summary: 'SPI below 1.0 means falling behind plan. Loses meaning after 60% contract completion.',
                content: [
                  { type: 'grid', grid: [
                    { label: 'SPI = 1.0', value: 'On schedule.' },
                    { label: 'SPI = 0.80', value: 'Only completing 80% of planned work.' },
                    { label: 'Limitation', value: 'SPI approaches 1.0 at completion regardless of lateness. Use Earned Schedule (ES) for programs past 60% complete.' },
                    { label: 'Use With', value: 'Cross-reference SPI with the network schedule critical path for a complete picture.' },
                  ]}
                ]
              },
              {
                label: 'EAC — Estimate at Completion',
                badge: 'Most Scrutinized Number',
                badgeColor: 'red',
                sublabel: 'What the total program will actually cost',
                summary: 'EAC is the contractor best estimate of total cost to complete all authorized work. Compare contractor EAC to statistical EAC (BAC/CPI) — large gaps are red flags.',
                content: [
                  { type: 'grid', grid: [
                    { label: 'EAC = BAC / CPI', value: 'Statistical formula. Most accurate after 20% completion. Assumes future efficiency equals cumulative CPI.' },
                    { label: 'EAC = ACWP + ETC', value: 'Bottom-up. Most accurate when fundamental change occurred. Most labor-intensive.' },
                    { label: 'EAC = ACWP + (BAC − BCWP)', value: 'Assumes all overruns to date are non-recurring. Only valid for confirmed one-time events.' },
                    { label: 'Government PM Rule', value: 'Always track BOTH contractor EAC AND BAC/CPI statistical EAC. Require explanation when they diverge more than 5%.' },
                  ]}
                ]
              },
              {
                label: 'ETC — Estimate to Complete',
                badge: 'ETC = EAC − ACWP',
                badgeColor: 'amber',
                sublabel: 'How much MORE to finish remaining work',
                summary: 'ETC is the projected cost for all work remaining. EAC = ACWP + ETC.',
                content: [
                  { type: 'grid', grid: [
                    { label: 'Formula', value: 'ETC = EAC − ACWP' },
                    { label: 'Bottom-Up ETC', value: 'Control Account Managers (CAMs) estimate remaining work packages. Required after significant re-planning.' },
                    { label: 'Sanity Check', value: 'Compare ETC to remaining authorized budget (BAC − BCWP). If ETC >> remaining budget, a formal overrun notification is likely required.' },
                    { label: 'Watch For', value: 'ETC identical to remaining budget often means the estimate has not been updated — not that the program is healthy.' },
                  ]}
                ]
              },
              {
                label: 'TCPI — To-Complete Performance Index',
                badge: 'TCPI = (BAC−EV)÷(BAC−AC)',
                badgeColor: 'purple',
                sublabel: 'Efficiency needed on all remaining work',
                summary: 'TCPI > 1.10 means remaining work must be performed 10%+ more efficiently than historical average — usually unrealistic.',
                content: [
                  { type: 'grid', grid: [
                    { label: 'Formula vs BAC', value: 'TCPI(BAC) = (BAC − BCWP) / (BAC − ACWP)' },
                    { label: 'Formula vs EAC', value: 'TCPI(EAC) = (BAC − BCWP) / (EAC − ACWP)' },
                    { label: 'TCPI > 1.10', value: 'Requires performing 10%+ more efficiently than history. Likely unrealistic — EAC may be understated.' },
                    { label: 'TCPI ≤ CPI', value: 'Recovery is mathematically feasible. Still needs a credible corrective action plan.' },
                  ]}
                ]
              },
            ]
          },
          {
            type: 'tip',
            heading: 'The Six Formulas You Must Know Cold',
            body: 'CV = BCWP − ACWP. SV = BCWP − BCWS. CPI = BCWP/ACWP. SPI = BCWP/BCWS. EAC = BAC/CPI (statistical). VAC = BAC − EAC. Everything else in EVM derives from these six.'
          },
          {
          type: 'text' as const,
          level: 'intermediate' as const,
          heading: 'Using EVM Indices Together: The 60-40 Rule and Beyond',
          body: 'Mid-career PMs know that no single EVM index tells the full story. The most robust EAC formula weights CPI and SPI: EAC = BAC ÷ (0.2×SPI + 0.8×CPI). This formula reflects the empirical finding that cost performance has more predictive power than schedule performance for final cost outcomes. But use indices in combination: a program with CPI 0.95 and SPI 0.85 has both a cost problem and a schedule problem — the schedule pressure will likely drive overtime and accelerated work that further degrades CPI. Programs with CPI ≥ 1.00 but SPI < 0.85 are common: they appear cost-efficient but the schedule pressure is a leading indicator of future cost overruns. Don\'t let a healthy CPI lull you into ignoring a deteriorating SPI.',
        },
        {
          type: 'callout' as const,
          level: 'advanced' as const,
          heading: 'The Cumulative CPI Stability Finding and What It Means for PMs',
          body: 'Research by Christle, Bhatt and others (the "Christle Findings") established that once a program has expended 20% of its budget, the cumulative CPI rarely improves by more than 10%. This has profound implications: a program at 20% complete with a cumulative CPI of 0.85 will, with very high probability, complete at a CPI no better than 0.85 — meaning a 15%+ cost overrun is essentially locked in. Senior PMs use this finding to drive two actions: (1) early IBR — challenge cost realism before 20% is spent; (2) early OTB/EAC revision — if CPI is deteriorating before the 20% mark, don\'t wait for it to stabilize. The longer you wait to acknowledge an overrun, the more the sunk cost fallacy traps the program. The cumulative CPI stability finding is the empirical basis for "fix it early or pay double."',
        },
        ],
      quiz: [
          {
            id: 'q1',
            question: 'A program has BCWP = $800K, ACWP = $1,000K, BCWS = $900K. What is the CPI?',
            options: ['0.89', '0.80', '1.25', '1.13'],
            correct: 1,
            explanation: 'CPI = BCWP / ACWP = $800K / $1,000K = 0.80. For every dollar spent, only $0.80 of value is earned — a 20% cost overrun rate.'
          },
          {
            id: 'q2',
            question: 'Using the same data (BCWP=$800K, ACWP=$1,000K, BCWS=$900K), what is the Schedule Variance?',
            options: ['+$100K (ahead)', '-$100K (behind)', '-$200K (behind)', '+$200K (ahead)'],
            correct: 1,
            explanation: 'SV = BCWP − BCWS = $800K − $900K = −$100K. Negative SV means behind schedule — $100K worth of planned work has not been completed.'
          },
          {
            id: 'q3',
            question: 'What does TCPI > 1.10 indicate?',
            options: ['Program is 10% ahead of budget', 'Remaining work must be performed 10%+ more efficiently than history — likely unrealistic', 'Program has a 10% cost overrun', 'Program needs only 90% of remaining budget'],
            correct: 1,
            explanation: 'TCPI of 1.10 means to stay within BAC, future work must be performed 10% more efficiently than the cumulative CPI. When TCPI significantly exceeds current CPI, the EAC should be revised upward.'
          },
          {
            id: 'q4',
            question: 'The statistical EAC formula (BAC/CPI) is most reliable when:',
            options: ['Contract is in its first month', 'After approximately 20% contract completion', 'Only when contractor provides bottom-up estimate', 'During final 10% of contract'],
            correct: 1,
            explanation: 'Research (RAND, GAO) consistently shows EAC = BAC/CPI is among the most accurate predictors after approximately 20% completion — often more accurate than optimistic bottom-up estimates.'
          },
          {
            id: 'q5',
            question: 'Why does Schedule Variance (SV) converge to zero at contract completion?',
            options: ['All overruns are corrected at completion', 'BCWP and BCWS both equal BAC at completion, making SV = 0 regardless of lateness', 'Contractor reconciles variances before final payment', 'Government accepts any date within 10% of plan'],
            correct: 1,
            explanation: 'At contract completion all work is earned (BCWP = BAC) and all was planned (BCWS = BAC), so SV = 0 regardless of how late the program finished. Use Earned Schedule (ES) for late-program schedule analysis.'
          },
        ],
      },
    {
      id: 'data-4',
      title: 'Reading IPMR Reports — What Every PM Looks for in Each Format',
      duration: '22 min',
      type: 'lesson' as const,
      description: 'Learn to read and analyze the six IPMR formats that contractors submit monthly on DoD programs, and understand what every government PM should look for in each one.',
      content: [
        {
          type: 'text' as const,
          heading: 'What Is the IPMR and Why Does It Matter?',
          body: 'The Integrated Program Management Report (IPMR) is the primary contractually required data deliverable for EVM reporting on DoD contracts. It replaced the older Contract Performance Report (CPR) and Contract Funds Status Report (CFSR) through DI-MGMT-81861 (2012). If your contract exceeds $20M cost-type or $50M fixed-price, you will receive IPMR data from your contractor every month. This lesson teaches what each IPMR format contains and what government PMs look for.',
        },
        {
          type: 'expandable_list' as const,
          heading: 'The Six IPMR Formats',
          expandableItems: [
              {
                label: 'Format 1 — WBS Performance Summary',
                sublabel: 'Cost and schedule performance rolled up by Work Breakdown Structure',
                badge: 'Most Used',
                badgeColor: 'green',
                summary: 'Format 1 shows cumulative and at-completion cost and schedule performance organized by WBS element. This is the first format PMs open — it shows where the money and schedule problems are.',
                content: [
                  {
                    type: 'bullets' as const,
                    title: 'What to Look for in Format 1',
                    items: [
                      'WBS elements with negative CV (Cost Variance) — over-budget areas. Drill down to understand root cause.',
                      'WBS elements with negative SV (Schedule Variance) — behind-schedule areas. Cross-check against the IMS.',
                      'BAC vs. EAC at the total contract level — the delta is VAC. A growing negative VAC trend is the most critical warning sign.',
                      'MR (Management Reserve) balance — if MR is eroding rapidly, the contractor is using contingency to mask overruns.',
                      'Undistributed Budget (UB) — budget not yet assigned to WBS elements. Large UB balances late in the program are a concern.',
                    ],
                  },
                  {
                    type: 'grid' as const,
                    title: 'Format 1 Red Flags',
                    items: [
                      { label: 'CPI < 0.90', value: 'At-completion overrun of over 10% is likely. Initiate Over Target Baseline (OTB) discussion if CPI is stable at this level.' },
                      { label: 'EAC < Statistical EAC', value: 'Contractor may be sandbagging risk. Compare EAC vs BAC/CPI and require explanation for gaps over 5%.' },
                      { label: 'Rapidly Decreasing MR', value: 'Management Reserve burning faster than planned indicates undocumented risk realization.' },
                      { label: 'Large UB Late in Program', value: 'Undistributed budget that should have been assigned months ago may indicate poor planning or intentional delay.' },
                    ],
                  },
                ],
              },
              {
                label: 'Format 2 — OBS Performance Summary',
                sublabel: 'Performance by organizational element and subcontractor',
                badge: 'Organizational View',
                badgeColor: 'blue',
                summary: 'Format 2 shows performance by responsible organization (divisions, departments, subcontractors). Use it to identify which teams or subcontractors are driving cost and schedule problems.',
                content: [
                  {
                    type: 'bullets' as const,
                    title: 'What to Look for in Format 2',
                    items: [
                      'Which organizational element has the worst CPI — often points to staffing or technical problems in that org',
                      'Subcontractor performance — if the prime\'s work is on track but subcontractors are in trouble, supply chain management needs scrutiny',
                      'Compare Format 2 performance by org against staffing data — declining BCWP with high ACWP from a specific org often means unproductive labor',
                    ],
                  },
                ],
              },
              {
                label: 'Format 3 — Baseline',
                sublabel: 'Time-phased PMB and how it has changed — baseline health',
                badge: 'Baseline Health',
                badgeColor: 'yellow',
                summary: 'Format 3 shows the performance measurement baseline over time — including changes, management reserve draws, and budget reallocations. This is how you detect baseline instability.',
                content: [
                  {
                    type: 'bullets' as const,
                    title: 'What to Look for in Format 3',
                    items: [
                      'Baseline changes from last period — any retroactive replanning (moving budget backward to cover past variances) is a serious concern',
                      'Management Reserve (MR) draw-downs — compare total MR used against original MR balance',
                      'Budget shifts between near-term and far-term — "rubber baseline" behavior is a gaming indicator',
                      'Current PMB vs. original PMB — large deviations indicate significant re-planning requiring government approval',
                    ],
                  },
                  { type: 'text' as const, body: 'Retroactive changes to the PMB require Government approval. Any change reaching back more than 1-2 reporting periods is suspect. Over Target Baseline (OTB) reprogramming is the formal mechanism for resetting an unrealistic baseline — it requires government approval and resets the measurement zero.' },
                ],
              },
              {
                label: 'Format 4 — Staffing',
                sublabel: 'Actual vs. planned headcount by labor category — a leading indicator',
                badge: 'Workforce',
                badgeColor: 'blue',
                summary: 'Format 4 shows planned and actual staffing by labor category (LCATs). It is often the leading indicator of future cost and schedule problems.',
                content: [
                  {
                    type: 'bullets' as const,
                    title: 'What to Look for in Format 4',
                    items: [
                      'Understaffing vs. plan — if actual headcount is significantly below planned, BCWP will lag BCWS (negative SV). Schedule slippage is predictable.',
                      'Overstaffing vs. plan — more labor than planned drives ACWP above BCWP (negative CV). May indicate rework or underestimated complexity.',
                      'LCAT mix changes — substituting lower-grade labor for planned senior roles may affect technical quality',
                      'Cross-reference Format 4 with Format 1: understaffed WBS elements will show negative SV in Format 1',
                    ],
                  },
                ],
              },
              {
                label: 'Format 5 — Explanations and Problem Analysis',
                sublabel: 'Variance narratives — the story behind the numbers',
                badge: 'Most Important',
                badgeColor: 'red',
                summary: 'Format 5 contains the contractor\'s written analysis of significant cost and schedule variances. A well-written Format 5 explains root cause, impact, and corrective action.',
                content: [
                  {
                    type: 'bullets' as const,
                    title: 'What to Look for in Format 5',
                    items: [
                      'Causality, not just description — "labor hours exceeded plan due to test failures" is better than "costs increased"',
                      'Corrective action specificity — vague actions ("team is working the issue") with no timeline are not acceptable',
                      'Recovery schedule — if behind schedule, Format 5 should show how the contractor plans to recover',
                      'EAC rationale — the Format 5 should explain the basis for the contractor\'s EAC, especially if it differs from statistical EAC',
                      'Variance thresholds — ensure all threshold variances (typically CV or SV over plus or minus 10% and over $100K) have narratives',
                    ],
                  },
                  { type: 'text' as const, body: 'Format 5 Scrutiny Checklist: (1) Is root cause specific and credible? (2) Are corrective actions assigned, dated, and tracked? (3) Does the EAC reflect the corrective action cost? (4) Are past period corrective actions from last month\'s F5 showing results in this month\'s F1? (5) Does the narrative acknowledge schedule impact, not just cost impact?' },
                ],
              },
              {
                label: 'Format 6 — IMS / Schedule',
                sublabel: 'The Integrated Master Schedule in electronic format',
                badge: 'Schedule',
                badgeColor: 'yellow',
                summary: 'Format 6 is the contractor\'s Integrated Master Schedule (IMS) as an electronic file (Primavera P6 or MS Project). It shows network logic, critical path, and near-term milestones.',
                content: [
                  {
                    type: 'bullets' as const,
                    title: 'What to Look for in Format 6',
                    items: [
                      'Critical path — any slip on critical path tasks directly delays contract completion',
                      'Total Float — tasks with zero or negative total float are on or near critical path. Negative float means the task is already late.',
                      'Schedule density — unusually high milestone clusters ("schedule packing") are a sign of unrealistic planning',
                      'Logic ties — all tasks should have predecessor/successor relationships. Tasks with no ties cannot drive accurate critical path analysis.',
                      'Compare current IMS critical path to last period — an unstable critical path indicates poor schedule management',
                    ],
                  },
                ],
              },
            ],
          },
          {
            type: 'text' as const,
            heading: 'IPMR Monthly Review Workflow',
            body: 'Step 1 — Check Format 1 total contract CPI and VAC trend (5 min). Step 2 — Identify top 3 WBS elements by worst CV and SV (10 min). Step 3 — Read Format 5 narratives for all threshold variances (15 min). Step 4 — Check Format 3 for any baseline changes (5 min). Step 5 — Cross-reference Format 4 staffing to confirm headcount supports recovery plans (5 min). Step 6 — Compare Format 6 critical path to milestone plan (10 min). Total: approximately 50 minutes for a thorough review.',
          },
        {
          type: 'text' as const,
          level: 'intermediate' as const,
          heading: 'Cross-Referencing IPMR Formats: The Monthly Analysis Workflow',
          body: 'Mid-career PMs don\'t just read IPMR formats sequentially — they cross-reference them. The highest-value cross-references: (1) Format 1 variance WBS elements → Format 5 narrative: does the narrative actually address the Format 1 problem areas, or does it address different elements? Inconsistency means the Format 5 was written independently of the data; (2) Format 4 staffing gaps → Format 1 schedule variance: understaffed WBS elements should show negative SV — if they don\'t, the schedule logic is disconnected from staffing reality; (3) Format 5 corrective action commitments → next month\'s Format 1: are last month\'s corrective actions producing measurable improvement? If not, the corrective action was ineffective or was not actually executed. Build a monthly tracking sheet that captures the key cross-references from each IPMR submission.',
        },
        {
          type: 'callout' as const,
          level: 'advanced' as const,
          heading: 'IPMR as Legal Documentation: What Senior PMs Must Preserve',
          body: 'Senior PMs on large programs must understand that IPMR data is contractually required documentation and is discoverable in litigation. Format 5 narratives become exhibits in ASBCA cases — a contractor\'s written explanation that a variance is due to "government-caused delays" is the foundation of a future REA. The government PM\'s obligation: (1) preserve all IPMR submissions with receipt timestamps; (2) document government responses in writing — if you accepted an inadequate Format 5 narrative without objection, you may have waived your right to challenge the root cause later; (3) track OTB and reprogramming history — baseline changes require formal government approval and must be documented with the approving official\'s name and date. Programs that lose IPMR archives lose their ability to reconstruct performance history in claims disputes.',
        },
      ],
      quiz: [
            {
              id: 'q1',
              question: 'Which IPMR format contains written narratives explaining root causes and corrective actions for significant variances?',
              options: ['Format 1 — WBS Performance', 'Format 3 — Baseline', 'Format 5 — Explanations and Problem Analysis', 'Format 6 — IMS/Schedule'],
              correct: 2,
              explanation: 'Format 5 contains the Variance Analysis Reports (VARs) — written narratives that explain the root cause of significant cost and schedule variances and describe corrective actions. It is the most important format for understanding WHY performance is off track.',
            },
            {
              id: 'q2',
              question: 'A government PM reviewing Format 3 notices the PMB was retroactively changed to reduce a prior period\'s negative SV. This most likely indicates:',
              options: ['Normal baseline maintenance per EVMS guidelines', 'A potential EVMS compliance violation — retroactive replanning to conceal schedule variances', 'An approved change order requiring replanning', 'A subcontractor claiming additional scope'],
              correct: 1,
              explanation: 'Retroactive changes to the PMB to reduce prior period variances are a serious EVMS compliance concern. ANSI 748 and DoDI 5000.02 prohibit retroactive baseline revisions except in very specific circumstances. This is classic "rubber baseline" gaming behavior.',
            },
            {
              id: 'q3',
              question: 'Format 4 shows actual headcount is 30% below planned for the critical design phase. What should you expect in Format 1?',
              options: ['Positive CPI due to lower labor costs', 'Negative SV because insufficient staff means less work is being accomplished', 'Positive SV because fewer people compresses the schedule', 'No impact — staffing and EVM performance are independent'],
              correct: 1,
              explanation: 'Understaffing is a direct cause of negative Schedule Variance. Fewer people completing work means BCWP accumulates slower than BCWS, creating negative SV. Cross-referencing Format 4 staffing gaps with Format 1 schedule variances is a fundamental IPMR analysis technique.',
            },
            {
              id: 'q4',
              question: 'In Format 6 (IMS), a task shows "-15 days total float." What does this mean?',
              options: ['The task has 15 days of scheduling flexibility', 'The task is already 15 days late relative to its constraint and will delay the program end date', 'The task was completed 15 days early', 'The task needs 15 additional resources'],
              correct: 1,
              explanation: 'Negative total float means the task is already past its planned completion date by that amount. Without recovery actions, negative float propagates through the network and delays all successor tasks including the contract completion milestone.',
            },
            {
              id: 'q5',
              question: 'What is an Over Target Baseline (OTB) and when is it used?',
              options: ['An informal replanning action to reset performance metrics', 'A formal government-approved reprogramming action that resets the PMB when the current baseline is no longer achievable, requiring a new IBR', 'A penalty mechanism for contractors who exceed the BAC', 'A supplemental funding authorization for overrun programs'],
              correct: 1,
              explanation: 'An OTB is a formal, government-approved action that resets the Performance Measurement Baseline when the current baseline is so unrealistic that EVM measurements have lost informational value. It requires SSA/PEO approval, a revised EAC, and a new Integrated Baseline Review (IBR). OTB does not change the contract price.',
            },
      ],
      keyTerms: [
        { term: 'IPMR', definition: 'Integrated Program Management Report — the primary monthly EVM data deliverable from contractors on DoD programs, replacing the older CPR and CFSR.' },
        { term: 'Format 1', definition: 'WBS Performance Summary — the most used IPMR format showing cost and schedule performance by WBS element.' },
        { term: 'Format 5', definition: 'Explanations and Problem Analysis — written narratives from the contractor explaining root causes of variances and corrective actions.' },
        { term: 'Format 6', definition: 'Integrated Master Schedule (IMS) in electronic format — shows network logic, critical path, and near-term milestones.' },
        { term: 'OTB', definition: 'Over Target Baseline — a formal government-approved action that resets the Performance Measurement Baseline when the current baseline is no longer achievable.' },
        { term: 'Total Float', definition: 'The amount of time a task can slip before it delays a downstream milestone or the contract completion. Negative total float means the task is already late.' },
        { term: 'VAC', definition: 'Variance at Completion — the difference between BAC and EAC. Negative VAC means the program is projected to overrun budget.' },
      ],
    },
    ],
    assessment: [
      {
        id: 'da1',
        question: 'In DoD program reporting, what does the acronym "EVM" stand for and what does it measure?',
        options: ['Extended Value Metrics — contractor profitability', 'Earned Value Management — integrates cost, schedule, and technical performance into a single management framework', 'Estimated Variance from Milestone — deviation from program schedule', 'Enterprise Visibility Mechanism — contractor data reporting system'],
        correct: 1,
        explanation: 'Earned Value Management (EVM) is a project management technique that integrates scope, schedule, and cost. It compares planned work (PV), work accomplished (EV), and actual cost (AC) to provide objective performance indicators like CPI and SPI. Required on contracts over $20M (RDT&E) or $50M (all other) per DoDI 5000.02.'
      },
      {
        id: 'da2',
        question: 'A Selected Acquisition Report (SAR) is submitted to Congress when a program exceeds cost growth thresholds. What is this threshold called?',
        options: ['Nunn-McCurdy Breach', 'Anti-Deficiency Violation', 'Should-Cost Exceedance', 'Independent Cost Estimate Variance'],
        correct: 0,
        explanation: 'The Nunn-McCurdy Act requires DoD to notify Congress when a program\'s unit cost growth exceeds 15% (significant) or 25% (critical) above the current baseline, or 30%/50% above the original baseline. A critical breach requires the SecDef to certify the program is essential to national security or terminate it.'
      },
      {
        id: 'da3',
        question: 'In data analytics for DoD programs, what does "CDRL" stand for and why does it matter?',
        options: ['Contract Data Requirements List — defines the data deliverables the contractor must provide the government under the contract', 'Contractor Deficiency Resolution Log — tracks contractor performance issues', 'Cost Data Reporting Level — defines EVM reporting thresholds', 'Consolidated Defense Reporting List — OSD-level program status reports'],
        correct: 0,
        explanation: 'A CDRL (Contract Data Requirements List, DD Form 1423) specifies every data item the government requires the contractor to deliver — technical reports, schedules, cost reports, test results. CDRLs are legally binding contract deliverables. Missing or late CDRLs are a contract performance issue the COR must document.'
      },
      {
        id: 'da4',
        question: 'What is the primary purpose of a Defense Acquisition Executive Summary (DAES)?',
        options: ['To certify program funding at milestone reviews', 'To provide OSD leadership with a monthly assessment of program health — cost, schedule, and performance — using color-coded ratings', 'To document contractor past performance for future source selections', 'To report financial audit results to the Inspector General'],
        correct: 1,
        explanation: 'The DAES is a monthly program health report reviewed at the OSD level. It uses a color-coded assessment (Green/Yellow/Red) across cost, schedule, and performance dimensions. Programs in amber or red status receive additional OSD scrutiny and may be required to present recovery plans.'
      },
      {
        id: 'da5',
        question: 'Which metric measures the cost efficiency of work completed to date in EVM?',
        options: ['SPI (Schedule Performance Index)', 'TCPI (To-Complete Performance Index)', 'CPI (Cost Performance Index)', 'VAC (Variance at Completion)'],
        correct: 2,
        explanation: 'CPI = EV / AC. It measures how much earned value you are getting per dollar spent. A CPI of 1.0 means on budget; below 1.0 means cost overrun; above 1.0 means under budget. CPI tends to stabilize early in a program and is a reliable predictor of final cost performance.'
      },
      {
        id: 'da6',
        question: 'A program\'s Integrated Master Schedule (IMS) shows the critical path. What does "critical path" mean?',
        options: ['The tasks with the highest dollar value in the contract', 'The longest sequence of dependent tasks that determines the minimum program completion date — any slip on the critical path slips the whole program', 'The tasks most likely to experience technical failure', 'The top 10 highest-risk tasks identified in the program risk register'],
        correct: 1,
        explanation: 'The critical path is the longest chain of logically dependent activities in the schedule. Tasks on the critical path have zero float — any delay directly extends the program end date. PMs must track critical path tasks with the most scrutiny. A schedule with no margin on the critical path is a high-risk program.'
      },
      {
        id: 'da7',
        question: 'What does "FPRR" stand for and who conducts it?',
        options: ['Fixed Price Rate Review — conducted by DCMA to review labor rates at contract award', 'Forward Pricing Rate Recommendation — issued by DCAA based on audit of contractor indirect cost rates used in pricing future proposals', 'Final Program Risk Review — conducted by the PM at Milestone C', 'Federal Procurement Reporting Requirement — annual OSD data call'],
        correct: 1,
        explanation: 'DCAA issues Forward Pricing Rate Recommendations (FPRRs) — audit-based assessments of a contractor\'s proposed indirect cost rates (overhead, G&A, fringe). These rates are used in pricing cost-type contracts and T&M proposals. A CO may use the FPRR or negotiate Forward Pricing Rate Agreements (FPRAs) directly with the contractor.'
      },
      {
        id: 'da8',
        question: 'In the context of DoD data analytics, "VACP" most closely refers to:',
        options: ['Variance at Completion Percent — a measure of projected cost overrun relative to BAC', 'Value Added Cost Performance — a profit metric', 'Vendor Acquisition Compliance Protocol — a contractor reporting standard', 'Validated Acquisition Cost Projection — used in CAPE independent estimates'],
        correct: 0,
        explanation: 'VAC (Variance at Completion) = BAC - EAC. It represents the projected cost overrun or underrun at program completion. Expressed as a percentage (VAC%), it gives leadership a quick view of how far off budget the program is projected to finish. A negative VAC% means projected overrun.'
      },
    ],
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
            body: "Winning government contracts is not an accident — it\'s a disciplined process that begins years before the RFP is released. The best capture managers are already executing their win strategy while competitors are just becoming aware of the opportunity. Understanding this lifecycle helps both government PMs (who interact with BD teams) and industry professionals who want to build winning capture programs."
          },
          {
            type: 'expandable_list',
            heading: "The BD-to-Capture-to-Proposal Lifecycle",
            body: "Each phase builds on the last. Tap any phase to see what it involves, who performs it, and what it produces.",
            expandableItems: [
              {
                label: "Phase 1: Opportunity Identification",
                badge: "< 20% Pwin",
                badgeColor: 'gray',
                sublabel: "Market research, relationship building, forecast monitoring",
                summary: "The pipeline starts here. BD teams mine government forecasts and build customer relationships before any solicitation exists.",
                content: [
                  {
                    heading: "What Is It?",
                    type: 'text',
                    body: "Opportunity Identification (OI) is the systematic process of finding potential contracts before they reach the market. At this stage, nothing has been formally competed — the government is still forming requirements or hasn\'t yet issued a solicitation. Pwin is low because the company hasn\'t yet assessed strategic fit or competitive position."
                  },
                  {
                    heading: "How Is It Performed?",
                    type: 'bullets',
                    items: [
                      "Monitoring government forecasting tools: SAM.gov, GovWin IQ, BGOV, USASpending.gov for expiring contracts and new programs",
                      "Attending industry days, pre-solicitation conferences, and AFCEA/AUSA events",
                      "Building relationships with government program offices, contracting officers, and requirements owners",
                      "Tracking Congressional budget justification books (RDT&E, Procurement, O&M) for new program funding",
                      "Analyzing incumbent contract expiration dates (recompete windows 12-24 months out)",
                      "Receiving internal tips from employees embedded on program teams (CORs, ACOs, technical advisors)"
                    ]
                  },
                  {
                    heading: "Who Performs It?",
                    type: 'bullets',
                    items: [
                      "Business Development (BD) Managers — primary owners of the pipeline",
                      "Account Managers — relationship owners for specific government accounts",
                      "Senior executives who have relationships with Program Executive Officers (PEOs) and Component Acquisition Executives (CAEs)",
                      "Program alumni who transitioned from government to industry (must observe ethics cooling-off periods)"
                    ]
                  },
                  {
                    heading: "Key Outputs",
                    type: 'grid',
                    grid: [
                      { label: 'Deliverable', value: 'Opportunity Brief / Pipeline Entry' },
                      { label: 'Decision Gate', value: 'Pipeline Add / No-Add' },
                      { label: 'Pwin Range', value: '< 20% (unqualified)' },
                      { label: 'Resources Used', value: 'BD hours only — minimal investment' }
                    ]
                  }
                ]
              },
              {
                label: "Phase 2: Qualification (Gate Review)",
                badge: "20–30% Pwin",
                badgeColor: 'blue',
                sublabel: "Go/No-Go decision — should we invest B&P dollars in this pursuit?",
                summary: "The gate review is the company\'s governance checkpoint where leadership decides whether to commit real resources. A disciplined No-Go here saves far more money than a half-hearted proposal later.",
                content: [
                  {
                    heading: "What Is It?",
                    type: 'text',
                    body: "Qualification is the formal internal review process to determine whether an opportunity is worth pursuing. It converts an unqualified pipeline entry into an active capture investment — or saves the company from wasting B&P on an unwinnable pursuit. This is the most strategically important gate in the capture process."
                  },
                  {
                    heading: "How Is It Performed?",
                    type: 'bullets',
                    items: [
                      "BD manager presents the opportunity to a Capture/Growth leadership team (often VP-level)",
                      "Team scores the opportunity against qualification criteria: strategic fit, Pwin, customer relationship health, past performance relevance, competitive landscape",
                      "Financial analysis: estimated contract value vs. required B&P investment; expected ROI",
                      "Resource check: do we have the people, clearances, and facilities to perform this work?",
                      "A formal Go/No-Go decision is documented — not a verbal agreement",
                      "If 'Go': a Capture Manager is assigned and B&P budget is allocated"
                    ]
                  },
                  {
                    heading: "Who Performs It?",
                    type: 'bullets',
                    items: [
                      "Capture Review Board or Growth Board — typically VP/Director-level leadership",
                      "BD Manager — presents the opportunity brief",
                      "Capture Manager (if already assigned) — provides early strategy assessment",
                      "Finance — provides B&P budget analysis and ROI projection",
                      "Contracts — reviews acquisition strategy, contract type, and competitive environment"
                    ]
                  },
                  {
                    heading: "Qualification Criteria (What Gets Scored)",
                    type: 'bullets',
                    items: [
                      "Strategic alignment: Does this fit our core competencies and growth strategy?",
                      "Customer relationship: Do we have meaningful access? Or are we starting cold?",
                      "Competitive position: How many competitors? Is there an incumbent? What's our realistic Pwin?",
                      "Past performance: Do we have relevant, recent past performance to reference?",
                      "Resource availability: Can we staff this contract if we win? Do we have the clearances?",
                      "Financial threshold: Is the expected TCV (Total Contract Value) worth the B&P investment?"
                    ]
                  },
                  {
                    heading: "Key Outputs",
                    type: 'grid',
                    grid: [
                      { label: 'Deliverable', value: 'Go/No-Go Decision + Capture Assignment' },
                      { label: 'B&P Approved', value: 'Yes (Go) or No (No-Go/Monitor)' },
                      { label: 'Pwin Range', value: '20-30% (qualified but pre-strategy)' },
                      { label: 'Timeline', value: 'Ideally 18-36 months before RFP' }
                    ]
                  }
                ]
              },
              {
                label: "Phase 3: Capture",
                badge: "30–50% Pwin",
                badgeColor: 'amber',
                sublabel: "Customer engagement, win strategy, Black Hat, teaming",
                summary: "This is where the real work happens. The Capture Manager drives customer intelligence, competitive analysis, and win strategy — shaping the opportunity before the RFP drops.",
                content: [
                  {
                    heading: "What Is It?",
                    type: 'text',
                    body: "Capture is the sustained, resource-intensive effort to position your company to win a specific opportunity. It spans from the Go decision through RFP release. The goal: make the RFP read like your proposal. Every action in capture — customer meetings, white papers, demos, teaming agreements — is designed to improve competitive position before the competition formally starts."
                  },
                  {
                    heading: "Key Capture Activities",
                    type: 'bullets',
                    items: [
                      "Customer call plan: Scheduled visits with program office, COR, end users, contracting — understanding their real priorities (not just what\'s in the draft PWS)",
                      "Competitive intelligence: Who will bid? What are their past performance strengths? What price will they target?",
                      "Black Hat review: Your team role-plays as the primary competitor — developing their proposal strategy to expose your vulnerabilities",
                      "Win strategy development: Define 3-5 win themes tied to customer hot buttons and competitor weaknesses",
                      "Solution development: Technical approach concepts, staffing strategy, draft management approach",
                      "Teaming decisions: Identify sub partners who add capability, vehicle access, or diversity credits",
                      "Price-to-Win (PTW) analysis: What price will win? Build a competitor cost model",
                      "Shaping activities: White papers, RFI responses, demo opportunities, industry day Q&A submissions"
                    ]
                  },
                  {
                    heading: "Who Performs It?",
                    type: 'bullets',
                    items: [
                      "Capture Manager — overall strategy lead and customer engagement coordinator",
                      "Technical SMEs — solution development, demo execution, white paper authoring",
                      "Pricing Analysts — PTW model, rough order of magnitude (ROM) cost build",
                      "Contracts/Legal — teaming agreement negotiation, OCI analysis",
                      "BD Manager — executive-level relationship maintenance and intelligence",
                      "Proposal Manager (if assigned early) — begins compliance planning"
                    ]
                  },
                  {
                    heading: "Key Outputs",
                    type: 'grid',
                    grid: [
                      { label: 'Deliverable', value: 'Capture Plan (living document)' },
                      { label: 'Also Produces', value: 'Black Hat results, PTW model, teaming agreements, win themes' },
                      { label: 'Pwin Range', value: '30-50% (strategy defined)' },
                      { label: 'B&P Burn Rate', value: 'Moderate-High — team hours accumulating' }
                    ]
                  }
                ]
              },
              {
                label: "Phase 4: Proposal Development",
                badge: "50–70% Pwin",
                badgeColor: 'green',
                sublabel: "Writing, Pink/Red/Gold color team reviews, pricing, compliance",
                summary: "The proposal phase converts the capture strategy into a compliant, compelling document. Color reviews (Pink, Red, Gold) are structured quality gates — each with a specific focus and audience.",
                content: [
                  {
                    heading: "What Is It?",
                    type: 'text',
                    body: "Proposal development is the structured process of producing a compliant, persuasive response to the government\'s RFP. It's a high-intensity, deadline-driven effort involving technical writers, subject matter experts, pricing analysts, graphics artists, and senior reviewers. The best proposals tell a clear story: \"Here is your problem. Here is our solution. Here is why we\'re the best team to execute it.\""
                  },
                  {
                    heading: "The Color Team Review Cycle",
                    type: 'bullets',
                    items: [
                      "Pink Team (30-40% draft): Reviews outline and early narrative for compliance and strategy alignment. Catches structural problems before writing is complete. Reviewers: capture lead, proposal manager, one SME per volume.",
                      "Red Team (75-90% draft): The most rigorous review. Evaluates the near-final proposal from the government evaluator\'s perspective — compliance, clarity, win themes, discriminators, ghost strategies. Reviewers: Senior staff not involved in writing (fresh eyes). Output: Red Team report with actionable findings.",
                      "Gold Team (95-100%): Final senior leadership review. Not a line-edit — focuses on executive summary, win themes, overall narrative strength, and price strategy. Decision-makers verify the proposal represents the company\'s best value. Reviewers: VP/Director level, BD lead, capture manager.",
                      "Pink-2 / White Glove (optional): Final production review for formatting, pagination, graphics quality, and printing/upload compliance."
                    ]
                  },
                  {
                    heading: "What Happens at a Red Team?",
                    type: 'bullets',
                    items: [
                      "Reviewers receive the near-complete draft plus the RFP (Sections L & M) and evaluation criteria",
                      "Each reviewer scores the proposal against Section M criteria independently, then compares findings",
                      "The Red Team Lead facilitates a debrief session documenting strengths, weaknesses, and risks",
                      "Output: A prioritized list of findings ranked by impact — not just 'make this better' but 'this will cost you the award'",
                      "Proposal Manager translates findings into specific revision taskers with owners and due dates"
                    ]
                  },
                  {
                    heading: "Key Outputs",
                    type: 'grid',
                    grid: [
                      { label: 'Deliverable', value: 'Final compliant proposal (all volumes)' },
                      { label: 'Review Gates', value: 'Pink → Red → Gold → Production' },
                      { label: 'Pwin Range', value: '50-70% (post-RFP, post-pricing)' },
                      { label: 'B&P Burn Rate', value: 'Maximum — full team sprint' }
                    ]
                  }
                ]
              },
              {
                label: "Phase 5: Negotiation & Award",
                badge: "Award or Loss",
                badgeColor: 'purple',
                sublabel: "BAFO, discussions, final proposal revision, award",
                summary: "After evaluation, the government may open discussions. Best and Final Offer (BAFO) is your last chance to sharpen your position before award. Win or lose, the debrief is critical intelligence for the next pursuit.",
                content: [
                  {
                    heading: "What Is It?",
                    type: 'text',
                    body: "After initial evaluation, the government may determine a competitive range and open discussions. Discussions are the government\'s opportunity to clarify deficiencies and significant weaknesses — and your opportunity to recover from proposal errors or sharpen your price. BAFO (Best and Final Offer, also called Final Proposal Revision in FAR terminology) is your final submission."
                  },
                  {
                    heading: "The Discussion / BAFO Process",
                    type: 'bullets',
                    items: [
                      "Government issues Evaluation Notices (ENs) identifying deficiencies, significant weaknesses, or clarifications",
                      "Offerors respond to ENs — correcting errors and strengthening weak areas",
                      "Price discussions may occur — government may signal price is too high or outside competitive range",
                      "BAFO request issued: a specific due date for final revisions (technical and price)",
                      "Proposal team prepares targeted revisions — no wholesale rewrites, only EN-driven changes",
                      "Final price submission — this is the price you\'ll live with for the contract period"
                    ]
                  },
                  {
                    heading: "Post-Award: Whether You Win or Lose",
                    type: 'bullets',
                    items: [
                      "Win: Transition plan execution, contract kickoff, staffing actions — capture team hands off to program team",
                      "Loss: Request a debrief within 3 days of award notice (FAR 15.506 — government must provide a written debrief)",
                      "Debrief intelligence: Government will tell you your evaluation scores, strengths, weaknesses, and winner's scores",
                      "Loss analysis: Was the loss on technical, price, or past performance? This drives the next capture strategy",
                      "Protest decision: Did the government follow proper procedures? GAO protest deadline is 10 days after debrief"
                    ]
                  },
                  {
                    heading: "Key Outputs",
                    type: 'grid',
                    grid: [
                      { label: 'Win Path', value: 'Contract award + transition' },
                      { label: 'Loss Path', value: 'Debrief + lessons learned + next pursuit' },
                      { label: 'Protest Window', value: '10 days post-debrief (GAO)' },
                      { label: 'Pwin Realized', value: '100% (win) or 0% (loss)' }
                    ]
                  }
                ]
              }
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
            body: "A \"Black Hat\" review is when your team role-plays as your competitor — developing their proposal strategy, win themes, and pricing approach as if you were them. This forces you to honestly assess your competitor\'s strengths and identify vulnerabilities in your own approach. The best black hats are brutal; if yours is comfortable, you\'re not being honest enough about the competition."
          },
          {
          type: 'text' as const,
          level: 'intermediate' as const,
          heading: 'Gate Review Discipline: When to Kill a Pursuit',
          body: 'Mid-career BD professionals understand that the hardest decision in capture management is walking away. B&P budgets are finite; every dollar spent on a low-Pwin pursuit is a dollar not spent on a winnable one. Gate reviews must be decision events — not status updates where management hears bad news and says "let\'s see how it goes." Build gate criteria that force the decision: what is the minimum Pwin below which we do not pursue? What customer access requirements must be met by Stage 2? If a $50M opportunity has no customer access 90 days before RFP, the Pwin is probably below your threshold — and the BD team knows it. Create a gate review culture where "no pursue" decisions are celebrated as resource discipline, not treated as failures.',
        },
        {
          type: 'callout' as const,
          level: 'advanced' as const,
          heading: 'Pipeline Architecture: Building a Sustainable BD Engine',
          body: 'Senior BD executives architect the pipeline to create predictable revenue — not just chase the next opportunity. A healthy pipeline has: (1) a 3-5x coverage ratio (pipeline value 3-5x annual revenue target); (2) stage-gate distribution — 40-50% in Stage 1 (early), 30-40% in Stage 2 (capture), 20-30% in Stage 3 (proposal); (3) diversification by customer, contract type, and competitive position (not 80% incumbent). The failure mode: a pipeline where 60% of value is in a single re-compete that has an incumbent advantage — if you lose it, revenue craters. Architect the pipeline with a forcing function: if any single opportunity represents more than 30% of your pipeline value, you have a concentration risk that needs immediate diversification.',
        },
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
            explanation: "B&P costs are the company\'s investment in pursuing a specific opportunity — proposal writing, customer engagement, pricing analysis. These are NOT directly chargeable to government contracts. They are typically funded from company overhead pools (G&A or B&P pools) and represent a significant strategic investment, often 1-3% of revenue for major defense firms."
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
            explanation: "The gate review is the company\'s governance process for allocating limited B&P resources. It evaluates strategic fit, competitive position, Pwin, customer relationship, and resource availability. A \"no-go\" decision is not a failure — it conserves B&P investment for higher-Pwin opportunities. Companies that pursue every opportunity without qualification waste resources on long shots."
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
            body: "A true discriminator is something you can do (or have done) that your competitors cannot match. \"20 years of experience\" is not a discriminator — every major defense firm has 20 years of experience. A discriminator sounds like: \"We hold the only cleared facility for this specific testing in the continental U.S.\" or \"Our team developed the predecessor system and holds all historical technical data.\" If your competitor could say the same thing, it\'s not a discriminator."
          },
          {
            type: 'expandable_list',
            heading: "Proposal Color Team Reviews",
            body: "Each review is a structured quality gate. Tap any review to see who runs it, what\'s evaluated, what inputs are required, and what the output means for your proposal.",
            expandableItems: [
              {
                label: "Pink Team Review",
                badge: "30–40% Complete",
                badgeColor: 'purple',
                sublabel: "First structured review — outline, approach, and early compliance",
                summary: "The Pink Team catches structural and strategic problems early, while the proposal is still malleable. Better to fix your outline at 30% than rewrite volumes at 85%.",
                content: [
                  {
                    heading: "What Is It?",
                    type: 'text',
                    body: "The Pink Team is the first formal review, conducted when the proposal is roughly 30-40% written. Its purpose is not to red-line grammar — it\'s to validate that the outline, approach, and early narrative are compliant with Section L, aligned with win themes, and responsive to the customer\'s evaluation criteria (Section M). Structural problems caught at Pink save days of rework at Red."
                  },
                  {
                    heading: "Required Inputs",
                    type: 'bullets',
                    items: [
                      "The RFP (Sections L and M, plus the PWS/SOO/SOW)",
                      "Proposal outline / annotated outline showing each Section L requirement and where it will be addressed",
                      "Early draft narrative for at least the Technical and Management volumes",
                      "Win themes and discriminators brief (from the Capture Plan)",
                      "Compliance matrix (even if incomplete at this stage)"
                    ]
                  },
                  {
                    heading: "Who Is Involved?",
                    type: 'bullets',
                    items: [
                      "Pink Team Lead — usually the Capture Manager or a senior proposal manager",
                      "Volume Leads — one reviewer per major volume (Technical, Management, Past Performance)",
                      "Capture Manager — validates strategy alignment",
                      "NOT the writers — reviewers should be different from authors to provide objective eyes"
                    ]
                  },
                  {
                    heading: "What Gets Evaluated?",
                    type: 'bullets',
                    items: [
                      "Compliance: Does the outline address every 'shall' and 'will' in Section L?",
                      "Win theme placement: Are win themes visible in the section headers and opening paragraphs?",
                      "Section M alignment: Does each major section address the evaluation criteria it will be scored against?",
                      "Flow and logic: Does the narrative tell a coherent story, or is it a data dump?",
                      "Ghost strategy: Are competitor weaknesses subtly addressed without naming competitors?"
                    ]
                  },
                  {
                    heading: "Outputs",
                    type: 'grid',
                    grid: [
                      { label: 'Primary Output', value: 'Annotated outline with compliance gaps and strategy recommendations' },
                      { label: 'Decision', value: 'Proceed to writing / Restructure required' },
                      { label: 'Timeline', value: '1-2 days review + 1 day debrief and tasker assignment' },
                      { label: 'Action Items', value: 'Specific outline changes, missing requirements, strategy adjustments' }
                    ]
                  }
                ]
              },
              {
                label: "Red Team Review",
                badge: "80–90% Complete",
                badgeColor: 'red',
                sublabel: "Most rigorous review — scored against Section M criteria",
                summary: "The Red Team is the single most important quality gate. Reviewers evaluate the near-final proposal exactly as government evaluators will, identifying everything that could cost you the award.",
                content: [
                  {
                    heading: "What Is It?",
                    type: 'text',
                    body: "The Red Team is the most rigorous and consequential review in the proposal process. Reviewers approach the document exactly as a government Source Selection Evaluation Board (SSEB) would — scoring sections against the actual evaluation criteria in Section M, identifying compliance deficiencies, weaknesses, and risks. A great Red Team will tell you which specific items will cost you the award, not just what could be improved."
                  },
                  {
                    heading: "Required Inputs",
                    type: 'bullets',
                    items: [
                      "Near-complete proposal draft (80-90% written — all sections represented)",
                      "RFP Sections L and M (mandatory — reviewers score against these)",
                      "Compliance matrix (fully completed)",
                      "Win themes and discriminators brief",
                      "Competitive intelligence summary (what are competitors likely to offer?)",
                      "Red Team evaluation scoresheet (pre-built to mirror Section M criteria)"
                    ]
                  },
                  {
                    heading: "Who Is Involved?",
                    type: 'bullets',
                    items: [
                      "Red Team Lead — senior reviewer who facilitates and consolidates findings (must NOT have been involved in writing)",
                      "Subject Matter Experts — one per major technical domain; must be independent of the writing team",
                      "Contracts/Compliance reviewer — ensures every Section L requirement is addressed",
                      "Senior executive (optional) — provides strategic perspective on win themes and discriminators",
                      "Pricing reviewer — reviews if price strategy aligns with technical approach",
                      "KEY RULE: No writer reviews their own section. Fresh eyes are mandatory."
                    ]
                  },
                  {
                    heading: "What Gets Evaluated?",
                    type: 'bullets',
                    items: [
                      "Compliance: Every Section L requirement mapped and addressed? Any unresolved compliance issues?",
                      "Technical merit: Is the approach sound, detailed enough, and differentiated from a generic response?",
                      "Win themes: Are the 3-5 win themes visible, compelling, and customer-validated throughout the document?",
                      "Ghost strategy: Does the proposal subtly contrast your strengths against competitor weaknesses without naming them?",
                      "Past Performance: Are the examples relevant (same scope, size, contract type)? Are they well-documented with outcomes?",
                      "Management approach: Does the proposed organizational structure and staffing plan inspire confidence?",
                      "Risk: Does the proposal acknowledge realistic program risks and provide credible mitigations?"
                    ]
                  },
                  {
                    heading: "Outputs",
                    type: 'grid',
                    grid: [
                      { label: 'Primary Output', value: 'Written Red Team Report with prioritized findings' },
                      { label: 'Score Sheet', value: 'Section-by-section scores vs. Section M criteria' },
                      { label: 'Critical Findings', value: 'Items that will cost the award if not fixed' },
                      { label: 'Action Items', value: 'Specific revision taskers with owner and due date' }
                    ]
                  }
                ]
              },
              {
                label: "Gold Team Review",
                badge: "95–100% Complete",
                badgeColor: 'amber',
                sublabel: "Senior leadership approval — strategy, win themes, price authorization",
                summary: "Gold Team is not a line-edit. It's the final strategic review by decision-makers who verify the proposal tells a compelling story and that the price strategy is sound before submission.",
                content: [
                  {
                    heading: "What Is It?",
                    type: 'text',
                    body: "The Gold Team is the final senior leadership review of an essentially complete proposal. Unlike Pink (structure) and Red (compliance/quality), Gold focuses on the big picture: Are our win themes coherent throughout the document? Does the executive summary capture our best arguments? Is our price strategy competitive and defensible? Gold Team is the go/no-go for submission."
                  },
                  {
                    heading: "Required Inputs",
                    type: 'bullets',
                    items: [
                      "Near-final complete proposal (all volumes — 95%+ complete)",
                      "Red Team report and disposition (how were Red Team findings addressed?)",
                      "Executive summary draft",
                      "Pricing summary / price strategy memo",
                      "Price-to-win analysis and competitive price range",
                      "Final compliance matrix"
                    ]
                  },
                  {
                    heading: "Who Is Involved?",
                    type: 'bullets',
                    items: [
                      "Division VP or Business Unit President — ultimate decision authority for submission",
                      "BD Director or VP — validates customer relationship and strategic alignment",
                      "Capture Manager — briefs win strategy and key discriminators",
                      "Proposal Manager — presents proposal summary and compliance status",
                      "CFO / Finance — approves pricing and profit margins",
                      "Contracts VP — confirms pricing and terms are acceptable"
                    ]
                  },
                  {
                    heading: "What Gets Evaluated?",
                    type: 'bullets',
                    items: [
                      "Executive summary: Does it capture our three most compelling win themes clearly and compellingly?",
                      "Overall narrative: Does the proposal tell a coherent story, or does it read like sections written by different teams?",
                      "Price: Is our proposed price competitive? Does it reflect our PTW analysis? Are we leaving money on the table or pricing ourselves out?",
                      "Risk decisions: Are there any compliance gaps or risky technical commitments that require executive visibility?",
                      "Discriminators: Do our true differentiators shine through, or are they buried?"
                    ]
                  },
                  {
                    heading: "Outputs",
                    type: 'grid',
                    grid: [
                      { label: 'Primary Output', value: 'Submission authorization + final price approval' },
                      { label: 'Final Changes', value: 'Only executive-level strategic adjustments (not line editing)' },
                      { label: 'Timeline', value: '5-7 days before RFP due date' },
                      { label: 'After Gold', value: 'Production: formatting, pagination, final graphics, upload' }
                    ]
                  }
                ]
              },
              {
                label: "Price Review",
                badge: "Concurrent",
                badgeColor: 'blue',
                sublabel: "Cost/price volume — runs in parallel with technical volumes",
                summary: "Pricing is reviewed on a separate track from technical content. The Price Review validates that the proposed price is competitive (PTW), realistic (cost realism), and internally consistent with the technical approach.",
                content: [
                  {
                    heading: "What Is It?",
                    type: 'text',
                    body: "The Price Review is a dedicated review of the cost/price volume and pricing strategy, run by the pricing and finance team in parallel with technical volume development. It's not a single event — it\'s an ongoing discipline. The Price Review culminates at Gold Team with final price authorization."
                  },
                  {
                    heading: "What Gets Reviewed?",
                    type: 'bullets',
                    items: [
                      "Price-to-Win alignment: Is our proposed price consistent with our PTW analysis and competitive price range?",
                      "Cost realism: Can the government challenge our costs as unrealistically low? (A risk on cost-type contracts — the government may evaluate your ability to actually perform at your proposed cost)",
                      "Internal consistency: Does the price volume reflect the staffing, materials, and approach described in the technical volume?",
                      "Labor category rates: Are LCAT rates in line with market data and DCAA-approved forward pricing rates?",
                      "Wrap rates: Are indirect cost rates (fringe, overhead, G&A) current and supported by FPRA or provisional rates?",
                      "Assumptions: Are pricing assumptions documented and defensible? Will they hold up in negotiations?",
                      "Fee/profit: Is the proposed fee appropriate for the contract type and risk level? Is it competitive?"
                    ]
                  },
                  {
                    heading: "Who Is Involved?",
                    type: 'bullets',
                    items: [
                      "Pricing Manager / Cost Volume Lead — owns the cost build and narrative",
                      "PTW Analyst — validates price against competitive intelligence",
                      "Finance / Controller — verifies rates are current and approved",
                      "Contracts — ensures price narrative meets Section L requirements and is ready for negotiations",
                      "CFO / BD VP — final price approval authority at Gold Team"
                    ]
                  },
                  {
                    heading: "Outputs",
                    type: 'grid',
                    grid: [
                      { label: 'Primary Output', value: 'Approved cost/price volume + pricing strategy memo' },
                      { label: 'Decision', value: 'Final price position approved by CFO/VP' },
                      { label: 'Risk Item', value: 'Price too high → loses on cost; too low → margin destruction or future claim' },
                      { label: 'Post-Award', value: 'Pricing assumptions become the basis for contract negotiations' }
                    ]
                  }
                ]
              }
            ]
          },
          {
            type: 'tip',
            heading: "The Ghost-Discriminate-Prove Framework",
            body: "Structure every key proposal section using three elements: (1) Ghost — hint at why your competitor\'s approach is riskier (\"Unlike approaches relying on commercial hardware not designed for military environments...\"). (2) Discriminate — state your advantage clearly (\"Our MIL-SPEC hardened components provide 3× the MTBF of commercial equivalents\"). (3) Prove — evidence that backs your claim (\"demonstrated on Contract #: X, achieving 99.7% availability in deployed conditions\")."
          },
          {
          type: 'text' as const,
          level: 'intermediate' as const,
          heading: 'Running an Effective Color Review',
          body: 'Mid-career capture managers know that the value of a color review is entirely dependent on the quality of the reviewers and the specificity of the feedback. Pink Team: bring in functional experts (finance, technical, past performance) who are not on the proposal team — they catch assumptions the team has normalized. Red Team: requires evaluators who can simulate the government SSEB — ideally former contracting officers or program managers who have run source selections. The most common failure mode: Red Teams staffed with company employees who are reluctant to give negative feedback. Fix this by bringing in external Red Team members, pre-briefing reviewers on the evaluation criteria, and requiring scores on each factor using the adjectival rating scale the government will use.',
        },
        {
          type: 'callout' as const,
          level: 'advanced' as const,
          heading: 'Win Strategy Architecture: From Theme to Section M Score',
          body: 'Senior capture professionals build win strategies backwards from Section M. For each evaluation factor, ask: what would an Outstanding/Blue rating require? Then work backwards to the proposal section: what text, graphics, and proof points substantiate that claim? Then work backwards to the solution: does our technical approach actually deliver what an Outstanding rating requires? If the answer is no, the problem is the solution — not the proposal. This "Section M backwards" discipline exposes the gap between what the proposal team wants to claim and what the technical team can actually deliver. Close that gap before the proposal starts, not during the Red Team. The most elegant proposal for a mediocre solution still loses.',
        },
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
            explanation: "Ghosting is a legal and ethical proposal technique where you allude to competitor weaknesses without naming them. For example: \"Unlike approaches that rely on a single vendor for critical components, our multi-source supply chain mitigates delivery risk.\" This plants a risk concern in the evaluator\'s mind about competitors without direct attacks."
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
            explanation: "The executive summary is often the only section read by senior evaluators and the SSA. If your win themes and discriminators aren\'t clear in the executive summary, they may never be seen. Senior leadership reads exec summaries; technical evaluators read the volumes. Write for both audiences, but get the exec summary right first."
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
      },
      {
        id: 'capture-3',
        title: 'Section L vs Section M — The RFP Anatomy Every Competitor Must Master',
        duration: '28 min',
        description: 'Understand the difference between Section L (instructions) and Section M (evaluation criteria), how to structure a winning proposal around Section M, and the difference between LPTA and best-value acquisitions.',
        keyTerms: [
          { term: 'Section L', definition: 'Instructions, Conditions, and Notices to Offerors — the format and packaging rules for your proposal.' },
          { term: 'Section M', definition: 'Evaluation Factors for Award — the scoring rubric the government uses to evaluate proposals.' },
          { term: 'SSEB', definition: 'Source Selection Evaluation Board — the government evaluators who score proposals against Section M criteria.' },
          { term: 'Strength', definition: 'An aspect of a proposal that exceeds requirements and provides a documented benefit to the government.' },
          { term: 'LPTA', definition: 'Lowest Price Technically Acceptable — award goes to lowest price that meets minimum technical standards.' },
          { term: 'Best Value', definition: 'An acquisition approach where technical superiority can justify a higher price.' },
          { term: 'Outstanding', definition: 'Highest adjectival rating — exceptional strengths, very low risk of unsuccessful performance.' },
          { term: 'Acceptable', definition: 'Meets requirements but has no strengths. Often a losing rating in competitive fields.' },
        ],
        content: [
          {
            type: 'text',
            heading: 'Why L and M Are the Two Most Important Pages in Any RFP',
            body: "Every federal solicitation is organized by the Uniform Contract Format (UCF) from FAR Part 15. Most sections describe requirements — Sections L and M are different. They describe HOW the government will evaluate and select the winner. Winning proposals are built from M backward through L. Losing proposals are built from the SOW forward and hope M matches."
          },
          {
            type: 'expandable_list',
            heading: 'Section L — Instructions, Conditions, and Notices to Offerors',
            body: 'Section L is the "how to turn in your homework" document. It governs format, not content.',
            expandableItems: [
              {
                label: 'What Section L IS',
                badge: 'Procedural',
                badgeColor: 'blue',
                sublabel: 'The proposal packaging and format instructions',
                summary: 'Section L tells offerors exactly what to submit, how to format it, and how long it can be. Violating it can get your proposal rejected without evaluation.',
                content: [
                  { type: 'bullets', items: [
                    '"Volume I — Technical Approach, not to exceed 50 pages, 12pt Times New Roman, 1-inch margins"',
                    '"Volume II — Management Approach, not to exceed 25 pages"',
                    '"Volume III — Past Performance, provide up to 3 references using the government-provided form"',
                    '"Volume IV — Price/Cost, no page limit, must include completed DD Form 1423 (CDRLs)"',
                    '"All volumes must be submitted via SAM.gov by 4:00 PM EST on [date]"',
                  ]},
                  { type: 'warning', body: 'Section L compliance is binary. A proposal violating page limits, font requirements, or missing required forms can be rejected as non-responsive WITHOUT evaluation. The CO generally has no discretion to waive administrative non-compliance.' },
                  { type: 'grid', grid: [
                    { label: 'Page Count Trap', value: 'Government counts pages differently. Know what "page" means in this specific L.' },
                    { label: 'Exhibit Counting', value: 'Some Ls say figures and tables count toward page limits. Others exclude them. Read carefully.' },
                    { label: 'Font Rules', value: 'Many Ls say "12pt minimum in all body text." Know whether headers and captions are exempt.' },
                    { label: 'Responsive vs Compliant', value: '"Responsive" = meets submission requirements. "Compliant" = meets technical requirements. You must be both.' },
                  ]}
                ]
              },
              {
                label: 'The Most Common Proposal Mistake: Confusing L with M',
                badge: 'Warning',
                badgeColor: 'red',
                sublabel: 'Section L does not tell you what the government wants to evaluate',
                summary: 'Section L only controls proposal format. Section M controls what is scored. If you write to L without reading M, you are guessing.',
                content: [
                  { type: 'bullets', items: [
                    'Section L says: "Describe your staffing plan." Section M says staffing is NOT an evaluation factor. Your staffing section will be read for compliance only, not scored. Keep it short.',
                    'Section L says: "Describe your technical approach." Section M has three sub-factors: Innovation (15%), Risk Mitigation (25%), Schedule Realism (20%). Your technical approach must address each sub-factor with sub-headers that mirror M language.',
                    'Winning proposals use M as the writing guide and L as the compliance checklist.',
                  ]}
                ]
              },
            ]
          },
          {
            type: 'expandable_list',
            heading: 'Section M — Evaluation Factors for Award',
            body: 'Section M is the scoring rubric. Build your entire proposal architecture from M backward.',
            expandableItems: [
              {
                label: 'What Section M IS',
                badge: 'Most Important',
                badgeColor: 'red',
                sublabel: 'The scoring rubric — what the SSEB grades you on',
                summary: 'Section M defines the factors, sub-factors, and relative order of importance the SSEB uses to evaluate proposals. FAR 15.304 requires this transparency.',
                content: [
                  { type: 'grid', grid: [
                    { label: 'Factor 1 — Technical (Most Important)', value: '1.1: Understanding of Requirements; 1.2: Technical Solution; 1.3: Risk Mitigation' },
                    { label: 'Factor 2 — Management (Equal to Past Perf)', value: '2.1: Program Management Plan; 2.2: Key Personnel; 2.3: Transition Plan' },
                    { label: 'Factor 3 — Past Performance (Equal to Mgmt)', value: 'Relevance and quality of recent similar contracts.' },
                    { label: 'Factor 4 — Price (Not Scored)', value: 'Evaluated for reasonableness and realism. Not rated on a scale.' },
                  ]},
                  { type: 'tip', body: 'Mirror Section M factor structure as your proposal section headers. Evaluators use M as a checklist — matching your headers to their factors makes it easy to credit your strengths.' }
                ]
              },
              {
                label: 'Adjectival Ratings: Outstanding to Unacceptable',
                badge: 'Know These Cold',
                badgeColor: 'green',
                sublabel: 'How the SSEB scores your proposal',
                summary: 'The government uses adjectival ratings, not numeric scores. Understanding these drives how you write.',
                content: [
                  { type: 'grid', grid: [
                    { label: 'Outstanding', value: 'Exceptional strengths significantly benefiting the government. Very low risk. Requires multiple Strengths, zero Weaknesses.' },
                    { label: 'Good', value: 'Thorough approach. At least one Strength. Low risk.' },
                    { label: 'Acceptable', value: 'Meets requirements. No strengths, no significant weaknesses. Moderate risk.' },
                    { label: 'Marginal / Unacceptable', value: 'Fails to meet requirements. Has Significant Weaknesses or Deficiencies.' },
                  ]},
                  { type: 'warning', body: '"Acceptable" is a losing rating in a competitive field. When all offerors are Acceptable, price wins. You must write to earn Strengths — aspects that EXCEED requirements with documented, quantifiable benefit to the government.' },
                  { type: 'bullets', items: [
                    'A Strength must EXCEED the requirement. "We will provide monthly status reports" meets a requirement. "We will provide a real-time dashboard with threshold alerts 48 hours before a schedule variance becomes actionable" earns a Strength.',
                    'Strengths must be documented — evaluators can only credit what they can see and quote.',
                    'Use the Government exact M language as section headers.',
                    'Each sub-factor needs at least one discriminating element your competitors cannot match.',
                  ]}
                ]
              },
              {
                label: 'Best Value vs. LPTA — Two Completely Different Strategies',
                badge: 'Strategy',
                badgeColor: 'purple',
                sublabel: 'The evaluation method determines your entire bid strategy',
                summary: 'Whether the government uses best-value tradeoff or LPTA is stated in Section M and drives your pricing strategy as much as cost estimating.',
                content: [
                  { type: 'grid', grid: [
                    { label: 'Best Value Tradeoff', value: 'Technical superiority CAN justify a higher price. SSA decides if the premium is worth it. Strategy: be technically outstanding and price competitively.' },
                    { label: 'LPTA', value: 'Once minimum technical standards are met, lowest price wins. Strategy: price wins everything — do not over-invest in technical differentiation.' },
                    { label: 'LPTA Warning', value: 'DoD has reduced LPTA usage since 2017 NDAA because it rewards lowest cost over best capability. Know when to challenge an inappropriate LPTA determination.' },
                    { label: 'Best Value Warning', value: 'A $10M technical premium is only worth it if the SSA believes it provides more than $10M in benefit. Know your Price to Win.' },
                  ]}
                ]
              },
            ]
          },
          {
            type: 'tip',
            heading: 'The Winning Proposal Process',
            body: 'Step 1: Read M first — identify every factor, sub-factor, and order of importance. Step 2: Build outline from M factors as section structure. Step 3: For each M sub-factor, draft 1-3 discriminating points. Step 4: Use L page limits to size investment — more pages to higher-weighted factors. Step 5: Compliance-check against L before submission.'
          },
          {
          type: 'text' as const,
          level: 'intermediate' as const,
          heading: 'Using Section L as a Compliance Matrix, Not Just Instructions',
          body: 'Mid-career proposal managers build their proposal outline directly from Section L — every instruction becomes a heading, every deliverable requirement becomes a checklist item. But the compliance matrix is the floor, not the ceiling. The government wrote Section L to describe the minimum information needed; it didn\'t write it to describe a winning proposal. After ensuring 100% Section L compliance, ask: what information would a SSEB evaluator want that Section L didn\'t require? Discriminating proposals add value beyond compliance. The most common mid-career error: a proposal that is perfectly compliant but says nothing that an Outstanding evaluator would score above Acceptable. Compliance is table stakes; evaluation excellence is the goal.',
        },
        {
          type: 'callout' as const,
          level: 'advanced' as const,
          heading: 'Section M as a Negotiating Document — Shaping Evaluation Criteria Pre-RFP',
          body: 'Senior BD professionals know that the best time to influence Section M is before the RFP is released. Industry Days, RFIs, and pre-solicitation meetings are opportunities to educate the government program office on what evaluation criteria will produce the best outcome. If you have a capability that competitors lack — a proven management approach, unique past performance, specific technical solution — you want the evaluation criteria to reward it. This is legal and expected; government contracting officers solicit industry input on acquisition strategy specifically because they lack full market knowledge. The line: you can advocate for evaluation criteria that discriminate on merit. You cannot suggest criteria designed to exclude a specific competitor by name or criteria that only your company could meet.',
        },
        ],
      quiz: [
          {
            id: 'q1',
            question: 'Which section of the RFP contains the evaluation factors and their relative order of importance?',
            options: ['Section C (Description/Specification)', 'Section L (Instructions to Offerors)', 'Section M (Evaluation Factors for Award)', 'Section H (Special Contract Requirements)'],
            correct: 2,
            explanation: 'Section M — Evaluation Factors for Award — is required by FAR 15.304 to disclose all evaluation factors, significant sub-factors, and their relative order of importance. This is the scoring rubric.'
          },
          {
            id: 'q2',
            question: 'A proposal that violates Section L page limits can be:',
            options: ['Penalized with a lower technical rating', 'Rejected as non-responsive without evaluation', 'Accepted with a CO waiver', 'Evaluated only for the compliant portions'],
            correct: 1,
            explanation: 'Administrative non-compliance with Section L typically results in rejection as non-responsive. The CO generally has no discretion to waive these requirements in a competitive source selection.'
          },
          {
            id: 'q3',
            question: 'What is an "Outstanding" adjectival rating?',
            options: ['A proposal meeting all requirements with no weaknesses', 'A proposal with exceptional strengths significantly benefiting the government and very low risk', 'A proposal with one strength and no weaknesses', 'The highest price-to-performance proposal'],
            correct: 1,
            explanation: 'Outstanding requires exceptional strengths (plural) that significantly benefit the government, very low risk of unsuccessful performance. It requires benefits well above threshold requirements.'
          },
          {
            id: 'q4',
            question: 'Under LPTA, which proposal wins?',
            options: ['The technically superior proposal', 'The best value tradeoff between technical and price', 'The lowest-priced proposal that meets minimum technical requirements', 'The proposal with the highest past performance rating'],
            correct: 2,
            explanation: 'LPTA awards to the lowest-priced technically acceptable proposal. Once technical acceptability is established, only price matters — fundamentally different from best-value tradeoff.'
          },
          {
            id: 'q5',
            question: 'The best practice for structuring a proposal in best-value source selection is to:',
            options: ['Follow the SOW section by section', 'Mirror Section L volume structure only', 'Mirror Section M factor/sub-factor structure as the proposal outline', 'Use the company standard proposal template'],
            correct: 2,
            explanation: 'Winning proposals mirror Section M factor and sub-factor structure in section headers. This makes it easy for evaluators to find and credit strengths. Section L defines the container; Section M defines the content architecture.'
          },
        ],
      },
    {
      id: 'capture-4',
      title: 'Source Selection — From Solicitation to Award Decision',
      duration: '25 min',
      type: 'lesson' as const,
      description: 'Understand the government source selection process from the inside — roles, evaluation phases, discussions, and the award decision — essential knowledge for both government PMs and industry capture teams.',
      content: [
        {
          type: 'text' as const,
          heading: 'How the Government Picks a Winner: The Source Selection Process',
          body: 'Source selection is the formal government process for evaluating competitive proposals and making a contract award decision. It is governed by FAR Part 15 and, for DoD, supplemented by the DoD Source Selection Procedures (2016). Understanding this process from the GOVERNMENT side is essential for both government PMs (who participate in it) and industry professionals (who must build proposals that work within it).',
        },
        {
          type: 'expandable_list' as const,
          heading: 'Key Roles in Source Selection',
          expandableItems: [
              {
                label: 'Source Selection Authority (SSA)',
                sublabel: 'The decision maker',
                badge: 'Decision Maker',
                badgeColor: 'red',
                summary: 'The SSA is the official who makes the final award decision. They review the SSAC recommendation and must document their independent judgment.',
                content: [
                  { type: 'text' as const, body: 'The SSA is typically a senior official — for major acquisitions, a General Officer, SES, or Program Executive Officer. The SSA reviews the Source Selection Advisory Council (SSAC) recommendation, the SSEB findings, and the price evaluation, then makes an independent, documented best-value tradeoff decision documented in the Source Selection Decision Document (SSDD).' },
                  {
                    type: 'bullets' as const,
                    title: 'SSA Responsibilities',
                    items: [
                      'Appoint the SSEB Chair and SSAC Chair',
                      'Approve the Source Selection Plan before solicitation release',
                      'Review the SSAC recommendation (may accept, reject, or modify)',
                      'Sign the Source Selection Decision Document (SSDD)',
                      'The SSDD is the legal basis for the award — it must be defensible in a protest',
                    ],
                  },
                ],
              },
              {
                label: 'Source Selection Evaluation Board (SSEB)',
                sublabel: 'The technical evaluators who score proposals',
                badge: 'Evaluators',
                badgeColor: 'blue',
                summary: 'The SSEB is the team of technical and management SMEs who evaluate proposal volumes against Section M criteria and assign adjectival ratings.',
                content: [
                  { type: 'text' as const, body: 'The SSEB is organized into evaluation teams, typically one per factor (Technical, Management, Past Performance). Each team identifies Strengths, Weaknesses, Deficiencies, and Significant Weaknesses, and assigns factor-level ratings. The SSEB Chair compiles a Proposal Evaluation Report (PER) summarizing all findings.' },
                  {
                    type: 'grid' as const,
                    title: 'SSEB Finding Types',
                    items: [
                      { label: 'Strength', value: 'Exceeds contract requirements and benefits the government. Must be documented and quantified.' },
                      { label: 'Weakness', value: 'A flaw increasing risk of unsuccessful performance. May be correctable in discussions.' },
                      { label: 'Significant Weakness', value: 'Appreciably increases risk of unsuccessful performance. Can prevent Outstanding or Good rating.' },
                      { label: 'Deficiency', value: 'A material failure to meet a requirement or combination of significant weaknesses creating unacceptable risk.' },
                    ],
                  },
                ],
              },
              {
                label: 'Source Selection Advisory Council (SSAC)',
                sublabel: 'The senior review body that recommends award to the SSA',
                badge: 'Advisory',
                badgeColor: 'green',
                summary: 'The SSAC reviews SSEB evaluation findings, price evaluation results, conducts the comparative tradeoff analysis, and provides a written recommendation to the SSA.',
                content: [
                  { type: 'text' as const, body: 'The SSAC does not re-score proposals — it uses the SSEB ratings. The SSAC\'s job is the tradeoff: given all ratings and prices, which offeror represents best value? The SSAC must document why paying more (or less) is warranted. Their recommendation goes to the SSA but is not binding.' },
                ],
              },
              {
                label: 'Contracting Officer (CO)',
                sublabel: 'The only person with authority to bind the government',
                badge: 'Legal Authority',
                badgeColor: 'purple',
                summary: 'The CO manages the solicitation process, conducts discussions, and executes the contract. Only the CO can make legally binding commitments.',
                content: [
                  { type: 'text' as const, body: 'The CO is responsible for the integrity and legality of the source selection. Key CO actions: release the solicitation, issue amendments, manage Q&A periods, determine competitive range, conduct discussions, request Final Proposal Revisions (FPRs), and execute the award. The CO manages procurement integrity — responsible for ensuring evaluation information is not leaked.' },
                ],
              },
            ],
          },
          {
            type: 'expandable_list' as const,
            heading: 'The Source Selection Timeline',
            expandableItems: [
              {
                label: 'Phase 1: Pre-Solicitation',
                sublabel: 'Market research, requirements definition, Source Selection Plan',
                badge: 'Planning',
                badgeColor: 'blue',
                summary: 'The government defines requirements, conducts market research (RFIs, industry days), develops the acquisition strategy, and drafts the Source Selection Plan before releasing the solicitation.',
                content: [
                  {
                    type: 'bullets' as const,
                    title: 'Pre-Solicitation Actions',
                    items: [
                      'Market Research: RFI releases, industry days, one-on-one meetings (within procurement integrity rules)',
                      'Acquisition Strategy: Contract type, competition approach, sole source justification (if any)',
                      'Source Selection Plan (SSP): SSA approves the SSP — defines factors, sub-factors, weights, rating scales, and the evaluation process BEFORE solicitation release',
                      'Draft RFP (DRFP): Government may release a DRFP for industry comment before the final RFP',
                      'Synopsis: Required FAR 5.203 notice on SAM.gov at least 15 days before solicitation release',
                    ],
                  },
                ],
              },
              {
                label: 'Phase 2: Solicitation and Proposal Preparation',
                sublabel: 'RFP release through proposal due date',
                badge: 'Solicitation',
                badgeColor: 'green',
                summary: 'The government releases the RFP and offerors prepare proposals. Q&As and amendments may modify requirements during this period.',
                content: [
                  {
                    type: 'bullets' as const,
                    title: 'Solicitation Phase Actions',
                    items: [
                      'RFP Release: Full solicitation posted to SAM.gov. Sections L, M, C, H, I, J all released simultaneously',
                      'Pre-Proposal Conference: Government may hold a conference to answer questions (not always conducted)',
                      'Q&A Period: Written questions answered via amendment distributed to ALL offerors — no private answers',
                      'Amendments: Any change to the RFP requires a formal amendment. Significant amendments may extend the due date',
                      'Industry is prohibited from contacting SSEB members during this period (procurement integrity)',
                    ],
                  },
                ],
              },
              {
                label: 'Phase 3: Evaluation',
                sublabel: 'SSEB evaluates proposals and assigns ratings',
                badge: 'Evaluation',
                badgeColor: 'yellow',
                summary: 'The SSEB evaluates proposals against Section M criteria. This phase is strictly government-only — all source selection information is protected.',
                content: [
                  {
                    type: 'bullets' as const,
                    title: 'Evaluation Phase Actions',
                    items: [
                      'Initial Proposal Evaluation: SSEB teams evaluate each volume, document Strengths/Weaknesses/Deficiencies',
                      'Competitive Range Determination: CO may exclude proposals with no realistic chance of award (FAR 15.306)',
                      'Notice to Excluded Offerors: Eliminated offerors notified and may request a pre-award debrief',
                      'Price/Cost Analysis: Price reasonableness and cost realism review (for cost-type contracts)',
                    ],
                  },
                ],
              },
              {
                label: 'Phase 4: Discussions (If Opened)',
                sublabel: 'ENs, clarifications, and competitive range negotiations',
                badge: 'Discussions',
                badgeColor: 'orange',
                summary: 'Discussions are negotiations between the government and offerors in the competitive range. If the government holds discussions with one offeror, they must hold discussions with ALL in the competitive range.',
                content: [
                  { type: 'text' as const, body: 'The CO must inform each offeror of Deficiencies, Significant Weaknesses, and adverse past performance information. The government CANNOT tell one offeror what another offeror offered. Discussion techniques include Evaluation Notices (ENs). After discussions, the government issues a request for Final Proposal Revisions (FPRs).' },
                  {
                    type: 'grid' as const,
                    title: 'Discussions vs. Clarifications',
                    items: [
                      { label: 'Clarifications', value: 'Limited exchanges to resolve ambiguities. Do NOT open the door to proposal revisions. Used when the government decides NOT to hold discussions.' },
                      { label: 'Discussions (Negotiations)', value: 'Full exchanges — offerors can revise price, technical, management, and past performance volumes. Results in FPR request.' },
                      { label: 'Evaluation Notice (EN)', value: 'Written question from SSEB to offeror during discussions. Must address all Deficiencies and Significant Weaknesses.' },
                      { label: 'Final Proposal Revision (FPR)', value: 'The final document submitted after discussions. This is what gets evaluated, not the original proposal.' },
                    ],
                  },
                ],
              },
              {
                label: 'Phase 5: Award and Debrief',
                sublabel: 'SSDD signature through post-award debrief',
                badge: 'Award',
                badgeColor: 'red',
                summary: 'The SSA signs the SSDD, the CO executes the contract, and unsuccessful offerors are entitled to a debrief.',
                content: [
                  {
                    type: 'bullets' as const,
                    title: 'Award and Post-Award Actions',
                    items: [
                      'SSAC Recommendation: SSAC provides written best-value tradeoff recommendation to SSA',
                      'Source Selection Decision Document (SSDD): SSA signs, documenting independent best-value rationale',
                      'Contract Execution: CO executes — award notice posted to SAM.gov',
                      'Unsuccessful Offeror Notifications: Required within 3 days of award (FAR 15.503)',
                      'Debriefs (FAR 15.506): Mandatory if requested within 3 days of notification. Government must reveal your ratings, strengths/weaknesses, and award rationale.',
                      'GAO Protests: Unsuccessful offerors may protest to GAO within 10 days of debrief. CO issues a stay of performance pending outcome.',
                    ],
                  },
                ],
              },
            ],
          },
        {
          type: 'text' as const,
          level: 'intermediate' as const,
          heading: 'Debriefs as Competitive Intelligence: Maximizing the Post-Award Debrief',
          body: 'Mid-career capture professionals treat every debrief — win or lose — as the most valuable data point in their next proposal. In a post-award debrief, the government must reveal: your adjectival ratings by factor, the awardee\'s ratings by factor (not their scores), significant strengths and weaknesses identified in your proposal, and the overall rationale for the best-value determination. From this data, you can reconstruct: what exactly did you score as a weakness that you thought was a strength? Where did the awardee outperform you? Was it price, technical, or past performance? Build a debrief data log — track every weakness across all debriefs. If you see the same weakness cited on three consecutive proposals, you have a systemic capability gap, not a proposal writing problem.',
        },
        {
          type: 'callout' as const,
          level: 'advanced' as const,
          heading: 'GAO Protest Strategy: When to Protest and When Not To',
          body: 'Senior BD executives make protest decisions based on a structured analysis, not emotional reaction to a loss. Protest when: (1) the government made a clear evaluation error that is documented in the debrief (wrong ratings, failure to apply stated criteria, unequal treatment); (2) the protest has a reasonable probability of sustaining (GAO sustains ~15-20%); (3) the contract value justifies the cost and disruption of a protest (typically $20M+); (4) a corrective action by the government (re-evaluation or re-solicitation) would change the outcome. Don\'t protest when: the government made the right decision and your proposal genuinely lost on the merits; the protest is designed to delay performance rather than win the contract. GAO protests are public record — a pattern of losing protests without sustaining damages your reputation with government customers.',
        },
      ],
      quiz: [
            {
              id: 'q1',
              question: 'Who makes the final award decision in a source selection?',
              options: ['The SSEB Chair', 'The Contracting Officer (CO)', 'The Source Selection Authority (SSA)', 'The SSAC Chair'],
              correct: 2,
              explanation: 'The SSA makes the final award decision and signs the SSDD. The SSAC provides a recommendation, but the SSA makes an independent judgment. The CO executes the contract but does not make the selection decision.',
            },
            {
              id: 'q2',
              question: 'If the government holds discussions with one offeror in the competitive range, they must:',
              options: ['Hold discussions with all offerors in the competitive range', 'Notify only the offeror with the lowest price', 'Issue a sole source amendment', 'Close the solicitation and restart'],
              correct: 0,
              explanation: 'FAR 15.306 requires that if discussions are held with any offeror in the competitive range, the government must hold discussions with ALL offerors in the competitive range. Selective discussions would provide an unfair advantage.',
            },
            {
              id: 'q3',
              question: 'An Evaluation Notice (EN) issued during discussions must address:',
              options: ['Only price issues', 'Only strengths', 'All deficiencies and significant weaknesses identified by the SSEB', 'Administrative corrections only'],
              correct: 2,
              explanation: 'FAR 15.306(d) requires the CO to inform each offeror of all Deficiencies, Significant Weaknesses, and adverse past performance information. ENs are the mechanism for this.',
            },
            {
              id: 'q4',
              question: 'How many days after award notification does an offeror have to request a post-award debrief?',
              options: ['3 calendar days', '10 calendar days', '30 calendar days', '60 calendar days'],
              correct: 0,
              explanation: 'Under FAR 15.506, an unsuccessful offeror must request a debrief within 3 days of receiving the award notification. Missing this deadline waives the right to a mandatory debrief.',
            },
            {
              id: 'q5',
              question: 'A "competitive range determination" is used to:',
              options: ['Set the price range for negotiations', 'Exclude proposals with no realistic chance of award before discussions', 'Rank proposals by price', 'Determine which evaluation factors are most important'],
              correct: 1,
              explanation: 'A competitive range determination (FAR 15.306(c)) allows the CO to exclude proposals with no reasonable chance of selection, streamlining the evaluation process. Excluded offerors receive notification and the right to request a pre-award debrief.',
            },
      ],
      keyTerms: [
        { term: 'SSA', definition: 'Source Selection Authority — the official who makes the final award decision and signs the Source Selection Decision Document.' },
        { term: 'SSEB', definition: 'Source Selection Evaluation Board — the team of technical and management SMEs who evaluate proposals and assign adjectival ratings.' },
        { term: 'SSAC', definition: 'Source Selection Advisory Council — the senior body that reviews SSEB findings, conducts tradeoff analysis, and recommends an award to the SSA.' },
        { term: 'SSDD', definition: 'Source Selection Decision Document — the signed document where the SSA documents the best-value rationale for the award decision.' },
        { term: 'EN', definition: 'Evaluation Notice — a written question from the SSEB to an offeror during discussions, required to address all Deficiencies and Significant Weaknesses.' },
        { term: 'FPR', definition: 'Final Proposal Revision — the revised proposal submitted by offerors after discussions are closed, which is the basis for final evaluation.' },
        { term: 'Competitive Range', definition: 'The set of proposals with a realistic chance of award. The CO may exclude proposals outside the competitive range before discussions.' },
        { term: 'SSP', definition: 'Source Selection Plan — the document approved by the SSA before solicitation release that defines evaluation factors, weights, rating scales, and the evaluation process.' },
      ],
    },
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
            body: "Every defense program operates in an environment of uncertainty — technical risks, schedule risks, funding risks, and supply chain risks. The best Program Managers don\'t avoid risk; they manage it systematically. DoD's Risk, Issue, and Opportunity (RIO) Management Guide provides the framework. Integrating risk management into every program review — not just as a standalone briefing — is the mark of a mature program office."
          },
          {
            type: 'formula',
            heading: "Risk Assessment Matrix",
            formula: 'Risk Level = Probability × Impact\nHigh Risk: P ≥ 50% AND Impact ≥ 3 (on 5-point scale)\nMedium Risk: P 20-49% OR Impact = 2-3\nLow Risk: P < 20% AND Impact ≤ 2',
            explanation: "Use a 5×5 risk matrix (Probability: 1-5, Impact: 1-5) to plot and prioritize risks. Focus mitigation resources on high-probability, high-impact risks first. Track risk burn-down over time as a program health indicator."
          },
          {
            type: 'table',
            heading: '5×5 Risk Matrix — DoD Standard (Score = Probability × Impact)',
            headers: ['Probability ↓  /  Impact →', 'Impact 1 (Minimal)', 'Impact 2 (Minor)', 'Impact 3 (Moderate)', 'Impact 4 (Significant)', 'Impact 5 (Critical)'],
            rows: [
              ['P=5  Near Certain (>80%)',  '🟡 5 — MED',  '🟠 10 — HIGH', '🔴 15 — HIGH', '🔴 20 — HIGH', '🔴 25 — HIGH'],
              ['P=4  Likely (61–80%)',       '🟡 4 — MED',  '🟡 8 — MED',   '🟠 12 — HIGH', '🔴 16 — HIGH', '🔴 20 — HIGH'],
              ['P=3  Possible (41–60%)',     '🟢 3 — LOW',  '🟡 6 — MED',   '🟡 9 — MED',   '🟠 12 — HIGH', '🔴 15 — HIGH'],
              ['P=2  Unlikely (21–40%)',     '🟢 2 — LOW',  '🟢 4 — LOW',   '🟡 6 — MED',   '🟡 8 — MED',   '🟠 10 — HIGH'],
              ['P=1  Remote (≤20%)',         '🟢 1 — LOW',  '🟢 2 — LOW',   '🟢 3 — LOW',   '🟡 4 — MED',   '🟡 5 — MED'],
            ]
          },
          {
            type: 'tip',
            heading: 'Reading the Matrix — Real Program Examples',
            body: 'GREEN (Low, 1–4): Monitor only — log in risk register, review quarterly. Example: mild weather delay on a outdoor test range. YELLOW (Medium, 5–9): Develop mitigation plan with assigned owner and due date. Example: single-source supplier for a critical subcomponent. RED (High, 10–25): Immediate PM attention — active mitigation, management reserve may be needed, brief MDA at next program review. Example: key technology not yet at TRL 6 entering EMD, or contractor staffing 20% below plan on critical path tasks.'
          },
          {
            type: 'table',
            heading: 'Sample Risk Register — Active Program Risks',
            headers: ['Risk ID', 'Description', 'P', 'I', 'Score', 'Level', 'Mitigation', 'Owner'],
            rows: [
              ['R-001', 'Key subcontractor (radar ASIC) sole-source; no second source qualified', '4', '5', '20', '🔴 HIGH', 'Qualify alternate supplier by CDR; hold 3% MR', 'CO / COR'],
              ['R-002', 'Software TRL 5 at MS B; target TRL 7 by PDR not achieved', '3', '4', '12', '🟠 HIGH', 'Add 6-week software sprint; daily stand-up with SE', 'PM / SE'],
              ['R-003', 'O&M funds may be swept in CR; test range unavailable', '3', '3', '9', '🟡 MED',  'Identify alternate test window; brief FM on funding risk', 'FM / PM'],
              ['R-004', 'Key engineer departure risk (2 staff eligible for retirement)', '2', '4', '8', '🟡 MED',  'Knowledge transfer plan; retention bonus request to HR', 'Deputy PM'],
              ['R-005', 'Minor supplier late delivery on non-critical hardware', '2', '2', '4', '🟢 LOW',  'Monitor via DCMA weekly report; no action required', 'COR'],
            ]
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
          },
          {
          type: 'text' as const,
          level: 'intermediate' as const,
          heading: 'Running an Effective Risk Review Board',
          body: 'Mid-career PMs who run Risk Review Boards (RRBs) must transform the risk register from a compliance document into a decision-making tool. Common failure modes: risks rated identically month after month with no change in status; risk owners who attend RRBs without new data; mitigation plans with due dates perpetually pushed out. Fix this with three disciplines: (1) require each risk owner to bring updated probability and impact ratings with data justification — "I still rate this 3×3 because nothing has changed" is not acceptable; (2) close risks that have been mitigated with documented evidence; (3) escalate risks that haven\'t moved in 90 days — either they\'re not real risks, or they\'re not being worked. A 15-risk register where all 15 are "being monitored" is a risk register that has failed.',
        },
        {
          type: 'callout' as const,
          level: 'advanced' as const,
          heading: 'Opportunity Management and Risk Retirement: The Senior PM\'s Discipline',
          body: 'Senior PMs manage both risk AND opportunity — the asymmetric upside that is often neglected in risk-focused cultures. An opportunity is an event that, if it occurs, would reduce cost, accelerate schedule, or improve performance. Examples: a technology maturation faster than planned that allows an earlier CDR; a competitor\'s contract performance failure that opens a sole-source opportunity; a congressional add that funds an accelerated production ramp. Opportunities require the same rigor as risks: owner, probability, value, exploitation plan, and trigger event. Senior PMs also understand risk retirement — when a risk\'s trigger date has passed without occurrence, formally close it and release the associated Management Reserve. Programs that never retire risks over-hold Management Reserve and underreport program health.',
        },
        ],
      quiz: [
          {
            id: 'q1',
            question: "Management Reserve (MR) in a defense program is intended to:",
            options: [
              'Cover known, well-defined work that is already planned',
              'Fund identified risks and unforeseen events that affect the Performance Measurement Baseline',
              'Pay for program management overhead costs',
              "Supplement the contractor\'s profit on cost-plus contracts"
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
              "The contractor\'s fee on a cost-plus contract",
              'Reserve funding held by the contracting officer'
            ],
            correct: 1,
            explanation: "Undistributed Budget (UB) is budget within the program\'s Total Allocated Budget that has not yet been distributed to specific control accounts or work packages. It typically occurs when work scope is known but not yet formally assigned. UB must be distributed as planning progresses and cannot remain undistributed indefinitely."
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
            question: "When should Management Reserve (MR) typically be included in a program\'s budget?",
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
            heading: "The PM\'s Stakeholder Map",
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
            body: "The acquisition community is small. The Captain or Major you work with today is the Colonel or General you\'ll brief in 10 years. The GS-11 analyst across the table becomes the SES you\'ll be pitching your company to. Invest in every professional relationship — return calls, deliver on commitments, and be the person who solves problems rather than creates them."
          },
          {
          type: 'text' as const,
          level: 'intermediate' as const,
          heading: 'Managing Up: Briefing Flag Officers and SES Officials',
          body: 'Mid-career PMs who brief flag officers and SES officials must master a different communication register than the one they use with their team. Three rules for flag-level briefings: (1) State the problem in the first 30 seconds — senior leaders do not have patience for context-building before the issue; (2) Present no more than three options with a clear recommendation — decision makers who are given seven options with no recommendation will make no decision; (3) Know the difference between informing and deciding — some briefings are status updates, some require a decision. Be explicit about which one you\'re presenting. The most common mid-career failure: walking into a flag-level review to "provide an update" and leaving with no decision when a decision was urgently needed. Prepare your ask in advance.',
        },
        {
          type: 'callout' as const,
          level: 'advanced' as const,
          heading: 'Congressional Liaison: Protecting Your Program Through the Hill',
          body: 'Senior PMs on major programs interact with congressional staff, whether they realize it or not. The rules: (1) all congressional communications go through your legislative liaison office — never independently contact a congressional office; (2) Congressional Budget Justification Books (CBJB) are your primary public narrative — invest in them as carefully as you invest in milestone briefings, because Hill staffers read them; (3) Classified program briefs to HASC/SASC staff are opportunities to build program support — use them; (4) if your program receives a congressional mark (reduction, add, or fence), understand what drove it — usually either a performance concern that surfaced publicly or a constituent interest. Fix the performance concern; support the constituent interest where it aligns with program needs. Programs with strong Hill relationships consistently outperform programs that ignore Congress.',
        },
        ],
      quiz: [
          {
            id: 'q1',
            question: "A Critical Design Review (CDR) is typically conducted to:",
            options: [
              'Validate that system requirements are complete at the beginning of Engineering & Manufacturing Development',
              'Confirm the detailed design is sufficiently mature to proceed with production',
              "Approve the program\'s budget and schedule baseline at Milestone B",
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
              "Get PMP certified — it\'s the universal credential for PM roles at contractors",
              'Understand EVM — most contractor PM roles require EVMS knowledge',
              'Leverage LinkedIn: connect with BD managers, capture managers, and proposal professionals',
              'Join APMP (Association of Proposal Management Professionals) — excellent community',
            ]
          },
          {
            type: 'callout',
            heading: "Salary Expectations (2025 Market)",
            body: "Government Track: GS-11 ($58-76K), GS-12 ($70-91K), GS-13 ($83-108K), GS-14 ($98-127K), GS-15 ($115-150K) — plus excellent benefits, pension, and work-life balance. Contractor Track: Program Analyst ($65-85K), Senior Analyst ($85-120K), Program Manager ($110-160K), Capture Manager ($130-200K), VP BD ($180-300K+). The government-to-contractor transition typically brings a 20-40% salary increase."
          },
          {
          type: 'text' as const,
          level: 'intermediate' as const,
          heading: 'Mid-Career Positioning: Building Your Acquisition Credentials',
          body: 'Mid-career acquisition professionals need a deliberate portfolio strategy. The most valued combination for a GS-14/15 PM position: Defense Acquisition Workforce Improvement Act (DAWIA) Level III certification in Program Management, 4+ years of major program experience (ACAT I or II preferred), and a rotation through a contracting or finance function. Certifications alone are table stakes. Differentiators: (1) an assignment at a COCOM or joint organization that demonstrates cross-service experience; (2) a successful Milestone review as the PM — even as a deputy, being part of a Milestone B team is significant experience; (3) DAU resident course completion (PMT-401 or equivalent) — program managers who attended resident PMT are a separate tier from those who completed DAU online-only. Build the portfolio intentionally — random assignments lead to random careers.',
        },
        {
          type: 'callout' as const,
          level: 'advanced' as const,
          heading: 'The Senior Executive Path in Defense Acquisition: SES and PEO Roles',
          body: 'The path to Senior Executive Service (SES) or Program Executive Officer (PEO) in defense acquisition requires a deliberate strategy that most mid-career PMs don\'t start building early enough. The prerequisites: (1) at least one ACAT I program as PM or Deputy PM; (2) Joint Duty Assignment completion (required for senior civilian positions); (3) Senior Service College (SSC) attendance — Army War College, Naval War College, or equivalent. The SSC is not a checkbox; it is a community of future flag officers and senior executives who will be your peers for the next 20 years — build relationships deliberately; (4) SES candidate development programs (CDPs) — most services have CDPs that provide structured development, senior mentoring, and visibility to SES selection panels. Apply for CDPs 3-5 years before you want the SES position.',
        },
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
        description: "Master the government PM\'s role in overseeing subcontractor performance, flow-down requirements, and managing the prime-sub relationship.",
        keyTerms: [
          { term: 'SMP', definition: 'Subcontract Management Plan — a document detailing how the prime contractor will manage and oversee its subcontractors.' },
          { term: 'CPSR', definition: "Contractor Purchasing System Review — a DCMA audit of the prime contractor\'s purchasing/subcontracting system." },
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
            body: "As a government Program Manager, you have a legal relationship only with the prime contractor — not with its subcontractors. But that does not mean you ignore what happens below the prime. Subcontractor failures are the leading cause of program schedule slips and technical shortfalls. The PM\'s job is to ensure the prime has robust subcontract management processes, adequate oversight, and effective escalation paths when subcontractor issues arise. When a subcontractor misses a delivery, the prime is accountable to the government — period."
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
            body: "On cost-reimbursable contracts, the government\'s Contracting Officer must \"consent to subcontract\" before the prime can award subcontracts above certain thresholds (typically $1.5M for cost-type; higher for FFP). This consent process reviews the proposed subcontractor\'s cost or price reasonableness, qualifications, and competition. As PM, you should be aware of upcoming consent requests and ensure the CO has the technical information needed to make a sound decision quickly."
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
            body: "PMs who ignore the subcontractor tier until problems surface are consistently blindsided at critical program milestones. Establish a rhythm early: require the prime to brief subcontractor status at every monthly program review, demand SMP updates when critical subs change, and escalate immediately if the prime\'s sub oversight is inadequate. By the time a subcontractor failure becomes visible in the prime\'s IPMR, you\'re already 3-6 months behind on corrective action."
          },
          {
            type: 'list',
            heading: "How to Escalate Subcontractor Issues",
            items: [
              'Step 1: Identify the issue through prime reporting or DCMA surveillance — document in writing',
              'Step 2: Direct the prime PM (not the subcontractor directly) to develop a corrective action plan (CAP)',
              'Step 3: Set a hard CAP review deadline — 30 days maximum for critical issues',
              "Step 4: Evaluate the CAP's adequacy; if insufficient, escalate to the prime\'s senior management via the CO",
              'Step 5: If the prime fails to correct: formal cure notice or show cause letter issued by the Contracting Officer',
              'Step 6: Consult with legal and CO on contract remedies if pattern of non-performance continues',
            ]
          },
          {
          type: 'text' as const,
          level: 'intermediate' as const,
          heading: 'Managing Subcontractor Risk on Complex Defense Programs',
          body: 'Mid-career PMs on programs with significant subcontractor content must build government visibility into the subcontract tier — not just rely on the prime\'s reporting. Best practices: (1) require the prime\'s EVM system to include subcontractor EVM data for subcontracts over $20M (this is contractually required on programs with EVMS requirements); (2) attend quarterly subcontractor program reviews with the prime — as an observer, not a participant, to avoid a privity-of-contract issue; (3) include a subcontractor management section in the prime\'s Format 2 IPMR submissions so you can identify which organizational elements are driving variance. When a prime says "we have a subcontractor problem but we\'re managing it," your question should be: "show me the corrective action plan and the sub\'s EVM data."',
        },
        {
          type: 'callout' as const,
          level: 'advanced' as const,
          heading: 'Privity of Contract, Novation, and Corporate Transactions: When Your Contractor Changes',
          body: 'Senior PMs must understand what happens when their contractor is acquired, merges, or undergoes a corporate restructuring. The government has no contractual relationship with subcontractors (privity of contract); all rights run through the prime. When a prime is acquired: FAR 42.1200 requires a novation agreement — the government must consent to transfer of the contract to the successor entity. Without government consent, contract performance by the new entity is a contract violation. The novation process takes 60-180 days; during that window, the contractor is technically in breach. Manage this proactively: when you learn of a pending M&A transaction affecting your contractor, initiate the novation process immediately and get legal counsel involved. Corporate transactions also frequently trigger key personnel departures — require the prime to brief you on retention plans for key personnel before the acquisition closes.',
        },
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
            explanation: "The government\'s contractual relationship is with the prime contractor only. The PM should direct the prime — not the subcontractor — to address the issue and develop a corrective action plan. Contacting the subcontractor directly could create unauthorized contractual commitments and undermine the prime\'s management authority."
          },
          {
            id: 'q2',
            question: "What does \"Consent to Subcontract\" refer to in defense contracting?",
            options: [
              "The subcontractor\'s agreement to accept government-directed changes",
              "The government Contracting Officer's required approval before the prime awards certain subcontracts on cost-type contracts",
              "The prime contractor\'s internal approval process for subcontract awards",
              "Congressional notification required for subcontracts over $50M"
            ],
            correct: 1,
            explanation: "On cost-reimbursable contracts, FAR 44.2 requires the prime to obtain the government CO\'s consent before awarding subcontracts above specified thresholds. This process ensures price reasonableness and contractor qualification. The CO reviews the subcontract proposal and either consents, withholds consent pending additional information, or denies consent."
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
            explanation: "CPSRs are conducted by the Defense Contract Management Agency (DCMA) to evaluate whether the prime contractor\'s purchasing system complies with FAR and DFARS requirements. An approved purchasing system is required for primes to have consent authority (the right to award subcontracts without individual government consent). DCMA conducts CPSRs periodically, typically every 3 years for active contractors."
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
            question: "The government PM\'s relationship with subcontractors is best characterized as:",
            options: [
              'Direct oversight authority — the PM can issue direction to subcontractors',
              'Insight rights through the prime — the PM can receive data but cannot direct subcontractors independently',
              "No relationship — subcontractor performance is entirely the prime\'s internal matter",
              "Equivalent authority to the prime\'s subcontract program manager"
            ],
            correct: 1,
            explanation: "The government has 'insight' into subcontractor performance — the right to receive data and participate in reviews — but not direct 'oversight' authority. The prime contractor is the government\'s sole point of accountability. Direct PM-to-subcontractor direction, without going through the prime, creates unauthorized contractual commitments and can expose the government to legal liability."
          },
          {
            id: 'q7',
            question: "In the IPMR reporting system, which format provides the organizational (subcontractor) breakdown of cost and schedule performance?",
            options: ['Format 1 (WBS-based)', 'Format 2 (Organizational)', 'Format 5 (Problem Analysis)', 'Format 6 (IMS/Milestone)'],
            correct: 1,
            explanation: "IPMR Format 2 provides performance data organized by the contractor\'s Organizational Breakdown Structure (OBS), which maps to major subcontractors and functional organizations. This format allows PMs to identify which organizational elements (and by extension, which subcontractors) are driving cost or schedule variances — crucial for targeted corrective action."
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
            explanation: "A Cure Notice (FAR 49.607) is issued when a contractor\'s performance is in danger of resulting in default. It gives the contractor a specified period (typically 10 days) to show progress toward curing the problem. If the contractor fails to cure, the CO may issue a Show Cause notice or proceed to termination for default. Cure notices are serious escalation signals that PM should avoid through proactive management."
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
              "Waiting for the prime\'s monthly IPMR to identify subcontractor problems",
              "Requiring the prime to brief critical subcontractor status monthly, establishing early warning metrics, and including sub performance in the prime\'s performance evaluation",
              'Bypassing the prime and conducting government-to-subcontractor reviews directly',
              'Requiring the prime to bond all subcontracts above $1M'
            ],
            correct: 1,
            explanation: "Proactive subcontractor risk management means building visibility into the prime\'s oversight processes early — requiring sub performance briefings at monthly reviews, establishing leading indicators (technical progress, staffing levels, test results) before schedule slips become apparent, and including sub management quality in past performance evaluations. Waiting for IPMR data means problems are already 60-90 days old by the time you see them."
          }
        ]
      }
    ],
    assessment: [
      {
        id: 'oa1',
        question: 'A Program Manager receives a contractor Requests for Equitable Adjustment (REA). What is the most accurate description of an REA?',
        options: ['A unilateral government order to change contract scope', 'A contractor\'s request for a contract price or schedule adjustment based on a government-caused change or differing site condition', 'An audit finding from DCAA requiring the contractor to refund overpayments', 'A subcontractor claim against the prime contractor'],
        correct: 1,
        explanation: 'An REA (Request for Equitable Adjustment) is a contractor\'s formal request to adjust the contract price, schedule, or other terms due to a government action — such as a change order, differing site condition, or government-caused delay. REAs must be addressed promptly; unresolved REAs often escalate into formal claims under the Contract Disputes Act.'
      },
      {
        id: 'oa2',
        question: 'Under DoD operations, "LRIP" refers to which phase of a program\'s lifecycle?',
        options: ['Low Rate Initial Production — the initial production phase before Full Rate Production is approved at Milestone C', 'Long Range Investment Planning — the POM submission process', 'Logistics Readiness Integration Plan — the sustainment planning document', 'Limited Risk Incentive Pricing — a contract pricing method'],
        correct: 0,
        explanation: 'LRIP (Low Rate Initial Production) is the production phase between Milestone B and the Full Rate Production (FRP) Decision Review (Milestone C). LRIP produces a limited number of units for operational testing and initial fielding. IOT&E (Initial Operational Test & Evaluation) is conducted during LRIP. LRIP quantities are capped by statute.'
      },
      {
        id: 'oa3',
        question: 'A Cure Notice is issued by the Contracting Officer when:',
        options: ['The contractor submits a late invoice', 'The contractor\'s performance is endangering completion of the contract and the government is considering termination for default', 'DCAA identifies unallowable costs in the contractor\'s accounting system', 'The contractor requests a stop-work order'],
        correct: 1,
        explanation: 'A Cure Notice (FAR 49.607) is issued when the contractor\'s performance is so deficient that it is in danger of default termination. The notice gives the contractor a specified time (usually 10 days) to cure the deficiency. If the contractor does not cure, the CO may issue a Show Cause Notice and ultimately terminate for default.'
      },
      {
        id: 'oa4',
        question: 'The Acquisition Program Baseline (APB) is best described as:',
        options: ['A contractor\'s internal project schedule', 'The formal agreement between the PM and MDA establishing approved thresholds for cost, schedule, and performance — deviations trigger a breach', 'The government\'s independent cost estimate used at milestone reviews', 'A monthly status report submitted to OSD'],
        correct: 1,
        explanation: 'The APB is a binding agreement establishing the program\'s cost (PAUC and APUC), schedule (IOC and FOC), and performance (KPPs) parameters with objective thresholds and goals. Breaching an APB threshold requires notifying the MDA and may trigger a program review, restructure, or termination.'
      },
      {
        id: 'oa5',
        question: 'In a Termination for Convenience (T4C), the contractor is entitled to recover:',
        options: ['Only profit on work already completed', 'Costs incurred, profit on work completed, and reasonable settlement costs — but NOT lost profits on unperformed work', 'Nothing — the government has absolute discretion to terminate without compensation', 'The full contract value as if the contract had been completed'],
        correct: 1,
        explanation: 'A T4C settlement compensates the contractor for: (1) costs incurred performing work, (2) profit on work performed, and (3) costs of settling the termination (e.g., subcontract termination costs). The contractor is NOT entitled to lost profits on unperformed work — this distinguishes T4C from termination for default (where the contractor may owe the government reprocurement costs).'
      },
      {
        id: 'oa6',
        question: 'What is the primary function of the Integrated Product Team (IPT) structure in DoD program management?',
        options: ['To replace the Program Manager\'s authority on technical decisions', 'To bring together representatives from all functional areas (engineering, contracting, finance, logistics, test) to make integrated program decisions rather than sequential, stove-piped ones', 'To provide external oversight of the PM similar to an Inspector General', 'To manage contractor performance reviews and past performance ratings'],
        correct: 1,
        explanation: 'IPTs are cross-functional teams that integrate the technical, contractual, financial, and operational perspectives needed to solve complex acquisition problems. The Working IPT (WIPT) handles day-to-day issues; the Overarching IPT (OIPT) provides senior leadership oversight. IPTs replaced sequential (waterfall) review processes with concurrent, collaborative decision-making.'
      },
      {
        id: 'oa7',
        question: 'Should-Cost analysis differs from Will-Cost analysis in that Should-Cost:',
        options: ['Is performed by CAPE rather than the program office', 'Identifies what a program SHOULD cost after eliminating inefficiencies, rather than projecting what it WILL cost based on current trends', 'Is only required for ACAT I programs', 'Focuses only on contractor labor rates, not overhead'],
        correct: 1,
        explanation: 'Will-Cost estimates project program cost based on current performance trends (essentially EAC). Should-Cost analysis — required by statute for major defense programs — challenges the program to identify and eliminate inefficiencies. The difference between Should-Cost and Will-Cost is the PM\'s cost reduction target. Should-Cost is a management tool to drive better value from the industrial base.'
      },
      {
        id: 'oa8',
        question: 'A program\'s Key Performance Parameters (KPPs) are established in which acquisition document?',
        options: ['Acquisition Program Baseline (APB)', 'Capability Development Document (CDD)', 'Test & Evaluation Master Plan (TEMP)', 'Life Cycle Sustainment Plan (LCSP)'],
        correct: 1,
        explanation: 'KPPs are established in the Capability Development Document (CDD), validated through the JCIDS process. KPPs represent the minimum acceptable performance thresholds — failing to meet a KPP at IOT&E can result in a program not achieving Initial Operational Capability (IOC). The APB captures KPPs as thresholds/objectives, but the CDD is the source document.'
      },
    ],
  }
];

export const getAllLessons = (): { lesson: Lesson; module: Module }[] => {
  return modules.flatMap(mod => mod.lessons.map(lesson => ({ lesson, module: mod })));
};

export const getTotalLessons = () => getAllLessons().length;
export const getTotalModules = () => modules.length;
