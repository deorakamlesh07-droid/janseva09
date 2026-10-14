import { getServiceClient } from './supabase'

export interface ComplaintPushData {
  code: string
  category: string
  mohalla: string
  detail?: string
}

export interface DainikKaryaPushData {
  title: string
  category: string
  area?: string | null
}

async function getDeviceTokens(): Promise<string[]> {
  try {
    const supabase = getServiceClient()
    const { data: rows, error } = await supabase
      .from('app_device_tokens')
      .select('token')
      .order('id', { ascending: false })
    if (error) {
      console.warn('[Push] app_device_tokens table check:', error.message)
      return []
    }
    return (rows || []).map((r: any) => r.token).filter(Boolean)
  } catch (err: any) {
    console.error('[Push] getDeviceTokens error:', err?.message || err)
    return []
  }
}

async function sendOneSignal(title: string, body: string, clickUrl: string, channelId: string) {
  const onesignalAppId = process.env.ONESIGNAL_APP_ID
  const onesignalApiKey = process.env.ONESIGNAL_REST_API_KEY
  if (!onesignalAppId || !onesignalApiKey) return

  try {
    const res = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${onesignalApiKey}`,
      },
      body: JSON.stringify({
        app_id: onesignalAppId,
        included_segments: ['Total Subscriptions', 'Subscribed Users'],
        headings: { en: title, hi: title },
        contents: { en: body, hi: body },
        data: { url: clickUrl },
        android_channel_id: channelId,
      }),
    })
    const json = await res.json()
    console.log('[OneSignal Push] Broadcast sent:', json)
  } catch (err: any) {
    console.error('[OneSignal Push] Error:', err?.message || err)
  }
}

async function sendFCM(
  title: string,
  body: string,
  clickUrl: string,
  channelId: string,
  extraData?: Record<string, string>
) {
  const fcmServerKey = process.env.FCM_SERVER_KEY || process.env.FIREBASE_SERVER_KEY
  if (!fcmServerKey) return

  const tokens = await getDeviceTokens()
  if (tokens.length === 0) {
    console.log('[FCM Push] No registered device tokens found.')
    return
  }

  try {
    const fcmPayload = {
      registration_ids: tokens,
      notification: {
        title,
        body,
        sound: 'default',
        android_channel_id: channelId,
      },
      data: { url: clickUrl, ...extraData },
      priority: 'high',
    }
    const fcmRes = await fetch('https://fcm.googleapis.com/fcm/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `key=${fcmServerKey}`,
      },
      body: JSON.stringify(fcmPayload),
    })
    const fcmJson = await fcmRes.json()
    console.log(`[FCM Push] Sent to ${tokens.length} devices:`, fcmJson)
  } catch (err: any) {
    console.error('[FCM Push] Error broadcasting:', err?.message || err)
  }
}

/**
 * Broadcasts push notification to all users when a new COMPLAINT (shikayat) is filed.
 * Automatically delivers immediately if user is online,
 * or queues for delivery once the user connects to the internet.
 */
export async function broadcastComplaintPushNotification(data: ComplaintPushData) {
  const title = `\uD83D\uDEA8 \u0928\u0908 \u0936\u093F\u0915\u093E\u092F\u0924: ${data.category}`
  const body = `\u0935\u093E\u0930\u094D\u0921 08, ${data.mohalla} \u0938\u0947 \u0928\u0908 \u0936\u093F\u0915\u093E\u092F\u0924 \u0926\u0930\u094D\u091C \u0939\u0941\u0908 (${data.code})\u0964 \u0926\u0947\u0916\u0928\u0947 \u0915\u0947 \u0932\u093F\u090F \u091F\u0948\u092A \u0915\u0930\u0947\u0902\u0964`
  const clickUrl = `/s/${data.code}`

  await sendOneSignal(title, body, clickUrl, 'complaints')

  const fcmServerKey = process.env.FCM_SERVER_KEY || process.env.FIREBASE_SERVER_KEY
  if (!fcmServerKey) {
    const tokens = await getDeviceTokens()
    console.log(
      `[FCM Push] Found ${tokens.length} registered APK device tokens. Set FCM_SERVER_KEY or Firebase credentials in .env.local for automatic cloud push delivery.`
    )
    return
  }
  await sendFCM(title, body, clickUrl, 'complaints', { code: data.code })
}

/**
 * Broadcasts push notification to all users when a new DAINIK KARYA (daily activity) is published.
 * Automatically delivers immediately if user is online,
 * or queues for delivery once the user connects to the internet.
 */
export async function broadcastDainikKaryaPushNotification(data: DainikKaryaPushData) {
  const locationPart = data.area ? `, ${data.area}` : ''
  const title = `\uD83D\uDCCB \u0928\u092F\u093E \u0926\u0948\u0928\u093F\u0915 \u0915\u093E\u0930\u094D\u092F: ${data.category}`
  const body = `\u0935\u093E\u0930\u094D\u0921 08${locationPart} \u092E\u0947\u0902 \u0928\u092F\u093E \u0915\u093E\u0930\u094D\u092F \u092A\u094D\u0930\u0915\u093E\u0936\u093F\u0924 \u0939\u0941\u0906: "${data.title}"\u0964 \u0926\u0947\u0916\u0928\u0947 \u0915\u0947 \u0932\u093F\u090F \u091F\u0948\u092A \u0915\u0930\u0947\u0902\u0964`
  const clickUrl = `/dainik-karya`

  await sendOneSignal(title, body, clickUrl, 'dainik-karya')

  const fcmServerKey = process.env.FCM_SERVER_KEY || process.env.FIREBASE_SERVER_KEY
  if (!fcmServerKey) {
    const tokens = await getDeviceTokens()
    console.log(
      `[FCM Push] Found ${tokens.length} registered APK device tokens. Set FCM_SERVER_KEY for dainik karya push delivery.`
    )
    return
  }
  await sendFCM(title, body, clickUrl, 'dainik-karya')
}




