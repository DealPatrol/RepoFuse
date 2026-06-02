import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { isStripeConfigured, getStripe } from '@/lib/stripe'
import { getSubscriptionByGithubId } from '@/lib/queries'

export async function POST() {
  try {
    if (!isStripeConfigured()) {
      return NextResponse.json({ error: 'Billing is not configured yet. Please contact support.' }, { status: 503 })
    }

    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const sub = await getSubscriptionByGithubId(user.github_id)
    if (!sub?.stripe_customer_id) {
      return NextResponse.json({ error: 'No billing account found. Upgrade to Pro first.' }, { status: 404 })
    }

    const stripe = getStripe()
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || `http://localhost:${process.env.PORT || 3000}`

    const session = await stripe.billingPortal.sessions.create({
      customer: sub.stripe_customer_id,
      return_url: `${appUrl}/dashboard/billing`,
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Stripe portal error:', error)
    const message = error instanceof Error ? error.message : 'Failed to open billing portal. Please try again.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
