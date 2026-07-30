import { NextRequest, NextResponse } from 'next/server'
import type Stripe from 'stripe'
import {
  CREDITS,
  grantCredits,
  hasCreditTransactionWithMetadata,
  renewMonthlyCredits,
} from '@/lib/credits'
import {
  getSubscriptionByStripeCustomerId,
  getUserByGithubId,
  updateUserBilling,
  upsertSubscription,
} from '@/lib/queries'
import { getStripe, getWebhookSecret, getPriceIdForPlan } from '@/lib/stripe'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

type NeonSubscriptionStatus = 'active' | 'past_due' | 'canceled' | 'trialing'
type BillingPlan = 'free' | 'pro' | 'scale'

const HANDLED_EVENTS = new Set([
  'checkout.session.completed',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'invoice.payment_failed',
  'invoice.payment_succeeded',
])

function parseGithubId(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined) {
    return null
  }

  const githubId = typeof value === 'number' ? value : Number.parseInt(value, 10)
  return Number.isSafeInteger(githubId) && githubId > 0 ? githubId : null
}

function getCurrentPeriodEnd(subscription: Stripe.Subscription): string | null {
  const periodEnd = (subscription as unknown as { current_period_end?: number }).current_period_end
  return periodEnd ? new Date(periodEnd * 1000).toISOString() : null
}

function mapSubscriptionStatus(status: Stripe.Subscription.Status): NeonSubscriptionStatus {
  if (status === 'active' || status === 'trialing' || status === 'past_due') {
    return status
  }

  return 'canceled'
}

function getPlanFromPriceId(priceId: string | null | undefined): BillingPlan {
  if (!priceId) {
    return 'pro'
  }

  const scalePriceId = getPriceIdForPlan('scale')
  if (scalePriceId && priceId === scalePriceId) {
    return 'scale'
  }

  return 'pro'
}

function getCreditGrantForPrice(priceId: string | null | undefined, fallback: number): number {
  const scalePriceId = getPriceIdForPlan('scale')
  if (priceId && scalePriceId && priceId === scalePriceId) {
    return CREDITS.SCALE_MONTHLY_GRANT
  }

  return fallback
}

async function resolveGithubId(
  stripe: ReturnType<typeof getStripe>,
  subscription: Stripe.Subscription,
  customerId: string,
  fallback?: string | number | null,
): Promise<number | null> {
  const metadataId = parseGithubId(subscription.metadata.github_id) ?? parseGithubId(fallback)
  if (metadataId) {
    return metadataId
  }

  const existing = await getSubscriptionByStripeCustomerId(customerId)
  if (existing) {
    return existing.github_id
  }

  const customer = await stripe.customers.retrieve(customerId)
  if (!customer.deleted) {
    return parseGithubId(customer.metadata.github_id)
  }

  return null
}

async function persistSubscriptionState(params: {
  githubId: number
  customerId: string
  subscription: Stripe.Subscription
}) {
  const { githubId, customerId, subscription } = params
  const status = mapSubscriptionStatus(subscription.status)
  const priceId = subscription.items.data[0]?.price.id ?? null
  const plan: BillingPlan =
    status === 'active' || status === 'trialing' ? getPlanFromPriceId(priceId) : 'free'

  const savedSubscription = await upsertSubscription({
    github_id: githubId,
    stripe_customer_id: customerId,
    stripe_subscription_id: subscription.id,
    plan,
    status,
    current_period_end: getCurrentPeriodEnd(subscription),
  })
  if (!savedSubscription.id) {
    throw new Error('Failed to persist subscription state')
  }

  const user = await getUserByGithubId(githubId)
  if (user) {
    await updateUserBilling(user.id, {
      stripe_customer_id: customerId,
      stripe_subscription_id: subscription.id,
      stripe_price_id: priceId,
      plan_tier: plan,
      subscription_status: status,
    })
  }

  return { user, plan, status, priceId }
}

export async function POST(request: NextRequest) {
  const signature = request.headers.get('stripe-signature')
  const webhookSecret = getWebhookSecret()

  if (!signature || !webhookSecret) {
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 400 })
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
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err) {
    console.error('[stripe/webhook] Signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  if (!HANDLED_EVENTS.has(event.type)) {
    return NextResponse.json({ received: true, ignored: event.type })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session

        if (session.mode !== 'subscription' || !session.customer || !session.subscription) {
          break
        }

        const customerId = session.customer as string
        const subscription = await stripe.subscriptions.retrieve(session.subscription as string)
        const githubId = await resolveGithubId(stripe, subscription, customerId, session.metadata?.github_id)

        if (!githubId) {
          console.error('[stripe/webhook] Could not map checkout session to a GitHub user', {
            sessionId: session.id,
          })
          break
        }

        const { user, priceId } = await persistSubscriptionState({ githubId, customerId, subscription })
        if (user) {
          const alreadyGranted = await hasCreditTransactionWithMetadata(user.id, 'grant', {
            stripe_checkout_session_id: session.id,
          })
          if (alreadyGranted) {
            break
          }

          const amount = getCreditGrantForPrice(priceId, CREDITS.INITIAL_GRANT)
          await grantCredits(user.id, amount, 'Subscription signup credit grant', {
            stripe_checkout_session_id: session.id,
            stripe_customer_id: customerId,
            stripe_subscription_id: subscription.id,
          })
        }
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string
        const githubId = await resolveGithubId(stripe, subscription, customerId)

        if (!githubId) {
          console.error('[stripe/webhook] Could not map subscription to a GitHub user', {
            subscriptionId: subscription.id,
          })
          break
        }

        await persistSubscriptionState({ githubId, customerId, subscription })
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string
        const githubId = await resolveGithubId(stripe, subscription, customerId)

        if (!githubId) {
          console.error('[stripe/webhook] Could not map deleted subscription to a GitHub user', {
            subscriptionId: subscription.id,
          })
          break
        }

        const savedSubscription = await upsertSubscription({
          github_id: githubId,
          stripe_customer_id: customerId,
          stripe_subscription_id: subscription.id,
          plan: 'free',
          status: 'canceled',
          current_period_end: getCurrentPeriodEnd(subscription),
        })
        if (!savedSubscription.id) {
          throw new Error('Failed to persist canceled subscription state')
        }

        const user = await getUserByGithubId(githubId)
        if (user) {
          await updateUserBilling(user.id, {
            stripe_customer_id: customerId,
            stripe_subscription_id: subscription.id,
            stripe_price_id: subscription.items.data[0]?.price.id ?? null,
            plan_tier: 'free',
            subscription_status: 'canceled',
          })
        }
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const customerId = invoice.customer as string | null

        if (!customerId) {
          break
        }

        const existing = await getSubscriptionByStripeCustomerId(customerId)
        if (existing) {
          const savedSubscription = await upsertSubscription({
            github_id: existing.github_id,
            stripe_customer_id: customerId,
            status: 'past_due',
          })
          if (!savedSubscription.id) {
            throw new Error('Failed to persist past-due subscription state')
          }

          const user = await getUserByGithubId(existing.github_id)
          if (user) {
            await updateUserBilling(user.id, {
              stripe_customer_id: customerId,
              subscription_status: 'past_due',
              plan_tier: 'free',
            })
          }
        }
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        const customerId = invoice.customer as string | null

        if (!customerId) {
          break
        }

        const invoiceSubscription = (invoice as unknown as { subscription?: string | Stripe.Subscription | null })
          .subscription
        const subscription =
          typeof invoiceSubscription === 'string'
            ? await stripe.subscriptions.retrieve(invoiceSubscription)
            : invoiceSubscription ?? null

        if (subscription) {
          const githubId = await resolveGithubId(stripe, subscription, customerId)
          if (githubId) {
            const { user, priceId } = await persistSubscriptionState({ githubId, customerId, subscription })
            const billingReason = (invoice as unknown as { billing_reason?: string | null }).billing_reason

            if (user && billingReason !== 'subscription_create') {
              const alreadyRenewed = await hasCreditTransactionWithMetadata(user.id, 'renewal', {
                invoice_id: invoice.id,
              })
              if (alreadyRenewed) {
                break
              }

              const amount = getCreditGrantForPrice(priceId, CREDITS.MONTHLY_GRANT)
              await renewMonthlyCredits(user.id, amount, 'Monthly subscription renewal', {
                invoice_id: invoice.id,
                stripe_customer_id: customerId,
                stripe_subscription_id: subscription.id,
              })
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

export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}
