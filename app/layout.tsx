import type { Metadata, Viewport } from 'next'
import { cookies } from 'next/headers'
import './globals.css'
import NavClient from './NavClient'
import NativeTranslator from './NativeTranslator'
import CapacitorBridge from './CapacitorBridge'
import { LanguageProvider, Language } from '@/context/LanguageContext'

export const metadata: Metadata = {
  title: 'जनसेवा — वार्ड 09, जोधपुर का अपना रजिस्टर',
  description: 'वार्ड 09, जोधपुर का अपना शिकायत रजिस्टर। सरकारी पोर्टल नहीं।',
}

export const viewport: Viewport = {
  themeColor: '#FFFFFF',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()
  const initialLang = (cookieStore.get('ward9_lang')?.value as Language) || 'hi'

  return (
    <html lang={initialLang} suppressHydrationWarning>
      <head>
        <meta name="color-scheme" content="light" />
        <meta name="theme-color" content="#FFFFFF" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Anek+Devanagari:wght@400;500;600;700;800&family=Caveat:wght@600;700&family=Mukta:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body suppressHydrationWarning>
        <LanguageProvider initialLang={initialLang}>
          <CapacitorBridge />
          <NativeTranslator />
          <NavClient />
          {children}
          <footer className="ft">
            <div className="wrap">
              <span>
                जनसेवा 09 · जोधपुर — यह सरकारी पोर्टल नहीं है।
                यह वार्ड स्तर की नागरिक शिकायत एवं जनसुनवाई व्यवस्था है, जहाँ शिकायतें संबंधित प्रतिनिधि तक पहुँचाकर उनके समाधान की स्थिति पारदर्शी रूप से दिखाई जाती है।
              </span>
            </div>
          </footer>
        </LanguageProvider>
      </body>
    </html>
  )
}
