import type { MetadataRoute } from 'next'

function baseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : 'https://repofuse.com')
  )
}

export default function sitemap(): MetadataRoute.Sitemap {
  const url = baseUrl()
  const now = new Date()
  return [
    { url: `${url}/`, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: `${url}/pricing`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
  ]
}
