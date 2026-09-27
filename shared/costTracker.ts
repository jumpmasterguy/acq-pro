/**
 * Cost & Burn Rate Tracker — shared types + calculation engine.
 *
 * Ports the methodology from cost-and-burn-rate-tracker.xlsx (Fringe ->
 * Overhead -> M&S(Sub) -> G&A(Prime + Sub-after-M&S) -> Fee) so the server
 * and client agree on exactly the same math. All money moves as integer
 * cents end-to-end — only the UI layer formats to dollars.
 *
 * G&A base = all prime burdened cost (Labor after Fringe+OH, plus prime
 * Travel/ODC/M&E) PLUS subcontractor Travel/ODC/M&E cost after the M&S
 * markup is applied to it. Subcontractor labor draws neither M&S nor G&A.
 */

export const CLINS = ['Labor', 'Travel', 'ODC', 'M&E'] as const;
export type Clin = typeof CLINS[number];
export type FeeType = 'Fixed' | 'Award' | 'CR';
export type PrimeSub = 'Prime' | 'Sub';

export interface TaskOrder {
  id: string;
  userId: string;
  code: string;
  name: string;
  archived: boolean;
  createdAt: string;
}

export interface CostProject {
  id: string;
  userId: string;
  taskOrderId: string | null;
  code: string;
  name: string;
  archived: boolean;
  createdAt: string;
}

export interface FundingMod {
  id: string;
  projectId: string;
  modNumber: string;
  acrn: string | null;
  slin: string | null;
  clin: Clin;
  amountCents: number;
  modDate: string | null;
  description: string | null;
  createdAt: string;
}

export interface CostEntry {
  id: string;
  projectId: string;
  clin: Clin;
  primeOrSub: PrimeSub;
  amountCents: number;
  entryDate: string;
  description: string | null;
  createdAt: string;
}

export interface RatesConfig {
  userId: string;
  fringe: number;
  overhead: number;
  ga: number;
  ms: number;
  fixedFeeRate: number;
  awardFeeRate: number;
  feeTypeByClin: Record<Clin, FeeType>;
  updatedAt: string;
}

export const DEFAULT_RATES: Omit<RatesConfig, 'userId' | 'updatedAt'> = {
  fringe: 0.35,
  overhead: 0.55,
  ga: 0.12,
  ms: 0.05,
  fixedFeeRate: 0.07,
  awardFeeRate: 0.10,
  feeTypeByClin: { Labor: 'Award', Travel: 'CR', ODC: 'Fixed', 'M&E': 'Award' },
};

export type Status = 'green' | 'yellow' | 'red' | 'unfunded';

export function statusFor(pctUsed: number, funded: number): Status {
  if (funded <= 0) return 'unfunded';
  if (pctUsed >= 0.7) return 'red';
  if (pctUsed >= 0.5) return 'yellow';
  return 'green';
}

export interface ClinSummary {
  clin: Clin;
  fundedCents: number;
  primeRawCents: number;    // Labor: unburdened direct $. Others: raw Prime cost $.
  subRawCents: number;
  primeBurdenedCents: number; // Labor: after Fringe+OH. Others: equals primeRawCents.
  totalCostCents: number;   // this CLIN's cost + its share of G&A/M&S
  feeType: FeeType;
  feeRate: number;
  feeCents: number;
  totalBilledCents: number;
  pctUsed: number;
  status: Status;
}

export interface ProjectSummary {
  gaBaseCents: number;
  msBaseCents: number;
  gaCents: number;
  msCents: number;
  subtotalCents: number;
  totalCostCents: number;
  totalFeeCents: number;
  totalBilledCents: number;
  totalFundedCents: number;
  pctUsed: number;
  status: Status;
  byClin: ClinSummary[];
}

/**
 * Rolls up several projects' summaries into one Task-Order-wide summary.
 * Rates are per-user (not per-project), so fee type/rate for a given CLIN
 * is always the same across the projects being combined -- we just sum
 * dollars and recompute pctUsed/status off the totals.
 */
export function aggregateSummaries(summaries: ProjectSummary[]): ProjectSummary {
  const byClin: ClinSummary[] = CLINS.map((clin) => {
    const parts = summaries.map((s) => s.byClin.find((c) => c.clin === clin)!);
    const fundedCents = parts.reduce((s, c) => s + c.fundedCents, 0);
    const primeRawCents = parts.reduce((s, c) => s + c.primeRawCents, 0);
    const subRawCents = parts.reduce((s, c) => s + c.subRawCents, 0);
    const primeBurdenedCents = parts.reduce((s, c) => s + c.primeBurdenedCents, 0);
    const totalCostCents = parts.reduce((s, c) => s + c.totalCostCents, 0);
    const feeCents = parts.reduce((s, c) => s + c.feeCents, 0);
    const totalBilledCents = parts.reduce((s, c) => s + c.totalBilledCents, 0);
    const pctUsed = fundedCents > 0 ? totalBilledCents / fundedCents : 0;
    const { feeType, feeRate } = parts[0]
      ? { feeType: parts[0].feeType, feeRate: parts[0].feeRate }
      : { feeType: 'CR' as FeeType, feeRate: 0 };
    return {
      clin, fundedCents, primeRawCents, subRawCents, primeBurdenedCents, totalCostCents,
      feeType, feeRate, feeCents, totalBilledCents, pctUsed,
      status: statusFor(pctUsed, fundedCents),
    };
  });

  const gaBaseCents = summaries.reduce((s, p) => s + p.gaBaseCents, 0);
  const msBaseCents = summaries.reduce((s, p) => s + p.msBaseCents, 0);
  const gaCents = summaries.reduce((s, p) => s + p.gaCents, 0);
  const msCents = summaries.reduce((s, p) => s + p.msCents, 0);
  const subtotalCents = summaries.reduce((s, p) => s + p.subtotalCents, 0);
  const totalCostCents = summaries.reduce((s, p) => s + p.totalCostCents, 0);
  const totalFeeCents = summaries.reduce((s, p) => s + p.totalFeeCents, 0);
  const totalBilledCents = summaries.reduce((s, p) => s + p.totalBilledCents, 0);
  const totalFundedCents = summaries.reduce((s, p) => s + p.totalFundedCents, 0);
  const pctUsed = totalFundedCents > 0 ? totalBilledCents / totalFundedCents : 0;

  return {
    gaBaseCents, msBaseCents, gaCents, msCents, subtotalCents, totalCostCents,
    totalFeeCents, totalBilledCents, totalFundedCents, pctUsed,
    status: statusFor(pctUsed, totalFundedCents),
    byClin,
  };
}

function feeRateFor(rates: RatesConfig, clin: Clin): { rate: number; type: FeeType } {
  const type = rates.feeTypeByClin[clin];
  if (type === 'Fixed') return { rate: rates.fixedFeeRate, type };
  if (type === 'Award') return { rate: rates.awardFeeRate, type };
  return { rate: 0, type: 'CR' };
}

/**
 * Sums funding mods and cost entries by CLIN, then runs the Fringe -> OH ->
 * M&S(Sub) -> G&A(Prime + Sub-after-M&S) -> Fee buildup — same logic as
 * Dashboard!I/K on the Excel tracker, just operating on DB-summed totals
 * instead of monthly spreadsheet cells.
 */
export function summarizeProject(mods: FundingMod[], entries: CostEntry[], rates: RatesConfig): ProjectSummary {
  const funded: Record<Clin, number> = { Labor: 0, Travel: 0, ODC: 0, 'M&E': 0 };
  for (const m of mods) funded[m.clin] += m.amountCents;

  const primeRaw: Record<Clin, number> = { Labor: 0, Travel: 0, ODC: 0, 'M&E': 0 };
  const subRaw: Record<Clin, number> = { Labor: 0, Travel: 0, ODC: 0, 'M&E': 0 };
  for (const e of entries) {
    if (e.primeOrSub === 'Prime') primeRaw[e.clin] += e.amountCents;
    else subRaw[e.clin] += e.amountCents;
  }

  const laborPrimeBurdened = Math.round(primeRaw.Labor * (1 + rates.fringe) * (1 + rates.overhead));
  const laborSub = subRaw.Labor;

  const primeBurdened: Record<Clin, number> = {
    Labor: laborPrimeBurdened,
    Travel: primeRaw.Travel,
    ODC: primeRaw.ODC,
    'M&E': primeRaw['M&E'],
  };

  const primeGaBase = primeBurdened.Labor + primeBurdened.Travel + primeBurdened.ODC + primeBurdened['M&E'];
  const msBase = subRaw.Travel + subRaw.ODC + subRaw['M&E']; // Sub labor never draws M&S
  const msCents = Math.round(msBase * rates.ms);
  // Subcontractor cost draws G&A too, but only after M&S has been applied to it.
  const subMsBurdened = msBase + msCents;
  const gaBase = primeGaBase + subMsBurdened;
  const gaCents = Math.round(gaBase * rates.ga);

  const subtotal = CLINS.reduce((s, c) => s + primeBurdened[c] + (c === 'Labor' ? laborSub : subRaw[c]), 0);
  const totalCost = subtotal + gaCents + msCents;

  const byClin: ClinSummary[] = CLINS.map((clin) => {
    const pb = primeBurdened[clin];
    const sb = clin === 'Labor' ? laborSub : subRaw[clin];
    const msShare = clin !== 'Labor' && msBase > 0 ? Math.round((sb / msBase) * msCents) : 0;
    // This CLIN's share of the G&A base: its prime cost, plus (for non-Labor
    // CLINs) its subcontractor cost after that CLIN's own M&S markup.
    const gaBaseShare = pb + (clin !== 'Labor' ? sb + msShare : 0);
    const gaShare = gaBase > 0 ? Math.round((gaBaseShare / gaBase) * gaCents) : 0;
    const clinTotalCost = pb + gaShare + sb + msShare;
    const { rate, type } = feeRateFor(rates, clin);
    const fee = Math.round(clinTotalCost * rate);
    const totalBilled = clinTotalCost + fee;
    const clinFunded = funded[clin];
    const pctUsed = clinFunded > 0 ? totalBilled / clinFunded : 0;
    return {
      clin,
      fundedCents: clinFunded,
      primeRawCents: primeRaw[clin],
      subRawCents: sb,
      primeBurdenedCents: pb,
      totalCostCents: clinTotalCost,
      feeType: type,
      feeRate: rate,
      feeCents: fee,
      totalBilledCents: totalBilled,
      pctUsed,
      status: statusFor(pctUsed, clinFunded),
    };
  });

  const totalFee = byClin.reduce((s, c) => s + c.feeCents, 0);
  const totalBilled = totalCost + totalFee;
  const totalFunded = CLINS.reduce((s, c) => s + funded[c], 0);
  const pctUsed = totalFunded > 0 ? totalBilled / totalFunded : 0;

  return {
    gaBaseCents: gaBase, msBaseCents: msBase, gaCents, msCents,
    subtotalCents: subtotal, totalCostCents: totalCost, totalFeeCents: totalFee,
    totalBilledCents: totalBilled, totalFundedCents: totalFunded, pctUsed,
    status: statusFor(pctUsed, totalFunded),
    byClin,
  };
}

// ── Input validation (zod) ──────────────────────────────────────────────────
import { z } from "zod";

export const clinEnum = z.enum(['Labor', 'Travel', 'ODC', 'M&E']);
export const feeTypeEnum = z.enum(['Fixed', 'Award', 'CR']);
export const primeSubEnum = z.enum(['Prime', 'Sub']);

export const createTaskOrderSchema = z.object({
  code: z.string().trim().min(1, "Code is required").max(20),
  name: z.string().trim().min(1, "Name is required").max(200),
});

export const createProjectSchema = z.object({
  code: z.string().trim().min(1, "Code is required").max(20),
  name: z.string().trim().min(1, "Name is required").max(200),
  taskOrderId: z.string().trim().min(1).optional().nullable(),
});

export const setProjectTaskOrderSchema = z.object({
  taskOrderId: z.string().trim().min(1).optional().nullable(),
});

export const createFundingModSchema = z.object({
  modNumber: z.string().trim().min(1, "Mod # is required").max(50),
  acrn: z.string().trim().max(20).optional().nullable(),
  slin: z.string().trim().max(20).optional().nullable(),
  clin: clinEnum,
  amountCents: z.number().int(),
  modDate: z.string().optional().nullable(),
  description: z.string().trim().max(500).optional().nullable(),
});

export const createCostEntrySchema = z.object({
  clin: clinEnum,
  primeOrSub: primeSubEnum,
  amountCents: z.number().int().nonnegative(),
  entryDate: z.string().min(1, "Date is required"),
  description: z.string().trim().max(500).optional().nullable(),
});

export const updateRatesSchema = z.object({
  fringe: z.number().min(0).max(3),
  overhead: z.number().min(0).max(3),
  ga: z.number().min(0).max(3),
  ms: z.number().min(0).max(3),
  fixedFeeRate: z.number().min(0).max(1),
  awardFeeRate: z.number().min(0).max(1),
  feeTypeByClin: z.object({
    Labor: feeTypeEnum, Travel: feeTypeEnum, ODC: feeTypeEnum, 'M&E': feeTypeEnum,
  }),
});
