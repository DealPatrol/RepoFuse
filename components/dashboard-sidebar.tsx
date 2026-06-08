'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Github,
  BarChart3,
  FolderGit2,
  Sparkles,
  CreditCard,
  LayoutGrid,
  MessageSquare,
  LayoutTemplate,
  AlertTriangle,
  Package,
  Settings,
  Rocket,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { RepoFuseLogo3D } from '@/components/repofuse-logo-3d'
import { UserButton } from '@clerk/nextjs'
import type { AuthUser } from '@/lib/auth'
import { authSignInHref } from '@/components/auth-sign-in-link'
import { isClerkEnabled } from '@/lib/clerk-auth'

interface DashboardSidebarProps {
  user: AuthUser | null
}

// The flagship action sits on its own, above everything else.
const flagshipItem = { href: '/dashboard/build', label: "Build It For Me", icon: Rocket }

const navItems = [
  { href: '/dashboard', label: 'Overview', icon: BarChart3 },
  { href: '/dashboard/repositories', label: 'Repos', icon: FolderGit2 },
  { href: '/dashboard/analyses', label: 'Analyses', icon: Sparkles },
  { href: '/dashboard/pattern-analyzer', label: 'App Idea Chat', icon: MessageSquare },
  { href: '/dashboard/component-hunter', label: 'Component Hunter', icon: Package },
  { href: '/dashboard/templates/browse', label: 'Templates', icon: LayoutTemplate },
  { href: '/dashboard/gaps', label: 'Gaps', icon: AlertTriangle },
  { href: '/dashboard/idea-board', label: 'Liked Apps', icon: LayoutGrid },
  { href: '/dashboard/billing', label: 'Billing', icon: CreditCard },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
]

export function DashboardSidebar({ user }: DashboardSidebarProps) {
  const pathname = usePathname()
  const [expanded, setExpanded] = useState(false)
  // pinned overrides hover so a user can click to lock it open
  const [pinned, setPinned] = useState(false)
  const open = expanded || pinned

  const isActive = (href: string) =>
    pathname === href || (href !== '/dashboard' && pathname.startsWith(href))

  return (
    <aside
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
      className={cn(
        'fixed left-0 top-0 z-50 hidden md:flex flex-col h-screen border-r border-cyan-500/20 bg-black/95 backdrop-blur-xl transition-[width] duration-200 ease-out',
        open ? 'w-60' : 'w-16',
      )}
    >
      {/* Logo + collapse toggle */}
      <div className="flex items-center h-16 px-3 border-b border-white/5">
        <Link href="/" className="flex items-center flex-shrink-0">
          <RepoFuseLogo3D className="h-9 w-9" />
        </Link>
        <button
          onClick={() => setPinned((p) => !p)}
          className={cn(
            'ml-auto text-[10px] font-mono uppercase tracking-widest text-cyan-400/50 hover:text-cyan-300 transition-opacity',
            open ? 'opacity-100' : 'opacity-0 pointer-events-none',
          )}
          aria-label={pinned ? 'Unpin sidebar' : 'Pin sidebar open'}
        >
          {pinned ? 'Unpin' : 'Pin'}
        </button>
      </div>

      {/* Flagship CTA */}
      <div className="px-2.5 pt-3">
        <Link
          href={flagshipItem.href}
          className={cn(
            'flex items-center rounded-xl font-bold transition-all duration-200 overflow-hidden',
            'bg-gradient-to-r from-cyan-500 to-violet-500 text-black hover:from-cyan-400 hover:to-violet-400',
            open ? 'gap-3 px-3 py-3' : 'justify-center px-0 py-3',
            isActive(flagshipItem.href) && 'ring-2 ring-cyan-300/60',
          )}
          title={flagshipItem.label}
        >
          <Rocket className="h-5 w-5 flex-shrink-0" />
          <span className={cn('text-sm whitespace-nowrap transition-opacity', open ? 'opacity-100' : 'opacity-0 w-0')}>
            {flagshipItem.label}
          </span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto no-scrollbar px-2.5 py-3 space-y-1">
        {navItems.map((item) => {
          const active = isActive(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.label}
              className={cn(
                'flex items-center rounded-lg text-xs font-mono tracking-wider uppercase transition-all duration-200 overflow-hidden',
                open ? 'gap-3 px-3 py-2.5' : 'justify-center px-0 py-2.5',
                active
                  ? 'bg-cyan-950/50 text-cyan-300 border border-cyan-500/30'
                  : 'text-cyan-400/50 hover:text-cyan-300 hover:bg-cyan-950/30 border border-transparent',
              )}
            >
              <item.icon className="h-4 w-4 flex-shrink-0" />
              <span className={cn('whitespace-nowrap transition-opacity', open ? 'opacity-100' : 'opacity-0 w-0')}>
                {item.label}
              </span>
            </Link>
          )
        })}
      </nav>

      {/* User / auth footer */}
      <div className="border-t border-white/5 p-2.5">
        {user ? (
          isClerkEnabled() ? (
            <div className={cn('flex items-center', open ? 'gap-3 px-1' : 'justify-center')}>
              <UserButton />
              {open && (
                <span className="text-xs font-mono text-cyan-300 truncate">@{user.github_username}</span>
              )}
            </div>
          ) : (
            <div className={cn('flex items-center', open ? 'gap-3 px-1' : 'justify-center')}>
              {user.github_avatar_url && (
                <img
                  src={user.github_avatar_url}
                  alt={user.github_username}
                  className="h-8 w-8 rounded-full ring-2 ring-cyan-500/40 flex-shrink-0"
                />
              )}
              {open && (
                <div className="min-w-0">
                  <p className="text-xs font-mono font-medium text-cyan-300 leading-none truncate">@{user.github_username}</p>
                  <a href="/api/auth/logout" className="text-[11px] text-cyan-400/40 hover:text-cyan-300 transition-colors">
                    Sign out
                  </a>
                </div>
              )}
            </div>
          )
        ) : (
          <div className={cn('flex', open ? 'flex-col gap-2' : 'flex-col items-center gap-2')}>
            <a
              href={authSignInHref()}
              title="Sign in with GitHub"
              className={cn(
                'flex items-center rounded-lg text-xs font-mono text-cyan-400/60 hover:text-cyan-300 hover:bg-cyan-950/30 transition-all border border-transparent hover:border-cyan-500/20',
                open ? 'gap-2 px-3 py-2' : 'justify-center p-2',
              )}
            >
              <Github className="h-4 w-4 flex-shrink-0" />
              {open && <span>GitHub</span>}
            </a>
            <a
              href="/api/auth/gitlab/login"
              title="Sign in with GitLab"
              className={cn(
                'flex items-center rounded-lg text-xs font-mono text-cyan-400/60 hover:text-cyan-300 hover:bg-cyan-950/30 transition-all border border-transparent hover:border-cyan-500/20',
                open ? 'gap-2 px-3 py-2' : 'justify-center p-2',
              )}
            >
              <svg className="h-4 w-4 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                <path d="M23.6 6.15 12 0 .4 6.15a.88.88 0 0 0-.3 1.1l1.88 5.77H0v4.27h2.58l2.4 7.38a.88.88 0 0 0 .83.56h12.38a.88.88 0 0 0 .83-.56l2.4-7.38H24v-4.27h-2.08l1.88-5.77a.88.88 0 0 0-.28-1.1z"/>
              </svg>
              {open && <span>GitLab</span>}
            </a>
          </div>
        )}
      </div>
    </aside>
  )
}

// Mobile top bar — horizontal scrollable nav for small screens.
export function DashboardMobileNav({ user }: DashboardSidebarProps) {
  const pathname = usePathname()
  const isActive = (href: string) =>
    pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
  const allItems = [flagshipItem, ...navItems]
  return (
    <header className="md:hidden sticky top-0 z-50 border-b border-cyan-500/20 bg-black/95 backdrop-blur-xl">
      <div className="flex items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center">
          <RepoFuseLogo3D className="h-8 w-8" />
        </Link>
        {user && !isClerkEnabled() && user.github_avatar_url && (
          <img src={user.github_avatar_url} alt={user.github_username} className="h-7 w-7 rounded-full ring-2 ring-cyan-500/40" />
        )}
        {user && isClerkEnabled() && <UserButton />}
      </div>
      <nav className="flex items-center gap-1 overflow-x-auto px-4 pb-2 no-scrollbar">
        {allItems.map((item) => {
          const active = isActive(item.href)
          const flagship = item.href === flagshipItem.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono uppercase whitespace-nowrap transition-all',
                flagship
                  ? 'bg-gradient-to-r from-cyan-500 to-violet-500 text-black font-bold'
                  : active
                    ? 'bg-cyan-950/50 text-cyan-300 border border-cyan-500/30'
                    : 'text-cyan-400/50 hover:text-cyan-300 hover:bg-cyan-950/30',
              )}
            >
              <item.icon className="h-3 w-3" />
              {item.label}
            </Link>
          )
        })}
      </nav>
    </header>
  )
}
