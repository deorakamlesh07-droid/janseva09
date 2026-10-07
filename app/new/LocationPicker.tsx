'use client'

import { useEffect, useRef, useState } from 'react'
import { useLanguage } from '@/context/LanguageContext'

interface LocationPickerProps {
  onLocationChange: (loc: { lat: number; lng: number; address?: string }) => void
}

export default function LocationPicker({ onLocationChange }: LocationPickerProps) {
  const { t } = useLanguage()
  // Default coordinates: Jodhpur center (Ward 09 area approx)
  const defaultLat = 26.2389
  const defaultLng = 73.0243

  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [locating, setLocating] = useState(false)
  const [locError, setLocError] = useState('')
  const [address, setAddress] = useState('')
  const [mapLoaded, setMapLoaded] = useState(false)

  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markerRef = useRef<any>(null)

  // 1. Load Leaflet CDN script & stylesheet
  useEffect(() => {
    if (typeof window === 'undefined') return

    // Inject Leaflet CSS if not already present
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link')
      link.id = 'leaflet-css'
      link.rel = 'stylesheet'
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
      document.head.appendChild(link)
    }

    // Inject Leaflet JS if not already present
    if (!(window as any).L) {
      const script = document.createElement('script')
      script.id = 'leaflet-js'
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
      script.async = true
      script.onload = () => initMap()
      document.body.appendChild(script)
    } else {
      initMap()
    }

    return () => {
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove()
        } catch (e) {}
        mapInstanceRef.current = null
      }
    }
  }, [])

  // 2. Initialize Leaflet map
  function initMap() {
    const L = (window as any).L
    if (!L || !mapContainerRef.current || mapInstanceRef.current) return

    const initialLat = coords?.lat || defaultLat
    const initialLng = coords?.lng || defaultLng

    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLng],
      zoom: 14,
      scrollWheelZoom: false,
    })

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map)

    // Red pin icon or standard marker
    const marker = L.marker([initialLat, initialLng], {
      draggable: true,
    }).addTo(map)

    marker.bindPopup('<b>शिकायत का स्थान</b><br>पिन को खिसकाकर सही जगह चुनें').openPopup()

    // Handle marker drag
    marker.on('dragend', () => {
      const pos = marker.getLatLng()
      updatePosition(pos.lat, pos.lng)
    })

    // Handle map click
    map.on('click', (e: any) => {
      marker.setLatLng(e.latlng)
      updatePosition(e.latlng.lat, e.latlng.lng)
    })

    mapInstanceRef.current = map
    markerRef.current = marker
    setMapLoaded(true)
  }

  // 3. Update coordinates and notify parent form
  function updatePosition(lat: number, lng: number, autoFetchAddress = true) {
    const roundedLat = parseFloat(lat.toFixed(6))
    const roundedLng = parseFloat(lng.toFixed(6))
    setCoords({ lat: roundedLat, lng: roundedLng })
    onLocationChange({ lat: roundedLat, lng: roundedLng, address })

    if (autoFetchAddress) {
      // Reverse geocode via Nominatim (with error boundary)
      fetch(`https://nominatim.openstreetmap.org/reverse?lat=${roundedLat}&lon=${roundedLng}&format=json&accept-language=hi,en`)
        .then(res => res.json())
        .then(data => {
          if (data && data.display_name) {
            const shortAddr = data.address?.suburb || data.address?.neighbourhood || data.address?.road || data.display_name.split(',')[0]
            setAddress(shortAddr)
            onLocationChange({ lat: roundedLat, lng: roundedLng, address: shortAddr })
          }
        })
        .catch(() => {})
    }
  }

  // 4. GPS "मेरी वर्तमान लोकेशन प्राप्त करें"
  function handleGetCurrentLocation() {
    if (!navigator.geolocation) {
      setLocError('आपके ब्राउज़र में GPS लोकेशन समर्थित नहीं है।')
      return
    }

    setLocating(true)
    setLocError('')

    navigator.geolocation.getCurrentPosition(
      pos => {
        const { latitude, longitude } = pos.coords
        setLocating(false)
        updatePosition(latitude, longitude)

        const map = mapInstanceRef.current
        const marker = markerRef.current
        if (map && marker) {
          map.setView([latitude, longitude], 17)
          marker.setLatLng([latitude, longitude])
          marker.bindPopup('<b>✅ आपकी वर्तमान लोकेशन</b><br>पिन सटीक स्थान पर है').openPopup()
        }
      },
      err => {
        setLocating(false)
        let msg = t('लोकेशन प्राप्त नहीं हो सकी।')
        if (err.code === 1) {
          msg = t('लोकेशन की अनुमति नहीं दी गई। कृपया ब्राउज़र सेटिंग्स में लोकेशन चालू करें।')
        } else if (err.code === 2) {
          msg = t('GPS सिग्नल नहीं मिला। कृपया सीधे मैप पर टैप करके स्थान चुनें।')
        } else if (err.code === 3) {
          msg = t('लोकेशन का समय समाप्त हो गया। फिर से कोशिश करें।')
        }
        setLocError(msg)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    )
  }

  const mapsUrl = coords ? `https://maps.google.com/?q=${coords.lat},${coords.lng}` : null

  return (
    <div className="location-picker-wrap" data-native-i18n="true" style={{ marginTop: 6, marginBottom: 16 }}>
      {/* Top action row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
        <button
          type="button"
          onClick={handleGetCurrentLocation}
          disabled={locating}
          className="loc-gps-btn"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            background: locating ? '#E5E7EB' : 'linear-gradient(135deg, #2563EB, #1D4ED8)',
            color: locating ? '#6B7280' : '#FFFFFF',
            padding: '9px 16px',
            borderRadius: 10,
            fontSize: 14,
            fontWeight: 700,
            border: 0,
            cursor: locating ? 'not-allowed' : 'pointer',
            boxShadow: locating ? 'none' : '0 4px 12px rgba(37, 99, 235, 0.25)',
            transition: 'all 0.2s',
          }}
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M12 2v3m0 14v3M2 12h3m14 0h3" />
          </svg>
          {locating ? t('GPS लोकेशन खोजी जा रही है…') : t('📍 मेरी वर्तमान लोकेशन प्राप्त करें (GPS)')}
        </button>

        {coords && (
          <span style={{ fontSize: 13, color: '#059669', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <span>{t('✓ लोकेशन दर्ज:')}</span>
            <code style={{ background: '#ECFDF5', padding: '2px 6px', borderRadius: 4, color: '#047857' }}>
              {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}
            </code>
            {mapsUrl && (
              <a href={mapsUrl} target="_blank" rel="noreferrer" style={{ textDecoration: 'underline', color: '#2563EB', fontSize: 12 }}>
                {t('नक्शे पर देखें ↗')}
              </a>
            )}
          </span>
        )}
      </div>

      {locError && (
        <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#B91C1C', padding: '8px 12px', borderRadius: 8, fontSize: 13, marginBottom: 10 }}>
          ⚠️ {locError}
        </div>
      )}

      {/* Interactive Map Container */}
      <div
        ref={mapContainerRef}
        style={{
          width: '100%',
          height: '240px',
          borderRadius: '12px',
          overflow: 'hidden',
          border: '1.5px solid var(--line)',
          background: '#F3F4F6',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {!mapLoaded && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--ink2)', fontSize: 13 }}>
            {t('नक्शा लोड हो रहा है…')}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6, fontSize: 12, color: 'var(--ink2)' }}>
        <span>{t('👉 मैप पर टैप करके या लाल पिन खिसकाकर सटीक स्थान चुन सकते हैं।')}</span>
        {address && <span style={{ fontWeight: 600, color: 'var(--ink)' }}>{t('पहचान:')} {address}</span>}
      </div>

      {/* Hidden inputs for form submission */}
      <input type="hidden" name="latitude" value={coords ? String(coords.lat) : ''} />
      <input type="hidden" name="longitude" value={coords ? String(coords.lng) : ''} />
      <input type="hidden" name="location_address" value={address || ''} />
    </div>
  )
}
