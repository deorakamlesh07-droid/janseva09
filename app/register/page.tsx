import { getServiceClient, Shikayat } from '@/lib/supabase'
import { Suspense } from 'react'
import RegisterFilters from './RegisterFilters'

function statusLabel(s: string) {
  if (s === 'काम पूरा' || s === 'पूरा') return 'done'
  if (s === 'काम चालू') return 'wip'
  if (s === 'स्वीकृत') return 'approved'
  if (s === 'निगम को भेजा') return 'sent'
  if (s === 'हटाई') return 'removed'
  return ''
}

function formatDeadline(dl: string | null, status: string) {
  if (status === 'काम पूरा' || status === 'पूरा') return null
  if (!dl) return <span className="dl"><s>तारीख़</s><b>लगनी बाक़ी</b></span>
  const d = new Date(dl)
  const over = d < new Date()
  const label = d.toLocaleDateString('hi-IN', { day: 'numeric', month: 'long' })
  return <span className={`dl${over ? ' over' : ''}`}><s>तय तारीख़</s><b>{label}</b></span>
}

const PAGE_SIZE = 12

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const metadata = { title: 'शिकायतें — जनसेवा 09' }

export default async function Register({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; f?: string; p?: string; c?: string; d?: string }>
}) {
  const sp = await searchParams
  const q = (sp.q || '').trim()
  const f = sp.f || ''
  const c = sp.c || ''       // category filter
  const d = sp.d || ''       // date filter (YYYY-MM-DD)
  const page = Math.max(1, parseInt(sp.p || '1', 10))

  let complaints: Shikayat[] = []
  let total = 0
  let received = 0, registered = 0, removed = 0

  try {
    const supabase = getServiceClient()
    const publicColumns = 'id, code, mohalla, category, detail, photo_url, after_photo_url, status, deadline, admin_note, created_at, updated_at'
    let query = supabase.from('shikayat').select(publicColumns, { count: 'exact' }).neq('status', 'हटाई')
    if (q) query = query.or(`code.ilike.%${q}%,mohalla.ilike.%${q}%,detail.ilike.%${q}%`)
    if (f === 'काम पूरा' || f === 'पूरा') {
      query = query.in('status', ['काम पूरा', 'पूरा'])
    } else if (f) {
      query = query.eq('status', f)
    }
    // Category filter
    if (c) {
      query = query.eq('category', c)
    }
    // Date filter — match complaints created on a specific date in IST (UTC+05:30)
    if (d) {
      const startOfDay = new Date(`${d}T00:00:00+05:30`).toISOString()
      const endOfDay = new Date(`${d}T23:59:59.999+05:30`).toISOString()
      query = query.gte('created_at', startOfDay).lte('created_at', endOfDay)
    }
    const from = (page - 1) * PAGE_SIZE
    const { data, count } = await query.order('created_at', { ascending: false }).range(from, from + PAGE_SIZE - 1)
    complaints = (data as Shikayat[]) || []
    total = count || 0

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const { data: modData } = await supabase.from('shikayat').select('status, created_at').gte('created_at', thirtyDaysAgo)
    received = modData?.length || 0
    registered = modData?.filter(d => d.status !== 'हटाई').length || 0
    removed = modData?.filter(d => d.status === 'हटाई').length || 0
  } catch { /* show empty state */ }

  const totalPages = Math.ceil(total / PAGE_SIZE)
  const pending = Math.max(0, received - registered - removed)

  function buildUrl(overrides: Record<string, string>) {
    const params = new URLSearchParams()
    if (q) params.set('q', q)
    if (f) params.set('f', f)
    if (c) params.set('c', c)
    if (d) params.set('d', d)
    const pVal = overrides.p !== undefined ? overrides.p : String(page)
    if (pVal && pVal !== '1') params.set('p', pVal)
    const ps = params.toString()
    return `/register${ps ? '?' + ps : ''}`
  }

  const hasFilters = !!(q || f || c || d)

  return (
    <section className="sec">
      <div className="wrap">
        <h2 className="sh">शिकायतें</h2>
        <p className="sp">वार्ड 09 की सारी शिकायतें — जो हुईं और जो नहीं हुईं</p>

        <form className="rsearch" method="get" action="/register">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" />
          </svg>
          <input name="q" defaultValue={q} placeholder="शिकायत कोड, मोहल्ला या बात लिखकर खोजिए" />
          {f && <input type="hidden" name="f" value={f} />}
          {c && <input type="hidden" name="c" value={c} />}
          {d && <input type="hidden" name="d" value={d} />}
        </form>

        <Suspense fallback={
          <div className="filters">
            <span className="chip" aria-pressed="true">सब</span>
            <span className="chip">काम पूरा</span>
            <span className="chip">काम चालू</span>
            <span className="chip">स्वीकृत</span>
            <span className="chip">नई</span>
          </div>
        }>
          <RegisterFilters
            currentFilter={f}
            currentCategory={c}
            currentDate={d}
            currentQuery={q}
          />
        </Suspense>

        {/* Result count */}
        <div className="result-count">
          <span>{total} शिकायत{total !== 1 ? 'ें' : ''} मिलीं</span>
        </div>

        <div className="cards">
          {complaints.length > 0 ? (
            complaints.map(c => (
              <a className="card" key={c.id} href={`/s/${c.code.replace('/', '-')}`}>
                <div className="shot">
                  {c.photo_url && <img className="shotimg" src={c.photo_url} alt="" loading="lazy" />}
                </div>
                <div className="cb">
                  <div className="crow">
                    <span className="no">{c.code}</span>
                    <span className={`pill ${statusLabel(c.status)}`}>{c.status}</span>
                  </div>
                  <p>{c.detail}</p>
                  <div className="card-meta">
                    <span className="cat-badge">{c.category}</span>
                    <span className="card-mohalla">{c.mohalla}</span>
                  </div>
                  <div className="card-date">
                    📅 {new Date(c.created_at).toLocaleDateString('hi-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </div>
                  {formatDeadline(c.deadline, c.status)}
                </div>
              </a>
            ))
          ) : (
            <div className="empty" style={{ gridColumn: '1/-1' }}>
              <b>{hasFilters ? 'कोई शिकायत नहीं मिली' : 'अभी कोई शिकायत नहीं'}</b>
              <p>{hasFilters ? 'खोज या फ़िल्टर बदलिए।' : 'पहली शिकायत दर्ज कीजिए।'}</p>
            </div>
          )}
        </div>

        <div className="modline">
          <b>पिछले 30 दिन में जाँच का हिसाब</b>
          <span>{received} आईं · {registered} रजिस्टर में लीं · {removed} हटाईं · {pending} जाँचनी बाक़ी</span>
          <em>हर शिकायत जाँच के बाद ही रजिस्टर में आती है — सिर्फ़ फ़र्ज़ी, दोहरी और वार्ड से बाहर वाली हटाई जाती हैं। हटाई गई शिकायत का कोड डालकर उसका कारण देखा जा सकता है।</em>
        </div>

        {totalPages > 1 && (
          <div className="pagernav">
            {page > 1 ? <a href={buildUrl({ p: String(page - 1) })}>पिछला</a> : <span>पिछला</span>}
            <span>{page} / {totalPages}</span>
            {page < totalPages ? <a href={buildUrl({ p: String(page + 1) })}>अगला</a> : <span>अगला</span>}
          </div>
        )}
      </div>
    </section>
  )
}
