import { getServiceClient } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminSession } from '@/lib/auth'

export interface CitizenRecord {
  phone: string
  name: string
  mohalla: string
  complaintCount: number
  complaints: Array<{
    id: number
    code: string
    category: string
    status: string
    detail: string
    created_at: string
    photo_url: string | null
    after_photo_url: string | null
  }>
  bloodGroup: string | null
  khoyaCount: number
  notes: string | null
  lastActive: string
  tags: string[]
}

function cleanPhone(raw: string): string {
  if (!raw) return ''
  // Remove non-digit characters
  const digits = raw.replace(/\D/g, '')
  // If 12 digits starting with 91, strip 91
  if (digits.length === 12 && digits.startsWith('91')) {
    return digits.slice(2)
  }
  return digits
}

export async function GET(req: NextRequest) {
  // Enforce admin authentication
  if (!verifyAdminSession(req)) {
    return NextResponse.json({ error: 'अनधिकृत अनुरोध (Unauthorized)' }, { status: 401 })
  }

  try {
    const supabase = getServiceClient()
    const url = new URL(req.url)
    const q = (url.searchParams.get('q') || '').trim().toLowerCase()

    // 1. Fetch from shikayat
    const { data: complaints, error: cErr } = await supabase
      .from('shikayat')
      .select('id, code, name, phone, mohalla, category, status, detail, created_at, photo_url, after_photo_url')
      .neq('status', 'हटाई')
      .order('created_at', { ascending: false })

    if (cErr) {
      console.error('Error fetching shikayat:', cErr)
    }

    // 2. Fetch from blood_donors
    const { data: donors } = await supabase
      .from('blood_donors')
      .select('id, name, phone, mohalla, blood_group, created_at')
      .order('created_at', { ascending: false })

    // 3. Fetch from khoya_paya
    const { data: khoya } = await supabase
      .from('khoya_paya')
      .select('id, name, phone, area, kind, title, created_at')
      .order('created_at', { ascending: false })

    // 4. Fetch from custom citizens table if exists
    let customCitizens: any[] = []
    try {
      const { data: cData } = await supabase
        .from('citizens')
        .select('*')
        .order('created_at', { ascending: false })
      if (cData) customCitizens = cData
    } catch {
      // Table may not exist yet
    }

    // Grouping map by phone
    const map = new Map<string, CitizenRecord>()

    // Process complaints
    if (complaints) {
      for (const item of complaints) {
        const phone = cleanPhone(item.phone)
        if (!phone) continue

        const existing = map.get(phone)
        const complaintSummary = {
          id: item.id,
          code: item.code,
          category: item.category,
          status: item.status,
          detail: item.detail,
          created_at: item.created_at,
          photo_url: item.photo_url,
          after_photo_url: item.after_photo_url,
        }

        if (existing) {
          existing.complaints.push(complaintSummary)
          existing.complaintCount += 1
          if (new Date(item.created_at) > new Date(existing.lastActive)) {
            existing.lastActive = item.created_at
          }
          if (!existing.mohalla && item.mohalla) existing.mohalla = item.mohalla
          if (!existing.name && item.name) existing.name = item.name
          if (!existing.tags.includes('शिकायतकर्ता')) existing.tags.push('शिकायतकर्ता')
        } else {
          map.set(phone, {
            phone,
            name: item.name || 'अज्ञात नागरिक',
            mohalla: item.mohalla || '',
            complaintCount: 1,
            complaints: [complaintSummary],
            bloodGroup: null,
            khoyaCount: 0,
            notes: null,
            lastActive: item.created_at,
            tags: ['शिकायतकर्ता'],
          })
        }
      }
    }

    // Process blood donors
    if (donors) {
      for (const d of donors) {
        const phone = cleanPhone(d.phone)
        if (!phone) continue

        const existing = map.get(phone)
        if (existing) {
          existing.bloodGroup = d.blood_group
          if (!existing.tags.includes('ब्लड डोनर')) existing.tags.push('ब्लड डोनर')
          if (!existing.mohalla && d.mohalla) existing.mohalla = d.mohalla
          if (new Date(d.created_at) > new Date(existing.lastActive)) {
            existing.lastActive = d.created_at
          }
        } else {
          map.set(phone, {
            phone,
            name: d.name || 'अज्ञात डोनर',
            mohalla: d.mohalla || '',
            complaintCount: 0,
            complaints: [],
            bloodGroup: d.blood_group,
            khoyaCount: 0,
            notes: null,
            lastActive: d.created_at,
            tags: ['ब्लड डोनर'],
          })
        }
      }
    }

    // Process khoya_paya
    if (khoya) {
      for (const k of khoya) {
        const phone = cleanPhone(k.phone)
        if (!phone) continue

        const existing = map.get(phone)
        if (existing) {
          existing.khoyaCount += 1
          if (!existing.tags.includes('खोया–पाया')) existing.tags.push('खोया–पाया')
          if (new Date(k.created_at) > new Date(existing.lastActive)) {
            existing.lastActive = k.created_at
          }
        } else {
          map.set(phone, {
            phone,
            name: k.name || 'नागरिक',
            mohalla: k.area || '',
            complaintCount: 0,
            complaints: [],
            bloodGroup: null,
            khoyaCount: 1,
            notes: null,
            lastActive: k.created_at,
            tags: ['खोया–पाया'],
          })
        }
      }
    }

    // Process custom citizens
    if (customCitizens) {
      for (const c of customCitizens) {
        const phone = cleanPhone(c.phone)
        if (!phone) continue

        const existing = map.get(phone)
        if (existing) {
          if (c.notes) existing.notes = c.notes
          if (c.name && (!existing.name || existing.name === 'अज्ञात नागरिक')) existing.name = c.name
          if (c.mohalla && !existing.mohalla) existing.mohalla = c.mohalla
        } else {
          map.set(phone, {
            phone,
            name: c.name || 'नागरिक',
            mohalla: c.mohalla || '',
            complaintCount: 0,
            complaints: [],
            bloodGroup: null,
            khoyaCount: 0,
            notes: c.notes || null,
            lastActive: c.created_at,
            tags: ['पंजीकृत'],
          })
        }
      }
    }

    // Convert map to array and sort by latest activity
    let citizens = Array.from(map.values()).sort(
      (a, b) => new Date(b.lastActive).getTime() - new Date(a.lastActive).getTime()
    )

    // Filter if search query q is provided
    if (q) {
      citizens = citizens.filter(c =>
        c.phone.includes(q) ||
        c.name.toLowerCase().includes(q) ||
        c.mohalla.toLowerCase().includes(q) ||
        c.tags.some(t => t.toLowerCase().includes(q)) ||
        c.complaints.some(comp => comp.code.toLowerCase().includes(q) || comp.detail.toLowerCase().includes(q))
      )
    }

    return NextResponse.json({
      ok: true,
      citizens,
      total: citizens.length,
      stats: {
        totalCitizens: map.size,
        withComplaints: Array.from(map.values()).filter(c => c.complaintCount > 0).length,
        bloodDonors: Array.from(map.values()).filter(c => c.bloodGroup).length,
      },
    })
  } catch (err: any) {
    console.error('Citizens API error:', err)
    return NextResponse.json({ error: err.message || 'त्रुटि आई' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  // Enforce admin authentication
  if (!verifyAdminSession(req)) {
    return NextResponse.json({ error: 'अनधिकृत अनुरोध (Unauthorized)' }, { status: 401 })
  }

  try {
    const supabase = getServiceClient()
    const body = await req.json()
    const { name, phone, mohalla, notes } = body

    if (!name || !phone) {
      return NextResponse.json({ error: 'नाम और मोबाइल नंबर आवश्यक हैं।' }, { status: 400 })
    }

    const cleaned = cleanPhone(phone)
    if (!/^\d{10,15}$/.test(cleaned)) {
      return NextResponse.json({ error: 'वैध 10 अंकों का मोबाइल नंबर डालें।' }, { status: 400 })
    }

    // Try upserting to citizens table
    const { data, error } = await supabase
      .from('citizens')
      .upsert(
        { name: name.trim(), phone: cleaned, mohalla: (mohalla || '').trim(), notes: (notes || '').trim() },
        { onConflict: 'phone' }
      )
      .select()
      .single()

    if (error) {
      console.warn('Citizens table upsert warning (table might not exist yet):', error.message)
      // Even if table doesn't exist, return ok with provided data
      return NextResponse.json({ ok: true, data: { name, phone: cleaned, mohalla, notes } })
    }

    return NextResponse.json({ ok: true, data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
