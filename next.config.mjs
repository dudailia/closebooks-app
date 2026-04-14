/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // Allow production builds to succeed even with TS errors
    ignoreBuildErrors: true,
  },
  eslint: {
    // Allow production builds to succeed even with ESLint warnings
    ignoreDuringBuilds: true,
  },
  async headers() {
    const origin = process.env.NEXT_PUBLIC_APP_URL
    const acao = origin ? origin.replace(/\/$/, '') : null
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          ...(acao
            ? [
                { key: 'Access-Control-Allow-Origin', value: acao },
                { key: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, PATCH, DELETE, OPTIONS' },
                { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
                { key: 'Vary', value: 'Origin' },
              ]
            : []),
        ],
      },
    ]
  },
}

export default nextConfig
