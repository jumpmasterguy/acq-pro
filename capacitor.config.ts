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
    url: 'https://acqlerate.com',
    cleartext: false,
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
    limitsNavigationsToAppBoundDomains: true,
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
