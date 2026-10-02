// ── Checkout starts and team deals, for the founder review dashboard ────────
//
// The trial is app-level (users.trial_ends_at). Nothing recorded whether a
// trial user ever reached a payment page, so a trial that ended without a
// purchase looked the same whether the person tried to pay or never saw a
// price. /api/stripe/create-checkout-session now writes one row here per
// Stripe checkout it opens, and /api/stats turns that into "trials that
// started checkout" per month.
//
// Team deals come from the purchases table (pack = 'team-pack'), which the
// Stripe webhook already writes for every team purchase.
//
// The table is created at boot in server/index.ts. Nothing here may break
// checkout: recordCheckoutStart never throws.

export type CheckoutStart = { userId: string; createdAt: string };

// Local dev without DATABASE_URL keeps rows in memory, like MemStorage.
const memoryStarts: CheckoutStart[] = [];

async function withPool<T>(fn: (pool: any) => Promise<T>): Promise<T> {
  const { Pool } = await import("pg");
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  try {
    return await fn(pool);
  } finally {
    await pool.end();
  }
}

export async function recordCheckoutStart(userId: string, plan: string, source: string): Promise<void> {
  const createdAt = new Date().toISOString();
  try {
    if (!process.env.DATABASE_URL) { memoryStarts.push({ userId, createdAt }); return; }
    await withPool(pool => pool.query(
      `INSERT INTO checkout_starts (user_id, plan, source, created_at) VALUES ($1, $2, $3, $4)`,
      [userId, plan, source, createdAt],
    ));
  } catch (e: any) {
    console.error("[checkout-starts] couldn't record:", e?.message ?? e);
  }
}

export async function listCheckoutStarts(): Promise<CheckoutStart[]> {
  if (!process.env.DATABASE_URL) return [...memoryStarts];
  return withPool(async pool => {
    const r = await pool.query(`SELECT user_id, created_at FROM checkout_starts`);
    return r.rows.map((row: any) => ({ userId: String(row.user_id), createdAt: String(row.created_at) }));
  });
}

/** Team purchases per UTC month, e.g. { "2026-10": 1 }. */
export async function teamDealsByMonth(): Promise<Record<string, number>> {
  if (!process.env.DATABASE_URL) return {};
  return withPool(async pool => {
    const r = await pool.query(
      `SELECT to_char((created_at)::timestamptz AT TIME ZONE 'UTC', 'YYYY-MM') AS month, count(*)::int AS n
       FROM purchases WHERE pack = 'team-pack' GROUP BY 1`);
    const out: Record<string, number> = {};
    for (const row of r.rows) out[row.month] = Number(row.n);
    return out;
  });
}

/** How long after a trial ends a checkout still counts as "the trial reached a payment page". */
export const CHECKOUT_GRACE_DAYS = 7;

/**
 * Trials that ended, per month of their end date (UTC), and how many of those
 * people started a checkout before the trial ended or within the grace days
 * after. Trials still running are not counted anywhere.
 */
export function trialCheckoutCounts(
  users: { id: string; trialEndsAt?: string | null }[],
  starts: CheckoutStart[],
  now = Date.now(),
): { trialsEndedByMonth: Record<string, number>; trialsCheckoutByMonth: Record<string, number> } {
  const startsByUser = new Map<string, number[]>();
  for (const s of starts) {
    const t = new Date(s.createdAt).getTime();
    if (isNaN(t)) continue;
    const list = startsByUser.get(s.userId) ?? [];
    list.push(t);
    startsByUser.set(s.userId, list);
  }
  const graceMs = CHECKOUT_GRACE_DAYS * 24 * 60 * 60 * 1000;
  const trialsEndedByMonth: Record<string, number> = {};
  const trialsCheckoutByMonth: Record<string, number> = {};
  for (const u of users) {
    if (!u.trialEndsAt) continue;
    const end = new Date(u.trialEndsAt).getTime();
    if (isNaN(end) || end > now) continue;
    const key = new Date(end).toISOString().slice(0, 7);
    trialsEndedByMonth[key] = (trialsEndedByMonth[key] ?? 0) + 1;
    trialsCheckoutByMonth[key] = trialsCheckoutByMonth[key] ?? 0;
    if ((startsByUser.get(u.id) ?? []).some(t => t <= end + graceMs)) {
      trialsCheckoutByMonth[key] += 1;
    }
  }
  return { trialsEndedByMonth, trialsCheckoutByMonth };
}
