/**
 * Building blocks for the mobile Module screen: the skill-level pill, the
 * resource rows (Lesson Book / The Debrief), and the lesson rows with their
 * connected numbered rail.
 */

import type { ReactNode } from 'react';
import { Clock, BookOpen, ChevronRight } from 'lucide-react';
import type { LessonMeta } from '@/lib/curriculumMeta';
import { getModuleTheme, moduleTint, type ModuleTheme, getModuleFamilyTheme } from '@/lib/moduleTheme';

// ── Skill level pill ────────────────────────────────────────────────────────

const LEVEL_DOT: Record<string, string> = {
  novice: '#93C5FD',
  intermediate: '#FDE68A',
  advanced: '#6EE7B7',
};

export function SkillLevelPill({
  level,
  onDark = false,
}: {
  level: string;
  onDark?: boolean;
}) {
  const label = level.charAt(0).toUpperCase() + level.slice(1);
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold"
      style={
        onDark
          ? { background: 'rgba(255,255,255,.15)', color: '#fff' }
          : { background: 'var(--acq-surface-sunken)', color: 'var(--acq-text-secondary)' }
      }
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ background: LEVEL_DOT[level] ?? LEVEL_DOT.novice }}
      />
      {label}
    </span>
  );
}

// ── Resource row ────────────────────────────────────────────────────────────

export function ResourceRow({
  icon,
  title,
  description,
  theme,
  locked,
  action,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  theme: ModuleTheme;
  locked: boolean;
  action: ReactNode;
}) {
  return (
    <div
      className="flex items-start gap-3 rounded-[14px] p-3.5"
      style={{
        background: 'var(--acq-surface-card)',
        border: '1px solid var(--acq-border-subtle)',
        boxShadow: 'var(--acq-shadow-sm)',
      }}
    >
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px]"
        style={{
          background: locked ? 'var(--acq-surface-sunken)' : moduleTint(theme.mobileHex),
          color: locked ? 'var(--acq-text-faint)' : theme.mobileHex,
        }}
      >
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold" style={{ color: 'var(--acq-text-heading)' }}>
          {title}
        </div>
        <div className="mt-0.5 text-xs" style={{ color: 'var(--acq-text-muted)' }}>
          {description}
        </div>
        <div className="mt-2">{action}</div>
      </div>
    </div>
  );
}

// ── Lesson row ──────────────────────────────────────────────────────────────

export type LessonState = 'done' | 'locked' | 'open';

/**
 * One lesson. The left rail carries the numbered circle and a connector down
 * to the next row, so the column reads as a sequence rather than a stack of
 * unrelated cards — hence `isLast`, which stops the connector at the bottom.
 */
export function LessonRow({
  lesson,
  seq,
  state,
  isLast,
  moduleId,
  isFreePreview,
  onOpen,
}: {
  lesson: LessonMeta;
  seq: number;
  state: LessonState;
  isLast: boolean;
  moduleId: string;
  isFreePreview: boolean;
  onOpen: () => void;
}) {
  const theme = getModuleFamilyTheme(moduleId);

  const railBg =
    state === 'done'
      ? 'rgba(34,197,94,.1)'
      : state === 'locked'
        ? 'var(--acq-surface-sunken)'
        : moduleTint(theme.mobileHex);

  const circle =
    state === 'done'
      ? { background: '#22C55E', color: '#fff', glyph: '✓' }
      : state === 'locked'
        ? { background: 'var(--acq-surface-muted)', color: 'var(--acq-text-muted)', glyph: '🔒' }
        : { background: theme.mobileHex, color: '#fff', glyph: String(seq) };

  const termCount = lesson.termCount;
  const quizCount = lesson.quizCount;

  return (
    <button
      type="button"
      onClick={onOpen}
      className="acq-press flex w-full overflow-hidden rounded-[14px] text-left"
      style={{
        background: 'var(--acq-surface-card)',
        border: '1px solid var(--acq-border-subtle)',
        boxShadow: 'var(--acq-shadow-sm)',
      }}
      data-testid={`lesson-row-${lesson.id}`}
    >
      {/* Rail */}
      <span
        className="relative flex w-12 shrink-0 justify-center pt-3.5"
        style={{ background: railBg }}
      >
        <span
          className="acq-tnum relative z-10 flex h-7 w-7 items-center justify-center rounded-full text-xs font-extrabold"
          style={{ background: circle.background, color: circle.color }}
        >
          {circle.glyph}
        </span>
        {!isLast && (
          <span
            aria-hidden="true"
            className="absolute left-1/2 top-[42px] w-px -translate-x-1/2"
            style={{ bottom: 0, background: 'var(--acq-border-default)', opacity: 0.6 }}
          />
        )}
      </span>

      {/* Body */}
      <span className="min-w-0 flex-1 p-3.5">
        <span className="flex items-start gap-2">
          <span className="min-w-0 flex-1">
            <span
              className="block text-sm font-semibold leading-[1.35]"
              style={{ color: state === 'locked' ? 'var(--acq-text-muted)' : 'var(--acq-text-heading)' }}
            >
              {lesson.title}
            </span>
            <span className="mt-0.5 block text-xs leading-[1.45]" style={{ color: 'var(--acq-text-muted)' }}>
              {lesson.description}
            </span>
          </span>
          <ChevronRight className="mt-0.5 h-4 w-4 shrink-0" style={{ color: 'var(--acq-text-faint)' }} />
        </span>

        <span className="mt-2 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px]" style={{ color: 'var(--acq-text-muted)' }}>
          <span className="inline-flex items-center gap-1">
            <Clock className="h-2.5 w-2.5" strokeWidth={2} />
            {lesson.duration}
          </span>
          {termCount > 0 && (
            <span className="inline-flex items-center gap-1">
              <BookOpen className="h-2.5 w-2.5" strokeWidth={2} />
              {termCount} terms
            </span>
          )}
          {quizCount > 0 && <span>✦ {quizCount} quiz</span>}
          {isFreePreview && (
            <span className="font-bold" style={{ color: 'var(--acq-text-brand)' }}>Free</span>
          )}
          {state === 'done' && (
            <span className="font-bold" style={{ color: 'var(--acq-success)' }}>✓ Done</span>
          )}
        </span>
      </span>
    </button>
  );
}
