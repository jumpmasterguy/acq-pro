// One place that counts the business. Every admin number (Today tiles,
// Numbers, the dashboard admin card, the founder review's /api/stats) comes
// from these functions, so two screens can't disagree about the same thing.
//
// Before 3 Oct 2026 there were four separate calculations and they drifted:
// Today counted comped Lifetime accounts as "Paying", /api/stats didn't
// exclude Lucas's own accounts, expired trials showed as trials in some
// places, and "Lifetime sales" summed every Stripe payment.
//
// Rules:
// - Lucas's own and admin accounts are left out (internalAccounts.ts), except
//   for /api/stats: the cost ledger nets them out itself, so it asks for
//   everyone with includeInternal (see the note on /api/stats in routes.ts).
// - Every person is in exactly one plan bucket; the buckets add up to total.
// - "Paying" means Stripe is billing them (a sub_ subscription id).

import type Stripe from "stripe";
import type { User } from "@shared/schema";
import { isTrialActive, isCompedTime } from "@shared/access";
import { excludeInternalAccounts } from "./internalAccounts";

const DAY_MS = 24 * 60 * 60 * 1000;

/** Postgres `now()::text` ("2026-09-28 10:11:12.3+00") or ISO → ms, or NaN. */
export function parseTs(v: unknown): number {
  if (typeof v !== "string" || !v) return NaN;
  let s = v.trim();
  if (/^\d{4}-\d{2}-\d{2} /.test(s)) s = s.replace(" ", "T");
  s = s.replace(/([+-]\d{2})$/, "$1:00");
  return new Date(s).getTime();
}

export type PlanBucket = "paying" | "comped" | "lifetime" | "trialing" | "trialEnded" | "free";

/** Which single bucket a person is in right now. */
export function planBucket(u: User): PlanBucket {
  switch (u.subscriptionStatus) {
    case "lifetime":
      return "lifetime";
    case "active":
    case "annual":
      // Admin grants and hand-made team seats set the same status with no
      // Stripe subscription; those are comps, not revenue.
      return (u.subscriptionId ?? "").startsWith("sub_") ? "paying" : "comped";
    case "trialing":
      // Time given beyond the 14-day trial (admin gift, referral, pack bonus)
      // is comped access, not a trial.
      if (!isTrialActive(u as any)) return "trialEnded";
      return isCompedTime(u as any) ? "comped" : "trialing";
    default:
      return "free";
  }
}

export interface UserCounts {
  total: number;
  plans: Record<PlanBucket, number>;
  signups: {
    today: number; yesterday: number; last7: number; last30: number;
    /** Last 14 UTC days, oldest first: [{ day: "2026-10-03", count }] */
    byDay: Array<{ day: string; count: number }>;
    /** { "2026-03": 4 } over all time. */
    byMonth: Record<string, number>;
  };
  active: { today: number; last24h: number; last7: number };
}

/**
 * Counts for the people Lucas cares about (internal accounts removed).
 * `todayStart` is the viewer's local midnight when known, else UTC midnight.
 */
export function countUsers(all: User[], opts: { now?: number; todayStart?: number; includeInternal?: boolean } = {}): UserCounts {
  const now = opts.now ?? Date.now();
  const utcMidnight = new Date(new Date(now).toISOString().slice(0, 10)).getTime();
  const todayStart = opts.todayStart ?? utcMidnight;
  const users = opts.includeInternal ? all : excludeInternalAccounts(all);

  const plans: Record<PlanBucket, number> = { paying: 0, comped: 0, lifetime: 0, trialing: 0, trialEnded: 0, free: 0 };
  const byMonth: Record<string, number> = {};
  const byDayMap: Record<string, number> = {};
  const signups = { today: 0, yesterday: 0, last7: 0, last30: 0 };
  const active = { today: 0, last24h: 0, last7: 0 };

  for (const u of users) {
    plans[planBucket(u)]++;

    const reg = parseTs(u.registeredAt);
    if (Number.isFinite(reg)) {
      if (reg >= todayStart) signups.today++;
      else if (reg >= todayStart - DAY_MS) signups.yesterday++;
      if (now - reg <= 7 * DAY_MS) signups.last7++;
      if (now - reg <= 30 * DAY_MS) signups.last30++;
      const iso = new Date(reg).toISOString();
      byMonth[iso.slice(0, 7)] = (byMonth[iso.slice(0, 7)] ?? 0) + 1;
      byDayMap[iso.slice(0, 10)] = (byDayMap[iso.slice(0, 10)] ?? 0) + 1;
    }

    const seen = parseTs(u.lastActiveAt ?? u.lastLoginAt);
    if (Number.isFinite(seen)) {
      if (seen >= todayStart) active.today++;
      if (now - seen < DAY_MS) active.last24h++;
      if (now - seen <= 7 * DAY_MS) active.last7++;
    }
  }

  const byDay = Array.from({ length: 14 }, (_, i) => {
    const day = new Date(utcMidnight - (13 - i) * DAY_MS).toISOString().slice(0, 10);
    return { day, count: byDayMap[day] ?? 0 };
  });

  return { total: users.length, plans, signups: { ...signups, byDay, byMonth }, active };
}

export interface Engagement {
  avgLessons: number;
  avgMinutes: number;
  avgSessionMinutes: number | null;
  sessionsTracked: number;
  topLessons: Array<{ id: string; count: number; pct: number }>;
  audio: Array<{ moduleId: string; plays: number; listeners: number }>;
}

/** How much people actually use it (internal accounts removed). */
export function engagement(all: User[]): Engagement {
  const users = excludeInternalAccounts(all);
  const n = users.length;
  let lessons = 0, minutes = 0, sessionMinutes = 0, sessions = 0;
  const lessonCounts: Record<string, number> = {};
  const audio: Record<string, { plays: number; listeners: number }> = {};

  for (const u of users) {
    const done = u.completedLessons ?? [];
    lessons += done.length;
    for (const id of done) lessonCounts[id] = (lessonCounts[id] ?? 0) + 1;
    minutes += u.totalMinutesActive ?? 0;
    for (const s of ((u as any).loginHistory ?? []) as Array<{ durationMinutes?: number }>) {
      if (typeof s.durationMinutes === "number") { sessions++; sessionMinutes += s.durationMinutes; }
    }
    for (const [moduleId, e] of Object.entries(((u as any).audioListens ?? {}) as Record<string, { playCount?: number }>)) {
      audio[moduleId] ??= { plays: 0, listeners: 0 };
      audio[moduleId].plays += e?.playCount ?? 0;
      audio[moduleId].listeners += 1;
    }
  }

  return {
    avgLessons: n ? Math.round((lessons / n) * 10) / 10 : 0,
    avgMinutes: n ? Math.round(minutes / n) : 0,
    avgSessionMinutes: sessions ? Math.round(sessionMinutes / sessions) : null,
    sessionsTracked: sessions,
    topLessons: Object.entries(lessonCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([id, count]) => ({ id, count, pct: n ? Math.round((count / n) * 100) : 0 })),
    audio: Object.entries(audio)
      .map(([moduleId, v]) => ({ moduleId, ...v }))
      .sort((a, b) => b.plays - a.plays),
  };
}

export interface StripeSnapshot {
  /** USD collected since monthStart, net of refunds. */
  monthToDate: number;
  /** USD collected in the last 365 days, net of refunds (capped at 2,000 charges). */
  last12Months: number;
  /** Monthly recurring: monthly prices plus a twelfth of yearly ones. */
  mrr: number;
  activeSubscriptions: number;
  newSubs7d: number;
  cancelling: Array<{ email: string; endsAt: string | null }>;
  pastDue: Array<{ email: string }>;
}

async function customerEmail(c: string | Stripe.Customer | Stripe.DeletedCustomer | null): Promise<string> {
  if (c && typeof c === "object" && !("deleted" in c && c.deleted)) return (c as Stripe.Customer).email ?? "";
  return "";
}

/** Live money numbers from Stripe. Throws if Stripe is unreachable. */
export async function stripeSnapshot(stripe: Stripe, opts: { monthStart: number; now?: number }): Promise<StripeSnapshot> {
  const now = opts.now ?? Date.now();
  const yearAgoSec = Math.floor((now - 365 * DAY_MS) / 1000);
  const monthSec = Math.floor(opts.monthStart / 1000);
  const weekSec = Math.floor((now - 7 * DAY_MS) / 1000);

  let monthCents = 0, yearCents = 0, n = 0;
  for await (const c of stripe.charges.list({ created: { gte: yearAgoSec }, limit: 100 })) {
    if (c.paid && c.status === "succeeded" && c.currency === "usd") {
      const net = c.amount - (c.amount_refunded ?? 0);
      yearCents += net;
      if (c.created >= monthSec) monthCents += net;
    }
    if (++n >= 2000) break;
  }

  let mrrCents = 0, activeSubs = 0, newSubs = 0;
  const cancelling: StripeSnapshot["cancelling"] = [];
  n = 0;
  for await (const s of stripe.subscriptions.list({ status: "active", limit: 100, expand: ["data.customer"] })) {
    activeSubs++;
    for (const i of s.items.data) {
      const amt = (i.price.unit_amount ?? 0) * (i.quantity ?? 1);
      mrrCents += i.price.recurring?.interval === "year" ? amt / 12 : amt;
    }
    if (s.created >= weekSec) newSubs++;
    if (s.cancel_at_period_end || s.cancel_at) {
      const endSec = s.cancel_at ?? (s.items.data[0] as any)?.current_period_end ?? null;
      cancelling.push({ email: await customerEmail(s.customer as any), endsAt: endSec ? new Date(endSec * 1000).toISOString() : null });
    }
    if (++n >= 500) break;
  }

  const pastDue: StripeSnapshot["pastDue"] = [];
  for await (const s of stripe.subscriptions.list({ status: "past_due", limit: 100, expand: ["data.customer"] })) {
    pastDue.push({ email: await customerEmail(s.customer as any) });
  }

  return {
    monthToDate: Math.round(monthCents) / 100,
    last12Months: Math.round(yearCents) / 100,
    mrr: Math.round(mrrCents) / 100,
    activeSubscriptions: activeSubs,
    newSubs7d: newSubs,
    cancelling,
    pastDue,
  };
}
