'use client'

import { useEffect, useState, useCallback } from 'react'

/**
 * CapacitorBridge:
 * Universal notification & native container bridge:
 * 1. Handles Android hardware back button and status bar styling safely.
 * 2. Pure native Android Local Notifications (No Firebase dependency, 100% crash-free).
 * 3. Supports Web Notification API for users who installed via PWA / Browser.
 * 4. Offline reconnect delivery: When device connects/reconnects to the internet or opens,
 *    delivers new complaint & work alerts straight to the notification panel.
 */
export default function CapacitorBridge() {
  const [showPermissionBanner, setShowPermissionBanner] = useState(false)
  const [isNativeApp, setIsNativeApp] = useState(false)

  // 1. Request notification permission handler
  const requestNotificationPermission = useCallback(async () => {
    try {
      const { Capacitor } = await import('@capacitor/core')
      if (Capacitor.isNativePlatform()) {
        const { LocalNotifications } = await import('@capacitor/local-notifications')
        const res = await LocalNotifications.requestPermissions()
        if (res.display === 'granted') {
          setShowPermissionBanner(false)
        }
      } else if (typeof window !== 'undefined' && 'Notification' in window) {
        const perm = await Notification.requestPermission()
        if (perm === 'granted') {
          setShowPermissionBanner(false)
        }
      }
    } catch (e) {
      console.warn('[Notification Permission Request]', e)
    }
  }, [])

  useEffect(() => {
    const cleanups: Array<() => void> = []

    async function setup() {
      try {
        const { Capacitor } = await import('@capacitor/core')
        const isNative = Capacitor.isNativePlatform()
        setIsNativeApp(isNative)

        // Native Android APK enhancements
        if (isNative) {
          const { App } = await import('@capacitor/app')
          const { StatusBar, Style } = await import('@capacitor/status-bar')
          const { SplashScreen } = await import('@capacitor/splash-screen')

          // Style the status bar safely to match Bhagwa header
          try {
            await StatusBar.setStyle({ style: Style.Dark })
            await StatusBar.setBackgroundColor({ color: '#E65100' })
          } catch (_) {}

          // Hide splash screen safely
          try {
            await SplashScreen.hide()
          } catch (_) {}

          // Handle hardware back button
          try {
            const backListener = await App.addListener('backButton', ({ canGoBack }) => {
              if (canGoBack) {
                window.history.back()
              } else {
                App.exitApp()
              }
            })
            cleanups.push(() => { backListener.remove() })
          } catch (_) {}

          // Create notification channels (Android 8+)
          try {
            const { LocalNotifications } = await import('@capacitor/local-notifications')
            await LocalNotifications.createChannel({
              id: 'complaints',
              name: 'वार्ड 09 शिकायत सूचनाएँ',
              description: 'नई शिकायत दर्ज होने पर सूचना',
              importance: 5, // High importance (heads-up banner)
              visibility: 1, // Visible on lock screen
              vibration: true,
              lights: true,
              lightColor: '#D95C00',
              sound: 'default',
            })
            await LocalNotifications.createChannel({
              id: 'dainik-karya',
              name: 'वार्ड 09 दैनिक कार्य सूचनाएँ',
              description: 'नया दैनिक कार्य प्रकाशित होने पर सूचना',
              importance: 5,
              visibility: 1,
              vibration: true,
              lights: true,
              lightColor: '#D95C00',
              sound: 'default',
            })

            // Check permissions
            const perm = await LocalNotifications.checkPermissions()
            if (perm.display !== 'granted') {
              const reqRes = await LocalNotifications.requestPermissions()
              if (reqRes.display !== 'granted') {
                const dismissed = sessionStorage.getItem('janseva_notif_banner_dismissed')
                if (!dismissed) setShowPermissionBanner(true)
              }
            }

            // Handle tapping notification in Android tray
            const actionListener = await LocalNotifications.addListener(
              'localNotificationActionPerformed',
              notificationAction => {
                const extra = notificationAction.notification.extra
                if (extra?.code) {
                  window.location.href = `/s/${extra.code}`
                } else if (extra?.url) {
                  window.location.href = extra.url
                }
              }
            )
            cleanups.push(() => { actionListener.remove() })
          } catch (_) {}
        } else {
          // Web / PWA browser environment
          if (typeof window !== 'undefined' && 'Notification' in window) {
            if (Notification.permission === 'default') {
              const dismissed = sessionStorage.getItem('janseva_notif_banner_dismissed')
              if (!dismissed) setShowPermissionBanner(true)
            }
          }
        }

        // ----------------------------------------------------
        // Reconnect & Live Activity Notification Dispatcher
        // Works in both Native APK and Web/PWA when online
        // ----------------------------------------------------
        async function checkLatestNotifications() {
          if (typeof navigator !== 'undefined' && !navigator.onLine) return

          try {
            const lastSeenComplaintKey = 'janseva_last_seen_complaint_id'
            const lastSeenKaryaKey = 'janseva_last_seen_karya_id'
            const initKey = 'janseva_notif_ready'

            const isReady = localStorage.getItem(initKey) === 'true'
            const lastSeenComplaint = localStorage.getItem(lastSeenComplaintKey) || '0'
            const lastSeenKarya = localStorage.getItem(lastSeenKaryaKey) || '0'

            // First time initialization: capture current baseline so ancient records don't spam
            if (!isReady) {
              const initRes = await fetch('/api/notifications/check-latest?since=init&since_karya=init')
              if (initRes.ok) {
                const initJson = await initRes.json()
                localStorage.setItem(lastSeenComplaintKey, String(initJson.latestComplaintId || 0))
                localStorage.setItem(lastSeenKaryaKey, String(initJson.latestKaryaId || 0))
                localStorage.setItem(initKey, 'true')
              }
              return
            }

            // Query new items since last seen IDs
            const res = await fetch(
              `/api/notifications/check-latest?since=${lastSeenComplaint}&since_karya=${lastSeenKarya}`
            )
            if (!res.ok) return
            const json = await res.json()
            const items: any[] = json.items || []
            const karyaItems: any[] = json.karyaItems || []

            // 1. Process New Complaints
            if (items.length > 0) {
              let highestComplaintId = parseInt(lastSeenComplaint, 10) || 0

              for (const item of items) {
                const itemId = Number(item.id)
                if (itemId > highestComplaintId) highestComplaintId = itemId

                const title = `🚨 नई शिकायत: ${item.category}`
                const body = `वार्ड 09, ${item.mohalla} से नई शिकायत दर्ज हुई (${item.code})। देखने के लिए टैप करें।`
                const clickUrl = `/s/${item.code}`

                if (isNative) {
                  try {
                    const { LocalNotifications } = await import('@capacitor/local-notifications')
                    await LocalNotifications.schedule({
                      notifications: [
                        {
                          id: itemId || Math.floor(Math.random() * 100000),
                          title,
                          body,
                          channelId: 'complaints',
                          isExactNotification: false, // Critical: bypasses exact alarm requirement on Android 12+
                          autoCancel: true,
                          schedule: { at: new Date(Date.now() + 200) },
                          extra: { code: item.code, url: clickUrl },
                        },
                      ],
                    })
                  } catch (e) {
                    console.warn('[APK LocalNotif Error]', e)
                  }
                } else if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
                  try {
                    const notif = new Notification(title, {
                      body,
                      icon: '/icon.png',
                      tag: `complaint-${itemId}`,
                    })
                    notif.onclick = () => {
                      window.focus()
                      window.location.href = clickUrl
                    }
                  } catch (_) {}
                }
              }

              localStorage.setItem(lastSeenComplaintKey, highestComplaintId.toString())
            } else if (json.latestComplaintId && json.latestComplaintId > parseInt(lastSeenComplaint, 10)) {
              localStorage.setItem(lastSeenComplaintKey, String(json.latestComplaintId))
            }

            // 2. Process New Daily Works (दैनिक कार्य)
            if (karyaItems.length > 0) {
              let highestKaryaId = parseInt(lastSeenKarya, 10) || 0

              for (const karya of karyaItems) {
                const kId = Number(karya.id)
                if (kId > highestKaryaId) highestKaryaId = kId

                const areaTxt = karya.area ? `, ${karya.area}` : ''
                const title = `📋 नया दैनिक कार्य: ${karya.category}`
                const body = `वार्ड 09${areaTxt} में नया विकास कार्य प्रकाशित: "${karya.title}"। देखने के लिए टैप करें।`
                const clickUrl = '/dainik-karya'

                if (isNative) {
                  try {
                    const { LocalNotifications } = await import('@capacitor/local-notifications')
                    await LocalNotifications.schedule({
                      notifications: [
                        {
                          id: (kId + 500000) || Math.floor(Math.random() * 100000),
                          title,
                          body,
                          channelId: 'dainik-karya',
                          isExactNotification: false,
                          autoCancel: true,
                          schedule: { at: new Date(Date.now() + 200) },
                          extra: { url: clickUrl },
                        },
                      ],
                    })
                  } catch (e) {
                    console.warn('[APK Karya Notif Error]', e)
                  }
                } else if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
                  try {
                    const notif = new Notification(title, {
                      body,
                      icon: '/icon.png',
                      tag: `karya-${kId}`,
                    })
                    notif.onclick = () => {
                      window.focus()
                      window.location.href = clickUrl
                    }
                  } catch (_) {}
                }
              }

              localStorage.setItem(lastSeenKaryaKey, highestKaryaId.toString())
            } else if (json.latestKaryaId && json.latestKaryaId > parseInt(lastSeenKarya, 10)) {
              localStorage.setItem(lastSeenKaryaKey, String(json.latestKaryaId))
            }
          } catch (err) {
            console.error('[CapacitorBridge] checkLatestNotifications error:', err)
          }
        }

        // Initial check on launch
        setTimeout(checkLatestNotifications, 1000)

        // Check whenever phone connects/reconnects to internet
        window.addEventListener('online', checkLatestNotifications)
        cleanups.push(() => {
          window.removeEventListener('online', checkLatestNotifications)
        })

        // Check when tab / app becomes visible or active
        const handleVisibilityChange = () => {
          if (document.visibilityState === 'visible') {
            checkLatestNotifications()
          }
        }
        document.addEventListener('visibilitychange', handleVisibilityChange)
        cleanups.push(() => {
          document.removeEventListener('visibilitychange', handleVisibilityChange)
        })

        // Check on native app resume
        if (isNative) {
          try {
            const { App } = await import('@capacitor/app')
            const resumeListener = await App.addListener('appStateChange', ({ isActive }) => {
              if (isActive) {
                checkLatestNotifications()
              }
            })
            cleanups.push(() => { resumeListener.remove() })
          } catch (_) {}
        }

        // Periodic background poll while app is active (every 35s)
        const pollInterval = setInterval(checkLatestNotifications, 35000)
        cleanups.push(() => clearInterval(pollInterval))
      } catch (err) {
        console.error('[CapacitorBridge Setup Error]', err)
      }
    }

    setup()
    return () => {
      cleanups.forEach(fn => fn())
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleDismissBanner = () => {
    sessionStorage.setItem('janseva_notif_banner_dismissed', 'true')
    setShowPermissionBanner(false)
  }

  if (!showPermissionBanner) return null

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, #1E3A8A, #1D4ED8)',
        color: '#FFFFFF',
        padding: '10px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 10,
        fontSize: 13,
        boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
        position: 'sticky',
        top: 0,
        zIndex: 9999,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 260 }}>
        <span style={{ fontSize: 20 }}>🔔</span>
        <span>
          <strong>सूचनाएं (Notifications) चालू करें:</strong> नए वार्ड कार्यों और शिकायतों की जानकारी तुरंत अपने फ़ोन पर पाएं।
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button
          type="button"
          onClick={requestNotificationPermission}
          style={{
            background: '#FFFFFF',
            color: '#1D4ED8',
            border: 0,
            padding: '6px 14px',
            borderRadius: 6,
            fontWeight: 700,
            fontSize: 12.5,
            cursor: 'pointer',
            boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
          }}
        >
          चालू करें
        </button>
        <button
          type="button"
          onClick={handleDismissBanner}
          style={{
            background: 'transparent',
            color: 'rgba(255,255,255,0.8)',
            border: '1px solid rgba(255,255,255,0.4)',
            padding: '5px 10px',
            borderRadius: 6,
            fontSize: 12,
            cursor: 'pointer',
          }}
        >
          बाद में
        </button>
      </div>
    </div>
  )
}
