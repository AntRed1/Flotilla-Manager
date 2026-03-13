import { CapacitorConfig } from '@capacitor/cli';
import { KeyboardResize } from '@capacitor/keyboard';

const config: CapacitorConfig = {
  appId: 'com.flotilla.manager',
  appName: 'Flotilla Manager',
  webDir: 'dist',

  // Sin server.url → Capacitor carga los archivos del dist/ directamente
  // Las llamadas API van a VITE_API_URL definido en .env

  android: {
    allowMixedContent: true,
  },

  ios: {
    contentInset: 'automatic',
    allowsLinkPreview: false,
    scrollEnabled: true,
  },

  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      launchAutoHide: true,
      backgroundColor: '#22c55e',
      showSpinner: false,
      splashFullScreen: true,
    },
    StatusBar: {
      style: 'light',
      backgroundColor: '#22c55e',
      overlaysWebView: false,
    },
    Keyboard: {
      resize: KeyboardResize.Body,
      resizeOnFullScreen: true,
    },
  },
};

export default config;