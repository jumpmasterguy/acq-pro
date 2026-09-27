// Pricing window, shared by client and server.
//
// Until the switch: Free / Monthly $5.99 / Lifetime $99 / Team Pack $399
// one-time (10 Lifetime seats). Anyone who buys Monthly in that window keeps
// $5.99 for as long as they stay subscribed (their Stripe price never moves).
//
// From the switch: Free / Monthly $14.99 / Annual $149 / Team $999 a year
// (10 Annual seats). Lifetime and the one-time Team Pack stop being sold.
// Existing Lifetime and Team Pack holders keep everything they bought.
//
// The server is the authority (checkout picks the Stripe price from this
// clock). The client and the marketing pages use the same clock only to
// decide which prices to show.

/** Midnight US Eastern (EDT) at the start of 1 Oct 2026. */
export const PRICING_SWITCH_ISO = "2026-10-01T04:00:00Z";
export const PRICING_SWITCH_AT = Date.parse(PRICING_SWITCH_ISO);

export function isNewPricing(now: number = Date.now()): boolean {
  return now >= PRICING_SWITCH_AT;
}

export const LEGACY_PRICES = { monthly: 5.99, lifetime: 99, team: 399 } as const;
export const PRICES = { monthly: 14.99, annual: 149, team: 999 } as const;

export type PlanType = "monthly" | "annual" | "lifetime";

/** Plans that can be bought right now. */
export function purchasablePlans(now: number = Date.now()): PlanType[] {
  return isNewPricing(now) ? ["monthly", "annual"] : ["monthly", "lifetime"];
}

/** Display price for a plan at a given moment, in dollars. */
export function planPrice(plan: PlanType, now: number = Date.now()): number {
  if (plan === "lifetime") return LEGACY_PRICES.lifetime;
  if (plan === "annual") return PRICES.annual;
  return isNewPricing(now) ? PRICES.monthly : LEGACY_PRICES.monthly;
}

/** The plan name to point people at for unlimited AI and downloads. */
export function topPlanName(now: number = Date.now()): string {
  return isNewPricing(now) ? "Annual Pro" : "Lifetime Pro";
}

/** Short upsell label, e.g. "Upgrade to Pro, $99 lifetime" / "from $12.42/mo". */
export function upgradeCtaSuffix(now: number = Date.now()): string {
  return isNewPricing(now) ? "Annual $149/yr" : "$99 lifetime";
}

/**
 * Static marketing pages (landing, PDU page, teams, terms, blog) carry both
 * price sets, each fenced in HTML comments:
 *
 *   <!--pricing:legacy--> ...shown until the switch... <!--/pricing:legacy-->
 *   <!--pricing:new-->    ...shown from the switch...  <!--/pricing:new-->
 *
 * The server strips whichever set is not current before sending the page
 * (server/static.ts), so the site changes over at midnight Eastern on 1 Oct
 * with no deploy. Crawlers and no-JS readers see only the live prices.
 */
const PRICING_BLOCK = /<!--pricing:(legacy|new)-->([\s\S]*?)<!--\/pricing:\1-->/g;

export function applyPricingWindow(html: string, now: number = Date.now()): string {
  if (!html.includes("<!--pricing:")) return html;
  const keep = isNewPricing(now) ? "new" : "legacy";
  return html.replace(PRICING_BLOCK, (_m, which: string, inner: string) => (which === keep ? inner : ""));
}
