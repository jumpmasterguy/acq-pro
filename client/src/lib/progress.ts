import { xpFromParts } from '@shared/xp';
// Progress management using React state (no localStorage)
export interface UserProgress {
  completedLessons: Set<string>;
  quizScores: Record<string, number>; // lessonId -> best score %
  unlockedModules: Set<string>;
  isPremium: boolean;
  // Distinct from isPremium: true only for an active/lifetime subscriber, not
  // a trialing user. isPremium unlocks lesson *access* during the trial;
  // isActuallyPaid gates anything permanent/keepable (downloads) so a trial
  // signup can't grab everything and walk away with it for free.
  isActuallyPaid: boolean;
  xp: number;
}

export const FREE_MODULES = ['foundations'];

// First lesson of each non-free module — accessible as a free preview
export const FREE_PREVIEW_LESSONS = [
  'finance-1',        // Finance module — first lesson
  'contracts-8',     // Contracts module — first lesson  
  'data-1',          // Data module — first lesson
  'capture-1',       // Capture module — first lesson
  'ops-3',           // Operations module — first lesson
];

export const calculateXP = (
  completedLessons: Set<string>,
  quizScores: Record<string, number>,
  dailyChallengeXP: number = 0,
  briefsXP: number = 0
) =>
  // Shared with the server so the leaderboards and the learner's own screen
  // can never disagree. Daily Challenge and brief XP are earned outside the
  // lesson/quiz formula, so they are passed in as totals.
  xpFromParts(completedLessons.size, quizScores, dailyChallengeXP, briefsXP);

/**
 * Career ladders. Government learners climb the GS scale to SES; people on
 * the industry side climb the titles their own company uses. The XP at each
 * rung is identical across ladders, so a level means the same effort on
 * every track and the leaderboards stay fair. Only the names change.
 *
 * The level road draws one space per 100 XP — about one lesson — so the top
 * rung, at 5,000, is fifty spaces from the start.
 */
export interface CareerLevel {
  level: number;
  title: string;
  /** Label on the level road. Keep it short: it sits under a landmark. */
  short: string;
  threshold: number;
  nextXP: number;
  desc: string;
}

export type LadderId = 'government' | 'industry_pm' | 'industry_bd';

const THRESHOLDS = [0, 200, 500, 1000, 1800, 3000, 5000];
const rungs = (defs: Array<[string, string, string]>): CareerLevel[] =>
  defs.map(([title, short, desc], i) => ({
    level: i + 1,
    title,
    short,
    threshold: THRESHOLDS[i],
    nextXP: THRESHOLDS[i + 1] ?? 9999,
    desc,
  }));

export const LADDERS: Record<LadderId, CareerLevel[]> = {
  government: rungs([
    ['Acquisition Trainee', 'Start', 'Just getting started. Learning the landscape.'],
    ['GS-9 Analyst', 'GS-9', 'Building foundational knowledge. You know the players and the process.'],
    ['GS-11 Professional', 'GS-11', 'Solid understanding of contracts, finance basics, and acquisition vehicles.'],
    ['GS-12 Specialist', 'GS-12', 'Deep functional knowledge. You can navigate a program review without a cheat sheet.'],
    ['GS-13 Senior Manager', 'GS-13', 'Multi-domain fluency. Source selection, EVM, modifications — you handle it.'],
    ['GS-14 Program Manager', 'GS-14', 'Senior PM territory. Leading programs, coaching others, managing the enterprise.'],
    ['SES-Level Executive', 'SES', 'The full picture — strategy, policy, leadership, and acquisition mastery.'],
  ]),
  industry_pm: rungs([
    ['Project Coordinator', 'Start', 'Learning how a defense contract actually runs, from kickoff to the first invoice.'],
    ['Junior Project Manager', 'Jr PM', 'You know the contract type, the CDRLs, and who the COR is.'],
    ['Project Manager', 'PM', 'Running a task order: budget, schedule, staffing, and the monthly status report.'],
    ['Senior Project Manager', 'Sr PM', 'Several task orders, subcontractors, and an EAC you can defend line by line.'],
    ['Program Manager', 'Program Mgr', 'Owning a program: the P&L, the CPARS, and the customer relationship.'],
    ['Director of Programs', 'Director', 'A portfolio of programs, the PMs who run them, and the recompetes.'],
    ['Vice President', 'VP', 'Strategy, growth, and the whole contract portfolio. Where the business decisions get made.'],
  ]),
  industry_bd: rungs([
    ['BD Coordinator', 'Start', 'Learning the pipeline, SAM.gov, and how an opportunity becomes a bid.'],
    ['Capture Analyst', 'Analyst', 'Researching customers, competitors, and the acquisition strategy behind a buy.'],
    ['Capture Manager', 'Capture Mgr', 'Owning a pursuit from qualification through proposal submission.'],
    ['Senior Capture Manager', 'Sr Capture', 'Must-win pursuits, teaming agreements, and price-to-win.'],
    ['Director of Capture', 'Director', 'The whole pipeline, the capture team, and the bid/no-bid calls.'],
    ['Senior Director of BD', 'Sr Director', 'Market strategy across customers, agencies, and contract vehicles.'],
    ['VP of Business Development', 'VP', 'Growth targets, the M&A pipeline, and how the company is positioned to win.'],
  ]),
};

/**
 * Which ladder a career track climbs. Takes the track id as a plain string so
 * this file does not import careerTracks.ts. Unknown or unset falls back to
 * the contractor ladder, matching DEFAULT_CAREER_TRACK.
 */
export function ladderIdFor(track?: string | null): LadderId {
  switch (track) {
    case 'usg_pm':
    case 'contracting_officer':
      return 'government';
    case 'capture_bd':
      return 'industry_bd';
    default:
      return 'industry_pm';
  }
}

export const ladderFor = (track?: string | null): CareerLevel[] => LADDERS[ladderIdFor(track)];

/** Kept for code that only needs thresholds, which every ladder shares. */
export const LEVELS = LADDERS.government;

export const getLevel = (xp: number, track?: string | null): CareerLevel => {
  const ladder = ladderFor(track);
  for (let i = ladder.length - 1; i >= 0; i--) {
    if (xp >= ladder[i].threshold) return ladder[i];
  }
  return ladder[0];
};

export const getModuleProgress = (
  moduleId: string,
  lessonIds: string[],
  completedLessons: Set<string>
): number => {
  if (lessonIds.length === 0) return 0;
  const completed = lessonIds.filter(id => completedLessons.has(id)).length;
  return Math.round((completed / lessonIds.length) * 100);
};
