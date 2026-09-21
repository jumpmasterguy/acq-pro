/**
 * Continuous Learning Points per module — the single source of truth.
 *
 * These numbers are printed on the Certificate of Completion
 * (GET /api/certificate/:moduleId → server/certificate.py), so anywhere the
 * app *shows* a CLP figure has to agree with what the certificate will say.
 * They used to live only in server/routes.ts, which meant the client had no
 * way to display them at all; the mobile Modules list and Module header both
 * need them, so they moved here rather than being copied.
 *
 * 1 CLP = 1 hour of instruction, per DAU CLP policy.
 */

import { GENERATED_MODULE_CLPS } from "./moduleClps.generated";

export interface ModuleClp {
  title: string;
  clps: number;
}

/**
 * Every module's CLPs, derived from lesson durations in curriculum.ts by
 * scripts/gen-module-clps.mjs and regenerated at the top of every build.
 *
 * This used to be a hand-written literal covering only the original six
 * modules (12.7 CLPs). The curriculum reached fourteen, nothing updated this,
 * and because the certificate route below 404s on a module it cannot find, a
 * user who completed any of the eight newer modules got "Module not found"
 * when they clicked Download Certificate of Completion.
 *
 * To change a module's CLPs, change its lesson durations. Do not edit numbers
 * here or in the generated file.
 */
export const MODULE_CLPS: Record<string, ModuleClp> = GENERATED_MODULE_CLPS;

/** CLPs for one module, 0 if unknown. */
export function moduleClps(moduleId: string): number {
  return MODULE_CLPS[moduleId]?.clps ?? 0;
}

/** "1.5 CLPs" — the label used on module rows and headers. */
export function formatClps(clps: number): string {
  return `${clps.toFixed(1)} CLPs`;
}

/** Every module's CLPs added up, for the Modules list intro line. */
export function totalClps(): number {
  return Object.values(MODULE_CLPS).reduce((sum, m) => sum + m.clps, 0);
}
