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

export async function generateMetadata({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  const realCode = code.replace('-', '/')
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
  const realCode = code.replace('-', '/')

  let c: Shikayat | null = null
  try {
    const supabase = getServiceClient()
    const publicCols = 'id, code, mohalla, category, detail, photo_url, after_photo_url, status, deadline, admin_note, created_at, updated_at'
    const { data } = await supabase.from('shikayat').select(publicCols).eq('code', realCode).single()
    c = data as Shikayat
  } catch { /* fall through */ }

  if (!c) notFound()

  const curIdx = statusIdx(c.status)
  const shareText = encodeURIComponent(`${c.code} — ${c.detail}\nhttps://janseva09.in/s/${code}`)

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

        {c.photo_url && (
          <div className="single">
            <img src={c.photo_url} alt="" />
          </div>
        )}

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
          <div style={{ marginTop: 12, padding: '12px 14px', background: 'var(--surface)', borderRadius: 9, fontSize: 14, color: 'var(--ink2)' }}>
            <b style={{ color: 'var(--ink)', display: 'block', marginBottom: 4 }}>जनसेवा टीम की टिप्पणी</b>
            {c.admin_note}
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
