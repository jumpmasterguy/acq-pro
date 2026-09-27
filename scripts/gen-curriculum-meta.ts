/**
 * Generates client/src/lib/curriculumMeta.generated.ts from curriculum.ts.
 *
 * WHY THIS EXISTS
 *
 * curriculum.ts is 3.3 MB of source — every word of every lesson. It was
 * also the first thing every visitor downloaded, because a dozen screens
 * imported `modules` from it just to read a title or count lessons. That put
 * the entire course library in front of the sign-in page.
 *
 * So the app now loads two different things:
 *
 *   curriculumMeta.generated.ts  ~80 KB  titles, durations, counts, key-term
 *                                        names. Everything a list, a card, a
 *                                        progress bar or the search box needs.
 *                                        Loaded up front.
 *
 *   curriculum.ts               3.3 MB  the lesson bodies. Loaded the moment
 *                                        a lesson or an assessment is opened,
 *                                        and prefetched quietly before that.
 *
 * The generated file is checked in so the build never depends on running this,
 * and `--check` (wired into prebuild) fails the build if it has drifted from
 * curriculum.ts. That is the whole safety story: the two files cannot disagree
 * for longer than one build.
 *
 *   npx tsx scripts/gen-curriculum-meta.ts           # write it
 *   npx tsx scripts/gen-curriculum-meta.ts --check   # fail if stale
 */

import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { modules } from '../client/src/lib/curriculum';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(__dirname, '../client/src/lib/curriculumMeta.generated.ts');

const meta = modules.map(mod => ({
  id: mod.id,
  title: mod.title,
  subtitle: mod.subtitle,
  icon: mod.icon,
  color: mod.color,
  description: mod.description,
  ...(mod.free !== undefined ? { free: mod.free } : {}),
  ...(mod.pdfUrl ? { pdfUrl: mod.pdfUrl } : {}),
  ...(mod.audioUrl ? { audioUrl: mod.audioUrl } : {}),
  ...(mod.audioReady !== undefined ? { audioReady: mod.audioReady } : {}),
  assessmentCount: mod.assessment?.length ?? 0,
  lessons: mod.lessons.map(lesson => ({
    id: lesson.id,
    title: lesson.title,
    duration: lesson.duration,
    description: lesson.description,
    // These three mirror exactly what the UI used to compute inline from the
    // full objects, so the numbers on screen do not move.
    quizCount: lesson.quiz?.length ?? 0,
    termCount: lesson.keyTerms?.length ?? 0,
    // Term names only — the definitions are the expensive half, and search
    // never looked at them.
    terms: (lesson.keyTerms ?? []).map((t: any) =>
      typeof t === 'string' ? t : (t.term ?? '')
    ),
    ...(lesson.attachments?.length ? { attachmentCount: lesson.attachments.length } : {}),
  })),
}));

const body = `// GENERATED FILE — DO NOT EDIT.
// Written by scripts/gen-curriculum-meta.ts from client/src/lib/curriculum.ts.
// Regenerate with:  npx tsx scripts/gen-curriculum-meta.ts
// The build checks this is current and fails if it is not.

import type { ModuleMeta } from './curriculumMeta';

export const modules: ModuleMeta[] = ${JSON.stringify(meta, null, 2)};
`;

if (process.argv.includes('--check')) {
  let current = '';
  try {
    current = readFileSync(OUT, 'utf8');
  } catch {
    console.error('curriculumMeta.generated.ts is missing. Run: npx tsx scripts/gen-curriculum-meta.ts');
    process.exit(1);
  }
  if (current !== body) {
    console.error(
      'curriculumMeta.generated.ts is out of date with curriculum.ts.\n' +
      'Run:  npx tsx scripts/gen-curriculum-meta.ts   and commit the result.'
    );
    process.exit(1);
  }
  console.log(`Curriculum meta is current (${meta.length} modules, ${meta.reduce((n, m) => n + m.lessons.length, 0)} lessons).`);
} else {
  writeFileSync(OUT, body);
  const kb = (Buffer.byteLength(body) / 1024).toFixed(0);
  console.log(`Wrote curriculumMeta.generated.ts — ${meta.length} modules, ${meta.reduce((n, m) => n + m.lessons.length, 0)} lessons, ${kb} KB.`);
}
