import { getServiceClient } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { verifyAdminSession } from '@/lib/auth'
import { removeDainikKarya } from '@/lib/dainikKarya'

export async function POST(req: NextRequest) {
  // ── 1. Enforce Authentication ──
  if (!verifyAdminSession(req)) {
    return NextResponse.json({ error: 'अनधिकृत अनुरोध (Unauthorized)' }, { status: 401 })
  }

  try {
    const { table, id } = await req.json()
    const allowed = ['khoya_paya', 'blood_donors', 'dainik_karya', 'shikayat']
    if (!table || !id || !allowed.includes(table)) {
      return NextResponse.json({ error: 'अमान्य अनुरोध' }, { status: 400 })
    }

    if (table === 'dainik_karya') {
      const res = await removeDainikKarya(Number(id))
      revalidatePath('/dainik-karya')
      revalidatePath('/dainik-karya', 'page')
      revalidatePath('/')
      revalidatePath('/adm')
      return NextResponse.json({ ok: res.ok })
    }

    const supabase = getServiceClient()

    if (table === 'shikayat') {
      const { data: existing } = await supabase
        .from('shikayat')
        .select('code, photo_url, after_photo_url')
        .eq('id', id)
        .single()

      if (existing) {
        const marker = '/photos/'
        const extractPath = (u: string | null) => {
          if (!u) return null
          const idx = u.indexOf(marker)
          return idx !== -1 ? decodeURIComponent(u.substring(idx + marker.length)) : null
        }
        const paths = [extractPath(existing.photo_url), extractPath(existing.after_photo_url)].filter(Boolean) as string[]
        if (paths.length > 0) {
          try {
            await supabase.storage.from('photos').remove(paths)
          } catch {}
        }
      }

      const { error } = await supabase.from('shikayat').delete().eq('id', id)
      if (error) {
        console.error('Delete error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      revalidatePath('/')
      revalidatePath('/register')
      revalidatePath('/adm')
      if (existing?.code) {
        revalidatePath(`/s/${existing.code.replace('/', '-')}`)
      }
      return NextResponse.json({ ok: true })
    }

    const { error } = await supabase.from(table).delete().eq('id', id)

    if (error) {
      console.error('Delete error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (table === 'khoya_paya') revalidatePath('/khoya')
    if (table === 'blood_donors') revalidatePath('/blood')

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
