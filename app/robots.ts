import type { MetadataRoute } from 'next'

function baseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : 'https://repofuse.com')
  )
}

export default function robots(): MetadataRoute.Robots {
  const url = baseUrl()
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/pricing'],
        disallow: ['/api/', '/dashboard/'],
      },
    ],
    sitemap: `${url}/sitemap.xml`,
    host: url,
  }
}
