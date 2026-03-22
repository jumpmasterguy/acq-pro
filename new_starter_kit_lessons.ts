// ─── STARTER KIT GAP LESSONS ──────────────────────────────────────────────
// Insert contracts-7 and contracts-8 into CONTRACTS module lessons array
// Insert capture-5 into CAPTURE module lessons array
// Insert ops-5 into OPERATIONS module lessons array

// ═══════════════════════════════════════════════════════════════════════════
// CONTRACTS-7: A&AS, IDIQ Vehicles, GWACs & the Defense Vehicle Landscape
// ═══════════════════════════════════════════════════════════════════════════
      {
        id: 'contracts-7',
        title: 'A&AS, IDIQs, and GWACs: The Defense Vehicle Landscape',
        duration: '18 min',
        description: 'Master the full spectrum of defense contract vehicles — from IDIQ structures and fair opportunity rules to A&AS categories and GWACs that define how defense contractors win recurring work.',
        keyTerms: [
          { term: 'IDIQ', definition: 'Indefinite Delivery, Indefinite Quantity — a contract type that establishes a ceiling value and minimum guarantee, under which the government orders services or supplies via task or delivery orders.' },
          { term: 'Single Award IDIQ', definition: 'An IDIQ where one contractor holds the vehicle and receives all task orders without further competition. Highest revenue certainty; hardest to win.' },
          { term: 'MA-IDIQ', definition: 'Multiple Award IDIQ — the dominant defense contracting model. Multiple contractors hold the vehicle; task orders are competed among awardees under fair opportunity provisions (FAR 16.505).' },
          { term: 'Fair Opportunity', definition: 'FAR 16.505 requirement that all MA-IDIQ awardees receive a fair opportunity to be considered for each task order. Exceptions are narrow and scrutinized.' },
          { term: 'A&AS', definition: 'Advisory and Assistance Services — a formal acquisition category under FAR 37.2 covering management advisory functions, studies and analyses, and engineering and technical services.' },
          { term: 'GWAC', definition: 'Government-Wide Acquisition Contract — a pre-competed IDIQ vehicle available to all federal agencies. Examples: OASIS+, CIO-SP4, Alliant 3, STARS III.' },
          { term: 'GSA MAS', definition: 'GSA Multiple Award Schedule — allows contractors to sell pre-negotiated commercial products and services to federal agencies. A marketing platform, not a revenue guarantee.' },
          { term: 'BPA', definition: 'Blanket Purchase Agreement — a simplified acquisition mechanism for recurring needs, established against an existing contract or GSA Schedule.' },
          { term: 'MAC', definition: 'Multiple Award Contract — umbrella term for any contract vehicle where multiple awardees compete for individual task orders.' },
          { term: 'A&AS-D', definition: 'Advisory and Assistance Services — Digital. Emerging subcategory covering digital engineering, DevSecOps support, and digital transformation advisory. Growing across Air Force and Space Force.' },
          { term: 'OASIS+', definition: 'One Acquisition Solution for Integrated Services Plus — GSA\'s flagship professional services GWAC replacing the legacy OASIS vehicle. Covers complex professional services including program management, management consulting, and engineering.' },
          { term: 'CIO-SP4', definition: 'Chief Information Officer Solutions and Partners 4 — NIH\'s GWAC for IT services and solutions. One of the most widely used GWACs across civilian and defense agencies.' },
        ],
        content: [
          {
            type: 'text',
            heading: 'Why Vehicle Strategy Is Your Most Important BD Decision',
            body: 'Before a single proposal is written, before a capture plan is built, the most consequential BD decision a defense contractor makes is which contract vehicles to pursue and hold. The vehicle you\'re on determines what opportunities you can see, which agencies you can serve, and whether you\'re competing in a pool of 3 contractors or 300. Winning a place on the right IDIQ vehicles is the infrastructure of a sustainable defense business — task order wins are built on top of it.',
          },
          {
            type: 'table',
            heading: 'Contract Vehicle Types — Know the Differences',
            headers: ['Vehicle Type', 'Scope', 'Who Can Use', 'Entry Difficulty', 'Best For'],
            rows: [
              ['IDIQ (Agency-Specific)', 'Agency-specific requirements', 'Named awardees only', 'Moderate–High', 'Recurring work with target agency'],
              ['GWAC', 'Government-wide', 'All federal agencies', 'High — rigorous qualification', 'IT, professional services across agencies'],
              ['GSA MAS', 'Commercial items/services', 'All federal agencies', 'Low–Moderate', 'Commercial-type offerings, product sales'],
              ['BPA', 'Agency/base-level recurring needs', 'Specific CO only', 'Low', 'Recurring small purchases, simplified acquisitions'],
              ['OTA', 'R&D / Prototype only', 'Sponsoring agency', 'Moderate (consortium model)', 'Innovation, rapid prototyping under 10 U.S.C. § 4022'],
            ],
          },
          {
            type: 'text',
            heading: 'Single Award vs. Multiple Award IDIQ — The Revenue Tradeoff',
            body: 'The choice between single and multiple award structures reflects a fundamental government tradeoff between competition and efficiency. Single award IDIQs deliver maximum revenue certainty for the winner — but they require the government to demonstrate that only one firm is capable, which is increasingly difficult to defend. Multiple award IDIQs dominate the defense services landscape precisely because they maintain competition at the task order level while reducing the procurement overhead of re-competing each requirement from scratch.',
          },
          {
            type: 'callout',
            heading: 'Fair Opportunity Is the Rule — Exceptions Are Narrow',
            body: 'Under FAR 16.505, the government must give all MA-IDIQ awardees a fair opportunity to be considered for every task order. The five exceptions — unusual urgency, only one awardee capable, public interest sole source, logical follow-on, and minimum order — are each legally constrained and routinely protested. Never assume an exception applies. If a competitor receives a task order without fair opportunity competition, GAO protest is a viable and often successful remedy.',
          },
          {
            type: 'table',
            heading: 'Single vs. Multiple Award IDIQ — Side by Side',
            headers: ['Feature', 'Standalone Contract', 'Single Award IDIQ', 'Multiple Award IDIQ'],
            rows: [
              ['Competition Level', 'Full & Open or Set-Aside', 'Single competition at award', 'Competition at vehicle + each task order'],
              ['Revenue Certainty', 'High (if awarded)', 'Very High', 'Moderate — depends on win rate'],
              ['Entry Difficulty', 'Moderate to High', 'Very High', 'Moderate'],
              ['Typical Duration', '1–5 years', '5–10 years', '5–10 years'],
              ['BD Effort Post-Award', 'Low', 'Low', 'High — continuous task order competition'],
              ['Common Use Cases', 'Unique, defined scope', 'Specialized capability, single source', 'Broad services, IT, professional services'],
            ],
          },
          {
            type: 'text',
            heading: 'Advisory and Assistance Services (A&AS) — What It Means for Contractors',
            body: 'A&AS is not just a label — it is a formal acquisition category under FAR 37.2 with regulatory implications for how contracts are structured, what personnel qualifications may be required, and how inherently governmental function boundaries are applied. Being categorized as A&AS often means higher scrutiny, more demanding performance standards, and greater government oversight of your personnel qualifications. But it also means access to some of the most stable, high-value recurring work in the defense space.',
          },
          {
            type: 'list',
            heading: 'The Three A&AS Subcategories — Know Yours',
            items: [
              'Management and Professional Support Services — program management support, financial management consulting, organizational studies, strategic advisory. This is where most large defense service firms compete.',
              'Studies, Analyses, and Evaluations — research, assessments, analytical work products, independent evaluations. Requires demonstrated analytical methodology and cleared personnel for sensitive assessments.',
              'Engineering and Technical Services — support to acquisition programs including systems engineering, technical advice, test support, and logistics engineering. The backbone of major program office support contracts.',
              'A&AS-D (Digital) — emerging Air Force/Space Force category covering digital engineering, DevSecOps support, software factory integration, and digital transformation advisory. Contractors without demonstrated digital credentials will find these task orders increasingly difficult to compete.',
            ],
          },
          {
            type: 'text',
            heading: 'The Major GWACs — Which Vehicles to Target',
            body: 'GWACs represent the premium tier of the defense contracting vehicle landscape. They require the most rigorous qualification process and carry the highest competition at task order level — but they open the entire federal marketplace, not just a single agency. The strategic value of a GWAC position compounds over time as you build past performance, expand to new agencies, and develop relationships across the federal enterprise.',
          },
          {
            type: 'table',
            heading: 'Key Defense & Federal GWACs',
            headers: ['GWAC', 'Managed By', 'Scope', 'Key For', 'Set-Aside Pools'],
            rows: [
              ['OASIS+', 'GSA', 'Complex professional services: PM, management consulting, engineering, logistics', 'Large businesses + SB set-aside pools', 'Yes — SB, SDB, 8(a), SDVOSB, HUBZone, WOSB'],
              ['CIO-SP4', 'NIH', 'IT services and solutions', 'IT-focused defense contractors', 'Yes — unrestricted + small business'],
              ['Alliant 3', 'GSA', 'Large-scale IT solutions and services', 'Large prime IT integrators', 'Unrestricted only'],
              ['STARS III', 'GSA', 'IT services for small businesses', 'Small businesses in IT/cyber/cloud', 'Small business only'],
              ['SEWP VI', 'NASA', 'IT products and product-related services', 'Product-heavy offerings', 'Mixed pools'],
            ],
          },
          {
            type: 'tip',
            heading: 'OTA Warning for Contractors',
            body: 'Other Transaction Agreements under 10 U.S.C. § 4022 are NOT contracts in the FAR sense — they bypass standard procurement regulations. This makes them attractive for speed but requires careful legal and DCAA awareness. OTAs executed through consortium managers (like NSTXL, AFWERX, or DIU) have different terms than traditional contracts. Always have acquisition counsel review OTA terms before executing — particularly around IP rights, audit access, and flow-down requirements.',
          },
          {
            type: 'text',
            heading: 'Building Your Vehicle Portfolio Strategy',
            body: 'A mature defense contractor does not pursue every vehicle — it builds a deliberate portfolio aligned to its core capabilities, target agencies, and growth strategy. The right vehicle mix balances near-term revenue (agency-specific IDIQs where you have relationships) with long-term expansion (GWACs that open new agencies) and specialized positioning (set-aside vehicles that leverage socioeconomic certifications). Map every pursuit in your pipeline to a vehicle before you commit proposal resources.',
          },
        ],
        quiz: [
          {
            id: 'q1',
            question: 'Under FAR 16.505, what is the default rule for task order competition on a Multiple Award IDIQ?',
            options: [
              'The government may award to any awardee at its sole discretion',
              'All awardees must receive a fair opportunity to be considered',
              'Task orders under $150,000 require full and open competition',
              'The incumbent contractor receives right of first refusal',
            ],
            correct: 1,
            explanation: 'FAR 16.505 requires the government to provide all MA-IDIQ awardees a fair opportunity to be considered for each task order. This is the default rule — exceptions (unusual urgency, only one awardee capable, public interest, logical follow-on, minimum order) are narrow and legally constrained.',
          },
          {
            id: 'q2',
            question: 'Which A&AS subcategory covers digital engineering support, DevSecOps, and software factory integration?',
            options: [
              'Management and Professional Support Services',
              'Studies, Analyses, and Evaluations',
              'Engineering and Technical Services',
              'A&AS-D (Digital)',
            ],
            correct: 3,
            explanation: 'A&AS-D (Digital) is the emerging subcategory gaining traction across the Air Force and Space Force that specifically covers digital engineering, DevSecOps support, software factory integration, and digital transformation advisory.',
          },
          {
            id: 'q3',
            question: 'What is the key distinction between a GWAC and an agency-specific IDIQ?',
            options: [
              'GWACs have higher minimum guarantees than agency IDIQs',
              'GWACs are available to all federal agencies; agency IDIQs are limited to named awardees',
              'Agency IDIQs require Congressional notification; GWACs do not',
              'GWACs are only for small businesses; agency IDIQs are unrestricted',
            ],
            correct: 1,
            explanation: 'The defining characteristic of a GWAC is that it is available government-wide — any federal agency can place orders against it. Agency-specific IDIQs are limited to the ordering agency and named awardees only.',
          },
          {
            id: 'q4',
            question: 'An OTA (Other Transaction Agreement) differs from a traditional FAR contract primarily because:',
            options: [
              'OTAs have lower dollar thresholds',
              'OTAs bypass standard FAR procurement regulations',
              'OTAs require Congressional approval',
              'OTAs are only available to small businesses',
            ],
            correct: 1,
            explanation: 'OTAs under 10 U.S.C. § 4022 are NOT contracts in the FAR sense — they bypass standard procurement regulations. This makes them attractive for speed and innovation but requires careful legal review, particularly around IP rights, DCAA access, and flow-down requirements.',
          },
          {
            id: 'q5',
            question: 'Which of the following best describes the GSA Multiple Award Schedule (MAS)?',
            options: [
              'A guaranteed revenue source for qualified contractors',
              'A pre-competed vehicle available only to defense agencies',
              'A marketing platform with pre-negotiated commercial terms available to all federal agencies',
              'An IDIQ requiring annual task order competitions',
            ],
            correct: 2,
            explanation: 'The GSA MAS allows contractors to sell pre-negotiated commercial products and services to federal agencies — but it is a marketing platform, not a revenue guarantee. Contractors must actively pursue orders; simply holding a schedule generates no revenue.',
          },
          {
            id: 'q6',
            question: 'OASIS+ is best described as:',
            options: [
              'An Army-specific IDIQ for base operations services',
              'GSA\'s flagship GWAC for complex professional services including program management and engineering',
              'A NASA GWAC for IT products and services',
              'A DoD-only vehicle for classified program support',
            ],
            correct: 1,
            explanation: 'OASIS+ (One Acquisition Solution for Integrated Services Plus) is GSA\'s flagship GWAC for complex professional services — covering program management, management consulting, engineering, logistics, and scientific services. It replaced the legacy OASIS vehicle and includes both unrestricted and small business set-aside pools.',
          },
        ],
      },

// ═══════════════════════════════════════════════════════════════════════════
// CONTRACTS-8: Who's Buying — Navigating the Defense Contracting Enterprise
// ═══════════════════════════════════════════════════════════════════════════
      {
        id: 'contracts-8',
        title: 'Who\'s Buying: Navigating the DoD Contracting Enterprise',
        duration: '16 min',
        description: 'Map the organizations that actually issue defense contracts — from AFICC/ESS and base-level contracting squadrons to MAJCOM contracting offices — and build a BD strategy aligned to the right customer.',
        keyTerms: [
          { term: 'AFICC', definition: 'Air Force Installation Contracting Center — manages enterprise-level contracting for installation and mission support requirements across the Air Force. Its Enterprise Sourcing Squadrons (ESS) handle large-dollar, multi-year service acquisitions.' },
          { term: 'ESS', definition: 'Enterprise Sourcing Squadron — AFICC\'s operational contracting units that manage large-dollar, enterprise-level acquisitions across installations and functional areas (sustainment, services, IT infrastructure).' },
          { term: 'MAJCOM', definition: 'Major Command — top-level Air Force organizational units (ACC, AMC, AFSOC, USAFE-AFAFRICA, etc.) with aligned contracting support for operationally-driven, often classified requirements.' },
          { term: 'SAP', definition: 'Simplified Acquisition Procedures — streamlined procurement methods for purchases below the Simplified Acquisition Threshold ($250,000). Base-level contracting heavily uses SAP.' },
          { term: 'SAT', definition: 'Simplified Acquisition Threshold — currently $250,000. Purchases below this threshold may use simplified procedures; above it requires more formal competition requirements.' },
          { term: 'BPA', definition: 'Blanket Purchase Agreement — a simplified acquisition mechanism used heavily at base level for recurring, predictable requirements. Issued against GSA Schedules or open market.' },
          { term: 'PWS', definition: 'Performance Work Statement — outcome-based description of work required; used in performance-based service acquisitions. Base-level and ESS offices increasingly require PWS-style solicitations.' },
          { term: 'SAM.gov', definition: 'System for Award Management — the official federal database for contract opportunities, awardee registration, and past performance. Primary source of visible solicitations above SAT.' },
          { term: 'CPARS', definition: 'Contractor Performance Assessment Reporting System — the government\'s official record of contractor performance on federal contracts. Past Performance in CPARS is one of the most important factors in source selection.' },
        ],
        content: [
          {
            type: 'text',
            heading: 'The Most Underestimated Competitive Advantage in Defense BD',
            body: 'One of the most underestimated competitive advantages a defense contractor can develop is a precise understanding of who actually issues the contract. The Air Force contracting enterprise — and the DoD contracting enterprise broadly — is not monolithic. It is divided into distinct organizational layers, each with different authorities, contract size thresholds, mission focus, and levels of accessibility to industry. Contractors who confuse these layers build misaligned BD strategies, waste proposal resources, and miss opportunities that better-informed competitors capture.',
          },
          {
            type: 'table',
            heading: 'The Three Layers of Air Force Contracting',
            headers: ['Layer', 'Typical Contract Size', 'Competition Type', 'Entry Difficulty', 'Visibility (SAM.gov)', 'Relationship Weight'],
            rows: [
              ['AFICC / ESS', '$1M–$100M+', 'Formal source selection, written proposals, oral presentations', 'Moderate–High', 'High', 'Moderate'],
              ['Base-Level Contracting Squadrons', 'Under $1M (SAP range)', 'Simplified acquisition, BPAs, sole-source justifications', 'Low–Moderate', 'Moderate', 'Very High'],
              ['MAJCOM / Service Component', '$500K–$50M+ (varies)', 'Formal to streamlined; often classified or operationally sensitive', 'High (clearance, access required)', 'Low–Moderate', 'High'],
            ],
          },
          {
            type: 'text',
            heading: 'AFICC / Enterprise Sourcing Squadrons — The Primary Entry Point',
            body: 'The Air Force Installation Contracting Center and its Enterprise Sourcing Squadrons represent the most accessible entry point for mid-size to large contractors seeking multi-year service contracts. ESS offices typically manage requirements from $1M to well over $100M, running formal source selections with written proposals, oral presentations, and structured evaluation criteria. These competitions reward thorough market research, strong PWS/SOW alignment, and credible past performance. AFICC covers enterprise services across installations — sustainment, base operations, information technology infrastructure, and logistics support are common requirement types.',
          },
          {
            type: 'callout',
            heading: 'How to Engage AFICC/ESS Offices',
            body: 'ESS offices publish pre-solicitation notices, Requests for Information, and Sources Sought notices on SAM.gov. Responding to these is not optional for serious competitors — it shapes the requirement, establishes your firm in the CO\'s market research, and gives you intelligence about the acquisition timeline and competitive landscape. Industry Days, when offered, are your best opportunity to understand evaluation criteria priorities and ask questions that competitors who don\'t attend will not know to ask.',
          },
          {
            type: 'text',
            heading: 'Base-Level Contracting Squadrons — Where Relationships Win',
            body: 'Base-level contracting squadrons are where relationships matter most. These offices process thousands of smaller actions annually — blanket purchase agreements, simplified acquisitions, and sole-source justifications under SAP thresholds. For small businesses and new market entrants, base-level contracting provides the fastest pathway to building past performance. Contracting Officers at the base level value reliable incumbents highly, making early market entry and COR relationship-building critical investments. A $150,000 BPA awarded today can become the past performance reference that wins a $5M ESS contract in two years.',
          },
          {
            type: 'list',
            heading: 'Base-Level BD Strategy — What Actually Works',
            items: [
              'Identify the installation contracting squadron through the Air Force\'s Installation directory or SAM.gov agency searches. Every installation with a significant contracting footprint has a publicly accessible contracting office.',
              'Attend base-level small business events and installation open houses. Base contracting squadrons actively engage with industry — especially small businesses — in ways that larger enterprise offices cannot.',
              'Build relationships with Contracting Officer Representatives (CORs), not just Contracting Officers. The COR is your day-to-day performance evaluator and one of the most influential voices in CPARS ratings and recompete positioning.',
              'Focus on performance above all else. At the base level, your reputation spreads rapidly. A single strong CPARS rating from a base installation can be leveraged across the entire AFICC enterprise.',
            ],
          },
          {
            type: 'text',
            heading: 'MAJCOM Contracting — High Barrier, Lower Competition',
            body: 'MAJCOM-aligned contracting, such as the contracting operations supporting USAFE-AFAFRICA or Air Combat Command, handles operationally-driven requirements that often carry unique classification, OCONUS, or mission-specific constraints. These opportunities are less visible on SAM.gov and often require security clearances, theater knowledge, and existing relationships with program offices. Entry is harder, but competition is typically less crowded. For cleared defense firms with specialized mission-area expertise, MAJCOM contracting represents some of the most defensible, long-term contract opportunities in the Air Force portfolio.',
          },
          {
            type: 'table',
            heading: 'Key Air Force MAJCOMs and Their Contracting Focus',
            headers: ['MAJCOM', 'Mission Focus', 'Contracting Characteristics', 'Best For'],
            rows: [
              ['Air Force Materiel Command (AFMC)', 'Acquisition, sustainment, R&D across Air Force programs', 'Largest acquisition authority; manages most ACAT programs', 'Prime contractors, engineering support firms'],
              ['Air Combat Command (ACC)', 'Combat air forces, CONUS fighter and bomber units', 'Operations support, training, base services', 'Mid-tier services firms with operational support experience'],
              ['Air Mobility Command (AMC)', 'Airlift, air refueling, aeromedical evacuation', 'Logistics, maintenance, ground support services', 'Logistics and sustainment contractors'],
              ['USAFE-AFAFRICA', 'European and African theater air forces', 'OCONUS work, NATO coordination, classified requirements', 'Cleared firms with international operations capability'],
              ['Air Force Special Operations Command (AFSOC)', 'Special operations aviation', 'Small, highly specialized contracts; classified requirements', 'Niche capability firms with AFSOC relationships'],
            ],
          },
          {
            type: 'text',
            heading: 'Applying This Framework Beyond the Air Force',
            body: 'While this lesson uses the Air Force enterprise as the primary example, the same three-tier structure exists across all military services and many defense agencies. The Army has Installation Management Command (IMCOM) contracting, Army Contracting Command (ACC), and theater-level contracting offices. The Navy has NAVSUP Fleet Logistics Centers, SPAWAR (now NAVWAR), and fleet-level contracting. Understanding which tier of any service\'s contracting enterprise you are engaging — and aligning your BD approach accordingly — is one of the clearest markers of a mature defense contractor.',
          },
          {
            type: 'tip',
            heading: 'Build a Customer Map Before You Build a Pipeline',
            body: 'Before you populate a BD pipeline, build a customer map. For each target installation or command, identify: the contracting squadron or office, the contracting officer(s) for your NAICS codes, the program offices or functional areas you support, and the CORs on any current or adjacent contracts. This map is the infrastructure of a disciplined BD strategy — without it, you\'re pursuing opportunities without knowing who controls the award decision.',
          },
        ],
        quiz: [
          {
            id: 'q1',
            question: 'AFICC Enterprise Sourcing Squadrons (ESS) are primarily responsible for:',
            options: [
              'Processing simplified acquisitions under the Simplified Acquisition Threshold',
              'Large-dollar, enterprise-level acquisitions across installations and functional areas',
              'Classified acquisition programs for AFSOC and special operations',
              'Small business set-aside competitions at individual base levels',
            ],
            correct: 1,
            explanation: 'AFICC ESS offices handle large-dollar, enterprise-level acquisitions ($1M to $100M+) across Air Force installations — covering sustainment, services, and IT infrastructure. They run formal source selections with written proposals and structured evaluation criteria.',
          },
          {
            id: 'q2',
            question: 'For a small business entering the defense market, which contracting tier typically offers the fastest pathway to building past performance?',
            options: [
              'AFICC / Enterprise Sourcing Squadrons',
              'MAJCOM contracting offices',
              'Base-level contracting squadrons',
              'Defense Pricing and Contracting (DPC)',
            ],
            correct: 2,
            explanation: 'Base-level contracting squadrons process thousands of smaller actions annually under simplified acquisition procedures. For small businesses and new market entrants, this is the fastest pathway to building past performance through BPAs, sole-source justifications, and simplified acquisitions below the SAT.',
          },
          {
            id: 'q3',
            question: 'Why are MAJCOM contracting opportunities typically less visible on SAM.gov?',
            options: [
              'MAJCOM offices are exempt from public procurement posting requirements',
              'Requirements are often operationally sensitive, classified, or OCONUS',
              'MAJCOM contracts are below the SAT and don\'t require posting',
              'MAJCOM contracting is conducted exclusively through GWACs',
            ],
            correct: 1,
            explanation: 'MAJCOM-aligned contracting handles operationally-driven requirements that often carry unique classification, OCONUS, or mission-specific constraints. These characteristics reduce their SAM.gov visibility, but also mean less crowded competition for firms with the right clearances and relationships.',
          },
          {
            id: 'q4',
            question: 'Which Air Force MAJCOM manages the largest acquisition authority and most ACAT programs?',
            options: [
              'Air Combat Command (ACC)',
              'Air Mobility Command (AMC)',
              'Air Force Materiel Command (AFMC)',
              'USAFE-AFAFRICA',
            ],
            correct: 2,
            explanation: 'Air Force Materiel Command (AFMC) manages acquisition, sustainment, and R&D across Air Force programs. It has the largest acquisition authority of any Air Force MAJCOM and manages most ACAT-designated programs, making it the primary target for prime contractors and engineering support firms.',
          },
          {
            id: 'q5',
            question: 'What is the strategic value of building a strong CPARS rating at the base installation level?',
            options: [
              'It automatically qualifies your firm for AFICC ESS competitions',
              'It can be leveraged as past performance across the entire AFICC enterprise in future source selections',
              'It exempts your firm from oral presentation requirements',
              'It qualifies your firm for sole-source awards on all future base requirements',
            ],
            correct: 1,
            explanation: 'A strong CPARS rating from base-level performance is compelling past performance evidence that can be used in source selections across the AFICC enterprise. Past performance is a key evaluation factor in most formal source selections — quality ratings from any installation are portable competitive assets.',
          },
        ],
      },

// ═══════════════════════════════════════════════════════════════════════════
// CAPTURE-5: 5 Most Common Mistakes Contractors Make
// ═══════════════════════════════════════════════════════════════════════════
      {
        id: 'capture-5',
        title: '5 Most Common Mistakes Contractors Make (And How to Avoid Them)',
        duration: '14 min',
        description: 'The five systematic errors that cost defense contractors contracts, relationships, and revenue — drawn from real patterns across BD, capture, proposal, and performance operations.',
        keyTerms: [
          { term: 'pWin', definition: 'Probability of Win — an assessment of the likelihood of winning a specific opportunity, typically expressed as a percentage. Used in gate reviews to determine whether to invest proposal resources.' },
          { term: 'Pipeline Strategy', definition: 'A disciplined approach to identifying, qualifying, and sequencing pursuit opportunities 12–18 months before RFP release, aligned to NAICS codes, vehicle positions, and win probability thresholds.' },
          { term: 'CPARS', definition: 'Contractor Performance Assessment Reporting System — the government\'s official record of contractor performance. High CPARS ratings are essential past performance evidence for future proposals.' },
          { term: 'COR', definition: 'Contracting Officer\'s Representative — the government\'s day-to-day technical interface during contract performance. One of the most influential voices in CPARS ratings and recompete positioning.' },
          { term: 'SOW', definition: 'Statement of Work — prescriptive task-level description of work. Tells the contractor exactly what to do.' },
          { term: 'PWS', definition: 'Performance Work Statement — outcome-based description of required performance. Tells the contractor what result to achieve, leaving the method to the contractor.' },
          { term: 'DCAA', definition: 'Defense Contract Audit Agency — conducts pre-award surveys, incurred cost audits, and forward pricing reviews. DCAA compliance gaps can kill contract awards or trigger costly remediation.' },
          { term: 'Recompete', definition: 'The process of re-competing an existing contract at expiration. Incumbents have advantages — but lose at higher rates than most contractors assume if they don\'t actively manage recompete risk.' },
          { term: 'Incurred Cost Audit', definition: 'DCAA audit of a contractor\'s actual costs incurred on cost-reimbursable contracts. Filed annually via the Incurred Cost Submission (ICS).' },
        ],
        content: [
          {
            type: 'text',
            heading: 'Why Experienced Contractors Keep Making These Mistakes',
            body: 'The five mistakes in this lesson are not beginner errors — they are systematic gaps in pipeline strategy, relationship management, and compliance posture that show up across defense contractors of all sizes, from small businesses to large primes. They persist because they are organizational failures, not individual ones. Fixing them requires process changes, not just awareness.',
          },
          {
            type: 'callout',
            heading: 'Mistake #1: No Pipeline Strategy — Chasing vs. Planning',
            body: 'The most common and costly mistake: treating BD as reactive rather than strategic. Contractors who chase every opportunity on SAM.gov without a disciplined pipeline framework waste proposal resources, burn out their teams, and win at low rates. A mature pipeline strategy identifies target customers 12–18 months before RFP release, maps vehicle opportunities aligned to your NAICS codes and capabilities, and scores every opportunity by pWin before committing proposal resources. Without this, you are funding your competitor\'s market research — because every proposal you submit at low pWin consumes resources that could have been focused on winnable work.',
          },
          {
            type: 'list',
            heading: 'Pipeline Discipline — What a Mature System Looks Like',
            items: [
              'Minimum 18-month horizon: opportunities should enter your pipeline at least 18 months before RFP, giving you time to shape requirements, build relationships, and position your solution.',
              'pWin gate: no opportunity proceeds to active capture without a documented pWin assessment. Typical thresholds: below 25% = watch only; 25–50% = selective investment; above 50% = full capture investment.',
              'Vehicle alignment: every opportunity in the pipeline must map to a vehicle you hold or are pursuing. If you don\'t have the vehicle, pursuing the opportunity is premature.',
              'Qualification criteria: define your "no bid" criteria before you see opportunities. Common no-bid signals include incumbent with strong CPARS, requirement written around competitor capabilities, and budget not yet appropriated.',
            ],
          },
          {
            type: 'callout',
            heading: 'Mistake #2: Ignoring the COR — Focusing Only on the CO',
            body: 'The Contracting Officer\'s Representative is the government\'s day-to-day technical interface during contract performance — and one of the most influential voices in CPARS ratings and recompete positioning. Contractors who treat the COR as an administrative checkpoint rather than a strategic relationship miss the single best source of performance feedback, requirement shaping intelligence, and past performance narrative. Build a structured engagement plan with the COR from contract kickoff. Deliver proactive status updates, document issues in writing, and ensure your PM treats every COR interaction as a performance evaluation in progress.',
          },
          {
            type: 'callout',
            heading: 'Mistake #3: Confusing PWS and SOW — Proposing the Wrong Way',
            body: 'A Statement of Work tells you what to do in prescriptive, task-level detail. A Performance Work Statement tells you what outcome to achieve, leaving the method to the contractor. These are not interchangeable — and responding to a PWS with a SOW-style proposal (listing activities instead of outcomes) is a red flag to evaluators. It signals your team doesn\'t understand performance-based contracting, which is the dominant acquisition model in services. PWS-based proposals should describe your management framework, quality metrics, and how you measure and demonstrate outcomes — not a labor hour breakdown by task.',
          },
          {
            type: 'table',
            heading: 'SOW vs. PWS — How Your Proposal Should Respond',
            headers: ['Element', 'SOW-Based Contract', 'PWS-Based Contract'],
            rows: [
              ['Government specifies', 'Specific tasks to be performed', 'Performance outcomes and standards'],
              ['Contractor proposes', 'How it will execute each task', 'Management approach + how it will measure/achieve outcomes'],
              ['Evaluation focus', 'Technical approach to tasks', 'Quality management, metrics, and performance framework'],
              ['Pricing approach', 'Labor category + hours by task', 'Outcome-based; contractor owns the "how"'],
              ['Risk allocation', 'Government bears method risk', 'Contractor bears method risk; government bears requirements risk'],
              ['Common mistake', 'N/A', 'Responding like an SOW — listing tasks instead of outcomes and metrics'],
            ],
          },
          {
            type: 'callout',
            heading: 'Mistake #4: DCAA Compliance Gaps Discovered at the Worst Time',
            body: 'The Defense Contract Audit Agency conducts pre-award surveys, incurred cost audits, and forward pricing reviews that can kill a contract award or trigger costly remediation during performance. Contractors — especially those transitioning from commercial work to cost-reimbursable contracts — frequently discover DCAA compliance gaps only after award, when the pressure is highest. Common gaps include inadequate timekeeping systems, unallowable cost pooling, missing written policies for compensation and travel, and indirect rate structures that don\'t align to contract requirements. Establish a compliant accounting system before pursuing cost-type work. Engage a DCAA-savvy CPA or contracts attorney before your first cost-reimbursable award — not after.',
          },
          {
            type: 'list',
            heading: 'Most Common DCAA Compliance Gaps — Fix Before Award',
            items: [
              'Timekeeping system: must capture time by contract/project daily, not estimated retroactively. DCAA requires contemporaneous timekeeping — this is non-negotiable.',
              'Unallowable cost segregation: FAR 31.205 identifies numerous unallowable cost categories (entertainment, alcohol, certain lobbying). These must be segregated in your accounting system before incurred cost submissions.',
              'Written policies: compensation, travel, and overtime policies must be in writing and consistently applied. Verbal policies are invisible to auditors and unenforceable.',
              'Indirect rate structure: your labor categories, overhead pools, and G&A base must align to how work is actually organized and priced. Misalignment creates audit findings that require costly restructuring mid-contract.',
            ],
          },
          {
            type: 'callout',
            heading: 'Mistake #5: No Recompete Plan — Losing What You Already Won',
            body: 'Contractors routinely focus 90% of their capture energy on new business while neglecting the most winnable opportunity in their portfolio: the contract they already hold. The incumbent win rate on federal contracts is not as high as most contractors assume — and a poorly executed recompete can erase years of revenue in a single award decision. Recompete planning should begin at contract award — not 12 months before expiration. A recompete plan documents performance wins, maintains CPARS narrative alignment, tracks staffing continuity risks, monitors competitive intelligence on challenger firms, and coordinates capture strategy with delivery teams in real time.',
          },
          {
            type: 'table',
            heading: 'Recompete Planning Timeline — Start at Award',
            headers: ['Phase', 'Timing', 'Key Actions'],
            rows: [
              ['Foundation', 'Award → Month 6', 'Document transition execution, establish COR relationship, baseline performance metrics, start CPARS narrative file'],
              ['Performance Building', 'Month 6 → 36', 'Deliver above expectations, proactively document wins, engage COR monthly, identify staffing risks, monitor competitor positioning'],
              ['Pre-Recompete', '24 months before expiration', 'Formal recompete plan activation, competitive intelligence refresh, pricing strategy development, key personnel retention plan'],
              ['Active Capture', '12 months before RFP', 'Requirement shaping, customer validation, Black Hat assessment, proposal team assembly, price-to-win analysis'],
              ['Proposal', 'RFP release', 'Full proposal execution with incumbent advantage messaging, past performance narrative, continuous improvement story'],
            ],
          },
        ],
        quiz: [
          {
            id: 'q1',
            question: 'A contractor\'s pipeline shows 40 active opportunities, only 3 of which have pWin assessments above 40%. What does this indicate?',
            options: [
              'Strong BD performance — a large pipeline maximizes win probability',
              'An undisciplined pipeline strategy that is likely wasting proposal resources on low-probability pursuits',
              'The contractor should increase proposal volume to improve win totals',
              'Normal BD operations — most opportunities in any pipeline have low pWin',
            ],
            correct: 1,
            explanation: 'A pipeline dominated by low-pWin opportunities signals reactive, undisciplined BD. Proposal resources are finite — investing them in low-probability pursuits reduces the quality of proposals on winnable work. A mature pipeline prioritizes opportunities where the contractor has competitive advantages and validated customer relationships.',
          },
          {
            id: 'q2',
            question: 'Why is the COR more strategically important than most contractors realize?',
            options: [
              'The COR has authority to award contract modifications over $150,000',
              'The COR is the primary author of CPARS ratings and the most influential voice in recompete positioning',
              'The COR controls the government\'s budget allocation for the contract',
              'The COR approves all invoices before the CO processes payment',
            ],
            correct: 1,
            explanation: 'The COR is the government\'s day-to-day technical interface and one of the most influential voices in CPARS ratings. A strong COR relationship directly impacts past performance ratings, recompete intelligence, and requirement shaping. Contractors who treat CORs as administrative checkpoints consistently underperform on recompetes.',
          },
          {
            id: 'q3',
            question: 'A solicitation uses a Performance Work Statement. How should a contractor\'s technical proposal respond?',
            options: [
              'Provide a detailed task-by-task breakdown with labor hours per activity',
              'Describe the management framework, quality metrics, and how outcomes will be measured and achieved',
              'Mirror the PWS structure with a direct response to each performance standard',
              'Propose a fixed schedule of deliverables aligned to the government\'s task list',
            ],
            correct: 1,
            explanation: 'PWS-based proposals should focus on management approach, quality management framework, and how the contractor will measure and demonstrate achievement of outcomes. Responding with a task-by-task activity list (SOW-style) signals a fundamental misunderstanding of performance-based contracting and is a red flag to evaluators.',
          },
          {
            id: 'q4',
            question: 'Which DCAA compliance requirement is described as "non-negotiable" for contractors on cost-reimbursable work?',
            options: [
              'Monthly financial reporting to the contracting officer',
              'Contemporaneous timekeeping — capturing time by contract daily, not retroactively',
              'Written compensation policies approved by the CO before award',
              'Independent audit of indirect rates by a certified public accountant',
            ],
            correct: 1,
            explanation: 'Contemporaneous timekeeping — capturing employee time by contract or project daily — is DCAA\'s most fundamental requirement and is non-negotiable. Retroactive time estimates or after-the-fact adjustments are a primary finding in DCAA audits and can result in cost disallowances, system rejection, and contract termination.',
          },
          {
            id: 'q5',
            question: 'When should a contractor formally activate its recompete plan?',
            options: [
              '12 months before contract expiration, when the RFP timeline becomes clear',
              '6 months before expiration, when the government issues a pre-solicitation notice',
              'At contract award — the moment the current period of performance begins',
              '30 days before proposal submission deadline',
            ],
            correct: 2,
            explanation: 'Recompete planning should begin at contract award — not 12 months before expiration. The entire period of performance is recompete positioning time. CPARS narratives, performance documentation, competitive intelligence, and staffing continuity plans all need to be built over the life of the contract, not assembled in a last-minute rush before the RFP.',
          },
        ],
      },

// ═══════════════════════════════════════════════════════════════════════════
// OPS-5: 5 Most Common Mistakes New PMs Make
// ═══════════════════════════════════════════════════════════════════════════
      {
        id: 'ops-5',
        title: '5 Most Common Mistakes New Program Managers Make',
        duration: '16 min',
        description: 'The five failure patterns that define struggling defense program managers — drawn from real acquisition programs. Recognizing them before you make them can save your program months and protect your career.',
        keyTerms: [
          { term: 'IMS', definition: 'Integrated Master Schedule — the master schedule that integrates all program tasks, dependencies, and critical path relationships. Should be a living management tool, not a reporting artifact.' },
          { term: 'Critical Path', definition: 'The sequence of dependent tasks that determines the minimum program duration. Any delay on the critical path directly delays the program end date.' },
          { term: 'Work Package', definition: 'The lowest-level element of a WBS where work is planned, budgeted, and measured. IMS schedule discipline must be maintained at the work package level.' },
          { term: 'Nunn-McCurdy', definition: 'The statutory cost breach notification law (10 U.S.C. § 2433). A 15% unit cost growth over the current APB triggers a "significant" breach notification to Congress; 25% over the original APB triggers a "critical" breach requiring USD(A&S) certification or program termination.' },
          { term: 'APB', definition: 'Acquisition Program Baseline — the formal cost, schedule, and performance baseline approved at Milestone B. Nunn-McCurdy breach thresholds are calculated against APB values.' },
          { term: 'EVMS', definition: 'Earned Value Management System — the contractor\'s management control system for planning, measuring, and reporting performance. Must be DCMA-accepted for ACAT I programs.' },
          { term: 'KPP', definition: 'Key Performance Parameter — a threshold requirement that, if not met, may require program review and potentially different acquisition approach. Every KPP must be testable and verifiable.' },
          { term: 'JROC', definition: 'Joint Requirements Oversight Council — validates requirements for ACAT I programs. Chaired by the VCJCS; ensures requirements are joint and prioritized.' },
          { term: 'CAPE', definition: 'Cost Assessment and Program Evaluation — OSD office that produces independent cost assessments. CAPE estimates are typically higher than program office estimates and are historically more accurate.' },
          { term: 'SPI', definition: 'Schedule Performance Index — EV/PV. Measures schedule efficiency. Below 1.0 means schedule is behind plan; above 1.0 means ahead.' },
          { term: 'CPI', definition: 'Cost Performance Index — EV/AC. Measures cost efficiency. Below 1.0 means spending more than planned for work accomplished; above 1.0 means under budget.' },
        ],
        content: [
          {
            type: 'text',
            heading: 'The Steepest Learning Curve in Government Service',
            body: 'The transition into a program manager role is one of the steepest learning curves in government service. The technical knowledge, regulatory familiarity, and stakeholder management skills required are immense — and there is rarely enough time to develop them through formal training alone before the first milestone review arrives. The five patterns below appear across programs of all sizes and services. They are not obscure edge cases. They are the default failure mode when a PM hasn\'t been explicitly warned.',
          },
          {
            type: 'callout',
            heading: 'Mistake #1: Treating the IMS as a Reporting Tool, Not a Management Tool',
            body: 'New PMs often inherit an Integrated Master Schedule that their predecessor built primarily to satisfy oversight reporting requirements. The IMS becomes a static document updated before reviews rather than a living management artifact. This is a critical error. The IMS should be your primary tool for tracking program health — every work package, every dependency, every critical path relationship must reflect reality. A schedule that shows green when the program is actually amber or red doesn\'t protect you; it exposes you to far greater risk when the truth surfaces at a major milestone review.',
          },
          {
            type: 'list',
            heading: 'IMS Best Practices — What Effective PMs Do',
            items: [
              'Hold weekly schedule scrubs with IPT leads — not just reviews of the summary schedule, but work package level status with responsible parties defending their dates.',
              'Enforce schedule discipline at the work package level. If a work package owner reports "on schedule" but their completion date has slipped, that is a red flag requiring immediate discussion.',
              'Never let the IMS drift more than one reporting cycle from ground truth. A single reporting period of "we\'ll catch up" compounds into months of unrecoverable schedule growth.',
              'Maintain a separate, honest internal view alongside any externally-formatted schedule. What you brief to oversight should be accurate — but your internal working view should include all known risks and their schedule impacts before they become public.',
            ],
          },
          {
            type: 'callout',
            heading: 'Mistake #2: Not Knowing Your Nunn-McCurdy Thresholds in Dollar Terms',
            body: 'Many new PMs know Nunn-McCurdy exists but have never calculated their program\'s specific breach thresholds in dollar terms. This is dangerous. The Nunn-McCurdy Act requires Congressional notification when an ACAT I program\'s unit cost grows beyond specific thresholds: a 15% increase over the current APB baseline triggers a "significant" breach notification, while a 25% increase over the original APB baseline triggers a "critical" breach — requiring USD(A&S) certification or program termination. You should know, at any given moment, exactly how much cost growth in total dollars separates your program from each threshold. Brief your PEO on this quarterly. Never let a potential breach be a surprise to your chain of command.',
          },
          {
            type: 'formula',
            heading: 'Calculating Your Nunn-McCurdy Thresholds',
            formula: 'Significant Breach Threshold = Current APB Unit Cost × 1.15\n  → 15% above current APB baseline\n  → Requires written notification to Congress\n  → PM must explain root cause and corrective action\n\nCritical Breach Threshold = Original APB Unit Cost × 1.25\n  → 25% above original (Milestone B) APB baseline\n  → Requires USD(A&S) certification to Congress that:\n     1. Program is essential to national security\n     2. No alternatives exist at lower cost\n     3. New APB is reasonable\n  → If not certified within 60 days, program is terminated\n\nExample:\n  Original APB Unit Cost = $100M\n  Current APB Unit Cost = $112M (after restructure)\n  Significant breach = $112M × 1.15 = $128.8M\n  Critical breach = $100M × 1.25 = $125M\n  \n  Note: Critical threshold uses ORIGINAL APB — even if the program has been restructured',
            explanation: 'The asymmetry between "significant" (current baseline) and "critical" (original baseline) thresholds catches many PMs off guard. On a program that has already been restructured upward, the critical breach threshold may be lower than the significant breach threshold in dollar terms — meaning you could hit a critical breach without first hitting a significant one.',
          },
          {
            type: 'callout',
            heading: 'Mistake #3: Misunderstanding EVM Signals',
            body: 'EVM is the most powerful program health diagnostic tool available to PMs — and one of the most misunderstood. New PMs often focus on SPI and CPI as standalone numbers without understanding the trend direction or the to-complete indices. A CPI of 0.92 may be acceptable if it has been trending upward for three months; the same CPI trending downward signals a fundamentally failing program. Equally important: EVM only reflects what has been authorized, budgeted, and reported by the contractor. If your EVMS surveillance is weak or your contractor\'s system is not DCMA-accepted, your EVM data may be telling you a story that bears no resemblance to actual program performance.',
          },
          {
            type: 'table',
            heading: 'Reading EVM Signals — What to Look For',
            headers: ['Signal', 'What It Means', 'PM Action Required'],
            rows: [
              ['CPI < 0.9 for 3+ consecutive periods', 'Systemic cost problem — will not self-correct', 'Initiate formal root cause analysis; brief PEO; consider EAC rebaseline'],
              ['SPI < 0.9 approaching a milestone', 'Schedule recovery is mathematically difficult', 'Crash analysis (cost of accelerating); escalate to PEO; update milestone forecast'],
              ['CPI trending downward even above 1.0', 'Early warning of emerging cost problem', 'Investigate before it crosses 1.0; review work package performance'],
              ['TCPI > 1.10', 'Claimed EAC requires better efficiency than contractor has ever achieved', 'Reject the EAC; require a defensible bottom-up reestimate'],
              ['Contractor submits same EAC for 3+ periods', 'EAC is a placeholder, not an analysis', 'Require formal EAC narrative with method documentation; escalate to DCMA'],
            ],
          },
          {
            type: 'callout',
            heading: 'Mistake #4: Writing Vague or Untestable Requirements',
            body: 'Requirements are the contractual and technical foundation of your entire program. Vague requirements — those that cannot be tested, measured, or verified — create one of the most expensive failure modes in defense acquisition: requirements creep and contract disputes. New PMs often inherit CDDs and CPDs with KPPs written at a high level of abstraction, then fail to ensure those requirements are properly traced and tightened in the system specification and the contract\'s Statement of Work. Every KPP in your CDD should have a corresponding verification method, an acceptance threshold, and an objective value. If your requirements team cannot write a test procedure for a requirement, that requirement needs to be rewritten before it enters the contract.',
          },
          {
            type: 'list',
            heading: 'Requirements Quality Checklist — Apply to Every KPP',
            items: [
              'Is the requirement testable? Can you write a test procedure that would definitively confirm compliance or non-compliance? If no, the requirement is vague.',
              'Does the requirement have both a threshold and an objective value? Threshold = minimum acceptable; Objective = desired goal. Both must be defined.',
              'Is the requirement traceable from ICD/CDD through the system specification and into the contract SOW? Untraced requirements become invisible — and expensive — at CDR and PDR.',
              'Does the requirement state what the system must do, not how it must do it? HOW requirements constrain contractor solutions unnecessarily and invite constructive change claims when the approach doesn\'t work.',
              'Has the requirements community (JROC for ACAT I) validated that this requirement is still current, fundable, and operationally relevant? Requirements that drift from validated documents without authorization create milestone review failures.',
            ],
          },
          {
            type: 'callout',
            heading: 'Mistake #5: Underinvesting in Stakeholder Management',
            body: 'Program managers who focus exclusively on technical and contractual execution — while neglecting the human terrain of their stakeholder network — consistently struggle at milestone reviews and budget hearings. Your stakeholders include your PEO, the operational user community, the requirements community, CAPE, the Comptroller, congressional staffers, and your prime contractor\'s leadership. Each has different equities, different information needs, and different definitions of program success. New PMs often wait until a problem is visible before engaging upward — this is a mistake. Build your stakeholder communication plan on Day 1 and treat it as seriously as your IMS.',
          },
          {
            type: 'table',
            heading: 'Program Manager Stakeholder Map — Know Your Audience',
            headers: ['Stakeholder', 'Primary Concern', 'Communication Frequency', 'What They Need From You'],
            rows: [
              ['PEO', 'Portfolio health, political exposure, budget', 'Weekly informal + formal reviews', 'No surprises; honest assessments; early warning of problems'],
              ['CAPE', 'Cost credibility, EAC realism', 'Milestone reviews + as needed', 'Defensible EACs; honest variance explanations; data access'],
              ['Comptroller', 'Obligation rates, reprogramming risk', 'Monthly / quarterly', 'Accurate obligation forecasts; early warning of execution gaps'],
              ['User Community (warfighter)', 'Capability delivery, fielding timeline', 'Program reviews + test events', 'Realistic fielding dates; user involvement in testing'],
              ['Congressional Staffers', 'Cost, schedule, performance breaches', 'At milestones + if Nunn-McCurdy', 'Accurate status; no surprises before they read it in DAoD'],
              ['Prime Contractor', 'Contract performance, EAC management', 'Weekly IPT + monthly formal', 'Clear requirements; timely decisions; EVMS credibility'],
            ],
          },
          {
            type: 'tip',
            heading: 'The Day 1 Rule',
            body: 'Build your stakeholder communication plan on Day 1 of your assignment — not after your first crisis. The political capital you need during a cost or schedule problem is built during the quiet periods, through consistent, honest, proactive communication. PMs who are known to their oversight community as straight shooters who surface problems early get treated very differently during difficult reviews than those who are strangers until something goes wrong.',
          },
        ],
        quiz: [
          {
            id: 'q1',
            question: 'A program\'s IMS shows all tasks on schedule during a mid-point program review, but the PM privately knows several work packages are behind. What is the most significant risk of this situation?',
            options: [
              'The program will receive a negative DAES assessment',
              'The disconnect will surface at a major milestone review, causing far greater damage than honest early reporting would have',
              'DCMA will issue a surveillance finding for inaccurate EVM reporting',
              'Congressional staffers will request an independent assessment',
            ],
            correct: 1,
            explanation: 'A schedule that shows green when the program is actually amber or red doesn\'t protect the PM — it exposes them to far greater risk when the truth surfaces at a major milestone review. PEOs and oversight bodies are far more forgiving of honest early warnings than of surprises at milestone decision points.',
          },
          {
            id: 'q2',
            question: 'An ACAT I program\'s original APB unit cost was $100M. After restructuring, the current APB unit cost is $115M. At what unit cost would a critical Nunn-McCurdy breach occur?',
            options: [
              '$132.25M (25% above current APB of $115M)',
              '$125M (25% above original APB of $100M)',
              '$127.5M (15% above current APB)',
              '$140M (25% above restructured baseline)',
            ],
            correct: 1,
            explanation: 'The critical Nunn-McCurdy breach threshold is calculated against the ORIGINAL APB baseline — $100M × 1.25 = $125M. This catches many PMs off guard because the critical breach threshold ($125M) is actually lower than the significant breach threshold ($115M × 1.15 = $132.25M) on a restructured program.',
          },
          {
            id: 'q3',
            question: 'A program\'s CPI has been 0.91, 0.89, and 0.87 over the past three reporting periods. What does this trend indicate?',
            options: [
              'Normal performance variation — single-period CPI fluctuations are expected',
              'A systemic cost problem that will not self-correct and requires formal PM action',
              'The contractor\'s EVMS is not DCMA-accepted and the data is unreliable',
              'The program is approaching a significant Nunn-McCurdy breach',
            ],
            correct: 1,
            explanation: 'A CPI trending downward over three consecutive periods (0.91 → 0.89 → 0.87) signals a systemic cost problem that will not self-correct. Statistical research shows that CPI rarely improves by more than 10% after the program is 20% complete. This requires formal root cause analysis, PEO briefing, and likely an EAC reestimate.',
          },
          {
            id: 'q4',
            question: 'Why is a KPP that "cannot have a test procedure written for it" a problem?',
            options: [
              'It violates JCIDS documentation requirements for CDD submission',
              'It is untestable — meaning there is no way to confirm compliance or non-compliance, creating contract disputes and requirements creep',
              'It requires CAPE review before it can be included in the system specification',
              'It cannot be incorporated into the contract SOW under FAR guidelines',
            ],
            correct: 1,
            explanation: 'A requirement that cannot be tested cannot be definitively confirmed as met — creating one of the most expensive failure modes in defense acquisition: requirements creep and contract disputes. The contractor builds to the minimum interpretation; the government expected something more capable. Every KPP must have a verification method, threshold, and objective value.',
          },
          {
            id: 'q5',
            question: 'According to the stakeholder management framework, what do PMs most commonly do wrong when problems emerge?',
            options: [
              'They engage CAPE too early, before internal cost analyses are complete',
              'They wait until a problem is visible before engaging upward — losing the political capital built through proactive communication',
              'They brief the prime contractor before informing the PEO',
              'They over-communicate minor issues, creating unnecessary alarm in the oversight community',
            ],
            correct: 1,
            explanation: 'New PMs typically wait until a problem is visible before engaging upward — by which point they have no accumulated political capital from proactive communication. The right approach: consistent, honest, proactive communication during quiet periods builds the trust and credibility that makes oversight bodies supportive rather than adversarial when real problems emerge.',
          },
        ],
      },
