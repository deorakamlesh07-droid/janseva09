'use client'

import { useState, useRef, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import LocationPicker from './LocationPicker'
import { useLanguage } from '@/context/LanguageContext'

const CATEGORIES = [
  'गली की सफ़ाई', 'कचरा गाड़ी नहीं आई', 'नाली / सीवर जाम',
  'स्ट्रीट लाइट', 'सड़क / गड़्ग़ा', 'पानी भराव', 'पानी नहीं आ रहा', 'आवारा पशु', 'मच्छर / फॉगिंग', 'पार्क व अन्य'
]

function matchCategory(param: string | null): string {
  if (!param) return CATEGORIES[0]
  const q = decodeURIComponent(param).trim()
  const exact = CATEGORIES.find(c => c === q)
  if (exact) return exact

  if (q.includes('सड़क') || q.includes('सड़क') || q.includes('गड्ढा') || q.includes('गड़्ग़ा')) {
    return CATEGORIES.find(c => c.includes('सड़क') || c.includes('सड़क')) || CATEGORIES[4]
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
    return 'कचरा गाड़ी नहीं आई'
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

function NewComplaintForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const catQuery = searchParams.get('cat')
  const { t } = useLanguage()

  const [category, setCategory] = useState(() => matchCategory(catQuery))
  const [preview, setPreview] = useState<string | null>(null)
  const [hasPhoto, setHasPhoto] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [mohallaValue, setMohallaValue] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (catQuery) {
      setCategory(matchCategory(catQuery))
    }
  }, [catQuery])

  function handleFile(file: File) {
    const reader = new FileReader()
    reader.onload = e => {
      setPreview(e.target?.result as string)
      setHasPhoto(true)
      setError('')
    }
    reader.readAsDataURL(file)
  }

  function handleLocationUpdate(loc: { lat: number; lng: number; address?: string }) {
    if (loc.address && !mohallaValue) setMohallaValue(loc.address)
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const photoFile = fileRef.current?.files?.[0]
    if (!photoFile || photoFile.size === 0 || !hasPhoto) {
      setError(t('फ़ोटो लगाना अनिवार्य है! बिना समस्या की फ़ोटो के शिकायत दर्ज नहीं की जा सकती।'))
      document.getElementById('photo-section')?.scrollIntoView({ behavior: 'smooth' })
      return
    }
    setLoading(true)
    setError('')
    setSuccess('')
    const fd = new FormData(e.currentTarget)
    const res = await fetch('/api/shikayat', { method: 'POST', body: fd })
    const json = await res.json()
    if (!res.ok) {
      setError(json.error || t('कुछ गड़बड़ हुई। फिर कोशिश कीजिए।'))
      setLoading(false)
      return
    }
    setSuccess(json.code)
    setLoading(false)
    setTimeout(() => router.push(`/s/${json.code.replace('/', '-')}`), 1500)
  }

  return (
    <section className="sec" data-native-i18n="true">
      <div className="wrap formwrap">
        <h2 className="sh">{t('शिकायत दर्ज कीजिए')}</h2>
        <p className="sp">{t('वार्ड के काम की बात यहाँ लिखिए। फ़ोटो लगाना अनिवार्य है।')}</p>

        <div className="notours">
          <b>{t('ये काम यहाँ नहीं होते')}</b>
          <p>{t('इन पर पार्षद का सीधा अधिकार नहीं है। सीधे इनसे बात कीजिए।')}</p>
          <ul>
            <li>{t('बिजली का फ़ॉल्ट, मीटर')} <span>{t('बिजली विभाग')}</span></li>
            <li>{t('राशन, पेंशन, प्रमाण पत्र')} <span>{t('ई-मित्र / SDM कार्यालय')}</span></li>
            <li>{t('गृह कर, पट्टा, नामांतरण')} <span>{t('नगर निगम कार्यालय')}</span></li>
          </ul>
          <a href="/numbers">{t('इनके नंबर देखिए')}</a>
        </div>

        {error && (
          <div className="err" style={{ borderLeft: '4px solid #DC2626', background: '#FEF2F2', color: '#991B1B', fontWeight: 600 }}>
            {error}
          </div>
        )}
        {success && (
          <div className="succ">
            <b>{t('शिकायत दर्ज हो गई —')} {success}</b>
            <p>{t('आपका कोड नोट कर लीजिए। स्थिति देखने के लिए इसी कोड का उपयोग करें।')}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} encType="multipart/form-data">
          <input type="text" name="website" style={{ position: 'absolute', left: '-9999px' }} tabIndex={-1} autoComplete="off" />

          <div className="f" id="photo-section">
            <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>{t('फ़ोटो')} <strong style={{ color: '#DC2626' }}>{t('* (अनिवार्य)')}</strong></span>
              <span style={{ fontSize: 12, color: '#DC2626', fontWeight: 700 }}>{t('बिना फ़ोटो शिकायत दर्ज नहीं होगी')}</span>
            </label>
            <input
              type="file" name="photo" ref={fileRef}
              accept="image/*" capture="environment"
              style={{ display: 'none' }}
              onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
            />
            {!preview ? (
              <>
                <button type="button" className="drop" onClick={() => fileRef.current?.click()}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
                    <path d="M14.5 4h-5L8 6H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-4Z" />
                    <circle cx="12" cy="13" r="3.5" />
                  </svg>
                  <b>{t('कैमरा खोलिए')}</b>{t('अभी वहीं खड़े होकर फ़ोटो खींचिए (अनिवार्य)')}
                </button>
                <button type="button" className="galbtn" onClick={() => {
                  if (fileRef.current) { fileRef.current.removeAttribute('capture'); fileRef.current.click() }
                }}>{t('या गैलरी से चुनिए')}</button>
              </>
            ) : (
              <div id="pickBox">
                <img src={preview} alt="preview" style={{ maxHeight: '240px', objectFit: 'cover', borderRadius: '8px' }} />
                <button type="button" className="galbtn" onClick={() => {
                  setPreview(null)
                  setHasPhoto(false)
                  if (fileRef.current) fileRef.current.value = ''
                }}>{t('बदलिए')}</button>
              </div>
            )}
            <div className="hint">{t('मौके की ताज़ा फ़ोटो सबसे अच्छी रहती है।')}</div>
            <div className="warn">{t('किसी का चेहरा, गाड़ी का नंबर या घर का नंबर साफ़ दिख रहा हो तो वो फ़ोटो मत डालिए।')}</div>
          </div>

          <div className="f">
            <label htmlFor="a1">{t('आपका नाम')}</label>
            <input id="a1" name="name" maxLength={60} placeholder={t('जैसे — सुनीता शर्मा')} required />
          </div>

          <div className="f">
            <label htmlFor="a2">{t('फ़ोन नंबर')}</label>
            <input id="a2" name="phone" type="tel" inputMode="numeric" maxLength={15} placeholder={t('10 अंक')} required />
            <div className="hint">{t('सिर्फ़ आपसे बात करने के लिए। शिकायतों में कभी नहीं दिखेगा।')}</div>
          </div>

          <div className="f">
            <label htmlFor="a-email" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>{t('ईमेल पता')} <strong style={{ color: '#DC2626' }}>{t('* (अनिवार्य)')}</strong></span>
              <span style={{ fontSize: 12, color: 'var(--ink2)' }}>{t('समाधान पर ईमेल आएगा')}</span>
            </label>
            <input
              id="a-email"
              name="email"
              type="email"
              maxLength={100}
              placeholder={t('जैसे — rahul@gmail.com')}
              required
            />
            <div className="hint">{t('शिकायत का समाधान होने पर तुरंत आपको इस ईमेल पर सूचना भेजी जाएगी।')}</div>
          </div>

          <div className="f">
            <label htmlFor="a3">{t('पता / मोहल्ला')}</label>
            <input
              id="a3"
              name="mohalla"
              maxLength={180}
              placeholder={t('गली, मोहल्ला और पास की कोई पहचान')}
              value={mohallaValue}
              onChange={e => setMohallaValue(e.target.value)}
              required
            />
            <div className="hint">{t('जैसे — गंगा गली, स्कूल के पीछे वाला मोड़।')}</div>
          </div>

          <div className="f">
            <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>{t('📍 स्थान / लोकेशन (नक्शा व GPS)')}</span>
              <span style={{ fontSize: 12, color: 'var(--ink2)' }}>{t('संचालक को सटीक जगह दिखेगी')}</span>
            </label>
            <LocationPicker onLocationChange={handleLocationUpdate} />
          </div>

          <div className="f">
            <label htmlFor="a4" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>{t('किस बात की')} <strong style={{ color: 'var(--amber-d)' }}>*</strong></span>
              {catQuery && (
                <span style={{ fontSize: 12, color: 'var(--ink2)', background: 'var(--amber-s)', padding: '2px 8px', borderRadius: 4, fontWeight: 600 }}>
                  {t('श्रेणी चुनी गई')}
                </span>
              )}
            </label>
            <select
              id="a4"
              name="category"
              value={category}
              onChange={e => setCategory(e.target.value)}
            >
              {CATEGORIES.map(c => <option key={c} value={c}>{t(c)}</option>)}
            </select>
          </div>

          <div className="f">
            <label htmlFor="a5">{t('पूरी बात')}</label>
            <textarea id="a5" name="detail" maxLength={800} placeholder={t('कहाँ, कब से, और क्या दिक्कत हो रही है')} required />
          </div>

          <button className="btn" type="submit" disabled={loading}>
            {loading ? t('दर्ज हो रही है…') : t('शिकायत दर्ज कीजिए')}
          </button>
          <div className="hint" style={{ marginTop: '14px' }}>
            {t('जनसेवा 09 सरकारी पोर्टल नहीं है। यहाँ दर्ज करने से नगर निगम में आधिकारिक शिकायत दर्ज नहीं होती।')}
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