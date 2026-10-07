import { getServiceClient } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const fd = await req.formData()
    if ((fd.get('website') as string || '').length > 0) return NextResponse.json({ ok: true })

    const kind = (fd.get('kind') as string || 'खोया').trim()
    const area = (fd.get('area') as string || '').trim()
    const title = (fd.get('title') as string || '').trim()
    const detail = (fd.get('detail') as string || '').trim()
    const name = (fd.get('name') as string || '').trim()
    const phone = (fd.get('phone') as string || '').trim()
    const photo = fd.get('photo') as File | null

    if (!title || !detail || !phone)
      return NextResponse.json({ error: 'ज़रूरी जानकारी भरिए।' }, { status: 400 })

    const supabase = getServiceClient()
    let photo_url: string | null = null

    if (photo && photo.size > 0) {
      const ext = (photo.name.split('.').pop() || 'jpg').toLowerCase()
      const filename = `khoya/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
      const buf = Buffer.from(await photo.arrayBuffer())
      const { error: upErr } = await supabase.storage
        .from('photos').upload(filename, buf, { contentType: photo.type, upsert: false })
      if (!upErr) {
        const { data } = supabase.storage.from('photos').getPublicUrl(filename)
        photo_url = data.publicUrl
      }
    }

    const { error } = await supabase.from('khoya_paya').insert({
      kind, area: area || null, title, detail, name: name || null, phone, photo_url,
    })
    if (error) return NextResponse.json({ error: 'डेटाबेस में समस्या।' }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'सर्वर में समस्या।' }, { status: 500 })
  }
}
