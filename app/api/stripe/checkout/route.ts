import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { isStripeConfigured, getStripe, getPriceId, getPriceIdForPlan } from '@/lib/stripe'
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

    let plan: 'pro' | 'scale' = 'pro'
    try {
      const body = await request.json()
      if (body?.plan === 'scale') plan = 'scale'
    } catch {
      // default to pro if body missing
    }

    const priceId = plan === 'scale' ? getPriceIdForPlan('scale') : getPriceId()
    if (!priceId) {
      console.error(`[checkout] price ID not set for plan: ${plan}`)
      return NextResponse.json({ error: 'Price configuration is missing. Please contact support.' }, { status: 503 })
    }

    const stripe = getStripe()
    if (!priceId) {
      return NextResponse.json({ error: 'Stripe price is not configured.' }, { status: 503 })
    }
    let sub = await getSubscriptionByGithubId(user.github_id)

    if (!sub) {
      sub = await upsertSubscription({ github_id: user.github_id })
    }

    let customerId = sub.stripe_customer_id

    if (!customerId) {
      console.log('[checkout] Creating new Stripe customer for github_id:', user.github_id)
      const customer = await stripe.customers.create({
        metadata: { github_id: String(user.github_id), github_username: user.github_username },
      })
      customerId = customer.id
      console.log('[checkout] Created new customer:', customerId)
      await upsertSubscription({ github_id: user.github_id, stripe_customer_id: customerId })
    } else {
      // Verify the customer exists in Stripe (in case it's a stale test ID)
      try {
        await stripe.customers.retrieve(customerId)
        console.log('[checkout] Verified existing customer:', customerId)
      } catch (error) {
        console.log('[checkout] Customer does not exist in Stripe (likely test ID), creating new one')
        const customer = await stripe.customers.create({
          metadata: { github_id: String(user.github_id), github_username: user.github_username },
        })
        customerId = customer.id
        console.log('[checkout] Created replacement customer:', customerId)
        await upsertSubscription({ github_id: user.github_id, stripe_customer_id: customerId })
      }
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || `http://localhost:${process.env.PORT || 3000}`

    const sessionParams: Parameters<typeof stripe.checkout.sessions.create>[0] = {
      customer: customerId,
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${appUrl}/dashboard?upgraded=true`,
      cancel_url: `${appUrl}/pricing`,
      metadata: { github_id: String(user.github_id), plan },
      subscription_data: {
        metadata: { github_id: String(user.github_id), plan },
      },
    }
    if (plan === 'pro') {
      sessionParams.subscription_data!.trial_period_days = 7
    }

    console.log('[checkout] Creating session:', { plan, priceId, customerId })
    const session = await stripe.checkout.sessions.create(sessionParams)

    console.log('[v0] Checkout session created:', session.id)
    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Stripe checkout error:', error)
    const message = error instanceof Error ? error.message : 'Failed to create checkout session'
    return NextResponse.json({ error: message }, { status: 500 })
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error('[v0] Stripe checkout error:', errorMessage)
    console.error('[v0] Full error:', JSON.stringify(error, null, 2))
    if (error instanceof Error) {
      console.error('[v0] Error stack:', error.stack)
    }
    return NextResponse.json({ error: 'Failed to create checkout session', details: errorMessage }, { status: 500 })
  }
}
