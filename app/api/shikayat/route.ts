import { getServiceClient } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { sendComplaintNotificationEmail } from '@/lib/mailer'

async function getNextCode(): Promise<string> {
  const supabase = getServiceClient()
  const { data } = await supabase
    .from('shikayat')
    .select('code')
    .order('id', { ascending: false })
    .limit(1)
  if (!data || data.length === 0) return '09/1'
  const last = parseInt(data[0].code.split('/')[1], 10) || 0
  return `09/${last + 1}`
}

export async function POST(req: NextRequest) {
  try {
    const fd = await req.formData()
    // honeypot
    if ((fd.get('website') as string || '').length > 0) return NextResponse.json({ ok: true })

    const name = (fd.get('name') as string || '').trim()
    const phone = (fd.get('phone') as string || '').trim()
    const mohalla = (fd.get('mohalla') as string || '').trim()
    const category = (fd.get('category') as string || 'गली की सफ़ाई').trim()
    const detail = (fd.get('detail') as string || '').trim()
    const photo = fd.get('photo') as File | null

    if (!name || !phone || !mohalla || !detail)
      return NextResponse.json({ error: 'सभी ज़रूरी जानकारी भरिए।' }, { status: 400 })
    if (!/^\d{10,15}$/.test(phone))
      return NextResponse.json({ error: 'फ़ोन नंबर 10 अंकों का होना चाहिए।' }, { status: 400 })

    if (!photo || photo.size === 0) {
      return NextResponse.json({ error: 'फ़ोटो लगाना अनिवार्य है। बिना फ़ोटो के शिकायत दर्ज नहीं हो सकती।' }, { status: 400 })
    }

    if (photo.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'फ़ोटो का साइज़ 10MB से कम होना चाहिए।' }, { status: 400 })
    }

    const allowedMime = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg', 'image/heic']
    if (photo.type && !allowedMime.includes(photo.type.toLowerCase())) {
      return NextResponse.json({ error: 'केवल JPG, PNG या WebP फ़ोटो स्वीकार्य हैं।' }, { status: 400 })
    }

    const lat = (fd.get('latitude') as string || '').trim()
    const lng = (fd.get('longitude') as string || '').trim()
    const locAddress = (fd.get('location_address') as string || '').trim()

    let fullDetail = detail
    if (lat && lng) {
      const mapsUrl = `https://maps.google.com/?q=${lat},${lng}`
      fullDetail = `${detail}\n\n📍 सटीक लोकेशन: ${lat}, ${lng} (${mapsUrl})${locAddress ? ` [पहचान: ${locAddress}]` : ''}`
    }

    const supabase = getServiceClient()
    let photo_url: string | null = null

    if (photo && photo.size > 0) {
      const ext = (photo.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '')
      const safeExt = ['jpg', 'jpeg', 'png', 'webp', 'heic'].includes(ext) ? ext : 'jpg'
      const filename = `shikayat/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${safeExt}`
      const buf = Buffer.from(await photo.arrayBuffer())
      const { error: upErr } = await supabase.storage
        .from('photos')
        .upload(filename, buf, { contentType: photo.type || 'image/jpeg', upsert: false })
      if (!upErr) {
        const { data: urlData } = supabase.storage.from('photos').getPublicUrl(filename)
        photo_url = urlData.publicUrl
      }
    }

    const code = await getNextCode()
    const { error } = await supabase.from('shikayat').insert({
      code, name, phone, mohalla, category, detail: fullDetail, photo_url, status: 'दर्ज',
    })
    if (error) return NextResponse.json({ error: 'डेटाबेस में समस्या आई।' }, { status: 500 })

    revalidatePath('/')
    revalidatePath('/register')
    revalidatePath('/', 'page')
    revalidatePath('/register', 'page')

    // Asynchronously send email notification to Sanchalak (never blocks user response)
    sendComplaintNotificationEmail({
      code,
      name,
      phone,
      mohalla,
      category,
      detail: fullDetail,
      photo_url,
      latitude: lat || undefined,
      longitude: lng || undefined,
    }).catch(err => console.error('[Mailer] Background error:', err))

    return NextResponse.json({ ok: true, code })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'सर्वर में समस्या आई।' }, { status: 500 })
  }
}
