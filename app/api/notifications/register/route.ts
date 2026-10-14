import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const { token, platform = 'android' } = await req.json()

    if (!token || typeof token !== 'string') {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 })
    }

    const supabase = getServiceClient()

    // Upsert token in app_device_tokens table
    const { error } = await supabase.from('app_device_tokens').upsert(
      {
        token: token.trim(),
        platform: platform || 'android',
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'token' }
    )

    if (error) {
      // If table doesn't exist yet, log warning and gracefully return ok: false with notice
      console.warn('[Notification Register] Supabase upsert notice:', error.message)
      return NextResponse.json({ ok: false, error: error.message }, { status: 200 })
    }

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('[Notification Register] Error:', err?.message || err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
