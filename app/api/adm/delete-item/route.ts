import { getServiceClient } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { verifyAdminSession } from '@/lib/auth'

export async function POST(req: NextRequest) {
  // ── 1. Enforce Authentication ──
  if (!verifyAdminSession(req)) {
    return NextResponse.json({ error: 'अनधिकृत अनुरोध (Unauthorized)' }, { status: 401 })
  }

  try {
    const { table, id } = await req.json()
    if (!table || !id || (table !== 'khoya_paya' && table !== 'blood_donors')) {
      return NextResponse.json({ error: 'अमान्य अनुरोध' }, { status: 400 })
    }

    const supabase = getServiceClient()
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
