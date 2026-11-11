import type { Metadata } from 'next'

/** Canonical public origin. Previews and aliases always point search engines here. */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL?.trim() || 'https://repofuse.com').replace(/\/$/, '')

export const SITE_NAME = 'RepoFuse'

export const DEFAULT_OG_IMAGE = {
  url: '/repofuse-logo.jpg',
  width: 1024,
  height: 1024,
  alt: 'RepoFuse logo',
}

/**
 * Per-page metadata with a self-referencing canonical, Open Graph, and Twitter tags.
 * Next.js replaces (does not deep-merge) openGraph/twitter from the root layout,
 * so every public page should build its metadata through this helper.
 */
export function pageMetadata({
  title,
  description,
  path,
  absoluteTitle = false,
}: {
  title: string
  description: string
  path: string
  absoluteTitle?: boolean
}): Metadata {
  const fullTitle = absoluteTitle ? title : `${title} · ${SITE_NAME}`
  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: 'website',
      url: path,
      siteName: SITE_NAME,
      title: fullTitle,
      description,
      images: [DEFAULT_OG_IMAGE],
    },
    twitter: {
      card: 'summary',
      title: fullTitle,
      description,
      images: [DEFAULT_OG_IMAGE.url],
    },
  }
}

export const NOINDEX: Metadata['robots'] = { index: false, follow: false }

/**
 * Public, indexable pages and the date their content last changed meaningfully.
 * Update the date when you edit a page; the sitemap uses it as lastmod.
 */
export const PUBLIC_PAGES: Array<{
  path: string
  lastModified: string
  changeFrequency: 'weekly' | 'monthly' | 'yearly'
  priority: number
}> = [
  { path: '/', lastModified: '2026-11-10', changeFrequency: 'weekly', priority: 1 },
  { path: '/pricing', lastModified: '2026-11-10', changeFrequency: 'monthly', priority: 0.9 },
  { path: '/mcp', lastModified: '2026-11-10', changeFrequency: 'monthly', priority: 0.8 },
  { path: '/legal/documentation', lastModified: '2026-11-10', changeFrequency: 'monthly', priority: 0.6 },
  { path: '/legal/support', lastModified: '2026-11-10', changeFrequency: 'yearly', priority: 0.4 },
  { path: '/privacy', lastModified: '2026-11-10', changeFrequency: 'yearly', priority: 0.3 },
  { path: '/terms', lastModified: '2026-11-10', changeFrequency: 'yearly', priority: 0.3 },
]
