/**
 * The mobile app shell: top bar, scroll area, bottom tab bar.
 *
 * Replaces the sidebar + off-canvas drawer below the `md` breakpoint. The
 * shell is deliberately dumb about routing — App.tsx owns the view state and
 * hands down which tab is active, what the header should show, and where back
 * goes. That keeps the tab/back mapping in one place next to the view type.
 *
 * Layout is a fixed full-height flex column so the bars stay put and only the
 * middle scrolls, which is what makes it feel native rather than like a web
 * page with sticky headers.
 */

import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { MobileTopBar, type MobileHeader } from './MobileTopBar';
import { MobileTabBar, type MobileTab } from './MobileTabBar';
import { getTabBarStyle } from '@/lib/platform';

export type { MobileTab } from './MobileTabBar';
export type { MobileHeader } from './MobileTopBar';

interface MobileShellProps {
  header: MobileHeader;
  activeTab: MobileTab;
  onTabChange: (tab: MobileTab) => void;
  streak: number;
  onStreakPress: () => void;
  trialDaysLeft?: number | null;
  /**
   * Changes on every navigation so the scroll area can reset to the top.
   * Without this, opening a lesson from halfway down a module page drops you
   * into the middle of the lesson.
   */
  scrollKey: string;
  /** Lesson reports scroll percentage here to drive its reading bar. */
  onScrollProgress?: (pct: number) => void;
  /** 3px reading-progress bar under the top bar. Lesson only. */
  readingBar?: { pct: number; color: string } | null;
  children: ReactNode;
}

export function MobileShell({
  header,
  activeTab,
  onTabChange,
  streak,
  onStreakPress,
  trialDaysLeft,
  scrollKey,
  onScrollProgress,
  readingBar,
  children,
}: MobileShellProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const platform = getTabBarStyle();

  // Let the tab bar own the home-indicator area instead of body padding.
  useEffect(() => {
    document.body.classList.add('acq-mobile-shell');
    return () => document.body.classList.remove('acq-mobile-shell');
  }, []);

  // Reset to top on navigation.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
    onScrollProgress?.(0);
    // onScrollProgress is intentionally excluded — we only want this on nav.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scrollKey]);

  const handleScroll = () => {
    if (!onScrollProgress) return;
    const el = scrollRef.current;
    if (!el) return;
    const scrollable = el.scrollHeight - el.clientHeight;
    const pct = scrollable <= 0 ? 0 : Math.min(100, Math.max(0, (el.scrollTop / scrollable) * 100));
    onScrollProgress(pct);
  };

  return (
    <div
      className="acq-shell fixed inset-0 flex flex-col"
      style={{ height: '100dvh' }}
      data-testid="mobile-shell"
    >
      <MobileTopBar
        header={header}
        streak={streak}
        onStreakPress={onStreakPress}
        trialDaysLeft={trialDaysLeft}
      />

      {readingBar && (
        <div
          className="h-[3px] shrink-0"
          style={{ background: 'var(--acq-surface-muted)' }}
          aria-hidden="true"
        >
          <div
            className="h-full"
            style={{
              width: `${readingBar.pct}%`,
              background: readingBar.color,
              transition: 'width .1s linear',
            }}
          />
        </div>
      )}

      <div ref={scrollRef} onScroll={handleScroll} className="acq-scroll min-h-0 flex-1 overflow-y-auto">
        {children}
      </div>

      <MobileTabBar active={activeTab} onChange={onTabChange} platform={platform} />
    </div>
  );
}
