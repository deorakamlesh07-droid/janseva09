'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { Capacitor } from '@capacitor/core'

interface NavLinkItem {
  href: string
  label: string
  icon: React.ReactNode
}

const LINKS: NavLinkItem[] = [
  {
    href: '/',
    label: 'होम',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    href: '/dainik-karya',
    label: 'दैनिक कार्य',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
        <path d="m9 16 2 2 4-4" />
      </svg>
    ),
  },
  {
    href: '/register',
    label: 'शिकायतें',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
        <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
        <path d="M9 12h6" />
        <path d="M9 16h6" />
      </svg>
    ),
  },
  {
    href: '/new',
    label: 'शिकायत दर्ज',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
      </svg>
    ),
  },
  {
    href: '/sewaye',
    label: 'सरकारी सेवाएँ',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 21h18M3 10h18M5 10v11M9 10v11M15 10v11M19 10v11M12 3l9 7H3l9-7z" />
      </svg>
    ),
  },
  {
    href: '/numbers',
    label: 'नंबर',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
      </svg>
    ),
  },
  {
    href: '/khoya',
    label: 'खोया–पाया',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
        <path d="m3.3 7 8.7 5 8.7-5" />
        <path d="M12 22V12" />
      </svg>
    ),
  },
  {
    href: '/blood',
    label: 'ब्लड डोनर',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
      </svg>
    ),
  },
  {
    href: '/adm',
    label: 'संचालक',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>
    ),
  },
]

export default function NavClient() {
  const [isOpen, setIsOpen] = useState(false)
  const [isApk, setIsApk] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const pathname = usePathname()

  // Detect APK native environment
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const native =
        Capacitor.isNativePlatform() ||
        window.location.search.includes('apk=true') ||
        window.location.search.includes('apk=1') ||
        /Capacitor|JanSeva09App/i.test(navigator.userAgent)
      setIsApk(native)
    }
  }, [])

  const handleRefresh = () => {
    if (isRefreshing) return
    setIsRefreshing(true)
    setTimeout(() => {
      window.location.reload()
    }, 350)
  }

  function isActive(href: string) {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  // Close drawer when pathname changes
  useEffect(() => {
    setIsOpen(false)
  }, [pathname])

  // Prevent background scrolling when slidebar is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <>
      <nav className="nav">
        <div className="wrap">
          {/* Mobile slidebar toggle button */}
          <button
            type="button"
            className="mobile-slidebar-toggle"
            onClick={() => setIsOpen(true)}
            aria-label="नेविगेशन स्लाइडबार खोलें"
            aria-expanded={isOpen}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
              <line x1="3.5" y1="6" x2="20.5" y2="6" />
              <line x1="3.5" y1="12" x2="20.5" y2="12" />
              <line x1="3.5" y1="18" x2="20.5" y2="18" />
            </svg>
          </button>

          <a className="brand" href="/">
            <span className="mark">09</span>
            <span>
              <b>जनसेवा 09</b>
              <i>वार्ड 09, जोधपुर</i>
            </span>
          </a>

          {/* Desktop menu buttons */}
          <div className="menu desktop-only-menu">
            {LINKS.map(link => (
              <a
                key={link.href}
                href={link.href}
                className={isActive(link.href) ? 'on' : ''}
              >
                {link.label}
              </a>
            ))}
          </div>

          <div className="nav-actions">
            {/* APK ONLY: Refresh Button */}
            {isApk && (
              <button
                type="button"
                className={`apk-refresh-btn ${isRefreshing ? 'is-spinning' : ''}`}
                onClick={handleRefresh}
                title="पेज रिफ्रेश करें"
                aria-label="पेज रिफ्रेश करें"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21.5 2v6h-6" />
                  <path d="M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-1.19" />
                </svg>
                <span className="apk-refresh-label">रिफ्रेश</span>
              </button>
            )}

            <a className="emg" href="/numbers" title="आपातकालीन नंबर">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <path d="M12 9v4" />
                <path d="M12 17h.01" />
                <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
              </svg>
              <span>आपातकाल</span>
            </a>
          </div>
        </div>
      </nav>
      <div className="nav-spacer" aria-hidden="true" />

      {/* Mobile Slidebar Backdrop */}
      <div
        className={`mobile-slidebar-backdrop ${isOpen ? 'is-open' : ''}`}
        onClick={() => setIsOpen(false)}
        aria-hidden="true"
      />

      {/* Mobile Slidebar Drawer */}
      <aside
        className={`mobile-slidebar-drawer ${isOpen ? 'is-open' : ''}`}
        aria-label="मोबाइल नेविगेशन"
      >
        <div className="slidebar-header">
          <div className="slidebar-brand">
            <span className="slidebar-mark">09</span>
            <div>
              <span className="slidebar-title">जनसेवा 09</span>
              <span className="slidebar-subtitle">वार्ड 09, जोधपुर</span>
            </div>
          </div>
          <button
            type="button"
            className="slidebar-close-btn"
            onClick={() => setIsOpen(false)}
            aria-label="मेन्यू बंद करें"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <nav className="slidebar-nav-list">
          {LINKS.map(link => {
            const active = isActive(link.href)
            return (
              <a
                key={link.href}
                href={link.href}
                className={`slidebar-link ${active ? 'is-active' : ''}`}
                onClick={() => setIsOpen(false)}
              >
                <span className="slidebar-link-icon">{link.icon}</span>
                <span className="slidebar-link-text">{link.label}</span>
                {active && <span className="slidebar-link-dot" />}
              </a>
            )
          })}
        </nav>

        <div className="slidebar-footer">
          {isApk && (
            <button
              type="button"
              className="slidebar-refresh-btn"
              onClick={handleRefresh}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21.5 2v6h-6" />
                <path d="M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-1.19" />
              </svg>
              <span>पेज रिफ्रेश करें</span>
            </button>
          )}

          <a
            href="/numbers"
            className="slidebar-emg-btn"
            onClick={() => setIsOpen(false)}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <path d="M12 9v4" />
              <path d="M12 17h.01" />
              <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
            </svg>
            <span>आपातकालीन सहायता नंबर</span>
          </a>
        </div>
      </aside>
    </>
  )
}
