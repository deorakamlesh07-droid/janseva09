'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

const GROUPS = ['A+', 'A−', 'B+', 'B−', 'O+', 'O−', 'AB+', 'AB−']

type DonorCount = { blood_group: string; count: number }

export default function BloodPage() {
  const [counts, setCounts] = useState<DonorCount[]>(() => GROUPS.map(g => ({ blood_group: g, count: 0 })))
  const [selected, setSelected] = useState('O+')
  const [donorCount, setDonorCount] = useState(0)
  const [needLoading, setNeedLoading] = useState(false)
  const [donorLoading, setDonorLoading] = useState(false)
  const [needSuccess, setNeedSuccess] = useState(false)
  const [donorSuccess, setDonorSuccess] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { fetchCounts() }, [])
  useEffect(() => { fetchGroupCount() }, [selected])

  async function fetchCounts() {
    try {
      const { data, error } = await supabase.from('blood_donors').select('blood_group')
      if (error || !data) return
      const map: Record<string, number> = {}
      data.forEach(d => { if (d?.blood_group) map[d.blood_group] = (map[d.blood_group] || 0) + 1 })
      setCounts(GROUPS.map(g => ({ blood_group: g, count: map[g] || 0 })))
    } catch (err) {
      console.error('fetchCounts error:', err)
    }
  }

  async function fetchGroupCount() {
    try {
      const { count, error } = await supabase.from('blood_donors').select('*', { count: 'exact', head: true }).eq('blood_group', selected)
      if (!error && typeof count === 'number') {
        setDonorCount(count)
      }
    } catch (err) {
      console.error('fetchGroupCount error:', err)
    }
  }

  async function handleNeed(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setNeedLoading(true); setError('')
    const fd = new FormData(e.currentTarget)
    fd.append('blood', selected); fd.append('what', 'need')
    try {
      const res = await fetch('/api/blood', { method: 'POST', body: fd })
      const json = await res.json()
      if (!res.ok) { setError(json.error || 'कुछ गड़बड़ हुई।'); setNeedLoading(false); return }
      setNeedSuccess(true); setNeedLoading(false)
    } catch (err) {
      setError('सर्वर से संपर्क नहीं हो पाया। कृपया पुनः प्रयास करें।')
      setNeedLoading(false)
    }
  }

  async function handleDonor(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setDonorLoading(true); setError('')
    const fd = new FormData(e.currentTarget)
    fd.append('what', 'donor')
    try {
      const res = await fetch('/api/blood', { method: 'POST', body: fd })
      const json = await res.json()
      if (!res.ok) { setError(json.error || 'कुछ गड़बड़ हुई।'); setDonorLoading(false); return }
      setDonorSuccess(true); setDonorLoading(false); fetchCounts()
    } catch (err) {
      setError('सर्वर से संपर्क नहीं हो पाया। कृपया पुनः प्रयास करें।')
      setDonorLoading(false)
    }
  }

  return (
    <section className="sec">
      <div className="wrap two">
        <div>
          <h2 className="sh">ब्लड डोनर</h2>
          <p className="sp">वार्ड 09 के लोग जिन्होंने खुद कहा है कि ज़रूरत पड़ने पर आएँगे</p>

          <div className="bgrid">
            {counts.map(g => (
              <button key={g.blood_group} className={`bg${selected === g.blood_group ? ' on' : ''}`} onClick={() => setSelected(g.blood_group)}>
                <b>{g.blood_group}</b><span>{g.count} लोग</span>
              </button>
            ))}
          </div>

          <div className="bres">
            <div className="cnt">{donorCount}</div>
            <div className="hint" style={{ margin: '6px 0 16px' }}>वार्ड 09 में {selected} वाले {donorCount} लोग रजिस्टर में हैं</div>

            {needSuccess ? (
              <div className="succ"><b>ज़रूरत दर्ज हो गई!</b><p>जनसेवा टीम जल्द संपर्क करेगी।</p></div>
            ) : (
              <form onSubmit={handleNeed}>
                <input type="hidden" name="what" value="need" />
                <input type="text" name="website" style={{ position: 'absolute', left: '-9999px' }} tabIndex={-1} autoComplete="off" />
                <div className="f"><input name="name" maxLength={60} placeholder="आपका नाम" /></div>
                <div className="f"><input name="phone" type="tel" inputMode="numeric" maxLength={15} placeholder="आपका फ़ोन नंबर" required /></div>
                <div className="f"><textarea name="detail" maxLength={300} placeholder="कहाँ और कब चाहिए — अस्पताल का नाम लिखिए" /></div>
                <button className="btn" type="submit" disabled={needLoading}>
                  {needLoading ? 'भेजा जा रहा है…' : 'ज़रूरत बताइए — जनसेवा टीम संपर्क कराएगी'}
                </button>
              </form>
            )}
            <div className="hint" style={{ marginTop: 12 }}>डोनर का नंबर किसी को नहीं दिखता। आप अपनी ज़रूरत लिखिए, जनसेवा टीम डोनर से पूछकर आपको जोड़ेगी।</div>
          </div>
        </div>

        <div>
          <h2 className="sh" style={{ fontSize: 20 }}>डोनर बनिए</h2>
          <p className="sp">आपका नंबर कभी किसी को नहीं दिखेगा</p>

          {error && <div className="err">{error}</div>}

          {donorSuccess ? (
            <div className="succ"><b>नाम जुड़ गया!</b><p>शुक्रिया। ज़रूरत पड़ने पर जनसेवा टीम फ़ोन करेगी।</p></div>
          ) : (
            <form onSubmit={handleDonor}>
              <input type="text" name="website" style={{ position: 'absolute', left: '-9999px' }} tabIndex={-1} autoComplete="off" />
              <div className="f"><label>नाम</label><input name="name" maxLength={60} required /></div>
              <div className="f">
                <label>ब्लड ग्रुप</label>
                <select name="blood">
                  {GROUPS.map(g => <option key={g}>{g}</option>)}
                </select>
              </div>
              <div className="f"><label>पता</label><input name="mohalla" maxLength={180} placeholder="गली, मोहल्ला" /></div>
              <div className="f">
                <label>फ़ोन नंबर</label>
                <input name="phone" type="tel" inputMode="numeric" maxLength={15} required />
                <div className="hint">यह नंबर वेबसाइट पर कभी नहीं दिखेगा। ज़रूरत पड़ने पर जनसेवा टीम आपको फ़ोन करेगी और आपकी हाँ के बाद ही आगे बात होगी।</div>
              </div>
              <div className="f">
                <label style={{ display: 'flex', gap: 9, alignItems: 'flex-start', fontWeight: 400, fontSize: 14 }}>
                  <input type="checkbox" name="consent" value="1" style={{ width: 'auto', marginTop: 4 }} required />
                  <span>मैं अपनी मर्ज़ी से नाम जोड़ रहा हूँ। जनसेवा टीम ज़रूरत पड़ने पर मुझे फ़ोन कर सकती है।</span>
                </label>
              </div>
              <button className="btn" type="submit" disabled={donorLoading}>{donorLoading ? 'जोड़ा जा रहा है…' : 'नाम जोड़िए'}</button>
            </form>
          )}
        </div>
      </div>
    </section>
  )
}
