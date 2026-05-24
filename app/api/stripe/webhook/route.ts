import { NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import {
  getSubscriptionByStripeCustomerId,
  getUserByGithubId,
  updateUserBilling,
  upsertSubscription,
} from '@/lib/queries'
import { CREDITS, grantCredits } from '@/lib/credits'
import type Stripe from 'stripe'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const ACTIVE_SUBSCRIPTION_STATUSES = new Set(['active', 'trialing'])

function getPeriodEnd(subscription: Stripe.Subscription): string | null {
  const periodEnd = (subscription as unknown as { current_period_end?: number }).current_period_end
  return periodEnd ? new Date(periodEnd * 1000).toISOString() : null
}

function normalizeSubscriptionStatus(status: Stripe.Subscription.Status): 'active' | 'past_due' | 'canceled' | 'trialing' {
  if (status === 'active' || status === 'trialing' || status === 'past_due') {
    return status
  }

  return 'canceled'
}

async function syncBillingState({
  githubId,
  stripeCustomerId,
  stripeSubscriptionId,
  stripePriceId,
  status,
  currentPeriodEnd,
}: {
  githubId: number
  stripeCustomerId?: string | null
  stripeSubscriptionId?: string | null
  stripePriceId?: string | null
  status: Stripe.Subscription.Status
  currentPeriodEnd?: string | null
}) {
  const plan = ACTIVE_SUBSCRIPTION_STATUSES.has(status) ? 'pro' : 'free'
  const normalizedStatus = normalizeSubscriptionStatus(status)

  await upsertSubscription({
    github_id: githubId,
    stripe_customer_id: stripeCustomerId ?? null,
    stripe_subscription_id: stripeSubscriptionId ?? null,
    plan,
    status: normalizedStatus,
    current_period_end: currentPeriodEnd ?? null,
  })

  const user = await getUserByGithubId(githubId)
  if (user) {
    await updateUserBilling(user.id, {
      stripe_customer_id: stripeCustomerId ?? null,
      stripe_subscription_id: stripeSubscriptionId ?? null,
      stripe_price_id: stripePriceId ?? null,
      plan_tier: plan,
      subscription_status: normalizedStatus,
    })
  }

  return user
}

async function grantSignupCredits(githubId: number, customerId: string) {
  try {
    const user = await getUserByGithubId(githubId)
    if (!user) return

    await grantCredits(user.id, CREDITS.INITIAL_GRANT, 'Pro plan signup bonus', {
      stripe_customer_id: customerId,
    })
  } catch (error) {
    console.error('[stripe-webhook] Failed to grant signup credits:', error)
  }
}

async function grantRenewalCredits(githubId: number, invoice: Stripe.Invoice) {
  try {
    if (!invoice.number || invoice.number === '0001') return

    const user = await getUserByGithubId(githubId)
    if (!user) return

    await grantCredits(user.id, CREDITS.MONTHLY_GRANT, 'Monthly subscription renewal', {
      invoice_id: invoice.id,
      stripe_customer_id: invoice.customer as string,
    })
  } catch (error) {
    console.error('[stripe-webhook] Failed to grant renewal credits:', error)
  }
}

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature || !process.env.STRIPE_WEBHOOK_SECRET || !process.env.STRIPE_SECRET_KEY) {
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
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (error) {
    console.error('[stripe-webhook] Signature verification failed:', error)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        if (session.mode !== 'subscription' || !session.customer || !session.subscription) {
          break
        }

        const subscription = await stripe.subscriptions.retrieve(session.subscription as string)
        const githubId = Number(subscription.metadata.github_id || session.metadata?.github_id)
        if (!githubId) {
          throw new Error(`Missing github_id metadata for checkout session ${session.id}`)
        }

        await syncBillingState({
          githubId,
          stripeCustomerId: session.customer as string,
          stripeSubscriptionId: subscription.id,
          stripePriceId: subscription.items.data[0]?.price.id ?? null,
          status: subscription.status,
          currentPeriodEnd: getPeriodEnd(subscription),
        })
        await grantSignupCredits(githubId, session.customer as string)
        break
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const existing = await getSubscriptionByStripeCustomerId(subscription.customer as string)
        const githubId = Number(subscription.metadata.github_id || existing?.github_id)
        if (!githubId) {
          throw new Error(`Missing github_id for subscription ${subscription.id}`)
        }

        await syncBillingState({
          githubId,
          stripeCustomerId: subscription.customer as string,
          stripeSubscriptionId: subscription.id,
          stripePriceId: subscription.items.data[0]?.price.id ?? null,
          status: subscription.status,
          currentPeriodEnd: getPeriodEnd(subscription),
        })
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const existing = await getSubscriptionByStripeCustomerId(subscription.customer as string)
        const githubId = Number(subscription.metadata.github_id || existing?.github_id)
        if (!githubId) {
          throw new Error(`Missing github_id for deleted subscription ${subscription.id}`)
        }

        await syncBillingState({
          githubId,
          stripeCustomerId: subscription.customer as string,
          stripeSubscriptionId: subscription.id,
          stripePriceId: subscription.items.data[0]?.price.id ?? null,
          status: 'canceled',
          currentPeriodEnd: getPeriodEnd(subscription),
        })
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        if (!invoice.customer) break

        const existing = await getSubscriptionByStripeCustomerId(invoice.customer as string)
        if (existing) {
          await upsertSubscription({
            github_id: existing.github_id,
            status: 'past_due',
            plan: 'free',
          })

          const user = await getUserByGithubId(existing.github_id)
          if (user) {
            await updateUserBilling(user.id, {
              plan_tier: 'free',
              subscription_status: 'past_due',
            })
          }
        }
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        if (!invoice.customer) break

        const existing = await getSubscriptionByStripeCustomerId(invoice.customer as string)
        if (existing) {
          await grantRenewalCredits(existing.github_id, invoice)
        }
        break
      }

      default:
        break
    }
  } catch (error) {
    console.error('[stripe-webhook] Handler error:', error)
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
