'use client'

import { useState, useEffect } from 'react'
import { supabase, Shikayat } from '@/lib/supabase'

const TABS = ['शिकायतें', 'आँकड़े', 'नागरिक रिकॉर्ड (फ़ोन डायरेक्टरी)', 'खोया–पाया', 'ब्लड डोनर']

function getNowFormatted() {
  const now = new Date()
  const d = now.toLocaleDateString('hi-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  const t = now.toLocaleTimeString('hi-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
  return `${d}, ${t}`
}

export default function AdminPage() {
  const [authed, setAuthed] = useState(false)
  const [pw, setPw] = useState('')
  const [pwErr, setPwErr] = useState('')
  const [tab, setTab] = useState(0)
  const [complaints, setComplaints] = useState<Shikayat[]>([])
  const [savingId, setSavingId] = useState<number | null>(null)
  const [uploadingId, setUploadingId] = useState<number | null>(null)
  const [needPhotoId, setNeedPhotoId] = useState<number | null>(null)
  const [feedback, setFeedback] = useState<Record<number, string>>({})
  const [filterStatus, setFilterStatus] = useState<string>('सब')

  // Auto-check existing session on load
  useEffect(() => {
    fetch('/api/adm')
      .then(res => res.json())
      .then(data => {
        if (data.authed) {
          setAuthed(true)
          fetchComplaints()
        }
      })
      .catch(() => {})
  }, [])

  async function login(e: React.FormEvent) {
    e.preventDefault()
    setPwErr('')
    const res = await fetch('/api/adm', {
      method: 'POST',
      body: JSON.stringify({ pw }),
      headers: { 'Content-Type': 'application/json' },
    })
    const data = await res.json()
    if (res.ok && data.authed) {
      setAuthed(true)
      fetchComplaints()
    } else {
      setPwErr(data.error || 'पासवर्ड गलत है')
    }
  }

  async function logout() {
    await fetch('/api/adm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'logout' }),
    })
    setAuthed(false)
    setComplaints([])
  }

  async function fetchComplaints() {
    try {
      const res = await fetch('/api/adm/complaints')
      if (res.ok) {
        const json = await res.json()
        if (json.data) setComplaints(json.data as Shikayat[])
      }
    } catch (err) {
      console.error('Failed to fetch complaints:', err)
    }
  }

  // 1. Direct status submit for "स्वीकृत" and "काम चालू" with auto date & time
  async function handleDirectStatus(c: Shikayat, targetStatus: 'स्वीकृत' | 'काम चालू') {
    setSavingId(c.id)
    setNeedPhotoId(null)
    const timeStamp = getNowFormatted()
    const note = `${targetStatus} — ${timeStamp}`

    try {
      const res = await fetch('/api/adm/complaint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: c.id,
          status: targetStatus,
          admin_note: note,
        }),
      })
      const result = await res.json()
      if (res.ok && result.ok) {
        setComplaints(prev =>
          prev.map(item =>
            item.id === c.id
              ? { ...item, status: targetStatus, admin_note: note }
              : item
          )
        )
        setFeedback(prev => ({
          ...prev,
          [c.id]: `✓ ${targetStatus} सीधे पोर्टल पर दर्ज हुआ (${timeStamp})`,
        }))
      } else {
        alert(result.error || 'पोर्टल पर दर्ज करने में समस्या आई।')
      }
    } catch (err: any) {
      alert(err.message || 'नेटवर्क समस्या आई।')
    } finally {
      setSavingId(null)
    }
  }

  // 2. "काम पूरा" click handler — requires photo before granting
  async function handleWorkCompleted(c: Shikayat) {
    if (!c.after_photo_url) {
      // Photo is required: do not grant work completed yet!
      setNeedPhotoId(c.id)
      const fileInput = document.getElementById(`after-file-${c.id}`) as HTMLInputElement
      if (fileInput) fileInput.click()
      return
    }

    // Photo already exists, submit directly with auto date & time
    setSavingId(c.id)
    setNeedPhotoId(null)
    const timeStamp = getNowFormatted()
    const note = `काम पूरा — ${timeStamp}`

    try {
      const res = await fetch('/api/adm/complaint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: c.id,
          status: 'काम पूरा',
          admin_note: note,
        }),
      })
      const result = await res.json()
      if (res.ok && result.ok) {
        setComplaints(prev =>
          prev.map(item =>
            item.id === c.id
              ? { ...item, status: 'काम पूरा', admin_note: note }
              : item
          )
        )
        setFeedback(prev => ({
          ...prev,
          [c.id]: `✓ काम पूरा सीधे पोर्टल पर दर्ज हुआ (${timeStamp})`,
        }))
      } else {
        alert(result.error || 'पोर्टल पर दर्ज करने में समस्या आई।')
      }
    } catch (err: any) {
      alert(err.message || 'नेटवर्क समस्या आई।')
    } finally {
      setSavingId(null)
    }
  }

  // 3. Upload after-photo and directly submit "काम पूरा" with auto date & time
  async function handleAfterPhotoUpload(c: Shikayat, file: File) {
    setUploadingId(c.id)
    setNeedPhotoId(null)
    const timeStamp = getNowFormatted()
    const note = `काम पूरा — ${timeStamp}`

    try {
      const fd = new FormData()
      fd.append('id', String(c.id))
      fd.append('status', 'काम पूरा')
      fd.append('admin_note', note)
      fd.append('photo', file)

      const res = await fetch('/api/adm/complaint', {
        method: 'POST',
        body: fd,
      })
      const result = await res.json()
      if (res.ok && result.ok) {
        const updated = result.data
        setComplaints(prev =>
          prev.map(item =>
            item.id === c.id
              ? { ...item, after_photo_url: updated.after_photo_url, status: 'काम पूरा', admin_note: note }
              : item
          )
        )
        setFeedback(prev => ({
          ...prev,
          [c.id]: `✓ काम की फ़ोटो अपलोड हुई और "काम पूरा" सीधे पोर्टल पर दर्ज हुआ (${timeStamp})`,
        }))
      } else {
        alert(result.error || 'फ़ोटो अपलोड में समस्या आई। फिर कोशिश कीजिए।')
      }
    } catch (e: any) {
      alert(e.message || 'सर्वर से संपर्क में समस्या आई।')
    } finally {
      setUploadingId(null)
    }
  }

  // Remove complaint (mark as हटाई)
  async function removeComplaint(id: number) {
    if (!confirm('क्या आप वाकई इस शिकायत को हटाना चाहते हैं?')) return
    try {
      const res = await fetch('/api/adm/complaint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: 'हटाई' }),
      })
      if (res.ok) {
        setComplaints(prev => prev.filter(c => c.id !== id))
      } else {
        alert('शिकायत हटाने में समस्या आई।')
      }
    } catch (e: any) {
      alert('शिकायत हटाने में समस्या आई।')
    }
  }

  if (!authed) {
    return (
      <section className="sec">
        <div className="wrap formwrap">
          <h2 className="sh">संचालन</h2>
          <p className="sp">सिर्फ़ जनसेवा 09 संचालक टीम के लिए</p>
          {pwErr && <div className="err">{pwErr}</div>}
          <form onSubmit={login}>
            <div className="f">
              <input
                type="password"
                value={pw}
                onChange={e => setPw(e.target.value)}
                placeholder="पासवर्ड"
                autoFocus
                required
              />
            </div>
            <button className="btn" type="submit">खोलिए</button>
          </form>
        </div>
      </section>
    )
  }

  const activeComplaints = complaints.filter(c => c.status !== 'हटाई')
  const completedCount = complaints.filter(c => c.status === 'काम पूरा' || c.status === 'पूरा').length
  const wipCount = complaints.filter(c => c.status === 'काम चालू').length
  const approvedCount = complaints.filter(c => c.status === 'स्वीकृत').length
  const newCount = complaints.filter(c => c.status === 'दर्ज').length
  const total = activeComplaints.length || 1

  // Category breakdown
  const catMap: Record<string, number> = {}
  activeComplaints.forEach(c => { const k = c.category || 'अन्य'; catMap[k] = (catMap[k] || 0) + 1 })
  const catEntries = Object.entries(catMap).sort((a, b) => b[1] - a[1])
  const maxCat = catEntries[0]?.[1] || 1

  // Last 7 days trend
  const days7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i))
    const label = d.toLocaleDateString('hi-IN', { day: 'numeric', month: 'short' })
    const dateStr = d.toISOString().slice(0, 10)
    const total7 = complaints.filter(c => c.created_at?.slice(0, 10) === dateStr).length
    const done7 = complaints.filter(c => (c.status === 'काम पूरा' || c.status === 'पूरा') && c.created_at?.slice(0, 10) === dateStr).length
    return { label, total7, done7 }
  })
  const maxDay = Math.max(...days7.map(d => d.total7), 1)

  const filteredComplaints = activeComplaints.filter(c => {
    if (filterStatus === 'सब') return true
    if (filterStatus === 'काम पूरा') return c.status === 'काम पूरा' || c.status === 'पूरा'
    return c.status === filterStatus
  })

  return (
    <section className="sec">
      <div className="wrap admwrap">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
          <div>
            <h2 className="sh" style={{ margin: 0 }}>संचालन</h2>
            <p className="sp" style={{ margin: '4px 0 0' }}>
              कुल {activeComplaints.length} शिकायतें · {approvedCount} स्वीकृत · {wipCount} काम चालू · {completedCount} काम पूरा
            </p>
          </div>
          <button
            type="button"
            onClick={logout}
            style={{
              padding: '7px 15px',
              background: '#FEE2E2',
              color: '#DC2626',
              border: '1.5px solid #FCA5A5',
              borderRadius: 8,
              fontSize: 13.5,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <span>लॉगआउट</span>
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        </div>

        <div className="admtabs">
          {TABS.map((t, i) => (
            <button key={t} className={`admtab${tab === i ? ' on' : ''}`} onClick={() => setTab(i)}>
              {t}
            </button>
          ))}
        </div>

        {/* ── आँकड़े TAB ── */}
        {tab === 1 && (
          <div style={{ paddingTop: 8 }}>
            {/* Summary cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 14, marginBottom: 28 }}>
              {[
                { label: 'कुल शिकायतें', val: activeComplaints.length, color: '#D95C00', bg: '#FFF3E8' },
                { label: 'नई (दर्ज)', val: newCount, color: '#1E3A8A', bg: '#EFF6FF' },
                { label: 'स्वीकृत', val: approvedCount, color: '#7C3AED', bg: '#F5F3FF' },
                { label: 'काम चालू', val: wipCount, color: '#D97706', bg: '#FFFBEB' },
                { label: 'काम पूरा', val: completedCount, color: '#16A34A', bg: '#F0FDF4' },
              ].map(s => (
                <div key={s.label} style={{ background: s.bg, borderRadius: 14, padding: '16px 18px', borderLeft: `4px solid ${s.color}` }}>
                  <div style={{ fontSize: 28, fontWeight: 800, color: s.color, fontFamily: 'Anek Devanagari,sans-serif' }}>{s.val}</div>
                  <div style={{ fontSize: 13, color: '#6B6862', marginTop: 2 }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Status Bar Chart */}
            <div style={{ background: '#fff', borderRadius: 16, padding: '22px 24px', marginBottom: 24, border: '1px solid #F5C490', boxShadow: '0 2px 12px rgba(217,92,0,0.07)' }}>
              <h3 style={{ margin: '0 0 18px', fontFamily: 'Anek Devanagari,sans-serif', fontSize: 17, color: '#3A1500' }}>📊 स्थिति के अनुसार शिकायतें</h3>
              {[
                { label: 'नई (दर्ज)', val: newCount, color: '#1E3A8A' },
                { label: 'स्वीकृत', val: approvedCount, color: '#7C3AED' },
                { label: 'काम चालू', val: wipCount, color: '#D97706' },
                { label: 'काम पूरा', val: completedCount, color: '#16A34A' },
              ].map(s => (
                <div key={s.label} style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 5, color: '#3A1500' }}>
                    <span style={{ fontWeight: 600 }}>{s.label}</span>
                    <span style={{ color: s.color, fontWeight: 700 }}>{s.val} ({Math.round(s.val * 100 / total)}%)</span>
                  </div>
                  <div style={{ height: 22, background: '#F5F4F1', borderRadius: 8, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${Math.round(s.val * 100 / total)}%`, background: s.color, borderRadius: 8, transition: 'width 0.6s ease', minWidth: s.val > 0 ? 6 : 0 }} />
                  </div>
                </div>
              ))}
            </div>

            {/* 7-Day Trend */}
            <div style={{ background: '#fff', borderRadius: 16, padding: '22px 24px', marginBottom: 24, border: '1px solid #F5C490', boxShadow: '0 2px 12px rgba(217,92,0,0.07)' }}>
              <h3 style={{ margin: '0 0 4px', fontFamily: 'Anek Devanagari,sans-serif', fontSize: 17, color: '#3A1500' }}>📈 पिछले 7 दिन का ट्रेंड</h3>
              <p style={{ margin: '0 0 18px', fontSize: 12.5, color: '#8B4513' }}>नारंगी = कुल दर्ज · हरा = पूरी हुईं</p>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, height: 140 }}>
                {days7.map(d => (
                  <div key={d.label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', height: 100, gap: 2 }}>
                      {/* total bar */}
                      <div style={{ width: '70%', height: `${Math.round(d.total7 * 100 / maxDay)}%`, background: 'linear-gradient(180deg,#FF6B00,#D95C00)', borderRadius: '6px 6px 0 0', minHeight: d.total7 > 0 ? 4 : 0, transition: 'height 0.5s ease', position: 'relative' }}>
                        {d.total7 > 0 && <span style={{ position: 'absolute', top: -18, left: '50%', transform: 'translateX(-50%)', fontSize: 11, fontWeight: 700, color: '#D95C00' }}>{d.total7}</span>}
                      </div>
                    </div>
                    {/* done overlay */}
                    <div style={{ fontSize: 10, color: '#16A34A', fontWeight: 600 }}>{d.done7 > 0 ? `✓${d.done7}` : ''}</div>
                    <div style={{ fontSize: 10.5, color: '#8B4513', textAlign: 'center', lineHeight: 1.2 }}>{d.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Category Histogram */}
            {catEntries.length > 0 && (
              <div style={{ background: '#fff', borderRadius: 16, padding: '22px 24px', border: '1px solid #F5C490', boxShadow: '0 2px 12px rgba(217,92,0,0.07)' }}>
                <h3 style={{ margin: '0 0 18px', fontFamily: 'Anek Devanagari,sans-serif', fontSize: 17, color: '#3A1500' }}>📋 श्रेणी के अनुसार शिकायतें</h3>
                {catEntries.map(([cat, cnt], idx) => (
                  <div key={cat} style={{ marginBottom: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4, color: '#3A1500' }}>
                      <span style={{ fontWeight: 600 }}>{cat}</span>
                      <span style={{ fontWeight: 700, color: '#D95C00' }}>{cnt}</span>
                    </div>
                    <div style={{ height: 18, background: '#FFF3E8', borderRadius: 6, overflow: 'hidden' }}>
                      <div style={{
                        height: '100%',
                        width: `${Math.round(cnt * 100 / maxCat)}%`,
                        background: `hsl(${25 + idx * 15}, 80%, ${45 + idx * 3}%)`,
                        borderRadius: 6,
                        transition: 'width 0.6s ease',
                      }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 0 && (
          <div>
            {/* Filter buttons */}
            <div className="filters" style={{ marginBottom: 16 }}>
              {['सब', 'दर्ज', 'स्वीकृत', 'काम चालू', 'काम पूरा'].map(f => (
                <button
                  key={f}
                  type="button"
                  className="chip"
                  aria-pressed={filterStatus === f ? 'true' : 'false'}
                  onClick={() => setFilterStatus(f)}
                >
                  {f === 'दर्ज' ? 'नई (दर्ज)' : f}
                </button>
              ))}
            </div>

            {filteredComplaints.length === 0 ? (
              <div className="empty">
                <b>कोई शिकायत नहीं मिली</b>
                <p>इस फ़िल्टर में कोई शिकायत नहीं है।</p>
              </div>
            ) : (
              filteredComplaints.map(c => {
                const isCompleted = c.status === 'काम पूरा' || c.status === 'पूरा'
                const isWip = c.status === 'काम चालू'
                const isApproved = c.status === 'स्वीकृत'

                return (
                  <div key={c.id} className="admrow">
                    <div className="admtop">
                      <div>
                        <strong style={{ fontSize: 16 }}>{c.code}</strong>
                        <span style={{ marginLeft: 10, fontWeight: 600, color: 'var(--amber)' }}>
                          {c.category}
                        </span>
                        <span
                          className={`pill ${isCompleted ? 'done' : isWip ? 'wip' : isApproved ? 'approved' : ''}`}
                          style={{ marginLeft: 10 }}
                        >
                          {c.status}
                        </span>
                      </div>
                      <span>
                        {new Date(c.created_at).toLocaleDateString('hi-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    </div>

                    <p style={{ fontSize: 14, color: 'var(--ink)', margin: '10px 0 8px', lineHeight: 1.5 }}>
                      {c.detail}
                    </p>

                    <div style={{ fontSize: 13, color: 'var(--ink2)', marginBottom: 10 }}>
                      📍 {c.mohalla} · 👤 {c.name} · 📞{' '}
                      <a href={`tel:${c.phone}`} style={{ color: 'var(--ink)', fontWeight: 600 }}>
                        {c.phone}
                      </a>
                    </div>

                    {/* Photos: Before & After */}
                    <div style={{ display: 'flex', gap: 12, marginBottom: 10, flexWrap: 'wrap', alignItems: 'flex-start' }}>
                      {c.photo_url && (
                        <div>
                          <div style={{ fontSize: 11, color: 'var(--ink2)', marginBottom: 3, fontWeight: 600 }}>
                            शिकायत की फ़ोटो
                          </div>
                          <img
                            className="admphoto"
                            src={c.photo_url}
                            alt="शिकायत फ़ोटो"
                            onClick={() => window.open(c.photo_url!, '_blank')}
                            style={{ cursor: 'pointer' }}
                          />
                        </div>
                      )}
                      {c.after_photo_url && (
                        <div>
                          <div style={{ fontSize: 11, color: '#059669', marginBottom: 3, fontWeight: 700 }}>
                            ✓ काम के बाद की फ़ोटो
                          </div>
                          <img
                            className="admphoto"
                            src={c.after_photo_url}
                            alt="काम के बाद फ़ोटो"
                            onClick={() => window.open(c.after_photo_url!, '_blank')}
                            style={{ cursor: 'pointer', borderColor: '#059669', borderWidth: 2 }}
                          />
                        </div>
                      )}
                    </div>

                    {/* Auto-stamped Date & Time */}
                    {c.admin_note && (
                      <div className="timestamp-tag">
                        <span>🕒</span>
                        <span>
                          <strong>दिनांक व समय:</strong> {c.admin_note}
                        </span>
                      </div>
                    )}

                    {feedback[c.id] && (
                      <div
                        style={{
                          fontSize: 12.5,
                          color: '#059669',
                          background: '#ECFDF5',
                          padding: '6px 10px',
                          borderRadius: 6,
                          marginTop: 8,
                          fontWeight: 600,
                        }}
                      >
                        {feedback[c.id]}
                      </div>
                    )}

                    {/* Warning if work completed clicked without photo */}
                    {needPhotoId === c.id && !c.after_photo_url && (
                      <div className="photo-warn-banner">
                        <b>⚠️ &quot;काम पूरा&quot; दर्ज करने के लिए काम के बाद की फ़ोटो अनिवार्य है!</b>
                        <span>
                          कृपया फ़ोटो खींचिए या गैलरी से चुनिए। फ़ोटो अपलोड होते ही स्थिति अपने आप &quot;काम पूरा&quot; हो जाएगी और तारीख़ व समय दर्ज हो जाएगा।
                        </span>
                        <button
                          type="button"
                          className="s-btn btn-done"
                          style={{ width: 'fit-content' }}
                          onClick={() => document.getElementById(`after-file-${c.id}`)?.click()}
                        >
                          📷 काम के बाद की फ़ोटो खींचिए / चुनिए
                        </button>
                      </div>
                    )}

                    {/* Hidden file input for after-photo */}
                    <input
                      id={`after-file-${c.id}`}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      style={{ display: 'none' }}
                      onChange={e => e.target.files?.[0] && handleAfterPhotoUpload(c, e.target.files[0])}
                    />

                    {/* 3 Status Action Buttons for Sanchalak */}
                    <div style={{ marginTop: 12 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink2)', marginBottom: 6 }}>
                        संचालक विकल्प (क्लिक करते ही तारीख़ व समय के साथ सीधे पोर्टल पर दर्ज होगा):
                      </div>
                      <div className="status-buttons">
                        {/* 1. स्वीकृत */}
                        <button
                          type="button"
                          className={`s-btn btn-approve ${isApproved ? 'active' : ''}`}
                          disabled={savingId === c.id || uploadingId === c.id}
                          onClick={() => handleDirectStatus(c, 'स्वीकृत')}
                        >
                          {savingId === c.id ? 'दर्ज हो रहा है…' : isApproved ? '✓ स्वीकृत' : 'स्वीकृत'}
                        </button>

                        {/* 2. काम चालू */}
                        <button
                          type="button"
                          className={`s-btn btn-wip ${isWip ? 'active' : ''}`}
                          disabled={savingId === c.id || uploadingId === c.id}
                          onClick={() => handleDirectStatus(c, 'काम चालू')}
                        >
                          {savingId === c.id ? 'दर्ज हो रहा है…' : isWip ? '✓ काम चालू' : 'काम चालू'}
                        </button>

                        {/* 3. काम पूरा */}
                        <button
                          type="button"
                          className={`s-btn btn-done ${isCompleted ? 'active' : ''}`}
                          disabled={savingId === c.id || uploadingId === c.id}
                          onClick={() => handleWorkCompleted(c)}
                        >
                          {uploadingId === c.id
                            ? 'फ़ोटो अपलोड हो रही है…'
                            : isCompleted
                            ? '✓ काम पूरा'
                            : 'काम पूरा (फ़ोटो अनिवार्य)'}
                        </button>
                      </div>
                    </div>

                    {/* Optional footer action row */}
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginTop: 10,
                        paddingTop: 8,
                        borderTop: '1px solid var(--line)',
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => document.getElementById(`after-file-${c.id}`)?.click()}
                        style={{
                          background: 'none',
                          border: 0,
                          color: 'var(--ink2)',
                          fontSize: 12,
                          cursor: 'pointer',
                          textDecoration: 'underline',
                          padding: 0,
                        }}
                      >
                        {c.after_photo_url ? '📷 काम के बाद की फ़ोटो बदलें' : '📷 काम के बाद की फ़ोटो जोड़ें'}
                      </button>
                      <button
                        type="button"
                        onClick={() => removeComplaint(c.id)}
                        style={{
                          background: 'none',
                          border: 0,
                          color: 'var(--red)',
                          fontSize: 12,
                          cursor: 'pointer',
                          padding: 0,
                        }}
                      >
                        शिकायत हटाएं
                      </button>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        )}

        {tab === 2 && <CitizensTab />}
        {tab === 3 && <KhoyaTab />}
        {tab === 4 && <BloodTab />}
      </div>
    </section>
  )
}

interface CitizenItem {
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

function CitizensTab() {
  const [citizens, setCitizens] = useState<CitizenItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'सब' | 'शिकायतकर्ता' | 'ब्लड डोनर'>('सब')
  const [expandedPhone, setExpandedPhone] = useState<string | null>(null)
  const [copiedPhone, setCopiedPhone] = useState<string | null>(null)
  const [copyAllMsg, setCopyAllMsg] = useState('')

  useEffect(() => {
    fetchCitizens()
  }, [])

  async function fetchCitizens() {
    setLoading(true)
    try {
      const res = await fetch('/api/adm/citizens')
      const data = await res.json()
      if (data.ok && data.citizens) {
        setCitizens(data.citizens)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  // Filter and search
  const filtered = citizens.filter(c => {
    const q = search.trim().toLowerCase()
    const matchesSearch =
      !q ||
      c.phone.includes(q) ||
      c.name.toLowerCase().includes(q) ||
      c.mohalla.toLowerCase().includes(q) ||
      c.tags.some(t => t.toLowerCase().includes(q)) ||
      c.complaints.some(comp => comp.code.toLowerCase().includes(q) || comp.detail.toLowerCase().includes(q))

    if (!matchesSearch) return false

    if (filter === 'शिकायतकर्ता') return c.complaintCount > 0
    if (filter === 'ब्लड डोनर') return !!c.bloodGroup
    return true
  })

  function copyPhone(phone: string) {
    navigator.clipboard.writeText(phone)
    setCopiedPhone(phone)
    setTimeout(() => setCopiedPhone(null), 2000)
  }

  function copyAllPhones() {
    const phones = filtered.map(c => c.phone).filter(Boolean)
    if (phones.length === 0) return
    navigator.clipboard.writeText(phones.join('\n'))
    setCopyAllMsg(`✓ ${phones.length} मोबाइल नंबर कॉपी हो गए!`)
    setTimeout(() => setCopyAllMsg(''), 3000)
  }

  function exportCSV() {
    const rows = [
      ['नाम', 'मोबाइल नंबर', 'मोहल्ला', 'कुल शिकायतें', 'ब्लड ग्रुप', 'टैग्स', 'अंतिम गतिविधि'],
      ...filtered.map(c => [
        `"${c.name}"`,
        `"${c.phone}"`,
        `"${c.mohalla}"`,
        c.complaintCount,
        `"${c.bloodGroup || '—'}"`,
        `"${c.tags.join(', ')}"`,
        `"${new Date(c.lastActive).toLocaleDateString('hi-IN')}"`
      ])
    ]
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + rows.map(e => e.join(',')).join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `ward09_nagrik_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div>
      {/* Search Bar */}
      <div className="citizen-search-box">
        <svg className="citizen-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
        <input
          type="text"
          className="citizen-search-input"
          placeholder="नागरिक का नाम, मोबाइल नंबर (उदा. 9829...) या मोहल्ला खोजें…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch('')}
            style={{
              position: 'absolute',
              right: 14,
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 0,
              fontSize: 16,
              color: 'var(--ink2)',
              cursor: 'pointer',
            }}
          >
            ✕
          </button>
        )}
      </div>

      {/* Filter Chips & Action Row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
        <div className="filters" style={{ margin: 0 }}>
          {(['सब', 'शिकायतकर्ता', 'ब्लड डोनर'] as const).map(f => (
            <button
              key={f}
              type="button"
              className="chip"
              aria-pressed={filter === f ? 'true' : 'false'}
              onClick={() => setFilter(f)}
            >
              {f === 'सब' ? `सब (${citizens.length})` : f}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          {copyAllMsg && (
            <span style={{ fontSize: 13, color: '#059669', fontWeight: 600 }}>{copyAllMsg}</span>
          )}
          <button
            type="button"
            className="citizen-act-btn"
            onClick={copyAllPhones}
            title="सभी फ़िल्टर किए गए नंबर कॉपी करें"
          >
            📋 सभी नंबर कॉपी करें ({filtered.length})
          </button>
          <button
            type="button"
            className="citizen-act-btn"
            onClick={exportCSV}
            title="CSV फ़ाइल डाउनलोड करें"
          >
            📥 CSV डाउनलोड
          </button>
        </div>
      </div>

      {/* Citizens List */}
      {loading ? (
        <div className="empty"><b>डेटा लोड हो रहा है…</b></div>
      ) : filtered.length === 0 ? (
        <div className="empty">
          <b>कोई नागरिक रिकॉर्ड नहीं मिला</b>
          <p>{search ? 'खोज बदलकर देखें।' : 'अभी कोई नागरिक दर्ज नहीं है।'}</p>
        </div>
      ) : (
        filtered.map(c => {
          const isExpanded = expandedPhone === c.phone
          const isCopied = copiedPhone === c.phone

          return (
            <div key={c.phone} className="citizen-card">
              <div className="citizen-header">
                <div>
                  <div className="citizen-name">
                    <span>👤 {c.name}</span>
                    <div className="citizen-badges">
                      {c.complaintCount > 0 && (
                        <span className="citizen-tag complaint">
                          {c.complaintCount} शिकायत{c.complaintCount > 1 ? 'ें' : ''}
                        </span>
                      )}
                      {c.bloodGroup && (
                        <span className="citizen-tag blood">
                          🩸 डोनर: {c.bloodGroup}
                        </span>
                      )}
                      {c.khoyaCount > 0 && (
                        <span className="citizen-tag khoya">
                          खोया-पाया
                        </span>
                      )}
                    </div>
                  </div>
                  {c.mohalla && (
                    <div style={{ fontSize: 13.5, color: 'var(--ink2)', marginTop: 4 }}>
                      📍 {c.mohalla}
                    </div>
                  )}
                </div>

                <div style={{ fontSize: 12, color: 'var(--ink2)' }}>
                  अंतिम गतिविधि: {new Date(c.lastActive).toLocaleDateString('hi-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </div>
              </div>

              {/* Contact Bar */}
              <div className="citizen-contact-bar">
                <span style={{ fontSize: 13, color: 'var(--ink2)', fontWeight: 600 }}>फ़ोन:</span>
                <a className="citizen-phone-link" href={`tel:${c.phone}`} title="कॉल करने के लिए क्लिक करें">
                  📞 {c.phone}
                </a>

                <button
                  type="button"
                  className="citizen-act-btn"
                  onClick={() => copyPhone(c.phone)}
                >
                  {isCopied ? '✓ कॉपी हुआ' : '📋 कॉपी'}
                </button>

                <a
                  className="citizen-act-btn wa"
                  href={`https://wa.me/91${c.phone}`}
                  target="_blank"
                  rel="noopener"
                  title="WhatsApp पर मैसेज करें"
                >
                  💬 WhatsApp
                </a>

                {c.complaintCount > 0 && (
                  <button
                    type="button"
                    className="citizen-act-btn"
                    style={{ marginLeft: 'auto', fontWeight: 700 }}
                    onClick={() => setExpandedPhone(isExpanded ? null : c.phone)}
                  >
                    {isExpanded ? '▲ शिकायतें छुपाएं' : `▼ शिकायतें देखें (${c.complaintCount})`}
                  </button>
                )}
              </div>

              {/* Complaints History Accordion */}
              {isExpanded && c.complaints.length > 0 && (
                <div className="citizen-complaints-list">
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--ink)', marginBottom: 8 }}>
                    दर्ज शिकायतों का इतिहास ({c.complaints.length}):
                  </div>
                  {c.complaints.map(comp => (
                    <div key={comp.id} className="citizen-complaint-item">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                        <div>
                          <strong>{comp.code}</strong> · <span style={{ color: 'var(--amber)', fontWeight: 600 }}>{comp.category}</span>
                          <span
                            className={`pill ${
                              comp.status === 'काम पूरा' || comp.status === 'पूरा'
                                ? 'done'
                                : comp.status === 'काम चालू'
                                ? 'wip'
                                : comp.status === 'स्वीकृत'
                                ? 'approved'
                                : ''
                            }`}
                            style={{ marginLeft: 8 }}
                          >
                            {comp.status}
                          </span>
                        </div>
                        <span style={{ fontSize: 12, color: 'var(--ink2)' }}>
                          {new Date(comp.created_at).toLocaleDateString('hi-IN')}
                        </span>
                      </div>
                      <p style={{ margin: '4px 0 6px', color: 'var(--ink)', lineHeight: 1.4 }}>
                        {comp.detail}
                      </p>
                      <a
                        href={`/s/${comp.code.replace('/', '-')}`}
                        target="_blank"
                        rel="noopener"
                        style={{ fontSize: 12, color: '#2563EB', textDecoration: 'underline', fontWeight: 600 }}
                      >
                        पोर्टल पर पूरा विवरण देखें →
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })
      )}
    </div>
  )
}

function KhoyaTab() {
  const [items, setItems] = useState<{ id: number; kind: string; title: string; detail: string; area: string; name: string; phone: string; created_at: string }[]>([])
  useEffect(() => {
    supabase.from('khoya_paya').select('*').order('created_at', { ascending: false }).then(({ data }) => setItems(data || []))
  }, [])
  return (
    <div>
      {items.map(item => (
        <div key={item.id} className="admrow">
          <div className="admtop">
            <strong>{item.kind}: {item.title}</strong>
            <span>{new Date(item.created_at).toLocaleDateString('hi-IN')}</span>
          </div>
          <p>{item.detail}</p>
          <div style={{ fontSize: 13, color: 'var(--ink2)' }}>📍 {item.area} · 📞 {item.phone} · 👤 {item.name}</div>
          <div className="admcontrols" style={{ marginTop: 10 }}>
            <button
              className="danger"
              onClick={async () => {
                if (!confirm('क्या आप वाकई इसे हटाना चाहते हैं?')) return
                const res = await fetch('/api/adm/delete-item', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ table: 'khoya_paya', id: item.id }),
                })
                if (res.ok) setItems(p => p.filter(i => i.id !== item.id))
                else alert('हटाने में समस्या आई।')
              }}
            >
              हटाइए
            </button>
          </div>
        </div>
      ))}
      {items.length === 0 && <div className="empty"><b>कोई नहीं</b></div>}
    </div>
  )
}

function BloodTab() {
  const [donors, setDonors] = useState<{ id: number; name: string; blood_group: string; mohalla: string; phone: string; created_at: string }[]>([])
  useEffect(() => {
    supabase.from('blood_donors').select('*').order('created_at', { ascending: false }).then(({ data }) => setDonors(data || []))
  }, [])
  return (
    <div>
      {donors.map(d => (
        <div key={d.id} className="admrow">
          <div className="admtop">
            <strong>{d.name} · {d.blood_group}</strong>
            <span>{new Date(d.created_at).toLocaleDateString('hi-IN')}</span>
          </div>
          <div style={{ fontSize: 13, color: 'var(--ink2)' }}>📍 {d.mohalla} · 📞 {d.phone}</div>
          <div className="admcontrols" style={{ marginTop: 10 }}>
            <button
              className="danger"
              onClick={async () => {
                if (!confirm('क्या आप वाकई इसे हटाना चाहते हैं?')) return
                const res = await fetch('/api/adm/delete-item', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ table: 'blood_donors', id: d.id }),
                })
                if (res.ok) setDonors(p => p.filter(x => x.id !== d.id))
                else alert('हटाने में समस्या आई।')
              }}
            >
              हटाइए
            </button>
          </div>
        </div>
      ))}
      {donors.length === 0 && <div className="empty"><b>कोई नहीं</b></div>}
    </div>
  )
}
