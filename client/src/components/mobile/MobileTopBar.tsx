/**
 * 56px top bar for the mobile shell.
 *
 * Three left-hand variants, per the handoff:
 *   logo  — Home. Acqlerate mark + wordmark at 28px, 8px left pad.
 *   back  — Module / Lesson / Pro access. 44x44 back button + ellipsized title.
 *   title — Modules / Resources / Account. Title only, 8px left pad.
 *
 * Right-hand side: the trial pill on Home only, then the streak pill always.
 */

import { ArrowLeft } from 'lucide-react';
import { AcqlerateLogo } from '@/components/AcqlerateLogo';
import { StreakPill, TrialPill } from './Pills';

export type MobileHeader =
  | { kind: 'logo' }
  | { kind: 'back'; title: string; onBack: () => void }
  | { kind: 'title'; title: string };

interface MobileTopBarProps {
  header: MobileHeader;
  streak: number;
  onStreakPress: () => void;
  /** Gold pill, Home only. null when the user isn't trialing. */
  trialDaysLeft?: number | null;
}

export function MobileTopBar({ header, streak, onStreakPress, trialDaysLeft }: MobileTopBarProps) {
  const showTrial = header.kind === 'logo' && trialDaysLeft !== null && trialDaysLeft !== undefined;

  return (
    <header
      className="acq-inset-top shrink-0 border-b"
      style={{
        background: 'var(--acq-surface-card)',
        borderColor: 'var(--acq-border-subtle)',
      }}
      data-testid="mobile-top-bar"
    >
      <div className="flex h-14 items-center gap-2 pr-2">
        {header.kind === 'logo' && (
          <div className="flex min-w-0 flex-1 items-center pl-2">
            <AcqlerateLogo iconSize={28} />
          </div>
        )}

        {header.kind === 'back' && (
          <>
            <button
              type="button"
              onClick={header.onBack}
              className="flex h-11 w-11 shrink-0 items-center justify-center"
              style={{ color: 'var(--acq-text-secondary)' }}
              aria-label="Back"
              data-testid="mobile-back"
            >
              <ArrowLeft className="h-[22px] w-[22px]" strokeWidth={2} />
            </button>
            <h1
              className="min-w-0 flex-1 truncate text-base font-bold tracking-[-0.01em]"
              style={{ color: 'var(--acq-text-heading)' }}
            >
              {header.title}
            </h1>
          </>
        )}

        {header.kind === 'title' && (
          <h1
            className="min-w-0 flex-1 truncate pl-2 text-base font-bold tracking-[-0.01em]"
            style={{ color: 'var(--acq-text-heading)' }}
          >
            {header.title}
          </h1>
        )}

        <div className="flex shrink-0 items-center gap-2">
          {showTrial && <TrialPill daysLeft={trialDaysLeft as number} />}
          <StreakPill streak={streak} onPress={onStreakPress} />
        </div>
      </div>
    </header>
  );
}
