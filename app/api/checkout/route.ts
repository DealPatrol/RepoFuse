import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { getAppUrl, getProPriceId, getStripe, isStripeConfigured } from '@/lib/stripe'
import { updateUserBilling } from '@/lib/queries'

export async function GET(request: NextRequest) {
  const appUrl = getAppUrl(request.nextUrl.origin)

  if (!isStripeConfigured()) {
    return NextResponse.redirect(new URL('/pricing?error=checkout_not_configured', appUrl))
  }

  const user = await getCurrentUser()

  if (!user) {
    const returnTo = `/api/checkout?${request.nextUrl.searchParams.toString()}`
    const loginUrl = new URL('/api/auth/github/login', appUrl)
    loginUrl.searchParams.set('returnTo', returnTo)
    return NextResponse.redirect(loginUrl)
  }

  try {
    const stripe = getStripe()
    let customerId = user.stripe_customer_id

    if (!customerId) {
      const customer = await stripe.customers.create({
        metadata: {
          github_id: String(user.github_id),
          github_username: user.github_username,
          app_user_id: user.id,
        },
      })
      customerId = customer.id
      await updateUserBilling(user.id, { stripe_customer_id: customerId })
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      line_items: [
        {
          price: getProPriceId(),
          quantity: 1,
        },
      ],
      allow_promotion_codes: true,
      success_url: `${appUrl}/api/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/pricing?canceled=1`,
      metadata: {
        app_user_id: user.id,
        github_id: String(user.github_id),
      },
      subscription_data: {
        metadata: {
          app_user_id: user.id,
          github_id: String(user.github_id),
        },
      },
    })

    if (!session.url) {
      throw new Error('Stripe checkout session did not return a URL')
    }

    return NextResponse.redirect(session.url)
  } catch (error) {
    console.error('Failed to create checkout session:', error)
    return NextResponse.redirect(new URL('/pricing?error=checkout_failed', appUrl))
  }
}
