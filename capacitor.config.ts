import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.acqlerate.app',
  appName: 'Acqlerate',
  webDir: 'dist/public',
  server: {
    // Point to Railway backend for API calls in the native app
    url: 'https://acq-pro-production.up.railway.app',
    cleartext: false,
  },
  ios: {
    // 'never' lets the webview own the full screen so the CSS env(safe-area-*)
    // insets are the only ones applied. With 'automatic' WKWebView adds its own
    // inset on top of them: the top bar rendered a blank strip of its own height
    // below the status bar, and the tab bar stopped short of the home indicator,
    // leaving a bare strip of the native background.
    contentInset: 'never',
    backgroundColor: '#1e3a5f',
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
