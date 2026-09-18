/**
 * Dump the curriculum to JSON for the Lesson Book generator.
 *
 * curriculum.ts lives in client/ and is a TypeScript module, so the Python
 * generator cannot read it directly. This writes the same data as plain JSON:
 *
 *     npx tsx scripts/export-curriculum.ts
 *     python3 scripts/generate_lesson_book.py --modules business,smallbiz
 */
import { modules } from '../client/src/lib/curriculum';
import * as fs from 'fs';

const out = process.argv[2] ?? '/tmp/curriculum-export.json';
fs.writeFileSync(out, JSON.stringify(modules, null, 1));
const { size } = fs.statSync(out);
console.log(`wrote ${out}: ${(modules as any[]).length} modules, ${(size / 1024 / 1024).toFixed(1)} MB`);
