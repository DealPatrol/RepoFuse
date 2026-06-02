'use client'

import * as React from 'react'
import Link from 'next/link'
import { ChevronDown, FolderGit2, LineChart, AppWindow, Star, Layout, FileCode, CheckCircle2, AlertTriangle, Lock } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'

interface NavItem {
  label: string
  href: string
  icon: React.ElementType
  description: string
  isPro: boolean
}

const NAV_ITEMS: NavItem[] = [
  {
    label: 'My Repos',
    href: '/dashboard/repositories',
    icon: FolderGit2,
    description: 'Connected GitHub & GitLab repos',
    isPro: false,
  },
  {
    label: 'Analysis',
    href: '/dashboard/analyses',
    icon: LineChart,
    description: 'AI-powered repo scans',
    isPro: false, // Free gets 3, Pro unlimited
  },
  {
    label: 'Already Built Apps',
    href: '/dashboard/built-apps',
    icon: AppWindow,
    description: 'Existing apps detected in your repos',
    isPro: false,
  },
  {
    label: 'My Most Desired',
    href: '/dashboard/most-desired',
    icon: Star,
    description: 'Your saved and prioritized ideas',
    isPro: true,
  },
  {
    label: 'Templates',
    href: '/dashboard/templates/browse',
    icon: Layout,
    description: 'Browse AI-generated templates',
    isPro: false, // Limited for free
  },
  {
    label: 'Blueprints',
    href: '/dashboard/blueprints',
    icon: FileCode,
    description: 'Full project blueprints',
    isPro: true, // Pro only
  },
  {
    label: 'Completed Projects',
    href: '/dashboard/completed',
    icon: CheckCircle2,
    description: 'Projects you marked as shipped',
    isPro: false,
  },
  {
    label: 'Missing Code',
    href: '/dashboard/gaps',
    icon: AlertTriangle,
    description: 'Gaps to fill before shipping',
    isPro: true, // Pro only - high value feature
  },
]

export function NavDropdown() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          className="text-xs font-mono tracking-widest text-cyan-400/60 hover:text-cyan-300 hover:bg-cyan-950/30 uppercase gap-1"
        >
          Dashboard
          <ChevronDown className="h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        className="w-72 bg-black/95 border-cyan-500/30 backdrop-blur-xl"
        align="end"
      >
        <DropdownMenuLabel className="text-cyan-400 font-mono text-xs tracking-widest uppercase">
          Your Workspace
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-cyan-500/20" />
        
        {NAV_ITEMS.map((item) => (
          <DropdownMenuItem key={item.href} asChild>
            <Link 
              href={item.href}
              className="flex items-start gap-3 p-3 cursor-pointer hover:bg-cyan-950/30 rounded-md group"
            >
              <div className={`p-2 rounded-md ${item.isPro ? 'bg-orange-500/20' : 'bg-cyan-500/20'}`}>
                <item.icon className={`h-4 w-4 ${item.isPro ? 'text-orange-400' : 'text-cyan-400'}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-white group-hover:text-cyan-300 transition-colors">
                    {item.label}
                  </span>
                  {item.isPro && (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-bold bg-orange-500/20 text-orange-400 rounded border border-orange-500/30 uppercase">
                      <Lock className="h-2.5 w-2.5" />
                      Pro
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 truncate">
                  {item.description}
                </p>
              </div>
            </Link>
          </DropdownMenuItem>
        ))}
        
        <DropdownMenuSeparator className="bg-cyan-500/20" />
        
        <div className="p-3">
          <Link 
            href="/pricing"
            className="flex items-center justify-center gap-2 w-full py-2 px-4 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 text-black font-bold text-xs rounded-md transition-all uppercase tracking-wide"
          >
            Upgrade to Pro
          </Link>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
