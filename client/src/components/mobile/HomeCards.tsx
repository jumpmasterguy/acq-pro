/**
 * The Home screen's cards. Split out of MobileHome so each block stays
 * readable and the Module/Modules screens can reuse the pieces that repeat.
 */

import { Play, ChevronRight, Zap } from 'lucide-react';
import type { Module } from '@/lib/curriculum';
import { getModuleTheme, moduleGradient } from '@/lib/moduleTheme';
import { formatDuration, getModuleTotalMinutes } from '@/lib/curriculum';

// ── Greeting ────────────────────────────────────────────────────────────────

function greetingFor(date = new Date()): string {
  const h = date.getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

export function GreetingRow({
  firstName,
  lastName,
  xp,
  onOpenAccount,
}: {
  firstName: string;
  lastName?: string;
  xp: number;
  onOpenAccount: () => void;
}) {
  const initials = `${firstName.charAt(0)}${lastName?.charAt(0) ?? ''}`.toUpperCase() || '?';

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={onOpenAccount}
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[15px] font-bold"
        style={{ background: 'var(--acq-surface-brand-wash)', color: 'var(--acq-text-brand)' }}
        aria-label="Open account"
        data-testid="home-avatar"
      >
        {initials}
      </button>
      <div className="min-w-0 flex-1">
        <div className="text-xs" style={{ color: 'var(--acq-text-muted)' }}>
          {greetingFor()}
        </div>
        <div
          className="truncate text-lg font-bold tracking-[-0.02em]"
          style={{ color: 'var(--acq-text-heading)' }}
        >
          {firstName}
        </div>
      </div>
      <button
        type="button"
        onClick={onOpenAccount}
        className="acq-tnum flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3 text-xs font-extrabold"
        style={{
          borderColor: 'var(--acq-gold-border)',
          background: 'var(--acq-surface-gold-wash)',
          color: 'var(--acq-text-gold)',
        }}
        aria-label={`${xp} XP. Open account.`}
        data-testid="home-xp-pill"
      >
        <Zap className="h-3 w-3" strokeWidth={2} />
        {xp} XP
      </button>
    </div>
  );
}

// ── Up next ─────────────────────────────────────────────────────────────────

export function UpNextCard({
  module,
  lessonTitle,
  lessonIndex,
  lessonCount,
  duration,
  modulePct,
  onContinue,
}: {
  module: Module;
  lessonTitle: string;
  lessonIndex: number;
  lessonCount: number;
  duration: string;
  modulePct: number;
  onContinue: () => void;
}) {
  const theme = getModuleTheme(module.color);

  return (
    <button
      type="button"
      onClick={onContinue}
      className="relative w-full overflow-hidden rounded-[20px] p-5 text-left"
      style={{ background: moduleGradient(theme), boxShadow: 'var(--acq-shadow-lg)' }}
      data-testid="home-up-next"
    >
      {/* Decorative disc, top-right */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute h-[140px] w-[140px] rounded-full"
        style={{ background: 'rgba(255,255,255,.08)', top: -30, right: -30 }}
      />

      <span
        className="relative block text-[10px] font-extrabold uppercase tracking-[0.12em]"
        style={{ color: 'rgba(255,255,255,.75)' }}
      >
        Up next · Lesson {lessonIndex} of {lessonCount}
      </span>

      <span
        className="relative mt-2 block text-[22px] font-bold leading-[1.2] tracking-[-0.025em] text-white"
        style={{ textWrap: 'pretty' } as any}
      >
        {lessonTitle}
      </span>

      <span className="relative mt-1 block text-[13px]" style={{ color: 'rgba(255,255,255,.8)' }}>
        {module.title} · {duration} · +100 XP
      </span>

      <span className="relative mt-[18px] flex items-center gap-3.5">
        <span
          className="flex h-11 items-center gap-2 rounded-xl px-[18px] text-[15px] font-bold text-white"
          style={{ background: 'var(--acq-glass)' }}
        >
          <Play className="h-3.5 w-3.5" strokeWidth={2} />
          Continue
        </span>
        <span className="min-w-0 flex-1">
          <span className="block h-1.5 w-full overflow-hidden rounded-full" style={{ background: 'rgba(255,255,255,.25)' }}>
            <span className="block h-full rounded-full bg-white" style={{ width: `${modulePct}%` }} />
          </span>
          <span className="mt-1.5 block text-[11px]" style={{ color: 'rgba(255,255,255,.75)' }}>
            {modulePct}% of module done
          </span>
        </span>
      </span>
    </button>
  );
}

// ── Burn rate streak ────────────────────────────────────────────────────────

const WEEKDAY_LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

/**
 * Which of this Mon–Sun week's days are part of the current streak.
 *
 * There is no per-day activity log — `updateUserStreak` writes only a single
 * `lastStreakDate` — so the strip is derived from the streak length counting
 * back from the last active day. That keeps it consistent with the number
 * printed on the same card. Activity from before the current streak began
 * reads as empty, which is the right answer for a streak strip.
 */
export function weekStrip(
  currentStreak: number,
  lastStreakDate: string | null,
  today = new Date(),
): ('done' | 'today-pending' | 'future' | 'empty')[] {
  const todayStr = today.toISOString().slice(0, 10);
  // JS weeks start Sunday; the strip starts Monday.
  const mondayOffset = (today.getDay() + 6) % 7;

  const doneDates = new Set<string>();
  if (lastStreakDate && currentStreak > 0) {
    const cursor = new Date(`${lastStreakDate}T00:00:00`);
    for (let i = 0; i < currentStreak; i++) {
      doneDates.add(cursor.toISOString().slice(0, 10));
      cursor.setDate(cursor.getDate() - 1);
    }
  }

  return WEEKDAY_LETTERS.map((_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - mondayOffset + i);
    const iso = d.toISOString().slice(0, 10);
    if (doneDates.has(iso)) return 'done';
    if (iso === todayStr) return 'today-pending';
    return i > mondayOffset ? 'future' : 'empty';
  });
}

export function StreakCard({
  currentStreak,
  longestStreak,
  lastStreakDate,
}: {
  currentStreak: number;
  longestStreak: number;
  lastStreakDate: string | null;
}) {
  const days = weekStrip(currentStreak, lastStreakDate);

  return (
    <div
      className="rounded-2xl p-4"
      style={{
        background: 'var(--acq-surface-card)',
        border: '1px solid var(--acq-border-subtle)',
        boxShadow: 'var(--acq-shadow-sm)',
      }}
      data-testid="home-streak-card"
    >
      <div className="flex items-center gap-2.5">
        <span className="text-2xl leading-none" aria-hidden="true">🔥</span>
        <div className="min-w-0">
          <div
            className="acq-tnum text-[15px] font-black tracking-[-0.02em]"
            style={{ color: 'var(--acq-text-heading)' }}
          >
            {currentStreak}-day burn rate streak
          </div>
          <div className="text-[11px]" style={{ color: 'var(--acq-text-muted)' }}>
            <span aria-hidden="true">🏆</span> Best {longestStreak} days
          </div>
        </div>
      </div>

      <div className="mt-3.5 flex justify-between">
        {days.map((state, i) => (
          <div key={i} className="flex flex-col items-center gap-1.5">
            <div
              className="flex h-[34px] w-[34px] items-center justify-center rounded-full text-sm"
              style={
                state === 'done'
                  ? { background: 'var(--acq-streak-day)' }
                  : state === 'today-pending'
                    ? {
                        background: 'var(--acq-surface-brand-wash)',
                        border: '2px dashed var(--acq-teal)',
                      }
                    : { background: 'var(--acq-surface-sunken)' }
              }
            >
              {state === 'done' ? '🔥' : state === 'today-pending' ? '⚡' : ''}
            </div>
            <span className="text-[10px] font-semibold" style={{ color: 'var(--acq-text-muted)' }}>
              {WEEKDAY_LETTERS[i]}
            </span>
          </div>
        ))}
      </div>

      <p className="mt-3 text-[11px] leading-[1.5]" style={{ color: 'var(--acq-text-muted)' }}>
        In acquisitions, burn rate is how fast a program spends its funding. Here it tracks how fast
        you're spending daily reps. Don't let it hit zero.
      </p>
    </div>
  );
}

// ── Daily challenge row ─────────────────────────────────────────────────────

export function DailyChallengeRow({
  done,
  score,
  xpEarned,
  onOpen,
}: {
  done: boolean;
  score?: number;
  xpEarned?: number;
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      onClick={done ? undefined : onOpen}
      disabled={done}
      data-done={done || undefined}
      className="flex w-full items-center gap-3 rounded-2xl p-4 text-left disabled:cursor-default"
      style={{
        background: 'var(--acq-surface-card)',
        border: '1px solid var(--acq-border-subtle)',
        boxShadow: 'var(--acq-shadow-sm)',
      }}
      data-testid="home-daily-challenge"
    >
      <span className="text-2xl leading-none" aria-hidden="true">⚡</span>
      <span className="min-w-0 flex-1">
        <span
          className="block text-sm font-bold"
          style={{ color: done ? 'var(--acq-text-brand)' : 'var(--acq-text-heading)' }}
        >
          {done ? `Daily Challenge complete · ${score}/5` : "Today's Daily Challenge"}
        </span>
        <span className="mt-0.5 block text-xs" style={{ color: 'var(--acq-text-muted)' }}>
          {done
            ? `+${xpEarned} XP earned. Streak extended. Come back tomorrow.`
            : '5 questions · ~2 min · Earn up to 50 XP'}
        </span>
      </span>
      {!done && (
        <ChevronRight className="h-4 w-4 shrink-0" style={{ color: 'var(--acq-text-faint)' }} />
      )}
    </button>
  );
}

// ── Modules carousel ────────────────────────────────────────────────────────

export function ModuleCarousel({
  modules: mods,
  seqOf,
  pctOf,
  lockedOf,
  onOpen,
  onSeeAll,
  doneLessons,
  totalLessons,
}: {
  modules: Module[];
  seqOf: (m: Module) => number;
  pctOf: (m: Module) => number;
  lockedOf: (m: Module) => boolean;
  onOpen: (m: Module) => void;
  onSeeAll: () => void;
  doneLessons: number;
  totalLessons: number;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <h2
          className="text-[10px] font-extrabold uppercase tracking-[0.1em]"
          style={{ color: 'var(--acq-text-muted)' }}
        >
          Modules · {doneLessons}/{totalLessons} lessons
        </h2>
        <button
          type="button"
          onClick={onSeeAll}
          className="text-xs font-semibold"
          style={{ color: 'var(--acq-text-brand)' }}
          data-testid="home-see-all-modules"
        >
          See all →
        </button>
      </div>

      {/* Bleeds into the screen's 16px gutter so tiles run to the edge */}
      <div
        className="acq-scroll -mx-4 mt-3 flex gap-3 overflow-x-auto px-4"
        style={{ scrollSnapType: 'x mandatory' }}
      >
        {mods.map((m) => {
          const theme = getModuleTheme(m.color);
          const pct = pctOf(m);
          const locked = lockedOf(m);
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => onOpen(m)}
              className="w-[156px] shrink-0 overflow-hidden rounded-2xl text-left"
              style={{
                scrollSnapAlign: 'start',
                background: 'var(--acq-surface-card)',
                border: '1px solid var(--acq-border-subtle)',
                boxShadow: 'var(--acq-shadow-sm)',
              }}
              data-testid={`home-module-${m.id}`}
            >
              <div
                className="flex h-[72px] items-start justify-between p-3"
                style={{ background: moduleGradient(theme) }}
              >
                <span
                  className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-extrabold text-white"
                  style={{ background: 'rgba(255,255,255,.22)' }}
                >
                  {seqOf(m)}
                </span>
                <span className="text-[11px] font-bold text-white">
                  {locked ? <><span aria-hidden="true">🔒</span> Pro</> : `${pct}%`}
                </span>
              </div>
              <div className="p-3">
                <div
                  className="min-h-[34px] text-[13px] font-bold leading-[1.3]"
                  style={{ color: 'var(--acq-text-heading)' }}
                >
                  {m.title}
                </div>
                <div className="mt-1 text-[11px]" style={{ color: 'var(--acq-text-muted)' }}>
                  {m.lessons.length} lessons · {formatDuration(getModuleTotalMinutes(m.id))}
                </div>
                <div
                  className="mt-2.5 h-1 w-full overflow-hidden rounded-full"
                  style={{ background: 'var(--acq-surface-muted)' }}
                >
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${pct}%`, background: theme.mobileHex }}
                  />
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Your path ───────────────────────────────────────────────────────────────

export function YourPathCard({
  emoji,
  label,
  onOpen,
}: {
  emoji: string;
  label: string;
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full items-center gap-3 rounded-2xl px-4 py-3.5 text-left"
      style={{
        background: 'var(--acq-surface-card)',
        border: '1px solid var(--acq-border-subtle)',
        boxShadow: 'var(--acq-shadow-sm)',
      }}
      data-testid="home-your-path"
    >
      <span className="text-[22px] leading-none" aria-hidden="true">{emoji}</span>
      <span className="min-w-0 flex-1">
        <span
          className="block text-[10px] font-extrabold uppercase tracking-[0.1em]"
          style={{ color: 'var(--acq-text-brand)' }}
        >
          Your path
        </span>
        <span className="block truncate text-sm font-semibold" style={{ color: 'var(--acq-text-heading)' }}>
          {label}
        </span>
      </span>
      <span className="text-xs" style={{ color: 'var(--acq-text-muted)' }}>Change</span>
      <ChevronRight className="h-4 w-4 shrink-0" style={{ color: 'var(--acq-text-faint)' }} />
    </button>
  );
}
