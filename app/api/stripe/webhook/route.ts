import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import {
  getSubscriptionByStripeCustomerId,
  getUserByGithubId,
  updateUserBilling,
  upsertSubscription,
} from "@/lib/queries";

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

// ─── Helpers ──────────────────────────────────────────────────────────────────

type PlanTier = "free" | "pro";
type DbSubscriptionStatus = "active" | "past_due" | "canceled" | "trialing";

function parseGithubId(value: string | null | undefined): number | null {
  if (!value) return null;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function getCustomerId(
  customer: string | Stripe.Customer | Stripe.DeletedCustomer | null,
): string | null {
  if (!customer) return null;
  return typeof customer === "string" ? customer : customer.id;
}

function normalizeSubscriptionStatus(status: string): DbSubscriptionStatus {
  if (status === "active" || status === "trialing" || status === "past_due") {
    return status;
  }
  return "canceled";
}

function getPlanFromPriceId(priceId: string | null | undefined): PlanTier {
  if (!priceId) return "free";
  const paidPriceIds = new Set(
    [
      process.env.STRIPE_PRO_PRICE_ID,
      process.env.STRIPE_SCALE_PRICE_ID,
      process.env.STRIPE_PRICE_PRO_MONTHLY,
      process.env.STRIPE_PRICE_PRO_YEARLY,
    ].filter(Boolean),
  );
  return paidPriceIds.has(priceId) ? "pro" : "free";
}

function getPlanFromSubscription(subscription: Stripe.Subscription): PlanTier {
  const metadataPlan = subscription.metadata?.plan;
  if (metadataPlan === "pro" || metadataPlan === "scale") {
    return "pro";
  }
  return getPlanFromPriceId(subscription.items.data[0]?.price.id);
}

function getCurrentPeriodEnd(subscription: Stripe.Subscription): string | null {
  const periodEnd = (subscription as unknown as { current_period_end?: number }).current_period_end;
  return typeof periodEnd === "number" ? new Date(periodEnd * 1000).toISOString() : null;
}

async function getGithubIdFromCustomer(customerId: string): Promise<number | null> {
  const existingSubscription = await getSubscriptionByStripeCustomerId(customerId).catch(() => null);
  if (existingSubscription?.github_id) {
    return existingSubscription.github_id;
  }

  const customer = await getStripeClient().customers.retrieve(customerId);
  if ("deleted" in customer && customer.deleted) {
    return null;
  }
  return parseGithubId(customer.metadata?.github_id);
}

async function resolveGithubId(
  customerId: string | null,
  ...metadataSources: Array<Stripe.Metadata | null | undefined>
): Promise<number | null> {
  for (const metadata of metadataSources) {
    const githubId = parseGithubId(metadata?.github_id);
    if (githubId) {
      return githubId;
    }
  }

  return customerId ? getGithubIdFromCustomer(customerId) : null;
}

async function syncSubscriptionToNeon(
  subscription: Stripe.Subscription,
  ...metadataSources: Array<Stripe.Metadata | null | undefined>
): Promise<void> {
  const customerId = getCustomerId(subscription.customer);
  const githubId = await resolveGithubId(customerId, subscription.metadata, ...metadataSources);

  if (!githubId) {
    throw new Error(`Unable to resolve GitHub user for Stripe subscription ${subscription.id}`);
  }

  const dbStatus = normalizeSubscriptionStatus(subscription.status);
  const isActive = dbStatus === "active" || dbStatus === "trialing";
  const plan = isActive ? getPlanFromSubscription(subscription) : "free";
  const priceId = subscription.items.data[0]?.price.id ?? null;

  await upsertSubscription({
    github_id: githubId,
    stripe_customer_id: customerId,
    stripe_subscription_id: subscription.id,
    plan,
    status: dbStatus,
    current_period_end: getCurrentPeriodEnd(subscription),
  });

  const user = await getUserByGithubId(githubId);
  if (!user) {
    console.warn(`[stripe webhook] No user_auth row found for GitHub user ${githubId}`);
    return;
  }

  await updateUserBilling(user.id, {
    stripe_customer_id: customerId,
    stripe_subscription_id: subscription.id,
    stripe_price_id: priceId,
    plan_tier: plan,
    subscription_status: subscription.status,
  });
}

async function getSubscriptionFromCheckoutSession(
  session: Stripe.Checkout.Session,
): Promise<Stripe.Subscription> {
  if (!session.subscription) {
    throw new Error(`Checkout session ${session.id} did not include a subscription`);
  }
  return typeof session.subscription === "string"
    ? getStripeClient().subscriptions.retrieve(session.subscription)
    : session.subscription;
}

// ─── Webhook Handler ──────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  // 1. Get the raw body — required for Stripe signature verification
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    console.error("⚠️  Missing stripe-signature header");
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    console.error("⚠️  STRIPE_WEBHOOK_SECRET is not set in environment variables");
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
  }

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

      // ── Checkout completed (first subscription purchase) ──────────────────
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const subscription = await getSubscriptionFromCheckoutSession(session);

        await syncSubscriptionToNeon(subscription, session.metadata);

        console.log(`✅ Checkout completed for subscription ${subscription.id}`);
        break;
      }

      // ── Subscription created ───────────────────────────────────────────────
      case "customer.subscription.created": {
        const subscription = event.data.object as Stripe.Subscription;
        await syncSubscriptionToNeon(subscription);

        console.log(`✅ Subscription created: ${subscription.id}`);
        break;
      }

      // ── Subscription updated (plan change, renewal, etc.) ─────────────────
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        await syncSubscriptionToNeon(subscription);

        console.log(`✅ Subscription updated: ${subscription.id} (${subscription.status})`);
        break;
      }

      // ── Subscription cancelled/deleted ────────────────────────────────────
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await syncSubscriptionToNeon(subscription);

        console.log(`✅ Subscription cancelled: ${subscription.id}`);
        break;
      }

      // ── Invoice paid (recurring renewal) ─────────────────────────────────
      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = (invoice as unknown as { subscription?: string }).subscription as string | undefined;

        if (!subscriptionId) break;

        // Update period end on renewal
        const subscription = await getStripeClient().subscriptions.retrieve(subscriptionId);
        await syncSubscriptionToNeon(subscription);

        console.log(`✅ Invoice paid for subscription: ${subscriptionId}`);
        break;
      }

      // ── Invoice payment failed ────────────────────────────────────────────
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = (invoice as unknown as { subscription?: string }).subscription as string | undefined;

        if (subscriptionId) {
          const subscription = await getStripeClient().subscriptions.retrieve(subscriptionId);
          await syncSubscriptionToNeon(subscription);
        }

        console.log(`⚠️  Payment failed for subscription: ${subscriptionId ?? "unknown"}`);
        break;
      }

      default:
        console.log(`ℹ️  Unhandled event type: ${event.type}`);
    }
  } catch (error) {
    console.error("❌ Error processing webhook event:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }

  // 4. Always return 200 so Stripe knows we received the event
  return NextResponse.json({ received: true }, { status: 200 });
}

// ─── Block all other HTTP methods ─────────────────────────────────────────────
// This prevents the 405 error Stripe was getting before
export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}