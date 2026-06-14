import type { MetadataRoute } from 'next'

const PUBLIC_PATHS = [
  '/',
  '/pricing',
  '/demo',
  '/get-started',
  '/tools/roi-calculator',
  '/security',
  '/privacy',
  '/terms',
  '/dpa',
  '/about',
  '/contact',
  '/directory',
  '/connect',
  '/connect/docs',
  '/cpa-council',
  '/certification',
]

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL ?? 'https://closebooks-app.vercel.app').replace(/\/$/, '')
  const now = new Date()

  return PUBLIC_PATHS.map((path) => ({
    url: `${baseUrl}${path}`,
    lastModified: now,
    changeFrequency: path === '/' || path === '/pricing' ? 'weekly' : 'monthly',
    priority: path === '/' ? 1 : path === '/pricing' ? 0.9 : 0.6,
  }))
}
