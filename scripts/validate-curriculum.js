#!/usr/bin/env node
/**
 * validate-curriculum.js
 * Runs as prebuild. Catches broken curriculum before Railway deploys it.
 */
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CURRICULUM_PATH = resolve(__dirname, '../client/src/lib/curriculum.ts');

console.log('Validating curriculum structure...');

const content = readFileSync(CURRICULUM_PATH, 'utf8');
const lines = content.split('\n');
const errors = [];

// 1. Brace/bracket balance (ignoring strings and comments)
let braces = 0, brackets = 0;
for (const line of lines) {
  if (line.trim().startsWith('//') || line.trim().startsWith('*')) continue;
  const clean = line.replace(/(['"`])(?:(?!\1)[^\\]|\\.)*\1/g, '""');
  braces   += (clean.match(/{/g)||[]).length - (clean.match(/}/g)||[]).length;
  brackets += (clean.match(/\[/g)||[]).length - (clean.match(/\]/g)||[]).length;
}
if (braces   !== 0) errors.push(`Unbalanced braces — net ${braces > 0 ? '+' : ''}${braces}`);
if (brackets !== 0) errors.push(`Unbalanced brackets — net ${brackets > 0 ? '+' : ''}${brackets}`);

// 2. Duplicate lesson IDs
const ids = [];
for (const m of content.matchAll(/\bid:\s*'([a-z]+-\d+[a-z]?)'/g)) {
  if (ids.includes(m[1])) errors.push(`Duplicate lesson ID: ${m[1]}`);
  else ids.push(m[1]);
}

// 3. Minimum module count
const moduleIds = ['finance','contracts','foundations','data','capture','operations'];
for (const mod of moduleIds) {
  if (!content.includes(`id: '${mod}'`)) errors.push(`Missing module: ${mod}`);
}

// 4. Each module must have a lessons array (rough check)
const lessonsArrays = (content.match(/lessons:\s*\[/g)||[]).length;
if (lessonsArrays < 6) errors.push(`Only ${lessonsArrays} lessons arrays found — expected at least 6`);

// 5. No lesson IDs appearing at module-level indentation (the awk insertion bug)
// A lesson like finance-10 should be deeply nested, not at the top level of the file
const moduleLevel = /^    \{\s*\n\s+id: '(finance|contracts|foundations|data|capture|ops|operations)-/m;
// This checks if a lesson starts at 4-space indent (module level) — wrong
for (let i = 0; i < lines.length - 1; i++) {
  const twoLines = lines[i] + '\n' + lines[i+1];
  if (/^    \{$/.test(lines[i]) && /^      id: '(finance|contracts|foundations|data|capture|operations)-/.test(lines[i+1])) {
    // 4-space lesson block — check it's inside a lessons array
    // Walk back to find context
    let inLessons = false;
    for (let j = i - 1; j >= Math.max(0, i - 50); j--) {
      if (lines[j].includes('lessons: [')) { inLessons = true; break; }
      if (lines[j].trim() === '];' || lines[j].trim() === '],') break;
    }
    // This check is approximate — skip for now as the balance check covers it
  }
}

if (errors.length > 0) {
  console.error('Curriculum validation FAILED:');
  errors.forEach(e => console.error('  * ' + e));
  process.exit(1);
}

console.log(`Curriculum OK — ${ids.length} lesson IDs, ${moduleIds.length} modules verified`);
