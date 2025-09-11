import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    // Auth client to get the current user from the JWT
    const authClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: {
        headers: { Authorization: req.headers.get("Authorization") || "" },
      },
    });

    const { data: { user }, error: userError } = await authClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    const body = await req.json().catch(() => ({}));
    const xpAmountRaw = body?.xpAmount;
    const xpAmount = Number(xpAmountRaw);
    if (!Number.isInteger(xpAmount) || xpAmount <= 0) {
      return new Response(JSON.stringify({ error: "xpAmount must be a positive integer" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Service role client to bypass RLS for controlled mutation
    const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Award XP using the secure RPC that adds to existing balance
    const { error: rpcError } = await serviceClient.rpc('handle_xp_purchase', {
      user_id_param: user.id,
      xp_amount_param: xpAmount
    });

    if (rpcError) {
      console.error('RPC error in award-xp:', rpcError);
      return new Response(JSON.stringify({ error: 'Failed to add XP' }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

    // Record an entry in purchase history to keep a trail (marked as manual)
    const { error: insertError } = await serviceClient
      .from('xp_purchases')
      .insert({
        user_id: user.id,
        stripe_session_id: 'manual_award',
        stripe_price_id: 'manual_award',
        amount_paid_cents: 0,
        currency: 'usd',
        xp_amount: xpAmount,
        purchase_date: new Date().toISOString(),
      });

    if (insertError) {
      console.warn('Failed to insert manual award history:', insertError);
      // not fatal
    }

    return new Response(JSON.stringify({ success: true, xp_added: xpAmount }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error('Unexpected error in award-xp:', error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
