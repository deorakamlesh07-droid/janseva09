'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import LanguageSlidebar from './LanguageSlidebar'
import { useLanguage } from '@/context/LanguageContext'

interface NavLinkItem {
  href: string
  hi: string
  en: string
  icon: React.ReactNode
}

const LINKS: NavLinkItem[] = [
  {
    href: '/',
    hi: 'होम',
    en: 'Home',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    href: '/dainik-karya',
    hi: 'दैनिक कार्य',
    en: 'Daily Work',
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
    hi: 'शिकायतें',
    en: 'Complaints',
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
    hi: 'शिकायत दर्ज',
    en: 'Register',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
      </svg>
    ),
  },
  {
    href: '/sewaye',
    hi: 'सरकारी सेवाएँ',
    en: 'Gov Services',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 21h18M3 10h18M5 10v11M9 10v11M15 10v11M19 10v11M12 3l9 7H3l9-7z" />
      </svg>
    ),
  },
  {
    href: '/numbers',
    hi: 'नंबर',
    en: 'Directory',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
      </svg>
    ),
  },
  {
    href: '/khoya',
    hi: 'खोया–पाया',
    en: 'Lost & Found',
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
    hi: 'ब्लड डोनर',
    en: 'Blood Donors',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
      </svg>
    ),
  },
  {
    href: '/adm',
    hi: 'संचालक',
    en: 'Dashboard',
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
  const pathname = usePathname()
  const { lang } = useLanguage()

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
          {/* Mobile slidebar toggle button - visible only on mobile screens */}
          <button
            type="button"
            className="mobile-slidebar-toggle"
            onClick={() => setIsOpen(true)}
            aria-label={lang === 'en' ? 'Open navigation slidebar' : 'नेविगेशन स्लाइडबार खोलें'}
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
              <b>{lang === 'en' ? 'Janseva 09' : 'जनसेवा 09'}</b>
              <i>{lang === 'en' ? 'Ward 09, Jodhpur' : 'वार्ड 09, जोधपुर'}</i>
            </span>
          </a>

          {/* Desktop menu buttons - visible normally on laptop/desktop */}
          <div className="menu desktop-only-menu">
            {LINKS.map(link => (
              <a
                key={link.href}
                href={link.href}
                className={isActive(link.href) ? 'on' : ''}
              >
                {lang === 'en' ? link.en : link.hi}
              </a>
            ))}
          </div>

          <div className="nav-actions">
            <LanguageSlidebar />

            <a className="emg" href="/numbers" title={lang === 'en' ? 'Emergency Contacts' : 'आपातकालीन नंबर'}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <path d="M12 9v4" />
                <path d="M12 17h.01" />
                <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
              </svg>
              <span>{lang === 'en' ? 'Emergency' : 'आपातकाल'}</span>
            </a>
          </div>
        </div>
      </nav>

      {/* Mobile Slidebar Backdrop (overlay) */}
      <div
        className={`mobile-slidebar-backdrop ${isOpen ? 'is-open' : ''}`}
        onClick={() => setIsOpen(false)}
        aria-hidden="true"
      />

      {/* Mobile Slidebar Drawer: slides in from left to right */}
      <aside
        className={`mobile-slidebar-drawer ${isOpen ? 'is-open' : ''}`}
        aria-label={lang === 'en' ? 'Mobile Navigation Slidebar' : 'मोबाइल नेविगेशन स्लाइडबार'}
        aria-hidden={!isOpen}
      >
        <div className="slidebar-header">
          <div className="slidebar-brand">
            <span className="slidebar-mark">09</span>
            <div>
              <b className="slidebar-title">{lang === 'en' ? 'Janseva 09' : 'जनसेवा 09'}</b>
              <span className="slidebar-subtitle">{lang === 'en' ? 'Ward 09, Jodhpur' : 'वार्ड 09, जोधपुर'}</span>
            </div>
          </div>
          <button
            type="button"
            className="slidebar-close-btn"
            onClick={() => setIsOpen(false)}
            aria-label={lang === 'en' ? 'Close slidebar' : 'स्लाइडबार बंद करें'}
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
                <span className="slidebar-link-text">{lang === 'en' ? link.en : link.hi}</span>
                {active && <span className="slidebar-link-dot" aria-hidden="true" />}
              </a>
            )
          })}
        </nav>

        <div className="slidebar-footer">
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
            <span>{lang === 'en' ? 'Emergency Numbers' : 'आपातकालीन नंबर'}</span>
          </a>
        </div>
      </aside>
    </>
  )
}
