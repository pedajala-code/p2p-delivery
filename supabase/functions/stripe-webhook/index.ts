// Supabase Edge Function: Stripe Webhook Handler
// Deploy with: supabase functions deploy stripe-webhook --no-verify-jwt

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@13.0.0?target=deno";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  apiVersion: "2023-10-16",
});

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

const PLATFORM_FEE_PERCENT = 25;

serve(async (req) => {
  const signature = req.headers.get("stripe-signature");
  const body = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature!,
      Deno.env.get("STRIPE_WEBHOOK_SECRET")!
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return new Response(JSON.stringify({ error: "Invalid signature" }), {
      status: 400,
    });
  }

  try {
    switch (event.type) {
      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const deliveryId = paymentIntent.metadata?.delivery_id;

        if (deliveryId) {
          await supabase
            .from("deliveries")
            .update({
              stripe_payment_intent_id: paymentIntent.id,
            })
            .eq("id", deliveryId);
        }
        break;
      }

      case "account.updated": {
        // Courier's Stripe Connect account was updated
        const account = event.data.object as Stripe.Account;

        if (account.charges_enabled && account.payouts_enabled) {
          // Find user with this stripe account and mark as payment-ready
          await supabase
            .from("users")
            .update({ stripe_account_id: account.id })
            .eq("stripe_account_id", account.id);
        }
        break;
      }

      case "transfer.created": {
        // Platform transferred funds to courier
        const transfer = event.data.object as Stripe.Transfer;
        const deliveryId = transfer.metadata?.delivery_id;

        if (deliveryId) {
          await supabase
            .from("deliveries")
            .update({
              stripe_transfer_id: transfer.id,
            })
            .eq("id", deliveryId);
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), { status: 200 });
  } catch (err) {
    console.error("Error processing webhook:", err.message);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
    });
  }
});
