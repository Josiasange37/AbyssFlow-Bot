/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['localhost'],
  },
  env: {
    BOT_API_URL: process.env.BOT_API_URL || 'http://localhost:3001',
  },
}

module.exports = nextConfig
