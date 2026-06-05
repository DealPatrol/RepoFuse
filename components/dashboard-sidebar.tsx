'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Zap, LayoutDashboard, FolderGit2, Lightbulb, Bot,
  BarChart3, Clock, GitPullRequest, Settings, Plug,
  CreditCard, LogOut
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface SidebarProps {
  user?: {
    name?: string
    email?: string
    plan?: 'free' | 'pro' | 'scale'
  }
}

export function DashboardSidebar({ user }: SidebarProps) {
  const pathname = usePathname()
  
  const isActive = (href: string) => pathname === href

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-[#0D1117] border-r border-[#30363D] flex flex-col overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 p-4 border-b border-[#30363D] bg-[#0D1117]/95 backdrop-blur">
        <Link href="/dashboard/analyses" className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-[#06B6D4] hover:bg-[#06B6D4]/90 transition-colors font-semibold text-[#0D1117]">
          <Zap className="h-4 w-4" />
          New Analysis
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        
        {/* Main */}
        <div className="mb-6">
          <Link
            href="/dashboard"
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm font-medium',
              isActive('/dashboard')
                ? 'bg-[#06B6D4]/10 border border-[#06B6D4]/30 text-[#06B6D4]'
                : 'text-[#8B949E] hover:text-[#F0F6FC]'
            )}
          >
            <LayoutDashboard className="h-4 w-4" />
            Dashboard
          </Link>
        </div>

        {/* Content */}
        <div className="space-y-1 mb-6">
          <p className="px-3 py-1.5 text-xs font-mono text-[#6B7280] uppercase tracking-widest">Content</p>
          
          <Link
            href="/dashboard/repositories"
            className={cn(
              'flex items-center justify-between px-3 py-2 rounded-lg transition-colors text-sm',
              isActive('/dashboard/repositories')
                ? 'text-[#06B6D4]'
                : 'text-[#8B949E] hover:text-[#F0F6FC]'
            )}
          >
            <div className="flex items-center gap-3">
              <FolderGit2 className="h-4 w-4" />
              Repositories
            </div>
            <span className="text-xs bg-[#161B22] px-2 py-0.5 rounded border border-[#30363D]">12</span>
          </Link>

          <Link
            href="/dashboard/idea-board"
            className={cn(
              'flex items-center justify-between px-3 py-2 rounded-lg transition-colors text-sm',
              isActive('/dashboard/idea-board')
                ? 'text-[#F59E0B]'
                : 'text-[#8B949E] hover:text-[#F0F6FC]'
            )}
          >
            <div className="flex items-center gap-3">
              <Lightbulb className="h-4 w-4" />
              Ideas
            </div>
            <span className="text-xs bg-[#161B22] px-2 py-0.5 rounded border border-[#30363D]">47</span>
          </Link>

          <Link
            href="/dashboard/agents"
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm',
              isActive('/dashboard/agents')
                ? 'text-[#06B6D4]'
                : 'text-[#8B949E] hover:text-[#F0F6FC]'
            )}
          >
            <Bot className="h-4 w-4" />
            Agents
          </Link>
        </div>

        {/* Features */}
        <div className="space-y-1 mb-6">
          <p className="px-3 py-1.5 text-xs font-mono text-[#6B7280] uppercase tracking-widest">Features</p>
          
          <Link
            href="/dashboard/demand-intel"
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm text-[#8B949E] hover:text-[#F0F6FC]'
            )}
          >
            <BarChart3 className="h-4 w-4" />
            Demand Intel
          </Link>

          <Link
            href="/dashboard/scheduled-scans"
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm text-[#8B949E] hover:text-[#F0F6FC]'
            )}
          >
            <Clock className="h-4 w-4" />
            Scheduled Scans
          </Link>

          <Link
            href="/dashboard/idea-pipeline"
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm text-[#8B949E] hover:text-[#F0F6FC]'
            )}
          >
            <GitPullRequest className="h-4 w-4" />
            Idea Pipeline
          </Link>
        </div>

        {/* Workspace */}
        <div className="space-y-1">
          <p className="px-3 py-1.5 text-xs font-mono text-[#6B7280] uppercase tracking-widest">Workspace</p>
          
          <Link
            href="/dashboard/integrations"
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm text-[#8B949E] hover:text-[#F0F6FC]'
            )}
          >
            <Plug className="h-4 w-4" />
            Integrations
          </Link>

          <Link
            href="/dashboard/billing"
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm text-[#8B949E] hover:text-[#F0F6FC]'
            )}
          >
            <CreditCard className="h-4 w-4" />
            Billing
          </Link>

          <Link
            href="/dashboard/settings"
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm text-[#8B949E] hover:text-[#F0F6FC]'
            )}
          >
            <Settings className="h-4 w-4" />
            Settings
          </Link>
        </div>
      </nav>

      {/* Recent Projects */}
      <div className="border-t border-[#30363D] p-4 space-y-2">
        <p className="px-2 text-xs font-mono text-[#6B7280] uppercase tracking-widest">Recent</p>
        <div className="space-y-1">
          <Link href="#" className="block px-2 py-1.5 text-xs text-[#8B949E] hover:text-[#F0F6FC] rounded hover:bg-[#161B22] transition-colors">
            repofuse-core
          </Link>
          <Link href="#" className="block px-2 py-1.5 text-xs text-[#8B949E] hover:text-[#F0F6FC] rounded hover:bg-[#161B22] transition-colors">
            repo-app-architect
          </Link>
          <Link href="#" className="block px-2 py-1.5 text-xs text-[#8B949E] hover:text-[#F0F6FC] rounded hover:bg-[#161B22] transition-colors">
            memorial-sqr
          </Link>
        </div>
      </div>

      {/* User Profile */}
      <div className="border-t border-[#30363D] p-4 space-y-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-[#06B6D4] flex items-center justify-center text-[#0D1117] font-bold text-sm">
            {user?.name?.charAt(0) || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-[#F0F6FC] truncate">{user?.name || 'User'}</p>
            <p className="text-[10px] text-[#06B6D4] font-mono uppercase tracking-widest">
              {user?.plan === 'pro' ? 'PRO PLAN' : 'FREE PLAN'}
            </p>
          </div>
        </div>
        <button className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-[#8B949E] hover:text-[#F0F6FC] hover:bg-[#161B22] transition-colors">
          <LogOut className="h-3.5 w-3.5" />
          Sign Out
        </button>
      </div>
    </aside>
  )
}
