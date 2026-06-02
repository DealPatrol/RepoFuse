/**
 * Subscription & Pro Gating Utilities
 * 
 * Strategy for converting free users to Pro:
 * 
 * FREE TIER (bait):
 * - My Repos: Unlimited connections
 * - Analysis: 3 scans total (creates urgency)
 * - Built Apps: View detected apps (shows value)
 * - Templates: Browse limited (3 templates)
 * - Completed Projects: Track shipped work
 * 
 * PRO TIER (switch):
 * - My Most Desired: Save & prioritize ideas (planning)
 * - Blueprints: Full project blueprints (high value)
 * - Missing Code: Gap analysis (completion anxiety)
 * - Unlimited analyses
 * - Unlimited templates
 * - Priority support
 * 
 * Psychology:
 * 1. Let users see value (built apps, some templates)
 * 2. Create scarcity (3 scans limit)
 * 3. Show what they're missing (blurred Pro features)
 * 4. Easy upgrade path in every Pro-gated page
 */

export type SubscriptionTier = 'free' | 'pro' | 'team'

export interface SubscriptionLimits {
  maxAnalyses: number | 'unlimited'
  maxTemplates: number | 'unlimited'
  maxBlueprints: number | 'unlimited'
  hasGapAnalysis: boolean
  hasMostDesired: boolean
  hasPrioritySupport: boolean
}

export const TIER_LIMITS: Record<SubscriptionTier, SubscriptionLimits> = {
  free: {
    maxAnalyses: 3,
    maxTemplates: 3,
    maxBlueprints: 0,
    hasGapAnalysis: false,
    hasMostDesired: false,
    hasPrioritySupport: false,
  },
  pro: {
    maxAnalyses: 'unlimited',
    maxTemplates: 'unlimited',
    maxBlueprints: 'unlimited',
    hasGapAnalysis: true,
    hasMostDesired: true,
    hasPrioritySupport: false,
  },
  team: {
    maxAnalyses: 'unlimited',
    maxTemplates: 'unlimited',
    maxBlueprints: 'unlimited',
    hasGapAnalysis: true,
    hasMostDesired: true,
    hasPrioritySupport: true,
  },
}

export function getTierLimits(tier: SubscriptionTier): SubscriptionLimits {
  return TIER_LIMITS[tier] || TIER_LIMITS.free
}

export function canAccessFeature(
  tier: SubscriptionTier,
  feature: keyof SubscriptionLimits
): boolean {
  const limits = getTierLimits(tier)
  const value = limits[feature]
  
  if (typeof value === 'boolean') return value
  if (value === 'unlimited') return true
  return value > 0
}

export function getRemainingUsage(
  tier: SubscriptionTier,
  feature: 'maxAnalyses' | 'maxTemplates' | 'maxBlueprints',
  currentUsage: number
): number | 'unlimited' {
  const limits = getTierLimits(tier)
  const max = limits[feature]
  
  if (max === 'unlimited') return 'unlimited'
  return Math.max(0, max - currentUsage)
}

export function shouldShowUpgradePrompt(
  tier: SubscriptionTier,
  feature: keyof SubscriptionLimits,
  currentUsage?: number
): boolean {
  if (tier === 'team') return false
  
  const limits = getTierLimits(tier)
  const value = limits[feature]
  
  // Always show upgrade for boolean features that are false
  if (typeof value === 'boolean') return !value
  
  // Show upgrade when near or at limit
  if (typeof value === 'number' && currentUsage !== undefined) {
    return currentUsage >= value * 0.8 // 80% threshold
  }
  
  return tier === 'free'
}

// Pro features list for marketing
export const PRO_FEATURES = [
  {
    name: 'Unlimited Analyses',
    description: 'Scan all your repos as many times as you want',
    icon: 'LineChart',
  },
  {
    name: 'Full Blueprints',
    description: 'Complete project blueprints with architecture diagrams',
    icon: 'FileCode',
  },
  {
    name: 'Missing Code Analysis',
    description: 'See exactly what needs to be built before shipping',
    icon: 'AlertTriangle',
  },
  {
    name: 'My Most Desired',
    description: 'Save and prioritize your favorite project ideas',
    icon: 'Star',
  },
  {
    name: 'Unlimited Templates',
    description: 'Access all AI-generated templates',
    icon: 'Layout',
  },
]
