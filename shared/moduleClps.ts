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

export interface ModuleClp {
  title: string;
  clps: number;
}

export const MODULE_CLPS: Record<string, ModuleClp> = {
  foundations: { title: 'DoD Acquisitions Foundations', clps: 1.5 },
  finance: { title: 'Defense Finance & Budgeting', clps: 3.8 },
  contracts: { title: 'Defense Contracting Fundamentals', clps: 3.0 },
  data: { title: 'Data Analytics for Program Managers', clps: 1.3 },
  capture: { title: 'Capture Management & Business Development', clps: 1.6 },
  operations: { title: 'Program Operations & Leadership', clps: 1.5 },
};

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
