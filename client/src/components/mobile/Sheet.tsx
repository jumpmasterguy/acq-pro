/**
 * Bottom sheet on phones, centred dialog on wider screens. Same shell and
 * motion as the Daily Challenge sheet, factored out for the leaderboards and
 * the level road.
 */

import { useEffect, type ReactNode } from 'react';
import { X } from 'lucide-react';

export function Sheet({
  title,
  subtitle,
  onClose,
  children,
  footer,
  testId,
  label,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  testId?: string;
  /** Accessible name when `title` is not plain text. */
  label?: string;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    // Keep the page behind from scrolling under a finger.
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6" data-testid={testId}>
      <div
        className="absolute inset-0"
        style={{ background: 'rgba(13,27,42,.6)' }}
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className="relative flex max-h-[90%] w-full flex-col rounded-t-[20px] sm:max-h-[85vh] sm:max-w-[460px] sm:rounded-[20px]"
        style={{
          background: 'var(--acq-surface-card)',
          boxShadow: 'var(--acq-shadow-2xl)',
          animation: 'acq-sheet-up 300ms ease-out',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
        role="dialog"
        aria-modal="true"
        aria-label={label ?? (typeof title === 'string' ? title : undefined)}
      >
        <div
          className="flex shrink-0 items-start gap-3 border-b px-5 pb-3.5 pt-[18px]"
          style={{ borderColor: 'var(--acq-border-subtle)' }}
        >
          <div className="min-w-0 flex-1">
            <h2 className="text-[17px] font-bold" style={{ color: 'var(--acq-text-heading)' }}>{title}</h2>
            {subtitle && (
              <p className="mt-0.5 text-xs" style={{ color: 'var(--acq-text-muted)' }}>{subtitle}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="-mr-1.5 -mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
            style={{ color: 'var(--acq-text-muted)' }}
            aria-label="Close"
          >
            <X className="h-4 w-4" strokeWidth={2} />
          </button>
        </div>
        <div className="acq-scroll min-h-0 flex-1 overflow-y-auto">{children}</div>
        {footer && (
          <div className="shrink-0 border-t px-5 py-3" style={{ borderColor: 'var(--acq-border-subtle)' }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
