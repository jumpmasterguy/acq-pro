// Phone-first admin: the "Today" screen and user lookup + quick actions.
//
// Built for one person checking the business from the app between other
// things, so every endpoint answers one question in one round trip:
//   GET  /api/admin/today                     what happened, what needs me
//   GET  /api/admin/find-users?q=             find a person by name or email
//   GET  /api/admin/users/:id/summary         everything about that person
//   POST /api/admin/users/:id/give-access     +7 / +30 / +365 days of Pro
//   POST /api/admin/users/:id/send-reset      email them a password link
//   POST /api/admin/users/:id/set-streak      put a lost streak back
//
// Stripe numbers are best-effort: if Stripe is slow or down, the screen
// still loads with the numbers from our own database.

import type { Express, Request, Response } from "express";
import type Stripe from "stripe";
import type { User } from "@shared/schema";
import { hasFullAccess, isPaidStatus } from "@shared/access";
import { computeUserXp } from "@shared/xp";
import { storage, getDisplayStreak } from "./storage";
import { requireAuth } from "./auth";
import { isInternalAccount, excludeInternalAccounts } from "./internalAccounts";
import { extendAccessDays, grantProYear } from "./referrals";
import { issuePasswordReset } from "./passwordReset";

const DAY_MS = 24 * 60 * 60 * 1000;
const GIVE_DAYS = [7, 30, 365] as const;

/** Postgres `now()::text` ("2026-09-28 10:11:12.3+00") or ISO → ms, or NaN. */
export function parseTs(v: unknown): number {
  if (typeof v !== "string" || !v) return NaN;
  let s = v.trim();
  if (/^\d{4}-\d{2}-\d{2} /.test(s)) s = s.replace(" ", "T");
  s = s.replace(/([+-]\d{2})$/, "$1:00");
  return new Date(s).getTime();
}

/** A client-sent boundary (their local midnight / 1st of month), sanity-checked. */
function boundary(raw: unknown, fallback: number, maxAgeDays: number): number {
  const t = parseTs(raw);
  if (!Number.isFinite(t)) return fallback;
  const now = Date.now();
  if (t > now || now - t > maxAgeDays * DAY_MS) return fallback;
  return t;
}

function displayName(u: User): string {
  const full = [u.firstName, u.lastName].filter(Boolean).join(" ").trim();
  return full || u.username || u.email;
}

function planLabel(u: User): string {
  switch (u.subscriptionStatus) {
    case "active": return "Monthly";
    case "annual": return "Annual";
    case "lifetime": return "Lifetime";
    case "trialing": return hasFullAccess(u) ? "Trial" : "Free (trial ended)";
    default: return "Free";
  }
}

export function userSummary(u: User) {
  const signIn: string[] = [];
  if (u.passwordHash) signIn.push("Email");
  if (u.googleId) signIn.push("Google");
  if (u.appleId) signIn.push("Apple");
  const completions = (u.moduleCompletions as Record<string, unknown> | null) ?? {};
  return {
    id: u.id,
    name: displayName(u),
    firstName: u.firstName ?? null,
    email: u.email,
    status: u.subscriptionStatus,
    plan: planLabel(u),
    hasAccess: hasFullAccess(u),
    accessUntil: u.subscriptionStatus === "trialing" ? u.trialEndsAt ?? null : null,
    signIn,
    registeredAt: u.registeredAt ?? null,
    lastActiveAt: u.lastActiveAt ?? u.lastLoginAt ?? null,
    loginCount: u.loginCount ?? 0,
    minutesActive: u.totalMinutesActive ?? 0,
    lessonsDone: (u.completedLessons ?? []).length,
    modulesDone: Object.keys(completions).length,
    xp: computeUserXp(u as any),
    streak: getDisplayStreak(u.currentStreak, u.lastStreakDate),
    longestStreak: u.longestStreak ?? 0,
    lastStreakDate: u.lastStreakDate ?? null,
    referralCount: u.referralCount ?? 0,
    referredBy: u.referredBy ?? null,
    isAdmin: Boolean(u.isAdmin),
    isInternal: isInternalAccount(u),
    stripeUrl: u.stripeCustomerId ? `https://dashboard.stripe.com/customers/${u.stripeCustomerId}` : null,
    subscriptionIsStripe: (u.subscriptionId ?? "").startsWith("sub_"),
  };
}

type Attention = {
  kind: "past_due" | "cancelling" | "trial_ending" | "lead";
  title: string;
  detail: string;
  email: string;
  userId?: string;
  at?: string;
};

async function stripeCustomerEmail(c: string | Stripe.Customer | Stripe.DeletedCustomer | null): Promise<string> {
  if (c && typeof c === "object" && !("deleted" in c && c.deleted)) return (c as Stripe.Customer).email ?? "";
  return "";
}

export function registerAdminMobileRoutes(
  app: Express,
  deps: { stripe: Stripe | null; isAdmin: (req: Request) => boolean },
) {
  const { stripe, isAdmin } = deps;
  const guard = (req: Request, res: Response) => {
    if (isAdmin(req)) return true;
    res.status(403).json({ message: "Forbidden" });
    return false;
  };

  // ── Today ────────────────────────────────────────────────────────────
  app.get("/api/admin/today", requireAuth as any, async (req: Request, res: Response) => {
    if (!guard(req, res)) return;
    const now = Date.now();
    const utcMidnight = new Date(new Date().toISOString().slice(0, 10)).getTime();
    const todayStart = boundary(req.query.todayStart, utcMidnight, 2);
    const d = new Date();
    const monthStart = boundary(req.query.monthStart, Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1), 32);
    const yesterdayStart = todayStart - DAY_MS;
    const weekAgo = now - 7 * DAY_MS;

    const all = await storage.getAllUsers();
    const users = excludeInternalAccounts(all);
    const reg = (u: User) => parseTs(u.registeredAt);
    const act = (u: User) => parseTs(u.lastActiveAt ?? u.lastLoginAt);

    const signups = {
      today: users.filter(u => reg(u) >= todayStart).length,
      yesterday: users.filter(u => reg(u) >= yesterdayStart && reg(u) < todayStart).length,
      last7: users.filter(u => reg(u) >= weekAgo).length,
      total: users.length,
    };
    const active = {
      today: users.filter(u => act(u) >= todayStart).length,
      last7: users.filter(u => act(u) >= weekAgo).length,
    };
    const plans = {
      paid: users.filter(u => isPaidStatus(u.subscriptionStatus)).length,
      trialing: users.filter(u => u.subscriptionStatus === "trialing" && hasFullAccess(u)).length,
    };

    const attention: Attention[] = [];

    // Trials ending in the next 3 days: the best moment for a personal nudge.
    for (const u of users) {
      if (u.subscriptionStatus !== "trialing") continue;
      const end = parseTs(u.trialEndsAt);
      if (!(end > now && end - now <= 3 * DAY_MS)) continue;
      const days = Math.max(1, Math.ceil((end - now) / DAY_MS));
      attention.push({
        kind: "trial_ending",
        title: `${displayName(u)}: trial ends in ${days} day${days === 1 ? "" : "s"}`,
        detail: `${(u.completedLessons ?? []).length} lessons done`,
        email: u.email,
        userId: u.id,
        at: u.trialEndsAt ?? undefined,
      });
    }

    // New email leads this week that haven't made an account yet.
    try {
      const emails = new Set(all.map(u => u.email.toLowerCase()));
      const leads = await storage.getAllLeads();
      for (const l of leads) {
        const t = parseTs(l.createdAt);
        if (!(t >= weekAgo) || emails.has(l.email.toLowerCase())) continue;
        attention.push({ kind: "lead", title: `New lead: ${l.email}`, detail: `From ${l.source ?? "site"}, no account yet`, email: l.email, at: new Date(t).toISOString() });
      }
    } catch (err: any) {
      console.error("[admin/today] leads:", err?.message ?? err);
    }

    // Stripe: money this month, MRR, failed payments, pending cancellations.
    let revenue: { monthToDate: number; mrr: number; newSubs7d: number } | null = null;
    let stripeNote: string | null = stripe ? null : "Stripe isn't connected on this server.";
    if (stripe) {
      try {
        const byEmail = new Map(all.map(u => [u.email.toLowerCase(), u]));
        const monthSec = Math.floor(monthStart / 1000);
        const weekSec = Math.floor(weekAgo / 1000);
        let cents = 0;
        let n = 0;
        for await (const c of stripe.charges.list({ created: { gte: monthSec }, limit: 100 })) {
          if (c.paid && c.status === "succeeded" && c.currency === "usd") cents += c.amount - (c.amount_refunded ?? 0);
          if (++n >= 1000) break;
        }

        let mrrCents = 0;
        let newSubs = 0;
        n = 0;
        for await (const s of stripe.subscriptions.list({ status: "active", limit: 100, expand: ["data.customer"] })) {
          for (const i of s.items.data) {
            const amt = (i.price.unit_amount ?? 0) * (i.quantity ?? 1);
            mrrCents += i.price.recurring?.interval === "year" ? amt / 12 : amt;
          }
          if (s.created >= weekSec) newSubs++;
          if (s.cancel_at_period_end || s.cancel_at) {
            const email = await stripeCustomerEmail(s.customer as any);
            const u = byEmail.get(email.toLowerCase());
            const endSec = s.cancel_at ?? (s.items.data[0] as any)?.current_period_end ?? null;
            attention.push({
              kind: "cancelling",
              title: `${u ? displayName(u) : email || "A subscriber"} cancelled`,
              detail: endSec ? `Access ends ${new Date(endSec * 1000).toISOString().slice(0, 10)}. Worth a "what could we do better?" email.` : "Still active until the period ends.",
              email,
              userId: u?.id,
            });
          }
          if (++n >= 500) break;
        }

        for await (const s of stripe.subscriptions.list({ status: "past_due", limit: 100, expand: ["data.customer"] })) {
          const email = await stripeCustomerEmail(s.customer as any);
          const u = byEmail.get(email.toLowerCase());
          attention.push({
            kind: "past_due",
            title: `Payment failed: ${u ? displayName(u) : email || "a subscriber"}`,
            detail: "Stripe is retrying the card. A friendly heads-up email often fixes it.",
            email,
            userId: u?.id,
          });
        }

        revenue = { monthToDate: Math.round(cents) / 100, mrr: Math.round(mrrCents) / 100, newSubs7d: newSubs };
      } catch (err: any) {
        console.error("[admin/today] stripe:", err?.message ?? err);
        stripeNote = "Couldn't reach Stripe just now. Pull down to try again.";
      }
    }

    const order: Record<Attention["kind"], number> = { past_due: 0, cancelling: 1, trial_ending: 2, lead: 3 };
    attention.sort((a, b) => order[a.kind] - order[b.kind]);

    const recentSignups = [...users]
      .sort((a, b) => (reg(b) || 0) - (reg(a) || 0))
      .slice(0, 5)
      .map(u => ({ id: u.id, name: displayName(u), email: u.email, plan: planLabel(u), registeredAt: u.registeredAt }));

    return res.json({
      generatedAt: new Date().toISOString(),
      signups, active, plans, revenue, stripeNote,
      attention: attention.slice(0, 25),
      recentSignups,
    });
  });

  // ── Find users ───────────────────────────────────────────────────────
  app.get("/api/admin/find-users", requireAuth as any, async (req: Request, res: Response) => {
    if (!guard(req, res)) return;
    const q = String(req.query.q ?? "").trim().toLowerCase().slice(0, 100);
    const all = await storage.getAllUsers();
    const act = (u: User) => parseTs(u.lastActiveAt ?? u.lastLoginAt) || parseTs(u.registeredAt) || 0;
    const words = q.split(/\s+/).filter(Boolean);
    const hits = words.length === 0
      ? [...all].sort((a, b) => act(b) - act(a))
      : all
          .filter(u => {
            const hay = `${u.email} ${u.username} ${u.firstName ?? ""} ${u.lastName ?? ""}`.toLowerCase();
            return words.every(w => hay.includes(w));
          })
          .sort((a, b) => act(b) - act(a));
    return res.json({
      total: hits.length,
      users: hits.slice(0, 25).map(u => ({
        id: u.id,
        name: displayName(u),
        email: u.email,
        plan: planLabel(u),
        hasAccess: hasFullAccess(u),
        lastActiveAt: u.lastActiveAt ?? u.lastLoginAt ?? null,
        isInternal: isInternalAccount(u),
      })),
    });
  });

  // ── One user ─────────────────────────────────────────────────────────
  app.get("/api/admin/users/:id/summary", requireAuth as any, async (req: Request, res: Response) => {
    if (!guard(req, res)) return;
    const u = await storage.getUser(String(req.params.id));
    if (!u) return res.status(404).json({ message: "User not found" });
    return res.json(userSummary(u));
  });

  const reply = async (res: Response, id: string, message: string, status = 200) => {
    const fresh = await storage.getUser(id);
    return res.status(status).json({ message, user: fresh ? userSummary(fresh) : null });
  };

  app.post("/api/admin/users/:id/give-access", requireAuth as any, async (req: Request, res: Response) => {
    if (!guard(req, res)) return;
    const id = String(req.params.id);
    const days = Number(req.body?.days);
    if (!(GIVE_DAYS as readonly number[]).includes(days)) {
      return res.status(400).json({ message: "days must be 7, 30 or 365" });
    }
    const u = await storage.getUser(id);
    if (!u) return res.status(404).json({ message: "User not found" });
    const who = displayName(u);

    if (u.subscriptionStatus === "lifetime") return reply(res, id, `${who} has Lifetime already. Nothing to add.`, 409);
    if (isPaidStatus(u.subscriptionStatus)) {
      if (days !== 365) {
        return reply(res, id, `${who} is paying (${planLabel(u)}), so they already have access. "1 year" credits a year to their billing instead.`, 409);
      }
      const r = await grantProYear(u, stripe, "Granted by Acqlerate");
      const msg =
        r.kind === "stripe-credit" ? `${who}: $${((r.creditCents ?? 0) / 100).toFixed(2)} credit added to their Stripe billing (a year free).`
        : r.kind === "already-unlimited" ? `${who} already has permanent access. Nothing changed.`
        : `${who}: not applied (${r.note}). Do it in Stripe.`;
      console.log(`[admin] ${req.user!.email} give-access 365 → ${u.email}: ${r.kind}`);
      return reply(res, id, msg, r.kind === "needs-manual" ? 500 : 200);
    }

    const until = await extendAccessDays(u, days);
    console.log(`[admin] ${req.user!.email} give-access ${days}d → ${u.email} until ${until}`);
    return reply(res, id, `${who} has full access until ${until.slice(0, 10)}.`);
  });

  app.post("/api/admin/users/:id/send-reset", requireAuth as any, async (req: Request, res: Response) => {
    if (!guard(req, res)) return;
    const id = String(req.params.id);
    const u = await storage.getUser(id);
    if (!u) return res.status(404).json({ message: "User not found" });
    try {
      await issuePasswordReset(u);
    } catch (err: any) {
      console.error("[admin] send-reset:", err?.message ?? err);
      return reply(res, id, "Couldn't send the email. Try again in a minute.", 500);
    }
    console.log(`[admin] ${req.user!.email} sent password reset → ${u.email}`);
    return reply(res, id, `Reset link emailed to ${u.email}. It works for 1 hour.`);
  });

  app.post("/api/admin/users/:id/set-streak", requireAuth as any, async (req: Request, res: Response) => {
    if (!guard(req, res)) return;
    const id = String(req.params.id);
    const streak = Math.floor(Number(req.body?.streak));
    if (!Number.isFinite(streak) || streak < 1 || streak > 3650) {
      return res.status(400).json({ message: "Streak must be between 1 and 3650 days" });
    }
    const u = await storage.getUser(id);
    if (!u) return res.status(404).json({ message: "User not found" });
    // Dated today if they've already been active today (so it keeps
    // counting), otherwise yesterday: one lesson today carries it forward.
    const today = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - DAY_MS).toISOString().slice(0, 10);
    const lastStreakDate = u.lastStreakDate === today ? today : yesterday;
    await storage.updateUserFields(id, {
      currentStreak: streak,
      longestStreak: Math.max(u.longestStreak ?? 0, streak),
      lastStreakDate,
    });
    console.log(`[admin] ${req.user!.email} set streak ${streak} → ${u.email}`);
    const note = lastStreakDate === today ? "" : " They keep it by doing one lesson today.";
    return reply(res, id, `${displayName(u)}'s streak is now ${streak} days.${note}`);
  });
}
