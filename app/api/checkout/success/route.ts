import { NextRequest, NextResponse } from 'next/server'
import { getAppUrl, getStripe } from '@/lib/stripe'
import { updateUserBilling } from '@/lib/queries'

export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get('session_id')
  const appUrl = getAppUrl(request.nextUrl.origin)

  if (!sessionId) {
    return NextResponse.redirect(new URL('/pricing?error=missing_checkout_session', appUrl))
  }

  try {
    const stripe = getStripe()
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription', 'customer'],
    })

    const subscription = typeof session.subscription === 'string' ? null : session.subscription
    const appUserId = session.metadata?.app_user_id || subscription?.metadata?.app_user_id
    const customerId = typeof session.customer === 'string' ? session.customer : session.customer?.id

    if (appUserId) {
      await updateUserBilling(appUserId, {
        stripe_customer_id: customerId ?? null,
        stripe_subscription_id: subscription?.id ?? null,
        stripe_price_id: subscription?.items.data[0]?.price.id ?? null,
        plan_tier: subscription && ['active', 'trialing'].includes(subscription.status) ? 'pro' : 'free',
        subscription_status: subscription?.status ?? null,
      })
    }

    return NextResponse.redirect(new URL('/pricing?upgraded=pro', appUrl))
  } catch (error) {
    console.error('Failed to finalize checkout:', error)
    return NextResponse.redirect(new URL('/pricing?error=checkout_finalize_failed', appUrl))
  }
}
