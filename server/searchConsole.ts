// ── Google Search Console: this month's clicks, impressions, position ───────
//
// Feeds the founder review dashboard's "Google clicks" row, so nobody has to
// copy numbers out of the Search Console UI on the 1st of the month.
//
// Auth is a Google service account whose JSON key sits in
// GSC_SERVICE_ACCOUNT_JSON. That account is added as a Restricted user on the
// Search Console property and has no Cloud IAM role. The OAuth JWT is signed
// here with node's crypto rather than pulling in googleapis for two HTTP calls.
//
// Every successful pull is saved in seo_stats_pulls (one row per month; the
// table is created at boot in server/index.ts). When Google or the key fails,
// the route still answers with the last good numbers and says how old they
// are, instead of going blank.

import crypto from "crypto";

const SCOPE = "https://www.googleapis.com/auth/webmasters.readonly";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const API_BASE = "https://searchconsole.googleapis.com/webmasters/v3";
// Search Console reports days in Pacific Time, so "this month" is PT too.
// Using UTC would make the first and last day of each month disagree with
// the numbers in the Search Console UI.
const GSC_TZ = "America/Los_Angeles";

type ServiceAccount = { client_email: string; private_key: string };

export type SeoMonth = {
  month: string;            // YYYY-MM
  startDate: string;        // YYYY-MM-DD, inclusive
  endDate: string;          // YYYY-MM-DD, inclusive
  clicks: number;
  impressions: number;
  position: number | null;  // average position, 1 decimal; null with no impressions
  pulledAt: string;         // ISO timestamp of the successful pull
};

/** Something in env is missing or malformed. Retrying won't fix it. */
export class GscConfigError extends Error {}

// ── Config ──────────────────────────────────────────────────────────────────

export function readServiceAccount(raw = process.env.GSC_SERVICE_ACCOUNT_JSON): ServiceAccount {
  if (!raw || !raw.trim()) throw new GscConfigError("GSC_SERVICE_ACCOUNT_JSON is not set");
  let text = raw.trim();
  // Accept the key file pasted as-is, or base64 of it.
  if (!text.startsWith("{")) text = Buffer.from(text, "base64").toString("utf8");
  let parsed: any;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new GscConfigError("GSC_SERVICE_ACCOUNT_JSON is not valid JSON (or base64 of JSON)");
  }
  if (!parsed?.client_email || !parsed?.private_key) {
    throw new GscConfigError("GSC_SERVICE_ACCOUNT_JSON is missing client_email or private_key");
  }
  // Some env-var editors turn real newlines into a literal backslash-n.
  const private_key = String(parsed.private_key).replace(/\\n/g, "\n");
  return { client_email: String(parsed.client_email), private_key };
}

function readSiteUrl(): string {
  const site = process.env.GSC_SITE_URL?.trim();
  if (!site) throw new GscConfigError("GSC_SITE_URL is not set (sc-domain:acqlerate.com or https://acqlerate.com/)");
  return site;
}

// ── Dates ───────────────────────────────────────────────────────────────────

function dayInTz(tz: string, d: Date): string {
  // en-CA formats as YYYY-MM-DD.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit",
  }).format(d);
}

/**
 * The date range for a month. With no month, it's the current month (Pacific)
 * from the 1st through today. A past month runs to its last day.
 */
export function seoMonthRange(month?: string, now = new Date()) {
  const today = dayInTz(GSC_TZ, now);
  const current = today.slice(0, 7);
  const m = month ?? current;
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(m)) throw new RangeError("month must look like 2026-09");
  if (m > current) throw new RangeError(`month ${m} hasn't started yet`);
  const [y, mo] = m.split("-").map(Number);
  const lastDay = new Date(Date.UTC(y, mo, 0)).getUTCDate();
  const endDate = m === current ? today : `${m}-${String(lastDay).padStart(2, "0")}`;
  return { month: m, startDate: `${m}-01`, endDate };
}

// ── Google calls ────────────────────────────────────────────────────────────

let cachedToken: { token: string; expiresAt: number; email: string } | null = null;

async function getAccessToken(sa: ServiceAccount): Promise<string> {
  if (cachedToken && cachedToken.email === sa.client_email && Date.now() < cachedToken.expiresAt - 60_000) {
    return cachedToken.token;
  }
  const now = Math.floor(Date.now() / 1000);
  const b64url = (s: string) => Buffer.from(s).toString("base64url");
  const unsigned =
    b64url(JSON.stringify({ alg: "RS256", typ: "JWT" })) + "." +
    b64url(JSON.stringify({ iss: sa.client_email, scope: SCOPE, aud: TOKEN_URL, iat: now, exp: now + 3600 }));

  let signature: string;
  try {
    signature = crypto.sign("RSA-SHA256", Buffer.from(unsigned), sa.private_key).toString("base64url");
  } catch (e: any) {
    throw new GscConfigError(`private_key in GSC_SERVICE_ACCOUNT_JSON can't sign: ${e?.message ?? e}`);
  }

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: `${unsigned}.${signature}`,
    }),
    signal: AbortSignal.timeout(15_000),
  });
  const body: any = await res.json().catch(() => ({}));
  if (!res.ok || !body.access_token) {
    throw new Error(`Google sign-in failed (${res.status}): ${body.error_description || body.error || "no access token returned"}`);
  }
  cachedToken = {
    token: body.access_token,
    expiresAt: Date.now() + Number(body.expires_in ?? 3600) * 1000,
    email: sa.client_email,
  };
  return body.access_token;
}

/** Pull one month's totals from Search Console. Throws on any failure. */
export async function pullSeoMonth(range: { month: string; startDate: string; endDate: string }): Promise<SeoMonth> {
  const sa = readServiceAccount();
  const site = readSiteUrl();
  const token = await getAccessToken(sa);

  const res = await fetch(`${API_BASE}/sites/${encodeURIComponent(site)}/searchAnalytics/query`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    // No dimensions = one row of totals for the whole property.
    // dataState "all" includes the last day or two of preliminary data, which
    // is what the Search Console UI shows by default.
    body: JSON.stringify({ startDate: range.startDate, endDate: range.endDate, dataState: "all" }),
    signal: AbortSignal.timeout(20_000),
  });
  const body: any = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401) cachedToken = null;
    const msg = String(body?.error?.message || res.statusText).replace(/\.$/, "");
    const hint = res.status === 403 || res.status === 404
      ? ` Check that ${sa.client_email} is a user on the Search Console property and that GSC_SITE_URL matches it exactly ("sc-domain:acqlerate.com" for a Domain property, "https://acqlerate.com/" with the slash for a URL-prefix one).`
      : "";
    throw new Error(`Search Console query failed (${res.status}): ${msg}.${hint}`);
  }

  const row = Array.isArray(body.rows) ? body.rows[0] : undefined;
  const impressions = Number(row?.impressions ?? 0);
  return {
    ...range,
    clicks: Number(row?.clicks ?? 0),
    impressions,
    position: row && impressions > 0 ? Math.round(Number(row.position) * 10) / 10 : null,
    pulledAt: new Date().toISOString(),
  };
}

// ── Last good pull, per month ───────────────────────────────────────────────

// Local dev without DATABASE_URL keeps pulls in memory, like MemStorage.
const memoryPulls = new Map<string, SeoMonth>();

async function withPool<T>(fn: (pool: any) => Promise<T>): Promise<T> {
  const { Pool } = await import("pg");
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  try {
    return await fn(pool);
  } finally {
    await pool.end();
  }
}

export async function saveSeoPull(p: SeoMonth): Promise<void> {
  if (!process.env.DATABASE_URL) { memoryPulls.set(p.month, p); return; }
  await withPool(pool => pool.query(
    `INSERT INTO seo_stats_pulls (month, start_date, end_date, clicks, impressions, avg_position, pulled_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (month) DO UPDATE SET
       start_date = EXCLUDED.start_date, end_date = EXCLUDED.end_date,
       clicks = EXCLUDED.clicks, impressions = EXCLUDED.impressions,
       avg_position = EXCLUDED.avg_position, pulled_at = EXCLUDED.pulled_at`,
    [p.month, p.startDate, p.endDate, p.clicks, p.impressions, p.position, p.pulledAt],
  ));
}

export async function loadSeoPull(month: string): Promise<SeoMonth | null> {
  if (!process.env.DATABASE_URL) return memoryPulls.get(month) ?? null;
  return withPool(async pool => {
    const r = await pool.query(
      `SELECT month, start_date, end_date, clicks, impressions, avg_position, pulled_at
       FROM seo_stats_pulls WHERE month = $1`, [month]);
    const row = r.rows[0];
    if (!row) return null;
    return {
      month: row.month, startDate: row.start_date, endDate: row.end_date,
      clicks: Number(row.clicks), impressions: Number(row.impressions),
      position: row.avg_position == null ? null : Number(row.avg_position),
      pulledAt: row.pulled_at,
    };
  });
}

// ── What the route returns ──────────────────────────────────────────────────

function shape(m: SeoMonth, stale: boolean, error?: string) {
  return {
    month: m.month,
    startDate: m.startDate,
    endDate: m.endDate,
    clicks: m.clicks,
    impressions: m.impressions,
    position: m.position,
    lastSuccessfulPullAt: m.pulledAt,
    stale,
    ...(error ? { error } : {}),
  };
}

/**
 * Fresh numbers when Google answers. When it doesn't, the last good pull for
 * that month with stale: true and the reason. Only errors with no saved pull
 * to fall back on return a non-200.
 */
export async function getSeoStats(monthParam?: string): Promise<{ status: number; body: Record<string, unknown> }> {
  let range: ReturnType<typeof seoMonthRange>;
  try {
    range = seoMonthRange(monthParam);
  } catch (e: any) {
    return { status: 400, body: { error: e.message } };
  }

  try {
    const fresh = await pullSeoMonth(range);
    try {
      await saveSeoPull(fresh);
    } catch (e: any) {
      // Numbers are still good; only the fallback copy failed to save.
      console.error("[stats/seo] couldn't save pull:", e?.message ?? e);
    }
    return { status: 200, body: shape(fresh, false) };
  } catch (err: any) {
    const reason = String(err?.message ?? err);
    console.error("[stats/seo] pull failed:", reason);
    const last = await loadSeoPull(range.month).catch(() => null);
    if (last) return { status: 200, body: shape(last, true, reason) };
    return {
      status: err instanceof GscConfigError ? 503 : 502,
      body: { month: range.month, error: reason, lastSuccessfulPullAt: null, stale: true },
    };
  }
}
