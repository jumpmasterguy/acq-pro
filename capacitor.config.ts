import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.acqpro.app',
  appName: 'AcqPro',
  webDir: 'dist/public',
  server: {
    // Point to Railway backend for API calls in the native app
    url: 'https://acq-pro-production.up.railway.app',
    cleartext: false,
  },
  ios: {
    contentInset: 'automatic',
    backgroundColor: '#1e3a5f',
    limitsNavigationsToAppBoundDomains: true,
  },
};

export default config;
