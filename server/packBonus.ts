// Template-pack bonus: every paid pack includes 30 days of full access.
//
// Two ways a buyer gets it:
//   1. They already have an account under the checkout email: the Stripe
//      webhook calls grantPackBonus() and their trial clock moves out to
//      30 days from now (never shortened if they already had longer).
//   2. They don't have an account yet: signup checks the purchases table for
//      that email (DrizzleStorage.initialTrialEndsAt) and starts them on a
//      30-day trial instead of the normal 14.
//
// Paying subscribers (active / lifetime) already have everything, so they are
// left alone. Expiry works exactly like the normal trial: hasFullAccess()
// computes it on read, nothing flips in the DB.

import { storage } from "./storage";
import { computePackBonusEndsAt } from "@shared/access";
import type { User } from "@shared/schema";

export type PackBonusResult = "granted" | "on-signup" | "already-paid";

// sentEmailDays marker for the trial-ending email (see processDripEmails).
const TRIAL_ENDING_EMAIL_KEY = 14;

async function findUserByEmail(email: string, userId?: string): Promise<User | undefined> {
  // Signed in at checkout: that account gets the bonus even if they typed a
  // different email into Stripe.
  if (userId) {
    const byId = await storage.getUser(userId);
    if (byId) return byId;
  }
  const trimmed = (email || "").trim();
  if (!trimmed) return undefined;
  return storage.getUserByEmailInsensitive(trimmed);
}

/** Status of the bonus for this email right now, without changing anything. */
export async function packBonusStatus(email: string, userId?: string): Promise<PackBonusResult> {
  const user = await findUserByEmail(email, userId);
  if (!user) return "on-signup";
  if (user.subscriptionStatus === "active" || user.subscriptionStatus === "lifetime") return "already-paid";
  return "granted";
}

export async function grantPackBonus(email: string, userId?: string): Promise<PackBonusResult> {
  const user = await findUserByEmail(email, userId);
  if (!user) return "on-signup";
  if (user.subscriptionStatus === "active" || user.subscriptionStatus === "lifetime") return "already-paid";

  const bonusEnd = computePackBonusEndsAt();
  const currentEnd = user.subscriptionStatus === "trialing" && user.trialEndsAt
    ? new Date(user.trialEndsAt).getTime()
    : 0;
  const newEnd = currentEnd > new Date(bonusEnd).getTime() ? (user.trialEndsAt as string) : bonusEnd;
  await storage.setTrialEndsAt(user.id, newEnd);

  // Someone whose 14-day trial already ended has had the "trial ends today"
  // email. Clear that marker so the reminder goes out again at the new end.
  const sent = Array.isArray(user.sentEmailDays) ? (user.sentEmailDays as number[]) : [];
  if (sent.includes(TRIAL_ENDING_EMAIL_KEY)) {
    await storage.updateSentEmailDays(user.id, sent.filter(d => d !== TRIAL_ENDING_EMAIL_KEY));
  }
  console.log(`[pack-bonus] ${user.email}: full access until ${newEnd}`);
  return "granted";
}
