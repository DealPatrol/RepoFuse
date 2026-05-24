import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { getAppUrl, getStripe, isStripeConfigured } from '@/lib/stripe'
import { getBillingState } from '@/lib/billing'

export async function GET(request: NextRequest) {
  const appUrl = getAppUrl(request.nextUrl.origin)

  if (!isStripeConfigured()) {
    return NextResponse.redirect(new URL('/pricing?error=checkout_not_configured', appUrl))
  }

  const user = await getCurrentUser()

  if (!user) {
    return NextResponse.redirect(new URL('/api/auth/github/login?returnTo=/api/billing/portal', appUrl))
  }

  const billing = await getBillingState(user)

  if (!billing.customerId) {
    return NextResponse.redirect(new URL('/pricing', appUrl))
  }

  try {
    const stripe = getStripe()
    const session = await stripe.billingPortal.sessions.create({
      customer: billing.customerId,
      return_url: `${appUrl}/pricing`,
    })

    return NextResponse.redirect(session.url)
  } catch (error) {
    console.error('Failed to create billing portal session:', error)
    return NextResponse.redirect(new URL('/pricing?error=billing_portal_failed', appUrl))
  }
}
