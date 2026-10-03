/**
 * Detect if the app is running inside a Capacitor native shell (iOS/Android).
 * When true, hide all payment UI — Apple requires in-app purchases go through
 * their own IAP system. Users pay on the website, then log in on the app.
 */
export function isNativeApp(): boolean {
  return typeof (window as any).Capacitor !== 'undefined' &&
    (window as any).Capacitor?.isNativePlatform?.() === true;
}
/**
 * Which native platform the Capacitor shell is running on. Returns 'web' in a
 * browser. The mobile shell uses this to pick the tab-bar geometry: iOS gets a
 * 50px row plus the home-indicator inset; Android gets an 80px row with
 * Material-style active pills behind the icons.
 */
export type AppPlatform = 'ios' | 'android' | 'web';

export function getPlatform(): AppPlatform {
  const cap = (window as any).Capacitor;
  const p = cap?.getPlatform?.();
  if (p === 'ios' || p === 'android') return p;
  return 'web';
}

/**
 * Tab-bar style to render. On the web there is no Capacitor to ask, so fall
 * back to the user agent — a mobile browser on an Android phone should still
 * get the Material tab bar it expects.
 */
export function getTabBarStyle(): 'ios' | 'android' {
  const p = getPlatform();
  if (p !== 'web') return p;
  return /android/i.test(navigator.userAgent) ? 'android' : 'ios';
}

/**
 * Click handler for links to our own website pages (Privacy, Terms) that must
 * not load inside the app's web view. In the app, the web view would show the
 * page with no way back, and its logo links to the marketing homepage (prices
 * and checkout, which App Review does not allow outside the US storefront).
 * So the app opens them in the Safari sheet, which has its own Done button.
 * On the web the link behaves normally.
 */
export function openSitePageInApp(e: { preventDefault: () => void }, path: string): void {
  if (!isNativeApp()) return;
  e.preventDefault();
  const url = path.startsWith('http') ? path : `https://acqlerate.com${path}`;
  import('@capacitor/browser')
    .then(({ Browser }) => Browser.open({ url, presentationStyle: 'popover' }))
    .catch(() => { window.open(url, '_blank'); });
}
