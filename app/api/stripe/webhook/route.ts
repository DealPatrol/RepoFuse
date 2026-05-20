import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

// ─── Clients ──────────────────────────────────────────────────────────────────

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-11-20.acacia",
});

// Use the service role key so we can write to Supabase from the server
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
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
        const customerId = session.customer as string;
        const subscriptionId = session.subscription as string;
        const customerEmail = session.customer_email || session.customer_details?.email;

        if (!customerEmail) break;

        await supabase
          .from("subscriptions")
          .upsert({
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
            email: customerEmail,
            status: "active",
            updated_at: new Date().toISOString(),
          }, { onConflict: "email" });

        // Also update the user's plan in the profiles table
        await supabase
          .from("profiles")
          .update({
            stripe_customer_id: customerId,
            subscription_status: "active",
          })
          .eq("email", customerEmail);

        console.log(`✅ Checkout completed for ${customerEmail}`);
        break;
      }

      // ── Subscription created ───────────────────────────────────────────────
      case "customer.subscription.created": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        const priceId = subscription.items.data[0]?.price.id;
        const plan = getPlanFromPriceId(priceId);

        // Get customer email from Stripe
        const customer = await stripe.customers.retrieve(customerId) as Stripe.Customer;
        const email = customer.email;

        if (!email) break;

        await supabase
          .from("subscriptions")
          .upsert({
            stripe_customer_id: customerId,
            stripe_subscription_id: subscription.id,
            email,
            status: subscription.status,
            plan,
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            updated_at: new Date().toISOString(),
          }, { onConflict: "stripe_subscription_id" });

        await supabase
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

        const customer = await stripe.customers.retrieve(customerId) as Stripe.Customer;
        const email = customer.email;

        if (!email) break;

        await supabase
          .from("subscriptions")
          .update({
            status: subscription.status,
            plan,
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_subscription_id", subscription.id);

        await supabase
          .from("profiles")
          .update({ plan, subscription_status: subscription.status })
          .eq("email", email);

        console.log(`✅ Subscription updated: ${email} → ${plan} (${subscription.status})`);
        break;
      }

      // ── Subscription cancelled/deleted ────────────────────────────────────
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        const customer = await stripe.customers.retrieve(customerId) as Stripe.Customer;
        const email = customer.email;

        if (!email) break;

        await supabase
          .from("subscriptions")
          .update({
            status: "canceled",
            plan: "free",
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_subscription_id", subscription.id);

        await supabase
          .from("profiles")
          .update({ plan: "free", subscription_status: "canceled" })
          .eq("email", email);

        console.log(`✅ Subscription cancelled: ${email}`);
        break;
      }

      // ── Invoice paid (recurring renewal) ─────────────────────────────────
      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = invoice.subscription as string;

        if (!subscriptionId) break;

        // Update period end on renewal
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        await supabase
          .from("subscriptions")
          .update({
            status: "active",
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
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

        const customer = await stripe.customers.retrieve(customerId) as Stripe.Customer;
        const email = customer.email;

        if (!email) break;

        await supabase
          .from("subscriptions")
          .update({
            status: "past_due",
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_customer_id", customerId);

        await supabase
          .from("profiles")
          .update({ subscription_status: "past_due" })
          .eq("email", email);

        console.log(`⚠️  Payment failed for: ${email}`);
        break;
      }

      default:
        console.log(`ℹ️  Unhandled event type: ${event.type}`);
    }
  } catch (error) {
    console.error("❌ Error processing webhook event:", error);
    // Still return 200 so Stripe doesn't keep retrying for logic errors
    return NextResponse.json({ received: true, warning: "Processing error" }, { status: 200 });
  }

  // 4. Always return 200 so Stripe knows we received the event
  return NextResponse.json({ received: true }, { status: 200 });
}

// ─── Block all other HTTP methods ─────────────────────────────────────────────
// This prevents the 405 error Stripe was getting before
export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}