'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Github, BarChart3, FolderGit2, Sparkles, CreditCard, LayoutGrid, MessageSquare } from 'lucide-react'
import { cn } from '@/lib/utils'
import { RepoFuseLogo3D } from '@/components/repofuse-logo-3d'
import type { AuthUser } from '@/lib/auth'

interface DashboardHeaderProps {
  user: AuthUser | null
}

const navItems = [
  { href: '/dashboard', label: 'Overview', icon: BarChart3 },
  { href: '/dashboard/repositories', label: 'Repos', icon: FolderGit2 },
  { href: '/dashboard/analyses', label: 'Analyses', icon: Sparkles },
  { href: '/dashboard/idea-board', label: 'Liked Apps', icon: LayoutGrid },
  { href: '/dashboard/pattern-analyzer', label: 'App Idea Chat', icon: MessageSquare },
  { href: '/dashboard/billing', label: 'Billing', icon: CreditCard },
]

export function DashboardHeader({ user }: DashboardHeaderProps) {
  const pathname = usePathname()

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-cyan-500/20 bg-black/95 backdrop-blur-xl">
        <div className="container mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-6 lg:gap-8">
            <Link href="/" className="flex items-center flex-shrink-0 mt-5">
              <RepoFuseLogo3D className="h-10 w-10" />
            </Link>

            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== '/dashboard' && pathname.startsWith(item.href))
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-mono tracking-wider uppercase transition-all duration-200',
                      isActive
                        ? 'bg-cyan-950/50 text-cyan-300 border border-cyan-500/30'
                        : 'text-cyan-400/50 hover:text-cyan-300 hover:bg-cyan-950/30',
                    )}
                  >
                    <item.icon className="h-3.5 w-3.5" />
                    {item.label}
                  </Link>
                )
              })}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                {user.github_avatar_url && (
                  <img
                    src={user.github_avatar_url}
                    alt={user.github_username}
                    className="h-8 w-8 rounded-full ring-2 ring-cyan-500/40"
                  />
                )}
                <div className="hidden sm:block text-right">
                  <p className="text-xs font-mono font-medium text-cyan-300 leading-none">@{user.github_username}</p>
                  <a
                    href="/api/auth/logout"
                    className="text-xs text-cyan-400/40 hover:text-cyan-300 transition-colors"
                  >
                    Sign out
                  </a>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <a
                  href="/api/auth/github/login"
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono text-cyan-400/60 hover:text-cyan-300 hover:bg-cyan-950/30 transition-all border border-transparent hover:border-cyan-500/20"
                >
                  <Github className="h-4 w-4" />
                  <span className="hidden sm:inline">GitHub</span>
                </a>
                <a
                  href="/api/auth/gitlab/login"
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono text-cyan-400/60 hover:text-cyan-300 hover:bg-cyan-950/30 transition-all border border-transparent hover:border-cyan-500/20"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M23.6 6.15 12 0 .4 6.15a.88.88 0 0 0-.3 1.1l1.88 5.77H0v4.27h2.58l2.4 7.38a.88.88 0 0 0 .83.56h12.38a.88.88 0 0 0 .83-.56l2.4-7.38H24v-4.27h-2.08l1.88-5.77a.88.88 0 0 0-.28-1.1z"/>
                  </svg>
                  <span className="hidden sm:inline">GitLab</span>
                </a>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Mobile nav */}
      <nav className="md:hidden border-b border-cyan-500/10 bg-black/90 backdrop-blur-sm">
        <div className="container mx-auto px-4 flex items-center gap-1 overflow-x-auto py-2 no-scrollbar">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== '/dashboard' && pathname.startsWith(item.href))
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono uppercase whitespace-nowrap transition-all',
                  isActive
                    ? 'bg-cyan-950/50 text-cyan-300 border border-cyan-500/30'
                    : 'text-cyan-400/50 hover:text-cyan-300 hover:bg-cyan-950/30',
                )}
              >
                <item.icon className="h-3 w-3" />
                {item.label}
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}
