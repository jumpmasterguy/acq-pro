// Permission to send text to Anthropic for the AI features.
//
// App Store Guideline 5.1.2(i) (Nov 2025): "You must clearly disclose where
// personal data will be shared with third parties, including with third-party
// AI, and obtain explicit permission before doing so." Every AI button
// (explain simpler, Teach It Back, Explain My Mistake, How Do I Apply This?)
// calls ensureAiConsent() first. If the person hasn't agreed, the consent
// sheet (components/AiConsentHost.tsx) opens and nothing is sent until they
// tap "Turn on". The server refuses AI calls without consent too (428).
// Turned off again in My Account.

import { apiRequest } from "./queryClient";

let granted = false;
let pending: ((ok: boolean) => void) | null = null;
const listeners = new Set<() => void>();

/** Called with the signed-in user's aiConsentAt on sign-in and refresh. */
export function setAiConsentFromUser(aiConsentAt: string | null | undefined): void {
  granted = !!aiConsentAt;
  listeners.forEach(l => l());
}

export function hasAiConsent(): boolean {
  return granted;
}

/** True once the person has agreed. Opens the consent sheet if they haven't. */
export function ensureAiConsent(): Promise<boolean> {
  if (granted) return Promise.resolve(true);
  if (pending) pending(false);
  return new Promise<boolean>(resolve => {
    pending = resolve;
    listeners.forEach(l => l());
  });
}

/** For AiConsentHost: whether the sheet should be open. */
export function isAiConsentAsked(): boolean {
  return pending !== null;
}

export function subscribeAiConsent(fn: () => void): () => void {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}

/** Saves the choice on the server. Throws if it couldn't be saved. */
export async function saveAiConsent(consent: boolean): Promise<void> {
  const res = await apiRequest("POST", "/api/ai-consent", { consent });
  if (!res.ok) throw new Error("Couldn't save that. Check your connection and try again.");
  const data = await res.json().catch(() => ({}));
  granted = !!data?.aiConsentAt;
  listeners.forEach(l => l());
}

/** For AiConsentHost: the person answered the sheet. */
export function answerAiConsent(ok: boolean): void {
  const p = pending;
  pending = null;
  listeners.forEach(l => l());
  p?.(ok);
}

/** A 428 from an AI endpoint means the server has no consent on record. */
export function isConsentResponse(status: number, body: any): boolean {
  return status === 428 && !!body?.needsAiConsent;
}
