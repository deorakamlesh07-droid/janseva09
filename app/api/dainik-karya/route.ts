import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { verifyAdminSession } from '@/lib/auth'
import { getServiceClient } from '@/lib/supabase'
import { getDainikKaryaList, addDainikKarya } from '@/lib/dainikKarya'
import { broadcastDainikKaryaPushNotification } from '@/lib/push-notifications'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB per photo
const MAX_PHOTOS = 8 // max number of photos per post
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg', 'image/heic']

async function uploadPhoto(supabase: ReturnType<typeof getServiceClient>, photo: File): Promise<string | null> {
  if (photo.size > MAX_FILE_SIZE) return null
  if (photo.type && !ALLOWED_IMAGE_TYPES.includes(photo.type.toLowerCase())) return null

  const ext = (photo.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '')
  const safeExt = ['jpg', 'jpeg', 'png', 'webp', 'heic'].includes(ext) ? ext : 'jpg'
  const filename = `dainik-karya/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${safeExt}`
  const buf = Buffer.from(await photo.arrayBuffer())

  const { error: upErr } = await supabase.storage
    .from('photos')
    .upload(filename, buf, { contentType: photo.type || 'image/jpeg', upsert: true })

  if (upErr) {
    console.error('[API DainikKarya Photo Upload Error]:', upErr)
    return null
  }
  const { data: urlData } = supabase.storage.from('photos').getPublicUrl(filename)
  return urlData.publicUrl
}

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
    let photo_urls: string[] = []

    if (contentType.includes('multipart/form-data')) {
      const fd = await req.formData()
      title = (fd.get('title') as string || '').trim()
      description = (fd.get('description') as string || '').trim()
      work_date = (fd.get('work_date') as string || '').trim()
      area = (fd.get('area') as string || '').trim()
      category = (fd.get('category') as string || 'सफ़ाई कार्य').trim()

      // Support both single `photo` and multiple `photos[]`
      const supabase = getServiceClient()
      const allPhotos: File[] = []

      // Multiple photos submitted as photos[]
      const multiPhotos = fd.getAll('photos[]') as File[]
      for (const f of multiPhotos) {
        if (f && f.size > 0) allPhotos.push(f)
      }
      // Legacy single photo field
      const singlePhoto = fd.get('photo') as File | null
      if (singlePhoto && singlePhoto.size > 0 && allPhotos.length === 0) {
        allPhotos.push(singlePhoto)
      }

      if (allPhotos.length > MAX_PHOTOS) {
        return NextResponse.json(
          { error: `अधिकतम ${MAX_PHOTOS} फ़ोटो अपलोड की जा सकती हैं।` },
          { status: 400 }
        )
      }

      for (const photo of allPhotos) {
        if (photo.size > MAX_FILE_SIZE) {
          return NextResponse.json({ error: 'प्रत्येक फ़ोटो 10MB से छोटी होनी चाहिए।' }, { status: 400 })
        }
        if (photo.type && !ALLOWED_IMAGE_TYPES.includes(photo.type.toLowerCase())) {
          return NextResponse.json({ error: 'केवल JPG, PNG या WebP फ़ोटो स्वीकार्य हैं।' }, { status: 400 })
        }
        const url = await uploadPhoto(supabase, photo)
        if (url) photo_urls.push(url)
      }
    } else {
      const body = await req.json()
      title = (body.title || '').trim()
      description = (body.description || '').trim()
      work_date = (body.work_date || '').trim()
      area = (body.area || '').trim()
      category = (body.category || 'सफ़ाई कार्य').trim()
      if (body.photo_urls && Array.isArray(body.photo_urls)) {
        photo_urls = body.photo_urls
      } else if (body.photo_url) {
        photo_urls = [body.photo_url]
      }
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
      photo_url: photo_urls[0] || null,   // backward compat: first photo
      photo_urls: photo_urls.length > 0 ? photo_urls : null,
    })

    if (!res.ok) {
      return NextResponse.json({ error: res.error || 'कार्य जोड़ने में त्रुटि आई।' }, { status: 500 })
    }

    revalidatePath('/')
    revalidatePath('/dainik-karya')
    revalidatePath('/dainik-karya', 'page')
    revalidatePath('/adm')

    // Send push notification (non-blocking)
    broadcastDainikKaryaPushNotification({ title, category, area: area || null }).catch(err =>
      console.error('[API DainikKarya] Push notification error:', err)
    )

    return NextResponse.json({ ok: true, data: res.data })
  } catch (err: any) {
    console.error('[API DainikKarya POST] Error:', err)
    return NextResponse.json({ error: err.message || 'सर्वर में समस्या आई।' }, { status: 500 })
  }
}



