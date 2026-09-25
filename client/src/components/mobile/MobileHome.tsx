/**
 * Home, mobile.
 *
 * Six blocks, in the handoff's order: greeting, Up next, burn rate streak,
 * daily challenge, modules carousel, your path. Deliberately much smaller
 * than the desktop Dashboard — search, the referral card, the Start Here
 * banner, the filter bar, the progress ring, bonus modules and admin stats
 * are all desktop-only.
 */

import { useMemo } from 'react';
import { LeaderboardCard } from '@/components/Leaderboard';
import type { ModuleMeta } from '@/lib/curriculumMeta';
import { modules as allModules, getTotalLessons } from '@/lib/curriculumMeta';
import { FREE_MODULES, getModuleProgress } from '@/lib/progress';
import { getTrackData, sortLessonsByTrack, type CareerTrackId } from '@/lib/careerTracks';
import {
  GreetingRow,
  UpNextCard,
  StreakCard,
  DailyChallengeRow,
  ModuleCarousel,
  YourPathCard,
} from './HomeCards';

interface MobileHomeProps {
  firstName: string;
  lastName?: string;
  xp: number;
  completedLessons: Set<string>;
  isPremium: boolean;
  streak: { currentStreak: number; longestStreak: number; lastStreakDate: string | null };
  challenge: { done: boolean; score?: number; xpEarned?: number };
  track: CareerTrackId;
  onOpenAccount: () => void;
  onOpenModule: (moduleId: string) => void;
  onOpenLesson: (lessonId: string) => void;
  onOpenModules: () => void;
  onOpenChallenge: () => void;
  onUpgrade: () => void;
}

export function MobileHome({
  firstName,
  lastName,
  xp,
  completedLessons,
  isPremium,
  streak,
  challenge,
  track,
  onOpenAccount,
  onOpenModule,
  onOpenLesson,
  onOpenModules,
  onOpenChallenge,
  onUpgrade,
}: MobileHomeProps) {
  const seqOf = (m: ModuleMeta) => allModules.findIndex(x => x.id === m.id) + 1;
  const isLocked = (m: ModuleMeta) => !isPremium && !FREE_MODULES.includes(m.id) && !m.free;
  const pctOf = (m: ModuleMeta) =>
    getModuleProgress(m.id, m.lessons.map(l => l.id), completedLessons);

  const trackData = getTrackData(track);

  /**
   * Up next: the first incomplete lesson the user can actually open, walked in
   * the active track's order so it agrees with how the Module page sequences
   * the same lessons. Falls back to curriculum order for an unknown track.
   */
  const upNext = useMemo(() => {
    for (const mod of allModules) {
      if (isLocked(mod)) continue;
      const ids = mod.lessons.map(l => l.id);
      const sorted = sortLessonsByTrack(ids, trackData);
      const orderedIds = trackData
        ? [...sorted.primary, ...sorted.bonus, ...sorted.unclassified]
        : ids;
      const nextId = orderedIds.find(id => !completedLessons.has(id));
      if (!nextId) continue;
      const lesson = mod.lessons.find(l => l.id === nextId);
      if (!lesson) continue;
      return {
        module: mod,
        lesson,
        // Position in the module's own order, which is what "Lesson i of n" means.
        index: mod.lessons.findIndex(l => l.id === nextId) + 1,
        count: mod.lessons.length,
      };
    }
    return null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [completedLessons, isPremium, track]);

  const doneCount = completedLessons.size;

  return (
    <div className="flex flex-col gap-5 px-4 pb-8 pt-3" data-testid="mobile-home">
      <GreetingRow
        firstName={firstName}
        lastName={lastName}
        xp={xp}
        onOpenAccount={onOpenAccount}
      />

      {upNext && (
        <UpNextCard
          module={upNext.module}
          lessonTitle={upNext.lesson.title}
          lessonIndex={upNext.index}
          lessonCount={upNext.count}
          duration={upNext.lesson.duration}
          modulePct={pctOf(upNext.module)}
          onContinue={() => onOpenLesson(upNext.lesson.id)}
        />
      )}

      <StreakCard
        currentStreak={streak.currentStreak}
        longestStreak={streak.longestStreak}
        lastStreakDate={streak.lastStreakDate}
      />

      <DailyChallengeRow
        done={challenge.done}
        score={challenge.score}
        xpEarned={challenge.xpEarned}
        onOpen={onOpenChallenge}
      />

      <LeaderboardCard />

      <ModuleCarousel
        modules={allModules}
        seqOf={seqOf}
        pctOf={pctOf}
        lockedOf={isLocked}
        onOpen={(m) => (isLocked(m) ? onUpgrade() : onOpenModule(m.id))}
        onSeeAll={onOpenModules}
        doneLessons={doneCount}
        totalLessons={getTotalLessons()}
      />

      {trackData && (
        <YourPathCard
          emoji={trackData.icon}
          label={trackData.label}
          onOpen={onOpenAccount}
        />
      )}
    </div>
  );
}
