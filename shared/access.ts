// Access-tier helpers shared by client and server.
//
// subscriptionStatus lifecycle: 'free' -> 'trialing' (14 days from signup) ->
// 'active' (Monthly) | 'annual' | 'lifetime' (paid) OR back down to 'free' once the trial clock
// runs out without a payment. We never flip 'trialing' -> 'free' in the DB;
// expiry is computed on read (see hasFullAccess) so there's no cron job that
// can silently fail and leave someone with the wrong access level.

export const TRIAL_DAYS = 14;

/** Statuses that mean the person has actually paid (or been comped). */
export const PAID_STATUSES = ["active", "annual", "lifetime"] as const;

export function isPaidStatus(status: string | null | undefined): boolean {
  return !!status && (PAID_STATUSES as readonly string[]).includes(status);
}

/**
 * Annual and Lifetime are the "top" plans: Lesson Book PDF downloads,
 * unlimited AI and the Acqlerate Coach (Teach It Back, Explain My Mistake,
 * "How Do I Apply This?"). Monthly
 * (at any price) streams everything but does not include downloads.
 */
export function isTopPlanStatus(status: string | null | undefined): boolean {
  return status === "annual" || status === "lifetime";
}

export interface TrialFields {
  subscriptionStatus?: string | null;
  trialEndsAt?: string | null;
  /** Signup time. Needed to tell a plain trial from comped time (isCompedTime). */
  registeredAt?: string | null;
}

/** ISO or Postgres text ("2026-09-28 10:11:12.3+00") → ms, or NaN. */
function toMs(v: string | null | undefined): number {
  if (!v) return NaN;
  let s = v.trim();
  if (/^\d{4}-\d{2}-\d{2} /.test(s)) s = s.replace(" ", "T");
  s = s.replace(/([+-]\d{2})$/, "$1:00");
  return new Date(s).getTime();
}

/** Full-catalog access: all 6 modules, AI assistant at the paid limit, etc. */
export function hasFullAccess(user: TrialFields | null | undefined): boolean {
  if (!user) return false;
  if (isPaidStatus(user.subscriptionStatus)) return true;
  if (user.subscriptionStatus === "trialing" && user.trialEndsAt) {
    return new Date(user.trialEndsAt).getTime() > Date.now();
  }
  return false;
}

/**
 * True only for an active/lifetime subscriber — false during an unconverted
 * trial, even though hasFullAccess() is true then. Use this (not
 * hasFullAccess) to gate anything permanent/keepable — a download the user
 * still has after the trial ends — as opposed to in-app access, which is
 * fine to extend through the trial.
 */
export function hasPaidPlan(user: TrialFields | null | undefined): boolean {
  if (!user) return false;
  return isPaidStatus(user.subscriptionStatus);
}

/**
 * Lesson Book PDF downloads (every module except Module 1, which is free to
 * any signed-in user). Annual and Lifetime only: not Monthly, not a trial.
 */
export function canDownloadLessonBooks(user: TrialFields | null | undefined): boolean {
  return !!user && isTopPlanStatus(user.subscriptionStatus);
}

/** True only while an unconverted trial is still running (used for trial-specific UI/emails). */
export function isTrialActive(user: TrialFields | null | undefined): boolean {
  if (!user || user.subscriptionStatus !== "trialing" || !user.trialEndsAt) return false;
  return new Date(user.trialEndsAt).getTime() > Date.now();
}

/**
 * The status to SHOW a person. The DB keeps 'trialing' after the trial runs
 * out (expiry is computed on read, see the top of this file), so anything
 * that labels or counts users must go through this, not subscriptionStatus.
 * Returns 'comped' for running access beyond the standard trial (isCompedTime),
 * and 'trial_ended' for an expired, unconverted trial. Screens show that
 * as "Free" (it is Free); the separate value lets admin list who tried first.
 * The DB is not flipped to 'free' at expiry on purpose: the day-14 "trial ends
 * today" email (server/email.ts) only goes to accounts still 'trialing'.
 */
export function displayStatus(user: TrialFields | null | undefined): string {
  const s = user?.subscriptionStatus || "free";
  if (s === "trialing" && !isTrialActive(user)) return "trial_ended";
  if (s === "trialing" && isCompedTime(user)) return "comped";
  return s;
}

/**
 * True when someone's running access goes past their standard 14-day trial:
 * time Lucas gave them in admin, a referral reward, a template-pack bonus, or
 * time left after cancelling. All of those reuse the trial clock (status
 * 'trialing' + trialEndsAt), so this is how screens tell "comped" from "trial".
 * Works for past grants too; no extra column needed.
 */
export function isCompedTime(user: TrialFields | null | undefined): boolean {
  if (!isTrialActive(user)) return false;
  const reg = toMs(user!.registeredAt);
  if (!Number.isFinite(reg)) return false;
  const standardEnd = reg + TRIAL_DAYS * 24 * 60 * 60 * 1000;
  return toMs(user!.trialEndsAt) > standardEnd + 60 * 60 * 1000;
}

/** Whole days left in the trial, floored at 0. Null if not on an active trial. */
export function trialDaysRemaining(user: TrialFields | null | undefined): number | null {
  if (!isTrialActive(user)) return null;
  const ms = new Date(user!.trialEndsAt as string).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}

/**
 * Buying a paid template pack includes 30 days of full access (the product
 * pages promise it). Granted by the Stripe webhook when the buyer already has
 * an account, or at signup when a matching purchase exists for their email.
 */
export const PACK_BONUS_DAYS = 30;
/** How long after buying a pack a new signup still gets the bonus. */
export const PACK_BONUS_CLAIM_WINDOW_DAYS = 90;
/** Paid packs that carry the bonus (the free finance pack does not). */
export const PACK_BONUS_PACKS = ["pm-essentials", "proposal-toolkit", "cpars-playbook"];

export function computePackBonusEndsAt(from: Date = new Date()): string {
  return new Date(from.getTime() + PACK_BONUS_DAYS * 24 * 60 * 60 * 1000).toISOString();
}

/** ISO timestamp for "now + TRIAL_DAYS" — set on every new signup. */
export function computeTrialEndsAt(from: Date = new Date()): string {
  return new Date(from.getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000).toISOString();
}
