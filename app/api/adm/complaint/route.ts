import { getServiceClient } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { verifyAdminSession } from '@/lib/auth'
import { sendComplaintResolvedEmail } from '@/lib/mailer'

function extractComplainantEmail(record: any): string | null {
  if (record?.email && typeof record.email === 'string' && record.email.includes('@')) {
    return record.email.trim()
  }
  if (record?.detail && typeof record.detail === 'string') {
    const match = record.detail.match(/(?:ईमेल|email)\s*:\s*([^\s\n\r]+@[^\s\n\r]+\.[^\s\n\r]+)/i)
    if (match) return match[1].trim()
    const rawMatch = record.detail.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i)
    if (rawMatch) return rawMatch[1].trim()
  }
  return null
}

function notifyComplainantIfResolved(data: any, status?: string) {
  const currentStatus = status || data?.status
  if (currentStatus === 'काम पूरा' || currentStatus === 'पूरा') {
    const toEmail = extractComplainantEmail(data)
    if (toEmail) {
      console.log(`[AdmComplaint] शिकायत ${data?.code} हल हुई। ईमेल भेजा जा रहा है: ${toEmail}`)
      sendComplaintResolvedEmail({
        code: data.code,
        name: data.name,
        toEmail,
        category: data.category,
        mohalla: data.mohalla,
        detail: data.detail,
        admin_note: data.admin_note,
        after_photo_url: data.after_photo_url,
        photo_url: data.photo_url,
      }).catch(err => console.error('[AdmComplaint] Resolution email error:', err))
    }
  }
}

function extractStoragePath(url: string | null | undefined): string | null {
  if (!url) return null
  const marker = '/photos/'
  const idx = url.indexOf(marker)
  if (idx !== -1) {
    return decodeURIComponent(url.substring(idx + marker.length))
  }
  return null
}

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg', 'image/heic']

export async function POST(req: NextRequest) {
  // ── 1. Enforce Authentication ──
  if (!verifyAdminSession(req)) {
    return NextResponse.json({ error: 'अनधिकृत अनुरोध (Unauthorized)' }, { status: 401 })
  }

  try {
    const contentType = req.headers.get('content-type') || ''
    const supabase = getServiceClient()

    // 2. If multipart/form-data (photo upload + complete)
    if (contentType.includes('multipart/form-data')) {
      const fd = await req.formData()
      const idStr = fd.get('id') as string
      const id = parseInt(idStr, 10)
      const status = (fd.get('status') as string) || 'काम पूरा'
      const admin_note = fd.get('admin_note') as string
      const photo = fd.get('photo') as File | null

      if (!id) return NextResponse.json({ error: 'शिकायत ID आवश्यक है।' }, { status: 400 })

      let after_photo_url: string | null = null

      if (photo && photo.size > 0) {
        if (photo.size > MAX_FILE_SIZE) {
          return NextResponse.json({ error: 'फ़ोटो का साइज़ 10MB से कम होना चाहिए।' }, { status: 400 })
        }
        if (photo.type && !ALLOWED_IMAGE_TYPES.includes(photo.type.toLowerCase())) {
          return NextResponse.json({ error: 'केवल JPG, PNG या WebP फ़ोटो स्वीकार्य हैं।' }, { status: 400 })
        }

        const ext = (photo.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '')
        const safeExt = ['jpg', 'jpeg', 'png', 'webp', 'heic'].includes(ext) ? ext : 'jpg'
        const filename = `after/${id}-${Date.now()}.${safeExt}`
        const buf = Buffer.from(await photo.arrayBuffer())

        const { error: upErr } = await supabase.storage
          .from('photos')
          .upload(filename, buf, { contentType: photo.type || 'image/jpeg', upsert: true })

        if (upErr) {
          console.error('Photo upload error:', upErr)
          return NextResponse.json({ error: 'फ़ोटो अपलोड में समस्या आई।' }, { status: 500 })
        }

        const { data: urlData } = supabase.storage.from('photos').getPublicUrl(filename)
        after_photo_url = urlData.publicUrl
      }

      const updates: Record<string, any> = { status }
      if (after_photo_url) updates.after_photo_url = after_photo_url
      if (admin_note) updates.admin_note = admin_note

      const { data, error } = await supabase
        .from('shikayat')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('Update complaint error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      revalidatePath('/', 'page')
      revalidatePath('/register', 'page')
      revalidatePath('/')
      revalidatePath('/register')
      if (data?.code) {
        revalidatePath(`/s/${data.code.replace('/', '-')}`, 'page')
        revalidatePath(`/s/${data.code.replace('/', '-')}`)
        revalidatePath(`/s/${data.code}`, 'page')
      }

      // Send resolution notification email to citizen if status is काम पूरा
      notifyComplainantIfResolved(data, status)

      return NextResponse.json({ ok: true, data })
    }

    // 3. If application/json (direct status / note update OR delete)
    const body = await req.json()
    const { id, status, admin_note, after_photo_url, action } = body

    if (!id) return NextResponse.json({ error: 'शिकायत ID आवश्यक है।' }, { status: 400 })

    // If removing complaint: Permanently delete row from database
    if (status === 'हटाई' || action === 'delete') {
      const { data: existing } = await supabase
        .from('shikayat')
        .select('code, photo_url, after_photo_url')
        .eq('id', id)
        .single()

      if (existing) {
        const paths = [
          extractStoragePath(existing.photo_url),
          extractStoragePath(existing.after_photo_url),
        ].filter(Boolean) as string[]

        if (paths.length > 0) {
          try {
            await supabase.storage.from('photos').remove(paths)
          } catch (e) {
            console.warn('[AdmComplaint] Storage file cleanup error:', e)
          }
        }
      }

      const { error: delError } = await supabase
        .from('shikayat')
        .delete()
        .eq('id', id)

      if (delError) {
        console.error('Delete complaint error:', delError)
        return NextResponse.json({ error: delError.message }, { status: 500 })
      }

      revalidatePath('/', 'page')
      revalidatePath('/register', 'page')
      revalidatePath('/')
      revalidatePath('/register')
      revalidatePath('/adm')
      if (existing?.code) {
        revalidatePath(`/s/${existing.code.replace('/', '-')}`, 'page')
        revalidatePath(`/s/${existing.code.replace('/', '-')}`)
        revalidatePath(`/s/${existing.code}`, 'page')
      }

      return NextResponse.json({ ok: true, deleted: true, id })
    }

    const updates: Record<string, any> = {}
    if (status) updates.status = status
    if (admin_note !== undefined) updates.admin_note = admin_note
    if (after_photo_url !== undefined) updates.after_photo_url = after_photo_url

    const { data, error } = await supabase
      .from('shikayat')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Update complaint error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    revalidatePath('/', 'page')
    revalidatePath('/register', 'page')
    revalidatePath('/')
    revalidatePath('/register')
    if (data?.code) {
      revalidatePath(`/s/${data.code.replace('/', '-')}`, 'page')
      revalidatePath(`/s/${data.code.replace('/', '-')}`)
      revalidatePath(`/s/${data.code}`, 'page')
    }

    // Send resolution notification email to citizen if status is काम पूरा
    notifyComplainantIfResolved(data, status)

    return NextResponse.json({ ok: true, data })
  } catch (err: any) {
    console.error('Server adm error:', err)
    return NextResponse.json({ error: err.message || 'सर्वर में समस्या आई।' }, { status: 500 })
  }
}

// HTTP DELETE: Permanently delete complaint from database
export async function DELETE(req: NextRequest) {
  if (!verifyAdminSession(req)) {
    return NextResponse.json({ error: 'अनधिकृत अनुरोध (Unauthorized)' }, { status: 401 })
  }

  try {
    const { id } = await req.json()
    if (!id) return NextResponse.json({ error: 'शिकायत ID आवश्यक है।' }, { status: 400 })

    const supabase = getServiceClient()
    const { data: existing } = await supabase
      .from('shikayat')
      .select('code, photo_url, after_photo_url')
      .eq('id', id)
      .single()

    if (existing) {
      const paths = [
        extractStoragePath(existing.photo_url),
        extractStoragePath(existing.after_photo_url),
      ].filter(Boolean) as string[]

      if (paths.length > 0) {
        try {
          await supabase.storage.from('photos').remove(paths)
        } catch {}
      }
    }

    const { error: delError } = await supabase.from('shikayat').delete().eq('id', id)
    if (delError) {
      console.error('Delete complaint error:', delError)
      return NextResponse.json({ error: delError.message }, { status: 500 })
    }

    revalidatePath('/', 'page')
    revalidatePath('/register', 'page')
    revalidatePath('/')
    revalidatePath('/register')
    revalidatePath('/adm')
    if (existing?.code) {
      revalidatePath(`/s/${existing.code.replace('/', '-')}`, 'page')
      revalidatePath(`/s/${existing.code.replace('/', '-')}`)
      revalidatePath(`/s/${existing.code}`, 'page')
    }

    return NextResponse.json({ ok: true, deleted: true, id })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
