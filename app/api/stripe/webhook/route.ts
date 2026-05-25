import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getPriceIdForPlan, getStripe, getStripeWebhookSecret } from '@/lib/stripe'
import { upsertSubscription, type Subscription } from '@/lib/queries'
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// ─── Lazy clients (avoid build-time evaluation) ──────────────────────────────

let _stripe: Stripe | null = null;
function getStripeClient(): Stripe {
  if (_stripe) return _stripe;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY is not configured");
  }
  _stripe = new Stripe(key);
  return _stripe;
}

let _supabase: SupabaseClient | null = null;
function getSupabaseClient(): SupabaseClient {
  if (_supabase) return _supabase;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error("Supabase env vars are not configured");
  }
  _supabase = createClient(url, serviceKey);
  return _supabase;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getPlanFromPriceId(priceId: string): string {
  const priceMap: Record<string, string> = {
    [process.env.STRIPE_PRICE_PRO_MONTHLY || ""]: "pro",
    [process.env.STRIPE_PRICE_PRO_YEARLY || ""]: "pro",
    [process.env.STRIPE_PRICE_STARTER_MONTHLY || ""]: "starter",
  };
  return priceMap[priceId] || "free";
}

// ─── Webhook Handler ──────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  // 1. Get the raw body — required for Stripe signature verification
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

type BillingPlan = Extract<Subscription['plan'], 'pro' | 'scale'>
type BillingStatus = Subscription['status']

function getPlanFromPriceId(priceId: string | undefined): BillingPlan | null {
  if (!priceId) return null
  // 2. Verify the event actually came from Stripe
  let event: Stripe.Event;
  try {
    event = getStripeClient().webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error(`⚠️  Webhook signature verification failed: ${message}`);
    return NextResponse.json({ error: `Webhook Error: ${message}` }, { status: 400 });
  }

  console.log(`✅ Stripe webhook received: ${event.type}`);

  // 3. Handle each event type
  try {
    switch (event.type) {

  const priceMap = new Map<string, BillingPlan>()
  const proPriceId = getPriceIdForPlan('pro')
  const scalePriceId = getPriceIdForPlan('scale')

  if (proPriceId) priceMap.set(proPriceId, 'pro')
  if (scalePriceId) priceMap.set(scalePriceId, 'scale')

  return priceMap.get(priceId) ?? null
}
        await getSupabaseClient()
          .from("subscriptions")
          .upsert({
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
            email: customerEmail,
            status: "active",
            updated_at: new Date().toISOString(),
          }, { onConflict: "email" });

        // Also update the user's plan in the profiles table
        await getSupabaseClient()
          .from("profiles")
          .update({
            stripe_customer_id: customerId,
            subscription_status: "active",
          })
          .eq("email", customerEmail);

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
        // Get customer email from Stripe
        const customer = await getStripeClient().customers.retrieve(customerId) as Stripe.Customer;
        const email = customer.email;

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
        await getSupabaseClient()
          .from("subscriptions")
          .upsert({
            stripe_customer_id: customerId,
            stripe_subscription_id: subscription.id,
            email,
            status: subscription.status,
            plan,
            current_period_end: new Date((subscription as unknown as { current_period_end: number }).current_period_end * 1000).toISOString(),
            updated_at: new Date().toISOString(),
          }, { onConflict: "stripe_subscription_id" });

        await getSupabaseClient()
          .from("profiles")
          .update({ plan, subscription_status: subscription.status })
          .eq("email", email);

        console.log(`✅ Subscription created: ${email} → ${plan}`);
        break;
      }

      // ── Subscription updated (plan change, renewal, etc.) ─────────────────
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        const priceId = subscription.items.data[0]?.price.id;
        const plan = getPlanFromPriceId(priceId);

        const customer = await getStripeClient().customers.retrieve(customerId) as Stripe.Customer;
        const email = customer.email;

        if (!email) break;

        await getSupabaseClient()
          .from("subscriptions")
          .update({
            status: subscription.status,
            plan,
            current_period_end: new Date((subscription as unknown as { current_period_end: number }).current_period_end * 1000).toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_subscription_id", subscription.id);

        await getSupabaseClient()
          .from("profiles")
          .update({ plan, subscription_status: subscription.status })
          .eq("email", email);

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
        const customer = await getStripeClient().customers.retrieve(customerId) as Stripe.Customer;
        const email = customer.email;

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
        await getSupabaseClient()
          .from("subscriptions")
          .update({
            status: "canceled",
            plan: "free",
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_subscription_id", subscription.id);

        await getSupabaseClient()
          .from("profiles")
          .update({ plan: "free", subscription_status: "canceled" })
          .eq("email", email);

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
      // ── Invoice paid (recurring renewal) ─────────────────────────────────
      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = (invoice as unknown as { subscription?: string }).subscription as string | undefined;

        if (!subscriptionId) break;

        // Update period end on renewal
        const subscription = await getStripeClient().subscriptions.retrieve(subscriptionId);
        await getSupabaseClient()
          .from("subscriptions")
          .update({
            status: "active",
            current_period_end: new Date((subscription as unknown as { current_period_end: number }).current_period_end * 1000).toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_subscription_id", subscriptionId);

        console.log(`✅ Invoice paid for subscription: ${subscriptionId}`);
        break;
      }

      // ── Invoice payment failed ────────────────────────────────────────────
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        const customer = await getStripeClient().customers.retrieve(customerId) as Stripe.Customer;
        const email = customer.email;

        if (!email) break;

        await getSupabaseClient()
          .from("subscriptions")
          .update({
            status: "past_due",
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_customer_id", customerId);

        await getSupabaseClient()
          .from("profiles")
          .update({ subscription_status: "past_due" })
          .eq("email", email);

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
