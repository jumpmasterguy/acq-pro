/**
 * Bottom tab bar — four tabs, shown on every shell screen.
 *
 * Two platform geometries, per the handoff:
 *   iOS     — 50px row, 4px top pad, icon over a 10px/600 label, then the
 *             home-indicator inset below.
 *   Android — 80px row, 12px top pad, icon inside a 64x32 pill that fills
 *             with the brand wash when active, 12px label (700 active).
 */

import { LayoutDashboard, BookOpen, FolderOpen, UserCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export type MobileTab = 'home' | 'modules' | 'resources' | 'account';

const TABS: { id: MobileTab; label: string; Icon: typeof LayoutDashboard }[] = [
  { id: 'home', label: 'Home', Icon: LayoutDashboard },
  { id: 'modules', label: 'Learn', Icon: BookOpen },
  { id: 'resources', label: 'Resources', Icon: FolderOpen },
  { id: 'account', label: 'Account', Icon: UserCircle },
];

interface MobileTabBarProps {
  active: MobileTab;
  onChange: (tab: MobileTab) => void;
  platform: 'ios' | 'android';
}

export function MobileTabBar({ active, onChange, platform }: MobileTabBarProps) {
  const isAndroid = platform === 'android';

  return (
    <nav
      className="acq-inset-bottom shrink-0 border-t"
      style={{
        background: 'var(--acq-surface-card)',
        borderColor: 'var(--acq-border-subtle)',
      }}
      data-testid="mobile-tab-bar"
    >
      <div
        className={cn('flex', isAndroid ? 'h-20 pt-3' : 'h-[50px] pt-1')}
        role="tablist"
      >
        {TABS.map(({ id, label, Icon }) => {
          const isActive = active === id;
          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onChange(id)}
              className={cn(
                'flex flex-1 flex-col items-center',
                isAndroid ? 'gap-1' : 'gap-[3px]',
              )}
              style={{ color: isActive ? 'var(--acq-text-brand)' : 'var(--acq-text-muted)' }}
              data-testid={`mobile-tab-${id}`}
            >
              <span
                className={cn(
                  'flex items-center justify-center transition-colors duration-150',
                  isAndroid && 'h-8 w-16 rounded-2xl',
                )}
                style={
                  isAndroid && isActive
                    ? { background: 'var(--acq-surface-brand-wash)' }
                    : undefined
                }
              >
                <Icon className="h-6 w-6" strokeWidth={2} />
              </span>
              <span
                className={cn(
                  isAndroid
                    ? cn('text-xs', isActive ? 'font-bold' : 'font-medium')
                    : 'text-[10px] font-semibold',
                )}
              >
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
