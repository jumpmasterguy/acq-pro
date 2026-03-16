/**
 * Detect if the app is running inside a Capacitor native shell (iOS/Android).
 * When true, hide all payment UI — Apple requires in-app purchases go through
 * their own IAP system. Users pay on the website, then log in on the app.
 */
export function isNativeApp(): boolean {
  return typeof (window as any).Capacitor !== 'undefined' &&
    (window as any).Capacitor?.isNativePlatform?.() === true;
}
