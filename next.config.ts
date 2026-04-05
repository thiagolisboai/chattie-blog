import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  pageExtensions: ['ts', 'tsx', 'mdx'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'trychattie.com' },
      { protocol: 'https', hostname: 'images.pexels.com' },
    ],
    formats: ['image/avif', 'image/webp'],
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  // Allow trychattie.com to fetch /search-data.json cross-origin
  async headers() {
    return [
      {
        source: '/search-data.json',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: 'https://trychattie.com' },
          { key: 'Access-Control-Allow-Methods', value: 'GET' },
          { key: 'Cache-Control', value: 'public, max-age=3600, s-maxage=3600' },
        ],
      },
    ]
  },
}

export default nextConfig
