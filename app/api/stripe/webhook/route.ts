import { NextRequest, NextResponse } from 'next/server'
import { getStripe, getWebhookSecret } from '@/lib/stripe'
import { upsertSubscription, getSubscriptionByStripeCustomerId, getUserByGithubId } from '@/lib/queries'
import { grantCredits, CREDITS } from '@/lib/credits'
import type Stripe from 'stripe'

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  const webhookSecret = getWebhookSecret()
  if (!signature || !webhookSecret) {
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 400 })
  }

  let stripe: ReturnType<typeof getStripe>
  try {
    stripe = getStripe()
  } catch {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
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
            
            // Grant initial credits on signup
            try {
              const user = await getUserByGithubId(githubId)
              if (user) {
                await grantCredits(
                  user.id,
                  CREDITS.INITIAL_GRANT,
                  'Pro plan signup bonus',
                  { stripe_customer_id: session.customer as string }
                )
                console.log(`[v0] Granted ${CREDITS.INITIAL_GRANT} credits to user ${user.id}`)
              }
            } catch (err) {
              console.error('[v0] Failed to grant signup credits:', err)
            }
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
            status: sub.status === 'active' ? 'active'
              : sub.status === 'past_due' ? 'past_due'
              : sub.status === 'trialing' ? 'trialing'
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
            // Grant monthly renewal credits on successful payment (but only if not the initial invoice)
            try {
              // Check if this is a renewal (not the initial invoice by checking if invoice number > 1)
              if (invoice.number && invoice.number !== '0001') {
                const user = await getUserByGithubId(existing.github_id)
                if (user) {
                  await grantCredits(
                    user.id,
                    CREDITS.MONTHLY_GRANT,
                    'Monthly subscription renewal',
                    { invoice_id: invoice.id, stripe_customer_id: invoice.customer as string }
                  )
                  console.log(`[v0] Granted ${CREDITS.MONTHLY_GRANT} monthly renewal credits to user ${user.id}`)
                }
              }
            } catch (err) {
              console.error('[v0] Failed to grant renewal credits:', err)
            }
          }
        }
        break
      }
    }
  } catch (err) {
    console.error('Webhook handler error:', err)
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
