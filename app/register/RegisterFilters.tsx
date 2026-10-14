'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'

const STATUS_FILTERS = [
  { key: '', label: 'सब' },
  { key: 'काम पूरा', label: 'काम पूरा' },
  { key: 'काम चालू', label: 'काम चालू' },
  { key: 'स्वीकृत', label: 'स्वीकृत' },
  { key: 'दर्ज', label: 'नई' },
]

const CATEGORIES = [
  'गली की सफ़ाई',
  'कचरा गाड़ी नहीं आई',
  'नाली / सीवर जाम',
  'स्ट्रीट लाइट',
  'सड़क / गड़्ग़ा',
  'पानी भराव',
  'पानी नहीं आ रहा',
  'आवारा पशु',
  'मच्छर / फॉगिंग',
  'पार्क व अन्य'
]

const CAT_ICONS: Record<string, string> = {
  'गली की सफ़ाई': '🧹',
  'कचरा गाड़ी नहीं आई': '🚛',
  'नाली / सीवर जाम': '🚿',
  'स्ट्रीट लाइट': '💡',
  'सड़क / गड़्ग़ा': '🕳️',
  'पानी भराव': '🌊',
  'पानी नहीं आ रहा': '🚰',
  'आवारा पशु': '🐄',
  'मच्छर / फॉगिंग': '🦟',
  'पार्क व अन्य': '🌳',
}

const HINDI_MONTHS = [
  'जनवरी', 'फ़रवरी', 'मार्च', 'अप्रैल', 'मई', 'जून',
  'जुलाई', 'अगस्त', 'सितंबर', 'अक्तूबर', 'नवंबर', 'दिसंबर'
]

const HINDI_DAYS = ['रवि', 'सोम', 'मंगल', 'बुध', 'गुरु', 'शुक्र', 'शनि']

function formatDateParam(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export default function RegisterFilters({
  currentFilter,
  currentCategory,
  currentDate,
  currentQuery,
}: {
  currentFilter: string
  currentCategory: string
  currentDate: string
  currentQuery: string
}) {
  const router = useRouter()

  const [showCal, setShowCal] = useState(false)
  const [calMonth, setCalMonth] = useState(() => {
    if (currentDate) {
      const d = new Date(currentDate + 'T00:00:00')
      return new Date(d.getFullYear(), d.getMonth(), 1)
    }
    return new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  })
  const calRef = useRef<HTMLDivElement>(null)

  // Close calendar on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (calRef.current && !calRef.current.contains(e.target as Node)) {
        setShowCal(false)
      }
    }
    if (showCal) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [showCal])

  function buildUrl(overrides: Record<string, string>) {
    const params = new URLSearchParams()
    const q = overrides.q !== undefined ? overrides.q : currentQuery
    const f = overrides.f !== undefined ? overrides.f : currentFilter
    const c = overrides.c !== undefined ? overrides.c : currentCategory
    const d = overrides.d !== undefined ? overrides.d : currentDate
    if (q) params.set('q', q)
    if (f) params.set('f', f)
    if (c) params.set('c', c)
    if (d) params.set('d', d)
    const ps = params.toString()
    return `/register${ps ? '?' + ps : ''}`
  }

  function navigate(overrides: Record<string, string>) {
    router.push(buildUrl(overrides))
  }

  // Calendar calculations
  const calYear = calMonth.getFullYear()
  const calMon = calMonth.getMonth()
  const firstDay = new Date(calYear, calMon, 1).getDay()
  const daysInMonth = new Date(calYear, calMon + 1, 0).getDate()
  const today = new Date()

  function prevMonth() {
    setCalMonth(new Date(calYear, calMon - 1, 1))
  }
  function nextMonth() {
    const next = new Date(calYear, calMon + 1, 1)
    if (next <= new Date(today.getFullYear(), today.getMonth() + 1, 1)) {
      setCalMonth(next)
    }
  }

  function selectDate(day: number) {
    const selected = new Date(calYear, calMon, day)
    navigate({ d: formatDateParam(selected) })
    setShowCal(false)
  }

  function selectToday() {
    navigate({ d: formatDateParam(today) })
    setShowCal(false)
  }

  function clearDate() {
    navigate({ d: '' })
    setShowCal(false)
  }

  const selectedDateStr = currentDate
    ? new Date(currentDate + 'T00:00:00').toLocaleDateString('hi-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      })
    : ''

  return (
    <>
      {/* Status Filters Chips */}
      <div className="filters">
        {STATUS_FILTERS.map(fil => (
          <a
            key={fil.key}
            className="chip"
            aria-pressed={currentFilter === fil.key ? 'true' : 'false'}
            href={buildUrl({ f: fil.key })}
          >
            {fil.label}
          </a>
        ))}
      </div>

      {/* Category + Date Filter Bar */}
      <div className="filter-bar">
        {/* Category Dropdown */}
        <div className="filter-group">
          <label className="filter-label">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
              <path d="M4 4h16v2.172a2 2 0 0 1-.586 1.414l-5.828 5.828A2 2 0 0 0 13 14.828V19l-2 2v-6.172a2 2 0 0 0-.586-1.414L4.586 7.586A2 2 0 0 1 4 6.172Z" />
            </svg>
            श्रेणी
          </label>
          <select
            className="filter-select"
            value={currentCategory}
            onChange={e => navigate({ c: e.target.value })}
          >
            <option value="">सभी श्रेणियाँ</option>
            {CATEGORIES.map(cat => (
              <option key={cat} value={cat}>
                {CAT_ICONS[cat] || '📋'} {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Calendar / Date Picker Button */}
        <div className="filter-group" ref={calRef}>
          <label className="filter-label">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            तारीख़
          </label>
          <button
            type="button"
            className={`filter-datebtn${currentDate ? ' active' : ''}`}
            onClick={() => setShowCal(!showCal)}
            aria-expanded={showCal}
          >
            {currentDate ? (
              <span className="date-val">
                {selectedDateStr}
                <span
                  className="date-clear"
                  onClick={e => { e.stopPropagation(); clearDate() }}
                  title="हटाइए"
                >✕</span>
              </span>
            ) : (
              <span>तारीख़ चुनिए</span>
            )}
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </button>

          {/* Interactive Calendar Dropdown */}
          {showCal && (
            <div className="cal-popup" role="dialog" aria-label="कैलेंडर">
              <div className="cal-head">
                <button type="button" onClick={prevMonth} className="cal-arrow" title="पिछला महीना">‹</button>
                <span className="cal-title">
                  {`${HINDI_MONTHS[calMon]} ${calYear}`}
                </span>
                <button type="button" onClick={nextMonth} className="cal-arrow" title="अगला महीना">›</button>
              </div>

              <div className="cal-days">
                {HINDI_DAYS.map(d => (
                  <span key={d} className="cal-dayname">{d}</span>
                ))}
              </div>

              <div className="cal-grid">
                {Array.from({ length: firstDay }).map((_, i) => (
                  <span key={`empty-${i}`} className="cal-empty" />
                ))}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1
                  const dateObj = new Date(calYear, calMon, day)
                  const dateStr = formatDateParam(dateObj)
                  const isToday = calYear === today.getFullYear() && calMon === today.getMonth() && day === today.getDate()
                  const isSelected = dateStr === currentDate
                  const isFuture = dateObj > today

                  return (
                    <button
                      key={day}
                      type="button"
                      className={`cal-day${isToday ? ' today' : ''}${isSelected ? ' selected' : ''}${isFuture ? ' future' : ''}`}
                      disabled={isFuture}
                      onClick={() => selectDate(day)}
                    >
                      {day}
                    </button>
                  )
                })}
              </div>

              {/* Quick actions: Today & Clear */}
              <div className="cal-actions">
                <button type="button" className="cal-btn-today" onClick={selectToday}>
                  आज
                </button>
                {currentDate && (
                  <button type="button" className="cal-clear" onClick={clearDate}>
                    तारीख़ हटाइए
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Active Filters Summary Pills */}
      {(currentCategory || currentDate) && (
        <div className="active-filters">
          <span className="af-label">फ़िल्टर:</span>
          {currentCategory && (
            <span className="af-tag">
              {CAT_ICONS[currentCategory] || '📋'} {currentCategory}
              <button onClick={() => navigate({ c: '' })} className="af-x" title="हटाइए">✕</button>
            </span>
          )}
          {currentDate && (
            <span className="af-tag">
              📅 {selectedDateStr}
              <button onClick={() => navigate({ d: '' })} className="af-x" title="हटाइए">✕</button>
            </span>
          )}
          <button className="af-clearall" onClick={() => navigate({ c: '', d: '' })}>
            फ़िल्टर साफ़ करें
          </button>
        </div>
      )}
    </>
  )
}
