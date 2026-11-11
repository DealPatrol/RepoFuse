// RepoFuse Layout - v1.1
import type { Metadata } from 'next'
import { Analytics } from '@vercel/analytics/next'
import { AuthProvider } from '@/components/auth-provider'
import { ThemeProvider } from '@/components/theme-provider'
import { DEFAULT_OG_IMAGE, SITE_URL } from '@/lib/site'
import './globals.css'

export const metadata: Metadata = {
  // Canonicals are set per page (lib/site.ts pageMetadata). A root-level
  // canonical would be inherited by every page and point them all at "/".
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'RepoFuse — Discover Apps Hidden in Your Code',
    template: '%s · RepoFuse',
  },
  description: 'AI-powered GitHub repository analyzer that discovers what apps you can build from your existing code.',
  applicationName: 'RepoFuse',
  generator: 'Next.js',
  keywords: [
    'GitHub analyzer',
    'AI code analysis',
    'reuse code',
    'project ideas',
    'app blueprints',
    'Claude MCP',
    'developer tools',
  ],
  openGraph: {
    type: 'website',
    url: '/',
    title: 'RepoFuse — Discover Apps Hidden in Your Code',
    description: 'Scan your GitHub repos, surface buildable app ideas, and ship faster.',
    siteName: 'RepoFuse',
    images: [DEFAULT_OG_IMAGE],
  },
  twitter: {
    card: 'summary',
    title: 'RepoFuse',
    description: 'Scan your GitHub repos, surface buildable app ideas, and ship faster.',
    images: ['/repofuse-logo.jpg'],
  },
  robots: { index: true, follow: true },
  manifest: '/site.webmanifest',
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased bg-background text-foreground">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <AuthProvider>
            {children}
            <Analytics />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
