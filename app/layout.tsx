// RepoFuse Layout - v1.1
import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { AuthProvider } from '@/components/auth-provider'
import { ThemeProvider } from '@/components/theme-provider'
import './globals.css'

const geist = Geist({ subsets: ['latin'], variable: '--font-geist' })
const geistMono = Geist_Mono({ subsets: ['latin'], variable: '--font-geist-mono' })

function siteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : 'https://repofuse.com')
  )
}

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
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
  },
  twitter: {
    card: 'summary_large_image',
    title: 'RepoFuse',
    description: 'Scan your GitHub repos, surface buildable app ideas, and ship faster.',
  },
  robots: { index: true, follow: true },
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
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
      <body className={`${geist.variable} ${geistMono.variable} font-sans antialiased bg-background text-foreground`}>
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
