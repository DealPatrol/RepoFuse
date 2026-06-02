import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { isStripeConfigured, getStripe, getPriceId } from '@/lib/stripe'
import { getSubscriptionByGithubId, upsertSubscription } from '@/lib/queries'

export async function GET(request: NextRequest) {
  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin

    if (!isStripeConfigured()) {
      console.error('[v0] Stripe not configured')
      return NextResponse.redirect(new URL('/dashboard?error=stripe_not_configured', appUrl))
    }

    const user = await getCurrentUser()
    if (!user) {
      console.error('[v0] No user found for checkout redirect')
      return NextResponse.redirect(new URL('/?error=auth_required', appUrl))
    }

    const priceId = getPriceId()
    if (!priceId) {
      console.error('[v0] STRIPE_PRO_PRICE_ID is not set')
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

    console.log('[v0] Creating checkout session for launch signup:', { priceId, customerId })
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

    console.log('[v0] Checkout session created, redirecting:', session.id)
    
    if (!session.url) {
      console.error('[v0] No checkout URL in session')
      return NextResponse.redirect(new URL('/dashboard?error=checkout_failed', appUrl))
    }

    return NextResponse.redirect(session.url)
  } catch (error) {
    console.error('[v0] Checkout redirect error:', error instanceof Error ? error.message : String(error))
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    return NextResponse.redirect(new URL('/dashboard?error=checkout_failed', appUrl))
  }
}
