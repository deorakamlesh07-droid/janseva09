import { supabase, getServiceClient, Shikayat } from '@/lib/supabase'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const TIMELINE = ['दर्ज', 'स्वीकृत', 'काम चालू', 'काम पूरा']

function statusIdx(s: string) {
  if (s === 'काम पूरा' || s === 'पूरा') return 3
  if (s === 'काम चालू') return 2
  if (s === 'स्वीकृत' || s === 'देखा' || s === 'निगम को भेजा') return 1
  return 0
}
function formatDate(d: string) {
  return new Date(d).toLocaleDateString('hi-IN', { day: 'numeric', month: 'long' })
}

/** Resolves URL slug to DB code — handles both new format (J001) and legacy (09-N → 09/N) */
function resolveCode(slug: string): string {
  // New format: single letter + 3 digits — no conversion needed
  if (/^[A-Z]\d{3}$/.test(slug)) return slug
  // Legacy format: 09-1 → 09/1
  return slug.replace('-', '/')
}

export async function generateMetadata({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  const realCode = resolveCode(code)
  try {
    const supabase = getServiceClient()
    const { data } = await supabase.from('shikayat').select('detail').eq('code', realCode).single()
    return { title: `${realCode} — ${(data?.detail || '').slice(0, 60)} — जनसेवा 09` }
  } catch {
    return { title: `${realCode} — जनसेवा 09` }
  }
}

export default async function ShikayatDetail({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  const realCode = resolveCode(code)

  let c: Shikayat | null = null
  try {
    const supabase = getServiceClient()
    const publicColsWith = 'id, code, mohalla, category, detail, photo_url, photo_urls, after_photo_url, status, deadline, admin_note, created_at, updated_at'
    const { data, error } = await supabase.from('shikayat').select(publicColsWith).eq('code', realCode).single()
    if (error) {
      // Fallback: If photo_urls column is not in DB yet, query standard columns
      const publicColsFallback = 'id, code, mohalla, category, detail, photo_url, after_photo_url, status, deadline, admin_note, created_at, updated_at'
      const { data: fbData } = await supabase.from('shikayat').select(publicColsFallback).eq('code', realCode).single()
      c = fbData as Shikayat
    } else {
      c = data as Shikayat
    }
  } catch (err) {
    console.error('[ShikayatDetail] Error loading complaint:', err)
  }

  if (!c) notFound()

  const curIdx = statusIdx(c.status)
  const appBaseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://janseva09.vercel.app'
  const shareText = encodeURIComponent(`${c.code} — ${c.detail}\n${appBaseUrl}/s/${code}`)

  function pillClass(s: string) {
    if (s === 'काम पूरा' || s === 'पूरा') return 'done'
    if (s === 'काम चालू') return 'wip'
    if (s === 'स्वीकृत') return 'approved'
    if (s === 'निगम को भेजा') return 'sent'
    return ''
  }

  return (
    <section className="sec">
      <div className="wrap detail">
        <a className="backlink" href="/register">← शिकायतें</a>

        {/* Complaint photos: show up to 3 in a grid */}
        {(() => {
          const pics: string[] = c!.photo_urls && c!.photo_urls.length > 0 ? c!.photo_urls : c!.photo_url ? [c!.photo_url] : []
          if (pics.length === 0) return null
          if (pics.length === 1) {
            return (
              <div className="single">
                <img src={pics[0]} alt="" />
              </div>
            )
          }
          return (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10, marginBottom: 4 }}>
              {pics.map((p, i) => (
                <div key={i} style={{ borderRadius: 10, overflow: 'hidden', border: '1.5px solid var(--line)', aspectRatio: '4/3' }}>
                  <img src={p} alt={`फ़ोटो ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                </div>
              ))}
            </div>
          )
        })()}

        {(c.status === 'काम पूरा' || c.status === 'पूरा') && c.after_photo_url && (
          <div className="single" style={{ marginTop: 12 }}>
            <img src={c.after_photo_url} alt="काम के बाद" />
          </div>
        )}

        <div style={{ marginTop: 14 }}>
          <span className={`pill ${pillClass(c.status)}`}>{c.status}</span>
        </div>

        <h2 className="sh" style={{ fontSize: 21, marginTop: 8 }}>{c.detail}</h2>
        <div className="mt">{c.code} · {c.mohalla} · {c.category}</div>

        {c.admin_note && (
          <div style={{
            marginTop: 14,
            padding: '14px 18px',
            background: '#F0FDF4',
            border: '1.5px solid #86EFAC',
            borderRadius: 12,
            boxShadow: '0 2px 6px rgba(16, 185, 129, 0.08)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <span style={{ fontSize: 16 }}>💬</span>
              <b style={{ color: '#166534', fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                संचालक / जनसेवा टीम का विवरण
              </b>
            </div>
            <p style={{ margin: 0, fontSize: 14.5, color: '#14532D', lineHeight: 1.55, fontWeight: 500 }}>
              {c.admin_note}
            </p>
          </div>
        )}

        <div className="tl">
          {TIMELINE.map((step, i) => {
            const isCompleted = c!.status === 'काम पूरा' || c!.status === 'पूरा'
            let cls = 'wait'
            if (isCompleted) {
              cls = 'done' // all steps green when work is fully done
            } else if (i < curIdx) cls = 'done'
            else if (i === curIdx) cls = 'now'
            let dateLabel = '—'
            if (step === 'दर्ज') dateLabel = formatDate(c!.created_at)
            if (isCompleted && step === 'काम पूरा' && c!.updated_at) dateLabel = formatDate(c!.updated_at)
            return (
              <div key={step} className={`tl-i ${cls}`}>
                <div className="dot" />
                <div>
                  <div className="tl-t">{step}</div>
                  <div className="tl-d">{dateLabel}</div>
                </div>
              </div>
            )
          })}
        </div>

        {c.deadline && c.status !== 'काम पूरा' && c.status !== 'पूरा' && (
          <div style={{ marginTop: 12 }}>
            <span className={`dl${new Date(c.deadline) < new Date() ? ' over' : ''}`}>
              <s>तय तारीख़</s><b>{formatDate(c.deadline)}</b>
            </span>
          </div>
        )}

        <div className="sharebar">
          <a className="wa" href={`https://wa.me/?text=${shareText}`} target="_blank" rel="noopener">
            WhatsApp पर भेजिए
          </a>
          <a href="/register">बाक़ी शिकायतें</a>
        </div>
      </div>
    </section>
  )
}
