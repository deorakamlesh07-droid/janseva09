'use client'

import { useState, useRef, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import LocationPicker from './LocationPicker'

const CATEGORIES = [
  'गली की सफ़ाई', 'कचरा गाड़ी नहीं आई', 'नाली / सीवर जाम',
  'स्ट्रीट लाइट', 'सड़क / गड्ढा', 'पानी भराव', 'पानी नहीं आ रहा', 'आवारा पशु', 'मच्छर / फॉगिंग', 'पार्क व अन्य'
]

function matchCategory(param: string | null): string {
  if (!param) return CATEGORIES[0]
  const q = decodeURIComponent(param).trim()
  const exact = CATEGORIES.find(c => c === q)
  if (exact) return exact

  if (q.includes('सड़क') || q.includes('सड़क') || q.includes('गड्ढा') || q.includes('गड़्ग़ा')) {
    return CATEGORIES.find(c => c.includes('सड़क') || c.includes('सड़क')) || CATEGORIES[4]
  }
  if (q.includes('पानी नहीं') || q.includes('सप्लाई')) {
    return 'पानी नहीं आ रहा'
  }
  if (q.includes('पानी') || q.includes('जल')) {
    return 'पानी भराव'
  }
  if (q.includes('लाइट')) {
    return 'स्ट्रीट लाइट'
  }
  if (q.includes('कचरा') || q.includes('कूड़ा')) {
    return 'कचरा गाड़ी नहीं आई'
  }
  if (q.includes('सफाई') || q.includes('सफ़ाई')) {
    return 'गली की सफ़ाई'
  }
  if (q.includes('नाली') || q.includes('सीवर') || q.includes('सीवरेज')) {
    return 'नाली / सीवर जाम'
  }
  if (q.includes('पार्क') || q.includes('अन्य')) {
    return 'पार्क व अन्य'
  }

  const fuzzy = CATEGORIES.find(c => c.includes(q) || q.includes(c))
  return fuzzy || CATEGORIES[0]
}

const MAX_PHOTOS = 3

interface PhotoItem {
  id: string
  file: File
  preview: string
}

function NewComplaintForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const catQuery = searchParams.get('cat')

  const [category, setCategory] = useState(() => matchCategory(catQuery))
  const [photos, setPhotos] = useState<PhotoItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [mohallaValue, setMohallaValue] = useState('')
  const cameraRef = useRef<HTMLInputElement>(null)
  const galleryRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (catQuery) {
      setCategory(matchCategory(catQuery))
    }
  }, [catQuery])

  function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return
    const newFiles = Array.from(files)
    const availableSlots = MAX_PHOTOS - photos.length

    if (availableSlots <= 0) {
      setError(`अधिकतम ${MAX_PHOTOS} फ़ोटो ही जोड़ी जा सकती हैं।`)
      return
    }

    const allowedFiles = newFiles.slice(0, availableSlots)
    const newItems: PhotoItem[] = []

    for (const f of allowedFiles) {
      if (f.size > 10 * 1024 * 1024) {
        setError(`फ़ोटो "${f.name}" का साइज़ 10MB से बड़ा है।`)
        continue
      }
      newItems.push({
        id: Math.random().toString(36).slice(2, 9),
        file: f,
        preview: URL.createObjectURL(f)
      })
    }

    if (newItems.length > 0) {
      setPhotos(prev => [...prev, ...newItems])
      setError('')
    }
  }

  function removePhoto(id: string) {
    setPhotos(prev => {
      const item = prev.find(p => p.id === id)
      if (item) URL.revokeObjectURL(item.preview)
      return prev.filter(p => p.id !== id)
    })
  }

  function handleLocationUpdate(loc: { lat: number; lng: number; address?: string }) {
    if (loc.address && !mohallaValue) setMohallaValue(loc.address)
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    if (photos.length === 0) {
      setError('फ़ोटो लगाना अनिवार्य है! कम से कम 1 फ़ोटो खींचकर जोड़ें।')
      document.getElementById('photo-section')?.scrollIntoView({ behavior: 'smooth' })
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')

    const fd = new FormData(e.currentTarget)
    fd.delete('photo')
    fd.delete('photos[]')

    for (const p of photos) {
      fd.append('photos[]', p.file)
    }

    try {
      const res = await fetch('/api/shikayat', { method: 'POST', body: fd })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error || 'कुछ गड़बड़ हुई। फिर कोशिश कीजिए।')
        setLoading(false)
        return
      }
      setSuccess(json.code)
      setLoading(false)
      setTimeout(() => router.push(`/s/${json.code.replace('/', '-')}`), 1500)
    } catch {
      setError('सर्वर से संपर्क नहीं हो पाया। कृपया इंटरनेट चेक करें।')
      setLoading(false)
    }
  }

  return (
    <section className="sec">
      <div className="wrap formwrap">
        <h2 className="sh">{'शिकायत दर्ज कीजिए'}</h2>
        <p className="sp">{'वार्ड के काम की बात यहाँ लिखिए। फ़ोटो लगाना अनिवार्य है।'}</p>

        <div className="notours">
          <b>{'ये काम यहाँ नहीं होते'}</b>
          <p>{'इन पर पार्षद का सीधा अधिकार नहीं है। सीधे इनसे बात कीजिए।'}</p>
          <ul>
            <li>{'बिजली का फ़ॉल्ट, मीटर'} <span>{'बिजली विभाग'}</span></li>
            <li>{'राशन, पेंशन, प्रमाण पत्र'} <span>{'ई-मित्र / SDM कार्यालय'}</span></li>
            <li>{'गृह कर, पट्टा, नामांतरण'} <span>{'नगर निगम कार्यालय'}</span></li>
          </ul>
          <a href="/numbers">{'इनके नंबर देखिए'}</a>
        </div>

        {error && (
          <div className="err" style={{ borderLeft: '4px solid #DC2626', background: '#FEF2F2', color: '#991B1B', fontWeight: 600 }}>
            {error}
          </div>
        )}
        {success && (
          <div className="succ">
            <b>{'शिकायत दर्ज हो गई —'} {success}</b>
            <p>{'शिकायत नंबर आपकी ईमेल पर भेज दिया गया है। स्थिति देखने के लिए इसी कोड का उपयोग करें।'}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} encType="multipart/form-data">
          <input type="text" name="website" style={{ position: 'absolute', left: '-9999px' }} tabIndex={-1} autoComplete="off" />

          <div className="f" id="photo-section">
            <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>{'फ़ोटो'} <strong style={{ color: '#DC2626' }}>{'* (अनिवार्य — 1 से 3 फ़ोटो)'}</strong></span>
              <span style={{ fontSize: 12, color: photos.length > 0 ? '#166534' : '#DC2626', fontWeight: 700 }}>
                {photos.length > 0 ? `${photos.length} / ${MAX_PHOTOS} फ़ोटो जोड़ी गईं` : 'कम से कम 1 फ़ोटो ज़रूरी'}
              </span>
            </label>

            <input
              type="file"
              ref={cameraRef}
              accept="image/*"
              capture="environment"
              style={{ display: 'none' }}
              onChange={e => handleFiles(e.target.files)}
            />
            <input
              type="file"
              ref={galleryRef}
              accept="image/*"
              multiple
              style={{ display: 'none' }}
              onChange={e => handleFiles(e.target.files)}
            />

            {photos.length < MAX_PHOTOS && (
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
                <button
                  type="button"
                  className="drop"
                  style={{ flex: 1, minWidth: 160 }}
                  onClick={() => cameraRef.current?.click()}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
                    <path d="M14.5 4h-5L8 6H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-4Z" />
                    <circle cx="12" cy="13" r="3.5" />
                  </svg>
                  <b>{'कैमरा खोलिए'}</b>
                  <span>{photos.length > 0 ? 'दूसरी फ़ोटो खींचिए' : 'मौके से लाइव फ़ोटो खींचिए'}</span>
                </button>

                <button
                  type="button"
                  className="galbtn"
                  style={{ flex: 1, minWidth: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, margin: 0 }}
                  onClick={() => galleryRef.current?.click()}
                >
                  <span>🖼️</span>
                  <span>{'गैलरी से चुनिए'}</span>
                </button>
              </div>
            )}

            {photos.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(95px, 1fr))', gap: 10, marginBottom: 12 }}>
                {photos.map((item, idx) => (
                  <div
                    key={item.id}
                    style={{
                      position: 'relative',
                      borderRadius: 10,
                      overflow: 'hidden',
                      border: '2px solid var(--amber-d, #E65100)',
                      aspectRatio: '1',
                      background: '#000'
                    }}
                  >
                    <img
                      src={item.preview}
                      alt={`फ़ोटो ${idx + 1}`}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <button
                      type="button"
                      onClick={() => removePhoto(item.id)}
                      aria-label="फ़ोटो हटाएँ"
                      style={{
                        position: 'absolute',
                        top: 4,
                        right: 4,
                        background: 'rgba(220, 38, 38, 0.9)',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '50%',
                        width: 24,
                        height: 24,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        fontSize: 14,
                        fontWeight: 'bold',
                        lineHeight: 1
                      }}
                    >
                      ×
                    </button>
                    <span
                      style={{
                        position: 'absolute',
                        bottom: 4,
                        left: 4,
                        background: 'rgba(0,0,0,0.65)',
                        color: '#fff',
                        fontSize: 10,
                        padding: '1px 5px',
                        borderRadius: 4
                      }}
                    >
                      #{idx + 1}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div className="hint">{'समस्या की स्थिति साफ़ दिखाने के लिए 1 से 3 अलग-अलग कोणों से फ़ोटो जोड़ें।'}</div>
            <div className="warn">{'किसी का चेहरा, गाड़ी का नंबर या घर का नंबर साफ़ दिख रहा हो तो वो फ़ोटो मत डालिए।'}</div>
          </div>

          <div className="f">
            <label htmlFor="a1">{'आपका नाम'}</label>
            <input id="a1" name="name" maxLength={60} placeholder={'जैसे — सुनीता शर्मा'} required />
          </div>

          <div className="f">
            <label htmlFor="a2">{'फ़ोन नंबर'}</label>
            <input id="a2" name="phone" type="tel" inputMode="numeric" maxLength={15} placeholder={'10 अंक'} required />
            <div className="hint">{'सिर्फ़ आपसे बात करने के लिए। शिकायतों में कभी नहीं दिखेगा।'}</div>
          </div>

          <div className="f">
            <label htmlFor="a-email" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>{'ईमेल पता'} <strong style={{ color: '#DC2626' }}>{'* (अनिवार्य)'}</strong></span>
              <span style={{ fontSize: 12, color: 'var(--ink2)' }}>{'शिकायत सं. व समाधान ईमेल पर आएगा'}</span>
            </label>
            <input
              id="a-email"
              name="email"
              type="email"
              maxLength={100}
              placeholder={'जैसे — rahul@gmail.com'}
              required
            />
            <div className="hint">{'शिकायत दर्ज होते ही शिकायत नंबर और समाधान होने पर सूचना आपको इस ईमेल पर भेजी जाएगी।'}</div>
          </div>

          <div className="f">
            <label htmlFor="a3">{'पता / मोहल्ला'}</label>
            <input
              id="a3"
              name="mohalla"
              maxLength={180}
              placeholder={'गली, मोहल्ला और पास की कोई पहचान'}
              value={mohallaValue}
              onChange={e => setMohallaValue(e.target.value)}
              required
            />
            <div className="hint">{'जैसे — गंगा गली, स्कूल के पीछे वाला मोड़।'}</div>
          </div>

          <div className="f">
            <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>{'📍 स्थान / लोकेशन (नक्शा व GPS)'}</span>
              <span style={{ fontSize: 12, color: 'var(--ink2)' }}>{'संचालक को सटीक जगह दिखेगी'}</span>
            </label>
            <LocationPicker onLocationChange={handleLocationUpdate} />
          </div>

          <div className="f">
            <label htmlFor="a4" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>{'किस बात की'} <strong style={{ color: 'var(--amber-d)' }}>*</strong></span>
              {catQuery && (
                <span style={{ fontSize: 12, color: 'var(--ink2)', background: 'var(--amber-s)', padding: '2px 8px', borderRadius: 4, fontWeight: 600 }}>
                  {'श्रेणी चुनी गई'}
                </span>
              )}
            </label>
            <select
              id="a4"
              name="category"
              value={category}
              onChange={e => setCategory(e.target.value)}
            >
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="f">
            <label htmlFor="a5">{'पूरी बात'}</label>
            <textarea id="a5" name="detail" maxLength={800} placeholder={'कहाँ, कब से, और क्या दिक्कत हो रही है'} required />
          </div>

          <button className="btn" type="submit" disabled={loading}>
            {loading ? 'दर्ज हो रही है…' : 'शिकायत दर्ज कीजिए'}
          </button>
          <div className="hint" style={{ marginTop: '14px' }}>
            {'जनसेवा 09 सरकारी पोर्टल नहीं है। यहाँ दर्ज करने से नगर निगम में आधिकारिक शिकायत दर्ज नहीं होती।'}
          </div>
        </form>
      </div>
    </section>
  )
}

export default function NewComplaint() {
  return (
    <Suspense fallback={<div className="sec"><div className="wrap" style={{ textAlign: 'center', padding: '40px 0' }}>लोड हो रहा है…</div></div>}>
      <NewComplaintForm />
    </Suspense>
  )
}
