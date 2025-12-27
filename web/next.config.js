/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['localhost', '*.ngrok.io', '*.ngrok-free.app'],
  },
  env: {
    BOT_API_URL: process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001',
  },
  // Allow external access
  experimental: {
    allowMiddlewareResponseBody: true,
  },
  // Configure for public access
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig
