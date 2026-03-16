// Progress management using React state (no localStorage)
export interface UserProgress {
  completedLessons: Set<string>;
  quizScores: Record<string, number>; // lessonId -> best score %
  unlockedModules: Set<string>;
  isPremium: boolean;
  xp: number;
}

export const FREE_MODULES = ['foundations'];

export const calculateXP = (completedLessons: Set<string>, quizScores: Record<string, number>) => {
  let xp = completedLessons.size * 100;
  Object.values(quizScores).forEach(score => {
    xp += Math.floor(score / 10);
  });
  return xp;
};

export const getLevel = (xp: number): { level: number; title: string; nextXP: number } => {
  const levels = [
    { level: 1, title: 'Acquisition Trainee', threshold: 0, nextXP: 200 },
    { level: 2, title: 'GS-9 Analyst', threshold: 200, nextXP: 500 },
    { level: 3, title: 'GS-11 Professional', threshold: 500, nextXP: 1000 },
    { level: 4, title: 'GS-12 Specialist', threshold: 1000, nextXP: 1800 },
    { level: 5, title: 'GS-13 Senior Manager', threshold: 1800, nextXP: 3000 },
    { level: 6, title: 'GS-14 Program Manager', threshold: 3000, nextXP: 5000 },
    { level: 7, title: 'SES-Level Executive', threshold: 5000, nextXP: 9999 },
  ];

  for (let i = levels.length - 1; i >= 0; i--) {
    if (xp >= levels[i].threshold) {
      return levels[i];
    }
  }
  return levels[0];
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
