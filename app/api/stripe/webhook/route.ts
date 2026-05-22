import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getPriceIdForPlan, getStripe, getStripeWebhookSecret } from '@/lib/stripe'
import { upsertSubscription, type Subscription } from '@/lib/queries'

type BillingPlan = Extract<Subscription['plan'], 'pro' | 'scale'>
type BillingStatus = Subscription['status']

function getPlanFromPriceId(priceId: string | undefined): BillingPlan | null {
  if (!priceId) return null

  const priceMap = new Map<string, BillingPlan>()
  const proPriceId = getPriceIdForPlan('pro')
  const scalePriceId = getPriceIdForPlan('scale')

  if (proPriceId) priceMap.set(proPriceId, 'pro')
  if (scalePriceId) priceMap.set(scalePriceId, 'scale')

  return priceMap.get(priceId) ?? null
}

function normalizeSubscriptionStatus(status: Stripe.Subscription.Status): BillingStatus {
  if (status === 'trialing') return 'trialing'
  if (status === 'past_due' || status === 'unpaid' || status === 'incomplete') return 'past_due'
  if (status === 'canceled' || status === 'incomplete_expired') return 'canceled'
  return 'active'
}

function getCurrentPeriodEnd(subscription: Stripe.Subscription): string | null {
  const currentPeriodEnd = (subscription as unknown as { current_period_end?: number }).current_period_end
  return currentPeriodEnd ? new Date(currentPeriodEnd * 1000).toISOString() : null
}

function getGithubIdFromMetadata(...metadataSources: Array<Stripe.Metadata | null | undefined>): number | null {
  for (const metadata of metadataSources) {
    const rawGithubId = metadata?.github_id
    if (!rawGithubId) continue
    const githubId = Number.parseInt(rawGithubId, 10)
    if (!Number.isNaN(githubId)) return githubId
  }
  return null
}

function getInvoiceSubscriptionId(invoice: Stripe.Invoice): string | null {
  const legacy = (invoice as unknown as { subscription?: string | { id?: string } }).subscription
  if (typeof legacy === 'string') return legacy
  if (legacy?.id) return legacy.id

  const parentSubscription = (invoice as unknown as {
    parent?: { subscription_details?: { subscription?: string } }
  }).parent?.subscription_details?.subscription

  return parentSubscription ?? null
}

async function upsertFromSubscription(subscription: Stripe.Subscription, fallbackMetadata?: Stripe.Metadata | null) {
  const customerId = typeof subscription.customer === 'string' ? subscription.customer : subscription.customer.id
  const priceId = subscription.items.data[0]?.price.id
  const plan = getPlanFromPriceId(priceId) ?? getMetadataPlan(subscription.metadata, fallbackMetadata) ?? 'pro'
  const githubId = getGithubIdFromMetadata(subscription.metadata, fallbackMetadata)

  if (!githubId) {
    console.warn('[stripe-webhook] Missing github_id metadata for subscription:', subscription.id)
    return
  }

  await upsertSubscription({
    github_id: githubId,
    stripe_customer_id: customerId,
    stripe_subscription_id: subscription.id,
    plan,
    status: normalizeSubscriptionStatus(subscription.status),
    current_period_end: getCurrentPeriodEnd(subscription),
  })
}

function getMetadataPlan(...metadataSources: Array<Stripe.Metadata | null | undefined>): BillingPlan | null {
  for (const metadata of metadataSources) {
    if (metadata?.plan === 'pro' || metadata?.plan === 'scale') return metadata.plan
  }
  return null
}

export async function POST(req: NextRequest) {
  const signature = req.headers.get('stripe-signature')
  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  const webhookSecret = getStripeWebhookSecret()
  if (!webhookSecret) {
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 })
  }

  let event: Stripe.Event
  try {
    const body = await req.text()
    event = getStripe().webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[stripe-webhook] Signature verification failed:', message)
    return NextResponse.json({ error: `Webhook Error: ${message}` }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        if (typeof session.subscription === 'string') {
          const subscription = await getStripe().subscriptions.retrieve(session.subscription)
          await upsertFromSubscription(subscription, session.metadata)
        } else {
          const githubId = getGithubIdFromMetadata(session.metadata)
          const customerId = typeof session.customer === 'string' ? session.customer : null
          if (githubId && customerId) {
            await upsertSubscription({ github_id: githubId, stripe_customer_id: customerId })
          }
        }
        break
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        await upsertFromSubscription(event.data.object as Stripe.Subscription)
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = typeof subscription.customer === 'string' ? subscription.customer : subscription.customer.id
        const githubId = getGithubIdFromMetadata(subscription.metadata)
        if (githubId) {
          await upsertSubscription({
            github_id: githubId,
            stripe_customer_id: customerId,
            stripe_subscription_id: subscription.id,
            plan: 'free',
            status: 'canceled',
            current_period_end: getCurrentPeriodEnd(subscription),
          })
        }
        break
      }

      case 'invoice.payment_succeeded':
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const subscriptionId = getInvoiceSubscriptionId(invoice)
        if (subscriptionId) {
          const subscription = await getStripe().subscriptions.retrieve(subscriptionId)
          await upsertFromSubscription(subscription)
        }
        break
      }

      default:
        console.log('[stripe-webhook] Unhandled event type:', event.type)
    }
  } catch (error) {
    console.error('[stripe-webhook] Error processing event:', error)
    return NextResponse.json({ received: true, warning: 'Processing error' }, { status: 200 })
  }

  return NextResponse.json({ received: true })
}

export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}
