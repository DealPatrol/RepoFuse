import Link from 'next/link'

const footerLinks = [
  { href: '/pricing', label: 'Pricing' },
  { href: '/mcp', label: 'MCP server' },
  { href: '/legal/documentation', label: 'Docs' },
  { href: '/legal/support', label: 'Support' },
  { href: '/privacy', label: 'Privacy' },
  { href: '/terms', label: 'Terms' },
]

export function SiteFooter() {
  return (
    <footer className="border-t border-[#30363D] bg-[#0B0F14] px-4 py-10 text-sm text-[#8B949E] sm:px-6">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="font-mono text-xs">© {new Date().getFullYear()} RepoFuse</p>
        <nav aria-label="Footer" className="flex flex-wrap gap-x-6 gap-y-3">
          {footerLinks.map((link) => (
            <Link key={link.href} href={link.href} className="transition-colors hover:text-[#F0F6FC]">
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  )
}
