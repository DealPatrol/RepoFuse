import { NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { upsertSubscription, getSubscriptionByStripeCustomerId, getUserByGithubId } from '@/lib/queries'
import { grantCredits, CREDITS } from '@/lib/credits'
import type Stripe from 'stripe'

/** Stripe SDK requires Node.js (not Edge). */
export const runtime = 'nodejs'

const HANDLED_EVENTS = new Set([
  'checkout.session.completed',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'invoice.payment_failed',
  'invoice.payment_succeeded',
])

export async function POST(request: NextRequest) {
  const signature = request.headers.get('stripe-signature')

  if (!process.env.STRIPE_WEBHOOK_SECRET || !process.env.STRIPE_SECRET_KEY) {
    console.error('[stripe/webhook] Missing STRIPE_WEBHOOK_SECRET or STRIPE_SECRET_KEY in environment')
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 503 })
  }

  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 })
  }

  let body: string
  try {
    body = await request.text()
  } catch (err) {
    console.error('[stripe/webhook] Failed to read request body:', err)
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  let stripe: ReturnType<typeof getStripe>
  try {
    stripe = getStripe()
  } catch (err) {
    console.error('[stripe/webhook] Stripe client init failed:', err)
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    console.error('[stripe/webhook] Signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  console.log('[stripe/webhook] Received event', { id: event.id, type: event.type })

  if (!HANDLED_EVENTS.has(event.type)) {
    return NextResponse.json({ received: true, ignored: event.type })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        if (session.mode === 'subscription' && session.customer && session.subscription) {
          const sub = await stripe.subscriptions.retrieve(session.subscription as string)
          const githubId = Number(sub.metadata.github_id || session.metadata?.github_id)
          const periodEnd = (sub as unknown as { current_period_end?: number }).current_period_end
          if (githubId) {
            await upsertSubscription({
              github_id: githubId,
              stripe_customer_id: session.customer as string,
              stripe_subscription_id: sub.id,
              plan: 'pro',
              status: 'active',
              current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
            })

            try {
              const user = await getUserByGithubId(githubId)
              if (user) {
                await grantCredits(
                  user.id,
                  CREDITS.INITIAL_GRANT,
                  'Pro plan signup bonus',
                  { stripe_customer_id: session.customer as string },
                )
                console.log(`[stripe/webhook] Granted ${CREDITS.INITIAL_GRANT} signup credits to ${user.id}`)
              }
            } catch (err) {
              console.error('[stripe/webhook] Failed to grant signup credits (subscription saved):', err)
            }
          } else {
            console.warn('[stripe/webhook] checkout.session.completed missing github_id metadata', {
              sessionId: session.id,
            })
          }
        }
        break
      }

      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription
        const existing = await getSubscriptionByStripeCustomerId(sub.customer as string)
        const periodEnd = (sub as unknown as { current_period_end?: number }).current_period_end
        if (existing) {
          const isPro = sub.status === 'active' || sub.status === 'trialing'
          await upsertSubscription({
            github_id: existing.github_id,
            plan: isPro ? 'pro' : 'free',
            status:
              sub.status === 'active'
                ? 'active'
                : sub.status === 'past_due'
                  ? 'past_due'
                  : sub.status === 'trialing'
                    ? 'trialing'
                    : 'canceled',
            current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
          })
        }
        break
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription
        const existing = await getSubscriptionByStripeCustomerId(sub.customer as string)
        if (existing) {
          await upsertSubscription({
            github_id: existing.github_id,
            plan: 'free',
            status: 'canceled',
          })
        }
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        if (invoice.customer) {
          const existing = await getSubscriptionByStripeCustomerId(invoice.customer as string)
          if (existing) {
            await upsertSubscription({
              github_id: existing.github_id,
              status: 'past_due',
            })
          }
        }
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        if (invoice.customer) {
          const existing = await getSubscriptionByStripeCustomerId(invoice.customer as string)
          if (existing) {
            try {
              if (invoice.number && invoice.number !== '0001') {
                const user = await getUserByGithubId(existing.github_id)
                if (user) {
                  await grantCredits(
                    user.id,
                    CREDITS.MONTHLY_GRANT,
                    'Monthly subscription renewal',
                    { invoice_id: invoice.id, stripe_customer_id: invoice.customer as string },
                  )
                  console.log(`[stripe/webhook] Granted ${CREDITS.MONTHLY_GRANT} renewal credits to ${user.id}`)
                }
              }
            } catch (err) {
              console.error('[stripe/webhook] Failed to grant renewal credits:', err)
            }
          }
        }
        break
      }
    }
  } catch (err) {
    console.error('[stripe/webhook] Handler error:', { eventId: event.id, type: event.type, err })
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}

/** Stripe probes with GET; explicit 405 avoids ambiguous routing errors. */
export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}
