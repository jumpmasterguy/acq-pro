// Referral links look like https://acqlerate.com/app?ref=CODE (see
// /api/my-referral). The app routes on the hash, so nothing used to read the
// normal ?ref= query string and every shared link silently lost its code.
// Now the code is captured at boot from either place and kept for 30 days,
// so it survives someone browsing around before they sign up.

const KEY = "acq:ref";
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

function clean(raw: string | null | undefined): string | null {
  const code = (raw ?? "").replace(/[^A-Za-z0-9]/g, "").slice(0, 20).toUpperCase();
  return code || null;
}

/** The ?ref= code in the URL right now, from the query string or the hash route. */
export function readReferralFromUrl(): string | null {
  try {
    const fromSearch = new URLSearchParams(window.location.search).get("ref");
    if (fromSearch) return clean(fromSearch);
    const hash = window.location.hash;
    const q = hash.indexOf("?");
    if (q >= 0) return clean(new URLSearchParams(hash.slice(q + 1)).get("ref"));
  } catch { /* ignore */ }
  return null;
}

/** Call once at boot: remembers a code from the URL for later signup. */
export function captureReferralFromUrl(): void {
  const code = readReferralFromUrl();
  if (!code) return;
  try { localStorage.setItem(KEY, JSON.stringify({ code, at: Date.now() })); } catch { /* storage blocked */ }
}

export function getStoredReferral(): string | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const { code, at } = JSON.parse(raw);
    if (typeof at !== "number" || Date.now() - at > MAX_AGE_MS) {
      localStorage.removeItem(KEY);
      return null;
    }
    return clean(code);
  } catch {
    return null;
  }
}

export function clearStoredReferral(): void {
  try { localStorage.removeItem(KEY); } catch { /* ignore */ }
}
