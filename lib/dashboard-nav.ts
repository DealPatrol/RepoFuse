import type { LucideIcon } from 'lucide-react'
import {
  BarChart3,
  FolderGit2,
  Sparkles,
  AppWindow,
  Star,
  Layout,
  FileCode,
  CheckCircle2,
  AlertTriangle,
  LayoutGrid,
  MessageSquare,
  CreditCard,
} from 'lucide-react'

export interface DashboardNavItem {
  label: string
  href: string
  icon: LucideIcon
  description: string
  isPro: boolean
  /** Show in the main horizontal nav (desktop) */
  primary?: boolean
}

/** Shared routes for marketing dropdown and dashboard navigation */
export const DASHBOARD_NAV_ITEMS: DashboardNavItem[] = [
  {
    label: 'Overview',
    href: '/dashboard',
    icon: BarChart3,
    description: 'Code intelligence overview',
    isPro: false,
    primary: true,
  },
  {
    label: 'Repos',
    href: '/dashboard/repositories',
    icon: FolderGit2,
    description: 'Connected GitHub & GitLab repos',
    isPro: false,
    primary: true,
  },
  {
    label: 'Analyses',
    href: '/dashboard/analyses',
    icon: Sparkles,
    description: 'AI-powered repo scans',
    isPro: false,
    primary: true,
  },
  {
    label: 'Built Apps',
    href: '/dashboard/built-apps',
    icon: AppWindow,
    description: 'Existing apps detected in your repos',
    isPro: false,
  },
  {
    label: 'Most Desired',
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
    isPro: false,
    primary: true,
  },
  {
    label: 'Blueprints',
    href: '/dashboard/blueprints',
    icon: FileCode,
    description: 'Full project blueprints',
    isPro: true,
    primary: true,
  },
  {
    label: 'Idea Board',
    href: '/dashboard/idea-board',
    icon: LayoutGrid,
    description: 'Organize and prioritize ideas',
    isPro: false,
  },
  {
    label: 'App Idea Chat',
    href: '/dashboard/pattern-analyzer',
    icon: MessageSquare,
    description: 'Chat through new project ideas from your repos',
    isPro: false,
  },
  {
    label: 'Completed',
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
    isPro: true,
  },
  {
    label: 'Billing',
    href: '/dashboard/billing',
    icon: CreditCard,
    description: 'Plans and credits',
    isPro: false,
    primary: true,
  },
]

export const PRIMARY_DASHBOARD_NAV = DASHBOARD_NAV_ITEMS.filter((item) => item.primary)
export const SECONDARY_DASHBOARD_NAV = DASHBOARD_NAV_ITEMS.filter((item) => !item.primary)

/** Marketing site dropdown (excludes overview & billing) */
export const MARKETING_DASHBOARD_NAV = DASHBOARD_NAV_ITEMS.filter(
  (item) => item.href !== '/dashboard' && item.href !== '/dashboard/billing',
)
