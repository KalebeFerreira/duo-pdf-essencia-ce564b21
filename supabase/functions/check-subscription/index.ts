import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
};

const PLAN_LIMITS = {
  free: {
    plan: 'free',
    daily_pdfs_limit: 40,
    daily_automations_limit: 30,
    monthly_designs_limit: 30,
    monthly_resumes_limit: 10,
    ebook_page_limit: 10,
  },
  basic: {
    plan: 'basic',
    daily_pdfs_limit: 200,
    daily_automations_limit: 999999,
    monthly_designs_limit: 300,
    monthly_resumes_limit: 300,
    ebook_page_limit: 30,
  },
  professional: {
    plan: 'professional',
    daily_pdfs_limit: 999999,
    daily_automations_limit: 999999,
    monthly_designs_limit: 999999,
    monthly_resumes_limit: 999999,
    ebook_page_limit: 999999,
  },
};

const PRODUCT_TO_PLAN: Record<string, keyof typeof PLAN_LIMITS> = {
  'prod_TWwOXvAb8fMVVH': 'basic',      // Plano Básico
  'prod_TWwO8djF8GSQHl': 'professional', // Plano Profissional
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });

    if (customers.data.length === 0) {
      logStep("No customer found, keeping free plan");
      return new Response(JSON.stringify({ 
        subscribed: false,
        plan: 'free',
        product_id: null,
        subscription_end: null
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;
    logStep("Found Stripe customer", { customerId });

    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });

    const hasActiveSub = subscriptions.data.length > 0;
    let productId = null;
    let subscriptionEnd = null;
    let planName = 'free';

    if (hasActiveSub) {
      const subscription = subscriptions.data[0];
      subscriptionEnd = new Date(subscription.current_period_end * 1000).toISOString();
      productId = subscription.items.data[0].price.product as string;
      planName = PRODUCT_TO_PLAN[productId] || 'free';
      
      logStep("Active subscription found", { 
        subscriptionId: subscription.id, 
        endDate: subscriptionEnd,
        productId,
        planName
      });

      // Update profile with subscription info and limits
      const limits = PLAN_LIMITS[planName as keyof typeof PLAN_LIMITS];
      const { error: updateError } = await supabaseClient
        .from('profiles')
        .update({
          stripe_customer_id: customerId,
          stripe_product_id: productId,
          stripe_subscription_id: subscription.id,
          ...limits,
        })
        .eq('id', user.id);

      if (updateError) {
        logStep("Error updating profile", { error: updateError });
      } else {
        logStep("Profile updated with subscription limits");
      }
    } else {
      logStep("No active subscription, resetting to free plan");
      
      // Reset to free plan
      const { error: updateError } = await supabaseClient
        .from('profiles')
        .update({
          stripe_subscription_id: null,
          stripe_product_id: null,
          ...PLAN_LIMITS.free,
        })
        .eq('id', user.id);

      if (updateError) {
        logStep("Error resetting profile", { error: updateError });
      }
    }

    return new Response(JSON.stringify({
      subscribed: hasActiveSub,
      plan: planName,
      product_id: productId,
      subscription_end: subscriptionEnd
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in check-subscription", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
