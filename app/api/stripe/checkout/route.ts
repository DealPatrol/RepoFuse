import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { isStripeConfigured, getStripe, getPriceIdForPlan, getCheckoutPlanOptions, parseCheckoutPlan, type CheckoutPlan } from '@/lib/stripe'
import { getSubscriptionByGithubId, upsertSubscription } from '@/lib/queries'

export async function POST(request: NextRequest) {
  try {
    if (!isStripeConfigured()) {
      return NextResponse.json({ error: 'Billing is not configured yet. Please contact support.' }, { status: 503 })
    }

    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    let plan: CheckoutPlan = 'pro'
    try {
      const body = await request.json()
      plan = parseCheckoutPlan(body?.plan)
    } catch {
      // default to pro if body missing
    }

    const priceId = getPriceIdForPlan(plan)
    if (!priceId) {
      console.error(`[checkout] price ID not set for plan: ${plan}`)
      return NextResponse.json({ error: 'Price configuration is missing. Please contact support.' }, { status: 503 })
    }

    const stripe = getStripe()
    let sub = await getSubscriptionByGithubId(user.github_id)

    if (!sub) {
      sub = await upsertSubscription({ github_id: user.github_id })
    }

    let customerId = sub.stripe_customer_id

    if (!customerId) {
      const customer = await stripe.customers.create({
        metadata: { github_id: String(user.github_id), github_username: user.github_username },
      })
      customerId = customer.id
      await upsertSubscription({ github_id: user.github_id, stripe_customer_id: customerId })
    } else {
      // Verify the customer exists in Stripe (in case it's a stale test ID)
      try {
        await stripe.customers.retrieve(customerId)
      } catch {
        const customer = await stripe.customers.create({
          metadata: { github_id: String(user.github_id), github_username: user.github_username },
        })
        customerId = customer.id
        await upsertSubscription({ github_id: user.github_id, stripe_customer_id: customerId })
      }
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || `http://localhost:${process.env.PORT || 3000}`

    const planOptions = getCheckoutPlanOptions(plan)
    const sessionParams: Parameters<typeof stripe.checkout.sessions.create>[0] = {
      customer: customerId,
      mode: 'subscription',
      payment_method_collection: planOptions.paymentMethodCollection,
      allow_promotion_codes: true,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${appUrl}/dashboard?upgraded=true`,
      cancel_url: `${appUrl}/pricing`,
      metadata: { github_id: String(user.github_id), plan },
      subscription_data: {
        metadata: { github_id: String(user.github_id), plan },
      },
    }
    if (planOptions.trialDays) {
      sessionParams.subscription_data!.trial_period_days = planOptions.trialDays
      sessionParams.subscription_data!.trial_settings = {
        end_behavior: { missing_payment_method: 'cancel' },
      }
    }

    const session = await stripe.checkout.sessions.create(sessionParams)

    return NextResponse.json({ url: session.url })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error('Stripe checkout error:', errorMessage)
    return NextResponse.json({ error: 'Failed to create checkout session. Please try again or contact support.' }, { status: 500 })
  }
}
