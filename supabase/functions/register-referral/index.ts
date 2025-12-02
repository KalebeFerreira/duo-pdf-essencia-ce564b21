import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[REGISTER-REFERRAL] ${step}${detailsStr}`);
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

    const { referral_code, referred_user_id } = await req.json();
    
    if (!referral_code || !referred_user_id) {
      throw new Error("referral_code and referred_user_id are required");
    }
    
    logStep("Processing referral registration", { referral_code, referred_user_id });

    // Buscar o código de indicação
    const { data: codeData, error: codeError } = await supabaseAdmin
      .from('referral_codes')
      .select('*')
      .eq('code', referral_code.toUpperCase())
      .single();

    if (codeError || !codeData) {
      logStep("Referral code not found", { referral_code });
      return new Response(JSON.stringify({ error: "Invalid referral code" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Não permitir auto-indicação
    if (codeData.user_id === referred_user_id) {
      logStep("Self-referral attempted", { user_id: referred_user_id });
      return new Response(JSON.stringify({ error: "Cannot refer yourself" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Verificar se o usuário já foi indicado
    const { data: existingReferral } = await supabaseAdmin
      .from('referrals')
      .select('id')
      .eq('referred_id', referred_user_id)
      .single();

    if (existingReferral) {
      logStep("User already referred", { referred_user_id });
      return new Response(JSON.stringify({ message: "User already has a referral" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Criar a indicação
    const { data: referral, error: referralError } = await supabaseAdmin
      .from('referrals')
      .insert({
        referrer_id: codeData.user_id,
        referred_id: referred_user_id,
        referral_code_id: codeData.id,
      })
      .select()
      .single();

    if (referralError) {
      throw new Error(`Failed to create referral: ${referralError.message}`);
    }

    logStep("Referral registered successfully", { referral_id: referral.id });

    return new Response(JSON.stringify({ 
      success: true,
      referral_id: referral.id 
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
