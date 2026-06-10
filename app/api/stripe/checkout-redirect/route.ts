import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { isStripeConfigured, getStripe, getPriceId } from '@/lib/stripe'
import { getSubscriptionByGithubId, upsertSubscription } from '@/lib/queries'

export async function GET(request: NextRequest) {
  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin

    if (!isStripeConfigured()) {
      return NextResponse.redirect(new URL('/dashboard?error=stripe_not_configured', appUrl))
    }

    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.redirect(new URL('/?error=auth_required', appUrl))
    }

    const priceId = getPriceId()
    if (!priceId) {
      return NextResponse.redirect(new URL('/dashboard?error=price_not_configured', appUrl))
    }

    const stripe = getStripe()
    let sub = await getSubscriptionByGithubId(user.github_id)

    if (!sub) {
      sub = await upsertSubscription({ github_id: user.github_id })
    }

    let customerId = sub.stripe_customer_id

    if (!customerId) {
      const customer = await stripe.customers.create({
        metadata: { 
          github_id: String(user.github_id), 
          github_username: user.github_username 
        },
      })
      customerId = customer.id
      await upsertSubscription({ github_id: user.github_id, stripe_customer_id: customerId })
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${appUrl}/dashboard?upgraded=true`,
      cancel_url: `${appUrl}/pricing?cancelled=true`,
      metadata: { github_id: String(user.github_id), plan: 'pro' },
      subscription_data: {
        trial_period_days: 14, // Launch offer: 14 days free
        metadata: { github_id: String(user.github_id), plan: 'pro' },
      },
    })

    if (!session.url) {
      console.error('Stripe checkout session missing redirect URL')
      return NextResponse.redirect(new URL('/dashboard?error=checkout_failed', appUrl))
    }

    return NextResponse.redirect(session.url)
  } catch (error) {
    console.error('Checkout redirect error:', error instanceof Error ? error.message : String(error))
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    return NextResponse.redirect(new URL('/dashboard?error=checkout_failed', appUrl))
  }
}
