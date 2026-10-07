'use client'

import { useLanguage, Language } from '@/context/LanguageContext'

export type { Language }

export default function LanguageSlidebar() {
  const { lang, setLang } = useLanguage()

  return (
    <div
      className="lang-slider-container"
      role="group"
      aria-label="Language selection / भाषा चयन"
    >
      <div className={`lang-slider-track ${lang === 'en' ? 'is-en' : 'is-hi'}`}>
        {/* Animated sliding thumb */}
        <div className="lang-slider-thumb" aria-hidden="true" />

        {/* Hindi Option */}
        <button
          type="button"
          className={`lang-btn ${lang === 'hi' ? 'active' : ''}`}
          onClick={() => setLang('hi')}
          aria-pressed={lang === 'hi'}
          title="हिन्दी में देखें"
        >
          <span className="lang-icon">🇮🇳</span>
          <span className="lang-text">हिन्दी</span>
        </button>

        {/* English Option */}
        <button
          type="button"
          className={`lang-btn ${lang === 'en' ? 'active' : ''}`}
          onClick={() => setLang('en')}
          aria-pressed={lang === 'en'}
          title="View in English"
        >
          <span className="lang-icon">🌐</span>
          <span className="lang-text">English</span>
        </button>
      </div>
    </div>
  )
}
