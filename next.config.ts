import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  poweredByHeader: false,
  compress: true,
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      { protocol: 'https', hostname: 'sacrihqbwkgwfcybxvxa.supabase.co' },
      { protocol: 'https', hostname: '**.supabase.co' },
      { protocol: 'https', hostname: '*.supabase.co', pathname: '/storage/v1/object/public/**' },
    ],
  },
  async redirects() {
    return [
      { source: '/kary', destination: '/dainik-karya', permanent: true },
      { source: '/karya', destination: '/dainik-karya', permanent: true },
      { source: '/dainik-kary', destination: '/dainik-karya', permanent: true },
    ]
  },
}

export default nextConfig
