import { pageMetadata } from '@/lib/site'

export const metadata = pageMetadata({
  title: 'Pricing',
  description:
    'RepoFuse plans: start with a free repo scan, then upgrade to Pro, Scale, or bring your own AI key for more scans, launch briefs, and scaffold generation.',
  path: '/pricing',
})

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return children
}
