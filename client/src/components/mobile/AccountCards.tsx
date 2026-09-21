/**
 * Account screen blocks: the level hero, module standing, and the section
 * wrapper every other card uses.
 */

import type { ReactNode } from 'react';
import { Zap } from 'lucide-react';
import { modules } from '@/lib/curriculum';
import { getModuleTheme } from '@/lib/moduleTheme';
import { getModuleProgress } from '@/lib/progress';
import { moduleClps } from '@shared/moduleClps';
import { SkillLevelPill } from './ModulePieces';

// ── Section wrapper ─────────────────────────────────────────────────────────

export function AccountSection({
  icon: Icon,
  title,
  children,
}: {
  icon: any;
  title: string;
  children: ReactNode;
}) {
  return (
    <section
      className="rounded-[14px] p-4"
      style={{
        background: 'var(--acq-surface-card)',
        border: '1px solid var(--acq-border-subtle)',
        boxShadow: 'var(--acq-shadow-sm)',
      }}
    >
      <div className="mb-3 flex items-center gap-2">
        <Icon className="h-4 w-4" style={{ color: 'var(--acq-text-brand)' }} strokeWidth={2} />
        <h2
          className="text-xs font-bold uppercase tracking-[0.06em]"
          style={{ color: 'var(--acq-text-muted)' }}
        >
          {title}
        </h2>
      </div>
      {children}
    </section>
  );
}

// ── Level hero ──────────────────────────────────────────────────────────────

export function LevelHero({
  level,
  title,
  xp,
  toNext,
  nextTitle,
  pct,
  lessonsDone,
  dayStreak,
  clpsEarned,
}: {
  level: number;
  title: string;
  xp: number;
  toNext: number;
  nextTitle: string;
  pct: number;
  lessonsDone: number;
  dayStreak: number;
  clpsEarned: number;
}) {
  const stats = [
    { value: lessonsDone, label: 'Lessons done' },
    { value: dayStreak, label: 'Day streak' },
    { value: clpsEarned.toFixed(1), label: 'CLPs earned' },
  ];

  return (
    <div
      className="rounded-2xl p-5 text-white"
      style={{ background: 'var(--acq-gradient-hero)' }}
      data-testid="account-level-hero"
    >
      <div className="flex items-center gap-3.5">
        <span
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full"
          style={{ background: 'rgba(245,200,66,.2)' }}
        >
          <Zap className="h-[22px] w-[22px]" style={{ color: 'var(--acq-gold-bright)' }} strokeWidth={2} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-[15px] font-bold">Level {level} · {title}</div>
          <div className="acq-tnum text-xs" style={{ color: 'rgba(255,255,255,.6)' }}>
            {xp} XP · {toNext} XP to {nextTitle}
          </div>
        </div>
      </div>

      <div
        className="mt-3.5 h-1.5 w-full overflow-hidden rounded-full"
        style={{ background: 'rgba(255,255,255,.2)' }}
      >
        <div
          className="h-full rounded-full"
          style={{ width: `${pct}%`, background: 'var(--acq-gold-bright)' }}
        />
      </div>

      <div className="mt-4 flex gap-6">
        {stats.map(s => (
          <div key={s.label}>
            <div className="acq-tnum text-xl font-bold">{s.value}</div>
            <div className="text-[11px]" style={{ color: 'rgba(255,255,255,.5)' }}>{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Module standing ─────────────────────────────────────────────────────────

export function ModuleStanding({
  completedLessons,
  skillLevels,
}: {
  completedLessons: Set<string>;
  skillLevels: Record<string, string>;
}) {
  return (
    <>
      <div className="flex flex-col gap-3">
        {modules.map((mod, i) => {
          const theme = getModuleTheme(mod.color);
          const pct = getModuleProgress(mod.id, mod.lessons.map(l => l.id), completedLessons);
          return (
            <div key={mod.id} className="flex items-center gap-3">
              <span
                className="acq-tnum flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full text-[11px] font-extrabold text-white"
                style={{ background: theme.mobileHex }}
              >
                {String(i + 1).padStart(2, '0')}
              </span>
              <div className="min-w-0 flex-1">
                <div
                  className="truncate text-[13px] font-semibold"
                  style={{ color: 'var(--acq-text-heading)' }}
                >
                  {mod.title}
                </div>
                <div
                  className="mt-[5px] h-1 w-full overflow-hidden rounded-full"
                  style={{ background: 'var(--acq-surface-muted)' }}
                >
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${pct}%`, background: theme.mobileHex }}
                  />
                </div>
              </div>
              <SkillLevelPill level={skillLevels[mod.id] ?? 'novice'} />
            </div>
          );
        })}
      </div>

      <p className="mt-3.5 text-xs leading-[1.5]" style={{ color: 'var(--acq-text-muted)' }}>
        Finish a module to unlock its Certificate of Completion. Self-report it as External Training
        in your WarU portal. All {modules.length} modules together are worth{' '}
        {modules.reduce((sum, m) => sum + moduleClps(m.id), 0).toFixed(1)} CLPs.
      </p>
    </>
  );
}

/**
 * CLPs earned so far, pro-rated by lessons completed within each module — so
 * the number climbs with every lesson rather than only on module completion.
 */
export function earnedClps(completedLessons: Set<string>): number {
  return modules.reduce((sum, mod) => {
    const pct = getModuleProgress(mod.id, mod.lessons.map(l => l.id), completedLessons);
    return sum + moduleClps(mod.id) * (pct / 100);
  }, 0);
}
