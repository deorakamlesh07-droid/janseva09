import { CapacitorConfig } from '@capacitor/cli'

// 🔴 IMPORTANT: Before building the production APK, replace the url below
// with your actual deployed Next.js URL (e.g. https://ward44.vercel.app)
// For local testing: use your machine's LAN IP e.g. http://192.168.1.X:3000
const PRODUCTION_URL = 'https://janseva09.vercel.app'

const config: CapacitorConfig = {
  appId: 'com.ward44.bikaner',
  appName: 'जनसेवा 09',
  webDir: 'public', // placeholder — actual content served via server.url
  server: {
    url: PRODUCTION_URL,
    cleartext: false,
    androidScheme: 'https',
  },
  android: {
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false, // set true only during dev debugging
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#ffffff',
      showSpinner: true,
      spinnerColor: '#1a73e8',
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: 'dark',
      backgroundColor: '#FFFFFF',
    },
  },
}

export default config
