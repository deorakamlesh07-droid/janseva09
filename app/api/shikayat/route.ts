import { getServiceClient } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { sendComplaintNotificationEmail, sendComplaintCitizenConfirmationEmail } from '@/lib/mailer'
import { broadcastComplaintPushNotification } from '@/lib/push-notifications'

// Increase Vercel serverless timeout to 60s (max on hobby plan) so nodemailer
// has enough time to establish the SMTP connection and send both emails.
export const maxDuration = 60

/** Runs a promise with a timeout — never throws, just logs on failure */
async function sendSafe(label: string, promise: Promise<any>, timeoutMs = 15000) {
  try {
    await Promise.race([
      promise,
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), timeoutMs)),
    ])
  } catch (err: any) {
    console.error(`[Mailer] ${label} failed:`, err?.message || err)
  }
}

/**
 * Generates the next unique complaint code in format: 1 LETTER + 3 DIGITS
 * e.g. J001, J002 ... J999, K001, K002 ... Z999
 * Starting letter: J (for JanSeva). Always checks DB for uniqueness.
 */
async function getNextCode(): Promise<string> {
  const supabase = getServiceClient()

  // Fetch all existing codes that match the new format [A-Z][0-9]{3}
  const { data } = await supabase
    .from('shikayat')
    .select('code')
    .order('id', { ascending: false })

  const existingCodes = new Set((data || []).map((r: any) => r.code))

  // Find codes matching new format
  const newFormatCodes = [...existingCodes].filter(c => /^[A-Z]\d{3}$/.test(c))

  if (newFormatCodes.length === 0) {
    // No new-format codes yet — start fresh from J001
    return 'J001'
  }

  // Parse all new-format codes and find the max
  let maxLetter = 'J'
  let maxNum = 0

  for (const c of newFormatCodes) {
    const letter = c[0]
    const num = parseInt(c.slice(1), 10)
    if (
      letter > maxLetter ||
      (letter === maxLetter && num > maxNum)
    ) {
      maxLetter = letter
      maxNum = num
    }
  }

  // Increment
  if (maxNum < 999) {
    // Same letter, next number
    const nextNum = (maxNum + 1).toString().padStart(3, '0')
    const candidate = `${maxLetter}${nextNum}`
    if (!existingCodes.has(candidate)) return candidate
  }

  // Roll to next letter
  const nextLetter = String.fromCharCode(maxLetter.charCodeAt(0) + 1)
  if (nextLetter > 'Z') {
    // Extremely unlikely — fallback to timestamp-based unique code
    const fallback = `X${Date.now().toString().slice(-3)}`
    return fallback
  }
  const candidate = `${nextLetter}001`
  if (!existingCodes.has(candidate)) return candidate

  // Final safety: scan for first available slot
  for (let l = 'J'.charCodeAt(0); l <= 'Z'.charCodeAt(0); l++) {
    for (let n = 1; n <= 999; n++) {
      const code = `${String.fromCharCode(l)}${n.toString().padStart(3, '0')}`
      if (!existingCodes.has(code)) return code
    }
  }

  // Should never reach here
  return `J${Date.now().toString().slice(-3)}`
}

export async function POST(req: NextRequest) {
  try {
    const fd = await req.formData()
    // honeypot
    if ((fd.get('website') as string || '').length > 0) return NextResponse.json({ ok: true })

    const name = (fd.get('name') as string || '').trim()
    const phone = (fd.get('phone') as string || '').trim()
    const email = (fd.get('email') as string || '').trim().toLowerCase()
    const mohalla = (fd.get('mohalla') as string || '').trim()
    const category = (fd.get('category') as string || 'गली की सफ़ाई').trim()
    const detail = (fd.get('detail') as string || '').trim()
    const allPhotos: File[] = []
    const multiPhotos = fd.getAll('photos[]') as File[]
    for (const f of multiPhotos) {
      if (f && f.size > 0) allPhotos.push(f)
    }
    const singlePhoto = fd.get('photo') as File | null
    if (singlePhoto && singlePhoto.size > 0 && allPhotos.length === 0) {
      allPhotos.push(singlePhoto)
    }

    if (!name || !phone || !email || !mohalla || !detail)
      return NextResponse.json({ error: 'सभी ज़रूरी जानकारी भरिए (ईमेल सहित)।' }, { status: 400 })
    if (!/^\d{10,15}$/.test(phone))
      return NextResponse.json({ error: 'फ़ोन नंबर 10 अंकों का होना चाहिए।' }, { status: 400 })
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return NextResponse.json({ error: 'कृपया सही ईमेल पता दर्ज करें (उदा. name@example.com)।' }, { status: 400 })

    if (allPhotos.length === 0) {
      return NextResponse.json({ error: 'फ़ोटो लगाना अनिवार्य है। कृपया लाइव कैमरे से कम से कम 1 फ़ोटो खींचकर जोड़ें।' }, { status: 400 })
    }

    if (allPhotos.length > 3) {
      return NextResponse.json({ error: 'अधिकतम 3 फ़ोटो अपलोड की जा सकती हैं।' }, { status: 400 })
    }

    const allowedMime = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg', 'image/heic']
    for (const photo of allPhotos) {
      if (photo.size > 10 * 1024 * 1024) {
        return NextResponse.json({ error: 'प्रत्येक फ़ोटो का साइज़ 10MB से कम होना चाहिए।' }, { status: 400 })
      }
      if (photo.type && !allowedMime.includes(photo.type.toLowerCase())) {
        return NextResponse.json({ error: 'केवल JPG, PNG या WebP फ़ोटो स्वीकार्य हैं।' }, { status: 400 })
      }
    }

    const lat = (fd.get('latitude') as string || '').trim()
    const lng = (fd.get('longitude') as string || '').trim()
    const locAddress = (fd.get('location_address') as string || '').trim()

    if (!lat || !lng || isNaN(parseFloat(lat)) || isNaN(parseFloat(lng))) {
      return NextResponse.json(
        { error: 'शिकायत दर्ज करने के लिए वर्तमान लोकेशन (GPS) अनिवार्य है। कृपया लोकेशन अनुमति दें।' },
        { status: 400 }
      )
    }

    const mapsUrl = `https://maps.google.com/?q=${lat},${lng}`
    const fullDetail = `${detail}\n\n📍 सटीक लोकेशन: ${lat}, ${lng} (${mapsUrl})${locAddress ? ` [पहचान: ${locAddress}]` : ''}`

    const supabase = getServiceClient()
    const photo_urls: string[] = []

    for (const photo of allPhotos) {
      const ext = (photo.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '')
      const safeExt = ['jpg', 'jpeg', 'png', 'webp', 'heic'].includes(ext) ? ext : 'jpg'
      const filename = `shikayat/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${safeExt}`
      const buf = Buffer.from(await photo.arrayBuffer())
      const { error: upErr } = await supabase.storage
        .from('photos')
        .upload(filename, buf, { contentType: photo.type || 'image/jpeg', upsert: false })
      if (!upErr) {
        const { data: urlData } = supabase.storage.from('photos').getPublicUrl(filename)
        if (urlData?.publicUrl) {
          photo_urls.push(urlData.publicUrl)
        }
      } else {
        console.error('[Shikayat] Photo upload error:', upErr)
      }
    }

    const photo_url: string | null = photo_urls[0] || null
    const code = await getNextCode()

    // Resilient insert: Try with photo_urls and email column first
    let dbError = null
    const { error: errFull } = await supabase.from('shikayat').insert({
      code,
      name,
      phone,
      email,
      mohalla,
      category,
      detail: fullDetail,
      photo_url,
      photo_urls: photo_urls.length > 0 ? photo_urls : null,
      status: 'दर्ज',
    })

    if (errFull) {
      console.warn('[Shikayat] Insert with photo_urls notice:', errFull.message)
      // Fallback 1: Insert without photo_urls (if column not yet added to Supabase)
      const { error: errWithEmail } = await supabase.from('shikayat').insert({
        code, name, phone, email, mohalla, category, detail: fullDetail, photo_url, status: 'दर्ज',
      })

      if (errWithEmail) {
        console.warn('[Shikayat] Insert with email column notice:', errWithEmail.message)
        // Fallback 2: Insert without email column
        const detailWithEmail = `${fullDetail}\n\n✉️ शिकायतकर्ता ईमेल: ${email}`
        const { error: errFallback } = await supabase.from('shikayat').insert({
          code, name, phone, mohalla, category, detail: detailWithEmail, photo_url, status: 'दर्ज',
        })
        dbError = errFallback
      }
    }

    if (dbError) {
      console.error('[Shikayat] DB insert error:', dbError)
      return NextResponse.json({ error: 'डेटाबेस में समस्या आई।' }, { status: 500 })
    }

    revalidatePath('/')
    revalidatePath('/register')
    revalidatePath('/', 'page')
    revalidatePath('/register', 'page')

    // Await emails before returning response in Vercel serverless
    // Priority: Citizen confirmation with complaint number sent first so the citizen receives it immediately
    if (email) {
      await sendSafe('Citizen confirmation', sendComplaintCitizenConfirmationEmail({
        code,
        name,
        toEmail: email,
        category,
        mohalla,
        detail,
        photo_url,
        photo_urls,
      }), 25000)
    }

    // Admin notification to Sanchalak
    await sendSafe('Sanchalak notification', sendComplaintNotificationEmail({
      code,
      name,
      phone,
      email,
      mohalla,
      category,
      detail: fullDetail,
      photo_url,
      photo_urls,
      latitude: lat || undefined,
      longitude: lng || undefined,
    }), 25000)

    // Push notification to all Android APK users (delivered immediately or when back online)
    await sendSafe('Push notification broadcast', broadcastComplaintPushNotification({
      code,
      category,
      mohalla,
      detail: fullDetail,
    }), 15000)

    return NextResponse.json({ ok: true, code })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'सर्वर में समस्या आई।' }, { status: 500 })
  }
}
