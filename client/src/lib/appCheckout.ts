// ─── Buying Pro from inside the app ─────────────────────────────────────────
//
// What the app may do depends on the store the phone is signed into, not on
// where the person is standing (rules as of Sept 2026):
//
//   iPhone, US App Store     Link out to our own checkout. Allowed since the
//                            May 2025 Epic v. Apple ruling, 0% to Apple (the
//                            Supreme Court hears Apple's appeal Oct 2026).
//                            Stripe's form INSIDE the app is still not allowed.
//   iPhone, any other store  No purchase buttons, and no "go buy it on the
//                            website" either (Guideline 3.1.1). EU link-outs
//                            need Apple's entitlement, Apple In-App Purchase
//                            offered alongside, iOS 26.2+, and monthly
//                            reporting; not built.
//   Android                  Google allows link-outs in the US and EEA only
//                            through its programs (enrollment, Play Billing
//                            Library 8.2.1+, reporting every sale). Not
//                            enrolled, so no purchase buttons yet.
//
// Checkout opens in the system browser sheet (SFSafariViewController), not a
// web view: Apple Pay works there, and it is what Apple's US rules allow.

import { apiRequest } from './queryClient';
import { getPlatform, isNativeApp } from './platform';

export type CheckoutMode =
  | 'web'      // a browser: the normal Stripe checkout page
  | 'ios-us'   // iPhone app on the US App Store: link out to Stripe
  | 'none';    // an app build or store where we may not sell

let cached: Promise<CheckoutMode> | null = null;

/** Where this device may buy Pro. Asks the store once per app launch. */
export function getCheckoutMode(): Promise<CheckoutMode> {
  if (!cached) cached = resolveMode().catch(() => 'none' as const);
  return cached;
}

async function resolveMode(): Promise<CheckoutMode> {
  if (!isNativeApp()) return 'web';
  if (getPlatform() !== 'ios') return 'none';
  const { Capacitor } = await import('@capacitor/core');
  // Both are native code, so an app built before this change has neither.
  if (!Capacitor.isPluginAvailable('Store') || !Capacitor.isPluginAvailable('Browser')) return 'none';
  const res: any = await (Capacitor as any).Plugins.Store.storefront();
  // StoreKit reports ISO 3166-1 alpha-3: "USA".
  return res?.countryCode === 'USA' ? 'ios-us' : 'none';
}

/**
 * Starts checkout in the app: asks the server for a Stripe Checkout session
 * that returns to /checkout/return (not the web app), then opens it in the
 * browser sheet. Resolves once the sheet has closed, however it closed; the
 * caller then asks the server whether the purchase went through.
 */
export async function openAppCheckout(priceType: string): Promise<void> {
  const res = await apiRequest('POST', '/api/stripe/create-checkout-session', { priceType, source: 'ios-app' });
  const data = await res.json();
  if (!data?.url) throw new Error(data?.message || 'Could not start checkout.');

  const [{ Browser }, { App }] = await Promise.all([import('@capacitor/browser'), import('@capacitor/app')]);
  await new Promise<void>((resolve) => {
    let done = false;
    const handles: Array<Promise<{ remove: () => Promise<void> }>> = [];
    const finish = () => {
      if (done) return;
      done = true;
      handles.forEach(h => h.then(x => x.remove()).catch(() => {}));
      resolve();
    };
    // Tapping Done in the sheet.
    handles.push(Browser.addListener('browserFinished', finish));
    // Tapping "Return to Acqlerate" on the receipt page (acqlerate://checkout).
    handles.push(App.addListener('appUrlOpen', ({ url }) => {
      if (url.startsWith('acqlerate://checkout')) { void Browser.close().catch(() => {}); finish(); }
    }));
    Browser.open({ url: data.url, presentationStyle: 'popover' }).catch(finish);
  });
}

/** Opens the Stripe billing portal in the browser sheet (manage or cancel). */
export async function openAppBillingPortal(): Promise<void> {
  const res = await apiRequest('POST', '/api/stripe/portal', { source: 'ios-app' });
  const data = await res.json();
  if (!data?.url) throw new Error(data?.message || 'Billing portal unavailable.');
  const { Browser } = await import('@capacitor/browser');
  await Browser.open({ url: data.url, presentationStyle: 'popover' });
}
