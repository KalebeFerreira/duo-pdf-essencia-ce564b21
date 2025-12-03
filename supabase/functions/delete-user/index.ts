import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[DELETE-USER] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    // Get the authorization header to verify the user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error("Missing authorization header");
    }

    // Create Supabase client with user's auth token to verify identity
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: authHeader },
        },
        auth: { persistSession: false }
      }
    );

    // Get the authenticated user from JWT - this ensures user can only delete their own account
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    
    if (userError || !user) {
      logStep("Authentication failed", { error: userError?.message });
      return new Response(JSON.stringify({ error: "Authentication required" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    const userId = user.id;
    logStep("Processing user deletion", { userId });

    // Use admin client for database operations and user deletion
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Delete user data from all tables first
    logStep("Deleting user data from tables");

    // Delete from profiles
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('id', userId);
    if (profileError) logStep("Profile deletion error", { error: profileError.message });

    // Delete from documents
    const { error: docsError } = await supabaseAdmin
      .from('documents')
      .delete()
      .eq('user_id', userId);
    if (docsError) logStep("Documents deletion error", { error: docsError.message });

    // Delete from ebooks
    const { error: ebooksError } = await supabaseAdmin
      .from('ebooks')
      .delete()
      .eq('user_id', userId);
    if (ebooksError) logStep("Ebooks deletion error", { error: ebooksError.message });

    // Delete from catalogs
    const { error: catalogsError } = await supabaseAdmin
      .from('catalogs')
      .delete()
      .eq('user_id', userId);
    if (catalogsError) logStep("Catalogs deletion error", { error: catalogsError.message });

    // Delete referral codes
    const { error: referralCodesError } = await supabaseAdmin
      .from('referral_codes')
      .delete()
      .eq('user_id', userId);
    if (referralCodesError) logStep("Referral codes deletion error", { error: referralCodesError.message });

    logStep("User data deleted, now deleting auth record");

    // Delete the user from auth.users using admin API
    const { error: deleteUserError } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (deleteUserError) {
      logStep("Failed to delete auth user", { error: deleteUserError.message });
      throw new Error(`Failed to delete user account: ${deleteUserError.message}`);
    }

    logStep("User account deleted successfully", { userId });

    return new Response(JSON.stringify({ 
      success: true,
      message: "Account deleted successfully"
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
