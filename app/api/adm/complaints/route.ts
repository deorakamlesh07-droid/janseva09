import { getServiceClient } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminSession } from '@/lib/auth'

export async function GET(req: NextRequest) {
  // Enforce admin authentication
  if (!verifyAdminSession(req)) {
    return NextResponse.json({ error: 'अनधिकृत अनुरोध (Unauthorized)' }, { status: 401 })
  }

  try {
    const supabase = getServiceClient()
    const { data, error } = await supabase
      .from('shikayat')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching admin complaints:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true, data })
  } catch (err: any) {
    console.error('Admin complaints route error:', err)
    return NextResponse.json({ error: err.message || 'सर्वर में समस्या आई।' }, { status: 500 })
  }
}
