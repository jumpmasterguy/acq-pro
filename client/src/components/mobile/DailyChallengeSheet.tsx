/**
 * Daily Challenge, mobile — a bottom sheet that asks one question at a time.
 *
 * Correctness is deliberately hidden until submit: the options only ever show
 * the selected state while answering, unlike the lesson quiz which grades each
 * question in place.
 */

import { useEffect, useState } from 'react';
import { ChevronRight, X } from 'lucide-react';
import { QuizOption } from './LessonPieces';

export interface ChallengeQuestion {
  id: string;
  question: string;
  options: string[];
  correct: number;
}

interface DailyChallengeSheetProps {
  date: string;
  questions: ChallengeQuestion[];
  answers: Record<string, number>;
  onAnswer: (questionId: string, optionIndex: number) => void;
  onSubmit: () => void;
  onClose: () => void;
  submitting?: boolean;
}

export function DailyChallengeSheet({
  date,
  questions,
  answers,
  onAnswer,
  onSubmit,
  onClose,
  submitting,
}: DailyChallengeSheetProps) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  if (questions.length === 0) return null;

  // The API hands back a bare YYYY-MM-DD; show it the way a person reads a date.
  const prettyDate = (() => {
    const d = new Date(`${date}T00:00:00`);
    return Number.isNaN(d.getTime())
      ? date
      : d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
  })();

  const q = questions[Math.min(index, questions.length - 1)];
  const isLast = index === questions.length - 1;
  const answeredThis = answers[q.id] !== undefined;
  const allAnswered = questions.every(x => answers[x.id] !== undefined);

  return (
    <div className="fixed inset-0 z-50" data-testid="daily-challenge-sheet">
      <div
        className="absolute inset-0"
        style={{ background: 'rgba(13,27,42,.6)' }}
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        className="absolute inset-x-0 bottom-0 flex max-h-[90%] flex-col rounded-t-[20px]"
        style={{
          background: 'var(--acq-surface-card)',
          boxShadow: 'var(--acq-shadow-2xl)',
          animation: 'acq-sheet-up 300ms ease-out',
        }}
        role="dialog"
        aria-label="Daily Challenge"
      >
        {/* Header */}
        <div
          className="flex shrink-0 items-start gap-3 border-b px-5 pb-3.5 pt-[18px]"
          style={{ borderColor: 'var(--acq-border-subtle)' }}
        >
          <div className="min-w-0 flex-1">
            <h2 className="text-[17px] font-bold" style={{ color: 'var(--acq-text-heading)' }}>
              <span aria-hidden="true">⚡</span> Daily Challenge
            </h2>
            <p className="mt-0.5 text-xs" style={{ color: 'var(--acq-text-muted)' }}>
              {prettyDate} · {questions.length} questions · up to 50 XP
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="-mr-1.5 -mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
            style={{ color: 'var(--acq-text-muted)' }}
            aria-label="Close"
            data-testid="challenge-close"
          >
            <X className="h-4 w-4" strokeWidth={2} />
          </button>
        </div>

        {/* Body */}
        <div className="acq-scroll min-h-0 flex-1 overflow-y-auto px-5 pb-2 pt-4">
          <div className="flex gap-1.5" aria-hidden="true">
            {questions.map((x, i) => (
              <span
                key={x.id}
                className="h-1 flex-1 rounded-full"
                style={{
                  background:
                    i === index
                      ? 'var(--acq-teal)'
                      : answers[x.id] !== undefined
                        ? 'rgba(1,105,111,.4)'
                        : 'var(--acq-surface-muted)',
                }}
              />
            ))}
          </div>

          <div
            className="mt-4 text-[10px] font-extrabold uppercase tracking-[0.1em]"
            style={{ color: 'var(--acq-text-brand)' }}
          >
            Question {index + 1} of {questions.length}
          </div>

          <p
            className="mt-1.5 text-base font-semibold leading-[1.4]"
            style={{ color: 'var(--acq-text-heading)' }}
          >
            {q.question}
          </p>

          <div className="mt-3 flex flex-col gap-2">
            {q.options.map((opt, oi) => (
              <QuizOption
                key={oi}
                index={oi}
                label={opt.split('|||')[0]}
                state={answers[q.id] === oi ? 'selected' : 'default'}
                onSelect={() => onAnswer(q.id, oi)}
              />
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="acq-inset-bottom flex shrink-0 items-center gap-3 px-5 pb-[18px] pt-3">
          {index > 0 ? (
            <button
              type="button"
              onClick={() => setIndex(i => i - 1)}
              className="flex h-11 items-center px-1 text-sm font-medium"
              style={{ color: 'var(--acq-text-muted)' }}
              data-testid="challenge-back"
            >
              Back
            </button>
          ) : (
            <div />
          )}

          <div className="flex-1" />

          {isLast ? (
            <button
              type="button"
              onClick={onSubmit}
              disabled={!allAnswered || submitting}
              className="flex h-11 min-w-[120px] items-center justify-center gap-1.5 rounded-[10px] px-4 text-[15px] font-semibold text-white disabled:opacity-50"
              style={{ background: 'var(--acq-teal)' }}
              data-testid="challenge-submit"
            >
              <span aria-hidden="true">⚡</span> Submit Answers
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setIndex(i => i + 1)}
              disabled={!answeredThis}
              className="flex h-11 min-w-[120px] items-center justify-center gap-1.5 rounded-[10px] px-4 text-[15px] font-semibold text-white disabled:opacity-50"
              style={{ background: 'var(--acq-teal)' }}
              data-testid="challenge-next"
            >
              Next
              <ChevronRight className="h-4 w-4" strokeWidth={2} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
