'use client'

import { useState } from 'react'
import Link from 'next/link'
import { DainikKarya } from '@/lib/supabase'

const CATEGORIES = [
  'सब',
  'सफ़ाई कार्य',
  'सड़क मरम्मत',
  'स्ट्रीट लाइट',
  'पेयजल',
  'निरीक्षण / जनसुनवाई',
  'विकास कार्य',
  'अन्य',
]

function getCategoryColor(cat: string) {
  switch (cat) {
    case 'सफ़ाई कार्य':
      return { bg: '#EBF7EE', color: '#1E7E34', border: '#C3E6CB' }
    case 'सड़क मरम्मत':
      return { bg: '#FFF3E8', color: '#D95C00', border: '#F5C490' }
    case 'स्ट्रीट लाइट':
      return { bg: '#FEF8E7', color: '#B45309', border: '#FDE68A' }
    case 'पेयजल':
      return { bg: '#EAF4FD', color: '#1D4ED8', border: '#BFDBFE' }
    case 'निरीक्षण / जनसुनवाई':
      return { bg: '#F5F3FF', color: '#6D28D9', border: '#DDD6FE' }
    case 'विकास कार्य':
      return { bg: '#FDF2F8', color: '#BE185D', border: '#FBCFE8' }
    default:
      return { bg: '#F3F4F6', color: '#374151', border: '#E5E7EB' }
  }
}

function formatDate(dateStr: string) {
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return dateStr
    return d.toLocaleDateString('hi-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      weekday: 'long',
    })
  } catch {
    return dateStr
  }
}

export default function DainikKaryaClient({ initialList }: { initialList: DainikKarya[] }) {
  const [filterCat, setFilterCat] = useState('सब')
  const [searchQuery, setSearchQuery] = useState('')
  const [activePhoto, setActivePhoto] = useState<string | null>(null)

  const filtered = initialList.filter(item => {
    const matchesCat = filterCat === 'सब' || item.category === filterCat
    const q = searchQuery.trim().toLowerCase()
    const matchesSearch =
      !q ||
      item.title.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q) ||
      (item.area && item.area.toLowerCase().includes(q))
    return matchesCat && matchesSearch
  })

  return (
    <div style={{ minHeight: '100vh', background: 'var(--paper)', paddingBottom: 60 }}>
      {/* Hero Header */}
      <section
        style={{
          background: 'linear-gradient(135deg, #3A1500 0%, #7C2D00 60%, #D95C00 100%)',
          color: '#ffffff',
          padding: '48px 0 36px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: -40,
            right: -40,
            width: 200,
            height: 200,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.06)',
            pointerEvents: 'none',
          }}
        />
        <div className="wrap">
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.15)', padding: '5px 14px', borderRadius: 20, fontSize: 13, fontWeight: 700, letterSpacing: 0.5, marginBottom: 12 }}>
            <span>🏛️ वार्ड 09 · जनसेवा रिपोर्ट</span>
            <span style={{ opacity: 0.7 }}>•</span>
            <span style={{ color: '#FDE68A' }}>सार्वजनिक दैनिक गतिविधि</span>
          </div>
          <h1
            style={{
              fontFamily: '"Anek Devanagari", sans-serif',
              fontSize: 'clamp(26px, 4vw, 36px)',
              fontWeight: 800,
              lineHeight: 1.25,
              margin: '0 0 10px',
            }}
          >
            दैनिक कार्य रिपोर्ट (Daily Activities)
          </h1>
          <p
            style={{
              fontSize: 16,
              lineHeight: 1.6,
              color: 'rgba(255,255,255,0.9)',
              maxWidth: 720,
              margin: 0,
            }}
          >
            वार्ड 09, जोधपुर में प्रतिदिन होने वाले विकास, सफ़ाई, मरम्मत एवं जनहित कार्यों का दैनिक ब्योरा। जनसेवा 09 संचालक टीम द्वारा पारदर्शी रिपोर्टिंग।
          </p>

          {/* Quick Stats Pill */}
          <div
            style={{
              display: 'flex',
              gap: 12,
              marginTop: 22,
              flexWrap: 'wrap',
            }}
          >
            <div style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', padding: '8px 16px', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 20, fontWeight: 800, color: '#FDE68A' }}>{initialList.length}</span>
              <span style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.9)' }}>कुल कार्य रिपोर्ट</span>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', padding: '8px 16px', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 16 }}>📍</span>
              <span style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.9)' }}>वार्ड 09, जोधपुर</span>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', padding: '8px 16px', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 16 }}>👤</span>
              <span style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.9)' }}>संजय बिश्नोई (पार्षद वार्ड 09)</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <section className="wrap" style={{ marginTop: 28 }}>
        {/* Search & Filter Bar */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: 16,
            padding: '16px 20px',
            boxShadow: '0 2px 12px rgba(217,92,0,0.06)',
            border: '1px solid var(--line)',
            marginBottom: 24,
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
          }}
        >
          {/* Search box */}
          <div style={{ display: 'flex', alignItems: 'center', background: 'var(--paper)', borderRadius: 10, padding: '2px 14px', border: '1px solid var(--line)' }}>
            <span style={{ fontSize: 18, marginRight: 8, opacity: 0.6 }}>🔍</span>
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="कार्य, मोहल्ला या कीवर्ड से खोजें…"
              style={{
                width: '100%',
                padding: '10px 0',
                border: 0,
                background: 'transparent',
                outline: 'none',
                fontSize: 15,
                color: 'var(--ink)',
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                style={{ fontSize: 14, color: 'var(--ink2)', padding: '4px 8px', cursor: 'pointer' }}
              >
                ✕
              </button>
            )}
          </div>

          {/* Category Chips */}
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
            {CATEGORIES.map(cat => {
              const active = filterCat === cat
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setFilterCat(cat)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 20,
                    fontSize: 13.5,
                    fontWeight: active ? 700 : 500,
                    background: active ? 'var(--amber)' : '#ffffff',
                    color: active ? '#ffffff' : 'var(--ink)',
                    border: `1.5px solid ${active ? 'var(--amber)' : 'var(--line)'}`,
                    whiteSpace: 'nowrap',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {cat}
                </button>
              )
            })}
          </div>
        </div>

        {/* Results Counter */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ fontSize: 14.5, color: 'var(--ink2)', fontWeight: 600 }}>
            {filtered.length} {filtered.length === 1 ? 'कार्य रिपोर्ट उपलब्ध' : 'कार्य रिपोर्टें उपलब्ध'}
            {filterCat !== 'सब' && ` (${filterCat})`}
          </div>
          <Link
            href="/new"
            style={{
              fontSize: 13.5,
              fontWeight: 700,
              color: 'var(--amber)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <span>+ नई शिकायत दर्ज करें</span>
            <span>→</span>
          </Link>
        </div>

        {/* Activities List */}
        {filtered.length === 0 ? (
          <div
            style={{
              background: '#ffffff',
              borderRadius: 16,
              padding: '48px 24px',
              textAlign: 'center',
              border: '1px dashed var(--line)',
            }}
          >
            <div style={{ fontSize: 42, marginBottom: 10 }}>📋</div>
            <h3 style={{ fontSize: 18, color: 'var(--ink)', margin: '0 0 6px', fontWeight: 700 }}>
              कोई कार्य रिपोर्ट नहीं मिली
            </h3>
            <p style={{ fontSize: 14, color: 'var(--ink2)', margin: 0 }}>
              {searchQuery || filterCat !== 'सब'
                ? 'फ़िल्टर या खोज शब्द बदलकर पुनः प्रयास करें।'
                : 'संचालक द्वारा जल्द ही दैनिक कार्य अपलोड किए जाएंगे।'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {filtered.map(item => {
              const catStyle = getCategoryColor(item.category)
              return (
                <article
                  key={item.id}
                  style={{
                    background: '#ffffff',
                    borderRadius: 16,
                    border: '1px solid var(--line)',
                    boxShadow: '0 2px 10px rgba(217,92,0,0.05)',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                  }}
                >
                  {/* Card Header */}
                  <div
                    style={{
                      padding: '16px 20px 12px',
                      borderBottom: '1px solid var(--paper)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: 8,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                      {/* Date Badge */}
                      <span
                        style={{
                          fontSize: 13,
                          fontWeight: 700,
                          color: 'var(--ink2)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 5,
                        }}
                      >
                        <span>📅</span>
                        <span>{formatDate(item.work_date)}</span>
                      </span>

                      {/* Category Pill */}
                      <span
                        style={{
                          background: catStyle.bg,
                          color: catStyle.color,
                          border: `1px solid ${catStyle.border}`,
                          fontSize: 12,
                          fontWeight: 700,
                          padding: '3px 10px',
                          borderRadius: 20,
                        }}
                      >
                        {item.category}
                      </span>
                    </div>

                    {item.area && (
                      <span
                        style={{
                          fontSize: 13,
                          color: 'var(--ink)',
                          background: 'var(--surface)',
                          padding: '3px 10px',
                          borderRadius: 6,
                          fontWeight: 600,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                        }}
                      >
                        <span>📍</span>
                        <span>{item.area}</span>
                      </span>
                    )}
                  </div>

                  {/* Card Content & Photo */}
                  <div
                    style={{
                      padding: '18px 20px 20px',
                      display: 'grid',
                      gridTemplateColumns: item.photo_url ? '1fr 240px' : '1fr',
                      gap: 20,
                      alignItems: 'start',
                    }}
                  >
                    <div>
                      <h2
                        style={{
                          fontFamily: '"Anek Devanagari", sans-serif',
                          fontSize: 'clamp(17px, 2.5vw, 20px)',
                          fontWeight: 700,
                          color: 'var(--ink)',
                          margin: '0 0 10px',
                          lineHeight: 1.4,
                        }}
                      >
                        {item.title}
                      </h2>
                      <p
                        style={{
                          fontSize: 15,
                          lineHeight: 1.65,
                          color: '#374151',
                          margin: 0,
                          whiteSpace: 'pre-line',
                        }}
                      >
                        {item.description}
                      </p>

                      <div
                        style={{
                          marginTop: 16,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 12,
                          fontSize: 12.5,
                          color: 'var(--ink2)',
                        }}
                      >
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <span style={{ color: '#059669', fontWeight: 800 }}>✓</span>
                          <span>संचालक प्रमाणित दैनिक गतिविधि</span>
                        </span>
                      </div>
                    </div>

                    {/* Photo thumbnail if present */}
                    {item.photo_url && (
                      <div>
                        <div
                          onClick={() => setActivePhoto(item.photo_url)}
                          style={{
                            borderRadius: 12,
                            overflow: 'hidden',
                            border: '1.5px solid var(--line)',
                            cursor: 'pointer',
                            position: 'relative',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                          }}
                        >
                          <img
                            src={item.photo_url}
                            alt={item.title}
                            style={{
                              width: '100%',
                              height: 160,
                              objectFit: 'cover',
                              display: 'block',
                            }}
                          />
                          <div
                            style={{
                              position: 'absolute',
                              bottom: 6,
                              right: 6,
                              background: 'rgba(0,0,0,0.7)',
                              color: '#fff',
                              fontSize: 11,
                              fontWeight: 700,
                              padding: '2px 8px',
                              borderRadius: 4,
                              display: 'flex',
                              alignItems: 'center',
                              gap: 4,
                            }}
                          >
                            <span>🔍 बड़ी देखें</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </article>
              )
            })}
          </div>
        )}

        {/* Citizen CTA Banner */}
        <div
          style={{
            marginTop: 40,
            background: 'linear-gradient(135deg, #FFE8CC 0%, #FFEDD5 100%)',
            border: '2px dashed var(--amber)',
            borderRadius: 18,
            padding: '24px 28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 18,
          }}
        >
          <div>
            <h3 style={{ margin: '0 0 6px', fontSize: 18, fontWeight: 800, color: '#3A1500' }}>
              क्या आपके मोहल्ले या गली में भी कोई समस्या है?
            </h3>
            <p style={{ margin: 0, fontSize: 14.5, color: '#8B4513' }}>
              सड़क, सफ़ाई, सीवर, लाइट या पानी की समस्या की फ़ोटो खींचकर तुरंत ऑनलाइन शिकायत दर्ज करें।
            </p>
          </div>
          <Link
            href="/new"
            style={{
              background: 'var(--amber)',
              color: '#ffffff',
              padding: '12px 24px',
              borderRadius: 10,
              fontWeight: 700,
              fontSize: 15,
              textDecoration: 'none',
              boxShadow: '0 3px 10px rgba(217,92,0,0.3)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <span>शिकायत दर्ज कीजिए</span>
            <span>→</span>
          </Link>
        </div>
      </section>

      {/* Lightbox Modal for Photo */}
      {activePhoto && (
        <div
          onClick={() => setActivePhoto(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: 16,
            cursor: 'zoom-out',
          }}
        >
          <div style={{ position: 'relative', maxWidth: '90vw', maxHeight: '90vh' }}>
            <img
              src={activePhoto}
              alt="कार्य फ़ोटो"
              style={{
                maxWidth: '100%',
                maxHeight: '90vh',
                borderRadius: 10,
                boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                objectFit: 'contain',
              }}
            />
            <button
              type="button"
              onClick={() => setActivePhoto(null)}
              style={{
                position: 'absolute',
                top: -14,
                right: -14,
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: '#ffffff',
                color: '#111827',
                border: 0,
                fontSize: 16,
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
              }}
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
