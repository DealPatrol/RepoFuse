import { NextResponse } from 'next/server'
import { getCurrentUser, type AuthUser } from '@/lib/auth'
import { updateUserBilling } from '@/lib/queries'
import { hasActivePaidSubscription, hasActivePaidUser } from '@/lib/pro-access'
import { ACTIVE_SUBSCRIPTION_STATUSES } from '@/lib/subscription-status'
import { getSubscriptionByGithubId } from '@/lib/queries'
import { getPriceIdForPlan, getStripe, isPaidPlan, isStripeConfigured, type PlanId } from '@/lib/stripe'

function planFromStripePriceId(priceId: string | null | undefined): Exclude<PlanId, 'free' | 'byok'> {
  if (!priceId) return 'pro'
  const scalePriceId = getPriceIdForPlan('scale')
  if (scalePriceId && priceId === scalePriceId) return 'scale'
  return 'pro'
}

const ACTIVE_STATUSES = ACTIVE_SUBSCRIPTION_STATUSES

export interface BillingState {
  plan: PlanId
  status: string | null
  canAccessPro: boolean
  customerId: string | null
  subscriptionId: string | null
  priceId: string | null
}

export async function getBillingState(user: AuthUser | null): Promise<BillingState> {
  if (!user) {
    return {
      plan: 'free',
      status: null,
      canAccessPro: false,
      customerId: null,
      subscriptionId: null,
      priceId: null,
    }
  }

  let state: BillingState = {
    plan: isPaidPlan(user.plan_tier) && user.subscription_status && ACTIVE_STATUSES.has(user.subscription_status) ? user.plan_tier : 'free',
    status: user.subscription_status,
    canAccessPro: isPaidPlan(user.plan_tier) && user.subscription_status ? ACTIVE_STATUSES.has(user.subscription_status) : false,
    customerId: user.stripe_customer_id,
    subscriptionId: user.stripe_subscription_id,
    priceId: user.stripe_price_id,
  }

  if (!isStripeConfigured() || !user.stripe_customer_id) {
    return state
  }

  try {
    const stripe = getStripe()
    const subscriptions = await stripe.subscriptions.list({
      customer: user.stripe_customer_id,
      status: 'all',
      limit: 10,
    })

    const activeSubscription = subscriptions.data.find((subscription) => ACTIVE_STATUSES.has(subscription.status))
    const latestSubscription = activeSubscription || subscriptions.data[0] || null
    const priceId = latestSubscription?.items.data[0]?.price.id ?? null
    const activePaid = latestSubscription ? ACTIVE_STATUSES.has(latestSubscription.status) : false
    const paidPlan = activePaid ? planFromStripePriceId(priceId) : 'free'

    const nextState: BillingState = latestSubscription
      ? {
          plan: paidPlan,
          status: latestSubscription.status,
          canAccessPro: activePaid,
          customerId: typeof latestSubscription.customer === 'string' ? latestSubscription.customer : latestSubscription.customer.id,
          subscriptionId: latestSubscription.id,
          priceId,
        }
      : {
          plan: 'free',
          status: null,
          canAccessPro: false,
          customerId: user.stripe_customer_id,
          subscriptionId: null,
          priceId: null,
        }

    if (
      nextState.plan !== state.plan ||
      nextState.status !== state.status ||
      nextState.subscriptionId !== state.subscriptionId ||
      nextState.priceId !== state.priceId
    ) {
      await updateUserBilling(user.id, {
        stripe_customer_id: nextState.customerId,
        stripe_subscription_id: nextState.subscriptionId,
        stripe_price_id: nextState.priceId,
        plan_tier: nextState.plan,
        subscription_status: nextState.status,
      })
    }

    state = nextState
  } catch (error) {
    console.error('Failed to refresh billing state:', error)
  }

  return state
}

export async function requirePro() {
  const user = await getCurrentUser()

  if (!user) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: 'Not authenticated' }, { status: 401 }),
    }
  }

  const [billing, subscription] = await Promise.all([
    getBillingState(user),
    getSubscriptionByGithubId(user.github_id).catch(() => null),
  ])
  const canAccessPro =
    billing.canAccessPro || hasActivePaidSubscription(subscription) || hasActivePaidUser(user)

  if (!canAccessPro) {
    return {
      ok: false as const,
      response: NextResponse.json(
        {
          error: 'Pro subscription required',
          code: 'PRO_REQUIRED',
          upgradeUrl: '/pricing',
        },
        { status: 402 },
      ),
    }
  }

  return {
    ok: true as const,
    user,
    billing,
  }
}
