import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
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
