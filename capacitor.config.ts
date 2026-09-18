import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.acqlerate.app',
  appName: 'Acqlerate',
  webDir: 'dist/public',
  server: {
    // The native shell is a thin wrapper: it loads the deployed site rather
    // than its own bundled copy, and API_BASE is empty so every /api call
    // resolves against this origin. It must be the custom domain — session
    // cookies and the Google OAuth callback are both issued for acqlerate.com,
    // and the old acq-pro-production.up.railway.app service domain no longer
    // resolves to a service at all (Railway answers it with a 404 fallback).
    // Must include /app. Bare https://acqlerate.com serves landing.html, the
    // marketing homepage, so the shell used to launch onto the sales page:
    // its sticky header has no safe-area padding, so under contentInset
    // 'never' the status bar sat on top of the wordmark and the Start Free
    // button, and App Review guideline 4.2.2 treats an app that opens on
    // marketing material as a repackaged website. /app serves the SPA, which
    // does handle the insets.
    url: 'https://acqlerate.com/app',
    cleartext: false,
    // Hosts the webview is allowed to navigate to itself. Anything not listed
    // here (and not the server host above) is handed to the system browser,
    // which is what broke Google sign-in: the flow left for Safari, completed
    // there, and set the session cookie in Safari's jar, so the app came back
    // to its own sign-in screen still logged out. accounts.google.com has to
    // be navigable in-app for the cookie to land where the app can see it.
    allowNavigation: ['accounts.google.com'],
  },
  ios: {
    // 'never' lets the webview own the full screen so the CSS env(safe-area-*)
    // insets are the only ones applied. With 'automatic' WKWebView adds its own
    // inset on top of them: the top bar rendered a blank strip of its own height
    // below the status bar, and the tab bar stopped short of the home indicator,
    // leaving a bare strip of the native background.
    contentInset: 'never',
    // Brand teal, matching the launch screen. Previously the old AcqPro navy,
    // which flashed between the splash and the first painted frame.
    backgroundColor: '#01696F',
    // Off deliberately. With it on and no WKAppBoundDomains array in
    // Info.plist, WKWebView treats every host as out of bounds, so the
    // allowNavigation entry above cannot take effect. Nothing here uses the
    // APIs app-bound domains exists to protect, and Apple does not require
    // it. If it is ever turned back on, WKAppBoundDomains must list both
    // acqlerate.com and accounts.google.com or sign-in breaks again.
    limitsNavigationsToAppBoundDomains: false,
    scrollEnabled: true,
    keyboardDisplayRequiresUserAction: false,
  },
  plugins: {
    Keyboard: {
      resize: 'body',
      style: 'default',
      resizeOnFullScreen: true,
    },
  },
};

export default config;
