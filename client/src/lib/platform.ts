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
