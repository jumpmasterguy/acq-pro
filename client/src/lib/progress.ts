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
 * The career ladder. `threshold` is the XP at which each level begins.
 * The level road draws one space per 100 XP — about one lesson — so SES,
 * at 5,000, is fifty spaces from the start.
 */
export const LEVELS = [
  { level: 1, title: 'Acquisition Trainee', threshold: 0, nextXP: 200, desc: 'Just getting started. Learning the landscape.' },
  { level: 2, title: 'GS-9 Analyst', threshold: 200, nextXP: 500, desc: 'Building foundational knowledge. You know the players and the process.' },
  { level: 3, title: 'GS-11 Professional', threshold: 500, nextXP: 1000, desc: 'Solid understanding of contracts, finance basics, and acquisition vehicles.' },
  { level: 4, title: 'GS-12 Specialist', threshold: 1000, nextXP: 1800, desc: 'Deep functional knowledge. You can navigate a program review without a cheat sheet.' },
  { level: 5, title: 'GS-13 Senior Manager', threshold: 1800, nextXP: 3000, desc: 'Multi-domain fluency. Source selection, EVM, modifications — you handle it.' },
  { level: 6, title: 'GS-14 Program Manager', threshold: 3000, nextXP: 5000, desc: 'Senior PM territory. Leading programs, coaching others, managing the enterprise.' },
  { level: 7, title: 'SES-Level Executive', threshold: 5000, nextXP: 9999, desc: 'The full picture — strategy, policy, leadership, and acquisition mastery.' },
] as const;

export const getLevel = (xp: number): { level: number; title: string; nextXP: number; threshold: number; desc: string } => {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (xp >= LEVELS[i].threshold) return LEVELS[i];
  }
  return LEVELS[0];
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
