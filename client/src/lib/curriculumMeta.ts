// ─── The light half of the curriculum ──────────────────────────────────────
//
// Every screen that shows a module card, a lesson list, a progress bar or the
// search box needs the same handful of facts: what a lesson is called, how
// long it takes, how many questions it has. None of them need the lesson text.
//
// They all used to import `modules` from curriculum.ts anyway, which is 3.3 MB
// of source, and that made the course library the first thing a visitor
// downloaded — before the sign-in page could even paint.
//
// So the data now comes in two pieces:
//
//   this file          the facts above, for every lesson. Loaded up front.
//   curriculum.ts      the lesson bodies. Loaded when a lesson is opened,
//                      and quietly prefetched before that.
//
// The numbers here are generated from curriculum.ts, never typed by hand, and
// the build fails if the two have drifted. See scripts/gen-curriculum-meta.ts.
//
// RULE OF THUMB: if you are writing a list, a card or a count, import from
// here. If you are rendering the lesson itself, use loadCurriculum().

import { modules } from './curriculumMeta.generated';

export { modules };

// The full-fat types still live in curriculum.ts. Re-exported as types only,
// which the compiler erases — importing `Lesson` from here does not pull in
// three megabytes.
export type {
  Lesson,
  LessonContent,
  LessonContentType,
  LessonLevelSection,
  LessonAttachment,
  LessonAttachmentImage,
  KeyTerm,
  QuizQuestion,
  ExpandableItem,
  SkillLevel,
  Module,
  ModuleAssessmentQuestion,
} from './curriculum';

export interface LessonMeta {
  id: string;
  title: string;
  duration: string;
  description: string;
  /** Number of quiz questions. Was `lesson.quiz?.length` at the call site. */
  quizCount: number;
  /** Number of key terms. Was `lesson.keyTerms?.length`. */
  termCount: number;
  /** Key-term names, for search. The definitions stay in curriculum.ts. */
  terms: string[];
  attachmentCount?: number;
}

export interface ModuleMeta {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  color: string;
  description: string;
  lessons: LessonMeta[];
  free?: boolean;
  /** Was `module.assessment?.length`. Zero means no gate assessment. */
  assessmentCount: number;
  pdfUrl?: string;
  audioUrl?: string;
  audioReady?: boolean;
}

// ─── Helpers ───────────────────────────────────────────────────────────────
// Same names and same behaviour as the ones that used to live in
// curriculum.ts, so call sites did not have to change when they moved.

export const getAllLessons = (): { lesson: LessonMeta; module: ModuleMeta }[] =>
  modules.flatMap(mod => mod.lessons.map(lesson => ({ lesson, module: mod })));

export const getTotalLessons = () => getAllLessons().length;
export const getTotalModules = () => modules.length;

/** Parse "14 min" → 14. Returns 0 if format is unexpected. */
export const parseDuration = (d: string): number => {
  const m = d.match(/^(\d+)/);
  return m ? parseInt(m[1], 10) : 0;
};

/** Sum all lesson durations for a module, returned in minutes. */
export const getModuleTotalMinutes = (moduleId: string): number => {
  const mod = modules.find(m => m.id === moduleId);
  if (!mod) return 0;
  return mod.lessons.reduce((acc, l) => acc + parseDuration(l.duration), 0);
};

/** Format minutes as "Xh Ym" or "Y min" */
export const formatDuration = (mins: number): string => {
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
};

// ─── Loading the lesson bodies ─────────────────────────────────────────────

type FullCurriculum = typeof import('./curriculum');

// One in-flight promise, reused. The browser caches the file itself, so this
// only guards against firing several requests in the same page load.
let pending: Promise<FullCurriculum> | null = null;

/**
 * Fetches the full curriculum — every lesson's text, quizzes and key terms.
 *
 * Costs one network round trip the first time and nothing afterwards, for the
 * session and for later visits (the filename carries a content hash, so the
 * browser keeps it until the curriculum actually changes). Call it from
 * anywhere that renders a lesson or an assessment.
 */
export function loadCurriculum(): Promise<FullCurriculum> {
  if (!pending) {
    pending = import('./curriculum').catch(err => {
      // Let the next call try again rather than caching the failure — a
      // dropped connection should not make lessons permanently unopenable.
      pending = null;
      throw err;
    });
  }
  return pending;
}

/**
 * Starts the download without waiting for it, for when we can see a lesson
 * coming — the dashboard has painted, or the pointer is over a lesson card.
 * Safe to call as often as you like; only the first one does anything.
 */
export function prefetchCurriculum(): void {
  // Deliberately swallows errors: this is an optimisation, and loadCurriculum
  // will surface a real failure properly when the user actually opens a lesson.
  void loadCurriculum().catch(() => {});
}
