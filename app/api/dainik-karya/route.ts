import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { verifyAdminSession } from '@/lib/auth'
import { getServiceClient } from '@/lib/supabase'
import { getDainikKaryaList, addDainikKarya } from '@/lib/dainikKarya'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg', 'image/heic']

// Public GET: Fetch daily activities
export async function GET(req: NextRequest) {
  try {
    const list = await getDainikKaryaList()
    return NextResponse.json({ ok: true, data: list })
  } catch (err: any) {
    console.error('[API DainikKarya GET] Error:', err)
    return NextResponse.json({ error: 'दैनिक कार्य लोड करने में समस्या आई।' }, { status: 500 })
  }
}

// Sanchalak POST: Publish new daily activity
export async function POST(req: NextRequest) {
  // 1. Enforce admin auth
  if (!verifyAdminSession(req)) {
    return NextResponse.json({ error: 'अनधिकृत अनुरोध (Unauthorized)' }, { status: 401 })
  }

  try {
    const contentType = req.headers.get('content-type') || ''
    let title = ''
    let description = ''
    let work_date = ''
    let area = ''
    let category = 'सफ़ाई कार्य'
    let photo_url: string | null = null

    if (contentType.includes('multipart/form-data')) {
      const fd = await req.formData()
      title = (fd.get('title') as string || '').trim()
      description = (fd.get('description') as string || '').trim()
      work_date = (fd.get('work_date') as string || '').trim()
      area = (fd.get('area') as string || '').trim()
      category = (fd.get('category') as string || 'सफ़ाई कार्य').trim()
      const photo = fd.get('photo') as File | null

      if (photo && photo.size > 0) {
        if (photo.size > MAX_FILE_SIZE) {
          return NextResponse.json({ error: 'फ़ोटो 10MB से छोटी होनी चाहिए।' }, { status: 400 })
        }
        if (photo.type && !ALLOWED_IMAGE_TYPES.includes(photo.type.toLowerCase())) {
          return NextResponse.json({ error: 'केवल JPG, PNG या WebP फ़ोटो स्वीकार्य हैं।' }, { status: 400 })
        }

        const supabase = getServiceClient()
        const ext = (photo.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '')
        const safeExt = ['jpg', 'jpeg', 'png', 'webp', 'heic'].includes(ext) ? ext : 'jpg'
        const filename = `dainik-karya/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${safeExt}`
        const buf = Buffer.from(await photo.arrayBuffer())

        const { error: upErr } = await supabase.storage
          .from('photos')
          .upload(filename, buf, { contentType: photo.type || 'image/jpeg', upsert: true })

        if (!upErr) {
          const { data: urlData } = supabase.storage.from('photos').getPublicUrl(filename)
          photo_url = urlData.publicUrl
        } else {
          console.error('[API DainikKarya Photo Upload Error]:', upErr)
        }
      }
    } else {
      const body = await req.json()
      title = (body.title || '').trim()
      description = (body.description || '').trim()
      work_date = (body.work_date || '').trim()
      area = (body.area || '').trim()
      category = (body.category || 'सफ़ाई कार्य').trim()
      photo_url = body.photo_url || null
    }

    if (!title || !description) {
      return NextResponse.json({ error: 'कार्य का शीर्षक और विवरण आवश्यक हैं।' }, { status: 400 })
    }

    if (!work_date) {
      work_date = new Date().toISOString().slice(0, 10)
    }

    const res = await addDainikKarya({
      title,
      description,
      work_date,
      area: area || null,
      category,
      photo_url,
    })

    if (!res.ok) {
      return NextResponse.json({ error: res.error || 'कार्य जोड़ने में त्रुटि आई।' }, { status: 500 })
    }

    revalidatePath('/')
    revalidatePath('/dainik-karya')
    revalidatePath('/dainik-karya', 'page')
    revalidatePath('/adm')

    return NextResponse.json({ ok: true, data: res.data })
  } catch (err: any) {
    console.error('[API DainikKarya POST] Error:', err)
    return NextResponse.json({ error: err.message || 'सर्वर में समस्या आई।' }, { status: 500 })
  }
}
