/**
 * Cost & Burn Rate Tracker — calculation engine.
 *
 * Ports the methodology from the Acqlerate cost-and-burn-rate-tracker.xlsx
 * (Fringe -> Overhead -> G&A/M&S -> Fee) into pure TypeScript so it can run
 * live in the browser. No server round-trip needed — same reasoning as the
 * PDU Tracker: this is a teaching tool for a subscriber who already has
 * access to the underlying content, not a file being resold.
 *
 * Reference: client/public/examples/cost-and-burn-rate-tracker.xlsx
 * (Rates tab + Dashboard tab formulas).
 */

export type FeeType = 'Fixed' | 'Award' | 'CR';
export const CLINS = ['Labor', 'Travel', 'ODC', 'M&E'] as const;
export type Clin = typeof CLINS[number];

export interface RatesInput {
  fringe: number;       // decimal, e.g. 0.35
  overhead: number;
  ga: number;
  ms: number;
  fixedFeeRate: number;
  awardFeeRate: number;
  feeTypeByClin: Record<Clin, FeeType>;
}

export interface ClinCosts {
  /** Labor: UNBURDENED direct $ before Fringe/OH. Travel/ODC/M&E: raw cost $. */
  primeRaw: number;
  /** Sub-incurred $. Labor Sub passes through with zero markup, always. */
  subRaw: number;
}

export type CostsByClin = Record<Clin, ClinCosts>;
export type FundedByClin = Record<Clin, number>;

export interface CostInput {
  rates: RatesInput;
  costs: CostsByClin;
  funded: FundedByClin;
}

export interface ClinResult {
  clin: Clin;
  primeRaw: number;
  subRaw: number;
  /** Labor only: primeRaw burdened up through Fringe+OH. Equals primeRaw for other CLINs. */
  primeBurdened: number;
  totalCost: number;      // this CLIN's own cost + its share of G&A/M&S
  feeRate: number;
  feeType: FeeType;
  fee: number;
  totalBilled: number;
  funded: number;
  pctUsed: number;        // totalBilled / funded
  status: 'green' | 'yellow' | 'red' | 'unfunded';
}

export interface CostResult {
  gaBase: number;
  msBase: number;
  gaDollars: number;
  msDollars: number;
  subtotal: number;
  totalCost: number;
  totalFee: number;
  totalBilled: number;
  totalFunded: number;
  pctUsed: number;
  byClin: ClinResult[];
}

function feeRateFor(rates: RatesInput, clin: Clin): { rate: number; type: FeeType } {
  const type = rates.feeTypeByClin[clin];
  if (type === 'Fixed') return { rate: rates.fixedFeeRate, type };
  if (type === 'Award') return { rate: rates.awardFeeRate, type };
  return { rate: 0, type: 'CR' };
}

/** Same FAR 52.232-20/22-style thresholds used in the Excel tracker's Burn Rate Forecast. */
export function statusFor(pctUsed: number, funded: number): ClinResult['status'] {
  if (funded <= 0) return 'unfunded';
  if (pctUsed >= 0.7) return 'red';
  if (pctUsed >= 0.5) return 'yellow';
  return 'green';
}

export function calculate(input: CostInput): CostResult {
  const { rates, costs, funded } = input;

  const laborPrimeBurdened = costs.Labor.primeRaw * (1 + rates.fringe) * (1 + rates.overhead);
  const laborSub = costs.Labor.subRaw;

  const gaBase = laborPrimeBurdened + costs.Travel.primeRaw + costs.ODC.primeRaw + costs['M&E'].primeRaw;
  const msBase = costs.Travel.subRaw + costs.ODC.subRaw + costs['M&E'].subRaw;
  const gaDollars = gaBase * rates.ga;
  const msDollars = msBase * rates.ms;

  const clinTotals: Record<Clin, { primeBurdened: number; subRaw: number }> = {
    Labor: { primeBurdened: laborPrimeBurdened, subRaw: laborSub },
    Travel: { primeBurdened: costs.Travel.primeRaw, subRaw: costs.Travel.subRaw },
    ODC: { primeBurdened: costs.ODC.primeRaw, subRaw: costs.ODC.subRaw },
    'M&E': { primeBurdened: costs['M&E'].primeRaw, subRaw: costs['M&E'].subRaw },
  };

  const subtotal = CLINS.reduce((s, c) => s + clinTotals[c].primeBurdened + clinTotals[c].subRaw, 0);
  const totalCost = subtotal + gaDollars + msDollars;

  const byClin: ClinResult[] = CLINS.map((clin) => {
    const { primeBurdened, subRaw } = clinTotals[clin];
    const gaShare = gaBase > 0 ? (primeBurdened / gaBase) * gaDollars : 0;
    // Labor's Sub $ never draws M&S — only Travel/ODC/M&E Sub $ does.
    const msShare = clin !== 'Labor' && msBase > 0 ? (subRaw / msBase) * msDollars : 0;
    const clinTotalCost = primeBurdened + gaShare + subRaw + msShare;
    const { rate, type } = feeRateFor(rates, clin);
    const fee = clinTotalCost * rate;
    const totalBilled = clinTotalCost + fee;
    const clinFunded = funded[clin] ?? 0;
    const pctUsed = clinFunded > 0 ? totalBilled / clinFunded : 0;
    return {
      clin,
      primeRaw: costs[clin].primeRaw,
      subRaw,
      primeBurdened,
      totalCost: clinTotalCost,
      feeRate: rate,
      feeType: type,
      fee,
      totalBilled,
      funded: clinFunded,
      pctUsed,
      status: statusFor(pctUsed, clinFunded),
    };
  });

  const totalFee = byClin.reduce((s, c) => s + c.fee, 0);
  const totalBilled = totalCost + totalFee;
  const totalFunded = CLINS.reduce((s, c) => s + (funded[c] ?? 0), 0);
  const pctUsed = totalFunded > 0 ? totalBilled / totalFunded : 0;

  return { gaBase, msBase, gaDollars, msDollars, subtotal, totalCost, totalFee, totalBilled, totalFunded, pctUsed, byClin };
}

export const DEFAULT_RATES: RatesInput = {
  fringe: 0.35,
  overhead: 0.55,
  ga: 0.12,
  ms: 0.05,
  fixedFeeRate: 0.07,
  awardFeeRate: 0.10,
  feeTypeByClin: { Labor: 'Award', Travel: 'CR', ODC: 'Fixed', 'M&E': 'Award' },
};

export const EMPTY_COSTS: CostsByClin = {
  Labor: { primeRaw: 0, subRaw: 0 },
  Travel: { primeRaw: 0, subRaw: 0 },
  ODC: { primeRaw: 0, subRaw: 0 },
  'M&E': { primeRaw: 0, subRaw: 0 },
};

export const EMPTY_FUNDED: FundedByClin = { Labor: 0, Travel: 0, ODC: 0, 'M&E': 0 };
