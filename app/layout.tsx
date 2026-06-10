// RepoFuse Layout - v1.1
import type { Metadata } from 'next'
import { Analytics } from '@vercel/analytics/next'
import { AuthProvider } from '@/components/auth-provider'
import { ThemeProvider } from '@/components/theme-provider'
import './globals.css'

function siteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : 'https://repofuse.com')
  )
}

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  alternates: {
    canonical: '/',
  },
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
    url: siteUrl(),
    title: 'RepoFuse — Discover Apps Hidden in Your Code',
    description: 'Scan your GitHub repos, surface buildable app ideas, and ship faster.',
    siteName: 'RepoFuse',
    images: [
      {
        url: '/repofuse-logo.jpg',
        width: 1024,
        height: 1024,
        alt: 'RepoFuse logo',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'RepoFuse',
    description: 'Scan your GitHub repos, surface buildable app ideas, and ship faster.',
    images: ['/repofuse-logo.jpg'],
  },
  robots: { index: true, follow: true },
  manifest: '/site.webmanifest',
  icons: {
    icon: [
      {
        url: '/favicon.ico',
        sizes: 'any',
      },
      {
        url: '/favicon-16x16.png',
        sizes: '16x16',
        type: 'image/png',
      },
      {
        url: '/favicon-32x32.png',
        sizes: '32x32',
        type: 'image/png',
      },
      {
        url: '/favicon-48x48.png',
        sizes: '48x48',
        type: 'image/png',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
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
