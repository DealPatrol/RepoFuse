import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { getAppUrl, getCheckoutPlanOptions, getPriceIdForPlan, getStripe, isStripeConfigured, parseCheckoutPlan } from '@/lib/stripe'
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

  const plan = parseCheckoutPlan(request.nextUrl.searchParams.get('plan'))
  const priceId = getPriceIdForPlan(plan)
  if (!priceId) {
    return NextResponse.redirect(new URL('/pricing?error=checkout_not_configured', appUrl))
  }
  const planOptions = getCheckoutPlanOptions(plan)

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
          price: priceId,
          quantity: 1,
        },
      ],
      allow_promotion_codes: true,
      payment_method_collection: planOptions.paymentMethodCollection,
      success_url: `${appUrl}/api/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/pricing?canceled=1`,
      metadata: {
        app_user_id: user.id,
        github_id: String(user.github_id),
        plan,
      },
      subscription_data: {
        metadata: {
          app_user_id: user.id,
          github_id: String(user.github_id),
          plan,
        },
        ...(planOptions.trialDays
          ? {
              trial_period_days: planOptions.trialDays,
              trial_settings: { end_behavior: { missing_payment_method: 'cancel' as const } },
            }
          : {}),
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
