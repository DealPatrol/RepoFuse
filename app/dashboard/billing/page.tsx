import { getCurrentUser } from '@/lib/auth'
import { getSubscriptionByGithubId, countUserBlueprintViews } from '@/lib/queries'
import { PLANS } from '@/lib/stripe'
import { BillingClient } from '@/components/billing-client'

export const dynamic = 'force-dynamic'

export default async function BillingPage() {
  const user = await getCurrentUser()

  let subscription = null
  let blueprintViewCount = 0
  if (user) {
    try {
      subscription = await getSubscriptionByGithubId(user.github_id)
      blueprintViewCount = await countUserBlueprintViews(user.id)
    } catch {
      // DB or table not available yet
    }
  }

  const plan = (subscription?.plan as keyof typeof PLANS | undefined) ?? 'free'
  const limits = PLANS[plan] || PLANS.free
  const isTrialing = subscription?.status === 'trialing'

  return (
    <BillingClient
      plan={plan as 'free' | 'pro' | 'scale' | 'byok'}
      planName={limits.name}
      analysesUsed={subscription?.analyses_used_this_month ?? 0}
      analysesLimit={limits.analyses_per_month}
      blueprintsUsed={blueprintViewCount}
      blueprintsLimit={limits.blueprints_viewable}
      reposLimit={limits.repos_limit}
      status={subscription?.status ?? 'active'}
      currentPeriodEnd={subscription?.current_period_end ?? null}
      hasStripeCustomer={!!subscription?.stripe_customer_id}
      userId={user?.id}
      isTrialing={isTrialing}
    />
  )
}
