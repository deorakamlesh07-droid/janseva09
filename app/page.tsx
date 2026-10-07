import { getServiceClient, Shikayat } from '@/lib/supabase'

export const dynamic = 'force-dynamic'
export const revalidate = 0

// ── Data fetching (all original logic preserved) ───────────────────────────
async function getStats() {
  try {
    const supabase = getServiceClient()
    const { data } = await supabase.from('shikayat').select('status, deadline')
    if (!data) return { total: 0, done: 0, avg: '—', overdue: 0, pending: 0 }
    const total = data.length
    const done = data.filter(d => d.status === 'काम पूरा' || d.status === 'पूरा').length
    const overdue = data.filter(d => d.deadline && new Date(d.deadline) < new Date() && d.status !== 'काम पूरा' && d.status !== 'पूरा').length
    const pending = data.filter(d => d.status === 'दर्ज').length
    return { total, done, avg: '—', overdue, pending }
  } catch {
    return { total: 0, done: 0, avg: '—', overdue: 0, pending: 0 }
  }
}

async function getRecentComplaints() {
  const publicCols = 'id, code, mohalla, category, detail, photo_url, after_photo_url, status, deadline, admin_note, created_at, updated_at'
  try {
    const supabase = getServiceClient()
    const { data } = await supabase
      .from('shikayat')
      .select(publicCols)
      .neq('status', 'हटाई')
      .order('updated_at', { ascending: false, nullsFirst: false })
      .limit(3)
    return data as Shikayat[] | null
  } catch {
    // fallback: order by created_at
    try {
      const supabase = getServiceClient()
      const { data } = await supabase
        .from('shikayat')
        .select(publicCols)
        .neq('status', 'हटाई')
        .order('created_at', { ascending: false })
        .limit(3)
      return data as Shikayat[] | null
    } catch {
      return null
    }
  }
}

function statusLabel(s: string) {
  if (s === 'काम पूरा' || s === 'पूरा') return 'done'
  if (s === 'काम चालू') return 'wip'
  if (s === 'स्वीकृत') return 'approved'
  if (s === 'निगम को भेजा') return 'sent'
  return ''
}

function formatDeadline(dl: string | null, status: string, updatedAt?: string | null) {
  if (status === 'काम पूरा' || status === 'पूरा') {
    // Show completion date in green
    const src = updatedAt || dl
    if (src) {
      const d = new Date(src)
      const label = d.toLocaleDateString('hi-IN', { day: 'numeric', month: 'long', year: 'numeric' })
      return <span className="dl done-date"><s>पूरा हुआ</s><b>{label}</b></span>
    }
    return <span className="dl done-date"><b>✓ काम पूरा</b></span>
  }
  if (!dl) return <span className="dl"><s>तारीख़</s><b>लगनी बाक़ी</b></span>
  const d = new Date(dl)
  const over = d < new Date()
  const label = d.toLocaleDateString('hi-IN', { day: 'numeric', month: 'long' })
  return <span className={`dl${over ? ' over' : ''}`}><s>तय तारीख़</s><b>{label}</b></span>
}

// ── Service categories ─────────────────────────────────────────────────────
const SERVICE_CATS = [
  {
    label: 'सड़क',
    href: '/new?cat=सड़क',
    bg: '#FFF3E8',
    color: '#D95A1E',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19L8 5M16 5l4 14M12 7v3M12 14v3" />
      </svg>
    ),
  },
  {
    label: 'पानी',
    href: '/new?cat=पानी',
    bg: '#EAF4FD',
    color: '#1A73E8',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3s6 6.4 6 10.2A6 6 0 0 1 6 13.2C6 9.4 12 3 12 3Z" />
      </svg>
    ),
  },
  {
    label: 'स्ट्रीट लाइट',
    href: '/new?cat=स्ट्रीट लाइट',
    bg: '#FEF8E7',
    color: '#D48806',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2v4M12 18v-4a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM9 18h6" />
      </svg>
    ),
  },
  {
    label: 'कचरा',
    href: '/new?cat=कचरा',
    bg: '#EBF7EE',
    color: '#237804',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 6h18M19 6l-1 14H6L5 6M10 11v6M14 11v6M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
      </svg>
    ),
  },
  {
    label: 'सफाई',
    href: '/new?cat=सफाई',
    bg: '#E6F7FF',
    color: '#08979C',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 20l4.6-4.6a2 2 0 0 1 2.8 0L15 20M20 12l-2-2" />
      </svg>
    ),
  },
  {
    label: 'नाली',
    href: '/new?cat=नाली',
    bg: '#F5EEFC',
    color: '#722ED1',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 17l4-8h10l4 8M7 13h10" />
      </svg>
    ),
  },
  {
    label: 'सीवरेज',
    href: '/new?cat=सीवरेज',
    bg: '#E6FFFB',
    color: '#006D75',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9" /><path d="M12 3v18M3 12h18" />
      </svg>
    ),
  },
  {
    label: 'पार्क व अन्य',
    href: '/new?cat=अन्य',
    bg: '#FFF0F0',
    color: '#CF1322',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22v-6M12 8a5 5 0 0 0-5-5 5 5 0 0 0-5 5c0 3.5 3 6 5 8h10c2-2 5-4.5 5-8a5 5 0 0 0-5-5 5 5 0 0 0-5 5z" />
      </svg>
    ),
  },
]

// ── Page Component ─────────────────────────────────────────────────────────
export default async function Home({ searchParams }: { searchParams: Promise<{ code?: string }> }) {
  const sp = await searchParams
  const [stats, complaints] = await Promise.all([getStats(), getRecentComplaints()])

  return (
    <>
      {/* ── CLEAN LIGHT CIVIC HERO (FULL-BLEED IMAGE WITH OVERLAID TEXT & FEATURES) ── */}
      <section className="cl-hero">
        {/* Full image backdrop with zero border, entirely covering the hero */}
        <div className="cl-hero-bg">
          <img
            src="/images/jodhpur-fort.jpg?v=2"
            alt="मेहरानगढ़ किला, जोधपुर"
            className="cl-fort-full"
          />
          <div className="cl-hero-overlay" />
        </div>

        <div className="wrap cl-hero-wrap">
          {/* Overlaid Content Area */}
          <div className="cl-hero-content">
            {/* BJP Lotus Logo on the left side */}
            <div className="cl-hero-brand-header">
              <img
                src="/images/bjp-logo.png"
                alt="भारतीय जनता पार्टी"
                className="cl-hero-bjp-logo"
              />
              <div className="cl-hero-badge">
                <span className="cl-badge-dot"></span>
                जनसेवा 09 · नागरिक सहायता मंच
              </div>
            </div>

            <h1 className="cl-hero-h1">
              हमारा वार्ड<br />
              <span className="cl-hero-h1-sub">हमारी प्राथमिकता</span>
            </h1>

            <p className="cl-hero-desc">
              वार्ड 09, जोधपुर की हर समस्या के समाधान के लिए एक साझा मंच — <b>जनसेवा 09</b>
            </p>

            {/* Sanjay Jani (Representative) Card - positioned below the text */}
            <div className="cl-rep-below-section">
              <a
                className="cl-hero-rep-card"
                href="https://www.instagram.com/sanjaybishnoibjp?stkn=Y2gycmx0eTZ2aDZv"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Sanjay Bishnoi Instagram"
              >
                <div className="cl-corner-photo-frame">
                  <img
                    src="/images/sanjay-bishnoi.jpg"
                    alt="संजय बिश्नोई (जाणी)"
                    className="cl-corner-photo-img"
                  />
                </div>
                <div className="cl-rep-card-footer">
                  <div className="cl-rep-info">
                    <span className="cl-rep-name">संजय बिश्नोई (जाणी)</span>
                    <span className="cl-rep-role">वार्ड नं. 09, जोधपुर</span>
                  </div>
                  <span className="cl-ig-badge" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="15" height="15">
                      <rect x="2" y="2" width="20" height="20" rx="6" stroke="white" strokeWidth="2"/>
                      <circle cx="12" cy="12" r="4" stroke="white" strokeWidth="2"/>
                      <circle cx="17.5" cy="6.5" r="1.2" fill="white"/>
                    </svg>
                    Instagram
                  </span>
                </div>
              </a>
            </div>

            {/* Action Group: Orange CTA + Tracking Bar - below Sanjay Jani photo */}
            <div className="cl-hero-actions">
              <a className="cl-cta-orange" href="/new">
                <span className="cl-cta-camera">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14.5 4h-5L8 6H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-4Z" />
                    <circle cx="12" cy="13" r="3.5" />
                  </svg>
                </span>
                <div className="cl-cta-text">
                  <span className="cl-cta-bold">शिकायत दर्ज करें</span>
                  <span className="cl-cta-sub">फ़ोटो के साथ, दो मिनट में</span>
                </div>
              </a>

              <form className="cl-track-box" method="get" action="/register">
                <svg className="cl-track-lens" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" />
                </svg>
                <input
                  name="q"
                  defaultValue={sp.code || ''}
                  placeholder="अपना शिकायत कोड डालिए"
                  aria-label="शिकायत कोड खोजें"
                />
                <button type="submit" className="cl-track-btn">
                  देखें
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* ── SERVICE CATEGORIES ───────────────────────────────────────────── */}
      <section className="cl-cats-section">
        <div className="wrap">
          <div className="cl-cats-header">
            <h2 className="cl-cats-title">समस्या की श्रेणी चुनें</h2>
            <span className="cl-cats-subtitle">सीधे संबंधित विभाग में शिकायत दर्ज करें</span>
          </div>

          <div className="cl-cats-grid">
            {SERVICE_CATS.map(cat => (
              <a
                key={cat.label}
                href={cat.href}
                className="cl-cat-item"
              >
                <div className="cl-cat-circle" style={{ backgroundColor: cat.bg, color: cat.color }}>
                  {cat.icon}
                </div>
                <span className="cl-cat-label">{cat.label}</span>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ── STATS STRIP ──────────────────────────────────────────────────── */}
      <section className="cl-stats-section">
        <div className="wrap">
          <div className="cl-stats-grid">
            <div className="cl-stat-card">
              <div className="cl-stat-icon cl-ic-total">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h13l3 3v13H4z" /><path d="M8 9h8M8 13h8M8 17h5" />
                </svg>
              </div>
              <div className="cl-stat-body">
                <span className="cl-stat-num">{stats.total}</span>
                <span className="cl-stat-label">कुल शिकायतें</span>
              </div>
            </div>

            <div className="cl-stat-card cl-card-green">
              <div className="cl-stat-icon cl-ic-green">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <div className="cl-stat-body">
                <span className="cl-stat-num">{stats.done}</span>
                <span className="cl-stat-label">हल हुईं</span>
              </div>
            </div>

            <div className="cl-stat-card cl-card-blue">
              <div className="cl-stat-icon cl-ic-blue">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
              <div className="cl-stat-body">
                <span className="cl-stat-num">{stats.pending}</span>
                <span className="cl-stat-label">प्रतीक्षित</span>
              </div>
            </div>

            <div className="cl-stat-card cl-card-red">
              <div className="cl-stat-icon cl-ic-red">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 9v4" /><path d="M12 17h.01" />
                  <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
                </svg>
              </div>
              <div className="cl-stat-body">
                <span className="cl-stat-num">{stats.overdue}</span>
                <span className="cl-stat-label">समयसीमा पार</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── QUICK ACTIONS ────────────────────────────────────────────────── */}
      <section className="sec alt">
        <div className="wrap">
          <h2 className="sh">त्वरित सेवाएँ</h2>
          <p className="sp">वार्ड 09 के नागरिकों के लिए उपयोगी सेवाएँ</p>
          <div className="tiles">
            <a className="tile tile-shikayat" href="/new">
              <span className="ic">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M14.5 4h-5L8 6H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-4Z" />
                  <circle cx="12" cy="13" r="3.5" />
                </svg>
              </span>
              <b>शिकायत दर्ज</b>
            </a>
            <a className="tile tile-wa" href="/new">
              <span className="ic">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M4 5h16v11H7l-3 3z" />
                </svg>
              </span>
              <b>WhatsApp पर</b>
            </a>
            <a className="tile tile-reg" href="/register">
              <span className="ic">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M4 4h13l3 3v13H4z" /><path d="M8 9h8M8 13h8M8 17h5" />
                </svg>
              </span>
              <b>शिकायतें</b>
            </a>
            <a className="tile tile-proof" href="/register?f=पूरा">
              <span className="ic">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M3 7h7v10H3zM14 7h7v10h-7z" /><path d="M10 12h4" />
                </svg>
              </span>
              <b>पहले–बाद</b>
            </a>
            <a className="tile tile-services" href="/sewaye">
              <span className="ic">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M6 3h9l4 4v14H6z" /><path d="M14 3v5h5" /><path d="M9 13h7M9 17h5" />
                </svg>
              </span>
              <b>सरकारी सेवाएँ</b>
            </a>
            <a className="tile tile-numbers" href="/numbers">
              <span className="ic">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z" />
                </svg>
              </span>
              <b>ज़रूरी नंबर</b>
            </a>
            <a className="tile tile-khoya" href="/khoya">
              <span className="ic">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" />
                </svg>
              </span>
              <b>खोया–पाया</b>
            </a>
            <a className="tile tile-blood" href="/blood">
              <span className="ic">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M12 3s6 6.4 6 10.2A6 6 0 0 1 6 13.2C6 9.4 12 3 12 3Z" />
                </svg>
              </span>
              <b>ब्लड डोनर</b>
            </a>
          </div>
        </div>
      </section>

      {/* ── RECENT COMPLAINTS ────────────────────────────────────────────── */}
      <section className="sec">
        <div className="wrap">
          <div className="rhead">
            <div>
              <h2 className="sh">हाल की शिकायतें</h2>
              <p className="sp" style={{ margin: 0 }}>हर शिकायत, हर तारीख़ — खुली हुई</p>
            </div>
            <a href="/register" style={{ fontSize: '14px', fontWeight: 600, borderBottom: '2px solid var(--amber)', paddingBottom: '1px' }}>
              सारी शिकायतें
            </a>
          </div>
          <div className="cards">
            {complaints && complaints.length > 0 ? (
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
                    <div className="mt">{c.mohalla} · {c.category}</div>
                    {formatDeadline(c.deadline, c.status, c.updated_at)}
                  </div>
                </a>
              ))
            ) : (
              <div className="empty">
                <b>अभी कोई शिकायत नहीं</b>
                <p>पहली शिकायत दर्ज कीजिए।</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── ABOUT जनसेवा 09 ────────────────────────────────────────────────── */}
      <section className="sec alt">
        <div className="wrap">
          <h2 className="sh">जनसेवा 09 क्या है</h2>
          <p className="sp">वार्ड 09 की समस्याओं को दर्ज करने, उनका फॉलो-अप रखने और समाधान की जानकारी साझा करने का एक नागरिक सहायता मंच।</p>
          <div className="three">
            <div className="ex">
              <b>यह सरकारी पोर्टल नहीं है</b>
              <p>यह कोई सरकारी, सार्वजनिक अथवा नगर निगम का आधिकारिक पोर्टल नहीं है; यह वार्ड और समाज के कल्याण के लिए निजी रूप से संचालित एवं होस्ट की गई वेबसाइट है।</p>
            </div>
            <div className="ex">
              <b>नगर निगम की व्यवस्था अलग है</b>
              <p>नगर निगम की आधिकारिक शिकायत व्यवस्था अलग है और सरकारी शिकायत के लिए उसी माध्यम का उपयोग किया जाना चाहिए।</p>
            </div>
            <div className="ex">
              <b>निगम में स्वतः दर्ज नहीं होती</b>
              <p>यहाँ दर्ज की गई शिकायत नगर निगम में स्वतः दर्ज नहीं होती, बल्कि वार्ड की समस्याओं का व्यवस्थित रिकॉर्ड रखने और उनके समाधान के लिए पहल करने हेतु है।</p>
            </div>
            <div className="ex">
              <b>मोबाइल नंबर सुरक्षित</b>
              <p>शिकायतकर्ता का मोबाइल नंबर सार्वजनिक रूप से प्रदर्शित नहीं किया जाता और केवल आवश्यक संपर्क के लिए सुरक्षित रखा जाता है।</p>
            </div>
            <div className="ex">
              <b>पारदर्शिता एवं जानकारी</b>
              <p>शिकायत की स्थिति और समाधान की जानकारी पारदर्शिता के उद्देश्य से उपलब्ध कराई जाएगी।</p>
            </div>
            <div className="ex">
              <b>&quot;पूर्ण&quot; बिना प्रमाण के नहीं</b>
              <p>किसी समस्या को "पूर्ण" या "समाधान" तभी माना जाएगा जब उसके समाधान का उचित प्रमाण, जैसे कार्य पूर्ण होने की फ़ोटो, उपलब्ध हो।</p>
            </div>
          </div>
          <div style={{ marginTop: 24, padding: '16px 20px', background: 'var(--paper)', borderRadius: 10, textAlign: 'center', border: '1px solid var(--line)', fontSize: 15 }}>
            <b>जनसेवा 09 — समस्या दर्ज करें, समाधान की पहल करें और अपने वार्ड को बेहतर बनाने में सहयोग दें।</b>
          </div>
        </div>
      </section>

      {/* ── PROOF CTA BAND ───────────────────────────────────────────────── */}
      <section className="sec">
        <div className="wrap">
          <div className="band">
            <div>
              <h3>किए गए कार्य का प्रमाण भी उपलब्ध है</h3>
              <p>प्रत्येक पूर्ण की गई शिकायत के समाधान से पहले और बाद की तस्वीरें यहाँ उपलब्ध कराई जाती हैं। लंबित शिकायतों की स्थिति और संबंधित तिथियाँ भी स्पष्ट रूप से प्रदर्शित की जाती हैं।</p>
            </div>
            <a className="btn" style={{ width: 'auto', background: 'var(--amber)', color: '#1A1200', margin: 0 }} href="/register?f=पूरा">
              पहले–बाद देखिए
            </a>
          </div>
        </div>
      </section>
    </>
  )
}
