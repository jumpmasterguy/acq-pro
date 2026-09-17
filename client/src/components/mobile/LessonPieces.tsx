/**
 * Mobile lesson chrome: the key-term bottom sheet, the quiz option, and the
 * sticky completion footer.
 */

import { useEffect } from 'react';
import { CheckCircle2, ChevronRight } from 'lucide-react';
import type { KeyTerm } from '@/lib/curriculum';
import { cn } from '@/lib/utils';

// ── Key term sheet ──────────────────────────────────────────────────────────

export function KeyTermSheet({
  term,
  moduleHex,
  onClose,
}: {
  term: KeyTerm | null;
  moduleHex: string;
  onClose: () => void;
}) {
  // Escape closes, and the body shouldn't scroll behind the sheet.
  useEffect(() => {
    if (!term) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [term, onClose]);

  if (!term) return null;

  return (
    <div className="fixed inset-0 z-50" data-testid="key-term-sheet">
      <div
        className="absolute inset-0"
        style={{ background: 'rgba(13,27,42,.5)' }}
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className="acq-inset-bottom absolute inset-x-0 bottom-0 rounded-t-[20px] px-5 pb-9 pt-3"
        style={{
          background: 'var(--acq-surface-card)',
          boxShadow: 'var(--acq-shadow-2xl)',
          animation: 'acq-sheet-up 250ms ease-out',
        }}
        role="dialog"
        aria-label={term.term}
      >
        <div
          className="mx-auto h-1 w-9 rounded-full"
          style={{ background: 'var(--acq-surface-muted)' }}
          aria-hidden="true"
        />

        <div className="mt-4 flex items-center gap-2">
          <span className="acq-mono text-base font-bold" style={{ color: moduleHex }}>
            {term.term}
          </span>
          <span
            className="rounded-full px-2 py-0.5 text-[11px] font-semibold"
            style={{ background: 'var(--acq-surface-sunken)', color: 'var(--acq-text-muted)' }}
          >
            key term
          </span>
        </div>

        <p
          className="mb-[18px] mt-2.5 text-[15px] leading-[1.55]"
          style={{ color: 'var(--acq-text-secondary)' }}
        >
          {term.definition}
        </p>

        <button
          type="button"
          onClick={onClose}
          className="h-11 w-full rounded-[10px] text-[15px] font-semibold text-white"
          style={{ background: 'var(--acq-teal)' }}
        >
          Got it
        </button>
      </div>
    </div>
  );
}

// ── Quiz option ─────────────────────────────────────────────────────────────

export type QuizOptionState = 'default' | 'selected' | 'correct' | 'incorrect';

export function QuizOption({
  index,
  label,
  state,
  disabled,
  onSelect,
}: {
  index: number;
  label: string;
  state: QuizOptionState;
  disabled?: boolean;
  onSelect: () => void;
}) {
  const key = String.fromCharCode(65 + index); // A, B, C…

  const style =
    state === 'correct'
      ? { borderColor: 'var(--acq-success-border)', background: 'var(--acq-success-wash)', color: 'var(--acq-text-body)' }
      : state === 'incorrect'
        ? { borderColor: 'var(--acq-danger-border)', background: 'var(--acq-danger-wash)', color: 'var(--acq-text-body)' }
        : state === 'selected'
          ? { borderColor: 'var(--acq-teal)', background: 'rgba(1,105,111,.05)', color: 'var(--acq-text-heading)' }
          : { borderColor: 'var(--acq-border-default)', background: 'var(--acq-surface-card)', color: 'var(--acq-text-body)' };

  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      className={cn(
        'acq-press flex min-h-12 w-full items-center gap-3 rounded-xl border px-3.5 py-2.5 text-left text-sm',
        disabled && 'cursor-default',
      )}
      style={style}
      data-state={state}
    >
      <span className="shrink-0 font-bold opacity-60">{key}.</span>
      <span className="min-w-0 flex-1">{label}</span>
    </button>
  );
}

// ── Sticky lesson footer ────────────────────────────────────────────────────

export function LessonFooter({
  completed,
  isLastLesson,
  onComplete,
  onNext,
}: {
  completed: boolean;
  isLastLesson: boolean;
  onComplete: () => void;
  onNext: () => void;
}) {
  return (
    <div
      className="sticky bottom-0 z-20 flex items-center gap-2.5 border-t px-4 py-3"
      style={{
        background: 'var(--acq-surface-page)',
        borderColor: 'var(--acq-border-subtle)',
      }}
      data-testid="lesson-footer"
    >
      <span className="min-w-0 flex-1 text-xs" style={{ color: 'var(--acq-text-muted)' }}>
        {completed ? '✓ Complete · +100 XP earned' : '+100 XP on completion'}
      </span>
      {completed ? (
        <button
          type="button"
          onClick={onNext}
          className="flex h-11 shrink-0 items-center gap-1.5 rounded-[10px] px-4 text-[15px] font-semibold text-white"
          style={{ background: 'var(--acq-teal)' }}
          data-testid="lesson-next"
        >
          {isLastLesson ? 'Back to module' : 'Next Lesson'}
          <ChevronRight className="h-4 w-4" strokeWidth={2} />
        </button>
      ) : (
        <button
          type="button"
          onClick={onComplete}
          className="flex h-11 shrink-0 items-center gap-1.5 rounded-[10px] px-4 text-[15px] font-semibold text-white"
          style={{ background: 'var(--acq-teal)' }}
          data-testid="lesson-mark-complete"
        >
          <CheckCircle2 className="h-4 w-4" strokeWidth={2} />
          Mark Complete
        </button>
      )}
    </div>
  );
}
