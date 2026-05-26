import { NextResponse } from 'next/server'
import { getCurrentUser, type AuthUser } from '@/lib/auth'
import { getStripe, isPaidPlan, isStripeConfigured, type PlanId } from '@/lib/stripe'
import { updateUserBilling } from '@/lib/queries'

const ACTIVE_STATUSES = new Set(['active', 'trialing'])

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
    const nextState: BillingState = latestSubscription
      ? {
          plan: ACTIVE_STATUSES.has(latestSubscription.status) ? 'pro' : 'free',
          status: latestSubscription.status,
          canAccessPro: ACTIVE_STATUSES.has(latestSubscription.status),
          customerId: typeof latestSubscription.customer === 'string' ? latestSubscription.customer : latestSubscription.customer.id,
          subscriptionId: latestSubscription.id,
          priceId: latestSubscription.items.data[0]?.price.id ?? null,
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

  const billing = await getBillingState(user)

  if (!billing.canAccessPro) {
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
