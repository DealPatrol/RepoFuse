import type { Metadata } from 'next'
import { NOINDEX } from '@/lib/site'

// Internal outreach prototype: never indexed (also blocked in robots.txt and
// gated behind sign-in in proxy.ts).
export const metadata: Metadata = {
  title: 'Prospect Engine',
  robots: NOINDEX,
}

export default function ProspectsLayout({ children }: { children: React.ReactNode }) {
  return children
}
