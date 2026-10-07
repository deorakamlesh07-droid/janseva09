import { getServiceClient } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const fd = await req.formData()
    if ((fd.get('website') as string || '').length > 0) return NextResponse.json({ ok: true })

    const what = (fd.get('what') as string || '').trim()
    const phone = (fd.get('phone') as string || '').trim()
    if (!phone) return NextResponse.json({ error: 'फ़ोन नंबर ज़रूरी है।' }, { status: 400 })

    const supabase = getServiceClient()

    if (what === 'donor') {
      const name = (fd.get('name') as string || '').trim()
      const blood = (fd.get('blood') as string || '').trim()
      const mohalla = (fd.get('mohalla') as string || '').trim()
      const consent = fd.get('consent')
      if (!name || !blood || !consent)
        return NextResponse.json({ error: 'नाम, ब्लड ग्रुप और सहमति ज़रूरी है।' }, { status: 400 })
      const { error } = await supabase.from('blood_donors').insert({ name, blood_group: blood, mohalla: mohalla || null, phone })
      if (error) return NextResponse.json({ error: 'डेटाबेस में समस्या।' }, { status: 500 })
      return NextResponse.json({ ok: true })
    }

    if (what === 'need') {
      const blood = (fd.get('blood') as string || '').trim()
      const name = (fd.get('name') as string || '').trim()
      const detail = (fd.get('detail') as string || '').trim()
      const { error } = await supabase.from('blood_requests').insert({
        blood_group: blood, name: name || null, phone, detail: detail || null,
      })
      if (error) return NextResponse.json({ error: 'डेटाबेस में समस्या।' }, { status: 500 })
      return NextResponse.json({ ok: true })
    }

    return NextResponse.json({ error: 'अनजान अनुरोध।' }, { status: 400 })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'सर्वर में समस्या।' }, { status: 500 })
  }
}
