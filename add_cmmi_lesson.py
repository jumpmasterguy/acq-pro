#!/usr/bin/env python3
"""Insert CMMI lesson into the operations module in curriculum.ts"""

CMMI_LESSON = """
        {
          id: 'ops-6',
          title: 'CMMI: Process Maturity in Defense Contracting',
          duration: '18 min',
          difficulty: 'intermediate' as const,
          content: {
            novice: {
              title: 'CMMI Explained Simply',
              body: 'CMMI stands for Capability Maturity Model Integration. It is a framework that measures how mature and disciplined a company\\'s processes are — basically, does the company have its act together, or is every project reinventing the wheel? The Department of Defense cares deeply about CMMI because when you\\'re spending hundreds of millions on a software system or engineering program, you need to know the contractor can consistently deliver quality work. CMMI rates organizations on a scale of 1 to 5. Level 1 means processes are chaotic and unpredictable. Level 5 means the organization continuously optimizes its processes based on data. For DoD contractors, CMMI Level 3 is the common expectation — it means processes are defined, documented, and followed consistently across the organization. If your contractor has CMMI Level 2 or 1, that is a program risk you need to manage.',
              keyTerms: [
                { term: 'CMMI', definition: 'Capability Maturity Model Integration — a framework for assessing and improving organizational process maturity. Developed by the SEI (Software Engineering Institute) at Carnegie Mellon University.' },
                { term: 'Maturity Level', definition: 'A rating from 1 to 5 indicating how well-defined and disciplined an organization\\'s processes are. Higher = more mature.' },
                { term: 'SEI', definition: 'Software Engineering Institute at Carnegie Mellon University — the organization that developed CMMI.' },
                { term: 'Appraisal', definition: 'A formal assessment of an organization\\'s processes conducted by a certified CMMI Lead Appraiser. The result is a Maturity Level rating.' },
                { term: 'Process Area', definition: 'A specific topic within CMMI that groups related practices together — e.g., Requirements Management, Risk Management, Configuration Management.' },
              ],
              keyPoints: [
                'CMMI measures process maturity on a 1–5 scale|||Level 1 (Initial): Processes are chaotic and reactive — success depends on individual heroics. Level 2 (Managed): Projects are planned and managed reactively. Level 3 (Defined): Processes are standardized across the organization. Level 4 (Quantitatively Managed): Processes are controlled using metrics and data. Level 5 (Optimizing): Focus on continuous process improvement and innovation.',
                'DoD typically requires CMMI Level 3 for major software and engineering contractors|||CMMI Level 3 means the contractor has documented, standard processes that are used consistently across all projects — not just on one good team. This is the minimum bar for most large DoD software development and systems engineering contracts. Below Level 3 means the contractor\\'s performance is project-dependent and therefore unpredictable.',
                'CMMI applies to both contractors and government program offices|||While CMMI is most commonly associated with contractor evaluation, DoD program offices can also pursue CMMI appraisals to improve their own acquisition processes. DoDI 5000.02 encourages use of CMMI principles in program management offices.',
                'A CMMI appraisal is not a certification — it is a rating that expires|||Unlike ISO certifications, a CMMI appraisal result is valid for 3 years. After 3 years, the organization must re-appraise to maintain its rating. A contractor who says they are "CMMI Level 3 certified" is being imprecise — the correct term is "CMMI Level 3 appraised."',
                'CMMI is NOT just for software|||While CMMI originated in software engineering, CMMI for Development (CMMI-DEV) covers any development work — hardware, systems, services. CMMI for Services (CMMI-SVC) applies to service delivery organizations. Both are relevant to defense contractors.',
              ],
            },
            intermediate: {
              title: 'CMMI in DoD Source Selections and Contract Management',
              body: 'CMMI is a direct lever in DoD source selections and ongoing contract management. Understanding how to evaluate it, require it, and use it protects program risk and drives contractor accountability. For USG acquisition professionals, CMMI requirements appear in solicitations as either a hard eligibility requirement or as a scored evaluation factor. For contractors, CMMI level directly affects your ability to compete for major programs and influences how the government perceives your proposal\\'s credibility. The authoritative CMMI model is now maintained by the CMMI Institute (owned by ISACA) rather than the SEI.',
              keyTerms: [
                { term: 'CMMI-DEV', definition: 'CMMI for Development — the most widely used CMMI model, focused on improving development processes for products and services.' },
                { term: 'CMMI-SVC', definition: 'CMMI for Services — applies CMMI principles to service delivery organizations (IT support, program management support, logistics services).' },
                { term: 'CMMI-ACQ', definition: 'CMMI for Acquisition — a model focused on acquisition practices, less commonly used but applicable to government program offices.' },
                { term: 'Lead Appraiser', definition: 'A CMMI Institute-certified professional authorized to conduct formal SCAMPI appraisals and issue official Maturity Level ratings.' },
                { term: 'SCAMPI', definition: 'Standard CMMI Appraisal Method for Process Improvement — the formal appraisal method used to assign a Maturity Level. SCAMPI A is the most rigorous and the only type that produces an official rating.' },
                { term: 'PAL', definition: 'Published Appraisal Results — the CMMI Institute\\'s database of organizations with current official CMMI appraisal results. COs use PAL to verify contractor claims.' },
                { term: 'Process Area (PA)', definition: 'One of the specific capability domains within CMMI — e.g., Requirements Management (REQM), Risk Management (RSKM), Configuration Management (CM). Level 3 requires 17+ process areas.' },
              ],
              keyPoints: [
                'The five CMMI Maturity Levels and what they mean in practice|||ML1 Initial: Ad hoc, firefighting. Success is individual-dependent. ML2 Managed: Projects are planned, monitored, and controlled — but practices vary by project. ML3 Defined: Organization-wide standard processes exist and are tailored for each project from a central process library. ML4 Quantitatively Managed: Statistical process control is applied — defect rates, productivity, cycle times are measured and managed quantitatively. ML5 Optimizing: Continuous improvement is institutionalized; the organization deploys new technologies and process innovations systematically.',
                'How CMMI appears in solicitations|||CMMI requirements in RFPs take two forms: (1) Hard requirement: "Offerors must hold a current CMMI-DEV ML3 or higher appraisal for their software development organization." This is a pass/fail eligibility criterion. (2) Evaluation factor: "Process maturity will be evaluated; CMMI ML3 or higher is preferred." This is scored. CMMI ML2 gets partial credit; ML3+ gets full credit. Always verify currency — appraisals expire after 3 years.',
                'Verifying contractor CMMI claims — the PAL database|||Contractors sometimes misrepresent their CMMI status. The CMMI Institute maintains the Published Appraisal Results (PAL) at cmmiinstitute.com/pars. Every official SCAMPI A appraisal is listed there with: the organization name, Maturity Level, appraisal date, and scope (which business unit was appraised). Check three things: (1) Is the appraisal current (within 3 years)? (2) Does the appraised organization unit match the one performing your contract? (3) Is the model type correct (DEV vs. SVC)?',
                'CMMI scope traps — what was actually appraised?|||The most common CMMI deception is scope mismatch. A large contractor might hold a CMMI ML3 appraisal for Division A but propose Division B for your contract. Division B may have no appraisal at all. Always require contractors to specify which organizational unit holds the appraisal and confirm it matches the performing organization in their proposal.',
                'CMMI as a risk indicator in contract administration|||Once on contract, a contractor\\'s CMMI level should inform your surveillance strategy. A CMMI ML3+ contractor has documented processes — you can ask to review their process assets, risk management procedures, and configuration management plan. A contractor operating below ML3 requires heavier COR oversight, more frequent deliverable reviews, and explicit contract requirements for process documentation that the contractor would otherwise generate internally.',
                'CMMI v2.0 vs. the legacy model|||CMMI v2.0 was released in 2018. It reorganized the model, simplified terminology, and added a "Practice Area" structure replacing the old "Process Area" system. Most DoD solicitations still reference the legacy model terminology (CMMI-DEV v1.3, ML3). When reviewing contractor claims, confirm which model version applies — an appraisal under v1.3 and one under v2.0 are not directly comparable, though both are officially recognized.',
              ],
            },
            advanced: {
              title: 'CMMI Strategy — Source Selection, Contract Requirements, and Risk Management',
              body: 'At the advanced level, CMMI mastery means using it strategically — as a source selection discriminator, a contract requirement with teeth, and a leading indicator of program execution risk. This lesson covers how to write enforceable CMMI requirements, how to detect gaming, and how CMMI interfaces with DCMA surveillance, EVM, and contractor business system requirements.',
              keyTerms: [
                { term: 'SCAMPI A', definition: 'The most rigorous appraisal class — the only type that produces an official Maturity Level rating. Conducted on-site by a Lead Appraiser with a team over multiple days. Required for PAL publication.' },
                { term: 'SCAMPI B/C', definition: 'Lower-fidelity appraisals used for gap analysis and internal readiness assessments. Do NOT produce an official ML rating. A contractor claiming a SCAMPI B result as their CMMI level is misrepresenting their status.' },
                { term: 'Institutionalization', definition: 'The degree to which processes are embedded in the organization\\'s culture and are actually followed — not just documented. ML3 requires institutionalization through defined process assets; ML4-5 require data-driven institutionalization.' },
                { term: 'Generic Goals (GGs)', definition: 'CMMI requirements that apply across all process areas — primarily institutionalization requirements. GG2 (Managed) and GG3 (Defined) are the institutionalization gates for ML2 and ML3 respectively.' },
                { term: 'Organizational Process Assets (OPA)', definition: 'The library of standard processes, lessons learned, measurement data, and tailoring guidelines that a CMMI ML3 organization maintains and uses across all projects.' },
                { term: 'CMMI Supplement', definition: 'A DoD-specific guide (e.g., DoD\\'s "CMMI Considerations for Program Managers") that maps CMMI process areas to acquisition milestones and program management activities.' },
                { term: 'DFARS 252.234-7002', definition: 'The DFARS clause that requires use of CMMI for certain contracts — specifically, it requires contractors to have an appraisal plan or current appraisal for software-intensive programs over specified thresholds.' },
              ],
              keyPoints: [
                'Writing enforceable CMMI requirements in contracts|||Weak requirement: "The contractor should have CMMI Level 3." Enforceable requirement: "The contractor shall maintain a current (within 3 years) CMMI-DEV ML3 or higher SCAMPI A appraisal covering the organizational unit performing work under this contract. The contractor shall provide written notification to the Contracting Officer within 30 days of any change in appraisal status. Failure to maintain the required appraisal level is a material breach and grounds for termination for default." The key elements: specify SCAMPI A (not B/C), specify the performing organizational unit, require notification of lapses, and attach a consequence.',
                'DFARS 252.234-7002 — when it applies and what it requires|||DFARS 252.234-7002 (Earned Value Management System) and the companion CMMI guidance apply to software-intensive programs over certain cost thresholds. The clause requires contractors to either: (a) hold a current CMMI-DEV ML3+ appraisal, or (b) have an approved plan to achieve ML3 within 24 months of contract award. For PMs on large software programs, this clause should be in the contract. If it isn\\'t, raise it with the CO before EMD award.',
                'Detecting CMMI gaming during source selection|||Sophisticated contractors sometimes game CMMI claims. Red flags: (1) Appraisal was just completed days before proposal submission — may be a rush appraisal without genuine institutionalization. (2) Appraisal covers only a small "organizational unit" conveniently matching the proposed work scope. (3) Key personnel listed in the proposal were not part of the appraised organization. (4) The appraisal scope statement is vague. Counter-measures: require contractors to submit their SCAMPI A appraisal scope statement as part of the proposal; ask in oral presentations who specifically leads process compliance; require the Lead Appraiser\\'s name and contact for verification.',
                'CMMI as an EVM complement — process maturity predicts EVM reliability|||High EVM variance is often a process maturity problem, not just a technical one. A CMMI ML3 organization has a Configuration Management process area (CM) that controls baselines — which means their EVM PMB should be stable and well-governed. A CMMI ML1/2 contractor may show EVM data that is technically compliant but not actionable because their underlying planning processes are informal. When you see unexplained PMB instability (rubber baseline), disappearing Management Reserve, or format compliance without substance — check the contractor\\'s CMMI status. It is often a leading explanation.',
                'CMMI ML4 and ML5 — when they matter for DoD|||Most DoD programs require ML3. ML4 and ML5 become relevant when: (1) The program involves safety-critical or mission-critical software (nuclear command-and-control, flight control systems) where defect rates must be statistically controlled. (2) The program is on a rapid delivery schedule where process efficiency is critical. (3) The contractor is operating under a performance-based contract where process efficiency directly affects profitability. Ask for ML4/5 only when you can evaluate what it means — requiring it without understanding it is checkbook PM-ing.',
                'CMMI interface with DCMA surveillance|||DCMA\\'s Engineering and Analysis directorate includes CMMI expertise. For large software programs, DCMA may conduct a CMMI-focused surveillance review as part of their Contractor Surveillance Plan. As PM, you can request that DCMA include a CMMI process compliance review in their surveillance. This is particularly valuable when you suspect a contractor is not following their documented processes (a common gap between what was appraised and what is practiced day-to-day).',
                'The CMMI-SEA bridge — connecting process maturity to systems engineering|||The Systems Engineering and Architecture (SEA) community uses CMMI process areas directly in Requests for Proposals. Process areas most relevant to systems engineering include: Requirements Development (RD), Requirements Management (REQM), Technical Solution (TS), Product Integration (PI), Verification (VER), Validation (VAL), and Configuration Management (CM). A contractor claiming ML3 has practices defined for ALL of these. Use this knowledge when reviewing technical proposals — you should see evidence of these process areas in their work breakdown structure, SEMP, and test planning documents.',
              ],
              quiz: [
                {
                  id: 'cmmi-q1',
                  question: 'A defense contractor claims they are "CMMI Level 3 certified." What is the most accurate response?',
                  options: [
                    'This is correct — CMMI Level 3 is the industry certification standard',
                    'CMMI does not use the term "certified" — the correct term is "appraised." The result of a SCAMPI A appraisal is a Maturity Level rating, not a certification',
                    'Only CMMI Level 5 organizations can claim to be certified',
                    'Certification requires annual renewal, while appraisals last indefinitely',
                  ],
                  correct: 1,
                  explanation: 'CMMI produces appraisal ratings, not certifications. A SCAMPI A appraisal conducted by a Lead Appraiser results in a Maturity Level rating that is published in the CMMI Institute\\'s PAL database. The rating is valid for 3 years, after which a re-appraisal is required. Saying "certified" is a common and harmless shorthand in industry, but technically incorrect — and in a source selection context, the distinction matters.',
                },
                {
                  id: 'cmmi-q2',
                  question: 'During source selection, a contractor submits an appraisal certificate showing CMMI-DEV ML3. You verify it on the PAL database and the appraisal is current. What additional check is most important before accepting this as meeting your CMMI requirement?',
                  options: [
                    'Confirm the Lead Appraiser\\'s current certification status with the CMMI Institute',
                    'Verify that the appraised organizational unit matches the unit that will actually perform work under this contract',
                    'Require the contractor to submit their full process asset library',
                    'Confirm the appraisal used CMMI v2.0 rather than v1.3',
                  ],
                  correct: 1,
                  explanation: 'Scope mismatch is the most common CMMI compliance gap. A large contractor may hold an ML3 appraisal for one division while proposing a different division that has no appraisal. The PAL database shows which organizational unit was appraised — you must verify that the performing unit in the proposal matches the appraised unit. This is a critical CO and program office responsibility during source selection evaluation.',
                },
                {
                  id: 'cmmi-q3',
                  question: 'What is the difference between a SCAMPI A appraisal and a SCAMPI B appraisal?',
                  options: [
                    'SCAMPI A covers hardware development; SCAMPI B covers software development',
                    'SCAMPI A is a full on-site appraisal that produces an official Maturity Level rating publishable in the PAL; SCAMPI B is a lighter assessment used for gap analysis and does not produce an official rating',
                    'SCAMPI A requires government oversight; SCAMPI B is conducted independently by the contractor',
                    'SCAMPI B is a newer version that replaced SCAMPI A in CMMI v2.0',
                  ],
                  correct: 1,
                  explanation: 'SCAMPI (Standard CMMI Appraisal Method for Process Improvement) has three classes: A, B, and C. Only Class A produces an official Maturity Level rating that can be published in the PAL and cited in proposals. Classes B and C are internal readiness assessments — lighter, faster, and used to prepare for a Class A. A contractor citing a SCAMPI B result as their CMMI level is misrepresenting their status.',
                },
                {
                  id: 'cmmi-q4',
                  question: 'Your program\\'s lead software contractor has a current CMMI-DEV ML3 appraisal. During a program review, you notice significant PMB instability — budget keeps moving forward in time to avoid recording negative schedule variance. What is the most useful follow-up action?',
                  options: [
                    'Report the contractor to DCMA for EVM non-compliance immediately',
                    'Request that the contractor demonstrate compliance with their Configuration Management (CM) and Project Planning (PP) process areas, since PMB instability often indicates a breakdown in these ML3 process areas',
                    'Require the contractor to upgrade to CMMI ML4 within 6 months',
                    'Accept the baseline changes since the contractor is ML3 appraised and therefore compliant',
                  ],
                  correct: 1,
                  explanation: 'A CMMI ML3 organization is required to have functional Configuration Management (CM) and Project Planning (PP) process areas — both of which directly govern PMB integrity. PMB instability (rubber baseline behavior) suggests these processes are either not being followed or were not genuinely institutionalized at appraisal time. The right response is to engage the contractor\\'s process compliance chain and request evidence that their documented CM and PP processes are being applied. DCMA can assist with a process compliance review.',
                },
                {
                  id: 'cmmi-q5',
                  question: 'The DoD requires CMMI for some contracts through which DFARS clause?',
                  options: [
                    'DFARS 252.215-7000 (Subcontractor Cost or Pricing Data)',
                    'DFARS 252.242-7006 (Accounting System Administration)',
                    'DFARS 252.234-7002 (Earned Value Management System)',
                    'DFARS 252.204-7012 (Safeguarding Covered Defense Information)',
                  ],
                  correct: 2,
                  explanation: 'DFARS 252.234-7002 (Earned Value Management System) includes provisions related to CMMI for software-intensive programs over specified cost thresholds. It requires contractors to either hold a current CMMI-DEV ML3+ appraisal or have an approved plan to achieve it within 24 months. This linkage between EVM and CMMI reflects DoD\\'s recognition that process maturity and cost control are directly correlated.',
                },
              ],
            },
          },
        },"""

with open('client/src/lib/curriculum.ts') as f:
    content = f.read()

# Insert before the closing ]; of the modules array
# Find the last lesson's closing and insert after it
INSERT_BEFORE = """    ],
  }
];"""

if INSERT_BEFORE in content:
    content = content.replace(INSERT_BEFORE, f"    ],\n  }}\n  ];\n// CMMI_PLACEHOLDER", 1)
    # That was wrong, let's do it properly
    content = content.replace("  ];\n// CMMI_PLACEHOLDER", "  ];\n", 1)

# Actually do it cleanly - find the exact closing sequence
TARGET = """    ],
  }
];

export const getAllLessons"""

REPLACEMENT = f"""    ],
  }}
{CMMI_LESSON}
];

export const getAllLessons"""

if TARGET in content:
    content = content.replace(TARGET, REPLACEMENT)
    print("Inserted CMMI lesson successfully")
else:
    print("TARGET NOT FOUND - trying alternate")
    # Debug
    idx = content.rfind("];")
    print(f"Last ]; at position {idx}")
    print(repr(content[idx-50:idx+20]))

with open('client/src/lib/curriculum.ts', 'w') as f:
    f.write(content)
