// ── Stripe health: "never be the last to know" ───────────────────────────────
//
// Two jobs, both aimed at a solo founder who cannot sit and watch logs:
//
//  1. runStripeBootCheck()      — at startup, look up every STRIPE_PRICE_* env
//     var in Stripe and confirm it (a) exists, (b) is active, (c) charges the
//     amount the site advertises, and (d) is one-time vs recurring as expected.
//     Anything wrong is logged in a loud banner AND emailed via Resend.
//
//  2. reportCheckoutFailure()   — called from every checkout route's catch
//     block. Logs the error and emails it, rate-limited so a burst of failures
//     produces one email per route per 15 minutes, not a flood.
//
// Neither job can take the app down: every path is wrapped, and a failure to
// reach Stripe or Resend is itself just logged.

import Stripe from "stripe";
import { sendOpsAlertEmail } from "./email";

type Expected = {
  env: string;            // env var name holding the price ID
  label: string;          // human name, used in logs/emails
  amountCents: number;    // what the website says the customer pays
  recurring: "month" | null; // null = one-time payment
};

// Keep this table in sync with what the marketing pages show. If a price
// changes in Stripe, this is the tripwire that tells you the site is now wrong.
export const EXPECTED_PRICES: Expected[] = [
  { env: "STRIPE_PRICE_ID_LIFETIME",           label: "Pro Lifetime",          amountCents: 9900,  recurring: null },
  { env: "STRIPE_PRICE_ID_MONTHLY",            label: "Pro Monthly",           amountCents: 599,   recurring: "month" },
  { env: "STRIPE_PRICE_ID_TEAM",               label: "Team Pack (10 seats)",  amountCents: 39900, recurring: null },
  { env: "STRIPE_PRICE_PACK_PM_ESSENTIALS",    label: "PM Essentials pack",    amountCents: 2400,  recurring: null },
  { env: "STRIPE_PRICE_PACK_PROPOSAL_TOOLKIT", label: "Proposal Toolkit pack", amountCents: 3400,  recurring: null },
  { env: "STRIPE_PRICE_PACK_CPARS_PLAYBOOK",   label: "CPARS Playbook pack",   amountCents: 3400,  recurring: null },
];

const dollars = (cents: number) => `$${(cents / 100).toFixed(2)}`;

function banner(lines: string[]) {
  const bar = "!".repeat(72);
  console.error(`\n${bar}\n!!  STRIPE CONFIG PROBLEM\n${bar}`);
  for (const l of lines) console.error(`!!  ${l}`);
  console.error(`${bar}\n`);
}

export type PriceCheckResult = { ok: string[]; problems: string[] };

/** Pure check — returns findings, does not log or email. Exported for tests. */
export async function checkStripePrices(stripe: Stripe): Promise<PriceCheckResult> {
  const ok: string[] = [];
  const problems: string[] = [];

  for (const exp of EXPECTED_PRICES) {
    const id = process.env[exp.env];
    if (!id) {
      problems.push(`${exp.env} is NOT SET — ${exp.label} checkout will return 503`);
      continue;
    }
    let price: Stripe.Price;
    try {
      price = await stripe.prices.retrieve(id);
    } catch (err: any) {
      problems.push(`${exp.env}=${id} — Stripe rejected it: ${err?.message ?? err} (wrong mode? deleted?)`);
      continue;
    }
    const issues: string[] = [];
    if (!price.active) issues.push("price is INACTIVE in Stripe");
    if (price.unit_amount !== exp.amountCents) {
      issues.push(`Stripe charges ${dollars(price.unit_amount ?? 0)} but the site says ${dollars(exp.amountCents)}`);
    }
    if (price.currency !== "usd") issues.push(`currency is ${price.currency}, expected usd`);
    const interval = price.recurring?.interval ?? null;
    if (interval !== exp.recurring) {
      issues.push(`billing is ${interval ? `recurring/${interval}` : "one-time"}, expected ${exp.recurring ? `recurring/${exp.recurring}` : "one-time"}`);
    }
    if (issues.length) problems.push(`${exp.env}=${id} (${exp.label}): ${issues.join("; ")}`);
    else ok.push(`${exp.label} ${dollars(exp.amountCents)}${exp.recurring ? "/" + exp.recurring : ""} — ${id}`);
  }
  return { ok, problems };
}

/**
 * Boot-time entry point. Fire-and-forget; never throws.
 * Runs a few seconds after listen() so it can't delay the health check Railway
 * uses to decide the deploy is live.
 */
export function runStripeBootCheck(delayMs = 5_000): void {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    console.warn("[stripe-check] STRIPE_SECRET_KEY not set — payments disabled, skipping price validation");
    return;
  }
  setTimeout(async () => {
    try {
      const stripe = new Stripe(key, { apiVersion: "2026-02-25.clover" });
      const mode = key.startsWith("sk_live_") ? "LIVE" : "TEST";
      const { ok, problems } = await checkStripePrices(stripe);

      for (const line of ok) console.log(`[stripe-check] ✓ ${line}`);
      if (!problems.length) {
        console.log(`[stripe-check] all ${ok.length} prices verified against Stripe (${mode} mode)`);
        return;
      }

      banner([`Stripe mode: ${mode}`, ...problems]);
      await sendOpsAlertEmail(
        `⚠️ Stripe price config: ${problems.length} problem${problems.length > 1 ? "s" : ""} found at boot`,
        [
          `The server started (${mode} mode) and checked every STRIPE_PRICE_* variable against Stripe.`,
          `${problems.length} failed:`,
          ...problems.map((p) => `• ${p}`),
          ok.length ? `Passed: ${ok.length} (${ok.map((o) => o.split(" — ")[0]).join(", ")})` : "Nothing passed.",
          "Fix the Railway variable or the Stripe price, then redeploy — this check runs on every boot.",
        ],
      );
    } catch (err: any) {
      console.error("[stripe-check] validator itself failed:", err?.message ?? err);
    }
  }, delayMs);
}

// ── Checkout failure alerts ──────────────────────────────────────────────────

const ALERT_COOLDOWN_MS = 15 * 60 * 1000;
const lastAlertAt = new Map<string, number>();

/**
 * Call from the catch block of any checkout route, right before responding 500.
 * Always logs. Emails at most once per route per 15 minutes.
 */
export function reportCheckoutFailure(
  route: string,
  err: any,
  ctx: Record<string, string | undefined> = {},
): void {
  const msg = err?.message ?? String(err);
  console.error(`[checkout-500] ${route}: ${msg}`, err?.type ? `(stripe ${err.type}/${err.code ?? "?"})` : "");

  const now = Date.now();
  const last = lastAlertAt.get(route) ?? 0;
  if (now - last < ALERT_COOLDOWN_MS) return;
  lastAlertAt.set(route, now);

  const ctxLines = Object.entries(ctx)
    .filter(([, v]) => v)
    .map(([k, v]) => `${k}: ${v}`);

  void sendOpsAlertEmail(`🚨 Checkout failed (500) on ${route}`, [
    `A customer tried to pay and got "Payment error — please try again".`,
    `Route: ${route}`,
    `Error: ${msg}`,
    err?.type ? `Stripe error type: ${err.type}${err.code ? ` / ${err.code}` : ""}` : "",
    ...ctxLines,
    `Time (UTC): ${new Date().toISOString()}`,
    `Further failures on this route are muted for 15 minutes.`,
  ].filter(Boolean)).catch((e) => console.error("[checkout-500] alert email failed:", e?.message ?? e));
}
