import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[REFERRAL-COMMISSION] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    const { user_id, payment_amount, plan_name } = await req.json();
    
    if (!user_id || !payment_amount) {
      throw new Error("user_id and payment_amount are required");
    }
    
    logStep("Processing commission", { user_id, payment_amount, plan_name });

    // Verificar se o usuário foi indicado por alguém
    const { data: referral, error: referralError } = await supabaseAdmin
      .from('referrals')
      .select('*, referral_codes!inner(*)')
      .eq('referred_id', user_id)
      .single();

    if (referralError || !referral) {
      logStep("User was not referred by anyone", { user_id });
      return new Response(JSON.stringify({ message: "No referral found" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    logStep("Found referral", { referrer_id: referral.referrer_id });

    // Verificar se a comissão ainda está válida (12 meses)
    const commissionExpires = new Date(referral.commission_expires_at);
    if (commissionExpires < new Date()) {
      logStep("Commission expired", { expires_at: referral.commission_expires_at });
      return new Response(JSON.stringify({ message: "Commission period expired" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Calcular 10% de comissão
    const commissionAmount = payment_amount * 0.10;
    logStep("Calculated commission", { commission: commissionAmount });

    // Criar registro de comissão
    const { data: commission, error: commissionError } = await supabaseAdmin
      .from('commissions')
      .insert({
        referral_id: referral.id,
        referrer_id: referral.referrer_id,
        payment_amount: payment_amount,
        commission_amount: commissionAmount,
        status: 'pending',
      })
      .select()
      .single();

    if (commissionError) {
      throw new Error(`Failed to create commission: ${commissionError.message}`);
    }

    logStep("Commission created successfully", { commission_id: commission.id });

    return new Response(JSON.stringify({ 
      success: true,
      commission_id: commission.id,
      commission_amount: commissionAmount 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
