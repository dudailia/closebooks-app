import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://closebooks-app.vercel.app'

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/dashboard/', '/api/', '/portal/'],
    },
    sitemap: `${baseUrl.replace(/\/$/, '')}/sitemap.xml`,
  }
}
