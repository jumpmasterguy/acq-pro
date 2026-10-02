// Referral program (Terms §9): every 2 new accounts created through someone's
// link earns them a year of Pro.
//
// What "a year of Pro" means depends on what the referrer already has:
//   - Free or trial: access to every module for 365 days, stacked on top of
//     any trial/pack time they still have. Uses the same trial clock as the
//     14-day trial and the pack bonus, so it expires on read (hasFullAccess)
//     and nothing permanent is written.
//   - Monthly or Annual Pro (a real Stripe subscription): one year of their own
//     price as a Stripe customer credit, so the next year of invoices is free.
//     Their subscription id and status are never touched.
//   - Lifetime, or comped Pro with no Stripe subscription: nothing to add.
//     The referral still counts and they get a thank-you.
//
// The old code set everyone to status 'active' with a fake subscription id and
// no expiry. That made the reward permanent, demoted Lifetime users to the
// Monthly AI cap, and overwrote a Monthly subscriber's real Stripe id (so they
// kept being billed and account deletion couldn't cancel them).

import type Stripe from "stripe";
import type { User } from "@shared/schema";
import { storage } from "./storage";
import { sendOpsAlertEmail, sendReferralRewardEmail } from "./email";

export const REFERRAL_REWARD_DAYS = 365;
const DAY_MS = 24 * 60 * 60 * 1000;
// sentEmailDays marker for the trial-ending email (see processDripEmails and
// server/packBonus.ts): cleared so the reminder goes out at the new end date.
const TRIAL_ENDING_EMAIL_KEY = 14;
const FALLBACK_MONTHLY_CENTS = 599;

export type ProYearKind = "extended" | "stripe-credit" | "already-unlimited" | "needs-manual";
export interface ProYearResult {
  kind: ProYearKind;
  /** New access end date, for "extended". */
  until?: string;
  /** Credit applied in cents, for "stripe-credit". */
  creditCents?: number;
  /** What went wrong, for "needs-manual". */
  note?: string;
}

/** Referral codes are generated as A-Z/0-9 (storage.generateReferralCode). */
export function cleanReferralCode(raw: unknown): string {
  if (typeof raw !== "string") return "";
  return raw.replace(/[^A-Za-z0-9]/g, "").slice(0, 20).toUpperCase();
}

/**
 * What one year of this person's own subscription costs, in cents: 12 x a
 * monthly price, or 1 x a yearly one. Read from their subscription rather
 * than an env var, because Monthly has two live prices ($5.99 kept by
 * people who subscribed before the 1 Oct 2026 switch, $14.99 after).
 */
async function subscriptionYearCents(stripe: Stripe, subscriptionId: string): Promise<number> {
  try {
    const sub = await stripe.subscriptions.retrieve(subscriptionId);
    const price = sub.items.data[0]?.price;
    const amount = price?.unit_amount;
    if (!amount) return FALLBACK_MONTHLY_CENTS * 12;
    return price?.recurring?.interval === "year" ? amount : amount * 12;
  } catch {
    return FALLBACK_MONTHLY_CENTS * 12;
  }
}

/**
 * Give one user a year of Pro, in whatever form fits their plan (see top of
 * file). Used by referral rewards and by the admin "grant 1 year" button.
 */
export async function grantProYear(user: User, stripe: Stripe | null, reason: string): Promise<ProYearResult> {
  const status = user.subscriptionStatus;

  if (status === "lifetime") return { kind: "already-unlimited" };

  if (status === "active" || status === "annual") {
    const subId = user.subscriptionId ?? "";
    if (!subId.startsWith("sub_")) return { kind: "already-unlimited" }; // comped, no billing to cover
    if (!stripe || !user.stripeCustomerId) {
      return { kind: "needs-manual", note: "Subscriber but Stripe isn't configured or there's no customer id" };
    }
    try {
      const creditCents = await subscriptionYearCents(stripe, subId);
      await stripe.customers.createBalanceTransaction(user.stripeCustomerId, {
        amount: -creditCents, // negative = credit toward future invoices
        currency: "usd",
        description: `${reason}: 1 year of Acqlerate Pro`,
      });
      return { kind: "stripe-credit", creditCents };
    } catch (err: any) {
      return { kind: "needs-manual", note: `Stripe credit failed: ${err?.message ?? err}` };
    }
  }

  // Free, or trialing (normal trial or pack bonus). Stack on remaining time.
  const until = await extendAccessDays(user, REFERRAL_REWARD_DAYS);
  return { kind: "extended", until };
}

/**
 * Add `days` of full access to a free or trialing account, stacked on any
 * time they still have. Returns the new end date (ISO). Callers must not
 * use this on paying or lifetime accounts (they already have access).
 */
export async function extendAccessDays(user: User, days: number): Promise<string> {
  const now = Date.now();
  const currentEnd = user.subscriptionStatus === "trialing" && user.trialEndsAt ? new Date(user.trialEndsAt).getTime() : 0;
  const until = new Date(Math.max(now, currentEnd) + days * DAY_MS).toISOString();
  await storage.setTrialEndsAt(user.id, until);
  const sent = Array.isArray(user.sentEmailDays) ? (user.sentEmailDays as number[]) : [];
  if (sent.includes(TRIAL_ENDING_EMAIL_KEY)) {
    await storage.updateSentEmailDays(user.id, sent.filter((d) => d !== TRIAL_ENDING_EMAIL_KEY));
  }
  return until;
}

/**
 * Credit a brand-new account's referral code. Call once, right after the
 * account is created (email, Google or Apple). Never throws.
 */
export async function applySignupReferral(newUser: User, rawCode: unknown, stripe: Stripe | null): Promise<void> {
  const code = cleanReferralCode(rawCode);
  if (!code) return;
  try {
    const s = storage as any;
    const referrer: User | undefined = await s.getUserByReferralCode(code);
    if (!referrer || referrer.id === newUser.id) return;

    const fresh: User | undefined = await storage.getUser(newUser.id);
    if (!fresh || (fresh as any).referredBy) return; // already credited once
    await s.updateUserFields(newUser.id, { referredBy: (referrer as any).referralCode ?? code });

    const { rewarded, referrer: counted } = await s.recordReferral(code);
    console.log(`[referral] ${newUser.email} joined via ${code}${rewarded ? " (reward earned)" : ""}`);
    if (!rewarded || !counted) return;

    const result = await grantProYear(counted, stripe, "Referral reward");
    console.log(`[referral] reward for ${counted.email}: ${result.kind}${result.until ? ` until ${result.until}` : ""}`);

    const firstName = ((counted as any).firstName as string | null) ?? null;
    if (result.kind !== "needs-manual") {
      sendReferralRewardEmail(counted.email, firstName, result).catch(() => {});
    }
    if (result.kind === "stripe-credit" || result.kind === "needs-manual") {
      sendOpsAlertEmail(
        result.kind === "needs-manual" ? `⚠️ Referral reward needs a hand: ${counted.email}` : `🎁 Referral credit applied: ${counted.email}`,
        [
          `Referrer: ${counted.email} (plan: ${counted.subscriptionStatus})`,
          `New signup that triggered it: ${newUser.email}`,
          result.creditCents ? `Stripe credit: $${(result.creditCents / 100).toFixed(2)} (one year of their plan)` : "",
          result.note ? `Problem: ${result.note}` : "",
          counted.stripeCustomerId ? `Stripe customer: https://dashboard.stripe.com/customers/${counted.stripeCustomerId}` : "",
        ].filter(Boolean),
      ).catch(() => {});
    }
  } catch (err) {
    console.error(`[referral] failed to apply ${code} for ${newUser.email}:`, err);
  }
}
