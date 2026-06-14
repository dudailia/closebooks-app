import type { MetadataRoute } from 'next'

const PUBLIC_PATHS = [
  '/',
  '/pricing',
  '/demo',
  '/cpa-firms',
  '/pilot',
  '/implementation',
  '/sample-close-package',
  '/use-cases/month-end-close',
  '/use-cases/client-accounting-services',
  '/use-cases/bookkeeping-review',
  '/compare/floqast',
  '/compare/keeper',
  '/compare/financial-cents',
  '/get-started',
  '/tools/roi-calculator',
  '/security',
  '/security/questionnaire',
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
