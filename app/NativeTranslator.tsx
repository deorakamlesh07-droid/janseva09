'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { translatePhrase } from '@/lib/i18n'

export default function NativeTranslator() {
  const pathname = usePathname()
  const langRef = useRef<'hi' | 'en'>('hi')

  useEffect(() => {
    const saved = (localStorage.getItem('ward9_lang') as 'hi' | 'en') || 'hi'
    langRef.current = saved

    function applyTranslation(root: Node, lang: 'hi' | 'en') {
      if (typeof window === 'undefined' || !root) return
      const isEnglish = lang === 'en'

      // 1. Text nodes (skip scripts, slider, and components with data-native-i18n)
      const walker = document.createTreeWalker(
        root,
        NodeFilter.SHOW_TEXT,
        {
          acceptNode(node) {
            const parent = node.parentElement
            if (!parent) return NodeFilter.FILTER_REJECT
            const tag = parent.tagName.toLowerCase()
            if (
              tag === 'script' ||
              tag === 'style' ||
              tag === 'noscript' ||
              parent.closest('.lang-slider-container') ||
              parent.closest('[data-native-i18n]')
            ) {
              return NodeFilter.FILTER_REJECT
            }
            if (!node.nodeValue || !node.nodeValue.trim()) {
              return NodeFilter.FILTER_SKIP
            }
            return NodeFilter.FILTER_ACCEPT
          },
        }
      )

      let currentNode = walker.nextNode()
      while (currentNode) {
        const textNode = currentNode as Text & { __origHi?: string }
        const currentVal = textNode.nodeValue || ''

        if (isEnglish) {
          if (!textNode.__origHi && /[\u0900-\u097F]/.test(currentVal)) {
            textNode.__origHi = currentVal
          }
          if (textNode.__origHi) {
            const translated = translatePhrase(textNode.__origHi)
            if (translated !== textNode.nodeValue) {
              textNode.nodeValue = translated
            }
          }
        } else {
          // Reverting to Hindi
          if (textNode.__origHi && textNode.nodeValue !== textNode.__origHi) {
            textNode.nodeValue = textNode.__origHi
          }
        }
        currentNode = walker.nextNode()
      }

      // 2. Input placeholders, titles, and aria-labels
      const rootEl = root as Element
      if (rootEl.querySelectorAll) {
        const elements = rootEl.querySelectorAll('input, textarea, [title], [aria-label]')
        elements.forEach(el => {
          if (el.closest('.lang-slider-container') || el.closest('[data-native-i18n]')) return
          const anyEl = el as any

          // Placeholder
          if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
            if (el.placeholder) {
              if (!anyEl.__origPlaceholder && /[\u0900-\u097F]/.test(el.placeholder)) {
                anyEl.__origPlaceholder = el.placeholder
              }
              if (isEnglish && anyEl.__origPlaceholder) {
                el.placeholder = translatePhrase(anyEl.__origPlaceholder)
              } else if (!isEnglish && anyEl.__origPlaceholder) {
                el.placeholder = anyEl.__origPlaceholder
              }
            }
          }

          // Title
          const title = el.getAttribute('title')
          if (title) {
            if (!anyEl.__origTitle && /[\u0900-\u097F]/.test(title)) {
              anyEl.__origTitle = title
            }
            if (isEnglish && anyEl.__origTitle) {
              el.setAttribute('title', translatePhrase(anyEl.__origTitle))
            } else if (!isEnglish && anyEl.__origTitle) {
              el.setAttribute('title', anyEl.__origTitle)
            }
          }

          // Aria-label
          const ariaLabel = el.getAttribute('aria-label')
          if (ariaLabel) {
            if (!anyEl.__origAria && /[\u0900-\u097F]/.test(ariaLabel)) {
              anyEl.__origAria = ariaLabel
            }
            if (isEnglish && anyEl.__origAria) {
              el.setAttribute('aria-label', translatePhrase(anyEl.__origAria))
            } else if (!isEnglish && anyEl.__origAria) {
              el.setAttribute('aria-label', anyEl.__origAria)
            }
          }
        })
      }
    }

    // Schedule translation after React hydration
    const timers = [
      setTimeout(() => applyTranslation(document.body, langRef.current), 100),
      setTimeout(() => applyTranslation(document.body, langRef.current), 300),
      setTimeout(() => applyTranslation(document.body, langRef.current), 700),
      setTimeout(() => applyTranslation(document.body, langRef.current), 1500),
    ]

    function onLanguageChange(e: Event) {
      const customEvent = e as CustomEvent<{ lang: 'hi' | 'en' }>
      const newLang = customEvent.detail?.lang || 'hi'
      langRef.current = newLang
      applyTranslation(document.body, newLang)
    }

    window.addEventListener('ward9_language_change', onLanguageChange)

    let isObserving = false
    const observer = new MutationObserver(() => {
      if (langRef.current !== 'en') return
      if (isObserving) return

      isObserving = true
      requestAnimationFrame(() => {
        applyTranslation(document.body, 'en')
        isObserving = false
      })
    })

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    })

    return () => {
      timers.forEach(clearTimeout)
      window.removeEventListener('ward9_language_change', onLanguageChange)
      observer.disconnect()
    }
  }, [pathname])

  return null
}
