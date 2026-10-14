import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const since = searchParams.get('since') // complaint id, 'init', or ISO date
    const sinceKarya = searchParams.get('since_karya') // dainik karya id or 'init'

    const supabase = getServiceClient()

    // 1. Fetch current max IDs for clean baseline initialization
    const { data: topComplaint } = await supabase
      .from('shikayat')
      .select('id')
      .order('id', { ascending: false })
      .limit(1)
    const currentMaxComplaintId = topComplaint && topComplaint[0]?.id ? Number(topComplaint[0].id) : 0

    let currentMaxKaryaId = 0
    try {
      const { data: topKarya } = await supabase
        .from('dainik_karya')
        .select('id')
        .order('id', { ascending: false })
        .limit(1)
      if (topKarya && topKarya[0]?.id) {
        currentMaxKaryaId = Number(topKarya[0].id)
      }
    } catch {}

    // If client is requesting initialization only (on first app launch)
    if (since === 'init' || sinceKarya === 'init') {
      return NextResponse.json({
        items: [],
        karyaItems: [],
        latestComplaintId: currentMaxComplaintId,
        latestKaryaId: currentMaxKaryaId,
      })
    }

    // 2. Check Complaints (शिकायतें)
    let complaints: any[] = []
    if (since && since !== '0') {
      let query = supabase
        .from('shikayat')
        .select('id, code, category, mohalla, created_at')
        .order('id', { ascending: true })
        .limit(10)

      if (/^\d+$/.test(since)) {
        query = query.gt('id', parseInt(since, 10))
      } else {
        query = query.gt('created_at', since)
      }

      const { data, error } = await query
      if (!error && data) {
        complaints = data
      }
    }

    // 3. Check Daily Works (दैनिक कार्य)
    let karyaItems: any[] = []
    if (sinceKarya && sinceKarya !== '0') {
      try {
        let karyaQuery = supabase
          .from('dainik_karya')
          .select('id, title, category, area, created_at')
          .order('id', { ascending: true })
          .limit(10)

        if (/^\d+$/.test(sinceKarya)) {
          karyaQuery = karyaQuery.gt('id', parseInt(sinceKarya, 10))
        }

        const { data, error } = await karyaQuery
        if (!error && data) {
          karyaItems = data
        }
      } catch {}
    }

    return NextResponse.json({
      items: complaints,
      karyaItems,
      latestComplaintId: currentMaxComplaintId,
      latestKaryaId: currentMaxKaryaId,
    })
  } catch (err: any) {
    console.error('[Check Latest Notifications] Error:', err?.message || err)
    return NextResponse.json({
      items: [],
      karyaItems: [],
      latestComplaintId: 0,
      latestKaryaId: 0,
    })
  }
}
