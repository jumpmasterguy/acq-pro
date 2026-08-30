// Access-tier helpers shared by client and server.
//
// subscriptionStatus lifecycle: 'free' -> 'trialing' (14 days from signup) ->
// 'active' | 'lifetime' (paid) OR back down to 'free' once the trial clock
// runs out without a payment. We never flip 'trialing' -> 'free' in the DB;
// expiry is computed on read (see hasFullAccess) so there's no cron job that
// can silently fail and leave someone with the wrong access level.

export const TRIAL_DAYS = 14;

export interface TrialFields {
  subscriptionStatus?: string | null;
  trialEndsAt?: string | null;
}

/** Full-catalog access: all 6 modules, AI assistant at the paid limit, etc. */
export function hasFullAccess(user: TrialFields | null | undefined): boolean {
  if (!user) return false;
  if (user.subscriptionStatus === "active" || user.subscriptionStatus === "lifetime") return true;
  if (user.subscriptionStatus === "trialing" && user.trialEndsAt) {
    return new Date(user.trialEndsAt).getTime() > Date.now();
  }
  return false;
}

/** True only while an unconverted trial is still running (used for trial-specific UI/emails). */
export function isTrialActive(user: TrialFields | null | undefined): boolean {
  if (!user || user.subscriptionStatus !== "trialing" || !user.trialEndsAt) return false;
  return new Date(user.trialEndsAt).getTime() > Date.now();
}

/** Whole days left in the trial, floored at 0. Null if not on an active trial. */
export function trialDaysRemaining(user: TrialFields | null | undefined): number | null {
  if (!isTrialActive(user)) return null;
  const ms = new Date(user!.trialEndsAt as string).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}

/** ISO timestamp for "now + TRIAL_DAYS" — set on every new signup. */
export function computeTrialEndsAt(from: Date = new Date()): string {
  return new Date(from.getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000).toISOString();
}
