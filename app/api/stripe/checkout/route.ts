import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { isStripeConfigured, getStripe, getPriceId } from '@/lib/stripe'
import { getSubscriptionByGithubId, upsertSubscription } from '@/lib/queries'

export async function POST() {
  try {
    if (!isStripeConfigured()) {
      return NextResponse.json({ error: 'Billing is not configured yet. Please contact support.' }, { status: 503 })
    }

    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const priceId = getPriceId()
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
      const customer = await stripe.customers.create({
        metadata: { github_id: String(user.github_id), github_username: user.github_username },
      })
      customerId = customer.id
      await upsertSubscription({ github_id: user.github_id, stripe_customer_id: customerId })
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || `http://localhost:${process.env.PORT || 3000}`

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${appUrl}/dashboard?upgraded=true`,
      cancel_url: `${appUrl}/pricing`,
      subscription_data: {
        trial_period_days: 7,
        metadata: { github_id: String(user.github_id) },
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Stripe checkout error:', error)
    const message = error instanceof Error ? error.message : 'Failed to create checkout session'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
