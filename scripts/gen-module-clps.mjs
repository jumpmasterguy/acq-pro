#!/usr/bin/env node
/**
 * Generates shared/moduleClps.generated.ts from client/src/lib/curriculum.ts.
 *
 * WHY
 * ---
 * MODULE_CLPS used to be a hand-maintained literal covering only the original
 * six modules, totalling 12.7 CLPs. server/routes.ts reads that same map for
 * GET /api/certificate/:moduleId and 404s on anything missing, so once the
 * curriculum grew to fourteen modules, a user who finished any of the eight
 * newer ones and clicked "Download Certificate of Completion" got
 * "Module not found" — on the exact feature the pricing page sells.
 *
 * Meanwhile landing.html had already been updated by hand to a fourteen-module
 * CLP table totalling 44.4, derived from lesson durations. So the marketing
 * side was right and the app was two curriculum expansions behind.
 *
 * HOW
 * ---
 * 1 CLP = 1 hour of instruction (DAU policy), so CLPs are simply each module's
 * summed lesson durations over 60. Rounding is to one decimal, matching the
 * table already published on landing.html, except that it FLOORS to one decimal
 * where that table rounded. The certificate is a record people file with a
 * government learning system, so it must never claim more instruction time than
 * the module holds. Flooring totals 43.8 rather than 44.5, which is why the
 * published copy moved down to match rather than the other way round.
 *
 * The generated file is committed so a fresh checkout builds without running
 * codegen first, and it is regenerated at the top of `npm run build`, so it
 * cannot drift from the curriculum the way the literal did.
 *
 *   node scripts/gen-module-clps.mjs           regenerate (and verify copy)
 *   node scripts/gen-module-clps.mjs --check    verify only, non-zero on drift
 */
import { readFileSync, writeFileSync } from "fs";
import { join, dirname, resolve } from "path";
import { fileURLToPath } from "url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const CURRICULUM = join(ROOT, "client", "src", "lib", "curriculum.ts");
const OUT = join(ROOT, "shared", "moduleClps.generated.ts");
const LANDING = join(ROOT, "client", "public", "landing.html");
const CHECK_ONLY = process.argv.includes("--check");

// ---------------------------------------------------------------------------
function readModules() {
  const src = readFileSync(CURRICULUM, "utf8");
  // A module's `id:` sits at four-space indent; a lesson's at eight.
  const marks = [...src.matchAll(/^    id: '([a-z0-9-]+)',$/gm)]
    .map((m) => ({ id: m[1], at: m.index }));
  if (!marks.length) {
    console.error("gen-module-clps: parsed 0 modules from curriculum.ts, refusing to write");
    process.exit(1);
  }
  return marks.map((mark, i) => {
    const seg = src.slice(mark.at, i + 1 < marks.length ? marks[i + 1].at : src.length);
    const title = (seg.match(/title:\s*'((?:[^'\\]|\\.)*)'/) || [])[1];
    const durations = [...seg.matchAll(/duration:\s*'(\d+)\s*min'/g)].map((m) => +m[1]);
    const lessons = [...seg.matchAll(/\bid:\s*'[a-z]+-\d+[a-z]?'/g)].length;
    if (!title) {
      console.error(`gen-module-clps: module '${mark.id}' has no title`);
      process.exit(1);
    }
    if (durations.length !== lessons) {
      // Under-counting here would understate a certificate, so refuse rather
      // than silently print a low number on a compliance record.
      console.error(`gen-module-clps: module '${mark.id}' has ${lessons} lessons but ` +
                    `${durations.length} durations; every lesson needs a duration ` +
                    `before CLPs can be derived`);
      process.exit(1);
    }
    const minutes = durations.reduce((a, b) => a + b, 0);
    // FLOOR to one decimal, not round. This number prints on a Certificate of
    // Completion that people self-report to a government learning record, so it
    // must never claim more instruction time than the module actually contains.
    // Rounding would total 44.5 and overstate six modules by up to 0.05 CLP.
    // (The hand-built table this replaced rounded, and inconsistently: it was
    // generated in Python, where 2.15 rounds down to 2.1 but 4.15 rounds up to
    // 4.2, a float artifact rather than a policy.)
    return { id: mark.id, title, lessons, minutes, clps: Math.floor((minutes / 60) * 10) / 10 };
  });
}

const mods = readModules();
const total = Math.round(mods.reduce((s, m) => s + m.clps, 0) * 10) / 10;

// ---------------------------------------------------------------------------
const body = `// GENERATED FILE — DO NOT EDIT BY HAND.
// Written by scripts/gen-module-clps.mjs from client/src/lib/curriculum.ts,
// regenerated at the top of every build. Edit lesson durations in the
// curriculum, not the numbers here.
//
// 1 CLP = 1 hour of instruction (DAU policy): each module's summed lesson
// durations over 60, to one decimal.
//
// ${mods.length} modules · ${mods.reduce((s, m) => s + m.lessons, 0)} lessons · ${mods.reduce((s, m) => s + m.minutes, 0)} minutes · ${total} CLPs total

import type { ModuleClp } from "./moduleClps";

export const GENERATED_MODULE_CLPS: Record<string, ModuleClp> = {
${mods.map((m) => `  ${m.id}: { title: ${JSON.stringify(m.title)}, clps: ${m.clps.toFixed(1)} },` +
                  ` // ${m.lessons} lessons, ${m.minutes} min`).join("\n")}
};

/** Sum of every module's CLPs, as advertised. */
export const GENERATED_TOTAL_CLPS = ${total.toFixed(1)};
`;

const existing = (() => { try { return readFileSync(OUT, "utf8"); } catch { return null; } })();

if (CHECK_ONLY) {
  if (existing !== body) {
    console.error("gen-module-clps: shared/moduleClps.generated.ts is out of date with " +
                  "the curriculum. Run `node scripts/gen-module-clps.mjs`.");
    process.exit(1);
  }
} else if (existing !== body) {
  writeFileSync(OUT, body);
  console.log(`gen-module-clps: wrote ${mods.length} modules, ${total} CLPs total`);
} else {
  console.log(`gen-module-clps: up to date (${mods.length} modules, ${total} CLPs total)`);
}

// ---------------------------------------------------------------------------
// The published CLP table is what a customer reads before buying, and the
// certificate has to agree with it. Verify rather than rewrite: the rows are
// positional, and silently repointing a number at the wrong module would be
// worse than a failed build.
// ---------------------------------------------------------------------------
const landing = readFileSync(LANDING, "utf8");
const published = [...landing.matchAll(/([0-9]+\.[0-9]) CLPs/g)].map((m) => m[1]);
const problems = [];

for (const m of mods) {
  if (!published.includes(m.clps.toFixed(1))) {
    problems.push(`landing.html never shows ${m.clps.toFixed(1)} CLPs (${m.id}, ` +
                  `${m.minutes} min). The published table is stale.`);
  }
}
for (const re of [/Earn over (\d+) CLPs/, /combined equal more than (\d+) CLPs/]) {
  const m = landing.match(re);
  if (m && Number(m[1]) >= total) {
    problems.push(`landing.html claims "${m[0]}" but the curriculum totals ` +
                  `${total} CLPs. The claim overstates what the app will certify.`);
  }
}
if (problems.length) {
  console.error("\ngen-module-clps: marketing copy disagrees with the curriculum:");
  for (const p of [...new Set(problems)]) console.error(`  ${p}`);
  process.exit(1);
}
console.log(`gen-module-clps: landing.html CLP figures agree (total ${total})`);
