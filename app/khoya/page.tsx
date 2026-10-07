'use client'

import { useState, useEffect } from 'react'
import { supabase, KhoyaPaya } from '@/lib/supabase'

const FILTERS = ['सब', 'खोया', 'मिला']

export default function KhoyaPage() {
  const [items, setItems] = useState<KhoyaPaya[]>([])
  const [filter, setFilter] = useState('सब')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchItems()
  }, [filter])

  async function fetchItems() {
    let q = supabase.from('khoya_paya').select('*').order('created_at', { ascending: false })
    if (filter !== 'सब') q = q.eq('kind', filter)
    const { data } = await q
    setItems(data as KhoyaPaya[] || [])
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const fd = new FormData(e.currentTarget)
    const res = await fetch('/api/khoya', { method: 'POST', body: fd })
    const json = await res.json()
    if (!res.ok) { setError(json.error || 'कुछ गड़बड़ हुई।'); setLoading(false); return }
    setSuccess(true)
    setLoading(false)
    fetchItems()
    ;(e.target as HTMLFormElement).reset()
  }

  return (
    <section className="sec">
      <div className="wrap">
        <h2 className="sh">खोया–पाया</h2>
        <p className="sp">वार्ड 09 में कुछ खो जाए या मिल जाए — यहाँ लिख दीजिए</p>

        <div className="filters">
          {FILTERS.map(f => (
            <button key={f} className="chip" aria-pressed={filter === f ? 'true' : 'false'} onClick={() => setFilter(f)}>{f}</button>
          ))}
        </div>

        <div className="kgrid">
          {items.length === 0 ? (
            <div className="empty" style={{ gridColumn: '1/-1' }}>
              <b>अभी कुछ नहीं</b>
              <p>यहाँ वार्ड की खोई और मिली चीज़ें लिखी जाती हैं। नीचे फ़ॉर्म से आप पहली बात लिख सकते हैं।</p>
            </div>
          ) : items.map(item => (
            <div key={item.id} className="kcard">
              <span className={`kbadge ${item.kind === 'खोया' ? 'khoya' : 'mila'}`}>{item.kind}</span>
              <b>{item.title}</b>
              <p>{item.detail}</p>
              {item.area && <div className="karea">📍 {item.area}</div>}
            </div>
          ))}
        </div>

        <div className="hint" style={{ marginTop: 20 }}>किसी का नंबर यहाँ नहीं दिखता। संपर्क जनसेवा टीम के ज़रिए होता है — ताकि न किसी को स्पैम आए, न कोई झूठा दावा करे।</div>

        <div className="formwrap" style={{ marginTop: 34 }}>
          <h2 className="sh" style={{ fontSize: 20 }}>कुछ खोया या मिला है?</h2>
          <p className="sp">यहाँ लिख दीजिए — देखने के बाद पन्ने पर आ जाएगा</p>

          {success && <div className="succ"><b>लिख दिया गया!</b><p>जाँच के बाद यहाँ दिखेगा।</p></div>}
          {error && <div className="err">{error}</div>}

          <form onSubmit={handleSubmit} encType="multipart/form-data">
            <input type="text" name="website" style={{ position: 'absolute', left: '-9999px' }} tabIndex={-1} autoComplete="off" />
            <div className="tworow">
              <div className="f">
                <label>क्या हुआ</label>
                <select name="kind"><option>खोया</option><option>मिला</option></select>
              </div>
              <div className="f">
                <label>कहाँ</label>
                <input name="area" maxLength={60} placeholder="जैसे — मुख्य बाज़ार" />
              </div>
            </div>
            <div className="f">
              <label>क्या चीज़</label>
              <input name="title" maxLength={70} placeholder="जैसे — काले रंग का बटुआ" required />
            </div>
            <div className="f">
              <label>थोड़ा विस्तार से</label>
              <textarea name="detail" maxLength={400} placeholder="कब, कहाँ, और कोई पहचान" required />
            </div>
            <div className="f">
              <label>फ़ोटो</label>
              <input className="fileinput" type="file" name="photo" accept="image/*" capture="environment" />
            </div>
            <div className="tworow">
              <div className="f"><label>आपका नाम</label><input name="name" maxLength={60} /></div>
              <div className="f">
                <label>फ़ोन नंबर</label>
                <input name="phone" type="tel" inputMode="numeric" maxLength={15} required />
                <div className="hint">यह नंबर पन्ने पर नहीं दिखेगा। जनसेवा टीम आपको फ़ोन करेगी।</div>
              </div>
            </div>
            <button className="btn" type="submit" disabled={loading}>{loading ? 'लिखा जा रहा है…' : 'लिख दीजिए'}</button>
          </form>
        </div>
      </div>
    </section>
  )
}
