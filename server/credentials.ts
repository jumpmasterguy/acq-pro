/**
 * Module completion records, certificates, and the CLP ledger.
 *
 * WHY THIS EXISTS (27 Sep 2026)
 * -----------------------------
 * Completed lessons were stored as a bare array with no dates, so:
 *   - GET /api/certificate/:moduleId never checked that the module was
 *     finished. Any signed-in user could download a certificate for any
 *     module and self-report CLPs they had not earned.
 *   - The date printed was the download date, so the same module showed a
 *     different "Date Completed" every time it was downloaded.
 *   - The certificate ID came from Python's hash(), which changes on every
 *     run, and nothing stored it, so it could not be verified.
 *
 * Now each finished module gets one record, written once and never changed:
 *   users.module_completions = { [moduleId]: { completedAt, certId, backfilled? } }
 *
 * `backfilled: true` marks modules that were already finished before this
 * existed. Their true completion date was never recorded, so the stamp is
 * the date we first noticed, and the ledger says so rather than pretending.
 */
import { randomBytes } from "crypto";
import { MODULE_CLPS } from "@shared/moduleClps";
import { MODULE_LESSON_IDS, MODULE_FUNCTIONAL_AREAS } from "@shared/moduleClps.generated";

export interface ModuleCompletion {
  completedAt: string;   // ISO timestamp
  certId: string;        // ACQ-XXXX-XXXX, unique, never reissued
  backfilled?: boolean;  // finished before completion dates were recorded
}
export type ModuleCompletions = Record<string, ModuleCompletion>;

/** DAWIA continuous learning requirement: 80 CLPs every two years. */
export const CLP_CYCLE_TARGET = 80;
export const CLP_CYCLE_MONTHS = 24;

// Crockford-style alphabet: no 0/O or 1/I/L, so an ID read aloud or typed
// from a printout cannot be mistaken for another.
const ALPHABET = "23456789ABCDEFGHJKMNPQRSTVWXYZ";

export function newCertId(): string {
  const bytes = randomBytes(8);
  let out = "";
  for (let i = 0; i < 8; i++) out += ALPHABET[bytes[i] % ALPHABET.length];
  return `ACQ-${out.slice(0, 4)}-${out.slice(4)}`;
}

export function isModuleComplete(completedLessons: Iterable<string>, moduleId: string): boolean {
  const ids = MODULE_LESSON_IDS[moduleId];
  if (!ids || ids.length === 0) return false;
  const done = new Set(completedLessons);
  return ids.every((id) => done.has(id));
}

export function moduleOfLesson(lessonId: string): string | undefined {
  for (const [moduleId, ids] of Object.entries(MODULE_LESSON_IDS)) {
    if (ids.includes(lessonId)) return moduleId;
  }
  return undefined;
}

/**
 * Stamp every finished module that has no record yet. Existing records are
 * never touched, so a completion date and certificate ID are permanent.
 *
 * `freshModuleId` is the module whose last lesson was completed in this very
 * request: that one gets a real completion date. Any other finished module
 * without a record was finished before records existed, so it is marked
 * backfilled.
 */
export function syncCompletions(
  completedLessons: Iterable<string>,
  existing: ModuleCompletions | null | undefined,
  freshModuleId?: string,
  now: Date = new Date(),
): { completions: ModuleCompletions; changed: boolean; newlyCompleted: string[] } {
  const completions: ModuleCompletions = { ...(existing ?? {}) };
  const lessons = Array.from(completedLessons);
  const newlyCompleted: string[] = [];
  const taken = new Set(Object.values(completions).map((c) => c.certId));
  for (const moduleId of Object.keys(MODULE_LESSON_IDS)) {
    if (completions[moduleId]) continue;
    if (!isModuleComplete(lessons, moduleId)) continue;
    let certId = newCertId();
    while (taken.has(certId)) certId = newCertId();
    taken.add(certId);
    completions[moduleId] = {
      completedAt: now.toISOString(),
      certId,
      ...(moduleId === freshModuleId ? {} : { backfilled: true }),
    };
    newlyCompleted.push(moduleId);
  }
  return { completions, changed: newlyCompleted.length > 0, newlyCompleted };
}

export function certificateName(user: { firstName?: string | null; lastName?: string | null; username?: string | null }): string {
  const fullName = `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim();
  if (fullName && !fullName.includes("@")) return fullName;
  if (user.username && !user.username.includes("@")) return user.username;
  return "Defense Professional";
}

export function formatCertDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" });
}

export interface LedgerEntry {
  moduleId: string;
  title: string;
  clps: number;
  functionalAreas: readonly string[];
  completedAt: string;
  certId: string;
  backfilled: boolean;
  inCurrentCycle: boolean;
}

export interface Ledger {
  entries: LedgerEntry[];
  totalClps: number;
  cycleClps: number;        // earned in the last 24 months
  cycleTarget: number;      // 80
  cycleStart: string;       // ISO date, 24 months ago
  availableClps: number;    // across the whole course
  modulesTotal: number;
}

export function buildLedger(completions: ModuleCompletions | null | undefined, now: Date = new Date()): Ledger {
  const cycleStartDate = new Date(now);
  cycleStartDate.setUTCMonth(cycleStartDate.getUTCMonth() - CLP_CYCLE_MONTHS);
  const entries: LedgerEntry[] = Object.entries(completions ?? {})
    .filter(([moduleId]) => MODULE_CLPS[moduleId])
    .map(([moduleId, c]) => ({
      moduleId,
      title: MODULE_CLPS[moduleId].title,
      clps: MODULE_CLPS[moduleId].clps,
      functionalAreas: MODULE_FUNCTIONAL_AREAS[moduleId] ?? ["Program Management (PM)"],
      completedAt: c.completedAt,
      certId: c.certId,
      backfilled: !!c.backfilled,
      inCurrentCycle: new Date(c.completedAt) >= cycleStartDate,
    }))
    .sort((a, b) => b.completedAt.localeCompare(a.completedAt));
  const round1 = (n: number) => Math.round(n * 10) / 10;
  return {
    entries,
    totalClps: round1(entries.reduce((s, e) => s + e.clps, 0)),
    cycleClps: round1(entries.filter((e) => e.inCurrentCycle).reduce((s, e) => s + e.clps, 0)),
    cycleTarget: CLP_CYCLE_TARGET,
    cycleStart: cycleStartDate.toISOString().slice(0, 10),
    availableClps: round1(Object.values(MODULE_CLPS).reduce((s, m) => s + m.clps, 0)),
    modulesTotal: Object.keys(MODULE_LESSON_IDS).length,
  };
}

function csvCell(v: string | number): string {
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function ledgerCsv(ledger: Ledger, name: string): string {
  const rows: (string | number)[][] = [
    ["Name", "Course", "Provider", "Completion Date", "Hours", "CLPs", "DAWIA Functional Areas", "Certificate ID", "Verify URL", "Note"],
    ...ledger.entries.map((e) => [
      name,
      e.title,
      "Acqlerate",
      e.completedAt.slice(0, 10),
      e.clps.toFixed(1),
      e.clps.toFixed(1),
      e.functionalAreas.join("; "),
      e.certId,
      `https://acqlerate.com/verify/${e.certId}`,
      e.backfilled ? "Completed before completion dates were recorded; date shown is when it was first recorded" : "",
    ]),
  ];
  return rows.map((r) => r.map(csvCell).join(",")).join("\r\n") + "\r\n";
}
