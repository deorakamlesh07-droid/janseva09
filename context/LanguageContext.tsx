'use client'

import React, { createContext, useContext, useEffect, useState, useTransition } from 'react'
import { DICTIONARY, translatePhrase } from '@/lib/i18n'

export type Language = 'hi' | 'en'

interface LanguageContextType {
  lang: Language
  setLang: (lang: Language) => void
  t: (phrase: string) => string
}

const LanguageContext = createContext<LanguageContextType>({
  lang: 'hi',
  setLang: () => {},
  t: (phrase: string) => phrase,
})

export function LanguageProvider({
  children,
  initialLang = 'hi',
}: {
  children: React.ReactNode
  initialLang?: Language
}) {
  const [lang, setLangState] = useState<Language>(initialLang)
  const [, startTransition] = useTransition()

  useEffect(() => {
    // Read saved preference from localStorage or cookie
    const saved = localStorage.getItem('ward9_lang') as Language | null
    if (saved && (saved === 'en' || saved === 'hi') && saved !== lang) {
      setLangState(saved)
      document.documentElement.lang = saved
    }

    function onCustomLangChange(e: Event) {
      const customEvent = e as CustomEvent<{ lang: Language }>
      if (customEvent.detail?.lang) {
        setLangState(customEvent.detail.lang)
      }
    }

    window.addEventListener('ward9_language_change', onCustomLangChange)
    return () => window.removeEventListener('ward9_language_change', onCustomLangChange)
  }, [])

  function setLang(newLang: Language) {
    if (newLang === lang) return

    startTransition(() => {
      setLangState(newLang)
    })

    if (typeof window !== 'undefined') {
      localStorage.setItem('ward9_lang', newLang)
      document.cookie = `ward9_lang=${newLang}; path=/; max-age=31536000; SameSite=Lax`
      document.documentElement.lang = newLang
      window.dispatchEvent(
        new CustomEvent('ward9_language_change', { detail: { lang: newLang } })
      )
    }
  }

  function t(phrase: string): string {
    if (!phrase || lang === 'hi') return phrase
    return translatePhrase(phrase)
  }

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  return useContext(LanguageContext)
}
