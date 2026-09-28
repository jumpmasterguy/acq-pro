// ─── NEW MODULE 1 LESSONS ─────────────────────────────────────────────────
// Replace all existing Module 1 (foundations) lessons with these 5, in order:
// foundations-intro, foundations-contracts, foundations-players,
// foundations-money, foundations-lifecycle (simplified version of old foundations-5)

// ═══════════════════════════════════════════════════════════════════════════
// LESSON 1: What Is Defense Acquisition?
// ═══════════════════════════════════════════════════════════════════════════
      {
        id: 'foundations-intro',
        title: 'What Is Defense Acquisition? (Start Here)',
        duration: '12 min',
        description: 'A plain-English introduction to what defense acquisition is, why it exists, and how the government buys the things it needs — from fighter jets to IT services to office supplies.',
        keyTerms: [
          { term: 'Defense Acquisition', definition: 'The process the U.S. government uses to buy the products, services, and systems needed for national defense — from aircraft and ships to software and professional services.' },
          { term: 'DoD', definition: 'Department of Defense — the federal department responsible for U.S. military forces and defense policy. Includes the Army, Navy, Air Force, Marine Corps, Space Force, and numerous defense agencies.' },
          { term: 'FAR', definition: 'Federal Acquisition Regulation — the primary rulebook governing how the U.S. federal government buys goods and services. Every federal contract must comply with the FAR unless an exception applies.' },
          { term: 'DFARS', definition: 'Defense Federal Acquisition Regulation Supplement — the DoD-specific additions to the FAR. Adds defense-specific rules on top of the base FAR requirements.' },
          { term: 'Contracting Officer (CO)', definition: 'The government official with legal authority to enter into, modify, and terminate contracts on behalf of the U.S. government. Only a CO can make the government legally obligated to pay.' },
          { term: 'Requirement', definition: 'A documented need for a product or service. Before any contract can be awarded, a requirement must be defined — what does the government need, how much, and by when.' },
          { term: 'Appropriation', definition: 'Money authorized by Congress for a specific purpose. The government can only spend money that Congress has appropriated — and only for the purpose Congress intended.' },
          { term: 'Contractor', definition: 'A private company or individual that has a contract with the government to provide goods or services. Also called a vendor, industry partner, or prime contractor.' },
        ],
        content: [
          {
            type: 'text',
            heading: 'Let\'s Start at the Very Beginning',
            body: 'If you\'re new to defense acquisitions, the terminology can feel overwhelming fast. ACAT levels, PEOs, CDDs, Nunn-McCurdy — it sounds like a different language. So let\'s ignore all of that for now and answer one simple question: what is defense acquisition, and why does it exist?\n\nDefense acquisition is simply how the U.S. government buys things for national defense. That\'s it. The Department of Defense needs aircraft, ships, weapons, software, IT services, maintenance, food for military bases, professional support — and it has to buy all of it from somewhere. Defense acquisition is the system, process, and rules that govern how that buying happens.',
          },
          {
            type: 'callout',
            heading: 'The Scale of What We\'re Talking About',
            body: 'The DoD spends roughly $400 billion per year on acquisition — goods, services, and research. That\'s more than the entire GDP of most countries. It is the largest procurement organization in the world, and understanding how it works is genuinely valuable whether you\'re a government employee trying to be effective at your job or a contractor trying to win and execute business.',
          },
          {
            type: 'text',
            heading: 'Why Does the Government Need Special Rules for Buying Things?',
            body: 'You might be wondering: why can\'t the government just buy things the same way a company does — shop around, find the best deal, pay for it? The answer has three parts.\n\nFirst, it\'s public money. The government is spending taxpayer dollars, so Congress and the public have a right to ensure it\'s spent wisely, fairly, and without corruption. Second, the scale is enormous — a single defense contract can be worth billions of dollars and run for decades. Mistakes at that scale cost the public enormously. Third, national security depends on it. If a contractor fails to deliver a critical weapons system or the government buys the wrong thing, people\'s lives are at stake.\n\nThe FAR (Federal Acquisition Regulation) and DFARS (Defense Federal Acquisition Regulation Supplement) are the rulebooks that govern this process. They are dense and detailed, but they exist for good reason.',
          },
          {
            type: 'list',
            heading: 'The Three Core Principles Behind Every Defense Acquisition',
            items: [
              'Competition — the government must generally compete its requirements so multiple companies can bid. This keeps prices fair and ensures the government gets the best value, not just the most connected vendor.',
              'Transparency — the rules, evaluation criteria, and award decisions must be documented and defensible. A losing contractor can protest an award if they believe the process was unfair.',
              'Accountability — taxpayers, Congress, and oversight agencies (like the GAO and DoD IG) monitor how money is spent. Program managers and contracting officers are personally accountable for following the rules.',
            ],
          },
          {
            type: 'text',
            heading: 'The Two Sides of Every Defense Acquisition',
            body: 'Every defense acquisition involves two sides: the government side and the industry side. Understanding both perspectives is one of the most valuable things you can do in this field.',
          },
          {
            type: 'table',
            heading: 'Government Side vs. Industry Side — How Each Experiences Acquisition',
            headers: ['Aspect', 'Government Side (USG)', 'Industry Side (Contractor)'],
            rows: [
              ['Primary goal', 'Get the best capability or service for the best value', 'Win contracts and deliver profitably'],
              ['Main concern', 'Defining requirements accurately and managing risk', 'Understanding requirements and proposing a compelling solution'],
              ['Who they answer to', 'Congress, oversight agencies, the American taxpayer', 'Shareholders, corporate leadership, employees'],
              ['Rules they follow', 'FAR, DFARS, DoD Instructions, agency policy', 'FAR/DFARS contract terms, company policies'],
              ['How they make decisions', 'Documented, regulated process with multiple approvals', 'Business judgment, pWin analysis, BD strategy'],
              ['What success looks like', 'Program delivers capability on cost and schedule', 'Win the contract, perform well, get paid, win recompete'],
            ],
          },
          {
            type: 'text',
            heading: 'What Gets Bought? The Three Categories',
            body: 'Not everything the DoD buys is a fighter jet. Acquisition spans three broad categories, and each has its own rules and dynamics.',
          },
          {
            type: 'list',
            heading: 'The Three Things the DoD Buys',
            items: [
              'Products (Systems & Equipment) — physical items: aircraft, vehicles, ships, weapons, satellites, radios, body armor. These often involve years of development before they can be produced and fielded. The most complex category.',
              'Services — people doing work for the government: program management support, IT services, base operations, maintenance, security, training. This is the largest category by contract volume and where most contractors spend their time.',
              'Research & Development (R&D) — funding for science, technology, experimentation, and innovation. Not buying a finished product, but funding the work to create new capabilities that may eventually become programs.',
            ],
          },
          {
            type: 'text',
            heading: 'Who Runs Acquisitions Inside the DoD?',
            body: 'The acquisition function inside DoD is handled by two distinct communities who work together on every major program.',
          },
          {
            type: 'list',
            heading: 'The Two Communities That Make Acquisition Work',
            items: [
              'The Contracting Community — Contracting Officers (COs) and their teams. They write and award contracts, negotiate prices, administer contract performance, and authorize payments. They are the government\'s legal agents. Only a CO can obligate the government to spend money.',
              'The Program Management Community — Program Managers (PMs) and their program offices. They define requirements, manage the technical and schedule execution, work with contractors day-to-day, and are accountable for delivering the capability. They rely on COs to handle the contractual side.',
            ],
          },
          {
            type: 'callout',
            heading: 'The Key Insight That Changes How You See Everything',
            body: 'Defense acquisition is not just about contracts and regulations. At its core it is about one question: how does the U.S. government, working with private industry, turn a warfighter\'s need into a delivered capability — reliably, affordably, and at the right time?\n\nEvery lesson in this course is about that question from a different angle. Keep it in mind as you go deeper.',
          },
          {
            type: 'tip',
            heading: 'You Don\'t Need to Memorize Everything',
            body: 'The FAR alone is thousands of pages. No one memorizes it. What matters is understanding the framework — the why behind the rules — so you can find the right answer when you need it and make good judgment calls when the regulation doesn\'t give you a clear answer. That\'s what this course is designed to build.',
          },
        ],
        quiz: [
          {
            id: 'q1',
            question: 'In plain terms, what is defense acquisition?',
            options: [
              'The process of recruiting military personnel',
              'The system and rules governing how the U.S. government buys goods and services for national defense',
              'The process of designing weapons systems',
              'The military\'s internal budgeting process',
            ],
            correct: 1,
            explanation: 'Defense acquisition is fundamentally the process by which the U.S. government buys the things it needs for national defense — from aircraft and ships to IT services and professional support. Everything else (the FAR, DFARS, milestones, contracts) is the infrastructure that governs how that buying happens.',
          },
          {
            id: 'q2',
            question: 'What is the FAR?',
            options: [
              'The Federal Acquisition Roster — a list of approved contractors',
              'The Federal Acquisition Regulation — the primary rulebook governing how the U.S. government buys goods and services',
              'The Forward Acquisition Rate — a cost estimating tool',
              'A DoD-specific rule that only applies to defense contracts',
            ],
            correct: 1,
            explanation: 'The FAR (Federal Acquisition Regulation) is the primary rulebook governing all federal government purchasing. The DFARS (Defense Federal Acquisition Regulation Supplement) adds defense-specific rules on top of the FAR. Together they govern every DoD contract.',
          },
          {
            id: 'q3',
            question: 'Who is the only government official with legal authority to obligate the government to pay on a contract?',
            options: [
              'The Program Manager',
              'The Contracting Officer\'s Representative (COR)',
              'The Contracting Officer (CO)',
              'The Program Executive Officer (PEO)',
            ],
            correct: 2,
            explanation: 'Only a warranted Contracting Officer (CO) has legal authority to enter into, modify, or terminate contracts on behalf of the U.S. government. A Program Manager can direct technical work within a contract, but only the CO can legally obligate the government to spend money.',
          },
          {
            id: 'q4',
            question: 'Why does the government follow special rules when buying things, rather than just shopping around freely?',
            options: [
              'To slow down the process and create government jobs',
              'Because private companies demanded it',
              'To ensure public money is spent fairly, wisely, and with accountability to taxpayers and Congress',
              'Because the military prefers not to deal with industry directly',
            ],
            correct: 2,
            explanation: 'Government acquisition rules exist because public money demands public accountability. The FAR/DFARS framework ensures competition (fair pricing), transparency (defensible decisions), and accountability (Congress and oversight agencies can verify money was spent as intended). Without these rules, the system would be vulnerable to corruption and waste at enormous scale.',
          },
          {
            id: 'q5',
            question: 'Which of the following is the LARGEST category of DoD spending by contract volume?',
            options: [
              'Products (systems and equipment like aircraft and ships)',
              'Research & Development',
              'Services (people doing work: IT, maintenance, program support, etc.)',
              'Construction and real estate',
            ],
            correct: 2,
            explanation: 'Services — contractors providing labor and expertise to support government operations, programs, and missions — represent the largest category of DoD contract spending by volume. This includes everything from IT support and base operations to program management support and professional advisory services.',
          },
        ],
      },

// ═══════════════════════════════════════════════════════════════════════════
// LESSON 2: Contracts vs. Task Orders — The Building Blocks
// ═══════════════════════════════════════════════════════════════════════════
      {
        id: 'foundations-contracts',
        title: 'Contracts vs. Task Orders: How the Government Actually Buys',
        duration: '14 min',
        description: 'Understand the difference between a standalone contract and a task order, what an IDIQ vehicle is, and why most DoD service spending flows through vehicles rather than one-off contracts.',
        keyTerms: [
          { term: 'Contract', definition: 'A legally binding agreement between the government and a contractor that defines what will be delivered, for how much, and by when. Once signed by a Contracting Officer, both parties are legally obligated to perform.' },
          { term: 'Task Order (TO)', definition: 'An individual delivery of work placed under a pre-existing IDIQ contract. The IDIQ is the umbrella; task orders are the specific assignments issued under it.' },
          { term: 'IDIQ', definition: 'Indefinite Delivery, Indefinite Quantity — a contract type where the government commits to a minimum quantity and the contractor agrees to deliver up to a maximum ceiling. Actual orders are issued as task orders.' },
          { term: 'Standalone Contract', definition: 'A direct contract award for a specific, fully defined requirement. Involves its own solicitation, competition, proposal, evaluation, and award. Used when the requirement is unique or defined enough to stand alone.' },
          { term: 'Base Year + Options', definition: 'A common contract structure where the initial period is the base year (e.g., 12 months) with multiple option years the government can exercise if performance is satisfactory. Example: 1 base + 4 options = 5 year max.' },
          { term: 'Period of Performance (PoP)', definition: 'The date range during which contract work must be performed. Starts at contract award (or a specified date) and ends when all work is complete.' },
          { term: 'Ceiling Value', definition: 'The maximum total dollar amount the government can spend under a contract or IDIQ. The contractor is not guaranteed the ceiling — only actual task orders place firm obligations.' },
          { term: 'Fair Opportunity', definition: 'The FAR 16.505 requirement that all awardees on a Multiple Award IDIQ receive a fair opportunity to compete for each task order. The default rule for all MA-IDIQ task orders.' },
          { term: 'Single Award vs. Multiple Award', definition: 'A Single Award IDIQ gives one contractor exclusive rights to all task orders. A Multiple Award IDIQ puts several contractors on the vehicle; each task order is then competed among them.' },
        ],
        content: [
          {
            type: 'text',
            heading: 'The Most Important Distinction in Defense Contracting',
            body: 'If you take away one thing from this lesson, let it be this: most DoD service spending does not flow through standalone contracts. It flows through IDIQ vehicles. Understanding the difference between a standalone contract and a task order under an IDIQ is not a technicality — it determines your entire BD strategy as a contractor, and your entire acquisition approach as a government PM.',
          },
          {
            type: 'text',
            heading: 'What Is a Standalone Contract?',
            body: 'A standalone contract is exactly what it sounds like: a single contract awarded for a specific, defined requirement. The government identifies a need, writes a solicitation (RFP — Request for Proposal), posts it publicly (usually on SAM.gov), evaluates proposals from interested contractors, selects a winner, and awards a contract.\n\nStandalone contracts have their own scope, ceiling value, period of performance, and contract terms. When the work is done and the contract closes, the relationship is over unless the government re-competes the requirement.\n\nStandalone contracts are common for unique requirements — a specific construction project, a one-time study, or a sole-source procurement. But for recurring services, they\'re inefficient because the government has to run a full competition every time the requirement repeats.',
          },
          {
            type: 'text',
            heading: 'What Is an IDIQ?',
            body: 'An IDIQ (Indefinite Delivery, Indefinite Quantity) contract is a vehicle — an umbrella agreement that pre-qualifies one or more contractors to do a certain category of work for a defined period, up to a ceiling dollar amount.\n\nThink of an IDIQ like a staffing agency agreement: the government says "we\'ve pre-approved these firms to do this type of work at these rates, for up to $500M over 5 years." Then, when the government has a specific need, it issues a task order to one of those firms — without having to run a full competition from scratch each time.\n\nThe IDIQ itself guarantees the contractor a minimum amount of work (often nominal — sometimes as little as $1) and sets the maximum ceiling. The government is not obligated to spend the full ceiling. Actual revenue only flows when task orders are issued.',
          },
          {
            type: 'callout',
            heading: 'The Key Insight About IDIQs',
            body: 'Winning a spot on an IDIQ vehicle does NOT guarantee revenue. It guarantees the right to compete for task orders. Battle 1 is winning the IDIQ. Battle 2 — which never ends — is winning task orders. Many contractors make the mistake of treating an IDIQ win as a revenue event. It is a hunting license, not a paycheck.',
          },
          {
            type: 'table',
            heading: 'Standalone Contract vs. Task Order Under an IDIQ',
            headers: ['Factor', 'Standalone Contract', 'Task Order (IDIQ)'],
            rows: [
              ['Competition', 'Full & open — any qualified company can bid', 'Among IDIQ holders only (fair opportunity)'],
              ['Timeline to award', '6–18 months for major contracts', '2–8 weeks typical'],
              ['Proposal effort', 'Full volumes: technical, past performance, price', 'Lighter — page-limited, approach-focused'],
              ['Scope', 'Fully defined at award', 'Defined per individual task order'],
              ['Entry barrier', 'Open to all eligible offerors', 'Must already hold the IDIQ vehicle'],
              ['Who bears the cost risk', 'Depends on contract type (FFP, cost-plus, etc.)', 'Same — depends on task order type'],
              ['Best used for', 'Unique, one-time, or highly specialized needs', 'Recurring, category-based service needs'],
            ],
          },
          {
            type: 'text',
            heading: 'Single Award vs. Multiple Award IDIQs',
            body: 'IDIQs come in two flavors, and which one you\'re dealing with changes everything about BD and task order strategy.',
          },
          {
            type: 'list',
            heading: 'Single Award IDIQ',
            items: [
              'One contractor wins the vehicle. All task orders go to that firm without further competition.',
              'Revenue certainty is high — if you won the IDIQ, you\'re getting the work.',
              'Entry is extremely competitive because the stakes are so high.',
              'Typically used when the requirement is highly specialized and only one qualified source exists, or when a single integrated team is operationally necessary.',
              'Example: A single contractor holding the USSOCOM systems engineering support contract.',
            ],
          },
          {
            type: 'list',
            heading: 'Multiple Award IDIQ (MA-IDIQ)',
            items: [
              'Multiple contractors (often 5–20+) hold the vehicle. Each task order is competed among the awardees under FAR 16.505 fair opportunity rules.',
              'Entry is easier than single-award, but you must keep winning task orders to generate revenue.',
              'Requires sustained BD effort post-award — the competition never stops.',
              'The dominant model for defense services: OASIS+, AFCAP, LOGCAP, agency-specific A&AS IDIQs.',
              'Example: Eight contractors hold a $500M enterprise IT support IDIQ. Each task order RFP goes to all eight; they submit proposals; one wins.',
            ],
          },
          {
            type: 'text',
            heading: 'Where Does the Money Come From? A Quick Note on Contract Types',
            body: 'Not all contracts pay the same way. The two most common structures you\'ll encounter are:\n\nFirm Fixed Price (FFP): The contractor delivers a defined result for a fixed price. If it costs more than expected, the contractor absorbs the loss. If it costs less, the contractor keeps the profit. Best for well-defined, low-risk work.\n\nCost-Plus: The government reimburses the contractor\'s actual costs plus a fee (profit). Used when the work is complex or uncertain enough that a fixed price would require too much risk premium or be impossible to set fairly. Common in R&D and early development.\n\nWe\'ll cover contract types in depth in the Contracts module — but knowing FFP vs. cost-plus at the basic level will help you understand conversations you\'ll have from day one.',
          },
          {
            type: 'tip',
            heading: 'For Contractors: The Single Most Important Strategic Move',
            body: 'Get on the right IDIQ vehicles early. Most DoD service spending flows through pre-existing vehicles. If your company doesn\'t hold the vehicle, you cannot compete for the task orders. Building a portfolio of relevant IDIQ positions — OASIS+, relevant agency-specific IDIQs, GWACs — is the infrastructure of a sustainable defense business. Chasing standalone contracts is slower, more expensive, and less predictable.',
          },
          {
            type: 'tip',
            heading: 'For Government Personnel: Why This Matters to You',
            body: 'As a PM, budget analyst, or acquisition professional, understanding whether a requirement will be satisfied through a standalone contract or a task order shapes your acquisition timeline, your documentation requirements, and how much influence you have over the competitive field. A task order under an existing IDIQ can move in weeks. A new standalone contract can take 12–18 months. Know which tool you\'re working with before you plan your program timeline.',
          },
        ],
        quiz: [
          {
            id: 'q1',
            question: 'What is an IDIQ contract?',
            options: [
              'A contract for a single, fully defined delivery at a fixed price',
              'An umbrella contract that pre-qualifies contractors to do a category of work, with actual orders placed as task orders up to a ceiling value',
              'A contract type only used for construction projects',
              'A government-to-government agreement for shared services',
            ],
            correct: 1,
            explanation: 'An IDIQ (Indefinite Delivery, Indefinite Quantity) is an umbrella contract that establishes terms, pricing, and a qualified pool of contractors for a category of work. The government then issues task orders for specific needs without re-competing from scratch each time.',
          },
          {
            id: 'q2',
            question: 'A contractor wins a spot on a $200M Multiple Award IDIQ. How much revenue have they guaranteed themselves?',
            options: [
              '$200M — the full ceiling value',
              '$40M — their proportional share among 5 awardees',
              'Only the minimum guarantee (often nominal, sometimes as little as $1)',
              'Nothing until the IDIQ is exercised by the ordering agency',
            ],
            correct: 2,
            explanation: 'Winning an IDIQ position guarantees only the minimum order (often nominal — sometimes $1). The ceiling value represents the maximum the government can spend, but actual revenue only flows when task orders are issued and won. This is why sustained BD effort after IDIQ award is critical.',
          },
          {
            id: 'q3',
            question: 'Under FAR 16.505, what is the default rule for competing task orders on a Multiple Award IDIQ?',
            options: [
              'The government can award to any awardee at its sole discretion',
              'Task orders rotate equally among all awardees',
              'All awardees must receive a fair opportunity to be considered for each task order',
              'Task orders go to the lowest bidder automatically',
            ],
            correct: 2,
            explanation: 'FAR 16.505 requires the government to provide all MA-IDIQ awardees a "fair opportunity" to be considered for each task order. This is the default rule — exceptions (urgency, only one awardee capable, logical follow-on, etc.) are narrow and must be documented.',
          },
          {
            id: 'q4',
            question: 'Why do most defense service requirements flow through IDIQ vehicles rather than standalone contracts?',
            options: [
              'IDIQ contracts are cheaper for the government to administer than standalone contracts',
              'IDIQ vehicles allow the government to issue task orders quickly without running a full competition each time, saving months of acquisition lead time',
              'Standalone contracts are illegal for service requirements',
              'IDIQ vehicles give contractors more profit margin',
            ],
            correct: 1,
            explanation: 'IDIQs allow the government to issue task orders for specific needs in weeks rather than the 6–18 months a full standalone competition takes. The upfront competition to qualify for the vehicle is rigorous, but subsequent task orders are much faster — which is why IDIQ vehicles dominate defense service spending.',
          },
          {
            id: 'q5',
            question: 'What is the primary difference between a Single Award IDIQ and a Multiple Award IDIQ from a contractor\'s perspective?',
            options: [
              'Single Award IDIQs have higher ceilings than Multiple Award IDIQs',
              'Single Award IDIQs are only available to small businesses',
              'Single Award IDIQs give one contractor all task orders without further competition; Multiple Award IDIQs require competing for each task order among all awardees',
              'Single Award IDIQs are administered by GSA; Multiple Award IDIQs are administered by the ordering agency',
            ],
            correct: 2,
            explanation: 'A Single Award IDIQ winner gets all task orders — no further competition required, but only one firm wins the vehicle. A Multiple Award IDIQ puts several firms on the contract, then each task order is competed among them under fair opportunity rules. More firms can participate in MA-IDIQs, but no firm is guaranteed any specific task order.',
          },
        ],
      },

// ═══════════════════════════════════════════════════════════════════════════
// LESSON 3: Who's Who — The Key Players in Defense Acquisition
// ═══════════════════════════════════════════════════════════════════════════
      {
        id: 'foundations-players',
        title: 'Who\'s Who: The Key Players in Defense Acquisition',
        duration: '13 min',
        description: 'Meet the people and organizations on both sides of every defense acquisition — from Congress and OSD down to the program office, and from the prime contractor to the COR.',
        keyTerms: [
          { term: 'Congress', definition: 'The legislative branch of the U.S. government. Congress authorizes and appropriates the money the DoD spends. Nothing gets funded without Congressional approval. Congress also oversees how the money is spent.' },
          { term: 'OSD', definition: 'Office of the Secretary of Defense — the top civilian leadership of the DoD. The Secretary of Defense, Deputy SecDef, and their staff set defense policy and oversee the military services.' },
          { term: 'Military Services', definition: 'The Army, Navy, Air Force, Marine Corps, and Space Force. Each service manages its own acquisition programs and budgets, with oversight from OSD.' },
          { term: 'SAE', definition: 'Service Acquisition Executive — the senior civilian official in each service (e.g., ASA(ALT) for Army, SAF/AQ for Air Force) responsible for all acquisition programs within that service.' },
          { term: 'PEO', definition: 'Program Executive Officer — a senior military officer or civilian who oversees a portfolio of related acquisition programs and reports to the SAE.' },
          { term: 'PM', definition: 'Program Manager — the person accountable for executing a specific acquisition program: delivering the capability on cost, on schedule, and with the required performance.' },
          { term: 'CO', definition: 'Contracting Officer — the government official with legal authority to award and administer contracts. Works with the PM but is independently accountable for contracting actions.' },
          { term: 'COR', definition: 'Contracting Officer\'s Representative — a government employee (often technical staff on the program) delegated by the CO to monitor contractor performance day-to-day. Critical relationship for contractors.' },
          { term: 'Prime Contractor', definition: 'The company that holds the government contract directly. Responsible for all deliverables, including work performed by subcontractors.' },
          { term: 'Subcontractor', definition: 'A company hired by the prime contractor to perform a portion of the work. Has no direct contract with the government — only with the prime.' },
          { term: 'CAPE', definition: 'Cost Assessment and Program Evaluation — the OSD office that produces independent cost estimates for major programs. CAPE estimates are typically higher than program office estimates and are historically more accurate.' },
          { term: 'DAU', definition: 'Defense Acquisition University — the DoD\'s training institution for the acquisition workforce. Provides the certifications (DAWIA) that acquisition professionals need to advance their careers.' },
        ],
        content: [
          {
            type: 'text',
            heading: 'Why Knowing the Players Matters',
            body: 'One of the fastest ways to become effective in defense acquisitions — whether you\'re on the government side or the industry side — is to understand who actually makes decisions, who influences those decisions, and what each person needs from their counterparts. The acquisition system involves dozens of different roles, but most of the day-to-day work flows through a small set of key relationships.',
          },
          {
            type: 'text',
            heading: 'The Government Side: From Congress to the Contracting Office',
            body: 'The government side of acquisition is organized in layers, from the top policy-setters down to the people who actually sign contracts and manage programs.',
          },
          {
            type: 'list',
            heading: 'The Government Acquisition Chain — Top to Bottom',
            items: [
              'Congress — Authorizes and appropriates all defense spending. Sets statutory requirements that no one can waive (Nunn-McCurdy, TINA, competition requirements). Defense committees oversee the largest programs closely.',
              'OSD (Office of the Secretary of Defense) — Sets policy, runs oversight reviews for major programs, controls the defense budget request. Key OSD offices: USD(A&S) for acquisition policy, CAPE for independent cost estimates, DOT&E for testing oversight.',
              'Service Acquisition Executives (SAEs) — One per service (Army: ASA(ALT), Navy: ASN(RDA), Air Force: SAF/AQ). The SAE is responsible for all acquisition programs within their service and is the Milestone Decision Authority for most ACAT I programs.',
              'Program Executive Officers (PEOs) — Oversee portfolios of related programs. A PEO might manage all Army ground vehicles, or all Air Force electronic warfare programs. They are the PM\'s direct chain of command.',
              'Program Managers (PMs) — The person accountable for a specific program. Responsible for cost, schedule, and performance. A PM\'s job is to deliver the capability.',
              'Contracting Officers (COs) — Award and administer contracts. Independent authority — a CO can refuse to sign a contract they believe is improper even under PM pressure.',
              'Contracting Officer\'s Representatives (CORs) — Delegated by the CO to monitor contractor performance day-to-day. Often technical staff embedded with the program. One of the most influential people in a contractor\'s daily life.',
            ],
          },
          {
            type: 'callout',
            heading: 'The PM-CO Relationship Is the Engine of Every Program',
            body: 'The Program Manager and Contracting Officer must work as partners, but they have different authorities and different accountability chains. The PM is accountable for delivering capability. The CO is accountable for contracting integrity. A PM cannot direct a contractor to do work outside the contract — only the CO can authorize that. A CO cannot unilaterally change technical requirements — that\'s the PM\'s lane. When this partnership works well, programs run smoothly. When it breaks down, you get delays, disputes, and claims.',
          },
          {
            type: 'text',
            heading: 'The Industry Side: From Prime to Subcontractor',
            body: 'On the industry side, the structure mirrors the government in some ways — there are senior leadership, program teams, and functional specialists — but the dynamics are driven by business strategy rather than regulatory authority.',
          },
          {
            type: 'list',
            heading: 'The Industry Acquisition Team',
            items: [
              'Business Development (BD) — Identifies opportunities, builds relationships with government customers, and tracks the market 12–24 months before any RFP is released. BD is the front end of the revenue pipeline.',
              'Capture Manager — Takes over from BD once a specific opportunity is identified and pursued. Leads the strategy to win: competitive analysis, teaming, solution shaping, customer engagement. Makes the go/no-go decision to bid.',
              'Proposal Manager — Leads proposal development in response to the RFP. Coordinates writing, pricing, graphics, reviews, and submission. Often the most intense role in the company during a bid.',
              'Program Manager (contractor-side) — Once a contract is awarded, the contractor PM executes the work. Responsible for delivering on the contract, managing the team, tracking cost and schedule, and maintaining the customer relationship.',
              'Contracts Manager — The contractor\'s counterpart to the government CO. Manages the contract terms, handles modifications, REAs (Requests for Equitable Adjustment), and any disputes.',
              'Subcontractors — Companies hired by the prime to perform portions of the work. The prime is responsible for their performance and must flow down relevant contract requirements.',
            ],
          },
          {
            type: 'table',
            heading: 'Government Role vs. Industry Counterpart',
            headers: ['Government Role', 'What They Do', 'Industry Counterpart'],
            rows: [
              ['Program Manager (PM)', 'Defines requirements, manages program execution, accountability for cost/schedule/performance', 'Contractor Program Manager'],
              ['Contracting Officer (CO)', 'Awards and administers contracts, legal authority to obligate government', 'Contracts Manager / Legal Counsel'],
              ['COR', 'Monitors contractor performance day-to-day, technical interface', 'Program Manager / Task Lead'],
              ['Budget Analyst', 'Manages program funding, tracks obligations and expenditures', 'Finance / Pricing Manager'],
              ['Test & Evaluation', 'Evaluates whether system meets requirements in testing', 'Test Team / Systems Engineering'],
              ['Legal / JAG', 'Reviews contracts for legal compliance, advises CO', 'Corporate Counsel'],
            ],
          },
          {
            type: 'text',
            heading: 'The Oversight Community: They\'re Watching',
            body: 'Defense acquisition doesn\'t happen in a vacuum. Multiple oversight organizations monitor programs and contracting actions — and their findings can halt a program, trigger a Congressional investigation, or result in personal liability for individuals who cut corners.',
          },
          {
            type: 'list',
            heading: 'Key Oversight Organizations Every Acquisition Professional Should Know',
            items: [
              'GAO (Government Accountability Office) — The "congressional watchdog." Audits government programs and contracting actions, issues public reports. Contractors can protest contract awards to the GAO.',
              'DoD IG (Inspector General) — Investigates fraud, waste, and abuse within DoD. Can refer cases for criminal prosecution.',
              'DCAA (Defense Contract Audit Agency) — Audits contractor costs on cost-reimbursable contracts. Approves contractor accounting systems. A DCAA finding can halt progress payments.',
              'DCMA (Defense Contract Management Agency) — Provides contract administration services for DoD, including overseeing contractor performance and EVMS (Earned Value Management System) surveillance.',
              'CAPE (Cost Assessment and Program Evaluation) — Produces independent cost estimates for major programs. Often the source of uncomfortable but accurate news about program cost overruns.',
            ],
          },
          {
            type: 'tip',
            heading: 'The Most Important Relationship You\'ll Have as a Contractor',
            body: 'It\'s not with the Contracting Officer — it\'s with the COR. The COR is your day-to-day technical interface, the person who writes your performance assessments (CPARS), and one of the most influential voices when the government decides whether to exercise your option year or re-compete the contract. Treat every interaction with your COR as a performance evaluation in progress.',
          },
        ],
        quiz: [
          {
            id: 'q1',
            question: 'Who has the legal authority to obligate the U.S. government to pay on a defense contract?',
            options: [
              'The Program Manager',
              'The Program Executive Officer (PEO)',
              'The Contracting Officer (CO)',
              'The COR',
            ],
            correct: 2,
            explanation: 'Only a warranted Contracting Officer (CO) can legally obligate the government. A PM can direct technical work within an existing contract, but only the CO can award a contract, authorize additional work, or make the government legally responsible to pay.',
          },
          {
            id: 'q2',
            question: 'What does a COR (Contracting Officer\'s Representative) primarily do?',
            options: [
              'Negotiates contract prices with contractors',
              'Monitors contractor performance day-to-day and serves as the technical interface between the program office and the contractor',
              'Approves contractor invoices and processes payments',
              'Writes the Independent Government Cost Estimate (IGCE)',
            ],
            correct: 1,
            explanation: 'The COR is delegated by the CO to monitor contractor performance in technical and day-to-day matters. The COR does not have contracting authority — they cannot direct changes or authorize additional work — but they are often the most influential voice in CPARS ratings, option year exercises, and future requirements.',
          },
          {
            id: 'q3',
            question: 'What is the role of DCAA in defense acquisition?',
            options: [
              'DCAA writes requirements documents for major programs',
              'DCAA audits contractor costs and approves accounting systems on cost-reimbursable contracts',
              'DCAA manages IDIQ vehicles on behalf of the government',
              'DCAA provides independent cost estimates for Congressional reporting',
            ],
            correct: 1,
            explanation: 'DCAA (Defense Contract Audit Agency) audits contractor costs on cost-reimbursable contracts and approves contractor accounting systems. A DCAA finding of inadequate systems can halt progress payments and even derail contract awards. Contractors doing cost-type work must maintain DCAA-compliant accounting from day one.',
          },
          {
            id: 'q4',
            question: 'A contractor has a dispute about a contract modification the CO issued. Where can they formally protest?',
            options: [
              'The Program Manager\'s office',
              'The Service Acquisition Executive',
              'The GAO (Government Accountability Office)',
              'The Department of Justice',
            ],
            correct: 2,
            explanation: 'Contractors can file bid protests at the GAO for award-related disputes, or file claims with the CO and appeal to the Armed Services Board of Contract Appeals (ASBCA) or Court of Federal Claims for post-award disputes. The GAO is the most common protest venue for award disputes and has a 100-day resolution requirement.',
          },
          {
            id: 'q5',
            question: 'In defense acquisition, who is the Program Manager (PM) ultimately accountable to?',
            options: [
              'The Contracting Officer',
              'The prime contractor',
              'Congress directly',
              'The Program Executive Officer (PEO), who reports to the Service Acquisition Executive (SAE)',
            ],
            correct: 3,
            explanation: 'The PM reports to their PEO (Program Executive Officer), who reports to the SAE (Service Acquisition Executive) — e.g., SAF/AQ for Air Force programs. For ACAT I programs, the SAE may report to the USD(A&S) at OSD. Congress oversees the overall system but does not directly supervise individual PMs.',
          },
        ],
      },

// ═══════════════════════════════════════════════════════════════════════════
// LESSON 4: How Money Works in DoD — Budgets, Appropriations & Color of Money
// ═══════════════════════════════════════════════════════════════════════════
      {
        id: 'foundations-money',
        title: 'How Money Works in DoD: Budgets, Appropriations & Color of Money',
        duration: '14 min',
        description: 'Understand where DoD money comes from, why you can\'t just spend it on anything you want, and what "color of money" means — one of the most practically important concepts in defense acquisition.',
        keyTerms: [
          { term: 'Appropriation', definition: 'A Congressional act that gives the government legal authority to spend money for a specific purpose. The DoD cannot spend a dollar that Congress hasn\'t appropriated.' },
          { term: 'Color of Money', definition: 'Informal term for the type of appropriation funding is drawn from. Different appropriations (RDT&E, Procurement, O&M) have different authorized uses, obligation periods, and rules. Using the wrong color of money is a federal law violation.' },
          { term: 'RDT&E', definition: 'Research, Development, Test & Evaluation — appropriation for developing new systems, technologies, and capabilities. Covers everything from basic research to engineering development and testing.' },
          { term: 'Procurement', definition: 'Appropriation for buying production quantities of systems and equipment. Used after a system has been developed and is ready for production. Has a 3-year obligation period.' },
          { term: 'O&M', definition: 'Operations & Maintenance — appropriation for day-to-day operations, maintenance, training, and most services. The most frequently used appropriation. Has a 1-year obligation period.' },
          { term: 'MILCON', definition: 'Military Construction — appropriation for building and renovating facilities. Has a 5-year obligation period.' },
          { term: 'MILPERS', definition: 'Military Personnel — appropriation that pays military salaries, allowances, and benefits. Cannot be used for contracts or equipment.' },
          { term: 'Obligation', definition: 'A legally binding commitment of government funds. When a contract is awarded, the government is "obligating" funds — promising to pay. Unobligated funds expire at the end of their period of availability.' },
          { term: 'Anti-Deficiency Act', definition: 'The federal law that prohibits spending money the government doesn\'t have, spending more than Congress appropriated, or spending money for a purpose other than what Congress intended. Violations can result in criminal penalties.' },
          { term: 'PPBE', definition: 'Planning, Programming, Budgeting, and Execution — the DoD\'s annual process for developing and managing its budget. Programs must navigate PPBE to get and keep funding.' },
        ],
        content: [
          {
            type: 'text',
            heading: 'Why Money Is Different in the Government',
            body: 'In a private company, if you have money in the bank, you can generally spend it on what your business needs. The government doesn\'t work that way. Congress controls the government\'s money — not just how much is spent, but what it can be spent on, when it must be spent by, and what happens if it\'s spent on the wrong thing.\n\nFor anyone working in defense acquisition, understanding government money is not optional. Mistakes involving the wrong type of funding don\'t just cause budget problems — they can be federal law violations that end careers.',
          },
          {
            type: 'callout',
            heading: 'The Anti-Deficiency Act: Why This Actually Matters',
            body: 'The Anti-Deficiency Act (ADA) prohibits spending money Congress hasn\'t appropriated, spending more than was appropriated, or spending appropriated money on a purpose other than what Congress intended. ADA violations must be reported to Congress and can result in administrative discipline and criminal prosecution. This is why every acquisition professional must understand "color of money" — the type of appropriation determines what you can and cannot do with it.',
          },
          {
            type: 'text',
            heading: 'Where DoD Money Comes From: The PPBE Cycle',
            body: 'DoD doesn\'t get a blank check from Congress. It has to earn its budget through an annual process called PPBE — Planning, Programming, Budgeting, and Execution. Here\'s the simplified version:\n\n1. Planning: The DoD identifies its strategic priorities and capability needs.\n2. Programming: Each service and agency proposes how to allocate resources across its programs over the next 5 years (the Future Years Defense Program, or FYDP).\n3. Budgeting: The proposals are reviewed, debated, and refined into a budget request the President submits to Congress.\n4. Execution: Once Congress passes the budget (appropriations bills), the DoD executes — spends the money per the authorized purposes.\n\nThe entire cycle takes about two years from planning to execution, which means the budget you\'re executing today was planned 2+ years ago. This is one reason DoD programs struggle to adapt quickly to changing needs.',
          },
          {
            type: 'text',
            heading: 'Color of Money: The Most Practically Important Concept for Day-to-Day Work',
            body: 'Once Congress appropriates money to the DoD, it\'s divided into different "pots" — each with its own authorized uses and time limits. These are called appropriations, and the informal term is "color of money." Using the wrong color for a purchase is not a paperwork error — it\'s potentially a federal law violation.',
          },
          {
            type: 'table',
            heading: 'The Five Main DoD Appropriation Types',
            headers: ['Appropriation', 'Nickname', 'What It Pays For', 'Obligation Period', 'Common Mistake'],
            rows: [
              ['Research, Development, Test & Evaluation', 'RDT&E', 'Developing new systems: studies, prototypes, engineering, testing', '2 years', 'Using RDT&E to buy production quantities — that requires Procurement funds'],
              ['Procurement', 'Proc', 'Buying production units of systems and major equipment', '3 years', 'Using Procurement to pay for a study or maintenance — those require RDT&E or O&M'],
              ['Operations & Maintenance', 'O&M', 'Day-to-day operations, maintenance, training, most services contracts', '1 year', 'Using O&M for a multi-year services contract that exceeds the obligation period'],
              ['Military Construction', 'MILCON', 'Building and renovating facilities and infrastructure', '5 years', 'Using O&M for construction that should be MILCON (generally above $1.5M threshold)'],
              ['Military Personnel', 'MILPERS', 'Military salaries, allowances, bonuses', 'Annual', 'Using MILPERS for contractor services — not allowed'],
            ],
          },
          {
            type: 'callout',
            heading: 'The Practical Problem Color of Money Creates',
            body: 'Programs regularly cross phase boundaries mid-fiscal year. A development program transitions from RDT&E work to procurement — but the transition isn\'t clean. You might have RDT&E funds on contract and the contractor needs to do something that looks like production. Or your O&M services contract runs right up to the fiscal year end. These transitions require careful coordination between the PM and the budget team — and they happen on every program, every year. Understanding color of money is not theoretical; it\'s one of the most common practical challenges in program execution.',
          },
          {
            type: 'list',
            heading: 'Key Rules About Government Money That Every Acquisition Professional Must Know',
            items: [
              'Funds expire — every appropriation has a period of availability. O&M funds must be obligated within one year. After expiration, they can no longer be obligated for new work. After the expenditure period, they close entirely.',
              'You cannot exceed what Congress gave you — a program cannot spend more than its appropriated amount. If a program runs over budget, it must either get more money from Congress (reprogramming) or descope the work.',
              'Money must be used for its intended purpose — using RDT&E money to buy production equipment is illegal. Using O&M to build a permanent facility is illegal. These rules are enforced, and violations are serious.',
              'Fiscal year end is a real deadline — the end of the government fiscal year (September 30) is a hard deadline for obligating O&M funds. Programs scramble to obligate expiring funds responsibly — but "use it or lose it" thinking can lead to wasteful spending.',
              'Reprogramming requires approval — if a program needs to move money between budget lines or fiscal years, it typically requires Congressional notification or approval depending on the amount.',
            ],
          },
          {
            type: 'tip',
            heading: 'For Contractors: Why You Need to Know This Too',
            body: 'Color of money directly affects you as a contractor. If the government is paying you from O&M funds, your contract must be structured and performed within that fiscal year or you risk the funding expiring. If a CO tells you "we can\'t pay for that under this contract line," color of money is often the reason. Understanding appropriations helps you structure proposals, set payment milestones, and have more productive conversations with your CO and COR about what\'s fundable.',
          },
        ],
        quiz: [
          {
            id: 'q1',
            question: 'What is "color of money" in the context of DoD appropriations?',
            options: [
              'The physical color-coding on budget documents to track spending',
              'The informal term for the type of appropriation, which determines what money can be spent on and how long it can be obligated',
              'A reference to classified funding that cannot be discussed publicly',
              'The difference between authorized and appropriated amounts',
            ],
            correct: 1,
            explanation: '"Color of money" refers informally to the type of appropriation (RDT&E, Procurement, O&M, etc.). Each type has specific authorized uses and obligation periods. Using the wrong color of money — spending O&M on construction, or RDT&E on production — is a potential Anti-Deficiency Act violation.',
          },
          {
            id: 'q2',
            question: 'A program wants to fund a services contract for IT support running from October 2025 through September 2027 using O&M funds. What is the key issue?',
            options: [
              'IT support is not an authorized use of O&M funds',
              'O&M funds have a 1-year obligation period, so a multi-year contract must be structured carefully to avoid obligating funds before they are available',
              'O&M funds cannot be used for contractor services',
              'There is no issue — O&M funds are available indefinitely',
            ],
            correct: 1,
            explanation: 'O&M funds have a 1-year period of availability. For a multi-year services contract, the government can award the contract but must structure funding obligations so each fiscal year\'s O&M is only obligated for work performable in that year. This is a common and important planning challenge in services contracting.',
          },
          {
            id: 'q3',
            question: 'What federal law prohibits spending more money than Congress appropriated, spending on unauthorized purposes, or spending money before it is available?',
            options: [
              'The Federal Acquisition Regulation (FAR)',
              'The Nunn-McCurdy Act',
              'The Anti-Deficiency Act',
              'The Economy Act',
            ],
            correct: 2,
            explanation: 'The Anti-Deficiency Act is the federal law that prohibits the government from obligating or spending funds in excess of appropriations, for unauthorized purposes, or before funds are available. ADA violations must be reported to Congress and OMB and can result in disciplinary action and criminal prosecution.',
          },
          {
            id: 'q4',
            question: 'Which appropriation would be used to fund a study to evaluate alternatives for a new weapons system?',
            options: [
              'Procurement',
              'Operations & Maintenance (O&M)',
              'Research, Development, Test & Evaluation (RDT&E)',
              'Military Personnel (MILPERS)',
            ],
            correct: 2,
            explanation: 'Studies, analyses, and development work — including alternatives analyses, engineering, and testing — are funded by RDT&E appropriations. O&M funds operational costs. Procurement funds production quantities of systems. Buying a system that is already developed and ready for production would require Procurement funds.',
          },
          {
            id: 'q5',
            question: 'What happens to unobligated O&M funds at the end of the fiscal year (September 30)?',
            options: [
              'They roll over automatically to next fiscal year',
              'They can be carried over for up to 3 years',
              'They expire and can no longer be obligated for new work',
              'They are returned to Congress for reallocation',
            ],
            correct: 2,
            explanation: 'O&M funds have a 1-year obligation period. Unobligated O&M funds expire at the end of the fiscal year (September 30) and cannot be used to obligate new contracts or orders. This is why the end of the fiscal year is an intense period of activity — programs scramble to obligate funding before it expires.',
          },
        ],
      },

// ═══════════════════════════════════════════════════════════════════════════
// LESSON 5: The Acquisition Lifecycle — How a Need Becomes a Delivered Capability
// ═══════════════════════════════════════════════════════════════════════════
      {
        id: 'foundations-lifecycle',
        title: 'The Acquisition Lifecycle: From Need to Fielded Capability',
        duration: '18 min',
        description: 'Walk through how a defense capability goes from "someone identified a need" to "the warfighter has the system in the field" — understanding the phases, key decision points, and why the process is structured the way it is.',
        keyTerms: [
          { term: 'Adaptive Acquisition Framework (AAF)', definition: 'The current DoD policy framework (DoDI 5000.02) that replaced the old one-size-fits-all acquisition model with six distinct pathways, each tailored to the type of capability being acquired.' },
          { term: 'Major Capability Acquisition (MCA)', definition: 'The traditional milestone-driven pathway for complex, high-cost platforms (ships, aircraft, ground vehicles). Uses Milestone A, B, and C decision points. Governed by DoDI 5000.85.' },
          { term: 'Milestone Decision Authority (MDA)', definition: 'The official who approves a program\'s entry into a new phase. For ACAT I programs, the MDA is typically the Service Acquisition Executive or USD(A&S).' },
          { term: 'Milestone A', definition: 'The decision point that authorizes entry into the Technology Maturation & Risk Reduction (TMRR) phase. Approves the approach and allows R&D work to begin on the chosen solution.' },
          { term: 'Milestone B', definition: 'The most significant commitment point in most programs. Authorizes entry into Engineering & Manufacturing Development (EMD) — the phase where the system is actually built and tested. Large contracts are awarded here.' },
          { term: 'Milestone C', definition: 'The decision point that authorizes Low Rate Initial Production (LRIP) — building a small quantity of units for testing and initial fielding.' },
          { term: 'Middle Tier of Acquisition (MTA)', definition: 'A faster pathway for capabilities that need to reach the field within 5 years. Two sub-paths: Rapid Prototyping (prototype a new capability) and Rapid Fielding (field mature technology quickly).' },
          { term: 'Software Acquisition Pathway', definition: 'A pathway specifically for software-intensive programs using Agile and DevSecOps delivery, with capability drops every 6 months rather than traditional milestones. Governed by DoDI 5000.87.' },
          { term: 'JCIDS', definition: 'Joint Capabilities Integration and Development System — the DoD\'s process for identifying capability gaps and validating requirements before an acquisition program begins.' },
          { term: 'Acquisition Program Baseline (APB)', definition: 'The formal cost, schedule, and performance baseline approved for a program. A PM\'s job is to execute within APB. Significant deviations trigger reporting requirements and potentially Congressional notification.' },
        ],
        content: [
          {
            type: 'text',
            heading: 'How Something Gets Into the DoD\'s Hands',
            body: 'Every piece of military equipment, every software system, every support service the DoD uses started the same way: someone identified a need. Maybe a combatant commander said troops don\'t have a reliable way to jam enemy communications. Maybe an Air Force pilot said the radar is 30 years old and can\'t detect modern threats. Maybe a program office said it takes six months to get spare parts and that\'s operationally unacceptable.\n\nThat need — if it\'s real, validated, and the DoD decides a new capability is the right answer — eventually becomes an acquisition program. And that program goes through a structured lifecycle to transform the need into a delivered capability in the field.\n\nThis lesson walks you through that lifecycle at a practical level — not every regulatory detail, but the logic of why each phase exists and what matters at each step.',
          },
          {
            type: 'text',
            heading: 'Before the Acquisition Starts: Validating the Need',
            body: 'Before any acquisition program formally begins, the DoD has to establish that there is a genuine capability gap — something the warfighter needs that doesn\'t exist yet or doesn\'t work well enough. This is done through the JCIDS process (Joint Capabilities Integration and Development System).\n\nA document called the Initial Capabilities Document (ICD) captures the gap in warfighter terms: not "we need a new radar" but "our platforms cannot detect X type of threat at Y range, which creates Z operational risk." The ICD is reviewed and validated by the joint requirements community to ensure the need is real and joint — meaning it affects more than just one service.\n\nOnce the ICD is validated, the DoD makes a Materiel Development Decision (MDD) — a formal decision that a material solution (a new or upgraded system) is the right answer and that an acquisition program should begin.',
          },
          {
            type: 'text',
            heading: 'The Six Acquisition Pathways — Choosing the Right Tool',
            body: 'This is where a lot of people get confused because the old "DoD 5000" process was a single, linear lifecycle that every program had to follow. The new Adaptive Acquisition Framework (AAF) recognizes that a simple services contract doesn\'t need the same oversight structure as a $10 billion aircraft program. There are now six distinct pathways.',
          },
          {
            type: 'table',
            heading: 'The Six AAF Pathways at a Glance',
            headers: ['Pathway', 'Best For', 'Key Timeline', 'Governing Instruction'],
            rows: [
              ['Major Capability Acquisition (MCA)', 'Complex, expensive platforms and systems — ships, aircraft, ground vehicles', 'Milestone-driven; 10–20+ years', 'DoDI 5000.85'],
              ['Middle Tier — Rapid Prototyping', 'Developing and demonstrating a new capability quickly', '≤ 5 years to prototype fielding', 'DoDI 5000.80'],
              ['Middle Tier — Rapid Fielding', 'Getting mature, available technology to the field fast', '≤ 6 years to full fielding', 'DoDI 5000.80'],
              ['Software Acquisition', 'Software-intensive systems using Agile/DevSecOps', '6-month capability drops, continuous', 'DoDI 5000.87'],
              ['Defense Business Systems', 'Enterprise IT: financial, HR, logistics systems', 'Business Capability Acquisition Cycle', 'DoDI 5000.75'],
              ['Acquisition of Services', 'Service contracts above $250M', 'Services acquisition strategy', 'DoDI 5000.74'],
            ],
          },
          {
            type: 'callout',
            heading: 'The Most Important Pathway to Understand First: MCA',
            body: 'For anyone new to defense acquisitions, the Major Capability Acquisition (MCA) pathway is the one to learn first. It\'s the traditional milestone-driven process that has governed DoD acquisition for decades and that most regulations, oversight requirements, and career training are built around. Once you understand MCA, the other pathways are easier to grasp because you understand what they\'re departing from and why.',
          },
          {
            type: 'text',
            heading: 'The MCA Lifecycle: Phase by Phase',
            body: 'The MCA pathway is organized into phases separated by milestone review decisions. Each phase has a specific purpose, and a program can only advance to the next phase after a Milestone Decision Authority (MDA) reviews the program\'s progress and approves the next step.',
          },
          {
            type: 'table',
            heading: 'The MCA Lifecycle Phases',
            headers: ['Phase', 'Gate In / Gate Out', 'What Happens Here'],
            rows: [
              ['Materiel Solution Analysis (MSA)', 'MDD → Milestone A', 'Evaluate alternative solutions. Conduct the Analysis of Alternatives (AoA). Pick the approach. No building yet — just figuring out what to build.'],
              ['Technology Maturation & Risk Reduction (TMRR)', 'Milestone A → Milestone B', 'Develop and mature the technology. Build prototypes. Reduce risk. Finalize requirements. Technology must reach TRL 6 before Milestone B.'],
              ['Engineering & Manufacturing Development (EMD)', 'Milestone B → Milestone C', 'Build the actual system. Full engineering, integration, and developmental testing. This is where large development contracts are awarded.'],
              ['Production & Deployment (P&D)', 'Milestone C → FRP Decision', 'Start Low Rate Initial Production (LRIP). Conduct operational testing (IOT&E). Ramp up to Full Rate Production.'],
              ['Operations & Support (O&S)', 'FRP Decision → Disposal', 'Sustain the system in the field for its operational life — often 20–50+ years. The longest and most expensive phase.'],
            ],
          },
          {
            type: 'text',
            heading: 'Why Milestones Exist: Gates, Not Bureaucracy',
            body: 'It\'s tempting to see milestone reviews as bureaucratic hurdles. They\'re not — or at least they shouldn\'t be. Each milestone is a structured decision point where senior leaders ask: is this program ready to advance? Is the technology mature enough? Are the cost estimates realistic? Is the contract strategy sound?\n\nPrograms that skip milestone rigor — or that receive approval before they\'re truly ready due to schedule pressure, Congressional interest, or optimistic staffs — systematically overrun their cost and schedule estimates. The milestone structure exists because history has shown that programs pay a very high price for advancing before they\'re ready.',
          },
          {
            type: 'text',
            heading: 'How Services Fit In',
            body: 'Not everything the DoD buys is a weapons system. The majority of defense contracts by volume are services — people doing work for the government. Services acquisitions follow the "Acquisition of Services" pathway for large requirements, or simpler acquisition approaches for smaller needs.\n\nFor services, the lifecycle looks very different: define the requirement (usually a Performance Work Statement), compete the contract, award it, manage performance through the COR relationship, and re-compete at the end. The milestone review process for systems programs generally doesn\'t apply to services — though services acquisitions above $250M do have their own portfolio review requirements.',
          },
          {
            type: 'tip',
            heading: 'The One Thing to Remember About the Lifecycle',
            body: 'Decisions made early in a program — during MSA, when the requirements are being set and the alternatives are being evaluated — lock in 70–80% of the total program cost. The program office at MSA is typically small and underfunded. The program office at EMD is large and heavily resourced. But the cheaper, smarter investment is the thorough analysis early — because every requirement that\'s poorly defined, every cost estimate that\'s optimistic, and every technology that isn\'t mature enough at Milestone B becomes an expensive problem to fix in EMD.',
          },
        ],
        quiz: [
          {
            id: 'q1',
            question: 'What is the Adaptive Acquisition Framework (AAF)?',
            options: [
              'A single, mandatory lifecycle all DoD programs must follow',
              'A DoD policy framework with six distinct acquisition pathways tailored to different types of programs',
              'A Congressional mandate requiring DoD to reduce acquisition timelines by 50%',
              'A GSA-managed contract vehicle for adaptive IT services',
            ],
            correct: 1,
            explanation: 'The AAF (Adaptive Acquisition Framework, DoDI 5000.02) replaced the old one-size-fits-all process with six distinct pathways: Major Capability Acquisition, Middle Tier (Rapid Prototyping and Rapid Fielding), Software Acquisition, Defense Business Systems, and Acquisition of Services. Each pathway is tailored to the type and complexity of the capability being acquired.',
          },
          {
            id: 'q2',
            question: 'What happens at Milestone B in a Major Capability Acquisition program?',
            options: [
              'The program receives its initial funding and begins studying alternatives',
              'The program completes operational testing and begins Full Rate Production',
              'The MDA approves entry into Engineering & Manufacturing Development — the system is built and tested',
              'The government issues the first task order under the program\'s IDIQ contract',
            ],
            correct: 2,
            explanation: 'Milestone B is the entry into Engineering & Manufacturing Development (EMD) — the phase where the actual system is designed, built, integrated, and tested. It is the largest commitment point in most programs: large development contracts are awarded here, and a program\'s cost and schedule are formally baselined in the Acquisition Program Baseline (APB).',
          },
          {
            id: 'q3',
            question: 'Before a Major Capability Acquisition program can begin, what document must first identify and validate the capability gap?',
            options: [
              'The Acquisition Program Baseline (APB)',
              'The Capability Development Document (CDD)',
              'The Initial Capabilities Document (ICD)',
              'The Analysis of Alternatives (AoA)',
            ],
            correct: 2,
            explanation: 'The Initial Capabilities Document (ICD) is the JCIDS document that identifies a validated capability gap in warfighter terms. Once validated by the requirements community, it triggers the Materiel Development Decision (MDD) and starts the acquisition program. The ICD describes the need — not the solution.',
          },
          {
            id: 'q4',
            question: 'Which AAF pathway would be most appropriate for a software system that needs to deliver new features to users every six months using Agile development methods?',
            options: [
              'Major Capability Acquisition (MCA)',
              'Middle Tier — Rapid Fielding',
              'Software Acquisition Pathway',
              'Acquisition of Services',
            ],
            correct: 2,
            explanation: 'The Software Acquisition Pathway (DoDI 5000.87) is designed specifically for software-intensive programs using Agile and DevSecOps delivery models, with capability drops every six months. It does not use traditional milestones and instead uses a Capability Needs Statement rather than a CDD.',
          },
          {
            id: 'q5',
            question: 'Why do acquisition experts say decisions made in the early phases (MSA) "lock in" most of the program\'s cost?',
            options: [
              'Because the government signs binding fixed-price contracts during MSA',
              'Because Congress sets the budget for the entire program during MSA',
              'Because requirements, design approach, and technology choices made early determine the complexity and cost of everything that follows — changing them later is exponentially more expensive',
              'Because contractors set their prices during the MSA phase and cannot change them',
            ],
            correct: 2,
            explanation: 'Studies (including by RAND and CAPE) consistently show that 70–80% of a program\'s total life-cycle cost is locked in by the decisions made during MSA — what requirements are set, which alternative is chosen, and how mature the technology is. Changing requirements in EMD is 10–100x more expensive than getting them right during MSA. This is why early rigor — despite lower visibility and funding — is the highest-value investment a program can make.',
          },
        ],
      },
