'use client'

import { useEffect } from 'react'

/**
 * Handles Android hardware back button in Capacitor WebView.
 * If web history can go back, it goes back. Otherwise exits the app.
 * Also hides the status bar overlay on Android.
 */
export default function CapacitorBridge() {
  useEffect(() => {
    let cleanup: (() => void) | null = null

    async function setup() {
      // Dynamically import Capacitor so it doesn't break web builds
      const { Capacitor } = await import('@capacitor/core')
      if (!Capacitor.isNativePlatform()) return

      const { App } = await import('@capacitor/app')
      const { StatusBar, Style } = await import('@capacitor/status-bar')
      const { SplashScreen } = await import('@capacitor/splash-screen')

      // Style the status bar
      try {
        await StatusBar.setStyle({ style: Style.Light })
        await StatusBar.setBackgroundColor({ color: '#FFFFFF' })
      } catch (_) {}

      // Hide splash screen after app is ready
      try {
        await SplashScreen.hide()
      } catch (_) {}

      // Handle hardware back button
      const listener = await App.addListener('backButton', ({ canGoBack }) => {
        if (canGoBack) {
          window.history.back()
        } else {
          App.exitApp()
        }
      })

      cleanup = () => { listener.remove() }
    }

    setup()
    return () => { cleanup?.() }
  }, [])

  return null
}
