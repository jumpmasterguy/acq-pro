// Acquisition This Week — short, dated briefs that give returning users a reason to open the app
// between lessons. Each brief is a 5-minute read: what it is, why it matters, what to do about it,
// and a three-question check.
//
// AUTHORING RULES (keep these, they are what make the feature trustworthy):
// 1. Every factual claim must be traceable to a source listed in `sources`. If you cannot source it,
//    do not publish it. Never invent a protest decision, a dollar figure, a date, or a quote.
// 2. Thresholds, clause numbers, and FAR part references change (the 2026 FAR overhaul is ongoing).
//    Write them with a "verify current" caveat or leave the number out and describe the rule.
// 3. Voice: plain English, no em dashes, no jargon filler, second person. Same as the lessons.
// 4. `weekOf` is the Monday of the week the brief is published, ISO format (YYYY-MM-DD).
// 5. Keep `body` under about 500 words. The point is five minutes, not a lesson.
// 6. `actions` is what the reader does differently on Monday. If you cannot write three, the topic
//    is not a brief.

import { apiRequest } from '@/lib/queryClient';

export type BriefCategory =
  | 'Rule Change'
  | 'Money'
  | 'Protest & Case Law'
  | 'Industry'
  | 'Field Note'
  | 'Career';

export interface BriefSource {
  label: string;
  url?: string;
}

export interface BriefQuestion {
  id: string;
  question: string;
  options: string[];
  correct: number;
  explanation: string;
}

export interface BriefBlock {
  type: 'text' | 'callout' | 'list';
  heading?: string;
  body?: string;
  /** For `list` blocks: 'label|||description' items, same convention as lesson content. */
  items?: string[];
}

export interface Brief {
  id: string;
  /** Monday of the publication week, ISO (YYYY-MM-DD). */
  weekOf: string;
  category: BriefCategory;
  title: string;
  /** One sentence shown on the card before the reader opens it. */
  dek: string;
  /** Estimated read time in minutes. */
  minutes: number;
  body: BriefBlock[];
  /** Why it matters, in one short paragraph. */
  soWhat: string;
  /** What to do differently. Three to five items. */
  actions: string[];
  quiz: BriefQuestion[];
  sources: BriefSource[];
  /** Lesson IDs that go deeper on this topic. */
  relatedLessons?: string[];
}

export const BRIEFS: Brief[] = [
  {
    id: 'brief-2026-09-14',
    weekOf: '2026-09-14',
    category: 'Rule Change',
    title: 'The FAR Is Being Rewritten Around You. Here Is How to Work Through It.',
    dek: 'Clause numbers and part references are moving. Your citations can go stale between the draft and the signature.',
    minutes: 5,
    body: [
      {
        type: 'text',
        body: 'The government is in the middle of the largest rewrite of the Federal Acquisition Regulation since it took effect in 1984. The stated goal is to strip out text that no statute requires, restructure parts, and shorten the whole thing. The mechanics are what matter to you day to day: rather than waiting for complete rulemaking, agencies have been issuing deviations that implement revised text immediately. That means the rule governing a specific acquisition may be a class deviation rather than the part you can look up.',
      },
      {
        type: 'callout',
        heading: 'The practical risk',
        body: 'You draft a justification in March citing a clause number, it sits in review for six weeks, and by the time it reaches the contracting officer the reference has moved. The reviewer now has to decide whether your reasoning was wrong or just your citation. Documents that explain the reasoning survive that. Documents that only cite do not.',
      },
      {
        type: 'list',
        heading: 'What is stable and what is not',
        items: [
          'Stable: the statutes|||Competition requirements, procurement integrity, cost and pricing data, cost accounting standards, the socioeconomic programs, domestic preference, labor standards, and the False Claims Act are law. A regulation rewrite cannot repeal them.',
          'Stable: the purposes|||Why a justification is required, what a determination has to establish, what makes a price fair and reasonable. These do not move.',
          'Moving: part and clause numbers|||Renumbering is part of the restructuring. Verify before you cite.',
          'Moving: thresholds|||Several are adjusted periodically for inflation independently of the overhaul. Never quote one from memory.',
          'Moving: which text applies|||A deviation may govern instead of the published part. The contracting officer knows which.',
        ],
      },
    ],
    soWhat:
      'For the next year or two, the professional habit that protects you is to argue from purpose and verify every citation on the day you submit. That is good practice in any period. It is the difference between a document that gets signed and one that gets returned right now.',
    actions: [
      'Ask the contracting officer which version of the FAR text governs your acquisition before you write to it.',
      'Write the reasoning into the document, not just the citation, so a reviewer can follow the logic if the reference moved.',
      'Re-verify every clause number and threshold the day the document goes out, and note the date you checked.',
      'Stop quoting thresholds from memory in email. Look them up or describe the rule without the number.',
    ],
    quiz: [
      {
        id: 'b1q1',
        question: 'What can a FAR rewrite not change?',
        options: [
          'Clause numbering',
          'The underlying statutes, such as competition, procurement integrity, cost and pricing data, and the False Claims Act',
          'How parts are organized',
          'The length of the text',
        ],
        correct: 1,
        explanation: 'The FAR implements statutes. The rewrite can remove regulatory text that no statute requires; it cannot repeal the statutes themselves.',
      },
      {
        id: 'b1q2',
        question: 'During the transition, what may actually govern a specific acquisition?',
        options: [
          'Only the published FAR part',
          'A class deviation implementing revised text ahead of final rulemaking',
          'State procurement law',
          'The contractor\'s standard terms',
        ],
        correct: 1,
        explanation: 'Agencies have been issuing deviations so that revised text takes effect before rulemaking finishes. Ask which one applies.',
      },
      {
        id: 'b1q3',
        question: 'Which writing habit protects a document when references move?',
        options: [
          'Citing more clauses',
          'Explaining the reasoning, so a reviewer can follow the logic even if a citation has changed',
          'Keeping documents shorter',
          'Waiting for final rulemaking',
        ],
        correct: 1,
        explanation: 'Purposes survive renumbering. Citations do not.',
      },
    ],
    sources: [
      { label: 'Acquisition.gov, current FAR text and deviations', url: 'https://www.acquisition.gov' },
      { label: 'Your agency\'s class deviation announcements' },
    ],
    relatedLessons: ['history-7', 'contracts-13'],
  },
  {
    id: 'brief-2026-09-07',
    weekOf: '2026-09-07',
    category: 'Money',
    title: 'Fourth Quarter Money: What Actually Happens in September, and What You Should Do About It',
    dek: 'Expiring one-year money, a rush of awards, and the reason your contracting office stops answering email.',
    minutes: 5,
    body: [
      {
        type: 'text',
        body: 'The federal fiscal year ends September 30. Operations and maintenance money is one-year money: if it is not obligated by midnight on the last day, it expires and goes back. Research money runs two years, procurement money three, so the pressure is uneven, but O&M drives the September behavior everyone notices. Contracting offices are working through a queue of awards that all have the same deadline, program offices are sweeping for unobligated balances, and anything that needs a signature competes with everything else that needs a signature.',
      },
      {
        type: 'callout',
        heading: 'Why year-end buying gets a bad reputation',
        body: 'The criticism is that offices spend to avoid losing money rather than because the need is real. Some of that happens. But much of what looks like a rush is the accumulation of requirements that took nine months to define, price, and review, arriving at the only deadline that exists. The fix is not to buy less in September; it is to start earlier, which is a planning problem in November, not a spending problem in September.',
      },
      {
        type: 'list',
        heading: 'What each side should be doing right now',
        items: [
          'Government: know what expires|||List every unobligated balance by appropriation and expiration. One-year money needs a decision this month; multi-year money does not.',
          'Government: package early|||A requirements package that arrives complete gets awarded. One that arrives needing correction joins a queue that will not clear.',
          'Contractor: be responsive|||A quote returned in two days in September is worth more than a perfect quote returned in two weeks.',
          'Contractor: do not over-promise|||Work accepted in September still has to be performed. A year-end award you cannot staff becomes a performance problem in November.',
          'Both: watch for a continuing resolution|||If the new year starts under a CR, new starts and production increases are generally restricted, which changes what October looks like.',
        ],
      },
    ],
    soWhat:
      'September is the one month of the year when speed on your side genuinely changes outcomes, because everyone else is constrained by the same calendar. It is also the month when sloppy packages die quietly.',
    actions: [
      'Pull your unobligated balances by appropriation and expiration date this week, not next.',
      'Ask your contracting officer what is still achievable by the end of the month and what is not, and believe the answer.',
      'If you are on the contractor side, clear your calendar for fast turnarounds and say yes only to work you can actually perform.',
      'Start next year\'s package in November. Every September problem is a November decision.',
    ],
    quiz: [
      {
        id: 'b2q1',
        question: 'Which appropriation drives most of the September obligation pressure?',
        options: ['Procurement, which runs three years', 'Operations and maintenance, which is one-year money', 'RDT&E, which runs two years', 'Military construction'],
        correct: 1,
        explanation: 'One-year money expires at the end of the fiscal year, so it creates the hard deadline everyone is working to.',
      },
      {
        id: 'b2q2',
        question: 'What is the real fix for the year-end rush?',
        options: [
          'Spending less in September',
          'Starting requirements packages earlier, because the rush is the accumulation of work that took most of the year to define',
          'Extending the fiscal year',
          'Using more sole-source awards',
        ],
        correct: 1,
        explanation: 'It is a planning problem in November, not a spending problem in September.',
      },
      {
        id: 'b2q3',
        question: 'If the new fiscal year starts under a continuing resolution, what generally happens?',
        options: [
          'Nothing changes',
          'New starts and production rate increases are generally restricted',
          'All contracts stop',
          'Money becomes multi-year',
        ],
        correct: 1,
        explanation: 'A CR usually continues prior-year funding levels and restricts new starts, which changes what October can accomplish.',
      },
    ],
    sources: [
      { label: 'DoD Financial Management Regulation, appropriation availability' },
      { label: 'Your comptroller\'s year-end cutoff schedule' },
    ],
    relatedLessons: ['finance-1', 'finance-4'],
  },
  {
    id: 'brief-2026-08-31',
    weekOf: '2026-08-31',
    category: 'Protest & Case Law',
    title: 'How to Read a GAO Protest Decision in Ten Minutes',
    dek: 'Protest decisions are the closest thing acquisition has to case law, and most people never read one.',
    minutes: 5,
    body: [
      {
        type: 'text',
        body: 'GAO publishes its bid protest decisions, and they are the single best free source of instruction on how source selections actually go wrong. Each one tells you what an agency did, what the protester argued, and whether GAO sustained or denied. Read twenty of them and you will evaluate proposals differently for the rest of your career. Read none and you will keep making the mistakes that the last thirty years of decisions catalog.',
      },
      {
        type: 'list',
        heading: 'The four parts worth your attention',
        items: [
          'The protest grounds|||Usually stated in the first page. This is what the protester says went wrong, in the vocabulary GAO uses.',
          'The facts|||What the solicitation said, what the proposals said, what the evaluators wrote. The gap between these three is where most sustained protests live.',
          'The analysis|||GAO\'s reasoning. Look for the standard it applies: did the agency follow the stated evaluation criteria, was the evaluation reasonable and documented, was the discussion meaningful.',
          'The recommendation|||What the agency has to do. Reevaluate, reopen discussions, terminate and reaward, reimburse costs.',
        ],
      },
      {
        type: 'callout',
        heading: 'The pattern you will see over and over',
        body: 'The agency evaluated against something the solicitation did not say, or said something in the solicitation and then did something else, or documented a conclusion without the reasoning behind it. Very few sustained protests turn on bad judgment. Most turn on inconsistency between the solicitation, the evaluation, and the record.',
      },
    ],
    soWhat:
      'If you write or evaluate proposals, protest decisions are free training from other people\'s expensive mistakes. If you are on the contractor side, they also tell you what a real protest ground looks like, which is a useful filter before spending money on one.',
    actions: [
      'Read one GAO decision a week in your product or service area. Ten minutes each.',
      'Before releasing a solicitation, reread Section M and ask whether you could evaluate exactly and only what it says.',
      'Before submitting an evaluation, check that every rating has documented reasoning tied to the stated criteria.',
      'If you are considering a protest, first find a decision with facts close to yours and read how GAO treated them.',
    ],
    quiz: [
      {
        id: 'b3q1',
        question: 'What do most sustained protests turn on?',
        options: [
          'Bad technical judgment by evaluators',
          'Inconsistency between the solicitation, the evaluation, and the documented record',
          'Pricing errors',
          'Late proposals',
        ],
        correct: 1,
        explanation: 'Evaluating against unstated criteria, or documenting a conclusion without reasoning, is the recurring pattern.',
      },
      {
        id: 'b3q2',
        question: 'Which part of a decision tells you the standard GAO applied?',
        options: ['The protest grounds', 'The facts', 'The analysis', 'The recommendation'],
        correct: 2,
        explanation: 'The analysis section contains GAO\'s reasoning and the standard: stated criteria, reasonableness, documentation, meaningful discussions.',
      },
      {
        id: 'b3q3',
        question: 'Why should a contractor read decisions before filing a protest?',
        options: [
          'To find a lawyer',
          'To see what a real protest ground looks like and how GAO treated similar facts',
          'To learn the filing fee',
          'To identify the evaluators',
        ],
        correct: 1,
        explanation: 'It is a useful filter before spending money on a protest that resembles ones GAO has denied.',
      },
    ],
    sources: [
      { label: 'GAO bid protest decisions', url: 'https://www.gao.gov/legal/bid-protests' },
    ],
    relatedLessons: ['contracts-2', 'capture-3', 'capture-4'],
  },
  {
    id: 'brief-2026-08-24',
    weekOf: '2026-08-24',
    category: 'Field Note',
    title: 'The CPARS Conversation You Should Be Having in Month Six, Not Month Twelve',
    dek: 'The rating is written once a year. The evidence that determines it accumulates all year.',
    minutes: 4,
    body: [
      {
        type: 'text',
        body: 'A CPARS rating follows a company into every competition it enters for three years. It is written by the government at the end of a performance period, from whatever record exists at that moment, usually under time pressure. Both sides treat it as an end-of-year event. Both sides are wrong, because by the time the draft arrives the evidence is already fixed.',
      },
      {
        type: 'list',
        heading: 'What each side should do at the halfway point',
        items: [
          'Contractor: ask for an interim read|||A short meeting with the COR and program manager: how are we doing against the standards, what would you write today, what would you want to see change.',
          'Contractor: build the record|||Monthly reports that state performance against the contract\'s own metrics give the government something to cite. Vague status reports give them nothing.',
          'Government: say it out loud|||A contractor cannot fix a problem it has not been told about, and a rating that surprises the contractor is a rating that gets disputed.',
          'Government: write contemporaneously|||Notes taken during the year produce a defensible rating. Reconstructing twelve months in an afternoon produces a vague one.',
          'Both: use the standards you agreed to|||The QASP or the performance standards in the contract are the rating\'s vocabulary. Argue in those terms or not at all.',
        ],
      },
      {
        type: 'callout',
        heading: 'On disputing a rating',
        body: 'A contractor can respond to a rating in the system, and the response travels with it. A well-written response that cites contract standards and contemporaneous evidence can change how a future evaluator reads a mediocre rating. A defensive one confirms it.',
      },
    ],
    soWhat:
      'Past performance is an evaluation factor in nearly every competition, which makes CPARS the most consequential document nobody manages deliberately. Six months in is when it is still manageable.',
    actions: [
      'Put a mid-period performance conversation on the calendar for every contract you touch.',
      'Report monthly against the contract\'s own standards, in the contract\'s own words.',
      'If you are the government, tell the contractor about a problem the week you notice it, in writing.',
      'Keep a contemporaneous file of performance evidence, good and bad, so the rating writes itself.',
    ],
    quiz: [
      {
        id: 'b4q1',
        question: 'Why is a mid-period CPARS conversation more useful than an end-of-year one?',
        options: [
          'Ratings are written mid-year',
          'By the time the draft arrives, the evidence that determines the rating is already fixed',
          'It is required by the FAR',
          'It shortens the contract',
        ],
        correct: 1,
        explanation: 'The rating is written once; the evidence accumulates all year.',
      },
      {
        id: 'b4q2',
        question: 'What makes a contractor\'s response to a poor rating effective?',
        options: [
          'Disputing the evaluator\'s motives',
          'Citing contract standards and contemporaneous evidence',
          'Requesting a new evaluator',
          'Filing a protest',
        ],
        correct: 1,
        explanation: 'The response travels with the rating. A defensive one confirms the rating; a documented one reframes it.',
      },
      {
        id: 'b4q3',
        question: 'What should a rating be argued in terms of?',
        options: [
          'Overall relationship quality',
          'The QASP or the performance standards in the contract',
          'The contractor\'s other contracts',
          'The program\'s budget',
        ],
        correct: 1,
        explanation: 'Those standards are the rating\'s vocabulary on both sides.',
      },
    ],
    sources: [
      { label: 'CPARS policy guidance, cpars.gov', url: 'https://www.cpars.gov' },
      { label: 'Your contract\'s QASP and performance standards' },
    ],
    relatedLessons: ['contracts-3', 'ops-2'],
  },
  {
    id: 'brief-2026-08-17',
    weekOf: '2026-08-17',
    category: 'Industry',
    title: 'Why Your Data Rights Decision Today Sets the Price of Sustainment for Twenty Years',
    dek: 'The cheapest moment to buy technical data is before the contract is signed. There is no second cheapest moment.',
    minutes: 5,
    body: [
      {
        type: 'text',
        body: 'Operating and support costs are typically the majority of a system\'s total lifecycle cost, and most of that money is spent on sustainment that only one company can perform, because the government never acquired the technical data needed to compete it. That outcome is decided during development, usually by people whose performance is measured on cost and schedule to fielding, not on what maintenance costs in year fifteen.',
      },
      {
        type: 'callout',
        heading: 'The asymmetry',
        body: 'Before award, data rights are one term among many in a competitive negotiation and the contractor has a reason to trade. After award, the government is asking a sole source to sell something that protects its own future revenue. The price reflects that.',
      },
      {
        type: 'list',
        heading: 'What to get right before signing',
        items: [
          'Decide what you will need to compete|||Depot maintenance, spares, software updates, integration of new capability. Each needs different data and different rights.',
          'Price the alternative|||What sole-source sustainment costs over the service life versus what the data costs now. Put both numbers in the acquisition strategy.',
          'Separate deliverables from background|||Rights attach to what is delivered. Be explicit about what is delivered and what is merely used.',
          'Use priced options where you cannot afford it now|||An option to buy the data package at a price set during competition preserves the choice.',
          'Write it into the evaluation|||If data rights are not evaluated, offerors will not compete on them.',
        ],
      },
    ],
    soWhat:
      'Data rights look like a legal detail during source selection and turn into the single largest driver of sustainment competition for the life of the system. The people who will pay for it are not in the room when it is decided.',
    actions: [
      'Ask what the government will need to compete in sustainment before you write the data requirements.',
      'Put the sole-source sustainment cost estimate next to the data package price in the acquisition strategy.',
      'Evaluate data rights in the source selection, or expect not to get them.',
      'If you cannot buy rights now, buy a priced option while the price is still competitive.',
    ],
    quiz: [
      {
        id: 'b5q1',
        question: 'When is the cheapest time to acquire technical data rights?',
        options: [
          'During sustainment, when the need is proven',
          'Before award, while there is still competitive pressure',
          'At contract closeout',
          'At the first option exercise',
        ],
        correct: 1,
        explanation: 'After award the government is asking a sole source to sell something that protects its own revenue.',
      },
      {
        id: 'b5q2',
        question: 'Why do programs routinely fail to acquire data rights?',
        options: [
          'The law prohibits it',
          'The people deciding are measured on cost and schedule to fielding, not on sustainment cost years later',
          'Contractors always refuse',
          'The data does not exist yet',
        ],
        correct: 1,
        explanation: 'The people who will pay for it are not in the room when it is decided.',
      },
      {
        id: 'b5q3',
        question: 'What preserves the choice when a program cannot afford the data package now?',
        options: [
          'A handshake agreement',
          'A priced option to buy the data package, established during the competition',
          'A CPARS comment',
          'A J&A',
        ],
        correct: 1,
        explanation: 'The option locks in a competitive price for a decision you can make later.',
      },
    ],
    sources: [
      { label: 'DFARS data rights clauses (verify current numbering)' },
      { label: 'GAO and DoD IG reports on sustainment competition' },
    ],
    relatedLessons: ['compliance-5', 'lifecycle-1'],
  },
  {
    id: 'brief-2026-08-10',
    weekOf: '2026-08-10',
    category: 'Career',
    title: 'The Two-Year Clearance Window Nobody Tells Separating Service Members About',
    dek: 'Your eligibility survives separation for a limited time. A slow job search spends it.',
    minutes: 4,
    body: [
      {
        type: 'text',
        body: 'When you leave service, your access ends but your eligibility stays in the system of record for a period, commonly cited as two years from your last access. Inside that window, a new employer with a cleared facility and a need can usually reinstate you without a new investigation. Outside it, you are starting over, which at higher levels can take a year or more. Verify the current policy, because it has been adjusted alongside continuous vetting, but plan on the window being finite and shorter than your job search might be.',
      },
      {
        type: 'list',
        heading: 'What quietly costs people their clearance during transition',
        items: [
          'A long gap|||Every month between debrief and a new sponsor spends the window.',
          'Financial strain|||Missed payments during unemployment are the most common flag in continuous vetting.',
          'Unreported foreign travel or contact|||With no security office holding you, people stop reporting. Keep a log and report it to the next one.',
          'Bridge income from a foreign employer or client|||A foreign preference and influence issue. Get advice before accepting.',
          'Overstating it on a resume|||Claiming an active clearance when you are out of access is checked routinely and ends candidacies.',
        ],
      },
      {
        type: 'callout',
        heading: 'The move most people miss',
        body: 'A drilling reserve or Guard position that requires a clearance keeps eligibility current while the civilian search runs. Many people use it deliberately for exactly this reason.',
      },
    ],
    soWhat:
      'The clearance is often the most valuable professional asset a separating service member carries, and it degrades quietly. Treat it like a credential with maintenance requirements.',
    actions: [
      'Write down your level, last investigation date, adjudicating agency, and debrief date before you leave.',
      'Budget the job search so that a gap does not become a financial flag.',
      'Keep a log of foreign travel and contacts, and report it to whichever security office holds you next.',
      'Ask a prospective employer\'s facility security officer about transfer issues before you accept an offer.',
    ],
    quiz: [
      {
        id: 'b6q1',
        question: 'What happens to clearance eligibility after separation?',
        options: [
          'It is revoked immediately',
          'It remains for a limited window during which a new sponsor can usually reinstate it without a new investigation',
          'It becomes permanent',
          'It transfers automatically to any employer',
        ],
        correct: 1,
        explanation: 'Commonly cited as two years from last access. Verify current policy; plan on it being finite.',
      },
      {
        id: 'b6q2',
        question: 'What is the most common clearance flag during a transition gap?',
        options: ['Foreign travel', 'Financial trouble', 'Changing address', 'Taking classes'],
        correct: 1,
        explanation: 'Missed payments during unemployment show up in continuous vetting. Self-report with a plan.',
      },
      {
        id: 'b6q3',
        question: 'What keeps eligibility current while a civilian search runs?',
        options: [
          'Nothing can',
          'A drilling reserve or Guard position that requires a clearance',
          'Filing paperwork annually',
          'Paying a maintenance fee',
        ],
        correct: 1,
        explanation: 'Many transitioning service members use this deliberately.',
      },
    ],
    sources: [
      { label: 'DoD personnel security policy (verify current reinstatement window)' },
      { label: 'Your security manager, before separation' },
    ],
    relatedLessons: ['veteran-4', 'veteran-1'],
  },
];

/** Briefs newest first. */
export function getBriefsNewestFirst(): Brief[] {
  return [...BRIEFS].sort((a, b) => (a.weekOf < b.weekOf ? 1 : a.weekOf > b.weekOf ? -1 : 0));
}

/** The brief to feature: the newest one whose week has started, or the newest overall. */
export function getCurrentBrief(today: Date = new Date()): Brief | undefined {
  const iso = today.toISOString().slice(0, 10);
  const sorted = getBriefsNewestFirst();
  return sorted.find(b => b.weekOf <= iso) ?? sorted[0];
}

/** Everything except the featured brief, newest first. */
export function getBriefArchive(today: Date = new Date()): Brief[] {
  const current = getCurrentBrief(today);
  return getBriefsNewestFirst().filter(b => b.id !== current?.id);
}

/** Formats a weekOf date as a short label, e.g. "Sep 14, 2026". */
export function formatWeekOf(weekOf: string): string {
  const [y, m, d] = weekOf.split('-').map(Number);
  const date = new Date(Date.UTC(y, (m ?? 1) - 1, d ?? 1));
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
}

const READ_STORAGE_KEY = 'acqpro_briefs_read';

/** Brief IDs the user has completed, from local storage. Best effort; never throws. */
export function getReadBriefIds(): Set<string> {
  try {
    const raw = window.localStorage.getItem(READ_STORAGE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? new Set(parsed.filter(x => typeof x === 'string')) : new Set();
  } catch {
    return new Set();
  }
}

/** Marks a brief read. Best effort; never throws. */
export function markBriefRead(id: string): void {
  try {
    const ids = getReadBriefIds();
    ids.add(id);
    window.localStorage.setItem(READ_STORAGE_KEY, JSON.stringify(Array.from(ids)));
  } catch {
    // Storage unavailable (private window, blocked cookies). Read state is a convenience only.
  }
}

/**
 * Brief ids the server has recorded for this user, merged with anything this
 * browser knows about locally. Falls back to local only if the request fails,
 * so the card still renders sensibly offline or for a signed-out preview.
 */
export async function fetchReadBriefIds(): Promise<Set<string>> {
  const local = getReadBriefIds();
  try {
    const res = await apiRequest('GET', '/api/briefs/read');
    const data = await res.json();
    const ids: string[] = Array.isArray(data?.briefsRead) ? data.briefsRead : [];
    ids.forEach(id => local.add(id));
  } catch {
    // Offline, signed out, or the endpoint is unavailable. Local state stands.
  }
  return local;
}

export interface BriefCompletionResult {
  xpEarned: number;
  alreadyCompleted: boolean;
  currentStreak?: number;
}

/**
 * Records a completed brief check. Writes local storage first so the UI is
 * correct even if the request fails, then reports what the server awarded.
 * The server is idempotent per brief id, so reopening an archived brief never
 * awards XP twice.
 */
export async function completeBrief(briefId: string, score: number): Promise<BriefCompletionResult> {
  markBriefRead(briefId);
  try {
    const res = await apiRequest('POST', '/api/briefs/complete', { briefId, score });
    const data = await res.json();
    return {
      xpEarned: Number(data?.xpEarned) || 0,
      alreadyCompleted: Boolean(data?.alreadyCompleted),
      currentStreak: typeof data?.currentStreak === 'number' ? data.currentStreak : undefined,
    };
  } catch {
    return { xpEarned: 0, alreadyCompleted: false };
  }
}
