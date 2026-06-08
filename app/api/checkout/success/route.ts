import { NextRequest, NextResponse } from 'next/server'
import { getAppUrl, getStripe } from '@/lib/stripe'
import { updateUserBilling, upsertSubscription } from '@/lib/queries'
import { getDb } from '@/lib/db'

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
      const isActive = !!subscription && ['active', 'trialing'].includes(subscription.status)
      const planTier = isActive ? 'pro' : 'free'

      // current_period_end is not on the typed Subscription in this Stripe SDK
      // version, so read it defensively from the raw object.
      const periodEndUnix = (subscription as unknown as { current_period_end?: number } | null)
        ?.current_period_end
      const currentPeriodEnd = periodEndUnix
        ? new Date(periodEndUnix * 1000).toISOString()
        : null

      // Update the user_auth billing columns.
      await updateUserBilling(appUserId, {
        stripe_customer_id: customerId ?? null,
        stripe_subscription_id: subscription?.id ?? null,
        stripe_price_id: subscription?.items.data[0]?.price.id ?? null,
        plan_tier: planTier,
        subscription_status: subscription?.status ?? null,
      })

      // Keep the subscriptions table (read by the billing page) in sync so the
      // dashboard reflects the upgraded plan instead of defaulting to "free".
      try {
        const sql = getDb()
        const rows = await sql`SELECT github_id FROM user_auth WHERE id = ${appUserId} LIMIT 1`
        const githubId = rows[0]?.github_id as number | undefined
        if (githubId) {
          await upsertSubscription({
            github_id: githubId,
            stripe_customer_id: customerId ?? null,
            stripe_subscription_id: subscription?.id ?? null,
            plan: planTier,
            status: subscription?.status === 'trialing' ? 'trialing' : 'active',
            current_period_end: currentPeriodEnd,
          })
        }
      } catch (syncError) {
        console.error('Failed to sync subscriptions table:', syncError)
      }
    }

    return NextResponse.redirect(new URL('/pricing?upgraded=pro', appUrl))
  } catch (error) {
    console.error('Failed to finalize checkout:', error)
    return NextResponse.redirect(new URL('/pricing?error=checkout_finalize_failed', appUrl))
  }
}
