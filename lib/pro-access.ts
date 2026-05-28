import type { AuthUser } from '@/lib/auth'
import { getSubscriptionByGithubId, type Subscription } from '@/lib/queries'
import { isPaidPlan, type PlanId } from '@/lib/stripe'

import { isActiveSubscriptionStatus } from '@/lib/subscription-status'

export { ACTIVE_SUBSCRIPTION_STATUSES, isActiveSubscriptionStatus } from '@/lib/subscription-status'

export function hasActivePaidSubscription(sub: Subscription | null | undefined): boolean {
  if (!sub || !isPaidPlan(sub.plan)) return false
  return isActiveSubscriptionStatus(sub.status)
}

export function hasActivePaidUser(user: AuthUser | null | undefined): boolean {
  if (!user || !isPaidPlan(user.plan_tier)) return false
  return isActiveSubscriptionStatus(user.subscription_status)
}

export function hasProAccess(
  user: AuthUser | null | undefined,
  subscription: Subscription | null | undefined,
): boolean {
  return hasActivePaidUser(user) || hasActivePaidSubscription(subscription)
}

/** Free-tier limits apply when the user does not have an active paid subscription. */
export function isOnFreeTier(
  user: AuthUser,
  subscription: Subscription | null | undefined,
): boolean {
  return !hasProAccess(user, subscription)
}

export async function resolveProAccess(user: AuthUser): Promise<{
  canAccessPro: boolean
  subscription: Subscription | null
  plan: PlanId
}> {
  const subscription = await getSubscriptionByGithubId(user.github_id).catch(() => null)
  const canAccessPro = hasActivePaidSubscription(subscription) || hasActivePaidUser(user)

  let plan: PlanId = 'free'
  if (canAccessPro) {
    if (subscription && isPaidPlan(subscription.plan) && isActiveSubscriptionStatus(subscription.status)) {
      plan = subscription.plan
    } else if (user.plan_tier && isPaidPlan(user.plan_tier)) {
      plan = user.plan_tier
    } else {
      plan = 'pro'
    }
  }

  return { canAccessPro, subscription, plan }
}
