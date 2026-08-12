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

// Strip string/template literal contents so braces/brackets inside quoted
// text don't throw off the depth count. Handles the common cases (single,
// double, backtick) — not a full JS parser, but good enough for this file.
function stripLiterals(line) {
  return line
    .replace(/'(?:[^'\\]|\\.)*'/g, "''")
    .replace(/"(?:[^"\\]|\\.)*"/g, '""')
    .replace(/`(?:[^`\\]|\\.)*`/g, '``');
}

// 1. Brace/bracket balance (ignoring strings and comments)
let braces = 0, brackets = 0;
for (const line of lines) {
  if (line.trim().startsWith('//') || line.trim().startsWith('*')) continue;
  const clean = stripLiterals(line);
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

// 5. Structural depth check — every lesson object must sit exactly one level
// inside a module's `lessons: [` array (brace depth 2, bracket depth 2 from
// the top of the file). This is the check that would have caught the
// finance-9/finance-10 bug: two full lesson objects that got appended INSIDE
// finance-8's quiz array by an insertion script, instead of as siblings in
// the module's lessons array. The brace-balance check above stays green in
// that scenario (the file is still syntactically valid — just wrong), and
// the old version of this check only looked for a couple of fixed
// indentation patterns, which this exact bug didn't match. Walking real
// brace/bracket depth catches it regardless of indentation.
//
// It also tracks which module each lesson is physically nested under, and
// flags a lesson whose ID prefix doesn't match its module (e.g. an
// 'ops-N' lesson sitting inside the foundations module's lessons array —
// syntactically fine, but semantically in the wrong place).
const MODULE_LESSON_PREFIX = {
  foundations: 'foundations',
  finance: 'finance',
  contracts: 'contracts',
  data: 'data',
  capture: 'capture',
  operations: 'ops',
};

let depth = 0, bdepth = 0;
let currentModuleId = null;
let moduleOpenDepth = null;
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const clean = stripLiterals(line);

  const moduleIdMatch = line.match(/^ {2}id: '([a-z]+)',\s*$/);
  if (moduleIdMatch && moduleIds.includes(moduleIdMatch[1]) && depth === 1) {
    currentModuleId = moduleIdMatch[1];
    moduleOpenDepth = depth;
  }

  const lessonIdMatch = line.match(/^\s*id: '([a-z]+)-\d+[a-z]?',\s*$/);
  if (lessonIdMatch) {
    if (depth !== 2 || bdepth !== 2) {
      errors.push(`Lesson '${lessonIdMatch[0].match(/'([^']+)'/)[1]}' at line ${i + 1} is nested at brace depth ${depth}/bracket depth ${bdepth} — expected 2/2. It is likely trapped inside a sibling lesson's array (quiz/content/levels) instead of being a direct entry in a module's lessons array.`);
    } else if (currentModuleId) {
      const prefix = lessonIdMatch[1];
      const expectedPrefix = MODULE_LESSON_PREFIX[currentModuleId];
      if (prefix !== expectedPrefix) {
        errors.push(`Lesson '${prefix}-...' at line ${i + 1} is physically inside the '${currentModuleId}' module's lessons array, but its ID prefix suggests it belongs to a different module.`);
      }
    }
  }

  for (const ch of clean) {
    if (ch === '{') depth++;
    else if (ch === '}') depth--;
    else if (ch === '[') bdepth++;
    else if (ch === ']') bdepth--;
  }

  if (currentModuleId && depth < moduleOpenDepth) {
    currentModuleId = null;
    moduleOpenDepth = null;
  }
}

if (errors.length > 0) {
  console.error('Curriculum validation FAILED:');
  errors.forEach(e => console.error('  * ' + e));
  process.exit(1);
}

console.log(`Curriculum OK — ${ids.length} lesson IDs, ${moduleIds.length} modules verified`);
