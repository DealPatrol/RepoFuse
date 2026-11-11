import type { MetadataRoute } from 'next'
import { PUBLIC_PAGES, SITE_URL } from '@/lib/site'

export default function sitemap(): MetadataRoute.Sitemap {
  return PUBLIC_PAGES.map((page) => ({
    url: `${SITE_URL}${page.path === '/' ? '/' : page.path}`,
    lastModified: new Date(`${page.lastModified}T00:00:00Z`),
    changeFrequency: page.changeFrequency,
    priority: page.priority,
  }))
}
