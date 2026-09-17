/**
 * Small status pills shared by the mobile shell and the Home screen.
 *
 * All three are 36px tall by design. Where a pill is tappable it is wrapped in
 * a 44px-min button so the hit target still clears the 44px floor — the
 * handoff specifies both numbers, and the only way to honour them at once is
 * a small pill inside a larger touch area.
 */

import { Zap } from 'lucide-react';

/** 🔥 {streak} — lives in the top bar on every shell screen. Tap opens Account. */
export function StreakPill({ streak, onPress }: { streak: number; onPress?: () => void }) {
  const pill = (
    <span
      className="acq-tnum inline-flex h-9 items-center gap-1.5 rounded-full border px-2.5 text-[13px] font-extrabold"
      style={{
        borderColor: 'var(--acq-streak-border)',
        background: 'var(--acq-streak-wash)',
        color: 'var(--acq-text-streak)',
      }}
    >
      <span aria-hidden="true">🔥</span>
      {streak}
    </span>
  );

  if (!onPress) return pill;
  return (
    <button
      type="button"
      onClick={onPress}
      className="flex min-h-[44px] min-w-[44px] items-center justify-center"
      aria-label={`${streak} day burn rate streak. Open account.`}
      data-testid="mobile-streak-pill"
    >
      {pill}
    </button>
  );
}

/** ⚡ {xp} XP — greeting row on Home. Tap opens Account. */
export function XpPill({ xp, onPress }: { xp: number; onPress?: () => void }) {
  const pill = (
    <span
      className="acq-tnum inline-flex h-9 items-center gap-1.5 rounded-full border px-3 text-xs font-extrabold"
      style={{
        borderColor: 'var(--acq-gold-border)',
        background: 'var(--acq-surface-gold-wash)',
        color: 'var(--acq-text-gold)',
      }}
    >
      <Zap className="h-3 w-3" strokeWidth={2} />
      {xp} XP
    </span>
  );

  if (!onPress) return pill;
  return (
    <button
      type="button"
      onClick={onPress}
      className="flex min-h-[44px] items-center justify-center"
      aria-label={`${xp} XP. Open account.`}
      data-testid="mobile-xp-pill"
    >
      {pill}
    </button>
  );
}

/**
 * "{n} days left in trial" — top bar, Home only. Not tappable.
 * Day zero keeps the app's existing "Trial ends today" rather than rendering
 * "0 days left in trial".
 */
export function TrialPill({ daysLeft }: { daysLeft: number }) {
  return (
    <span
      className="acq-tnum inline-flex items-center rounded-full px-[9px] py-0.5 text-[11px] font-bold"
      style={{
        background: 'var(--acq-surface-gold-wash)',
        color: 'var(--acq-text-gold)',
      }}
      data-testid="mobile-trial-pill"
    >
      {daysLeft === 0 ? 'Trial ends today' : `${daysLeft} days left in trial`}
    </span>
  );
}
